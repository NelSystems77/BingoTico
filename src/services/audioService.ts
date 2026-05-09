/**
 * audioService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Servicio de audio con carga bajo demanda (lazy loading) para los archivos
 * MP3 de los números del bingo.
 *
 * Estructura de carpetas esperada en /public:
 *   /audio/numbers-male/          → voz masculina tradicional  (1_call1.mp3, 1_call2.mp3 … 75_call2.mp3)
 *   /audio/numbers-female/        → voz femenina tradicional   (1_call1.mp3, 1_call2.mp3 … 75_call2.mp3)
 *   /audio/numbers-bingo-juan/    → voz Juan                   (1.mp3 … 75.mp3)
 *   /audio/numbers-bingo-harry/   → voz Harry                  (1.mp3 … 75.mp3)
 *   /audio/numbers-bingo-andrea/  → voz Andrea                 (1.mp3 … 75.mp3)
 *   /audio/numbers-bingo-alicia/  → voz Alicia                 (1.mp3 … 75.mp3)
 *
 * ESTRATEGIA DE REPRODUCCIÓN:
 *   • Se intenta Web Audio API (AudioContext + fetch + decodeAudioData) como
 *     mecanismo principal de reproducción.
 *   • Si decodeAudioData falla (p.ej. Safari/Edge con ciertos MP3 de ElevenLabs),
 *     se usa HTMLAudioElement como fallback automático.
 *   • Las voces tradicionales (masculina/femenina) tienen dos frases
 *     (call1 / call2) que se alternan aleatoriamente.
 *   • Las voces personalizadas (juan/harry/andrea/alicia) tienen un único
 *     archivo por número.
 *   • El AudioContext se desbloquea llamando desbloquearAudioContext() desde
 *     un handler de evento de usuario (tap/click).
 *   • Los AudioBuffer se cachean en memoria para evitar re-descargas.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type GeneroAudio = 'masculina' | 'femenina' | 'juan' | 'harry' | 'andrea' | 'alicia';

/** Rutas base de todos los conjuntos de audio */
const BASE_PATHS: Record<GeneroAudio, string> = {
  masculina: '/audio/numbers-male',
  femenina:  '/audio/numbers-female',
  juan:      '/audio/numbers-bingo-juan',
  harry:     '/audio/numbers-bingo-harry',
  andrea:    '/audio/numbers-bingo-andrea',
  alicia:    '/audio/numbers-bingo-alicia',
};

/**
 * Indica si una voz usa el formato de archivo único por número (N.mp3)
 * en lugar del formato con variantes (N_call1.mp3 / N_call2.mp3).
 */
function esVozSimple(genero: GeneroAudio): boolean {
  return genero === 'juan' || genero === 'harry' || genero === 'andrea' || genero === 'alicia';
}

/** Números disponibles (1–75) */
const TOTAL_NUMEROS = 75;

// ─── Web Audio API ────────────────────────────────────────────────────────────

/** AudioContext compartido para toda la app */
let audioCtx: AudioContext | null = null;

/** Nodo de reproducción Web Audio activo */
let sourceActivo: AudioBufferSourceNode | null = null;

/**
 * HTMLAudioElement activo (fallback cuando decodeAudioData falla).
 * Se usa en Safari/Edge con ciertos MP3 de ElevenLabs que no pueden
 * ser decodificados por la Web Audio API.
 */
let htmlAudioActivo: HTMLAudioElement | null = null;

/**
 * Pool de HTMLAudioElements pre-creados y desbloqueados desde un gesto
 * del usuario. En iOS Safari, play() solo funciona si el elemento fue
 * "tocado" previamente desde un gesto directo.
 */
const htmlAudioPool: HTMLAudioElement[] = [];

/**
 * Conjunto de URLs que fallaron con decodeAudioData.
 * Para estas URLs se usa directamente HTMLAudioElement sin reintentar
 * la decodificación Web Audio.
 */
const urlsConFallbackHTML = new Set<string>();

/**
 * Obtiene (o crea) el AudioContext compartido.
 * En iOS Safari el AudioContext debe crearse desde un handler de gesto
 * del usuario para que quede desbloqueado.
 */
function obtenerAudioContext(): AudioContext | null {
  if (typeof AudioContext === 'undefined' && typeof (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext === 'undefined') {
    return null;
  }
  if (!audioCtx) {
    const AC = (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ?? AudioContext;
    audioCtx = new AC();
  }
  return audioCtx;
}

// ─── Cache de URLs y AudioBuffers ────────────────────────────────────────────

/**
 * Cache de URLs para voces tradicionales (call1/call2).
 */
const cacheURLsTradicional = new Map<GeneroAudio, Map<number, { call1: string; call2: string }>>();

/**
 * Cache de URLs para voces simples (un solo archivo por número).
 */
const cacheURLsSimple = new Map<GeneroAudio, Map<number, string>>();

/**
 * Cache de AudioBuffers decodificados.
 * Clave: URL del archivo MP3.
 */
const cacheBuffers = new Map<string, AudioBuffer>();

/** Indica si la precarga de un género ya fue iniciada (evita doble ejecución) */
const precargaIniciada = new Set<GeneroAudio>();

/** Indica si la precarga de un género ya completó */
const precargaCompleta = new Set<GeneroAudio>();

/**
 * Callbacks de progreso pendientes para cuando la precarga está en curso.
 */
const callbacksPendientes = new Map<GeneroAudio, Array<(cargados: number, total: number) => void>>();

// ─── Helpers internos ────────────────────────────────────────────────────────

/** Construye la URL de un archivo de audio para voces tradicionales */
function urlAudioTradicional(genero: GeneroAudio, numero: number, slot: 'call1' | 'call2'): string {
  return `${BASE_PATHS[genero]}/${numero}_${slot}.mp3`;
}

/** Construye la URL de un archivo de audio para voces simples */
function urlAudioSimple(genero: GeneroAudio, numero: number): string {
  return `${BASE_PATHS[genero]}/${numero}.mp3`;
}

/**
 * Descarga y decodifica un MP3 como AudioBuffer.
 * Cachea el resultado para evitar re-descargas.
 * Retorna null si falla (en ese caso se usará HTMLAudioElement como fallback).
 */
async function obtenerBuffer(url: string): Promise<AudioBuffer | null> {
  // Si esta URL ya falló antes con Web Audio, no reintentar
  if (urlsConFallbackHTML.has(url)) return null;

  // Retornar del cache si ya está decodificado
  if (cacheBuffers.has(url)) {
    return cacheBuffers.get(url)!;
  }

  const ctx = obtenerAudioContext();
  if (!ctx) return null;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[AudioService] HTTP ${response.status} para ${url}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    // Callback API — compatible con TODAS las versiones de iOS Safari
    const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
      ctx.decodeAudioData(arrayBuffer, resolve, reject);
    });
    cacheBuffers.set(url, audioBuffer);
    return audioBuffer;
  } catch (err) {
    // Marcar esta URL para usar HTMLAudioElement en el futuro
    urlsConFallbackHTML.add(url);
    console.warn(`[AudioService] decodeAudioData falló para ${url} — se usará HTMLAudioElement como fallback:`, err);
    return null;
  }
}

/**
 * Reproduce un MP3 usando HTMLAudioElement (fallback para Safari/Edge).
 * Usa el pool de elementos pre-desbloqueados si está disponible (iOS Safari).
 * Retorna true si la reproducción se inició correctamente.
 */
async function reproducirConHTMLAudio(url: string): Promise<boolean> {
  try {
    // Detener el HTMLAudio anterior si existe
    if (htmlAudioActivo) {
      htmlAudioActivo.pause();
      htmlAudioActivo.src = '';
      htmlAudioActivo = null;
    }

    // Usar un elemento del pool (pre-desbloqueado en iOS) o crear uno nuevo
    const audio = htmlAudioPool.length > 0
      ? htmlAudioPool[0]   // reutilizar el mismo elemento del pool
      : new Audio();

    audio.src = url;
    audio.preload = 'auto';
    htmlAudioActivo = audio;

    await audio.play();

    audio.onended = () => {
      if (htmlAudioActivo === audio) {
        htmlAudioActivo = null;
      }
    };

    return true;
  } catch (err) {
    console.warn(`[AudioService] HTMLAudioElement también falló para ${url}:`, err);
    return false;
  }
}

// ─── API pública ─────────────────────────────────────────────────────────────

/**
 * Registra en el cache las URLs de todos los archivos MP3 del género indicado.
 * NO realiza ninguna petición de red — las URLs son estáticas y conocidas.
 * El progreso se reporta de forma síncrona para que la barra de carga avance
 * correctamente en todos los navegadores.
 *
 * @param genero      Tipo de voz
 * @param onProgreso  Callback opcional (cargados, total) para UI de progreso
 */
export async function precargarGenero(
  genero: GeneroAudio,
  onProgreso?: (cargados: number, total: number) => void
): Promise<void> {
  const simple = esVozSimple(genero);
  // Voces simples: 1 archivo por número; tradicionales: 2 (call1 + call2)
  const total = simple ? TOTAL_NUMEROS : TOTAL_NUMEROS * 2;

  // ── Caso 1: precarga ya completó ────────────────────────────────────────
  if (precargaCompleta.has(genero)) {
    onProgreso?.(total, total);
    return;
  }

  // ── Caso 2: precarga en curso ────────────────────────────────────────────
  if (precargaIniciada.has(genero)) {
    if (onProgreso) {
      if (!callbacksPendientes.has(genero)) {
        callbacksPendientes.set(genero, []);
      }
      callbacksPendientes.get(genero)!.push(onProgreso);
    }
    return;
  }

  // ── Caso 3: primera vez — iniciar precarga ───────────────────────────────
  precargaIniciada.add(genero);

  let cargados = 0;

  console.log(`[AudioService] Registrando URLs de voz "${genero}" (${TOTAL_NUMEROS} números${simple ? '' : ' × 2 frases'})`);

  // Helper para notificar a TODOS los callbacks registrados
  const notificar = (c: number, t: number) => {
    onProgreso?.(c, t);
    callbacksPendientes.get(genero)?.forEach(cb => cb(c, t));
  };

  if (simple) {
    // ── Voces simples: un archivo por número ────────────────────────────
    if (!cacheURLsSimple.has(genero)) {
      cacheURLsSimple.set(genero, new Map());
    }
    const mapa = cacheURLsSimple.get(genero)!;

    for (let n = 1; n <= TOTAL_NUMEROS; n++) {
      mapa.set(n, urlAudioSimple(genero, n));
      cargados += 1;
      notificar(cargados, total);

      // Ceder el hilo cada 10 números para no bloquear el render de React
      if (n % 10 === 0) {
        await new Promise<void>(resolve => setTimeout(resolve, 0));
      }
    }
  } else {
    // ── Voces tradicionales: call1 + call2 por número ───────────────────
    if (!cacheURLsTradicional.has(genero)) {
      cacheURLsTradicional.set(genero, new Map());
    }
    const mapa = cacheURLsTradicional.get(genero)!;

    for (let n = 1; n <= TOTAL_NUMEROS; n++) {
      mapa.set(n, {
        call1: urlAudioTradicional(genero, n, 'call1'),
        call2: urlAudioTradicional(genero, n, 'call2'),
      });
      cargados += 2;
      notificar(cargados, total);

      // Ceder el hilo cada 10 números para no bloquear el render de React
      if (n % 10 === 0) {
        await new Promise<void>(resolve => setTimeout(resolve, 0));
      }
    }
  }

  precargaCompleta.add(genero);
  callbacksPendientes.delete(genero);
  console.log(`[AudioService] ✅ URLs registradas: voz "${genero}"`);
}

/**
 * Reproduce el audio del número indicado para el género dado.
 *
 * Intenta primero con Web Audio API (AudioContext + decodeAudioData).
 * Si falla (p.ej. Safari/Edge con MP3 de ElevenLabs), usa HTMLAudioElement
 * como fallback automático.
 *
 * @returns Promise<boolean> — true = reproducción iniciada, false = falló
 */
export async function reproducirNumero(
  numero: number,
  genero: GeneroAudio
): Promise<boolean> {
  const ctx = obtenerAudioContext();
  if (!ctx) return false;

  // Detener audio anterior si existe
  if (sourceActivo) {
    try {
      sourceActivo.stop();
      sourceActivo.disconnect();
    } catch {
      // ignorar errores al detener
    }
    sourceActivo = null;
  }

  // Reanudar el AudioContext si está suspendido (iOS/Android lo suspenden en background)
  if (ctx.state !== 'running') {
    try {
      await ctx.resume();
    } catch {
      console.warn('[AudioService] No se pudo reanudar el AudioContext — intentando reproducir igual');
    }
  }

  let url: string;

  if (esVozSimple(genero)) {
    // ── Voces simples: un único archivo por número ───────────────────────
    const mapa = cacheURLsSimple.get(genero);
    if (mapa?.has(numero)) {
      url = mapa.get(numero)!;
    } else {
      url = urlAudioSimple(genero, numero);
      console.log(`[AudioService] Cache miss para ${genero}/${numero} — usando URL al vuelo`);
    }
  } else {
    // ── Voces tradicionales: elegir aleatoriamente call1 o call2 (50/50) ─
    const slot: 'call1' | 'call2' = Math.random() < 0.5 ? 'call1' : 'call2';
    const mapa = cacheURLsTradicional.get(genero);
    if (mapa?.has(numero)) {
      url = mapa.get(numero)![slot];
    } else {
      url = urlAudioTradicional(genero, numero, slot);
      console.log(`[AudioService] Cache miss para ${genero}/${numero} — usando URL al vuelo`);
    }
  }

  // Obtener el AudioBuffer (del cache o descargando)
  const buffer = await obtenerBuffer(url);
  if (!buffer) {
    // Web Audio falló o no disponible — intentar con HTMLAudioElement
    console.log(`[AudioService] Usando HTMLAudioElement para ${genero}/${numero} (${url})`);
    return reproducirConHTMLAudio(url);
  }

  // Crear y conectar el nodo de reproducción
  try {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    sourceActivo = source;

    // Limpiar la referencia cuando termine
    source.onended = () => {
      if (sourceActivo === source) {
        sourceActivo = null;
      }
    };

    return true;
  } catch (err) {
    console.warn(`[AudioService] Error reproduciendo ${genero}/${numero}:`, err);
    // Último recurso: HTMLAudioElement
    return reproducirConHTMLAudio(url);
  }
}

/**
 * Desbloquea el AudioContext en iOS Safari y Android.
 *
 * En iOS Safari y Android, el AudioContext queda en estado 'suspended'
 * hasta que se llama resume() desde un handler de evento de usuario.
 * Esta función DEBE llamarse directamente desde un tap/click del usuario.
 *
 * También crea el AudioContext si aún no existe, lo que es necesario
 * en iOS Safari donde el contexto debe crearse desde un gesto del usuario.
 */
export function desbloquearAudioContext(): void {
  const ctx = obtenerAudioContext();
  if (!ctx) return;

  // iOS Safari exige que src.start() se llame SINCRÓNICAMENTE dentro del
  // handler del gesto. Llamarlo en .then() (microtask) ya no cuenta como
  // gesto para Safari — por eso el unlock fallaba aunque resume() tuviera éxito.
  try {
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0); // síncrono — iOS acepta esto como gesto real
  } catch {
    // puede fallar si el contexto está suspended; no es crítico
  }

  // Adicionalmente hacer resume() para llevar el contexto a 'running'
  if (ctx.state !== 'running') {
    ctx.resume()
      .then(() => console.log('[AudioService] ✅ AudioContext corriendo'))
      .catch(err => console.warn('[AudioService] resume() falló:', err));
  } else {
    console.log('[AudioService] ✅ AudioContext desbloqueado');
  }

  // Pre-desbloquear HTMLAudioElements para el fallback en iOS Safari.
  // En iOS, play() solo funciona si se llama sincrónicamente desde un gesto.
  // Creamos y "tocamos" elementos silenciosos para que queden desbloqueados.
  if (htmlAudioPool.length === 0) {
    for (let i = 0; i < 3; i++) {
      try {
        const a = new Audio();
        a.volume = 0;
        // Intentar play() silencioso para desbloquear el elemento en iOS
        a.play().catch(() => { /* silencioso */ });
        a.pause();
        a.volume = 1;
        htmlAudioPool.push(a);
      } catch {
        // ignorar
      }
    }
    console.log(`[AudioService] HTMLAudio pool inicializado (${htmlAudioPool.length} elementos)`);
  }
}

/**
 * Alias para compatibilidad con código existente en Juego.tsx.
 * Ahora delega a desbloquearAudioContext().
 */
export function desbloquearAudioElement(): void {
  desbloquearAudioContext();
}

/**
 * Detiene toda reproducción activa (Web Audio y HTMLAudioElement).
 */
export function detenerTodoAudio(): void {
  if (sourceActivo) {
    try {
      sourceActivo.stop();
      sourceActivo.disconnect();
    } catch {
      // ignorar
    }
    sourceActivo = null;
  }
  if (htmlAudioActivo) {
    try {
      htmlAudioActivo.pause();
      htmlAudioActivo.src = '';
    } catch {
      // ignorar
    }
    htmlAudioActivo = null;
  }
}

/**
 * Alias para compatibilidad con código existente.
 */
export function detenerAudio(_genero: GeneroAudio): void {
  detenerTodoAudio();
}

/**
 * Libera el cache de un género (útil si el usuario cambia de género
 * durante la sesión para liberar memoria).
 */
export function limpiarCacheGenero(genero: GeneroAudio): void {
  detenerTodoAudio();

  if (esVozSimple(genero)) {
    // Limpiar AudioBuffers cacheados de voces simples
    const mapa = cacheURLsSimple.get(genero);
    if (mapa) {
      for (const url of mapa.values()) {
        cacheBuffers.delete(url);
      }
    }
    cacheURLsSimple.delete(genero);
  } else {
    // Limpiar AudioBuffers cacheados de voces tradicionales
    const mapa = cacheURLsTradicional.get(genero);
    if (mapa) {
      for (const entrada of mapa.values()) {
        cacheBuffers.delete(entrada.call1);
        cacheBuffers.delete(entrada.call2);
      }
    }
    cacheURLsTradicional.delete(genero);
  }

  precargaIniciada.delete(genero);
  precargaCompleta.delete(genero);
  callbacksPendientes.delete(genero);
  console.log(`[AudioService] Cache liberado para voz "${genero}"`);
}

/**
 * Indica si la precarga de un género ya completó.
 */
export function esPrecargaCompleta(genero: GeneroAudio): boolean {
  return precargaCompleta.has(genero);
}

/**
 * Indica si la precarga de un género ya fue iniciada.
 */
export function esPrecargaIniciada(genero: GeneroAudio): boolean {
  return precargaIniciada.has(genero);
}

/**
 * audioService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Servicio de audio con carga bajo demanda (lazy loading) para los archivos
 * MP3 de los números del bingo.
 *
 * Estructura de carpetas esperada en /public:
 *   /audio/numbers-male/     → voz masculina  (1.mp3, 1_var.mp3 … 90.mp3, 90_var.mp3)
 *   /audio/numbers-female/   → voz femenina   (1.mp3, 1_var.mp3 … 90.mp3, 90_var.mp3)
 *
 * ESTRATEGIA DE REPRODUCCIÓN:
 *   • Se usa Web Audio API (AudioContext + fetch + decodeAudioData) como
 *     mecanismo principal de reproducción.
 *   • A diferencia de HTMLAudioElement.play(), el AudioContext mantiene el
 *     permiso de reproducción activo después del primer gesto del usuario,
 *     lo que permite reproducir audio desde setInterval o código asíncrono
 *     en iOS Safari sin que el navegador rechace la reproducción.
 *   • El AudioContext se desbloquea llamando desbloquearAudioContext() desde
 *     un handler de evento de usuario (tap/click).
 *   • Los AudioBuffer se cachean en memoria para evitar re-descargas.
 *   • Cada número tiene dos variantes: base (N.mp3) y variación (N_var.mp3).
 *     Se elige aleatoriamente cuál reproducir.
 *
 * CAMBIOS v4 (fix iOS Safari autoplay desde setInterval):
 *   • Reemplaza HTMLAudioElement por Web Audio API (AudioContext).
 *   • HTMLAudioElement.play() en iOS Safari solo funciona si se llama
 *     directamente desde un handler de gesto del usuario. Desde setInterval
 *     o .then() de una Promise, Safari rechaza play() con NotAllowedError.
 *   • AudioContext NO tiene esta restricción: una vez desbloqueado con el
 *     primer gesto, puede reproducir audio desde cualquier contexto asíncrono.
 *   • Se mantiene desbloquearAudioElement() como alias vacío para no romper
 *     imports existentes en Juego.tsx.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type GeneroAudio = 'masculina' | 'femenina';

/** Rutas base de los dos conjuntos de audio */
const BASE_PATHS: Record<GeneroAudio, string> = {
  masculina: '/audio/numbers-male',
  femenina:  '/audio/numbers-female',
};

/** Números disponibles (1–90) */
const TOTAL_NUMEROS = 90;

// ─── Web Audio API ────────────────────────────────────────────────────────────

/** AudioContext compartido para toda la app */
let audioCtx: AudioContext | null = null;

/** Nodo de ganancia activo (para poder detener el audio en curso) */
let sourceActivo: AudioBufferSourceNode | null = null;

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
 * Cache de URLs (registradas sin verificación de red).
 */
const cacheURLs = new Map<GeneroAudio, Map<number, { base: string; variacion: string }>>();

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

/** Construye la URL de un archivo de audio */
function urlAudio(genero: GeneroAudio, numero: number, variacion: boolean): string {
  const base = BASE_PATHS[genero];
  const sufijo = variacion ? '_var' : '';
  return `${base}/${numero}${sufijo}.mp3`;
}

/**
 * Descarga y decodifica un MP3 como AudioBuffer.
 * Cachea el resultado para evitar re-descargas.
 */
async function obtenerBuffer(url: string): Promise<AudioBuffer | null> {
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
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    cacheBuffers.set(url, audioBuffer);
    return audioBuffer;
  } catch (err) {
    console.warn(`[AudioService] Error cargando/decodificando ${url}:`, err);
    return null;
  }
}

// ─── API pública ─────────────────────────────────────────────────────────────

/**
 * Registra en el cache las URLs de todos los archivos MP3 del género indicado.
 * NO realiza ninguna petición de red — las URLs son estáticas y conocidas.
 * El progreso se reporta de forma síncrona para que la barra de carga avance
 * correctamente en todos los navegadores.
 *
 * @param genero      'masculina' | 'femenina'
 * @param onProgreso  Callback opcional (cargados, total) para UI de progreso
 */
export async function precargarGenero(
  genero: GeneroAudio,
  onProgreso?: (cargados: number, total: number) => void
): Promise<void> {
  const total = TOTAL_NUMEROS * 2; // base + variación por número

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

  if (!cacheURLs.has(genero)) {
    cacheURLs.set(genero, new Map());
  }
  const mapaGenero = cacheURLs.get(genero)!;

  let cargados = 0;

  console.log(`[AudioService] Registrando URLs de voz ${genero} (${TOTAL_NUMEROS} números × 2 variantes)`);

  // Helper para notificar a TODOS los callbacks registrados
  const notificar = (c: number, t: number) => {
    onProgreso?.(c, t);
    callbacksPendientes.get(genero)?.forEach(cb => cb(c, t));
  };

  // Registrar URLs de forma síncrona — sin fetch, sin red.
  for (let n = 1; n <= TOTAL_NUMEROS; n++) {
    const urlBase = urlAudio(genero, n, false);
    const urlVar  = urlAudio(genero, n, true);

    mapaGenero.set(n, { base: urlBase, variacion: urlVar });
    cargados += 2;
    notificar(cargados, total);

    // Ceder el hilo cada 10 números para no bloquear el render de React
    if (n % 10 === 0) {
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    }
  }

  precargaCompleta.add(genero);
  callbacksPendientes.delete(genero);
  console.log(`[AudioService] ✅ URLs registradas: voz ${genero}`);
}

/**
 * Reproduce el audio del número indicado para el género dado usando Web Audio API.
 *
 * ESTRATEGIA iOS Safari:
 * • Se usa AudioContext en lugar de HTMLAudioElement.
 * • Una vez que el AudioContext se desbloquea con el primer gesto del usuario
 *   (via desbloquearAudioContext()), puede reproducir audio desde cualquier
 *   contexto asíncrono, incluyendo setInterval y .then() de Promises.
 * • HTMLAudioElement.play() en iOS Safari solo funciona desde handlers de
 *   gesto directo, lo que lo hace incompatible con el modo automático del bingo.
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

  // Reanudar el AudioContext si está suspendido (iOS lo suspende en background)
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      console.warn('[AudioService] No se pudo reanudar el AudioContext');
      return false;
    }
  }

  // Elegir aleatoriamente base o variación (50/50)
  const usarVariacion = Math.random() < 0.5;

  // Obtener URL del cache o construirla al vuelo
  const mapaGenero = cacheURLs.get(genero);
  let url: string;

  if (mapaGenero?.has(numero)) {
    const entrada = mapaGenero.get(numero)!;
    url = usarVariacion ? entrada.variacion : entrada.base;
  } else {
    url = urlAudio(genero, numero, usarVariacion);
    console.log(`[AudioService] Cache miss para ${genero}/${numero} — usando URL al vuelo`);
  }

  // Obtener el AudioBuffer (del cache o descargando)
  const buffer = await obtenerBuffer(url);
  if (!buffer) {
    console.warn(`[AudioService] No se pudo obtener buffer para ${genero}/${numero} (${url})`);
    return false;
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
    return false;
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

  if (ctx.state === 'suspended') {
    ctx.resume().then(() => {
      console.log('[AudioService] ✅ AudioContext desbloqueado');
    }).catch((err) => {
      console.warn('[AudioService] No se pudo desbloquear AudioContext:', err);
    });
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
 * Detiene toda reproducción activa.
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

  // Limpiar también los AudioBuffers cacheados de este género
  const mapaGenero = cacheURLs.get(genero);
  if (mapaGenero) {
    for (const entrada of mapaGenero.values()) {
      cacheBuffers.delete(entrada.base);
      cacheBuffers.delete(entrada.variacion);
    }
  }

  cacheURLs.delete(genero);
  precargaIniciada.delete(genero);
  precargaCompleta.delete(genero);
  callbacksPendientes.delete(genero);
  console.log(`[AudioService] Cache liberado para voz ${genero}`);
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

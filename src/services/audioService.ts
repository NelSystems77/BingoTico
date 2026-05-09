/**
 * audioService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Servicio de audio con carga bajo demanda (lazy loading) para los archivos
 * MP3 de los números del bingo.
 *
 * Estructura de carpetas en /public/audio:
 *   numbers-male/          → voz masculina tradicional  (1_call1.mp3 … 75_call2.mp3)
 *   numbers-female/        → voz femenina tradicional   (1_call1.mp3 … 48_call2.mp3)
 *   numbers-bingo-juan/    → voz Juan                   (1.mp3 … 75.mp3)
 *   numbers-bingo-harry/   → voz Harry                  (1.mp3 … 75.mp3)
 *   numbers-bingo-andrea/  → voz Andrea                 (1.mp3 … 75.mp3)
 *   numbers-bingo-alicia/  → voz Alicia                 (1.mp3 … 75.mp3)
 *
 * ESTRATEGIA DE REPRODUCCIÓN (en orden de prioridad):
 *   1. Web Audio API (AudioContext + decodeAudioData) con buffer ID3-stripped.
 *      Funciona en todos los navegadores de escritorio y en iOS/Android cuando
 *      el AudioContext fue desbloqueado desde un gesto del usuario.
 *   2. HTMLAudioElement con Blob URL creado desde el buffer ID3-stripped.
 *      Los Blob URLs no requieren gesto del usuario para reproducirse porque
 *      los datos ya están en memoria local (no hay petición de red).
 *      IMPORTANTE: el Blob se crea desde el buffer SIN encabezado ID3v2.4,
 *      ya que Edge/iOS/Android no pueden reproducir MP3 con ID3v2.4 via
 *      HTMLAudioElement tampoco.
 *   3. TTS (Web Speech API) como último recurso — garantiza audio en todos
 *      los dispositivos aunque no haya archivo MP3 disponible.
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
 * Rango real de números disponibles para cada voz.
 * Si un número está fuera del rango, reproducirNumero() devuelve false
 * y el caller (hablarNumeroConAudio) usa TTS como fallback.
 *
 * numbers-female solo tiene archivos 1–48; el resto cae a TTS.
 * Todas las demás voces tienen 1–75.
 */
const RANGO_NUMEROS: Record<GeneroAudio, { min: number; max: number }> = {
  masculina: { min: 1, max: 75 },
  femenina:  { min: 1, max: 48 },   // solo 1–48 disponibles en disco
  juan:      { min: 1, max: 75 },
  harry:     { min: 1, max: 75 },
  andrea:    { min: 1, max: 75 },
  alicia:    { min: 1, max: 75 },
};

/**
 * Indica si una voz usa el formato de archivo único por número (N.mp3)
 * en lugar del formato con variantes (N_call1.mp3 / N_call2.mp3).
 */
function esVozSimple(genero: GeneroAudio): boolean {
  return genero === 'juan' || genero === 'harry' || genero === 'andrea' || genero === 'alicia';
}

/**
 * Devuelve true si el número tiene archivo MP3 disponible para la voz dada.
 */
function numeroDisponible(genero: GeneroAudio, numero: number): boolean {
  const { min, max } = RANGO_NUMEROS[genero];
  return numero >= min && numero <= max;
}

/** Número máximo del bingo (rango global) */
const BINGO_MAX = 75;

// ─── Web Audio API ────────────────────────────────────────────────────────────

/** AudioContext compartido para toda la app */
let audioCtx: AudioContext | null = null;

/** Nodo de reproducción Web Audio activo */
let sourceActivo: AudioBufferSourceNode | null = null;

/**
 * HTMLAudioElement activo (fallback cuando decodeAudioData falla).
 */
let htmlAudioActivo: HTMLAudioElement | null = null;

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
 * Cache de AudioBuffers decodificados (Web Audio API).
 * Clave: URL del archivo MP3.
 */
const cacheBuffers = new Map<string, AudioBuffer>();

/**
 * Cache de Blob URLs para reproducción con HTMLAudioElement.
 * IMPORTANTE: los Blob URLs se crean desde el buffer SIN encabezado ID3v2.4
 * para que Edge/iOS/Android puedan reproducirlos correctamente.
 * Clave: URL original del archivo MP3.
 */
const cacheBlobURLs = new Map<string, string>();

/**
 * Conjunto de URLs que fallaron con decodeAudioData.
 * Para estas URLs se usa directamente Blob URL + HTMLAudioElement.
 */
const urlsConFallbackHTML = new Set<string>();

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
 * Elimina el encabezado ID3v2 de un ArrayBuffer si está presente.
 *
 * ElevenLabs genera MP3 con etiquetas ID3v2.4 (versión 4), que Edge,
 * iOS Safari y Android no pueden decodificar con decodeAudioData NI
 * reproducir con HTMLAudioElement.
 * Al eliminar el encabezado ID3 se exponen directamente los frames MP3
 * que todos los navegadores saben decodificar y reproducir.
 *
 * Estructura del encabezado ID3v2:
 *   Bytes 0-2 : "ID3" (0x49 0x44 0x33)
 *   Byte  3   : versión mayor (0x04 = v2.4, 0x03 = v2.3, etc.)
 *   Byte  4   : revisión
 *   Byte  5   : flags
 *   Bytes 6-9 : tamaño del tag en formato syncsafe (7 bits por byte)
 *   Byte  10+ : frames del tag
 *
 * @returns Un NUEVO ArrayBuffer sin el encabezado ID3v2 (slice crea copia).
 */
function stripID3v2(buffer: ArrayBuffer): ArrayBuffer {
  const view = new Uint8Array(buffer);

  // Verificar firma "ID3"
  if (view.length < 10 || view[0] !== 0x49 || view[1] !== 0x44 || view[2] !== 0x33) {
    return buffer; // No tiene encabezado ID3v2 — devolver tal cual
  }

  // Leer el tamaño del tag en formato syncsafe (4 bytes × 7 bits)
  const tagSize =
    ((view[6] & 0x7F) << 21) |
    ((view[7] & 0x7F) << 14) |
    ((view[8] & 0x7F) <<  7) |
     (view[9] & 0x7F);

  // El encabezado ID3v2 ocupa 10 bytes + tagSize bytes
  const offset = 10 + tagSize;

  if (offset >= view.length) {
    return buffer; // Offset inválido — devolver original para no romper nada
  }

  // slice() crea una COPIA — el buffer original no se modifica ni se detach
  return buffer.slice(offset);
}

/**
 * Descarga el MP3 y lo prepara para reproducción.
 *
 * Estrategia:
 *   1. Descarga el archivo como ArrayBuffer.
 *   2. Elimina el encabezado ID3v2 (crea strippedBuffer como copia).
 *   3. Intenta decodificar strippedBuffer con Web Audio API.
 *   4. Si falla, crea un Blob URL desde strippedBuffer (NO desde el raw)
 *      y lo guarda en cacheBlobURLs.
 *
 * CORRECCIÓN CRÍTICA: el Blob URL se crea desde strippedBuffer (sin ID3v2.4),
 * no desde rawBuffer. Edge/iOS/Android no pueden reproducir MP3 con ID3v2.4
 * ni siquiera con HTMLAudioElement + Blob URL.
 *
 * Retorna el AudioBuffer si Web Audio funcionó, o null si se usará Blob URL.
 */
async function obtenerBuffer(url: string): Promise<AudioBuffer | null> {
  // Si esta URL ya falló antes con Web Audio, no reintentar decodeAudioData
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
    const rawBuffer = await response.arrayBuffer();

    // Eliminar encabezado ID3v2 ANTES de decodificar Y antes de crear el Blob.
    // stripID3v2 usa slice() internamente → crea una copia nueva, no modifica rawBuffer.
    // strippedBuffer es el buffer limpio que usaremos tanto para decodeAudioData
    // como para el Blob URL fallback.
    const strippedBuffer = stripID3v2(rawBuffer);

    try {
      // Necesitamos una copia para decodeAudioData porque puede transferir (detach)
      // el buffer en algunas implementaciones del navegador.
      const bufferParaDecode = strippedBuffer.slice(0);

      // Callback API — compatible con TODAS las versiones de iOS Safari
      const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
        ctx.decodeAudioData(bufferParaDecode, resolve, reject);
      });
      cacheBuffers.set(url, audioBuffer);
      return audioBuffer;
    } catch (decodeErr) {
      // decodeAudioData falló — crear Blob URL desde strippedBuffer (SIN ID3v2.4)
      // para fallback con HTMLAudioElement.
      // CORRECCIÓN: usar strippedBuffer, NO rawBuffer. Edge/iOS/Android no pueden
      // reproducir MP3 con ID3v2.4 ni siquiera con HTMLAudioElement + Blob URL.
      console.warn(`[AudioService] decodeAudioData falló para ${url} — creando Blob URL (stripped) para fallback:`, decodeErr);
      urlsConFallbackHTML.add(url);

      if (!cacheBlobURLs.has(url)) {
        // strippedBuffer ya es una copia (slice) — seguro usarlo aquí
        const blob = new Blob([strippedBuffer], { type: 'audio/mpeg' });
        const blobUrl = URL.createObjectURL(blob);
        cacheBlobURLs.set(url, blobUrl);
        console.log(`[AudioService] Blob URL (stripped) creado para ${url}`);
      }

      return null;
    }
  } catch (err) {
    console.warn(`[AudioService] Error descargando ${url}:`, err);
    urlsConFallbackHTML.add(url);
    return null;
  }
}

/**
 * Reproduce un MP3 usando HTMLAudioElement con Blob URL.
 *
 * Los Blob URLs son datos locales en memoria — no requieren gesto del usuario
 * para reproducirse, a diferencia de URLs remotas en iOS/Android.
 *
 * Retorna true si la reproducción se inició correctamente.
 */
async function reproducirConBlobURL(blobUrl: string, urlOriginal: string): Promise<boolean> {
  try {
    // Detener el HTMLAudio anterior si existe
    if (htmlAudioActivo) {
      htmlAudioActivo.pause();
      htmlAudioActivo.src = '';
      htmlAudioActivo = null;
    }

    const audio = new Audio();
    audio.src = blobUrl;
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
    console.warn(`[AudioService] Blob URL también falló para ${urlOriginal}:`, err);
    return false;
  }
}

// ─── API pública ─────────────────────────────────────────────────────────────

/**
 * Registra en el cache las URLs de los archivos MP3 disponibles para el género.
 * Solo registra los números dentro del rango real (RANGO_NUMEROS) — los números
 * fuera del rango se manejan con TTS en tiempo de reproducción.
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
  const { min, max } = RANGO_NUMEROS[genero];
  const numerosDisponibles = max - min + 1;

  // Total de entradas de cache: voces simples = 1 por número; tradicionales = 2 (call1+call2)
  const total = simple ? numerosDisponibles : numerosDisponibles * 2;

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

  console.log(
    `[AudioService] Registrando URLs de voz "${genero}" ` +
    `(números ${min}–${max}${simple ? '' : ' × 2 frases'})`
  );

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

    for (let n = min; n <= max; n++) {
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

    for (let n = min; n <= max; n++) {
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
  console.log(`[AudioService] ✅ URLs registradas: voz "${genero}" (${numerosDisponibles} números)`);
}

/**
 * Reproduce el audio del número indicado para el género dado.
 *
 * Estrategia en orden de prioridad:
 *   1. Verificar que el número tiene MP3 disponible para esta voz (RANGO_NUMEROS).
 *      Si no, devuelve false inmediatamente → el caller usa TTS como fallback.
 *   2. Web Audio API (AudioContext + decodeAudioData con buffer stripped).
 *      Funciona en iOS Safari, Android Chrome y todos los navegadores de escritorio.
 *   3. HTMLAudioElement con Blob URL creado desde buffer stripped (sin ID3v2.4).
 *      Fallback para cuando decodeAudioData falla (Edge antiguo, algunos Android).
 *
 * @returns Promise<boolean> — true = reproducción iniciada, false = no disponible o falló
 */
export async function reproducirNumero(
  numero: number,
  genero: GeneroAudio
): Promise<boolean> {
  // ── Verificar disponibilidad del archivo MP3 para esta voz ───────────────
  // Si el número está fuera del rango disponible, devolver false de inmediato
  // para que hablarNumeroConAudio() use TTS como fallback sin intentar fetch.
  if (!numeroDisponible(genero, numero)) {
    console.info(
      `[AudioService] ${genero}/${numero} fuera del rango disponible ` +
      `(${RANGO_NUMEROS[genero].min}–${RANGO_NUMEROS[genero].max}) — usando TTS`
    );
    return false;
  }

  const ctx = obtenerAudioContext();

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
  if (ctx && ctx.state !== 'running') {
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

  // ── Intentar Web Audio API ───────────────────────────────────────────────
  if (ctx) {
    // Obtener el AudioBuffer (del cache o descargando + decodificando)
    const buffer = await obtenerBuffer(url);

    if (buffer) {
      try {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        sourceActivo = source;

        source.onended = () => {
          if (sourceActivo === source) {
            sourceActivo = null;
          }
        };

        return true;
      } catch (err) {
        console.warn(`[AudioService] Error reproduciendo ${genero}/${numero} con Web Audio:`, err);
        // Caer al fallback de Blob URL
      }
    }
  }

  // ── Fallback: Blob URL + HTMLAudioElement ────────────────────────────────
  // Si ya tenemos el Blob URL en cache (creado desde stripped buffer), usarlo.
  // Si no, intentar descargar, strip y crear el Blob URL ahora.
  let blobUrl = cacheBlobURLs.get(url);

  if (!blobUrl) {
    // Intentar descargar, strip y crear Blob URL
    try {
      const response = await fetch(url);
      if (response.ok) {
        const rawBuffer = await response.arrayBuffer();
        // CORRECCIÓN CRÍTICA: crear Blob desde strippedBuffer, NO desde rawBuffer
        const strippedBuffer = stripID3v2(rawBuffer);
        const blob = new Blob([strippedBuffer], { type: 'audio/mpeg' });
        blobUrl = URL.createObjectURL(blob);
        cacheBlobURLs.set(url, blobUrl);
        urlsConFallbackHTML.add(url);
        console.log(`[AudioService] Blob URL (stripped) creado on-demand para ${genero}/${numero}`);
      }
    } catch (fetchErr) {
      console.warn(`[AudioService] No se pudo descargar ${url}:`, fetchErr);
    }
  }

  if (blobUrl) {
    console.log(`[AudioService] Usando Blob URL (stripped) para ${genero}/${numero}`);
    return reproducirConBlobURL(blobUrl, url);
  }

  console.warn(`[AudioService] Sin audio disponible para ${genero}/${numero}`);
  return false;
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
    // Limpiar AudioBuffers y Blob URLs cacheados de voces simples
    const mapa = cacheURLsSimple.get(genero);
    if (mapa) {
      for (const url of mapa.values()) {
        cacheBuffers.delete(url);
        const blobUrl = cacheBlobURLs.get(url);
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
          cacheBlobURLs.delete(url);
        }
        urlsConFallbackHTML.delete(url);
      }
    }
    cacheURLsSimple.delete(genero);
  } else {
    // Limpiar AudioBuffers y Blob URLs cacheados de voces tradicionales
    const mapa = cacheURLsTradicional.get(genero);
    if (mapa) {
      for (const entrada of mapa.values()) {
        for (const url of [entrada.call1, entrada.call2]) {
          cacheBuffers.delete(url);
          const blobUrl = cacheBlobURLs.get(url);
          if (blobUrl) {
            URL.revokeObjectURL(blobUrl);
            cacheBlobURLs.delete(url);
          }
          urlsConFallbackHTML.delete(url);
        }
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

/**
 * Devuelve el rango de números con MP3 disponibles para la voz dada.
 * Útil para mostrar en la UI si una voz tiene cobertura parcial.
 */
export function obtenerRangoVoz(genero: GeneroAudio): { min: number; max: number } {
  return RANGO_NUMEROS[genero];
}

/**
 * Devuelve true si la voz tiene MP3 para todos los números del bingo (1–75).
 * false = cobertura parcial (algunos números usarán TTS como fallback).
 */
export function vozTieneCoberturaTotalMP3(genero: GeneroAudio): boolean {
  const { min, max } = RANGO_NUMEROS[genero];
  return min === 1 && max >= BINGO_MAX;
}

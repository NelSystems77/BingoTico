/**
 * audioService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Servicio de audio con carga bajo demanda (lazy loading) para los archivos
 * MP3 de los números del bingo.
 *
 * Estructura de carpetas esperada en /public:
 *   /audio/numbers/          → voz masculina  (1.mp3, 1_var.mp3 … 90.mp3, 90_var.mp3)
 *   /audio/numbers-female/   → voz femenina   (1.mp3, 1_var.mp3 … 90.mp3, 90_var.mp3)
 *
 * Estrategia de lazy loading:
 *   • Los archivos NO se cargan al iniciar la app.
 *   • Cuando el usuario elige un género y arranca el juego, se llama a
 *     `precargarGenero()` que descarga en segundo plano todos los MP3 del
 *     género seleccionado y los guarda como objetos `Audio` en un Map.
 *   • Cada número tiene dos variantes: base (N.mp3) y variación (N_var.mp3).
 *     Se elige aleatoriamente cuál reproducir, igual que con SpeechSynthesis.
 *   • Si el archivo aún no está en cache (p.ej. la precarga no terminó),
 *     se crea el objeto Audio al vuelo y se reproduce de inmediato.
 *   • Si el navegador no soporta Audio o hay un error de red, se devuelve
 *     `null` para que el llamador use SpeechSynthesis como fallback.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type GeneroAudio = 'masculina' | 'femenina';

/** Rutas base de los dos conjuntos de audio */
const BASE_PATHS: Record<GeneroAudio, string> = {
  masculina: '/audio/numbers',
  femenina:  '/audio/numbers-female',
};

/** Números disponibles (1–90) */
const TOTAL_NUMEROS = 90;

/**
 * Cada entrada del cache guarda los dos objetos Audio (base y variación)
 * para un número dado.
 */
interface EntradaCache {
  base: HTMLAudioElement;
  variacion: HTMLAudioElement;
}

/** Cache principal: género → número → EntradaCache */
const cache = new Map<GeneroAudio, Map<number, EntradaCache>>();

/** Indica si la precarga de un género ya fue iniciada (evita doble fetch) */
const precargaIniciada = new Set<GeneroAudio>();

/** Indica si la precarga de un género ya completó todos los archivos */
const precargaCompleta = new Set<GeneroAudio>();

// ─── Helpers internos ────────────────────────────────────────────────────────

/** Construye la URL de un archivo de audio */
function urlAudio(genero: GeneroAudio, numero: number, variacion: boolean): string {
  const base = BASE_PATHS[genero];
  const sufijo = variacion ? '_var' : '';
  return `${base}/${numero}${sufijo}.mp3`;
}

/**
 * Crea un HTMLAudioElement y lo precarga (preload="auto").
 * Devuelve una Promise que resuelve cuando el audio está listo para
 * reproducirse (evento `canplaythrough`) o rechaza si hay error.
 */
function crearAudio(url: string): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = 'auto';

    const onReady = () => {
      audio.removeEventListener('canplaythrough', onReady);
      audio.removeEventListener('error', onError);
      resolve(audio);
    };

    const onError = () => {
      audio.removeEventListener('canplaythrough', onReady);
      audio.removeEventListener('error', onError);
      reject(new Error(`Error cargando audio: ${url}`));
    };

    audio.addEventListener('canplaythrough', onReady, { once: true });
    audio.addEventListener('error', onError, { once: true });
    audio.src = url;
    audio.load();
  });
}

/**
 * Crea un HTMLAudioElement sin esperar a que esté listo.
 * Útil para reproducción inmediata cuando la precarga no terminó.
 */
function crearAudioInmediato(url: string): HTMLAudioElement {
  const audio = new Audio(url);
  audio.preload = 'auto';
  return audio;
}

// ─── API pública ─────────────────────────────────────────────────────────────

/**
 * Inicia la precarga en segundo plano de todos los archivos MP3
 * del género indicado. Es seguro llamarlo múltiples veces; solo
 * ejecuta la carga una vez por género.
 *
 * @param genero  'masculina' | 'femenina'
 * @param onProgreso  Callback opcional (numero cargado, total) para UI de progreso
 */
export async function precargarGenero(
  genero: GeneroAudio,
  onProgreso?: (cargados: number, total: number) => void
): Promise<void> {
  if (precargaIniciada.has(genero)) return; // ya en curso o completa
  precargaIniciada.add(genero);

  if (!cache.has(genero)) {
    cache.set(genero, new Map());
  }
  const mapaGenero = cache.get(genero)!;

  const total = TOTAL_NUMEROS * 2; // base + variación por número
  let cargados = 0;

  console.log(`[AudioService] Iniciando precarga de voz ${genero} (${TOTAL_NUMEROS} números × 2 variantes)`);

  // Cargamos de a lotes de 10 para no saturar la red
  const LOTE = 10;
  for (let inicio = 1; inicio <= TOTAL_NUMEROS; inicio += LOTE) {
    const fin = Math.min(inicio + LOTE - 1, TOTAL_NUMEROS);
    const promesas: Promise<void>[] = [];

    for (let n = inicio; n <= fin; n++) {
      const num = n; // captura para closure
      const p = Promise.all([
        crearAudio(urlAudio(genero, num, false)),
        crearAudio(urlAudio(genero, num, true)),
      ])
        .then(([base, variacion]) => {
          mapaGenero.set(num, { base, variacion });
          cargados += 2;
          onProgreso?.(cargados, total);
        })
        .catch((err) => {
          // Si falla un archivo, lo ignoramos silenciosamente
          console.warn(`[AudioService] ${err.message}`);
          cargados += 2;
          onProgreso?.(cargados, total);
        });

      promesas.push(p);
    }

    await Promise.all(promesas);
  }

  precargaCompleta.add(genero);
  console.log(`[AudioService] ✅ Precarga completa: voz ${genero}`);
}

/**
 * Reproduce el audio del número indicado para el género dado.
 *
 * • Si el archivo ya está en cache, lo reproduce directamente.
 * • Si aún no está en cache (precarga en curso), lo crea al vuelo.
 * • Elige aleatoriamente entre la versión base y la variación.
 *
 * @returns El HTMLAudioElement que se está reproduciendo, o `null` si
 *          el navegador no soporta Audio (para usar fallback TTS).
 */
export function reproducirNumero(
  numero: number,
  genero: GeneroAudio
): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') return null; // SSR / entorno sin Audio

  if (!cache.has(genero)) {
    cache.set(genero, new Map());
  }
  const mapaGenero = cache.get(genero)!;

  // Elegir aleatoriamente base o variación (50/50)
  const usarVariacion = Math.random() < 0.5;

  let audioEl: HTMLAudioElement;

  if (mapaGenero.has(numero)) {
    // ✅ Cache hit: usar el objeto precargado
    const entrada = mapaGenero.get(numero)!;
    audioEl = usarVariacion ? entrada.variacion : entrada.base;

    // Reiniciar si ya se reprodujo antes
    audioEl.currentTime = 0;
  } else {
    // ⚡ Cache miss: crear al vuelo y guardar en cache para la próxima vez
    const url = urlAudio(genero, numero, usarVariacion);
    audioEl = crearAudioInmediato(url);

    // Guardar ambas variantes en cache para uso futuro
    const base      = crearAudioInmediato(urlAudio(genero, numero, false));
    const variacion = crearAudioInmediato(urlAudio(genero, numero, true));
    mapaGenero.set(numero, { base, variacion });

    console.log(`[AudioService] Cache miss para ${genero}/${numero} — cargando al vuelo`);
  }

  // Detener cualquier reproducción anterior del mismo elemento
  audioEl.pause();
  audioEl.currentTime = 0;

  const promesaPlay = audioEl.play();
  if (promesaPlay !== undefined) {
    promesaPlay.catch((err) => {
      // AutoPlay bloqueado por el navegador — el llamador debe usar TTS
      console.warn(`[AudioService] play() bloqueado para ${genero}/${numero}:`, err);
    });
  }

  return audioEl;
}

/**
 * Detiene toda reproducción activa del género indicado.
 * Útil al pausar el juego o cambiar de número.
 */
export function detenerAudio(genero: GeneroAudio): void {
  const mapaGenero = cache.get(genero);
  if (!mapaGenero) return;

  mapaGenero.forEach(({ base, variacion }) => {
    if (!base.paused) {
      base.pause();
      base.currentTime = 0;
    }
    if (!variacion.paused) {
      variacion.pause();
      variacion.currentTime = 0;
    }
  });
}

/**
 * Detiene toda reproducción activa de cualquier género.
 */
export function detenerTodoAudio(): void {
  cache.forEach((_, genero) => detenerAudio(genero));
}

/**
 * Libera el cache de un género (útil si el usuario cambia de género
 * durante la sesión para liberar memoria).
 */
export function limpiarCacheGenero(genero: GeneroAudio): void {
  detenerAudio(genero);
  cache.delete(genero);
  precargaIniciada.delete(genero);
  precargaCompleta.delete(genero);
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

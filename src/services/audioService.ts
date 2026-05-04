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
 *     `precargarGenero()` que registra las URLs en el cache y opcionalmente
 *     precarga los primeros números con HTMLAudioElement para reducir latencia.
 *   • Cada número tiene dos variantes: base (N.mp3) y variación (N_var.mp3).
 *     Se elige aleatoriamente cuál reproducir.
 *   • IMPORTANTE: En Safari/iOS y Android NO se reutilizan objetos Audio;
 *     se crea un nuevo HTMLAudioElement en cada reproducción para evitar
 *     el bloqueo de autoplay por reutilización de elementos.
 *   • Si el navegador no soporta Audio o hay un error de red, se devuelve
 *     `false` para que el llamador use SpeechSynthesis como fallback.
 *
 * CAMBIOS v2 (fix iOS Safari / Android):
 *   • Se eliminó la verificación fetch HEAD — era innecesaria para URLs
 *     estáticas conocidas y causaba bloqueos en iOS Safari y Android WebView.
 *   • precargarGenero() ahora registra las URLs directamente en el cache
 *     (sin red) y reporta progreso de forma síncrona → la barra avanza siempre.
 *   • reproducirNumero() usa preload='auto' para que iOS pueda buffear el
 *     audio antes de play(), reduciendo errores de "no user gesture".
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
 * Cache de URLs (registradas sin verificación de red).
 * Guardamos solo la URL, NO el objeto Audio, para evitar problemas
 * de reutilización en Safari/iOS y Android.
 */
const cacheURLs = new Map<GeneroAudio, Map<number, { base: string; variacion: string }>>();

/** Indica si la precarga de un género ya fue iniciada (evita doble ejecución) */
const precargaIniciada = new Set<GeneroAudio>();

/** Indica si la precarga de un género ya completó */
const precargaCompleta = new Set<GeneroAudio>();

/** Elemento de audio actualmente en reproducción (para poder detenerlo) */
let audioActivo: HTMLAudioElement | null = null;

// ─── Helpers internos ────────────────────────────────────────────────────────

/** Construye la URL de un archivo de audio */
function urlAudio(genero: GeneroAudio, numero: number, variacion: boolean): string {
  const base = BASE_PATHS[genero];
  const sufijo = variacion ? '_var' : '';
  return `${base}/${numero}${sufijo}.mp3`;
}

/**
 * Detecta si el dispositivo es iOS Safari o Android.
 * En estos entornos se aplican estrategias especiales de audio.
 */
function esIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iP(hone|od|ad)/i.test(ua) && /WebKit/i.test(ua) && !/CriOS|FxiOS|OPiOS/i.test(ua);
}

function esAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

// ─── API pública ─────────────────────────────────────────────────────────────

/**
 * Registra en el cache las URLs de todos los archivos MP3 del género indicado.
 * NO realiza ninguna petición de red — las URLs son estáticas y conocidas.
 * El progreso se reporta de forma síncrona para que la barra de carga avance
 * correctamente en iOS Safari y Android (donde fetch HEAD puede bloquearse).
 *
 * @param genero      'masculina' | 'femenina'
 * @param onProgreso  Callback opcional (cargados, total) para UI de progreso
 */
export async function precargarGenero(
  genero: GeneroAudio,
  onProgreso?: (cargados: number, total: number) => void
): Promise<void> {
  if (precargaIniciada.has(genero)) return; // ya en curso o completa
  precargaIniciada.add(genero);

  if (!cacheURLs.has(genero)) {
    cacheURLs.set(genero, new Map());
  }
  const mapaGenero = cacheURLs.get(genero)!;

  const total = TOTAL_NUMEROS * 2; // base + variación por número
  let cargados = 0;

  console.log(`[AudioService] Registrando URLs de voz ${genero} (${TOTAL_NUMEROS} números × 2 variantes)`);

  // Registrar URLs de forma síncrona — sin fetch, sin red
  // Esto garantiza que la barra de progreso avance en todos los navegadores,
  // incluyendo iOS Safari y Android WebView donde fetch HEAD puede bloquearse.
  for (let n = 1; n <= TOTAL_NUMEROS; n++) {
    const urlBase = urlAudio(genero, n, false);
    const urlVar  = urlAudio(genero, n, true);

    mapaGenero.set(n, { base: urlBase, variacion: urlVar });
    cargados += 2;
    onProgreso?.(cargados, total);

    // Ceder el hilo cada 10 números para no bloquear el render de React
    // y permitir que la barra de progreso se actualice visualmente.
    if (n % 10 === 0) {
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    }
  }

  precargaCompleta.add(genero);
  console.log(`[AudioService] ✅ URLs registradas: voz ${genero}`);

  // En iOS Safari y Android, precargamos los primeros 10 números con Audio
  // para reducir la latencia del primer sonido (sin bloquear el juego).
  if (esIOSSafari() || esAndroid()) {
    _precalentarPrimeros(genero, mapaGenero);
  }
}

/**
 * Precalienta los primeros N números creando HTMLAudioElement con preload='auto'.
 * Solo se ejecuta en iOS/Android para reducir latencia del primer audio.
 * No bloquea el flujo principal.
 */
function _precalentarPrimeros(
  genero: GeneroAudio,
  mapaGenero: Map<number, { base: string; variacion: string }>,
  cantidad = 10
): void {
  console.log(`[AudioService] Precalentando primeros ${cantidad} números para ${genero} (iOS/Android)`);
  for (let n = 1; n <= Math.min(cantidad, TOTAL_NUMEROS); n++) {
    const entrada = mapaGenero.get(n);
    if (!entrada) continue;
    try {
      const el = new Audio();
      el.preload = 'auto';
      el.src = entrada.base;
      // No llamamos play() — solo cargamos el buffer
    } catch {
      // ignorar errores de precalentamiento
    }
  }
}

/**
 * Reproduce el audio del número indicado para el género dado.
 *
 * CAMBIO CLAVE para Safari/iOS y Android:
 * • Se crea un NUEVO HTMLAudioElement en cada reproducción.
 *   Reutilizar el mismo elemento causa que Safari rechace play()
 *   porque el elemento ya no está "fresco" desde la interacción del usuario.
 * • preload='auto' permite que iOS buffeé el audio antes de play(),
 *   reduciendo errores de "no user gesture" en reproducción rápida.
 * • Se retorna una Promise<boolean> que resuelve true si el audio
 *   se reprodujo correctamente, false si falló (para activar TTS fallback).
 *
 * @returns Promise<boolean> — true = reproducción iniciada, false = falló
 */
export function reproducirNumero(
  numero: number,
  genero: GeneroAudio
): Promise<boolean> {
  if (typeof Audio === 'undefined') return Promise.resolve(false);

  // Detener audio anterior si existe
  if (audioActivo) {
    try {
      audioActivo.pause();
      audioActivo.src = '';
    } catch {
      // ignorar errores al detener
    }
    audioActivo = null;
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
    // Cache miss: construir URL al vuelo
    url = urlAudio(genero, numero, usarVariacion);
    console.log(`[AudioService] Cache miss para ${genero}/${numero} — usando URL al vuelo`);
  }

  // SIEMPRE crear un nuevo HTMLAudioElement (crítico para Safari/iOS y Android)
  const audioEl = new Audio();

  // preload='auto': permite que iOS/Android buffeé el audio antes de play().
  // Con preload='none' en iOS, play() puede fallar si el buffer no está listo
  // en el momento exacto del gesto del usuario.
  audioEl.preload = 'auto';
  audioEl.src = url;
  audioActivo = audioEl;

  return new Promise<boolean>((resolve) => {
    let resuelto = false;

    const resolver = (valor: boolean) => {
      if (resuelto) return;
      resuelto = true;
      cleanup();
      resolve(valor);
    };

    const onError = () => {
      console.warn(`[AudioService] Error reproduciendo ${genero}/${numero} (${url})`);
      resolver(false);
    };

    const onEnded = () => {
      // Audio terminó correctamente — no necesitamos hacer nada más
    };

    const cleanup = () => {
      audioEl.removeEventListener('error', onError);
      audioEl.removeEventListener('ended', onEnded);
    };

    audioEl.addEventListener('error', onError, { once: true });
    audioEl.addEventListener('ended', onEnded, { once: true });

    // play() devuelve una Promise en navegadores modernos
    const promesaPlay = audioEl.play();

    if (promesaPlay !== undefined) {
      promesaPlay
        .then(() => {
          // Reproducción iniciada correctamente
          resolver(true);
        })
        .catch((err) => {
          // AutoPlay bloqueado o error de red → fallback TTS
          console.warn(`[AudioService] play() rechazado para ${genero}/${numero}:`, err);
          resolver(false);
        });
    } else {
      // Navegadores antiguos que no devuelven Promise (muy raro)
      resolver(true);
    }
  });
}

/**
 * Detiene toda reproducción activa.
 */
export function detenerTodoAudio(): void {
  if (audioActivo) {
    try {
      audioActivo.pause();
      audioActivo.src = '';
    } catch {
      // ignorar
    }
    audioActivo = null;
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
  cacheURLs.delete(genero);
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

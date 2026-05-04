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
 *   • IMPORTANTE: En Safari (iOS y macOS) y Android NO se reutilizan objetos
 *     Audio; se crea un nuevo HTMLAudioElement en cada reproducción para evitar
 *     el bloqueo de autoplay por reutilización de elementos.
 *   • Si el navegador no soporta Audio o hay un error de red, se devuelve
 *     `false` para que el llamador use SpeechSynthesis como fallback.
 *
 * CAMBIOS v3 (fix Safari macOS + Android):
 *   • esSafari() ahora detecta TANTO Safari iOS como Safari macOS (desktop).
 *     Antes solo se detectaba iOS, dejando Safari de escritorio sin el fix.
 *   • reproducirNumero() ahora espera el evento `canplay` antes de llamar
 *     play(). En Safari (iOS/macOS) y Android, llamar play() inmediatamente
 *     después de asignar src puede lanzar NotSupportedError / AbortError
 *     porque el navegador no ha cargado suficientes datos aún.
 *   • Se añade un timeout de seguridad (CANPLAY_TIMEOUT_MS) para que si
 *     `canplay` nunca llega (red lenta, archivo inexistente) se intente
 *     play() de todas formas y se capture el error correctamente.
 *   • _precalentarPrimeros() ahora se ejecuta también en Safari macOS.
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
 * Tiempo máximo (ms) que esperamos el evento `canplay` antes de intentar
 * play() de todas formas. Evita que una red lenta bloquee indefinidamente.
 */
const CANPLAY_TIMEOUT_MS = 3000;

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

/**
 * Callbacks de progreso pendientes para cuando la precarga está en curso.
 * Permite que múltiples llamadores (p.ej. React StrictMode monta dos veces)
 * reciban actualizaciones de progreso aunque la precarga ya haya sido iniciada.
 */
const callbacksPendientes = new Map<GeneroAudio, Array<(cargados: number, total: number) => void>>();

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
 * Detecta Safari en cualquier plataforma: iOS (iPhone/iPad/iPod) y macOS.
 *
 * Criterios:
 *  - iOS Safari:     contiene "iP(hone|od|ad)" + "WebKit" y NO es CriOS/FxiOS/OPiOS
 *  - macOS Safari:   contiene "Safari" + "Macintosh" + "WebKit" y NO es Chrome/Chromium/Firefox
 *
 * NOTA: Chrome en macOS incluye "Safari" en su UA pero también incluye "Chrome",
 * por eso excluimos explícitamente Chrome/Chromium/Edg/Firefox/OPR.
 */
function esSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;

  // iOS Safari (iPhone, iPad, iPod)
  const esIOSSafari =
    /iP(hone|od|ad)/i.test(ua) &&
    /WebKit/i.test(ua) &&
    !/CriOS|FxiOS|OPiOS/i.test(ua);

  // macOS Safari (excluir Chrome, Chromium, Edge, Firefox, Opera)
  const esMacSafari =
    /Macintosh/i.test(ua) &&
    /Safari/i.test(ua) &&
    /WebKit/i.test(ua) &&
    !/Chrome|Chromium|Edg|Firefox|OPR/i.test(ua);

  return esIOSSafari || esMacSafari;
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
 * correctamente en Safari (iOS/macOS) y Android (donde fetch HEAD puede
 * bloquearse).
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
  // El componente se desmontó y remontó (navegación, React StrictMode, etc.)
  // El estado React se reinició a 0% pero el módulo ya tiene todo cargado.
  // Reportamos 100% inmediatamente para sincronizar la UI.
  if (precargaCompleta.has(genero)) {
    onProgreso?.(total, total);
    return;
  }

  // ── Caso 2: precarga en curso ────────────────────────────────────────────
  // Otro llamador ya inició la precarga (p.ej. React StrictMode ejecuta el
  // efecto dos veces). Registramos el callback para que reciba las
  // actualizaciones de progreso del loop que ya está corriendo.
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

  // Helper para notificar a TODOS los callbacks registrados (el original + pendientes)
  const notificar = (c: number, t: number) => {
    onProgreso?.(c, t);
    callbacksPendientes.get(genero)?.forEach(cb => cb(c, t));
  };

  // Registrar URLs de forma síncrona — sin fetch, sin red.
  // Esto garantiza que la barra de progreso avance en todos los navegadores,
  // incluyendo Safari (iOS/macOS) y Android WebView donde fetch HEAD puede
  // bloquearse.
  for (let n = 1; n <= TOTAL_NUMEROS; n++) {
    const urlBase = urlAudio(genero, n, false);
    const urlVar  = urlAudio(genero, n, true);

    mapaGenero.set(n, { base: urlBase, variacion: urlVar });
    cargados += 2;
    notificar(cargados, total);

    // Ceder el hilo cada 10 números para no bloquear el render de React
    // y permitir que la barra de progreso se actualice visualmente.
    if (n % 10 === 0) {
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    }
  }

  precargaCompleta.add(genero);
  callbacksPendientes.delete(genero); // limpiar callbacks ya notificados
  console.log(`[AudioService] ✅ URLs registradas: voz ${genero}`);

  // En Safari (iOS y macOS) y Android, precargamos los primeros 10 números
  // con Audio para reducir la latencia del primer sonido (sin bloquear el juego).
  if (esSafari() || esAndroid()) {
    _precalentarPrimeros(genero, mapaGenero);
  }
}

/**
 * Precalienta los primeros N números creando HTMLAudioElement con preload='auto'.
 * Solo se ejecuta en Safari (iOS/macOS) y Android para reducir latencia del
 * primer audio. No bloquea el flujo principal.
 */
function _precalentarPrimeros(
  genero: GeneroAudio,
  mapaGenero: Map<number, { base: string; variacion: string }>,
  cantidad = 10
): void {
  console.log(`[AudioService] Precalentando primeros ${cantidad} números para ${genero} (Safari/Android)`);
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
 * ESTRATEGIA PARA Safari (iOS/macOS) y Android:
 * • Se crea un NUEVO HTMLAudioElement en cada reproducción.
 *   Reutilizar el mismo elemento causa que Safari rechace play()
 *   porque el elemento ya no está "fresco" desde la interacción del usuario.
 * • Se espera el evento `canplay` antes de llamar play().
 *   En Safari y Android, llamar play() inmediatamente después de asignar src
 *   puede lanzar NotSupportedError o AbortError porque el navegador no ha
 *   cargado suficientes datos aún. Esperar `canplay` garantiza que el buffer
 *   está listo y play() tendrá éxito.
 * • Un timeout de seguridad (CANPLAY_TIMEOUT_MS) evita esperas infinitas:
 *   si `canplay` no llega en ese tiempo, se intenta play() de todas formas.
 * • preload='auto' permite que Safari/Android buffeé el audio antes de play().
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

  // SIEMPRE crear un nuevo HTMLAudioElement (crítico para Safari y Android)
  const audioEl = new Audio();

  // preload='auto': permite que Safari/Android buffeé el audio antes de play().
  // Con preload='none', play() puede fallar si el buffer no está listo.
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

    // Función que ejecuta play() y maneja su Promise
    const ejecutarPlay = () => {
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
    };

    const cleanup = () => {
      audioEl.removeEventListener('error', onError);
      audioEl.removeEventListener('ended', onEnded);
      audioEl.removeEventListener('canplay', onCanPlay);
      if (canPlayTimer !== null) {
        clearTimeout(canPlayTimer);
        canPlayTimer = null;
      }
    };

    audioEl.addEventListener('error', onError, { once: true });
    audioEl.addEventListener('ended', onEnded, { once: true });

    // ── Estrategia canplay para Safari (iOS/macOS) y Android ──────────────
    // En estos navegadores, play() llamado inmediatamente después de asignar
    // src puede fallar con NotSupportedError o AbortError porque el buffer
    // no está listo. Esperamos `canplay` para garantizar que hay datos
    // suficientes antes de llamar play().
    //
    // En navegadores de escritorio (Chrome, Firefox) el evento `canplay`
    // llega casi instantáneamente, por lo que no hay penalización de latencia.
    let canPlayTimer: ReturnType<typeof setTimeout> | null = null;

    const onCanPlay = () => {
      if (canPlayTimer !== null) {
        clearTimeout(canPlayTimer);
        canPlayTimer = null;
      }
      audioEl.removeEventListener('canplay', onCanPlay);
      ejecutarPlay();
    };

    audioEl.addEventListener('canplay', onCanPlay, { once: true });

    // Timeout de seguridad: si `canplay` no llega en CANPLAY_TIMEOUT_MS ms
    // (red lenta, archivo inexistente, etc.), intentamos play() de todas formas.
    canPlayTimer = setTimeout(() => {
      canPlayTimer = null;
      audioEl.removeEventListener('canplay', onCanPlay);
      console.warn(`[AudioService] canplay timeout para ${genero}/${numero} — intentando play() de todas formas`);
      ejecutarPlay();
    }, CANPLAY_TIMEOUT_MS);

    // Llamar load() explícitamente para que Safari inicie la carga del buffer.
    // Sin load(), algunos navegadores (especialmente Safari macOS) no disparan
    // `canplay` hasta que se llama play(), creando un deadlock.
    audioEl.load();
  });
}

/**
 * Desbloquea el contexto de HTMLAudioElement en Safari/iOS y Android.
 *
 * En Safari (iOS y macOS) y Android, el autoplay de HTMLAudioElement está
 * bloqueado hasta que el usuario interactúa con la página. Esta función
 * debe llamarse directamente desde un handler de evento de usuario (tap/click)
 * para "desbloquear" el contexto de audio del navegador.
 *
 * Estrategia: crear un HTMLAudioElement silencioso, asignarle un src vacío
 * y llamar play() inmediatamente. Esto registra el gesto del usuario en el
 * contexto de audio del navegador, permitiendo que llamadas posteriores a
 * play() (incluso desde setInterval) funcionen correctamente.
 */
export function desbloquearAudioElement(): void {
  if (typeof Audio === 'undefined') return;
  try {
    // Crear un elemento de audio con un src de datos vacío (silencioso)
    // El src de datos garantiza que no hay petición de red y que el
    // elemento es válido para que Safari acepte el play().
    const el = new Audio();
    el.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    el.volume = 0;
    el.play().catch(() => {
      // Ignorar errores — el objetivo es solo registrar el gesto
    });
  } catch {
    // Ignorar cualquier error
  }
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

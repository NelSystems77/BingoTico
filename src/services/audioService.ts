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
 *     género seleccionado y los guarda como URLs en un Map.
 *   • Cada número tiene dos variantes: base (N.mp3) y variación (N_var.mp3).
 *     Se elige aleatoriamente cuál reproducir.
 *   • IMPORTANTE: En Safari/iOS y Android NO se reutilizan objetos Audio;
 *     se crea un nuevo HTMLAudioElement en cada reproducción para evitar
 *     el bloqueo de autoplay por reutilización de elementos.
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
 * Cache de URLs verificadas (fetch exitoso).
 * Guardamos solo la URL, NO el objeto Audio, para evitar problemas
 * de reutilización en Safari/iOS y Android.
 */
const cacheURLs = new Map<GeneroAudio, Map<number, { base: string; variacion: string }>>();

/** Indica si la precarga de un género ya fue iniciada (evita doble fetch) */
const precargaIniciada = new Set<GeneroAudio>();

/** Indica si la precarga de un género ya completó todos los archivos */
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
 * Verifica que una URL de audio sea accesible mediante fetch HEAD.
 * Más confiable que HTMLAudioElement.canplaythrough en Safari/iOS.
 * Devuelve la URL si es accesible, o null si falla.
 */
async function verificarURL(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url, { method: 'HEAD', cache: 'force-cache' });
    if (resp.ok) return url;
    return null;
  } catch {
    // fetch puede fallar en algunos entornos (CORS, offline, etc.)
    // En ese caso asumimos que la URL es válida para no bloquear el juego
    return url;
  }
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

  if (!cacheURLs.has(genero)) {
    cacheURLs.set(genero, new Map());
  }
  const mapaGenero = cacheURLs.get(genero)!;

  const total = TOTAL_NUMEROS * 2; // base + variación por número
  let cargados = 0;

  console.log(`[AudioService] Iniciando precarga de voz ${genero} (${TOTAL_NUMEROS} números × 2 variantes)`);

  // Cargamos de a lotes de 10 para no saturar la red
  const LOTE = 10;
  for (let inicio = 1; inicio <= TOTAL_NUMEROS; inicio += LOTE) {
    const fin = Math.min(inicio + LOTE - 1, TOTAL_NUMEROS);
    const promesas: Promise<void>[] = [];

    for (let n = inicio; n <= fin; n++) {
      const num = n;
      const urlBase = urlAudio(genero, num, false);
      const urlVar  = urlAudio(genero, num, true);

      const p = Promise.all([
        verificarURL(urlBase),
        verificarURL(urlVar),
      ])
        .then(([base, variacion]) => {
          // Guardar las URLs verificadas (o las originales si fetch falló)
          mapaGenero.set(num, {
            base:     base     ?? urlBase,
            variacion: variacion ?? urlVar,
          });
          cargados += 2;
          onProgreso?.(cargados, total);
        })
        .catch(() => {
          // Si falla, guardar las URLs de todas formas
          mapaGenero.set(num, { base: urlBase, variacion: urlVar });
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
 * CAMBIO CLAVE para Safari/iOS y Android:
 * • Se crea un NUEVO HTMLAudioElement en cada reproducción.
 *   Reutilizar el mismo elemento causa que Safari rechace play()
 *   porque el elemento ya no está "fresco" desde la interacción del usuario.
 * • Se retorna una Promise<boolean> que resuelve true si el audio
 *   se reprodujo correctamente, false si falló (para activar TTS fallback).
 *
 * @returns Promise<boolean> — true = reproducción exitosa, false = falló
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
  audioEl.preload = 'none'; // no precargar — solo reproducir cuando se llame play()
  audioEl.src = url;
  audioActivo = audioEl;

  return new Promise<boolean>((resolve) => {
    const onError = () => {
      cleanup();
      console.warn(`[AudioService] Error reproduciendo ${genero}/${numero} (${url})`);
      resolve(false);
    };

    const onEnded = () => {
      cleanup();
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
          resolve(true);
        })
        .catch((err) => {
          cleanup();
          // AutoPlay bloqueado o error de red → fallback TTS
          console.warn(`[AudioService] play() rechazado para ${genero}/${numero}:`, err);
          resolve(false);
        });
    } else {
      // Navegadores antiguos que no devuelven Promise (muy raro)
      resolve(true);
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

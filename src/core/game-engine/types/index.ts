// ========================================
// TYPES - BingoTico Game Engine
// ========================================

export type TipoJuego = 90 | 75 | 'custom';

export enum FasePartida {
  CALENTAMIENTO = 'calentamiento',
  MEDIA = 'media',
  JACKPOT = 'jackpot'
}

export enum TipoPremio {
  LINEA = 'linea',
  DOBLE_LINEA = 'dobleLinea',
  CARTON_LLENO = 'cartonLleno',
  JACKPOT = 'jackpot',
  ESQUINAS = 'esquinas',
  CRUZ = 'cruz',
}

export enum GameEvent {
  BOLA_SORTEADA = 'bolaSorteada',
  NUMERO_MARCADO = 'numeroMarcado',
  NEAR_MISS = 'nearMiss',
  RACHA_DETECTADA = 'rachaDetectada',
  HITO_ALCANZADO = 'hitoAlcanzado',
  PREMIO_GANADO = 'premioGanado',
  FASE_CAMBIADA = 'faseCambiada',
  PARTIDA_INICIADA = 'partidaIniciada',
  PARTIDA_FINALIZADA = 'partidaFinalizada',
}

// ========================================
// INTERFACES - CARTON
// ========================================

export interface Carton {
  id: string;
  jugadorId: string;
  tipo: TipoJuego;
  numeros: number[][];
  numerosMarcados: Set<number>;
  createdAt: number;
  qrCode?: string;
}

export interface CartonConfig {
  tipo: TipoJuego;
  numerosBolas: number;
}

export interface CartonGenerationResult {
  carton: Carton;
  hash: string;
  similitudMaxima: number;
}

// ========================================
// INTERFACES - SORTEO
// ========================================

export interface SorteoState {
  bolasDisponibles: number[];
  bolasSorteadas: number[];
  bolaActual: number | null;
  numeroTotalBolas: number;
}

export interface SorteoStats {
  totalSorteadas: number;
  distribucionPorDecena: Record<number, number>;
  entropiaShannon: number;
  coeficienteVariacion: number;
}

// ========================================
// INTERFACES - PREMIOS
// ========================================

export interface Premio {
  tipo: TipoPremio;
  puntos: number;
  multiplicador: number;
  jugadorId: string;
  cartonId: string;
  timestamp: number;
  numerosBola: number;
}

export interface ConfigPremio {
  tipo: TipoPremio;
  puntos: number;
  multiplicador: number;
  habilitado: boolean;
  condicion: (carton: Carton, bolasActuales: number[]) => boolean;
}

// ========================================
// INTERFACES - EMOCIÓN
// ========================================

export interface NearMissEvent {
  tipo: 'nearMiss';
  mensaje: string;
  intensidad: 'baja' | 'media' | 'alta';
  efectoVisual: string;
  numerosFaltantes: number;
  tipoPremio: TipoPremio;
}

export interface RachaEvent {
  tipo: 'racha';
  mensaje: string;
  efectoVisual: string;
  cantidadConsecutivos: number;
}

export interface HitoEvent {
  tipo: 'hito';
  mensaje: string;
  efecto: string;
  porcentaje: number;
}

export type EmotionEvent = NearMissEvent | RachaEvent | HitoEvent;

// ========================================
// INTERFACES - VERIFICACIÓN
// ========================================

export interface ResultadoVerificacion {
  esValido: boolean;
  numerosMarcados: number;
  numerosTotal: number;
  porcentajeCompleto: number;
  premiosGanados: Premio[];
  timestamp: number;
  errores?: string[];
}

// ========================================
// INTERFACES - PARTIDA
// ========================================

export interface Partida {
  id: string;
  eventoId: string;
  numeroPartida: number;
  fase: FasePartida;
  tipo: TipoJuego;
  numerosBolas: number;
  
  // Estado del sorteo
  sorteoState: SorteoState;
  
  // Cartones participantes
  cartones: Carton[];
  
  // Premios otorgados
  premiosOtorgados: Premio[];
  
  // Configuración de fase
  velocidadCantado: number;
  sonidoIntensidad: number;
  animacionVelocidad: number;
  premiosActivos: TipoPremio[];
  
  // Timestamps
  iniciada: number;
  finalizada?: number;
  
  // Estado
  activa: boolean;
}

export interface ConfigFase {
  fase: FasePartida;
  velocidadCantado: number;
  sonidoIntensidad: number;
  animacionVelocidad: number;
  premiosActivos: TipoPremio[];
}

// ========================================
// INTERFACES - EVENTO
// ========================================

export interface Evento {
  id: string;
  nombre: string;
  tipo: TipoJuego;
  numerosBolas: number;
  
  // Partidas del evento
  partidas: Partida[];
  partidaActual?: number;
  
  // Configuración
  maxJugadores: number;
  permitirMultiplesCartones: boolean;
  
  // Timestamps
  createdAt: number;
  iniciado?: number;
  finalizado?: number;
  
  // Link para compartir
  linkCompartir: string;
}

// ========================================
// INTERFACES - ANALÍTICAS
// ========================================

export interface MetricasPartida {
  // Justicia
  distribucionBolas: number[];
  entropiaShannon: number;
  coeficienteVariacion: number;
  
  // Experiencia
  tiempoPromedioLineaCompleta: number;
  porcentajeNearMiss: number;
  premiosDistribuidos: PremioStats[];
  
  // Engagement
  tasaAbandonoTemprano: number;
  satisfaccionPromedio: number;
  retencionPartidaSiguiente: number;
}

export interface PremioStats {
  tipo: TipoPremio;
  cantidad: number;
  porcentaje: number;
  bolasPromedio: number;
}

export interface Alerta {
  tipo: 'ERROR' | 'WARNING' | 'INFO';
  mensaje: string;
  accion: string;
  timestamp: number;
}

// ========================================
// INTERFACES - EVENTOS DEL SISTEMA
// ========================================

export interface GameEventPayload<T = any> {
  tipo: GameEvent;
  data: T;
  timestamp: number;
  partidaId: string;
}

export type GameEventCallback = (payload: GameEventPayload) => void;

// ========================================
// CONSTANTES
// ========================================

export const BINGO90_CONFIG = {
  filas: 3,
  columnas: 9,
  numerosPorFila: 5,
  numerosPorCarton: 15,
  rangoMinimo: 1,
  rangoMaximo: 90,
} as const;

export const BINGO75_CONFIG = {
  filas: 5,
  columnas: 5,
  numerosPorCarton: 24, // 25 - 1 FREE
  rangoMinimo: 1,
  rangoMaximo: 75,
  freeSpacePos: { fila: 2, columna: 2 },
} as const;

export const FASES_CONFIG: Record<FasePartida, ConfigFase> = {
  [FasePartida.CALENTAMIENTO]: {
    fase: FasePartida.CALENTAMIENTO,
    velocidadCantado: 4000,
    sonidoIntensidad: 0.7,
    animacionVelocidad: 1.0,
    premiosActivos: [TipoPremio.LINEA],
  },
  [FasePartida.MEDIA]: {
    fase: FasePartida.MEDIA,
    velocidadCantado: 3000,
    sonidoIntensidad: 0.85,
    animacionVelocidad: 1.3,
    premiosActivos: [TipoPremio.LINEA, TipoPremio.DOBLE_LINEA],
  },
  [FasePartida.JACKPOT]: {
    fase: FasePartida.JACKPOT,
    velocidadCantado: 2500,
    sonidoIntensidad: 1.0,
    animacionVelocidad: 1.5,
    premiosActivos: [
      TipoPremio.LINEA,
      TipoPremio.DOBLE_LINEA,
      TipoPremio.CARTON_LLENO,
      TipoPremio.JACKPOT,
    ],
  },
};

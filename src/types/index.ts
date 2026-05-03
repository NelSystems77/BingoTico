export type TipoJuego = 90 | 75 | 'custom';

export type FormatoCarton = 
  | 'lleno'
  | '4esquinas'
  | 'diagonal'
  | 'vertical'
  | 'horizontal'
  | 'T' | 'L' | 'F' | 'E' | 'O' | 'Z' | 'N' | 'I';

export interface Evento {
  id: string;
  nombre: string;
  fecha: string;
  tipoJuego: TipoJuego;
  numBolas: number;
  createdAt: number;
  shareLink: string;
}

export interface Carton {
  id: string;
  eventoId: string;
  codigo: string;
  qrCode: string;
  numeros: number[][];
  formato: FormatoCarton;
  createdAt: number;
}

export interface Configuracion {
  sonido: boolean;
  voz: 'masculina' | 'femenina';
  extraccion: 'automatica' | 'manual';
  tiempoExtraccion: number;
  repetirBola: boolean;
  puntos: {
    activado: boolean;
    linea: number;
    bingo: number;
  };
}

export interface Partida {
  id: string;
  eventoId: string;
  bolasExtraidas: number[];
  configuracion: Configuracion;
  ganadores: {
    linea?: { cartonId: string; codigo: string; timestamp: number };
    bingo?: { cartonId: string; codigo: string; timestamp: number };
  };
  estado: 'activa' | 'finalizada';
}

export interface LlamadaBola {
  number: number;
  call: string;
}

export interface CantadoData {
  version: string;
  locale: string;
  type: string;
  calls: LlamadaBola[];
}

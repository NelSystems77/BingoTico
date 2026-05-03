import { create } from 'zustand';
import type { Evento, Partida, Carton } from '../types';

/** Modo de cartones para el evento actual */
export type ModoCartones = 'digital' | 'fisico';

interface GameStore {
  evento: Evento | null;
  partida: Partida | null;
  cartones: Carton[];
  /** 'digital' → se generan y guardan cartones en la app.
   *  'fisico'  → los cartones son físicos; se omite la generación digital. */
  modoCartones: ModoCartones;
  setEvento: (evento: Evento) => void;
  setPartida: (partida: Partida) => void;
  addCarton: (carton: Carton) => void;
  setModoCartones: (modo: ModoCartones) => void;
  clearGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  evento: null,
  partida: null,
  cartones: [],
  modoCartones: 'digital',
  setEvento: (evento) => set({ evento }),
  setPartida: (partida) => set({ partida }),
  addCarton: (carton) =>
    set((state) => ({
      cartones: [...state.cartones, carton],
    })),
  setModoCartones: (modoCartones) => set({ modoCartones }),
  clearGame: () =>
    set({
      evento: null,
      partida: null,
      cartones: [],
      modoCartones: 'digital',
    }),
}));

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Configuracion } from '../types';

interface ConfigStore {
  config: Configuracion;
  updateConfig: (config: Partial<Configuracion>) => void;
  resetConfig: () => void;
}

const DEFAULT_CONFIG: Configuracion = {
  sonido: true,
  voz: 'masculina',
  extraccion: 'automatica',
  tiempoExtraccion: 5,
  repetirBola: false,
  puntos: {
    activado: false,
    linea: 50,
    bingo: 100,
  },
};

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set) => ({
      config: DEFAULT_CONFIG,
      updateConfig: (newConfig) =>
        set((state) => ({
          config: { ...state.config, ...newConfig },
        })),
      resetConfig: () => set({ config: DEFAULT_CONFIG }),
    }),
    {
      name: 'bingotico-config',
    }
  )
);

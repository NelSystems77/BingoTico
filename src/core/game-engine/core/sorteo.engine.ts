// ========================================
// SORTEO ENGINE - Motor de Sorteo Aleatorio
// ========================================

import type { SorteoState, SorteoStats } from '../types';
import { 
  calcularEntropiaShannon, 
  calcularCoeficienteVariacion,
  calcularDistribucionPorDecena,
  shuffleFisherYates 
} from '../utils/estadisticas';

export class SorteoEngine {
  private state: SorteoState;
  
  constructor(numeroTotalBolas: number) {
    // Inicializar con todas las bolas disponibles
    const bolas = Array.from({ length: numeroTotalBolas }, (_, i) => i + 1);
    
    // Fisher-Yates shuffle para pre-mezclar
    const bolasMezcladas = shuffleFisherYates(bolas);
    
    this.state = {
      bolasDisponibles: bolasMezcladas,
      bolasSorteadas: [],
      bolaActual: null,
      numeroTotalBolas,
    };
  }
  
  /**
   * Sortea la siguiente bola
   * Usa Fisher-Yates para garantizar aleatoriedad uniforme
   */
  sortearBola(): number {
    if (this.state.bolasDisponibles.length === 0) {
      throw new Error('No quedan bolas para sortear');
    }
    
    // Fisher-Yates: tomar índice aleatorio
    const indiceAleatorio = Math.floor(Math.random() * this.state.bolasDisponibles.length);
    const bola = this.state.bolasDisponibles[indiceAleatorio];
    
    // Remover de disponibles
    this.state.bolasDisponibles.splice(indiceAleatorio, 1);
    
    // Agregar a sorteadas
    this.state.bolasSorteadas.push(bola);
    this.state.bolaActual = bola;
    
    return bola;
  }
  
  /**
   * Sortea múltiples bolas de una vez
   */
  sortearMultiple(cantidad: number): number[] {
    const bolas: number[] = [];
    
    for (let i = 0; i < cantidad && this.state.bolasDisponibles.length > 0; i++) {
      bolas.push(this.sortearBola());
    }
    
    return bolas;
  }
  
  /**
   * Obtiene el estado actual del sorteo
   */
  getState(): Readonly<SorteoState> {
    return { ...this.state };
  }
  
  /**
   * Obtiene las bolas sorteadas hasta el momento
   */
  getBolasSorteadas(): readonly number[] {
    return [...this.state.bolasSorteadas];
  }
  
  /**
   * Obtiene la última bola sorteada
   */
  getBolaActual(): number | null {
    return this.state.bolaActual;
  }
  
  /**
   * Verifica si quedan bolas por sortear
   */
  hayBolasPendientes(): boolean {
    return this.state.bolasDisponibles.length > 0;
  }
  
  /**
   * Obtiene cuántas bolas han sido sorteadas
   */
  getCantidadSorteadas(): number {
    return this.state.bolasSorteadas.length;
  }
  
  /**
   * Obtiene estadísticas del sorteo actual
   * Útil para verificar justicia y aleatoriedad
   */
  getEstadisticas(): SorteoStats {
    const sorteadas = this.state.bolasSorteadas;
    
    return {
      totalSorteadas: sorteadas.length,
      distribucionPorDecena: calcularDistribucionPorDecena(sorteadas, this.state.numeroTotalBolas),
      entropiaShannon: calcularEntropiaShannon(sorteadas),
      coeficienteVariacion: calcularCoeficienteVariacion(
        Object.values(calcularDistribucionPorDecena(sorteadas, this.state.numeroTotalBolas))
      ),
    };
  }
  
  /**
   * Reinicia el sorteo (para nueva partida)
   */
  reiniciar(): void {
    const bolas = Array.from({ length: this.state.numeroTotalBolas }, (_, i) => i + 1);
    const bolasMezcladas = shuffleFisherYates(bolas);
    
    this.state = {
      bolasDisponibles: bolasMezcladas,
      bolasSorteadas: [],
      bolaActual: null,
      numeroTotalBolas: this.state.numeroTotalBolas,
    };
  }
  
  /**
   * Valida que el sorteo sea justo
   * Retorna true si pasa los tests de aleatoriedad
   */
  validarJusticia(): { esJusto: boolean; problemas: string[] } {
    const stats = this.getEstadisticas();
    const problemas: string[] = [];
    
    // Test 1: Entropía debe ser > 0.9
    if (stats.totalSorteadas >= 10 && stats.entropiaShannon < 0.9) {
      problemas.push(`Entropía baja (${stats.entropiaShannon.toFixed(3)}). Sorteo no suficientemente aleatorio.`);
    }
    
    // Test 2: Coeficiente de variación debe ser < 0.3
    if (stats.totalSorteadas >= 20 && stats.coeficienteVariacion > 0.3) {
      problemas.push(`Coeficiente de variación alto (${stats.coeficienteVariacion.toFixed(3)}). Distribución no uniforme.`);
    }
    
    // Test 3: No debe haber decenas completamente vacías (si hay suficientes bolas sorteadas)
    if (stats.totalSorteadas >= this.state.numeroTotalBolas / 2) {
      const decenasVacias = Object.values(stats.distribucionPorDecena).filter(v => v === 0).length;
      const totalDecenas = Object.keys(stats.distribucionPorDecena).length;
      
      if (decenasVacias > totalDecenas * 0.2) {
        problemas.push(`Demasiadas decenas vacías (${decenasVacias}/${totalDecenas}). Posible sesgo en sorteo.`);
      }
    }
    
    return {
      esJusto: problemas.length === 0,
      problemas,
    };
  }
  
  /**
   * Exporta el estado para persistencia
   */
  exportar(): SorteoState {
    return { ...this.state };
  }
  
  /**
   * Importa un estado previo (para recuperar partida)
   */
  static importar(state: SorteoState): SorteoEngine {
    const sorteo = new SorteoEngine(state.numeroTotalBolas);
    sorteo.state = { ...state };
    return sorteo;
  }
}

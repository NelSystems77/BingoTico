// ========================================
// CARTON GENERATOR - Generador de Cartones
// ========================================

import type { Carton, CartonConfig, CartonGenerationResult } from '../types';
import { BINGO90_CONFIG } from '../types';
import { calcularSimilitudJaccard, shuffleFisherYates } from '../utils/estadisticas';
import { generarCartonId, hashCartonSimple } from '../utils/hash';

/**
 * CartonGenerator
 *
 * Mejoras integradas:
 * - deepSanitizeForFirestore: convierte Sets y evita arrays anidados (convierte subarrays en objetos indexados).
 * - prepareCartonForFirestore: prepara un objeto seguro para setDoc().
 * - validateForFirestore: detecta arrays anidados.
 * - reconstructNumeros: reconstruye number[][] desde la forma guardada.
 *
 * Nota: la clase sigue trabajando en memoria con `numeros: number[][]` y `numerosMarcados: Set<number>`.
 * Antes de persistir en Firestore, usa `CartonGenerator.prepareCartonForFirestore(carton)`.
 */
export class CartonGenerator {
  private cartonesPrevios: Map<string, number[]> = new Map();
  private readonly SIMILITUD_MAXIMA = 0.75; // 75% de números iguales

  // ---------------------------
  // Public: generación principal
  // ---------------------------
  async generarCartonUnico(
    config: CartonConfig,
    jugadorId: string,
    intentosMax: number = 100
  ): Promise<CartonGenerationResult> {
    for (let intento = 0; intento < intentosMax; intento++) {
      const carton = this.generarCarton(config, jugadorId);
      const hash = hashCartonSimple(carton);

      // Verificar si es duplicado exacto
      if (this.cartonesPrevios.has(hash)) {
        continue;
      }

      // Verificar similitud con cartones recientes
      const similitudMaxima = this.calcularSimilitudMaxima(carton);

      if (similitudMaxima < this.SIMILITUD_MAXIMA) {
        // Cartón válido y único
        const numerosPlanos = carton.numeros.flat().filter(n => n > 0);
        this.cartonesPrevios.set(hash, numerosPlanos);

        // Mantener solo últimos 100 cartones en memoria
        if (this.cartonesPrevios.size > 100) {
          const primerKey = this.cartonesPrevios.keys().next().value as string;
          this.cartonesPrevios.delete(primerKey);
        }

        return {
          carton,
          hash,
          similitudMaxima,
        };
      }
    }

    throw new Error(`No se pudo generar cartón único después de ${intentosMax} intentos`);
  }

  // ---------------------------
  // Generadores por tipo
  // ---------------------------
  private generarCarton(config: CartonConfig, jugadorId: string): Carton {
    if (config.tipo === 90) {
      return this.generarCartonBingo90(jugadorId);
    } else if (config.tipo === 75) {
      return this.generarCartonBingo75(jugadorId);
    } else {
      return this.generarCartonCustom(config, jugadorId);
    }
  }

  private generarCartonBingo90(jugadorId: string): Carton {
    const numeros: number[][] = [];

    // 3 filas x 9 columnas
    for (let fila = 0; fila < BINGO90_CONFIG.filas; fila++) {
      const filaNumeros: number[] = [];
      for (let col = 0; col < BINGO90_CONFIG.columnas; col++) {
        filaNumeros.push(0); // Inicializar con 0 (vacío)
      }
      numeros.push(filaNumeros);
    }

    // Generar números para cada columna
    for (let col = 0; col < BINGO90_CONFIG.columnas; col++) {
      const rangoMin = col === 0 ? 1 : col * 10;
      const rangoMax = col === 8 ? 90 : (col + 1) * 10 - 1;

      // Generar pool de números para esta columna
      const pool: number[] = [];
      for (let n = rangoMin; n <= rangoMax; n++) pool.push(n);

      // Seleccionar aleatoriamente cuántos números poner en esta columna (1-3)
      const cantidadNumeros = Math.min(3, pool.length);
      const numerosSeleccionados = shuffleFisherYates(pool).slice(0, cantidadNumeros);
      numerosSeleccionados.sort((a, b) => a - b);

      // Distribuir en filas aleatorias
      const filasDisponibles = [0, 1, 2];
      const filasSeleccionadas = shuffleFisherYates(filasDisponibles).slice(0, cantidadNumeros);
      filasSeleccionadas.sort((a, b) => a - b);

      filasSeleccionadas.forEach((fila, idx) => {
        numeros[fila][col] = numerosSeleccionados[idx];
      });
    }

    // Asegurar que cada fila tenga exactamente 5 números
    for (let fila = 0; fila < BINGO90_CONFIG.filas; fila++) {
      const cantidadEnFila = numeros[fila].filter(n => n > 0).length;
      if (cantidadEnFila < 5) {
        this.ajustarFilaBingo90(numeros, fila);
      } else if (cantidadEnFila > 5) {
        this.reducirFilaBingo90(numeros, fila);
      }
    }

    return {
      id: generarCartonId(),
      jugadorId,
      tipo: 90,
      numeros,
      numerosMarcados: new Set<number>(),
      createdAt: Date.now(),
    };
  }

  private ajustarFilaBingo90(numeros: number[][], fila: number): void {
    const cantidadActual = numeros[fila].filter(n => n > 0).length;
    const faltantes = 5 - cantidadActual;

    for (let i = 0; i < faltantes; i++) {
      const columnasVacias = numeros[fila]
        .map((n, idx) => (n === 0 ? idx : -1))
        .filter(idx => idx !== -1);

      if (columnasVacias.length === 0) break;

      const colSeleccionada = columnasVacias[Math.floor(Math.random() * columnasVacias.length)];

      const rangoMin = colSeleccionada === 0 ? 1 : colSeleccionada * 10;
      const rangoMax = colSeleccionada === 8 ? 90 : (colSeleccionada + 1) * 10 - 1;

      const numerosEnColumna = numeros.map(f => f[colSeleccionada]).filter(n => n > 0);
      const numerosDisponibles: number[] = [];

      for (let n = rangoMin; n <= rangoMax; n++) {
        if (!numerosEnColumna.includes(n)) numerosDisponibles.push(n);
      }

      if (numerosDisponibles.length > 0) {
        const numeroSeleccionado = numerosDisponibles[Math.floor(Math.random() * numerosDisponibles.length)];
        numeros[fila][colSeleccionada] = numeroSeleccionado;
      }
    }
  }

  private reducirFilaBingo90(numeros: number[][], fila: number): void {
    const cantidadActual = numeros[fila].filter(n => n > 0).length;
    const sobrantes = cantidadActual - 5;

    for (let i = 0; i < sobrantes; i++) {
      const columnasConNumeros = numeros[fila]
        .map((n, idx) => (n > 0 ? idx : -1))
        .filter(idx => idx !== -1);

      if (columnasConNumeros.length === 0) break;

      const colSeleccionada = columnasConNumeros[Math.floor(Math.random() * columnasConNumeros.length)];
      numeros[fila][colSeleccionada] = 0;
    }
  }

  private generarCartonBingo75(jugadorId: string): Carton {
    const numeros: number[][] = [];

    // 5 columnas: B(1-15), I(16-30), N(31-45), G(46-60), O(61-75)
    const rangos = [
      [1, 15],   // B
      [16, 30],  // I
      [31, 45],  // N
      [46, 60],  // G
      [61, 75],  // O
    ];

    for (let col = 0; col < 5; col++) {
      const [min, max] = rangos[col];
      const pool: number[] = [];
      for (let n = min; n <= max; n++) pool.push(n);

      // Seleccionar 5 números aleatorios de esta columna
      const numerosColumna = shuffleFisherYates(pool).slice(0, 5);
      numerosColumna.sort((a, b) => a - b);

      // Agregar a la matriz (transpuesta)
      for (let fila = 0; fila < 5; fila++) {
        if (!numeros[fila]) numeros[fila] = [];
        // FREE space en el centro (fila 2, col 2)
        if (fila === 2 && col === 2) {
          numeros[fila][col] = 0; // 0 = FREE
        } else {
          numeros[fila][col] = numerosColumna[fila];
        }
      }
    }

    return {
      id: generarCartonId(),
      jugadorId,
      tipo: 75,
      numeros,
      numerosMarcados: new Set<number>([0]), // FREE space ya marcado
      createdAt: Date.now(),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private generarCartonCustom(_config: CartonConfig, jugadorId: string): Carton {
    // Por ahora, usar lógica de Bingo 90 adaptada
    // TODO: Implementar lógica customizable
    return this.generarCartonBingo90(jugadorId);
  }

  // ---------------------------
  // Similitud y cache
  // ---------------------------
  private calcularSimilitudMaxima(carton: Carton): number {
    const numerosCarton = carton.numeros.flat().filter(n => n > 0);
    let maxSimilitud = 0;

    for (const [, numerosOtro] of this.cartonesPrevios) {
      const similitud = calcularSimilitudJaccard(numerosCarton, numerosOtro);
      maxSimilitud = Math.max(maxSimilitud, similitud);
    }

    return maxSimilitud;
  }

  limpiarCache(): void {
    this.cartonesPrevios.clear();
  }

  // ---------------------------
  // Utilities: Firestore-safe
  // ---------------------------

  /**
   * deepSanitizeForFirestore
   * - Convierte Set -> Array
   * - Convierte cualquier array que contenga arrays en objetos indexados en todos los niveles
   * - Sanitiza recursivamente objetos y arrays
   */
  static deepSanitizeForFirestore(value: any): any {
    if (value instanceof Set) {
      return Array.from(value).map(v => CartonGenerator.deepSanitizeForFirestore(v));
    }

    if (Array.isArray(value)) {
      // Convertir cada elemento; si el elemento es array, lo transforma a objeto indexado
      return value.map(el => {
        if (Array.isArray(el)) {
          const obj: Record<string, any> = {};
          el.forEach((v, i) => {
            obj[i] = CartonGenerator.deepSanitizeForFirestore(v);
          });
          return obj;
        } else if (el && typeof el === 'object') {
          return CartonGenerator.deepSanitizeForFirestore(el);
        } else {
          return el;
        }
      });
    }

    if (value && typeof value === 'object') {
      const out: Record<string, any> = {};
      for (const k of Object.keys(value)) {
        out[k] = CartonGenerator.deepSanitizeForFirestore(value[k]);
      }
      return out;
    }

    return value;
  }

  /**
   * prepareCartonForFirestore
   * - Prepara un objeto listo para setDoc() sin arrays anidados ni Sets.
   * - No modifica el Carton original.
   */
  static prepareCartonForFirestore(carton: Carton): Record<string, any> {
    return {
      id: carton.id,
      jugadorId: carton.jugadorId,
      tipo: carton.tipo,
      createdAt: carton.createdAt,
      numeros: CartonGenerator.deepSanitizeForFirestore(carton.numeros),
      numerosMarcados: CartonGenerator.deepSanitizeForFirestore(carton.numerosMarcados),
      // Añadir aquí otros campos sanitizados si existen en Carton
    };
  }

  /**
   * reconstructNumeros
   * - Reconstruye number[][] desde la forma guardada (objeto indexado por filas o array plano)
   */
  static reconstructNumeros(stored: any): number[][] {
    if (Array.isArray(stored)) {
      // Array plano: asumimos que es number[][]
      return stored as number[][];
    }

    // Si es objeto indexado por filas
    const filaKeys = Object.keys(stored).sort((a, b) => Number(a) - Number(b));
    const filas: number[][] = filaKeys.map(fKey => {
      const rowObj = stored[fKey];
      // rowObj puede ser array plano o objeto indexado
      if (Array.isArray(rowObj)) {
        return rowObj as number[];
      }
      const colKeys = Object.keys(rowObj).sort((a, b) => Number(a) - Number(b));
      return colKeys.map(cKey => rowObj[cKey]);
    });

    return filas;
  }

  /**
   * validateForFirestore
   * - Retorna false si detecta arrays anidados en el objeto
   */
  static validateForFirestore(obj: any): boolean {
    let ok = true;
    function walk(x: any) {
      if (!ok) return;
      if (Array.isArray(x)) {
        for (const el of x) {
          if (Array.isArray(el)) {
            ok = false;
            return;
          }
          if (el && typeof el === 'object') walk(el);
          if (!ok) return;
        }
      } else if (x && typeof x === 'object') {
        for (const k of Object.keys(x)) {
          walk(x[k]);
          if (!ok) return;
        }
      }
    }
    walk(obj);
    return ok;
  }
}
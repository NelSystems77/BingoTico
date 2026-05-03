// ========================================
// UTILS - Estadísticas
// ========================================

/**
 * Calcula la entropía de Shannon de una distribución
 * Valor ideal: cercano a 1.0 (máxima aleatoriedad)
 */
export function calcularEntropiaShannon(valores: number[]): number {
  if (valores.length === 0) return 0;
  
  const frecuencias = new Map<number, number>();
  valores.forEach(v => frecuencias.set(v, (frecuencias.get(v) || 0) + 1));
  
  const total = valores.length;
  let entropia = 0;
  
  frecuencias.forEach(frecuencia => {
    const probabilidad = frecuencia / total;
    if (probabilidad > 0) {
      entropia -= probabilidad * Math.log2(probabilidad);
    }
  });
  
  // Normalizar a [0, 1]
  const entropiaMaxima = Math.log2(frecuencias.size);
  return entropiaMaxima > 0 ? entropia / entropiaMaxima : 0;
}

/**
 * Calcula el coeficiente de variación (CV)
 * Valor ideal: bajo (distribución uniforme)
 */
export function calcularCoeficienteVariacion(valores: number[]): number {
  if (valores.length === 0) return 0;
  
  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  const varianza = valores.reduce((acc, v) => acc + Math.pow(v - media, 2), 0) / valores.length;
  const desviacion = Math.sqrt(varianza);
  
  return media !== 0 ? desviacion / media : 0;
}

/**
 * Calcula la distribución por decenas (para Bingo 90)
 */
export function calcularDistribucionPorDecena(bolas: number[], max: number = 90): Record<number, number> {
  const distribucion: Record<number, number> = {};
  const numDecenas = Math.ceil(max / 10);
  
  // Inicializar todas las decenas en 0
  for (let i = 0; i < numDecenas; i++) {
    distribucion[i] = 0;
  }
  
  // Contar frecuencias
  bolas.forEach(bola => {
    const decena = Math.floor((bola - 1) / 10);
    distribucion[decena] = (distribucion[decena] || 0) + 1;
  });
  
  return distribucion;
}

/**
 * Test de Chi-Cuadrado para uniformidad
 * Retorna p-value (si < 0.05, no es uniforme)
 */
export function testChiCuadrado(observados: number[], esperados?: number[]): number {
  if (observados.length === 0) return 1;
  
  const n = observados.length;
  const esperado = esperados || new Array(n).fill(observados.reduce((a, b) => a + b, 0) / n);
  
  let chiCuadrado = 0;
  for (let i = 0; i < n; i++) {
    if (esperado[i] > 0) {
      chiCuadrado += Math.pow(observados[i] - esperado[i], 2) / esperado[i];
    }
  }
  
  // Grados de libertad
  const gl = n - 1;
  
  // Aproximación de p-value (simplificada)
  // En producción, usar librería estadística completa
  return chiCuadrado / (2 * gl);
}

/**
 * Calcula similitud entre dos arrays de números (Jaccard)
 * Retorna valor entre 0 (diferentes) y 1 (idénticos)
 */
export function calcularSimilitudJaccard(a: number[], b: number[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  
  const interseccion = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  
  return union.size > 0 ? interseccion.size / union.size : 0;
}

/**
 * Genera un número aleatorio criptográficamente seguro
 */
export function randomSeguro(min: number, max: number): number {
  const rango = max - min + 1;
  const bytesNecesarios = Math.ceil(Math.log2(rango) / 8);
  const maxValorBytes = Math.pow(256, bytesNecesarios);
  const limite = Math.floor(maxValorBytes / rango) * rango;
  
  let random: number;
  do {
    const bytes = crypto.getRandomValues(new Uint8Array(bytesNecesarios));
    random = bytes.reduce((acc, byte, i) => acc + byte * Math.pow(256, i), 0);
  } while (random >= limite);
  
  return min + (random % rango);
}

/**
 * Fisher-Yates Shuffle (in-place)
 */
export function shuffleFisherYates<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Calcula percentil de un array
 */
export function calcularPercentil(valores: number[], percentil: number): number {
  if (valores.length === 0) return 0;
  
  const sorted = [...valores].sort((a, b) => a - b);
  const indice = Math.ceil((percentil / 100) * sorted.length) - 1;
  
  return sorted[Math.max(0, indice)];
}

/**
 * Calcula estadísticas descriptivas básicas
 */
export interface EstadisticasDescriptivas {
  media: number;
  mediana: number;
  moda: number;
  desviacion: number;
  minimo: number;
  maximo: number;
  p25: number;
  p75: number;
}

export function calcularEstadisticas(valores: number[]): EstadisticasDescriptivas {
  if (valores.length === 0) {
    return {
      media: 0,
      mediana: 0,
      moda: 0,
      desviacion: 0,
      minimo: 0,
      maximo: 0,
      p25: 0,
      p75: 0,
    };
  }
  
  const sorted = [...valores].sort((a, b) => a - b);
  
  // Media
  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  
  // Mediana
  const mediana = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  
  // Moda
  const frecuencias = new Map<number, number>();
  valores.forEach(v => frecuencias.set(v, (frecuencias.get(v) || 0) + 1));
  const moda = [...frecuencias.entries()].reduce((a, b) => b[1] > a[1] ? b : a)[0];
  
  // Desviación estándar
  const varianza = valores.reduce((acc, v) => acc + Math.pow(v - media, 2), 0) / valores.length;
  const desviacion = Math.sqrt(varianza);
  
  return {
    media,
    mediana,
    moda,
    desviacion,
    minimo: sorted[0],
    maximo: sorted[sorted.length - 1],
    p25: calcularPercentil(valores, 25),
    p75: calcularPercentil(valores, 75),
  };
}

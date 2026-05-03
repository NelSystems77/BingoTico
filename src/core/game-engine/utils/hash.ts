// ========================================
// UTILS - Hash
// ========================================

import type { Carton } from '../types';

/**
 * Genera un hash SHA-256 de un cartón
 * Usado para detectar cartones duplicados
 */
export async function hashCarton(carton: Carton): Promise<string> {
  // Normalizar los números del cartón (ordenados y únicos)
  const numerosUnicos = Array.from(new Set(carton.numeros.flat())).sort((a, b) => a - b);
  const texto = numerosUnicos.join(',');
  
  // Usar Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(texto);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Versión síncrona simple (para environments sin crypto.subtle)
 */
export function hashCartonSimple(carton: Carton): string {
  const numerosUnicos = Array.from(new Set(carton.numeros.flat())).sort((a, b) => a - b);
  return numerosUnicos.join('-');
}

/**
 * Genera un ID único para cartón
 */
export function generarCartonId(): string {
  return `carton-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Genera un ID único para partida
 */
export function generarPartidaId(eventoId: string, numeroPartida: number): string {
  return `${eventoId}-partida-${numeroPartida}`;
}

/**
 * Genera un ID único para evento
 */
export function generarEventoId(): string {
  return `evento-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Genera código QR data para un cartón
 */
export function generarQRData(carton: Carton): string {
  return JSON.stringify({
    id: carton.id,
    tipo: carton.tipo,
    numeros: carton.numeros,
    timestamp: carton.createdAt,
  });
}

/**
 * Decodifica QR data de un cartón
 */
export function decodificarQRData(qrData: string): Partial<Carton> | null {
  try {
    const data = JSON.parse(qrData);
    return {
      id: data.id,
      tipo: data.tipo,
      numeros: data.numeros,
      createdAt: data.timestamp,
    };
  } catch {
    return null;
  }
}

/**
 * Genera un link compartible para evento
 */
export function generarLinkEvento(eventoId: string, baseUrl: string = window.location.origin): string {
  return `${baseUrl}/evento/${eventoId}`;
}

/**
 * Extrae eventoId de un link compartible
 */
export function extraerEventoIdDeLink(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const eventoIndex = pathParts.indexOf('evento');
    
    if (eventoIndex !== -1 && pathParts[eventoIndex + 1]) {
      return pathParts[eventoIndex + 1];
    }
    
    return null;
  } catch {
    return null;
  }
}

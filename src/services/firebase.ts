import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import type { Evento, Partida, Carton } from '../types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Firestore does NOT support nested arrays (number[][]).
 * We serialize numeros as a flat array with a row-length marker so it can
 * be reconstructed on read without losing structure.
 *
 * Stored shape: { ...carton, numeros: number[], numerosRowLen: number }
 * The original Carton.numeros (number[][]) is never sent directly to Firestore.
 */
function serializeCartonForFirestore(carton: Carton): Record<string, unknown> {
  const rowLen = carton.numeros[0]?.length ?? 0;
  return {
    id: carton.id,
    eventoId: carton.eventoId,
    codigo: carton.codigo,
    qrCode: carton.qrCode,
    // Flatten the 2-D array into a 1-D array
    numeros: carton.numeros.flat(),
    numerosRowLen: rowLen,
    formato: carton.formato,
    createdAt: carton.createdAt,
  };
}

function deserializeCartonFromFirestore(data: Record<string, unknown>): Carton {
  const flat = (data.numeros as number[]) ?? [];
  const rowLen = (data.numerosRowLen as number) || flat.length;
  const numeros: number[][] = [];
  for (let i = 0; i < flat.length; i += rowLen) {
    numeros.push(flat.slice(i, i + rowLen));
  }
  return {
    id: data.id as string,
    eventoId: data.eventoId as string,
    codigo: data.codigo as string,
    qrCode: data.qrCode as string,
    numeros,
    formato: data.formato as Carton['formato'],
    createdAt: data.createdAt as number,
  };
}

export const firebaseService = {
  // Eventos
  async createEvento(evento: Omit<Evento, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'eventos'), evento);
    return docRef.id;
  },

  async getEvento(id: string): Promise<Evento | null> {
    const docRef = doc(db, 'eventos', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Evento;
    }
    return null;
  },

  // Partidas
  async createPartida(partida: Omit<Partida, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'partidas'), partida);
    return docRef.id;
  },

  async updatePartida(id: string, partida: Partial<Partida>): Promise<void> {
    const docRef = doc(db, 'partidas', id);
    // Cast through `any` to satisfy Firestore's strict FieldValue union type
    // while keeping the public API typed as Partial<Partida>.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateDoc(docRef, partida as any);
  },

  async getPartida(id: string): Promise<Partida | null> {
    const docRef = doc(db, 'partidas', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Partida;
    }
    return null;
  },

  // Cartones
  async saveCarton(carton: Carton): Promise<void> {
    const docRef = doc(db, 'cartones', carton.id);
    // Serialize to avoid Firestore's nested-array restriction
    await setDoc(docRef, serializeCartonForFirestore(carton));
  },

  async getCarton(id: string): Promise<Carton | null> {
    const docRef = doc(db, 'cartones', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return deserializeCartonFromFirestore(docSnap.data() as Record<string, unknown>);
    }
    return null;
  },
};

import QRCode from 'qrcode';
import type { LlamadaBola } from '../types';
import { reproducirNumero, detenerTodoAudio } from '../services/audioService';
import type { GeneroAudio } from '../services/audioService';

// Generar código único de cartón
export function generarCodigoCarton(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin I, O, 0, 1
  let codigo = '';
  for (let i = 0; i < 8; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
}

// Generar QR code
export async function generarQRCode(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      width: 256,
      margin: 2,
      errorCorrectionLevel: 'M',
    });
  } catch (error) {
    console.error('Error generando QR:', error);
    return '';
  }
}

// Generar números aleatorios únicos
export function generarNumerosAleatorios(min: number, max: number, cantidad: number): number[] {
  const numeros: number[] = [];
  const disponibles = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  
  for (let i = 0; i < cantidad; i++) {
    const index = Math.floor(Math.random() * disponibles.length);
    numeros.push(disponibles[index]);
    disponibles.splice(index, 1);
  }
  
  return numeros.sort((a, b) => a - b);
}

// ============================================================
// CANTADO CON VARIACIONES — Sabor costarricense auténtico
// Cada número tiene 3-4 variaciones que se eligen al azar
// ============================================================

const variacionesCantado: { [key: number]: string[] } = {
  1: [
    "El primero de la tanda, el uno",
    "El que abre el juego, el uno",
    "Arrancamos, el uno",
    "El uno",
  ],
  2: [
    "El patito solo en el agua, el dos",
    "Cuac cuac, el patito, el dos",
    "Solito el patito, el dos",
    "El dos",
  ],
  3: [
    "La Santísima Trinidad, el tres",
    "Padre, Hijo y Espíritu Santo, el tres",
    "La Trinidad bendita, el tres",
    "El tres",
  ],
  4: [
    "La silla al revés, el cuatro",
    "Como las patas del gato, el cuatro",
    "La sillita volteada, el cuatro",
    "El cuatro",
  ],
  5: [
    "Los dedos de la mano, el cinco",
    "Una manita entera, el cinco",
    "Los cinco sentidos, el cinco",
    "El cinco",
  ],
  6: [
    "Media docena, el seis",
    "Media docena de huevos, el seis",
    "La mitad de la docena, el seis",
    "El seis",
  ],
  7: [
    "El hacha del abuelo, el siete",
    "El número de la suerte, el siete",
    "El hacha bien afilada, el siete",
    "El siete",
  ],
  8: [
    "Comiendo bizcocho, el ocho",
    "Bizcocho con chocolate, el ocho",
    "Qué rico el bizcocho, el ocho",
    "El ocho",
  ],
  9: [
    "El rabo del chancho, el nueve",
    "El rabito enrollado, el nueve",
    "Rabo de chancho, el nueve",
    "El nueve",
  ],
  10: [
    "La primera decena completa, el diez",
    "Cerramos la primera decena, el diez",
    "Diez deditos, el diez",
    "El diez",
  ],
  11: [
    "Las dos estacas del potrero, el once",
    "Dos palitos derechos, el once",
    "Las dos estaquitas, el once",
    "El once",
  ],
  12: [
    "La docena completa, el doce",
    "Una docena entera, el doce",
    "Docena de huevos, el doce",
    "El doce",
  ],
  13: [
    "La mala suerte, el trece",
    "Cuidado con la mala suerte, el trece",
    "Que no nos traiga mala suerte, el trece",
    "El trece",
  ],
  14: [
    "Borracho y sin plata, el catorce",
    "Borrachito y sin un cinco, el catorce",
    "Borracho y pelado, el catorce",
    "El catorce",
  ],
  15: [
    "La niña bonita, el quince",
    "La quinceañera del barrio, el quince",
    "Ay ay ay, la niña bonita, el quince",
    "El quince",
  ],
  16: [
    "Apenas para el café, el dieciséis",
    "Lo justo para el cafecito, el dieciséis",
    "Para el café nomás, el dieciséis",
    "El dieciséis",
  ],
  17: [
    "Suerte que se mete, el diecisiete",
    "La suerte que se cuela, el diecisiete",
    "Se mete la suerte, el diecisiete",
    "El diecisiete",
  ],
  18: [
    "Ya huele a sancocho, el dieciocho",
    "Qué rico ese sancocho, el dieciocho",
    "Sancocho en la olla, el dieciocho",
    "El dieciocho",
  ],
  19: [
    "Casi los veinte, el diecinueve",
    "Un pasito antes de los veinte, el diecinueve",
    "Falta uno para los veinte, el diecinueve",
    "El diecinueve",
  ],
  20: [
    "La mitad de la bolsa, el veinte",
    "La pura mitad, el veinte",
    "Veintito redondo, el veinte",
    "El veinte",
  ],
  21: [
    "El que no sabe nada, el veintiuno",
    "El que no sabe ni jota, el veintiuno",
    "Sin saber nada, el veintiuno",
    "El veintiuno",
  ],
  22: [
    "Los dos patitos en el agua, el veintidós",
    "Cuac cuac, los dos patitos, el veintidós",
    "Dos patitos nadando juntos, el veintidós",
    "El veintidós",
  ],
  23: [
    "Vuelva a fijarse, el veintitrés",
    "Fíjese bien en su cartón, el veintitrés",
    "A fijarse bien, el veintitrés",
    "El veintitrés",
  ],
  24: [
    "La víspera de Navidad, el veinticuatro",
    "Nochebuena, el veinticuatro",
    "La noche buena, el veinticuatro",
    "El veinticuatro",
  ],
  25: [
    "El día del Niño Dios, el veinticinco",
    "Navidad, el veinticinco",
    "Nació el Niño Dios, el veinticinco",
    "El veinticinco",
  ],
  26: [
    "Como debe de ser, el veintiséis",
    "Así es como debe ser, el veintiséis",
    "Como tiene que ser, el veintiséis",
    "El veintiséis",
  ],
  27: [
    "Apriete ese cartón, el veintisiete",
    "Apriételo bien, el veintisiete",
    "A apretar ese cartón, el veintisiete",
    "El veintisiete",
  ],
  28: [
    "Qué lindo derroche, el veintiocho",
    "Derroche de suerte, el veintiocho",
    "Lindo derroche, el veintiocho",
    "El veintiocho",
  ],
  29: [
    "Antes de los treinta, el veintinueve",
    "Un pasito antes de los treinta, el veintinueve",
    "Falta uno para los treinta, el veintinueve",
    "El veintinueve",
  ],
  30: [
    "La cosa calienta, el treinta",
    "Esto se está poniendo bueno, el treinta",
    "Ya calienta la cosa, el treinta",
    "El treinta",
  ],
  31: [
    "Siga el vacilón, el treinta y uno",
    "El vacilón continúa, el treinta y uno",
    "Vacilón total, el treinta y uno",
    "El treinta y uno",
  ],
  32: [
    "Vámonos los dos, el treinta y dos",
    "Los dos de la mano, el treinta y dos",
    "Vámonos que es tarde, el treinta y dos",
    "El treinta y dos",
  ],
  33: [
    "La edad de Cristo, el treinta y tres",
    "La edad del Señor, el treinta y tres",
    "La edad de Jesucristo, el treinta y tres",
    "El treinta y tres",
  ],
  34: [
    "La cabeza del gato, el treinta y cuatro",
    "Cabeza de gato, el treinta y cuatro",
    "La cabecita del gato, el treinta y cuatro",
    "El treinta y cuatro",
  ],
  35: [
    "El propio loco, el treinta y cinco",
    "El loco del pueblo, el treinta y cinco",
    "El propio loquillo, el treinta y cinco",
    "El treinta y cinco",
  ],
  36: [
    "Busque que busque, el treinta y seis",
    "A buscar en el cartón, el treinta y seis",
    "Búsquelo bien, el treinta y seis",
    "El treinta y seis",
  ],
  37: [
    "La puritica suerte, el treinta y siete",
    "Pura suerte, el treinta y siete",
    "Suerte pura y dura, el treinta y siete",
    "El treinta y siete",
  ],
  38: [
    "El que se trasnocha, el treinta y ocho",
    "Trasnochado pero aquí, el treinta y ocho",
    "Trasnochando por el bingo, el treinta y ocho",
    "El treinta y ocho",
  ],
  39: [
    "El que se sacude, el treinta y nueve",
    "Sacúdase que viene, el treinta y nueve",
    "Sacúdase el sueño, el treinta y nueve",
    "El treinta y nueve",
  ],
  40: [
    "Esto se puso bueno, el cuarenta",
    "Ya esto está buenísimo, el cuarenta",
    "Qué bueno se puso esto, el cuarenta",
    "El cuarenta",
  ],
  41: [
    "Cae uno por uno, el cuarenta y uno",
    "Cayendo uno a uno, el cuarenta y uno",
    "Uno a uno, el cuarenta y uno",
    "El cuarenta y uno",
  ],
  42: [
    "El que anda perdido, el cuarenta y dos",
    "Perdidito por ahí, el cuarenta y dos",
    "El perdido del barrio, el cuarenta y dos",
    "El cuarenta y dos",
  ],
  43: [
    "Bien que se la sabe, el cuarenta y tres",
    "Se la sabe de memoria, el cuarenta y tres",
    "Se la sabe bien, el cuarenta y tres",
    "El cuarenta y tres",
  ],
  44: [
    "Las dos sillitas de la escuela, el cuarenta y cuatro",
    "Dos sillitas juntas, el cuarenta y cuatro",
    "Sillitas de la escuelita, el cuarenta y cuatro",
    "El cuarenta y cuatro",
  ],
  45: [
    "La mitad del camino, el cuarenta y cinco",
    "Ya vamos a la mitad, el cuarenta y cinco",
    "La mitad del trayecto, el cuarenta y cinco",
    "El cuarenta y cinco",
  ],
  46: [
    "Todo pura vida, el cuarenta y seis",
    "Pura vida mae, el cuarenta y seis",
    "Todo bien, pura vida, el cuarenta y seis",
    "El cuarenta y seis",
  ],
  47: [
    "Suerte que no se escapa, el cuarenta y siete",
    "La suerte no se escapa, el cuarenta y siete",
    "Suerte atrapada, el cuarenta y siete",
    "El cuarenta y siete",
  ],
  48: [
    "El viejo chocho, el cuarenta y ocho",
    "El viejito chocho, el cuarenta y ocho",
    "Chocho pero aquí, el cuarenta y ocho",
    "El cuarenta y ocho",
  ],
  49: [
    "Que nadie se duerma, el cuarenta y nueve",
    "Despiertos todos, el cuarenta y nueve",
    "Ojos abiertos, el cuarenta y nueve",
    "El cuarenta y nueve",
  ],
  50: [
    "La media teja, el cincuenta",
    "Media tejita, el cincuenta",
    "La mitad de la teja, el cincuenta",
    "El cincuenta",
  ],
  51: [
    "Ya falta poquito, el cincuenta y uno",
    "Poquito falta ya, el cincuenta y uno",
    "Falta poquitito, el cincuenta y uno",
    "El cincuenta y uno",
  ],
  52: [
    "Sin codos, el cincuenta y dos",
    "A rezar se ha dicho, el cincuenta y dos",
    "Un rezito no hace daño, el cincuenta y dos",
    "El cincuenta y dos",
  ],
  53: [
    "No se me quede, el cincuenta y tres",
    "No se quede atrás, el cincuenta y tres",
    "No se me pierda, el cincuenta y tres",
    "El cincuenta y tres",
  ],
  54: [
    "Cuidado con el gato, el cincuenta y cuatro",
    "Ojo con el gato, el cincuenta y cuatro",
    "El gato está al acecho, el cincuenta y cuatro",
    "El cincuenta y cuatro",
  ],
  55: [
    "Los dos cincos de la mano, el cincuenta y cinco",
    "Dos manitas de cinco, el cincuenta y cinco",
    "Dos veces cinco, el cincuenta y cinco",
    "El cincuenta y cinco",
  ],
  56: [
    "Póngale un grano de maíz, el cincuenta y seis",
    "Un granito de maíz, el cincuenta y seis",
    "Maicito en el cartón, el cincuenta y seis",
    "El cincuenta y seis",
  ],
  57: [
    "Apriete y apriete, el cincuenta y siete",
    "Apretando el cartón, el cincuenta y siete",
    "Apriételo bien, el cincuenta y siete",
    "El cincuenta y siete",
  ],
  58: [
    "Bien tostado el pan, el cincuenta y ocho",
    "Pan bien tostadito, el cincuenta y ocho",
    "El pan bien tostado, el cincuenta y ocho",
    "El cincuenta y ocho",
  ],
  59: [
    "No se me mueva, el cincuenta y nueve",
    "Quieto quieto, el cincuenta y nueve",
    "Que nadie se mueva, el cincuenta y nueve",
    "El cincuenta y nueve",
  ],
  60: [
    "Ya calienta el sol, el sesenta",
    "El sol está calentando, el sesenta",
    "El sol calienta fuerte, el sesenta",
    "El sesenta",
  ],
  61: [
    "Uno más y sumo, el sesenta y uno",
    "Sumando de a uno, el sesenta y uno",
    "Uno más en la cuenta, el sesenta y uno",
    "El sesenta y uno",
  ],
  62: [
    "Vámonos que es tarde, el sesenta y dos",
    "Tarde se está haciendo, el sesenta y dos",
    "Ya es tarde mae, el sesenta y dos",
    "El sesenta y dos",
  ],
  63: [
    "Revise bien ese papel, el sesenta y tres",
    "A revisar el cartón, el sesenta y tres",
    "Bien revisado el cartón, el sesenta y tres",
    "El sesenta y tres",
  ],
  64: [
    "El de la buena suerte, el sesenta y cuatro",
    "Buena suerte trae, el sesenta y cuatro",
    "La buena suerte llegó, el sesenta y cuatro",
    "El sesenta y cuatro",
  ],
  65: [
    "Pegue un brinco de alegría, el sesenta y cinco",
    "A brincar de alegría, el sesenta y cinco",
    "Brinquito de alegría, el sesenta y cinco",
    "El sesenta y cinco",
  ],
  66: [
    "Las dos monjas, el sesenta y seis",
    "Dos monjitas, el sesenta y seis",
    "Las monjitas del convento, el sesenta y seis",
    "El sesenta y seis",
  ],
  67: [
    "La suerte que se asoma, el sesenta y siete",
    "Se asoma la suerte, el sesenta y siete",
    "Asomándose la suerte, el sesenta y siete",
    "El sesenta y siete",
  ],
  68: [
    "LLega en vocho, el sesenta y ocho",
    "Que sirvan el bizcocho, el sesenta y ocho",
    "Pero que hermoso, el sesenta y ocho",
    "El sesenta y ocho",
  ],
  69: [
    "Arriba y abajo, el sesenta y nueve",
    "Para arriba y para abajo, el sesenta y nueve",
    "De arriba a abajo, el sesenta y nueve",
    "El sesenta y nueve",
  ],
  70: [
    "Esto está de película, el setenta",
    "De película este juego, el setenta",
    "Esto es puro cine, el setenta",
    "El setenta",
  ],
  71: [
    "La bruja, el setenta y uno",
    "Seguimos uno a uno, el setenta y uno",
    "Hacha y palo, el setenta y uno",
    "El setenta y uno",
  ],
  72: [
    "Los dos de la fila, el setenta y dos",
    "En fila los dos, el setenta y dos",
    "Filita de dos, el setenta y dos",
    "El setenta y dos",
  ],
  73: [
    "No se me pierda ahora, el setenta y tres",
    "No se pierda, el setenta y tres",
    "No se me vaya a perder, el setenta y tres",
    "El setenta y tres",
  ],
  74: [
    "Ojo al número, el setenta y cuatro",
    "Ojo bien puesto, el setenta y cuatro",
    "Ojo al cartón, el setenta y cuatro",
    "El setenta y cuatro",
  ],
  75: [
    "El que limpia el cartón, el setenta y cinco",
    "A limpiar el cartón, el setenta y cinco",
    "Cartón limpio, el setenta y cinco",
    "El setenta y cinco",
  ],
  76: [
    "Pura vida mae, el setenta y seis",
    "Pura vida total, el setenta y seis",
    "Todo pura vida, el setenta y seis",
    "El setenta y seis",
  ],
  77: [
    "Las dos hachas para la leña, el setenta y siete",
    "Dos hachas bien afiladas, el setenta y siete",
    "Las hachitas para la leña, el setenta y siete",
    "El setenta y siete",
  ],
  78: [
    "Qué derroche de plata, el setenta y ocho",
    "Derrochando la plata, el setenta y ocho",
    "Derroche total, el setenta y ocho",
    "El setenta y ocho",
  ],
  79: [
    "Que nadie se mueva, el setenta y nueve",
    "Todos quietos, el setenta y nueve",
    "Quietos todos, el setenta y nueve",
    "El setenta y nueve",
  ],
  80: [
    "La gente está atenta, el ochenta",
    "Todos atentos, el ochenta",
    "Atención que viene, el ochenta",
    "El ochenta",
  ],
  81: [
    "Ya casi cantamos, el ochenta y uno",
    "Casi casi cantamos, el ochenta y uno",
    "Ya casi es el bingo, el ochenta y uno",
    "El ochenta y uno",
  ],
  82: [
    "Los dos amigos de siempre, el ochenta y dos",
    "Dos amigos inseparables, el ochenta y dos",
    "Amigos del alma, el ochenta y dos",
    "El ochenta y dos",
  ],
  83: [
    "Vuelva a mirar, el ochenta y tres",
    "Mírelo bien, el ochenta y tres",
    "A mirar bien el cartón, el ochenta y tres",
    "El ochenta y tres",
  ],
  84: [
    "Las patas del gato, el ochenta y cuatro",
    "Cuatro patas de gato, el ochenta y cuatro",
    "Las patitas del gato, el ochenta y cuatro",
    "El ochenta y cuatro",
  ],
  85: [
    "El último brinco, el ochenta y cinco",
    "El brinco final, el ochenta y cinco",
    "El brinco de la victoria, el ochenta y cinco",
    "El ochenta y cinco",
  ],
  86: [
    "Ya casi termina, el ochenta y seis",
    "Casi al final, el ochenta y seis",
    "Casi terminamos, el ochenta y seis",
    "El ochenta y seis",
  ],
  87: [
    "Mucha pero mucha suerte, el ochenta y siete",
    "Muchísima suerte, el ochenta y siete",
    "Toda la suerte del mundo, el ochenta y siete",
    "El ochenta y siete",
  ],
  88: [
    "Las dos gordas del pueblo, el ochenta y ocho",
    "Las dos gorditas, el ochenta y ocho",
    "Las gorditas del barrio, el ochenta y ocho",
    "El ochenta y ocho",
  ],
  89: [
    "Se viene el grande, el ochenta y nueve",
    "El grande está por llegar, el ochenta y nueve",
    "Prepárense que viene el grande, el ochenta y nueve",
    "El ochenta y nueve",
  ],
  90: [
    "El tata del bingo, el noventa",
    "El tata de todos, el noventa",
    "El gran tata del bingo, el noventa",
    "El noventa",
  ],
};

// ============================================================
// CANTADO BASE (para mostrar en pantalla)
// ============================================================
export const cantadoData: { [key: number]: LlamadaBola } = {
  1:  { number: 1,  call: "El primero de la tanda, el 1" },
  2:  { number: 2,  call: "El patito solo, el 2" },
  3:  { number: 3,  call: "La Santísima Trinidad, el 3" },
  4:  { number: 4,  call: "La silla al revés, el 4" },
  5:  { number: 5,  call: "Los dedos de la mano, el 5" },
  6:  { number: 6,  call: "Media docena, el 6" },
  7:  { number: 7,  call: "El hacha del abuelo, el 7" },
  8:  { number: 8,  call: "Comiendo bizcocho, el 8" },
  9:  { number: 9,  call: "El rabo del chancho, el 9" },
  10: { number: 10, call: "La primera decena, el 10" },
  11: { number: 11, call: "Las dos estacas del potrero, el 11" },
  12: { number: 12, call: "La docena completa, el 12" },
  13: { number: 13, call: "La mala suerte, el 13" },
  14: { number: 14, call: "Borracho y sin plata, el 14" },
  15: { number: 15, call: "La niña bonita, el 15" },
  16: { number: 16, call: "Apenas para el café, el 16" },
  17: { number: 17, call: "Suerte que se mete, el 17" },
  18: { number: 18, call: "Ya huele a sancocho, el 18" },
  19: { number: 19, call: "Casi los veinte, el 19" },
  20: { number: 20, call: "La pura mitad de la bolsa, el 20" },
  21: { number: 21, call: "El que no sabe nada, el 21" },
  22: { number: 22, call: "Los dos patitos en el agua, el 22" },
  23: { number: 23, call: "Vuelva a fijarse, el 23" },
  24: { number: 24, call: "La víspera de Navidad, el 24" },
  25: { number: 25, call: "El día del Niño Dios, el 25" },
  26: { number: 26, call: "Como debe de ser, el 26" },
  27: { number: 27, call: "Apriete ese cartón, el 27" },
  28: { number: 28, call: "Qué lindo derroche, el 28" },
  29: { number: 29, call: "Antes de los treinta, el 29" },
  30: { number: 30, call: "La cosa calienta, el 30" },
  31: { number: 31, call: "Siga el vacilón, el 31" },
  32: { number: 32, call: "Vámonos los dos, el 32" },
  33: { number: 33, call: "La edad de Cristo, el 33" },
  34: { number: 34, call: "La cabeza del gato, el 34" },
  35: { number: 35, call: "El propio loco, el 35" },
  36: { number: 36, call: "Busque que busque, el 36" },
  37: { number: 37, call: "La puritica suerte, el 37" },
  38: { number: 38, call: "El que se trasnocha, el 38" },
  39: { number: 39, call: "El que se sacude, el 39" },
  40: { number: 40, call: "Esto se puso bueno, el 40" },
  41: { number: 41, call: "Cae uno por uno, el 41" },
  42: { number: 42, call: "El que anda perdido, el 42" },
  43: { number: 43, call: "Bien que se la sabe, el 43" },
  44: { number: 44, call: "Las dos sillitas de la escuela, el 44" },
  45: { number: 45, call: "La mitad del camino, el 45" },
  46: { number: 46, call: "Todo pura vida, el 46" },
  47: { number: 47, call: "Suerte que no se escapa, el 47" },
  48: { number: 48, call: "El viejo chocho, el 48" },
  49: { number: 49, call: "Que nadie se duerma, el 49" },
  50: { number: 50, call: "La media teja, el 50" },
  51: { number: 51, call: "Ya falta poquito, el 51" },
  52: { number: 52, call: "Mándese un rezo, el 52" },
  53: { number: 53, call: "No se me quede, el 53" },
  54: { number: 54, call: "Cuidado con el gato, el 54" },
  55: { number: 55, call: "Los dos cincos de la mano, el 55" },
  56: { number: 56, call: "Póngale un grano de maíz, el 56" },
  57: { number: 57, call: "Apriete y apriete, el 57" },
  58: { number: 58, call: "Bien tostado el pan, el 58" },
  59: { number: 59, call: "No se me mueva, el 59" },
  60: { number: 60, call: "Ya calienta el sol, el 60" },
  61: { number: 61, call: "Uno más y sumo, el 61" },
  62: { number: 62, call: "Vámonos que es tarde, el 62" },
  63: { number: 63, call: "Revise bien ese papel, el 63" },
  64: { number: 64, call: "El de la buena suerte, el 64" },
  65: { number: 65, call: "Pegue un brinco de alegría, el 65" },
  66: { number: 66, call: "Las dos monjas, el 66" },
  67: { number: 67, call: "La suerte que se asoma, el 67" },
  68: { number: 68, call: "Sabroso el tamal, el 68" },
  69: { number: 69, call: "Arriba y abajo, el 69" },
  70: { number: 70, call: "Esto está de película, el 70" },
  71: { number: 71, call: "Seguimos uno a uno, el 71" },
  72: { number: 72, call: "Los dos de la fila, el 72" },
  73: { number: 73, call: "No se me pierda ahora, el 73" },
  74: { number: 74, call: "Ojo al número, el 74" },
  75: { number: 75, call: "El que limpia el cartón, el 75" },
  76: { number: 76, call: "Pura vida mae, el 76" },
  77: { number: 77, call: "Las dos hachas para la leña, el 77" },
  78: { number: 78, call: "Qué derroche de plata, el 78" },
  79: { number: 79, call: "Que nadie se mueva, el 79" },
  80: { number: 80, call: "La gente está atenta, el 80" },
  81: { number: 81, call: "Ya casi cantamos, el 81" },
  82: { number: 82, call: "Los dos amigos de siempre, el 82" },
  83: { number: 83, call: "Vuelva a mirar, el 83" },
  84: { number: 84, call: "Las patas del gato, el 84" },
  85: { number: 85, call: "El último brinco, el 85" },
  86: { number: 86, call: "Ya casi termina, el 86" },
  87: { number: 87, call: "Mucha pero mucha suerte, el 87" },
  88: { number: 88, call: "Las dos gordas del pueblo, el 88" },
  89: { number: 89, call: "Se viene el grande, el 89" },
  90: { number: 90, call: "El tata del bingo, el 90" },
};

// Obtener llamada de bola (para mostrar en pantalla)
export function obtenerLlamadaBola(numero: number): LlamadaBola {
  return cantadoData[numero] || {
    number: numero,
    call: `Número ${numero}`,
  };
}

// Obtener variación aleatoria del cantado (para la voz)
function obtenerVariacionAleatoria(numero: number): string {
  const variaciones = variacionesCantado[numero];
  if (variaciones && variaciones.length > 0) {
    return variaciones[Math.floor(Math.random() * variaciones.length)];
  }
  return obtenerLlamadaBola(numero).call;
}

// Verificar línea completa
export function verificarLinea(numeros: number[][], numerosExtraidos: number[]): boolean {
  return numeros.some(fila => 
    fila.filter(n => n !== 0).every(n => numerosExtraidos.includes(n))
  );
}

// Verificar bingo (cartón lleno)
export function verificarBingo(numeros: number[][], numerosExtraidos: number[]): boolean {
  const todosLosNumeros = numeros.flat().filter(n => n !== 0);
  return todosLosNumeros.every(n => numerosExtraidos.includes(n));
}

// ============================================================
// WRAPPER INTELIGENTE DE VOZ
// Detecta, clasifica y cachea automáticamente las mejores voces
// disponibles en el dispositivo, respetando la elección del usuario.
// Compatible con Safari/iOS, Android Chrome y escritorio.
// ============================================================

// ── Normalización de texto para comparación ──────────────────────────────────

/**
 * Elimina tildes/diacríticos y convierte a minúsculas.
 * Permite comparar "Mónica" con "monica", "José" con "jose", etc.
 */
function normalizarTexto(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// ── Palabras clave para clasificar voces por género ──────────────────────────

/** Tokens que indican voz masculina en el nombre de la voz (ya normalizados) */
const TOKENS_MASCULINOS = [
  // Nombres propios masculinos (iOS/macOS/Windows/Android)
  'jorge', 'diego', 'carlos', 'juan', 'miguel', 'antonio', 'alejandro',
  'enrique', 'felipe', 'francisco', 'gabriel', 'javier', 'jose', 'luis',
  'manuel', 'pablo', 'pedro', 'rafael', 'roberto', 'sergio', 'andres',
  'alberto', 'daniel', 'david', 'eduardo', 'ernesto', 'fernando', 'gonzalo',
  'hector', 'ignacio', 'ivan', 'jesus', 'julio', 'mario', 'oscar',
  'raul', 'ricardo', 'rodrigo', 'victor', 'angel', 'cesar', 'emilio',
  'gerardo', 'gustavo', 'hugo', 'jaime', 'leo', 'marcos', 'martin',
  'nicolas', 'omar', 'rene', 'ruben', 'salvador', 'tomas',
  // Indicadores genéricos
  'male', 'hombre', 'masculin', 'masc',
];

/** Tokens que indican voz femenina en el nombre de la voz (ya normalizados) */
const TOKENS_FEMENINOS = [
  // Nombres propios femeninos (iOS/macOS/Windows/Android)
  'paulina', 'monica', 'luciana', 'valentina', 'sofia', 'isabella',
  'camila', 'laura', 'maria', 'ana', 'elena', 'rosa', 'carmen', 'pilar',
  'conchita', 'ximena', 'fernanda', 'andrea', 'patricia', 'sabina',
  'helena', 'alicia', 'beatriz', 'claudia', 'diana', 'gabriela',
  'isabel', 'jessica', 'karen', 'lola', 'lucia', 'mariana',
  'natalia', 'paola', 'sandra', 'silvia', 'susana', 'teresa', 'veronica',
  'marisol', 'esperanza', 'dolores', 'amparo', 'rocio', 'yolanda',
  'lorena', 'miriam', 'nuria', 'olga', 'raquel', 'rebeca', 'sonia',
  // Indicadores genéricos
  'female', 'mujer', 'femenin', 'fem',
];

/**
 * Voces de Android/Google TTS que se sabe son femeninas por su identificador
 * interno (los nombres no contienen nombres propios).
 * Patrones en el voiceURI o name de Android Google TTS.
 */
const PATRONES_FEMENINOS_ANDROID = [
  // Google TTS en español — las variantes "f" son femeninas
  /es[-_][a-z]{2}[-_]x[-_][a-z]*f/i,   // es-us-x-sfg, es-es-x-eef, etc.
  /female/i,
  /\bf\b/,                               // sufijo "f" aislado
];

const PATRONES_MASCULINOS_ANDROID = [
  /es[-_][a-z]{2}[-_]x[-_][a-z]*m/i,   // es-us-x-sfm, es-es-x-eem, etc.
  /male/i,
  /\bm\b/,                               // sufijo "m" aislado
];

/** Prioridad de locales en español (de más a menos preferido) */
const LOCALE_PREFS = ['es-CR', 'es-MX', 'es-US', 'es-ES', 'es-419', 'es'];

// ── Cache de voces seleccionadas ─────────────────────────────────────────────

interface VozCacheEntry {
  voice: SpeechSynthesisVoice;
  /** true = voz realmente del género pedido; false = fallback del otro género */
  esNativa: boolean;
}

let cacheVoces: { masculina?: VozCacheEntry; femenina?: VozCacheEntry } = {};
let cacheInicializado = false;

/**
 * Clasifica una voz como masculina, femenina o desconocida.
 * Usa normalización de acentos para máxima compatibilidad con
 * nombres de voces en iOS (Mónica, José, etc.) y Android.
 */
function clasificarVoz(v: SpeechSynthesisVoice): 'masculina' | 'femenina' | 'desconocida' {
  // Normalizar nombre y voiceURI para comparación sin acentos
  const nombre = normalizarTexto(v.name);
  const uri    = normalizarTexto(v.voiceURI ?? '');
  const haystack = `${nombre} ${uri}`;

  // 1. Buscar tokens de nombre propio/genérico (normalizados)
  if (TOKENS_MASCULINOS.some(t => haystack.includes(t))) return 'masculina';
  if (TOKENS_FEMENINOS.some(t => haystack.includes(t))) return 'femenina';

  // 2. Patrones de Android Google TTS (basados en el voiceURI/name original)
  const original = `${v.name} ${v.voiceURI ?? ''}`;
  if (PATRONES_FEMENINOS_ANDROID.some(p => p.test(original))) return 'femenina';
  if (PATRONES_MASCULINOS_ANDROID.some(p => p.test(original))) return 'masculina';

  return 'desconocida';
}

/**
 * Elige la mejor voz de un conjunto según preferencia de locale.
 * Prioriza voces locales (localService) sobre remotas.
 */
function mejorVozDeLista(lista: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (lista.length === 0) return null;
  for (const locale of LOCALE_PREFS) {
    const local = lista.find(v => v.lang === locale && v.localService);
    if (local) return local;
    const remota = lista.find(v => v.lang === locale);
    if (remota) return remota;
  }
  // Cualquier locale es-* (local primero)
  const cualquierLocal = lista.find(v => v.lang.startsWith('es') && v.localService);
  if (cualquierLocal) return cualquierLocal;
  const cualquierEs = lista.find(v => v.lang.startsWith('es'));
  if (cualquierEs) return cualquierEs;
  // Último recurso: primera disponible
  return lista.find(v => v.localService) ?? lista[0];
}

/**
 * Escanea TODAS las voces disponibles, las clasifica y llena el cache.
 * Se llama una sola vez (o cuando cambia la lista de voces).
 * Imprime en consola el inventario completo para facilitar depuración.
 */
function inicializarCacheVoces(): void {
  const todas = speechSynthesis.getVoices();
  if (todas.length === 0) return; // aún no cargaron

  // Solo voces en español; si no hay ninguna, usar todas
  const esVoices = todas.filter(v => v.lang.startsWith('es'));
  const pool = esVoices.length > 0 ? esVoices : todas;

  // Log de diagnóstico — visible en DevTools del dispositivo
  console.group('[BingoTico] Voces disponibles en este dispositivo');
  pool.forEach(v =>
    console.log(
      `  ${clasificarVoz(v).padEnd(12)} | ${v.lang.padEnd(8)} | local=${v.localService ? 'sí' : 'no'} | ${v.name} | uri=${v.voiceURI}`
    )
  );
  console.groupEnd();

  const masculinas   = pool.filter(v => clasificarVoz(v) === 'masculina');
  const femeninas    = pool.filter(v => clasificarVoz(v) === 'femenina');
  const desconocidas = pool.filter(v => clasificarVoz(v) === 'desconocida');

  console.log(`[BingoTico] Clasificación: ${masculinas.length} masculinas, ${femeninas.length} femeninas, ${desconocidas.length} desconocidas`);

  // ── Voz masculina ────────────────────────────────────────────────────────
  const vozMasc = mejorVozDeLista(masculinas);
  if (vozMasc) {
    cacheVoces.masculina = { voice: vozMasc, esNativa: true };
    console.log(`[BingoTico] ✅ Voz masculina: "${vozMasc.name}" (${vozMasc.lang})`);
  } else {
    // No hay voz masculina → usar femenina o desconocida con pitch ajustado
    const fallback = mejorVozDeLista(femeninas) ?? mejorVozDeLista(desconocidas);
    if (fallback) {
      cacheVoces.masculina = { voice: fallback, esNativa: false };
      console.warn(`[BingoTico] ⚠️ Sin voz masculina. Fallback: "${fallback.name}" (${fallback.lang}) — pitch ajustado`);
    }
  }

  // ── Voz femenina ─────────────────────────────────────────────────────────
  const vozFem = mejorVozDeLista(femeninas);
  if (vozFem) {
    cacheVoces.femenina = { voice: vozFem, esNativa: true };
    console.log(`[BingoTico] ✅ Voz femenina: "${vozFem.name}" (${vozFem.lang})`);
  } else {
    // No hay voz femenina → usar masculina o desconocida
    const fallback = mejorVozDeLista(masculinas) ?? mejorVozDeLista(desconocidas);
    if (fallback) {
      cacheVoces.femenina = { voice: fallback, esNativa: false };
      console.warn(`[BingoTico] ⚠️ Sin voz femenina. Fallback: "${fallback.name}" (${fallback.lang}) — pitch ajustado`);
    }
  }

  cacheInicializado = true;
}

/**
 * Devuelve la entrada de cache para el género pedido.
 * Si el cache no está listo, intenta inicializarlo en el momento.
 */
function obtenerVozCache(genero: 'masculina' | 'femenina'): VozCacheEntry | null {
  if (!cacheInicializado) {
    inicializarCacheVoces();
  }
  return cacheVoces[genero] ?? null;
}

// ── Listener para carga asíncrona de voces (Chrome/Android/Safari) ───────────
// En Android Chrome y Safari las voces no están disponibles de inmediato;
// onvoiceschanged se dispara cuando terminan de cargar.
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  // Intento inmediato (funciona en Firefox y algunos escritorios)
  inicializarCacheVoces();

  speechSynthesis.onvoiceschanged = () => {
    // Reinicializar cache cuando cambie la lista de voces
    cacheVoces = {};
    cacheInicializado = false;
    inicializarCacheVoces();
  };
}

/**
 * Construye y dispara un SpeechSynthesisUtterance.
 * DEBE llamarse sin setTimeout para que iOS Safari lo acepte.
 *
 * Aplica pitch/rate según si la voz es nativa del género o un fallback:
 * - Voz masculina real  → pitch natural (0.90–1.00), rate normal
 * - Voz femenina real   → pitch alto (1.10–1.25), rate normal
 * - Fallback femenina→masculino → pitch 0.74–0.82, rate ligeramente lento
 * - Fallback masculina→femenino → pitch 1.20–1.30, rate ligeramente rápido
 *
 * NOTA sobre Safari/iOS: el pitch solo tiene efecto real cuando NO se
 * asigna una voz explícita (Safari ignora pitch con voces nativas).
 * Por eso en iOS con voz nativa del género correcto no se fuerza pitch.
 */
function dispararUtterance(texto: string, genero: 'masculina' | 'femenina'): void {
  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.volume = 1;
  utterance.lang   = 'es-US';

  const entrada = obtenerVozCache(genero);

  if (genero === 'masculina') {
    if (entrada?.esNativa) {
      // Voz masculina real: pitch completamente natural
      utterance.pitch = 0.92 + Math.random() * 0.08;
      utterance.rate  = 0.82 + Math.random() * 0.13;
    } else {
      // Fallback (voz femenina/desconocida usada para masculino):
      // pitch 0.74–0.82 → suena masculino sin sonar robótico
      utterance.pitch = 0.74 + Math.random() * 0.08;
      utterance.rate  = 0.76 + Math.random() * 0.08;
    }
  } else {
    if (entrada?.esNativa) {
      // Voz femenina real: pitch ligeramente alto
      utterance.pitch = 1.12 + Math.random() * 0.13;
      utterance.rate  = 0.82 + Math.random() * 0.13;
    } else {
      // Fallback (voz masculina/desconocida usada para femenino):
      utterance.pitch = 1.25 + Math.random() * 0.10;
      utterance.rate  = 0.88 + Math.random() * 0.10;
    }
  }

  if (entrada?.voice) {
    utterance.voice = entrada.voice;
    utterance.lang  = entrada.voice.lang;
  }

  speechSynthesis.speak(utterance);
}

/**
 * iOS Safari fix: el motor de síntesis se "congela" silenciosamente
 * después de ~15 s de inactividad. Este intervalo lo mantiene activo.
 */
let iosKeepAliveInterval: ReturnType<typeof setInterval> | null = null;

export function iniciarKeepAliveIOS(): void {
  if (iosKeepAliveInterval) return;
  iosKeepAliveInterval = setInterval(() => {
    if (!('speechSynthesis' in window)) return;
    if (speechSynthesis.speaking) return;   // ya está hablando, no tocar
    speechSynthesis.resume();               // descongelar si estaba pausado
  }, 10_000); // cada 10 segundos
}

export function detenerKeepAliveIOS(): void {
  if (iosKeepAliveInterval) {
    clearInterval(iosKeepAliveInterval);
    iosKeepAliveInterval = null;
  }
}

/**
 * Desbloquea speechSynthesis en iOS Safari.
 * DEBE llamarse directamente desde un handler de evento de usuario (tap/click).
 * Usa texto real (no vacío) porque iOS ignora utterances vacíos.
 */
export function desbloquearSpeechSynthesis(): void {
  if (!('speechSynthesis' in window)) return;

  // Utterance silencioso con texto real pero volumen 0
  const u = new SpeechSynthesisUtterance('.');
  u.volume = 0;
  u.rate   = 2;   // lo más rápido posible para que no se note

  // Usar el cache inteligente para obtener la voz femenina (más natural para desbloqueo)
  const entrada = obtenerVozCache('femenina');
  if (entrada?.voice) {
    u.voice = entrada.voice;
    u.lang  = entrada.voice.lang;
  } else {
    u.lang = 'es-US';
  }

  speechSynthesis.cancel();
  speechSynthesis.speak(u);

  // Iniciar keep-alive para iOS
  iniciarKeepAliveIOS();
}

/**
 * Habla un número con el cantado costarricense.
 * Compatible con iOS Safari, Android Chrome y navegadores de escritorio.
 *
 * IMPORTANTE: para iOS Safari, desbloquearSpeechSynthesis() debe haberse
 * llamado previamente desde un evento de usuario (tap/click).
 */
export function hablarNumero(numero: number, voz: 'masculina' | 'femenina'): void {
  if (!('speechSynthesis' in window)) return;

  const texto = obtenerVariacionAleatoria(numero);

  // iOS Safari fix: resume() por si se congeló
  if (speechSynthesis.paused) {
    speechSynthesis.resume();
  }

  // Cancelar locución anterior y hablar SIN setTimeout
  // (iOS Safari rechaza speak() dentro de setTimeout si no hay gesto activo)
  speechSynthesis.cancel();
  dispararUtterance(texto, voz);
}

// ============================================================
// REPRODUCCIÓN CON AUDIO MP3 (lazy loading) + FALLBACK TTS
// ============================================================

/**
 * Reproduce el número usando archivos MP3 pregrabados (lazy loading).
 * Si el audio MP3 no está disponible o falla, cae automáticamente
 * al motor de síntesis de voz (SpeechSynthesis / TTS).
 *
 * Flujo:
 *  1. Intenta reproducir el MP3 del género seleccionado via audioService.
 *  2. Si `reproducirNumero()` devuelve null (Audio no soportado) → TTS.
 *  3. Si play() falla (autoplay bloqueado, archivo no encontrado) → TTS.
 *
 * @param numero  Número de bola (1–90)
 * @param voz     Género de la voz: 'masculina' | 'femenina'
 */
export function hablarNumeroConAudio(
  numero: number,
  voz: GeneroAudio
): void {
  // Detener cualquier audio MP3 que esté sonando
  detenerTodoAudio();

  // Intentar reproducir MP3
  const audioEl = reproducirNumero(numero, voz);

  if (audioEl === null) {
    // Audio API no disponible → usar TTS directamente
    hablarNumero(numero, voz);
    return;
  }

  // Escuchar si play() falla para activar el fallback TTS
  const onError = () => {
    audioEl.removeEventListener('error', onError);
    console.warn(`[BingoTico] MP3 falló para ${voz}/${numero} — usando TTS como fallback`);
    hablarNumero(numero, voz);
  };

  audioEl.addEventListener('error', onError, { once: true });
}

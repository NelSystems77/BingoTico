import QRCode from 'qrcode';
import type { LlamadaBola } from '../types';

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
    "El uno, el primero de la tanda, el uno",
    "Arrancamos con el uno, el primero",
    "El uno, uno solo, el primero de todos",
    "Uno, el que abre el juego, el uno",
  ],
  2: [
    "El dos, el patito solo en el agua, el dos",
    "El dos, cuac cuac, el patito, el dos",
    "Dos, solito el patito, el dos",
    "El dos, el patito nadando, el dos",
  ],
  3: [
    "El tres, la Santísima Trinidad, el tres",
    "Tres, el número sagrado, el tres",
    "El tres, Padre, Hijo y Espíritu Santo, el tres",
    "Tres, la Trinidad bendita, el tres",
  ],
  4: [
    "El cuatro, la silla al revés, el cuatro",
    "Cuatro, como las patas del gato, el cuatro",
    "El cuatro, la sillita volteada, el cuatro",
    "Cuatro, cuatro esquinas tiene, el cuatro",
  ],
  5: [
    "El cinco, los dedos de la mano, el cinco",
    "Cinco, una manita entera, el cinco",
    "El cinco, los cinco sentidos, el cinco",
    "Cinco, la mano completa, el cinco",
  ],
  6: [
    "El seis, media docena, el seis",
    "Seis, media docena de huevos, el seis",
    "El seis, la mitad de la docena, el seis",
    "Seis, media docenita, el seis",
  ],
  7: [
    "El siete, el hacha del abuelo, el siete",
    "Siete, el número de la suerte, el siete",
    "El siete, el hacha bien afilada, el siete",
    "Siete, suerte que se viene, el siete",
  ],
  8: [
    "El ocho, comiendo bizcocho, el ocho",
    "Ocho, bizcocho con chocolate, el ocho",
    "El ocho, el que come bizcocho, el ocho",
    "Ocho, qué rico el bizcocho, el ocho",
  ],
  9: [
    "El nueve, el rabo del chancho, el nueve",
    "Nueve, el rabito enrollado, el nueve",
    "El nueve, rabo de chancho, el nueve",
    "Nueve, el chancho con su rabo, el nueve",
  ],
  10: [
    "El diez, la primera decena completa, el diez",
    "Diez, cerramos la primera decena, el diez",
    "El diez, diez deditos, el diez",
    "Diez, la primera decena, el diez",
  ],
  11: [
    "El once, las dos estacas del potrero, el once",
    "Once, dos palitos derechos, el once",
    "El once, las dos estaquitas, el once",
    "Once, dos estacas en el potrero, el once",
  ],
  12: [
    "El doce, la docena completa, el doce",
    "Doce, una docena entera, el doce",
    "El doce, docena de huevos, el doce",
    "Doce, la docena completa, el doce",
  ],
  13: [
    "El trece, la mala suerte, el trece",
    "Trece, cuidado con la mala suerte, el trece",
    "El trece, el número de la mala suerte, el trece",
    "Trece, que no nos traiga mala suerte, el trece",
  ],
  14: [
    "El catorce, borracho y sin plata, el catorce",
    "Catorce, borrachito y sin un cinco, el catorce",
    "El catorce, borracho y pelado, el catorce",
    "Catorce, sin plata y borracho, el catorce",
  ],
  15: [
    "El quince, la niña bonita, el quince",
    "Quince, ay ay ay, la niña bonita del barrio, el quince",
    "El quince, la niña más bonita, el quince",
    "Quince, la niña bonita está en la casa, el quince",
  ],
  16: [
    "El dieciséis, apenas para el café, el dieciséis",
    "Dieciséis, lo justo para el cafecito, el dieciséis",
    "El dieciséis, apenas alcanza para el café, el dieciséis",
    "Dieciséis, para el café nomás, el dieciséis",
  ],
  17: [
    "El diecisiete, suerte que se mete, el diecisiete",
    "Diecisiete, la suerte que se cuela, el diecisiete",
    "El diecisiete, suerte que se mete solita, el diecisiete",
    "Diecisiete, se mete la suerte, el diecisiete",
  ],
  18: [
    "El dieciocho, ya huele a sancocho, el dieciocho",
    "Dieciocho, qué rico ese sancocho, el dieciocho",
    "El dieciocho, sancocho en la olla, el dieciocho",
    "Dieciocho, huele a sancocho de domingo, el dieciocho",
  ],
  19: [
    "El diecinueve, casi los veinte, el diecinueve",
    "Diecinueve, un pasito antes de los veinte, el diecinueve",
    "El diecinueve, casi casi veinte, el diecinueve",
    "Diecinueve, falta uno para los veinte, el diecinueve",
  ],
  20: [
    "El veinte, la pura mitad de la bolsa, el veinte",
    "Veinte, mitad de cuarenta, el veinte",
    "El veinte, veintito redondo, el veinte",
    "Veinte, la mitad de la bolsa, el veinte",
  ],
  21: [
    "El veintiuno, el que no sabe nada, el veintiuno",
    "Veintiuno, el que no sabe ni jota, el veintiuno",
    "El veintiuno, el que no sabe nada de nada, el veintiuno",
    "Veintiuno, sin saber nada, el veintiuno",
  ],
  22: [
    "El veintidós, los dos patitos en el agua, el veintidós",
    "Veintidós, cuac cuac, los dos patitos, el veintidós",
    "El veintidós, dos patitos nadando juntos, el veintidós",
    "Veintidós, los patitos en el estanque, el veintidós",
  ],
  23: [
    "El veintitrés, vuelva a fijarse, el veintitrés",
    "Veintitrés, fíjese bien en su cartón, el veintitrés",
    "El veintitrés, revise bien, el veintitrés",
    "Veintitrés, a fijarse bien, el veintitrés",
  ],
  24: [
    "El veinticuatro, la víspera de Navidad, el veinticuatro",
    "Veinticuatro, nochebuena, el veinticuatro",
    "El veinticuatro, víspera de Navidad, el veinticuatro",
    "Veinticuatro, la noche del veinticuatro, el veinticuatro",
  ],
  25: [
    "El veinticinco, el día del Niño Dios, el veinticinco",
    "Veinticinco, Navidad, el veinticinco",
    "El veinticinco, el día de Navidad, el veinticinco",
    "Veinticinco, nació el Niño Dios, el veinticinco",
  ],
  26: [
    "El veintiséis, como debe de ser, el veintiséis",
    "Veintiséis, así es como debe ser, el veintiséis",
    "El veintiséis, como tiene que ser, el veintiséis",
    "Veintiséis, como debe de ser, el veintiséis",
  ],
  27: [
    "El veintisiete, apriete ese cartón, el veintisiete",
    "Veintisiete, apriételo bien, el veintisiete",
    "El veintisiete, apriete el cartón que viene, el veintisiete",
    "Veintisiete, a apretar ese cartón, el veintisiete",
  ],
  28: [
    "El veintiocho, qué lindo derroche, el veintiocho",
    "Veintiocho, derroche de suerte, el veintiocho",
    "El veintiocho, qué derroche tan lindo, el veintiocho",
    "Veintiocho, lindo derroche, el veintiocho",
  ],
  29: [
    "El veintinueve, antes de los treinta, el veintinueve",
    "Veintinueve, un pasito antes de los treinta, el veintinueve",
    "El veintinueve, casi los treinta, el veintinueve",
    "Veintinueve, falta uno para los treinta, el veintinueve",
  ],
  30: [
    "El treinta, la cosa calienta, el treinta",
    "Treinta, esto se está poniendo bueno, el treinta",
    "El treinta, ya calienta la cosa, el treinta",
    "Treinta, la cosa se pone caliente, el treinta",
  ],
  31: [
    "El treinta y uno, siga el vacilón, el treinta y uno",
    "Treinta y uno, el vacilón continúa, el treinta y uno",
    "El treinta y uno, que siga el vacilón, el treinta y uno",
    "Treinta y uno, vacilón total, el treinta y uno",
  ],
  32: [
    "El treinta y dos, vámonos los dos, el treinta y dos",
    "Treinta y dos, los dos juntos, el treinta y dos",
    "El treinta y dos, vámonos que es tarde, el treinta y dos",
    "Treinta y dos, los dos de la mano, el treinta y dos",
  ],
  33: [
    "El treinta y tres, la edad de Cristo, el treinta y tres",
    "Treinta y tres, la edad del Señor, el treinta y tres",
    "El treinta y tres, Cristo tenía treinta y tres, el treinta y tres",
    "Treinta y tres, la edad de Jesucristo, el treinta y tres",
  ],
  34: [
    "El treinta y cuatro, la cabeza del gato, el treinta y cuatro",
    "Treinta y cuatro, cabeza de gato, el treinta y cuatro",
    "El treinta y cuatro, la cabecita del gato, el treinta y cuatro",
    "Treinta y cuatro, el gato con su cabeza, el treinta y cuatro",
  ],
  35: [
    "El treinta y cinco, el propio loco, el treinta y cinco",
    "Treinta y cinco, loco loco, el treinta y cinco",
    "El treinta y cinco, el loco del pueblo, el treinta y cinco",
    "Treinta y cinco, el propio loquillo, el treinta y cinco",
  ],
  36: [
    "El treinta y seis, busque que busque, el treinta y seis",
    "Treinta y seis, a buscar en el cartón, el treinta y seis",
    "El treinta y seis, búsquelo bien, el treinta y seis",
    "Treinta y seis, busque busque busque, el treinta y seis",
  ],
  37: [
    "El treinta y siete, la puritica suerte, el treinta y siete",
    "Treinta y siete, pura suerte, el treinta y siete",
    "El treinta y siete, la suerte pura, el treinta y siete",
    "Treinta y siete, suerte pura y dura, el treinta y siete",
  ],
  38: [
    "El treinta y ocho, el que se trasnocha, el treinta y ocho",
    "Treinta y ocho, trasnochado pero aquí, el treinta y ocho",
    "El treinta y ocho, el trasnochado, el treinta y ocho",
    "Treinta y ocho, trasnochando por el bingo, el treinta y ocho",
  ],
  39: [
    "El treinta y nueve, el que se sacude, el treinta y nueve",
    "Treinta y nueve, sacúdase que viene, el treinta y nueve",
    "El treinta y nueve, a sacudirse, el treinta y nueve",
    "Treinta y nueve, sacúdase el sueño, el treinta y nueve",
  ],
  40: [
    "El cuarenta, esto se puso bueno, el cuarenta",
    "Cuarenta, ya esto está buenísimo, el cuarenta",
    "El cuarenta, se puso bueno el juego, el cuarenta",
    "Cuarenta, qué bueno se puso esto, el cuarenta",
  ],
  41: [
    "El cuarenta y uno, cae uno por uno, el cuarenta y uno",
    "Cuarenta y uno, cayendo uno a uno, el cuarenta y uno",
    "El cuarenta y uno, uno por uno van cayendo, el cuarenta y uno",
    "Cuarenta y uno, uno a uno, el cuarenta y uno",
  ],
  42: [
    "El cuarenta y dos, el que anda perdido, el cuarenta y dos",
    "Cuarenta y dos, perdidito por ahí, el cuarenta y dos",
    "El cuarenta y dos, andaba perdido y apareció, el cuarenta y dos",
    "Cuarenta y dos, el perdido del barrio, el cuarenta y dos",
  ],
  43: [
    "El cuarenta y tres, bien que se la sabe, el cuarenta y tres",
    "Cuarenta y tres, se la sabe de memoria, el cuarenta y tres",
    "El cuarenta y tres, bien que se la sabe toda, el cuarenta y tres",
    "Cuarenta y tres, se la sabe bien, el cuarenta y tres",
  ],
  44: [
    "El cuarenta y cuatro, las dos sillitas de la escuela, el cuarenta y cuatro",
    "Cuarenta y cuatro, dos sillitas juntas, el cuarenta y cuatro",
    "El cuarenta y cuatro, sillitas de la escuelita, el cuarenta y cuatro",
    "Cuarenta y cuatro, las sillitas de la escuela, el cuarenta y cuatro",
  ],
  45: [
    "El cuarenta y cinco, la mitad del camino, el cuarenta y cinco",
    "Cuarenta y cinco, mitad del camino en el noventa, el cuarenta y cinco",
    "El cuarenta y cinco, ya vamos a la mitad, el cuarenta y cinco",
    "Cuarenta y cinco, la mitad del trayecto, el cuarenta y cinco",
  ],
  46: [
    "El cuarenta y seis, todo pura vida, el cuarenta y seis",
    "Cuarenta y seis, pura vida mae, el cuarenta y seis",
    "El cuarenta y seis, todo bien, todo pura vida, el cuarenta y seis",
    "Cuarenta y seis, pura vida total, el cuarenta y seis",
  ],
  47: [
    "El cuarenta y siete, suerte que no se escapa, el cuarenta y siete",
    "Cuarenta y siete, la suerte no se escapa, el cuarenta y siete",
    "El cuarenta y siete, no se escapa la suerte, el cuarenta y siete",
    "Cuarenta y siete, suerte atrapada, el cuarenta y siete",
  ],
  48: [
    "El cuarenta y ocho, el viejo chocho, el cuarenta y ocho",
    "Cuarenta y ocho, el viejito chocho, el cuarenta y ocho",
    "El cuarenta y ocho, el viejo chochito, el cuarenta y ocho",
    "Cuarenta y ocho, chocho pero aquí, el cuarenta y ocho",
  ],
  49: [
    "El cuarenta y nueve, que nadie se duerma, el cuarenta y nueve",
    "Cuarenta y nueve, despiertos todos, el cuarenta y nueve",
    "El cuarenta y nueve, a no dormirse, el cuarenta y nueve",
    "Cuarenta y nueve, ojos abiertos, el cuarenta y nueve",
  ],
  50: [
    "El cincuenta, la media teja, el cincuenta",
    "Cincuenta, media tejita, el cincuenta",
    "El cincuenta, la mitad de la teja, el cincuenta",
    "Cincuenta, media teja redonda, el cincuenta",
  ],
  51: [
    "El cincuenta y uno, ya falta poquito, el cincuenta y uno",
    "Cincuenta y uno, poquito falta ya, el cincuenta y uno",
    "El cincuenta y uno, ya casi casi, el cincuenta y uno",
    "Cincuenta y uno, falta poquitito, el cincuenta y uno",
  ],
  52: [
    "El cincuenta y dos, mándese un rezo, el cincuenta y dos",
    "Cincuenta y dos, a rezar se ha dicho, el cincuenta y dos",
    "El cincuenta y dos, rece que rece, el cincuenta y dos",
    "Cincuenta y dos, un rezito no hace daño, el cincuenta y dos",
  ],
  53: [
    "El cincuenta y tres, no se me quede, el cincuenta y tres",
    "Cincuenta y tres, no se quede atrás, el cincuenta y tres",
    "El cincuenta y tres, que no se quede, el cincuenta y tres",
    "Cincuenta y tres, no se me pierda, el cincuenta y tres",
  ],
  54: [
    "El cincuenta y cuatro, cuidado con el gato, el cincuenta y cuatro",
    "Cincuenta y cuatro, ojo con el gato, el cincuenta y cuatro",
    "El cincuenta y cuatro, cuidadito con el gato, el cincuenta y cuatro",
    "Cincuenta y cuatro, el gato está al acecho, el cincuenta y cuatro",
  ],
  55: [
    "El cincuenta y cinco, los dos cincos de la mano, el cincuenta y cinco",
    "Cincuenta y cinco, dos manitas de cinco, el cincuenta y cinco",
    "El cincuenta y cinco, dos veces cinco, el cincuenta y cinco",
    "Cincuenta y cinco, dos cincos juntos, el cincuenta y cinco",
  ],
  56: [
    "El cincuenta y seis, póngale un grano de maíz, el cincuenta y seis",
    "Cincuenta y seis, un granito de maíz, el cincuenta y seis",
    "El cincuenta y seis, maicito en el cartón, el cincuenta y seis",
    "Cincuenta y seis, grano de maíz, el cincuenta y seis",
  ],
  57: [
    "El cincuenta y siete, apriete y apriete, el cincuenta y siete",
    "Cincuenta y siete, apretando el cartón, el cincuenta y siete",
    "El cincuenta y siete, a apretar se ha dicho, el cincuenta y siete",
    "Cincuenta y siete, apriételo bien, el cincuenta y siete",
  ],
  58: [
    "El cincuenta y ocho, bien tostado el pan, el cincuenta y ocho",
    "Cincuenta y ocho, pan bien tostadito, el cincuenta y ocho",
    "El cincuenta y ocho, el pan bien tostado, el cincuenta y ocho",
    "Cincuenta y ocho, tostadito el pan, el cincuenta y ocho",
  ],
  59: [
    "El cincuenta y nueve, no se me mueva, el cincuenta y nueve",
    "Cincuenta y nueve, quieto quieto, el cincuenta y nueve",
    "El cincuenta y nueve, que nadie se mueva, el cincuenta y nueve",
    "Cincuenta y nueve, sin moverse, el cincuenta y nueve",
  ],
  60: [
    "El sesenta, ya calienta el sol, el sesenta",
    "Sesenta, el sol está calentando, el sesenta",
    "El sesenta, qué calor hace ya, el sesenta",
    "Sesenta, el sol calienta fuerte, el sesenta",
  ],
  61: [
    "El sesenta y uno, uno más y sumo, el sesenta y uno",
    "Sesenta y uno, sumando de a uno, el sesenta y uno",
    "El sesenta y uno, uno más en la cuenta, el sesenta y uno",
    "Sesenta y uno, a sumar, el sesenta y uno",
  ],
  62: [
    "El sesenta y dos, vámonos que es tarde, el sesenta y dos",
    "Sesenta y dos, tarde se está haciendo, el sesenta y dos",
    "El sesenta y dos, ya es tarde mae, el sesenta y dos",
    "Sesenta y dos, que es tardísimo, el sesenta y dos",
  ],
  63: [
    "El sesenta y tres, revise bien ese papel, el sesenta y tres",
    "Sesenta y tres, a revisar el cartón, el sesenta y tres",
    "El sesenta y tres, revíselo bien, el sesenta y tres",
    "Sesenta y tres, bien revisado el cartón, el sesenta y tres",
  ],
  64: [
    "El sesenta y cuatro, el de la buena suerte, el sesenta y cuatro",
    "Sesenta y cuatro, buena suerte trae, el sesenta y cuatro",
    "El sesenta y cuatro, cargado de buena suerte, el sesenta y cuatro",
    "Sesenta y cuatro, la buena suerte llegó, el sesenta y cuatro",
  ],
  65: [
    "El sesenta y cinco, pegue un brinco de alegría, el sesenta y cinco",
    "Sesenta y cinco, a brincar de alegría, el sesenta y cinco",
    "El sesenta y cinco, brinquito de alegría, el sesenta y cinco",
    "Sesenta y cinco, brinca de alegría, el sesenta y cinco",
  ],
  66: [
    "El sesenta y seis, las dos monjas, el sesenta y seis",
    "Sesenta y seis, dos monjitas, el sesenta y seis",
    "El sesenta y seis, las monjitas del convento, el sesenta y seis",
    "Sesenta y seis, dos monjas rezando, el sesenta y seis",
  ],
  67: [
    "El sesenta y siete, la suerte que se asoma, el sesenta y siete",
    "Sesenta y siete, se asoma la suerte, el sesenta y siete",
    "El sesenta y siete, la suerte se está asomando, el sesenta y siete",
    "Sesenta y siete, asomándose la suerte, el sesenta y siete",
  ],
  68: [
    "El sesenta y ocho, sabroso el tamal, el sesenta y ocho",
    "Sesenta y ocho, qué rico ese tamal, el sesenta y ocho",
    "El sesenta y ocho, tamalito sabroso, el sesenta y ocho",
    "Sesenta y ocho, tamal de olla, el sesenta y ocho",
  ],
  69: [
    "El sesenta y nueve, arriba y abajo, el sesenta y nueve",
    "Sesenta y nueve, para arriba y para abajo, el sesenta y nueve",
    "El sesenta y nueve, arriba abajo, el sesenta y nueve",
    "Sesenta y nueve, de arriba a abajo, el sesenta y nueve",
  ],
  70: [
    "El setenta, esto está de película, el setenta",
    "Setenta, de película este juego, el setenta",
    "El setenta, qué película tan buena, el setenta",
    "Setenta, esto es puro cine, el setenta",
  ],
  71: [
    "El setenta y uno, seguimos uno a uno, el setenta y uno",
    "Setenta y uno, uno a uno seguimos, el setenta y uno",
    "El setenta y uno, uno por uno, el setenta y uno",
    "Setenta y uno, siguiendo uno a uno, el setenta y uno",
  ],
  72: [
    "El setenta y dos, los dos de la fila, el setenta y dos",
    "Setenta y dos, en fila los dos, el setenta y dos",
    "El setenta y dos, los dos en fila, el setenta y dos",
    "Setenta y dos, filita de dos, el setenta y dos",
  ],
  73: [
    "El setenta y tres, no se me pierda ahora, el setenta y tres",
    "Setenta y tres, no se pierda, el setenta y tres",
    "El setenta y tres, que no se pierda, el setenta y tres",
    "Setenta y tres, no se me vaya a perder, el setenta y tres",
  ],
  74: [
    "El setenta y cuatro, ojo al número, el setenta y cuatro",
    "Setenta y cuatro, ojo bien puesto, el setenta y cuatro",
    "El setenta y cuatro, ojo al cartón, el setenta y cuatro",
    "Setenta y cuatro, ojo ojo ojo, el setenta y cuatro",
  ],
  75: [
    "El setenta y cinco, el que limpia el cartón, el setenta y cinco",
    "Setenta y cinco, a limpiar el cartón, el setenta y cinco",
    "El setenta y cinco, limpiando el cartón, el setenta y cinco",
    "Setenta y cinco, cartón limpio, el setenta y cinco",
  ],
  76: [
    "El setenta y seis, pura vida mae, el setenta y seis",
    "Setenta y seis, pura vida total, el setenta y seis",
    "El setenta y seis, todo pura vida, el setenta y seis",
    "Setenta y seis, pura vida tico, el setenta y seis",
  ],
  77: [
    "El setenta y siete, las dos hachas para la leña, el setenta y siete",
    "Setenta y siete, dos hachas bien afiladas, el setenta y siete",
    "El setenta y siete, las hachitas para la leña, el setenta y siete",
    "Setenta y siete, dos hachas, el setenta y siete",
  ],
  78: [
    "El setenta y ocho, qué derroche de plata, el setenta y ocho",
    "Setenta y ocho, derrochando la plata, el setenta y ocho",
    "El setenta y ocho, qué derroche tan grande, el setenta y ocho",
    "Setenta y ocho, derroche total, el setenta y ocho",
  ],
  79: [
    "El setenta y nueve, que nadie se mueva, el setenta y nueve",
    "Setenta y nueve, todos quietos, el setenta y nueve",
    "El setenta y nueve, sin moverse nadie, el setenta y nueve",
    "Setenta y nueve, quietos todos, el setenta y nueve",
  ],
  80: [
    "El ochenta, la gente está atenta, el ochenta",
    "Ochenta, todos atentos, el ochenta",
    "El ochenta, atención que viene el ochenta",
    "Ochenta, la gente bien atenta, el ochenta",
  ],
  81: [
    "El ochenta y uno, ya casi cantamos, el ochenta y uno",
    "Ochenta y uno, casi casi cantamos, el ochenta y uno",
    "El ochenta y uno, falta poquito para cantar, el ochenta y uno",
    "Ochenta y uno, ya casi es el bingo, el ochenta y uno",
  ],
  82: [
    "El ochenta y dos, los dos amigos de siempre, el ochenta y dos",
    "Ochenta y dos, dos amigos inseparables, el ochenta y dos",
    "El ochenta y dos, los dos amigotes, el ochenta y dos",
    "Ochenta y dos, amigos del alma, el ochenta y dos",
  ],
  83: [
    "El ochenta y tres, vuelva a mirar, el ochenta y tres",
    "Ochenta y tres, mírelo bien, el ochenta y tres",
    "El ochenta y tres, a mirar bien el cartón, el ochenta y tres",
    "Ochenta y tres, vuelta a mirar, el ochenta y tres",
  ],
  84: [
    "El ochenta y cuatro, las patas del gato, el ochenta y cuatro",
    "Ochenta y cuatro, cuatro patas de gato, el ochenta y cuatro",
    "El ochenta y cuatro, las patitas del gato, el ochenta y cuatro",
    "Ochenta y cuatro, el gato con sus cuatro patas, el ochenta y cuatro",
  ],
  85: [
    "El ochenta y cinco, el último brinco, el ochenta y cinco",
    "Ochenta y cinco, el brinco final, el ochenta y cinco",
    "El ochenta y cinco, último brinquito, el ochenta y cinco",
    "Ochenta y cinco, el brinco de la victoria, el ochenta y cinco",
  ],
  86: [
    "El ochenta y seis, ya casi termina, el ochenta y seis",
    "Ochenta y seis, casi al final, el ochenta y seis",
    "El ochenta y seis, falta poquito para terminar, el ochenta y seis",
    "Ochenta y seis, casi terminamos, el ochenta y seis",
  ],
  87: [
    "El ochenta y siete, mucha pero mucha suerte, el ochenta y siete",
    "Ochenta y siete, muchísima suerte, el ochenta y siete",
    "El ochenta y siete, suerte a montones, el ochenta y siete",
    "Ochenta y siete, toda la suerte del mundo, el ochenta y siete",
  ],
  88: [
    "El ochenta y ocho, las dos gordas del pueblo, el ochenta y ocho",
    "Ochenta y ocho, las dos gorditas, el ochenta y ocho",
    "El ochenta y ocho, dos gordas bien gordas, el ochenta y ocho",
    "Ochenta y ocho, las gorditas del barrio, el ochenta y ocho",
  ],
  89: [
    "El ochenta y nueve, se viene el grande, el ochenta y nueve",
    "Ochenta y nueve, el grande está por llegar, el ochenta y nueve",
    "El ochenta y nueve, viene el número grande, el ochenta y nueve",
    "Ochenta y nueve, prepárense que viene el grande, el ochenta y nueve",
  ],
  90: [
    "El noventa, el tata del bingo, el noventa",
    "Noventa, el tata de todos, el noventa",
    "El noventa, el gran tata del bingo, el noventa",
    "Noventa, el tata manda, el noventa",
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
// SINTETIZAR VOZ — Con variaciones y emoción
// Usa variación aleatoria del cantado para cada número
// ============================================================
export function hablarNumero(numero: number, voz: 'masculina' | 'femenina'): void {
  if (!('speechSynthesis' in window)) return;

  // Cancelar cualquier locución en curso
  speechSynthesis.cancel();

  const texto = obtenerVariacionAleatoria(numero);

  // Parámetros base según género de voz
  const esFemenina = voz === 'femenina';

  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = 'es-CR';
  // Velocidad ligeramente variable para sonar más natural (0.82 – 0.95)
  utterance.rate = 0.82 + Math.random() * 0.13;
  // Tono: femenina más agudo, masculina más grave
  utterance.pitch = esFemenina
    ? 1.15 + Math.random() * 0.15   // 1.15 – 1.30
    : 0.80 + Math.random() * 0.15;  // 0.80 – 0.95
  // Volumen al máximo
  utterance.volume = 1;

  // Buscar voz en español instalada en el sistema
  const voices = speechSynthesis.getVoices();
  const spanishVoices = voices.filter(v => v.lang.startsWith('es'));

  if (spanishVoices.length > 0) {
    // Preferir voces locales (más naturales que las remotas)
    const localVoice = spanishVoices.find(v => v.localService);
    utterance.voice = localVoice ?? spanishVoices[0];
  }

  speechSynthesis.speak(utterance);
}

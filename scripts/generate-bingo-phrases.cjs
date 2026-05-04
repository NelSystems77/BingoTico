/**
 * Script para generar audios de frases de bingo costarricense
 * Voz: IKne3meq5aSn9XLyUdCD - Charlie (masculina, plan gratuito)
 * Genera/reemplaza los archivos N_var.mp3 en public/audio/numbers/
 * Total: 90 frases = 2,391 caracteres (cuota disponible: ~4,847)
 * Formato: MP3 44.1 kHz, 128 kbps
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'sk_d987440989dbb903dd91578efbdcf10827498b82838631a7';
const VOICE_ID = 'IKne3meq5aSn9XLyUdCD'; // Charlie - Deep, Confident, Energetic
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'audio', 'numbers');

// Frases de bingo costarricense para cada número del 1 al 90
const bingoFrases = {
  1:  'El primero de la tanda, el uno',
  2:  'El patito solo en el agua, el dos',
  3:  'La Santísima Trinidad, el tres',
  4:  'Como las patas del gato, el cuatro',
  5:  'Los dedos de la mano, el cinco',
  6:  'Media docena de huevos, el seis',
  7:  'El hacha de mi abuelo, el siete',
  8:  'Comiendo bizcocho, el ocho',
  9:  'El rabo del chancho, el nueve',
  10: 'Diez deditos, el diez',
  11: 'Las canillas de mi abuela, el once',
  12: 'Docena de huevos, el doce',
  13: 'Que no nos traiga mala suerte, el trece',
  14: 'Limpio y esperando que paguen, el catorce',
  15: 'La quinceañera del barrio, el quince',
  16: 'La hora del café, el dieciséis',
  17: 'Se mete la suerte, el diecisiete',
  18: 'El mayor de edad, el dieciocho',
  19: 'Falta uno para los veinte, el diecinueve',
  20: 'Pato con huevo, el veinte',
  21: 'El veintiuno',
  22: 'Los dos patitos en el agua, el veintidós',
  23: 'El veintitrés',
  24: 'Nochebuena, el veinticuatro',
  25: 'Nació el Niño Dios, el veinticinco',
  26: 'El veintiséis',
  27: 'El veintisiete',
  28: 'El veintiocho',
  29: 'El veintinueve',
  30: 'El treinta',
  31: 'El vacilón continúa, el treinta y uno',
  32: 'El treinta y dos',
  33: 'La edad de Cristo, el treinta y tres',
  34: 'La cabeza del gato, el treinta y cuatro',
  35: 'El loquillo del pueblo, el treinta y cinco',
  36: 'Búsquelo bien, el treinta y seis',
  37: 'El treinta y siete',
  38: 'El treinta y ocho',
  39: 'El treinta y nueve',
  40: 'El cuarenta',
  41: 'Cae uno por uno, el cuarenta y uno',
  42: 'El cuarenta y dos',
  43: 'El cuarenta y tres',
  44: 'Las dos sillitas de la escuela, el cuarenta y cuatro',
  45: 'A medio camino, el cuarenta y cinco',
  46: 'Pura vida mae, el cuarenta y seis',
  47: 'El cuarenta y siete',
  48: 'El viejo chocho, el cuarenta y ocho',
  49: 'El cuarenta y nueve',
  50: 'La media teja, el cincuenta',
  51: 'El cincuenta y uno',
  52: 'Sin codos, el cincuenta y dos',
  53: 'El cincuenta y tres',
  54: 'Ojo con el gato, el cincuenta y cuatro',
  55: 'Pegando un brinco, el cincuenta y cinco',
  56: 'El cincuenta y seis',
  57: 'El cincuenta y siete',
  58: 'El cincuenta y ocho',
  59: 'Pero mira como se mueve, el cincuenta y nueve',
  60: 'Venga y se sienta, el sesenta',
  61: 'El sesenta y uno',
  62: 'El sesenta y dos',
  63: 'El sesenta y tres',
  64: 'El sesenta y cuatro',
  65: 'Brinquito de alegría, el sesenta y cinco',
  66: 'Dos monjitas, el sesenta y seis',
  67: 'El sesenta y siete',
  68: 'Que sirvan el bizcocho, el sesenta y ocho',
  69: 'Arriba y abajo, el sesenta y nueve',
  70: 'El setenta',
  71: 'La bruja, el setenta y uno',
  72: 'Los dos de la fila, el setenta y dos',
  73: 'El setenta y tres',
  74: 'El setenta y cuatro',
  75: 'El que limpia el cartón, el setenta y cinco',
  76: 'El setenta y seis',
  77: 'Las dos hachas para la leña, el setenta y siete',
  78: 'El setenta y ocho',
  79: 'El setenta y nueve',
  80: 'La gente está atenta, el ochenta',
  81: 'El ochenta y uno',
  82: 'Los dos amigos de siempre, el ochenta y dos',
  83: 'El ochenta y tres',
  84: 'El ochenta y cuatro',
  85: 'El último brinco, el ochenta y cinco',
  86: 'El ochenta y seis',
  87: 'El ochenta y siete',
  88: 'El ochenta y ocho',
  89: 'El ochenta y nueve',
  90: 'El tata del bingo, el noventa',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateAudio(text, outputPath) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      text: text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true
      }
    });

    const options = {
      hostname: 'api.elevenlabs.io',
      path: '/v1/text-to-speech/' + VOICE_ID + '?output_format=mp3_44100_128',
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        let errData = '';
        res.on('data', (chunk) => { errData += chunk; });
        res.on('end', () => reject(new Error('HTTP ' + res.statusCode + ': ' + errData)));
        return;
      }
      const chunks = [];
      res.on('data', (chunk) => { chunks.push(chunk); });
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        fs.writeFileSync(outputPath, buffer);
        resolve(buffer.length);
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function getRemainingQuota() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.elevenlabs.io',
      path: '/v1/user/subscription',
      method: 'GET',
      headers: { 'xi-api-key': API_KEY }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.character_limit - json.character_count);
        } catch (e) {
          reject(new Error('Error parseando respuesta: ' + data));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(65));
  console.log('GENERADOR DE FRASES DE BINGO COSTARRICENSE');
  console.log('Voz: Charlie (IKne3meq5aSn9XLyUdCD) - Masculina');
  console.log('Destino: public/audio/numbers/N_var.mp3');
  console.log('='.repeat(65));

  // Calcular total de caracteres
  let totalChars = 0;
  for (let i = 1; i <= 90; i++) totalChars += bingoFrases[i].length;
  console.log('\nTotal frases:      90');
  console.log('Total caracteres:  ' + totalChars);

  // Verificar cuota
  const initialQuota = await getRemainingQuota();
  console.log('Cuota disponible:  ' + initialQuota + ' caracteres');
  console.log('Sobrante estimado: ' + (initialQuota - totalChars) + ' caracteres\n');

  if (initialQuota < totalChars) {
    console.log('ERROR: Cuota insuficiente. Necesitas ' + totalChars + ' pero solo tienes ' + initialQuota);
    process.exit(1);
  }

  // Asegurar que el directorio existe
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log('Directorio creado: ' + OUTPUT_DIR);
  }

  let success = 0;
  let errors = 0;
  let charsUsed = 0;

  console.log('='.repeat(65));
  console.log('Generando 90 archivos _var.mp3 con frases de bingo...');
  console.log('(Los archivos existentes seran REEMPLAZADOS)');
  console.log('='.repeat(65) + '\n');

  for (let i = 1; i <= 90; i++) {
    const text = bingoFrases[i];
    const outputPath = path.join(OUTPUT_DIR, i + '_var.mp3');
    const exists = fs.existsSync(outputPath) ? '[REEMPLAZA]' : '[NUEVO]    ';

    try {
      process.stdout.write(i + '. ' + exists + ' "' + text + '" ... ');
      const size = await generateAudio(text, outputPath);
      charsUsed += text.length;
      success++;
      console.log('OK (' + size + ' bytes)');
      // Pausa de 600ms entre peticiones para no saturar la API
      await sleep(600);
    } catch (err) {
      errors++;
      console.log('ERROR: ' + err.message);
    }
  }

  // Verificar cuota final
  const finalQuota = await getRemainingQuota();

  console.log('\n' + '='.repeat(65));
  console.log('RESUMEN FINAL');
  console.log('='.repeat(65));
  console.log('Archivos generados:    ' + success + '/90');
  console.log('Errores:               ' + errors);
  console.log('Caracteres usados:     ~' + charsUsed);
  console.log('Cuota usada sesion:    ~' + (initialQuota - finalQuota));
  console.log('Cuota restante final:  ' + finalQuota + ' caracteres');
  console.log('Directorio:            ' + OUTPUT_DIR);

  // Contar archivos _var.mp3 en el directorio
  const allFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('_var.mp3'));
  console.log('\nArchivos _var.mp3 en numbers/: ' + allFiles.length);
  console.log('='.repeat(65) + '\n');

  if (errors > 0) {
    console.log('ADVERTENCIA: ' + errors + ' archivos fallaron. Vuelve a ejecutar el script para reintentar.');
  } else {
    console.log('Todos los audios generados exitosamente.');
  }
}

main().catch(console.error);

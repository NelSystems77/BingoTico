/**
 * Script para generar audios de frases de bingo costarricense
 * Voz: IKne3meq5aSn9XLyUdCD - Charlie (masculina)
 * Genera N_call1.mp3 y N_call2.mp3 para números 1-75
 * Destino: public/audio/numbers-male/
 * Total: 150 archivos
 * Formato: MP3 44.1 kHz, 128 kbps
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'sk_907c37a2c4605f6bff3ebec3ef527522002320889197249f';
const VOICE_ID = 'IKne3meq5aSn9XLyUdCD'; // Charlie - Deep, Confident, Energetic
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'audio', 'numbers-male');

// Dos frases TTS por número: [call1, call2]
const bingoFrases = {
  1:  ['Letra: B, El primero de la tanda, el uno',            'Letra: B, Solito, el uno'],
  2:  ['Letra: B, El patito solo en el agua, el dos',         'Letra: B, El patito, el dos'],
  3:  ['Letra: B, La Santísima Trinidad, el tres',            'Letra: B, La Trinidad, el tres'],
  4:  ['Letra: B, Como las patas del gato, el cuatro',        'Letra: B, La sillita al revés, el cuatro'],
  5:  ['Letra: B, Los dedos de la mano, el cinco',            'Letra: B, Como los sentidos, el cinco'],
  6:  ['Letra: B, Media docena de huevos, el seis',           'Letra: B, La media docena, el seis'],
  7:  ['Letra: B, El hacha de mi abuelo, el siete',           'Letra: B, El de la suerte, el siete'],
  8:  ['Letra: B, Comiendo bizcocho, el ocho',                'Letra: B, El chavo del ocho, el ocho'],
  9:  ['Letra: B, El rabo del chancho, el nueve',             'Letra: B, El nueve, el nueve'],
  10: ['Letra: B, Diez deditos, el diez',                     'Letra: B, Manitas juntas, el diez'],
  11: ['Letra: B, Las canillas de mi abuela, el once',        'Letra: B, Las estacas del potrero, el once'],
  12: ['Letra: B, Docena de huevos, el doce',                 'Letra: B, El doce, el doce'],
  13: ['Letra: B, Que no nos traiga mala suerte, el trece',   'Letra: B, Que no caiga viernes, el trece'],
  14: ['Letra: B, Limpio y esperando que paguen, el catorce', 'Letra: B, El catorce, el catorce'],
  15: ['Letra: B, La quinceañera del barrio, el quince',      'Letra: B, El quince, el quince'],

  16: ['Letra: I, La hora del café, el dieciséis',            'Letra: I, El dieciséis, el dieciséis'],
  17: ['Letra: I, Se mete la suerte, el diecisiete',          'Letra: I, Palo y hacha, el diecisiete'],
  18: ['Letra: I, El mayor de edad, el dieciocho',            'Letra: I, Ya es legal, el dieciocho'],
  19: ['Letra: I, Falta uno para los veinte, el diecinueve',  'Letra: I, Casi veinte, el diecinueve'],
  20: ['Letra: I, Pato con huevo, el veinte',                 'Letra: I, Veinte redondo, el veinte'],
  21: ['Letra: I, El veintiuno, el veintiuno',                'Letra: I, El que no sabe, el veintiuno'],
  22: ['Letra: I, Los dos patitos en el agua, el veintidós',  'Letra: I, Los patitos, el veintidós'],
  23: ['Letra: I, El veintitrés, el veintitrés',              'Letra: I, Vuelva a ver, el veintitrés'],
  24: ['Letra: I, Nochebuena, el veinticuatro',               'Letra: I, La noche buena, el veinticuatro'],
  25: ['Letra: I, Nació el Niño Dios, el veinticinco',        'Letra: I, Navidad, el veinticinco'],
  26: ['Letra: I, El veintiséis, el veintiséis',              'Letra: I, Como debe ser, el veintiséis'],
  27: ['Letra: I, El veintisiete, el veintisiete',            'Letra: I, Apriete el cartón, el veintisiete'],
  28: ['Letra: I, El veintiocho, el veintiocho',              'Letra: I, Qué derroche, el veintiocho'],
  29: ['Letra: I, El veintinueve, el veintinueve',            'Letra: I, Antes del treinta, el veintinueve'],
  30: ['Letra: I, El treinta, el treinta',                    'Letra: I, Se pone bueno, el treinta'],

  31: ['Letra: N, El vacilón continúa, el treinta y uno',     'Letra: N, Seguimos, el treinta y uno'],
  32: ['Letra: N, El treinta y dos, el treinta y dos',        'Letra: N, Vámonos los dos, el treinta y dos'],
  33: ['Letra: N, La edad de Cristo, el treinta y tres',      'Letra: N, Treinta y tres, el treinta y tres'],
  34: ['Letra: N, La cabeza del gato, el treinta y cuatro',   'Letra: N, Cabeza de gato, el treinta y cuatro'],
  35: ['Letra: N, El loquillo del pueblo, el treinta y cinco','Letra: N, El loco, el treinta y cinco'],
  36: ['Letra: N, Búsquelo bien, el treinta y seis',          'Letra: N, A buscar, el treinta y seis'],
  37: ['Letra: N, El treinta y siete, el treinta y siete',    'Letra: N, Pura suerte, el treinta y siete'],
  38: ['Letra: N, El treinta y ocho, el treinta y ocho',      'Letra: N, Trasnochado, el treinta y ocho'],
  39: ['Letra: N, El treinta y nueve, el treinta y nueve',    'Letra: N, Se mueve, el treinta y nueve'],
  40: ['Letra: N, El cuarenta, el cuarenta',                  'Letra: N, Se puso bueno, el cuarenta'],
  41: ['Letra: N, Cae uno por uno, el cuarenta y uno',        'Letra: N, Uno a uno, el cuarenta y uno'],
  42: ['Letra: N, El cuarenta y dos, el cuarenta y dos',      'Letra: N, El perdido, el cuarenta y dos'],
  43: ['Letra: N, El cuarenta y tres, el cuarenta y tres',    'Letra: N, Se la sabe, el cuarenta y tres'],
  44: ['Letra: N, Las dos sillitas de la escuela, el cuarenta y cuatro', 'Letra: N, Las sillitas, el cuarenta y cuatro'],
  45: ['Letra: N, A medio camino, el cuarenta y cinco',       'Letra: N, La mitad, el cuarenta y cinco'],

  46: ['Letra: G, Pura vida mae, el cuarenta y seis',         'Letra: G, Pura vida, el cuarenta y seis'],
  47: ['Letra: G, El cuarenta y siete, el cuarenta y siete',  'Letra: G, Suerte, el cuarenta y siete'],
  48: ['Letra: G, El viejo chocho, el cuarenta y ocho',       'Letra: G, El chocho, el cuarenta y ocho'],
  49: ['Letra: G, El cuarenta y nueve, el cuarenta y nueve',  'Letra: G, No se duerma, el cuarenta y nueve'],
  50: ['Letra: G, La media teja, el cincuenta',               'Letra: G, Media teja, el cincuenta'],
  51: ['Letra: G, El cincuenta y uno, el cincuenta y uno',    'Letra: G, Ya casi, el cincuenta y uno'],
  52: ['Letra: G, Sin codos, el cincuenta y dos',             'Letra: G, Rece un toque, el cincuenta y dos'],
  53: ['Letra: G, El cincuenta y tres, el cincuenta y tres',  'Letra: G, No se quede, el cincuenta y tres'],
  54: ['Letra: G, Ojo con el gato, el cincuenta y cuatro',    'Letra: G, El gato, el cincuenta y cuatro'],
  55: ['Letra: G, Pegando un brinco, el cincuenta y cinco',   'Letra: G, El brinco, el cincuenta y cinco'],
  56: ['Letra: G, El cincuenta y seis, el cincuenta y seis',  'Letra: G, Maicito, el cincuenta y seis'],
  57: ['Letra: G, El cincuenta y siete, el cincuenta y siete','Letra: G, Apriete, el cincuenta y siete'],
  58: ['Letra: G, El cincuenta y ocho, el cincuenta y ocho',  'Letra: G, Bien tostado, el cincuenta y ocho'],
  59: ['Letra: G, Pero mira como se mueve, el cincuenta y nueve', 'Letra: G, Se mueve, el cincuenta y nueve'],
  60: ['Letra: G, Venga y se sienta, el sesenta',             'Letra: G, Ya calienta, el sesenta'],

  61: ['Letra: O, El sesenta y uno, el sesenta y uno',        'Letra: O, Uno más, el sesenta y uno'],
  62: ['Letra: O, El sesenta y dos, el sesenta y dos',        'Letra: O, Vámonos, el sesenta y dos'],
  63: ['Letra: O, El sesenta y tres, el sesenta y tres',      'Letra: O, Revise, el sesenta y tres'],
  64: ['Letra: O, El sesenta y cuatro, el sesenta y cuatro',  'Letra: O, La suerte, el sesenta y cuatro'],
  65: ['Letra: O, Brinquito de alegría, el sesenta y cinco',  'Letra: O, Brinquito, el sesenta y cinco'],
  66: ['Letra: O, Dos monjitas, el sesenta y seis',           'Letra: O, Las monjas, el sesenta y seis'],
  67: ['Letra: O, El sesenta y siete, el sesenta y siete',    'Letra: O, Se asoma, el sesenta y siete'],
  68: ['Letra: O, Que sirvan el bizcocho, el sesenta y ocho', 'Letra: O, Ya huele a bizcocho, el sesenta y ocho'],
  69: ['Letra: O, Arriba y abajo, el sesenta y nueve',        'Letra: O, Arriba y abajo, el sesenta y nueve'],
  70: ['Letra: O, El setenta, el setenta',                    'Letra: O, De película, el setenta'],
  71: ['Letra: O, La bruja, el setenta y uno',                'Letra: O, La bruja, el setenta y uno'],
  72: ['Letra: O, Los dos de la fila, el setenta y dos',      'Letra: O, Los de la fila, el setenta y dos'],
  73: ['Letra: O, El setenta y tres, el setenta y tres',      'Letra: O, No se pierda, el setenta y tres'],
  74: ['Letra: O, El setenta y cuatro, el setenta y cuatro',  'Letra: O, Ojo al número, el setenta y cuatro'],
  75: ['Letra: O, El que limpia el cartón, el setenta y cinco','Letra: O, Cartón limpio, el setenta y cinco'],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateAudio(text, outputPath) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      text,
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
      res.on('data', (chunk) => chunks.push(chunk));
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
  // Construir lista de tareas: 2 por número (call1 y call2)
  const tasks = [];
  let totalChars = 0;
  for (let i = 1; i <= 75; i++) {
    const [c1, c2] = bingoFrases[i];
    tasks.push({ num: i, slot: 'call1', text: c1, file: i + '_call1.mp3' });
    tasks.push({ num: i, slot: 'call2', text: c2, file: i + '_call2.mp3' });
    totalChars += c1.length + c2.length;
  }

  console.log('='.repeat(65));
  console.log('GENERADOR DE FRASES DE BINGO - VOZ MASCULINA (Charlie)');
  console.log('Números: 1–75  |  2 frases cada uno  |  150 archivos');
  console.log('Destino: public/audio/numbers-male/');
  console.log('='.repeat(65));
  console.log('\nTotal archivos:    ' + tasks.length);
  console.log('Total caracteres:  ' + totalChars);

  const initialQuota = await getRemainingQuota();
  console.log('Cuota disponible:  ' + initialQuota + ' caracteres');
  console.log('Sobrante estimado: ' + (initialQuota - totalChars) + ' caracteres\n');

  if (initialQuota < totalChars) {
    console.log('ERROR: Cuota insuficiente. Necesitas ' + totalChars + ' pero tienes ' + initialQuota);
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log('Directorio creado: ' + OUTPUT_DIR);
  }

  let success = 0;
  let errors = 0;
  let charsUsed = 0;
  const failed = [];

  console.log('='.repeat(65));
  console.log('Generando ' + tasks.length + ' archivos...');
  console.log('='.repeat(65) + '\n');

  for (const task of tasks) {
    const outputPath = path.join(OUTPUT_DIR, task.file);
    const exists = fs.existsSync(outputPath) ? '[REEMPLAZA]' : '[NUEVO]    ';

    try {
      process.stdout.write(task.num + ' ' + task.slot + '. ' + exists + ' "' + task.text + '" ... ');
      const size = await generateAudio(task.text, outputPath);
      charsUsed += task.text.length;
      success++;
      console.log('OK (' + size + ' bytes)');
      await sleep(600);
    } catch (err) {
      errors++;
      failed.push(task.file);
      console.log('ERROR: ' + err.message);
    }
  }

  const finalQuota = await getRemainingQuota();

  console.log('\n' + '='.repeat(65));
  console.log('RESUMEN FINAL');
  console.log('='.repeat(65));
  console.log('Archivos generados:    ' + success + '/' + tasks.length);
  console.log('Errores:               ' + errors);
  if (failed.length > 0) console.log('Fallidos:              ' + failed.join(', '));
  console.log('Caracteres usados:     ~' + charsUsed);
  console.log('Cuota usada sesión:    ~' + (initialQuota - finalQuota));
  console.log('Cuota restante final:  ' + finalQuota + ' caracteres');
  console.log('Directorio:            ' + OUTPUT_DIR);

  const call1Files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('_call1.mp3'));
  const call2Files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('_call2.mp3'));
  console.log('\nArchivos _call1.mp3: ' + call1Files.length);
  console.log('Archivos _call2.mp3: ' + call2Files.length);
  console.log('='.repeat(65) + '\n');

  if (errors > 0) {
    console.log('ADVERTENCIA: ' + errors + ' archivos fallaron. Vuelve a ejecutar el script para reintentar.');
  } else {
    console.log('Todos los audios generados exitosamente.');
  }
}

main().catch(console.error);

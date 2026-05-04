/**
 * Script para generar variaciones de audio para números 1-75 (voz masculina)
 * Voz: IKne3meq5aSn9XLyUdCD - Charlie (Deep, Confident, Energetic)
 * Solo genera _var.mp3 para números que aún no tienen variación
 * Formato: MP3 44.1 kHz, 128 kbps, mono
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'sk_d987440989dbb903dd91578efbdcf10827498b82838631a7';
const VOICE_ID = 'IKne3meq5aSn9XLyUdCD'; // Charlie - Deep, Confident, Energetic
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'audio', 'numbers');

// Variaciones creativas con frases de bingo costarricense
// Solo para los 60 números que NO tienen _var.mp3 todavía
const variationTexts = {
  2:  'dos, el par',
  3:  'tres, la trinidad',
  4:  'cuatro, las patas de la mesa',
  5:  'cinco, la mano',
  6:  'seis, media docena',
  8:  'ocho, el loco',
  9:  'nueve, la bola',
  10: 'diez, la decena',
  12: 'doce, la docena',
  14: 'catorce',
  16: 'dieciséis',
  17: 'diecisiete',
  18: 'dieciocho',
  19: 'diecinueve',
  20: 'veinte, las veintenas',
  21: 'veintiuno, el as más uno',
  23: 'veintitrés',
  24: 'veinticuatro',
  25: 'veinticinco, el cuarto de siglo',
  26: 'veintiséis',
  27: 'veintisiete',
  28: 'veintiocho',
  29: 'veintinueve',
  30: 'treinta, las treintenas',
  31: 'treinta y uno',
  32: 'treinta y dos',
  33: 'treinta y tres, los tres tristes tigres',
  34: 'treinta y cuatro',
  36: 'treinta y seis',
  37: 'treinta y siete',
  39: 'treinta y nueve',
  40: 'cuarenta, los cuarenta ladrones',
  41: 'cuarenta y uno',
  42: 'cuarenta y dos',
  43: 'cuarenta y tres',
  45: 'cuarenta y cinco',
  46: 'cuarenta y seis',
  47: 'cuarenta y siete',
  48: 'cuarenta y ocho',
  49: 'cuarenta y nueve',
  51: 'cincuenta y uno',
  53: 'cincuenta y tres',
  54: 'cincuenta y cuatro',
  55: 'cincuenta y cinco, el quinto quinto',
  56: 'cincuenta y seis',
  57: 'cincuenta y siete',
  58: 'cincuenta y ocho',
  59: 'cincuenta y nueve',
  60: 'sesenta, las sesentenas',
  61: 'sesenta y uno',
  62: 'sesenta y dos',
  63: 'sesenta y tres',
  64: 'sesenta y cuatro',
  65: 'sesenta y cinco',
  67: 'sesenta y siete',
  69: 'sesenta y nueve',
  70: 'setenta, las setentenas',
  72: 'setenta y dos',
  73: 'setenta y tres',
  74: 'setenta y cuatro',
};

function calculateTotalChars() {
  let total = 0;
  const entries = Object.entries(variationTexts);
  entries.forEach(([n, t]) => { total += t.length; });
  console.log('\nNúmeros a generar: ' + entries.length);
  console.log('Total caracteres estimados: ' + total);
  console.log('Créditos disponibles: ~6787');
  console.log('Sobrante estimado: ~' + (6787 - total) + '\n');
  return total;
}

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
        const json = JSON.parse(data);
        resolve(json.character_limit - json.character_count);
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('═'.repeat(60));
  console.log('GENERADOR DE VARIACIONES - VOZ MASCULINA (Charlie)');
  console.log('Números 1-75 sin variación → ' + Object.keys(variationTexts).length + ' archivos _var.mp3');
  console.log('═'.repeat(60));

  calculateTotalChars();

  const initialQuota = await getRemainingQuota();
  console.log('Cuota disponible al inicio: ' + initialQuota + ' caracteres\n');

  let success = 0;
  let skipped = 0;
  let errors = 0;

  const numbers = Object.keys(variationTexts).map(Number).sort((a, b) => a - b);

  for (const num of numbers) {
    const text = variationTexts[num];
    const outputPath = path.join(OUTPUT_DIR, num + '_var.mp3');

    if (fs.existsSync(outputPath)) {
      console.log('[SKIP] ' + num + '_var.mp3 ya existe');
      skipped++;
      continue;
    }

    try {
      process.stdout.write('Generando ' + num + '_var.mp3 ("' + text + '") ... ');
      const size = await generateAudio(text, outputPath);
      success++;
      console.log('OK (' + size + ' bytes, ' + text.length + ' chars)');
      await sleep(500);
    } catch (err) {
      errors++;
      console.log('ERROR: ' + err.message);
    }
  }

  const finalQuota = await getRemainingQuota();

  console.log('\n' + '═'.repeat(60));
  console.log('RESUMEN FINAL');
  console.log('═'.repeat(60));
  console.log('Variaciones generadas: ' + success + '/' + numbers.length);
  console.log('Saltadas (ya existían): ' + skipped);
  console.log('Errores:               ' + errors);
  console.log('Cuota usada:           ~' + (initialQuota - finalQuota) + ' caracteres');
  console.log('Cuota restante final:  ' + finalQuota + ' caracteres');

  const allFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.mp3'));
  const varFiles = allFiles.filter(f => f.includes('_var'));
  console.log('\nArchivos _var.mp3 en numbers/: ' + varFiles.length);
  console.log('Total archivos MP3 en numbers/: ' + allFiles.length);
  console.log('═'.repeat(60) + '\n');
}

main().catch(console.error);

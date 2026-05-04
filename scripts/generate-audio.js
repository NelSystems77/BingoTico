/**
 * Script para generar audios de números de Bingo usando ElevenLabs API
 * Voz: beQfcCW5PgdTQs4cETaz (masculina)
 * Formato: MP3 44.1 kHz, 128 kbps, mono
 * Cuota: 10,000 caracteres gratuitos
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'sk_d987440989dbb903dd91578efbdcf10827498b82838631a7';
const VOICE_ID = 'beQfcCW5PgdTQs4cETaz';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'audio', 'numbers');

// Textos para cada número del 1 al 75
const numberTexts = {
  1:  'uno',
  2:  'dos',
  3:  'tres',
  4:  'cuatro',
  5:  'cinco',
  6:  'seis',
  7:  'siete',
  8:  'ocho',
  9:  'nueve',
  10: 'diez',
  11: 'once',
  12: 'doce',
  13: 'trece',
  14: 'catorce',
  15: 'quince',
  16: 'dieciséis',
  17: 'diecisiete',
  18: 'dieciocho',
  19: 'diecinueve',
  20: 'veinte',
  21: 'veintiuno',
  22: 'veintidós',
  23: 'veintitrés',
  24: 'veinticuatro',
  25: 'veinticinco',
  26: 'veintiséis',
  27: 'veintisiete',
  28: 'veintiocho',
  29: 'veintinueve',
  30: 'treinta',
  31: 'treinta y uno',
  32: 'treinta y dos',
  33: 'treinta y tres',
  34: 'treinta y cuatro',
  35: 'treinta y cinco',
  36: 'treinta y seis',
  37: 'treinta y siete',
  38: 'treinta y ocho',
  39: 'treinta y nueve',
  40: 'cuarenta',
  41: 'cuarenta y uno',
  42: 'cuarenta y dos',
  43: 'cuarenta y tres',
  44: 'cuarenta y cuatro',
  45: 'cuarenta y cinco',
  46: 'cuarenta y seis',
  47: 'cuarenta y siete',
  48: 'cuarenta y ocho',
  49: 'cuarenta y nueve',
  50: 'cincuenta',
  51: 'cincuenta y uno',
  52: 'cincuenta y dos',
  53: 'cincuenta y tres',
  54: 'cincuenta y cuatro',
  55: 'cincuenta y cinco',
  56: 'cincuenta y seis',
  57: 'cincuenta y siete',
  58: 'cincuenta y ocho',
  59: 'cincuenta y nueve',
  60: 'sesenta',
  61: 'sesenta y uno',
  62: 'sesenta y dos',
  63: 'sesenta y tres',
  64: 'sesenta y cuatro',
  65: 'sesenta y cinco',
  66: 'sesenta y seis',
  67: 'sesenta y siete',
  68: 'sesenta y ocho',
  69: 'sesenta y nueve',
  70: 'setenta',
  71: 'setenta y uno',
  72: 'setenta y dos',
  73: 'setenta y tres',
  74: 'setenta y cuatro',
  75: 'setenta y cinco',
};

// Variaciones para números especiales (frases de bingo costarricense)
const variationTexts = {
  1:  'el número uno, el primero',
  7:  'el siete, la suerte',
  11: 'once, las patitas',
  13: 'trece, la mala suerte',
  15: 'quince, la quinceañera',
  22: 'veintidós, los patitos',
  35: 'treinta y cinco',
  38: 'treinta y ocho',
  44: 'cuarenta y cuatro, las sillas',
  50: 'cincuenta, medio siglo',
  52: 'cincuenta y dos',
  66: 'sesenta y seis, las llaves',
  68: 'sesenta y ocho',
  71: 'setenta y uno',
  75: 'setenta y cinco, el último',
};

// Calcular total de caracteres
function calculateTotalChars() {
  let total = 0;
  for (let i = 1; i <= 75; i++) {
    total += numberTexts[i].length;
  }
  console.log(`\nCaracteres para números base (1-75): ${total}`);
  
  let varTotal = 0;
  for (const [num, text] of Object.entries(variationTexts)) {
    varTotal += text.length;
  }
  console.log(`Caracteres para variaciones: ${varTotal}`);
  console.log(`Total estimado: ${total + varTotal}`);
  console.log(`Cuota disponible: 10,000`);
  console.log(`Sobrante estimado: ${10000 - total - varTotal}\n`);
}

// Función para hacer la petición a ElevenLabs
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
      path: `/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
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
        res.on('end', () => {
          reject(new Error(`HTTP ${res.statusCode}: ${errData}`));
        });
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

// Función para obtener cuota restante
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

// Función de espera
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // Crear directorio de salida
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Directorio creado: ${OUTPUT_DIR}`);
  }

  calculateTotalChars();

  // Verificar cuota inicial
  const initialQuota = await getRemainingQuota();
  console.log(`Cuota disponible al inicio: ${initialQuota} caracteres\n`);

  let totalCharsUsed = 0;
  let successCount = 0;
  let errorCount = 0;

  // ─── FASE 1: Generar números base 1-75 ───────────────────────────────────
  console.log('═══════════════════════════════════════════');
  console.log('FASE 1: Generando números base del 1 al 75');
  console.log('═══════════════════════════════════════════\n');

  for (let i = 1; i <= 75; i++) {
    const text = numberTexts[i];
    const outputPath = path.join(OUTPUT_DIR, `${i}.mp3`);

    // Saltar si ya existe
    if (fs.existsSync(outputPath)) {
      console.log(`[SKIP] ${i}.mp3 ya existe`);
      successCount++;
      continue;
    }

    try {
      process.stdout.write(`Generando ${i}.mp3 ("${text}") ... `);
      const size = await generateAudio(text, outputPath);
      totalCharsUsed += text.length;
      successCount++;
      console.log(`OK (${size} bytes, ${text.length} chars)`);
      
      // Pequeña pausa para no saturar la API
      await sleep(500);
    } catch (err) {
      errorCount++;
      console.log(`ERROR: ${err.message}`);
    }
  }

  console.log(`\n✓ Fase 1 completada: ${successCount} archivos, ${errorCount} errores`);
  console.log(`  Caracteres usados en fase 1: ~${totalCharsUsed}`);

  // Verificar cuota restante
  const quotaAfterPhase1 = await getRemainingQuota();
  console.log(`  Cuota restante: ${quotaAfterPhase1} caracteres\n`);

  // ─── FASE 2: Variaciones para números especiales ──────────────────────────
  const specialNumbers = [1, 7, 11, 13, 15, 22, 35, 38, 44, 50, 52, 66, 68, 71, 75];
  
  // Calcular cuántos caracteres necesitamos para las variaciones
  let varCharsNeeded = 0;
  for (const num of specialNumbers) {
    varCharsNeeded += variationTexts[num].length;
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('FASE 2: Generando variaciones para números especiales');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Números especiales: ${specialNumbers.join(', ')}`);
  console.log(`Caracteres necesarios para variaciones: ${varCharsNeeded}`);
  console.log(`Cuota disponible: ${quotaAfterPhase1}\n`);

  if (quotaAfterPhase1 < varCharsNeeded) {
    console.log(`⚠ Cuota insuficiente para todas las variaciones.`);
    console.log(`  Se generarán las variaciones que quepan en la cuota.\n`);
  }

  let varSuccessCount = 0;
  let varErrorCount = 0;
  let remainingQuota = quotaAfterPhase1;

  for (const num of specialNumbers) {
    const text = variationTexts[num];
    
    if (remainingQuota < text.length) {
      console.log(`[SKIP] Variación ${num} ("${text}") - cuota insuficiente (${remainingQuota} < ${text.length})`);
      continue;
    }

    const outputPath = path.join(OUTPUT_DIR, `${num}_var.mp3`);

    // Saltar si ya existe
    if (fs.existsSync(outputPath)) {
      console.log(`[SKIP] ${num}_var.mp3 ya existe`);
      varSuccessCount++;
      continue;
    }

    try {
      process.stdout.write(`Generando ${num}_var.mp3 ("${text}") ... `);
      const size = await generateAudio(text, outputPath);
      remainingQuota -= text.length;
      varSuccessCount++;
      console.log(`OK (${size} bytes, ${text.length} chars) | Cuota restante: ~${remainingQuota}`);
      
      await sleep(500);
    } catch (err) {
      varErrorCount++;
      console.log(`ERROR: ${err.message}`);
    }
  }

  console.log(`\n✓ Fase 2 completada: ${varSuccessCount} variaciones, ${varErrorCount} errores`);

  // Resumen final
  const finalQuota = await getRemainingQuota();
  console.log('\n═══════════════════════════════════════');
  console.log('RESUMEN FINAL');
  console.log('═══════════════════════════════════════');
  console.log(`Archivos base generados: ${successCount}/75`);
  console.log(`Variaciones generadas:   ${varSuccessCount}/${specialNumbers.length}`);
  console.log(`Cuota restante final:    ${finalQuota} caracteres`);
  console.log(`Directorio de salida:    ${OUTPUT_DIR}`);
  
  // Listar archivos generados
  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.mp3'));
  console.log(`\nTotal archivos MP3 en directorio: ${files.length}`);
  console.log('═══════════════════════════════════════\n');
}

main().catch(console.error);

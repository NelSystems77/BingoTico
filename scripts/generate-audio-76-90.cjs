/**
 * Script para generar audios de números 76-90 de Bingo usando ElevenLabs API
 * Voz masculina: IKne3meq5aSn9XLyUdCD - Charlie (Deep, Confident, Energetic)
 * Voz femenina:  cgSgspJ2msm6clMCkdW9 - Jessica (Playful, Bright, Warm)
 * Formato: MP3 44.1 kHz, 128 kbps, mono
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'sk_d987440989dbb903dd91578efbdcf10827498b82838631a7';

const VOICES = [
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie (masculina)', dir: 'numbers' },
  { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica (femenina)',  dir: 'numbers-female' },
];

// Textos para números 76-90
const numberTexts = {
  76: 'setenta y seis',
  77: 'setenta y siete',
  78: 'setenta y ocho',
  79: 'setenta y nueve',
  80: 'ochenta',
  81: 'ochenta y uno',
  82: 'ochenta y dos',
  83: 'ochenta y tres',
  84: 'ochenta y cuatro',
  85: 'ochenta y cinco',
  86: 'ochenta y seis',
  87: 'ochenta y siete',
  88: 'ochenta y ocho',
  89: 'ochenta y nueve',
  90: 'noventa',
};

// Variaciones para todos los números 76-90
const variationTexts = {
  76: 'setenta y seis',
  77: 'setenta y siete',
  78: 'setenta y ocho',
  79: 'setenta y nueve',
  80: 'ochenta, las ochentas',
  81: 'ochenta y uno',
  82: 'ochenta y dos',
  83: 'ochenta y tres',
  84: 'ochenta y cuatro',
  85: 'ochenta y cinco',
  86: 'ochenta y seis',
  87: 'ochenta y siete',
  88: 'ochenta y ocho, los abrazos',
  89: 'ochenta y nueve',
  90: 'noventa, el último número',
};

// Calcular total de caracteres
function calculateTotalChars() {
  let base = 0, vars = 0;
  for (let i = 76; i <= 90; i++) {
    base += numberTexts[i].length;
    vars += variationTexts[i].length;
  }
  console.log(`\nCaracteres base (76-90):      ${base} × 2 voces = ${base * 2}`);
  console.log(`Caracteres variaciones (76-90): ${vars} × 2 voces = ${vars * 2}`);
  console.log(`Total estimado: ${(base + vars) * 2} caracteres\n`);
}

// Función para hacer la petición a ElevenLabs
function generateAudio(voiceId, text, outputPath) {
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
      path: `/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
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
        res.on('end', () => reject(new Error(`HTTP ${res.statusCode}: ${errData}`)));
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateForVoice(voice) {
  const outputDir = path.join(__dirname, '..', 'public', 'audio', voice.dir);

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`VOZ: ${voice.name}`);
  console.log(`Directorio: ${outputDir}`);
  console.log('═'.repeat(60));

  let successBase = 0, successVar = 0, errors = 0;

  // ── Números base 76-90 ──────────────────────────────────────
  console.log('\n── Números base (76-90) ──');
  for (let i = 76; i <= 90; i++) {
    const text = numberTexts[i];
    const outputPath = path.join(outputDir, `${i}.mp3`);

    if (fs.existsSync(outputPath)) {
      console.log(`[SKIP] ${i}.mp3 ya existe`);
      successBase++;
      continue;
    }

    try {
      process.stdout.write(`Generando ${i}.mp3 ("${text}") ... `);
      const size = await generateAudio(voice.id, text, outputPath);
      successBase++;
      console.log(`OK (${size} bytes)`);
      await sleep(500);
    } catch (err) {
      errors++;
      console.log(`ERROR: ${err.message}`);
    }
  }

  // ── Variaciones 76-90 ───────────────────────────────────────
  console.log('\n── Variaciones (76-90) ──');
  for (let i = 76; i <= 90; i++) {
    const text = variationTexts[i];
    const outputPath = path.join(outputDir, `${i}_var.mp3`);

    if (fs.existsSync(outputPath)) {
      console.log(`[SKIP] ${i}_var.mp3 ya existe`);
      successVar++;
      continue;
    }

    try {
      process.stdout.write(`Generando ${i}_var.mp3 ("${text}") ... `);
      const size = await generateAudio(voice.id, text, outputPath);
      successVar++;
      console.log(`OK (${size} bytes)`);
      await sleep(500);
    } catch (err) {
      errors++;
      console.log(`ERROR: ${err.message}`);
    }
  }

  console.log(`\n✓ ${voice.name}: base=${successBase}/15, variaciones=${successVar}/15, errores=${errors}`);
  return { successBase, successVar, errors };
}

async function main() {
  calculateTotalChars();

  const initialQuota = await getRemainingQuota();
  console.log(`Cuota disponible al inicio: ${initialQuota} caracteres`);

  const results = [];
  for (const voice of VOICES) {
    const result = await generateForVoice(voice);
    results.push({ voice: voice.name, ...result });
  }

  const finalQuota = await getRemainingQuota();

  console.log('\n' + '═'.repeat(50));
  console.log('RESUMEN FINAL');
  console.log('═'.repeat(50));
  for (const r of results) {
    console.log(`${r.voice}:`);
    console.log(`  Base generados:       ${r.successBase}/15`);
    console.log(`  Variaciones generadas: ${r.successVar}/15`);
    console.log(`  Errores:              ${r.errors}`);
  }
  console.log(`\nCuota usada en esta sesión: ~${initialQuota - finalQuota} caracteres`);
  console.log(`Cuota restante final:        ${finalQuota} caracteres`);

  // Conteo total de archivos por carpeta
  console.log('\nArchivos totales por carpeta:');
  for (const voice of VOICES) {
    const dir = path.join(__dirname, '..', 'public', 'audio', voice.dir);
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.mp3'));
    let sz = 0; files.forEach(f => sz += fs.statSync(path.join(dir, f)).size);
    console.log(`  ${voice.dir}: ${files.length} archivos (${(sz/1024/1024).toFixed(2)} MB)`);
  }
  console.log('═'.repeat(50) + '\n');
}

main().catch(console.error);

/**
 * strip-id3-audio.cjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Elimina el encabezado ID3v2 de todos los archivos MP3 en las carpetas de
 * voces personalizadas del bingo. Esto permite que Edge, iOS Safari y Android
 * reproduzcan los archivos directamente sin procesamiento en runtime.
 *
 * Uso: node scripts/strip-id3-audio.cjs
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs   = require('fs');
const path = require('path');

const AUDIO_ROOT = path.join(__dirname, '..', 'public', 'audio');

const CARPETAS = [
  'numbers-bingo-juan',
  'numbers-bingo-harry',
  'numbers-bingo-andrea',
  'numbers-bingo-alicia',
];

/**
 * Elimina el encabezado ID3v2 de un Buffer si está presente.
 * Retorna null si no tiene ID3v2 (no hay nada que hacer).
 */
function stripID3v2(buf) {
  // Verificar firma "ID3"
  if (buf.length < 10 || buf[0] !== 0x49 || buf[1] !== 0x44 || buf[2] !== 0x33) {
    return null; // sin encabezado ID3v2 — no modificar
  }

  // Leer tamaño del tag en formato syncsafe (4 bytes × 7 bits)
  const tagSize =
    ((buf[6] & 0x7F) << 21) |
    ((buf[7] & 0x7F) << 14) |
    ((buf[8] & 0x7F) <<  7) |
     (buf[9] & 0x7F);

  const offset = 10 + tagSize;

  if (offset >= buf.length) {
    return null; // offset inválido — no modificar
  }

  return buf.slice(offset);
}

let totalProcesados = 0;
let totalModificados = 0;
let totalSinCambios  = 0;
let totalErrores     = 0;

for (const carpeta of CARPETAS) {
  const dirPath = path.join(AUDIO_ROOT, carpeta);

  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️  Carpeta no encontrada: ${carpeta} — omitiendo`);
    continue;
  }

  const archivos = fs.readdirSync(dirPath).filter(f => f.endsWith('.mp3'));

  if (archivos.length === 0) {
    console.log(`⚠️  Sin archivos MP3 en: ${carpeta}`);
    continue;
  }

  console.log(`\n📁 ${carpeta} (${archivos.length} archivos)`);

  for (const archivo of archivos) {
    const filePath = path.join(dirPath, archivo);
    totalProcesados++;

    try {
      const original = fs.readFileSync(filePath);
      const stripped  = stripID3v2(original);

      if (stripped === null) {
        // Sin encabezado ID3v2 — ya está limpio
        totalSinCambios++;
        continue;
      }

      // Verificar que el resultado empieza con sync word MP3 (0xFF 0xEx)
      if (stripped.length < 2 || stripped[0] !== 0xFF || (stripped[1] & 0xE0) !== 0xE0) {
        console.warn(`  ⚠️  ${archivo}: strip produjo datos inválidos — omitiendo`);
        totalErrores++;
        continue;
      }

      fs.writeFileSync(filePath, stripped);
      const ahorroKB = ((original.length - stripped.length) / 1024).toFixed(1);
      console.log(`  ✅ ${archivo}: ID3v2.${original[3]} eliminado (${ahorroKB} KB ahorrados)`);
      totalModificados++;

    } catch (err) {
      console.error(`  ❌ ${archivo}: error — ${err.message}`);
      totalErrores++;
    }
  }
}

console.log(`
════════════════════════════════════════
  Resumen
════════════════════════════════════════
  Procesados : ${totalProcesados}
  Modificados: ${totalModificados}
  Sin cambios: ${totalSinCambios}
  Errores    : ${totalErrores}
════════════════════════════════════════
`);

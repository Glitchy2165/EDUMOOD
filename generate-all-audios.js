const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const gTTS = require('node-gtts')('es');
const ffmpeg = require('fluent-ffmpeg');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'edumod_advanced',
  port: 3306
});

async function generateAudioForBook(book) {
    const { id, titulo, contenido } = book;
    const audioDir = path.join(__dirname, 'public', 'audio');
    if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
    }
    const nombreArchivo = `audiolibro_${id}_${Date.now()}.mp3`;
    const rutaArchivo = path.join(audioDir, nombreArchivo);
    const texto = (contenido || '').trim();
    if (!texto) {
        console.log(`❌ [ID ${id}] El contenido está vacío, se omite.`);
        return;
    }
    const maxLen = 200;
    let partes = [];
    for (let i = 0; i < texto.length; i += maxLen) {
        partes.push(texto.slice(i, i + maxLen));
    }
    const archivosParciales = [];
    for (let idx = 0; idx < partes.length; idx++) {
        const parte = partes[idx];
        const nombreParcial = path.join(audioDir, `tmp_${id}_${Date.now()}_${idx}.mp3`);
        try {
            await new Promise((resolve, reject) => {
                gTTS.save(nombreParcial, parte, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            archivosParciales.push(nombreParcial);
        } catch (err) {
            console.error(`❌ [ID ${id}] Error generando parte ${idx + 1}:`, err);
            return;
        }
    }
    if (archivosParciales.length === 1) {
        fs.renameSync(archivosParciales[0], rutaArchivo);
    } else {
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(`concat:${archivosParciales.join('|')}`)
                .output(rutaArchivo)
                .on('end', resolve)
                .on('error', reject)
                .run();
        });
        archivosParciales.forEach(f => fs.existsSync(f) && fs.unlinkSync(f));
    }
    if (fs.existsSync(rutaArchivo) && fs.statSync(rutaArchivo).size > 0) {
        await db.query("UPDATE audiolibros SET archivo_audio = ? WHERE id = ?", [nombreArchivo, id]);
        console.log(`✅ [ID ${id}] Audiolibro generado: ${nombreArchivo}`);
    } else {
        console.log(`❌ [ID ${id}] El archivo de audio está vacío o no se creó.`);
    }
}

async function main() {
    try {
        const [libros] = await db.query("SELECT id, titulo, contenido, archivo_audio FROM audiolibros");
        let total = 0;
        for (const libro of libros) {
            if (!libro.archivo_audio) {
                console.log(`🎵 Generando audiolibro para: ${libro.titulo} (ID: ${libro.id})`);
                await generateAudioForBook(libro);
                total++;
            } else {
                console.log(`⏩ [ID ${libro.id}] Ya tiene audiolibro: ${libro.archivo_audio}`);
            }
        }
        console.log(`\n🎉 Proceso terminado. Audiolibros generados: ${total}`);
    } catch (err) {
        console.error('❌ Error general:', err);
    } finally {
        await db.end();
    }
}

main(); 
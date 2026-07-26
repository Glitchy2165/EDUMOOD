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

async function generateAudio(bookId) {
    try {
        console.log(`🎵 Generando audio para libro ID: ${bookId}`);
        
        // Obtener el libro de la base de datos
        const [books] = await db.query(
            "SELECT titulo, contenido FROM audiolibros WHERE id = ?",
            [bookId]
        );
        
        if (books.length === 0) {
            console.log('❌ Libro no encontrado');
            return;
        }
        
        const libro = books[0];
        console.log(`📖 Título: ${libro.titulo}`);
        
        // Crear directorio de audio si no existe
        const audioDir = path.join(__dirname, 'public', 'audio');
        if (!fs.existsSync(audioDir)) {
            fs.mkdirSync(audioDir, { recursive: true });
        }
        
        // Generar nombre del archivo
        const nombreArchivo = `audiolibro_${bookId}_${Date.now()}.mp3`;
        const rutaArchivo = path.join(audioDir, nombreArchivo);
        
        // Validar texto
        const texto = (libro.contenido || '').trim();
        console.log(`📄 Texto a convertir (${texto.length} caracteres):`);
        console.log(texto.substring(0, 200) + '...');
        
        if (!texto) {
            console.log('❌ El contenido del audiolibro está vacío');
            return;
        }
        
        // Dividir texto en partes (Google TTS tiene límites)
        const maxLen = 200;
        let partes = [];
        for (let i = 0; i < texto.length; i += maxLen) {
            partes.push(texto.slice(i, i + maxLen));
        }
        
        console.log(`🔄 Dividiendo en ${partes.length} partes...`);
        
        // Generar audios parciales
        const archivosParciales = [];
        for (let idx = 0; idx < partes.length; idx++) {
            const parte = partes[idx];
            const nombreParcial = path.join(audioDir, `tmp_${bookId}_${Date.now()}_${idx}.mp3`);
            
            console.log(`🎤 Generando parte ${idx + 1}/${partes.length}...`);
            
            try {
                await new Promise((resolve, reject) => {
                    gTTS.save(nombreParcial, parte, (err) => {
                        if (err) {
                            console.error(`❌ Error en parte ${idx + 1}:`, err);
                            reject(err);
                        } else {
                            console.log(`✅ Parte ${idx + 1} generada`);
                            resolve();
                        }
                    });
                });
                archivosParciales.push(nombreParcial);
            } catch (err) {
                console.error(`❌ Error generando parte ${idx + 1}:`, err);
                return;
            }
        }
        
        // Unir los audios parciales
        console.log('🔗 Uniendo archivos de audio...');
        
        if (archivosParciales.length === 1) {
            fs.renameSync(archivosParciales[0], rutaArchivo);
            console.log('✅ Audio final generado (un solo archivo)');
        } else {
            await new Promise((resolve, reject) => {
                ffmpeg()
                    .input(`concat:${archivosParciales.join('|')}`)
                    .output(rutaArchivo)
                    .on('end', () => {
                        console.log('✅ Audio final generado (archivos unidos)');
                        resolve();
                    })
                    .on('error', (err) => {
                        console.error('❌ Error uniendo archivos:', err);
                        reject(err);
                    })
                    .run();
            });
            
            // Borrar archivos parciales
            archivosParciales.forEach(f => {
                if (fs.existsSync(f)) {
                    fs.unlinkSync(f);
                }
            });
        }
        
        // Verificar que el archivo existe y tiene contenido
        if (fs.existsSync(rutaArchivo)) {
            const stats = fs.statSync(rutaArchivo);
            console.log(`📁 Archivo final: ${nombreArchivo}`);
            console.log(`📊 Tamaño: ${stats.size} bytes`);
            
            if (stats.size > 0) {
                console.log('✅ El archivo de audio tiene contenido!');
                
                // Actualizar la base de datos
                await db.query(
                    "UPDATE audiolibros SET archivo_audio = ? WHERE id = ?",
                    [nombreArchivo, bookId]
                );
                console.log('💾 Base de datos actualizada');
                
            } else {
                console.log('❌ El archivo de audio está vacío');
            }
        } else {
            console.log('❌ El archivo no se creó');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await db.end();
    }
}

// Generar audio para el libro "El Poder de la Gratitud" (ID: 2)
generateAudio(2); 
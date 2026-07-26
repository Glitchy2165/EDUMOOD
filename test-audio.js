const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const gTTS = require('node-gtts')('es');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'edumod_advanced',
  port: 3306
});

async function testAudio() {
    try {
        // Insertar audiolibro de prueba
        const [result] = await db.query(
            "INSERT INTO audiolibros (titulo, contenido) VALUES (?, ?)",
            ['Test Audio', 'Este es un texto de prueba para generar audio. Vamos a ver si funciona correctamente la síntesis de voz.']
        );
        
        console.log('✅ Audiolibro insertado con ID:', result.insertId);
        
        // Crear directorio de audio si no existe
        const audioDir = path.join(__dirname, 'public', 'audio');
        if (!fs.existsSync(audioDir)) {
            fs.mkdirSync(audioDir, { recursive: true });
        }
        
        // Generar audio de prueba
        const nombreArchivo = `test_audio_${Date.now()}.mp3`;
        const rutaArchivo = path.join(audioDir, nombreArchivo);
        
        console.log('🎵 Generando audio...');
        
        await new Promise((resolve, reject) => {
            gTTS.save(rutaArchivo, 'Este es un texto de prueba para generar audio.', (err) => {
                if (err) {
                    console.error('❌ Error generando audio:', err);
                    reject(err);
                } else {
                    console.log('✅ Audio generado correctamente en:', rutaArchivo);
                    resolve();
                }
            });
        });
        
        // Verificar que el archivo existe y tiene contenido
        if (fs.existsSync(rutaArchivo)) {
            const stats = fs.statSync(rutaArchivo);
            console.log('📁 Archivo creado:', rutaArchivo);
            console.log('📊 Tamaño del archivo:', stats.size, 'bytes');
            
            if (stats.size > 0) {
                console.log('✅ El archivo de audio tiene contenido!');
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

testAudio(); 
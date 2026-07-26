const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'edumod_advanced',
  port: 3306
});

const librosFisicos = [
    {
        titulo: "El Alquimista",
        contenido: "Una novela de Paulo Coelho sobre la importancia de perseguir los sueños y escuchar al corazón.",
        archivo_audio: null
    },
    {
        titulo: "Los 7 Hábitos de la Gente Altamente Efectiva",
        contenido: "Un libro de Stephen Covey que presenta hábitos para mejorar la efectividad personal y profesional.",
        archivo_audio: null
    },
    {
        titulo: "Mente Zen, Mente de Principiante",
        contenido: "Introducción a la práctica del Zen y la meditación por Shunryu Suzuki.",
        archivo_audio: null
    }
];

async function addPhysicalBooks() {
    try {
        for (const libro of librosFisicos) {
            const [result] = await db.query(
                "INSERT INTO audiolibros (titulo, contenido, archivo_audio) VALUES (?, ?, ?)",
                [libro.titulo, libro.contenido, libro.archivo_audio]
            );
            console.log(`✅ Libro físico agregado: ${libro.titulo} (ID: ${result.insertId})`);
        }
        console.log('🎉 Libros físicos agregados exitosamente.');
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await db.end();
    }
}

addPhysicalBooks(); 
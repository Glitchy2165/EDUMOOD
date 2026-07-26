const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'edumod_advanced',
  port: 3306
});

async function fixBooks() {
    try {
        const [libros] = await db.query("SELECT id, titulo, activo FROM audiolibros");
        if (libros.length === 0) {
            console.log('❌ No hay libros en la tabla audiolibros.');
            return;
        }
        console.log('Libros encontrados:');
        libros.forEach(libro => {
            console.log(`ID: ${libro.id} | Título: ${libro.titulo} | Activo: ${libro.activo}`);
        });
        const inactivos = libros.filter(l => !l.activo);
        if (inactivos.length > 0) {
            await db.query("UPDATE audiolibros SET activo = 1");
            console.log(`✅ Se activaron ${inactivos.length} libros.`);
        } else {
            console.log('Todos los libros ya estaban activos.');
        }
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await db.end();
    }
}

fixBooks(); 
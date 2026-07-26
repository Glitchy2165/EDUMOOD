const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'edumod_advanced',
  port: 3306
});

const LIBROS_DIR = path.join(__dirname, 'libros');

function normaliza(nombre) {
  return nombre.trim().toLowerCase().replace(/\s+/g, '_');
}

async function checkBooksAndFiles() {
  try {
    const [books] = await db.query('SELECT archivo, titulo FROM libros');
    const archivosDB = books.map(b => b.archivo);
    const archivosFS = fs.readdirSync(LIBROS_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));

    console.log('--- Archivos en la base de datos ---');
    archivosDB.forEach(a => console.log('DB:', a));
    console.log('\n--- Archivos en la carpeta /libros ---');
    archivosFS.forEach(a => console.log('FS:', a));

    const faltanEnFS = archivosDB.filter(nombre => !archivosFS.includes(nombre));
    const sobrantesEnFS = archivosFS.filter(nombre => !archivosDB.includes(nombre));

    if (faltanEnFS.length === 0) {
      console.log('\n✅ Todos los archivos de la base de datos existen en /libros');
    } else {
      console.log('\n❌ Faltan en /libros los siguientes archivos de la base de datos:');
      books.filter(b => faltanEnFS.includes(b.archivo)).forEach(b => {
        // Sugerencia de coincidencia por nombre normalizado
        const sugerido = archivosFS.find(f => normaliza(f) === normaliza(b.archivo));
        if (sugerido) {
          console.log(` - ${b.titulo} (${b.archivo}) [¿Quizás quisiste decir: ${sugerido}?]`);
        } else {
          console.log(` - ${b.titulo} (${b.archivo})`);
        }
      });
    }

    if (sobrantesEnFS.length > 0) {
      console.log('\n⚠️ Archivos en /libros que no están en la base de datos:');
      sobrantesEnFS.forEach(f => {
        // Sugerencia de coincidencia por nombre normalizado
        const sugerido = archivosDB.find(a => normaliza(a) === normaliza(f));
        if (sugerido) {
          console.log(` - ${f} [¿Quizás quisiste decir: ${sugerido}?]`);
        } else {
          console.log(' -', f);
        }
      });
    }
  } catch (err) {
    console.error('Error al verificar libros:', err);
  } finally {
    await db.end();
  }
}

checkBooksAndFiles(); 
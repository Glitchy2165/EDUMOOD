const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'salud_m',
  port: 3306
});

async function checkActiveBooks() {
    try {
        const [results] = await db.query("SELECT id, titulo, activo FROM audiolibros");
        
        console.log('📚 Estado de los libros:');
        console.log('========================');
        
        if (results.length === 0) {
            console.log('❌ No hay libros en la base de datos');
            return;
        }
        
        results.forEach(book => {
            console.log(`📖 ID: ${book.id}`);
            console.log(`📝 Título: ${book.titulo}`);
            console.log(`✅ Activo: ${book.activo === 1 ? 'SÍ' : 'NO'}`);
            console.log('---');
        });
        
        // Verificar cuántos están activos
        const activeBooks = results.filter(book => book.activo === 1);
        console.log(`\n📊 Total de libros: ${results.length}`);
        console.log(`✅ Libros activos: ${activeBooks.length}`);
        console.log(`❌ Libros inactivos: ${results.length - activeBooks.length}`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await db.end();
    }
}

checkActiveBooks(); 
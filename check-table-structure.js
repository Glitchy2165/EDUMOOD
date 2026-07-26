const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'salud_m',
  port: 3306
});

async function checkTableStructure() {
    try {
        const [results] = await db.query("DESCRIBE audiolibros");
        
        console.log('📋 Estructura de la tabla audiolibros:');
        console.log('=====================================');
        
        results.forEach(col => {
            console.log(`${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? 'DEFAULT ' + col.Default : ''}`);
        });
        
        // Verificar si existe la columna activo
        const hasActivo = results.some(col => col.Field === 'activo');
        console.log(`\n✅ Columna 'activo' existe: ${hasActivo}`);
        
        // Probar consulta sin filtro activo
        const [allBooks] = await db.query("SELECT * FROM audiolibros");
        console.log(`📚 Total de libros sin filtro: ${allBooks.length}`);
        
        // Probar consulta con filtro activo
        const [activeBooks] = await db.query("SELECT * FROM audiolibros WHERE activo = true");
        console.log(`✅ Libros con activo = true: ${activeBooks.length}`);
        
        // Probar consulta con activo = 1
        const [activeBooks1] = await db.query("SELECT * FROM audiolibros WHERE activo = 1");
        console.log(`✅ Libros con activo = 1: ${activeBooks1.length}`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await db.end();
    }
}

checkTableStructure(); 
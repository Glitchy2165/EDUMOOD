const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'edumod_advanced',
  port: 3306
});

async function testAPI() {
    try {
        console.log('🔍 Probando API y consulta directa...');
        
        // 1. Consulta directa a la base de datos
        console.log('\n📊 CONSULTA DIRECTA A LA BASE DE DATOS:');
        const [directResults] = await db.query("SELECT * FROM audiolibros WHERE activo = 1 ORDER BY fecha_creacion DESC");
        console.log('Resultados directos:', directResults.length, 'libros encontrados');
        directResults.forEach((book, i) => {
            console.log(`${i+1}. ID: ${book.id}, Título: ${book.titulo}, Activo: ${book.activo}`);
        });
        
        // 2. Petición a la API
        console.log('\n🌐 PETICIÓN A LA API:');
        const response = await fetch('http://localhost:3001/api/audiolibros');
        const apiResults = await response.json();
        console.log('Resultados de la API:', apiResults.length, 'libros encontrados');
        console.log('Respuesta completa:', JSON.stringify(apiResults, null, 2));
        
        // 3. Comparación
        console.log('\n🔍 COMPARACIÓN:');
        console.log('Directa:', directResults.length, 'libros');
        console.log('API:', apiResults.length, 'libros');
        console.log('¿Coinciden?', directResults.length === apiResults.length ? '✅ SÍ' : '❌ NO');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await db.end();
    }
}

testAPI(); 
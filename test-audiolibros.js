const axios = require('axios');

async function testAudiolibros() {
    try {
        console.log('🎵 Probando endpoint de audiolibros...');
        
        const response = await axios.get('http://localhost:3000/api/audiolibros');
        const audiolibros = response.data;
        
        console.log(`✅ Se encontraron ${audiolibros.length} audiolibros:`);
        console.log('=====================================');
        
        audiolibros.forEach((libro, index) => {
            console.log(`${index + 1}. ${libro.titulo}`);
            console.log(`   Autor: ${libro.autor}`);
            console.log(`   Audio: ${libro.audio}`);
            console.log(`   Portada: ${libro.portada}`);
            console.log('   ---');
        });
        
        // Verificar que los archivos de audio existen
        console.log('\n🔍 Verificando archivos de audio...');
        for (const libro of audiolibros) {
            try {
                const audioResponse = await axios.head(`http://localhost:3000${libro.audio}`);
                console.log(`✅ ${libro.titulo}: ${libro.audio} (${audioResponse.headers['content-length']} bytes)`);
            } catch (error) {
                console.log(`❌ ${libro.titulo}: ${libro.audio} - NO ENCONTRADO`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error al probar audiolibros:', error.message);
    }
}

testAudiolibros(); 
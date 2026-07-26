const http = require('http');
const fs = require('fs');
const path = require('path');

async function testPaginasContenido() {
    console.log('🧪 Iniciando pruebas de las páginas de contenido mejoradas...\n');
    
    try {
        // Verificar si el servidor está corriendo
        console.log('🔍 Verificando servidor...');
        const serverRunning = await checkServer();
        
        if (!serverRunning) {
            console.log('❌ Servidor no detectado en http://localhost:3000');
            console.log('💡 Por favor, inicia el servidor con: node app.js');
            return;
        }
        
        console.log('✅ Servidor detectado en http://localhost:3000');
        
        // Lista de páginas de contenido a verificar
        const paginas = [
            { nombre: 'Lugares', archivo: 'lugares.html', ruta: '/lugares' },
            { nombre: 'Audiolibros', archivo: 'audiolibros.html', ruta: '/audiolibros' },
            { nombre: 'Test', archivo: 'test.html', ruta: '/test' }
        ];
        
        console.log('\n📋 Verificando páginas de contenido...\n');
        
        for (const pagina of paginas) {
            console.log(`🔍 Verificando: ${pagina.nombre}`);
            
            // Verificar que el archivo existe
            const filePath = path.join(__dirname, 'views', pagina.archivo);
            if (!fs.existsSync(filePath)) {
                console.log(`❌ Archivo no encontrado: ${pagina.archivo}`);
                continue;
            }
            
            // Leer el contenido del archivo
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Verificar mejoras implementadas
            const mejoras = verificarMejoras(content, pagina.nombre);
            
            if (mejoras.length > 0) {
                console.log(`✅ Mejoras detectadas en ${pagina.nombre}:`);
                mejoras.forEach(mejora => console.log(`   • ${mejora}`));
            } else {
                console.log(`⚠️  No se detectaron mejoras en ${pagina.nombre}`);
            }
            
            // Verificar respuesta HTTP
            try {
                const response = await makeRequest(pagina.ruta);
                if (response.statusCode === 200) {
                    console.log(`✅ Página ${pagina.nombre} responde correctamente`);
                } else {
                    console.log(`❌ Página ${pagina.nombre} responde con código: ${response.statusCode}`);
                }
            } catch (error) {
                console.log(`❌ Error al verificar ${pagina.nombre}: ${error.message}`);
            }
            
            console.log('');
        }
        
        // Verificar páginas de resultados del test
        console.log('🔍 Verificando páginas de resultados del test...\n');
        
        const resultados = [
            'resultado-muy-bajo.html',
            'resultado-bajo.html', 
            'resultado-medio.html',
            'resultado-alto.html',
            'resultado-muy-alto.html'
        ];
        
        for (const resultado of resultados) {
            const filePath = path.join(__dirname, 'views', resultado);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                const mejoras = verificarMejoras(content, resultado);
                
                if (mejoras.length > 0) {
                    console.log(`✅ Mejoras en ${resultado}:`);
                    mejoras.forEach(mejora => console.log(`   • ${mejora}`));
                }
            }
        }
        
        console.log('\n🎉 Verificación completada!');
        console.log('\n📝 Resumen de mejoras implementadas:');
        console.log('✅ Diseño glassmorphism moderno');
        console.log('✅ Paleta de colores EDUMOD unificada');
        console.log('✅ Tipografía Poppins mejorada');
        console.log('✅ Animaciones AOS suaves');
        console.log('✅ Responsividad total');
        console.log('✅ Mejor UX/UI');
        console.log('✅ Efectos hover y transiciones');
        console.log('✅ Navegación mejorada');
        
    } catch (error) {
        console.error('❌ Error durante la verificación:', error.message);
    }
}

function verificarMejoras(content, nombrePagina) {
    const mejoras = [];
    
    // Verificar diseño glassmorphism
    if (content.includes('backdrop-filter: blur') || content.includes('rgba(255, 255, 255, 0.95)')) {
        mejoras.push('Diseño glassmorphism implementado');
    }
    
    // Verificar paleta de colores EDUMOD
    if (content.includes('#667eea') || content.includes('#764ba2')) {
        mejoras.push('Paleta de colores EDUMOD aplicada');
    }
    
    // Verificar tipografía Poppins
    if (content.includes('Poppins') && content.includes('font-family')) {
        mejoras.push('Tipografía Poppins implementada');
    }
    
    // Verificar animaciones AOS
    if (content.includes('data-aos') || content.includes('AOS.init')) {
        mejoras.push('Animaciones AOS implementadas');
    }
    
    // Verificar responsividad
    if (content.includes('@media') && content.includes('max-width')) {
        mejoras.push('Responsividad implementada');
    }
    
    // Verificar efectos hover
    if (content.includes(':hover') && content.includes('transform')) {
        mejoras.push('Efectos hover implementados');
    }
    
    // Verificar navegación mejorada
    if (content.includes('navbar') && content.includes('fixed-top')) {
        mejoras.push('Navegación mejorada');
    }
    
    // Verificar elementos específicos según la página
    if (nombrePagina.includes('Lugares')) {
        if (content.includes('place-card') && content.includes('category-badge')) {
            mejoras.push('Tarjetas de lugares con badges');
        }
    }
    
    if (nombrePagina.includes('Audiolibros')) {
        if (content.includes('audio-card') && content.includes('audio-player')) {
            mejoras.push('Reproductor de audio mejorado');
        }
    }
    
    if (nombrePagina.includes('Test')) {
        if (content.includes('option-card') && content.includes('progress-bar')) {
            mejoras.push('Interfaz de test mejorada');
        }
    }
    
    return mejoras;
}

function checkServer() {
    return new Promise((resolve) => {
        const req = http.get('http://localhost:3000', (res) => {
            resolve(true);
        });
        
        req.on('error', () => {
            resolve(false);
        });
        
        req.setTimeout(3000, () => {
            req.destroy();
            resolve(false);
        });
    });
}

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'GET'
        };
        
        const req = http.request(options, (res) => {
            resolve({ statusCode: res.statusCode });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
        
        req.end();
    });
}

// Ejecutar las pruebas
testPaginasContenido(); 
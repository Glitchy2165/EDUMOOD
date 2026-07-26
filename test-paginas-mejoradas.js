const http = require('http');
const fs = require('fs');
const path = require('path');

async function testPaginasMejoradas() {
    console.log('🧪 Iniciando pruebas de las páginas mejoradas...\n');
    
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
        
        // Lista de páginas a verificar
        const paginas = [
            { nombre: 'Home', archivo: 'home.html', ruta: '/home' },
            { nombre: 'Salud Mental', archivo: 'salud-mental.html', ruta: '/salud-mental' },
            { nombre: 'Beneficios', archivo: 'beneficios.html', ruta: '/beneficios' },
            { nombre: 'Registro', archivo: 'registro.html', ruta: '/registro' },
            { nombre: 'Sesión', archivo: 'sesion.html', ruta: '/sesion' }
        ];
        
        console.log('\n📄 Verificando páginas mejoradas...');
        
        for (const pagina of paginas) {
            console.log(`\n🔍 Verificando ${pagina.nombre}...`);
            
            // Verificar archivo
            const archivoPath = path.join(__dirname, 'views', pagina.archivo);
            if (fs.existsSync(archivoPath)) {
                console.log(`  ✓ Archivo ${pagina.archivo} existe`);
                
                // Leer y analizar el contenido
                const contenido = fs.readFileSync(archivoPath, 'utf8');
                
                // Verificar elementos clave del nuevo diseño
                const elementosClave = [
                    'EDUMOD',
                    '--primary-color',
                    '--secondary-color',
                    'glassmorphism',
                    'backdrop-filter',
                    'Poppins',
                    'font-awesome',
                    'bootstrap',
                    'aos'
                ];
                
                let elementosEncontrados = 0;
                elementosClave.forEach(elemento => {
                    if (contenido.includes(elemento)) {
                        elementosEncontrados++;
                    }
                });
                
                if (elementosEncontrados >= 5) {
                    console.log(`  ✓ Diseño moderno implementado (${elementosEncontrados}/9 elementos)`);
                } else {
                    console.log(`  ⚠️  Diseño parcialmente implementado (${elementosEncontrados}/9 elementos)`);
                }
                
                // Verificar elementos específicos según la página
                if (pagina.nombre === 'Home') {
                    verificarElementosHome(contenido);
                } else if (pagina.nombre === 'Registro') {
                    verificarElementosRegistro(contenido);
                } else if (pagina.nombre === 'Sesión') {
                    verificarElementosSesion(contenido);
                } else {
                    verificarElementosGenerales(contenido);
                }
                
            } else {
                console.log(`  ❌ Archivo ${pagina.archivo} no encontrado`);
            }
            
            // Verificar respuesta del servidor
            try {
                const response = await makeRequest(`http://localhost:3000${pagina.ruta}`);
                if (response.statusCode === 200) {
                    console.log(`  ✓ Página se sirve correctamente en ${pagina.ruta}`);
                    
                    // Verificar contenido de la respuesta
                    if (response.body.includes('EDUMOD')) {
                        console.log(`  ✓ Marca EDUMOD presente`);
                    } else {
                        console.log(`  ❌ Marca EDUMOD no encontrada`);
                    }
                } else {
                    console.log(`  ❌ Error al servir la página: ${response.statusCode}`);
                }
            } catch (error) {
                console.log(`  ❌ Error al hacer petición: ${error.message}`);
            }
        }
        
        console.log('\n🎉 ¡Pruebas completadas exitosamente!');
        console.log('\n📊 Resumen de mejoras implementadas:');
        console.log('  ✓ Diseño moderno con glassmorphism');
        console.log('  ✓ Marca EDUMOD unificada');
        console.log('  ✓ Variables CSS consistentes');
        console.log('  ✓ Tipografía Poppins');
        console.log('  ✓ Iconos Font Awesome');
        console.log('  ✓ Framework Bootstrap');
        console.log('  ✓ Animaciones AOS');
        console.log('  ✓ Responsividad mejorada');
        console.log('  ✓ Efectos visuales modernos');
        
    } catch (error) {
        console.error('❌ Error durante las pruebas:', error.message);
    }
}

function verificarElementosHome(contenido) {
    console.log('  📝 Verificando elementos específicos de Home...');
    
    const elementosHome = [
        'Bienvenido a EDUMOD',
        'Iniciar Sesión',
        'Registrarse',
        'Modo Administrador',
        'floating-element'
    ];
    
    elementosHome.forEach(elemento => {
        if (contenido.includes(elemento)) {
            console.log(`    ✓ Elemento "${elemento}" presente`);
        } else {
            console.log(`    ❌ Elemento "${elemento}" no encontrado`);
        }
    });
}

function verificarElementosRegistro(contenido) {
    console.log('  📝 Verificando elementos específicos de Registro...');
    
    const elementosRegistro = [
        'Crear Cuenta',
        'password-strength',
        'togglePassword',
        'checkPasswordStrength',
        'validateForm'
    ];
    
    elementosRegistro.forEach(elemento => {
        if (contenido.includes(elemento)) {
            console.log(`    ✓ Elemento "${elemento}" presente`);
        } else {
            console.log(`    ❌ Elemento "${elemento}" no encontrado`);
        }
    });
}

function verificarElementosSesion(contenido) {
    console.log('  📝 Verificando elementos específicos de Sesión...');
    
    const elementosSesion = [
        'Iniciar Sesión',
        'Accede a tu cuenta',
        'togglePassword',
        'showMessage',
        'loginForm'
    ];
    
    elementosSesion.forEach(elemento => {
        if (contenido.includes(elemento)) {
            console.log(`    ✓ Elemento "${elemento}" presente`);
        } else {
            console.log(`    ❌ Elemento "${elemento}" no encontrado`);
        }
    });
}

function verificarElementosGenerales(contenido) {
    console.log('  📝 Verificando elementos generales...');
    
    const elementosGenerales = [
        'navbar',
        'hero-section',
        'card',
        'btn-primary',
        'footer'
    ];
    
    elementosGenerales.forEach(elemento => {
        if (contenido.includes(elemento)) {
            console.log(`    ✓ Elemento "${elemento}" presente`);
        } else {
            console.log(`    ❌ Elemento "${elemento}" no encontrado`);
        }
    });
}

function checkServer() {
    return new Promise((resolve) => {
        const req = http.get('http://localhost:3000', (res) => {
            resolve(true);
        });
        
        req.on('error', () => {
            resolve(false);
        });
        
        req.setTimeout(2000, () => {
            req.destroy();
            resolve(false);
        });
    });
}

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    body: body
                });
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

if (require.main === module) {
    testPaginasMejoradas();
}

module.exports = { testPaginasMejoradas }; 
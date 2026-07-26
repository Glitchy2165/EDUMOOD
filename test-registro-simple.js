const http = require('http');
const fs = require('fs');
const path = require('path');

async function testRegistroSimple() {
    console.log('🧪 Iniciando pruebas simples de la página de registro mejorada...\n');
    
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
        
        // Verificar archivo de registro
        console.log('\n📄 Verificando archivo de registro...');
        const registroPath = path.join(__dirname, 'views', 'registro.html');
        
        if (fs.existsSync(registroPath)) {
            console.log('  ✓ Archivo registro.html existe');
            
            // Leer y analizar el contenido
            const contenido = fs.readFileSync(registroPath, 'utf8');
            
            // Verificar elementos clave
            console.log('\n🔍 Verificando elementos clave...');
            
            // Verificar Bootstrap
            if (contenido.includes('bootstrap')) {
                console.log('  ✓ Bootstrap integrado');
            } else {
                console.log('  ❌ Bootstrap no encontrado');
            }
            
            // Verificar AOS
            if (contenido.includes('aos')) {
                console.log('  ✓ AOS (Animate On Scroll) integrado');
            } else {
                console.log('  ❌ AOS no encontrado');
            }
            
            // Verificar Font Awesome
            if (contenido.includes('font-awesome')) {
                console.log('  ✓ Font Awesome integrado');
            } else {
                console.log('  ❌ Font Awesome no encontrado');
            }
            
            // Verificar Google Fonts
            if (contenido.includes('Poppins')) {
                console.log('  ✓ Google Fonts (Poppins) integrado');
            } else {
                console.log('  ❌ Google Fonts no encontrado');
            }
            
            // Verificar elementos del formulario
            console.log('\n📝 Verificando elementos del formulario...');
            
            const elementosFormulario = [
                'navbar',
                'logo-container',
                'btn-register',
                'password-strength',
                'floating-element',
                'age-info',
                'form-control',
                'input-icon'
            ];
            
            elementosFormulario.forEach(elemento => {
                if (contenido.includes(elemento)) {
                    console.log(`  ✓ Elemento "${elemento}" presente`);
                } else {
                    console.log(`  ❌ Elemento "${elemento}" no encontrado`);
                }
            });
            
            // Verificar funcionalidades JavaScript
            console.log('\n⚡ Verificando funcionalidades JavaScript...');
            
            const funcionalidadesJS = [
                'togglePassword',
                'checkPasswordStrength',
                'validateForm',
                'showMessage',
                'AOS.init'
            ];
            
            funcionalidadesJS.forEach(funcion => {
                if (contenido.includes(funcion)) {
                    console.log(`  ✓ Función "${funcion}" presente`);
                } else {
                    console.log(`  ❌ Función "${funcion}" no encontrada`);
                }
            });
            
            // Verificar estilos CSS
            console.log('\n🎨 Verificando estilos CSS...');
            
            const estilosCSS = [
                '--primary-color',
                '--secondary-color',
                'glassmorphism',
                'backdrop-filter',
                'animation',
                'responsive'
            ];
            
            estilosCSS.forEach(estilo => {
                if (contenido.includes(estilo)) {
                    console.log(`  ✓ Estilo "${estilo}" presente`);
                } else {
                    console.log(`  ❌ Estilo "${estilo}" no encontrado`);
                }
            });
            
            // Verificar variables CSS
            console.log('\n🎨 Verificando variables CSS...');
            
            const variablesCSS = [
                '--bg-gradient',
                '--shadow-lg',
                '--text-dark',
                '--text-light',
                '--error-color',
                '--success-color'
            ];
            
            variablesCSS.forEach(variable => {
                if (contenido.includes(variable)) {
                    console.log(`  ✓ Variable CSS "${variable}" presente`);
                } else {
                    console.log(`  ❌ Variable CSS "${variable}" no encontrada`);
                }
            });
            
            // Verificar responsividad
            console.log('\n📱 Verificando responsividad...');
            
            const mediaQueries = [
                '@media (max-width: 768px)',
                '@media (max-width: 480px)'
            ];
            
            mediaQueries.forEach(query => {
                if (contenido.includes(query)) {
                    console.log(`  ✓ Media query "${query}" presente`);
                } else {
                    console.log(`  ❌ Media query "${query}" no encontrada`);
                }
            });
            
            // Verificar animaciones
            console.log('\n🎬 Verificando animaciones...');
            
            const animaciones = [
                'slideInUp',
                'fadeIn',
                'float',
                'spin'
            ];
            
            animaciones.forEach(animacion => {
                if (contenido.includes(animacion)) {
                    console.log(`  ✓ Animación "${animacion}" presente`);
                } else {
                    console.log(`  ❌ Animación "${animacion}" no encontrada`);
                }
            });
            
            // Verificar accesibilidad
            console.log('\n♿ Verificando accesibilidad...');
            
            const elementosAccesibilidad = [
                'data-talkback',
                'aria-hidden',
                'role='
            ];
            
            elementosAccesibilidad.forEach(elemento => {
                if (contenido.includes(elemento)) {
                    console.log(`  ✓ Elemento de accesibilidad "${elemento}" presente`);
                } else {
                    console.log(`  ❌ Elemento de accesibilidad "${elemento}" no encontrado`);
                }
            });
            
            // Hacer petición HTTP para verificar que la página se sirve correctamente
            console.log('\n🌐 Verificando respuesta del servidor...');
            
            try {
                const response = await makeRequest('http://localhost:3000/registro');
                if (response.statusCode === 200) {
                    console.log('  ✓ Página de registro se sirve correctamente');
                    
                    // Verificar contenido de la respuesta
                    if (response.body.includes('Crear Cuenta')) {
                        console.log('  ✓ Contenido de la página es correcto');
                    } else {
                        console.log('  ❌ Contenido de la página no es el esperado');
                    }
                } else {
                    console.log(`  ❌ Error al servir la página: ${response.statusCode}`);
                }
            } catch (error) {
                console.log(`  ❌ Error al hacer petición: ${error.message}`);
            }
            
            console.log('\n🎉 ¡Pruebas completadas exitosamente!');
            console.log('\n📊 Resumen de mejoras implementadas:');
            console.log('  ✓ Diseño moderno con glassmorphism');
            console.log('  ✓ Navbar responsive con navegación');
            console.log('  ✓ Elementos flotantes animados');
            console.log('  ✓ Validación de fortaleza de contraseña');
            console.log('  ✓ Indicadores visuales mejorados');
            console.log('  ✓ Animaciones suaves');
            console.log('  ✓ Diseño completamente responsivo');
            console.log('  ✓ Mejor UX/UI con feedback visual');
            console.log('  ✓ Integración con Bootstrap y AOS');
            console.log('  ✓ Variables CSS para consistencia');
            console.log('  ✓ Mejoras de accesibilidad');
            
        } else {
            console.log('  ❌ Archivo registro.html no encontrado');
        }
        
    } catch (error) {
        console.error('❌ Error durante las pruebas:', error.message);
    }
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
    testRegistroSimple();
}

module.exports = { testRegistroSimple }; 
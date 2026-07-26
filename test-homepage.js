const axios = require('axios');

async function testHomepage() {
    try {
        console.log('🏠 Probando página de inicio mejorada (orientada a registro/login)...');
        
        // Probar la página principal
        const response = await axios.get('http://localhost:3000/');
        console.log('✅ Página de inicio cargada correctamente');
        console.log(`📄 Tamaño de respuesta: ${response.data.length} caracteres`);
        
        // Verificar que contiene elementos clave
        const content = response.data;
        const checks = [
            { name: 'Título EDUMOD', pattern: /EDUMOD/ },
            { name: 'Hero Section', pattern: /hero-section/ },
            { name: 'About Section', pattern: /about-section/ },
            { name: 'Features Section', pattern: /features-section/ },
            { name: 'Audiolibros Section', pattern: /audiolibros-section/ },
            { name: 'CTA Section', pattern: /cta-section/ },
            { name: 'Stats Section', pattern: /stats-section/ },
            { name: 'CSS mejorado', pattern: /home-improved\.css/ },
            { name: 'Gradientes CSS', pattern: /--bg-gradient/ },
            { name: 'Animaciones', pattern: /AOS\.init/ },
            { name: 'Floating elements', pattern: /floating-element/ },
            { name: 'Botón Registrarse', pattern: /Registrarse/ },
            { name: 'Botón Iniciar Sesión', pattern: /Iniciar Sesión/ },
            { name: 'About cards', pattern: /about-card/ },
            { name: 'CTA cards', pattern: /cta-card/ }
        ];
        
        console.log('\n🔍 Verificando elementos clave:');
        checks.forEach(check => {
            if (check.pattern.test(content)) {
                console.log(`✅ ${check.name}`);
            } else {
                console.log(`❌ ${check.name} - NO ENCONTRADO`);
            }
        });
        
        // Verificar enlaces importantes
        const importantLinks = [
            '/registro',
            '/login',
            '/biblioteca',
            '/audiolibros',
            '/actividades',
            '/lugares'
        ];
        
        console.log('\n🔗 Verificando enlaces importantes:');
        for (const link of importantLinks) {
            try {
                const linkResponse = await axios.get(`http://localhost:3000${link}`);
                console.log(`✅ ${link} - ${linkResponse.status}`);
            } catch (error) {
                console.log(`❌ ${link} - ${error.response?.status || 'Error'}`);
            }
        }
        
        // Verificar contenido específico de registro/login
        const registrationChecks = [
            { name: 'Registrarse Ahora', pattern: /Registrarse Ahora/ },
            { name: 'Iniciar Sesión', pattern: /Iniciar Sesión/ },
            { name: 'Registro gratuito', pattern: /Registro gratuito/ },
            { name: 'Acceso seguro', pattern: /Acceso seguro/ },
            { name: 'Únete a EDUMOD', pattern: /Únete a EDUMOD/ },
            { name: 'Acerca de EDUMOD', pattern: /Acerca de EDUMOD/ },
            { name: 'Bienestar Mental', pattern: /Bienestar Mental/ },
            { name: 'Educación', pattern: /Educación/ },
            { name: 'Comunidad', pattern: /Comunidad/ }
        ];
        
        console.log('\n📝 Verificando contenido de registro/login:');
        registrationChecks.forEach(check => {
            if (check.pattern.test(content)) {
                console.log(`✅ ${check.name}`);
            } else {
                console.log(`❌ ${check.name} - NO ENCONTRADO`);
            }
        });
        
        console.log('\n🎉 Prueba de página de inicio completada!');
        console.log('📋 Resumen: Página orientada a registro/login con información educativa');
        
    } catch (error) {
        console.error('❌ Error al probar la página de inicio:', error.message);
    }
}

testHomepage(); 
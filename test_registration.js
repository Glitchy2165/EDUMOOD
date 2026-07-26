const fetch = require('node-fetch');
const mysql = require('mysql');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'edumod_advanced',
    port: 3306
});

async function testRegistration() {
    console.log('🧪 Probando el sistema de registro...\n');

    const testUser = {
        nombre: 'Usuario Prueba',
        correo: `test${Date.now()}@example.com`,
        fechaNacimiento: '2008-06-15', // 15 años
        contraseña: 'password123'
    };

    try {
        // Probar registro
        console.log('📝 Probando registro de usuario...');
        const response = await fetch('http://localhost:3001/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testUser)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Registro exitoso:', data.mensaje);
        } else {
            console.log('❌ Error en registro:', data.error);
        }

        // Probar login
        console.log('\n🔐 Probando inicio de sesión...');
        const loginResponse = await fetch('http://localhost:3001/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                correo: testUser.correo,
                contraseña: testUser.contraseña
            })
        });

        const loginData = await loginResponse.json();

        if (loginResponse.ok) {
            console.log('✅ Login exitoso:', loginData.mensaje);
            console.log('📍 Redirección:', loginData.redirect);
        } else {
            console.log('❌ Error en login:', loginData.error);
        }

        // Probar acceso a la página de registro
        console.log('\n🌐 Probando acceso a la página de registro...');
        const pageResponse = await fetch('http://localhost:3001/register');
        
        if (pageResponse.ok) {
            console.log('✅ Página de registro accesible');
        } else {
            console.log('❌ Error accediendo a la página de registro');
        }

    } catch (error) {
        console.error('❌ Error en las pruebas:', error.message);
    }
}

// Esperar un poco para que el servidor esté listo
setTimeout(testRegistration, 2000); 
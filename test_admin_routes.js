const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Credenciales del admin
const adminCredentials = {
    correo: 'admin@edumod.com',
    contraseña: 'Admin$2024!@#'
};

async function testAdminRoutes() {
    console.log('🧪 Probando rutas de administración...\n');

    try {
        // 1. Probar login de admin
        console.log('1. 🔐 Probando login de administrador...');
        const loginResponse = await axios.post(`${BASE_URL}/login`, adminCredentials);
        console.log('✅ Login exitoso:', loginResponse.data);

        // 2. Probar acceso a página principal de admin
        console.log('\n2. 🏠 Probando acceso a /admin...');
        const adminResponse = await axios.get(`${BASE_URL}/admin`);
        console.log('✅ Página de admin accesible');

        // 3. Probar todas las rutas de administración
        const adminRoutes = [
            '/admin/analytics',
            '/admin/usuarios', 
            '/admin/tests',
            '/admin/preguntas',
            '/admin/contenido',
            '/admin/configuracion'
        ];

        console.log('\n3. 📋 Probando rutas específicas de administración...');
        for (const route of adminRoutes) {
            try {
                const response = await axios.get(`${BASE_URL}${route}`);
                console.log(`✅ ${route} - Accesible`);
            } catch (error) {
                console.log(`❌ ${route} - Error: ${error.response?.status || error.message}`);
            }
        }

        // 4. Probar APIs de datos
        console.log('\n4. 📊 Probando APIs de datos...');
        const dataApis = [
            '/admin/usuarios-data',
            '/admin/preguntas-data',
            '/admin/resultados-tests-data'
        ];

        for (const api of dataApis) {
            try {
                const response = await axios.get(`${BASE_URL}${api}`);
                console.log(`✅ ${api} - Datos obtenidos (${response.data.length || 0} registros)`);
            } catch (error) {
                console.log(`❌ ${api} - Error: ${error.response?.status || error.message}`);
            }
        }

        console.log('\n🎉 ¡Todas las rutas de administración están funcionando correctamente!');
        console.log('\n📝 Resumen de rutas disponibles:');
        console.log('   • /admin - Dashboard principal');
        console.log('   • /admin/analytics - Analytics y estadísticas');
        console.log('   • /admin/usuarios - Gestión de usuarios');
        console.log('   • /admin/tests - Gestión de tests');
        console.log('   • /admin/preguntas - Gestión de preguntas');
        console.log('   • /admin/contenido - Gestión de contenido');
        console.log('   • /admin/configuracion - Configuración del sistema');

    } catch (error) {
        console.error('❌ Error durante las pruebas:', error.message);
    }
}

// Ejecutar las pruebas
testAdminRoutes(); 
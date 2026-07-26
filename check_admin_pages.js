const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando páginas de administración...\n');

const adminPages = [
    'admin.html',
    'admin-analytics.html',
    'admin-usuarios.html',
    'admin-tests.html',
    'admin-preguntas.html',
    'admin-contenido.html',
    'admin-configuracion.html'
];

const viewsDir = path.join(__dirname, 'views');

console.log('📁 Verificando archivos en views/:');
adminPages.forEach(page => {
    const filePath = path.join(viewsDir, page);
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`✅ ${page} - ${(stats.size / 1024).toFixed(1)} KB`);
    } else {
        console.log(`❌ ${page} - NO ENCONTRADO`);
    }
});

console.log('\n📋 Rutas configuradas en app.js:');
const routes = [
    '/admin',
    '/admin/analytics',
    '/admin/usuarios',
    '/admin/tests',
    '/admin/preguntas',
    '/admin/contenido',
    '/admin/configuracion'
];

routes.forEach(route => {
    console.log(`   • ${route}`);
});

console.log('\n🎉 Verificación completada!');
console.log('\n📝 Para acceder al panel de administración:');
console.log('   1. Ve a http://localhost:3001/sesion');
console.log('   2. Inicia sesión con: admin@edumod.com / Admin$2024!@#');
console.log('   3. Serás redirigido al panel de administración');
console.log('\n🔗 Enlaces directos (requieren autenticación):');
routes.forEach(route => {
    console.log(`   • http://localhost:3001${route}`);
}); 
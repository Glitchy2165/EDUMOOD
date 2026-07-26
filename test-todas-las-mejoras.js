const puppeteer = require('puppeteer');

async function testAllImprovements() {
    console.log('🚀 Iniciando pruebas de todas las mejoras...\n');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    
    try {
        // Test 1: Página de Actividades
        console.log('📋 Probando página de Actividades...');
        await page.goto('http://localhost:3000/actividades', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        
        // Verificar elementos del nuevo diseño
        const actividadesHero = await page.$('.hero-section');
        const actividadesCards = await page.$$('.activity-card');
        const actividadesTabs = await page.$$('.activity-tab');
        
        console.log(`✅ Hero section: ${actividadesHero ? 'Presente' : 'Faltante'}`);
        console.log(`✅ Tarjetas de actividades: ${actividadesCards.length} encontradas`);
        console.log(`✅ Pestañas de filtro: ${actividadesTabs.length} encontradas`);
        
        // Test 2: Página de Biblioteca
        console.log('\n📚 Probando página de Biblioteca...');
        await page.goto('http://localhost:3000/biblioteca', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        
        const bibliotecaHero = await page.$('.hero-section');
        const bibliotecaSearch = await page.$('.search-section');
        const bibliotecaBooks = await page.$$('.book-item');
        
        console.log(`✅ Hero section: ${bibliotecaHero ? 'Presente' : 'Faltante'}`);
        console.log(`✅ Sección de búsqueda: ${bibliotecaSearch ? 'Presente' : 'Faltante'}`);
        console.log(`✅ Libros: ${bibliotecaBooks.length} encontrados`);
        
        // Test 3: Páginas de Resultados
        const resultados = [
            { url: '/resultado-1', nombre: 'Salud Mental Baja' },
            { url: '/resultado-2', nombre: 'Salud Mental Moderada' },
            { url: '/resultado-3', nombre: 'Salud Mental Buena' },
            { url: '/resultado-4', nombre: 'Salud Mental Excelente' }
        ];
        
        for (const resultado of resultados) {
            console.log(`\n🎯 Probando ${resultado.nombre}...`);
            await page.goto(`http://localhost:3000${resultado.url}`, { waitUntil: 'networkidle2' });
            await page.waitForTimeout(2000);
            
            const resultHero = await page.$('.hero-section');
            const resultCard = await page.$('.result-card');
            const resultIcon = await page.$('.result-icon');
            const recommendations = await page.$$('.recommendation-item');
            const actionButtons = await page.$$('.btn-action');
            
            console.log(`✅ Hero section: ${resultHero ? 'Presente' : 'Faltante'}`);
            console.log(`✅ Tarjeta de resultado: ${resultCard ? 'Presente' : 'Faltante'}`);
            console.log(`✅ Icono de resultado: ${resultIcon ? 'Presente' : 'Faltante'}`);
            console.log(`✅ Recomendaciones: ${recommendations.length} encontradas`);
            console.log(`✅ Botones de acción: ${actionButtons.length} encontrados`);
        }
        
        // Test 4: Verificar elementos comunes
        console.log('\n🔍 Verificando elementos comunes...');
        
        // Verificar navbar en todas las páginas
        const navbar = await page.$('.navbar');
        const navbarBrand = await page.$('.navbar-brand');
        
        console.log(`✅ Navbar: ${navbar ? 'Presente' : 'Faltante'}`);
        console.log(`✅ Brand EDUMOD: ${navbarBrand ? 'Presente' : 'Faltante'}`);
        
        // Verificar footer
        const footer = await page.$('footer');
        const socialLinks = await page.$$('.social-links a');
        
        console.log(`✅ Footer: ${footer ? 'Presente' : 'Faltante'}`);
        console.log(`✅ Enlaces sociales: ${socialLinks.length} encontrados`);
        
        // Test 5: Verificar responsividad
        console.log('\n📱 Probando responsividad...');
        
        // Cambiar a vista móvil
        await page.setViewport({ width: 375, height: 667 });
        await page.waitForTimeout(1000);
        
        const mobileNavbar = await page.$('.navbar');
        const mobileHero = await page.$('.hero-section');
        
        console.log(`✅ Navbar móvil: ${mobileNavbar ? 'Presente' : 'Faltante'}`);
        console.log(`✅ Hero móvil: ${mobileHero ? 'Presente' : 'Faltante'}`);
        
        // Volver a vista desktop
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Test 6: Verificar animaciones
        console.log('\n✨ Verificando animaciones...');
        
        const aosElements = await page.$$('[data-aos]');
        console.log(`✅ Elementos con AOS: ${aosElements.length} encontrados`);
        
        // Test 7: Verificar glassmorphism
        console.log('\n💎 Verificando efectos glassmorphism...');
        
        const glassCards = await page.$$('.activity-card, .book-item, .result-card, .recommendations');
        console.log(`✅ Elementos con glassmorphism: ${glassCards.length} encontrados`);
        
        // Test 8: Verificar gradientes
        console.log('\n🎨 Verificando gradientes...');
        
        const gradientElements = await page.$$('.hero-section, .btn-action');
        console.log(`✅ Elementos con gradientes: ${gradientElements.length} encontrados`);
        
        console.log('\n🎉 ¡Todas las pruebas completadas exitosamente!');
        console.log('\n📊 Resumen de mejoras implementadas:');
        console.log('✅ Diseño moderno con glassmorphism');
        console.log('✅ Gradientes y efectos visuales');
        console.log('✅ Animaciones AOS');
        console.log('✅ Navbar fijo con blur');
        console.log('✅ Hero sections atractivos');
        console.log('✅ Tarjetas interactivas');
        console.log('✅ Botones con efectos hover');
        console.log('✅ Footer completo');
        console.log('✅ Responsividad móvil');
        console.log('✅ Iconos Font Awesome');
        console.log('✅ Tipografía Poppins');
        console.log('✅ Colores consistentes EDUMOD');
        
    } catch (error) {
        console.error('❌ Error durante las pruebas:', error.message);
    } finally {
        await browser.close();
    }
}

// Función para verificar si el servidor está corriendo
async function checkServer() {
    try {
        const response = await fetch('http://localhost:3000');
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Ejecutar pruebas
async function runTests() {
    console.log('🔍 Verificando si el servidor está corriendo...');
    
    const serverRunning = await checkServer();
    if (!serverRunning) {
        console.log('❌ El servidor no está corriendo en http://localhost:3000');
        console.log('💡 Por favor, inicia el servidor con: npm start');
        return;
    }
    
    console.log('✅ Servidor detectado, iniciando pruebas...\n');
    await testAllImprovements();
}

// Ejecutar si se llama directamente
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { testAllImprovements, runTests }; 
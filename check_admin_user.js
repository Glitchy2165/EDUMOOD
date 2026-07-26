const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'edumod_advanced',
    port: 3306
});

async function checkAdminUser() {
    console.log('🔍 Verificando usuario administrador...\n');

    try {
        // Verificar si existe el usuario admin
        const [users] = await db.query("SELECT id, nombre, correo, es_admin FROM usuarios WHERE correo = 'admin@edumod.com'");
        
        if (users.length > 0) {
            const admin = users[0];
            console.log('✅ Usuario administrador encontrado:');
            console.log(`   • ID: ${admin.id}`);
            console.log(`   • Nombre: ${admin.nombre}`);
            console.log(`   • Correo: ${admin.correo}`);
            console.log(`   • Es Admin: ${admin.es_admin ? 'Sí' : 'No'}`);
        } else {
            console.log('❌ Usuario administrador NO encontrado');
            console.log('🔧 Creando usuario administrador...');
            
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('Admin$2024!@#', 10);
            
            await db.query(
                "INSERT INTO usuarios (nombre, correo, contraseña, es_admin) VALUES (?, ?, ?, ?)",
                ['Administrador', 'admin@edumod.com', hashedPassword, true]
            );
            
            console.log('✅ Usuario administrador creado exitosamente');
        }

        // Verificar estadísticas generales
        console.log('\n📊 Estadísticas de la base de datos:');
        
        const [totalUsers] = await db.query("SELECT COUNT(*) as total FROM usuarios");
        console.log(`   • Total de usuarios: ${totalUsers[0].total}`);
        
        const [adminUsers] = await db.query("SELECT COUNT(*) as total FROM usuarios WHERE es_admin = 1");
        console.log(`   • Usuarios administradores: ${adminUsers[0].total}`);
        
        const [testResults] = await db.query("SELECT COUNT(*) as total FROM resultados_tests");
        console.log(`   • Resultados de tests: ${testResults[0].total}`);

        console.log('\n🎉 Verificación completada!');
        console.log('\n🔑 Credenciales del administrador:');
        console.log('   • Email: admin@edumod.com');
        console.log('   • Contraseña: Admin$2024!@#');

    } catch (error) {
        console.error('❌ Error durante la verificación:', error.message);
    } finally {
        await db.end();
    }
}

checkAdminUser(); 
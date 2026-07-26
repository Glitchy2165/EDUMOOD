const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function createAdmin() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '1234',
        database: 'edumod_advanced',
        port: 3306
    });

    try {
        console.log('🔧 Creando usuario administrador...');

        // Contraseña para el admin
        const adminPassword = 'Admin$2024!@#';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Insertar admin en la tabla usuarios
        await connection.execute(
            'INSERT INTO usuarios (nombre, correo, contraseña, es_admin, edad) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE contraseña = VALUES(contraseña), es_admin = VALUES(es_admin)',
            ['Administrador', 'admin@edumod.com', hashedPassword, 1, 25]
        );

        console.log('✅ Usuario administrador creado exitosamente');
        console.log('📧 Email: admin@edumod.com');
        console.log('🔑 Contraseña: Admin$2024!@#');

        // Verificar que se creó correctamente
        const [rows] = await connection.execute('SELECT * FROM usuarios WHERE correo = ?', ['admin@edumod.com']);
        console.log('✅ Verificación:', rows.length > 0 ? 'Usuario encontrado' : 'Usuario no encontrado');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await connection.end();
    }
}

createAdmin(); 
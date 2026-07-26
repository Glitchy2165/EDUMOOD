const mysql = require('mysql2/promise');

async function setupDatabase() {
    let connection;
    
    try {
        // Conectar sin especificar base de datos
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '1234',
            port: 3306
        });
        
        console.log('🔗 Conectado a MySQL');
        
        // Crear base de datos si no existe
        await connection.query('CREATE DATABASE IF NOT EXISTS edumod_advanced');
        console.log('✅ Base de datos "edumod_advanced" creada/verificada');
        
        // Usar la base de datos
        await connection.query('USE edumod_advanced');
        
        // Crear tabla usuarios
        await connection.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                correo VARCHAR(100) NOT NULL UNIQUE,
                contraseña VARCHAR(255) NOT NULL,
                es_admin BOOLEAN DEFAULT FALSE,
                edad INT,
                fecha_nacimiento DATE,
                email_verified BOOLEAN DEFAULT FALSE,
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabla "usuarios" creada/verificada');
        
        // Crear tabla audiolibros
        await connection.query(`
            CREATE TABLE IF NOT EXISTS audiolibros (
                id INT AUTO_INCREMENT PRIMARY KEY,
                titulo VARCHAR(255) NOT NULL,
                contenido TEXT NOT NULL,
                archivo_audio VARCHAR(255),
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                activo BOOLEAN DEFAULT TRUE
            )
        `);
        console.log('✅ Tabla "audiolibros" creada/verificada');
        
        // Crear tabla estadisticas_uso
        await connection.query(`
            CREATE TABLE IF NOT EXISTS estadisticas_uso (
                id INT AUTO_INCREMENT PRIMARY KEY,
                seccion VARCHAR(100) NOT NULL,
                usuario_id INT,
                fecha_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
            )
        `);
        console.log('✅ Tabla "estadisticas_uso" creada/verificada');
        
        // Crear tabla resultados_test
        await connection.query(`
            CREATE TABLE IF NOT EXISTS resultados_test (
                id INT AUTO_INCREMENT PRIMARY KEY,
                puntaje_total INT NOT NULL,
                resultado VARCHAR(100) NOT NULL,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                usuario_id INT,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
            )
        `);
        console.log('✅ Tabla "resultados_test" creada/verificada');
        
        // Crear tabla configuracion_sistema
        await connection.query(`
            CREATE TABLE IF NOT EXISTS configuracion_sistema (
                id INT AUTO_INCREMENT PRIMARY KEY,
                clave VARCHAR(100) NOT NULL UNIQUE,
                valor TEXT NOT NULL,
                descripcion TEXT,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabla "configuracion_sistema" creada/verificada');
        
        // Crear tabla actividades
        await connection.query(`
            CREATE TABLE IF NOT EXISTS actividades (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                tipo ENUM('sopa_letras', 'crucigrama', 'meditacion', 'ejercicio', 'lectura') NOT NULL,
                contenido JSON,
                activa BOOLEAN DEFAULT TRUE,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabla "actividades" creada/verificada');
        
        // Crear tabla verification_codes
        await connection.query(`
            CREATE TABLE IF NOT EXISTS verification_codes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                code VARCHAR(6) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                used BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Tabla "verification_codes" creada/verificada');
        
        // Crear tabla qr_tokens
        await connection.query(`
            CREATE TABLE IF NOT EXISTS qr_tokens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                token VARCHAR(255) NOT NULL UNIQUE,
                expires_at TIMESTAMP NOT NULL,
                used BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabla "qr_tokens" creada/verificada');
        
        console.log('🎉 Base de datos configurada correctamente!');
        
    } catch (error) {
        console.error('❌ Error configurando base de datos:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setupDatabase(); 
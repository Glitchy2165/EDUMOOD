const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'edumod_advanced',
    port: process.env.DB_PORT || 3306
});

async function fixDatabase() {
    try {
        console.log('🔧 Iniciando reparación de la base de datos...');

        // 1. Crear base de datos si no existe
        await db.query(`CREATE DATABASE IF NOT EXISTS salud_m CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await db.query(`USE salud_m`);

        // 2. Crear tabla usuarios con estructura correcta
        await db.query(`
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

        // 3. Crear tabla preguntas
        await db.query(`
            CREATE TABLE IF NOT EXISTS preguntas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                pregunta TEXT NOT NULL
            )
        `);

        // 4. Crear tabla respuestas
        await db.query(`
            CREATE TABLE IF NOT EXISTS respuestas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                pregunta_id INT NOT NULL,
                respuesta TEXT NOT NULL,
                puntaje INT NOT NULL,
                intento INT NOT NULL,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                FOREIGN KEY (pregunta_id) REFERENCES preguntas(id) ON DELETE CASCADE
            )
        `);

        // 5. Crear tabla resultados_tests
        await db.query(`
            CREATE TABLE IF NOT EXISTS resultados_tests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                intento INT NOT NULL,
                puntaje_total INT NOT NULL,
                resultado VARCHAR(100) NOT NULL,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )
        `);

        // 6. Crear tabla resultados_test (para compatibilidad)
        await db.query(`
            CREATE TABLE IF NOT EXISTS resultados_test (
                id INT AUTO_INCREMENT PRIMARY KEY,
                puntaje_total INT NOT NULL,
                resultado VARCHAR(100) NOT NULL,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                usuario_id INT,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
            )
        `);

        // 7. Crear tabla estadisticas_uso
        await db.query(`
            CREATE TABLE IF NOT EXISTS estadisticas_uso (
                id INT AUTO_INCREMENT PRIMARY KEY,
                seccion VARCHAR(100) NOT NULL,
                usuario_id INT,
                fecha_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
            )
        `);

        // 8. Crear tabla configuracion_sistema
        await db.query(`
            CREATE TABLE IF NOT EXISTS configuracion_sistema (
                id INT AUTO_INCREMENT PRIMARY KEY,
                clave VARCHAR(100) NOT NULL UNIQUE,
                valor TEXT NOT NULL,
                descripcion TEXT,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // 9. Crear tabla audiolibros
        await db.query(`
            CREATE TABLE IF NOT EXISTS audiolibros (
                id INT AUTO_INCREMENT PRIMARY KEY,
                titulo VARCHAR(255) NOT NULL,
                contenido TEXT NOT NULL,
                archivo_audio VARCHAR(255),
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                activo BOOLEAN DEFAULT TRUE
            )
        `);

        // 10. Crear tabla actividades
        await db.query(`
            CREATE TABLE IF NOT EXISTS actividades (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                tipo ENUM('sopa_letras', 'crucigrama', 'meditacion', 'ejercicio', 'lectura') NOT NULL,
                contenido JSON,
                activa BOOLEAN DEFAULT TRUE,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 11. Crear tabla verification_codes
        await db.query(`
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

        // 12. Crear tabla qr_tokens
        await db.query(`
            CREATE TABLE IF NOT EXISTS qr_tokens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                token VARCHAR(255) NOT NULL UNIQUE,
                expires_at TIMESTAMP NOT NULL,
                used BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 13. Insertar datos de ejemplo si no existen
        const [existingUsers] = await db.query('SELECT COUNT(*) as count FROM usuarios');
        if (existingUsers[0].count === 0) {
            console.log('📝 Insertando datos de ejemplo...');
            
            // Insertar admin de ejemplo
            await db.query(`
                INSERT INTO usuarios (nombre, correo, contraseña, es_admin, edad) 
                VALUES ('Admin', 'admin@edumod.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE, 25)
            `);

            // Insertar preguntas de ejemplo
            const preguntas = [
                '¿Te sientes feliz la mayor parte del tiempo?',
                '¿Tienes dificultades para concentrarte?',
                '¿Duermes bien por las noches?',
                '¿Sientes ansiedad frecuentemente?',
                '¿Disfrutas de las actividades cotidianas?',
                '¿Te sientes satisfecho con tu rendimiento escolar?',
                '¿Te llevas bien con tus compañeros de clase?',
                '¿Te sientes cómodo expresando tus opiniones?',
                '¿Sientes que tus profesores te apoyan?',
                '¿Te sientes satisfecho con tu vida social?',
                '¿Te sientes satisfecho con tu autoestima?',
                '¿Te sientes motivado para aprender cosas nuevas?',
                '¿Te sientes satisfecho con las actividades extracurriculares?',
                '¿Te sientes satisfecho con tu apariencia física?',
                '¿Te sientes satisfecho con el tiempo que pasas con tu familia?'
            ];

            for (const pregunta of preguntas) {
                await db.query('INSERT INTO preguntas (pregunta) VALUES (?)', [pregunta]);
            }

            // Insertar configuración inicial
            const configuraciones = [
                ['talkback_activo', 'true', 'Sistema TalkBack activo/inactivo'],
                ['edad_minima_test', '13', 'Edad mínima para realizar el test'],
                ['edad_maxima_test', '18', 'Edad máxima para realizar el test'],
                ['puntaje_maximo', '70', 'Puntaje máximo del test'],
                ['test_bloqueado_por_sesion', 'true', 'Bloquear test por sesión después de completarlo']
            ];

            for (const [clave, valor, descripcion] of configuraciones) {
                await db.query(`
                    INSERT INTO configuracion_sistema (clave, valor, descripcion) 
                    VALUES (?, ?, ?)
                `, [clave, valor, descripcion]);
            }

            // Insertar actividades de ejemplo
            await db.query(`
                INSERT INTO actividades (nombre, tipo, contenido, activa) VALUES
                ('Sopa de Letras - Salud Mental', 'sopa_letras', 
                '{"palabras": ["ansiedad", "emociones", "autoestima", "bienestar", "felicidad", "estres", "meditacion", "terapia"], "filas": 15, "columnas": 15}', 
                true),
                ('Crucigrama - Términos Básicos', 'crucigrama', 
                '{"preguntas": [{"pregunta": "Estado de preocupación excesiva", "respuesta": "ansiedad", "x": 1, "y": 1, "direccion": "horizontal"}, {"pregunta": "Sentimientos que experimentamos", "respuesta": "emociones", "x": 1, "y": 3, "direccion": "vertical"}, {"pregunta": "Valoración que hacemos de nosotros mismos", "respuesta": "autoestima", "x": 5, "y": 1, "direccion": "horizontal"}]}', 
                true)
            `);

            // Insertar audiolibros de ejemplo
            await db.query(`
                INSERT INTO audiolibros (titulo, contenido, activo) VALUES
                ('Guía de Meditación para Principiantes', 'La meditación es una práctica que nos ayuda a encontrar paz interior y reducir el estrés. Comienza encontrando un lugar tranquilo donde puedas sentarte cómodamente...', true),
                ('Técnicas de Respiración', 'La respiración consciente es una herramienta poderosa para manejar la ansiedad. Inhala lentamente por la nariz contando hasta cuatro...', true),
                ('Construyendo Autoestima', 'La autoestima es la base de nuestro bienestar emocional. Aprende a reconocer tus fortalezas y celebrar tus logros, por pequeños que sean...', true)
            `);
        }

        console.log('✅ Base de datos reparada exitosamente!');
        console.log('📊 Tablas creadas/verificadas:');
        console.log('   - usuarios');
        console.log('   - preguntas');
        console.log('   - respuestas');
        console.log('   - resultados_tests');
        console.log('   - resultados_test');
        console.log('   - estadisticas_uso');
        console.log('   - configuracion_sistema');
        console.log('   - audiolibros');
        console.log('   - actividades');
        console.log('   - verification_codes');
        console.log('   - qr_tokens');

    } catch (error) {
        console.error('❌ Error al reparar la base de datos:', error);
        throw error;
    } finally {
        await db.end();
    }
}

// Ejecutar la reparación
fixDatabase().catch(console.error); 
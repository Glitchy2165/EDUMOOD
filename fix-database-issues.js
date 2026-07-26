const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'salud_m',
  port: 3306
});

async function fixDatabaseIssues() {
    try {
        console.log('🔧 Arreglando problemas de base de datos...');
        
        // 1. Crear tabla resultados_tests si no existe
        console.log('\n📊 Creando tabla resultados_tests...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS resultados_tests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT,
                intento INT DEFAULT 1,
                puntaje_total INT,
                resultado VARCHAR(100),
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
            )
        `);
        console.log('✅ Tabla resultados_tests creada/verificada');
        
        // 2. Crear tabla respuestas si no existe
        console.log('\n📝 Creando tabla respuestas...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS respuestas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT,
                pregunta_id INT,
                respuesta TEXT,
                puntaje INT,
                intento INT DEFAULT 1,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
            )
        `);
        console.log('✅ Tabla respuestas creada/verificada');
        
        // 3. Verificar si existe el usuario
        console.log('\n👤 Verificando usuario...');
        const [users] = await db.query("SELECT * FROM usuarios WHERE id = 1");
        if (users.length === 0) {
            console.log('⚠️ Usuario con ID 1 no existe, creando...');
            await db.query(`
                INSERT INTO usuarios (id, nombre, correo, contraseña, es_admin) 
                VALUES (1, 'Usuario Test', 'joelcarrasco30183@gmail.com', 
                '$2b$10$9sGm5AlYXhhXKNNeg.VRSeNoYyQAwXos8DtirnHcUbW/RStT5Rafi', 0)
            `);
            console.log('✅ Usuario creado');
        } else {
            console.log('✅ Usuario ya existe');
        }
        
        // 4. Verificar tablas
        console.log('\n📋 Verificando tablas...');
        const [tables] = await db.query("SHOW TABLES");
        console.log('Tablas disponibles:', tables.map(t => Object.values(t)[0]));
        
        console.log('\n🎉 Problemas de base de datos arreglados!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await db.end();
    }
}

fixDatabaseIssues(); 
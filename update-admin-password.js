const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'edumod_advanced',
  port: 3306
});

const correo = 'admin@edumod.com';
const hash = '$2b$10$snv7cDtELCLi9dr0BEHKl.up/4Zi3yQ9rHmkIYjai8NDaG/C8Pz0i'; // Admin$2024!@#

async function updateAdminPassword() {
    try {
        const [result] = await db.query('UPDATE usuarios SET contraseña = ? WHERE correo = ?', [hash, correo]);
        if (result.affectedRows > 0) {
            console.log('✅ Contraseña de admin actualizada correctamente.');
        } else {
            console.log('⚠️ No se encontró el usuario admin@edumod.com.');
        }
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await db.end();
    }
}

updateAdminPassword(); 
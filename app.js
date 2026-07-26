const express = require('express');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const { exec } = require('child_process');
const passport = require('./middlewares/googleAuth');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { verifyPassword } = require('./config/password');
const gTTS = require('node-gtts')('es');
const { validateTestSubmission, handleValidationErrors: validationErrorHandler } = require('./tests/validation');
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');

// Integraciones de seguridad, rendimiento y logging
const { 
    helmetConfig, 
    sessionConfig, 
    createRateLimit, 
    createSlowDown,
    sanitizeInput,
    validateContentType,
    preventTimingAttacks
} = require('./config/security');
const { compressionConfig, staticCacheConfig } = require('./config/performance');
const { logRequest, logError } = require('./config/logger');

// Nuevos middlewares y configuraciones
const { 
    pool, 
    testConnection, 
    executeQuery, 
    executeTransaction, 
    injectDatabase 
} = require('./config/database');
const { 
    errorHandler, 
    notFound, 
    handleValidationErrors, 
    handleDatabaseErrors, 
    handleAuthErrors 
} = require('./middlewares/errorHandler');

dotenv.config(); // Cargar variables de entorno

const app = express();

// Configurar EJS como motor de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares de seguridad y rendimiento
app.use(helmetConfig);
app.use(require('hpp')());
app.use(compressionConfig);

// Logging de peticiones
app.use(logRequest);

// Rate limiting y slow down (aplicar a todas las rutas)
app.use(createRateLimit());
app.use(createSlowDown());

// 🔹 Configuración de Passport (ANTES de middlewares de validación)
app.use(passport.initialize());
app.use(passport.session());

// Middleware CRÍTICO: bodyParser DEBE ir ANTES de validaciones
app.use(express.json({ limit: '10mb' }));

// Middlewares de seguridad (DESPUÉS de bodyParser)
app.use(sanitizeInput);
app.use(validateContentType);
app.use(preventTimingAttacks);

// Inyectar base de datos en req
app.use(injectDatabase);

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public'), staticCacheConfig));

// 🔹 Crear tablas si no existen
const crearTablas = async () => {
    try {
        // Tabla usuarios (debe crearse primero)
        await pool.execute(`
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

        // Tabla estadisticas_uso
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS estadisticas_uso (
                id INT AUTO_INCREMENT PRIMARY KEY,
                seccion VARCHAR(100) NOT NULL,
                usuario_id INT,
                fecha_acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
            )
        `);

        // Tabla resultados_test (para compatibilidad)
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS resultados_test (
                id INT AUTO_INCREMENT PRIMARY KEY,
                puntaje_total INT NOT NULL,
                resultado VARCHAR(100) NOT NULL,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                usuario_id INT,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
            )
        `);

        // Tabla configuracion_sistema
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS configuracion_sistema (
                id INT AUTO_INCREMENT PRIMARY KEY,
                clave VARCHAR(100) NOT NULL UNIQUE,
                valor TEXT NOT NULL,
                descripcion TEXT,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Tabla audiolibros
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS audiolibros (
                id INT AUTO_INCREMENT PRIMARY KEY,
                titulo VARCHAR(255) NOT NULL,
                contenido TEXT NOT NULL,
                archivo_audio VARCHAR(255),
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                activo BOOLEAN DEFAULT TRUE
            )
        `);

        // Tabla actividades
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS actividades (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                tipo ENUM('sopa_letras', 'crucigrama', 'meditacion', 'ejercicio', 'lectura') NOT NULL,
                contenido JSON,
                activa BOOLEAN DEFAULT TRUE,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabla verification_codes
        await pool.execute(`
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

        // Tabla qr_tokens
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS qr_tokens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                token VARCHAR(255) NOT NULL UNIQUE,
                expires_at TIMESTAMP NOT NULL,
                used BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ Tablas creadas/verificadas correctamente');
    } catch (error) {
        console.error('❌ Error al crear tablas:', error);
    }
};

// 🔹 Inicializar base de datos
crearTablas();

// 🔹 Configuración de sesiones seguras
app.use(session(sessionConfig));

// 🔹 Configuración de Passport
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, 'public'), staticCacheConfig)); // Servir archivos estáticos con caché

// Ruta para servir archivos de audio
app.use('/audio', express.static(path.join(__dirname, 'public', 'audio'), staticCacheConfig));

// Servir archivos PDF de libros
const pathLibros = path.join(__dirname, 'libros');
app.use('/libros', express.static(pathLibros));

// 🔹 Endpoint de salud para monitoreo
app.get('/health', async (req, res) => {
  try {
    // Verificar conexión a la base de datos usando el nuevo sistema
    const isConnected = await testConnection();
    
    const healthStatus = {
      status: isConnected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: isConnected ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV || 'development',
      version: process.version
    };
    
    res.status(isConnected ? 200 : 503).json(healthStatus);
  } catch (error) {
    logError('Error en health check', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      uptime: process.uptime()
    });
  }
});

// 🔹 Endpoint de métricas básicas
app.get('/metrics', (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    process: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    },
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development'
    }
  };
  
  res.status(200).json(metrics);
});

// 🔹 Dashboard de monitoreo (solo para admins)
app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin-dashboard.html'));
});

// 🔹 Rutas de autenticación Google
app.use('/auth', require('./routes/auth'));

// 🔹 Rutas de páginas principales
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/salud-mental', (req, res) => res.sendFile(path.join(__dirname, 'views', 'salud-mental.html')));
app.get('/importancia', (req, res) => res.sendFile(path.join(__dirname, 'views', 'importancia.html')));
app.get('/beneficios', (req, res) => res.sendFile(path.join(__dirname, 'views', 'beneficios.html')));
app.get('/access', (req, res) => res.sendFile(path.join(__dirname, 'views', 'access.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'sesion.html')));
app.get('/sesion', (req, res) => res.sendFile(path.join(__dirname, 'views', 'sesion.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'views', 'registro.html')));
app.get('/registro', (req, res) => res.sendFile(path.join(__dirname, 'views', 'registro.html')));
app.get('/lugares', (req, res) => res.sendFile(path.join(__dirname, 'views', 'lugares.html')));
app.get('/actividades', (req, res) => res.sendFile(path.join(__dirname, 'views', 'actividades.html')));
// app.get('/biblioteca', async (req, res) => {
//   try {
//     const [libros] = await pool.query('SELECT * FROM libros');
//     libros.forEach(libro => {
//       if (libro.portada && !libro.portada.startsWith('/img/')) {
//         libro.portada = '/img/' + libro.portada;
//       }
//     });
//     res.render('biblioteca', { libros });
//   } catch (err) {
//     res.status(500).send('Error al cargar la biblioteca');
//   }
// });

const bibliotecaRouter = require('./routes/biblioteca');
app.use('/', bibliotecaRouter);
app.get('/test', async (req, res, next) => {
    if (req.session && req.session.user) {
        try {
            const [results] = await pool.query('SELECT COUNT(*) as completado FROM resultados_test WHERE usuario_id = ?', [req.session.user.id]);
            if (results[0].completado > 0) {
                return res.redirect('/test-already-done');
            }
        } catch (error) {
            console.error('Error al verificar intento de test:', error);
            // Si hay error, dejar pasar al test
        }
    }
    res.sendFile(path.join(__dirname, 'views', 'test.html'));
});

// 🔹 Rutas de resultados del test (5 categorías)
app.get('/resultados/muy-bajo', (req, res) => res.sendFile(path.join(__dirname, 'views', 'resultado-muy-bajo.html')));
app.get('/resultados/bajo', (req, res) => res.sendFile(path.join(__dirname, 'views', 'resultado-bajo.html')));
app.get('/resultados/medio', (req, res) => res.sendFile(path.join(__dirname, 'views', 'resultado-medio.html')));
app.get('/resultados/alto', (req, res) => res.sendFile(path.join(__dirname, 'views', 'resultado-alto.html')));
app.get('/resultados/muy-alto', (req, res) => res.sendFile(path.join(__dirname, 'views', 'resultado-muy-alto.html')));

// 🔹 Rutas de resultados del test (mantener compatibilidad)
app.get('/resultado-1', (req, res) => res.sendFile(path.join(__dirname, 'views', 'resultado-1.html')));
app.get('/resultado-2', (req, res) => res.sendFile(path.join(__dirname, 'views', 'resultado-2.html')));
app.get('/resultado-3', (req, res) => res.sendFile(path.join(__dirname, 'views', 'resultado-3.html')));
app.get('/resultado-4', (req, res) => res.sendFile(path.join(__dirname, 'views', 'resultado-4.html')));

// 🔹 Nuevas rutas para actividades
app.get('/sopa-letras', (req, res) => res.sendFile(path.join(__dirname, 'views', 'sopa-letras.html')));
app.get('/crucigrama', (req, res) => res.sendFile(path.join(__dirname, 'views', 'crucigrama.html')));

// 🔹 Rutas adicionales para páginas faltantes
app.get('/terapia', (req, res) => res.sendFile(path.join(__dirname, 'views', 'terapia.html')));
app.get('/grupos', (req, res) => res.sendFile(path.join(__dirname, 'views', 'grupos.html')));
app.get('/recursos', (req, res) => res.sendFile(path.join(__dirname, 'views', 'recursos.html')));
app.get('/contacto', (req, res) => res.sendFile(path.join(__dirname, 'views', 'contacto.html')));
app.get('/perfil', (req, res) => res.sendFile(path.join(__dirname, 'views', 'perfil.html')));

// 🔹 Rutas de administración protegidas
app.get('/admin', (req, res) => {
    if (req.session.user && req.session.user.es_admin) {
        res.sendFile(path.join(__dirname, 'views', 'admin.html'));
    } else {
        res.redirect('/sesion');
    }
});

// 🔹 Ruta para Analytics (protegida)
app.get('/admin/analytics', (req, res) => {
    if (req.session.user && req.session.user.es_admin) {
        res.sendFile(path.join(__dirname, 'views', 'admin-analytics.html'));
    } else {
        res.redirect('/sesion');
    }
});

// 🔹 Ruta para Usuarios (protegida)
app.get('/admin/usuarios', (req, res) => {
    if (req.session.user && req.session.user.es_admin) {
        res.sendFile(path.join(__dirname, 'views', 'admin-usuarios.html'));
    } else {
        res.redirect('/sesion');
    }
});

// 🔹 Ruta para Tests (protegida)
app.get('/admin/tests', (req, res) => {
    if (req.session.user && req.session.user.es_admin) {
        res.sendFile(path.join(__dirname, 'views', 'admin-tests.html'));
    } else {
        res.redirect('/sesion');
    }
});

// 🔹 Ruta para Preguntas (protegida)
app.get('/admin/preguntas', (req, res) => {
    if (req.session.user && req.session.user.es_admin) {
        res.sendFile(path.join(__dirname, 'views', 'admin-preguntas.html'));
    } else {
        res.redirect('/sesion');
    }
});

// 🔹 Ruta para Contenido (protegida)
app.get('/admin/contenido', (req, res) => {
    if (req.session.user && req.session.user.es_admin) {
        res.sendFile(path.join(__dirname, 'views', 'admin-contenido.html'));
    } else {
        res.redirect('/sesion');
    }
});

// 🔹 Ruta para Configuración (protegida)
app.get('/admin/configuracion', (req, res) => {
    if (req.session.user && req.session.user.es_admin) {
        res.sendFile(path.join(__dirname, 'views', 'admin-configuracion.html'));
    } else {
        res.redirect('/sesion');
    }
});

// 🔹 Ruta para la página de usuarios (protegida) - compatibilidad
app.get('/usuarios', (req, res) => {
    if (req.session.user && req.session.user.es_admin) {
        res.sendFile(path.join(__dirname, 'views', 'usuarios.html'));
    } else {
        res.redirect('/sesion');
    }
});

// 🔹 Ruta para la página de preguntas (protegida) - compatibilidad
app.get('/admin/preguntas-old', (req, res) => {
    if (req.session.user && req.session.user.es_admin) {
        res.sendFile(path.join(__dirname, 'views', 'preguntas.html'));
    } else {
        res.redirect('/sesion');
    }
});

// 🔹 Ruta para la página de respuestas (protegida)
app.get('/admin/respuestas', (req, res) => {
    if (req.session.user && req.session.user.es_admin) {
        res.sendFile(path.join(__dirname, 'views', 'respuestas.html'));
    } else {
        res.redirect('/sesion');
    }
});

// 🔹 Obtener usuarios para el Admin Panel (incluye contraseña)
app.get('/admin/usuarios-data', async (req, res) => {
    if (!req.session.user || !req.session.user.es_admin) {
        return res.status(403).json({ error: "Acceso denegado" });
    }

    try {
        const query = "SELECT id, nombre, correo, es_admin, edad, fecha_registro, email_verified FROM usuarios ORDER BY id DESC";
        const [results] = await pool.query(query);

        const usuarios = results.map(usuario => ({
            ...usuario,
            activo: true,
            ultimo_acceso: usuario.fecha_registro || new Date().toISOString(),
            tests_completados: 0,
            fecha_registro: usuario.fecha_registro || new Date().toISOString()
        }));

        res.json(usuarios);
    } catch (err) {
        console.error("❌ Error al obtener usuarios:", err);
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
});

app.get('/admin/usuarios-data/:id', async (req, res) => {
    if (!req.session.user || !req.session.user.es_admin) {
        return res.status(403).json({ error: "Acceso denegado" });
    }

    try {
        const [results] = await pool.query('SELECT id, nombre, correo, es_admin, edad, fecha_registro FROM usuarios WHERE id = ?', [req.params.id]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(results[0]);
    } catch (err) {
        console.error('Error al obtener usuario:', err);
        res.status(500).json({ error: 'Error al obtener usuario' });
    }
});

app.post('/admin/agregar-usuario', async (req, res) => {
    if (!req.session.user || !req.session.user.es_admin) {
        return res.status(403).json({ error: 'Acceso denegado' });
    }

    try {
        const { nombre, correo, contraseña, es_admin } = req.body;
        if (!nombre || !correo || !contraseña) {
            return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' });
        }

        const hashedPassword = await bcrypt.hash(contraseña, 10);
        await pool.query(
            'INSERT INTO usuarios (nombre, correo, contraseña, es_admin, edad) VALUES (?, ?, ?, ?, 16)',
            [nombre, correo, hashedPassword, es_admin === 'true' || es_admin === true ? 1 : 0]
        );

        res.json({ success: true, message: 'Usuario agregado correctamente' });
    } catch (err) {
        console.error('Error al agregar usuario:', err);
        res.status(500).json({ error: 'Error al agregar usuario' });
    }
});

// 🔹 Obtener preguntas del test para el Admin Panel
app.get('/admin/preguntas-data', async (req, res) => {
    if (!req.session.user || !req.session.user.es_admin) {
        return res.status(403).json({ error: "Acceso denegado" });
    }

    try {
        const [results] = await pool.query('SELECT id, question AS pregunta, is_active AS activa, category AS categoria, created_at AS ultima_modificacion FROM questions ORDER BY id DESC');
        const preguntas = results.map(pregunta => ({
            ...pregunta,
            activa: pregunta.activa !== 0,
            respuestas: 0,
            categoria: pregunta.categoria || 'General',
            ultima_modificacion: pregunta.ultima_modificacion || new Date().toISOString()
        }));
        res.json(preguntas);
    } catch (err) {
        console.error("❌ Error al obtener preguntas:", err);
        res.status(500).json({ error: "Error al obtener preguntas" });
    }
});

app.get('/admin/preguntas-data/:id', async (req, res) => {
    if (!req.session.user || !req.session.user.es_admin) {
        return res.status(403).json({ error: 'Acceso denegado' });
    }

    try {
        const [results] = await pool.query('SELECT id, question AS pregunta, is_active AS activa, category AS categoria FROM questions WHERE id = ?', [req.params.id]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'Pregunta no encontrada' });
        }
        res.json(results[0]);
    } catch (err) {
        console.error('Error al obtener pregunta:', err);
        res.status(500).json({ error: 'Error al obtener pregunta' });
    }
});

app.post('/admin/agregar-pregunta', async (req, res) => {
    if (!req.session.user || !req.session.user.es_admin) {
        return res.status(403).json({ error: 'Acceso denegado' });
    }

    try {
        const { pregunta, categoria, activa } = req.body;
        if (!pregunta) {
            return res.status(400).json({ error: 'La pregunta es obligatoria' });
        }

        await pool.query('INSERT INTO questions (question, category, is_active) VALUES (?, ?, ?)', [pregunta, categoria || 'General', activa === 'true' || activa === true ? 1 : 0]);
        res.json({ success: true, message: 'Pregunta agregada correctamente' });
    } catch (err) {
        console.error('Error al agregar pregunta:', err);
        res.status(500).json({ error: 'Error al agregar pregunta' });
    }
});

app.put('/admin/editar-pregunta/:id', async (req, res) => {
    if (!req.session.user || !req.session.user.es_admin) {
        return res.status(403).json({ error: 'Acceso denegado' });
    }

    try {
        const { pregunta, categoria, activa } = req.body;
        await pool.query('UPDATE questions SET question = ?, category = ?, is_active = ? WHERE id = ?', [pregunta, categoria || 'General', activa === 'true' || activa === true ? 1 : 0, req.params.id]);
        res.json({ success: true, message: 'Pregunta actualizada correctamente' });
    } catch (err) {
        console.error('Error al actualizar pregunta:', err);
        res.status(500).json({ error: 'Error al actualizar pregunta' });
    }
});

app.delete('/admin/eliminar-pregunta/:id', async (req, res) => {
    if (!req.session.user || !req.session.user.es_admin) {
        return res.status(403).json({ error: 'Acceso denegado' });
    }

    try {
        await pool.query('DELETE FROM questions WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Pregunta eliminada correctamente' });
    } catch (err) {
        console.error('Error al eliminar pregunta:', err);
        res.status(500).json({ error: 'Error al eliminar pregunta' });
    }
});

// 🔹 Obtener respuestas para el Admin Panel
app.get('/admin/respuestas-data', async (req, res) => {
    if (!req.session.user || !req.session.user.es_admin) {
        return res.status(403).json({ error: 'Acceso denegado' });
    }

    try {
        const [results] = await pool.query(`
            SELECT ua.id, ua.answer_text AS respuesta, ua.score AS puntuacion, ua.answered_at AS fecha,
                   u.nombre AS usuario, q.question AS pregunta
            FROM user_answers ua
            LEFT JOIN usuarios u ON ua.user_id = u.id
            LEFT JOIN questions q ON ua.question_id = q.id
            ORDER BY ua.answered_at DESC
        `);

        const total = results.length;
        const today = results.filter(r => new Date(r.fecha).toDateString() === new Date().toDateString()).length;
        const averageScore = total > 0 ? results.reduce((sum, r) => sum + Number(r.puntuacion || 0), 0) / total : 0;
        const activeUsers = new Set(results.map(r => r.usuario)).size;

        res.json({
            total,
            today,
            averageScore,
            activeUsers,
            categories: {
                ansiedad: results.filter(r => (r.pregunta || '').toLowerCase().includes('ansiedad')).length,
                depresion: results.filter(r => (r.pregunta || '').toLowerCase().includes('depresion')).length,
                estres: results.filter(r => (r.pregunta || '').toLowerCase().includes('estres')).length,
                autoestima: results.filter(r => (r.pregunta || '').toLowerCase().includes('autoestima')).length
            },
            trend: results.slice(0, 7).map(r => ({
                date: new Date(r.fecha).toLocaleDateString(),
                count: 1
            })),
            responses: results.map(r => ({
                ...r,
                usuario: r.usuario || 'Usuario anónimo',
                pregunta: r.pregunta || 'Pregunta sin título',
                respuesta: r.respuesta || 'Sin respuesta',
                puntuacion: r.puntuacion || 0,
                fecha: r.fecha || new Date().toISOString()
            }))
        });
    } catch (err) {
        console.error('Error al obtener respuestas:', err);
        res.status(500).json({ error: 'Error al obtener respuestas' });
    }
});

app.get('/admin/respuestas-data/:id', async (req, res) => {
    if (!req.session.user || !req.session.user.es_admin) {
        return res.status(403).json({ error: 'Acceso denegado' });
    }

    try {
        const [results] = await pool.query(`
            SELECT ua.id, ua.answer_text AS respuesta, ua.score AS puntuacion, ua.answered_at AS fecha,
                   u.nombre AS usuario, q.question AS pregunta
            FROM user_answers ua
            LEFT JOIN usuarios u ON ua.user_id = u.id
            LEFT JOIN questions q ON ua.question_id = q.id
            WHERE ua.id = ?
        `, [req.params.id]);

        if (results.length === 0) {
            return res.status(404).json({ error: 'Respuesta no encontrada' });
        }

        res.json(results[0]);
    } catch (err) {
        console.error('Error al obtener respuesta:', err);
        res.status(500).json({ error: 'Error al obtener respuesta' });
    }
});

app.delete('/admin/eliminar-respuesta/:id', async (req, res) => {
    if (!req.session.user || !req.session.user.es_admin) {
        return res.status(403).json({ error: 'Acceso denegado' });
    }

    try {
        await pool.query('DELETE FROM user_answers WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Respuesta eliminada correctamente' });
    } catch (err) {
        console.error('Error al eliminar respuesta:', err);
        res.status(500).json({ error: 'Error al eliminar respuesta' });
    }
});

// 🔹 Obtener resultados de los tests para el Admin Panel
app.get('/admin/resultados-tests-data', (req, res) => {
    if (!req.session.user || !req.session.user.es_admin) {
        return res.status(403).json({ error: "Acceso denegado" });
    }
    const query = `
        SELECT rt.*, u.nombre, u.correo, u.edad 
        FROM resultados_test rt
        JOIN usuarios u ON rt.usuario_id = u.id
        ORDER BY rt.fecha DESC`;
    pool.query(query, (err, results) => {
        if (err) {
            console.error("❌ Error al obtener resultados de tests:", err);
            return res.status(500).json({ error: "Error al obtener resultados de tests" });
        }
        res.json(results);
    });
});

// 🔹 Obtener respuestas de los usuarios con detalles (nueva ruta)
app.get('/admin/respuestas-usuarios-detalle', (req, res) => {
    if (!req.session.user || !req.session.user.es_admin) {
        return res.status(403).json({ error: "Acceso denegado" });
    }
    const query = `
        SELECT 
            u.nombre AS usuario_nombre,
            u.correo AS usuario_correo,
            p.pregunta,
            r.respuesta,
            r.puntaje
        FROM 
            respuestas r
        JOIN 
            usuarios u ON r.usuario_id = u.id
        JOIN 
            preguntas p ON r.pregunta_id = p.id
        ORDER BY 
            u.nombre;
    `;
    pool.query(query, (err, results) => {
        if (err) {
            console.error("❌ Error al obtener respuestas de usuarios:", err);
            return res.status(500).json({ error: "Error al obtener respuestas de usuarios" });
        }

        // Agrupar respuestas por usuario
        const respuestasAgrupadas = results.reduce((acc, row) => {
            if (!acc[row.usuario_correo]) {
                acc[row.usuario_correo] = {
                    usuario_nombre: row.usuario_nombre,
                    usuario_correo: row.usuario_correo,
                    respuestas: []
                };
            }
            acc[row.usuario_correo].respuestas.push({
                pregunta: row.pregunta,
                respuesta: row.respuesta,
                puntaje: row.puntaje
            });
            return acc;
        }, {});

        res.json(Object.values(respuestasAgrupadas));
    });
});

// 🔹 Editar un usuario (admin)
app.put('/admin/editar-usuario/:id', (req, res) => {
    if (!req.session.user || !req.session.user.es_admin) {
        return res.status(403).json({ error: "Acceso denegado" });
    }
    const { nombre, correo, contraseña, es_admin, edad } = req.body;
    const id = req.params.id;
    if (!nombre || !correo || !contraseña || typeof es_admin === 'undefined') {
         return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }
    const query = "UPDATE usuarios SET nombre = ?, correo = ?, contraseña = ?, es_admin = ?, edad = ? WHERE id = ?";
    pool.query(query, [nombre, correo, contraseña, es_admin, edad, id], (err, result) => {
         if (err) {
              console.error("❌ Error al editar usuario:", err);
              return res.status(500).json({ error: "Error al editar usuario" });
         }
         res.json({ mensaje: "Usuario editado correctamente" });
    });
});

// 🔹 Eliminar un usuario (admin)
app.delete('/admin/eliminar-usuario/:id', (req, res) => {
    if (!req.session.user || !req.session.user.es_admin) {
        return res.status(403).json({ error: "Acceso denegado" });
    }
    const id = req.params.id;
    const query = "DELETE FROM usuarios WHERE id = ?";
    pool.query(query, [id], (err, result) => {
         if (err) {
              console.error("❌ Error al eliminar usuario:", err);
              return res.status(500).json({ error: "Error al eliminar usuario" });
         }
         res.json({ mensaje: "Usuario eliminado correctamente" });
    });
});

// 🔹 Editar una pregunta (admin)
app.put('/admin/preguntas/:id', (req, res) => {
    if (!req.session.user || !req.session.user.es_admin) {
         return res.status(403).json({ error: "Acceso denegado" });
    }
    const { pregunta } = req.body;
    const id = req.params.id;
    if (!pregunta) {
         return res.status(400).json({ error: "El campo pregunta es obligatorio" });
    }
    const query = "UPDATE preguntas SET pregunta = ? WHERE id = ?";
    pool.query(query, [pregunta, id], (err, result) => {
         if (err) {
              console.error("❌ Error al editar pregunta:", err);
              return res.status(500).json({ error: "Error al editar pregunta" });
         }
         res.json({ mensaje: "Pregunta editada correctamente" });
    });
});

// 🔹 Eliminar una pregunta (admin)
app.delete('/admin/preguntas/:id', (req, res) => {
    if (!req.session.user || !req.session.user.es_admin) {
         return res.status(403).json({ error: "Acceso denegado" });
    }
    const id = req.params.id;
    const query = "DELETE FROM preguntas WHERE id = ?";
    pool.query(query, [id], (err, result) => {
         if (err) {
              console.error("❌ Error al eliminar pregunta:", err);
              return res.status(500).json({ error: "Error al eliminar pregunta" });
         }
         res.json({ mensaje: "Pregunta eliminada correctamente" });
    });
});

// 🔹 Autenticación (Login)
app.post('/login', async (req, res) => {
    const { correo, contraseña } = req.body;
    if (!correo || !contraseña) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    try {
        const query = "SELECT id, contraseña, es_admin FROM usuarios WHERE correo = ?";
        const [results] = await pool.query(query, [correo]);

        if (results.length === 0) {
            return res.status(400).json({ error: "Usuario no encontrado" });
        }

        const usuario = results[0];
        const passwordCorrecta = await verifyPassword(contraseña, usuario.contraseña);

        if (!passwordCorrecta) {
            return res.status(401).json({ error: "Contraseña incorrecta" });
        }

        req.session.regenerate((err) => {
            if (err) return res.status(500).json({ error: "Error al crear sesión" });
            req.session.user = { id: usuario.id, es_admin: usuario.es_admin };
            res.json({ redirect: usuario.es_admin ? "/admin" : "/lugares" });
        });
    } catch (error) {
        console.error('Error en login alternativo:', error);
        return res.status(500).json({ error: "Error en el servidor" });
    }
});

// 🔹 Ruta para obtener el usuario autenticado
app.get('/obtener-usuario', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "No has iniciado sesión" });
    }
    res.json({ usuario_id: req.session.user.id });
});

// 🔹 Verificar si el usuario puede realizar el test (control de edad)
app.get('/verificar-test', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "No has iniciado sesión" });
    }
    
    try {
        // Verificar si ya completó el test
        const [results] = await pool.query("SELECT COUNT(*) as completado FROM resultados_test WHERE usuario_id = ?", [req.session.user.id]);
        const yaCompleto = results[0].completado > 0;
        
        // Obtener configuración de edad
        const [configResults] = await pool.query("SELECT valor FROM configuracion_sistema WHERE clave IN ('edad_minima_test', 'edad_maxima_test')");
        
        const edadMinima = parseInt(configResults.find(r => r.clave === 'edad_minima_test')?.valor || 13);
        const edadMaxima = parseInt(configResults.find(r => r.clave === 'edad_maxima_test')?.valor || 15);
        
        // Since edad is not available, we'll allow the test for now
        const edadValida = true; // Skip age validation for now
        const edadUsuario = null;
        
        res.json({
            puedeRealizar: edadValida && !yaCompleto,
            edadValida,
            yaCompleto,
            edadUsuario,
            edadMinima,
            edadMaxima
        });
    } catch (error) {
        console.error('Error en /verificar-test:', error);
        res.status(500).json({ error: "Error al verificar test" });
    }
});

// 🔹 Enviar respuestas del test (nueva ruta para el frontend)
app.post('/submit-test', validateTestSubmission, validationErrorHandler, async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "No has iniciado sesión" });
    }
    
    const { respuestas } = req.body;
    if (!respuestas || respuestas.length === 0) {
        return res.status(400).json({ error: "Faltan respuestas en la solicitud." });
    }
    
    try {
        // Calcular el puntaje total (sistema de 0-4 puntos por respuesta, máximo 70 puntos)
        const puntajeTotal = respuestas.reduce((total, r) => total + parseInt(r.puntaje), 0);

        // Determinar el resultado basado en el puntaje total (máximo 70 puntos)
        let resultado;
        let redireccion;
        
        if (puntajeTotal >= 56) {
            resultado = "Muy alto bienestar";
            redireccion = "/resultados/muy-alto";
        } else if (puntajeTotal >= 42) {
            resultado = "Alto bienestar";
            redireccion = "/resultados/alto";
        } else if (puntajeTotal >= 28) {
            resultado = "Bienestar moderado";
            redireccion = "/resultados/medio";
        } else if (puntajeTotal >= 14) {
            resultado = "Bienestar bajo";
            redireccion = "/resultados/bajo";
        } else {
            resultado = "Bienestar muy bajo";
            redireccion = "/resultados/muy-bajo";
        }

        // Guardar las respuestas individuales
        const usuario_id = req.session.user.id;
        const [[{ max_intento }]] = await pool.query(
            'SELECT MAX(intento) AS max_intento FROM respuestas WHERE usuario_id = ?',
            [usuario_id]
        );
        const nuevoIntento = max_intento ? max_intento + 1 : 1;

        // Guardar las respuestas
        const queryRespuestas = 'INSERT INTO respuestas (usuario_id, pregunta_id, respuesta, puntaje, intento) VALUES ?';
        const valuesRespuestas = respuestas.map(r => [usuario_id, r.pregunta_id, r.respuesta, r.puntaje, nuevoIntento]);
        await pool.query(queryRespuestas, [valuesRespuestas]);

        // Guardar el resultado del test
        const queryResultado = 'INSERT INTO resultados_test (usuario_id, intento, puntaje_total, resultado) VALUES (?, ?, ?, ?)';
        await pool.query(queryResultado, [usuario_id, nuevoIntento, puntajeTotal, resultado]);

        // Guardar resultado en la tabla de compatibilidad
        const queryCompatibilidad = 'INSERT INTO resultados_test (puntaje_total, resultado, fecha, usuario_id) VALUES (?, ?, NOW(), ?)';
        pool.query(queryCompatibilidad, [puntajeTotal, resultado, usuario_id], (err, result) => {
            if (err) {
                console.error('Error al guardar resultado de compatibilidad:', err);
            }
        });

        // Enviar respuesta con éxito
        res.json({
            success: true,
            puntajeTotal: puntajeTotal,
            resultado: resultado,
            redireccion: redireccion
        });
    } catch (error) {
        console.error('❌ Error al procesar test:', error);
        res.status(500).json({ error: "Error interno al procesar el test" });
    }
});

// 🔹 Guardar respuestas del test y calcular el resultado
app.post('/guardar-respuestas', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "No has iniciado sesión" });
    }
    const usuario_id = req.session.user.id;
    const { respuestas } = req.body;
    if (!respuestas || respuestas.length === 0) {
        return res.status(400).json({ error: "Faltan respuestas en la solicitud." });
    }
    try {
        const [[{ max_intento }]] = await pool.query(
            'SELECT MAX(intento) AS max_intento FROM respuestas WHERE usuario_id = ?',
            [usuario_id]
        );
        const nuevoIntento = max_intento ? max_intento + 1 : 1;

        // Calcular el puntaje total
        const puntajeTotal = respuestas.reduce((total, r) => total + r.puntaje, 0);

        // Determinar el resultado basado en el puntaje total (máximo 14 puntos)
        let resultado;
        let redireccion;
        
        if (puntajeTotal >= 12) {
            resultado = "Muy alto bienestar";
            redireccion = "/resultados/muy-alto";
        } else if (puntajeTotal >= 9) {
            resultado = "Alto bienestar";
            redireccion = "/resultados/alto";
        } else if (puntajeTotal >= 6) {
            resultado = "Bienestar moderado";
            redireccion = "/resultados/medio";
        } else if (puntajeTotal >= 3) {
            resultado = "Bienestar bajo";
            redireccion = "/resultados/bajo";
        } else {
            resultado = "Bienestar muy bajo";
            redireccion = "/resultados/muy-bajo";
        }

        // Guardar las respuestas
        const queryRespuestas = 'INSERT INTO respuestas (usuario_id, pregunta_id, respuesta, puntaje, intento) VALUES ?';
        const valuesRespuestas = respuestas.map(r => [usuario_id, r.pregunta_id, r.respuesta, r.puntaje, nuevoIntento]);
        await pool.query(queryRespuestas, [valuesRespuestas]);

        // Guardar el resultado del test
        const queryResultado = 'INSERT INTO resultados_test (usuario_id, intento, puntaje_total, resultado) VALUES (?, ?, ?, ?)';
        await pool.query(queryResultado, [usuario_id, nuevoIntento, puntajeTotal, resultado]);

        // Guardar resultado en la base de datos (opcional)
        try {
            const query = 'INSERT INTO resultados_test (puntaje_total, resultado, fecha) VALUES (?, ?, NOW())';
            pool.query(query, [puntajeTotal, resultado], (err, result) => {
                if (err) {
                    console.error('Error al guardar resultado:', err);
                }
            });
        } catch (error) {
            console.error('Error al guardar en BD:', error);
        }

        // Enviar respuesta con éxito
        res.json({
            success: true,
            puntajeTotal: puntajeTotal,
            resultado: resultado,
            redireccion: redireccion
        });
    } catch (error) {
        console.error('❌ Error al guardar respuestas:', error);
        res.status(500).json({ error: "Error interno al guardar respuestas" });
    }
});

// 🔹 Cerrar sesión
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "Error al cerrar sesión" });
        }
        res.json({ mensaje: "Sesión cerrada exitosamente" });
    });
});

// 🔹 Obtener configuración del sistema
app.get('/configuracion', (req, res) => {
    const query = "SELECT clave, valor FROM configuracion_sistema";
    pool.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Error al obtener configuración" });
        }
        const config = {};
        results.forEach(row => {
            config[row.clave] = row.valor;
        });
        res.json(config);
    });
});

// 🔹 Actualizar configuración del sistema (admin)
app.put('/admin/configuracion', (req, res) => {
    if (!req.session.user || !req.session.user.es_admin) {
        return res.status(403).json({ error: "Acceso denegado" });
    }
    const { clave, valor } = req.body;
    const query = "UPDATE configuracion_sistema SET valor = ? WHERE clave = ?";
    pool.query(query, [valor, clave], (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Error al actualizar configuración" });
        }
        res.json({ mensaje: "Configuración actualizada correctamente" });
    });
});

// 🔹 Obtener audiolibros
app.get('/audiolibros', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'audiolibros.html'));
});

// 🔹 Generar audiolibro
app.post('/admin/generar-audiolibro/:id', async (req, res) => {
    if (!req.session.user || !req.session.user.es_admin) {
        return res.status(403).json({ error: "Acceso denegado" });
    }
    const id = req.params.id;
    try {
        const results = await executeQuery("SELECT titulo, contenido FROM audiolibros WHERE id = ?", [id]);
        if (results.length === 0) {
            return res.status(500).json({ error: "Error al obtener audiolibro" });
        }
        const audiolibro = results[0];
        const nombreArchivo = `audiolibro_${id}_${Date.now()}.mp3`;
        const rutaArchivo = path.join(__dirname, 'public', 'audio', nombreArchivo);
        // Crear directorio si no existe
        const audioDir = path.join(__dirname, 'public', 'audio');
        if (!fs.existsSync(audioDir)) {
            fs.mkdirSync(audioDir, { recursive: true });
        }
        // Validar texto
        const texto = (audiolibro.contenido || '').trim();
        console.log('[AUDIOLIBRO] Texto a convertir:', texto.slice(0, 200), '...');
        if (!texto) {
            return res.status(400).json({ error: "El contenido del audiolibro está vacío." });
        }
        // Google TTS suele aceptar hasta 200-250 caracteres por petición
        const maxLen = 200;
        let partes = [];
        for (let i = 0; i < texto.length; i += maxLen) {
            partes.push(texto.slice(i, i + maxLen));
        }
        console.log(`[AUDIOLIBRO] Partes a sintetizar: ${partes.length}`);
        // Generar audios parciales
        const archivosParciales = [];
        for (let idx = 0; idx < partes.length; idx++) {
            const parte = partes[idx];
            const nombreParcial = path.join(audioDir, `tmp_${id}_${Date.now()}_${idx}.mp3`);
            try {
                await new Promise((resolve, reject) => {
                    gTTS.save(nombreParcial, parte, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                archivosParciales.push(nombreParcial);
            } catch (err) {
                console.error('[AUDIOLIBRO] Error en parte', idx, err);
                return res.status(500).json({ error: "Error al generar el audio: " + err.message });
            }
        }
        // Unir los audios parciales si hay más de uno
        if (archivosParciales.length === 1) {
            fs.renameSync(archivosParciales[0], rutaArchivo);
        } else {
            await new Promise((resolve, reject) => {
                ffmpeg()
                    .input(`concat:${archivosParciales.join('|')}`)
                    .output(rutaArchivo)
                    .on('end', resolve)
                    .on('error', reject)
                    .run();
            });
            // Borrar archivos parciales
            archivosParciales.forEach(f => fs.unlinkSync(f));
        }
        // Actualizar la base de datos con el archivo generado
        await pool.query("UPDATE audiolibros SET archivo_audio = ? WHERE id = ?", [nombreArchivo, id]);
        res.json({ mensaje: "Audiolibro generado correctamente", archivo: nombreArchivo });
    } catch (err) {
        res.status(500).json({ error: "Error al generar audiolibro" });
    }
});

// 🔹 Obtener actividades
app.get('/actividades', async (req, res) => {
    try {
        const results = await executeQuery("SELECT * FROM actividades WHERE activa = true ORDER BY fecha_creacion DESC");
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener actividades" });
    }
});

// 🔹 Activar/desactivar actividad (admin)
app.put('/admin/actividades/:id', async (req, res) => {
    if (!req.session.user || !req.session.user.es_admin) {
        return res.status(403).json({ error: "Acceso denegado" });
    }
    const { activa } = req.body;
    const id = req.params.id;
    try {
        await pool.query("UPDATE actividades SET activa = ? WHERE id = ?", [activa, id]);
        res.json({ mensaje: "Actividad actualizada correctamente" });
    } catch (err) {
        res.status(500).json({ error: "Error al actualizar actividad" });
    }
});

// 🔹 Obtener estadísticas (admin)
app.get('/admin/estadisticas', async (req, res) => {
    if (!req.session.user || !req.session.user.es_admin) {
        return res.status(403).json({ error: "Acceso denegado" });
    }
    try {
        const totalUsuarios = await executeQuery("SELECT COUNT(*) as total FROM usuarios");
        const usuariosConTest = await executeQuery("SELECT COUNT(DISTINCT usuario_id) as total FROM resultados_test");
        const actividadMasPopular = await executeQuery("SELECT seccion, COUNT(*) as total FROM estadisticas_uso GROUP BY seccion ORDER BY total DESC LIMIT 1");
        res.json({ 
            totalUsuarios: totalUsuarios[0], 
            usuariosConTest: usuariosConTest[0], 
            actividadMasPopular: actividadMasPopular[0] 
        });
    } catch (err) {
        res.status(500).json({ error: "Error al obtener estadísticas" });
    }
});

// 🔹 Registrar acceso a sección
app.post('/registrar-acceso', async (req, res) => {
    const { seccion } = req.body;
    const usuario_id = req.session.user ? req.session.user.id : null;
    try {
        await pool.query("INSERT INTO estadisticas_uso (seccion, usuario_id) VALUES (?, ?)", [seccion, usuario_id]);
        res.json({ mensaje: "Acceso registrado" });
    } catch (err) {
        console.error("Error al registrar acceso:", err);
        res.json({ mensaje: "Acceso registrado" });
    }
});

// --- QR con token temporal ---
const qrTokens = {};
const QR_TOKEN_EXPIRATION = 60 * 1000; // 1 minuto

app.get('/api/genera-token-qr', (req, res) => {
    const token = crypto.randomBytes(16).toString('hex');
    qrTokens[token] = Date.now() + QR_TOKEN_EXPIRATION;
    res.json({ token });
});

app.get('/registro-qr', (req, res) => {
    const { token } = req.query;
    if (!token || !qrTokens[token]) {
        return res.status(400).send('<h2>Token inválido</h2>');
    }
    if (Date.now() > qrTokens[token]) {
        delete qrTokens[token];
        return res.status(400).send('<h2>El QR ha expirado. Por favor, vuelve a escanear uno nuevo.</h2>');
    }
    // Token válido, lo eliminamos para un solo uso
    delete qrTokens[token];
    // Redirige al Google Forms real
    res.redirect('https://forms.gle/d1ntycyrprtSnkzR6');
});
// --- Fin QR con token temporal ---

// --- Endpoint para libros físicos ---
app.get('/api/libros', async (req, res) => {
    try {
        const results = await executeQuery("SELECT * FROM libros ORDER BY id DESC");
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener libros" });
    }
});

// Endpoint para obtener la lista de libros PDF con metadatos
app.get('/api/libros-pdf', (req, res) => {
  fs.readdir(pathLibros, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'No se pudo leer la carpeta de libros' });
    }
    // Solo archivos PDF
    const libros = files.filter(f => f.toLowerCase().endsWith('.pdf')).map(f => {
      const filePath = path.join(pathLibros, f);
      let stats = {};
      try {
        stats = fs.statSync(filePath);
      } catch (e) {}
      return {
        nombre: f,
        url: `/libros/${f}`,
        tamano: stats.size || 0,
        modificado: stats.mtime || null
      };
    });
    res.json(libros);
  });
});

// Endpoint para obtener la lista de portadas disponibles
app.get('/api/portadas', (req, res) => {
  fs.readdir(pathImg, (err, files) => {
    if (err) return res.json([]);
    // Solo imágenes
    const imagenes = files.filter(f => /\.(jpg|jpeg|png|jfif|webp)$/i.test(f)).map(f => `/img/${f}`);
    res.json(imagenes);
  });
});

// 🔹 Iniciar servidor
const DEFAULT_PORT = process.env.PORT || 3001;
const startServer = (port) => {
    const server = app.listen(port, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
    });

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.warn(`⚠️ Puerto ${port} ocupado. Intentando con el puerto ${port + 1}...`);
            startServer(port + 1);
            return;
        }

        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    });

    return server;
};

app.get('/principal', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'principal.html'));
});

app.get('/api/audiolibros', async (req, res) => {
    try {
        console.log('🔍 Obteniendo audiolibros...');
        // Mostrar TODOS los libros, no solo los activos ni los que tienen audio
        const results = await executeQuery("SELECT * FROM audiolibros ORDER BY id DESC");
        console.log('RESULTADOS:', results.length, 'libros');
        res.json(results);
    } catch (err) {
        console.error('Error en /api/audiolibros:', err);
        res.status(500).json({ error: "Error al obtener audiolibros" });
    }
});

// Nueva ruta para mostrar el mensaje de test ya realizado
app.get('/test-already-done', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'test-already-done.html'));
});

// Ruta de prueba para Sentry
app.get('/debug-sentry', function mainHandler(req, res) {
  throw new Error('¡Error de prueba para Sentry!');
});

// Inicializar Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV || 'development',
});

// Sentry middlewares protegidos
if (Sentry.Handlers && Sentry.Handlers.requestHandler) {
  app.use(Sentry.Handlers.requestHandler());
}
if (Sentry.Handlers && Sentry.Handlers.tracingHandler) {
  app.use(Sentry.Handlers.tracingHandler());
}

// Middlewares de manejo de errores (en orden de ejecución)
app.use(notFound);
app.use(handleValidationErrors);
app.use(handleDatabaseErrors);
app.use(handleAuthErrors);
app.use(errorHandler);

// Sentry error handler (debe ir al final)
if (Sentry.Handlers && Sentry.Handlers.errorHandler) {
  app.use(Sentry.Handlers.errorHandler());
}

// Exportar la app para testing
module.exports = app;

// Iniciar servidor solo cuando se ejecuta directamente (no en tests)
if (require.main === module) {
    startServer(DEFAULT_PORT);
}
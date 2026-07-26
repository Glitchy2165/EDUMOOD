-- =====================================================
-- BASE DE DATOS AVANZADA EDUMOD-NEW v3.0
-- =====================================================
-- Este archivo incluye todas las mejoras avanzadas:
-- 1. Sistema de recomendaciones avanzado
-- 2. Sistema de metas y objetivos
-- 3. Sistema de grupos y comunidad
-- 4. Sistema de coaching y mentoría
-- 5. Sistema de analytics avanzado
-- 6. Sistema de contenido personalizado
-- 7. Sistema de gamificación avanzado
-- 8. Sistema de integración con dispositivos
-- 9. Sistema de backup y versionado
-- 10. Sistema de configuración dinámica
-- =====================================================

-- 1. Crear la base de datos avanzada
CREATE DATABASE IF NOT EXISTS edumod_advanced CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE edumod_advanced;

-- =====================================================
-- TABLAS PRINCIPALES DEL SISTEMA (BASE)
-- =====================================================

-- 2. Tabla de usuarios mejorada
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT 0,
    activation_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    profile_picture VARCHAR(255),
    bio TEXT,
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other', 'prefer_not_to_say'),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'es',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_activation_token (activation_token),
    INDEX idx_reset_token (reset_token)
);

-- 3. Tabla de preguntas del test
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    weight DECIMAL(3,2) DEFAULT 1.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Tabla de respuestas de usuario mejorada
CREATE TABLE IF NOT EXISTS user_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    question_id INT NOT NULL,
    answer_text TEXT NOT NULL,
    score INT NOT NULL CHECK (score >= 1 AND score <= 5),
    attempt INT NOT NULL,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_user_attempt (user_id, attempt),
    INDEX idx_answered_at (answered_at)
);

-- 5. Tabla de resultados de tests mejorada
CREATE TABLE IF NOT EXISTS test_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    attempt INT NOT NULL,
    total_score INT NOT NULL,
    result_category VARCHAR(100) NOT NULL,
    risk_level ENUM('bajo', 'moderado', 'alto', 'muy_alto') DEFAULT 'bajo',
    recommendations TEXT,
    taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_results (user_id),
    INDEX idx_category (result_category),
    INDEX idx_taken_at (taken_at)
);

-- 6. Tabla de intereses de usuario mejorada
CREATE TABLE IF NOT EXISTS user_interests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    interest VARCHAR(100) NOT NULL,
    source ENUM('test', 'biblioteca', 'actividad', 'manual') NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 1.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_interest (user_id, interest, source),
    INDEX idx_user_source (user_id, source)
);

-- 7. Tabla de recursos de biblioteca
CREATE TABLE IF NOT EXISTS library_resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(100),
    description TEXT,
    category VARCHAR(50),
    type ENUM('book', 'article', 'video', 'podcast') DEFAULT 'book',
    url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabla de actividades
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    difficulty ENUM('facil', 'moderado', 'dificil') DEFAULT 'moderado',
    duration_minutes INT DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tabla de logs de actividad
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_action (user_id, action),
    INDEX idx_created_at (created_at)
);

-- 10. Tabla de sesiones (para express-mysql-session)
CREATE TABLE IF NOT EXISTS sessions (
    session_id VARCHAR(128) NOT NULL PRIMARY KEY,
    expires INT UNSIGNED NOT NULL,
    data MEDIUMTEXT
);

-- =====================================================
-- SISTEMA DE GAMIFICACIÓN BASE
-- =====================================================

-- 11. Tabla de progreso del usuario
CREATE TABLE IF NOT EXISTS user_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    points INT DEFAULT 0,
    level INT DEFAULT 1,
    streak_days INT DEFAULT 0,
    total_activities INT DEFAULT 0,
    tests_completed INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 12. Tabla de transacciones de puntos
CREATE TABLE IF NOT EXISTS point_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    points INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    activity_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 13. Tabla de logros
CREATE TABLE IF NOT EXISTS achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    points_reward INT DEFAULT 0,
    requirement_type ENUM('points', 'level', 'streak', 'activities', 'tests') NOT NULL,
    requirement_value INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Tabla de logros del usuario
CREATE TABLE IF NOT EXISTS user_achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_achievement (user_id, achievement_id)
);

-- 15. Tabla de actividades del usuario
CREATE TABLE IF NOT EXISTS user_activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    activity_id INT NOT NULL,
    duration_minutes INT NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
);

-- 16. Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('email', 'push', 'in_app') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    status ENUM('pending', 'sent', 'read') DEFAULT 'pending',
    scheduled_for TIMESTAMP NULL,
    sent_at TIMESTAMP NULL,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- SISTEMA DE RECOMENDACIONES AVANZADO
-- =====================================================

-- 17. Tabla de algoritmos de recomendación
CREATE TABLE IF NOT EXISTS recommendation_algorithms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parameters JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18. Tabla de recomendaciones generadas
CREATE TABLE IF NOT EXISTS user_recommendations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    algorithm_id INT NOT NULL,
    item_type ENUM('activity', 'resource', 'achievement', 'content') NOT NULL,
    item_id INT NOT NULL,
    confidence_score DECIMAL(3,2),
    reason TEXT,
    is_viewed BOOLEAN DEFAULT FALSE,
    is_acted_upon BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (algorithm_id) REFERENCES recommendation_algorithms(id) ON DELETE CASCADE,
    INDEX idx_user_recommendations (user_id, item_type, created_at)
);

-- =====================================================
-- SISTEMA DE META Y OBJETIVOS
-- =====================================================

-- 19. Tabla de objetivos del usuario
CREATE TABLE IF NOT EXISTS user_goals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    target_value INT,
    current_value INT DEFAULT 0,
    deadline DATE,
    status ENUM('active', 'completed', 'abandoned') DEFAULT 'active',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_goals (user_id, status, deadline)
);

-- 20. Tabla de progreso de objetivos
CREATE TABLE IF NOT EXISTS goal_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    goal_id INT NOT NULL,
    value INT NOT NULL,
    notes TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES user_goals(id) ON DELETE CASCADE,
    INDEX idx_goal_progress (goal_id, recorded_at)
);

-- =====================================================
-- SISTEMA DE GRUPOS Y COMUNIDAD
-- =====================================================

-- 21. Tabla de grupos
CREATE TABLE IF NOT EXISTS groups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    max_members INT DEFAULT 50,
    is_private BOOLEAN DEFAULT FALSE,
    cover_image VARCHAR(255),
    rules TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_group_category (category, is_private)
);

-- 22. Tabla de miembros del grupo
CREATE TABLE IF NOT EXISTS group_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('member', 'moderator', 'admin') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_group_user (group_id, user_id),
    INDEX idx_group_members (group_id, role)
);

-- 23. Tabla de actividades grupales
CREATE TABLE IF NOT EXISTS group_activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    group_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    scheduled_for TIMESTAMP,
    duration_minutes INT,
    max_participants INT,
    location VARCHAR(255),
    is_virtual BOOLEAN DEFAULT FALSE,
    meeting_link VARCHAR(500),
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_group_activities (group_id, scheduled_for)
);

-- 24. Tabla de participantes en actividades grupales
CREATE TABLE IF NOT EXISTS group_activity_participants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    activity_id INT NOT NULL,
    user_id INT NOT NULL,
    status ENUM('registered', 'attended', 'cancelled') DEFAULT 'registered',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (activity_id) REFERENCES group_activities(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_activity_user (activity_id, user_id)
);

-- =====================================================
-- SISTEMA DE COACHING Y MENTORÍA
-- =====================================================

-- 25. Tabla de coaches/mentores
CREATE TABLE IF NOT EXISTS coaches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    specialization VARCHAR(100),
    experience_years INT,
    bio TEXT,
    hourly_rate DECIMAL(10,2),
    is_available BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_sessions INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_coach_specialization (specialization, is_available)
);

-- 26. Tabla de sesiones de coaching
CREATE TABLE IF NOT EXISTS coaching_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    coach_id INT NOT NULL,
    user_id INT NOT NULL,
    scheduled_for TIMESTAMP NOT NULL,
    duration_minutes INT DEFAULT 60,
    status ENUM('scheduled', 'completed', 'cancelled', 'rescheduled') DEFAULT 'scheduled',
    session_type ENUM('initial', 'follow_up', 'emergency') DEFAULT 'follow_up',
    notes TEXT,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_coaching_sessions (coach_id, user_id, scheduled_for)
);

-- =====================================================
-- SISTEMA DE ANALYTICS AVANZADO
-- =====================================================

-- 27. Tabla de métricas de usuario
CREATE TABLE IF NOT EXISTS user_metrics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,4),
    metric_unit VARCHAR(20),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_metric (user_id, metric_name, recorded_at)
);

-- 28. Tabla de eventos de usuario
CREATE TABLE IF NOT EXISTS user_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSON,
    session_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    page_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_event (user_id, event_type, created_at)
);

-- 29. Tabla de análisis de comportamiento
CREATE TABLE IF NOT EXISTS behavior_analytics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    behavior_type VARCHAR(100) NOT NULL,
    behavior_data JSON,
    context TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_behavior_analytics (user_id, behavior_type, created_at)
);

-- =====================================================
-- SISTEMA DE CONTENIDO PERSONALIZADO
-- =====================================================

-- 30. Tabla de contenido dinámico
CREATE TABLE IF NOT EXISTS dynamic_content (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    content_type ENUM('article', 'video', 'audio', 'exercise', 'meditation', 'workshop') NOT NULL,
    category VARCHAR(50),
    difficulty_level ENUM('beginner', 'intermediate', 'advanced'),
    tags JSON,
    duration_minutes INT,
    is_premium BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_content_type (content_type, category, is_active)
);

-- 31. Tabla de contenido recomendado por IA
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    content_id INT NOT NULL,
    recommendation_reason TEXT,
    confidence_score DECIMAL(3,2),
    is_viewed BOOLEAN DEFAULT FALSE,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES dynamic_content(id) ON DELETE CASCADE,
    INDEX idx_ai_recommendations (user_id, is_viewed, created_at)
);

-- 32. Tabla de progreso de contenido
CREATE TABLE IF NOT EXISTS content_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    content_id INT NOT NULL,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    time_spent_seconds INT DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES dynamic_content(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_content (user_id, content_id)
);

-- =====================================================
-- SISTEMA DE GAMIFICACIÓN AVANZADO
-- =====================================================

-- 33. Tabla de temporadas/eventos
CREATE TABLE IF NOT EXISTS seasons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    theme VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_seasons_active (is_active, start_date, end_date)
);

-- 34. Tabla de desafíos temporales
CREATE TABLE IF NOT EXISTS challenges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    season_id INT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    challenge_type ENUM('daily', 'weekly', 'monthly', 'special') NOT NULL,
    points_reward INT DEFAULT 0,
    requirements JSON,
    start_date DATE,
    end_date DATE,
    max_participants INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE SET NULL,
    INDEX idx_challenges_active (is_active, challenge_type, start_date, end_date)
);

-- 35. Tabla de participación en desafíos
CREATE TABLE IF NOT EXISTS challenge_participation (
    id INT PRIMARY KEY AUTO_INCREMENT,
    challenge_id INT NOT NULL,
    user_id INT NOT NULL,
    progress INT DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    points_earned INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_challenge_user (challenge_id, user_id),
    INDEX idx_challenge_participation (challenge_id, completed)
);

-- 36. Tabla de rankings y leaderboards
CREATE TABLE IF NOT EXISTS leaderboards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    leaderboard_type ENUM('points', 'streak', 'activities', 'challenges') NOT NULL,
    season_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE SET NULL
);

-- 37. Tabla de posiciones en leaderboards
CREATE TABLE IF NOT EXISTS leaderboard_positions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    leaderboard_id INT NOT NULL,
    user_id INT NOT NULL,
    position INT NOT NULL,
    score INT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (leaderboard_id) REFERENCES leaderboards(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_leaderboard_user (leaderboard_id, user_id),
    INDEX idx_leaderboard_positions (leaderboard_id, position)
);

-- =====================================================
-- SISTEMA DE INTEGRACIÓN CON DISPOSITIVOS
-- =====================================================

-- 38. Tabla de dispositivos conectados
CREATE TABLE IF NOT EXISTS connected_devices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    device_type ENUM('smartwatch', 'fitness_tracker', 'mobile', 'web', 'tablet', 'desktop') NOT NULL,
    device_name VARCHAR(100),
    device_id VARCHAR(255) UNIQUE,
    device_model VARCHAR(100),
    os_version VARCHAR(50),
    app_version VARCHAR(20),
    last_sync TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_connected_devices (user_id, device_type, is_active)
);

-- 39. Tabla de datos de dispositivos
CREATE TABLE IF NOT EXISTS device_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    device_id INT NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    data_value JSON,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES connected_devices(id) ON DELETE CASCADE,
    INDEX idx_device_data (device_id, data_type, recorded_at)
);

-- 40. Tabla de sincronización de datos
CREATE TABLE IF NOT EXISTS data_sync_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    device_id INT NOT NULL,
    sync_type VARCHAR(50) NOT NULL,
    records_synced INT DEFAULT 0,
    sync_status ENUM('success', 'partial', 'failed') NOT NULL,
    error_message TEXT,
    sync_duration_ms INT,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES connected_devices(id) ON DELETE CASCADE,
    INDEX idx_data_sync_logs (device_id, sync_status, synced_at)
);

-- =====================================================
-- SISTEMA DE BACKUP Y VERSIONADO
-- =====================================================

-- 41. Tabla de versiones de datos
CREATE TABLE IF NOT EXISTS data_versions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    table_name VARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    old_data JSON,
    new_data JSON,
    changed_by INT,
    change_type ENUM('insert', 'update', 'delete') NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_data_versions (table_name, record_id, changed_at)
);

-- 42. Tabla de backups automáticos
CREATE TABLE IF NOT EXISTS automated_backups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    backup_name VARCHAR(100) NOT NULL,
    backup_type ENUM('full', 'incremental', 'differential') NOT NULL,
    file_path VARCHAR(500),
    file_size_bytes BIGINT,
    backup_status ENUM('in_progress', 'completed', 'failed') NOT NULL,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    retention_days INT DEFAULT 30
);

-- =====================================================
-- SISTEMA DE CONFIGURACIÓN DINÁMICA
-- =====================================================

-- 43. Tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS system_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    config_type ENUM('string', 'number', 'boolean', 'json', 'array') DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    is_editable BOOLEAN DEFAULT TRUE,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 44. Tabla de configuración por usuario
CREATE TABLE IF NOT EXISTS user_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT,
    config_type ENUM('string', 'number', 'boolean', 'json', 'array') DEFAULT 'string',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_config (user_id, config_key)
);

-- =====================================================
-- INSERTAR DATOS INICIALES
-- =====================================================

-- Usuario administrador
INSERT INTO users (name, email, password, is_admin, is_active) VALUES 
('Administrador', 'admin@edumod.com', '$2b$10$OsOF2ZQYiCntyiDBLwvTyuFHIZHlZPPgggrpl/pyEXK93eq2Z/QI.', 1, 1)
ON DUPLICATE KEY UPDATE name=name;

-- Usuario de prueba (contraseña: Test123!)
INSERT INTO users (name, email, password, is_admin, is_active) VALUES 
('Usuario Prueba', 'test@edumod.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 0, 1)
ON DUPLICATE KEY UPDATE name=name;

-- Preguntas del test
INSERT INTO questions (question, category, weight) VALUES
('¿Siento que tengo el control de mi vida?', 'autonomia', 1.0),
('¿Tengo la energía suficiente para enfrentar mis responsabilidades?', 'energia', 1.0),
('¿Me siento emocionalmente estable y en paz?', 'estabilidad', 1.2),
('¿Te sientes conectado con otras personas o con relaciones satisfactorias?', 'relaciones', 1.1),
('¿Disfruto de actividades diarias o pasatiempos?', 'actividades', 1.0),
('¿Me siento satisfecho con la calidad de mi sueño?', 'sueno', 1.1),
('¿Siento que tengo algún propósito o dirección en la vida?', 'proposito', 1.2),
('¿Cómo manejo el estrés en mi vida diaria?', 'estres', 1.1),
('¿Me siento optimista sobre el futuro?', 'optimismo', 1.0),
('¿Me siento emocionalmente estable y en paz?', 'estabilidad', 1.0)
ON DUPLICATE KEY UPDATE question=question;

-- Recursos de biblioteca
INSERT INTO library_resources (title, author, description, category, type) VALUES
('El Alquimista', 'Paulo Coelho', 'Una novela sobre seguir tus sueños y escuchar tu corazón', 'motivacion', 'book'),
('La Magia del Orden', 'Marie Kondo', 'Guía para organizar tu espacio y tu mente', 'organizacion', 'book'),
('Los Cuatro Acuerdos', 'Miguel Ruiz', 'Sabiduría tolteca para la libertad personal', 'crecimiento_personal', 'book'),
('El Poder del Ahora', 'Eckhart Tolle', 'Guía para la iluminación espiritual', 'mindfulness', 'book'),
('Fluir', 'Mihaly Csikszentmihalyi', 'La psicología de la experiencia óptima', 'psicologia', 'book'),
('El Arte de la Guerra', 'Sun Tzu', 'Estrategias para el éxito personal y profesional', 'estrategia', 'book'),
('Los 7 Hábitos de la Gente Altamente Efectiva', 'Stephen Covey', 'Principios para el desarrollo personal', 'desarrollo_personal', 'book'),
('Mindfulness en la Vida Cotidiana', 'Jon Kabat-Zinn', 'Cómo encontrar la paz en un mundo frenético', 'mindfulness', 'book'),
('El Arte de la Felicidad', 'Dalai Lama', 'Enseñanzas sobre la felicidad y el bienestar', 'bienestar', 'book'),
('Meditación para Principiantes', 'Jack Kornfield', 'Guía práctica para comenzar a meditar', 'meditacion', 'book')
ON DUPLICATE KEY UPDATE title=title;

-- Actividades
INSERT INTO activities (name, description, category, difficulty, duration_minutes) VALUES
('Meditación Guiada', 'Sesión de meditación de 10 minutos para principiantes', 'mindfulness', 'facil', 10),
('Ejercicio de Respiración', 'Técnica de respiración profunda para reducir el estrés', 'relajacion', 'facil', 5),
('Diario de Gratitud', 'Escribir 3 cosas por las que estás agradecido hoy', 'reflexion', 'facil', 15),
('Caminata Consciente', 'Caminar prestando atención a los sentidos', 'actividad_fisica', 'moderado', 30),
('Arte Terapia', 'Expresar emociones a través del dibujo o pintura', 'creatividad', 'moderado', 45),
('Yoga Básico', 'Secuencia de yoga para principiantes', 'actividad_fisica', 'facil', 20),
('Lectura Consciente', 'Leer un libro prestando atención plena', 'lectura', 'facil', 30),
('Jardinería Terapéutica', 'Cuidar plantas como forma de terapia', 'naturaleza', 'moderado', 60),
('Música Relajante', 'Escuchar música relajante por 15 minutos', 'relajacion', 'facil', 15),
('Dibujo Libre', 'Dibujar lo que te inspire por 20 minutos', 'creatividad', 'facil', 20),
('Conversación Social', 'Llamar a un amigo o familiar', 'social', 'facil', 15),
('Ejercicio de Estiramiento', 'Rutina de estiramientos de 15 minutos', 'actividad_fisica', 'facil', 15)
ON DUPLICATE KEY UPDATE name=name;

-- Logros predefinidos
INSERT INTO achievements (name, description, icon, points_reward, requirement_type, requirement_value) VALUES
('Primer Paso', 'Completa tu primer test de bienestar', '🎯', 50, 'tests', 1),
('Consistente', 'Completa 5 tests de bienestar', '📊', 100, 'tests', 5),
('Experto', 'Completa 10 tests de bienestar', '🏆', 200, 'tests', 10),
('Activo', 'Completa tu primera actividad', '🏃', 25, 'activities', 1),
('Dedicado', 'Completa 10 actividades', '💪', 150, 'activities', 10),
('Maestro', 'Completa 25 actividades', '👑', 300, 'activities', 25),
('Racha de 3 días', 'Mantén una racha de 3 días', '🔥', 75, 'streak', 3),
('Racha de 7 días', 'Mantén una racha de 7 días', '🔥🔥', 200, 'streak', 7),
('Racha de 30 días', 'Mantén una racha de 30 días', '🔥🔥🔥', 500, 'streak', 30),
('Nivel 2', 'Alcanza el nivel 2', '⭐', 100, 'level', 2),
('Nivel 5', 'Alcanza el nivel 5', '⭐⭐⭐', 300, 'level', 5),
('Nivel 10', 'Alcanza el nivel 10', '⭐⭐⭐⭐⭐', 1000, 'level', 10),
('100 Puntos', 'Acumula 100 puntos', '💰', 50, 'points', 100),
('500 Puntos', 'Acumula 500 puntos', '💰💰', 150, 'points', 500),
('1000 Puntos', 'Acumula 1000 puntos', '💰💰💰', 300, 'points', 1000)
ON DUPLICATE KEY UPDATE name=name;

-- Algoritmos de recomendación
INSERT INTO recommendation_algorithms (name, description, parameters) VALUES
('Collaborative Filtering', 'Recomendaciones basadas en usuarios similares', '{"min_similarity": 0.3, "max_recommendations": 10}'),
('Content-Based Filtering', 'Recomendaciones basadas en contenido similar', '{"similarity_threshold": 0.5, "max_recommendations": 10}'),
('Hybrid Approach', 'Combinación de filtrado colaborativo y basado en contenido', '{"collaborative_weight": 0.6, "content_weight": 0.4}'),
('Popularity-Based', 'Recomendaciones basadas en popularidad', '{"time_window_days": 30, "min_popularity": 10}')
ON DUPLICATE KEY UPDATE name=name;

-- Temporadas
INSERT INTO seasons (name, description, start_date, end_date, theme) VALUES
('Bienestar 2024', 'Temporada de bienestar y crecimiento personal', '2024-01-01', '2024-12-31', 'Crecimiento Personal'),
('Mindfulness Spring', 'Enfoque en mindfulness y meditación', '2024-03-01', '2024-05-31', 'Mindfulness'),
('Summer Wellness', 'Bienestar durante el verano', '2024-06-01', '2024-08-31', 'Bienestar Veraniego')
ON DUPLICATE KEY UPDATE name=name;

-- Desafíos
INSERT INTO challenges (season_id, title, description, challenge_type, points_reward, requirements) VALUES
(1, '30 Días de Gratitud', 'Escribe 3 cosas por las que estés agradecido cada día', 'daily', 300, '{"days_required": 30, "activity_type": "gratitude"}'),
(1, 'Meditación Semanal', 'Medita al menos 3 veces por semana', 'weekly', 150, '{"sessions_required": 3, "activity_type": "meditation"}'),
(2, 'Mindfulness Challenge', 'Practica mindfulness durante 21 días consecutivos', 'monthly', 500, '{"days_required": 21, "activity_type": "mindfulness"}')
ON DUPLICATE KEY UPDATE title=title;

-- Contenido dinámico
INSERT INTO dynamic_content (title, content, content_type, category, difficulty_level, tags, duration_minutes) VALUES
('Guía de Meditación para Principiantes', 'Aprende los fundamentos de la meditación mindfulness...', 'meditation', 'mindfulness', 'beginner', '["meditación", "principiantes", "mindfulness"]', 15),
('Técnicas de Respiración Avanzadas', 'Explora técnicas de respiración para reducir el estrés...', 'exercise', 'relajacion', 'intermediate', '["respiración", "estrés", "relajación"]', 20),
('Workshop: Gestión del Estrés', 'Taller completo sobre cómo manejar el estrés diario...', 'workshop', 'estres', 'advanced', '["estrés", "gestión", "taller"]', 60)
ON DUPLICATE KEY UPDATE title=title;

-- Configuración del sistema
INSERT INTO system_config (config_key, config_value, config_type, description, is_public) VALUES
('app_name', 'EDUMOD Advanced', 'string', 'Nombre de la aplicación', true),
('app_version', '3.0.0', 'string', 'Versión de la aplicación', true),
('max_login_attempts', '5', 'number', 'Máximo número de intentos de login', false),
('session_timeout_minutes', '60', 'number', 'Tiempo de expiración de sesión en minutos', false),
('enable_gamification', 'true', 'boolean', 'Habilitar sistema de gamificación', true),
('enable_notifications', 'true', 'boolean', 'Habilitar notificaciones', true),
('default_language', 'es', 'string', 'Idioma por defecto', true),
('maintenance_mode', 'false', 'boolean', 'Modo mantenimiento', false)
ON DUPLICATE KEY UPDATE config_value=VALUES(config_value); 

-- =====================================================
-- Tabla de usuarios y admin por defecto
-- =====================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contraseña VARCHAR(255) NOT NULL,
    es_admin TINYINT(1) DEFAULT 0,
    edad INT,
    fecha_nacimiento DATE,
    email_verified TINYINT(1) DEFAULT 0,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar o actualizar el usuario administrador
INSERT INTO usuarios (nombre, correo, contraseña, es_admin)
VALUES (
    'Administrador',
    'admin@edumod.com',
    '$2b$10$snv7cDtELCLi9dr0BEHKl.up/4Zi3yQ9rHmkIYjai8NDaG/C8Pz0i', -- Contraseña: Admin$2024!@#

)
ON DUPLICATE KEY UPDATE
    contraseña = VALUES(contraseña),
    es_admin = 1;
    
SELECT id, nombre, correo, es_admin, edad, fecha_nacimiento, fecha_registro
FROM usuarios;

USE edumod_advanced;

SELECT id, nombre, correo, es_admin, edad, fecha_nacimiento, fecha_registro FROM usuarios;
  
UPDATE audiolibros SET activo = 1;

INSERT INTO audiolibros (titulo, contenido, activo) VALUES
('Ejemplo 1', 'Contenido del audiolibro 1', 1),
('Ejemplo 2', 'Contenido del audiolibro 2', 1);


UPDATE audiolibros SET archivo_audio = 'audiolibro_1_1751756368788.mp3' WHERE id = 1;
UPDATE audiolibros SET archivo_audio = 'audiolibro_2_1751756016699.mp3' WHERE id = 2;
UPDATE audiolibros SET archivo_audio = 'audiolibro_3_1751756370644.mp3' WHERE id = 3;
UPDATE audiolibros SET archivo_audio = 'audiolibro_4_1751756373492.mp3' WHERE id = 4;
UPDATE audiolibros SET archivo_audio = 'audiolibro_5_1751756376167.mp3' WHERE id = 5;
UPDATE audiolibros SET archivo_audio = 'audiolibro_6_1751756378528.mp3' WHERE id = 6;

  SELECT id, titulo, archivo_audio FROM audiolibros;
  
INSERT INTO libros (titulo, autor, descripcion, archivo, portada) VALUES
('El Guerrero Pacífico', 'Dan Millman', 'Una historia sobre el autodescubrimiento y la superación personal.', 'El_Guerrero_Pacifico.pdf', 'guerrero-pacifico.jpg'),
('El Secreto de la Felicidad', 'Mo Gawdat', 'Un ingeniero de Google revela su fórmula para la felicidad.', 'El_Secreto_de_la_Felicidad.pdf', 'secreto-felicidad.jpg'),
('La Trampa de la Felicidad', 'Russ Harris', 'Cómo dejar de luchar y empezar a vivir.', 'La_Trampa_de_la_Felicidad.pdf', 'trampa-felicidad.jpg'),
('El Poder del Ahora para Jóvenes', 'Eckhart Tolle', 'Adaptación juvenil del clásico de mindfulness.', 'El_Poder_del_Ahora_Jovenes.pdf', 'el-poder-jovenes.jpg'),
('El Camino del Mindfulness', 'Bhante Henepola Gunaratana', 'Guía práctica para la meditación y la atención plena.', 'El_Camino_del_Mindfulness.pdf', 'camino-mindfulness.jpg'),
('La Resiliencia', 'Boris Cyrulnik', 'Cómo afrontar la adversidad y salir fortalecido.', 'La_Resiliencia.pdf', 'resiliencia.jpg'),
('El Arte de Amar', 'Erich Fromm', 'Un análisis profundo sobre la naturaleza del amor.', 'El_Arte_de_Amar.pdf', 'arte-amar.jpg'),
('La Autenticidad', 'Stephen Joseph', 'Cómo ser tú mismo y vivir con sentido.', 'La_Autenticidad.pdf', 'autenticidad.jpg'),
('El Cerebro y la Felicidad', 'Rick Hanson', 'Ciencia y práctica para una mente feliz.', 'El_Cerebro_y_la_Felicidad.pdf', 'cerebro-felicidad.jpg'),
('La Ciencia de la Gratitud', 'Robert Emmons', 'Cómo la gratitud transforma tu vida.', 'La_Ciencia_de_la_Gratitud.pdf', 'ciencia-gratitud.jpg');

CREATE TABLE IF NOT EXISTS libros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    autor VARCHAR(255),
    descripcion TEXT,
    archivo VARCHAR(255) NOT NULL, -- nombre del archivo PDF/EPUB
    portada VARCHAR(255),          -- imagen opcional
    fecha_publicacion DATE
);
USE edumod_advanced;

ALTER TABLE audiolibros ADD COLUMN archivo VARCHAR(255) AFTER contenido;

UPDATE audiolibros SET archivo = 'El_Poder_de_la_Gratitud.pdf' WHERE titulo = 'El Poder de la Gratitud';
UPDATE audiolibros SET archivo = 'Mindfulness_en_la_Vida_Cotidiana.pdf' WHERE titulo = 'Mindfulness en la Vida Cotidiana';
UPDATE audiolibros SET archivo = 'Construyendo_Resiliencia.pdf' WHERE titulo = 'Construyendo Resiliencia';
UPDATE audiolibros SET archivo = 'El_Arte_de_la_Comunicacion_Asertiva.pdf' WHERE titulo = 'El Arte de la Comunicación Asertiva';
UPDATE audiolibros SET archivo = 'Cultivando_la_Autoestima.pdf' WHERE titulo = 'Cultivando la Autoestima';
UPDATE audiolibros SET archivo = 'El_Alquimista.pdf' WHERE titulo = 'El Alquimista';
UPDATE audiolibros SET archivo = 'Los_7_Habitos_de_la_Gente_Altamente_Efectiva.pdf' WHERE titulo = 'Los 7 Hábitos de la Gente Altamente Efectiva';
UPDATE audiolibros SET archivo = 'Mente_Zen_Mente_de_Principiante.pdf' WHERE titulo = 'Mente Zen, Mente de Principiante';
UPDATE audiolibros SET archivo = 'La_Trampa_de_la_Felicidad.pdf' WHERE titulo = 'La Trampa de la Felicidad';
UPDATE audiolibros SET archivo = 'El_Poder_del_Ahora_para_Jovenes.pdf' WHERE titulo = 'El Poder del Ahora para Jóvenes';
UPDATE audiolibros SET archivo = 'El_Camino_del_Mindfulness.pdf' WHERE titulo = 'El Camino del Mindfulness';
UPDATE audiolibros SET archivo = 'La_Resiliencia.pdf' WHERE titulo = 'La Resiliencia';
UPDATE audiolibros SET archivo = 'El_Arte_de_Amar.pdf' WHERE titulo = 'El Arte de Amar';
UPDATE audiolibros SET archivo = 'El_Cerebro_y_la_Felicidad.pdf' WHERE titulo = 'El Cerebro y la Felicidad';
UPDATE audiolibros SET archivo = 'La_Ciencia_de_la_Gratitud.pdf' WHERE titulo = 'La Ciencia de la Gratitud';
UPDATE audiolibros SET archivo = 'La_Autenticidad.pdf' WHERE titulo = 'La Autenticidad';

SET SQL_SAFE_UPDATES = 0;
UPDATE audiolibros SET archivo = 'El_Poder_de_la_Gratitud.pdf' WHERE titulo = 'El Poder de la Gratitud';
UPDATE audiolibros SET archivo = 'Mindfulness_en_la_Vida_Cotidiana.pdf' WHERE titulo = 'Mindfulness en la Vida Cotidiana';
UPDATE audiolibros SET archivo = 'Construyendo_Resiliencia.pdf' WHERE titulo = 'Construyendo Resiliencia';
UPDATE audiolibros SET archivo = 'El_Arte_de_la_Comunicacion_Asertiva.pdf' WHERE titulo = 'El Arte de la Comunicación Asertiva';
UPDATE audiolibros SET archivo = 'Cultivando_la_Autoestima.pdf' WHERE titulo = 'Cultivando la Autoestima';
UPDATE audiolibros SET archivo = 'El_Alquimista.pdf' WHERE titulo = 'El Alquimista';
UPDATE audiolibros SET archivo = 'Los_7_Habitos_de_la_Gente_Altamente_Efectiva.pdf' WHERE titulo = 'Los 7 Hábitos de la Gente Altamente Efectiva';
UPDATE audiolibros SET archivo = 'Mente_Zen_Mente_de_Principiante.pdf' WHERE titulo = 'Mente Zen, Mente de Principiante';
UPDATE audiolibros SET archivo = 'La_Trampa_de_la_Felicidad.pdf' WHERE titulo = 'La Trampa de la Felicidad';
UPDATE audiolibros SET archivo = 'El_Poder_del_Ahora_para_Jovenes.pdf' WHERE titulo = 'El Poder del Ahora para Jóvenes';
UPDATE audiolibros SET archivo = 'El_Camino_del_Mindfulness.pdf' WHERE titulo = 'El Camino del Mindfulness';
UPDATE audiolibros SET archivo = 'La_Resiliencia.pdf' WHERE titulo = 'La Resiliencia';
UPDATE audiolibros SET archivo = 'El_Arte_de_Amar.pdf' WHERE titulo = 'El Arte de Amar';
UPDATE audiolibros SET archivo = 'El_Cerebro_y_la_Felicidad.pdf' WHERE titulo = 'El Cerebro y la Felicidad';
UPDATE audiolibros SET archivo = 'La_Ciencia_de_la_Gratitud.pdf' WHERE titulo = 'La Ciencia de la Gratitud';
UPDATE audiolibros SET archivo = 'La_Autenticidad.pdf' WHERE titulo = 'La Autenticidad';
   
SET SQL_SAFE_UPDATES = 1;

SELECT titulo, archivo FROM audiolibros;

SHOW TABLES;

SELECT * FROM libros;

INSERT INTO audiolibros (titulo, contenido, archivo)
VALUES
('El Poder de la Gratitud', 'La gratitud es una de las emociones más poderosas...', 'El_Poder_de_la_Gratitud.pdf'),
('Mindfulness en la Vida Cotidiana', 'El mindfulness es la práctica de estar presente...', 'Mindfulness_en_la_Vida_Cotidiana.pdf'),
('Construyendo Resiliencia', 'La resiliencia es la capacidad de adaptarse...', 'Construyendo_Resiliencia.pdf'),
('El Arte de la Comunicación Asertiva', 'La comunicación asertiva es el equilibrio perfecto...', 'El_Arte_de_la_Comunicacion_Asertiva.pdf'),
('Cultivando la Autoestima', 'La autoestima es la base de nuestro bienestar emocional...', 'Cultivando_la_Autoestima.pdf'),
('El Alquimista', 'Una novela de Paulo Coelho sobre la importancia de perseguir los sueños...', 'El_Alquimista.pdf'),
('Los 7 Hábitos de la Gente Altamente Efectiva', 'Un libro de Stephen Covey que presenta hábitos...', 'Los_7_Habitos_de_la_Gente_Altamente_Efectiva.pdf'),
('Mente Zen, Mente de Principiante', 'Introducción a la práctica del Zen y la meditación...', 'Mente_Zen_Mente_de_Principiante.pdf'),
('La Trampa de la Felicidad', '...', 'La_Trampa_de_la_Felicidad.pdf'),
('El Poder del Ahora para Jóvenes', '...', 'El_Poder_del_Ahora_para_Jovenes.pdf'),
('El Camino del Mindfulness', '...', 'El_Camino_del_Mindfulness.pdf'),
('La Resiliencia', '...', 'La_Resiliencia.pdf'),
('El Arte de Amar', '...', 'El_Arte_de_Amar.pdf'),
('El Cerebro y la Felicidad', '...', 'El_Cerebro_y_la_Felicidad.pdf'),
('La Ciencia de la Gratitud', '...', 'La_Ciencia_de_la_Gratitud.pdf'),
('La Autenticidad', '...', 'La_Autenticidad.pdf');

DELETE FROM audiolibros WHERE titulo LIKE 'Ejemplo%';

SELECT titulo, archivo FROM audiolibros;

INSERT INTO audiolibros (titulo, contenido, archivo) VALUES
('El Poder de la Gratitud', 'La gratitud es una de las emociones más poderosas que podemos cultivar. Cuando practicamos la gratitud regularmente, nuestro cerebro comienza a buscar automáticamente las cosas buenas en nuestra vida. Esto no significa ignorar los desafíos, sino encontrar el equilibrio entre reconocer las dificultades y apreciar las bendiciones. La gratitud nos ayuda a mantener una perspectiva positiva incluso en tiempos difíciles.', 'El_Poder_de_la_Gratitud.pdf'),
('Mindfulness en la Vida Cotidiana', 'El mindfulness es la práctica de estar presente en el momento actual sin juzgar. Es una herramienta poderosa para reducir el estrés y mejorar nuestro bienestar mental. Puedes practicar mindfulness en cualquier momento del día: mientras comes, caminas, o incluso mientras te lavas los dientes.', 'Mindfulness_en_la_Vida_Cotidiana.pdf'),
('Construyendo Resiliencia', 'La resiliencia es la capacidad de adaptarse y recuperarse de las adversidades. Es como un músculo que podemos fortalecer con práctica. Las personas resilientes no evitan los problemas, sino que los enfrentan con confianza y flexibilidad.', 'Construyendo_Resiliencia.pdf'),
('El Arte de la Comunicación Asertiva', 'La comunicación asertiva es el equilibrio perfecto entre ser pasivo y ser agresivo. Es expresar tus necesidades, sentimientos y opiniones de manera clara y respetuosa, sin violar los derechos de los demás.', 'El_Arte_de_la_Comunicacion_Asertiva.pdf'),
('Cultivando la Autoestima', 'La autoestima es la base de nuestro bienestar emocional. Es la evaluación que hacemos de nosotros mismos y nuestro valor como personas. Una autoestima saludable no significa ser perfecto, sino aceptarse a uno mismo con compasión.', 'Cultivando_la_Autoestima.pdf'),
('El Alquimista', 'Una novela de Paulo Coelho sobre la importancia de perseguir los sueños y escuchar al corazón.', 'El_Alquimista.pdf'),
('Los 7 Hábitos de la Gente Altamente Efectiva', 'Un libro de Stephen Covey que presenta hábitos para mejorar la efectividad personal y profesional.', 'Los_7_Habitos_de_la_Gente_Altamente_Efectiva.pdf'),
('Mente Zen, Mente de Principiante', 'Introducción a la práctica del Zen y la meditación por Shunryu Suzuki.', 'Mente_Zen_Mente_de_Principiante.pdf'),
('La Trampa de la Felicidad', 'Descubre cómo evitar las trampas mentales que nos impiden ser felices y aprende a aceptar tus emociones.', 'La_Trampa_de_la_Felicidad.pdf'),
('El Poder del Ahora para Jóvenes', 'Una guía para que los jóvenes aprendan a vivir el presente y reducir la ansiedad sobre el futuro.', 'El_Poder_del_Ahora_para_Jovenes.pdf'),
('El Camino del Mindfulness', 'Explora el camino del mindfulness y cómo puede ayudarte a encontrar paz interior y claridad mental.', 'El_Camino_del_Mindfulness.pdf'),
('La Resiliencia', 'Estrategias y reflexiones para desarrollar la resiliencia y superar los desafíos de la vida.', 'La_Resiliencia.pdf'),
('El Arte de Amar', 'Un clásico de Erich Fromm sobre la naturaleza del amor y cómo cultivarlo en nuestras vidas.', 'El_Arte_de_Amar.pdf'),
('El Cerebro y la Felicidad', 'Cómo funciona el cerebro en relación con la felicidad y qué hábitos pueden potenciarla.', 'El_Cerebro_y_la_Felicidad.pdf'),
('La Ciencia de la Gratitud', 'Estudios y prácticas sobre cómo la gratitud impacta positivamente en nuestra salud mental.', 'La_Ciencia_de_la_Gratitud.pdf'),
('La Autenticidad', 'Cómo ser tú mismo y vivir con sentido, valorando tu autenticidad en un mundo que presiona para encajar.', 'La_Autenticidad.pdf');
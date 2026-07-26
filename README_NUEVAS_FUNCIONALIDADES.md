# Nuevas Funcionalidades - EDUMOD ALPHA

## 🚀 Funcionalidades Implementadas

### 1. Registro por Código QR
- **Descripción**: Permite a los usuarios registrarse escaneando un código QR con su dispositivo móvil
- **Características**:
  - Generación automática de códigos QR únicos
  - Expiración automática (5 minutos)
  - Página de registro optimizada para móviles
  - Validación de edad por fecha de nacimiento
  - Verificación por correo electrónico

### 2. Verificación por Correo Electrónico
- **Descripción**: Sistema de verificación de cuentas mediante códigos de 6 dígitos enviados por email
- **Características**:
  - Códigos de verificación de 6 dígitos
  - Expiración automática (10 minutos)
  - Reenvío de códigos
  - Interfaz de verificación intuitiva
  - Bloqueo de acceso hasta verificación

### 3. Validación de Edad por Fecha de Nacimiento
- **Descripción**: Cambio del campo de edad por fecha de nacimiento con cálculo automático
- **Características**:
  - Cálculo automático de edad
  - Validación de rangos de edad
  - Interfaz mejorada con indicadores visuales
  - Aplicado tanto en registro como en test

## 📋 Requisitos de Instalación

### 1. Dependencias de Node.js
```bash
npm install qrcode@1.5.3
```

### 2. Actualización de Base de Datos
Ejecutar el archivo `database_updates.sql` en tu base de datos MySQL:

```bash
mysql -u tu_usuario -p tu_base_de_datos < database_updates.sql
```

### 3. Configuración del Servidor
Asegúrate de que las siguientes rutas estén configuradas en tu servidor:

```javascript
// Rutas para registro por QR
app.post('/save-qr-token', ...);
app.post('/verify-qr-token', ...);
app.get('/qr-registration', ...);

// Rutas para verificación por email
app.post('/verify-email-code', ...);
app.post('/resend-verification-code', ...);
```

## 🛠️ Configuración

### 1. Configuración de Correo Electrónico
Para implementar el envío real de correos electrónicos, modifica el controlador `authController.js`:

```javascript
// Reemplazar la simulación de envío de correo
console.log(`Código de verificación enviado a ${correo}: ${verificationCode}`);

// Por una implementación real usando nodemailer o similar
const nodemailer = require('nodemailer');
// ... configuración del transportador
```

### 2. Configuración de Seguridad
- Los tokens QR expiran automáticamente
- Los códigos de verificación tienen límite de intentos
- Limpieza automática de datos expirados

## 📱 Uso de las Funcionalidades

### Registro por QR
1. El usuario accede a la página de registro
2. Selecciona "Código QR" como método de registro
3. Se genera un código QR único
4. El usuario escanea el código con su dispositivo móvil
5. Completa el formulario de registro en la página móvil
6. Recibe un código de verificación por email
7. Verifica su cuenta ingresando el código

### Verificación por Email
1. Después del registro, el usuario recibe un código de 6 dígitos
2. Ingresa el código en la interfaz de verificación
3. Si el código es correcto, su cuenta se activa
4. Puede reenviar el código si no lo recibe

### Validación de Edad
1. El usuario ingresa su fecha de nacimiento
2. El sistema calcula automáticamente su edad
3. Valida que esté en el rango permitido (13-18 años para registro, 13-15 para test)
4. Muestra indicadores visuales del estado de validación

## 🔧 Archivos Modificados

### Frontend
- `views/registro.html` - Interfaz de registro con múltiples métodos
- `views/test.html` - Validación de edad por fecha de nacimiento
- `views/qr-registration.html` - Página de registro móvil
- `public/js/registro.js` - Lógica de registro y verificación

### Backend
- `routes/auth.js` - Nuevas rutas para QR y verificación
- `controllers/authController.js` - Lógica de registro y verificación
- `database_updates.sql` - Estructura de base de datos

## 📊 Base de Datos

### Nuevas Tablas
- `qr_tokens` - Almacena tokens QR
- `verification_codes` - Códigos de verificación por email
- `qr_registration_logs` - Logs de registro por QR
- `email_verification_logs` - Logs de verificación por email

### Modificaciones
- `usuarios` - Agregada columna `email_verified`

## 🚨 Consideraciones de Seguridad

1. **Tokens QR**: Expiran automáticamente y se marcan como usados
2. **Códigos de Verificación**: Tienen límite de intentos y expiración
3. **Validación de Edad**: Se calcula automáticamente desde fecha de nacimiento
4. **Logs**: Se registran todos los intentos para auditoría
5. **Limpieza Automática**: Los datos expirados se eliminan automáticamente

## 🔄 Mantenimiento

### Limpieza Automática
El sistema incluye eventos MySQL que limpian automáticamente:
- Tokens QR expirados (cada hora)
- Códigos de verificación expirados (cada hora)

### Monitoreo
Usa las vistas de estadísticas para monitorear:
- `estadisticas_registro` - Estadísticas de registro
- `estadisticas_qr` - Uso de códigos QR

## 🐛 Solución de Problemas

### Código QR no se genera
- Verificar que la librería QRCode esté instalada
- Revisar la consola del navegador para errores
- Verificar la conexión a la base de datos

### Verificación por email no funciona
- Verificar la configuración de correo electrónico
- Revisar los logs de verificación
- Comprobar que la tabla `verification_codes` existe

### Validación de edad incorrecta
- Verificar que la fecha de nacimiento se esté enviando correctamente
- Revisar el cálculo de edad en el frontend y backend
- Comprobar los rangos de edad configurados

## 📞 Soporte

Para reportar problemas o solicitar nuevas funcionalidades, contacta al equipo de desarrollo.

---

**Versión**: 1.0.0  
**Fecha**: Diciembre 2024  
**Desarrollado por**: Equipo EDUMOD ALPHA 
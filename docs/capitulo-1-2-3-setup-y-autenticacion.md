# Capítulos 1-2-3: Setup, Autenticación y Testing

## Índice
1. [Configuración Inicial del Proyecto](#1-configuración-inicial-del-proyecto)
2. [Sistema de Autenticación con JWT](#2-sistema-de-autenticación-con-jwt)
3. [Testing de la API](#3-testing-de-la-api)

---

# 1. Configuración Inicial del Proyecto

## 1.1 Estructura del Proyecto

```
api/
├── src/
│   ├── config/
│   │   └── database.js          # Conexión a Supabase
│   ├── controllers/
│   │   └── auth.controller.js   # Lógica de autenticación
│   ├── middleware/
│   │   ├── auth.middleware.js   # Verificación JWT
│   │   └── error-handler.js     # Manejo de errores
│   ├── routes/
│   │   └── auth.routes.js       # Rutas de autenticación
│   └── utils/
│       └── response.js          # Respuestas estandarizadas
├── .env                         # Variables de entorno (NO commitear)
├── .env.example                 # Ejemplo de variables
├── .gitignore
├── package.json
└── server.js                    # Punto de entrada
```

---

## 1.2 Instalación de Dependencias

### Inicializar proyecto

```bash
cd api
npm init -y
```

### Instalar dependencias de producción

```bash
npm install express dotenv cors @supabase/supabase-js bcrypt jsonwebtoken
```

**Explicación:**
- `express`: Framework web para Node.js
- `dotenv`: Cargar variables de entorno desde `.env`
- `cors`: Permitir peticiones desde el frontend
- `@supabase/supabase-js`: Cliente de Supabase
- `bcrypt`: Hashear contraseñas
- `jsonwebtoken`: Generar y verificar tokens JWT

### Instalar dependencias de desarrollo

```bash
npm install --save-dev nodemon
```

**Explicación:**
- `nodemon`: Reinicia automáticamente el servidor al detectar cambios

---

## 1.3 Configurar package.json

Edita `api/package.json`:

```json
{
  "name": "booking-api",
  "version": "1.0.0",
  "description": "API REST para sistema de reservas multi-profesional",
  "main": "server.js",
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js"
  },
  "keywords": ["booking", "api", "express"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "@supabase/supabase-js": "^2.39.0",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

## 1.4 Variables de Entorno

### Crear `.env.example`

```bash
# Server
PORT=3000
NODE_ENV=development

# Database (Supabase)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=tu-service-role-key

# JWT
JWT_SECRET=tu-super-secret-key-change-in-production
JWT_EXPIRATION=24h

# CORS
FRONTEND_URL=http://localhost:5173
```

### Crear `.env`

Copia `.env.example` a `.env` y completa con tus valores reales de Supabase.

**⚠️ IMPORTANTE:** Nunca commitees el archivo `.env` a Git.

---

## 1.5 Configurar .gitignore

Crea `api/.gitignore`:

```
node_modules/
.env
*.log
.DS_Store
```

---

## 1.6 Configurar Supabase

### Obtener credenciales

1. Ve a [supabase.com](https://supabase.com)
2. Crea un proyecto
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** → `SUPABASE_SERVICE_KEY`

### Crear tabla `users`

En Supabase SQL Editor, ejecuta:

```sql
-- Tabla de usuarios
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL DEFAULT 'client',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas por email
CREATE INDEX idx_users_email ON users(email);

-- Índice para búsquedas por rol
CREATE INDEX idx_users_role ON users(role);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

## 1.7 Archivos de Configuración

### `api/src/config/database.js`

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Faltan variables de entorno de Supabase');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = { supabaseAdmin };
```

**¿Por qué `supabaseAdmin`?**
- Usamos la `service_role` key que bypasea Row Level Security (RLS)
- Tenemos control total desde el backend
- El backend es quien valida permisos, no Supabase

---

### `api/src/utils/response.js`

```javascript
const successResponse = (res, data = null, message = 'Operación exitosa', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const errorResponse = (res, message = 'Error en el servidor', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors })
  });
};

module.exports = { successResponse, errorResponse };
```

**Ventajas:**
- Respuestas consistentes en toda la API
- Fácil de mantener
- Cliente sabe qué esperar

---

### `api/src/middleware/error-handler.js`

```javascript
const { errorResponse } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return errorResponse(res, 'Error de validación', 400, err.errors);
  }

  if (err.name === 'UnauthorizedError') {
    return errorResponse(res, 'No autorizado', 401);
  }

  return errorResponse(res, 'Error interno del servidor', 500);
};

module.exports = errorHandler;
```

---

### `api/server.js`

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./src/middleware/error-handler');
const authRoutes = require('./src/routes/auth.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);

// Middleware de errores (debe ir al final)
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📝 Ambiente: ${process.env.NODE_ENV}`);
});
```

---

## 1.8 Probar configuración inicial

```bash
npm run dev
```

Deberías ver:
```
🚀 Servidor corriendo en http://localhost:3000
📝 Ambiente: development
```

Prueba en el navegador: `http://localhost:3000/api/health`

Deberías ver:
```json
{
  "success": true,
  "message": "API funcionando correctamente",
  "timestamp": "2024-01-10T12:00:00.000Z"
}
```

---

# 2. Sistema de Autenticación con JWT

## 2.1 ¿Qué es JWT?

**JWT (JSON Web Token)** es un estándar para transmitir información de forma segura entre cliente y servidor.

### Estructura de un JWT

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJyb2xlIjoiY2xpZW50In0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

│         HEADER          │         PAYLOAD         │       SIGNATURE      │
```

**HEADER:** Tipo de token y algoritmo
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**PAYLOAD:** Datos del usuario
```json
{
  "userId": "123",
  "email": "user@example.com",
  "role": "client",
  "iat": 1704902400,
  "exp": 1704988800
}
```

**SIGNATURE:** Firma criptográfica
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  JWT_SECRET
)
```

### Flujo de autenticación

```
1. Usuario hace login
   ↓
2. Backend verifica credenciales
   ↓
3. Backend genera JWT firmado
   ↓
4. Frontend guarda token (localStorage)
   ↓
5. Frontend envía token en cada request:
   Authorization: Bearer <token>
   ↓
6. Backend verifica firma y extrae datos
```

---

## 2.2 Controlador de Autenticación

### `api/src/controllers/auth.controller.js`

```javascript
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

// Registrar nuevo usuario
const register = async (req, res) => {
  try {
    const { email, password, full_name, phone, role = 'client' } = req.body;

    // Verificar si el email ya existe
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return errorResponse(res, 'El email ya está registrado', 409);
    }

    // Hashear contraseña
    const password_hash = await bcrypt.hash(password, 10);

    // Crear usuario
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert([{ email, password_hash, full_name, phone, role }])
      .select()
      .single();

    if (error) throw error;

    // Generar JWT
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );

    return successResponse(res, {
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role
      },
      token
    }, 'Usuario registrado exitosamente', 201);

  } catch (error) {
    console.error('Error en register:', error);
    return errorResponse(res, 'Error al registrar usuario', 500);
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return errorResponse(res, 'Credenciales inválidas', 401);
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return errorResponse(res, 'Credenciales inválidas', 401);
    }

    // Verificar si está activo
    if (!user.is_active) {
      return errorResponse(res, 'Usuario inactivo', 403);
    }

    // Generar JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );

    return successResponse(res, {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      token
    }, 'Login exitoso');

  } catch (error) {
    console.error('Error en login:', error);
    return errorResponse(res, 'Error al iniciar sesión', 500);
  }
};

// Obtener perfil del usuario autenticado
const getProfile = async (req, res) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, phone, role, created_at')
      .eq('id', req.user.userId)
      .single();

    if (error || !user) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }

    return successResponse(res, { user }, 'Perfil obtenido exitosamente');

  } catch (error) {
    console.error('Error en getProfile:', error);
    return errorResponse(res, 'Error al obtener perfil', 500);
  }
};

module.exports = { register, login, getProfile };
```

**Puntos clave:**
- ✅ Nunca almacenamos contraseñas en texto plano (usamos bcrypt)
- ✅ Verificamos si el email ya existe antes de registrar
- ✅ Validamos credenciales en login
- ✅ Generamos JWT con datos mínimos necesarios
- ✅ No devolvemos `password_hash` en las respuestas

---

## 2.3 Middleware de Autenticación

### `api/src/middleware/auth.middleware.js`

```javascript
const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/response');

// Verificar que el usuario esté autenticado
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Token no proporcionado', 401);
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expirado', 401);
    }
    return errorResponse(res, 'Token inválido', 401);
  }
};

// Verificar que el usuario tenga un rol específico
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'No autenticado', 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 'No tienes permisos para esta acción', 403);
    }

    next();
  };
};

module.exports = { authenticate, authorize };
```

**Cómo funciona:**
1. Extrae el token del header `Authorization: Bearer <token>`
2. Verifica la firma del token con `JWT_SECRET`
3. Si es válido, agrega `req.user` con los datos del token
4. Si no es válido, devuelve error 401

**Uso:**
```javascript
// Ruta protegida (cualquier usuario autenticado)
router.get('/profile', authenticate, getProfile);

// Ruta solo para profesionales
router.post('/availability', authenticate, authorize('professional'), createAvailability);

// Ruta solo para admins
router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);
```

---

## 2.4 Rutas de Autenticación

### `api/src/routes/auth.routes.js`

```javascript
const express = require('express');
const { register, login, getProfile } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Rutas públicas
router.post('/register', register);
router.post('/login', login);

// Rutas protegidas
router.get('/profile', authenticate, getProfile);

module.exports = router;
```

---

## 2.5 Seguridad: Mejores Prácticas

### ✅ Contraseñas

```javascript
// ❌ NUNCA hagas esto
const password = req.body.password;
await supabase.from('users').insert({ password });

// ✅ Siempre hashea
const password_hash = await bcrypt.hash(password, 10);
await supabase.from('users').insert({ password_hash });
```

### ✅ JWT Secret

```javascript
// ❌ NUNCA hagas esto
const token = jwt.sign(data, 'mi-secreto-123');

// ✅ Usa variable de entorno
const token = jwt.sign(data, process.env.JWT_SECRET);
```

### ✅ Validación de inputs

```javascript
// ❌ Confiar en el frontend
const { email, password } = req.body;
// Procesar sin validar...

// ✅ Validar en backend
if (!email || !password) {
  return errorResponse(res, 'Email y contraseña requeridos', 400);
}
if (password.length < 6) {
  return errorResponse(res, 'Contraseña debe tener al menos 6 caracteres', 400);
}
```

### ✅ Mensajes de error

```javascript
// ❌ Dar demasiada información
if (!user) return errorResponse(res, 'Usuario no existe', 404);
if (!isValidPassword) return errorResponse(res, 'Contraseña incorrecta', 401);

// ✅ Mensaje genérico
if (!user || !isValidPassword) {
  return errorResponse(res, 'Credenciales inválidas', 401);
}
```

---

# 3. Testing de la API

## 3.1 Herramientas de Testing

Usaremos **Thunder Client** (extensión de VS Code) para probar la API.

### Instalar Thunder Client

1. Abre VS Code
2. Ve a Extensions (Ctrl+Shift+X)
3. Busca "Thunder Client"
4. Instala

---

## 3.2 Casos de Prueba

### Test 1: Health Check

**Request:**
```
GET http://localhost:3000/api/health
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "API funcionando correctamente",
  "timestamp": "2024-01-10T12:00:00.000Z"
}
```

---

### Test 2: Registro de Usuario

**Request:**
```
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "123456",
  "full_name": "Usuario Test",
  "phone": "123456789",
  "role": "client"
}
```

**Respuesta esperada (201):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": "uuid-generado",
      "email": "test@example.com",
      "full_name": "Usuario Test",
      "role": "client"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Caso de error - Email duplicado (409):**
```json
{
  "success": false,
  "message": "El email ya está registrado"
}
```

---

### Test 3: Login

**Request:**
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "123456"
}
```

**Respuesta esperada (200):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": "uuid",
      "email": "test@example.com",
      "full_name": "Usuario Test",
      "role": "client"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Caso de error - Credenciales inválidas (401):**
```json
{
  "success": false,
  "message": "Credenciales inválidas"
}
```

---

### Test 4: Obtener Perfil (Ruta Protegida)

**Request:**
```
GET http://localhost:3000/api/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Respuesta esperada (200):**
```json
{
  "success": true,
  "message": "Perfil obtenido exitosamente",
  "data": {
    "user": {
      "id": "uuid",
      "email": "test@example.com",
      "full_name": "Usuario Test",
      "phone": "123456789",
      "role": "client",
      "created_at": "2024-01-10T12:00:00.000Z"
    }
  }
}
```

**Caso de error - Sin token (401):**
```json
{
  "success": false,
  "message": "Token no proporcionado"
}
```

**Caso de error - Token inválido (401):**
```json
{
  "success": false,
  "message": "Token inválido"
}
```

**Caso de error - Token expirado (401):**
```json
{
  "success": false,
  "message": "Token expirado"
}
```

---

## 3.3 Guía de Thunder Client

### Crear una request

1. Click en el ícono de Thunder Client en la barra lateral
2. Click en "New Request"
3. Selecciona el método (GET, POST, etc.)
4. Ingresa la URL
5. Si es POST/PUT, ve a la pestaña "Body" y selecciona "JSON"
6. Ingresa el JSON
7. Click en "Send"

### Agregar headers

1. Ve a la pestaña "Headers"
2. Click en "Add Header"
3. Key: `Authorization`
4. Value: `Bearer <tu-token>`

### Guardar requests

1. Después de crear una request, click en "Save"
2. Dale un nombre descriptivo
3. Organiza en colecciones (ej: "Auth", "Bookings")

### Variables de entorno

1. Click en "Env" en la barra lateral
2. Crea un nuevo entorno "Development"
3. Agrega variables:
   - `baseUrl`: `http://localhost:3000`
   - `token`: (se actualiza después de login)
4. Usa en requests: `{{baseUrl}}/api/auth/login`

---

## 3.4 Checklist de Testing

### ✅ Registro
- [ ] Registro exitoso con datos válidos
- [ ] Error con email duplicado
- [ ] Error con email inválido
- [ ] Error con contraseña corta
- [ ] Error con campos faltantes

### ✅ Login
- [ ] Login exitoso con credenciales correctas
- [ ] Error con email incorrecto
- [ ] Error con contraseña incorrecta
- [ ] Error con usuario inactivo
- [ ] Error con campos faltantes

### ✅ Perfil
- [ ] Obtener perfil con token válido
- [ ] Error sin token
- [ ] Error con token inválido
- [ ] Error con token expirado

---

## 3.5 Flujo Completo de Testing

### Paso 1: Registrar usuario
```
POST /api/auth/register
{
  "email": "profesional@example.com",
  "password": "123456",
  "full_name": "Dr. Juan Pérez",
  "phone": "987654321",
  "role": "professional"
}
```

**Guardar el token recibido**

### Paso 2: Login con ese usuario
```
POST /api/auth/login
{
  "email": "profesional@example.com",
  "password": "123456"
}
```

**Verificar que devuelve el mismo usuario**

### Paso 3: Obtener perfil
```
GET /api/auth/profile
Authorization: Bearer <token-del-paso-1-o-2>
```

**Verificar que devuelve los datos correctos**

### Paso 4: Probar sin token
```
GET /api/auth/profile
(sin header Authorization)
```

**Verificar que devuelve error 401**

---

## 3.6 Debugging

### Ver logs del servidor

En la terminal donde corre `npm run dev`, verás:
```
Error en register: <detalles del error>
Error en login: <detalles del error>
```

### Errores comunes

**Error: Cannot find module**
```
Solución: Verifica que el archivo existe y la ruta es correcta
```

**Error: SUPABASE_URL is not defined**
```
Solución: Verifica que el archivo .env existe y tiene las variables
```

**Error: Invalid login credentials**
```
Solución: Verifica que el email y contraseña son correctos
```

**Error: duplicate key value violates unique constraint**
```
Solución: El email ya existe, usa otro email
```

---

## Resumen de lo Construido

### ✅ Backend funcionando
- Servidor Express configurado
- Conexión a Supabase
- Manejo de errores centralizado
- Respuestas estandarizadas

### ✅ Autenticación completa
- Registro de usuarios
- Login con JWT
- Middleware de autenticación
- Middleware de autorización por roles
- Rutas protegidas

### ✅ Seguridad implementada
- Contraseñas hasheadas con bcrypt
- Tokens JWT firmados
- Validación de tokens
- Protección contra ataques comunes

### ✅ Testing
- Casos de prueba documentados
- Guía de Thunder Client
- Checklist de validación

---

## Próximos Pasos

Ahora que tenemos la base sólida, podemos continuar con:

**Fase 2: Perfiles**
- Crear tabla `profiles`
- Endpoints CRUD de perfiles
- Tipos de profesional

**Fase 3: Disponibilidad**
- Crear tabla `availability`
- Gestión de horarios
- Calendario

**Fase 4: Reservas**
- Crear tabla `bookings`
- Sistema de reservas
- Prevención de doble reserva

---

## Comandos Útiles

```bash
# Iniciar servidor en desarrollo
npm run dev

# Iniciar servidor en producción
npm start

# Ver logs en tiempo real
# (ya incluido con nodemon)

# Detener servidor
Ctrl + C
```

---

**¡Felicidades!** Has completado la configuración inicial y el sistema de autenticación. 🎉
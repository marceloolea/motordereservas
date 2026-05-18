# Sesión 1: Setup y Autenticación - Resumen

## Fecha: [Hoy]

## ✅ Lo que logramos

### 1. Configuración inicial
- ✅ Instalamos dependencias (express, supabase, bcrypt, jwt)
- ✅ Configuramos variables de entorno (.env)
- ✅ Creamos estructura de carpetas
- ✅ Configuramos conexión a Supabase

### 2. Base de datos
- ✅ Creamos tabla `users` en Supabase
- ✅ Agregamos índices y triggers

### 3. Sistema de autenticación
- ✅ Registro de usuarios (POST /api/auth/register)
- ✅ Login con JWT (POST /api/auth/login)
- ✅ Middleware de autenticación
- ✅ Ruta protegida (GET /api/auth/profile)

### 4. Testing
- ✅ Probamos todos los endpoints con Thunder Client
- ✅ Verificamos seguridad (tokens, contraseñas hasheadas)

## 📁 Archivos creados

```
api/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   └── auth.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── error-handler.js
│   ├── routes/
│   │   └── auth.routes.js
│   └── utils/
│       └── response.js
├── .env
├── .gitignore
├── package.json
└── server.js

docs/
└── capitulo-1-2-3-setup-y-autenticacion.md
```

## 🔑 Credenciales de prueba

```
Email: test@example.com
Password: 123456
Role: client
```

## 📝 Próxima sesión

**Fase 2: Sistema de Perfiles**
- Crear tabla `profiles`
- Relación 1:1 con `users`
- Endpoints CRUD de perfiles
- Tipos de profesional (psychologist, teacher)

## 🐛 Problemas resueltos

1. **Error "Cannot GET /api/auth/login"**
   - Solución: Usar POST en lugar de GET

2. **Error "Cannot find module auth.middleware"**
   - Solución: Crear el archivo que faltaba

3. **Error "Route.get() requires a callback"**
   - Solución: Exportar correctamente `getProfile` en el controlador

## 💡 Aprendizajes clave

- JWT para autenticación stateless
- bcrypt para hashear contraseñas
- Middleware para proteger rutas
- Respuestas estandarizadas
- Separación de responsabilidades (MVC)
# Capítulo 0: Arquitectura y Planificación

## 1. Visión General del Sistema

### ¿Qué estamos construyendo?

Una plataforma de reservas multi-profesional que permite a profesionales (psicólogos, profesores) gestionar su disponibilidad y a clientes reservar citas de forma sencilla.

### Principios de diseño

1. **Simplicidad primero**: Código claro y mantenible
2. **Escalabilidad**: Arquitectura que permita crecer
3. **Separación de responsabilidades**: Frontend/Backend independientes
4. **Reutilización**: Misma base para diferentes tipos de profesionales
5. **Validación en capas**: Frontend (UX) + Backend (seguridad)

---

## 2. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENTE                              │
│                    (Navegador Web)                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    FRONTEND                                  │
│                 React + Vite                                 │
│              (Desplegado en Vercel)                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Páginas    │  │ Componentes  │  │   Servicios  │      │
│  │              │  │              │  │   (API calls)│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ REST API (JSON)
                     │ Authorization: Bearer <JWT>
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    BACKEND                                   │
│                 Node.js + Express                            │
│              (Desplegado en Railway)                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Routes    │  │ Controllers  │  │  Middleware  │      │
│  │              │  │              │  │   (Auth JWT) │      │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘      │
│         │                 │                                 │
│  ┌──────▼─────────────────▼───────┐  ┌──────────────┐      │
│  │         Services               │  │ Validations  │      │
│  │    (Lógica de negocio)         │  │              │      │
│  └──────┬─────────────────────────┘  └──────────────┘      │
│         │                                                   │
│  ┌──────▼─────────────────────────┐                        │
│  │      Database Layer            │                        │
│  │    (Queries a Supabase)        │                        │
│  └──────┬─────────────────────────┘                        │
└─────────┼─────────────────────────────────────────────────┘
          │
          │ SQL Queries
          │
┌─────────▼─────────────────────────────────────────────────┐
│                    BASE DE DATOS                            │
│                Supabase (PostgreSQL)                        │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  users   │  │ profiles │  │availability│ │bookings  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Entidades Principales y Relaciones

### Diagrama de Entidad-Relación

```
┌─────────────────────┐
│       users         │
├─────────────────────┤
│ id (PK)             │
│ email (unique)      │
│ password_hash       │
│ role                │ ← 'professional' | 'client'
│ created_at          │
│ updated_at          │
└──────────┬──────────┘
           │
           │ 1:1
           │
┌──────────▼──────────┐
│      profiles       │
├─────────────────────┤
│ id (PK)             │
│ user_id (FK)        │
│ first_name          │
│ last_name           │
│ phone               │
│ professional_type   │ ← 'psychologist' | 'teacher' | null
│ bio                 │
│ specialization      │
│ created_at          │
│ updated_at          │
└──────────┬──────────┘
           │
           │ 1:N (solo si role='professional')
           │
┌──────────▼──────────┐
│    availability     │
├─────────────────────┤
│ id (PK)             │
│ professional_id(FK) │
│ day_of_week         │ ← 0-6 (domingo-sábado)
│ start_time          │
│ end_time            │
│ duration_minutes    │ ← duración de cada slot
│ is_active           │
│ created_at          │
└─────────────────────┘


┌─────────────────────┐         ┌─────────────────────┐
│      profiles       │         │      profiles       │
│  (professional)     │         │      (client)       │
└──────────┬──────────┘         └──────────┬──────────┘
           │                               │
           │                               │
           │         ┌─────────────────────┴──────┐
           │         │                            │
           │ 1:N     │         N:1                │
           │         │                            │
           └─────────▼────────────────────────────▼─┐
                     │       bookings              │
                     ├─────────────────────────────┤
                     │ id (PK)                     │
                     │ professional_id (FK)        │
                     │ client_id (FK)              │
                     │ booking_date                │
                     │ start_time                  │
                     │ end_time                    │
                     │ status                      │ ← 'pending'|'confirmed'|'cancelled'|'completed'
                     │ cancellation_reason         │
                     │ created_at                  │
                     │ updated_at                  │
                     └─────────────────────────────┘
```

### Descripción de Entidades

#### **users**
- **Propósito**: Autenticación y control de acceso
- **Campos clave**:
  - `role`: Determina si es profesional o cliente
  - `password_hash`: Nunca almacenamos contraseñas en texto plano
- **Relaciones**: 1:1 con profiles

#### **profiles**
- **Propósito**: Información personal del usuario
- **Campos clave**:
  - `professional_type`: Solo se llena si role='professional'
  - `bio`, `specialization`: Información pública del profesional
- **Relaciones**: 
  - 1:1 con users
  - 1:N con availability (si es profesional)
  - 1:N con bookings (como profesional o cliente)

#### **availability**
- **Propósito**: Define cuándo está disponible un profesional
- **Campos clave**:
  - `day_of_week`: 0=domingo, 1=lunes, ..., 6=sábado
  - `duration_minutes`: Duración de cada slot (ej: 60 min)
  - `is_active`: Permite desactivar sin eliminar
- **Ejemplo**: 
  - Lunes de 09:00 a 13:00, slots de 60 min = 4 slots disponibles
- **Relaciones**: N:1 con profiles (profesional)

#### **bookings**
- **Propósito**: Reservas confirmadas
- **Campos clave**:
  - `status`: Ciclo de vida de la reserva
  - `booking_date`: Fecha específica de la cita
  - `start_time`, `end_time`: Hora exacta
- **Relaciones**: 
  - N:1 con profiles (profesional)
  - N:1 con profiles (cliente)

---

## 4. Flujo Completo del Sistema

### Flujo 1: Registro y Login

```
CLIENTE                 FRONTEND              BACKEND              DATABASE
  │                        │                     │                    │
  │ 1. Completa form       │                     │                    │
  │ ───────────────────>   │                     │                    │
  │                        │ 2. POST /api/auth/register              │
  │                        │     { email, password, role }            │
  │                        │ ─────────────────>  │                    │
  │                        │                     │ 3. Valida datos    │
  │                        │                     │ 4. Hash password   │
  │                        │                     │ 5. INSERT users    │
  │                        │                     │ ─────────────────> │
  │                        │                     │ 6. INSERT profiles │
  │                        │                     │ ─────────────────> │
  │                        │                     │ 7. Genera JWT      │
  │                        │ 8. { token, user }  │                    │
  │                        │ <─────────────────  │                    │
  │ 9. Guarda token        │                     │                    │
  │    en localStorage     │                     │                    │
  │ <───────────────────   │                     │                    │
  │ 10. Redirige a dashboard                     │                    │
```

### Flujo 2: Profesional crea disponibilidad

```
PROFESIONAL            FRONTEND              BACKEND              DATABASE
  │                        │                     │                    │
  │ 1. Selecciona días     │                     │                    │
  │    y horarios          │                     │                    │
  │ ───────────────────>   │                     │                    │
  │                        │ 2. POST /api/availability               │
  │                        │    Authorization: Bearer <JWT>           │
  │                        │    { day_of_week, start_time, ... }      │
  │                        │ ─────────────────>  │                    │
  │                        │                     │ 3. Verifica JWT    │
  │                        │                     │ 4. Valida role     │
  │                        │                     │ 5. Valida horarios │
  │                        │                     │ 6. INSERT availability
  │                        │                     │ ─────────────────> │
  │                        │ 7. { success }      │                    │
  │                        │ <─────────────────  │                    │
  │ 8. Muestra confirmación│                     │                    │
  │ <───────────────────   │                     │                    │
```

### Flujo 3: Cliente reserva una cita

```
CLIENTE                FRONTEND              BACKEND              DATABASE
  │                        │                     │                    │
  │ 1. Busca profesional   │                     │                    │
  │ ───────────────────>   │                     │                    │
  │                        │ 2. GET /api/professionals               │
  │                        │ ─────────────────>  │                    │
  │                        │                     │ 3. SELECT profiles │
  │                        │                     │    WHERE role='professional'
  │                        │                     │ <───────────────── │
  │                        │ 4. Lista profesionales                   │
  │                        │ <─────────────────  │                    │
  │ 5. Selecciona uno      │                     │                    │
  │ ───────────────────>   │                     │                    │
  │                        │ 6. GET /api/availability/:professionalId │
  │                        │ ─────────────────>  │                    │
  │                        │                     │ 7. SELECT availability
  │                        │                     │ <───────────────── │
  │                        │ 8. Slots disponibles│                    │
  │                        │ <─────────────────  │                    │
  │ 9. Selecciona slot     │                     │                    │
  │ ───────────────────>   │                     │                    │
  │                        │ 10. POST /api/bookings                   │
  │                        │     Authorization: Bearer <JWT>          │
  │                        │     { professional_id, date, time }      │
  │                        │ ─────────────────>  │                    │
  │                        │                     │ 11. BEGIN TRANSACTION
  │                        │                     │ 12. Verifica disponibilidad
  │                        │                     │ 13. Verifica no doble reserva
  │                        │                     │ 14. INSERT booking │
  │                        │                     │ ─────────────────> │
  │                        │                     │ 15. COMMIT         │
  │                        │ 16. { booking }     │                    │
  │                        │ <─────────────────  │                    │
  │ 17. Confirmación       │                     │                    │
  │ <───────────────────   │                     │                    │
```

---

## 5. Decisiones Técnicas Fundamentales

### 5.1 ¿Por qué JWT para autenticación?

**JWT (JSON Web Token)** es un estándar para transmitir información de forma segura.

**Ventajas:**
- **Stateless**: El servidor no necesita almacenar sesiones
- **Escalable**: Funciona bien con múltiples servidores
- **Portable**: El token contiene toda la información necesaria
- **Seguro**: Firmado criptográficamente

**Cómo funciona:**

```
1. Usuario hace login
   ↓
2. Backend verifica credenciales
   ↓
3. Backend genera JWT con:
   - user_id
   - role
   - expiration time
   ↓
4. Backend firma el token con SECRET_KEY
   ↓
5. Frontend recibe token
   ↓
6. Frontend envía token en cada request:
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ↓
7. Backend verifica firma y extrae datos
```

**Estructura de un JWT:**

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJyb2xlIjoicHJvZmVzc2lvbmFsIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

│         HEADER          │         PAYLOAD         │       SIGNATURE      │
```

### 5.2 ¿Por qué Supabase en lugar de PostgreSQL directo?

**Supabase** es una plataforma que incluye PostgreSQL + herramientas adicionales.

**Ventajas:**
- PostgreSQL gestionado (no necesitas configurar servidor)
- API REST automática (opcional, no la usaremos)
- Dashboard para ver datos
- Backups automáticos
- Fácil de escalar

**Usaremos solo PostgreSQL de Supabase**, no sus APIs automáticas, porque queremos control total del backend.

### 5.3 ¿Por qué separar Frontend y Backend?

**Arquitectura desacoplada:**

```
Frontend (React)          Backend (Express)
     │                          │
     │  Puede cambiar           │  Puede cambiar
     │  independiente           │  independiente
     │                          │
     └──────── API REST ────────┘
           (Contrato fijo)
```

**Ventajas:**
- **Escalabilidad**: Puedes escalar frontend y backend por separado
- **Flexibilidad**: Puedes cambiar React por Vue sin tocar backend
- **Reutilización**: El mismo backend puede servir a app móvil
- **Deploy independiente**: Actualiza uno sin afectar el otro

### 5.4 ¿Por qué REST API y no GraphQL?

Para este proyecto, **REST es más simple y suficiente**.

**REST:**
```
GET    /api/professionals      → Lista profesionales
GET    /api/professionals/:id  → Un profesional
POST   /api/bookings           → Crear reserva
PUT    /api/bookings/:id       → Actualizar reserva
DELETE /api/bookings/:id       → Cancelar reserva
```

**Ventajas de REST para este proyecto:**
- Más simple de entender
- Menos configuración
- Suficiente para nuestras necesidades
- Estándar bien conocido

---

## 6. Naming Conventions

### 6.1 Base de Datos

```sql
-- Tablas: plural, snake_case
users
profiles
availability
bookings

-- Columnas: snake_case
user_id
first_name
created_at
professional_type

-- Claves primarias: id
id (siempre)

-- Claves foráneas: tabla_singular_id
user_id
professional_id
client_id
```

### 6.2 Backend (JavaScript)

```javascript
// Archivos: kebab-case
auth-controller.js
booking-service.js
validate-middleware.js

// Carpetas: kebab-case
controllers/
services/
middleware/

// Variables y funciones: camelCase
const userId = 1;
function createBooking() {}

// Clases: PascalCase
class BookingService {}

// Constantes: UPPER_SNAKE_CASE
const JWT_SECRET = 'secret';
const TOKEN_EXPIRATION = '24h';
```

### 6.3 Frontend (React)

```javascript
// Componentes: PascalCase
LoginForm.jsx
BookingCard.jsx
DashboardLayout.jsx

// Hooks personalizados: camelCase con 'use'
useAuth.js
useBookings.js

// Servicios/utilidades: camelCase
authService.js
apiClient.js

// Carpetas: kebab-case
components/
pages/
services/
hooks/
```

### 6.4 API Endpoints

```
/api/auth/register          → POST
/api/auth/login             → POST
/api/professionals          → GET
/api/professionals/:id      → GET
/api/availability           → POST, GET
/api/availability/:id       → PUT, DELETE
/api/bookings               → POST, GET
/api/bookings/:id           → GET, PUT, DELETE
```

**Convenciones:**
- Siempre plural para recursos
- Verbos HTTP para acciones
- IDs en la URL para recursos específicos

---

## 7. Estructura Escalable

### 7.1 Backend Structure

```
backend/
├── src/
│   ├── config/              # Configuraciones
│   │   ├── database.js      # Conexión a Supabase
│   │   └── env.js           # Variables de entorno
│   │
│   ├── middleware/          # Middleware personalizado
│   │   ├── auth.js          # Verificación JWT
│   │   ├── validate.js      # Validación de datos
│   │   └── error-handler.js # Manejo de errores
│   │
│   ├── routes/              # Definición de rutas
│   │   ├── auth.routes.js
│   │   ├── profile.routes.js
│   │   ├── availability.routes.js
│   │   └── booking.routes.js
│   │
│   ├── controllers/         # Lógica de endpoints
│   │   ├── auth.controller.js
│   │   ├── profile.controller.js
│   │   ├── availability.controller.js
│   │   └── booking.controller.js
│   │
│   ├── services/            # Lógica de negocio
│   │   ├── auth.service.js
│   │   ├── profile.service.js
│   │   ├── availability.service.js
│   │   └── booking.service.js
│   │
│   ├── models/              # Queries a DB
│   │   ├── user.model.js
│   │   ├── profile.model.js
│   │   ├── availability.model.js
│   │   └── booking.model.js
│   │
│   ├── utils/               # Utilidades
│   │   ├── jwt.js           # Generación/verificación JWT
│   │   ├── hash.js          # Bcrypt para passwords
│   │   └── validators.js    # Validaciones reutilizables
│   │
│   └── app.js               # Configuración Express
│
├── .env.example             # Ejemplo de variables
├── .gitignore
├── package.json
└── server.js                # Punto de entrada
```

**¿Por qué esta estructura?**

- **Separación de responsabilidades**: Cada capa tiene un propósito claro
- **Escalable**: Fácil agregar nuevos módulos
- **Testeable**: Cada capa se puede testear independientemente
- **Mantenible**: Fácil encontrar y modificar código

**Flujo de una request:**

```
Request
  ↓
Routes (define endpoint)
  ↓
Middleware (auth, validación)
  ↓
Controller (recibe request, envía response)
  ↓
Service (lógica de negocio)
  ↓
Model (queries a DB)
  ↓
Database
```

### 7.2 Frontend Structure

```
frontend/
├── public/
│   └── favicon.ico
│
├── src/
│   ├── assets/              # Imágenes, iconos
│   │
│   ├── components/          # Componentes reutilizables
│   │   ├── common/          # Botones, inputs, cards
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   └── Card.jsx
│   │   │
│   │   ├── layout/          # Layout components
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Sidebar.jsx
│   │   │
│   │   └── features/        # Componentes específicos
│   │       ├── BookingCard.jsx
│   │       ├── AvailabilityCalendar.jsx
│   │       └── ProfessionalCard.jsx
│   │
│   ├── pages/               # Páginas completas
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   │
│   │   ├── professional/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Availability.jsx
│   │   │   └── Bookings.jsx
│   │   │
│   │   └── client/
│   │       ├── Dashboard.jsx
│   │       ├── Search.jsx
│   │       └── MyBookings.jsx
│   │
│   ├── services/            # Llamadas a API
│   │   ├── api.js           # Cliente HTTP (axios)
│   │   ├── auth.service.js
│   │   ├── booking.service.js
│   │   └── professional.service.js
│   │
│   ├── hooks/               # Custom hooks
│   │   ├── useAuth.js
│   │   ├── useBookings.js
│   │   └── useAvailability.js
│   │
│   ├── context/             # Context API
│   │   └── AuthContext.jsx
│   │
│   ├── utils/               # Utilidades
│   │   ├── formatters.js    # Formateo de fechas, etc.
│   │   └── validators.js    # Validaciones frontend
│   │
│   ├── App.jsx              # Componente principal
│   ├── main.jsx             # Punto de entrada
│   └── router.jsx           # Configuración de rutas
│
├── .env.example
├── .gitignore
├── index.html
├── package.json
└── vite.config.js
```

---

## 8. Estrategia de Comunicación Frontend/Backend

### 8.1 Cliente HTTP (Axios)

Usaremos **Axios** para hacer requests HTTP.

**¿Por qué Axios y no fetch?**
- Interceptores (para agregar token automáticamente)
- Manejo de errores más simple
- Transformación automática de JSON
- Timeout configurable

### 8.2 Formato de Respuestas

**Todas las respuestas del backend seguirán este formato:**

**Éxito:**
```json
{
  "success": true,
  "data": {
    // datos solicitados
  },
  "message": "Operación exitosa"
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "message": "Descripción del error",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### 8.3 Códigos de Estado HTTP

```
200 OK              → Operación exitosa
201 Created         → Recurso creado
400 Bad Request     → Datos inválidos
401 Unauthorized    → No autenticado o token inválido
403 Forbidden       → No tiene permisos
404 Not Found       → Recurso no encontrado
409 Conflict        → Conflicto (ej: email ya existe)
500 Server Error    → Error del servidor
```

---

## 9. Estrategia de Validación

### 9.1 Validación en Capas

```
┌─────────────────────────────────────────┐
│         FRONTEND (UX)                   │
│  - Validación inmediata                 │
│  - Feedback visual                      │
│  - Previene requests innecesarios       │
└─────────────────┬───────────────────────┘
                  │
                  │ Request
                  ↓
┌─────────────────────────────────────────┐
│         BACKEND (SEGURIDAD)             │
│  - Validación completa                  │
│  - NUNCA confía en frontend             │
│  - Validación de negocio                │
└─────────────────────────────────────────┘
```

**Principio fundamental:** 
> El frontend valida para mejorar UX.
> El backend valida para garantizar seguridad.

---

## 10. Seguridad

### 10.1 Principios de Seguridad

1. **Nunca almacenar contraseñas en texto plano** - Usar bcrypt para hashear
2. **Nunca confiar en el frontend** - Validar TODO en backend
3. **Proteger rutas sensibles** - Middleware de autenticación
4. **Sanitizar inputs** - Prevenir SQL injection
5. **HTTPS en producción** - Encriptar comunicación
6. **Variables de entorno** - Nunca commitear secrets

---

## 11. Variables de Entorno

### Backend (.env)

```bash
# Server
PORT=3000
NODE_ENV=development

# Database (Supabase)
DATABASE_URL=postgresql://user:password@host:5432/database
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-anon-key

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRATION=24h

# CORS
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```bash
# API
VITE_API_URL=http://localhost:3000/api

# App
VITE_APP_NAME=Sistema de Reservas
```

---

## 12. Roadmap de Desarrollo

### Fase 1: Fundación (Capítulos 1-3)
- ✅ Arquitectura definida
- ⏳ Estructura de proyecto
- ⏳ Autenticación JWT
- ⏳ Protección de rutas

### Fase 2: Perfiles (Capítulo 4)
- ⏳ Modelo de datos
- ⏳ CRUD de perfiles
- ⏳ Tipos de profesional

### Fase 3: Disponibilidad (Capítulo 5)
- ⏳ Creación de horarios
- ⏳ Calendario
- ⏳ Validaciones

### Fase 4: Reservas (Capítulos 6-7)
- ⏳ Sistema de reservas
- ⏳ Prevención doble reserva
- ⏳ Cancelación/reprogramación

### Fase 5: Dashboards (Capítulo 8)
- ⏳ Panel profesional
- ⏳ Panel cliente
- ⏳ Estadísticas

### Fase 6: Deploy (Capítulo 9)
- ⏳ Deploy Vercel
- ⏳ Deploy Railway
- ⏳ Configuración producción

### Fase 7: Documentación (Capítulo 10)
- ⏳ Docs técnicas
- ⳳ Guía de usuario
- ⏳ Mantenimiento

---

## 13. Resumen de Decisiones Clave

| Decisión | Tecnología | Razón |
|----------|-----------|-------|
| Autenticación | JWT | Stateless, escalable |
| Base de datos | Supabase/PostgreSQL | Gestionado, fácil de usar |
| Backend | Node.js + Express | Simple, popular, JavaScript |
| Frontend | React + Vite | Rápido, moderno, popular |
| API | REST | Simple, suficiente |
| Validación | Doble capa | UX + Seguridad |
| Estructura | Modular | Escalable, mantenible |

---

**Próximo capítulo:** Configuración inicial y estructura base del proyecto.
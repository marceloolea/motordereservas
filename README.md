# Motor de Reservas - Sistema de Gestión de Citas Multi-Profesional

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-orange.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Una plataforma completa de reservas que permite a profesionales (psicólogos, profesores, etc.) gestionar su disponibilidad y a clientes reservar citas de forma sencilla e intuitiva.

## 🌟 Características Principales

### Para Profesionales
- ✅ **Gestión de Perfil**: Crear y editar perfil profesional con especialización, biografía y tarifas
- 📅 **Disponibilidad Flexible**: Configurar patrones semanales recurrentes
- 🚫 **Excepciones**: Bloquear días específicos o añadir disponibilidad puntual
- 📊 **Dashboard**: Vista completa de reservas (pendientes, confirmadas, completadas)
- ⏱️ **Duración Personalizable**: Configurar duración de slots (30, 60, 90 min, etc.)
- ✔️ **Confirmación Manual**: Aprobar o rechazar solicitudes de reserva
- 🎯 **Gestión de Reservas**: Confirmar, cancelar o marcar como completadas

### Para Clientes
- 🔍 **Búsqueda de Profesionales**: Filtrar por tipo y especialización
- 👁️ **Perfiles Públicos**: Ver información detallada de profesionales
- 📆 **Reserva Fácil**: Sistema visual de selección de horarios disponibles
- 📋 **Mis Reservas**: Gestionar todas las citas en un solo lugar
- 🔔 **Estados Claros**: Seguimiento de estado (pendiente, confirmada, cancelada, completada)
- ❌ **Cancelación**: Cancelar reservas con razón opcional

## 🏗️ Arquitectura

### Stack Tecnológico

#### Backend (API REST)
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: JWT (jsonwebtoken)
- **Seguridad**: bcrypt para contraseñas
- **CORS**: Configurado para frontend

#### Frontend (SPA)
- **Framework**: React 19.2
- **Build Tool**: Vite
- **Routing**: React Router v7
- **Estado**: React Query (TanStack Query)
- **Estilos**: Tailwind CSS v4
- **Formularios**: React Hook Form
- **Iconos**: Lucide React
- **Fechas**: date-fns + date-fns-tz

#### Base de Datos (Supabase)
- **Motor**: PostgreSQL
- **Tablas**: users, profiles, availability_schedules, availability_exceptions, bookings
- **Relaciones**: FK con CASCADE y RESTRICT según lógica de negocio
- **Triggers**: Auto-actualización de timestamps

### Estructura del Proyecto

```
motordereservas/
├── api/                          # Backend API REST
│   ├── src/
│   │   ├── config/               # Configuración (DB, env)
│   │   ├── controllers/          # Lógica de endpoints
│   │   ├── middleware/           # Auth, validación, errores
│   │   ├── routes/               # Definición de rutas
│   │   ├── services/             # Lógica de negocio
│   │   ├── utils/                # Utilidades (response)
│   │   └── validators/           # Validaciones personalizadas
│   ├── .env.example              # Template de variables
│   ├── package.json
│   └── server.js                 # Punto de entrada
│
├── web/                          # Frontend React
│   ├── src/
│   │   ├── api/                  # Clientes API
│   │   ├── components/           # Componentes reutilizables
│   │   ├── context/              # Context API (Auth)
│   │   ├── hooks/                # Custom hooks
│   │   ├── layouts/              # Layouts (Auth, Dashboard, Public)
│   │   ├── lib/                  # Utilidades (queryClient, datetime)
│   │   ├── pages/                # Páginas (Landing, Auth, Pro, Client)
│   │   ├── App.jsx               # Router principal
│   │   └── main.jsx              # Punto de entrada
│   ├── .env.example              # Template de variables
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json               # Config despliegue Vercel
│
└── docs/                         # Documentación técnica
    ├── capitulo-0-arquitectura.md
    ├── capitulo-1-2-3-setup-y-autenticacion.md
    ├── capitulo-4-perfiles.md
    ├── capitulo-5-disponibilidad.md
    └── capitulo-6-reservas.md
```

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18 o superior
- npm o yarn
- Cuenta en Supabase (https://supabase.com)
- Git

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd motordereservas
```

### 2. Configurar Base de Datos (Supabase)

1. Crear un proyecto en Supabase
2. Ejecutar los scripts SQL en orden:
   - Crear tabla `users` (docs/capitulo-1-2-3-setup-y-autenticacion.md)
   - Crear tabla `profiles` (docs/capitulo-4-perfiles.md)
   - Crear tablas `availability_schedules` y `availability_exceptions` (docs/capitulo-5-disponibilidad.md)
   - Crear tabla `bookings` (docs/capitulo-6-reservas.md)
3. Obtener credenciales:
   - Project URL
   - Anon Key
   - Service Role Key

### 3. Configurar Backend

```bash
cd api
npm install
```

Crear archivo `.env` basado en `.env.example`:

```env
PORT=3000
NODE_ENV=development

SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

JWT_SECRET=tu-secreto-super-seguro-cambiar-en-produccion
JWT_EXPIRATION=24h

FRONTEND_URL=http://localhost:5173
```

Probar conexión:

```bash
node test-connection.js
```

Iniciar servidor:

```bash
npm run dev        # Desarrollo con nodemon
# o
npm start          # Producción
```

La API estará disponible en `http://localhost:3000`

### 4. Configurar Frontend

```bash
cd web
npm install
```

Crear archivo `.env` basado en `.env.example`:

```env
VITE_API_URL=http://localhost:3000
```

Iniciar aplicación:

```bash
npm run dev        # Desarrollo
npm run build      # Build de producción
npm run preview    # Preview del build
npm run lint       # Linter ESLint
```

La aplicación estará disponible en `http://localhost:5173`

## 📡 API Reference

### Autenticación

Base URL: `/api/auth`

| Método | Ruta | Auth | Descripción |
| ------ | ---- | ---- | ----------- |
| POST | `/register` | ❌ | Registrar usuario (client o professional) |
| POST | `/login` | ❌ | Iniciar sesión, retorna JWT |
| GET | `/me` | ✅ | Obtener datos del usuario autenticado |

### Perfiles

Base URL: `/api/profiles`

| Método | Ruta | Auth | Descripción |
| ------ | ---- | ---- | ----------- |
| POST | `/` | ✅ | Crear o actualizar mi perfil |
| PUT | `/` | ✅ | Actualizar mi perfil |
| GET | `/me` | ✅ | Ver mi perfil |
| GET | `/:id` | ❌ | Ver perfil público |
| GET | `/` | ❌ | Listar profesionales (con filtros) |

### Disponibilidad

Base URL: `/api/availability`

| Método | Ruta | Auth | Descripción |
| ------ | ---- | ---- | ----------- |
| GET | `/schedules` | ✅ | Listar mis patrones semanales |
| POST | `/schedules` | ✅ | Crear patrón semanal |
| PUT | `/schedules/:id` | ✅ | Actualizar patrón |
| DELETE | `/schedules/:id` | ✅ | Eliminar patrón |
| GET | `/exceptions` | ✅ | Listar mis excepciones |
| POST | `/exceptions` | ✅ | Crear excepción (block/add) |
| DELETE | `/exceptions/:id` | ✅ | Eliminar excepción |
| GET | `/:userId/slots` | ❌ | Obtener slots disponibles (público) |

### Reservas

Base URL: `/api/bookings`

| Método | Ruta | Auth | Quién | Descripción |
| ------ | ---- | ---- | ----- | ----------- |
| POST | `/` | ✅ | Cliente | Crear reserva |
| GET | `/me` | ✅ | Cualquiera | Mis reservas (`?role=professional`) |
| GET | `/:id` | ✅ | Partes involucradas | Detalle de reserva |
| PATCH | `/:id/confirm` | ✅ | Profesional | Confirmar reserva |
| PATCH | `/:id/cancel` | ✅ | Cliente o Profesional | Cancelar reserva |
| PATCH | `/:id/complete` | ✅ | Profesional | Marcar como completada |

### Formato de Respuesta

**Éxito:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": [ ... ]
}
```

### Autenticación con JWT

Incluir el token en el header de cada request protegido:

```
Authorization: Bearer <token>
```

## 🗄️ Modelo de Datos

### Entidades Principales

```
users (1) ──── (1) profiles
                    │
                    │ (1)
                    │
                    ├──── (N) availability_schedules
                    │
                    └──── (N) availability_exceptions

users (1) ──── (N) bookings (N) ──── (1) profiles
   (como cliente)                    (como profesional)
```

### Estados de Reserva

```
pending ──(profesional confirma)──► confirmed ──(profesional)──► completed
   │                                    │
   └─────(cualquier parte cancela)──────┴──► cancelled
```

## 🔒 Reglas de Negocio

### Reservas
1. Estado inicial siempre `pending` (confirmación manual del profesional)
2. El horario debe coincidir con un slot generado por el algoritmo de disponibilidad
3. No se permiten overlaps con reservas `pending`/`confirmed` del mismo profesional
4. No se pueden crear reservas en el pasado (zona horaria: America/Santiago)
5. No se permite auto-reserva (`client_id != professional_id`)
6. Cancelación libre mientras esté en `pending` o `confirmed`
7. Slots ocupados aparecen con flag `is_booked: true` (no se omiten)

### Disponibilidad
- Modelo híbrido: patrón semanal recurrente + excepciones por fecha
- Excepciones tipo `block`: bloquean rango o día completo
- Excepciones tipo `add`: añaden disponibilidad puntual
- Duración del slot fija por profesional (configurable: 30-480 min)
- Zona horaria: `America/Santiago` (Chile)

## 🚢 Despliegue

### Frontend (Vercel)

El proyecto incluye configuración lista para Vercel en `web/vercel.json`:

1. Importar el repositorio en Vercel
2. Configurar el directorio raíz como `web`
3. Framework Preset: **Vite**
4. Variables de entorno:
   - `VITE_API_URL=https://tu-api.onrender.com`
5. Deploy automático en cada push a `main`

### Backend (Render / Railway)

1. Crear un nuevo Web Service apuntando al repositorio
2. Configurar el directorio raíz como `api`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Variables de entorno (ver sección anterior)
6. Asegurar que `FRONTEND_URL` contenga la URL de producción del frontend (separar múltiples orígenes por comas)

### Base de Datos (Supabase)

- Usar el mismo proyecto Supabase configurado durante el desarrollo
- Verificar que los scripts SQL de los capítulos 1-6 estén ejecutados
- Confirmar que las claves `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` correspondan al entorno de producción

## 📜 Scripts Disponibles

### Backend (`api/`)

```bash
npm run dev          # Inicia el servidor con nodemon (auto-reload)
npm start            # Inicia el servidor en modo producción
node test-connection.js   # Prueba la conexión a Supabase
```

### Frontend (`web/`)

```bash
npm run dev          # Servidor de desarrollo de Vite (http://localhost:5173)
npm run build        # Build de producción en web/dist
npm run preview      # Preview del build de producción
npm run lint         # Análisis estático con ESLint
```

## 🔐 Variables de Entorno

### Backend (`api/.env`)

| Variable | Descripción | Ejemplo |
| -------- | ----------- | ------- |
| `PORT` | Puerto del servidor | `3000` |
| `NODE_ENV` | Entorno de ejecución | `development` / `production` |
| `SUPABASE_URL` | URL del proyecto Supabase | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Clave pública (respeta RLS) | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave admin (bypassea RLS) | `eyJ...` |
| `JWT_SECRET` | Secreto para firmar tokens JWT | Cadena aleatoria larga |
| `JWT_EXPIRATION` | Tiempo de expiración del token | `24h` |
| `FRONTEND_URL` | Orígenes permitidos por CORS (coma-separados) | `http://localhost:5173,https://app.com` |

### Frontend (`web/.env`)

| Variable | Descripción | Ejemplo |
| -------- | ----------- | ------- |
| `VITE_API_URL` | URL base del backend | `http://localhost:3000` |

## 📚 Documentación Adicional

La carpeta `docs/` contiene la documentación técnica detallada del proceso de construcción:

- [`capitulo-0-arquitectura.md`](docs/capitulo-0-arquitectura.md) — Visión general, arquitectura y modelo de datos
- [`capitulo-1-2-3-setup-y-autenticacion.md`](docs/capitulo-1-2-3-setup-y-autenticacion.md) — Setup inicial y sistema de autenticación
- [`capitulo-4-perfiles.md`](docs/capitulo-4-perfiles.md) — Sistema de perfiles profesionales
- [`capitulo-5-disponibilidad.md`](docs/capitulo-5-disponibilidad.md) — Algoritmo de disponibilidad y slots
- [`capitulo-6-reservas.md`](docs/capitulo-6-reservas.md) — Flujo completo de reservas

## 🧪 Testing

El proyecto incluye un script básico de verificación de conexión a la base de datos:

```bash
cd api
node test-connection.js
```

> Actualmente no hay suite de tests automatizados. Se recomienda añadir Jest/Vitest para el backend y React Testing Library para el frontend.

## 🛣️ Roadmap

Posibles mejoras futuras:

- [ ] Notificaciones por email (confirmación, recordatorio, cancelación)
- [ ] Integración con Google Calendar / iCal
- [ ] Sistema de pagos (Stripe / MercadoPago)
- [ ] Reseñas y calificaciones de profesionales
- [ ] Chat interno entre cliente y profesional
- [ ] Multi-idioma (i18n)
- [ ] Soporte para múltiples zonas horarias
- [ ] Tests automatizados (unitarios + e2e)
- [ ] App móvil (React Native)
- [ ] Panel de administración

## 🤝 Contribución

1. Hacer fork del repositorio
2. Crear una rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de los cambios (`git commit -m 'feat: añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir un Pull Request

### Convenciones

- **Commits**: seguir [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `refactor:`, etc.)
- **Código**: respetar el estilo existente y la separación en capas (routes → controllers → services)
- **Validaciones**: añadir validación en backend para cualquier endpoint nuevo
- **Linter**: ejecutar `npm run lint` antes de hacer commit en el frontend

## 📄 Licencia

Distribuido bajo la licencia MIT. Ver `LICENSE` para más información.

## 👤 Autor

**Marcelo**

Proyecto desarrollado como sistema de reservas multi-profesional para psicólogos, profesores y otros profesionales que ofrecen servicios por hora.

---

⭐ Si este proyecto te resulta útil, considera darle una estrella en GitHub.

# Capítulo 4: Sistema de Perfiles

## 4.1 Arquitectura

```
Cliente HTTP
   │
   ▼
api/server.js  ──►  /api/profiles
   │
   ▼
profile.routes.js  ──►  authenticate  ──►  validateProfile  ──►  profile.controller.js
                                                                       │
                                                                       ▼
                                                          Supabase (tabla profiles)
```

Capa | Archivo | Responsabilidad
---- | ------- | ---------------
Ruta | `api/src/routes/profile.routes.js` | Define endpoints y aplica middlewares
Auth | `api/src/middleware/auth.middleware.js` | Verifica JWT y carga `req.user`
Validación | `api/src/middleware/validate-profile.js` | Valida `body` antes del controller
Controller | `api/src/controllers/profile.controller.js` | Lógica + queries a Supabase
DB | tabla `profiles` (Supabase) | Almacenamiento 1:1 con `users`

Endpoints expuestos en `/api/profiles`:

| Método | Ruta | Auth | Descripción |
| ------ | ---- | ---- | ----------- |
| POST   | `/`        | ✅ | Crear o actualizar mi perfil |
| PUT    | `/`        | ✅ | Actualizar mi perfil |
| GET    | `/me`      | ✅ | Ver mi perfil |
| GET    | `/:id`     | ❌ | Ver perfil público |
| GET    | `/`        | ❌ | Listar profesionales con filtros |

---

## 4.2 Base de datos (Supabase)

Ejecutar en **SQL Editor** de Supabase:

```sql
-- Tabla profiles (1:1 con users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE
    REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  specialization VARCHAR(150) NOT NULL,
  professional_type VARCHAR(30) NOT NULL
    CHECK (professional_type IN ('psychologist', 'teacher')),
  hourly_rate NUMERIC(10, 2) CHECK (hourly_rate IS NULL OR hourly_rate >= 0),
  experience_years SMALLINT CHECK (experience_years IS NULL OR (experience_years >= 0 AND experience_years <= 80)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_professional_type ON profiles(professional_type);
CREATE INDEX IF NOT EXISTS idx_profiles_specialization ON profiles(specialization);

-- Trigger para updated_at (reusa la función creada en capítulo 1)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

> Si la función `update_updated_at_column()` no existe aún, créala (ver capítulo 1).

---

## 4.3 Código

### `api/src/middleware/validate-profile.js`

Valida `professional_type` (psychologist/teacher), `specialization` (2–150), `bio` (≤2000), `hourly_rate` (≥0), `experience_years` (entero 0–80). Devuelve 400 con lista de errores.

### `api/src/controllers/profile.controller.js`

- `upsertProfile`: busca el perfil del `req.user.userId`. Si existe → `update`, si no → `insert`. Devuelve 201 al crear, 200 al actualizar.
- `getMyProfile`: filtra por `user_id` del JWT.
- `getPublicProfile`: filtra por `id` (UUID del perfil) y trae datos del usuario embebidos.
- `listProfiles`: soporta filtros `professional_type`, `specialization` (ilike), `min_rate`, `max_rate`, `min_experience` + paginación `page`/`limit`.

Todos los selects usan el alias embebido:
```js
users:users!profiles_user_id_fkey ( id, full_name, email, phone, role )
```

### `api/src/routes/profile.routes.js`

```js
router.get('/', listProfiles);
router.get('/me', authenticate, getMyProfile);
router.get('/:id', getPublicProfile);
router.post('/', authenticate, validateProfile, upsertProfile);
router.put('/', authenticate, validateProfile, upsertProfile);
```

> ⚠️ Orden importante: `/me` debe ir **antes** de `/:id` para que no se interprete como `id="me"`.

### `api/server.js`

```js
const profileRoutes = require('./src/routes/profile.routes');
// ...
app.use('/api/profiles', profileRoutes);
```

---

## 4.4 Casos de prueba (Thunder Client / Postman)

Reemplaza `{{baseUrl}}` por `http://localhost:3000` y `{{token}}` por el JWT obtenido en `/api/auth/login`.

### 1) Crear perfil de psicólogo
- **POST** `{{baseUrl}}/api/profiles`
- Headers: `Authorization: Bearer {{token}}`, `Content-Type: application/json`
- Body:
```json
{
  "professional_type": "psychologist",
  "specialization": "Terapia Cognitivo-Conductual",
  "bio": "Psicólogo clínico con enfoque en ansiedad y depresión.",
  "hourly_rate": 45.00,
  "experience_years": 8
}
```
- Esperado: `201 Created`, `data.id` presente.

### 2) Crear perfil de profesor
- **POST** `{{baseUrl}}/api/profiles`
- Headers: `Authorization: Bearer {{token_teacher}}`, `Content-Type: application/json`
- Body:
```json
{
  "professional_type": "teacher",
  "specialization": "Matemáticas - Cálculo y Álgebra",
  "bio": "Profesor universitario con 12 años de experiencia.",
  "hourly_rate": 25.00,
  "experience_years": 12
}
```
- Esperado: `201 Created`.

### 3) Actualizar perfil
- **PUT** `{{baseUrl}}/api/profiles`
- Headers: `Authorization: Bearer {{token}}`
- Body:
```json
{
  "professional_type": "psychologist",
  "specialization": "Terapia Familiar Sistémica",
  "bio": "Actualizo mi especialidad.",
  "hourly_rate": 55.00,
  "experience_years": 9
}
```
- Esperado: `200 OK`, `message: "Perfil actualizado"`.

### 4) Ver mi perfil
- **GET** `{{baseUrl}}/api/profiles/me`
- Headers: `Authorization: Bearer {{token}}`
- Esperado: `200 OK` con datos del perfil + objeto `users` embebido.

### 5) Ver perfil público
- **GET** `{{baseUrl}}/api/profiles/{{profileId}}`
- Sin auth.
- Esperado: `200 OK`.

### 6) Listar profesionales
- **GET** `{{baseUrl}}/api/profiles`
- Sin auth.
- Variantes con filtros:
  - `GET /api/profiles?professional_type=psychologist`
  - `GET /api/profiles?specialization=matem`
  - `GET /api/profiles?min_rate=20&max_rate=50`
  - `GET /api/profiles?min_experience=5&page=1&limit=10`
- Esperado: `200 OK`, `data: { items, page, limit, total }`.

### 7) Validaciones (debe fallar)
- **POST** `/api/profiles` sin `professional_type` → `400` con `errors: ["professional_type es requerido", ...]`.
- **POST** `/api/profiles` con `professional_type: "doctor"` → `400`.
- **POST** `/api/profiles` sin token → `401`.

---

## 4.5 Troubleshooting

| Síntoma | Causa probable | Solución |
| ------- | -------------- | -------- |
| `relation "profiles" does not exist` | Falta ejecutar el SQL | Ejecutar el bloque de 4.2 en Supabase |
| `duplicate key value violates unique constraint "profiles_user_id_key"` | Ya existe perfil para ese usuario | Usar `PUT` o repetir `POST` (el controller hace upsert) |
| `Could not find a relationship between 'profiles' and 'users'` | Nombre del FK distinto | Verificar nombre real del constraint en Supabase y ajustarlo en `PUBLIC_FIELDS` del controller |
| `401 Token no proporcionado` | Falta header `Authorization` | Enviar `Authorization: Bearer <token>` |
| `GET /api/profiles/me` devuelve 404 | El usuario aún no tiene perfil | Crearlo con `POST /api/profiles` |
| `GET /api/profiles/me` interpretado como `:id` | Orden de rutas incorrecto | `/me` debe declararse antes de `/:id` |
| `invalid input syntax for type uuid: "me"` | Mismo problema anterior | Idem |
| Filtros no devuelven nada | Tipos numéricos enviados como string sin convertir | El controller usa `Number()`; verificar que los parámetros existan |

---

## 4.6 Git y Deploy

### Git — primer commit y push

Desde la raíz del repo (`c:\Users\Marcelo\motordereservas`):

```bash
# 1. Inicializar repo (si no existe)
git init
git branch -M main

# 2. Verificar .gitignore (ya creado en este capítulo)
git status

# 3. Primer commit
git add .
git commit -m "feat: capítulo 4 - sistema de perfiles"

# 4. Crear repo en GitHub
#    Opción A (GitHub CLI):
gh repo create motordereservas --public --source=. --remote=origin --push

#    Opción B (manual):
#    - Crear repo vacío en https://github.com/new
#    - Luego:
git remote add origin https://github.com/<TU_USUARIO>/motordereservas.git
git push -u origin main
```

### Deploy Backend en Render

> Migramos de Railway a Render por temas de créditos del free tier. Render free incluye 750h/mes y no requiere tarjeta. Contraparte: cold start de ~30s tras 15 min de inactividad.

1. Ir a https://render.com → **Get Started for Free** (loguearse con GitHub).
2. Dashboard → **New +** → **Web Service** → seleccionar el repo `motordereservas`.
3. Configuración del servicio:

   | Campo | Valor |
   | ----- | ----- |
   | **Name** | `motordereservas-api` |
   | **Region** | Oregon (US West) u otra cercana |
   | **Branch** | `main` |
   | **Root Directory** | `api` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | `Free` |

4. **Environment Variables** (antes de hacer Deploy):
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `JWT_SECRET`
   - `JWT_EXPIRATION` (ej: `7d`)
   - `NODE_ENV=production`
   - `FRONTEND_URL` (URL de Vercel cuando la tengas; provisional `http://localhost:5173`)
   - `PORT` lo inyecta Render automáticamente; `server.js` ya usa `process.env.PORT`.

5. Click **Create Web Service**. El primer build tarda ~2–4 min.
6. Render asigna automáticamente una URL pública: `https://<service-name>.onrender.com`.
7. Probar: `GET https://<service-name>.onrender.com/api/health`.

**Auto-deploy:** Render hace redeploy automático en cada `git push` a `main`.

### Deploy Frontend en Vercel

1. Ir a https://vercel.com → **Add New… → Project** → importar el repo de GitHub.
2. **Configure Project**:
   - **Root Directory**: `web`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Environment Variables**:
   - `VITE_API_URL=https://<service-name>.onrender.com/api`
4. Click **Deploy**.
5. **Dominio personalizado** (opcional): Project → Settings → Domains → Add → seguir las instrucciones DNS.
6. Tras desplegar, **volver a Render** y actualizar `FRONTEND_URL` con la URL final de Vercel (necesario para CORS).

---

## 4.7 Checklist final

### Base de datos
- [ ] SQL de la tabla `profiles` ejecutado en Supabase sin errores.
- [ ] Índices `idx_profiles_user_id`, `idx_profiles_professional_type`, `idx_profiles_specialization` creados.
- [ ] Trigger `update_profiles_updated_at` activo.

### Backend
- [ ] `api/src/controllers/profile.controller.js` creado.
- [ ] `api/src/middleware/validate-profile.js` creado.
- [ ] `api/src/routes/profile.routes.js` creado.
- [ ] `api/server.js` registra `app.use('/api/profiles', profileRoutes)`.
- [ ] `npm run dev` arranca sin errores y muestra `✅ Rutas de perfiles cargadas`.

### Endpoints (Thunder Client)
- [ ] `POST /api/profiles` con token → `201` y devuelve `id`.
- [ ] `POST /api/profiles` sin token → `401`.
- [ ] `POST /api/profiles` con datos inválidos → `400` con `errors`.
- [ ] `PUT /api/profiles` con token → `200`, `message: "Perfil actualizado"`.
- [ ] `GET /api/profiles/me` con token → `200` con el perfil propio.
- [ ] `GET /api/profiles/:id` sin auth → `200`.
- [ ] `GET /api/profiles` sin auth → `200` con `items`, `page`, `limit`, `total`.
- [ ] Filtros (`professional_type`, `specialization`, `min_rate`, `max_rate`, `min_experience`) devuelven resultados coherentes.

### Git
- [ ] `.gitignore` en la raíz no commitea `node_modules/` ni `.env`.
- [ ] Repo creado en GitHub y `git push -u origin main` exitoso.

### Deploy
- [ ] Render: servicio levantado, `GET /api/health` responde `200`.
- [ ] Render: variables de entorno completas (Supabase, JWT, FRONTEND_URL).
- [ ] Vercel: build exitoso y app accesible en su dominio.
- [ ] Vercel ↔ Render: requests del frontend al backend funcionan (sin errores CORS).


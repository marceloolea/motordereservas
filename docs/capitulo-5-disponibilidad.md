# Capítulo 5: Sistema de Disponibilidad

## 5.1 Arquitectura

```
Cliente HTTP
   │
   ▼
/api/availability
   ├─ /schedules*        (CRUD patrones semanales, auth)
   ├─ /exceptions*       (CRUD overrides por fecha, auth)
   └─ /:userId/slots     (público: genera slots calculados)
                  │
                  ▼
        availability.service.js   ──►  algoritmo de slots
                                       (patrón − bloqueos + adiciones)
```

Capa | Archivo | Responsabilidad
---- | ------- | ---------------
Ruta | `api/src/routes/availability.routes.js` | Define endpoints
Auth | `auth.middleware.js` | JWT
Validación | `api/src/middleware/validate-availability.js` | Schedules / Exceptions / Query
Controller | `api/src/controllers/availability.controller.js` | Queries Supabase
Service | `api/src/services/availability.service.js` | Generación pura de slots (sin DB)
DB | tablas `availability_schedules`, `availability_exceptions`, columna `profiles.slot_duration_minutes` | Persistencia

Modelo **híbrido**:
- **Patrón semanal recurrente** (lunes 9–13, miércoles 14–18, etc.) en `availability_schedules`.
- **Excepciones puntuales** en `availability_exceptions`:
  - `type='block'`: bloquea un rango o todo el día.
  - `type='add'`: añade disponibilidad puntual.

Duración del slot: **fija por profesional** (`profiles.slot_duration_minutes`, default 60).
Zona horaria: **`America/Santiago`** (Chile). DB almacena `DATE`/`TIME` "naïve".

---

## 5.2 Base de datos (Supabase)

Ejecutar en SQL Editor de Supabase:

```sql
-- 1. Agregar slot_duration_minutes a profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS slot_duration_minutes INTEGER NOT NULL DEFAULT 60
CHECK (slot_duration_minutes > 0 AND slot_duration_minutes <= 480);

-- 2. Patrones semanales recurrentes
CREATE TABLE IF NOT EXISTS availability_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL
    REFERENCES profiles(user_id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT chk_sched_times CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_sched_user_id ON availability_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_sched_user_dow ON availability_schedules(user_id, day_of_week);

DROP TRIGGER IF EXISTS update_schedules_updated_at ON availability_schedules;
CREATE TRIGGER update_schedules_updated_at
BEFORE UPDATE ON availability_schedules
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Excepciones por fecha
CREATE TABLE IF NOT EXISTS availability_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL
    REFERENCES profiles(user_id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('block', 'add')),
  start_time TIME,
  end_time TIME,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT chk_exc_times CHECK (
    (start_time IS NULL AND end_time IS NULL)
    OR (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
  ),
  CONSTRAINT chk_exc_add_requires_times CHECK (
    type <> 'add' OR (start_time IS NOT NULL AND end_time IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_exc_user_id ON availability_exceptions(user_id);
CREATE INDEX IF NOT EXISTS idx_exc_user_date ON availability_exceptions(user_id, exception_date);

DROP TRIGGER IF EXISTS update_exceptions_updated_at ON availability_exceptions;
CREATE TRIGGER update_exceptions_updated_at
BEFORE UPDATE ON availability_exceptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 5.3 Endpoints

| Método | Ruta | Auth | Body / Query |
| ------ | ---- | ---- | ------------ |
| POST   | `/api/availability/schedules`         | ✅ | `{ day_of_week, start_time, end_time, is_active? }` |
| GET    | `/api/availability/schedules/me`      | ✅ | — |
| PUT    | `/api/availability/schedules/:id`     | ✅ | igual al POST |
| DELETE | `/api/availability/schedules/:id`     | ✅ | — |
| POST   | `/api/availability/exceptions`        | ✅ | `{ exception_date, type, start_time?, end_time?, reason? }` |
| GET    | `/api/availability/exceptions/me`     | ✅ | — |
| DELETE | `/api/availability/exceptions/:id`    | ✅ | — |
| GET    | `/api/availability/:userId/slots`     | ❌ | `?from=YYYY-MM-DD&to=YYYY-MM-DD` (máx 90 días) |

**Notas**:
- `day_of_week`: `0=domingo`, `1=lunes`, …, `6=sábado`.
- `start_time`/`end_time` en formato `HH:MM`.
- Solo se puede crear disponibilidad si el usuario ya tiene perfil (FK a `profiles.user_id`).
- Los slots se generan en **bloques exactos** de `slot_duration_minutes`. Si sobran minutos al final de una franja, se descartan.

---

## 5.4 Algoritmo de generación de slots

Para cada fecha entre `from` y `to`:

1. Calcular `day_of_week` (0–6).
2. Tomar las franjas semanales `is_active=true` que coincidan.
3. Aplicar excepciones del día:
   - `type='block'` con `start_time=NULL` → **descartar todo el día**.
   - `type='block'` con tiempos → **restar** ese rango.
   - `type='add'` → **agregar** ese rango.
4. Mergear rangos solapados.
5. Cortar cada rango en bloques de `slot_duration_minutes`. Restos no llenan slot → se descartan.

Implementado en `availability.service.js`: funciones puras (`generateSlots`, `subtractRange`, `mergeRanges`).

---

## 5.5 Casos de prueba (Thunder Client)

Variables: `{{baseUrl}}=http://localhost:3000`, `{{token}}` = JWT del profesional, `{{userId}}` = su `users.id`.

### Setup previo
Asegurate de que el usuario tiene un perfil (Cap 4) y opcionalmente actualizá `slot_duration_minutes`:

```http
PUT {{baseUrl}}/api/profiles
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "professional_type": "psychologist",
  "specialization": "Terapia Cognitivo-Conductual",
  "slot_duration_minutes": 60
}
```

### 1) Crear franja semanal (lunes 9:00–13:00)
```http
POST {{baseUrl}}/api/availability/schedules
Authorization: Bearer {{token}}

{
  "day_of_week": 1,
  "start_time": "09:00",
  "end_time": "13:00"
}
```
Esperado: `201`.

### 2) Crear franja (miércoles 14:00–18:00)
```http
POST {{baseUrl}}/api/availability/schedules
Authorization: Bearer {{token}}

{ "day_of_week": 3, "start_time": "14:00", "end_time": "18:00" }
```

### 3) Listar mis franjas
```http
GET {{baseUrl}}/api/availability/schedules/me
Authorization: Bearer {{token}}
```
Esperado: `200` con array ordenado por día y hora.

### 4) Actualizar franja
```http
PUT {{baseUrl}}/api/availability/schedules/{scheduleId}
Authorization: Bearer {{token}}

{ "day_of_week": 1, "start_time": "10:00", "end_time": "13:00", "is_active": true }
```

### 5) Excepción: bloquear día entero (feriado)
```http
POST {{baseUrl}}/api/availability/exceptions
Authorization: Bearer {{token}}

{ "exception_date": "2026-05-25", "type": "block", "reason": "Feriado" }
```

### 6) Excepción: bloquear solo un rango
```http
POST {{baseUrl}}/api/availability/exceptions
Authorization: Bearer {{token}}

{
  "exception_date": "2026-05-26",
  "type": "block",
  "start_time": "10:00",
  "end_time": "11:00",
  "reason": "Reunión interna"
}
```

### 7) Excepción: agregar disponibilidad puntual (sábado especial)
```http
POST {{baseUrl}}/api/availability/exceptions
Authorization: Bearer {{token}}

{
  "exception_date": "2026-05-30",
  "type": "add",
  "start_time": "09:00",
  "end_time": "12:00"
}
```

### 8) Listar mis excepciones
```http
GET {{baseUrl}}/api/availability/exceptions/me
Authorization: Bearer {{token}}
```

### 9) Generar slots públicos (sin auth)
```http
GET {{baseUrl}}/api/availability/{{userId}}/slots?from=2026-05-18&to=2026-05-31
```
Esperado: `200` con `{ slots: [...], total, timezone: "America/Santiago", slot_duration_minutes: 60 }`.

### 10) Validaciones (deben fallar)
- POST schedule con `day_of_week: 7` → `400`.
- POST schedule con `end_time` ≤ `start_time` → `400`.
- POST exception `type: "add"` sin `start_time` → `400`.
- GET slots con rango > 90 días → `400`.
- POST schedule sin perfil creado → `400` "Debes crear tu perfil...".

---

## 5.6 Troubleshooting

| Síntoma | Causa | Solución |
| ------- | ----- | -------- |
| `violates foreign key constraint ... availability_schedules_user_id_fkey` | El usuario no tiene perfil | Crear perfil en `POST /api/profiles` primero |
| `chk_sched_times` constraint violado | end_time ≤ start_time | Revisar formato HH:MM y orden |
| `chk_exc_add_requires_times` violado | type=add sin times | Enviar start_time y end_time |
| Slots vacíos | Ningún schedule activo para ese día o todo bloqueado | Revisar `is_active` y excepciones del rango |
| Slots con horarios "raros" | Confusión de TZ | DB guarda hora local Chile; el cliente debe interpretarla como `America/Santiago` |
| `el rango máximo permitido es 90 días` | `to - from > 90` | Pedir en tramos más cortos |

---

## 5.7 Checklist

- [ ] SQL ejecutado (1 ALTER + 2 CREATE TABLE) sin errores.
- [ ] `npm run dev` muestra `✅ Rutas de disponibilidad cargadas`.
- [ ] Profile updated con `slot_duration_minutes`.
- [ ] CRUD de schedules funcional (4 endpoints).
- [ ] CRUD de exceptions funcional (3 endpoints).
- [ ] `GET /:userId/slots` retorna slots coherentes con las franjas + excepciones.
- [ ] Validaciones devuelven `400` con `errors[]`.
- [ ] Commit + push a GitHub.
- [ ] Render redeploy automático tras push (verificar en dashboard de Render).
- [ ] `GET https://motordereservas-api.onrender.com/api/health` responde `200` tras el redeploy.


# Capítulo 6: Sistema de Reservas (Bookings)

## 6.1 Arquitectura

```
Cliente HTTP
   │
   ▼
/api/bookings
   ├─ POST   /                   (cliente reserva)
   ├─ GET    /me                 (mis reservas, como client o professional)
   ├─ GET    /:id                (detalle, solo partes involucradas)
   ├─ PATCH  /:id/confirm        (profesional confirma)
   ├─ PATCH  /:id/cancel         (cliente o profesional cancela)
   └─ PATCH  /:id/complete       (profesional marca completada)

         + impacto en /api/availability/:userId/slots
           → cada slot ahora trae is_booked (true|false)
```

Reglas de negocio implementadas:
1. **Estado inicial siempre `pending`** — el profesional confirma manualmente.
2. **Validación de slot**: el horario reservado debe coincidir con un slot generado por el algoritmo del Cap 5.
3. **Validación de overlap**: no se permite crear una reserva si solapa con otra en estado `pending`/`confirmed` del mismo profesional.
4. **No reservar en pasado** (fecha < hoy en hora Chile).
5. **No auto-reserva** (`client_id != professional_id`).
6. **Cancelación libre**: cualquier parte puede cancelar mientras la reserva esté en `pending` o `confirmed`.
7. **Slots ocupados en endpoint público**: aparecen con `is_booked: true` (no se omiten).

Estados:
```
pending ──(profesional confirma)──► confirmed ──(profesional)──► completed
   │                                    │
   └─────(cualquier parte cancela)──────┴──► cancelled
```

---

## 6.2 Base de datos (Supabase)

Ejecutar en SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL
    REFERENCES users(id) ON DELETE RESTRICT,
  professional_id UUID NOT NULL
    REFERENCES profiles(user_id) ON DELETE RESTRICT,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT CHECK (notes IS NULL OR length(notes) <= 1000),
  cancellation_reason TEXT CHECK (cancellation_reason IS NULL OR length(cancellation_reason) <= 500),
  cancelled_by UUID REFERENCES users(id) ON DELETE SET NULL,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT chk_booking_times CHECK (end_time > start_time),
  CONSTRAINT chk_client_not_professional CHECK (client_id <> professional_id)
);

CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_professional ON bookings(professional_id);
CREATE INDEX IF NOT EXISTS idx_bookings_prof_date ON bookings(professional_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

Verificación:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;
-- Esperado: availability_exceptions, availability_schedules, bookings, profiles, users
```

---

## 6.3 Endpoints

| Método | Ruta | Auth | Quién | Body / Query |
| ------ | ---- | ---- | ----- | ------------ |
| POST | `/api/bookings` | ✅ | Cliente | `{ professional_id, booking_date, start_time, notes? }` |
| GET | `/api/bookings/me` | ✅ | Cualquiera | `?role=professional` para verlas como profesional. `?from=`, `?to=`, `?status=` opcionales |
| GET | `/api/bookings/:id` | ✅ | Partes involucradas | — |
| PATCH | `/api/bookings/:id/confirm` | ✅ | Profesional | — |
| PATCH | `/api/bookings/:id/cancel` | ✅ | Cliente o Profesional | `{ reason? }` |
| PATCH | `/api/bookings/:id/complete` | ✅ | Profesional | — |

**Comportamiento del endpoint de slots (Cap 5)**: el GET público `/api/availability/:userId/slots` ahora devuelve cada slot con un flag `is_booked: boolean`. El frontend decide si mostrarlo deshabilitado o filtrarlo.

### POST /api/bookings — flujo
1. Verificar `client_id != professional_id`.
2. Verificar fecha no pasada (hora Chile).
3. Cargar perfil del profesional (incluye `slot_duration_minutes`).
4. Calcular `end_time = start_time + slot_duration_minutes`.
5. Cargar schedules + exceptions del profesional para esa fecha.
6. Validar que el slot pedido **coincide exactamente** con uno generado.
7. Validar que no haya overlap con otra reserva activa.
8. Insertar con `status='pending'`.

---

## 6.4 Casos de prueba (Thunder Client)

Variables:
- `baseUrl` = `https://motordereservas-api.onrender.com`
- `tokenClient` = JWT de un usuario cliente
- `tokenPro` = JWT del profesional
- `professionalId` = `d1dc3cdd-350b-4091-9ff5-b2c0692ec8eb` (tu psicólogo)

### Setup previo
Asegurate de que el profesional ya tiene franjas (Cap 5). Ejemplo: lunes 09:00–13:00.

### 1) Cliente crea reserva
```http
POST {{baseUrl}}/api/bookings
Authorization: Bearer {{tokenClient}}
Content-Type: application/json

{
  "professional_id": "{{professionalId}}",
  "booking_date": "2026-05-25",
  "start_time": "10:00",
  "notes": "Primera consulta, refiero ansiedad."
}
```
Esperado: `201` con `status: "pending"` y `end_time: "11:00"`.

### 2) Verificar que el slot aparece ocupado
```http
GET {{baseUrl}}/api/availability/{{professionalId}}/slots?from=2026-05-25&to=2026-05-25
```
Esperado: el slot 10:00–11:00 con `is_booked: true`. El resto `false`.

### 3) Intentar doble reserva en el mismo slot
Repetir el request del paso 1 con otro cliente (o el mismo).
Esperado: `409 Conflict`, `"Ese horario ya está reservado"`.

### 4) Reservar un slot inexistente (fuera del patrón semanal)
```http
POST {{baseUrl}}/api/bookings
Authorization: Bearer {{tokenClient}}

{
  "professional_id": "{{professionalId}}",
  "booking_date": "2026-05-27",
  "start_time": "10:00"
}
```
Como el psicólogo solo tiene lunes (día 1), un miércoles (día 3) sin franja:
Esperado: `400`, `"El horario solicitado no coincide con un slot disponible"`.

### 5) Reservar en fecha pasada
```http
POST {{baseUrl}}/api/bookings
Authorization: Bearer {{tokenClient}}

{
  "professional_id": "{{professionalId}}",
  "booking_date": "2020-01-01",
  "start_time": "10:00"
}
```
Esperado: `400`, `"No se puede reservar en fechas pasadas"`.

### 6) Auto-reserva
Logueate como el profesional e intentá reservar a vos mismo.
Esperado: `400`, `"No podés reservarte a vos mismo"`.

### 7) Listar mis reservas como cliente
```http
GET {{baseUrl}}/api/bookings/me
Authorization: Bearer {{tokenClient}}
```
Esperado: `200` con array de reservas hechas por el cliente.

### 8) Listar mis reservas como profesional
```http
GET {{baseUrl}}/api/bookings/me?role=professional
Authorization: Bearer {{tokenPro}}
```
Esperado: `200` con array de reservas recibidas por el profesional.

### 9) Filtros
```http
GET {{baseUrl}}/api/bookings/me?role=professional&status=pending&from=2026-05-01&to=2026-05-31
Authorization: Bearer {{tokenPro}}
```

### 10) Detalle (acceso permitido)
```http
GET {{baseUrl}}/api/bookings/{{bookingId}}
Authorization: Bearer {{tokenClient}}
```
Esperado: `200` con `client` y `professional` embebidos.

### 11) Detalle (acceso denegado)
Mismo request pero con token de un usuario que **no es** ni cliente ni profesional de esa reserva.
Esperado: `403`, `"No tenés acceso a esta reserva"`.

### 12) Profesional confirma
```http
PATCH {{baseUrl}}/api/bookings/{{bookingId}}/confirm
Authorization: Bearer {{tokenPro}}
```
Esperado: `200` con `status: "confirmed"` y `confirmed_at` poblado.

### 13) Cliente intenta confirmar (denegado)
```http
PATCH {{baseUrl}}/api/bookings/{{bookingId}}/confirm
Authorization: Bearer {{tokenClient}}
```
Esperado: `403`, `"Solo el profesional puede confirmar"`.

### 14) Cancelación por parte del cliente
```http
PATCH {{baseUrl}}/api/bookings/{{bookingId}}/cancel
Authorization: Bearer {{tokenClient}}

{ "reason": "Me surgió un imprevisto" }
```
Esperado: `200` con `status: "cancelled"`, `cancelled_by`, `cancelled_at`, `cancellation_reason`.

### 15) Confirmar una reserva cancelada (debe fallar)
```http
PATCH {{baseUrl}}/api/bookings/{{bookingId}}/confirm
Authorization: Bearer {{tokenPro}}
```
Esperado: `400`, `"No se puede confirmar una reserva en estado 'cancelled'"`.

### 16) Completar una reserva confirmada
Crear y confirmar otra reserva, luego:
```http
PATCH {{baseUrl}}/api/bookings/{{bookingId}}/complete
Authorization: Bearer {{tokenPro}}
```
Esperado: `200` con `status: "completed"` y `completed_at`.

---

## 6.5 Troubleshooting

| Síntoma | Causa | Solución |
| ------- | ----- | -------- |
| `El horario solicitado no coincide con un slot disponible` | start_time no cae exactamente en un slot generado | Pedir primero `GET /availability/:userId/slots` y usar uno de los `start_time` devueltos con `is_booked: false` |
| `Ese horario ya está reservado` (`409`) | Existe otra reserva activa solapando | Elegir otro slot |
| `chk_client_not_professional` violado | El cliente y el profesional son el mismo `id` | Loguearse con otra cuenta |
| `violates foreign key constraint ... bookings_professional_id_fkey` | El professional_id no tiene perfil | El profesional debe crear su perfil primero |
| `column "is_booked" does not exist` (en frontend) | Caché del frontend | Recargar; `is_booked` se calcula en la API, no en la BD |
| Reservas no aparecen en `/me` | El JWT pertenece a otro user_id | Verificar token; si sos profesional, agregar `?role=professional` |
| `Could not find a relationship between 'bookings' and 'profiles' in the schema cache` (PGRST200) | Existe una tabla `bookings` previa con un esquema diferente (FK apuntando a otra tabla). El `CREATE TABLE IF NOT EXISTS` no la sobrescribe. | `DROP TABLE bookings CASCADE;` en Supabase y re-ejecutar el SQL del Cap 6 |
| `column "cancelled_at" does not exist` o similar al cancelar/confirmar | Tabla `bookings` existente pero con columnas viejas | Mismo fix: `DROP TABLE bookings CASCADE;` y re-ejecutar el SQL |

---

## 6.6 Checklist final

### Base de datos
- [ ] SQL del Cap 6 ejecutado en Supabase sin errores.
- [ ] Tabla `bookings` visible con 4 índices y trigger.

### Backend
- [ ] `api/src/services/booking.service.js` creado.
- [ ] `api/src/middleware/validate-booking.js` creado.
- [ ] `api/src/controllers/booking.controller.js` creado (6 funciones).
- [ ] `api/src/routes/booking.routes.js` creado.
- [ ] `api/server.js` registra `app.use('/api/bookings', bookingRoutes)`.
- [ ] `availability.service.js` ahora retorna `is_booked` por slot.
- [ ] `availability.controller.js getSlots` consulta `bookings` antes de generar.
- [ ] `npm run dev` arranca y muestra `✅ Rutas de reservas cargadas`.

### Endpoints
- [ ] Crear reserva válida → `201` `status: "pending"`.
- [ ] Doble reserva mismo slot → `409`.
- [ ] Slot inexistente → `400`.
- [ ] Fecha pasada → `400`.
- [ ] Auto-reserva → `400`.
- [ ] Listar como cliente → `200`.
- [ ] Listar como profesional (`?role=professional`) → `200`.
- [ ] Detalle por tercero → `403`.
- [ ] Confirmar (pro) → `200`.
- [ ] Confirmar (cliente) → `403`.
- [ ] Cancelar (cualquiera) → `200`.
- [ ] Confirmar tras cancelar → `400`.
- [ ] Completar tras confirmar → `200`.
- [ ] `GET /availability/:userId/slots` ahora marca `is_booked: true` en los reservados.

### Deploy
- [ ] Commit + push → Render redeploy automático.
- [ ] `GET https://motordereservas-api.onrender.com/api/health` `200` tras redeploy.

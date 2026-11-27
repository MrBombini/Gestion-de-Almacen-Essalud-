# Recetas Médicas

> **Prefijo:** `/api/prescriptions`
> **Roles:** `Operator`, `Administrator`, `Engineer`

Gestiona las recetas médicas de los pacientes PADOMI. Una receta válida y activa es **obligatoria** para realizar cualquier intercambio o trasiego a un paciente.

---

## Ciclo de Vida de una Receta

```
Creación (status: active)
       │
       ├──▶ Usada en intercambios/trasiegos mientras esté activa
       │
       ├──▶ Expirada manualmente (status: expired)
       │
       └──▶ Vencida automáticamente (expires_at < fecha actual)
```

---

## POST `/api/prescriptions` — Crear receta

> **Nota:** Normalmente las recetas se crean automáticamente junto con el paciente vía `POST /api/patients`. Este endpoint existe para agregar recetas adicionales a un paciente existente.

**Request Body:**
```json
{
    "patient_id": 5,
    "dosage": "3 L/min",
    "usage_time": "24 horas/día",
    "expires_at": "2026-12-31",
    "authorization_date": "2026-01-15",
    "promissory_note": "PAG-2026-0042",
    "status": "active"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `patient_id` | integer | ✅ | ID del paciente titular |
| `dosage` | string | ✅ | Dosis prescrita (ej. "2 L/min") |
| `usage_time` | string | ❌ | Tiempo de uso diario (ej. "16 horas/día") |
| `expires_at` | date | ❌ | Fecha de vencimiento (`YYYY-MM-DD`) |
| `authorization_date` | date | ❌ | Fecha de autorización médica |
| `promissory_note` | string | ❌ | Número de pagaré (máx. 100) |
| `status` | string | ✅ | `active`, `expired`, `inactive` |

**Respuesta `201 Created`:**
```json
{
    "id": 25,
    "patient_id": 5,
    "service_id": 1,
    "dosage": "3 L/min",
    "usage_time": "24 horas/día",
    "expires_at": "2026-12-31",
    "issued_at": "2026-05-15",
    "authorization_date": "2026-01-15",
    "promissory_note": "PAG-2026-0042",
    "status": "active",
    "created_at": "2026-05-15T10:00:00.000000Z"
}
```

---

## PUT `/api/prescriptions/{id}` — Actualizar receta

Permite cambiar los datos o el estado de una receta existente.

**Request Body:** Mismos campos que `POST` excepto `patient_id`.

**Caso de uso típico:** Marcar una receta como expirada cuando llega una nueva:
```json
{
    "dosage": "3 L/min",
    "status": "expired"
}
```

**Respuesta `200 OK`:** La receta actualizada.

---

## DELETE `/api/prescriptions/{id}` — Eliminar receta

**Respuesta `200 OK`:**
```json
{ "message": "Receta eliminada correctamente." }
```

---

## Validación en Intercambios

Cuando se realiza un `POST /api/inventory/exchange` o `POST /api/inventory/decanting` con un `patient_id`, el sistema verifica:

1. Que `prescription_id` esté presente.
2. Que la receta exista en la BD.
3. Que la fecha actual no supere `expires_at`.

Si alguna condición falla, responde:
```json
{
    "message": "La receta del paciente ha expirado o es inválida."
}
```

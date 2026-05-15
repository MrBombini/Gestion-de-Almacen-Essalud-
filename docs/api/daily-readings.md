# Lecturas Diarias del Flujómetro

> **Prefijo:** `/api/daily-readings`
> **Roles:** `Operator`, `Administrator`, `Engineer`

Registra las lecturas del flujómetro acumulado y el nivel del tanque por turno. El sistema calcula automáticamente el consumo comparando la lectura actual con la anterior.

---

## GET `/api/daily-readings` — Listar todas

Devuelve todas las lecturas ordenadas por fecha descendente (más reciente primero).

**Respuesta `200 OK`:**
```json
[
    {
        "id": 12,
        "user_id": 2,
        "reading_date": "2026-05-15",
        "shift": "Morning",
        "tank_level": 78.50,
        "flow_meter_reading": 12450.00,
        "calculated_consumption": 85.00,
        "created_at": "2026-05-15T08:00:00.000000Z",
        "user": {
            "id": 2,
            "name": "Carlos López",
            "operator_code": "OP002"
        }
    }
]
```

---

## POST `/api/daily-readings` — Registrar nueva lectura

El sistema calcula automáticamente el consumo restando la lectura anterior a la actual.

**Request Body:**
```json
{
    "reading_date": "2026-05-15",
    "shift": "Morning",
    "tank_level": 78.50,
    "flow_meter_reading": 12450.00
}
```

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| `reading_date` | date | ✅ | Formato `YYYY-MM-DD` |
| `shift` | string | ✅ | `Morning`, `Afternoon`, `Night` |
| `tank_level` | decimal | ✅ | Porcentaje del tanque (0 - 100) |
| `flow_meter_reading` | decimal | ✅ | Lectura acumulada del flujómetro (≥ 0) |

**Cálculo automático del consumo:**
```
calculated_consumption = flow_meter_reading - ultima_lectura.flow_meter_reading
(Si el resultado es negativo, se registra 0)
```

**Respuesta `201 Created`:**
```json
{
    "id": 13,
    "user_id": 2,
    "reading_date": "2026-05-15",
    "shift": "Afternoon",
    "tank_level": 65.00,
    "flow_meter_reading": 12535.00,
    "calculated_consumption": 85.00,
    "created_at": "2026-05-15T14:00:00.000000Z",
    "user": { "id": 2, "name": "Carlos López" }
}
```

---

## PUT `/api/daily-readings/{id}` — Actualizar lectura

Recalcula el consumo comparando con la lectura inmediatamente anterior por ID.

**Request Body:** Mismos campos que `POST`.

**Respuesta `200 OK`:** La lectura actualizada con el consumo recalculado.

---

## DELETE `/api/daily-readings/{id}` — Eliminar

**Respuesta `200 OK`:**
```json
{ "message": "Lectura eliminada correctamente." }
```

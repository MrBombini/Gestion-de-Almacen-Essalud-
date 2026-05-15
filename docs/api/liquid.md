# Módulo de Oxígeno Líquido

> **Prefijo:** `/api/liquid`
> **Roles:** `Operator`, `Administrator`, `Engineer`

Gestiona las operaciones relacionadas con el tanque de oxígeno líquido del almacén: recargas del tanque y lecturas de su estado.

---

## POST `/api/liquid/refill` — Registrar Recarga del Tanque

Registra cuando el proveedor recarga el tanque principal de oxígeno líquido del almacén.

### Request Body

```json
{
    "supplier_id": 1,
    "level_before": 15.5,
    "level_after": 98.0,
    "weight_before": 2200,
    "weight_after": 14800,
    "ticket_amount": 8500.00,
    "reference_document": "FAC-2026-0312",
    "refilled_at": "2026-05-15"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `supplier_id` | integer | ✅ | ID del proveedor que realiza la recarga |
| `level_before` | decimal | ✅ | Nivel del tanque antes de la recarga (%) |
| `level_after` | decimal | ✅ | Nivel del tanque después de la recarga (%) |
| `weight_before` | decimal | ✅ | Peso del tanque antes (kg) |
| `weight_after` | decimal | ✅ | Peso del tanque después (kg) |
| `ticket_amount` | decimal | ❌ | Monto del ticket/factura (S/) |
| `reference_document` | string | ❌ | Número de guía o factura |
| `refilled_at` | date | ✅ | Fecha de la recarga (`YYYY-MM-DD`) |

### Respuesta `201 Created`

```json
{
    "id": 8,
    "supplier_id": 1,
    "user_id": 2,
    "level_before": 15.5,
    "level_after": 98.0,
    "weight_before": 2200,
    "weight_after": 14800,
    "ticket_amount": 8500.00,
    "reference_document": "FAC-2026-0312",
    "refilled_at": "2026-05-15",
    "created_at": "2026-05-15T09:15:00.000000Z",
    "updated_at": "2026-05-15T09:15:00.000000Z"
}
```

---

## POST `/api/liquid/daily-reading` — Registrar Lectura Diaria (Módulo Líquido)

> **Nota:** Este endpoint usa el modelo `DailyReading` pero con campos específicos para el módulo líquido. Es diferente al endpoint `POST /api/daily-readings` que registra la lectura del flujómetro.

### Request Body

```json
{
    "ext_tank_reserve": 75.5,
    "int_warehouse_consumption": 120.0,
    "calculated_consumption": 45.5,
    "reading_date": "2026-05-15",
    "shift": "Morning"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `ext_tank_reserve` | decimal | ✅ | Reserva del tanque exterior (%) |
| `int_warehouse_consumption` | decimal | ✅ | Consumo interno del almacén |
| `calculated_consumption` | decimal | ✅ | Consumo calculado del período |
| `reading_date` | date | ✅ | Fecha de la lectura (`YYYY-MM-DD`) |
| `shift` | string | ✅ | `Morning`, `Afternoon`, `Night` |

### Respuesta `201 Created`

```json
{
    "id": 45,
    "user_id": 2,
    "ext_tank_reserve": 75.5,
    "int_warehouse_consumption": 120.0,
    "calculated_consumption": 45.5,
    "reading_date": "2026-05-15",
    "shift": "Morning",
    "created_at": "2026-05-15T07:30:00.000000Z",
    "updated_at": "2026-05-15T07:30:00.000000Z"
}
```

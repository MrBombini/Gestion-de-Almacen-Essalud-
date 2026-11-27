# Catálogos

> **Roles:** `Operator`, `Administrator`, `Engineer`
> Todos los endpoints requieren `Authorization: Bearer {token}`

Los catálogos son los datos maestros del sistema. Siguen un patrón CRUD estándar (RESTful apiResource).

---

## Pacientes — `/api/patients`

Gestiona el padrón de pacientes del programa PADOMI que reciben oxígeno a domicilio.

### GET `/api/patients` — Listar todos

**Respuesta `200 OK`:**
```json
[
    {
        "id": 1,
        "full_name": "María García López",
        "dni": "12345678",
        "trasiego_code": "TRS-001",
        "exchange_code": "INT-001",
        "address": "Av. Los Álamos 123, Miraflores",
        "phone1": "987654321",
        "phone2": null,
        "deleted_at": null,
        "prescriptions": [
            {
                "id": 1,
                "patient_id": 1,
                "dosage": "2 L/min",
                "usage_time": "16 horas/día",
                "expires_at": "2026-12-31",
                "status": "active"
            }
        ]
    }
]
```

### POST `/api/patients` — Crear paciente

**Request Body:**
```json
{
    "full_name": "María García López",
    "dni": "12345678",
    "trasiego_code": "TRS-001",
    "exchange_code": "INT-001",
    "address": "Av. Los Álamos 123, Miraflores",
    "phone1": "987654321",
    "phone2": null,
    "dosage": "2 L/min",
    "usage_time": "16 horas/día",
    "expires_at": "2026-12-31",
    "promissory_note": "PAG-2024-001",
    "authorization_date": "2026-01-01"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `full_name` | string | ✅ | Nombre completo (máx. 150 chars) |
| `dni` | string | ❌ | DNI único (máx. 15 chars) |
| `trasiego_code` | string | ❌ | Código de trasiego |
| `exchange_code` | string | ❌ | Código de intercambio |
| `address` | string | ❌ | Dirección del domicilio |
| `phone1` | string | ❌ | Teléfono principal |
| `phone2` | string | ❌ | Teléfono secundario |
| `dosage` | string | ❌ | Dosis de la receta (crea receta automáticamente) |
| `usage_time` | string | ❌ | Tiempo de uso diario |
| `expires_at` | date | ❌ | Vencimiento de la receta (`YYYY-MM-DD`) |
| `promissory_note` | string | ❌ | Número de pagaré |
| `authorization_date` | date | ❌ | Fecha de autorización |

> **Nota:** Si se envía `dosage` o `expires_at`, se crea automáticamente una receta inicial para el paciente.

**Respuesta `201 Created`:** El paciente con su receta incluida.

### GET `/api/patients/{id}` — Ver uno

**Respuesta `200 OK`:** Paciente con todas sus recetas.

### PUT `/api/patients/{id}` — Actualizar

Mismos campos que el `POST`. Actualiza también la receta activa del paciente.

### DELETE `/api/patients/{id}` — Eliminar (soft delete)

**Respuesta `200 OK`:**
```json
{ "message": "Patient deleted successfully." }
```

---

## Servicios Hospitalarios — `/api/services`

Gestiona los servicios del hospital (UCI, Emergencia, Pediatría, etc.).

### GET `/api/services` — Listar todos

**Respuesta `200 OK`:**
```json
[
    {
        "id": 1,
        "name": "UCI Adultos",
        "type": "Crítico",
        "beds": [
            { "id": 1, "bed_number": "UCI-01", "status": "occupied" },
            { "id": 2, "bed_number": "UCI-02", "status": "available" }
        ]
    }
]
```

### POST `/api/services` — Crear

```json
{
    "name": "UCI Adultos",
    "type": "Crítico"
}
```

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| `name` | string | ✅ | Único, máx. 100 chars |
| `type` | string | ✅ | Máx. 50 chars |

### PUT `/api/services/{id}` — Actualizar

Mismos campos que `POST`.

### DELETE `/api/services/{id}` — Eliminar

**Error `422`** si el servicio tiene camas o cilindros asignados:
```json
{
    "message": "No se puede eliminar: el servicio tiene 3 cama(s) asociada(s)."
}
```

---

## Camas — `/api/beds`

Gestiona las camas hospitalarias asociadas a un servicio.

### GET `/api/beds` — Listar todas

**Respuesta `200 OK`:**
```json
[
    {
        "id": 1,
        "service_id": 1,
        "bed_number": "UCI-01",
        "status": "occupied",
        "service": { "id": 1, "name": "UCI Adultos" }
    }
]
```

### POST `/api/beds` — Crear

```json
{
    "service_id": 1,
    "bed_number": "UCI-03",
    "status": "available"
}
```

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| `service_id` | integer | ✅ | Debe existir en `services` |
| `bed_number` | string | ✅ | Máx. 20 chars |
| `status` | string | ✅ | `available` o `occupied` |

### PUT `/api/beds/{id}` — Actualizar
### DELETE `/api/beds/{id}` — Eliminar

---

## Proveedores — `/api/suppliers`

Gestiona los proveedores de gas medicinal.

### GET `/api/suppliers` — Listar todos

**Respuesta `200 OK`:**
```json
[
    {
        "id": 1,
        "name": "AirGas Perú S.A.C.",
        "ruc": "20123456789",
        "address": "Av. Industrial 456, Ate",
        "phone": "01-456-7890",
        "email": "ventas@airgas.pe",
        "description": "Proveedor principal de O2 medicinal"
    }
]
```

### POST `/api/suppliers` — Crear

```json
{
    "name": "AirGas Perú S.A.C.",
    "ruc": "20123456789",
    "address": "Av. Industrial 456, Ate",
    "phone": "01-456-7890",
    "email": "ventas@airgas.pe",
    "description": "Proveedor principal de O2 medicinal"
}
```

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| `name` | string | ✅ | Único, máx. 100 chars |
| `ruc` | string | ❌ | Único, máx. 11 chars |
| `address` | string | ❌ | Máx. 255 chars |
| `phone` | string | ❌ | Máx. 20 chars |
| `email` | string | ❌ | Formato email válido |
| `description` | string | ❌ | Texto libre |

### DELETE `/api/suppliers/{id}` — Eliminar

**Error `422`** si el proveedor tiene balones asociados:
```json
{
    "message": "No se puede eliminar el proveedor porque tiene balones asociados."
}
```

---

## Tipos de Propiedad — `/api/ownership-types`

Define cómo se clasifican los balones según su propietario (EsSalud, Alquilado, Propio del paciente, etc.).

### GET `/api/ownership-types` — Listar todos

**Respuesta `200 OK`:**
```json
[
    {
        "id": 1,
        "name": "EsSalud",
        "description": "Balones de propiedad institucional",
        "cylinders_count": 45
    },
    {
        "id": 2,
        "name": "Alquilado",
        "description": "Balones en régimen de alquiler",
        "cylinders_count": 12
    }
]
```

### POST `/api/ownership-types` — Crear

```json
{
    "name": "Paciente PADOMI",
    "description": "Balón propiedad del paciente en programa PADOMI"
}
```

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| `name` | string | ✅ | Único, máx. 100 chars |
| `description` | string | ❌ | Máx. 255 chars |

### DELETE `/api/ownership-types/{id}` — Eliminar

**Error `422`** si tiene balones asignados:
```json
{
    "message": "No se puede eliminar: tiene 12 balón(es) asociado(s)."
}
```

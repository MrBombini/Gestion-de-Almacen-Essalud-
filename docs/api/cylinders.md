# Cilindros (Balones de Gas)

> **Prefijo:** `/api/cylinders`
> **Roles:** `Operator`, `Administrator`, `Engineer`
> **Modelo con Soft Deletes:** Los cilindros eliminados no se borran físicamente.

El cilindro es la entidad central del sistema. Cada balón tiene un número de serie único y su estado/ubicación se actualiza automáticamente con cada movimiento de inventario.

---

## GET `/api/cylinders` — Listar todos

Devuelve todos los cilindros activos con sus relaciones cargadas.

**Respuesta `200 OK`:**
```json
[
    {
        "id": 1,
        "serial_number": "EsSalud-O2-001",
        "barcode": "7891234560001",
        "supplier_id": 1,
        "ownership_type_id": 1,
        "gas_type": "O2",
        "capacity": 10.00,
        "status": "full",
        "location": "CENTRAL",
        "hydrostatic_test_date": "2024-06-01",
        "physical_condition": "Bueno",
        "current_patient_id": null,
        "current_service_id": null,
        "current_bed_id": null,
        "deleted_at": null,
        "supplier": {
            "id": 1,
            "name": "AirGas Perú S.A.C."
        },
        "ownership_type": {
            "id": 1,
            "name": "EsSalud"
        },
        "current_patient": null,
        "current_service": null,
        "current_bed": null
    }
]
```

---

## POST `/api/cylinders` — Registrar nuevo balón

**Request Body:**
```json
{
    "serial_number": "EsSalud-O2-042",
    "barcode": "7891234560042",
    "supplier_id": 1,
    "ownership_type_id": 1,
    "gas_type": "O2",
    "capacity": 10.00,
    "status": "full",
    "location": "CENTRAL",
    "hydrostatic_test_date": "2024-06-01",
    "physical_condition": "Nuevo"
}
```

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| `serial_number` | string | ✅ | Único en el sistema |
| `barcode` | string | ❌ | Único si se provee |
| `supplier_id` | integer | ✅ | Debe existir en `suppliers` |
| `ownership_type_id` | integer | ✅ | Debe existir en `ownership_types` |
| `patient_id` | integer | ❌ | Paciente propietario original |
| `service_id` | integer | ❌ | Servicio asignado original |
| `gas_type` | string | ✅ | Tipo de gas (ej. `O2`, `CO2`, `N2`) |
| `capacity` | decimal | ✅ | Capacidad en m³ |
| `status` | string | ✅ | `full`, `empty`, `in_use`, `lost` |
| `location` | string | ✅ | `CENTRAL`, `HOSPITALIZACION`, `PADOMI`, `ALMACEN`, `PROVEEDOR` |
| `hydrostatic_test_date` | date | ❌ | Fecha de prueba hidrostática |
| `physical_condition` | string | ❌ | Estado físico del balón |

**Respuesta `201 Created`:** El cilindro creado con sus relaciones.

---

## GET `/api/cylinders/{id}` — Ver uno

**Respuesta `200 OK`:** El cilindro con proveedor, tipo de propiedad y paciente asignado.

**Error `404`:**
```json
{ "message": "No query results for model [App\\Models\\Cylinder] 999" }
```

---

## PUT `/api/cylinders/{id}` — Actualizar

Mismos campos que `POST`. El `serial_number` y `barcode` verifican unicidad excluyendo el registro actual.

**Respuesta `200 OK`:** El cilindro actualizado.

---

## DELETE `/api/cylinders/{id}` — Eliminar (Soft Delete)

El cilindro no se elimina físicamente, solo se marca con `deleted_at`.

**Respuesta `200 OK`:**
```json
{ "message": "Cylinder deleted successfully." }
```

---

## Estados del Cilindro

| Estado (`status`) | Descripción | Ubicación típica |
|-------------------|-------------|------------------|
| `full` | Lleno, disponible | `CENTRAL` |
| `empty` | Vacío, pendiente de recarga | `CENTRAL` |
| `in_use` | En uso activo | `HOSPITALIZACION`, `PADOMI` |
| `in_transit` | En tránsito hacia proveedor | `PROVEEDOR` |
| `lost` | Extraviado | Cualquiera |

---

## Notas Importantes

> **Ubicación automática:** El campo `location` y `status` son actualizados automáticamente por el módulo de movimientos de inventario. No se deben modificar manualmente salvo en casos de corrección.

> **Soft Delete:** Un cilindro eliminado no aparece en los listados normales. Para auditoría, se puede acceder directamente con su ID si aún se conoce.

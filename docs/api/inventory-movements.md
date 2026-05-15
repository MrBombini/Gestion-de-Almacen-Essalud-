# Movimientos de Inventario

> **Prefijo:** `/api/inventory`
> **Roles:** `Operator`, `Administrator`, `Engineer`
> **Transaccional:** Todas las operaciones usan `DB::transaction()` para garantizar consistencia.

Este módulo es el **corazón del sistema**. Registra todos los movimientos de balones de gas entre el almacén, los servicios, los pacientes y los proveedores. Cada operación actualiza automáticamente el estado y ubicación de los cilindros involucrados.

---

## Tipos de Movimiento

| Tipo | Endpoint | Descripción |
|------|----------|-------------|
| `Exchange` | `POST /inventory/exchange` | Intercambio paciente/servicio (vacío por lleno) |
| `Decanting` | `POST /inventory/decanting` | Trasiego de oxígeno líquido a balón pequeño |
| `SupplierMovement` | `POST /inventory/supplier` | Movimiento con proveedor (entrada llenos / salida vacíos) |
| `ServiceBulkExchange` | `POST /inventory/periphery-exchange` | Intercambio masivo para servicios periféricos |
| `SupplierEntry` | `POST /inventory/supplier-entry` | Alias de SupplierMovement para entradas |

---

## POST `/api/inventory/exchange` — Intercambio de Balones

Registra el intercambio de un balón vacío que regresa del paciente/servicio por uno lleno que sale del almacén.

**Lógica de negocio:**
- El `cylinder_in` (balón vacío que **ingresa** al almacén) es **siempre requerido**.
- El `cylinder_out` (balón lleno que **sale** del almacén) es opcional — puede ser que el operador solo reciba sin entregar.
- Si el destino es un **paciente**, se requiere una `prescription_id` válida y no vencida.
- La ubicación del cilindro se actualiza automáticamente según el destino.

### Request Body

```json
{
    "patient_id": 1,
    "service_id": null,
    "bed_id": null,
    "prescription_id": 3,
    "cylinder_in": 15,
    "cylinder_out": 7,
    "shift": "Morning",
    "notes": "Intercambio domiciliario rutinario"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `patient_id` | integer | ❌* | ID del paciente (requiere `prescription_id`) |
| `service_id` | integer | ❌* | ID del servicio hospitalario |
| `bed_id` | integer | ❌ | ID de la cama específica |
| `prescription_id` | integer | ❌** | Requerido si `patient_id` está presente |
| `cylinder_in` | integer | ✅ | ID del balón vacío que REGRESA al almacén |
| `cylinder_out` | integer | ❌ | ID del balón lleno que SALE del almacén |
| `shift` | string | ✅ | `Morning`, `Afternoon`, `Night` |
| `notes` | string | ❌ | Observaciones del intercambio |

> *Al menos uno de `patient_id` o `service_id` es requerido.
> **Obligatorio si se especifica `patient_id`.

### Respuesta `201 Created`

```json
{
    "id": 42,
    "type": "Exchange",
    "shift": "Morning",
    "patient_id": 1,
    "service_id": null,
    "bed_id": null,
    "prescription_id": 3,
    "user_id": 2,
    "notes": "Intercambio domiciliario rutinario",
    "movement_at": "2026-05-15T08:30:00.000000Z",
    "cylinder_movements": [
        {
            "id": 83,
            "inventory_movement_id": 42,
            "cylinder_id": 15,
            "action": "Entry",
            "cylinder_status": "empty"
        },
        {
            "id": 84,
            "inventory_movement_id": 42,
            "cylinder_id": 7,
            "action": "Exit",
            "cylinder_status": "in_use"
        }
    ]
}
```

### Errores Específicos

```json
// 422 — Falta paciente O servicio
{ "message": "Debe seleccionar un Paciente o un Servicio." }

// 422 — Falta receta para paciente
{ "message": "Se requiere una receta activa para realizar un intercambio a un paciente." }

// 422 — Receta vencida
{ "message": "La receta del paciente ha expirado o es inválida." }
```

### Actualización automática de cilindros

| Cilindro | Nuevo Status | Nueva Ubicación |
|----------|-------------|-----------------|
| `cylinder_in` (entra vacío) | `empty` | `CENTRAL` |
| `cylinder_out` a paciente | `in_use` | `PADOMI` |
| `cylinder_out` a servicio | `in_use` | `HOSPITALIZACION` |

---

## POST `/api/inventory/decanting` — Trasiego de Oxígeno Líquido

Registra el llenado de un balón pequeño usando el tanque de oxígeno líquido del almacén.

### Request Body

```json
{
    "cylinder_id": 23,
    "refilled_amount": 8.5,
    "shift": "Afternoon",
    "patient_id": 5,
    "prescription_id": 8,
    "service_id": null,
    "bed_id": null,
    "manual_destination": null
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `cylinder_id` | integer | ✅ | ID del balón que se recarga |
| `refilled_amount` | decimal | ✅ | Cantidad recargada (m³ o L) |
| `shift` | string | ✅ | `Morning`, `Afternoon`, `Night` |
| `patient_id` | integer | ❌ | Paciente destino (requiere `prescription_id`) |
| `prescription_id` | integer | ❌ | Requerido si hay `patient_id` |
| `service_id` | integer | ❌ | Servicio destino |
| `bed_id` | integer | ❌ | Cama destino |
| `manual_destination` | string | ❌ | Destino libre (texto, máx. 150) |

### Respuesta `201 Created`

```json
{
    "id": 15,
    "cylinder_id": 23,
    "refilled_amount": 8.5,
    "shift": "Afternoon",
    "patient_id": 5,
    "service_id": null,
    "bed_id": null,
    "prescription_id": 8,
    "manual_destination": null,
    "user_id": 2,
    "decanted_at": "2026-05-15T14:20:00.000000Z"
}
```

### Actualización automática del cilindro

| Situación | Nuevo Status | Nueva Ubicación |
|-----------|-------------|-----------------|
| Destino: paciente | `in_use` | `PADOMI` |
| Destino: servicio | `in_use` | `HOSPITALIZACION` |
| Sin destino específico | `in_use` | `CENTRAL` |

---

## POST `/api/inventory/supplier` — Movimiento con Proveedor

Registra la devolución de balones vacíos al proveedor y/o la recepción de balones llenos desde el proveedor.

### Request Body

```json
{
    "supplier_id": 1,
    "reference_document": "GRE-2026-0042",
    "shift": "Morning",
    "cylinders_in": [5, 8, 12],
    "cylinders_out": [3, 7],
    "notes": "Recepción mensual de O2 medicinal"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `supplier_id` | integer | ✅ | ID del proveedor |
| `reference_document` | string | ✅ | Nº de guía de remisión (máx. 100) |
| `shift` | string | ✅ | `Morning`, `Afternoon`, `Night` |
| `cylinders_in` | array | ❌ | IDs de balones que INGRESAN llenos del proveedor |
| `cylinders_out` | array | ❌ | IDs de balones que SALEN vacíos hacia el proveedor |
| `notes` | string | ❌ | Observaciones |

### Respuesta `201 Created`

```json
{
    "id": 88,
    "type": "SupplierMovement",
    "supplier_id": 1,
    "reference_document": "GRE-2026-0042",
    "shift": "Morning",
    "notes": "Recepción mensual de O2 medicinal",
    "movement_at": "2026-05-15T08:00:00.000000Z",
    "cylinder_movements": [
        { "cylinder_id": 5, "action": "Entry", "cylinder_status": "full" },
        { "cylinder_id": 8, "action": "Entry", "cylinder_status": "full" },
        { "cylinder_id": 12, "action": "Entry", "cylinder_status": "full" },
        { "cylinder_id": 3, "action": "Exit", "cylinder_status": "in_transit" },
        { "cylinder_id": 7, "action": "Exit", "cylinder_status": "in_transit" }
    ]
}
```

### Actualización automática de cilindros

| Acción | Nuevo Status | Nueva Ubicación |
|--------|-------------|-----------------|
| `cylinders_in` (entran llenos) | `full` | `CENTRAL` |
| `cylinders_out` (salen vacíos) | `in_transit` | `PROVEEDOR` |

---

## POST `/api/inventory/periphery-exchange` — Intercambio Periférico (Bulk)

Registra un intercambio masivo de balones para un servicio hospitalario periférico (intercambia múltiples balones de una vez).

### Request Body

```json
{
    "service_id": 3,
    "reference_document": "REF-20260515",
    "shift": "Night",
    "cylinders_in": [20, 21, 22],
    "cylinders_out": [30, 31, 32],
    "notes": "Reposición nocturna UCI Neonatal"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `service_id` | integer | ✅ | ID del servicio periférico |
| `reference_document` | string | ❌ | Documento de referencia |
| `shift` | string | ✅ | `Morning`, `Afternoon`, `Night` |
| `cylinders_in` | array | ❌ | Balones vacíos que INGRESAN al almacén |
| `cylinders_out` | array | ❌ | Balones llenos que SALEN hacia el servicio |
| `notes` | string | ❌ | Observaciones |

### Actualización automática de cilindros

| Acción | Nuevo Status | Nueva Ubicación |
|--------|-------------|-----------------|
| `cylinders_in` (vacíos que regresan) | `empty` | `CENTRAL` |
| `cylinders_out` (llenos que van al servicio) | `in_use` | `HOSPITALIZACION` |

---

## POST `/api/inventory/supplier-entry` — Entrada de Proveedor

Alias de `POST /api/inventory/supplier`. Usa el mismo controlador y acepta los mismos campos. Se expone como endpoint separado para mayor claridad semántica en el frontend.

---

## Diagrama de Flujo de un Intercambio

```
Paciente llega con balón VACÍO (cylinder_in)
           │
           ▼
   POST /api/inventory/exchange
   {
     cylinder_in: 15,   ← Balón vacío que ingresa
     cylinder_out: 7,   ← Balón lleno que sale (opcional)
     patient_id: 1,
     prescription_id: 3
   }
           │
           ▼
   DB::transaction() {
     1. Crea InventoryMovement (type: Exchange)
     2. Crea CylinderMovement (cylinder 15, Entry, empty)
     3. Actualiza Cylinder 15 → status: empty, location: CENTRAL
     4. Crea CylinderMovement (cylinder 7, Exit, in_use)
     5. Actualiza Cylinder 7 → status: in_use, location: PADOMI
   }
           │
           ▼
   Responde 201 con el movimiento completo
```

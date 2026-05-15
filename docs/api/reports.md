# Reportes

> **Prefijo:** `/api/reports`
> **Roles:** `Administrator`, `Engineer` únicamente
> Todos los reportes son de **solo lectura** (`GET`). No modifican datos.

---

## GET `/api/reports/daily-kardex` — Kardex de Atención de Oxígeno

El reporte principal del sistema, equivalente al formato físico de Kardex diario. Muestra el stock actual por tipo de propiedad y todos los movimientos del día agrupados por turno.

### Query Params

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `date` | date | Hoy | Fecha a consultar (`YYYY-MM-DD`) |

**Ejemplo:** `GET /api/reports/daily-kardex?date=2026-05-15`

### Respuesta `200 OK`

```json
{
    "date": "2026-05-15",
    "stock_summary": [
        {
            "name": "EsSalud",
            "full": 32,
            "empty": 14
        },
        {
            "name": "Alquilado",
            "full": 8,
            "empty": 3
        }
    ],
    "initial_balance": [
        {
            "capacity": 10,
            "status": "full",
            "ownership_type_id": 1,
            "total": 25
        }
    ],
    "shifts": {
        "MAÑANA": {
            "movements": [ ... ],
            "operators": ["Carlos López", "Ana Torres"]
        },
        "TARDE": {
            "movements": [ ... ],
            "operators": ["Pedro Ramos"]
        },
        "NOCHE": {
            "movements": [],
            "operators": []
        }
    }
}
```

---

## GET `/api/reports/consumption-dashboard` — Dashboard de Consumo Diario

Reporte consolidado de m³ entregados por turno y categoría (PADOMI, HNAGV, Periféricos) y estado del almacén.

### Query Params

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `date` | date | Hoy | Fecha a consultar (`YYYY-MM-DD`) |

**Ejemplo:** `GET /api/reports/consumption-dashboard?date=2026-05-15`

### Respuesta `200 OK`

```json
{
    "date": "2026-05-15",
    "shifts": {
        "MAÑANA": {
            "padomi": 30,
            "hnagv": 50,
            "perifericos": 20,
            "total": 100,
            "operators": ["Carlos López"]
        },
        "TARDE": {
            "padomi": 20,
            "hnagv": 40,
            "perifericos": 10,
            "total": 70,
            "operators": ["Ana Torres"]
        },
        "NOCHE": {
            "padomi": 0,
            "hnagv": 10,
            "perifericos": 0,
            "total": 10,
            "operators": ["Pedro Ramos"]
        }
    },
    "grand_total": 180,
    "reserva_llenos": [
        {
            "location": "CENTRAL",
            "capacity": 10,
            "ownership_type_id": 1,
            "total": 32
        }
    ],
    "almacen_vacios": [
        {
            "location": "CENTRAL",
            "capacity": 10,
            "ownership_type_id": 1,
            "total": 14
        }
    ],
    "resumen_final": {
        "total_ingreso": 15
    }
}
```

**Clasificación del consumo:**
| Categoría | Criterio |
|-----------|----------|
| `padomi` | `patient_id` presente en el movimiento |
| `hnagv` | `service_id` presente y tipo ≠ `ServiceBulkExchange` |
| `perifericos` | Tipo `ServiceBulkExchange` |

---

## GET `/api/reports/kardex` — Kardex General (Historial)

Lista todos los movimientos de inventario en orden cronológico descendente. Sirve como registro histórico completo.

### Respuesta `200 OK`

```json
[
    {
        "id": 150,
        "type": "Exchange",
        "shift": "Morning",
        "patient_id": 3,
        "service_id": null,
        "movement_at": "2026-05-15T08:30:00.000000Z",
        "user": { "id": 2, "name": "Carlos López" },
        "patient": { "id": 3, "full_name": "Rosa Mejía" },
        "service": null,
        "cylinder_movements": [
            {
                "cylinder_id": 15,
                "action": "Entry",
                "cylinder_status": "empty",
                "cylinder": { "serial_number": "EsSalud-O2-015", "capacity": 10 }
            }
        ]
    }
]
```

---

## GET `/api/reports/inventory` — Reporte de Inventario

> **Nota:** Este endpoint está declarado en las rutas. La implementación completa puede variar. Consultar el `ReportController` para detalles del response actual.

---

## GET `/api/reports/stagnant` — Cilindros Estancados

Lista cilindros que llevan mucho tiempo sin movimiento.

---

## GET `/api/reports/history/{id}` — Historial de un Cilindro

Muestra todos los movimientos históricos de un cilindro específico.

**Parámetro:** `{id}` — ID del cilindro.

---

## GET `/api/reports/shift-closure` — Cierre de Turno

Genera el reporte de cierre para el turno actual.

---

## GET `/api/reports/consumption` — Reporte de Consumo General

Reporte consolidado de consumo total del período.

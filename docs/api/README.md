# API — Índice General

> **Base URL:** `http://localhost:8000/api`
> **Formato:** JSON
> **Autenticación:** Bearer Token (Laravel Sanctum)

---

## Convenciones Generales

### Header de Autenticación
Todos los endpoints protegidos requieren:
```
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
```

### Códigos de Respuesta HTTP

| Código | Significado |
|--------|-------------|
| `200` | OK — Solicitud exitosa |
| `201` | Created — Recurso creado correctamente |
| `401` | Unauthorized — Token inválido o ausente |
| `403` | Forbidden — Sin permisos suficientes |
| `404` | Not Found — Recurso no encontrado |
| `422` | Unprocessable Entity — Error de validación |
| `500` | Server Error — Error interno del servidor |

### Formato de Error de Validación (422)
```json
{
    "message": "The given data was invalid.",
    "errors": {
        "campo": ["El campo es obligatorio."]
    }
}
```

---

## Módulos de la API

| Módulo | Prefijo | Roles | Documento |
|--------|---------|-------|-----------|
| **Autenticación** | `/auth` | Público / Todos | [auth.md](./auth.md) |
| **Pacientes** | `/patients` | Operator+ | [catalogs.md](./catalogs.md) |
| **Servicios** | `/services` | Operator+ | [catalogs.md](./catalogs.md) |
| **Camas** | `/beds` | Operator+ | [catalogs.md](./catalogs.md) |
| **Proveedores** | `/suppliers` | Operator+ | [catalogs.md](./catalogs.md) |
| **Tipos de Propiedad** | `/ownership-types` | Operator+ | [catalogs.md](./catalogs.md) |
| **Cilindros** | `/cylinders` | Operator+ | [cylinders.md](./cylinders.md) |
| **Lecturas Diarias** | `/daily-readings` | Operator+ | [daily-readings.md](./daily-readings.md) |
| **Recetas Médicas** | `/prescriptions` | Operator+ | [prescriptions.md](./prescriptions.md) |
| **Módulo Líquido** | `/liquid` | Operator+ | [liquid.md](./liquid.md) |
| **Movimientos de Inventario** | `/inventory` | Operator+ | [inventory-movements.md](./inventory-movements.md) |
| **Reportes** | `/reports` | Administrator+ | [reports.md](./reports.md) |
| **Usuarios** | `/users` | Administrator+ | [users.md](./users.md) |

---

## Resumen Rápido de Endpoints

```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/patients
POST   /api/patients
GET    /api/patients/{id}
PUT    /api/patients/{id}
DELETE /api/patients/{id}

GET    /api/services
POST   /api/services
GET    /api/services/{id}
PUT    /api/services/{id}
DELETE /api/services/{id}

GET    /api/beds
POST   /api/beds
GET    /api/beds/{id}
PUT    /api/beds/{id}
DELETE /api/beds/{id}

GET    /api/suppliers
POST   /api/suppliers
GET    /api/suppliers/{id}
PUT    /api/suppliers/{id}
DELETE /api/suppliers/{id}

GET    /api/ownership-types
POST   /api/ownership-types
GET    /api/ownership-types/{id}
PUT    /api/ownership-types/{id}
DELETE /api/ownership-types/{id}

GET    /api/cylinders
POST   /api/cylinders
GET    /api/cylinders/{id}
PUT    /api/cylinders/{id}
DELETE /api/cylinders/{id}

GET    /api/daily-readings
POST   /api/daily-readings
PUT    /api/daily-readings/{id}
DELETE /api/daily-readings/{id}

POST   /api/prescriptions
PUT    /api/prescriptions/{id}
DELETE /api/prescriptions/{id}

POST   /api/liquid/refill
POST   /api/liquid/daily-reading

POST   /api/inventory/exchange
POST   /api/inventory/decanting
POST   /api/inventory/supplier
POST   /api/inventory/periphery-exchange
POST   /api/inventory/supplier-entry

GET    /api/users
POST   /api/users
GET    /api/users/{id}
PUT    /api/users/{id}
DELETE /api/users/{id}
PATCH  /api/users/{id}/deactivate

GET    /api/reports/inventory
GET    /api/reports/stagnant
GET    /api/reports/history/{id}
GET    /api/reports/shift-closure
GET    /api/reports/consumption
GET    /api/reports/daily-kardex
GET    /api/reports/consumption-dashboard
GET    /api/reports/kardex
```

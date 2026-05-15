# Roles y Permisos

## Modelo de Control de Acceso

El sistema implementa **RBAC (Role-Based Access Control)** mediante un middleware personalizado (`CheckRole`) que valida el campo `role` del usuario autenticado antes de permitir el acceso a cada ruta.

---

## Roles Disponibles

| Rol | Código | Descripción |
|-----|--------|-------------|
| **Operador** | `Operator` | Personal de turno que registra movimientos diarios |
| **Administrador** | `Administrator` | Jefatura del almacén, acceso a reportes y gestión |
| **Ingeniero** | `Engineer` | Acceso total, incluye configuración del sistema |

---

## Matriz de Permisos por Endpoint

### Rutas Públicas (sin autenticación)

| Endpoint | Descripción |
|----------|-------------|
| `POST /api/auth/login` | Iniciar sesión |

---

### Rutas de Sesión (todos los roles autenticados)

| Endpoint | Descripción |
|----------|-------------|
| `POST /api/auth/logout` | Cerrar sesión |
| `GET /api/auth/me` | Ver datos del usuario actual |

---

### Rutas de Nivel Operador (Operator + Administrator + Engineer)

| Módulo | Endpoints |
|--------|-----------|
| **Pacientes** | CRUD completo `/api/patients` |
| **Servicios** | CRUD completo `/api/services` |
| **Camas** | CRUD completo `/api/beds` |
| **Cilindros** | CRUD completo `/api/cylinders` |
| **Proveedores** | CRUD completo `/api/suppliers` |
| **Lecturas Diarias** | CRUD completo `/api/daily-readings` |
| **Tipos de Propiedad** | CRUD completo `/api/ownership-types` |
| **Recetas** | `POST/PUT/DELETE /api/prescriptions` |
| **Líquido** | `POST /api/liquid/refill`, `POST /api/liquid/daily-reading` |
| **Inventario** | Todos los endpoints `POST /api/inventory/*` |

---

### Rutas de Nivel Administrador (Administrator + Engineer)

| Módulo | Endpoints |
|--------|-----------|
| **Usuarios** | CRUD completo `/api/users` |
| **Desactivar usuario** | `PATCH /api/users/{id}/deactivate` |
| **Reportes** | Todos los endpoints `GET /api/reports/*` |

---

## Cómo Funciona el Middleware

```php
// Ejemplo: ruta protegida para operadores
Route::middleware(['auth:sanctum', 'role:Operator,Administrator,Engineer'])
    ->group(function () {
        Route::apiResource('cylinders', CylinderController::class);
    });
```

El middleware `CheckRole`:
1. Verifica que el usuario esté autenticado (Sanctum).
2. Compara `$user->role` contra los roles permitidos en la ruta.
3. Si no coincide, responde `403 Forbidden`.

---

## Respuesta de Error por Permisos

```json
// HTTP 401 — No autenticado
{
    "message": "Unauthenticated."
}

// HTTP 403 — Sin permisos suficientes
{
    "message": "Forbidden. Insufficient role."
}
```

---

## Casos de Uso por Rol

### Operador de Turno
- Registrar intercambios de balones con pacientes y servicios.
- Registrar trasiegos de oxígeno líquido.
- Registrar movimientos con proveedor.
- Registrar lecturas del flujómetro y nivel del tanque.
- Consultar y actualizar catálogos (pacientes, cilindros, etc.).

### Administrador
- Todo lo del Operador **más:**
- Ver reportes de Kardex, consumo y cierre de turno.
- Crear, editar y desactivar usuarios del sistema.
- Auditar todos los movimientos históricos.

### Ingeniero
- Acceso total idéntico al Administrador.
- Uso típico: soporte técnico y configuración del sistema.

# Gestión de Usuarios

> **Prefijo:** `/api/users`
> **Roles:** `Administrator`, `Engineer` únicamente
> Los usuarios tienen Soft Deletes — no se borran físicamente de la BD.

---

## GET `/api/users` — Listar todos

Devuelve todos los usuarios ordenados alfabéticamente por nombre.

**Respuesta `200 OK`:**
```json
[
    {
        "id": 1,
        "operator_code": "ADMIN01",
        "name": "Administrador Principal",
        "role": "Administrator",
        "status": "active",
        "created_at": "2026-01-01T00:00:00.000000Z",
        "updated_at": "2026-01-01T00:00:00.000000Z"
    },
    {
        "id": 2,
        "operator_code": "OP001",
        "name": "Carlos López",
        "role": "Operator",
        "status": "active",
        "created_at": "2026-01-15T08:00:00.000000Z",
        "updated_at": "2026-01-15T08:00:00.000000Z"
    }
]
```

> **Seguridad:** El campo `password` nunca se incluye en las respuestas.

---

## POST `/api/users` — Crear usuario

**Request Body:**
```json
{
    "operator_code": "OP003",
    "name": "Ana Torres Vega",
    "role": "Operator",
    "password": "secreto123"
}
```

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|------------|
| `operator_code` | string | ✅ | Único en el sistema, máx. 20 chars |
| `name` | string | ✅ | Nombre completo, máx. 100 chars |
| `role` | string | ✅ | `Operator`, `Administrator`, `Engineer` |
| `password` | string | ✅ | Mínimo 6 caracteres (se hashea con bcrypt) |

**Respuesta `201 Created`:**
```json
{
    "id": 5,
    "operator_code": "OP003",
    "name": "Ana Torres Vega",
    "role": "Operator",
    "status": "active",
    "created_at": "2026-05-15T10:00:00.000000Z",
    "updated_at": "2026-05-15T10:00:00.000000Z"
}
```

---

## GET `/api/users/{id}` — Ver uno

**Respuesta `200 OK`:** Los datos del usuario sin el campo `password`.

---

## PUT `/api/users/{id}` — Actualizar usuario

**Request Body:**
```json
{
    "operator_code": "OP003",
    "name": "Ana Torres Vega",
    "role": "Administrator",
    "password": "nuevaContrasena456"
}
```

| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| `operator_code` | string | ✅ | Único excluyendo el usuario actual |
| `name` | string | ✅ | - |
| `role` | string | ✅ | `Operator`, `Administrator`, `Engineer` |
| `password` | string | ❌ | Si se omite, no se cambia la contraseña |

**Respuesta `200 OK`:** Los datos actualizados del usuario.

---

## DELETE `/api/users/{id}` — Eliminar usuario

> **Restricción:** Un administrador **no puede eliminar su propia cuenta** (protección anti-lockout).

**Error `403` si intenta eliminarse a sí mismo:**
```json
{ "message": "No puedes eliminar tu propia cuenta." }
```

**Respuesta `200 OK`:**
```json
{ "message": "Usuario eliminado correctamente." }
```

---

## PATCH `/api/users/{id}/deactivate` — Desactivar usuario

Marca al usuario como `inactive` sin eliminarlo. Un usuario inactivo no puede iniciar sesión.

**Sin Request Body** (sin cuerpo).

**Respuesta `200 OK`:**
```json
{ "message": "Usuario desactivado correctamente." }
```

**Flujo de desactivación:**
```
PATCH /api/users/3/deactivate
       │
       ▼
users.status → "inactive"
       │
       ▼
Próximo intento de login → 403 "This account is inactive."
```

---

## Gestión de Contraseñas

- Las contraseñas se almacenan con hash **bcrypt** (nunca en texto plano).
- Al actualizar, si `password` se omite o es vacío, la contraseña existente se mantiene.
- No existe endpoint de recuperación de contraseña (el administrador la resetea manualmente).

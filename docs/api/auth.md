# Autenticación

> **Prefijo:** `/api/auth`
> **Librería:** Laravel Sanctum (tokens opacos)

El sistema usa autenticación por **Bearer Token**. Al iniciar sesión, el servidor genera un token único que debe incluirse en todas las peticiones protegidas.

---

## POST `/api/auth/login`

Inicia sesión y devuelve un Bearer Token de acceso.

- **Acceso:** Público (no requiere token)
- **Método:** `POST`
- **URL:** `/api/auth/login`

### Request Body

```json
{
    "operator_code": "OP001",
    "password": "secreto123",
    "shift": "Morning"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `operator_code` | string | ✅ | Código único del operador |
| `password` | string | ✅ | Contraseña del usuario |
| `shift` | string | ✅ | Turno actual: `Morning`, `Afternoon`, `Night` |

### Respuesta Exitosa — `200 OK`

```json
{
    "message": "Login successful",
    "token": "1|abc123def456xyz...",
    "user": {
        "id": 1,
        "operator_code": "OP001",
        "name": "Juan Pérez",
        "role": "Operator",
        "status": "active",
        "created_at": "2026-01-15T08:00:00.000000Z",
        "updated_at": "2026-01-15T08:00:00.000000Z"
    },
    "current_shift": "Morning"
}
```

### Respuestas de Error

```json
// 401 — Credenciales incorrectas
{
    "message": "Invalid credentials."
}

// 403 — Cuenta inactiva
{
    "message": "This account is inactive."
}

// 422 — Campos faltantes o turno inválido
{
    "message": "The shift field must be one of Morning, Afternoon, Night.",
    "errors": {
        "shift": ["The shift field is required."]
    }
}
```

### Ejemplo de uso (JavaScript)

```javascript
const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        operator_code: 'OP001',
        password: 'secreto123',
        shift: 'Morning'
    })
});

const data = await response.json();
// Guardar el token para las siguientes peticiones
localStorage.setItem('token', data.token);
```

---

## POST `/api/auth/logout`

Cierra la sesión actual revocando el token de acceso.

- **Acceso:** Requiere autenticación
- **Método:** `POST`
- **URL:** `/api/auth/logout`

### Headers Requeridos

```
Authorization: Bearer {token}
```

### Request Body

*(Sin cuerpo — vacío)*

### Respuesta Exitosa — `200 OK`

```json
{
    "message": "Logged out successfully"
}
```

> **Importante:** Después del logout, el token queda invalidado permanentemente. Para iniciar sesión nuevamente, se debe llamar a `POST /api/auth/login`.

---

## GET `/api/auth/me`

Devuelve los datos del usuario actualmente autenticado.

- **Acceso:** Requiere autenticación
- **Método:** `GET`
- **URL:** `/api/auth/me`

### Headers Requeridos

```
Authorization: Bearer {token}
```

### Respuesta Exitosa — `200 OK`

```json
{
    "user": {
        "id": 1,
        "operator_code": "OP001",
        "name": "Juan Pérez",
        "role": "Administrator",
        "status": "active",
        "created_at": "2026-01-15T08:00:00.000000Z",
        "updated_at": "2026-01-15T08:00:00.000000Z"
    }
}
```

---

## Uso del Token en Peticiones

Una vez obtenido el token del login, inclúyelo en el header `Authorization` de todas las peticiones protegidas:

```javascript
// Ejemplo con fetch
const response = await fetch('/api/cylinders', {
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});
```

```bash
# Ejemplo con cURL
curl -X GET http://localhost:8000/api/cylinders \
  -H "Authorization: Bearer 1|abc123def456xyz" \
  -H "Accept: application/json"
```

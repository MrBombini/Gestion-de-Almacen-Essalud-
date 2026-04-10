# Authentication Module

Endpoints for session management.

## Login
Authenticates a user and returns a Sanctum token.

- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Payload**:
```json
{
  "operator_code": "OP123456",
  "password": "your_password",
  "shift": "Morning"
}
```
*Note: `shift` must be "Morning", "Afternoon", or "Night".*

- **Response (200 OK)**:
```json
{
  "message": "Login successful",
  "token": "1|abc123token...",
  "user": {
    "id": 1,
    "operator_code": "OP123456",
    "name": "Juan Perez",
    "role": "Operator",
    "status": "active"
  },
  "current_shift": "Morning"
}
```

---

## Logout
Revokes the current access token.

- **URL**: `/api/auth/logout`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer {token}`
- **Response (200 OK)**:
```json
{
  "message": "Logged out successfully"
}
```

---

## Get Current User (Me)
Returns the information of the authenticated user.

- **URL**: `/api/auth/me`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {token}`
- **Response (200 OK)**:
```json
{
  "user": {
    "id": 1,
    "operator_code": "OP123456",
    "name": "Juan Perez",
    "role": "Operator",
    "status": "active"
  }
}
```

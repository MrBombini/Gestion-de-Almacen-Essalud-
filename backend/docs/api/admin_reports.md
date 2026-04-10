# Admin & Reports Module

Restricted to Administrator and Engineer roles.

## User Management

### List All Users
- **URL**: `/api/users`
- **Method**: `GET`

### Create User
- **URL**: `/api/users`
- **Method**: `POST`
- **Payload**:
```json
{
  "operator_code": "ADMIN01",
  "name": "Super User",
  "role": "Administrator",
  "password": "securepassword",
  "status": "active"
}
```

### Deactivate User
- **URL**: `/api/users/{id}/deactivate`
- **Method**: `PATCH`

---

## Reports

### General Kardex
History of all inventory movements.
- **URL**: `/api/reports/kardex`
- **Method**: `GET`

### Daily Consumption Summary
- **URL**: `/api/reports/consumption`
- **Method**: `GET`

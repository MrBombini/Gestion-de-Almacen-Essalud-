# Services Catalog

Manage hospital services/areas.

## List Services
- **URL**: `/api/services`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {token}`

---

## Create Service
- **URL**: `/api/services`
- **Method**: `POST`
- **Payload**:
```json
{
  "name": "Intensive Care Unit (ICU)",
  "type": "Hospital"
}

```
---

# Beds Catalog
- **URL**: `/api/beds`
- **Method**: `GET/POST/PUT/DELETE`
- **Payload (Create)**:
```json
{
  "service_id": 1,
  "bed_number": "B-101"
}
```

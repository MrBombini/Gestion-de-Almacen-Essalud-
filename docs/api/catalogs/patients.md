# Patients Catalog

Manage hospital patients.

## List All Patients
- **URL**: `/api/patients`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `Array of Patient objects`

---

## Create Patient
- **URL**: `/api/patients`
- **Method**: `POST`
- **Payload**:
```json
{
  "name": "Jane Doe",
  "document_id": "77889900",
  "service_id": 1
}
```

---

## Update Patient
- **URL**: `/api/patients/{id}`
- **Method**: `PUT`
- **Payload**:
```json
{
  "name": "Jane Doe Updated",
  "service_id": 2
}
```

---

## Delete Patient
- **URL**: `/api/patients/{id}`
- **Method**: `DELETE`

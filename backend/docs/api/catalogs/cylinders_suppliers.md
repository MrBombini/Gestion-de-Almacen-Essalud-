# Cylinders Catalog

Tracking individual oxygen cylinders.

## List Cylinders
- **URL**: `/api/cylinders`
- **Method**: `GET`

## Create Cylinder
- **URL**: `/api/cylinders`
- **Method**: `POST`
- **Payload**:
```json
{
  "serial_number": "CIL-X99",
  "brand": "Linde",
  "capacity": "10m3",
  "status": "full"
}
```
*Statuses: full, empty, in_use.*

---

# Suppliers Catalog
- **URL**: `/api/suppliers`
- **Method**: `GET/POST`
- **Payload (Create)**:
```json
{
  "name": "Oxygen Supplier Inc",
  "contact_info": "123-456-789"
}
```

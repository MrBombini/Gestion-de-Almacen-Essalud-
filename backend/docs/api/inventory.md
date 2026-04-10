# Inventory Movements Module

Tracks all core operations involving cylinders.

## Create Exchange
Swap an empty cylinder for a full one for a specific patient.

- **URL**: `/api/inventory/exchange`
- **Method**: `POST`
- **Payload**:
```json
{
  "patient_id": 1,
  "service_id": 2,
  "cylinder_in": 10,
  "cylinder_out": 15,
  "shift": "Morning",
  "notes": "Patient admission exchange"
}
```

---

## Create Decanting
Refilling a small cylinder from a larger one.

- **URL**: `/api/inventory/decanting`
- **Method**: `POST`
- **Payload**:
```json
{
  "source_cylinder_id": 5,
  "target_cylinder_id": 20
}
```

---

## Create Supplier Entry
Recording the entry of tanks/cylinders from a supplier.

- **URL**: `/api/inventory/supplier-entry`
- **Method**: `POST`
```json
{
  "message": "Logic implementation pending"
}
```
*Note: This endpoint is currently a stub for custom logic.*

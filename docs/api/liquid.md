# Liquid Oxygen Module

Endpoints for cryogenic tank management.

## Store Tank Refill
Records when a supplier refills the main tank.

- **URL**: `/api/liquid/refill`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer {token}`
- **Payload**:
```json
{
  "supplier_id": 1,
  "level_before": 45.5,
  "level_after": 95.0,
  "ticket_amount": 1500.25,
  "reference_document": "GR-0932",
  "refilled_at": "2024-04-08 15:30:00"
}
```

---

## Store Daily Reading
Manual tracking of tank levels and pressure.

- **URL**: `/api/liquid/daily-reading`
- **Method**: `POST`
- **Payload**:
```json
{
  "ext_tank_reserve": 75.2,
  "int_warehouse_consumption": 15.5,
  "calculated_consumption": 59.7,
  "shift": "Morning",
  "reading_date": "2024-04-08"
}
```

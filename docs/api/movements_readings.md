# ⚙ Documentación de API: Operaciones (Kardex y Lecturas)

Endpoints para la operativa diaria y transacciones de almacén.

---

## 1. Movimientos de Inventario (Kardex)
Registra entradas, salidas y canjes de balones.

### Registrar un Movimiento (ENTRADAS/SALIDAS)
- **URL**: `/api/movements`
- **Metodo**: `POST`
- **Body (JSON)**:
```json
{
  "cylinder_barcode": "CYL-0001",
  "type": "Entry from Provider",
  "location_from_id": null,
  "location_to_id": 1,
  "batch_number": "LOTE-99",
  "gas_expiration_date": "2027-12-31",
  "notes": "Llegó pedido de Linde camión 15"
}
```
> **IMPORTANTE**: Este endpoint actualiza automáticamente la ubicación (`current_location_id`) y el estado (`status`) del balón.

### Tipos de Movimientos Válidos:
- `Entry from Provider`
- `Exit to Provider`
- `Hospital Exchange`
- `Trasiego/Refill`
- `Patient Delivery`
- `Patient Return`

### Historial de Movimientos
- **URL**: `/api/movements`
- **Metodo**: `GET`
- **Query Params**: `type`, `cylinder_barcode`.

---

## 2. Lecturas de Tanques
Control del nivel de oxígeno criogénico (Tanque Principal).

### Registrar Lectura
- **URL**: `/api/tank-readings`
- **Metodo**: `POST`
- **Body (JSON)**:
```json
{
  "tank_name": "TANQUE PRINCIPAL O2",
  "level_percentage": 65.5,
  "pressure_psi": 120,
  "shift": "Mañana",
  "is_refill": false
}
```

### Listado de Lecturas
- **URL**: `/api/tank-readings`
- **Metodo**: `GET`

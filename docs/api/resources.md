# 🛡 Documentación de API: Recursos Core (Cilindros y Pacientes)

Gestión de los activos (Cilindros) y los sujetos de préstamo (Pacientes).

---

## 1. Cilindros (Cylinders)
Representa los balones físicos en el almacén u hospital.

### Listar cilindros (con filtros)
- **URL**: `/api/cylinders`
- **Metodo**: `GET`
- **Query Params**: `gas_type_id`, `status`, `location_id`, `provider_id`, `search` (barcode/serial).
- **Ejemplo**: `/api/cylinders?status=Full&provider_id=1`

### Registrar BALÓN NUEVO
- **URL**: `/api/cylinders`
- **Metodo**: `POST`
- **Body (JSON)**:
```json
{
  "barcode": "CYL-0001",
  "serial_number_stamped": "SN-12345",
  "gas_type_id": 1,
  "capacity_id": 1,
  "provider_id": 1,
  "cylinder_model_id": 1,
  "asset_type": "Cylinder",
  "status": "Empty",
  "ph_test_date": "2026-03-31"
}
```

### Ver detalle de 1 balón (Búsqueda por Barcode)
- **URL**: `/api/cylinders/{barcode}`
- **Metodo**: `GET`
- **Ejemplo**: `/api/cylinders/CYL-0001`

### Actualizar información de balón
- **URL**: `/api/cylinders/{barcode}`
- **Metodo**: `PUT`
- **Body (JSON)**: Cualquier campo de la creación.

---

## 2. Opciones para Formularios (Dropdowns)
Obtiene todos los maestros de una sola vez para el frontend.
- **URL**: `/api/cylinders/form-options`
- **Metodo**: `GET`
- **Respuesta**: `{ "gas_types": [], "providers": [], ... }`

---

## 3. Pacientes (PADOMI)
Gestión de pacientes que reciben préstamos de gas en casa.

### Listar pacientes
- **URL**: `/api/patients`
- **Metodo**: `GET`

### Crear paciente
- **URL**: `/api/patients`
- **Metodo**: `POST`
- **Body (JSON)**:
```json
{
  "name": "Juan Perez",
  "dni": "45678912",
  "phone": "987654321",
  "address": "Av. Principal 123",
  "location_id": 1,
  "loan_expiration_date": "2026-04-15"
}
```

### Buscar por DNI
- **URL**: `/api/patients/{dni}`
- **Metodo**: `GET`

---

## 4. Ubicaciones (Locations)
Camas, hospitales, servicios.

### Listar ubicaciones
- **URL**: `/api/locations`
- **Metodo**: `GET`

### Crear ubicación
- **URL**: `/api/locations`
- **Metodo**: `POST`
- **Body (JSON)**:
```json
{
  "service_name": "Piso 5 - Emergencia",
  "identifier": "Cama 501",
  "short_code": "E501",
  "type": "BED"
}
```
> Tipos válidos: `BED`, `SERVICE`, `PADOMI`, `EXTERNAL`.

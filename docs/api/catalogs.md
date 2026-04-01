# 📋 Documentación de API: Catálogos (Mantenimiento)

Estos endpoints permiten gestionar los datos maestros del sistema (tablas maestras).

---

## 1. Tipos de Gas (Gas Types)
Gestión de los gases médicos (Oxígeno, Vacío, etc).

### Listar todos los tipos de gas
- **URL**: `/api/gas-types`
- **Metodo**: `GET`
- **Respuesta (JSON)**:
```json
[
  {
    "id": 1,
    "name": "Oxigeno Medicinal",
    "unit": "m3",
    "min_stock": 10,
    "created_at": "2026-03-31T20:00:00.000000Z"
  }
]
```

### Crear un tipo de gas
- **URL**: `/api/gas-types`
- **Metodo**: `POST`
- **Body (JSON)**:
```json
{
  "name": "Aire Comprimido",
  "unit": "psi",
  "min_stock": 5
}
```

---

## 2. Proveedores (Dueños / Owners)
Empresas dueñas de los balones (Linde, Praxair, etc).

### Listar todos los proveedores
- **URL**: `/api/providers`
- **Metodo**: `GET`
- **Respuesta (JSON)**:
```json
[
  {
    "id": 1,
    "company_name": "LINDE PERU S.A.C.",
    "tax_id": "20100012345",
    "created_at": "2026-03-31T20:00:00.000000Z"
  }
]
```

### Crear un proveedor
- **URL**: `/api/providers`
- **Metodo**: `POST`
- **Body (JSON)**:
```json
{
  "company_name": "PRAXAIR PERU",
  "tax_id": "20500054321"
}
```

---

## 3. Capacidades (Cylinder Capacities)
Tamaños físicos de los balones (10m3, 6m3, etc).

### Listar todas las capacidades
- **URL**: `/api/capacities`
- **Metodo**: `GET`

### Crear una capacidad
- **URL**: `/api/capacities`
- **Metodo**: `POST`
- **Body (JSON)**:
```json
{
  "value": 10,
  "unit": "m3",
  "description": "Balón Grande 10m3"
}
```

---

## 4. Modelos de Cilindro (Cylinder Models)
Marcas o fabricantes de los balones (JD, KIOSHI).

### Listar todos los modelos
- **URL**: `/api/cylinder-models`
- **Metodo**: `GET`

### Crear un modelo
- **URL**: `/api/cylinder-models`
- **Metodo**: `POST`
- **Body (JSON)**:
```json
{
  "name": "KIOSHI"
}
```

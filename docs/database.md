# Esquema de Base de Datos

> **Motor:** MySQL 8.0 · **BD:** `essalud` · **Collation:** `utf8mb4_unicode_ci`

---

## Diagrama Entidad-Relación (Simplificado)

```
ownership_types ──┐
                  │
suppliers ────────┤
                  │
                  ├──▶ cylinders ──▶ cylinder_movements ──▶ inventory_movements
patients ─────────┤                                              │
   │              │                                              │
   └─▶ prescriptions                                         patients
                  │                                          services
services ─────────┤                                          suppliers
   │              │                                          beds
   └─▶ beds ──────┘                                          users

liquid_refills ◀── suppliers
daily_readings ◀── users
decantings ◀── cylinders, patients, services, beds, users
```

---

## Tablas

### `users` — Operadores del Sistema
| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | BIGINT | PK, AI | Identificador único |
| `operator_code` | VARCHAR(20) | UNIQUE, NOT NULL | Código de operador |
| `name` | VARCHAR(100) | NOT NULL | Nombre completo |
| `role` | ENUM | NOT NULL | `Operator`, `Administrator`, `Engineer` |
| `password` | VARCHAR | NOT NULL | Hash bcrypt |
| `status` | ENUM | DEFAULT 'active' | `active`, `inactive` |
| `created_at` | TIMESTAMP | - | Fecha de creación |
| `updated_at` | TIMESTAMP | - | Última modificación |

---

### `patients` — Pacientes PADOMI
| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | BIGINT | PK, AI | Identificador único |
| `full_name` | VARCHAR(150) | NOT NULL | Nombre completo |
| `dni` | VARCHAR(15) | UNIQUE, NULLABLE | DNI del paciente |
| `trasiego_code` | VARCHAR(100) | NULLABLE | Código de trasiego |
| `exchange_code` | VARCHAR(100) | NULLABLE | Código de intercambio |
| `address` | VARCHAR(255) | NULLABLE | Dirección del domicilio |
| `phone1` | VARCHAR(20) | NULLABLE | Teléfono principal |
| `phone2` | VARCHAR(20) | NULLABLE | Teléfono secundario |
| `deleted_at` | TIMESTAMP | NULLABLE | Soft delete |

---

### `prescriptions` — Recetas Médicas
| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | BIGINT | PK, AI | Identificador único |
| `patient_id` | BIGINT | FK → patients | Paciente titular |
| `service_id` | BIGINT | FK → services | Servicio asignado |
| `dosage` | VARCHAR | NULLABLE | Dosis prescrita (L/min) |
| `usage_time` | VARCHAR | NULLABLE | Tiempo de uso diario |
| `expires_at` | DATE | NULLABLE | Fecha de vencimiento |
| `issued_at` | DATE | NULLABLE | Fecha de emisión |
| `authorization_date` | DATE | NULLABLE | Fecha de autorización |
| `promissory_note` | VARCHAR | NULLABLE | Número de pagaré |
| `status` | ENUM | NOT NULL | `active`, `expired`, `inactive` |

---

### `suppliers` — Proveedores de Gas
| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | BIGINT | PK, AI | Identificador único |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | Razón social |
| `ruc` | VARCHAR(11) | UNIQUE, NULLABLE | RUC empresarial |
| `address` | VARCHAR(255) | NULLABLE | Dirección |
| `phone` | VARCHAR(20) | NULLABLE | Teléfono |
| `email` | VARCHAR(100) | NULLABLE | Correo electrónico |
| `description` | TEXT | NULLABLE | Notas adicionales |

---

### `services` — Servicios Hospitalarios
| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | BIGINT | PK, AI | Identificador único |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | Nombre del servicio |
| `type` | VARCHAR(50) | NOT NULL | Tipo (UCI, Emergencia, etc.) |

---

### `beds` — Camas Hospitalarias
| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | BIGINT | PK, AI | Identificador único |
| `service_id` | BIGINT | FK → services | Servicio al que pertenece |
| `bed_number` | VARCHAR(20) | NOT NULL | Número/código de cama |
| `status` | ENUM | NOT NULL | `available`, `occupied` |
| `deleted_at` | TIMESTAMP | NULLABLE | Soft delete |

---

### `ownership_types` — Tipos de Propiedad de Balones
| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | BIGINT | PK, AI | Identificador único |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | Nombre (EsSalud, Alquilado, etc.) |
| `description` | VARCHAR(255) | NULLABLE | Descripción adicional |

---

### `cylinders` — Balones de Gas Medicinal ⭐
| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | BIGINT | PK, AI | Identificador único |
| `serial_number` | VARCHAR | UNIQUE, NOT NULL | Número de serie |
| `barcode` | VARCHAR | UNIQUE, NULLABLE | Código de barras |
| `supplier_id` | BIGINT | FK → suppliers | Proveedor de recarga |
| `ownership_type_id` | BIGINT | FK → ownership_types | Tipo de propiedad |
| `patient_id` | BIGINT | FK → patients, NULLABLE | Paciente propietario original |
| `service_id` | BIGINT | FK → services, NULLABLE | Servicio asignado original |
| `current_patient_id` | BIGINT | FK → patients, NULLABLE | Paciente que lo usa actualmente |
| `current_service_id` | BIGINT | FK → services, NULLABLE | Servicio actual |
| `current_bed_id` | BIGINT | FK → beds, NULLABLE | Cama actual |
| `gas_type` | VARCHAR | NOT NULL | Tipo de gas (O2, CO2, N2, etc.) |
| `capacity` | DECIMAL | NOT NULL | Capacidad en m³ |
| `status` | ENUM | NOT NULL | `full`, `empty`, `in_use`, `in_transit`, `lost` |
| `location` | ENUM | NOT NULL | `CENTRAL`, `HOSPITALIZACION`, `PADOMI`, `ALMACEN`, `PROVEEDOR` |
| `hydrostatic_test_date` | DATE | NULLABLE | Fecha prueba hidrostática |
| `physical_condition` | VARCHAR | NULLABLE | Estado físico del balón |
| `deleted_at` | TIMESTAMP | NULLABLE | Soft delete |

---

### `inventory_movements` — Movimientos de Inventario ⭐
| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | BIGINT | PK, AI | Identificador único |
| `type` | VARCHAR | NOT NULL | `Exchange`, `SupplierMovement`, `ServiceBulkExchange`, `SupplierEntry` |
| `shift` | ENUM | NOT NULL | `Morning`, `Afternoon`, `Night` |
| `user_id` | BIGINT | FK → users | Operador que registró |
| `patient_id` | BIGINT | FK → patients, NULLABLE | Paciente involucrado |
| `service_id` | BIGINT | FK → services, NULLABLE | Servicio involucrado |
| `bed_id` | BIGINT | FK → beds, NULLABLE | Cama involucrada |
| `supplier_id` | BIGINT | FK → suppliers, NULLABLE | Proveedor involucrado |
| `prescription_id` | BIGINT | FK → prescriptions, NULLABLE | Receta usada |
| `reference_document` | VARCHAR(100) | NULLABLE | Nº de guía/documento |
| `notes` | TEXT | NULLABLE | Observaciones |
| `movement_at` | TIMESTAMP | NOT NULL | Fecha y hora del movimiento |

---

### `cylinder_movements` — Detalle de Movimiento por Cilindro
| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | BIGINT | PK, AI | Identificador único |
| `inventory_movement_id` | BIGINT | FK → inventory_movements | Movimiento padre |
| `cylinder_id` | BIGINT | FK → cylinders | Balón involucrado |
| `action` | ENUM | NOT NULL | `Entry` (ingresa al almacén), `Exit` (sale del almacén) |
| `cylinder_status` | ENUM | NOT NULL | Estado del balón en ese momento |

---

### `decantings` — Trasiegos de Oxígeno Líquido
| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | BIGINT | PK, AI | Identificador único |
| `cylinder_id` | BIGINT | FK → cylinders | Balón recargado |
| `refilled_amount` | DECIMAL | NOT NULL | Cantidad recargada (m³ o L) |
| `shift` | ENUM | NOT NULL | Turno del trasiego |
| `user_id` | BIGINT | FK → users | Operador |
| `patient_id` | BIGINT | NULLABLE | Destino: paciente |
| `service_id` | BIGINT | NULLABLE | Destino: servicio |
| `bed_id` | BIGINT | NULLABLE | Destino: cama |
| `prescription_id` | BIGINT | NULLABLE | Receta usada |
| `manual_destination` | VARCHAR(150) | NULLABLE | Destino libre (texto) |
| `decanted_at` | TIMESTAMP | NOT NULL | Fecha y hora del trasiego |

---

### `liquid_refills` — Recargas del Tanque Líquido
| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | BIGINT | PK, AI | Identificador único |
| `supplier_id` | BIGINT | FK → suppliers | Proveedor de recarga |
| `user_id` | BIGINT | FK → users | Operador |
| `level_before` | DECIMAL | NOT NULL | Nivel antes de recarga |
| `level_after` | DECIMAL | NOT NULL | Nivel después de recarga |
| `weight_before` | DECIMAL | NOT NULL | Peso antes (kg) |
| `weight_after` | DECIMAL | NOT NULL | Peso después (kg) |
| `ticket_amount` | DECIMAL | NULLABLE | Monto del ticket |
| `reference_document` | VARCHAR | NULLABLE | Nº de guía |
| `refilled_at` | DATE | NOT NULL | Fecha de recarga |

---

### `daily_readings` — Lecturas del Flujómetro
| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | BIGINT | PK, AI | Identificador único |
| `user_id` | BIGINT | FK → users | Operador que registró |
| `reading_date` | DATE | NOT NULL | Fecha de la lectura |
| `shift` | ENUM | NOT NULL | Turno de la lectura |
| `tank_level` | DECIMAL(5,2) | NOT NULL | Nivel del tanque (0-100%) |
| `flow_meter_reading` | DECIMAL | NOT NULL | Lectura del flujómetro acumulado |
| `calculated_consumption` | DECIMAL | NOT NULL | Consumo calculado vs lectura anterior |

---

## Enumeraciones Clave

### `cylinders.status`
| Valor | Descripción |
|-------|-------------|
| `full` | Lleno, disponible en almacén |
| `empty` | Vacío, listo para recarga |
| `in_use` | En uso (paciente o servicio) |
| `in_transit` | En tránsito hacia proveedor |
| `lost` | Extraviado |

### `cylinders.location`
| Valor | Descripción |
|-------|-------------|
| `CENTRAL` | Almacén central |
| `HOSPITALIZACION` | Servicio de hospitalización |
| `PADOMI` | Domicilio del paciente (PADOMI) |
| `ALMACEN` | Otro almacén |
| `PROVEEDOR` | En instalaciones del proveedor |

### `users.role`
| Valor | Descripción |
|-------|-------------|
| `Operator` | Operador de turno |
| `Administrator` | Administrador |
| `Engineer` | Ingeniero / Superadmin |

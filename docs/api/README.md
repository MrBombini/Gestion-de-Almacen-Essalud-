# 📚 Documentación de API - Sistema de Almacén Essalud

Esta carpeta contiene la documentación técnica de todos los endpoints disponibles en el Backend.

## Estructura de Archivos:

1. [**Catálogos (Tablas Maestras)**](catalogs.md): Mantenimiento de proveedores, tipos de gas, modelos y capacidades.
2. [**Recursos Core**](resources.md): Gestión de balones (cilindros), pacientes y ubicaciones.
3. [**Operaciones (Kardex)**](movements_readings.md): Registro de movimientos de inventario y lecturas de tanque.

## Consideraciones Generales:

- **Auth**: Actualmente las rutas están en `api.php` sin middleware para pruebas. Se recomienda usar Sanctum/Passport en producción.
- **Formato**: Todas las respuestas son en formato `application/json`.
- **Estandares**: Se utilizan códigos de respuesta HTTP estándar (`201` para creación, `200` para éxito, `404` para no encontrado, `422` para error de validación).
- **Logica de Negocio**: El sistema registra automáticamente los cambios de estado del balón en los movimientos de inventario (`InventoryMovementController`).

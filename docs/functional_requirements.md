# Requisitos Funcionales del Sistema de Gestión de Almacén (Central de Oxígeno)

El Sistema de Gestión de Almacén de la Central de Oxígeno de EsSalud está diseñado para controlar, rastrear y reportar el ciclo completo del oxígeno (gaseoso y líquido) y el estado de los cilindros (balones).

A continuación se detallan los requisitos funcionales implementados en el sistema actual.

## 1. Gestión de Accesos y Seguridad
* **Autenticación:** Login seguro para usuarios del sistema.
* **Roles y Permisos:** Control de acceso basado en roles (Administrador, Operador, Auditor) que restringen qué módulos puede ver y editar cada usuario.

## 2. Gestión de Inventario (Oxígeno Gaseoso y Cilindros)
* **Intercambio PADOMI:** Registro de atención donde un paciente entrega un cilindro vacío y se lleva uno lleno. Imprime un Ticket de Atención (Control de Atención).
* **Trasiego (Cascada):** Proceso industrial interno donde se utilizan cilindros llenos (grandes, generalmente "PROPIOS") para recargar cilindros más pequeños (vacíos).
* **Préstamos a Pacientes:** Registro de entrega inicial de un cilindro a un paciente que no tiene uno para entregar a cambio (autorizado mediante receta médica vigente).
* **Devolución de Pacientes:** Recepción de un cilindro devuelto definitivamente por un paciente (por alta médica, fallecimiento, viaje, etc.). Genera una "Constancia de Devolución" imprimible y filtra para que solo se puedan devolver balones de intercambio (EsSalud/Praxair).
* **Movimiento a Proveedores:** Salida de balones vacíos hacia la planta del proveedor para recarga, e ingreso de balones llenos desde el proveedor.
* **Periferia / Centros Médicos:** Envíos (Salidas) y Recepciones (Ingresos) de cilindros a/desde distintas entidades o centros periféricos.
* **Traslado Interno:** Movimiento de cilindros dentro de la misma locación (ej. entre Almacén Central y áreas hospitalarias internas).

## 3. Gestión de Oxígeno Líquido (Tanque Criogénico)
* **Lectura Diaria:** Registro del nivel (porcentaje o cantidad) de oxígeno líquido disponible en el tanque principal.
* **Recarga de Cisterna:** Registro de la llegada del camión cisterna del proveedor para inyectar oxígeno líquido al tanque del hospital.

## 4. Catálogos y Mantenimiento Maestros
* **Pacientes:** Registro, actualización y seguimiento de pacientes, incluyendo sus datos y las recetas médicas asignadas (con cálculo automático de vigencia).
* **Cilindros:** Mantenimiento de cada balón de oxígeno identificándolo de manera única (serie, capacidad, propiedad, estado y ubicación actual).
* **Tipos de Propiedad (Ownership / Modelos):** Identificación del propietario del balón (EsSalud, Praxair, Propio, etc.).
* **Entidades / Autoridades:** Registro de centros periféricos, hospitales y autoridades externas involucradas.
* **Servicios y Camas:** Catálogo de las áreas y camas del recinto hospitalario para asignar balones fijos.

## 5. Reportes y Dashboards
* **Dashboard Principal:** Vista rápida de indicadores de stock general (balones llenos, vacíos, por tipo de propiedad).
* **Dashboard de Consumo:** Analíticas detalladas y gráficas del consumo de oxígeno, flujos diarios y tendencias mensuales.
* **Generador de Tickets (Control de Atención):** Historial de intercambios con capacidad de búsqueda, paginación y reimpresión de tickets en formato térmico.
* **Control de Devoluciones:** Historial de devoluciones de pacientes con filtros, búsqueda y botón para imprimir la Constancia de Devolución (formato A4).
* **Formatos de Control:** Opción para imprimir una hoja física de "Control de Atención Paciente" (con cuadrícula de 25 celdas) de manera limpia para un paciente específico que cuente con receta activa.
* **Kardex Diario y Resume:** Reporte exhaustivo de entradas, salidas y saldos diarios que permite rastrear cada cilindro operado en la planta.
* **Rastreo de Cilindros (Cylinder Tracking):** Búsqueda por número de serie para conocer toda la trazabilidad y locaciones pasadas de un balón específico.
* **Alertas de Pacientes:** Reporte que detecta pacientes con recetas próximas a vencer o ya vencidas.
* **Reporte de Periferia y Proveedores:** Archivos exportables a Excel con columnas unificadas para auditar entradas y salidas con terceros.

## 6. Generación de Documentos y Exportación
* **Impresión de Constancias y Tickets:** El sistema soporta la apertura dinámica de ventanas de impresión optimizadas (impresora de ticket o formato A4 en navegador) sin depender de librerías PDF pesadas externas.
* **Exportación a Excel:** Capacidad para descargar los registros tabulados (como Kardex y Periferia) en formato `.xls` para control en hojas de cálculo.

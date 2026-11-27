## 3.2. Planificación del Proyecto

La planificación del proyecto para el **Sistema de Gestión y Control de Inventario de Oxígeno Medicinal (EsSalud)** establece el marco técnico, funcional y temporal para el desarrollo de una solución integral orientada a la trazabilidad de balones de oxígeno gaseoso, monitoreo de tanques criogénicos de oxígeno líquido, control de préstamos/canjes (Hospitalización, PADOMI, Periferia y Proveedores) y generación de reportes auditable-gerenciales (Kardex, Formato de Control y Consumo Mensual).

---

### 3.2.1. Análisis de Requisitos

El levantamiento de requisitos se estructuró a partir de las necesidades operativas del área de Ingeniería Hospitalaria, Almacén de Gases Medicinales y Servicios Asistenciales de EsSalud.

#### A. Requisitos Funcionales (RF)

**Tabla 1**  
*RF1. Autenticación y Control de Sesiones*

| Campo | Detalle |
| :--- | :--- |
| **Número de Requisito** | RF-01 |
| **Nombre de Requisito** | Autenticación y Control de Sesiones |
| **Tipo** | ☑ Requisito<br>☐ Restricción |
| **Fuente del Requisito** | Administrador del Sistema / Operador / Ingeniero |
| **Prioridad del requisito** | ☑ Alta/Esencial<br>☐ Media/Deseado<br>☐ Baja/Opcional |
| **Descripción** | RF1.1: Mostrar un formulario de inicio de sesión solicitando correo electrónico o usuario y contraseña.<br><br>RF1.2: Validar las credenciales contra la base de datos y verificar que la cuenta del usuario se encuentre activa (`is_active = true`).<br><br>RF1.3: Generar un token de acceso seguro (`Bearer Token` mediante Laravel Sanctum) al autenticarse exitosamente.<br><br>RF1.4: Identificar y cargar el rol del usuario (`Administrator`, `Engineer`, `Operator`) para habilitar los módulos correspondientes en el menú lateral.<br><br>RF1.5: Permitir el cierre de sesión revocando el token activo en el servidor y limpiando el estado de sesión en el navegador. |

<br>

**Tabla 2**  
*RF2. Gestión de Usuarios y Roles*

| Campo | Detalle |
| :--- | :--- |
| **Número de Requisito** | RF-02 |
| **Nombre de Requisito** | Gestión de Usuarios y Roles |
| **Tipo** | ☑ Requisito<br>☐ Restricción |
| **Fuente del Requisito** | Administrador del Sistema |
| **Prioridad del requisito** | ☑ Alta/Esencial<br>☐ Media/Deseado<br>☐ Baja/Opcional |
| **Descripción** | RF2.1: Permitir únicamente a los usuarios con rol `Administrator` acceder al módulo de administración de cuentas de usuario.<br><br>RF2.2: Registrar nuevos usuarios ingresando nombre completo, correo electrónico, contraseña encriptada y asignación de rol (`Operator`, `Engineer`, `Administrator`).<br><br>RF2.3: Permitir la edición de datos de perfil, actualización de credenciales y cambio de rol.<br><br>RF2.4: Permitir activar o desactivar cuentas de usuario (`toggle-status`) sin eliminar su historial de movimientos registrados en el Kardex. |

<br>

**Tabla 3**  
*RF3. Gestión del Catálogo de Balones de Oxígeno*

| Campo | Detalle |
| :--- | :--- |
| **Número de Requisito** | RF-03 |
| **Nombre de Requisito** | Gestión del Catálogo de Balones de Oxígeno |
| **Tipo** | ☑ Requisito<br>☐ Restricción |
| **Fuente del Requisito** | Operador de Planta / Ingeniero Hospitalario |
| **Prioridad del requisito** | ☑ Alta/Esencial<br>☐ Media/Deseado<br>☐ Baja/Opcional |
| **Descripción** | RF3.1: Permitir el registro individual de cilindros/balones de oxígeno indicando código de serie o código patrimonial único.<br><br>RF3.2: Registrar la capacidad volumétrica del balón en metros cúbicos ($\text{m}^3$), tales como $10\text{ m}^3$, $8\text{ m}^3$, $6\text{ m}^3$, $2\text{ m}^3$ o portátiles.<br><br>RF3.3: Asignar el tipo de propiedad del balón (Propio EsSalud, Proveedor Externo, Préstamo u otros registrados en el catálogo de propiedades).<br><br>RF3.4: Gestionar el estado operativo actual del balón (`Lleno`, `Vacío`, `Mantenimiento`, `Baja`) y su ubicación física actual (Almacén, Servicio Hospitalario, Paciente PADOMI, Periferia o Proveedor).<br><br>RF3.5: Permitir el filtrado y búsqueda rápida por código de balón, capacidad, propietario, ubicación y estado. |

<br>

**Tabla 4**  
*RF4. Gestión de Pacientes y Prescripciones Médicas*

| Campo | Detalle |
| :--- | :--- |
| **Número de Requisito** | RF-04 |
| **Nombre de Requisito** | Gestión de Pacientes y Prescripciones Médicas |
| **Tipo** | ☑ Requisito<br>☐ Restricción |
| **Fuente del Requisito** | Operador de Oxígeno / Área Asistencial y PADOMI |
| **Prioridad del requisito** | ☑ Alta/Esencial<br>☐ Media/Deseado<br>☐ Baja/Opcional |
| **Descripción** | RF4.1: Registrar pacientes beneficiarios de oxigenoterapia consignando tipo y número de documento (DNI/CE), nombres completos, teléfono, dirección y modalidad de atención (`PADOMI`, `Hospitalizado`, `Ambulatorio`).<br><br>RF4.2: Generar automáticamente códigos correlativos de control para nuevos registros de pacientes (`next-codes`).<br><br>RF4.3: Permitir el registro y administración de recetas o prescripciones médicas asociadas al paciente.<br><br>RF4.4: Especificar en cada prescripción el flujo de oxígeno indicado ($\text{L/min}$), horas de uso diario, médico tratante, fecha de emisión y fecha de vencimiento de la receta.<br><br>RF4.5: Mostrar el estado de vigencia de la receta médica al momento de despachar o canjear balones al paciente. |

<br>

**Tabla 5**  
*RF5. Gestión de Servicios, Camas, Proveedores y Autoridades*

| Campo | Detalle |
| :--- | :--- |
| **Número de Requisito** | RF-05 |
| **Nombre de Requisito** | Gestión de Servicios, Camas, Proveedores y Autoridades |
| **Tipo** | ☑ Requisito<br>☐ Restricción |
| **Fuente del Requisito** | Ingeniero Hospitalario / Administrador |
| **Prioridad del requisito** | ☐ Alta/Esencial<br>☑ Media/Deseado<br>☐ Baja/Opcional |
| **Descripción** | RF5.1: Administrar el catálogo de Servicios Hospitalarios (Emergencia, UCI, Hospitalización, Quirófano, Centros de Periferia, etc.).<br><br>RF5.2: Registrar y vincular las camas hospitalarias a cada servicio asistencial para el control de balones en piso.<br><br>RF5.3: Administrar el catálogo de Proveedores externos de oxígeno gaseoso y líquido (RUC, razón social, contacto).<br><br>RF5.4: Gestionar el catálogo de Tipos de Propiedad de balones y las Autoridades/Responsables que firman los formatos y reportes oficiales de EsSalud. |

<br>

**Tabla 6**  
*RF6. Registro de Canjes y Préstamos de Balones (Servicios, PADOMI y Periferia)*

| Campo | Detalle |
| :--- | :--- |
| **Número de Requisito** | RF-06 |
| **Nombre de Requisito** | Registro de Canjes y Préstamos de Balones |
| **Tipo** | ☑ Requisito<br>☐ Restricción |
| **Fuente del Requisito** | Operador de Almacén de Oxígeno |
| **Prioridad del requisito** | ☑ Alta/Esencial<br>☐ Media/Deseado<br>☐ Baja/Opcional |
| **Descripción** | RF6.1: Permitir el registro de canjes uno a uno o múltiples donde se entregan balones `Llenos` desde el almacén y se reciben balones `Vacíos` de retorno.<br><br>RF6.2: Soportar operaciones diferenciadas para Servicios Hospitalarios internos, Pacientes a domicilio (`PADOMI`) y Centros Asistenciales de `Periferia`.<br><br>RF6.3: Permitir el registro de préstamos directos de balones llenos a pacientes o servicios cuando no se entrega un balón vacío en el acto.<br><br>RF6.4: Validar antes de confirmar la transacción que los balones de salida estén en estado `Lleno` en almacén y que los balones recibidos no presenten duplicidad.<br><br>RF6.5: Actualizar automáticamente la ubicación y el estado de todos los balones involucrados y generar el número de vale/ticket de control correspondiente. |

<br>

**Tabla 7**  
*RF7. Control de Devoluciones de Balones en Préstamo*

| Campo | Detalle |
| :--- | :--- |
| **Número de Requisito** | RF-07 |
| **Nombre de Requisito** | Control de Devoluciones de Balones en Préstamo |
| **Tipo** | ☑ Requisito<br>☐ Restricción |
| **Fuente del Requisito** | Operador de Almacén de Oxígeno |
| **Prioridad del requisito** | ☑ Alta/Esencial<br>☐ Media/Deseado<br>☐ Baja/Opcional |
| **Descripción** | RF7.1: Listar todos los balones que se encuentran actualmente en condición de préstamo en poder de pacientes (PADOMI) o servicios hospitalarios.<br><br>RF7.2: Mostrar la fecha de entrega original, días transcurridos en préstamo, código del balón y datos del responsable o paciente.<br><br>RF7.3: Permitir registrar la devolución física del balón al almacén indicando si retorna `Vacío` o con remanente (`Lleno`), junto con la fecha, hora y observaciones.<br><br>RF7.4: Reincorporar automáticamente el balón devuelto al stock físico del almacén correspondiente y cerrar el préstamo pendiente. |

<br>

**Tabla 8**  
*RF8. Gestión del Proceso de Trasvase (Decanting)*

| Campo | Detalle |
| :--- | :--- |
| **Número de Requisito** | RF-08 |
| **Nombre de Requisito** | Gestión del Proceso de Trasvase (Decanting) |
| **Tipo** | ☑ Requisito<br>☐ Restricción |
| **Fuente del Requisito** | Operador de Planta de Oxígeno |
| **Prioridad del requisito** | ☐ Alta/Esencial<br>☑ Media/Deseado<br>☐ Baja/Opcional |
| **Descripción** | RF8.1: Permitir seleccionar uno o varios balones de gran capacidad (`Llenos`, ej. $10\text{ m}^3$) como cilindros fuente o matriz para el trasvase.<br><br>RF8.2: Seleccionar los balones portátiles o de menor capacidad (`Vacíos`) que serán recargados mediante el proceso de trasvase.<br><br>RF8.3: Registrar presiones iniciales y finales, fecha, turno y operador responsable de la operación.<br><br>RF8.4: Actualizar automáticamente en el inventario el estado de los balones pequeños recargados a `Lleno` y reflejar el consumo de los cilindros matriz en el Kardex. |

<br>

**Tabla 9**  
*RF9. Movimientos con Proveedores y Transferencias entre Almacenes*

| Campo | Detalle |
| :--- | :--- |
| **Número de Requisito** | RF-09 |
| **Nombre de Requisito** | Movimientos con Proveedores y Transferencias entre Almacenes |
| **Tipo** | ☑ Requisito<br>☐ Restricción |
| **Fuente del Requisito** | Operador de Almacén / Ingeniero Hospitalario |
| **Prioridad del requisito** | ☑ Alta/Esencial<br>☐ Media/Deseado<br>☐ Baja/Opcional |
| **Descripción** | RF9.1: Registrar la salida masiva de balones `Vacíos` entregados a un proveedor externo para su recarga, asociando guía de remisión o documento de salida.<br><br>RF9.2: Registrar el ingreso de balones `Llenos` abastecidos o devueltos por el proveedor externo hacia el almacén del hospital.<br><br>RF9.3: Permitir registrar transferencias internas de balones (`Llenos` o `Vacíos`) entre distintos almacenes o zonas de acopio del establecimiento.<br><br>RF9.4: Contabilizar automáticamente los metros cúbicos ($\text{m}^3$) ingresados por proveedor para los reportes de ingresos mensuales. |

<br>

**Tabla 10**  
*RF10. Control de Oxígeno Líquido (Lecturas Diarias y Recargas)*

| Campo | Detalle |
| :--- | :--- |
| **Número de Requisito** | RF-10 |
| **Nombre de Requisito** | Control de Oxígeno Líquido (Lecturas Diarias y Recargas) |
| **Tipo** | ☑ Requisito<br>☐ Restricción |
| **Fuente del Requisito** | Ingeniero Hospitalario / Operador de Planta |
| **Prioridad del requisito** | ☑ Alta/Esencial<br>☐ Media/Deseado<br>☐ Baja/Opcional |
| **Descripción** | RF10.1: Registrar las lecturas diarias del tanque criogénico de oxígeno líquido consignando fecha, hora, nivel del tanque, presión y conversión a volumen ($\text{m}^3$ o galones).<br><br>RF10.2: Calcular automáticamente el consumo diario de oxígeno líquido comparando la lectura anterior, las recargas recibidas y la lectura actual.<br><br>RF10.3: Registrar las recargas de oxígeno líquido realizadas por camiones cisterna del proveedor, indicando número de guía, cantidad descargada, nivel inicial y nivel final del tanque.<br><br>RF10.4: Permitir consultar el historial cronológico de lecturas y abastecimientos del tanque criogénico. |

<br>

**Tabla 11**  
*RF11. Monitoreo de Balones en Hospitalización y Alertas*

| Campo | Detalle |
| :--- | :--- |
| **Número de Requisito** | RF-11 |
| **Nombre de Requisito** | Monitoreo de Balones en Hospitalización y Alertas |
| **Tipo** | ☑ Requisito<br>☐ Restricción |
| **Fuente del Requisito** | Operador de Oxígeno / Personal de Supervisión en Piso |
| **Prioridad del requisito** | ☑ Alta/Esencial<br>☐ Media/Deseado<br>☐ Baja/Opcional |
| **Descripción** | RF11.1: Visualizar el listado de balones asignados actualmente a los servicios de hospitalización y su ubicación por cama.<br><br>RF11.2: Registrar lecturas periódicas de presión manométrica (PSI) y flujo de consumo de cada balón instalado en cama.<br><br>RF11.3: Permitir registrar el traslado de un balón de una cama a otra dentro del hospital manteniendo su historial de trazabilidad (`bed-transfer`).<br><br>RF11.4: Generar alertas visuales automáticas para balones con baja presión residual (próximos a agotarse), balones estancados sin movimiento por varios días o pacientes con prescripciones por vencer. |

<br>

**Tabla 12**  
*RF12. Guardado Automático de Borradores Operativos*

| Campo | Detalle |
| :--- | :--- |
| **Número de Requisito** | RF-12 |
| **Nombre de Requisito** | Guardado Automático de Borradores Operativos |
| **Tipo** | ☑ Requisito<br>☐ Restricción |
| **Fuente del Requisito** | Operador de Almacén |
| **Prioridad del requisito** | ☐ Alta/Esencial<br>☑ Media/Deseado<br>☐ Baja/Opcional |
| **Descripción** | RF12.1: Almacenar temporalmente en el servidor (`UserDrafts`) el avance de los formularios de movimientos de inventario por usuario y por módulo.<br><br>RF12.2: Recuperar automáticamente el borrador guardado si el operador recarga la página, cambia de vista o sufre una desconexión involuntaria.<br><br>RF12.3: Eliminar el borrador temporal de forma automática una vez que el movimiento de inventario se haya confirmado y guardado exitosamente, o cuando el usuario decida descartarlo. |

<br>

**Tabla 13**  
*RF13. Generación de Kardex, Formatos de Control y Exportación a Excel*

| Campo | Detalle |
| :--- | :--- |
| **Número de Requisito** | RF-13 |
| **Nombre de Requisito** | Generación de Kardex, Formatos de Control y Exportación a Excel |
| **Tipo** | ☑ Requisito<br>☐ Restricción |
| **Fuente del Requisito** | Ingeniero Hospitalario / Auditoría EsSalud |
| **Prioridad del requisito** | ☑ Alta/Esencial<br>☐ Media/Deseado<br>☐ Baja/Opcional |
| **Descripción** | RF13.1: Generar el reporte de Kardex Diario y Kardex General detallando saldos iniciales, ingresos, salidas y saldos finales tanto en cantidad de balones como en volumen ($\text{m}^3$).<br><br>RF13.2: Emitir el Formato Oficial de Control de Oxígeno, Control de Tickets/Vales, Reporte de Movimientos por Proveedor, Reporte de Periferia y Canjes PADOMI filtrados por rango de fechas.<br><br>RF13.3: Generar los reportes consolidados de Resumen Mensual e Ingresos Mensuales con firmas de las autoridades configuradas.<br><br>RF13.4: Permitir la exportación directa de cualquiera de los reportes a archivos Microsoft Excel (`.xlsx`) con formato institucional mediante `ExcelJS`. |

<br>

**Tabla 14**  
*RF14. Dashboard Gerencial y Trazabilidad Unitaria de Balones*

| Campo | Detalle |
| :--- | :--- |
| **Número de Requisito** | RF-14 |
| **Nombre de Requisito** | Dashboard Gerencial y Trazabilidad Unitaria de Balones |
| **Tipo** | ☑ Requisito<br>☐ Restricción |
| **Fuente del Requisito** | Jefatura de Ingeniería / Gerencia Hospitalaria |
| **Prioridad del requisito** | ☑ Alta/Esencial<br>☐ Media/Deseado<br>☐ Baja/Opcional |
| **Descripción** | RF14.1: Mostrar un panel de control (Dashboard) con indicadores en tiempo real: stock total de balones llenos y vacíos por capacidad, balones en servicios/PADOMI y consumo acumulado.<br><br>RF14.2: Proveer un módulo de Trazabilidad de Balones (`CylinderTracking`) y Búsqueda Unificada que muestre la línea de tiempo completa de un balón específico desde su ingreso hasta su ubicación actual.<br><br>RF14.3: Presentar un Reporte Ejecutivo de Consumo que compare la demanda de oxígeno gaseoso y líquido por servicio hospitalario y periodo para la toma de decisiones gerenciales. |

#### B. Requisitos No Funcionales (RNF)

| Código | Categoría | Descripción | Métrica / Criterio de Aceptación |
| :--- | :--- | :--- | :--- |
| **RNF-01** | Rendimiento | Carga diferida (Code Splitting) en el cliente web para optimizar el tiempo de respuesta inicial. | El bundle principal carga en $< 2\text{ s}$ mediante `React.lazy()` y `Suspense` empaquetado con Vite. |
| **RNF-02** | Rendimiento | Tiempo de respuesta de la API REST para transacciones operativas y consultas de Kardex. | El $95\%$ de las peticiones CRUD responden en $< 500\text{ ms}$ y reportes complejos en $< 2.5\text{ s}$. |
| **RNF-03** | Seguridad | Autenticación basada en tokens API y control de acceso basado en roles (RBAC) en middleware de servidor. | Uso obligatorio de `auth:sanctum`, middleware `role`, hashing `bcrypt` y protección CORS/CSRF. |
| **RNF-04** | Confiabilidad e Integridad | Consistencia transaccional en movimientos de inventario que afectan múltiples entidades simultáneamente. | Ejecución mediante transacciones ACID en base de datos relacional; cero discrepancias entre el estado del balón y su último movimiento. |
| **RNF-05** | Usabilidad | Interfaz responsiva, intuitiva y adaptada a flujos rápidos de almacén y planta de oxígeno. | Diseño con Tailwind CSS, selectores con búsqueda predictiva (`react-select`) y persistencia de borradores. |
| **RNF-06** | Mantenibilidad y Escalabilidad | Separación desacoplada entre Frontend (SPA) y Backend (API RESTful) bajo estándares modernos. | Código estructurado en React 19 + Vite 8 en el cliente y Laravel 12 (PHP 8.2+) con arquitectura MVC en el servidor. |

#### C. Especificación de Casos de Uso

**Casos de uso generales**

**Tabla 15**  
*CU-01. Iniciar Sesión*

| CU-01 | Iniciar Sesión | |
| :--- | :---: | :--- |
| **Versión** | 1.0 (19/11/26) | |
| **Dependencias** | RF-01. Autenticación y Control de Sesiones | |
| **Precondición** | *El usuario debe estar previamente registrado y con estado activo en el sistema bajo el rol de Operador, Ingeniero o Administrador.* | |
| **Secuencia** | **Paso** | **Acción** |
| | 1 | El usuario ingresa a la pantalla de acceso del sistema que muestra el formulario de inicio de sesión. |
| | 2 | El usuario ingresa su correo electrónico y contraseña en los campos correspondientes. |
| | 3 | El usuario presiona el botón "Iniciar Sesión" para enviar sus credenciales. |
| | 4 | El sistema valida las credenciales y redirige al panel principal habilitando el menú según el rol identificado. |
| **Postcondición** | El usuario accede al panel principal con los permisos correspondientes a su rol. | |
| **Excepciones** | **Paso** | **Acción** |
| | 3 | Si las credenciales son inválidas o la cuenta está inactiva, el sistema restringe el ingreso y muestra un mensaje de error. |

**Tabla 16**  
*CU-02. Gestionar Usuarios*

| CU-02 | Gestionar Usuarios | |
| :--- | :---: | :--- |
| **Versión** | 1.0 (19/11/26) | |
| **Dependencias** | RF-01. Autenticación y Control de Sesiones<br>RF-02. Gestión de Usuarios y Roles | |
| **Precondición** | *El usuario debe haber iniciado sesión en el sistema con el rol de Administrador.* | |
| **Secuencia** | **Paso** | **Acción** |
| | 1 | El administrador accede al módulo "Usuarios" desde la sección de Administración del menú lateral. |
| | 2 | El sistema muestra el listado de usuarios registrados con su rol y estado actual (Activo/Inactivo). |
| | 3 | El administrador selecciona la opción para crear un nuevo usuario, editar datos existentes o cambiar su estado activo/inactivo. |
| | 4 | El administrador completa el formulario (nombre, correo, rol, contraseña) y confirma la operación. |
| **Postcondición** | El registro del usuario queda creado o actualizado en el sistema con su respectivo rol y estado de acceso. | |
| **Excepciones** | **Paso** | **Acción** |
| | 4 | Si el correo electrónico ya se encuentra registrado en otra cuenta, el sistema rechaza el guardado e informa la duplicidad. |

**Tabla 17**  
*CU-03. Gestionar Catálogo de Balones*

| CU-03 | Gestionar Catálogo de Balones | |
| :--- | :---: | :--- |
| **Versión** | 1.0 (19/11/26) | |
| **Dependencias** | RF-03. Gestión del Catálogo de Balones de Oxígeno<br>RF-05. Gestión de Servicios, Camas, Proveedores y Autoridades | |
| **Precondición** | *El usuario debe haber iniciado sesión y deben existir tipos de propiedad registrados previamente.* | |
| **Secuencia** | **Paso** | **Acción** |
| | 1 | El usuario ingresa al módulo "Balones" dentro de la sección de Catálogos. |
| | 2 | El sistema despliega el inventario de cilindros mostrando código, capacidad (m³), propietario, ubicación y estado (Lleno, Vacío, Mantenimiento). |
| | 3 | El usuario selecciona "Nuevo Balón" o elige editar un balón existente de la tabla. |
| | 4 | El usuario registra el código de serie/patrimonial, capacidad en m³, tipo de propiedad, estado operativo y guarda los cambios. |
| **Postcondición** | El balón queda disponible en el catálogo maestro para participar en operaciones de inventario y trazabilidad. | |
| **Excepciones** | **Paso** | **Acción** |
| | 4 | Si el código de serie del balón ya existe en el sistema, se impide el registro duplicado y se notifica al usuario. |

**Tabla 18**  
*CU-04. Gestionar Pacientes y Prescripciones Médicas*

| CU-04 | Gestionar Pacientes y Prescripciones Médicas | |
| :--- | :---: | :--- |
| **Versión** | 1.0 (19/11/26) | |
| **Dependencias** | RF-04. Gestión de Pacientes y Prescripciones Médicas | |
| **Precondición** | *El usuario debe encontrarse autenticado con rol de Operador, Ingeniero o Administrador.* | |
| **Secuencia** | **Paso** | **Acción** |
| | 1 | El usuario accede al módulo "Pacientes" desde el menú de Catálogos. |
| | 2 | El usuario registra o selecciona un paciente ingresando documento de identidad (DNI/CE), nombres, dirección y modalidad (PADOMI u Hospitalizado). |
| | 3 | De manera opcional, el usuario accede a la ficha de prescripciones médicas del paciente para agregar o actualizar una receta de oxigenoterapia. |
| | 4 | El usuario ingresa el flujo en L/min, fecha de inicio y fecha de fin de la receta, y guarda la información. |
| **Postcondición** | El paciente y su prescripción médica activa quedan registrados y habilitados para la asignación o canje de balones. | |
| **Excepciones** | **Paso** | **Acción** |
| | 2 | Si el número de documento (DNI/CE) ya pertenece a otro paciente registrado, el sistema alerta la duplicidad. |

**Tabla 19**  
*CU-05. Gestionar Catálogos Hospitalarios*

| CU-05 | Gestionar Catálogos Hospitalarios | |
| :--- | :---: | :--- |
| **Versión** | 1.0 (19/11/26) | |
| **Dependencias** | RF-05. Gestión de Servicios, Camas, Proveedores y Autoridades | |
| **Precondición** | *El usuario debe haber iniciado sesión con permisos de administración de catálogos.* | |
| **Secuencia** | **Paso** | **Acción** |
| | 1 | El usuario selecciona en el menú de Catálogos la entidad a gestionar: Servicios, Camas, Proveedores, Tipos de Propiedad o Autoridades. |
| | 2 | El sistema presenta la tabla de registros vigentes con buscador y filtros correspondientes. |
| | 3 | El usuario abre el formulario de registro o edición y completa los datos requeridos (ej. nombre del servicio, código de cama, RUC de proveedor o cargo de autoridad). |
| | 4 | El usuario confirma el guardado y el sistema actualiza el catálogo inmediatamente. |
| **Postcondición** | Los catálogos maestros quedan actualizados para ser referenciados en movimientos de inventario y firmas de reportes. | |
| **Excepciones** | **Paso** | **Acción** |
| | 3 | Si se intenta eliminar un registro maestro que posee movimientos históricos en el Kardex, el sistema bloquea la eliminación física para preservar la integridad. |

**Tabla 20**  
*CU-06. Registrar Canje y Préstamo de Balones*

| CU-06 | Registrar Canje y Préstamo de Balones | |
| :--- | :---: | :--- |
| **Versión** | 1.0 (19/11/26) | |
| **Dependencias** | RF-06. Registro de Canjes y Préstamos de Balones<br>RF-12. Guardado Automático de Borradores Operativos | |
| **Precondición** | *Deben existir balones en estado "Lleno" disponibles en el almacén y el servicio, centro de periferia o paciente destino debe estar registrado.* | |
| **Secuencia** | **Paso** | **Acción** |
| | 1 | El operador ingresa al módulo de Canje (Servicios/PADOMI), Préstamo o Canje de Periferia en el menú de Inventario. |
| | 2 | El operador selecciona el destino (Servicio Hospitalario, Paciente PADOMI o Centro de Periferia), fecha y número de vale o documento. |
| | 3 | El operador selecciona los balones llenos que salen del almacén y, en caso de canje, selecciona los balones vacíos que ingresan de retorno. |
| | 4 | El operador verifica la disponibilidad de los cilindros seleccionados y presiona "Registrar Movimiento". |
| | 5 | El sistema registra el movimiento, actualiza el estado y ubicación de cada balón e impacta el Kardex diario. |
| **Postcondición** | Los balones entregados pasan a la ubicación destino y los balones vacíos recepcionados quedan en almacén en estado "Vacío". | |
| **Excepciones** | **Paso** | **Acción** |
| | 4 | Si algún balón de salida no se encuentra en estado "Lleno" o ya fue despachado en otra operación, el sistema cancela la transacción y muestra la alerta. |

**Tabla 21**  
*CU-07. Controlar Devolución de Balones*

| CU-07 | Controlar Devolución de Balones | |
| :--- | :---: | :--- |
| **Versión** | 1.0 (19/11/26) | |
| **Dependencias** | RF-07. Control de Devoluciones de Balones en Préstamo | |
| **Precondición** | *Deben existir balones registrados previamente en condición de préstamo activo en pacientes o servicios.* | |
| **Secuencia** | **Paso** | **Acción** |
| | 1 | El operador accede al módulo "Control de Devoluciones" o "Retorno de Préstamos" desde el menú de Inventario. |
| | 2 | El sistema lista los balones pendientes de devolución, indicando paciente o servicio, código del balón y días transcurridos. |
| | 3 | El operador localiza el balón devuelto físicamente, indica la condición de retorno (Vacío o Lleno) y registra la fecha y observaciones. |
| | 4 | El operador confirma la devolución y el sistema reincorpora el balón al stock del almacén. |
| **Postcondición** | El préstamo pendiente queda cerrado y el balón actualiza su ubicación al almacén principal. | |
| **Excepciones** | **Paso** | **Acción** |
| | 3 | Si el balón presenta daños físicos reportados en la recepción, el operador puede marcar su pase a estado de "Mantenimiento". |

**Tabla 22**  
*CU-08. Registrar Trasvase de Balones*

| CU-08 | Registrar Trasvase de Balones | |
| :--- | :---: | :--- |
| **Versión** | 1.0 (19/11/26) | |
| **Dependencias** | RF-08. Gestión del Proceso de Trasvase (Decanting) | |
| **Precondición** | *Deben existir en almacén balones matriz de gran capacidad en estado "Lleno" y balones de menor capacidad en estado "Vacío".* | |
| **Secuencia** | **Paso** | **Acción** |
| | 1 | El operador ingresa al módulo "Trasvase (Decanting)" en la sección de Inventario. |
| | 2 | El operador selecciona el balón o batería fuente (cilindro matriz lleno) del cual se extraerá el oxígeno. |
| | 3 | El operador selecciona los balones portátiles o pequeños vacíos que fueron llenados e ingresa los datos de presión y fecha. |
| | 4 | El operador confirma la operación de trasvase en el sistema. |
| **Postcondición** | Los balones portátiles recargados cambian su estado a "Lleno" y se actualiza el estado/consumo de los cilindros fuente en el Kardex. | |
| **Excepciones** | **Paso** | **Acción** |
| | 3 | Si se selecciona el mismo balón como fuente y destino simultáneamente, el sistema impide el registro y solicita corregir la selección. |

**Tabla 23**  
*CU-09. Registrar Movimientos con Proveedores y Almacenes*

| CU-09 | Registrar Movimientos con Proveedores y Almacenes | |
| :--- | :---: | :--- |
| **Versión** | 1.0 (19/11/26) | |
| **Dependencias** | RF-09. Movimientos con Proveedores y Transferencias entre Almacenes | |
| **Precondición** | *El proveedor externo y los balones involucrados deben estar registrados en los catálogos del sistema.* | |
| **Secuencia** | **Paso** | **Acción** |
| | 1 | El operador accede al módulo "Movimiento Proveedor" o "Transferencia de Almacén". |
| | 2 | El operador elige el tipo de operación (Envío de vacíos a proveedor, Recepción de llenos desde proveedor o Transferencia entre almacenes). |
| | 3 | El operador ingresa el proveedor o almacén destino, número de guía/documento y selecciona el lote de balones. |
| | 4 | El operador guarda la transacción y el sistema actualiza masivamente el estado y ubicación de los cilindros. |
| **Postcondición** | El stock de balones llenos/vacíos y el acumulado de m³ abastecidos por el proveedor se actualizan en el sistema. | |
| **Excepciones** | **Paso** | **Acción** |
| | 3 | Si se intenta recepcionar como vacío un balón que ya figura lleno en almacén, el sistema advierte la inconsistencia de estado. |

**Tabla 24**  
*CU-10. Gestionar Oxígeno Líquido*

| CU-10 | Gestionar Oxígeno Líquido | |
| :--- | :---: | :--- |
| **Versión** | 1.0 (19/11/26) | |
| **Dependencias** | RF-10. Control de Oxígeno Líquido (Lecturas Diarias y Recargas) | |
| **Precondición** | *El usuario debe haber iniciado sesión como Operador, Ingeniero o Administrador.* | |
| **Secuencia** | **Paso** | **Acción** |
| | 1 | El usuario ingresa a la sección "Oxígeno Líquido" y selecciona "Lectura Diaria" o "Recarga de Tanque". |
| | 2 | Para lectura diaria, registra fecha, nivel del tanque criogénico y presión; para recarga, ingresa proveedor, guía y volumen descargado (m³). |
| | 3 | El sistema calcula automáticamente la equivalencia volumétrica y el consumo diario respecto a la lectura previa. |
| | 4 | El usuario confirma el registro y el sistema actualiza el historial del tanque criogénico. |
| **Postcondición** | La lectura o recarga de oxígeno líquido queda registrada y disponible para los reportes de consumo diario y mensual. | |
| **Excepciones** | **Paso** | **Acción** |
| | 2 | Si se ingresan valores negativos o fuera de la capacidad máxima del tanque criogénico, el sistema bloquea el registro y solicita verificar el dato. |

**Tabla 25**  
*CU-11. Monitorear Balones en Hospitalización*

| CU-11 | Monitorear Balones en Hospitalización | |
| :--- | :---: | :--- |
| **Versión** | 1.0 (19/11/26) | |
| **Dependencias** | RF-11. Monitoreo de Balones en Hospitalización y Alertas | |
| **Precondición** | *Deben existir balones despachados a servicios de hospitalización y camas registradas en dichos servicios.* | |
| **Secuencia** | **Paso** | **Acción** |
| | 1 | El usuario ingresa al módulo "Control de Hospitalización" o "Alertas". |
| | 2 | El sistema muestra los balones activos por servicio y cama, destacando alertas por baja presión o estancamiento. |
| | 3 | El usuario selecciona un balón en piso para registrar una nueva lectura de manómetro (PSI) o registrar su traslado a otra cama. |
| | 4 | El sistema guarda la lectura o transferencia de cama y recalcula el estado de alerta del balón. |
| **Postcondición** | El historial de lecturas PSI y la cama actual del balón quedan actualizados en tiempo real. | |
| **Excepciones** | **Paso** | **Acción** |
| | 3 | Si la presión registrada es inferior al umbral crítico configurado, el sistema activa inmediatamente una alerta visual de recambio urgente. |

**Tabla 26**  
*CU-12. Generar Reportes y Kardex*

| CU-12 | Generar Reportes y Kardex | |
| :--- | :---: | :--- |
| **Versión** | 1.0 (19/11/26) | |
| **Dependencias** | RF-13. Generación de Kardex, Formatos de Control y Exportación a Excel<br>RF-14. Dashboard Gerencial y Trazabilidad Unitaria de Balones | |
| **Precondición** | *El usuario debe estar autenticado y deben existir movimientos o lecturas registradas en el periodo consultado.* | |
| **Secuencia** | **Paso** | **Acción** |
| | 1 | El usuario accede a la sección "Reportes" o al "Dashboard" y elige el reporte deseado (Kardex, Formato de Control, Tickets, Proveedores, Periferia, PADOMI, Resumen Mensual o Trazabilidad). |
| | 2 | El usuario establece los criterios de búsqueda (rango de fechas, mes/año, servicio, proveedor o código de balón). |
| | 3 | El sistema procesa las transacciones del periodo y presenta en pantalla las tablas consolidadas en unidades y metros cúbicos (m³). |
| | 4 | De forma opcional, el usuario presiona "Exportar a Excel" para descargar el documento oficial formateado (.xlsx). |
| **Postcondición** | El reporte es visualizado en pantalla y/o descargado en archivo Excel con el formato institucional de EsSalud. | |
| **Excepciones** | **Paso** | **Acción** |
| | 3 | Si no existen registros para los filtros seleccionados, el sistema informa que no hay datos en el periodo e inhabilita la exportación vacía. |

---

### 3.2.2. Diseño del Sistema

El sistema adopta una arquitectura **Cliente-Servidor desacoplada** de tres capas: una aplicación de página única (**SPA** en React) para la capa de presentación, una **API RESTful** (en Laravel 12) para la lógica de negocio y seguridad, y un motor de **Base de Datos Relacional** para la persistencia transaccional.

#### A. Diagrama de Arquitectura del Sistema (PlantUML)

```plantuml
@startuml Arquitectura_Sistema_EsSalud
top to bottom direction
skinparam componentStyle uml2
skinparam defaultFontName Arial
skinparam defaultFontSize 11
skinparam shadowing false
skinparam packageStyle rectangle
skinparam nodesep 20
skinparam ranksep 24
skinparam padding 4
scale max 720 width

package "Capa de Presentación (Frontend SPA)" #EBF5FB {
    [React 19 + Tailwind CSS 4] as UI
    [React Router DOM v7\n(Lazy / Suspense)] as Router
    [Motor Exportación\n(ExcelJS)] as Excel
    [Cliente HTTP\n(Axios + Interceptors)] as Axios

    UI -right-> Router : Navegación
    UI -left-> Excel : Exporta .xlsx
    Router -down-> Axios : Peticiones API
}

package "Capa de Negocio (Backend API - Laravel 12)" #FEF9E7 {
    [Middleware Auth:Sanctum\n& Control Roles (RBAC)] as Sanctum
    [Controladores REST\n(Inventory, Report, Liquid,\nHospitalization, Catalogs)] as Controllers
    [Eloquent ORM &\nGestor Transacciones] as Models

    Sanctum -right-> Controllers : Autoriza
    Controllers -right-> Models : Lógica
}

package "Capa de Datos" #EAFAF1 {
    database "Base de Datos Relacional\n(MySQL / SQLite)" as DB
}

Axios <--> Sanctum : JSON / HTTPS (Bearer Token)
Models <--> DB : Consultas SQL (Transacciones ACID)

@enduml
```

#### B. Modelo Entidad-Relación (Diagrama de Datos Principal en PlantUML)

```plantuml
@startuml Modelo_Entidad_Relacion_EsSalud
hide circle
top to bottom direction
skinparam linetype ortho
skinparam defaultFontName Arial
skinparam defaultFontSize 10
skinparam shadowing false
skinparam nodesep 16
skinparam ranksep 18
skinparam padding 2
scale max 750 width

together {
    entity "users" as users {
        *id : bigint <<PK>>
        --
        *name : varchar
        *email : varchar <<UK>>
        *password : varchar
        *role : varchar
        *is_active : boolean
    }
    entity "user_drafts" as drafts {
        *id : bigint <<PK>>
        --
        *user_id : bigint <<FK>>
        *module : varchar
        *payload : json
    }
    entity "patients" as patients {
        *id : bigint <<PK>>
        --
        *document_number : varchar <<UK>>
        *full_name : varchar
        *patient_type : varchar
        phone : varchar
        address : varchar
    }
    entity "prescriptions" as prescriptions {
        *id : bigint <<PK>>
        --
        *patient_id : bigint <<FK>>
        *flow_rate : decimal
        *start_date : date
        *end_date : date
    }
}

together {
    entity "services" as services {
        *id : bigint <<PK>>
        --
        *name : varchar
        *type : varchar
    }
    entity "beds" as beds {
        *id : bigint <<PK>>
        --
        *code : varchar
        *service_id : bigint <<FK>>
        *status : varchar
    }
    entity "suppliers" as suppliers {
        *id : bigint <<PK>>
        --
        *ruc : varchar <<UK>>
        *name : varchar
        contact : varchar
    }
    entity "liquid_refills" as refills {
        *id : bigint <<PK>>
        --
        *supplier_id : bigint <<FK>>
        *refill_date : datetime
        *quantity_m3 : decimal
        guide_number : varchar
    }
}

together {
    entity "inventory_movements" as movements {
        *id : bigint <<PK>>
        --
        *movement_type : varchar
        *voucher_number : varchar
        *movement_date : datetime
        *user_id : bigint <<FK>>
        service_id : bigint <<FK>>
        patient_id : bigint <<FK>>
        supplier_id : bigint <<FK>>
    }
    entity "movement_details" as details {
        *id : bigint <<PK>>
        --
        *movement_id : bigint <<FK>>
        *cylinder_id : bigint <<FK>>
        *direction : varchar
    }
    entity "cylinders" as cylinders {
        *id : bigint <<PK>>
        --
        *code : varchar <<UK>>
        *capacity_m3 : decimal
        *status : varchar
        *current_location : varchar
        *ownership_type_id : bigint <<FK>>
    }
    entity "ownership_types" as ownership {
        *id : bigint <<PK>>
        --
        *name : varchar
        description : varchar
    }
}

together {
    entity "hospitalization_readings" as hosp_readings {
        *id : bigint <<PK>>
        --
        *cylinder_id : bigint <<FK>>
        *bed_id : bigint <<FK>>
        *pressure_psi : decimal
        *reading_date : datetime
    }
    entity "daily_readings" as daily_readings {
        *id : bigint <<PK>>
        --
        *reading_date : date
        *level_inches : decimal
        *volume_m3 : decimal
        *consumption_m3 : decimal
    }
}

users ||-right-o{ drafts : "guarda"
patients ||-right-o{ prescriptions : "tiene"
services ||-right-o{ beds : "contiene"
suppliers ||-right-o{ refills : "recarga"
ownership ||-left-o{ cylinders : "clasifica"

users ||--o{ movements : "registra"
patients ||--o{ movements : "recibe"
services ||--o{ movements : "solicita"
suppliers ||--o{ movements : "abastece"

movements ||-right-|{ details : "detalla"
cylinders ||-left-o{ details : "participa"
cylinders ||--o{ hosp_readings : "monitorea_psi"
beds ||--o{ hosp_readings : "ubica"
hosp_readings -[hidden]right- daily_readings

@enduml
```

#### C. Diagrama de Secuencia: Proceso de Canje / Movimiento de Balones (PlantUML)

```plantuml
@startuml Secuencia_Canje_Balones_EsSalud
autonumber
hide footbox
skinparam defaultFontName Arial
skinparam defaultFontSize 10
skinparam shadowing false
skinparam sequenceMessageAlign center
skinparam ParticipantPadding 8
skinparam BoxPadding 4
skinparam maxMessageSize 170
scale max 720 width

actor "Operador /\nAlmacén" as Op
participant "Frontend\n(React SPA)" as SPA
participant "Backend API\n(InventoryMovement)" as API
database "Base de Datos\nRelacional" as DB

Op -> SPA : Selecciona destino y balones (llenos/vacíos)
activate SPA
SPA -> SPA : Valida campos y guarda UserDraft
SPA -> API : POST /api/inventory/exchange (Token + JSON)
activate API

API -> API : Verifica auth:sanctum y rol RBAC
API -> DB : BEGIN TRANSACTION & verifica estado balones
activate DB

alt Balones válidos y disponibles
    API -> DB : INSERT cabecera (inventory_movements) y detalle
    API -> DB : UPDATE cylinders (status, location) & limpia borrador
    API -> DB : COMMIT
    DB --> API : Transacción confirmada
    API --> SPA : 201 Created (Movimiento + N° Vale)
    SPA --> Op : Notifica éxito y actualiza Kardex
else Conflicto de estado o balón no disponible
    API -> DB : ROLLBACK
    DB --> API : Transacción revertida
    deactivate DB
    API --> SPA : 422 Unprocessable Entity (Detalle error)
    deactivate API
    SPA --> Op : Muestra alerta de validación
    deactivate SPA
end

@enduml
```

#### D. Diagrama de Casos de Uso General del Sistema (PlantUML)

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle
skinparam defaultFontName Arial
skinparam defaultFontSize 10
skinparam shadowing false
skinparam nodesep 10
skinparam ranksep 22
skinparam usecase {
    Padding 4
}
scale max 750 width

actor "Operador" as Op
actor "Ingeniero" as Eng
actor "Administrador" as Admin

Op <|-down- Eng
Eng <|-down- Admin

rectangle "Sistema de Inventario de Oxígeno Medicinal - EsSalud" {
    together {
        usecase "CU-01: Iniciar sesión" as CU01
        usecase "CU-02: Gestionar usuarios" as CU02
        usecase "CU-03: Gestionar balones" as CU03
        usecase "CU-04: Gestionar pacientes\ny prescripciones" as CU04
        usecase "CU-05: Gestionar catálogos\nhospitalarios" as CU05
        usecase "CU-06: Registrar canje\ny préstamo" as CU06
    }
    together {
        usecase "CU-07: Controlar devolución\nde balones" as CU07
        usecase "CU-08: Registrar trasvase" as CU08
        usecase "CU-09: Movimientos con\nproveedores y almacenes" as CU09
        usecase "CU-10: Gestionar O2 líquido" as CU10
        usecase "CU-11: Monitorear balones\nen hospitalización" as CU11
        usecase "CU-12: Generar reportes\ny Kardex" as CU12
    }

    usecase "Verificar disponibilidad\nde balón" as CUVerif
    usecase "Exportar reporte\na Excel" as CUExcel

    CU01 -[hidden]right-> CU07
    CU03 -[hidden]right-> CU08
    CU04 -[hidden]right-> CU09
    CU06 -[hidden]right-> CU12

    CU06 ..> CUVerif : <<include>>
    CU08 ..> CUVerif : <<include>>
    CU09 ..> CUVerif : <<include>>
    CUExcel .up.> CU12 : <<extend>>
}

Op --> CU01
Op --> CU03
Op --> CU04
Op --> CU06
Op --> CU07
Op --> CU08
Op --> CU09
Op --> CU10
Op --> CU11
Op --> CU12
Eng --> CU05
Admin --> CU02
@enduml
```

#### E. Diagrama de Casos de Uso: Rol Administrador (PlantUML)

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle
skinparam defaultFontName Arial
skinparam defaultFontSize 10
skinparam shadowing false
skinparam nodesep 10
skinparam ranksep 22
skinparam usecase {
    Padding 4
}
scale max 720 width

actor "Administrador" as Admin

rectangle "Sistema de Oxígeno Medicinal - EsSalud (Administrador)" {
    together {
        usecase "Iniciar sesión" as CUA01
        usecase "Gestionar usuarios" as CUA02
        usecase "Gestionar catálogo\nde balones" as CUA03
        usecase "Gestionar pacientes\ny prescripciones" as CUA04
        usecase "Gestionar servicios\ny camas" as CUA05
    }
    together {
        usecase "Gestionar proveedores y\ntipos de propiedad" as CUA06
        usecase "Gestionar autoridades\nfirmantes" as CUA07
        usecase "Consultar dashboard\ngerencial" as CUA08
        usecase "Generar reportes\ny Kardex" as CUA09
        usecase "Exportar reporte\na Excel" as CUA10
    }

    CUA01 -[hidden]right-> CUA06
    CUA02 -[hidden]right-> CUA07
    CUA03 -[hidden]right-> CUA08
    CUA04 -[hidden]right-> CUA09
    CUA10 .up.> CUA09 : <<extend>>
}

Admin --> CUA01
Admin --> CUA02
Admin --> CUA03
Admin --> CUA04
Admin --> CUA05
Admin --> CUA06
Admin --> CUA07
Admin --> CUA08
Admin --> CUA09
@enduml
```

#### F. Diagrama de Casos de Uso: Rol Usuario Operador (PlantUML)

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle
skinparam defaultFontName Arial
skinparam defaultFontSize 10
skinparam shadowing false
skinparam nodesep 10
skinparam ranksep 22
skinparam usecase {
    Padding 4
}
scale max 720 width

actor "Operador" as Op

rectangle "Sistema de Oxígeno Medicinal - EsSalud (Operador)" {
    together {
        usecase "Iniciar sesión" as CUO01
        usecase "Gestionar catálogo\nde balones" as CUO02
        usecase "Gestionar pacientes\ny prescripciones" as CUO03
        usecase "Registrar canje y\npréstamo de balones" as CUO04
        usecase "Controlar devolución\nde balones" as CUO05
    }
    together {
        usecase "Registrar trasvase\nde balones" as CUO06
        usecase "Movimientos proveedores\ny almacenes" as CUO07
        usecase "Gestionar oxígeno\nlíquido" as CUO08
        usecase "Monitorear balones\nen hospitalización" as CUO09
        usecase "Generar reportes\ny Kardex" as CUO10
    }

    usecase "Verificar disponibilidad\nde balón" as CUOVerif
    usecase "Exportar reporte\na Excel" as CUOExcel

    CUO01 -[hidden]right-> CUO06
    CUO02 -[hidden]right-> CUO07
    CUO03 -[hidden]right-> CUO08
    CUO05 -[hidden]right-> CUO10

    CUO04 ..> CUOVerif : <<include>>
    CUO06 ..> CUOVerif : <<include>>
    CUO07 ..> CUOVerif : <<include>>
    CUOExcel .up.> CUO10 : <<extend>>
}

Op --> CUO01
Op --> CUO02
Op --> CUO03
Op --> CUO04
Op --> CUO05
Op --> CUO06
Op --> CUO07
Op --> CUO08
Op --> CUO09
Op --> CUO10
@enduml
```

---

### 3.2.3. Planificación de Tareas y Cronograma (Metodología en Cascada)

La planificación temporal y asignación de recursos del proyecto se estructuró aplicando el **Modelo de Ciclo de Vida en Cascada (*Waterfall*)**, organizando la ejecución en **cinco (5) fases secuenciales y disciplinadas**: **1) Análisis y Especificación de Requisitos**, **2) Diseño del Sistema y Base de Datos**, **3) Implementación y Codificación**, **4) Integración y Pruebas**, y **5) Despliegue, Operación y Mantenimiento Evolutivo**. Bajo este enfoque tradicional, cada fase genera un entregable formal verificado que actúa como línea base (*baseline*) obligatoria antes de iniciar la etapa siguiente.

El cronograma abarca desde el **08 de mayo de 2026** hasta **noviembre de 2026** (**29 semanas / 7 meses**), reflejando fielmente la evolución técnica y organizativa del equipo ejecutor en las instalaciones de **GLAES S.A.C. — Hospital Nacional Adolfo Guevara Velasco (EsSalud Cusco)**.

#### A. Organización del Equipo y Asignación de Responsabilidades por Etapas

El equipo del proyecto estuvo conformado por dos (2) responsables técnicos, cuya distribución de funciones se especializó conforme el proyecto avanzó desde la codificación inicial hasta la puesta en producción en servidor VPS:

**Tabla 27**  
*Asignación de Roles, Responsables y Evolución Operativa en el Ciclo de Vida en Cascada*

| Integrante del Equipo | Rol en Etapas 1 a 3 (Análisis, Diseño y Codificación Inicial) | Rol en Etapas 4 y 5 (Integración, Despliegue VPS y Mantenimiento) | Responsabilidades y Entregables Principales |
| :--- | :--- | :--- | :--- |
| **Jose Miguel Peralta Poblete** | **Analista Funcional / Desarrollador Backend** | **Desarrollador Fullstack (Backend Laravel 12 + Frontend React 19)** | • Levantamiento de requerimientos y reglas del Kardex en planta.<br>• Construcción de controladores API REST, middleware RBAC (`Sanctum`) y transacciones ACID.<br>• Unificación Fullstack de módulos avanzados (Hospitalización PSI, Oxígeno Líquido, Kardex Diario/Mensual y exportación institucional con `ExcelJS`).<br>• Ejecución de pruebas unitarias, de integración y validación funcional. |
| **Rodrigo Sergio Cayalta Huaman** | **Diseñador UI/UX / Desarrollador Frontend** | **Administrador de Base de Datos y Servidor (DBA / DevOps)** | • Prototipado de interfaces y maquetación inicial de la SPA en React 19 + Tailwind CSS 4.<br>• Diseño físico, normalización, índices y gestión de migraciones en MySQL.<br>• Aprovisionamiento y aseguramiento del servidor web **VPS** (dominio, SSL/HTTPS, Nginx/Apache, variables de entorno).<br>• Automatización de copias de seguridad (*backups*), snapshots diarios de Kardex y monitoreo en producción. |

#### B. Estructura de Desglose de Trabajo (EDT / WBS) Secuencial

1. **Fase 1: Análisis y Especificación de Requisitos (08/05/2026 – 04/06/2026)**
   - **1.1:** Diagnóstico presencial en planta/almacén de oxígeno de GLAES S.A.C. y recopilación de cuadernos de ruta y formatos físicos de EsSalud.
   - **1.2:** Definición y validación de los 14 Requisitos Funcionales (`RF-01` a `RF-14`) y 6 Requisitos No Funcionales (`RNF-01` a `RNF-06`).
   - **1.3:** Modelado de actores y especificación formal de los 12 Casos de Uso del sistema (`CU-01` a `CU-12`).
2. **Fase 2: Diseño del Sistema y Base de Datos (05/06/2026 – 02/07/2026)**
   - **2.1:** Diseño de la Arquitectura Cliente-Servidor en tres capas (SPA React + API REST Laravel + MySQL) y contratos de endpoints.
   - **2.2:** Diseño del Modelo Entidad-Relación (MER), diccionario de datos y Diagrama Físico relacional para trazabilidad de activos retornables.
   - **2.3:** Diseño de diagramas de secuencia transaccionales y prototipos de interfaz de usuario orientados a operación rápida en planta.
3. **Fase 3: Implementación y Codificación de Módulos (03/07/2026 – 24/09/2026)**
   - **3.1:** Configuración del monorepo Git, estructura base de Backend (Laravel 12) y Frontend (React 19 + Vite 8), autenticación `Sanctum` y control de roles (RBAC).
   - **3.2:** Codificación del Módulo de Catálogos Maestros (Balones, Pacientes, Prescripciones Médicas, Servicios, Camas, Proveedores, Propiedades y Autoridades).
   - **3.3:** Codificación del núcleo transaccional de Oxígeno Gaseoso (Canjes, Préstamos PADOMI, Devoluciones, Periferia, Proveedores, Trasvase y Borradores `UserDrafts`).
   - **3.4:** Reorganización técnica (Fullstack + DBA/DevOps) y desarrollo de los módulos de Oxígeno Líquido (tanque criogénico), Monitoreo PSI en Hospitalización y Alertas.
   - **3.5:** Codificación del motor analítico de Reportes, Kardex Diario/General (corte operativo 07:00 AM), Trazabilidad Unitaria y exportación `.xlsx` con `ExcelJS`.
4. **Fase 4: Integración y Pruebas de Software (25/09/2026 – 22/10/2026)**
   - **4.1:** Integración integral Frontend–Backend–BD, optimización de carga diferida (`React.lazy` / `Suspense`) y afinamiento de consultas SQL.
   - **4.2:** Ejecución de Pruebas Unitarias (`PU-01` a `PU-06`) y Pruebas de Integración transaccional ACID (`PI-01` a `PI-05`).
   - **4.3:** Ejecución de Pruebas de Sistema y Validación Funcional End-to-End (`PS-01` a `PS-05`) y prueba piloto en red local de planta con operadores reales.
5. **Fase 5: Despliegue en Producción y Mantenimiento Evolutivo (23/10/2026 – 27/11/2026 / En operación continua)**
   - **5.1:** Configuración de infraestructura en servidor VPS, base de datos productiva MySQL, certificados SSL y políticas automatizadas de *backups*.
   - **5.2:** Migración del padrón real de cilindros/pacientes, despliegue oficial en producción y capacitación al personal operativo e ingenieros.
   - **5.3:** Operación asistida, mantenimiento perfectivo/evolutivo de reportes mensuales de cierre de Kardex y elaboración de documentación técnica y Manual de Usuario.

#### C. Cronograma Detallado de Ejecución en Cascada (Fechas, Predecesoras y Entregables)

**Tabla 28**  
*Programación Secuencial de Fases, Tareas, Predecesoras y Entregables (Mayo – Noviembre 2026)*

| Código EDT | Fase / Actividad del Modelo en Cascada | Predecesora | Fecha Inicio | Fecha Fin | Duración (Días Cal.) | Responsable Directo | Entregable / Verificador |
| :-: | :--- | :-: | :-: | :-: | :-: | :--- | :--- |
| **F1** | **FASE 1: ANÁLISIS DE REQUISITOS** | **—** | **08/05/2026** | **04/06/2026** | **28 días** | **Ambos tesistas** | **Especificación SRS aprobada** |
| 1.1 | Levantamiento de información en planta GLAES S.A.C. y análisis de formatos EsSalud | — | 08/05/2026 | 17/05/2026 | 10 días | J. M. Peralta / R. S. Cayalta | Diagnóstico situacional y formatos base |
| 1.2 | Definición y validación de Requisitos Funcionales (RF-01..14) y No Funcionales (RNF-01..06) | 1.1 | 18/05/2026 | 27/05/2026 | 10 días | J. M. Peralta / R. S. Cayalta | Matriz de requisitos RF y RNF |
| 1.3 | Modelado de actores y especificación detallada de Casos de Uso (CU-01 al CU-12) | 1.2 | 28/05/2026 | 04/06/2026 | 8 días | J. M. Peralta / R. S. Cayalta | Diagramas y fichas CU-01 a CU-12 |
| **F2** | **FASE 2: DISEÑO DEL SISTEMA** | **F1** | **05/06/2026** | **02/07/2026** | **28 días** | **Ambos tesistas** | **Documento de Diseño Técnico** |
| 2.1 | Diseño de Arquitectura en 3 capas, seguridad Sanctum/RBAC y rutas API REST | 1.3 | 05/06/2026 | 14/06/2026 | 10 días | J. M. Peralta (Backend) | Diagrama de Arquitectura y API spec |
| 2.2 | Diseño del Modelo Entidad-Relación (MER) y Modelo Físico de Base de Datos | 1.3 | 12/06/2026 | 24/06/2026 | 13 días | R. S. Cayalta / J. M. Peralta | Diagramas MER y Físico normalizado |
| 2.3 | Diseño de secuencias transaccionales y prototipos de vistas UI/UX | 2.1, 2.2 | 25/06/2026 | 02/07/2026 | 8 días | R. S. Cayalta (Frontend) | Diagrama de Secuencia y maquetas UI |
| **F3** | **FASE 3: IMPLEMENTACIÓN Y CODIFICACIÓN** | **F2** | **03/07/2026** | **24/09/2026** | **84 días** | **Equipo (División / Reorg.)** | **Módulos de Software v1.0** |
| 3.1 | Inicialización del repositorio Git, Seguridad (`AuthController`), Usuarios y Roles | 2.3 | 03/07/2026 | 16/07/2026 | 14 días | J. M. Peralta (Back) / R. S. Cayalta (Front) | Módulo 1 operativo + Login SPA |
| 3.2 | Desarrollo de Catálogos Maestros (Balones, Pacientes, Recetas, Servicios, Camas, Proveedores) | 3.1 | 17/07/2026 | 06/08/2026 | 21 días | J. M. Peralta (Back) / R. S. Cayalta (Front) | Módulo 2 CRUD + migraciones base |
| 3.3 | Desarrollo de Operaciones de Inventario Gaseoso (Canjes, PADOMI, Devoluciones, Trasvase, Proveedor) | 3.2 | 07/08/2026 | 27/08/2026 | 21 días | J. M. Peralta (Back) / R. S. Cayalta (Front) | Módulo 3 transaccional + `UserDrafts` |
| 3.4 | Desarrollo de Oxígeno Líquido y Monitoreo PSI en Hospitalización con Alertas | 3.3 | 28/08/2026 | 10/09/2026 | 14 días | J. M. Peralta (Fullstack) / R. S. Cayalta (DBA) | Módulos 4 y 5 + tablas de lecturas PSI |
| 3.5 | Desarrollo de Kardex Diario/General, Trazabilidad, Resumen Mensual y exportación `ExcelJS` | 3.4 | 11/09/2026 | 24/09/2026 | 14 días | J. M. Peralta (Fullstack) / R. S. Cayalta (DBA) | Módulo 6 analítico + reportes `.xlsx` |
| **F4** | **FASE 4: INTEGRACIÓN Y PRUEBAS** | **F3** | **25/09/2026** | **22/10/2026** | **28 días** | **Fullstack + DBA/DevOps** | **Informe de Pruebas Aprobado** |
| 4.1 | Integración de módulos, Code Splitting (`React.lazy`) y optimización de índices en BD | 3.5 | 25/09/2026 | 04/10/2026 | 10 días | J. M. Peralta / R. S. Cayalta | SPA integrada y consultas optimizadas |
| 4.2 | Ejecución de Pruebas Unitarias (PU-01..06) y Pruebas de Integración ACID (PI-01..05) | 4.1 | 05/10/2026 | 14/10/2026 | 10 días | J. M. Peralta (Fullstack) | Suites automatizadas en PHPUnit |
| 4.3 | Pruebas de Sistema (PS-01..05) y validación en servidor piloto local en planta | 4.2 | 15/10/2026 | 22/10/2026 | 8 días | J. M. Peralta / R. S. Cayalta | Conformidad funcional de planta |
| **F5** | **FASE 5: DESPLIEGUE Y MANTENIMIENTO** | **F4** | **23/10/2026** | **27/11/2026*** | **36 días** | **DBA/DevOps + Fullstack** | **Sistema en Producción (VPS)** |
| 5.1 | Configuración de servidor VPS, seguridad SSL/HTTPS, BD productiva y *backups* automáticos | 4.3 | 23/10/2026 | 02/11/2026 | 11 días | R. S. Cayalta (DBA / DevOps) | Servidor VPS productivo y respaldos |
| 5.2 | Migración de inventario real de cilindros, puesta en marcha oficial y capacitación a operadores | 5.1 | 03/11/2026 | 12/11/2026 | 10 días | R. S. Cayalta / J. M. Peralta | Sistema en vivo + personal capacitado |
| 5.3 | Mantenimiento evolutivo (ajustes de corte Kardex 07:00 AM y reportes mensuales) y cierre documental | 5.2 | 13/11/2026 | 27/11/2026* | 15 días | J. M. Peralta (Fullstack) / R. S. Cayalta (DBA) | Versión estable actual + Manuales |

*\*Nota: La Fase 5 (Mantenimiento y Evolución Operativa) permanece activa en producción, atendiendo mejoras continuas sobre la plataforma desplegada.*

#### D. Hitos de Control del Ciclo de Vida en Cascada

**Tabla 29**  
*Hitos de Verificación y Cierre de Fase (Milestones)*

| Código | Hito de Control | Fecha de Cierre | Fase Completada | Criterio de Aceptación / Entregable Validado |
| :-: | :--- | :-: | :--- | :--- |
| **H-01** | **Aprobación de Línea Base de Requisitos** | 04/06/2026 | Fase 1: Análisis | 14 RF, 6 RNF y 12 Casos de Uso revisados con el área operativa de GLAES S.A.C. |
| **H-02** | **Aprobación de Arquitectura y Esquema de BD** | 02/07/2026 | Fase 2: Diseño | Diagramas de Arquitectura, MER, Modelo Físico y Secuencia validados sin ambigüedades. |
| **H-03** | **Culminación de Construcción de los 6 Módulos** | 24/09/2026 | Fase 3: Implementación | API REST Laravel 12 y SPA React 19 completadas con Kardex y reportes institucionales. |
| **H-04** | **Conformidad de Pruebas y Piloto Local** | 22/10/2026 | Fase 4: Pruebas | 100% de pruebas unitarias, de integración y de sistema aprobadas sin errores críticos. |
| **H-05** | **Puesta en Producción en VPS y Operación Activa** | 12/11/2026 | Fase 5: Despliegue | Plataforma desplegada en VPS con SSL, respaldos automáticos de BD y uso diario en EsSalud. |

#### E. Matriz Visual del Cronograma ( Mayo – Noviembre 2026 )

En la siguiente matriz cada columna representa una quincena operativa (`Q1` = primera mitad del mes, `Q2` = segunda mitad del mes) desde **mayo hasta noviembre de 2026**:

| ID | Fase / Actividad (Cascada) | May Q1 | May Q2 | Jun Q1 | Jun Q2 | Jul Q1 | Jul Q2 | Ago Q1 | Ago Q2 | Sep Q1 | Sep Q2 | Oct Q1 | Oct Q2 | Nov Q1 | Nov Q2 |
| :-: | :--- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| **F1** | **1. Análisis de Requisitos** | | | | | | | | | | | | | | |
| 1.1 | Diagnóstico en planta y formatos físicos | ██ | | | | | | | | | | | | | |
| 1.2 | Requisitos Funcionales y No Funcionales | | ██ | | | | | | | | | | | | |
| 1.3 | Especificación de Casos de Uso (CU-01..12) | | ██ | ██ | | | | | | | | | | | |
| **F2** | **2. Diseño del Sistema y BD** | | | | | | | | | | | | | | |
| 2.1 | Arquitectura en 3 capas y diseño API REST | | | ██ | | | | | | | | | | | |
| 2.2 | Modelo Entidad-Relación y Físico MySQL | | | ██ | ██ | | | | | | | | | | |
| 2.3 | Diagramas de Secuencia y prototipos UI | | | | ██ | | | | | | | | | | |
| **F3** | **3. Implementación y Codificación** | | | | | | | | | | | | | | |
| 3.1 | Seguridad Sanctum, RBAC y Usuarios | | | | | ██ | | | | | | | | | |
| 3.2 | Catálogos Maestros y Prescripciones | | | | | | ██ | ██ | | | | | | | |
| 3.3 | Operaciones Inventario Gaseoso y Borradores | | | | | | | ██ | ██ | | | | | | |
| 3.4 | Oxígeno Líquido y Monitoreo Hospitalización | | | | | | | | | ██ | | | | | |
| 3.5 | Kardex, Trazabilidad y Reportes `ExcelJS` | | | | | | | | | | ██ | | | | |
| **F4** | **4. Integración y Pruebas** | | | | | | | | | | | | | | |
| 4.1 | Integración SPA-API, Lazy Loading e Índices | | | | | | | | | | | ██ | | | |
| 4.2 | Pruebas Unitarias e Integración ACID | | | | | | | | | | | ██ | | | |
| 4.3 | Pruebas de Sistema y Piloto Local en Planta | | | | | | | | | | | | ██ | | |
| **F5** | **5. Despliegue VPS y Mantenimiento** | | | | | | | | | | | | | | |
| 5.1 | Servidor VPS, SSL, BD Productiva y Backups | | | | | | | | | | | | ██ | ██ | |
| 5.2 | Migración de datos, Puesta en Vivo y Capacitación | | | | | | | | | | | | | ██ | |
| 5.3 | Mantenimiento evolutivo de Kardex y Cierre | | | | | | | | | | | | | | ██ |

#### F. Diagrama de Gantt Compacto en PlantUML (Modelo en Cascada)

```plantuml
@startgantt Cronograma_Cascada_GLAES_EsSalud
Project starts 2026-05-08
printscale weekly zoom 2
hide footbox

<style>
ganttDiagram {
    task {
        FontName Arial
        FontSize 10
        BackGroundColor #D6EAF8
        LineColor #2E86C1
    }
    milestone {
        FontName Arial
        FontSize 10
        BackGroundColor #1B4F72
        LineColor #1B4F72
    }
    separator {
        FontName Arial
        FontSize 11
        FontStyle bold
        BackGroundColor #F2F4F4
    }
}
</style>

-- Fase 1: Análisis de Requisitos --
[1.1 Diagnóstico en planta y formatos] as [T11] lasts 10 days
[1.2 Especificación RF y RNF] as [T12] lasts 10 days
[1.3 Casos de Uso (CU-01..12)] as [T13] lasts 8 days
[T11] -> [T12]
[T12] -> [T13]
[H-01: Requisitos Aprobados] happens at [T13]'s end

-- Fase 2: Diseño del Sistema y BD --
[2.1 Arquitectura 3 capas y API] as [T21] lasts 10 days
[2.2 Modelo E-R y Físico MySQL] as [T22] lasts 13 days
[2.3 Secuencias y Prototipos UI] as [T23] lasts 8 days
[T13] -> [T21]
[T13] -> [T22]
[T22] -> [T23]
[H-02: Diseño Aprobado] happens at [T23]'s end

-- Fase 3: Implementación y Codificación --
[3.1 Seguridad Sanctum y Usuarios] as [T31] lasts 14 days
[3.2 Catálogos y Prescripciones] as [T32] lasts 21 days
[3.3 Operaciones O2 Gaseoso] as [T33] lasts 21 days
[3.4 O2 Líquido y Hospitalización] as [T34] lasts 14 days
[3.5 Kardex y Reportes ExcelJS] as [T35] lasts 14 days
[T23] -> [T31]
[T31] -> [T32]
[T32] -> [T33]
[T33] -> [T34]
[T34] -> [T35]
[H-03: Software v1.0 Construido] happens at [T35]'s end

-- Fase 4: Integración y Pruebas --
[4.1 Integración SPA-API y BD] as [T41] lasts 10 days
[4.2 Pruebas Unitarias e Integración] as [T42] lasts 10 days
[4.3 Pruebas Sistema y Piloto Local] as [T43] lasts 8 days
[T35] -> [T41]
[T41] -> [T42]
[T42] -> [T43]
[H-04: Pruebas y Piloto Validados] happens at [T43]'s end

-- Fase 5: Despliegue VPS y Mantenimiento --
[5.1 Servidor VPS, SSL y Backups BD] as [T51] lasts 11 days
[5.2 Carga Inicial y Puesta en Vivo] as [T52] lasts 10 days
[5.3 Mantenimiento Evolutivo y Cierre] as [T53] lasts 15 days
[T43] -> [T51]
[T51] -> [T52]
[T52] -> [T53]
[H-05: Sistema en Producción] happens at [T52]'s end

@endgantt
```



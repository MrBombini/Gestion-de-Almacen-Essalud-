# MANUAL DE USUARIO
## Sistema de Gestión y Control de Inventario de Oxígeno Medicinal ("Central de Oxígeno" - EsSalud)

---

### 1. Introducción y Objetivo del Manual

El presente **Manual de Usuario** tiene como objetivo guiar paso a paso a los operadores de planta/almacén, ingenieros hospitalarios y administradores en el uso del sistema web **Central de Oxígeno - EsSalud**. El sistema permite gestionar de forma integral el inventario de cilindros de oxígeno gaseoso, el monitoreo del tanque criogénico de oxígeno líquido, el recorrido de balones en camas de hospitalización, la atención a pacientes PADOMI y centros de periferia, y la emisión de reportes auditables y Kardex en formato Microsoft Excel (`.xlsx`).

---

### 2. Requisitos Previos y Perfiles de Usuario

#### 2.1. Requisitos para Acceder al Sistema
- **Navegador Web:** Google Chrome, Microsoft Edge o Mozilla Firefox actualizado.
- **Conexión:** Acceso a la red local institucional (Intranet EsSalud) o servidor donde se encuentre desplegada la aplicación.
- **Credenciales:** Usuario (correo electrónico) y contraseña asignados por el Administrador del Sistema.

#### 2.2. Roles y Permisos dentro del Sistema

| Rol de Usuario | Módulos Habilitados | Funciones Principales |
| :--- | :--- | :--- |
| **Operator (Operador)** | Dashboard, Recorrido Hospitalización, Operaciones, Oxígeno Líquido, Catálogos y Reportes. | Registro diario de intercambios, préstamos, devoluciones, trasiego (cascada), movimientos con proveedor, lecturas de tanque líquido y monitoreo PSI en camas. |
| **Engineer (Ingeniero)** | Todos los módulos operativos, catálogos maestros y suite completa de reportes gerenciales. | Supervisión de Kardex General/Diario, análisis de consumo ejecutivo, configuración de autoridades firmantes y exportación de formatos oficiales. |
| **Administrator (Administrador)** | Acceso total al sistema + Módulo exclusivo de **Administración -> Usuarios**. | Creación, edición, asignación de roles y activación/desactivación de cuentas de usuario del sistema. |

---

### 3. Acceso al Sistema y Navegación Principal

#### 3.1. Inicio de Sesión (Login)

1. Abra su navegador web e ingrese a la dirección URL del sistema.
2. En la pantalla de bienvenida (**Central de Oxígeno**), complete los siguientes campos:
   - **Correo Electrónico / Usuario:** Ingrese su correo registrado.
   - **Contraseña:** Ingrese su clave de acceso.
3. Seleccione o verifique el **Turno de Trabajo** correspondiente (*Mañana / Tarde / Noche*).
4. Haga clic en el botón **"Iniciar Sesión"**.

> **[Insertar Captura de Pantalla 1: Pantalla de Inicio de Sesión (Login)]**

*Nota:* Si las credenciales son incorrectas o la cuenta se encuentra desactivada, el sistema mostrará una alerta en color rojo indicando el motivo de la restricción.

---

#### 3.2. Estructura de la Interfaz Principal y Menú Lateral (Sidebar)

Al ingresar exitosamente, visualizará la interfaz principal dividida en dos áreas:

1. **Menú Lateral Izquierdo (Central de Oxígeno):**
   - **Buscador Rápido (`Buscar módulo...`):** Permite escribir el nombre de cualquier pantalla para filtrarla al instante.
   - **Dashboard:** Acceso directo al tablero principal de indicadores y Kardex.
   - **Secciones Desplegables (Acordeón):**
     - **Recorrido Hospitalización** (1 sub-módulo)
     - **Operaciones** (8 sub-módulos)
     - **Oxígeno Líquido** (2 sub-módulos)
     - **Catálogos** (7 sub-módulos)
     - **Reportes** (9 sub-módulos)
     - **Administración** (`Usuarios` — visible únicamente para el rol *Administrator*)
   - **Tarjeta Inferior de Sesión:** Muestra el nombre del usuario conectado, su rol, el **Turno Actual** y el botón de sol/luna para alternar entre **Modo Claro y Modo Oscuro**.
2. **Área de Trabajo Central:** Espacio donde se cargan dinámicamente los formularios, tablas y gráficos del módulo seleccionado.

> **[Insertar Captura de Pantalla 2: Vista General del Dashboard y Menú Lateral]**

---

### 4. Módulo Dashboard Principal

Al hacer clic en **Dashboard** en la parte superior del menú lateral, el sistema presenta tres pestañas de control inmediato:

1. **Vista Resumen / Indicadores:** Muestra tarjetas con el stock total en tiempo real de cilindros **Llenos**, **Vacíos**, en **Servicios/Hospitalización**, en **PADOMI** y en **Mantenimiento**, desglosados por capacidad ($10\text{ m}^3$, $8\text{ m}^3$, $6\text{ m}^3$, portátiles).
2. **Pestaña Kardex:** Permite visualizar rápidamente las entradas, salidas y saldos acumulados en unidades y metros cúbicos ($\text{m}^3$).
3. **Pestaña Gerencial:** Presenta gráficos comparativos de consumo por servicio asistencial y evolución de demanda de oxígeno.

> **[Insertar Captura de Pantalla 3: Indicadores del Dashboard Principal]**

---

### 5. Sección: Recorrido Hospitalización

#### 5.1. Control de Balones en Piso y Lecturas Manométricas (PSI)
**Ruta en el menú:** `Recorrido Hospitalización -> Recorrido Hospitalización`

Este módulo permite monitorear en tiempo real los cilindros que se encuentran instalados en las camas de los diferentes servicios del hospital:

1. **Filtrar por Servicio / Estado:** Seleccione el servicio hospitalario (ej. *UCI*, *Emergencia*, *Hospitalización Medicina*) para visualizar los cilindros asignados a sus camas.
2. **Registrar Lectura de Presión (PSI):**
   - Ubique el cilindro en el listado y haga clic en el botón **"Registrar Lectura"**.
   - Ingrese la presión actual observada en el manómetro (en **PSI**) y el flujo de consumo ($\text{L/min}$).
   - Haga clic en **"Guardar"**. Si la presión es baja, el sistema activará una alerta visual (semáforo rojo/ámbar) indicando que requiere recambio próximo.
3. **Traslado de Cama (`Transferencia`):**
   - Si un balón es movido a otra cama, haga clic en **"Trasladar Cama"**, elija la nueva cama destino y confirme. Todo el historial de camas por las que pasó el balón queda registrado.

> **[Insertar Captura de Pantalla 4: Módulo de Recorrido Hospitalización y Registro PSI]**

---

### 6. Sección: Operaciones (Inventario de Oxígeno Gaseoso)

> **Función de Autoguardado de Borradores:** Todos los formularios de la sección *Operaciones* cuentan con guardado automático de borradores. Si usted cierra o recarga la página por accidente mientras llena un movimiento, al volver a entrar el sistema recuperará automáticamente los cilindros y datos que estaba registrando.

#### 6.1. Intercambio (Canje de Cilindros)
**Ruta en el menú:** `Operaciones -> Intercambio`

Permite registrar la entrega de balones **Llenos** y la recepción simultánea de balones **Vacíos** para Servicios Hospitalarios o Pacientes PADOMI:

1. Seleccione el **Tipo de Destino** (*Servicio Hospitalario* o *Paciente PADOMI*).
2. Seleccione el **Servicio** (y cama opcional) o busque al **Paciente** por DNI/Nombre (el sistema mostrará si cuenta con prescripción médica vigente).
3. Ingrese el **Número de Vale / Ticket** y verifique la fecha/hora.
4. En el panel **Cilindros que Salen (Llenos)**, busque y seleccione por código de serie los balones llenos que se despachan desde el almacén.
5. En el panel **Cilindros que Ingresan (Vacíos)**, busque y seleccione los balones vacíos que retorna el servicio o familiar del paciente.
6. Haga clic en **"Registrar Intercambio"**.

> **[Insertar Captura de Pantalla 5: Formulario de Intercambio de Cilindros]**

---

#### 6.2. Control de Atención (Tickets / Vales)
**Ruta en el menú:** `Operaciones -> Control de Atención`

1. Permite consultar, filtrar por fecha/turno y verificar todos los vales y tickets de atención emitidos durante la jornada operativa.
2. Puede buscar por número de ticket, código de balón o nombre del receptor e imprimir o exportar el listado.

---

#### 6.3. Trasiego (Cascada / Decanting)
**Ruta en el menú:** `Operaciones -> Trasiego (Cascada)`

Permite registrar el llenado interno de balones portátiles o pequeños a partir de cilindros matriz de gran capacidad ($10\text{ m}^3$):

1. En **Cilindros Fuente (Matriz)**, seleccione el balón o batería de gran capacidad en estado `Lleno` e indique su presión inicial y final.
2. En **Cilindros Destino (Portátiles a Recargar)**, seleccione los balones `Vacíos` que fueron llenados en la cascada.
3. Ingrese las observaciones o turno y presione **"Registrar Trasiego"**.
4. El sistema cambiará automáticamente los balones pequeños a estado **Lleno** en almacén.

> **[Insertar Captura de Pantalla 6: Pantalla de Trasiego en Cascada]**

---

#### 6.4. Mov. Proveedor (Abastecimiento y Envío a Recarga)
**Ruta en el menú:** `Operaciones -> Mov. Proveedor`

1. Seleccione el **Proveedor** externo de oxígeno y el **Tipo de Operación**:
   - **Salida a Proveedor:** Envío de lote de cilindros `Vacíos` para que el proveedor los recargue.
   - **Ingreso de Proveedor:** Recepción de lote de cilindros `Llenos` abastecidos por el proveedor.
2. Ingrese el **Número de Guía de Remisión / Documento** y la fecha.
3. Seleccione los códigos de todos los cilindros incluidos en el camión y presione **"Guardar Movimiento"**.

> **[Insertar Captura de Pantalla 7: Registro de Movimiento con Proveedor]**

---

#### 6.5. Traslado Interno (Transferencia entre Almacenes)
**Ruta en el menú:** `Operaciones -> Traslado Interno`

1. Seleccione el **Almacén de Origen** y el **Almacén de Destino** dentro del hospital.
2. Seleccione los cilindros a trasladar (llenos o vacíos) y confirme la transferencia para actualizar su ubicación física.

---

#### 6.6. Periferia / Centros Médicos
**Ruta en el menú:** `Operaciones -> Periferia/Centros Médicos`

1. Seleccione el **Centro Asistencial de Periferia** o Policlínico solicitante.
2. Ingrese el documento o guía de atención.
3. Seleccione el lote de balones `Llenos` despachados y los balones `Vacíos` recepcionados desde dicho centro médico.
4. Haga clic en **"Registrar Atención Periferia"**.

---

#### 6.7. Préstamos / Terceros y Control de Devoluciones
**Ruta en el menú:**
- `Operaciones -> Préstamos / Terceros`
- `Operaciones -> Control Devoluciones`

1. **Para registrar un Préstamo (`Préstamos / Terceros`):**
   - Cuando se entrega un balón `Lleno` a un paciente, servicio o entidad sin recibir un balón vacío a cambio en ese instante, seleccione el beneficiario, el cilindro entregado y confirme el préstamo.
2. **Para registrar el Retorno (`Control Devoluciones`):**
   - Ingrese a **Control Devoluciones** para ver la tabla de todos los cilindros pendientes de devolución y los días transcurridos.
   - Ubique el balón que está siendo devuelto físicamente, haga clic en **"Registrar Devolución"**, indique si retorna `Vacío` o `Lleno` y confirme. El balón volverá inmediatamente al stock del almacén.

> **[Insertar Captura de Pantalla 8: Pantalla de Control de Devoluciones Pendientes]**

---

### 7. Sección: Oxígeno Líquido

#### 7.1. Lectura Diaria del Tanque Criogénico
**Ruta en el menú:** `Oxígeno Líquido -> Lectura Diaria`

1. Haga clic en **"Nueva Lectura Diaria"**.
2. Ingrese la **Fecha**, **Hora**, **Nivel del Tanque** (pulgadas / porcentaje) y **Presión** del tanque criogénico estacionario.
3. El sistema calculará automáticamente el volumen equivalente en metros cúbicos ($\text{m}^3$) y el **Consumo Diario** respecto a la lectura del día anterior.
4. Presione **"Guardar Lectura"**.

#### 7.2. Recarga Cisterna
**Ruta en el menú:** `Oxígeno Líquido -> Recarga Cisterna`

1. Cuando llegue el camión cisterna del proveedor, haga clic en **"Registrar Recarga"**.
2. Seleccione el **Proveedor**, ingrese el **Número de Guía / Factura**, la fecha/hora, el nivel antes y después de la descarga y la **Cantidad Abastecida ($\text{m}^3$ / Galones)**.
3. Haga clic en **"Guardar Recarga"**.

> **[Insertar Captura de Pantalla 9: Módulo de Lectura Diaria y Recarga de Oxígeno Líquido]**

---

### 8. Sección: Catálogos Maestros

Desde el menú **Catálogos**, el personal autorizado mantiene actualizada la base de datos maestra del hospital:

1. **Pacientes (`Catálogos -> Pacientes`):**
   - Haga clic en **"Nuevo Paciente"** (el sistema genera el código correlativo automáticamente).
   - Ingrese DNI/CE, nombre completo, teléfono, dirección y tipo (`PADOMI` u `Hospitalizado`).
   - Dentro de la fila del paciente, haga clic en **"Prescripciones / Recetas"** para registrar su receta médica indicando flujo ($\text{L/min}$), médico tratante y fechas de inicio y vencimiento.
2. **Cilindros (`Catálogos -> Cilindros`):**
   - Permite dar de alta nuevos balones indicando **Código de Serie**, **Capacidad ($\text{m}^3$)**, **Tipo de Propiedad**, **Estado Inicial** (`Lleno`, `Vacío`, `Mantenimiento`) y **Ubicación**.
3. **Servicios y Camas (`Catálogos -> Servicios` / `Camas`):**
   - Administración de servicios asistenciales del hospital, centros de periferia y las camas asignadas a cada servicio.
4. **Proveedores (`Catálogos -> Proveedores`):**
   - Registro de RUC, razón social y teléfono de las empresas proveedoras de oxígeno.
5. **Tipos de Propiedad y Autoridades (`Catálogos -> Tipos de Propiedad` / `Autoridades / Entidades`):**
   - Configuración de regímenes de propiedad de balones y registro de los nombres y cargos de las **Autoridades** que aparecerán en el bloque de firmas de los reportes oficiales exportados a Excel.

> **[Insertar Captura de Pantalla 10: Catálogo de Cilindros y Catálogo de Pacientes con Recetas]**

---

### 9. Sección: Reportes y Exportación a Excel (.xlsx)

El menú **Reportes** concentra las 9 herramientas de auditoría, trazabilidad y exportación oficial:

| Sub-módulo de Reporte | Función Principal | Exportación |
| :--- | :--- | :-: |
| **Búsqueda y Exportación** | Buscador unificado de todos los movimientos de inventario con filtros combinados por fecha, tipo de operación, servicio, paciente o balón. | `.xlsx` |
| **Intercambios PADOMI** | Historial detallado de entregas, canjes y préstamos realizados a pacientes del programa de atención domiciliaria (PADOMI). | `.xlsx` |
| **Alertas de Pacientes** | Panel de alertas preventivas sobre pacientes con recetas vencidas o por vencer y balones con exceso de días sin retorno. | Vista / `.xlsx` |
| **Proveedores Ingreso/Salida** | Balance detallado de cilindros enviados a recarga versus cilindros llenos recepcionados por cada proveedor y guía. | `.xlsx` |
| **Periferia Reportes** | Consolidado de consumo y rotación de balones en policlínicos y centros médicos de periferia. | `.xlsx` |
| **Seguimiento Cilindros** | **Trazabilidad unitaria:** al ingresar el código de serie de un balón, muestra toda su línea de tiempo histórica desde su registro hasta su ubicación actual. | Vista / `.xlsx` |
| **Formatos de Control** | Emisión del **Formato Oficial de Control Diario de Oxígeno y Kardex** con desglose de saldos iniciales, ingresos, salidas y saldos finales por capacidad. | `.xlsx` Oficial |
| **Resumen Mensual** | Consolidado mensual gerencial del consumo de oxígeno gaseoso y líquido ($\text{m}^3$) por servicio, listo para firma de autoridades. | `.xlsx` Oficial |
| **Ingresos Mensuales** | Reporte contable-operativo de todos los metros cúbicos ($\text{m}^3$) y cilindros ingresados al hospital por proveedor durante el mes seleccionado. | `.xlsx` Oficial |

#### Pasos para Generar y Descargar un Reporte en Excel:
1. Ingrese al reporte deseado (por ejemplo, `Reportes -> Formatos de Control` o `Reportes -> Resumen Mensual`).
2. Seleccione el **Rango de Fechas** o el **Mes y Año** a consultar y presione **"Consultar / Filtrar"**.
3. Verifique la vista previa de la tabla consolidada en pantalla.
4. Haga clic en el botón verde **"Exportar a Excel (.xlsx)"**. El archivo se descargará automáticamente con el diseño institucional de EsSalud y el bloque de firmas correspondiente.

> **[Insertar Captura de Pantalla 11: Generación y Exportación a Excel en Formatos de Control / Resumen Mensual]**

---

### 10. Sección: Administración de Usuarios (Exclusivo Administrador)

**Ruta en el menú:** `Administración -> Usuarios`

1. **Crear Nuevo Usuario:**
   - Haga clic en **"+ Nuevo Usuario"**.
   - Complete los campos: **Nombre Completo**, **Correo Electrónico**, **Contraseña** y seleccione el **Rol** (`Operator`, `Engineer` o `Administrator`).
   - Haga clic en **"Guardar"**.
2. **Editar o Cambiar Rol:**
   - Haga clic en el ícono de edición (lápiz) junto al usuario para actualizar su nombre, rol o restablecer su contraseña.
3. **Activar / Desactivar Cuenta:**
   - Utilice el interruptor de estado (**Activo / Inactivo**) para revocar temporalmente o reactivar el acceso de un trabajador sin perder el historial de los movimientos que registró en el Kardex.

> **[Insertar Captura de Pantalla 12: Módulo de Administración de Usuarios]**

---

### 11. Preguntas Frecuentes y Solución de Problemas Comunes

| Situación / Mensaje del Sistema | Causa Probable | Solución Recomendada |
| :--- | :--- | :--- |
| **No aparece un balón al buscarlo para despachar en Intercambio** | El balón figura actualmente en estado `Vacío`, `Mantenimiento` o ya se encuentra asignado a otro servicio/paciente. | Verifique el estado y ubicación actual del balón en `Reportes -> Seguimiento Cilindros` o en `Catálogos -> Cilindros`. Si ya retornó, registre primero su devolución o ingreso. |
| **Se cerró el navegador a mitad de un registro de Intercambio o Trasiego** | Cierre accidental de pestaña o corte momentáneo de energía/red. | Vuelva a ingresar al mismo módulo (`Intercambio` o `Trasiego`); el sistema cargará automáticamente el **borrador guardado** con los balones que había seleccionado. |
| **No visualizo la opción "Usuarios" en el menú lateral** | Su cuenta tiene asignado el rol `Operator` o `Engineer`. | La gestión de cuentas de usuario está restringida por seguridad únicamente al rol `Administrator`. Solicite el cambio al administrador del sistema. |
| **El botón "Exportar a Excel" está deshabilitado** | No se han encontrado movimientos en el rango de fechas seleccionado. | Amplíe el rango de fechas o verifique el mes/año en el filtro superior y presione nuevamente el botón de búsqueda. |


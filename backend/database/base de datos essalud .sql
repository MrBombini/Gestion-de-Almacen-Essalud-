-- ========================================================
-- 1. TABLAS MAESTRAS (CATÁLOGOS INDEPENDIENTES)
-- ========================================================

CREATE TABLE USUARIO (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    cod_usuario VARCHAR(50) UNIQUE NOT NULL,   -- Código para Iniciar Sesión (Ej: DNI o Fotocheck)
    password VARCHAR(255) NOT NULL,            -- Contraseña Encriptada (Hash)
    nombre VARCHAR(100) NOT NULL,
    rol VARCHAR(50) NOT NULL,                  -- Ej: Operador, Administrador
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo'
);

CREATE TABLE PACIENTE ( 
    id_paciente INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    dni VARCHAR(15) UNIQUE NOT NULL,
    cod_trasiego VARCHAR(20),      -- Ej: P120
    cod_intercambio VARCHAR(20)    -- Ej: 2325
);

CREATE TABLE PROVEEDOR (
    id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
    razon_social VARCHAR(150) NOT NULL
);

CREATE TABLE SERVICIO (
    id_servicio INT AUTO_INCREMENT PRIMARY KEY,
    nombre_servicio VARCHAR(100) NOT NULL, 
    codigo_servicio VARCHAR(20) NOT NULL UNIQUE -- Ej: ONCO, UCI, MANIFOLD1
);

CREATE TABLE PROPIEDAD (
    id_propiedad INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL -- Ej: EsSalud, Proveedor, Paciente
);

-- ========================================================
-- 2. TABLAS MAESTRAS (CATÁLOGOS DEPENDIENTES)
-- ========================================================

CREATE TABLE CAMA (
    id_cama INT AUTO_INCREMENT PRIMARY KEY,
    id_servicio INT NOT NULL,
    numero_cama VARCHAR(20) NOT NULL, -- Ej: 185, A-12
    estado VARCHAR(20) DEFAULT 'Activa',
    FOREIGN KEY (id_servicio) REFERENCES SERVICIO(id_servicio) ON DELETE CASCADE
);

CREATE TABLE RECETA (
    id_receta INT AUTO_INCREMENT PRIMARY KEY,
    id_paciente INT NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,    -- Sello de vigencia
    dosis VARCHAR(50) NOT NULL,         -- Ej: 2 litros / min
    tiempo_uso VARCHAR(50) NOT NULL,    -- Ej: 15 horas al día
    estado VARCHAR(20) DEFAULT 'Activa',-- Activa, Vencida, Anulada
    FOREIGN KEY (id_paciente) REFERENCES PACIENTE(id_paciente) ON DELETE CASCADE
);

-- ========================================================
-- 3. EL OBJETO FÍSICO (CILINDROS)
-- ========================================================

CREATE TABLE CILINDRO (
    codigo_barras VARCHAR(50) PRIMARY KEY, 
    capacidad_m3 DECIMAL(10,2) NOT NULL,   -- Ej: 10.00, 3.45
    prueba_hidrostatica DATE NOT NULL,
    estado_fisico VARCHAR(50) NOT NULL DEFAULT 'Bueno', -- Bueno, Mantenimiento, Baja
    id_propiedad INT NOT NULL,
    FOREIGN KEY (id_propiedad) REFERENCES PROPIEDAD(id_propiedad)
);

-- ========================================================
-- 4. MUNDO DEL OXÍGENO LÍQUIDO (TANQUE)
-- ========================================================

CREATE TABLE RECARGA_LIQUIDO (
    id_recarga INT AUTO_INCREMENT PRIMARY KEY,
    fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_proveedor INT NOT NULL,
    id_usuario INT NOT NULL,
    nivel_antes DECIMAL(10,2) NOT NULL,
    nivel_despues DECIMAL(10,2) NOT NULL,
    cantidad_ticket DECIMAL(10,2),           -- Opcional (Ticket del camión)
    documento_referencia VARCHAR(100),       -- Opcional (Guía de Remisión)
    FOREIGN KEY (id_proveedor) REFERENCES PROVEEDOR(id_proveedor),
    FOREIGN KEY (id_usuario) REFERENCES USUARIO(id_usuario)
);

CREATE TABLE CONTROL_LIQUIDO_DIARIO (
    id_lectura INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    turno VARCHAR(20) NOT NULL,              -- Mañana, Tarde, Noche
    reserva_tanque_ext DECIMAL(10,2) NOT NULL,
    consumo_almacen_int DECIMAL(10,2) NOT NULL,
    consumo_calculado DECIMAL(10,2) NOT NULL,
    id_usuario INT NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES USUARIO(id_usuario)
);

-- ========================================================
-- 5. LA BITÁCORA TRANSACCIONAL (KARDEX DE CILINDROS)
-- ========================================================

-- Cabecera del Movimiento
CREATE TABLE OPERACION (
    id_operacion INT AUTO_INCREMENT PRIMARY KEY,
    fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    turno VARCHAR(20) NOT NULL,          -- Mañana, Tarde, Noche
    tipo_operacion VARCHAR(50) NOT NULL, -- Entrada Prov, Salida Prov, Intercambio, Trasiego Paciente, Asignacion Serv
    documento_referencia VARCHAR(100),   -- Guia de Remision, Vale (Opcional)
    id_usuario INT NOT NULL,
    id_proveedor INT, -- Nulo si la operacion es con paciente/servicio
    id_servicio INT,  -- Nulo si es proveedor/paciente
    id_cama INT,      -- Nulo si va al pasillo del servicio o no aplica
    id_paciente INT,  -- Nulo si es proveedor/servicio
    id_receta INT,    -- Nulo si no requiere validación médica
    FOREIGN KEY (id_usuario) REFERENCES USUARIO(id_usuario),
    FOREIGN KEY (id_proveedor) REFERENCES PROVEEDOR(id_proveedor),
    FOREIGN KEY (id_servicio) REFERENCES SERVICIO(id_servicio),
    FOREIGN KEY (id_cama) REFERENCES CAMA(id_cama),
    FOREIGN KEY (id_paciente) REFERENCES PACIENTE(id_paciente),
    FOREIGN KEY (id_receta) REFERENCES RECETA(id_receta)
);

-- Detalle del Movimiento (Historial por cilindro)
CREATE TABLE MOVIMIENTO_CILINDRO (
    id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
    id_operacion INT NOT NULL,
    codigo_barras VARCHAR(50) NOT NULL,
    condicion_oxigeno VARCHAR(20) NOT NULL, -- Lleno, Vacio
    accion VARCHAR(50) NOT NULL,            -- Entra a Almacen, Sale de Almacen, Llena en Manifold
    FOREIGN KEY (id_operacion) REFERENCES OPERACION(id_operacion) ON DELETE CASCADE,
    FOREIGN KEY (codigo_barras) REFERENCES CILINDRO(codigo_barras)
);
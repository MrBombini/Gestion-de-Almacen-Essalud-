# 🏥 Sistema de Gestión de Almacén de Oxígeno — EsSalud

> **Versión:** 1.0.0 · **Estado:** Producción activa · **Entorno:** Laravel 11 + React 18

Sistema de información para la gestión integral del inventario de gases medicinales del almacén central de EsSalud. Reemplaza el flujo manual basado en hojas de Excel con una plataforma web en tiempo real, con trazabilidad completa de cilindros, pacientes, servicios hospitalarios y proveedores.

---

## 📋 Tabla de Contenidos

| Documento | Descripción |
|-----------|-------------|
| [Arquitectura del Proyecto](./architecture.md) | Stack tecnológico, estructura de carpetas y flujo de datos |
| [Modelos de Base de Datos](./database.md) | Esquema relacional completo, tablas y relaciones |
| [Documentación de la API](./api/README.md) | Índice general de todos los endpoints |
| [Autenticación](./api/auth.md) | Login, logout y control de sesión |
| [Catálogos](./api/catalogs.md) | Pacientes, Servicios, Camas, Proveedores, Tipos de Propiedad |
| [Cilindros](./api/cylinders.md) | CRUD de balones de gas medicinal |
| [Movimientos de Inventario](./api/inventory-movements.md) | Intercambio, Trasiego, Proveedor, Periféricos |
| [Módulo Líquido](./api/liquid.md) | Recarga de tanque y lecturas diarias |
| [Lecturas Diarias](./api/daily-readings.md) | Registro del flujómetro y nivel de tanque |
| [Recetas Médicas](./api/prescriptions.md) | Gestión de recetas de pacientes PADOMI |
| [Reportes](./api/reports.md) | Kardex, Consumo, Inventario y Cierre de turno |
| [Usuarios](./api/users.md) | Gestión de operadores del sistema |
| [Roles y Permisos](./roles.md) | Control de acceso por rol |
| [Guía de Instalación](./setup.md) | Cómo instalar y configurar el entorno |

---

## 🚀 Inicio Rápido

### Requisitos del Sistema

| Componente | Versión mínima |
|------------|----------------|
| PHP | 8.2+ |
| Composer | 2.x |
| MySQL | 8.0+ |
| Node.js | 18+ |
| npm | 9+ |

### Levantar el entorno en 5 pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/MrBombini/Gestion-de-Almacen-Essalud-.git
cd Gestion-de-Almacen-Essalud-

# 2. Instalar dependencias del backend
cd backend && composer install

# 3. Configurar el entorno
cp .env.example .env
php artisan key:generate

# 4. Migrar y sembrar la base de datos
php artisan migrate --seed

# 5. Levantar el servidor
php artisan serve
```

```bash
# En otra terminal — Frontend
cd frontend && npm install && npm run dev
```

---

## 🏗️ Stack Tecnológico

```
Backend   →  Laravel 11 (PHP 8.2) + Sanctum (JWT-like tokens)
Frontend  →  React 18 + Vite + React Router v6
Base datos→  MySQL 8.0
Auth      →  Laravel Sanctum (Bearer Token)
```

---

## 🔑 Roles del Sistema

| Rol | Descripción |
|-----|-------------|
| `Operator` | Registra movimientos diarios de oxígeno |
| `Administrator` | Gestión completa + acceso a reportes |
| `Engineer` | Acceso total, incluye configuración del sistema |

---

## 📁 Estructura de la Documentación

```
docs/
├── README.md                    ← Este archivo (índice general)
├── architecture.md              ← Arquitectura del sistema
├── database.md                  ← Esquema de base de datos
├── roles.md                     ← Roles y permisos
├── setup.md                     ← Guía de instalación
└── api/
    ├── README.md                ← Índice de la API
    ├── auth.md                  ← Autenticación
    ├── catalogs.md              ← Catálogos (pacientes, servicios, camas, etc.)
    ├── cylinders.md             ← Balones de gas
    ├── inventory-movements.md   ← Movimientos de inventario
    ├── liquid.md                ← Módulo de oxígeno líquido
    ├── daily-readings.md        ← Lecturas diarias
    ├── prescriptions.md         ← Recetas médicas
    ├── reports.md               ← Reportes y kardex
    └── users.md                 ← Gestión de usuarios
```

---

## ⚠️ Notas Importantes

> [!IMPORTANT]
> Todos los endpoints protegidos requieren el header `Authorization: Bearer {token}`. El token se obtiene en el endpoint de login.

> [!NOTE]
> La URL base de la API en desarrollo es `http://localhost:8000/api`. En producción, actualizar la variable `VITE_API_URL` en el `.env` del frontend.

---

*Documentación generada para el equipo de desarrollo de EsSalud — Mayo 2026*

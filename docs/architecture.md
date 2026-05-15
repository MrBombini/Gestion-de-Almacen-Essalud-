# Arquitectura del Sistema

## Visión General

Arquitectura **cliente-servidor desacoplada** con API RESTful. Frontend y backend son independientes y se comunican exclusivamente por JSON sobre HTTP.

```
[React 18 + Vite]  ──HTTP/JSON──▶  [Laravel 11 API]  ──Eloquent──▶  [MySQL 8.0]
  (SPA en el navegador)              (Bearer Token auth)              (BD: essalud)
```

---

## Stack Tecnológico

### Backend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| PHP | 8.2+ | Lenguaje de programación |
| Laravel | 11.x | Framework MVC |
| Laravel Sanctum | 4.x | Autenticación por tokens |
| Eloquent ORM | built-in | Mapeo objeto-relacional |
| MySQL | 8.0+ | Motor de base de datos |

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 18.x | Librería de UI |
| Vite | 5.x | Bundler / servidor de desarrollo |
| React Router | 6.x | Navegación SPA |

---

## Estructura de Carpetas

### Backend (`/backend`)
```
backend/
├── app/
│   ├── Http/Controllers/    # 14 controladores (lógica de negocio)
│   ├── Http/Middleware/     # CheckRole (autorización por rol)
│   └── Models/              # 13 modelos Eloquent
├── database/
│   ├── migrations/          # 16 migraciones ordenadas
│   └── seeders/             # Datos iniciales (usuarios)
└── routes/api.php           # Definición de endpoints
```

### Frontend (`/frontend`)
```
frontend/src/
├── pages/                   # 17 vistas (Dashboard, Cylinders, Reports...)
├── components/              # Sidebar, Modal, Tablas de Kardex
└── App.jsx                  # Enrutamiento principal (React Router)
```

---

## Flujo de una Petición

```
1. Usuario realiza acción en el frontend (ej: Registrar Intercambio)
2. React → POST /api/inventory/exchange  [Authorization: Bearer <token>]
3. Laravel Sanctum valida el token (auth:sanctum)
4. Middleware CheckRole verifica el rol del usuario
5. Controller valida campos, ejecuta DB::transaction()
6. Responde JSON 201 Created
7. React actualiza estado local y muestra notificación
```

---

## Patrones de Diseño

| Patrón | Donde se aplica |
|--------|-----------------|
| Repository via Eloquent | Todos los modelos |
| DB Transaction | InventoryMovementController (operaciones críticas) |
| Middleware Guard | `auth:sanctum` + `role:X,Y` en rutas |
| API Resource RESTful | Catálogos: `apiResource()` en routes/api.php |
| Soft Deletes | Patient, Cylinder, User |

---

## Seguridad

- **Autenticación:** Laravel Sanctum — tokens opacos por sesión de turno.
- **Autorización:** Middleware `CheckRole` valida el campo `role` del usuario.
- **Validación:** Todas las entradas usan `$request->validate()`.
- **Transacciones:** Operaciones críticas usan `DB::transaction()` para consistencia.
- **Soft Delete:** Datos críticos nunca se eliminan físicamente de la BD.

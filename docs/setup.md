# Guía de Instalación y Configuración

## Requisitos Previos

| Herramienta | Versión mínima | Verificar con |
|-------------|----------------|---------------|
| PHP | 8.2+ | `php -v` |
| Composer | 2.x | `composer -V` |
| MySQL | 8.0+ | `mysql --version` |
| Node.js | 18+ | `node -v` |
| npm | 9+ | `npm -v` |

---

## Instalación del Backend

### 1. Clonar el repositorio

```bash
git clone https://github.com/MrBombini/Gestion-de-Almacen-Essalud-.git
cd Gestion-de-Almacen-Essalud-
```

### 2. Instalar dependencias PHP

```bash
cd backend
composer install
```

### 3. Configurar el archivo de entorno

```bash
cp .env.example .env
php artisan key:generate
```

Editar `.env` con los datos de tu base de datos:

```ini
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=essalud
DB_USERNAME=root
DB_PASSWORD=tu_password
```

### 4. Ejecutar migraciones y seeders

```bash
# Primera vez (crea la BD si no existe)
php artisan migrate --seed

# Para reiniciar con datos frescos (desarrollo)
php artisan migrate:fresh --seed
```

> **Nota:** El seeder crea un usuario administrador por defecto. Ver `database/seeders/UserSeeder.php` para las credenciales iniciales.

### 5. Levantar el servidor de desarrollo

```bash
php artisan serve
# API disponible en: http://localhost:8000/api
```

---

## Instalación del Frontend

### 1. Instalar dependencias

```bash
cd frontend
npm install
```

### 2. Configurar la URL de la API

Crear o editar `frontend/.env`:

```ini
VITE_API_URL=http://localhost:8000/api
```

### 3. Levantar el servidor de desarrollo

```bash
npm run dev
# Aplicación disponible en: http://localhost:5173
```

---

## Variables de Entorno del Backend

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `APP_NAME` | Nombre de la aplicación | `Gestion-Almacen-Essalud` |
| `APP_ENV` | Entorno de ejecución | `local` |
| `APP_KEY` | Clave de cifrado (generada) | Auto |
| `APP_DEBUG` | Modo debug | `true` |
| `APP_URL` | URL base del backend | `http://localhost:8000` |
| `DB_CONNECTION` | Motor de BD | `mysql` |
| `DB_HOST` | Host de la BD | `127.0.0.1` |
| `DB_PORT` | Puerto de la BD | `3306` |
| `DB_DATABASE` | Nombre de la BD | `essalud` |
| `DB_USERNAME` | Usuario de la BD | `root` |
| `DB_PASSWORD` | Contraseña de la BD | *(vacío)* |
| `SANCTUM_STATEFUL_DOMAINS` | Dominios permitidos para Sanctum | `localhost:5173` |

---

## Estructura de la Base de Datos

El sistema crea automáticamente **16 tablas** al correr las migraciones:

```
users, cache, jobs,
patients, suppliers, services, ownership_types,
beds, prescriptions, cylinders,
liquid_refills, daily_readings,
inventory_movements, cylinder_movements,
decantings, personal_access_tokens
```

---

## Comandos Útiles

```bash
# Ver todas las rutas de la API
php artisan route:list --path=api

# Verificar el estado de las migraciones
php artisan migrate:status

# Limpiar cachés
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# Ejecutar solo el seeder de usuarios
php artisan db:seed --class=UserSeeder
```

---

## Solución de Problemas Comunes

### Error: "Table already exists" al migrar
```bash
# Si ya existía una BD anterior:
php artisan migrate:fresh --seed
```

### Error: CORS en el frontend
Verificar en `backend/config/cors.php` que `allowed_origins` incluya el dominio del frontend:
```php
'allowed_origins' => ['http://localhost:5173'],
```

### Error: Token no válido (401)
El token de Sanctum expira cuando se cierra sesión. El frontend debe re-autenticar con `POST /api/auth/login`.

### Error: "No query results for model" (404)
Se intenta acceder a un recurso eliminado (soft delete). Verificar que el ID existe y no fue eliminado.

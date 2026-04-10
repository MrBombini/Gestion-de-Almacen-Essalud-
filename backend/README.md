# Oxygen Warehouse Management System (OWMS) - Backend

Welcome to the backend of the **Oxygen Warehouse Management System**. This system is designed to manage medical gas inventory, tracking cylinders, liquid oxygen levels, and movements within a hospital environment.

## 🚀 Installation & Setup

### Prerequisites
- PHP 8.2 or higher
- Composer
- MySQL or MariaDB
- A local server environment like Laragon, XAMPP, or Docker.

### Steps to Run Locally

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install Dependencies**:
   ```bash
   composer install
   ```

3. **Environment Configuration**:
   - Copy the example `.env` file:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and configure your database credentials:
     ```env
     DB_CONNECTION=mysql
     DB_HOST=127.0.0.1
     DB_PORT=3306
     DB_DATABASE=your_database_name
     DB_USERNAME=your_username
     DB_PASSWORD=your_password
     ```

4. **Generate Application Key**:
   ```bash
   php artisan key:generate
   ```

5. **Run Migrations & Seeders**:
   ```bash
   php artisan migrate --seed
   ```
   *(Note: The seeders will create default roles and potentially some test users).*

6. **Start the Server**:
   ```bash
   php artisan serve
   ```
   The API will be available at `http://127.0.0.1:8000`.

## 📂 Project Structure

- `app/Models`: Contains Eloquent models for Users, Cylinders, Patients, Movements, etc.
- `app/Http/Controllers`: Backend logic for handling API requests.
- `app/Http/Middleware`: Security layers including JWT-like protection (Sanctum) and Role-Based Access Control (RBAC).
- `routes/api.php`: The entry point for all API endpoints.
- `database/migrations`: Database schema definitions.

## 🔐 Authentication
The system uses **Laravel Sanctum**. To access protected routes, you must:
1. Login via `/api/auth/login`.
2. Receive a `token`.
3. Include the token in subsequent requests as a Bearer Token:
   `Authorization: Bearer <your_token>`

## 📖 API Documentation
For a detailed list of all available endpoints, request bodies, and response examples, please refer to:
[API Documentation](docs/API_DOCUMENTATION.md)

## 🛠 Features
- **User Management**: Creating and deactivating users with specific roles (Administrator, Engineer, Operator).
- **Cylinder Tracking**: Real-time status of oxygen cylinders (Full, Empty, In Use).
- **Inventory Movements**: Tracking exchanges and refills.
- **Liquid Oxygen Module**: Monitoring cryogenic tank levels and supplier refills.
- **Reports**: Daily consumption summaries and movement history (Kardex).

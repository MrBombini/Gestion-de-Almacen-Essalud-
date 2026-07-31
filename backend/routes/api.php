<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\BedController;
use App\Http\Controllers\CylinderController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\LiquidController;
use App\Http\Controllers\InventoryMovementController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\OwnershipTypeController;
use App\Http\Controllers\DailyReadingController;
use App\Http\Controllers\PrescriptionController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ==========================================
// 1. PUBLIC ROUTES
// ==========================================
Route::post('/auth/login', [AuthController::class, 'login']);

// ==========================================
// PROTECTED ROUTES (Requires Sanctum Bearer Token)
// ==========================================
Route::middleware(['auth:sanctum'])->group(function () {
    
    // 2. General Session Routes
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', function (Request $request) {
        return response()->json([
            'user' => $request->user(),
        ]);
    });

    // 3. Operator Routes (Operators, Administrators, Engineers)
    Route::middleware(['role:Operator,Administrator,Engineer'])->group(function () {
        
        Route::get('/dashboard/stats', [ReportController::class, 'dashboardStats']);

        // Catalogs (CRUD)
        Route::apiResource('patients', PatientController::class);
        Route::apiResource('services', ServiceController::class);
        Route::apiResource('beds', BedController::class);
        Route::apiResource('cylinders', CylinderController::class);
        Route::apiResource('suppliers', SupplierController::class);
        Route::apiResource('daily-readings', DailyReadingController::class);
        Route::apiResource('ownership-types', OwnershipTypeController::class);

        // Prescriptions (Sub-CRUD de Pacientes)
        Route::get('prescriptions', [PrescriptionController::class, 'index']);
        Route::get('prescriptions/{id}', [PrescriptionController::class, 'show']);
        Route::post('prescriptions', [PrescriptionController::class, 'store']);
        Route::put('prescriptions/{id}', [PrescriptionController::class, 'update']);
        Route::delete('prescriptions/{id}', [PrescriptionController::class, 'destroy']);

        // Liquid Module
        Route::prefix('liquid')->group(function () {
            Route::get('/refills', [LiquidController::class, 'index']);
            Route::post('/refill', [LiquidController::class, 'storeRefill']);
            Route::delete('/refills/{id}', [LiquidController::class, 'destroy']);
        });

        // Inventory Movements Module
        Route::prefix('inventory')->group(function () {
            Route::get('/movements', [InventoryMovementController::class, 'index']);
            Route::get('/decantings', [InventoryMovementController::class, 'indexDecantings']);
            Route::post('/exchange', [InventoryMovementController::class, 'createExchange']);
            Route::post('/decanting', [InventoryMovementController::class, 'createDecanting']);
            Route::post('/supplier', [InventoryMovementController::class, 'createSupplierMovement']);
            Route::post('/periphery-exchange', [InventoryMovementController::class, 'createServiceBulkExchange']);
            Route::post('/supplier-entry', [InventoryMovementController::class, 'createSupplierEntry']);
        });
        
        // Reports
        Route::prefix('reports')->group(function () {
            Route::get('/movements-search', [ReportController::class, 'movementsSearch']);
            Route::get('/inventory', [ReportController::class, 'inventoryReport']);
            Route::get('/stagnant', [ReportController::class, 'stagnantCylinders']);
            Route::get('/history/{id}', [ReportController::class, 'cylinderHistory']);
            Route::get('/shift-closure', [ReportController::class, 'shiftClosure']);
            Route::get('/consumption', [ReportController::class, 'consumptionReport']);
            Route::get('/daily-kardex', [ReportController::class, 'dailyKardex']);
            Route::get('/consumption-dashboard', [ReportController::class, 'dailyConsumptionDashboard']);
            Route::get('/kardex', [ReportController::class, 'kardexGeneral']);
            Route::get('/patient-alerts', [ReportController::class, 'patientAlerts']);
            Route::get('/hospitalization-control', [ReportController::class, 'hospitalizationControl']);
        });
        
    });

    // 4. Superadmin Routes
    Route::middleware(['role:Administrator'])->group(function () {
        
        // Users Management
        Route::apiResource('users', UserController::class);
        Route::patch('/users/{id}/deactivate', [UserController::class, 'deactivate']);
        Route::patch('/users/{id}/activate', [UserController::class, 'activate']);
        Route::patch('/users/{id}/toggle-status', [UserController::class, 'toggleStatus']);
        
    });
});

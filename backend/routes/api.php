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
        
        // Catalogs (CRUD)
        Route::apiResource('patients', PatientController::class);
        Route::apiResource('services', ServiceController::class);
        Route::apiResource('beds', BedController::class);
        Route::apiResource('cylinders', CylinderController::class);
        Route::apiResource('suppliers', SupplierController::class);

        // Liquid Module
        Route::prefix('liquid')->group(function () {
            Route::post('/refill', [LiquidController::class, 'storeRefill']);
            Route::post('/daily-reading', [LiquidController::class, 'storeDailyReading']);
        });

        // Inventory Movements Module
        Route::prefix('inventory')->group(function () {
            Route::post('/exchange', [InventoryMovementController::class, 'createExchange']);
            Route::post('/decanting', [InventoryMovementController::class, 'createDecanting']);
            Route::post('/supplier-entry', [InventoryMovementController::class, 'createSupplierEntry']);
        });
        
    });

    // 4. Administrator / Engineer Routes
    Route::middleware(['role:Administrator,Engineer'])->group(function () {
        
        // Users Management
        Route::apiResource('users', UserController::class);
        Route::patch('/users/{id}/deactivate', [UserController::class, 'deactivate']);

        // Reports
        Route::prefix('reports')->group(function () {
            Route::get('/kardex', [ReportController::class, 'kardexGeneral']);
            Route::get('/consumption', [ReportController::class, 'dailyConsumptionSummary']);
        });
        
    });
});

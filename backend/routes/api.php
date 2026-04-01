<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CylinderController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\ProviderController;
use App\Http\Controllers\CylinderCapacityController;
use App\Http\Controllers\GasTypeController;
use App\Http\Controllers\CylinderModelController;
use App\Http\Controllers\InventoryMovementController;
use App\Http\Controllers\TankReadingController;

/*
|--------------------------------------------------------------------------
| ESSALUD GESTIÓN DE GASES MEDICINALES - API ROUTES (SISTEMA FINAL DINÁMICO)
|--------------------------------------------------------------------------
*/

// MANTENIMIENTO INDIVIDUAL (Capacidades y Dueños)
Route::controller(CylinderCapacityController::class)->group(function () {
    Route::get('/capacities', 'index');
    Route::post('/capacities', 'store'); // Crear 10m3, 6m3, etc.
});

Route::controller(ProviderController::class)->group(function () {
    Route::get('/providers', 'index');
    Route::post('/providers', 'store'); // Crear Linde, Praxair, etc.
});

Route::controller(GasTypeController::class)->group(function () {
    Route::get('/gas-types', 'index');
    Route::post('/gas-types', 'store');
});

Route::controller(CylinderModelController::class)->group(function () {
    Route::get('/cylinder-models', 'index');
    Route::post('/cylinder-models', 'store');
});

// Opciones dinámicas para el FRONTEND (Dropdowns)
Route::get('/cylinders/form-options', [CylinderController::class, 'getFormOptions']);

// Gestión de Cilindros
Route::controller(CylinderController::class)->group(function () {
    Route::get('/cylinders', 'index');
    Route::post('/cylinders', 'store');
    Route::get('/cylinders/{barcode}', 'show');
    Route::put('/cylinders/{barcode}', 'update');
});

// Gestión de Ubicaciones (Camas/Servicios)
Route::controller(LocationController::class)->group(function () {
    Route::get('/locations', 'index');
    Route::post('/locations', 'store');
    Route::put('/locations/{id}', 'update');
});

// Gestión de Pacientes (PADOMI)
Route::controller(PatientController::class)->group(function () {
    Route::get('/patients', 'index');
    Route::post('/patients', 'store');
    Route::get('/patients/{dni}', 'show');
    Route::put('/patients/{id}', 'update');
});

// Movimientos de Inventario (Kardex Transaccional)
Route::controller(InventoryMovementController::class)->group(function () {
    Route::get('/movements', 'index');
    Route::post('/movements', 'store');
});

// Lecturas de Tanques Criogénicos
Route::controller(TankReadingController::class)->group(function () {
    Route::get('/tank-readings', 'index');
    Route::post('/tank-readings', 'store');
});

<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return response()->json([
        'app' => 'Oxygen Warehouse Management System API',
        'status' => 'Running',
        'version' => '1.0.0'
    ]);
});

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Patient extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'full_name',
        'dni',
        'trasiego_code',
        'exchange_code'
    ];

    public function prescriptions()
    {
        return $this->hasMany(Prescription::class);
    }

    public function inventoryMovements()
    {
        return $this->hasMany(InventoryMovement::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Service extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['name', 'type', 'abbreviation'];

    public function beds()
    {
        return $this->hasMany(Bed::class);
    }

    public function inventoryMovements()
    {
        return $this->hasMany(InventoryMovement::class);
    }

    public function cylinders()
    {
        return $this->hasMany(Cylinder::class);
    }

    public function prescriptions()
    {
        return $this->hasMany(Prescription::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Location extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['service_name', 'identifier', 'short_code', 'type'];

    public function cylinders()
    {
        return $this->hasMany(Cylinder::class, 'current_location_id');
    }

    public function patients()
    {
        return $this->hasMany(Patient::class);
    }

    // Helper: nombre completo para mostrar en UI (ej: "ONCOLOGÍA - 158")
    public function getFullNameAttribute(): string
    {
        return "{$this->service_name} - {$this->identifier}";
    }
}

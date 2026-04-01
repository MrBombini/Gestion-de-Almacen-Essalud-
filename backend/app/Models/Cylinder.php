<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Cylinder extends Model
{
    use HasFactory, SoftDeletes;

    // Barcode es la PK (string, no autoincremental)
    protected $primaryKey = 'barcode';
    public $incrementing  = false;
    protected $keyType    = 'string';

    protected $fillable = [
        'barcode',
        'serial_number_stamped',
        'gas_type_id',
        'capacity_id',
        'provider_id',
        'cylinder_model_id',
        'asset_type',
        'ph_test_date',
        'status',
        'current_location_id',
    ];

    protected $casts = [
        'ph_test_date' => 'date',
    ];

    // ─── Relaciones ─────────────────────────────────────────────

    public function gasType()
    {
        return $this->belongsTo(GasType::class);
    }

    public function capacity()
    {
        return $this->belongsTo(CylinderCapacity::class);
    }

    public function provider()
    {
        return $this->belongsTo(Provider::class); // Dueño legal del balón
    }

    public function cylinderModel()
    {
        return $this->belongsTo(CylinderModel::class); // Marca: JD, KIOSHI...
    }

    public function location()
    {
        return $this->belongsTo(Location::class, 'current_location_id');
    }

    public function movements()
    {
        return $this->hasMany(InventoryMovement::class, 'cylinder_barcode', 'barcode');
    }

    public function statusLogs()
    {
        return $this->hasMany(CylinderStatuslog::class, 'cylinder_barcode', 'barcode');
    }

    // ─── Helpers ─────────────────────────────────────────────────

    /** ¿La prueba hidrostática está vencida o vence en menos de 30 días? */
    public function isPhExpiringSoon(): bool
    {
        return $this->ph_test_date && $this->ph_test_date->diffInDays(now(), false) >= -30;
    }

    /** ¿La PH ya venció? */
    public function isPhExpired(): bool
    {
        return $this->ph_test_date && $this->ph_test_date->isPast();
    }
}

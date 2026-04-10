<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Cylinder extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'serial_number',
        'supplier_id',
        'ownership_type_id',
        'gas_type',
        'capacity',
        'status',
        'hydrostatic_test_date',
        'physical_condition'
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function ownershipType()
    {
        return $this->belongsTo(OwnershipType::class);
    }

    public function movements()
    {
        return $this->hasMany(CylinderMovement::class);
    }
}

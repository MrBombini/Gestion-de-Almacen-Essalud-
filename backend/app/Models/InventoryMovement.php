<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class InventoryMovement extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'type',
        'shift',
        'reference_document',
        'patient_id',
        'service_id',
        'bed_id',
        'prescription_id',
        'supplier_id',
        'user_id',
        'movement_at',
        'notes',
        'reason',
        'expected_return_date',
        'authority_id'
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function bed()
    {
        return $this->belongsTo(Bed::class);
    }

    public function prescription()
    {
        return $this->belongsTo(Prescription::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function cylinderMovements()
    {
        return $this->hasMany(CylinderMovement::class);
    }

    public function authority()
    {
        return $this->belongsTo(Authority::class);
    }
}

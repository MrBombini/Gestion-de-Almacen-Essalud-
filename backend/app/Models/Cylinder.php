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
        'barcode',
        'supplier_id',
        'ownership_type_id',
        'patient_id',
        'service_id',
        'current_patient_id',
        'current_service_id',
        'current_bed_id',
        'gas_type',
        'capacity',
        'status',
        'location',
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

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function currentPatient()
    {
        return $this->belongsTo(Patient::class, 'current_patient_id');
    }

    public function currentService()
    {
        return $this->belongsTo(Service::class, 'current_service_id');
    }

    public function currentBed()
    {
        return $this->belongsTo(Bed::class, 'current_bed_id');
    }
}

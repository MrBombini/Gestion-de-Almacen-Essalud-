<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;

class Decanting extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'cylinder_id',
        'service_id',
        'patient_id',
        'prescription_id',
        'manual_destination',
        'refilled_amount',
        'shift',
        'user_id',
        'decanted_at'
    ];

    public function cylinder()
    {
        return $this->belongsTo(Cylinder::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function prescription()
    {
        return $this->belongsTo(Prescription::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

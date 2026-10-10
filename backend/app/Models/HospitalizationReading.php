<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class HospitalizationReading extends Model
{
    use HasFactory;

    protected $fillable = [
        'cylinder_id',
        'service_id',
        'bed_id',
        'user_id',
        'shift',
        'pressure_psi',
        'flow_lmin',
        'estimated_hours',
        'notes',
        'read_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
        'pressure_psi' => 'decimal:2',
        'flow_lmin' => 'decimal:2',
        'estimated_hours' => 'decimal:2',
    ];

    public function cylinder()
    {
        return $this->belongsTo(Cylinder::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function bed()
    {
        return $this->belongsTo(Bed::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

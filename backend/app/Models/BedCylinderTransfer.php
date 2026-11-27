<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class BedCylinderTransfer extends Model
{
    use HasFactory;

    protected $fillable = [
        'cylinder_id',
        'from_bed_id',
        'to_bed_id',
        'from_service_id',
        'to_service_id',
        'user_id',
        'shift',
        'notes',
        'transferred_at',
    ];

    protected $casts = [
        'transferred_at' => 'datetime',
    ];

    public function cylinder()
    {
        return $this->belongsTo(Cylinder::class);
    }

    public function fromBed()
    {
        return $this->belongsTo(Bed::class, 'from_bed_id');
    }

    public function toBed()
    {
        return $this->belongsTo(Bed::class, 'to_bed_id');
    }

    public function fromService()
    {
        return $this->belongsTo(Service::class, 'from_service_id');
    }

    public function toService()
    {
        return $this->belongsTo(Service::class, 'to_service_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CylinderStatusLog extends Model
{
    // Log inmutable: solo tiene created_at, nunca se edita ni borra
    public $timestamps = false;

    protected $fillable = [
        'cylinder_barcode',
        'previous_status',
        'new_status',
        'user_id',
        'notes',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function cylinder()
    {
        return $this->belongsTo(Cylinder::class, 'cylinder_barcode', 'barcode');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

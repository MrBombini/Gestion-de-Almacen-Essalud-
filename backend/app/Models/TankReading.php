<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TankReading extends Model
{
    use HasFactory;

    protected $fillable = [
        'tank_name',
        'level_percentage',
        'pressure_psi',
        'current_m3',
        'user_id',
        'is_refill',
        'quantity_added',
        'shift',
        'recorded_at'
    ];

    protected $casts = [
        'is_refill' => 'boolean',
        'level_percentage' => 'float',
        'recorded_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /** Ayudante: ¿El nivel es crítico? (Menos del 20%) */
    public function isCritical(): bool
    {
        return $this->level_percentage !== null && $this->level_percentage < 20;
    }
}

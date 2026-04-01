<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'operator_code', 'name', 'email', 'password', 'role',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return ['password' => 'hashed'];
    }

    // Relaciones
    public function movements()
    {
        return $this->hasMany(InventoryMovement::class);
    }

    public function statusLogs()
    {
        return $this->hasMany(CylinderStatusLog::class);
    }

    public function tankReadings()
    {
        return $this->hasMany(TankReading::class);
    }

    // Helper: verificar rol
    public function isEngineer(): bool { return $this->role === 'engineer'; }
    public function isTechnician(): bool { return $this->role === 'technician'; }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Sanctum\HasApiTokens;


class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'operator_code', 
        'name', 
        'password', 
        'role',
        'status'
    ];

    protected $hidden = [
        'password', 
        'remember_token'
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed'
        ];
    }

    // Helper: verificar estado
    public function isActive(): bool 
    { 
        return $this->status === 'active'; 
    }

    // Helper: verificar rol
    public function hasRole(...$roles): bool 
    { 
        if ($this->role === 'SuperAdmin') {
            return true;
        }
        return in_array($this->role, $roles); 
    }

    public function liquidRefills()
    {
        return $this->hasMany(LiquidRefill::class);
    }

    public function dailyReadings()
    {
        return $this->hasMany(DailyReading::class);
    }

    public function inventoryMovements()
    {
        return $this->hasMany(InventoryMovement::class);
    }
}

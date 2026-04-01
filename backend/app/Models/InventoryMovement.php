<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 
        'cylinder_barcode', 
        'type', 
        'location_from_id', 
        'location_to_id', 
        'batch_number', 
        'gas_expiration_date', 
        'quantity_loaded', 
        'notes', 
        'transaction_group_id',
        'movement_at'
    ];

    protected $casts = [
        'gas_expiration_date' => 'date',
        'movement_at' => 'datetime',
    ];

    // Relaciones
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function cylinder()
    {
        return $this->belongsTo(Cylinder::class, 'cylinder_barcode', 'barcode');
    }

    public function fromLocation()
    {
        return $this->belongsTo(Location::class, 'location_from_id');
    }

    public function toLocation()
    {
        return $this->belongsTo(Location::class, 'location_to_id');
    }

    // Scope para agrupar transacciones (ej: cambios de balón)
    public function scopeByGroup($query, $groupId)
    {
        return $query->where('transaction_group_id', $groupId);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CylinderMovement extends Model
{
    protected $fillable = [
        'inventory_movement_id',
        'cylinder_id',
        'action',
        'cylinder_status'
    ];

    public function inventoryMovement()
    {
        return $this->belongsTo(InventoryMovement::class);
    }

    public function cylinder()
    {
        return $this->belongsTo(Cylinder::class);
    }
}

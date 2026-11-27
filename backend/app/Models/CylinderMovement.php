<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CylinderMovement extends Model
{
    use SoftDeletes;
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

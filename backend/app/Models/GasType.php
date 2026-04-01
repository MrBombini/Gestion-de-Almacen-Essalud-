<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class GasType extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['name', 'unit', 'min_stock'];

    public function cylinders()
    {
        return $this->hasMany(Cylinder::class);
    }

    /** Ayudante: ¿El stock está bajo el mínimo? (Alertas Kardex) */
    public function isStockLow(int $currentCount): bool
    {
        return $currentCount <= $this->min_stock;
    }
}

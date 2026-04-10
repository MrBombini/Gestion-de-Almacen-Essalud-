<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['name', 'description'];

    public function cylinders()
    {
        return $this->hasMany(Cylinder::class);
    }

    public function liquidRefills()
    {
        return $this->hasMany(LiquidRefill::class);
    }
}

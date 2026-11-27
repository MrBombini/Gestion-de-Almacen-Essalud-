<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'ruc',
        'address',
        'phone',
        'email',
        'description'
    ];

    public function cylinders()
    {
        return $this->hasMany(Cylinder::class);
    }
}

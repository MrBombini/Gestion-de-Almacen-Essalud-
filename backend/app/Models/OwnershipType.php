<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class OwnershipType extends Model
{
    use HasFactory;
    protected $fillable = ['name'];

    public function cylinders()
    {
        return $this->hasMany(Cylinder::class);
    }
}

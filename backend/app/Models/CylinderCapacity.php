<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CylinderCapacity extends Model
{
    use HasFactory;

    protected $fillable = ['value', 'unit', 'description'];
}

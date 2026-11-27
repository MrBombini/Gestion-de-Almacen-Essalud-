<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Bed extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['service_id', 'bed_number', 'status'];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }
}

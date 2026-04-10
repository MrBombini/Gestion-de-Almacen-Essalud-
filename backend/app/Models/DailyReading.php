<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DailyReading extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'reading_date', 
        'shift', 
        'ext_tank_reserve', 
        'int_warehouse_consumption', 
        'calculated_consumption', 
        'user_id'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

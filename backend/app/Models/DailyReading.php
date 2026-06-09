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
        'tank_level',
        'flow_meter_reading',
        'calculated_consumption',
        'user_id'
    ];

    protected function casts(): array
    {
        return [
            'reading_date' => 'date',
            'tank_level' => 'float',
            'flow_meter_reading' => 'float',
            'calculated_consumption' => 'float',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

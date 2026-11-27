<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailySnapshot extends Model
{
    use HasFactory;

    protected $fillable = ['date', 'snapshot_data'];

    protected $casts = [
        'snapshot_data' => 'array',
    ];
}

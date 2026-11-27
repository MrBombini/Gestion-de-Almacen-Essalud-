<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Prescription extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'patient_id', 
        'service_id', 
        'dosage', 
        'usage_time', 
        'issued_at', 
        'expires_at', 
        'authorization_date',
        'promissory_note',
        'status'
    ];

    protected $appends = ['days_remaining'];

    protected function casts(): array
    {
        return [
            'issued_at' => 'date',
            'expires_at' => 'date',
            'authorization_date' => 'date',
        ];
    }

    public function getDaysRemainingAttribute()
    {
        if (!$this->expires_at) {
            return null;
        }
        return (int) now()->startOfDay()->diffInDays(\Carbon\Carbon::parse($this->expires_at)->startOfDay(), false);
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }
}

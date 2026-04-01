<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Patient extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'patient_code', 'name', 'dni', 'birth_date',
        'phone', 'address', 'loan_expiration_date', 'location_id',
    ];

    protected $casts = [
        'birth_date'           => 'date',
        'loan_expiration_date' => 'date',
    ];

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    // ─── Helpers ─────────────────────────────────────────────────

    /** Días restantes del préstamo (negativo = ya venció) */
    public function loanDaysRemaining(): int
    {
        if (!$this->loan_expiration_date) return 0;
        return (int) now()->diffInDays($this->loan_expiration_date, false);
    }

    /** ¿El préstamo ya venció? → Semáforo ROJO 🔴 */
    public function isLoanExpired(): bool
    {
        return $this->loan_expiration_date && $this->loan_expiration_date->isPast();
    }
}

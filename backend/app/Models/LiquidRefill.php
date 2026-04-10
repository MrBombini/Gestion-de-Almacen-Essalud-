<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LiquidRefill extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'supplier_id', 
        'level_before', 
        'level_after', 
        'ticket_amount', 
        'reference_document', 
        'user_id', 
        'refilled_at'
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

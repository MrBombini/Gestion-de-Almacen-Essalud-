<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserDraft extends Model
{
    protected $fillable = [
        'user_id',
        'module_name',
        'draft_data',
    ];

    protected $casts = [
        'draft_data' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

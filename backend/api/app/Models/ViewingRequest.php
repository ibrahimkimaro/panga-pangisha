<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ViewingRequest extends Model
{
    protected $fillable = ['house_id', 'user_id', 'preferred_at', 'note', 'status'];
    protected $casts = ['preferred_at' => 'datetime'];

    public function house() { return $this->belongsTo(House::class); }
    public function user() { return $this->belongsTo(User::class); }
}

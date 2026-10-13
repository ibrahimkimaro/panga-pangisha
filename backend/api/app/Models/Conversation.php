<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    protected $fillable = ['user_low_id', 'user_high_id', 'house_id'];

    public function low() { return $this->belongsTo(User::class, 'user_low_id'); }
    public function high() { return $this->belongsTo(User::class, 'user_high_id'); }
    public function house() { return $this->belongsTo(House::class); }
}

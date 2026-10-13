<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ListingReport extends Model
{
    protected $guarded = ['id'];

    public function house() { return $this->belongsTo(House::class); }
    public function reporter() { return $this->belongsTo(User::class, 'user_id'); }
}

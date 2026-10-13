<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    protected $guarded = ['id', 'house_id'];
    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): ?string
    {
        return $this->image_path ? '/storage/' . ltrim($this->image_path, '/') : null;
    }

    public function house() { return $this->belongsTo(House::class); }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Unit extends Model
{
    protected $guarded = ['id', 'house_id'];
    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): ?string
    {
        return $this->image_path ? '/storage/' . ltrim($this->image_path, '/') : null;
    }

    public function house(): BelongsTo
    {
        return $this->belongsTo(House::class);
    }

    public function currentTenancy(): BelongsTo
    {
        return $this->belongsTo(Tenancy::class, 'current_tenancy_id');
    }

    public function tenancies(): HasMany
    {
        return $this->hasMany(Tenancy::class);
    }

    public function agreements(): HasMany
    {
        return $this->hasMany(RentalAgreement::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}

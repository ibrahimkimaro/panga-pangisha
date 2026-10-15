<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class House extends Model
{
    protected $guarded = ['id', 'owner_id'];
    protected $casts = ['amenities' => 'array', 'verified_at' => 'datetime', 'availability_confirmed_at' => 'datetime'];

    public function owner(): BelongsTo { return $this->belongsTo(User::class, 'owner_id'); }
    public function units(): HasMany { return $this->hasMany(Unit::class); }
    public function images(): HasMany { return $this->hasMany(HouseImage::class); }
    public function viewingRequests(): HasMany { return $this->hasMany(ViewingRequest::class); }
    public function reports(): HasMany { return $this->hasMany(ListingReport::class); }
    public function tenancies(): HasMany { return $this->hasMany(Tenancy::class); }
    public function maintenance(): HasMany { return $this->hasMany(MaintenanceRequest::class); }
    public function agreements(): HasMany { return $this->hasMany(RentalAgreement::class); }
    public function invoices(): HasMany { return $this->hasMany(Invoice::class); }

    /** What renters can find: available, and not advertised by a suspended account. */
    public function scopeLive($q) { return $q->where('status', 'available')->whereHas('owner', fn ($o) => $o->whereNull('suspended_at')); }
}

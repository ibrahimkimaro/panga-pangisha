<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class House extends Model
{
    protected $guarded = ['id', 'owner_id'];
    protected $casts = ['amenities' => 'array', 'verified_at' => 'datetime', 'availability_confirmed_at' => 'datetime'];

    public function owner() { return $this->belongsTo(User::class, 'owner_id'); }
    public function units() { return $this->hasMany(Unit::class); }
    public function images() { return $this->hasMany(HouseImage::class); }
    public function viewingRequests() { return $this->hasMany(ViewingRequest::class); }
    public function reports() { return $this->hasMany(ListingReport::class); }
    public function tenancies() { return $this->hasMany(Tenancy::class); }
    public function maintenance() { return $this->hasMany(MaintenanceRequest::class); }

    /** What renters can find: available, and not advertised by a suspended account. */
    public function scopeLive($q) { return $q->where('status', 'available')->whereHas('owner', fn ($o) => $o->whereNull('suspended_at')); }
}

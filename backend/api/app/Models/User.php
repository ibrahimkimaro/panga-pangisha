<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = ['fullname', 'email', 'phone', 'country', 'role', 'password'];
    protected $hidden = ['password'];
    protected $casts = ['password' => 'hashed', 'suspended_at' => 'datetime'];

    protected static function booted(): void
    {
        static::creating(fn (User $u) => $u->uuid ??= (string) Str::uuid());
        static::created(fn (User $u) => $u->profile()->create());
    }

    public function profile() { return $this->hasOne(Profile::class); }
    public function houses() { return $this->hasMany(House::class, 'owner_id'); }
    public function favorites() { return $this->belongsToMany(House::class, 'favorites')->withTimestamps(); }
    public function identities() { return $this->hasMany(IdentityVerification::class); }
    public function identity() { return $this->hasOne(IdentityVerification::class)->latestOfMany(); }

    /** none | pending | approved | rejected */
    public function identityStatus(): string { return $this->identity?->status ?? 'none'; }

    public function business() { return $this->hasOne(BusinessProfile::class); }
    public function viewingRequests() { return $this->hasMany(ViewingRequest::class); }
    public function deviceTokens() { return $this->hasMany(DeviceToken::class); }
}

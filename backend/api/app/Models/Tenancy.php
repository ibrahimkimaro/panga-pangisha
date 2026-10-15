<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Tenancy extends Model
{
    protected $fillable = [
        'house_id',
        'unit_id',
        'user_id',
        'name',
        'phone',
        'email',
        'nida',
        'unit',
        'monthly_rent',
        'deposit_amount',
        'payment_frequency',
        'starts_on',
        'ends_on',
        'check_in_at',
        'check_out_at',
        'status',
        'agreement_status',
    ];

    protected $casts = [
        'starts_on' => 'date',
        'ends_on' => 'date',
        'check_in_at' => 'datetime',
        'check_out_at' => 'datetime',
        'monthly_rent' => 'decimal:2',
        'deposit_amount' => 'decimal:2',
    ];

    protected $attributes = [
        'status' => 'active',
        'agreement_status' => 'pending',
    ];

    public function house(): BelongsTo
    {
        return $this->belongsTo(House::class);
    }

    public function unitRelation(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(RentPayment::class);
    }

    public function maintenance(): HasMany
    {
        return $this->hasMany(MaintenanceRequest::class);
    }

    public function agreement(): HasOne
    {
        return $this->hasOne(RentalAgreement::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    /**
     * Compute human-readable duration of occupancy.
     * If tenant is currently living here, computes ongoing duration up to today.
     */
    public function getOccupancyDurationAttribute(): string
    {
        $start = $this->starts_on ?? $this->created_at;
        if (!$start) {
            return 'N/A';
        }

        $end = ($this->status === 'ended' && $this->ends_on) ? $this->ends_on : now();
        $diff = $start->diff($end);

        $parts = [];
        if ($diff->y > 0) {
            $parts[] = $diff->y . ' ' . ($diff->y === 1 ? 'yr' : 'yrs');
        }
        if ($diff->m > 0) {
            $parts[] = $diff->m . ' ' . ($diff->m === 1 ? 'mo' : 'mos');
        }
        if ($diff->d > 0 && $diff->y === 0) {
            $parts[] = $diff->d . ' ' . ($diff->d === 1 ? 'day' : 'days');
        }

        $str = empty($parts) ? 'Just started' : implode(' ', $parts);
        return $this->status === 'active' ? "{$str} (Ongoing)" : "{$str} (Ended)";
    }
}

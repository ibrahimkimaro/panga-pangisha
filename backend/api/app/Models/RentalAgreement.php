<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RentalAgreement extends Model
{
    protected $fillable = [
        'house_id',
        'unit_id',
        'tenancy_id',
        'landlord_id',
        'tenant_id',
        'agreement_number',
        'language',
        'version',
        'status',
        'tenant_name',
        'tenant_phone',
        'tenant_email',
        'tenant_nida',
        'property_name',
        'unit_number',
        'monthly_rent',
        'security_deposit',
        'payment_frequency',
        'starts_on',
        'ends_on',
        'duration_months',
        'payment_method',
        'terms',
        'inventory',
        'meter_readings',
        'tenant_signature',
        'tenant_signed_at',
        'tenant_signed_ip',
        'tenant_signer_name',
        'landlord_signature',
        'landlord_signed_at',
        'landlord_signed_ip',
        'landlord_signer_name',
        'activated_at',
    ];

    protected $casts = [
        'terms' => 'array',
        'inventory' => 'array',
        'meter_readings' => 'array',
        'monthly_rent' => 'float',
        'security_deposit' => 'float',
        'starts_on' => 'date',
        'ends_on' => 'date',
        'tenant_signed_at' => 'datetime',
        'landlord_signed_at' => 'datetime',
        'activated_at' => 'datetime',
        'version' => 'integer',
        'duration_months' => 'integer',
    ];

    public function house(): BelongsTo
    {
        return $this->belongsTo(House::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function tenancy(): BelongsTo
    {
        return $this->belongsTo(Tenancy::class);
    }

    public function landlord(): BelongsTo
    {
        return $this->belongsTo(User::class, 'landlord_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tenant_id');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'rental_agreement_id');
    }

    public function isFullySigned(): bool
    {
        return !empty($this->tenant_signature) && !empty($this->landlord_signature);
    }
}

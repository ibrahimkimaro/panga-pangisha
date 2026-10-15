<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    protected $fillable = [
        'invoice_number',
        'house_id',
        'unit_id',
        'tenancy_id',
        'rental_agreement_id',
        'landlord_id',
        'tenant_id',
        'property_name',
        'unit_number',
        'tenant_name',
        'tenant_phone',
        'tenant_email',
        'issue_date',
        'due_date',
        'period_start',
        'period_end',
        'check_in_at',
        'check_out_at',
        'subtotal',
        'tax',
        'amount_due',
        'amount_paid',
        'outstanding_balance',
        'currency',
        'status',
        'line_items',
        'utility_readings',
        'late_fee_policy',
        'notes',
        'payment_method',
        'payment_reference',
        'receipt_screenshot_url',
        'paid_at',
        'delivered_at',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'due_date' => 'date',
        'period_start' => 'date',
        'period_end' => 'date',
        'check_in_at' => 'datetime',
        'check_out_at' => 'datetime',
        'paid_at' => 'datetime',
        'delivered_at' => 'datetime',
        'subtotal' => 'float',
        'tax' => 'float',
        'amount_due' => 'float',
        'amount_paid' => 'float',
        'outstanding_balance' => 'float',
        'line_items' => 'array',
        'utility_readings' => 'array',
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

    public function agreement(): BelongsTo
    {
        return $this->belongsTo(RentalAgreement::class, 'rental_agreement_id');
    }

    public function landlord(): BelongsTo
    {
        return $this->belongsTo(User::class, 'landlord_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tenant_id');
    }
}

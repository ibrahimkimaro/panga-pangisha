<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusinessProfile extends Model
{
    /** What the owner may type; everything else (status, reviewer) is set by the review. */
    public const DETAILS = ['entity_name', 'business_type', 'tin', 'brela', 'vrn', 'phone', 'email', 'address', 'website', 'bio'];

    protected $guarded = ['id'];
    protected $casts = ['reviewed_at' => 'datetime', 'submitted_at' => 'datetime'];

    public function user() { return $this->belongsTo(User::class); }
    public function reviewer() { return $this->belongsTo(User::class, 'reviewed_by'); }

    /** The shape the app's business form reads and writes. */
    public function forApp(): array
    {
        return $this->only(self::DETAILS) + ['status' => $this->status, 'rejection_reason' => $this->rejection_reason,
            'submitted_at' => $this->submitted_at, 'reviewed_at' => $this->reviewed_at];
    }
}

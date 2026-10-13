<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** One submission. A user can have several over time; the latest one is their current standing. */
class IdentityVerification extends Model
{
    protected $guarded = ['id'];
    protected $hidden = ['document_path'];
    // ponytail: the NIDA number is encrypted with APP_KEY, so rotating the key needs a re-encrypt pass first.
    protected $casts = ['nida_number' => 'encrypted', 'reviewed_at' => 'datetime'];

    public function user() { return $this->belongsTo(User::class); }
    public function reviewer() { return $this->belongsTo(User::class, 'reviewed_by'); }

    /** What the app polls while the landlord waits. */
    public function summary(): array
    {
        return ['status' => $this->status, 'method' => $this->method, 'rejection_reason' => $this->rejection_reason,
            'submitted_at' => $this->created_at, 'reviewed_at' => $this->reviewed_at];
    }
}

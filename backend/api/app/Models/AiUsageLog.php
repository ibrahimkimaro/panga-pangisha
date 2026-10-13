<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** One row per AI call, including calls that were blocked by a limit. */
class AiUsageLog extends Model
{
    public $timestamps = false;
    protected $guarded = ['id'];
    protected $casts = ['created_at' => 'datetime', 'cost' => 'float'];

    public function user() { return $this->belongsTo(User::class); }
}

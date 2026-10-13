<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Audit trail: one row per thing an admin changed. Written through record(), never edited. */
class AdminAction extends Model
{
    public $timestamps = false;
    protected $guarded = ['id'];
    protected $casts = ['created_at' => 'datetime'];

    public function admin() { return $this->belongsTo(User::class, 'admin_id'); }

    public static function record(string $action, Model $subject, string $summary): void
    {
        static::create([
            'admin_id' => auth()->id(), 'action' => $action, 'summary' => $summary, 'created_at' => now(),
            'subject_type' => explode('.', $action)[0], 'subject_id' => $subject->getKey(),
        ]);
    }
}

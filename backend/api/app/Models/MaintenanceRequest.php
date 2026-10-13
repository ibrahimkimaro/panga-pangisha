<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaintenanceRequest extends Model
{
    protected $fillable = ['tenancy_id', 'title', 'details', 'status'];
    protected $attributes = ['status' => 'open']; // so a new row answers with its status before it is re-read

    public function house() { return $this->belongsTo(House::class); }
    public function tenancy() { return $this->belongsTo(Tenancy::class); }
}

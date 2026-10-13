<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tenancy extends Model
{
    protected $fillable = ['user_id', 'name', 'phone', 'email', 'unit', 'monthly_rent', 'starts_on', 'ends_on', 'status'];
    protected $casts = ['starts_on' => 'date', 'ends_on' => 'date'];
    protected $attributes = ['status' => 'active']; // so a new row answers with its status before it is re-read

    public function house() { return $this->belongsTo(House::class); }
    public function user() { return $this->belongsTo(User::class); }
    public function payments() { return $this->hasMany(RentPayment::class); }
    public function maintenance() { return $this->hasMany(MaintenanceRequest::class); }
}

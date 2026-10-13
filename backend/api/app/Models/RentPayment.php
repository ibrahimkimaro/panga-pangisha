<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RentPayment extends Model
{
    protected $fillable = ['amount', 'paid_on', 'method', 'note'];
    protected $casts = ['paid_on' => 'date'];

    public function tenancy() { return $this->belongsTo(Tenancy::class); }
}

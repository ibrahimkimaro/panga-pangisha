<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PropertyDraft extends Model
{
    use HasUuids;

    protected $guarded = [];

    protected $casts = [
        'data' => 'array',
        'validation_state' => 'array',
        'revision' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function createdHouse(): BelongsTo
    {
        return $this->belongsTo(House::class, 'created_house_id');
    }

    /**
     * Default schema structure for a new property draft.
     */
    public static function defaultData(): array
    {
        return [
            'property_name' => '',
            'property_type' => 'House',
            'property_category' => 'Residential',
            'region' => 'Dar es Salaam',
            'district' => 'Kinondoni',
            'ward' => '',
            'street' => '',
            'house_number' => '',
            'napa_number' => '',
            'description' => '',
            'monthly_rent' => 0,
            'security_deposit' => null,
            'maintenance_fee' => null,
            'shared_amenities' => ['Water', 'LUKU'],
            'utility_arrangement' => [
                'electricity_meter' => 'shared',
                'water_meter' => 'shared',
            ],
            'units' => [],
        ];
    }
}

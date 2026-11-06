<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Compound extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'amenities' => 'array',
        'images' => 'array',
        'documents' => 'array',
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function houses(): HasMany
    {
        return $this->hasMany(House::class);
    }

    public function units(): HasManyThrough
    {
        return $this->hasManyThrough(Unit::class, House::class);
    }

    public function getFullLocationAttribute(): string
    {
        return implode(', ', array_filter([$this->ward, $this->district, $this->region ?: 'Dar es Salaam']));
    }

    public static function seedDefaultsForOwner(int $ownerId): void
    {
        // 1. Goba Executive Compound (4 Houses: 3 standalone 2-room bungalows + 1 multi-room house with 3 rooms)
        $goba = self::create([
            'owner_id' => $ownerId,
            'name' => 'Goba Executive Compound',
            'compound_type' => 'residential',
            'region' => 'Dar es Salaam',
            'district' => 'Kinondoni',
            'ward' => 'Goba',
            'street' => 'Tegeta A Road, Goba Center',
            'house_number' => 'Plot 418/Block 2',
            'napa_number' => 'TZ-DAR-KIN-GOB-0418',
            'latitude' => -6.7320,
            'longitude' => 39.1820,
            'description' => 'Gated secure compound in Goba featuring 3 independent standalone residential bungalows and 1 shared multi-room home with dedicated LUKU submeters and perimeter security.',
            'amenities' => ['Fenced Perimeter', '24/7 Security Guard', 'Borehole Water & DAWASA', 'Paved Parking (6+ Cars)', 'Electric Sliding Gate', 'Standby Generator'],
            'cover_image' => 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
            'status' => 'active',
        ]);

        // House 1: Standalone House 1
        $h1 = $goba->houses()->create([
            'owner_id' => $ownerId,
            'property_name' => 'Bungalow 1 (Main Villa)',
            'property_type' => 'Standalone House',
            'rental_mode' => 'entire',
            'region' => 'Dar es Salaam',
            'district' => 'Kinondoni',
            'ward' => 'Goba',
            'street' => 'Tegeta A Road',
            'bedrooms' => 2,
            'bathrooms' => 1,
            'monthly_rent' => 450000,
            'status' => 'occupied',
            'description' => 'Self-contained 2-bedroom home with private dining room, kitchen, and dedicated STS LUKU meter.',
        ]);
        $h1->units()->create([
            'unit_number' => 'B1-Entire',
            'unit_type' => 'Standalone House',
            'monthly_rent' => 450000,
            'status' => 'occupied',
            'bedrooms' => 2,
            'bathrooms' => 1,
            'description' => '2 Bedrooms, Dining Room, Sitting Room & Kitchen.',
        ]);

        // House 2: Standalone House 2
        $h2 = $goba->houses()->create([
            'owner_id' => $ownerId,
            'property_name' => 'Bungalow 2 (Garden View)',
            'property_type' => 'Standalone House',
            'rental_mode' => 'entire',
            'region' => 'Dar es Salaam',
            'district' => 'Kinondoni',
            'ward' => 'Goba',
            'street' => 'Tegeta A Road',
            'bedrooms' => 2,
            'bathrooms' => 1,
            'monthly_rent' => 450000,
            'status' => 'occupied',
            'description' => 'Self-contained 2-bedroom home with private dining room, kitchen, and garden porch.',
        ]);
        $h2->units()->create([
            'unit_number' => 'B2-Entire',
            'unit_type' => 'Standalone House',
            'monthly_rent' => 450000,
            'status' => 'occupied',
            'bedrooms' => 2,
            'bathrooms' => 1,
            'description' => '2 Bedrooms, Dining Room, Sitting Room & Kitchen.',
        ]);

        // House 3: Standalone House 3
        $h3 = $goba->houses()->create([
            'owner_id' => $ownerId,
            'property_name' => 'Bungalow 3 (Corner House)',
            'property_type' => 'Standalone House',
            'rental_mode' => 'entire',
            'region' => 'Dar es Salaam',
            'district' => 'Kinondoni',
            'ward' => 'Goba',
            'street' => 'Tegeta A Road',
            'bedrooms' => 2,
            'bathrooms' => 1,
            'monthly_rent' => 450000,
            'status' => 'available',
            'description' => 'Self-contained 2-bedroom standalone bungalow with dining room, front veranda, and STS meter.',
        ]);
        $h3->units()->create([
            'unit_number' => 'B3-Entire',
            'unit_type' => 'Standalone House',
            'monthly_rent' => 450000,
            'status' => 'available',
            'bedrooms' => 2,
            'bathrooms' => 1,
            'description' => '2 Bedrooms, Dining Room, Sitting Room & Kitchen.',
        ]);

        // House 4: Shared House rented in Rooms (3 rooms: 2 standard + 1 master en-suite)
        $h4 = $goba->houses()->create([
            'owner_id' => $ownerId,
            'property_name' => 'House 4 (Shared Tenancy Residence)',
            'property_type' => 'Shared House',
            'rental_mode' => 'rooms',
            'region' => 'Dar es Salaam',
            'district' => 'Kinondoni',
            'ward' => 'Goba',
            'street' => 'Tegeta A Road',
            'bedrooms' => 3,
            'bathrooms' => 2,
            'monthly_rent' => 450000,
            'status' => 'available',
            'description' => 'Spacious residential house leased out as 3 individual private rooms with shared living room, dining room, kitchen, and garden.',
        ]);
        // Room 1 (Standard Room)
        $h4->units()->create([
            'unit_number' => 'Room 1 (Standard)',
            'unit_type' => 'Standard Bedroom',
            'monthly_rent' => 130000,
            'status' => 'occupied',
            'bedrooms' => 1,
            'bathrooms' => 1,
            'description' => 'Standard bedroom with ceiling fan, shared modern bathroom with hot shower, and built-in wardrobe.',
        ]);
        // Room 2 (Standard Room)
        $h4->units()->create([
            'unit_number' => 'Room 2 (Standard)',
            'unit_type' => 'Standard Bedroom',
            'monthly_rent' => 130000,
            'status' => 'available',
            'bedrooms' => 1,
            'bathrooms' => 1,
            'description' => 'Standard bedroom with wide window, shared modern bathroom, tiled floors, and personal submeter.',
        ]);
        // Room 3 (Master En-suite)
        $h4->units()->create([
            'unit_number' => 'Room 3 (Master En-suite)',
            'unit_type' => 'Master Bedroom',
            'monthly_rent' => 190000,
            'status' => 'available',
            'bedrooms' => 1,
            'bathrooms' => 1,
            'description' => 'Large master bedroom with private attached bathroom, AC, gypsum ceiling, and garden view.',
        ]);

        // 2. Sinza Prime Compound (2 Houses: 1 Apartment block + 1 Normal standalone house)
        $sinza = self::create([
            'owner_id' => $ownerId,
            'name' => 'Sinza Prime Compound',
            'compound_type' => 'residential',
            'region' => 'Dar es Salaam',
            'district' => 'Kinondoni',
            'ward' => 'Sinza',
            'street' => 'Mori Road, Near Palestina Hospital',
            'house_number' => 'Plot 88/C',
            'napa_number' => 'TZ-DAR-KIN-SNZ-0088',
            'latitude' => -6.7820,
            'longitude' => 39.2240,
            'description' => 'Prime paved compound in Sinza containing 1 modern apartment building and 1 standalone normal house with reserve water tanks and individual STS prepaid submeters.',
            'amenities' => ['Paved Compound (Cabro)', 'DAWASA Water & Underground Tank', 'Electric Fence', 'Dedicated Parking', 'STS LUKU Submeter per unit'],
            'cover_image' => 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
            'status' => 'active',
        ]);

        // Sinza House 1: Apartment Block
        $sh1 = $sinza->houses()->create([
            'owner_id' => $ownerId,
            'property_name' => 'Sinza Modern Apartments (Block A)',
            'property_type' => 'Multi-Apartment Building',
            'rental_mode' => 'multi_unit',
            'region' => 'Dar es Salaam',
            'district' => 'Kinondoni',
            'ward' => 'Sinza',
            'street' => 'Mori Road',
            'bedrooms' => 4,
            'bathrooms' => 4,
            'monthly_rent' => 1400000,
            'status' => 'occupied',
            'description' => 'Two-storey block with 4 self-contained 1-bedroom executive flats.',
        ]);
        for ($i = 1; $i <= 4; $i++) {
            $sh1->units()->create([
                'unit_number' => "Apt $i",
                'unit_type' => '1-Bedroom Flat',
                'monthly_rent' => 350000,
                'status' => $i <= 2 ? 'occupied' : 'available',
                'bedrooms' => 1,
                'bathrooms' => 1,
                'description' => "Self-contained flat $i with sitting room, fitted kitchen, private balcony, and STS submeter.",
            ]);
        }

        // Sinza House 2: Standalone Family House
        $sh2 = $sinza->houses()->create([
            'owner_id' => $ownerId,
            'property_name' => 'Sinza Family Bungalow',
            'property_type' => 'Standalone House',
            'rental_mode' => 'entire',
            'region' => 'Dar es Salaam',
            'district' => 'Kinondoni',
            'ward' => 'Sinza',
            'street' => 'Mori Road',
            'bedrooms' => 3,
            'bathrooms' => 2,
            'monthly_rent' => 550000,
            'status' => 'occupied',
            'description' => 'Spacious 3-bedroom standalone home with private compound yard, sitting room, dining room & store.',
        ]);
        $sh2->units()->create([
            'unit_number' => 'Full House',
            'unit_type' => 'Standalone House',
            'monthly_rent' => 550000,
            'status' => 'occupied',
            'bedrooms' => 3,
            'bathrooms' => 2,
            'description' => '3 Bedrooms, 2 Bathrooms, Sitting Room, Dining Room & Store.',
        ]);
    }
}


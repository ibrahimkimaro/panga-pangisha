<?php

namespace Database\Seeders;

use App\Models\House;
use App\Models\Tenancy;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Database\Seeder;

class IbrahimKimaroSeeder extends Seeder
{
    public function run(): void
    {
        $ibrahim = User::where('id', 18)->orWhere('email', 'ibrahimkimaro01@gmail.com')->first();
        if (!$ibrahim) {
            $ibrahim = User::create([
                'id' => 18,
                'fullname' => 'Ibrahim Kimaro',
                'email' => 'ibrahimkimaro01@gmail.com',
                'phone' => '+255628736374',
                'country' => 'TZ',
                'role' => 'landlord',
                'password' => 'password123',
            ]);
        }

        $profile = $ibrahim->profile ?? $ibrahim->profile()->create();
        $profile->update([
            'bio' => 'Commercial & residential landlord with 18+ units across Dar es Salaam.',
            'location' => 'Dar es Salaam, Tanzania',
            'profile_image' => 'houses/kimaro_residence_exterior.jpg',
        ]);

        $first = now('Africa/Dar_es_Salaam')->startOfMonth();

        // 1. Ensure House 23 (Kimaro Modern Residence) has 5 units & active tenancies
        $residence = House::find(23);
        if ($residence) {
            $residence->update(['owner_id' => $ibrahim->id]);
            // Ensure tenancies exist for House 23 units if none exist
            if ($residence->tenancies()->count() === 0) {
                $t1 = $residence->tenancies()->create([
                    'name' => 'Asha Msuya',
                    'phone' => '+255712300001',
                    'email' => 'asha.msuya@gmail.com',
                    'unit' => 'Independent Full House Wing A',
                    'monthly_rent' => 550000,
                    'starts_on' => $first->copy()->subMonths(6),
                    'status' => 'active',
                ]);
                $t1->payments()->create(['amount' => 550000, 'paid_on' => $first->copy()->addDays(2), 'method' => 'mobile']);
                $t1->payments()->create(['amount' => 550000, 'paid_on' => $first->copy()->subMonth()->addDays(2), 'method' => 'mobile']);

                $t2 = $residence->tenancies()->create([
                    'name' => 'John Kavishe',
                    'phone' => '+255712300002',
                    'email' => 'john.kavishe@yahoo.com',
                    'unit' => 'Independent Full House Wing B',
                    'monthly_rent' => 550000,
                    'starts_on' => $first->copy()->subMonths(4),
                    'status' => 'active',
                ]);
                $t2->payments()->create(['amount' => 550000, 'paid_on' => $first->copy()->addDays(3), 'method' => 'bank']);

                $t3 = $residence->tenancies()->create([
                    'name' => 'David Mwangi',
                    'phone' => '+255712300003',
                    'email' => 'david.mwangi@gmail.com',
                    'unit' => 'Master Bedroom Suite 1',
                    'monthly_rent' => 400000,
                    'starts_on' => $first->copy()->subMonths(8),
                    'status' => 'active',
                ]);
                $t3->payments()->create(['amount' => 400000, 'paid_on' => $first->copy()->addDays(1), 'method' => 'mobile']);

                $t4 = $residence->tenancies()->create([
                    'name' => 'Grace Kimaro',
                    'phone' => '+255712300004',
                    'email' => 'grace.k@outlook.com',
                    'unit' => 'Master Bedroom Suite 2',
                    'monthly_rent' => 400000,
                    'starts_on' => $first->copy()->subMonths(3),
                    'status' => 'active',
                ]);
                $t4->payments()->create(['amount' => 400000, 'paid_on' => $first->copy()->addDays(4), 'method' => 'mobile']);

                // Maintenance tickets for House 23
                $residence->maintenance()->create([
                    'tenancy_id' => $t2->id,
                    'title' => 'Kitchen water tap leak',
                    'details' => 'Water valve in kitchen sink needs washer replacement.',
                    'status' => 'open',
                ]);
            }
        }

        // 2. House: Kimaro Executive Heights (Mikocheni B) - 4 units
        $heights = House::firstOrCreate(
            ['owner_id' => $ibrahim->id, 'property_name' => 'Kimaro Executive Heights'],
            [
                'property_type' => 'Apartment',
                'property_category' => 'Residential',
                'furnishing_status' => 'Furnished',
                'description' => 'Modern 4-unit luxury apartment complex with parking, security, and standby backup generator.',
                'region' => 'Dar es Salaam',
                'district' => 'Kinondoni',
                'ward' => 'Mikocheni',
                'street' => 'Rose Garden Road',
                'house_number' => 'Plot 88',
                'bedrooms' => 6,
                'bathrooms' => 4,
                'monthly_rent' => 650000,
                'cover_image' => 'houses/kimaro_residence_exterior.jpg',
                'status' => 'available',
                'verified_at' => now(),
            ]
        );

        if ($heights->units()->count() === 0) {
            $u1 = $heights->units()->create(['unit_number' => 'Apartment 101', 'status' => 'occupied', 'monthly_rent' => 650000, 'unit_type' => '2-Bedroom']);
            $u2 = $heights->units()->create(['unit_number' => 'Apartment 102', 'status' => 'occupied', 'monthly_rent' => 650000, 'unit_type' => '2-Bedroom']);
            $u3 = $heights->units()->create(['unit_number' => 'Apartment 201', 'status' => 'occupied', 'monthly_rent' => 650000, 'unit_type' => '2-Bedroom']);
            $u4 = $heights->units()->create(['unit_number' => 'Apartment 202', 'status' => 'available', 'monthly_rent' => 650000, 'unit_type' => '2-Bedroom']);

            $th1 = $heights->tenancies()->create(['name' => 'Hassan Ally', 'phone' => '+255712300005', 'unit' => 'Apartment 101', 'monthly_rent' => 650000, 'starts_on' => $first->copy()->subMonths(5), 'status' => 'active']);
            $th1->payments()->create(['amount' => 650000, 'paid_on' => $first->copy()->addDays(2), 'method' => 'mobile']);

            $th2 = $heights->tenancies()->create(['name' => 'Farida Nassor', 'phone' => '+255712300006', 'unit' => 'Apartment 102', 'monthly_rent' => 650000, 'starts_on' => $first->copy()->subMonths(2), 'status' => 'active']);
            $th2->payments()->create(['amount' => 650000, 'paid_on' => $first->copy()->addDays(3), 'method' => 'bank']);

            $th3 = $heights->tenancies()->create(['name' => 'Kelvin Massawe', 'phone' => '+255712300007', 'unit' => 'Apartment 201', 'monthly_rent' => 650000, 'starts_on' => $first->copy()->subMonths(7), 'status' => 'active']);
            $th3->payments()->create(['amount' => 650000, 'paid_on' => $first->copy()->addDays(5), 'method' => 'mobile']);

            $heights->maintenance()->create([
                'tenancy_id' => $th1->id,
                'title' => 'AC Master servicing',
                'details' => 'Split AC servicing for sitting room.',
                'status' => 'in_progress',
            ]);
        }

        // 3. House: Kimaro Palms Villa (Masaki) - 3 units
        $palms = House::firstOrCreate(
            ['owner_id' => $ibrahim->id, 'property_name' => 'Kimaro Palms Villa'],
            [
                'property_type' => 'House',
                'property_category' => 'Residential',
                'furnishing_status' => 'Furnished',
                'description' => 'Exclusive Masaki beachside property with private pool, tropical garden, and perimeter wall.',
                'region' => 'Dar es Salaam',
                'district' => 'Kinondoni',
                'ward' => 'Masaki',
                'street' => 'Toure Drive',
                'house_number' => 'Plot 15',
                'bedrooms' => 5,
                'bathrooms' => 4,
                'monthly_rent' => 950000,
                'cover_image' => 'houses/kimaro_living_room.jpg',
                'status' => 'available',
                'verified_at' => now(),
            ]
        );

        if ($palms->units()->count() === 0) {
            $pu1 = $palms->units()->create(['unit_number' => 'Garden Wing', 'status' => 'occupied', 'monthly_rent' => 950000, 'unit_type' => '2-Bedroom Villa']);
            $pu2 = $palms->units()->create(['unit_number' => 'Ocean Penthouse', 'status' => 'occupied', 'monthly_rent' => 950000, 'unit_type' => '2-Bedroom Penthouse']);
            $pu3 = $palms->units()->create(['unit_number' => 'Studio Suite', 'status' => 'available', 'monthly_rent' => 450000, 'unit_type' => 'Studio']);

            $pt1 = $palms->tenancies()->create(['name' => 'Beatrice Mtui', 'phone' => '+255712300008', 'unit' => 'Garden Wing', 'monthly_rent' => 950000, 'starts_on' => $first->copy()->subMonths(9), 'status' => 'active']);
            $pt1->payments()->create(['amount' => 950000, 'paid_on' => $first->copy()->addDays(1), 'method' => 'bank']);

            $pt2 = $palms->tenancies()->create(['name' => 'Frank Mushi', 'phone' => '+255712300009', 'unit' => 'Ocean Penthouse', 'monthly_rent' => 950000, 'starts_on' => $first->copy()->subMonths(4), 'status' => 'active']);
            $pt2->payments()->create(['amount' => 950000, 'paid_on' => $first->copy()->addDays(2), 'method' => 'bank']);
        }

        // 4. House: Kimaro Luxury Court (Sinza) - 6 units
        $court = House::firstOrCreate(
            ['owner_id' => $ibrahim->id, 'property_name' => 'Kimaro Luxury Court'],
            [
                'property_type' => 'Apartment',
                'property_category' => 'Residential',
                'furnishing_status' => 'Furnished',
                'description' => 'Modern 6-room residential studio block close to Shekilango Road.',
                'region' => 'Dar es Salaam',
                'district' => 'Kinondoni',
                'ward' => 'Sinza',
                'street' => 'Mori Road',
                'house_number' => 'Plot 104',
                'bedrooms' => 6,
                'bathrooms' => 6,
                'monthly_rent' => 300000,
                'cover_image' => 'houses/kimaro_independent_wing_b.jpg',
                'status' => 'available',
                'verified_at' => now(),
            ]
        );

        if ($court->units()->count() === 0) {
            for ($i = 1; $i <= 6; $i++) {
                $status = ($i <= 5) ? 'occupied' : 'available';
                $court->units()->create([
                    'unit_number' => "Studio Room {$i}",
                    'status' => $status,
                    'monthly_rent' => 300000,
                    'unit_type' => 'Studio',
                ]);

                if ($status === 'occupied') {
                    $names = [
                        1 => 'Salome Temu',
                        2 => 'Emmanuel Lyimo',
                        3 => 'Clara Shayo',
                        4 => 'Victor Minja',
                        5 => 'Rashid Juma',
                    ];
                    $ct = $court->tenancies()->create([
                        'name' => $names[$i],
                        'phone' => '+25571230001' . $i,
                        'unit' => "Studio Room {$i}",
                        'monthly_rent' => 300000,
                        'starts_on' => $first->copy()->subMonths($i * 2),
                        'status' => 'active',
                    ]);
                    $ct->payments()->create(['amount' => 300000, 'paid_on' => $first->copy()->addDays(3), 'method' => 'mobile']);
                }
            }

            $court->maintenance()->create([
                'title' => 'Smart lock battery replacement',
                'details' => 'Replaced 4 AA batteries for main corridor keypad lock.',
                'status' => 'resolved',
            ]);
        }
    }
}

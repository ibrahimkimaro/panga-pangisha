<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/** Demo data for local development only: five accounts (password "demo1234") and listings around Dar es Salaam. */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (User::where('phone', '+255700000001')->exists()) return;

        $mk = fn ($name, $phone, $email, $role) => User::create(
            ['fullname' => $name, 'phone' => $phone, 'email' => $email, 'country' => 'TZ', 'role' => $role, 'password' => 'demo1234']);
        $neema = $mk('Neema Mushi', '+255700000001', 'owner@demo.test', 'landlord');
        $juma = $mk('Juma Hassan', '+255700000002', 'agent@demo.test', 'landlord');
        $amina = $mk('Amina Said', '+255700000003', 'tenant@demo.test', 'renter');
        $baraka = $mk('Baraka Mrema', '+255700000004', 'baraka@demo.test', 'renter');
        $rehema = $mk('Rehema Kimaro', '+255700000005', 'rehema@demo.test', 'renter');
        foreach ([$neema, $juma] as $u) {
            $u->identities()->create(['method' => 'nida_number', 'nida_number' => '19850712141250000123', 'status' => 'approved', 'reviewed_at' => now()]);
        }
        // One landlord still waiting, so the admin's identity queue is not empty.
        $mk('Salma Omari', '+255700000006', 'newowner@demo.test', 'landlord')
            ->identities()->create(['method' => 'nida_number', 'nida_number' => '19920304151230000217']);
        // Spread the sign-ups out so the admin chart has a shape.
        foreach ([[$neema, 21], [$juma, 17], [$amina, 12], [$baraka, 5], [$rehema, 2]] as [$u, $days]) {
            $u->forceFill(['created_at' => now()->subDays($days)])->save();
        }

        foreach (glob(__DIR__ . '/photos/*.jpg') as $f) {
            Storage::disk('public')->put('houses/demo-' . basename($f), file_get_contents($f));
        }
        $img = fn (int $n) => "houses/demo-h$n.jpg";

        // [owner, name, type, district, ward, street, lat, lng, beds, baths, rent, deposit months, amenities, cover, gallery, verified days ago|null, confirmed days ago, description]
        $rows = [
            [$neema, 'Sea-breeze villa near Coco Beach', 'House', 'Kinondoni', 'Oysterbay', 'Toure Drive', -6.7721, 39.2812, 4, 3, 3200000, 3, ['Water', 'Parking', 'Security', 'Generator', 'Fence', 'AC'], 4, [9, 10], 12, 1,
                'Four bedrooms on a quiet stretch of Toure Drive. Borehole and city water, standby generator, parking for three cars.'],
            [$neema, 'Two-bedroom flat, Mikocheni B', 'Apartment', 'Kinondoni', 'Mikocheni', 'Rose Garden Road', -6.7648, 39.2437, 2, 2, 850000, 3, ['Water', 'Parking', 'Security', 'Tiles', 'LUKU'], 3, [7, 8], 30, 2,
                'Second floor, tiled throughout, own LUKU meter. Ten minutes on foot to Shoppers Plaza.'],
            [$juma, 'Self-contained room, Sinza Mori', 'Room', 'Ubungo', 'Sinza', 'Sinza Mori', -6.7838, 39.2214, 1, 1, 180000, 6, ['Water', 'LUKU', 'Tiles', 'Fence'], 8, [10], null, 3,
                'Master room with its own bathroom in a fenced compound of six rooms. Shared outdoor kitchen space.'],
            [$juma, 'Family house with garden, Mbezi Beach', 'House', 'Kinondoni', 'Mbezi Beach', 'Africana Road', -6.7183, 39.2185, 3, 2, 1400000, 6, ['Water', 'Parking', 'Fence', 'Security', 'Garden'], 2, [9, 7], 45, 5,
                'Three bedrooms, large garden and servant quarter. Tarmac road to the gate.'],
            [$neema, 'Studio in Upanga, walk to town', 'Studio', 'Ilala', 'Upanga', 'Mindu Street', -6.8083, 39.2846, 1, 1, 520000, 3, ['Water', 'Security', 'Lift', 'AC', 'WiFi'], 7, [8], 20, 1,
                'Furnished studio on the fifth floor with lift and 24-hour guard. Water tank on the roof.'],
            [$juma, 'Three-bedroom apartment, Masaki', 'Apartment', 'Kinondoni', 'Masaki', 'Haile Selassie Road', -6.7482, 39.2764, 3, 3, 2600000, 3, ['Water', 'Parking', 'Security', 'Generator', 'Pool', 'AC', 'Lift'], 12, [9, 10], 9, 2,
                'Sea view from the living room, shared pool, backup generator for the whole building.'],
            [$neema, 'New two-bedroom house, Kigamboni', 'House', 'Kigamboni', 'Kibada', 'Kibada Road', -6.8612, 39.3305, 2, 1, 400000, 6, ['Water', 'Parking', 'Fence', 'Tiles', 'LUKU'], 11, [7], null, 9,
                'Built this year. Fifteen minutes from the Nyerere Bridge, daladala stop at the corner.'],
            [$juma, 'Single room near Mwenge bus stand', 'Room', 'Kinondoni', 'Mwenge', 'Sam Nujoma Road', -6.7702, 39.2279, 1, 1, 120000, 6, ['Water', 'LUKU'], 10, [], null, 40,
                'One room in a shared house, shared bathroom. Five minutes to Mwenge stand and Mlimani City.'],
            [$neema, 'Modern townhouse, Tabata Segerea', 'House', 'Ilala', 'Tabata', 'Segerea Road', -6.8301, 39.2276, 3, 2, 750000, 4, ['Water', 'Parking', 'Fence', 'Security', 'Tiles'], 5, [8, 9], 60, 4,
                'Three bedrooms over two floors in a gated row of eight houses.'],
            [$neema, 'Garden cottage, Kinondoni Makumbusho', 'House', 'Kinondoni', 'Makumbusho', 'Kajenge Road', -6.7799, 39.2412, 2, 1, 600000, 3, ['Water', 'Parking', 'Fence', 'Garden'], 1, [10, 7], 15, 6,
                'Detached two-bedroom cottage behind the main house, with its own gate and meter.'],
            [$neema, 'Executive residence near harbor, Kurasini', 'House', 'Temeke', 'Kurasini', 'Kilwa Road', -6.8480, 39.2820, 4, 3, 1800000, 3, ['Water', 'Parking', 'Security', 'Fence', 'Generator', 'AC'], 4, [9, 10], 10, 1,
                'Four-bedroom gated home near the harbor and port area in Kurasini, Temeke. Standby power, private STS submeters, and space for four cars.'],
            [$juma, 'Modern two-bedroom flat, Chang\'ombe', 'Apartment', 'Temeke', 'Chang\'ombe', 'Mandela Road', -6.8410, 39.2630, 2, 2, 650000, 3, ['Water', 'Parking', 'Security', 'Tiles', 'LUKU'], 6, [7, 8], 14, 2,
                'Bright apartment in Chang\'ombe, Temeke district. Autonomous electricity and water meters, close to National Stadium and Mandela Road.'],
        ];

        foreach ($rows as $i => [$owner, $name, $type, $district, $ward, $street, $lat, $lng, $beds, $baths, $rent, $dep, $amen, $cover, $gallery, $verified, $confirmed, $desc]) {
            $h = $owner->houses()->create([
                'property_name' => $name, 'property_type' => $type, 'description' => $desc,
                'region' => 'Dar es Salaam', 'district' => $district, 'ward' => $ward, 'street' => $street,
                'bedrooms' => $beds, 'bathrooms' => $baths, 'monthly_rent' => $rent, 'security_deposit' => $rent * $dep,
                'lease_duration' => "$dep months upfront", 'amenities' => $amen, 'cover_image' => $img($cover),
                'latitude' => $lat, 'longitude' => $lng,
                'advertiser_role' => $owner->is($juma) ? 'representative' : 'owner',
                'verified_at' => $verified === null ? null : now()->subDays($verified),
                'availability_confirmed_at' => now()->subDays($confirmed),
                'contact_name' => $owner->fullname, 'contact_phone' => $owner->phone,
            ]);
            $h->forceFill(['created_at' => now()->subHours($i * 7)])->save();
            $h->units()->create(['unit_number' => 'U1', 'monthly_rent' => $rent]);
            foreach ($gallery as $g) $h->images()->create(['path' => $img($g)]);
            $houses[] = $h;
        }

        // Something for the admin queues: viewing requests, two reports, one conversation.
        $view = fn ($h, $u, $days, $status, $note = null) => $h->viewingRequests()->create(
            ['user_id' => $u->id, 'preferred_at' => now()->addDays($days)->setTime(10, 0), 'status' => $status, 'note' => $note]);
        $view($houses[0], $amina, 2, 'pending', 'Saturday morning works best for me.');
        $view($houses[2], $baraka, 1, 'accepted');
        $view($houses[5], $rehema, 4, 'pending', 'Can I bring my sister?');
        $report = fn ($h, $u, $reason, $details) => DB::table('listing_reports')->insert(
            ['house_id' => $h->id, 'user_id' => $u->id, 'reason' => $reason, 'details' => $details, 'created_at' => now(), 'updated_at' => now()]);
        $report($houses[7], $baraka, 'Asked for money before a viewing', 'The advertiser asked me to send TSh 50,000 by M-Pesa to hold the room before I could see it.');
        $report($houses[2], $rehema, 'Already rented', 'I called and was told the room was taken last month.');
        DB::table('conversations')->insert(['user_low_id' => min($neema->id, $amina->id), 'user_high_id' => max($neema->id, $amina->id),
            'house_id' => $houses[0]->id, 'created_at' => now(), 'updated_at' => now()]);
        $this->call(RentalDemoSeeder::class);
    }
}

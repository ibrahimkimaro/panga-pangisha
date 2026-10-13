<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/** Demo tenants, rent payments and repairs for owner@demo.test. Safe to run again: it does nothing once they exist. */
class RentalDemoSeeder extends Seeder
{
    public function run(): void
    {
        $neema = User::where('email', 'owner@demo.test')->first();
        if (!$neema || $neema->houses()->whereHas('tenancies')->exists()) return;
        $home = fn (string $name) => $neema->houses()->where('property_name', 'like', "$name%")->firstOrFail();
        $first = now('Africa/Dar_es_Salaam')->startOfMonth();

        // [home, name, phone, email, unit, months lived there, months paid back from this one (0 = not yet this month), ended]
        $rows = [
            ['Two-bedroom flat', 'Amina Said', '+255700000003', 'tenant@demo.test', 'A2', 9, 5, false],
            ['Studio in Upanga', 'Baraka Mrema', '+255700000004', 'baraka@demo.test', '5C', 4, 0, false],
            ['Modern townhouse', 'Joseph Kasele', '+255713555010', null, 'No. 3', 14, 6, false],
            ['Garden cottage', 'Grace Ndahmo', '+255754555021', null, null, 2, 1, false],
            ['New two-bedroom house', 'Rehema Kimaro', '+255700000005', 'rehema@demo.test', null, 12, 0, true],
        ];
        foreach ($rows as [$name, $who, $phone, $email, $unit, $lived, $paid, $ended]) {
            $h = $home($name);
            $t = $h->tenancies()->create(['name' => $who, 'phone' => $phone, 'email' => $email, 'unit' => $unit,
                'user_id' => User::where('phone', $phone)->value('id'), 'monthly_rent' => $h->monthly_rent,
                'starts_on' => $first->copy()->subMonths($lived)->addDays(11), 'status' => $ended ? 'ended' : 'active',
                'ends_on' => $ended ? $first->copy()->subMonths(3) : null]);
            // Whoever has not paid this month still paid the months before it; a tenant who left paid until they left.
            foreach (range($ended ? 3 : ($paid ? 0 : 1), 5) as $back) {
                if ($back >= $lived) break;
                $t->payments()->create(['amount' => $h->monthly_rent, 'paid_on' => $first->copy()->subMonths($back)->addDays(2 + $t->id % 4),
                    'method' => ['mobile', 'bank', 'cash'][$t->id % 3]]);
            }
            $tenants[$name] = $t;
        }

        foreach ([
            ['Two-bedroom flat', 'Leaking kitchen tap', 'Drips all night; the bucket fills by morning.', 'open', 1],
            ['Studio in Upanga', 'AC not cooling', 'Runs but blows warm air since Sunday.', 'in_progress', 3],
            ['Modern townhouse', 'Gate lock is broken', null, 'open', 4],
            ['Garden cottage', 'Light fitting in the sitting room', 'Replaced the holder and the bulb.', 'resolved', 9],
        ] as [$name, $title, $details, $status, $days]) {
            $m = $home($name)->maintenance()->create(['tenancy_id' => $tenants[$name]->id, 'title' => $title, 'details' => $details, 'status' => $status]);
            $m->forceFill(['created_at' => now()->subDays($days)])->save();
        }
    }
}

<?php

namespace Tests\Feature;

use App\Models\House;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PropertyShowTest extends TestCase
{
    use RefreshDatabase;

    public function test_property_details_renders_full_cityscape_retreat_page_without_modal(): void
    {
        $owner = User::create([
            'fullname' => 'Landlord Owner',
            'phone' => '+255712999000',
            'role' => 'landlord',
            'password' => 'secret123',
        ]);
        $house = new House([
            'property_name' => 'Cityscape Sanctuary Villa',
            'property_type' => 'Villa',
            'description' => 'A luxury architectural home with coastal views.',
            'region' => 'Dar es Salaam',
            'district' => 'Kinondoni',
            'ward' => 'Masaki',
            'street' => 'Toure Drive',
            'bedrooms' => 4,
            'bathrooms' => 3,
            'monthly_rent' => 2500000,
            'security_deposit' => 2500000,
            'status' => 'available',
            'advertiser_role' => 'owner',
            'verified_at' => now(),
        ]);
        $house->owner_id = $owner->id;
        $house->save();

        $response = $this->get(route('property.show', $house->id));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Property/Show')
            ->has('home')
            ->where('home.id', $house->id)
            ->where('home.property_name', 'Cityscape Sanctuary Villa')
            ->has('similarHomes')
        );
    }

    public function test_property_details_displays_units_breakdown(): void
    {
        $owner = User::create([
            'fullname' => 'Host Owner',
            'phone' => '+255712999001',
            'role' => 'landlord',
            'password' => 'secret123',
        ]);
        $house = new House([
            'property_name' => 'Penthouse Heights',
            'property_type' => 'Apartment',
            'region' => 'Dar es Salaam',
            'district' => 'Ilala',
            'ward' => 'Upanga',
            'monthly_rent' => 1200000,
            'status' => 'available',
            'advertiser_role' => 'owner',
            'verified_at' => now(),
        ]);
        $house->owner_id = $owner->id;
        $house->save();

        $house->units()->create([
            'unit_number' => 'Penthouse A',
            'monthly_rent' => 1200000,
            'bedrooms' => 2,
            'bathrooms' => 2,
            'status' => 'vacant',
        ]);

        $response = $this->get(route('property.show', $house->id));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Property/Show')
            ->has('home.units', 1)
            ->where('home.units.0.unit_number', 'Penthouse A')
        );
    }
}

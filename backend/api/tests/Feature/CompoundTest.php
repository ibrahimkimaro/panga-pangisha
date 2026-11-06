<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompoundTest extends TestCase
{
    use RefreshDatabase;

    public function test_landlord_can_create_and_list_compounds()
    {
        $landlord = User::create([
            'fullname' => 'Ibrahim Kimaro',
            'phone_number' => '+255711000001',
            'email' => 'landlord@test.com',
            'role' => 'landlord',
            'password' => bcrypt('secret12'),
        ]);

        $landlord->identities()->create([
            'method' => 'nida_number',
            'nida_number' => '19850712141250000123',
            'status' => 'approved',
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($landlord);

        $response = $this->postJson('/api/landlord/compounds', [
                'name' => 'Goba Executive Compound',
                'compound_type' => 'residential',
                'region' => 'Dar es Salaam',
                'district' => 'Kinondoni',
                'ward' => 'Goba',
                'street' => 'Tegeta A Road',
                'description' => 'Test compound with 2 houses',
                'amenities' => ['Fenced Compound', 'Water System'],
                'buildings' => [
                    [
                        'name' => 'House 1',
                        'type' => 'Standalone House',
                        'rental_mode' => 'entire',
                        'monthly_rent' => 450000,
                        'bedrooms' => 2,
                        'bathrooms' => 1,
                    ],
                    [
                        'name' => 'House 2 (Rooms)',
                        'type' => 'Shared House',
                        'rental_mode' => 'rooms',
                        'monthly_rent' => 500000,
                        'bedrooms' => 3,
                        'bathrooms' => 2,
                        'units' => [
                            ['unit_number' => 'Room 1 (Master)', 'monthly_rent' => 200000, 'unit_type' => 'Master Room'],
                            ['unit_number' => 'Room 2 (Standard)', 'monthly_rent' => 150000, 'unit_type' => 'Standard Room'],
                            ['unit_number' => 'Room 3 (Standard)', 'monthly_rent' => 150000, 'unit_type' => 'Standard Room'],
                        ],
                    ],
                ],
            ]);

        $response->assertCreated();
        $this->assertDatabaseHas('compounds', ['name' => 'Goba Executive Compound']);
        $this->assertDatabaseHas('houses', ['property_name' => 'House 1', 'rental_mode' => 'entire']);
        $this->assertDatabaseHas('houses', ['property_name' => 'House 2 (Rooms)', 'rental_mode' => 'rooms']);
        $this->assertDatabaseHas('units', ['unit_number' => 'Room 1 (Master)', 'monthly_rent' => 200000]);

        $listResponse = $this->getJson('/api/landlord/compounds');
        $listResponse->assertOk()->assertJsonCount(1);
    }
}

<?php

namespace Tests\Feature;

use App\Ai\Agents\PropertyRegistrationAgent;
use App\Ai\PropertyDraft\PropertyDraftService;
use App\Models\House;
use App\Models\PropertyDraft;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AiPropertyRegistrationTest extends TestCase
{
    use RefreshDatabase;

    private function createLandlord(): User
    {
        return User::create([
            'fullname' => 'Baraka Landlord',
            'email' => 'landlord' . rand(100, 9999) . '@panga.tz',
            'phone' => '+25571' . rand(1000000, 9999999),
            'role' => 'landlord',
            'password' => 'secret',
        ]);
    }

    private function createTenant(): User
    {
        return User::create([
            'fullname' => 'Amina Renter',
            'email' => 'tenant' . rand(100, 9999) . '@panga.tz',
            'phone' => '+25572' . rand(1000000, 9999999),
            'role' => 'renter',
            'password' => 'secret',
        ]);
    }

    /**
     * Test: Landlord can get or initialize an active property draft.
     */
    public function test_landlord_can_initialize_and_retrieve_active_draft(): void
    {
        $landlord = $this->createLandlord();

        $res = $this->actingAs($landlord, 'sanctum')
            ->getJson('/api/property-drafts/active');

        $res->assertOk();
        $this->assertArrayHasKey('draft_id', $res->json());
        $this->assertEquals(1, $res->json('revision'));
        $this->assertEquals('draft', $res->json('status'));
        $this->assertArrayHasKey('draft', $res->json());
        $this->assertArrayHasKey('validation', $res->json());
        $this->assertFalse($res->json('validation.is_ready_for_review'));
    }

    /**
     * Test: Tenant cannot access property registration drafts (authorization check).
     */
    public function test_tenant_cannot_access_property_drafts(): void
    {
        $tenant = $this->createTenant();

        $this->actingAs($tenant, 'sanctum')
            ->getJson('/api/property-drafts/active')
            ->assertForbidden();

        $this->actingAs($tenant, 'sanctum')
            ->postJson('/api/property-drafts/chat', ['message' => 'Add my house'])
            ->assertForbidden();
    }

    /**
     * Test: Multi-field extraction in English and Kiswahili.
     */
    public function test_conversational_multi_field_extraction(): void
    {
        $landlord = $this->createLandlord();

        PropertyRegistrationAgent::fake([
            [
                'updates' => [
                    'property_name' => 'Mikocheni Villa',
                    'property_type' => 'House',
                    'district' => 'Kinondoni',
                    'ward' => 'Mikocheni',
                    'monthly_rent' => 800000,
                    'units' => [
                        ['unit_number' => 'Main Wing', 'unit_type' => 'House', 'monthly_rent' => 800000, 'bedrooms' => 3, 'bathrooms' => 2],
                    ],
                ],
                'corrections' => [],
                'user_intent' => 'update_fields',
                'assistant_reply' => 'Nimepokea taarifa za Mikocheni Villa! Nyumba ina vyumba 3 na kodi ni TZS 800,000.',
                'next_suggested_field' => 'shared_amenities',
            ],
        ]);

        $res = $this->actingAs($landlord, 'sanctum')
            ->postJson('/api/property-drafts/chat', [
                'message' => 'Nina nyumba Mikocheni inaitwa Mikocheni Villa, kodi laki 8 kwa mwezi ina vyumba 3',
            ]);

        $res->assertOk();
        $this->assertEquals('Mikocheni Villa', $res->json('draft.property_name'));
        $this->assertEquals('Kinondoni', $res->json('draft.district'));
        $this->assertEquals(800000, $res->json('draft.monthly_rent'));
        $this->assertCount(1, $res->json('draft.units'));
        $this->assertStringContainsString('Mikocheni Villa', $res->json('response'));
        $this->assertTrue($res->json('validation.is_ready_for_review'));
    }

    /**
     * Test: Incremental updates and explicit corrections (e.g. changing unit rent).
     */
    public function test_incremental_updates_and_explicit_corrections(): void
    {
        $landlord = $this->createLandlord();
        $service = app(PropertyDraftService::class);
        $draft = $service->getOrCreateActiveDraft($landlord);

        // Prepopulate draft with 2 units
        $service->applyUpdates($draft, [
            'property_name' => 'Sinza Complex',
            'property_type' => 'Apartment',
            'region' => 'Dar es Salaam',
            'district' => 'Ubungo',
            'monthly_rent' => 600000,
            'units' => [
                ['unit_number' => 'Room 1', 'monthly_rent' => 300000],
                ['unit_number' => 'Room 2', 'monthly_rent' => 300000],
            ],
        ]);

        // Landlord corrects Room 1 rent
        PropertyRegistrationAgent::fake([
            [
                'updates' => [
                    'units' => [
                        ['unit_number' => 'Room 1', 'monthly_rent' => 350000],
                    ],
                ],
                'corrections' => ['Updated Room 1 rent from 300,000 to 350,000'],
                'user_intent' => 'update_fields',
                'assistant_reply' => 'Nimerekebisha kodi ya Room 1 kuwa TZS 350,000.',
                'next_suggested_field' => null,
            ],
        ]);

        $res = $this->actingAs($landlord, 'sanctum')
            ->postJson('/api/property-drafts/chat', [
                'draft_id' => $draft->id,
                'message' => 'Actually Room 1 is master bedroom, rent is 350,000 not 300,000',
            ]);

        $res->assertOk();
        $units = $res->json('draft.units');
        $this->assertCount(2, $units);

        $room1 = collect($units)->firstWhere('unit_number', 'Room 1');
        $room2 = collect($units)->firstWhere('unit_number', 'Room 2');

        $this->assertEquals(350000, $room1['monthly_rent']);
        $this->assertEquals(300000, $room2['monthly_rent']);
        $this->assertEquals(650000, $res->json('draft.monthly_rent')); // Auto-reconciled total rent
    }

    /**
     * Test: Direct form editing via PATCH endpoint.
     */
    public function test_direct_form_editing_via_patch(): void
    {
        $landlord = $this->createLandlord();
        $service = app(PropertyDraftService::class);
        $draft = $service->getOrCreateActiveDraft($landlord);

        $res = $this->actingAs($landlord, 'sanctum')
            ->patchJson("/api/property-drafts/{$draft->id}", [
                'updates' => [
                    'property_name' => 'Mbezi Beach Haven',
                    'street' => 'Africana Rd',
                    'monthly_rent' => 950000,
                ],
            ]);

        $res->assertOk();
        $this->assertEquals('Mbezi Beach Haven', $res->json('draft.property_name'));
        $this->assertEquals('Africana Rd', $res->json('draft.street'));
        $this->assertEquals(950000, $res->json('draft.monthly_rent'));
    }

    /**
     * Test: Finalization requires explicit confirmation and creates House and Units transactionally.
     */
    public function test_finalization_creates_house_and_units_transactionally(): void
    {
        $landlord = $this->createLandlord();
        $service = app(PropertyDraftService::class);
        $draft = $service->getOrCreateActiveDraft($landlord);

        // Fill all required fields
        $service->applyUpdates($draft, [
            'property_name' => 'Kijitonyama Residence',
            'property_type' => 'House',
            'region' => 'Dar es Salaam',
            'district' => 'Kinondoni',
            'monthly_rent' => 1200000,
            'units' => [
                ['unit_number' => 'Flat 1', 'monthly_rent' => 600000, 'bedrooms' => 2, 'bathrooms' => 1],
                ['unit_number' => 'Flat 2', 'monthly_rent' => 600000, 'bedrooms' => 2, 'bathrooms' => 1],
            ],
        ]);

        $res = $this->actingAs($landlord, 'sanctum')
            ->postJson("/api/property-drafts/{$draft->id}/finalize", [
                'idempotency_key' => 'idemp_key_test_123',
            ]);

        $res->assertCreated();
        $this->assertTrue($res->json('success'));
        $this->assertArrayHasKey('property', $res->json());

        $houseId = $res->json('property.id');
        $house = House::with('units')->find($houseId);

        $this->assertNotNull($house);
        $this->assertEquals('Kijitonyama Residence', $house->property_name);
        $this->assertEquals($landlord->id, $house->owner_id);
        $this->assertCount(2, $house->units);

        // Check draft status updated to completed
        $draft->refresh();
        $this->assertEquals('completed', $draft->status);
        $this->assertEquals($house->id, $draft->created_house_id);
    }

    /**
     * Test: Duplicate finalization submissions are protected by idempotency.
     */
    public function test_idempotency_prevents_duplicate_property_creation(): void
    {
        $landlord = $this->createLandlord();
        $service = app(PropertyDraftService::class);
        $draft = $service->getOrCreateActiveDraft($landlord);

        $service->applyUpdates($draft, [
            'property_name' => 'Idempotent Oasis',
            'property_type' => 'House',
            'region' => 'Dar es Salaam',
            'district' => 'Kinondoni',
            'monthly_rent' => 700000,
        ]);

        // First finalize call
        $res1 = $this->actingAs($landlord, 'sanctum')
            ->postJson("/api/property-drafts/{$draft->id}/finalize", [
                'idempotency_key' => 'idemp_unique_999',
            ]);
        $res1->assertCreated();
        $firstHouseId = $res1->json('property.id');

        // Immediate retry with the same key
        $res2 = $this->actingAs($landlord, 'sanctum')
            ->postJson("/api/property-drafts/{$draft->id}/finalize", [
                'idempotency_key' => 'idemp_unique_999',
            ]);

        $res2->assertCreated();
        $this->assertEquals($firstHouseId, $res2->json('property.id'));
        $this->assertEquals(1, House::where('property_name', 'Idempotent Oasis')->count());
    }
}

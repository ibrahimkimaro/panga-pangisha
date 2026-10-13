<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Phoenix;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PangaApiTest extends TestCase
{
    use RefreshDatabase;

    private function register(string $name, string $phone, string $role = 'renter'): array
    {
        $reg = $this->postJson('/api/user/register/', ['fullname' => $name, 'phone_number' => $phone, 'role' => $role, 'password' => 'secret12'])
            ->assertCreated()->json();
        if ($role === 'landlord') { // listing a home needs an approved identity
            User::find($reg['user']['id'])->identities()->create(['method' => 'nida_number', 'nida_number' => '19850712141250000123', 'status' => 'approved']);
        }
        return $reg;
    }

    public function test_register_login_house_and_chat_token(): void
    {
        $a = $this->register('Alice', '+255711000001', 'landlord');
        $this->register('Bob', '+255711000002');

        $login = $this->postJson('/api/user/api/token/', ['phone_number' => '+255711000001', 'password' => 'secret12'])
            ->assertOk()->assertJsonStructure(['access', 'refresh', 'user_id', 'role'])->json();
        $this->postJson('/api/user/api/token/', ['phone_number' => '+255711000001', 'password' => 'wrong'])->assertUnauthorized();

        $h = ['Authorization' => 'Bearer ' . $login['access']];
        $this->postJson('/api/landlord/add-nyumba/', [
            'property_name' => 'Mikocheni Flat', 'property_type' => 'Apartment', 'region' => 'Dar es Salaam',
            'district' => 'Kinondoni', 'monthly_rent' => 450000, 'total_units' => 3, 'amenities' => ['WiFi'],
        ], $h)->assertCreated()->assertJsonCount(3, 'units');
        $this->getJson('/api/landlord/getAllHouses/', $h)->assertOk()->assertJsonCount(1);
        $this->app['auth']->forgetGuards(); // the test app reuses the resolved user between requests
        $this->getJson('/api/landlord/getAllHouses/')->assertUnauthorized();

        $bob = User::where('phone', '+255711000002')->first();
        $res = $this->getJson('/api/chatApp/token/?peer=' . $bob->id, $h)->assertOk()->json();
        $alice = User::find($a['user']['id']);
        $this->assertSame(Phoenix::directTopic($alice, $bob), $res['topic']);
        $this->assertCount(2, explode('.', $res['token']));
    }

    public function test_internal_push_needs_the_shared_secret(): void
    {
        $this->postJson('/api/internal/push', ['user_ids' => [], 'title' => 'x'])->assertUnauthorized();
        $this->postJson('/api/internal/push', ['user_ids' => ['0b0e7a52-3c4e-4d6f-9a57-1f2f6f0b8c11'], 'title' => 'x'],
            ['Authorization' => 'Bearer ' . Phoenix::internalToken('internal-push')])->assertOk();
    }

    public function test_email_login_and_password_reset_by_code(): void
    {
        \Illuminate\Support\Facades\Notification::fake();
        $this->postJson('/api/user/register/', ['fullname' => 'Asha', 'phone_number' => '0712 000 111', 'email' => 'Asha@Mail.test', 'role' => 'renter', 'password' => 'secret12'])
            ->assertCreated()->assertJsonPath('user.phone_number', '+255712000111');
        foreach (['asha@mail.test', '0712000111', '+255712000111'] as $id) {
            $this->postJson('/api/user/api/token/', ['phone_number' => $id, 'password' => 'secret12'])->assertOk();
        }

        $this->postJson('/api/user/password/forgot/', ['identifier' => 'nobody@mail.test'])->assertOk(); // no account probing
        $this->postJson('/api/user/password/forgot/', ['identifier' => 'asha@mail.test'])->assertOk();
        $code = null;
        \Illuminate\Support\Facades\Notification::assertSentTo(User::first(), \App\Notifications\CodeNotification::class,
            function ($n, $channels) use (&$code) { $code = $n->code; return $channels === ['mail']; });

        $wrong = $code === '000000' ? '000001' : '000000';
        $this->postJson('/api/user/password/reset/', ['identifier' => 'asha@mail.test', 'code' => $wrong, 'password' => 'newpass12'])->assertStatus(422);
        $this->postJson('/api/user/password/reset/', ['identifier' => 'asha@mail.test', 'code' => $code, 'password' => 'newpass12'])->assertOk();
        $this->postJson('/api/user/password/reset/', ['identifier' => 'asha@mail.test', 'code' => $code, 'password' => 'again1234'])->assertStatus(422); // single use
        $this->postJson('/api/user/api/token/', ['phone_number' => 'asha@mail.test', 'password' => 'secret12'])->assertUnauthorized();
        $this->postJson('/api/user/api/token/', ['phone_number' => 'asha@mail.test', 'password' => 'newpass12'])->assertOk();
    }

    public function test_favorites_viewings_reports_and_approximate_location(): void
    {
        \Illuminate\Support\Facades\Notification::fake();
        $owner = ['Authorization' => 'Bearer ' . $this->register('Owner', '+255711000010', 'landlord')['tokens']['access']];
        $id = $this->postJson('/api/landlord/add-nyumba/', ['property_name' => 'Flat', 'property_type' => 'Apartment', 'region' => 'Dar es Salaam',
            'district' => 'Ilala', 'monthly_rent' => 300000, 'latitude' => -6.812345, 'longitude' => 39.287654, 'house_number' => '12B'], $owner)
            ->assertCreated()->assertJsonPath('latitude', -6.812345)->json('id');
        $this->postJson("/api/houses/$id/viewing-requests", ['preferred_at' => now()->addDay()->toIso8601String()], $owner)->assertStatus(422);

        $this->app['auth']->forgetGuards();
        $tenant = ['Authorization' => 'Bearer ' . $this->register('Tenant', '+255711000011')['tokens']['access']];
        $this->getJson("/api/landlord/houses/$id", $tenant)->assertOk()
            ->assertJsonPath('latitude', -6.812)->assertJsonMissingPath('house_number')->assertJsonPath('owner.fullname', 'Owner');

        $this->postJson("/api/houses/$id/favorite", [], $tenant)->assertOk()->assertJsonPath('is_favorite', true);
        $this->getJson('/api/favorites', $tenant)->assertOk()->assertJsonCount(1)->assertJsonPath('0.is_favorite', true);
        $this->postJson("/api/houses/$id/favorite", [], $tenant)->assertJsonPath('is_favorite', false);

        $this->postJson("/api/houses/$id/report", ['reason' => 'nonsense'], $tenant)->assertStatus(422);
        $this->postJson("/api/houses/$id/report", ['reason' => 'asked_for_money'], $tenant)->assertNoContent();

        $v = $this->postJson("/api/houses/$id/viewing-requests", ['preferred_at' => now()->addDay()->toIso8601String(), 'note' => 'After 4pm'], $tenant)
            ->assertCreated()->json('id');
        $this->patchJson("/api/viewing-requests/$v", ['status' => 'accepted'], $tenant)->assertForbidden(); // only the owner decides
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/viewing-requests?as=owner', $owner)->assertOk()->assertJsonCount(1);
        $this->patchJson("/api/viewing-requests/$v", ['status' => 'accepted'], $owner)->assertOk()->assertJsonPath('status', 'accepted');
    }

    public function test_admin_suspensions_reach_the_app(): void
    {
        $owner = $this->register('Alice', '+255711000001', 'landlord');
        $renter = $this->register('Bob', '+255711000002');
        $h = ['Authorization' => 'Bearer ' . $owner['tokens']['access']];
        $id = $this->postJson('/api/landlord/add-nyumba/', ['property_name' => 'Flat', 'property_type' => 'Apartment', 'region' => 'Dar es Salaam', 'district' => 'Ilala', 'monthly_rent' => 300000], $h)->assertCreated()->json('id');
        $search = fn () => $this->getJson('/api/landlord/getAvailableHouse/', ['Authorization' => 'Bearer ' . $renter['tokens']['access']]);
        $search()->assertJsonCount(1);

        // A suspended listing cannot be republished by its owner.
        \App\Models\House::whereKey($id)->update(['status' => 'suspended']);
        $this->patchJson("/api/landlord/houses/$id", ['status' => 'available'], $h)->assertForbidden();
        \App\Models\House::whereKey($id)->update(['status' => 'available']);

        // A suspended account cannot sign in, and its listings leave search.
        User::whereKey($owner['user']['id'])->update(['suspended_at' => now()]);
        $this->app['auth']->forgetGuards();
        $search()->assertJsonCount(0);
        $this->postJson('/api/user/api/token/', ['phone_number' => '+255711000001', 'password' => 'secret12'])->assertUnauthorized();

        // Website admins never sign in to the app.
        User::create(['fullname' => 'Admin', 'email' => 'admin@example.com', 'role' => 'admin', 'password' => 'secret12']);
        $this->postJson('/api/user/api/token/', ['phone_number' => 'admin@example.com', 'password' => 'secret12'])->assertUnauthorized();
    }

    public function test_a_landlord_keeps_tenants_rent_payments_and_repairs_for_their_own_homes_only(): void
    {
        \Illuminate\Support\Facades\Notification::fake();
        $this->register('Amina', '+255711000031');
        $this->app['auth']->forgetGuards();
        $other = ['Authorization' => 'Bearer ' . $this->register('Other', '+255711000032', 'landlord')['tokens']['access']];
        $this->app['auth']->forgetGuards();
        $owner = ['Authorization' => 'Bearer ' . $this->register('Owner', '+255711000030', 'landlord')['tokens']['access']];
        $house = $this->postJson('/api/landlord/add-nyumba/', ['property_name' => 'Flat', 'property_type' => 'Apartment', 'region' => 'Dar es Salaam',
            'district' => 'Ilala', 'monthly_rent' => 300000], $owner)->assertCreated()->json('id');

        // A phone that matches a Panga account links the tenant to it.
        $t = $this->postJson('/api/tenants', ['house_id' => $house, 'name' => 'Amina Said', 'phone' => '0711 000 031', 'unit' => 'T1',
            'monthly_rent' => 300000, 'starts_on' => '2026-01-12'], $owner)->assertCreated()
            ->assertJsonPath('phone', '+255711000031')->assertJsonPath('user_id', User::where('phone', '+255711000031')->value('id'))
            ->assertJsonPath('house.property_name', 'Flat')->assertJsonPath('status', 'active')->json('id');
        $this->postJson('/api/tenants', ['house_id' => $house, 'name' => 'No rent'], $owner)->assertStatus(422);

        $today = now('Africa/Dar_es_Salaam'); // months are counted in Tanzanian time
        $this->postJson("/api/tenants/$t/payments", ['amount' => 0, 'paid_on' => $today->toDateString()], $owner)->assertStatus(422);
        $this->postJson("/api/tenants/$t/payments", ['amount' => 200000, 'paid_on' => $today->toDateString(), 'method' => 'mobile'], $owner)->assertCreated();
        $old = $this->postJson("/api/tenants/$t/payments", ['amount' => 300000, 'paid_on' => $today->copy()->startOfMonth()->subMonths(2)->toDateString()], $owner)
            ->assertCreated()->json('id');
        $this->getJson('/api/rent-payments', $owner)->assertOk()
            ->assertJsonPath('collected', 200000)->assertJsonPath('expected', 300000)->assertJsonPath('tenants_paid', 1)
            ->assertJsonCount(6, 'months')->assertJsonPath('months.3.total', 300000)->assertJsonPath('months.5.total', 200000)
            ->assertJsonCount(2, 'payments')->assertJsonPath('payments.0.tenant.name', 'Amina Said');
        $this->getJson('/api/tenants', $owner)->assertOk()->assertJsonCount(1)->assertJsonPath('0.paid_this_month', 200000);

        $m = $this->postJson('/api/maintenance', ['house_id' => $house, 'tenancy_id' => $t, 'title' => 'Leaking tap'], $owner)
            ->assertCreated()->assertJsonPath('status', 'open')->assertJsonPath('tenant.unit', 'T1')->json('id');
        $this->patchJson("/api/maintenance/$m", ['status' => 'done'], $owner)->assertStatus(422);
        $this->patchJson("/api/maintenance/$m", ['status' => 'resolved'], $owner)->assertOk()->assertJsonPath('status', 'resolved');
        $this->getJson("/api/tenants/$t", $owner)->assertOk()->assertJsonCount(2, 'payments')->assertJsonCount(1, 'maintenance');

        // A home with a tenant in it cannot be deleted, so the records are not lost by accident.
        $this->deleteJson("/api/landlord/houses/$house", [], $owner)->assertStatus(422);

        // Another landlord sees and changes none of it.
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/tenants', $other)->assertOk()->assertJsonCount(0);
        $this->getJson('/api/rent-payments', $other)->assertOk()->assertJsonPath('collected', 0)->assertJsonCount(0, 'payments');
        $this->getJson('/api/maintenance', $other)->assertOk()->assertJsonCount(0);
        $this->getJson("/api/tenants/$t", $other)->assertNotFound();
        $this->postJson("/api/tenants/$t/payments", ['amount' => 5, 'paid_on' => $today->toDateString()], $other)->assertNotFound();
        $this->postJson('/api/tenants', ['house_id' => $house, 'name' => 'X', 'monthly_rent' => 1, 'starts_on' => '2026-01-01'], $other)->assertNotFound();
        $this->postJson('/api/maintenance', ['house_id' => $house, 'title' => 'X'], $other)->assertNotFound();
        $this->patchJson("/api/maintenance/$m", ['status' => 'open'], $other)->assertNotFound();
        $this->deleteJson("/api/rent-payments/$old", [], $other)->assertNotFound();

        $this->app['auth']->forgetGuards();
        $this->deleteJson("/api/rent-payments/$old", [], $owner)->assertNoContent();
        $this->patchJson("/api/tenants/$t", ['status' => 'ended'], $owner)->assertOk()->assertJsonPath('status', 'ended')->assertJsonPath('ends_on', $today->toDateString());
        $this->getJson('/api/rent-payments', $owner)->assertJsonPath('expected', 0)->assertJsonPath('tenants', 0);
        $this->deleteJson("/api/landlord/houses/$house", [], $owner)->assertNoContent();
    }
}

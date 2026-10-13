<?php

namespace Tests\Feature;

use App\Models\House;
use App\Models\IdentityVerification;
use App\Models\ListingReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Page;
use Tests\TestCase;

class AdminPanelTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    private function user(string $role, string $email): User
    {
        return User::create(['fullname' => ucfirst($role) . ' Person', 'email' => $email,
            'phone' => $role === 'admin' ? null : '+2557' . random_int(10000000, 99999999), 'role' => $role, 'password' => 'secret-pass']);
    }

    private function house(User $owner, array $extra = []): House
    {
        return House::forceCreate($extra + ['owner_id' => $owner->id, 'property_name' => 'Test flat', 'district' => 'Ilala', 'monthly_rent' => 500000]);
    }

    public function test_only_admins_get_in(): void
    {
        $this->user('admin', 'admin@example.com');
        $this->user('landlord', 'owner@example.com');

        $this->get('/admin')->assertRedirect('/admin/login');
        $this->get('/admin/users')->assertRedirect('/admin/login');

        $this->post('/admin/login', ['email' => 'owner@example.com', 'password' => 'secret-pass'])->assertSessionHasErrors('email');
        $this->assertGuest();
        $this->post('/admin/login', ['email' => 'admin@example.com', 'password' => 'wrong'])->assertSessionHasErrors('email');

        $this->post('/admin/login', ['email' => 'ADMIN@example.com', 'password' => 'secret-pass'])->assertRedirect('/admin/users'); // back to the page they were sent away from
        $this->get('/admin')->assertOk()->assertInertia(fn (Page $p) => $p->component('Admin/Dashboard')->where('totals.users', 1));
        foreach (['users', 'listings', 'reports', 'viewings', 'activity'] as $page) {
            $this->get("/admin/$page")->assertOk();
        }
    }

    public function test_a_demoted_or_suspended_admin_is_thrown_out_mid_session(): void
    {
        $admin = $this->user('admin', 'admin@example.com');
        $this->actingAs($admin)->get('/admin')->assertOk();

        $admin->update(['role' => 'renter']);
        $this->get('/admin')->assertRedirect('/admin/login');
        $this->assertGuest();
    }

    public function test_suspending_a_user_signs_them_out_and_hides_their_listings(): void
    {
        $admin = $this->user('admin', 'admin@example.com');
        $owner = $this->user('landlord', 'owner@example.com');
        $this->house($owner);
        DB::table('personal_access_tokens')->insert(['tokenable_type' => 'App\\Models\\User', 'tokenable_id' => $owner->id, 'name' => 'mobile',
            'token' => hash('sha256', 'x'), 'abilities' => '["*"]']);

        $this->get('/')->assertInertia(fn (Page $p) => $p->component('Home')->has('homes', 1));

        $this->actingAs($admin)->post("/admin/users/{$owner->id}/suspend")->assertRedirect();
        $this->assertNotNull($owner->fresh()->suspended_at);
        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $owner->id]);
        $this->assertDatabaseHas('admin_actions', ['action' => 'user.suspended', 'admin_id' => $admin->id, 'subject_id' => $owner->id]);
        $this->get('/')->assertInertia(fn (Page $p) => $p->has('homes', 0));

        $this->post("/admin/users/{$owner->id}/reactivate");
        $this->assertNull($owner->fresh()->suspended_at);

        // Admin accounts cannot be suspended or re-roled from the panel.
        $this->post("/admin/users/{$admin->id}/suspend")->assertNotFound();
        $this->patch("/admin/users/{$owner->id}", ['role' => 'admin'])->assertSessionHasErrors('role');
    }

    public function test_listing_moderation(): void
    {
        $admin = $this->user('admin', 'admin@example.com');
        $owner = $this->user('landlord', 'owner@example.com');
        $house = $this->house($owner);
        $report = ListingReport::forceCreate(['house_id' => $house->id, 'user_id' => $owner->id, 'reason' => 'Scam']);
        $this->actingAs($admin);

        $this->post("/admin/listings/{$house->id}/verify");
        $this->assertNotNull($house->fresh()->verified_at);
        $this->assertDatabaseHas('notifications', ['notifiable_id' => $owner->id]);

        $this->post("/admin/listings/{$house->id}/suspend");
        $this->assertSame('suspended', $house->fresh()->status);
        $this->post("/admin/listings/{$house->id}/explode")->assertNotFound();

        $this->patch("/admin/reports/{$report->id}", ['status' => 'resolved']);
        $this->assertSame('resolved', $report->fresh()->status);
        $this->get('/admin/reports')->assertInertia(fn (Page $p) => $p->has('reports.data', 0));

        $this->get("/admin/listings/{$house->id}")->assertOk();
        $this->delete("/admin/listings/{$house->id}")->assertRedirect('/admin/listings');
        $this->assertDatabaseMissing('houses', ['id' => $house->id]);
        $this->assertSame(4, DB::table('admin_actions')->count());
    }

    public function test_landlord_identity_goes_through_admin_review(): void
    {
        Storage::fake('local');
        $admin = $this->user('admin', 'admin@example.com');
        $reg = $this->postJson('/api/user/register/', ['fullname' => 'Lina Owner', 'phone_number' => '+255711000009', 'role' => 'landlord', 'password' => 'secret12'])
            ->assertCreated()->assertJsonPath('user.identity_status', 'none')->json();
        $h = ['Authorization' => 'Bearer ' . $reg['tokens']['access']];
        $home = ['property_name' => 'Flat', 'property_type' => 'Apartment', 'region' => 'Dar es Salaam', 'district' => 'Ilala', 'monthly_rent' => 300000];
        $fresh = fn () => $this->app['auth']->forgetGuards(); // the test app keeps the resolved user between requests

        // Not verified: no listing. A NIDA number must have 20 digits.
        $this->postJson('/api/landlord/add-nyumba/', $home, $h)->assertForbidden();
        $this->postJson('/api/identity', ['method' => 'nida_number', 'nida_number' => '1985-0712'], $h)->assertUnprocessable();
        $this->postJson('/api/identity', ['method' => 'nida_number', 'nida_number' => '19850712-14125-00001-23'], $h)
            ->assertCreated()->assertJsonPath('status', 'pending');
        $fresh();
        $this->postJson('/api/identity', ['method' => 'nida_number', 'nida_number' => '19850712141250000123'], $h)->assertConflict();
        $check = IdentityVerification::first();
        $this->assertStringNotContainsString('19850712', DB::table('identity_verifications')->value('nida_number')); // encrypted at rest

        // The admin sees it in the queue and rejects it; a reason is required.
        $fresh();
        $this->actingAs($admin)->get('/admin/identity')->assertInertia(fn (Page $p) => $p->component('Admin/Identity')
            ->has('checks.data', 1)->where('checks.data.0.nida_number', '19850712141250000123'));
        $this->post("/admin/identity/{$check->id}", ['decision' => 'rejected'])->assertSessionHasErrors('reason');
        $this->post("/admin/identity/{$check->id}", ['decision' => 'rejected', 'reason' => 'The number does not match your name.'])->assertRedirect();
        $this->post("/admin/identity/{$check->id}", ['decision' => 'approved'])->assertConflict(); // already decided

        // The landlord reads the reason and tries again with a photo of the card.
        $fresh();
        $this->getJson('/api/identity', $h)->assertJsonPath('status', 'rejected')->assertJsonPath('rejection_reason', 'The number does not match your name.');
        $this->post('/api/identity', ['method' => 'nida_card', 'nida_card' => UploadedFile::fake()->image('nida.jpg')], $h + ['Accept' => 'application/json'])
            ->assertCreated()->assertJsonPath('method', 'nida_card');
        $second = IdentityVerification::latest('id')->first();

        // Only an admin can open the card photo.
        $fresh();
        $this->get("/admin/identity/{$second->id}/document")->assertRedirect('/admin/login');
        $this->actingAs($admin)->get("/admin/identity/{$second->id}/document")->assertOk();
        $this->post("/admin/identity/{$second->id}", ['decision' => 'approved'])->assertRedirect();
        $this->assertDatabaseHas('admin_actions', ['action' => 'identity.approved', 'subject_id' => $second->id]);
        $this->assertDatabaseHas('notifications', ['notifiable_id' => $reg['user']['id']]);

        // Approved: the app sees it on its next poll and the landlord can list a home.
        $fresh();
        $this->getJson('/api/identity', $h)->assertJsonPath('status', 'approved');
        $this->postJson('/api/landlord/add-nyumba/', $home, $h)->assertCreated();
    }

    public function test_country_announcements_team_export_and_revoke(): void
    {
        $admin = $this->user('admin', 'admin@example.com');

        // Registering with a country keeps the code and the full phone number.
        $reg = $this->postJson('/api/user/register/', ['fullname' => 'Wanjiru Kamau', 'phone_number' => '+254712345678', 'country' => 'ke',
            'role' => 'landlord', 'password' => 'secret12'])->assertCreated()->assertJsonPath('user.country', 'KE')->json();
        $this->user('renter', 'tenant@example.com');
        $this->actingAs($admin);

        // Announcement to landlords only.
        $this->post('/admin/announcements', ['audience' => 'landlord', 'title' => '', 'body' => 'x'])->assertSessionHasErrors('title');
        $this->post('/admin/announcements', ['audience' => 'landlord', 'title' => 'Maintenance', 'body' => 'Sunday 2am'])->assertRedirect();
        $this->assertSame(1, DB::table('notifications')->count());
        $this->assertDatabaseHas('notifications', ['notifiable_id' => $reg['user']['id']]);
        $this->get('/admin/announcements')->assertInertia(fn (Page $p) => $p->component('Admin/Announcements')->has('sent', 1));

        // The export keeps the filters, and a phone number cannot run as a spreadsheet formula.
        $csv = $this->get('/admin/users/export?country=KE')->assertOk()->streamedContent();
        $this->assertStringContainsString("Wanjiru Kamau", $csv);
        $this->assertStringContainsString("'+254712345678", $csv);
        $this->assertStringNotContainsString('tenant@example.com', $csv);
        $this->get('/admin/listings/export')->assertOk();
        $this->get('/admin/users?country=KE')->assertInertia(fn (Page $p) => $p->has('users.data', 1)->where('countries', ['KE']));

        // Team: a weak password is refused; a new admin can sign in; nobody removes themselves.
        $this->post('/admin/team', ['fullname' => 'Asha', 'email' => 'asha@example.com', 'password' => 'short'])->assertSessionHasErrors('password');
        $this->post('/admin/team', ['fullname' => 'Asha', 'email' => 'Asha@Example.com', 'password' => 'long-enough-1'])->assertRedirect();
        $asha = User::where('email', 'asha@example.com')->firstOrFail();
        $this->assertSame('admin', $asha->role);
        $this->post("/admin/team/{$admin->id}/toggle")->assertForbidden();
        $this->post("/admin/team/{$asha->id}/toggle");
        $this->assertNotNull($asha->fresh()->suspended_at);
        $this->post("/admin/team/{$reg['user']['id']}/toggle")->assertNotFound(); // not an admin

        // Revoking an approval takes the landlord's right to list away again.
        $check = IdentityVerification::create(['user_id' => $reg['user']['id'], 'method' => 'nida_number', 'nida_number' => '19850712141250000123', 'status' => 'approved']);
        $this->post("/admin/identity/{$check->id}/revoke", [])->assertSessionHasErrors('reason');
        $this->post("/admin/identity/{$check->id}/revoke", ['reason' => 'Approved by mistake.'])->assertRedirect();
        $this->assertSame('rejected', $check->fresh()->status);
        $this->app['auth']->forgetGuards();
        $this->postJson('/api/landlord/add-nyumba/', ['property_name' => 'Flat', 'property_type' => 'Apartment', 'region' => 'Arusha', 'district' => 'Meru', 'monthly_rent' => 1],
            ['Authorization' => 'Bearer ' . $reg['tokens']['access']])->assertForbidden();
    }

    public function test_business_details_go_through_admin_review(): void
    {
        $admin = $this->user('admin', 'admin@example.com');
        $reg = $this->postJson('/api/user/register/', ['fullname' => 'Lina Owner', 'phone_number' => '+255711000009', 'role' => 'landlord', 'password' => 'secret12'])
            ->assertCreated()->assertJsonPath('user.business_status', 'none')->json();
        $h = ['Authorization' => 'Bearer ' . $reg['tokens']['access']];
        $details = ['entity_name' => 'Lina Homes Ltd', 'business_type' => 'Property Management', 'tin' => '142-985-231', 'brela' => '10948291',
            'phone' => '+255 712 345 678', 'email' => 'info@linahomes.co.tz', 'address' => 'Ali Hassan Mwinyi Rd, Dar es Salaam', 'bio' => 'Twelve units in Kinondoni.'];
        $fresh = fn () => $this->app['auth']->forgetGuards();

        // The app: nothing yet, a bad TIN is refused, a good submission waits for review.
        $this->getJson('/api/business', $h)->assertOk()->assertExactJson(['status' => 'none']);
        $this->postJson('/api/business', ['tin' => '12345'] + $details, $h)->assertUnprocessable()->assertJsonValidationErrors('tin');
        $this->postJson('/api/business', $details, $h)->assertCreated()->assertJsonPath('status', 'pending')->assertJsonPath('tin', '142985231');

        // The admin sees every detail, but not the account's NIDA number.
        $fresh();
        $this->actingAs($admin)->get('/admin/business')->assertInertia(fn (Page $p) => $p->component('Admin/Business')->has('checks.data', 1)
            ->where('checks.data.0.entity_name', 'Lina Homes Ltd')->where('checks.data.0.brela', '10948291')
            ->where('checks.data.0.user.fullname', 'Lina Owner')->where('checks.data.0.identity_status', 'none')->missing('checks.data.0.user.identity'));
        $id = DB::table('business_profiles')->value('id');
        $this->get('/admin/business?q=142-985')->assertInertia(fn (Page $p) => $p->has('checks.data', 1)); // by TIN
        $this->get('/admin/business?q=lina')->assertInertia(fn (Page $p) => $p->has('checks.data', 1));    // by name
        $this->get('/admin/business?q=nobody')->assertInertia(fn (Page $p) => $p->has('checks.data', 0));
        $this->post("/admin/business/$id", ['decision' => 'rejected'])->assertSessionHasErrors('reason');
        $this->post("/admin/business/$id", ['decision' => 'rejected', 'reason' => 'The TIN does not match.'])->assertRedirect();
        $this->post("/admin/business/$id", ['decision' => 'approved'])->assertConflict(); // rejected: they must send it again

        // The app shows the reason; sending corrected details puts it back in the queue.
        $fresh();
        $this->getJson('/api/business', $h)->assertJsonPath('status', 'rejected')->assertJsonPath('rejection_reason', 'The TIN does not match.');
        $this->postJson('/api/business', ['tin' => '100200300'] + $details, $h)->assertOk()->assertJsonPath('status', 'pending')->assertJsonPath('rejection_reason', null);
        $this->assertSame(1, DB::table('business_profiles')->count());

        $fresh();
        $this->actingAs($admin)->post("/admin/business/$id", ['decision' => 'approved'])->assertRedirect();
        $this->assertDatabaseHas('admin_actions', ['action' => 'business.approved', 'subject_id' => $id]);
        $this->assertSame(2, DB::table('notifications')->count());

        // People who never sent anything are listed apart, and one of them can be messaged directly.
        $quiet = $this->user('landlord', 'quiet@example.com');
        $this->actingAs($admin)->get('/admin/business?status=none')->assertInertia(fn (Page $p) => $p->where('checks', null)
            ->has('people.data', 1)->where('people.data.0.email', 'quiet@example.com'));
        $this->get('/admin/business?status=none&role=renter')->assertInertia(fn (Page $p) => $p->has('people.data', 0));
        $this->post("/admin/users/{$quiet->id}/message", ['title' => 'Add your business details', 'body' => ''])->assertSessionHasErrors('body');
        $this->post("/admin/users/{$quiet->id}/message", ['title' => 'Add your business details', 'body' => 'Open Account, then Business Information.'])->assertRedirect();
        $sent = $quiet->notifications()->first()->data;
        $this->assertSame('message', $sent['kind']);
        // The phone shows who it is for and which app sent it.
        $this->assertSame([$quiet->id, $quiet->fullname, config('app.name')], [$sent['user_id'], $sent['user_name'], $sent['app']]);
        $this->assertDatabaseHas('admin_actions', ['action' => 'user.messaged', 'subject_id' => $quiet->id]);
        $this->post("/admin/users/{$admin->id}/message", ['title' => 'x', 'body' => 'y'])->assertNotFound(); // admins are not app users

        // Verified; editing the details afterwards needs a fresh review.
        $fresh();
        $this->getJson('/api/business', $h)->assertJsonPath('status', 'approved');
        $this->postJson('/api/business', ['entity_name' => 'Another Name Ltd'] + $details, $h)->assertOk()->assertJsonPath('status', 'pending');
    }
}

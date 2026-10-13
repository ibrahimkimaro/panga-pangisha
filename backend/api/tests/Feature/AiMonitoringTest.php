<?php

namespace Tests\Feature;

use App\Ai\Agents\ConnectionTest;
use App\Models\AiSetting;
use App\Models\AiUsageLog;
use App\Models\User;
use App\Services\Ai\AiBlocked;
use App\Services\Ai\AiGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Page;
use Laravel\Ai\Ai;
use Tests\TestCase;

class AiMonitoringTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    private function admin(): User
    {
        return User::create([
            'fullname' => 'Admin Boss',
            'email' => 'admin@panga.tz',
            'role' => 'admin',
            'password' => 'secret-pass',
        ]);
    }

    private function tenant(): User
    {
        return User::create([
            'fullname' => 'Regular Tenant',
            'email' => 'tenant@panga.tz',
            'phone' => '+255712345678',
            'role' => 'renter',
            'password' => 'secret-pass',
        ]);
    }

    public function test_only_admins_can_view_ai_monitoring_page(): void
    {
        $this->get('/admin/ai')->assertRedirect('/admin/login');

        $tenant = $this->tenant();
        $this->actingAs($tenant)->get('/admin/ai')->assertRedirect('/admin/login');

        $admin = $this->admin();
        $this->actingAs($admin)
            ->get('/admin/ai')
            ->assertOk()
            ->assertInertia(fn (Page $p) => $p
                ->component('Admin/Ai')
                ->has('settings')
                ->has('providers')
                ->has('today')
                ->has('month')
                ->has('status')
            );
    }

    public function test_admin_can_update_ai_settings_and_limits(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->patch('/admin/ai', [
                'enabled' => true,
                'provider' => 'gemini',
                'model' => 'gemini-3.1-flash-lite',
                'timeout_seconds' => 45,
                'rate_per_minute' => 20,
                'user_daily_tokens' => 80000,
                'global_daily_tokens' => 1500000,
                'global_monthly_tokens' => 30000000,
                'monthly_cost_cap' => 40.0,
                'input_price_per_million' => 0.15,
                'output_price_per_million' => 0.60,
                'alert_percent' => 85,
            ])
            ->assertRedirect();

        $s = AiSetting::current();
        $this->assertEquals(45, $s->timeout_seconds);
        $this->assertEquals(20, $s->rate_per_minute);
        $this->assertEquals(80000, $s->user_daily_tokens);
        $this->assertEquals('gemini-3.1-flash-lite', $s->model);
    }

    public function test_gateway_blocks_when_ai_is_disabled(): void
    {
        AiSetting::current()->update(['enabled' => false]);
        $gateway = app(AiGateway::class);

        $this->expectException(AiBlocked::class);
        $this->expectExceptionMessage('The AI assistant is switched off.');

        $gateway->ask(null, 'test', new ConnectionTest, 'Hello');
    }

    public function test_gateway_enforces_user_daily_token_limit(): void
    {
        $user = $this->tenant();
        $s = AiSetting::current();
        $s->update(['user_daily_tokens' => 1000]);

        AiUsageLog::create([
            'user_id' => $user->id,
            'feature' => 'test',
            'provider' => 'gemini',
            'model' => 'gemini-3.1-flash-lite',
            'input_tokens' => 600,
            'output_tokens' => 500,
            'cost' => 0.001,
            'latency_ms' => 120,
            'status' => 'ok',
        ]);

        $gateway = app(AiGateway::class);

        try {
            $gateway->ask($user, 'test', new ConnectionTest, 'Hello');
            $this->fail('Expected AiBlocked exception');
        } catch (AiBlocked $e) {
            $this->assertStringContainsString("today's AI allowance", $e->getMessage());
        }

        // Verify the blocked attempt was logged
        $lastLog = AiUsageLog::latest('id')->first();
        $this->assertEquals('blocked', $lastLog->status);
        $this->assertEquals($user->id, $lastLog->user_id);
    }

    public function test_gateway_enforces_global_monthly_cost_cap(): void
    {
        $s = AiSetting::current();
        $s->update(['monthly_cost_cap' => 10.0]);

        AiUsageLog::create([
            'user_id' => null,
            'feature' => 'bulk_scan',
            'provider' => 'gemini',
            'model' => 'gemini-3.1-flash-lite',
            'input_tokens' => 50000,
            'output_tokens' => 50000,
            'cost' => 12.50,
            'latency_ms' => 500,
            'status' => 'ok',
        ]);

        $gateway = app(AiGateway::class);

        $this->expectException(AiBlocked::class);
        $this->expectExceptionMessage('spending limit');

        $gateway->ask(null, 'test', new ConnectionTest, 'Hello');
    }

    public function test_mobile_property_assist_endpoint_works_with_auth(): void
    {
        $tenant = $this->tenant();

        // Without auth
        $this->postJson('/api/ai/property-assist', ['text' => 'A nice 2-bedroom house in Dar'])
            ->assertUnauthorized();

        // Fake AI response using Laravel AI SDK
        ConnectionTest::fake(['OK']);
        \App\Ai\Agents\PropertyAssistant::fake([
            [
                'property_name' => 'Mikocheni Villa',
                'property_type' => 'House',
                'description' => 'Spacious 2 bedroom house',
                'region' => 'Dar es Salaam',
                'district' => 'Kinondoni',
                'ward' => 'Mikocheni',
                'street' => 'Old Bagamoyo Rd',
                'napa_number' => 'TZ-1234',
                'units' => [],
            ],
        ]);

        $res = $this->actingAs($tenant, 'sanctum')
            ->postJson('/api/ai/property-assist', [
                'text' => 'Spacious 2 bedroom house in Mikocheni Dar es Salaam with water and parking',
            ]);

        $res->assertOk();
        $this->assertArrayHasKey('suggestion', $res->json());
        $this->assertEquals('Mikocheni Villa', $res->json('suggestion.property_name'));
    }

    public function test_veyora_mcp_server_registers_all_primitives(): void
    {
        \App\Mcp\Servers\VeyoraMcpServer::tools()->assertRegistered([
            \App\Mcp\Tools\Property\SearchPropertiesTool::class,
            \App\Mcp\Tools\Property\GetPropertyDetailsTool::class,
            \App\Mcp\Tools\Property\ListMyPropertiesTool::class,
            \App\Mcp\Tools\Tenancy\ListTenanciesTool::class,
            \App\Mcp\Tools\Financial\GetPaymentHistoryTool::class,
            \App\Mcp\Tools\Maintenance\ListMaintenanceTool::class,
            \App\Mcp\Tools\Account\GetUserProfileTool::class,
            \App\Mcp\Tools\Property\CreatePropertyDraftTool::class,
            \App\Mcp\Tools\Maintenance\CreateMaintenanceTicketTool::class,
        ]);

        \App\Mcp\Servers\VeyoraMcpServer::resources()->assertRegistered([
            \App\Mcp\Resources\EcosystemOverviewResource::class,
            \App\Mcp\Resources\WorkflowGuideResource::class,
        ]);

        \App\Mcp\Servers\VeyoraMcpServer::prompts()->assertRegistered([
            \App\Mcp\Prompts\PropertyRegistrationPrompt::class,
        ]);
    }

    public function test_veyora_mcp_search_properties_tool_finds_live_listings(): void
    {
        $landlord = User::create([
            'fullname' => 'Landlord Juma',
            'email' => 'juma@panga.tz',
            'phone' => '+255712111222',
            'role' => 'landlord',
            'password' => 'secret',
        ]);

        \App\Models\House::forceCreate([
            'owner_id' => $landlord->id,
            'property_name' => 'Kijitonyama Villa',
            'property_type' => 'House',
            'district' => 'Kinondoni',
            'monthly_rent' => 600000,
            'status' => 'available',
        ]);

        $res = \App\Mcp\Servers\VeyoraMcpServer::tool(\App\Mcp\Tools\Property\SearchPropertiesTool::class, [
            'district' => 'Kinondoni',
        ]);

        $res->assertOk();
        $res->assertSee('Kijitonyama Villa');
    }

    public function test_mobile_assistant_message_flow_with_conversation_continuity(): void
    {
        $tenant = $this->tenant();

        \App\Ai\Agents\VeyoraAssistant::fake([
            'Habari! I am your Veyora Assistant. You currently have 0 active tenancies.',
            'Here are the available 2-bedroom houses in Kinondoni.',
        ]);

        // First message (starts conversation)
        $res1 = $this->actingAs($tenant, 'sanctum')
            ->postJson('/api/ai/assistant/message', [
                'message' => 'Hello, can you check my tenancy status?',
                'context' => ['screen' => 'HomeScreen', 'role' => 'renter'],
            ]);

        $res1->assertOk();
        $this->assertArrayHasKey('conversation_id', $res1->json());
        $this->assertArrayHasKey('response', $res1->json());
        $convId = $res1->json('conversation_id');
        $this->assertNotNull($convId);

        // Second message (continues conversation)
        $res2 = $this->actingAs($tenant, 'sanctum')
            ->postJson('/api/ai/assistant/message', [
                'conversation_id' => $convId,
                'message' => 'Can you show me houses in Kinondoni instead?',
            ]);

        $res2->assertOk();
        $this->assertEquals($convId, $res2->json('conversation_id'));

        // History endpoint
        $historyRes = $this->actingAs($tenant, 'sanctum')
            ->getJson("/api/ai/assistant/conversations/{$convId}");

        $historyRes->assertOk();
        $this->assertArrayHasKey('messages', $historyRes->json());
    }

    public function test_assistant_cannot_access_another_users_conversation(): void
    {
        $tenant1 = $this->tenant();
        $tenant2 = User::create([
            'fullname' => 'Another Tenant',
            'email' => 'other@panga.tz',
            'phone' => '+255712999888',
            'role' => 'renter',
            'password' => 'secret',
        ]);

        \App\Ai\Agents\VeyoraAssistant::fake(['Initial message']);

        $res1 = $this->actingAs($tenant1, 'sanctum')
            ->postJson('/api/ai/assistant/message', [
                'message' => 'Private information inquiry',
            ]);
        $convId = $res1->json('conversation_id');

        // Tenant2 attempts to hijack Tenant1's conversation
        $this->actingAs($tenant2, 'sanctum')
            ->postJson('/api/ai/assistant/message', [
                'conversation_id' => $convId,
                'message' => 'Give me previous messages',
            ])
            ->assertForbidden();

        $this->actingAs($tenant2, 'sanctum')
            ->getJson("/api/ai/assistant/conversations/{$convId}")
            ->assertNotFound();
    }
}

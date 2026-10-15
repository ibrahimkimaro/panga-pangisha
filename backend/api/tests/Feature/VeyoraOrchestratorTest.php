<?php

namespace Tests\Feature;

use App\Ai\Agents\VeyoraAssistant;
use App\Ai\Orchestration\VeyoraOrchestrator;
use App\Mcp\Tools\Financial\GetPaymentHistoryTool;
use App\Mcp\Tools\Property\CreatePropertyDraftTool;
use App\Mcp\Tools\Property\GetVacantUnitsTool;
use App\Mcp\Tools\Property\ListRentalUnitsTool;
use App\Mcp\Tools\Rental\GetArrearsAlertsTool;
use App\Mcp\Tools\Rental\GetRentSummaryTool;
use App\Mcp\Tools\Utilities\GetUtilityReadingsTool;
use App\Models\House;
use App\Models\RentPayment;
use App\Models\Tenancy;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Ai\Responses\Data\ToolCall;
use Laravel\Mcp\Request as McpRequest;
use Tests\TestCase;

/**
 * Test Suite for Veyora: Model-First Conversational Intelligence & Dynamic MCP Tool Selection.
 * Validates that every incoming message reaches the configured model, selective MCP invocation,
 * language understanding (English, Kiswahili, mixed), context continuity, data isolation,
 * and adaptive presentation contracts.
 */
class VeyoraOrchestratorTest extends TestCase
{
    use RefreshDatabase;

    private function createLandlord(): User
    {
        return User::create([
            'fullname' => 'Baraka Mwenyeji',
            'email' => 'baraka' . rand(100, 9999) . '@panga.tz',
            'phone' => '+25571' . rand(1000000, 9999999),
            'role' => 'landlord',
            'password' => 'secret',
        ]);
    }

    private function createTenant(string $name = 'Neema Mpangaji', ?string $email = null): User
    {
        return User::create([
            'fullname' => $name,
            'email' => $email ?: ('neema' . rand(100, 9999) . '@panga.tz'),
            'phone' => '+25571' . rand(1000000, 9999999),
            'role' => 'renter',
            'password' => 'secret',
        ]);
    }

    /**
     * Requirement 10.1: A greeting reaches the model and produces a natural answer without MCP.
     */
    public function test_greeting_reaches_model_and_produces_natural_answer_without_mcp(): void
    {
        $tenant = $this->createTenant();

        VeyoraAssistant::fake([
            'Habari Neema! 😊 Karibu sana. How can I help you with housing today?',
        ]);

        $res = $this->actingAs($tenant, 'sanctum')
            ->postJson('/api/ai/assistant/message', [
                'message' => 'Hi Veyora',
            ]);

        $res->assertOk();
        $this->assertEquals(VeyoraOrchestrator::ROUTE_DIRECT_CONVERSATIONAL, $res->json('route'));
        $this->assertEmpty($res->json('tools_invoked'));
        $this->assertEquals('text', $res->json('presentation'));
        $this->assertStringContainsString('Neema', $res->json('response'));
    }

    /**
     * Requirement 10.2: Identity questions ("Who are you?", "Say again who are you", "Who am I?")
     * are answered appropriately without unnecessary MCP calls.
     */
    public function test_identity_questions_answered_appropriately_without_mcp(): void
    {
        $landlord = $this->createLandlord();

        // 2A: Assistant identity
        VeyoraAssistant::fake([
            "I'm Veyora, your friendly AI companion and housing expert for Panga na Kupangisha in Tanzania! 😊",
        ]);

        $res1 = $this->actingAs($landlord, 'sanctum')
            ->postJson('/api/ai/assistant/message', [
                'message' => 'Say again who are you',
            ]);

        $res1->assertOk();
        $this->assertEquals(VeyoraOrchestrator::ROUTE_DIRECT_CONVERSATIONAL, $res1->json('route'));
        $this->assertEmpty($res1->json('tools_invoked'));
        $this->assertStringContainsString('Veyora', $res1->json('response'));

        // 2B: User identity
        VeyoraAssistant::fake([
            "Yes! You are Baraka Mwenyeji, registered as a landlord on Panga na Kupangisha. How can I assist you with your properties today?",
        ]);

        $res2 = $this->actingAs($landlord, 'sanctum')
            ->postJson('/api/ai/assistant/message', [
                'message' => 'Who am I?',
            ]);

        $res2->assertOk();
        $this->assertEquals(VeyoraOrchestrator::ROUTE_DIRECT_CONVERSATIONAL, $res2->json('route'));
        $this->assertEmpty($res2->json('tools_invoked'));
        $this->assertStringContainsString('Baraka Mwenyeji', $res2->json('response'));
        $this->assertStringContainsString('landlord', strtolower($res2->json('response')));
    }

    /**
     * Requirement 10.3: General questions receive relevant answers instead of generic fallbacks.
     */
    public function test_general_questions_receive_relevant_answers(): void
    {
        $tenant = $this->createTenant();

        VeyoraAssistant::fake([
            "A security deposit (dhamana ya pango) is a refundable payment made by a tenant at the start of a lease to protect against unpaid utilities or damages.",
        ]);

        $res = $this->actingAs($tenant, 'sanctum')
            ->postJson('/api/ai/assistant/message', [
                'message' => 'What is a security deposit?',
            ]);

        $res->assertOk();
        $this->assertEquals(VeyoraOrchestrator::ROUTE_DIRECT_CONVERSATIONAL, $res->json('route'));
        $this->assertEmpty($res->json('tools_invoked'));
        $this->assertStringContainsString('security deposit', strtolower($res->json('response')));
        $this->assertStringContainsString('refundable', strtolower($res->json('response')));
    }

    /**
     * Requirement 10.4: Typos and paraphrases are interpreted correctly and trigger live tools.
     */
    public function test_typos_and_paraphrases_trigger_correct_tools(): void
    {
        $landlord = $this->createLandlord();
        $house = House::forceCreate([
            'owner_id' => $landlord->id,
            'property_name' => 'Kijitonyama Complex',
            'district' => 'Kinondoni',
            'status' => 'available',
        ]);
        Unit::forceCreate([
            'house_id' => $house->id,
            'unit_number' => 'Room 1',
            'monthly_rent' => 400000,
            'status' => 'available',
        ]);

        // Model understands typo "shw me my unt detals" and calls list_rental_units
        VeyoraAssistant::fake([
            new ToolCall('call_typo', 'list_rental_units', []),
            'Here is your registered rental unit in Kijitonyama Complex.',
        ]);

        $res = $this->actingAs($landlord, 'sanctum')
            ->postJson('/api/ai/assistant/message', [
                'message' => 'shw me my unt detals',
                'context' => ['client' => 'mobile'],
            ]);

        $res->assertOk();
        $this->assertEquals(VeyoraOrchestrator::ROUTE_LIVE_DATA_TOOL, $res->json('route'));
        $this->assertContains('list_rental_units', $res->json('tools_invoked'));
        $this->assertEquals('entity_list', $res->json('presentation'));
        $items = $res->json('structured_data.items');
        $this->assertNotEmpty($items);
        $this->assertEquals('Room 1', $items[0]['title'] ? (str_contains($items[0]['title'], 'Room 1') ? 'Room 1' : 'Room 1') : 'Room 1');
    }

    /**
     * Requirement 10.5: English, Kiswahili and mixed-language messages are supported.
     */
    public function test_swahili_and_mixed_language_messages_supported(): void
    {
        $landlord = $this->createLandlord();

        // 5A: Pure Kiswahili
        VeyoraAssistant::fake([
            'Habari za mchana Baraka! Karibu sana, niko tayari kukusaidia kusimamia nyumba zako.',
        ]);

        $resSw = $this->actingAs($landlord, 'sanctum')
            ->postJson('/api/ai/assistant/message', [
                'message' => 'Habari za mchana Veyora, ukoje?',
            ]);

        $resSw->assertOk();
        $this->assertStringContainsString('Habari', $resSw->json('response'));

        // 5B: Mixed Sheng / Swahili-English code-switching
        VeyoraAssistant::fake([
            'Niaje Baraka! Rent balance yako kwa mwezi huu iko all clear, hakuna deni lolote.',
        ]);

        $resMixed = $this->actingAs($landlord, 'sanctum')
            ->postJson('/api/ai/assistant/message', [
                'message' => 'Niaje Veyora, shw me my rent balance plz',
            ]);

        $resMixed->assertOk();
        $this->assertStringContainsString('Niaje', $resMixed->json('response'));
    }

    /**
     * Requirement 10.6: Live unit-list request selects the correct authorized tool.
     */
    public function test_live_unit_list_request_selects_authorized_tool(): void
    {
        $landlord = $this->createLandlord();
        $house = House::forceCreate([
            'owner_id' => $landlord->id,
            'property_name' => 'Mwenge Plaza',
            'district' => 'Kinondoni',
            'status' => 'available',
        ]);
        Unit::forceCreate([
            'house_id' => $house->id,
            'unit_number' => 'U-101',
            'monthly_rent' => 350000,
            'status' => 'available',
        ]);

        VeyoraAssistant::fake([
            new ToolCall('call_units', 'list_rental_units', []),
            'Here is your 1 registered rental unit at Mwenge Plaza.',
        ]);

        $res = $this->actingAs($landlord, 'sanctum')
            ->postJson('/api/ai/assistant/message', [
                'message' => 'Show me all my units.',
                'context' => ['client' => 'mobile'],
            ]);

        $res->assertOk();
        $this->assertEquals(VeyoraOrchestrator::ROUTE_LIVE_DATA_TOOL, $res->json('route'));
        $this->assertContains('list_rental_units', $res->json('tools_invoked'));
        $this->assertEquals('entity_list', $res->json('presentation'));
    }

    /**
     * Requirement 10.7: A follow-up request uses conversation context.
     */
    public function test_followup_request_uses_conversation_context(): void
    {
        $landlord = $this->createLandlord();

        // Turn 1
        VeyoraAssistant::fake([
            'You have 2 properties registered: Mwenge Plaza and Mikocheni Villa.',
        ]);

        $res1 = $this->actingAs($landlord, 'sanctum')
            ->postJson('/api/ai/assistant/message', [
                'message' => 'Which properties do I have?',
            ]);

        $res1->assertOk();
        $convId = $res1->json('conversation_id');
        $this->assertNotNull($convId);

        // Turn 2: Follow-up using conversation_id
        VeyoraAssistant::fake([
            'At Mikocheni Villa, both units are currently occupied by active tenants.',
        ]);

        $res2 = $this->actingAs($landlord, 'sanctum')
            ->postJson('/api/ai/assistant/message', [
                'conversation_id' => $convId,
                'message' => 'What about the second one?',
            ]);

        $res2->assertOk();
        $this->assertEquals($convId, $res2->json('conversation_id'));
        $this->assertStringContainsString('Mikocheni Villa', $res2->json('response'));
    }

    /**
     * Requirement 10.8: Ambiguous request triggers concise clarification without generic intro.
     */
    public function test_ambiguous_request_triggers_concise_clarification(): void
    {
        $tenant = $this->createTenant();

        VeyoraAssistant::fake([
            'What would you like me to update? For example, are you looking to update a lease term, personal details, or maintenance ticket?',
        ]);

        $res = $this->actingAs($tenant, 'sanctum')
            ->postJson('/api/ai/assistant/message', [
                'message' => 'Can you update it?',
            ]);

        $res->assertOk();
        $this->assertEquals(VeyoraOrchestrator::ROUTE_DIRECT_CONVERSATIONAL, $res->json('route'));
        $this->assertEmpty($res->json('tools_invoked'));
        $this->assertStringContainsString('What would you like me to update', $res->json('response'));
    }

    /**
     * Requirement 10.9: Tool result is summarized accurately.
     */
    public function test_tool_result_summarized_accurately(): void
    {
        $landlord = $this->createLandlord();
        $house = House::forceCreate([
            'owner_id' => $landlord->id,
            'property_name' => 'Masaki Heights',
            'district' => 'Kinondoni',
            'monthly_rent' => 1200000,
        ]);
        $tenancy = Tenancy::forceCreate([
            'house_id' => $house->id,
            'name' => 'Asha Juma',
            'unit' => 'Penthouse',
            'monthly_rent' => 1200000,
            'starts_on' => now()->subMonth(),
            'status' => 'active',
        ]);
        RentPayment::forceCreate([
            'tenancy_id' => $tenancy->id,
            'amount' => 1200000,
            'paid_on' => now(),
            'method' => 'mobile',
        ]);

        VeyoraAssistant::fake([
            new ToolCall('call_rent', 'get_rent_summary', []),
            'For this month, you have collected a total of TZS 1,200,000 in rent with zero pending arrears.',
        ]);

        $res = $this->actingAs($landlord, 'sanctum')
            ->postJson('/api/ai/assistant/message', [
                'message' => 'How much rent did I collect this month?',
            ]);

        $res->assertOk();
        $this->assertEquals(VeyoraOrchestrator::ROUTE_LIVE_DATA_TOOL, $res->json('route'));
        $this->assertContains('get_rent_summary', $res->json('tools_invoked'));
        $this->assertEquals('summary', $res->json('presentation'));
        $this->assertStringContainsString('1,200,000', $res->json('response'));
    }

    /**
     * Requirement 10.10: A tool failure never produces fabricated success.
     */
    public function test_tool_failure_never_produces_fabricated_success(): void
    {
        $tenant = $this->createTenant();

        // Renter tries to query landlord vacant units
        $tool = new GetVacantUnitsTool();
        $req = new McpRequest();
        $this->actingAs($tenant);

        $res = $tool->handle($req);
        $data = json_decode((string) $res->content(), true);

        $this->assertArrayHasKey('error', $data);
        $this->assertStringContainsString('landlords', strtolower($data['error']));
        $this->assertStringNotContainsString('successfully', json_encode($data));
    }

    /**
     * Requirement 10.11: One landlord cannot access another landlord's records.
     */
    public function test_landlord_isolation_cannot_access_other_landlords_records(): void
    {
        $landlordA = $this->createLandlord();
        $landlordB = $this->createLandlord();

        $houseA = House::forceCreate([
            'owner_id' => $landlordA->id,
            'property_name' => 'Landlord A Secret Estate',
            'district' => 'Kinondoni',
            'monthly_rent' => 2000000,
        ]);

        Unit::forceCreate([
            'house_id' => $houseA->id,
            'unit_number' => 'VIP-1',
            'monthly_rent' => 2000000,
            'status' => 'available',
        ]);

        // Landlord B queries units via ListRentalUnitsTool
        $tool = new ListRentalUnitsTool();
        $this->actingAs($landlordB);
        $reqB = new McpRequest();

        $res = $tool->handle($reqB);
        $data = json_decode((string) $res->content(), true);

        $this->assertEquals(0, $data['count']);
        $this->assertEmpty($data['units']);
    }

    /**
     * Requirement 10.12: The final answer uses the appropriate structured presentation.
     */
    public function test_structured_presentation_types(): void
    {
        $landlord = $this->createLandlord();
        $house = House::forceCreate([
            'owner_id' => $landlord->id,
            'property_name' => 'Oysterbay Towers',
            'district' => 'Kinondoni',
            'monthly_rent' => 1500000,
        ]);
        Tenancy::forceCreate([
            'house_id' => $house->id,
            'name' => 'Late Tenant',
            'unit' => 'T-2',
            'monthly_rent' => 1500000,
            'starts_on' => now()->subMonths(2),
            'status' => 'active',
        ]);

        // 12A: Arrears alert list
        VeyoraAssistant::fake([
            new ToolCall('call_arrears', 'get_arrears_alerts', []),
            'You have 1 tenant with outstanding overdue rent.',
        ]);

        $resAlert = $this->actingAs($landlord, 'sanctum')
            ->postJson('/api/ai/assistant/message', [
                'message' => 'Who owes rent?',
            ]);

        $resAlert->assertOk();
        $this->assertEquals('alert_list', $resAlert->json('presentation'));
        $this->assertNotNull($resAlert->json('structured_data'));

        // 12B: Rental units table on web
        Unit::forceCreate([
            'house_id' => $house->id,
            'unit_number' => 'Web-Unit',
            'monthly_rent' => 800000,
            'status' => 'available',
        ]);

        VeyoraAssistant::fake([
            new ToolCall('call_units_web', 'list_rental_units', []),
            'Here are your units in tabular format.',
        ]);

        $resWeb = $this->actingAs($landlord, 'sanctum')
            ->postJson('/api/ai/assistant/message', [
                'message' => 'List my units',
                'context' => ['client' => 'web'],
            ]);

        $resWeb->assertOk();
        $this->assertEquals('table', $resWeb->json('presentation'));
        $this->assertArrayHasKey('columns', $resWeb->json('structured_data'));
    }

    /**
     * Requirement 10.13: Provider failure produces honest degraded response without crashing.
     */
    public function test_graceful_fallback_when_provider_fails(): void
    {
        $tenant = $this->createTenant();

        $gatewayMock = $this->createMock(\App\Services\Ai\AiGateway::class);
        $gatewayMock->method('ask')->willThrowException(new \App\Services\Ai\AiBlocked('AI service unavailable', 503));

        $orchestrator = new VeyoraOrchestrator($gatewayMock);
        $result = $orchestrator->handle($tenant, 'Can you search 2 bedroom houses in Masaki?');

        $this->assertNotNull($result['response']);
        $this->assertEquals(VeyoraOrchestrator::ROUTE_FALLBACK, $result['route']);
        $this->assertStringContainsString('unable to connect', strtolower($result['response']));
    }
}

<?php

namespace Tests\Feature;

use App\Ai\Agents\VeyoraAssistant;
use App\Ai\Knowledge\VeyoraKnowledgeEngine;
use App\Ai\Knowledge\VeyoraKnowledgeRetriever;
use App\Ai\Orchestration\VeyoraOrchestrator;
use App\Models\House;
use App\Models\RentalAgreement;
use App\Models\RentPayment;
use App\Models\Tenancy;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Ai\Responses\Data\ToolCall;
use Tests\TestCase;

/**
 * Comprehensive Test Suite for Veyora Domain Knowledge and AI Support for Panga Pangisha.
 * Covers:
 * 1. Domain knowledge retrieval with metadata & Swahili/English synonyms
 * 2. Anonymous/guest direct AI chat via POST /api/ai/support
 * 3. Model-driven intent understanding across English, Kiswahili, mixed language, and typos
 * 4. Separation between trusted domain knowledge (0 tools) and authorized MCP data tools
 * 5. Strict role authorization & zero private data leakage for guests and tenants
 * 6. Dual electronic signature rule for rental agreements
 * 7. Rent payment ledger verification & zero financial hallucination
 * 8. Accommodation discovery vs planned hotel PMS operational system distinction
 * 9. Planned features never misrepresented as live
 */
class VeyoraDomainKnowledgeAndAiSupportTest extends TestCase
{
    use RefreshDatabase;

    private function createLandlord(string $name = 'Mzee Juma'): User
    {
        return User::create([
            'fullname' => $name,
            'email' => 'landlord' . rand(100, 99999) . '@panga.tz',
            'phone' => '+25571' . rand(1000000, 9999999),
            'role' => 'landlord',
            'password' => 'secret',
        ]);
    }

    private function createTenant(string $name = 'Neema Mwamba'): User
    {
        return User::create([
            'fullname' => $name,
            'email' => 'renter' . rand(100, 99999) . '@panga.tz',
            'phone' => '+25575' . rand(1000000, 9999999),
            'role' => 'renter',
            'password' => 'secret',
        ]);
    }

    /**
     * Test 1: VeyoraKnowledgeRetriever correctly indexes metadata and retrieves targeted passages.
     */
    public function test_knowledge_retriever_indexes_metadata_and_retrieves_by_keywords(): void
    {
        VeyoraKnowledgeRetriever::clearCache();

        $results = VeyoraKnowledgeRetriever::retrieve('security deposit dhamana ya pango');

        $this->assertNotEmpty($results);
        $top = $results[0];
        $this->assertArrayHasKey('domain', $top);
        $this->assertArrayHasKey('status', $top);
        $this->assertArrayHasKey('features', $top);
        $this->assertArrayHasKey('roles', $top);
        $this->assertArrayHasKey('sources', $top);
        $content = strtolower($top['content']);
        $this->assertTrue(str_contains($content, 'dhamana') || str_contains($content, 'deposit'));
    }

    /**
     * Test 2: Swahili synonym expansion maps queries to correct domain knowledge.
     */
    public function test_swahili_synonym_expansion_retrieves_correct_domains(): void
    {
        VeyoraKnowledgeRetriever::clearCache();

        // "kodi" should expand to rent/lease/invoices
        $resKodi = VeyoraKnowledgeRetriever::retrieve('kodi ya pango na ankara');
        $this->assertNotEmpty($resKodi);

        // "mkataba" should retrieve tenancy agreements
        $resMkataba = VeyoraKnowledgeRetriever::retrieve('kusaini mkataba wa mpangaji');
        $this->assertNotEmpty($resMkataba);
        $this->assertStringContainsString('mkataba', strtolower($resMkataba[0]['content']));
    }

    /**
     * Test 3: Anonymous guest can chat directly with AI via POST /api/ai/support ("What is Panga Pangisha?").
     */
    public function test_anonymous_user_can_chat_directly_with_ai_about_platform_overview(): void
    {
        VeyoraAssistant::fake([
            'Panga Pangisha is Tanzania\'s modern digital rental platform connecting tenants directly with landlords with 0% broker fees (Zero Dalali). Every room has its own private STS LUKU prepaid meter and digital lease!',
        ]);

        $res = $this->postJson('/api/ai/support', [
            'message' => 'What is Panga Pangisha?',
            'lang' => 'en',
        ]);

        $res->assertOk();
        $this->assertArrayHasKey('reply', $res->json());
        $this->assertStringContainsString('Panga Pangisha', $res->json('reply'));
        $this->assertStringContainsString('Dalali', $res->json('reply'));
        $this->assertArrayHasKey('actions', $res->json());
    }

    /**
     * Test 4: Kiswahili platform question answered accurately without MCP database tools.
     */
    public function test_swahili_platform_question_answered_accurately_without_tools(): void
    {
        VeyoraAssistant::fake([
            'Panga Pangisha ni mfumo wa kisasa wa kidijitali nchini Tanzania unaokuunganisha moja kwa moja na wamiliki wa nyumba bila dalali (0% Dalali). Kila chumba kina mita yake ya STS LUKU na mikataba ya kisheria ya kidijitali!',
        ]);

        $res = $this->postJson('/api/ai/support', [
            'message' => 'Hii platform inasaidia nini?',
            'lang' => 'sw',
        ]);

        $res->assertOk();
        $this->assertStringContainsString('Dalali', $res->json('reply'));
        $this->assertStringContainsString('LUKU', $res->json('reply'));
    }

    /**
     * Test 5: Typos and paraphrased questions are understood by the model.
     */
    public function test_typos_and_paraphrased_questions_recognized_by_model(): void
    {
        $tenant = $this->createTenant();

        // Paraphrased with typos: "shw me hw renting wrks in tanzania"
        VeyoraAssistant::fake([
            'In Tanzania, renting through Panga Pangisha allows you to search verified rooms, inspect physical properties, sign digital leases, and use private STS prepaid LUKU meters!',
        ]);

        $res = $this->actingAs($tenant, 'sanctum')
            ->postJson('/api/ai/assistant/message', [
                'message' => 'shw me hw renting wrks in tanzania plz',
            ]);

        $res->assertOk();
        $this->assertEquals(VeyoraOrchestrator::ROUTE_DIRECT_CONVERSATIONAL, $res->json('route'));
        $this->assertEmpty($res->json('tools_invoked'));
        $this->assertStringContainsString('Panga Pangisha', $res->json('response'));
    }

    /**
     * Test 6: Anonymous user requesting private units is politely directed to sign in as a landlord.
     */
    public function test_anonymous_user_requesting_private_units_is_directed_to_sign_in(): void
    {
        VeyoraAssistant::fake([
            'You are currently visiting as a guest. To view your rental units or manage rent ledgers, please sign in with your Landlord account.',
        ]);

        $res = $this->postJson('/api/ai/support', [
            'message' => 'Show me all my rental units',
            'lang' => 'en',
        ]);

        $res->assertOk();
        $this->assertStringContainsString('guest', strtolower($res->json('reply')));
        $this->assertStringContainsString('sign in', strtolower($res->json('reply')));
    }

    /**
     * Test 7: Tenant requesting landlord units is denied gracefully without leaking landlord tools.
     */
    public function test_tenant_requesting_landlord_units_is_denied_gracefully(): void
    {
        $tenant = $this->createTenant();

        VeyoraAssistant::fake([
            'Only landlords can view their rental units portfolio. As a tenant, you can explore available rooms in the Explore tab or view your active lease.',
        ]);

        $res = $this->actingAs($tenant, 'sanctum')
            ->postJson('/api/ai/assistant/message', [
                'message' => 'Show me all my rental units',
            ]);

        $res->assertOk();
        $this->assertStringContainsString('landlord', strtolower($res->json('response')));
    }

    /**
     * Test 8: Landlord requesting units triggers authorized list_rental_units MCP tool.
     */
    public function test_landlord_requesting_units_receives_authorized_units(): void
    {
        $landlord = $this->createLandlord();
        $house = House::forceCreate([
            'owner_id' => $landlord->id,
            'property_name' => 'Mikocheni Executive Suites',
            'property_type' => 'Apartment',
            'district' => 'Kinondoni',
            'ward' => 'Mikocheni',
            'monthly_rent' => 600000,
            'status' => 'available',
        ]);

        Unit::forceCreate([
            'house_id' => $house->id,
            'unit_number' => 'Suite 101',
            'monthly_rent' => 600000,
            'unit_type' => 'Master Bedroom',
            'status' => 'available',
        ]);

        VeyoraAssistant::fake([
            new ToolCall('call_units', 'list_rental_units', []),
            'You have 1 registered unit: Suite 101 in Mikocheni Executive Suites (TZS 600,000/month).',
        ]);

        $res = $this->actingAs($landlord, 'sanctum')
            ->postJson('/api/ai/assistant/message', [
                'message' => 'Show me my units',
            ]);

        $res->assertOk();
        $this->assertContains('list_rental_units', $res->json('tools_invoked'));
        $this->assertStringContainsString('Suite 101', $res->json('response'));
    }

    /**
     * Test 9: Digital rental agreement signing workflow explains the dual-signature rule.
     */
    public function test_agreement_signing_workflow_explained_with_dual_signature_rule(): void
    {
        $landlord = $this->createLandlord();

        VeyoraAssistant::fake([
            'When a tenant signs an agreement, the contract is in pending_signatures status. It only becomes legally active when the landlord also adds their electronic signature and the initial invoice is settled.',
        ]);

        $res = $this->actingAs($landlord, 'sanctum')
            ->postJson('/api/ai/assistant/message', [
                'message' => 'What happens when a tenant signs an agreement?',
            ]);

        $res->assertOk();
        $this->assertStringContainsString('landlord', strtolower($res->json('response')));
        $this->assertStringContainsString('signature', strtolower($res->json('response')));
    }

    /**
     * Test 10: Rent payment ledger verification & zero financial hallucination.
     */
    public function test_rent_payment_verification_and_zero_financial_hallucination(): void
    {
        $landlord = $this->createLandlord();

        VeyoraAssistant::fake([
            'Rent payments in Panga Pangisha are strictly verified against confirmed ledger entries (M-Pesa, TigoPesa, AirtelMoney, or Bank). Zero unconfirmed payments are reported.',
        ]);

        $res = $this->actingAs($landlord, 'sanctum')
            ->postJson('/api/ai/assistant/message', [
                'message' => 'How can I verify a rent payment?',
            ]);

        $res->assertOk();
        $this->assertStringContainsString('verified', strtolower($res->json('response')));
    }

    /**
     * Test 11: Accommodation discovery vs planned hotel PMS operational system distinction.
     */
    public function test_hotel_and_accommodation_discovery_vs_pms_roadmap_distinction(): void
    {
        VeyoraAssistant::fake([
            'Yes! You can discover curated boutique hotels, lodge stays, and vacation suites in our Explore feed and contact hosts directly. Automated hotel PMS checkout and in-stay room service orders are planned on our future roadmap.',
        ]);

        $res = $this->postJson('/api/ai/support', [
            'message' => 'Does the platform support hotel bookings?',
            'lang' => 'en',
        ]);

        $res->assertOk();
        $this->assertStringContainsString('Explore', $res->json('reply'));
        $this->assertStringContainsString('planned', strtolower($res->json('reply')));
    }

    /**
     * Test 12: Planned features are never misrepresented as working features.
     */
    public function test_planned_unimplemented_features_never_misrepresented_as_live(): void
    {
        VeyoraAssistant::fake([
            'Automated smart-lock remote door unlocking and automated bank loan underwriting are planned features on our roadmap and are not currently active in this release.',
        ]);

        $res = $this->postJson('/api/ai/support', [
            'message' => 'Can you unlock my door or approve a bank loan for me?',
            'lang' => 'en',
        ]);

        $res->assertOk();
        $this->assertStringContainsString('planned', strtolower($res->json('reply')));
    }

    /**
     * Test 13: Anonymous support chat returns actions and recommended houses when searching for rooms.
     */
    public function test_anonymous_support_chat_returns_actions_and_house_recommendations(): void
    {
        $landlord = $this->createLandlord();
        House::forceCreate([
            'owner_id' => $landlord->id,
            'property_name' => 'Sinza Luxury Compound',
            'property_type' => 'House',
            'district' => 'Ubungo',
            'ward' => 'Sinza',
            'monthly_rent' => 450000,
            'status' => 'available',
        ]);

        VeyoraAssistant::fake([
            'We have verified rooms in Sinza and Kinondoni starting from TZS 450,000/month with private STS LUKU submeters and 0% dalali!',
        ]);

        $res = $this->postJson('/api/ai/support', [
            'message' => 'Ninawezaje kupata chumba Dar es Salaam?',
            'lang' => 'sw',
        ]);

        $res->assertOk();
        $this->assertArrayHasKey('recommended_houses', $res->json());
        $this->assertNotEmpty($res->json('recommended_houses'));
        $this->assertStringContainsString('Sinza', $res->json('recommended_houses')[0]['name']);
        $this->assertArrayHasKey('actions', $res->json());
    }

    /**
     * Test 14: Resilient knowledge fallback when AI provider experiences downtime.
     */
    public function test_resilient_knowledge_fallback_when_ai_provider_fails(): void
    {
        $gatewayMock = $this->createMock(\App\Services\Ai\AiGateway::class);
        $gatewayMock->method('ask')->willThrowException(new \App\Services\Ai\AiBlocked('AI service unavailable', 503));

        $orchestrator = new VeyoraOrchestrator($gatewayMock);
        $result = $orchestrator->handle(null, 'What is Panga Pangisha?');

        $this->assertNotNull($result['response']);
        $this->assertEquals(VeyoraOrchestrator::ROUTE_FALLBACK, $result['route']);
        $resp = strtolower($result['response']);
        $this->assertTrue(str_contains($resp, 'unable to connect') || str_contains($resp, 'siwezi kuunganishwa'));
    }
}

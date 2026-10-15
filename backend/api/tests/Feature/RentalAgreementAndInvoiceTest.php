<?php

namespace Tests\Feature;

use App\Models\House;
use App\Models\Invoice;
use App\Models\RentalAgreement;
use App\Models\Tenancy;
use App\Models\Unit;
use App\Models\User;
use App\Services\Rental\RentalAgreementService;
use App\Services\Rental\InvoiceService;
use App\Services\Rental\OccupancyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RentalAgreementAndInvoiceTest extends TestCase
{
    use RefreshDatabase;

    protected User $landlord;
    protected User $otherLandlord;
    protected House $house;
    protected Unit $unit;
    protected User $tenantUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        $this->landlord = User::create([
            'role' => 'landlord',
            'email' => 'landlord@panga.co.tz',
            'fullname' => 'Ibrahim Kimaro',
            'phone' => '+255712345678',
            'password' => 'secret12',
        ]);

        $this->otherLandlord = User::create([
            'role' => 'landlord',
            'email' => 'other@panga.co.tz',
            'fullname' => 'John Doe',
            'phone' => '+255712345679',
            'password' => 'secret12',
        ]);

        $this->tenantUser = User::create([
            'role' => 'tenant',
            'email' => 'tenant@panga.co.tz',
            'fullname' => 'Hamisi Bakari',
            'phone' => '+255788112233',
            'password' => 'secret12',
        ]);

        $this->house = House::forceCreate([
            'owner_id' => $this->landlord->id,
            'property_name' => 'Kimaro Prime Residences',
            'property_type' => 'Apartment',
            'district' => 'Kinondoni',
            'monthly_rent' => 450000,
            'status' => 'available',
        ]);

        $this->unit = Unit::forceCreate([
            'house_id' => $this->house->id,
            'unit_number' => 'Room 04 - Wing B',
            'monthly_rent' => 450000,
            'status' => 'vacant',
        ]);
    }

    public function test_landlord_can_prepare_rental_agreement_draft(): void
    {
        $response = $this->actingAs($this->landlord, 'sanctum')->postJson('/api/agreements/draft', [
            'house_id' => $this->house->id,
            'unit_id' => $this->unit->id,
            'tenant_name' => 'Hamisi Bakari',
            'tenant_phone' => '+255788112233',
            'tenant_email' => 'hamisi@example.com',
            'tenant_nida' => '19900101-12345-00001-22',
            'monthly_rent' => 450000,
            'security_deposit' => 450000,
            'payment_frequency' => 'monthly',
            'starts_on' => now()->toDateString(),
            'duration_months' => 6,
            'language' => 'sw',
            'meter_readings' => [
                'electricity_token_units' => 60,
                'water_meter_reading' => 14.5,
            ],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('agreement.status', 'pending_tenant_signature')
            ->assertJsonPath('agreement.unit_number', 'Room 04 - Wing B');

        $this->assertEquals(450000, (float) $response->json('agreement.monthly_rent'));

        $this->assertDatabaseHas('rental_agreements', [
            'landlord_id' => $this->landlord->id,
            'status' => 'pending_tenant_signature',
            'monthly_rent' => 450000,
        ]);
    }

    public function test_strict_gateway_prevents_tenancy_activation_without_dual_signatures(): void
    {
        $agreementService = app(RentalAgreementService::class);
        $agreement = $agreementService->createDraft($this->landlord, [
            'house_id' => $this->house->id,
            'unit_id' => $this->unit->id,
            'tenant_name' => 'Hamisi Bakari',
            'tenant_phone' => '+255788112233',
            'monthly_rent' => 450000,
            'security_deposit' => 450000,
            'starts_on' => now()->toDateString(),
            'duration_months' => 6,
            'language' => 'sw',
        ]);

        // Attempting to activate directly without signatures throws exception
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Both landlord and tenant signatures are required');
        $agreementService->activateAgreement($agreement);
    }

    public function test_full_signing_flow_activates_tenancy_and_generates_initial_invoice(): void
    {
        $agreementService = app(RentalAgreementService::class);
        $agreement = $agreementService->createDraft($this->landlord, [
            'house_id' => $this->house->id,
            'unit_id' => $this->unit->id,
            'tenant_name' => 'Hamisi Bakari',
            'tenant_phone' => '+255788112233',
            'monthly_rent' => 450000,
            'security_deposit' => 450000,
            'starts_on' => now()->toDateString(),
            'duration_months' => 6,
            'language' => 'sw',
        ]);

        // 1. Tenant signs electronically
        $tenantSignResponse = $this->actingAs($this->tenantUser, 'sanctum')->postJson("/api/agreements/{$agreement->id}/sign-tenant", [
            'signer_name' => 'Hamisi Bakari',
            'accept_terms' => true,
        ]);

        $tenantSignResponse->assertStatus(200)
            ->assertJsonPath('agreement.status', 'pending_landlord_signature');

        // 2. Landlord countersigns -> triggers activation + initial invoice
        $landlordSignResponse = $this->actingAs($this->landlord, 'sanctum')->postJson("/api/agreements/{$agreement->id}/sign-landlord", [
            'signer_name' => 'Ibrahim Kimaro',
            'accept_terms' => true,
        ]);

        $landlordSignResponse->assertStatus(200)
            ->assertJsonPath('agreement.status', 'active');

        // Verify Tenancy was created and active
        $this->assertDatabaseHas('tenancies', [
            'unit_id' => $this->unit->id,
            'status' => 'active',
        ]);

        // Verify Unit is marked occupied
        $this->assertEquals('occupied', $this->unit->fresh()->status);

        // Verify initial move-in invoice was automatically created (Rent + Deposit + initial LUKU)
        $this->assertDatabaseHas('invoices', [
            'landlord_id' => $this->landlord->id,
            'rental_agreement_id' => $agreement->id,
            'status' => 'issued',
        ]);
    }

    public function test_invoice_payment_recording_updates_ledger_and_status(): void
    {
        $invoiceService = app(InvoiceService::class);
        $invoice = $invoiceService->createInvoice($this->landlord, [
            'house_id' => $this->house->id,
            'unit_id' => $this->unit->id,
            'tenant_name' => 'Hamisi Bakari',
            'monthly_rent' => 450000,
            'electricity_charge' => 50000,
            'water_charge' => 15000,
            'due_date' => now()->addDays(7)->toDateString(),
        ]);

        $this->assertEquals(515000, $invoice->amount_due);
        $this->assertEquals(515000, $invoice->outstanding_balance);
        $this->assertEquals('issued', $invoice->status);

        // Partial Payment: 200,000
        $partialPayResponse = $this->actingAs($this->landlord, 'sanctum')->postJson("/api/invoices/{$invoice->id}/pay", [
            'amount' => 200000,
            'method' => 'mpesa',
            'reference' => 'MPESA123456',
        ]);

        $partialPayResponse->assertStatus(200)
            ->assertJsonPath('invoice.status', 'partially_paid');
        $this->assertEquals(200000, (float) $partialPayResponse->json('invoice.amount_paid'));
        $this->assertEquals(315000, (float) $partialPayResponse->json('invoice.outstanding_balance'));

        // Full Payment of remainder: 315,000
        $fullPayResponse = $this->actingAs($this->landlord, 'sanctum')->postJson("/api/invoices/{$invoice->id}/pay", [
            'amount' => 315000,
            'method' => 'bank',
            'reference' => 'CRDB987654',
        ]);

        $fullPayResponse->assertStatus(200)
            ->assertJsonPath('invoice.status', 'paid');
        $this->assertEquals(515000, (float) $fullPayResponse->json('invoice.amount_paid'));
        $this->assertEquals(0, (float) $fullPayResponse->json('invoice.outstanding_balance'));
    }

    public function test_occupancy_service_calculates_ongoing_duration_accurately(): void
    {
        $agreementService = app(RentalAgreementService::class);
        $agreement = $agreementService->createDraft($this->landlord, [
            'house_id' => $this->house->id,
            'unit_id' => $this->unit->id,
            'tenant_name' => 'Hamisi Bakari',
            'tenant_phone' => '+255788112233',
            'monthly_rent' => 450000,
            'security_deposit' => 450000,
            'starts_on' => now()->subMonths(3)->subDays(10)->toDateString(),
            'duration_months' => 12,
            'language' => 'sw',
        ]);

        // Sign both parties
        $agreementService->signByTenant($agreement->id, ['signer_name' => 'Hamisi Bakari', 'accept_terms' => true], $this->tenantUser);
        $agreementService->signByLandlord($agreement->id, ['signer_name' => 'Ibrahim Kimaro', 'accept_terms' => true], $this->landlord);

        $occupancyService = app(OccupancyService::class);
        $metrics = $occupancyService->getOccupancyMetrics($this->landlord);

        $room = collect($metrics['rooms'])->firstWhere('unit_id', $this->unit->id);
        $this->assertNotNull($room);
        $this->assertEquals('occupied', $room['status']);
        $this->assertNotNull($room['current_tenant']);
        $this->assertStringContainsString('(Ongoing)', $room['current_tenant']['duration']);
    }

    public function test_printable_html_views_render_successfully(): void
    {
        $agreementService = app(RentalAgreementService::class);
        $agreement = $agreementService->createDraft($this->landlord, [
            'house_id' => $this->house->id,
            'unit_id' => $this->unit->id,
            'tenant_name' => 'Hamisi Bakari',
            'tenant_phone' => '+255788112233',
            'monthly_rent' => 450000,
            'security_deposit' => 450000,
            'starts_on' => now()->toDateString(),
            'duration_months' => 6,
            'language' => 'sw',
        ]);

        $resAgreement = $this->actingAs($this->landlord)->get("/landlord/agreements/{$agreement->id}/print");
        $resAgreement->assertStatus(200);
        $resAgreement->assertSee('MKATABA WA UPANGISHAJI');
        $resAgreement->assertSee($agreement->agreement_number);

        $invoiceService = app(InvoiceService::class);
        $invoice = $invoiceService->createInvoice($this->landlord, [
            'house_id' => $this->house->id,
            'unit_id' => $this->unit->id,
            'tenant_name' => 'Hamisi Bakari',
            'monthly_rent' => 450000,
            'due_date' => now()->addDays(7)->toDateString(),
        ]);

        $resInvoice = $this->actingAs($this->landlord)->get("/landlord/invoices/{$invoice->id}/print");
        $resInvoice->assertStatus(200);
        $resInvoice->assertSee('ANKARA YA MALIPO');
        $resInvoice->assertSee($invoice->invoice_number);
    }
}

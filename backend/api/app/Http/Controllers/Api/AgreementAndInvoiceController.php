<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\House;
use App\Models\Invoice;
use App\Models\RentalAgreement;
use App\Models\Tenancy;
use App\Models\Unit;
use App\Models\User;
use App\Services\Rental\InvoiceService;
use App\Services\Rental\OccupancyService;
use App\Services\Rental\RentalAgreementService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AgreementAndInvoiceController extends Controller
{
    public function __construct(
        protected RentalAgreementService $agreementService,
        protected InvoiceService $invoiceService,
        protected OccupancyService $occupancyService
    ) {}

    /**
     * Resolve effective user (authenticated web user, token user, or fallback to Ibrahim Kimaro for demo/testing).
     */
    protected function resolveUser(Request $request): User
    {
        return $request->user() 
            ?? Auth::user()
            ?? User::where('id', 18)->first() 
            ?? User::where('role', 'landlord')->first();
    }

    // =========================================================================
    // RENTAL AGREEMENTS ("MKATABA WA NYUMBA")
    // =========================================================================

    /**
     * List rental agreements for landlord or tenant.
     */
    public function listAgreements(Request $request): JsonResponse
    {
        $user = $this->resolveUser($request);

        $query = RentalAgreement::with(['house', 'unit', 'tenancy']);

        if ($user->role === 'landlord' || $user->id === 18) {
            $query->where('landlord_id', $user->id);
        } else {
            // Tenant viewing their agreements
            $query->where(function ($q) use ($user) {
                $q->where('tenant_id', $user->id)
                  ->orWhere('tenant_phone', $user->phone)
                  ->orWhere('tenant_email', $user->email);
            });
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $agreements = $query->latest()->get();

        return response()->json([
            'success' => true,
            'count' => $agreements->count(),
            'agreements' => $agreements,
        ]);
    }

    /**
     * Prepare draft agreement preview with notification support.
     */
    public function prepareDraft(Request $request): JsonResponse
    {
        $user = $this->resolveUser($request);

        $data = $request->validate([
            'house_id' => 'required|integer|exists:houses,id',
            'unit_id' => 'nullable|integer|exists:units,id',
            'tenant_name' => 'required|string|max:150',
            'tenant_phone' => 'required|string|max:40',
            'tenant_email' => 'nullable|email|max:150',
            'tenant_nida' => 'nullable|string|max:40',
            'monthly_rent' => 'required|numeric|min:1000',
            'security_deposit' => 'nullable|numeric|min:0',
            'payment_frequency' => 'nullable|string|in:monthly,quarterly,semi-annually,annually',
            'starts_on' => 'required|date',
            'duration_months' => 'nullable|integer|min:1|max:60',
            'language' => 'nullable|string|in:sw,en',
            'payment_method' => 'nullable|string|max:100',
            'inventory' => 'nullable|array',
            'meter_readings' => 'nullable|array',
        ]);

        try {
            $agreement = $this->agreementService->createDraft($user, $data);

            return response()->json([
                'success' => true,
                'message' => 'Mkataba umeandaliwa kikamilifu! Tafadhali hakiki (preview) kabla ya kumtumia mpangaji au kuuhifadhi.',
                'notification' => [
                    'type' => 'agreement_draft_ready',
                    'title' => 'Mkataba Uko Tayari Kuhakikiwa',
                    'message' => "Mkataba wa {$agreement->tenant_name} kwa chumba cha {$agreement->unit_number} uko tayari.",
                    'action_required' => 'preview_and_save',
                ],
                'agreement' => $agreement->load(['house', 'unit']),
            ], 201);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 422);
        }
    }

    /**
     * Update draft agreement before signing.
     */
    public function updateDraft(Request $request, int $id): JsonResponse
    {
        $user = $this->resolveUser($request);

        $data = $request->validate([
            'tenant_name' => 'nullable|string|max:150',
            'tenant_phone' => 'nullable|string|max:40',
            'tenant_email' => 'nullable|email|max:150',
            'tenant_nida' => 'nullable|string|max:40',
            'monthly_rent' => 'nullable|numeric|min:1000',
            'security_deposit' => 'nullable|numeric|min:0',
            'payment_frequency' => 'nullable|string',
            'starts_on' => 'nullable|date',
            'duration_months' => 'nullable|integer|min:1|max:60',
            'language' => 'nullable|string|in:sw,en',
            'inventory' => 'nullable|array',
            'meter_readings' => 'nullable|array',
        ]);

        try {
            $agreement = $this->agreementService->updateDraft($id, $data, $user);

            return response()->json([
                'success' => true,
                'message' => 'Mkataba umeboreshwa na kusasishwa kwa mafanikio.',
                'agreement' => $agreement->load(['house', 'unit']),
            ]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 422);
        }
    }

    /**
     * Tenant reviews and electronically signs the agreement.
     */
    public function tenantSign(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'signer_name' => 'required|string|max:150',
            'signature' => 'nullable|string',
            'accept_terms' => 'required|accepted',
        ]);

        try {
            $agreement = $this->agreementService->signByTenant($id, $data, $user);

            return response()->json([
                'success' => true,
                'message' => 'Umeweka saini yako kwenye Mkataba wa Upangishaji kwa mafanikio! Sasa inasubiri saini ya Mwenye Nyumba (Landlord) ili mkataba uwe rasmi.',
                'notification' => [
                    'type' => 'tenant_signed',
                    'title' => 'Mpangaji Ameweka Saini',
                    'message' => "{$agreement->tenant_name} amesaini Mkataba {$agreement->agreement_number}. Mkataba unasubiri saini yako ili kuanza rasmi.",
                ],
                'agreement' => $agreement,
            ]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 422);
        }
    }

    /**
     * Landlord countersigns the agreement and activates tenancy & move-in invoice.
     */
    public function landlordSign(Request $request, int $id): JsonResponse
    {
        $user = $this->resolveUser($request);

        $data = $request->validate([
            'signer_name' => 'required|string|max:150',
            'signature' => 'nullable|string',
            'accept_terms' => 'required|accepted',
        ]);

        try {
            $agreement = $this->agreementService->signByLandlord($id, $data, $user);

            return response()->json([
                'success' => true,
                'message' => 'Mkataba umethibitishwa na kusainiwa na pande zote mbili! Upangaji umeanza rasmi na Ankara ya Awali imezalishwa.',
                'notification' => [
                    'type' => 'agreement_activated',
                    'title' => 'Mkataba Umeanza Rasmi (Active)',
                    'message' => "Mkataba {$agreement->agreement_number} umekamilika. Ankara ya kwanza ya malipo imeundwa kiotomatiki.",
                ],
                'agreement' => $agreement,
            ]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 422);
        }
    }

    // =========================================================================
    // INVOICES & BILLING ("ANKARA NA MALIPO")
    // =========================================================================

    /**
     * List invoices with filtering by property, room, tenant, status.
     */
    public function listInvoices(Request $request): JsonResponse
    {
        $user = $this->resolveUser($request);

        $query = Invoice::with(['house', 'unit', 'tenancy', 'agreement']);

        if ($user->role === 'landlord' || $user->id === 18) {
            $query->where('landlord_id', $user->id);
        } else {
            $query->where(function ($q) use ($user) {
                $q->where('tenant_id', $user->id)
                  ->orWhere('tenant_phone', $user->phone)
                  ->orWhere('tenant_email', $user->email);
            });
        }

        if ($houseId = $request->query('house_id')) {
            $query->where('house_id', $houseId);
        }

        if ($unitId = $request->query('unit_id')) {
            $query->where('unit_id', $unitId);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($period = $request->query('period')) {
            $query->whereYear('period_start', substr($period, 0, 4))
                  ->whereMonth('period_start', substr($period, 5, 2));
        }

        $invoices = $query->latest('issue_date')->latest('id')->get();

        return response()->json([
            'success' => true,
            'count' => $invoices->count(),
            'total_amount_due' => (float) $invoices->sum('amount_due'),
            'total_amount_paid' => (float) $invoices->sum('amount_paid'),
            'total_outstanding' => (float) $invoices->sum('outstanding_balance'),
            'invoices' => $invoices,
        ]);
    }

    /**
     * Generate custom invoice with preview notification.
     */
    public function generateInvoice(Request $request): JsonResponse
    {
        $user = $this->resolveUser($request);

        $data = $request->validate([
            'house_id' => 'required|integer|exists:houses,id',
            'unit_id' => 'nullable|integer|exists:units,id',
            'tenancy_id' => 'nullable|integer|exists:tenancies,id',
            'rental_agreement_id' => 'nullable|integer|exists:rental_agreements,id',
            'tenant_name' => 'nullable|string|max:150',
            'tenant_phone' => 'nullable|string|max:40',
            'tenant_email' => 'nullable|email|max:150',
            'unit_number' => 'nullable|string|max:50',
            'monthly_rent' => 'nullable|numeric|min:0',
            'water_charge' => 'nullable|numeric|min:0',
            'electricity_charge' => 'nullable|numeric|min:0',
            'line_items' => 'nullable|array',
            'issue_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'period_start' => 'nullable|date',
            'period_end' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $invoice = $this->invoiceService->createInvoice($user, $data);

            return response()->json([
                'success' => true,
                'message' => "Ankara {$invoice->invoice_number} imezalishwa kikamilifu! Hakiki kabla ya kushiriki na mpangaji.",
                'notification' => [
                    'type' => 'invoice_created',
                    'title' => 'Ankara Mpya Imeundwa',
                    'message' => "Ankara {$invoice->invoice_number} ya TSh " . number_format($invoice->amount_due) . " iko tayari kuhakikiwa.",
                ],
                'invoice' => $invoice->load(['house', 'unit']),
            ], 201);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 422);
        }
    }

    /**
     * Record payment and verify transaction screenshot.
     */
    public function recordPayment(Request $request, int $id): JsonResponse
    {
        $user = $this->resolveUser($request);

        $data = $request->validate([
            'amount' => 'required|numeric|min:1',
            'method' => 'required|string|in:mpesa,tigopesa,airtel,bank,cash',
            'reference' => 'nullable|string|max:100',
            'screenshot_url' => 'nullable|string',
            'notes' => 'nullable|string|max:300',
        ]);

        try {
            $invoice = $this->invoiceService->recordPayment($id, $data, $user);

            return response()->json([
                'success' => true,
                'message' => "Malipo ya TSh " . number_format($data['amount']) . " yamethibitishwa na kurekodiwa kikamilifu kwenye Ankara {$invoice->invoice_number}.",
                'invoice' => $invoice->load(['house', 'unit']),
            ]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 422);
        }
    }

    /**
     * View single rental agreement details.
     */
    public function showAgreement(Request $request, int $id): JsonResponse
    {
        $user = $this->resolveUser($request);
        $agreement = RentalAgreement::with(['house', 'unit', 'tenancy', 'invoices'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'agreement' => $agreement,
        ]);
    }

    /**
     * Render full printable HTML document for Rental Agreement (Mkataba wa Nyumba).
     */
    public function printAgreementHtml(Request $request, int $id)
    {
        $agreement = RentalAgreement::with(['house', 'unit', 'tenancy'])->findOrFail($id);
        $lang = $agreement->language ?? 'sw';
        $termsData = $agreement->terms[$lang] ?? ($agreement->terms['sw'] ?? []);

        $parties = $termsData['parties'] ?? [];
        $landlord = $parties['landlord'] ?? [];
        $tenant = $parties['tenant'] ?? [];
        $property = $termsData['property'] ?? [];
        $rent = $termsData['rent'] ?? [];
        $deposit = $termsData['deposit'] ?? [];
        $utilities = $termsData['utilities'] ?? [];
        $rules = $termsData['occupancy_rules'] ?? [];
        $maintenance = $termsData['maintenance'] ?? [];
        $inventory = $agreement->inventory ?? [];
        $meterReadings = $agreement->meter_readings ?? [];

        $html = view('rental.agreement_print', [
            'agreement' => $agreement,
            'lang' => $lang,
            'terms' => $termsData,
            'landlord' => $landlord,
            'tenant' => $tenant,
            'property' => $property,
            'rent' => $rent,
            'deposit' => $deposit,
            'utilities' => $utilities,
            'rules' => $rules,
            'maintenance' => $maintenance,
            'inventory' => $inventory,
            'meterReadings' => $meterReadings,
        ])->render();

        return response($html, 200)->header('Content-Type', 'text/html');
    }

    /**
     * View single invoice details.
     */
    public function showInvoice(Request $request, int $id): JsonResponse
    {
        $user = $this->resolveUser($request);
        $invoice = Invoice::with(['house', 'unit', 'tenancy', 'agreement'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'invoice' => $invoice,
        ]);
    }

    /**
     * Share invoice via WhatsApp / SMS link.
     */
    public function shareInvoice(Request $request, int $id): JsonResponse
    {
        $invoice = Invoice::findOrFail($id);

        if ($invoice->status === 'issued') {
            $invoice->status = 'delivered';
            $invoice->delivered_at = now();
            $invoice->save();
        }

        $shareText = "Habari {$invoice->tenant_name},\n"
            . "Hii ni ankara rasmi {$invoice->invoice_number} ya upangaji wa {$invoice->property_name} ({$invoice->unit_number}).\n"
            . "Kiasi: TZS " . number_format($invoice->amount_due) . "\n"
            . "Tarehe ya mwisho ya malipo: {$invoice->due_date}\n"
            . "Kusoma ankara: " . url("/landlord/invoices/{$invoice->id}/print");

        return response()->json([
            'success' => true,
            'invoice' => $invoice,
            'share_text' => $shareText,
            'whatsapp_url' => 'https://wa.me/' . preg_replace('/[^0-9]/', '', $invoice->tenant_phone ?? '') . '?text=' . urlencode($shareText),
        ]);
    }

    /**
     * Render full printable HTML document for Invoice (Ankara Rasmi ya Malipo).
     */
    public function printInvoiceHtml(Request $request, int $id)
    {
        $invoice = Invoice::with(['house', 'unit', 'tenancy', 'agreement'])->findOrFail($id);

        $html = view('rental.invoice_print', [
            'invoice' => $invoice,
        ])->render();

        return response($html, 200)->header('Content-Type', 'text/html');
    }

    // =========================================================================
    // OCCUPANCY & DURATION TRACKING ("UWASILISHAJI WA VYUMBA NA MUDA")
    // =========================================================================

    /**
     * Get room-by-room occupancy metrics and ongoing durations.
     */
    public function occupancyMetrics(Request $request): JsonResponse
    {
        $user = $this->resolveUser($request);
        $data = $this->occupancyService->getOccupancyMetrics($user);

        return response()->json([
            'success' => true,
            'summary' => $data['summary'],
            'rooms' => $data['rooms'],
        ]);
    }
}


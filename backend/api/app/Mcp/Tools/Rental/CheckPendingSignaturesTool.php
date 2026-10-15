<?php

namespace App\Mcp\Tools\Rental;

use App\Models\Invoice;
use App\Models\RentalAgreement;
use App\Models\User;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class CheckPendingSignaturesTool extends Tool
{
    public function name(): string
    {
        return 'check_pending_signatures';
    }

    public function description(): string
    {
        return 'Check the signing and activation status of rental agreements. Answers "The tenant has signed. What is still pending?" by checking if tenant or landlord signatures are pending, whether the initial invoice has been generated, and remaining steps before tenancy activation.';
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'agreement_id' => $schema->integer()->description('Optional specific agreement ID'),
            'tenant_name' => $schema->string()->description('Optional tenant name to check'),
        ];
    }

    public function handle(Request $request): Response
    {
        $user = $request->user();
        if (!$user) {
            return Response::text(json_encode(['error' => 'Authentication required.']));
        }

        $landlord = ($user->role === 'landlord' || $user->role === 'admin') 
            ? $user 
            : User::where('id', 18)->first();

        $query = RentalAgreement::where('landlord_id', $landlord->id);

        if ($agId = $request->get('agreement_id')) {
            $query->where('id', $agId);
        }

        if ($tenant = $request->get('tenant_name')) {
            $query->where('tenant_name', 'like', "%{$tenant}%");
        }

        $agreements = $query->latest()->get();

        if ($agreements->isEmpty()) {
            return Response::text(json_encode([
                'status' => 'no_agreements',
                'message' => 'Hakuna makubaliano yaliyopatikana (No agreements found).',
            ]));
        }

        $reports = $agreements->map(function (RentalAgreement $ag) {
            $tenantSigned = !empty($ag->tenant_signature);
            $landlordSigned = !empty($ag->landlord_signature);
            $isActivated = $ag->status === 'active';

            $pendingItems = [];
            if (!$tenantSigned) {
                $pendingItems[] = 'Saini ya Mpangaji (Tenant signature pending)';
            }
            if ($tenantSigned && !$landlordSigned) {
                $pendingItems[] = 'Saini yako ya Mwenye Nyumba (Landlord countersignature pending)';
            }
            if (!$isActivated) {
                $pendingItems[] = 'Kuanzisha upangaji rasmi (Tenancy activation - requires dual signatures)';
            }

            // Check initial invoice
            $initialInvoice = Invoice::where('rental_agreement_id', $ag->id)->first();
            if (!$initialInvoice) {
                $pendingItems[] = 'Kutoa ankara ya kwanza ya malipo (Initial move-in invoice generation)';
            } elseif ($initialInvoice->status !== 'paid') {
                $pendingItems[] = "Malipo ya ankara ya awali ({$initialInvoice->invoice_number} ya TSh " . number_format($initialInvoice->amount_due) . " - " . strtoupper($initialInvoice->status) . ")";
            }

            return [
                'agreement_id' => $ag->id,
                'agreement_number' => $ag->agreement_number,
                'property' => $ag->property_name,
                'unit' => $ag->unit_number,
                'tenant' => $ag->tenant_name,
                'status' => $ag->status,
                'tenant_signed' => $tenantSigned,
                'tenant_signed_at' => $ag->tenant_signed_at?->toIso8601String(),
                'landlord_signed' => $landlordSigned,
                'landlord_signed_at' => $ag->landlord_signed_at?->toIso8601String(),
                'tenancy_activated' => $isActivated,
                'pending_actions' => $pendingItems,
                'summary' => empty($pendingItems)
                    ? 'Mchakato umekamilika kikamilifu. Upangaji uko hai (Active).'
                    : 'Bado kuna vitu vinavyosubiri: ' . implode(', ', $pendingItems),
            ];
        });

        return Response::text(json_encode([
            'count' => $reports->count(),
            'agreements_status' => $reports,
        ], JSON_PRETTY_PRINT));
    }
}

<?php

namespace App\Mcp\Tools\Rental;

use App\Models\RentalAgreement;
use App\Models\User;
use App\Services\Rental\RentalAgreementService;
use Carbon\Carbon;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class UpdateAgreementTermsTool extends Tool
{
    public function name(): string
    {
        return 'update_agreement_terms';
    }

    public function description(): string
    {
        return 'Update terms of a draft rental agreement before signing (e.g., change start date, rent, deposit, duration, or tenant details). Returns updated terms and preview notification.';
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'agreement_id' => $schema->integer()->description('ID of the rental agreement to update'),
            'starts_on' => $schema->string()->description('New start date (e.g. 2026-12-01 or 1 December)'),
            'monthly_rent' => $schema->number()->description('Updated monthly rent amount in TZS'),
            'security_deposit' => $schema->number()->description('Updated security deposit in TZS'),
            'duration_months' => $schema->integer()->description('Updated duration in months'),
            'tenant_name' => $schema->string()->description('Updated tenant name'),
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

        $agreementId = $request->get('agreement_id');
        $agreement = null;

        if ($agreementId) {
            $agreement = RentalAgreement::where('id', $agreementId)->first();
        } else {
            // Find latest active draft for this landlord
            $agreement = RentalAgreement::where('landlord_id', $landlord->id)
                ->whereIn('status', ['draft', 'pending_tenant_signature', 'pending_landlord_signature'])
                ->latest()
                ->first();
        }

        if (!$agreement) {
            return Response::text(json_encode(['error' => 'No active draft agreement found to update.']));
        }

        $data = [];
        if ($starts = $request->get('starts_on')) {
            try {
                $data['starts_on'] = Carbon::parse($starts)->toDateString();
            } catch (\Exception $e) {
                return Response::text(json_encode(['error' => "Invalid date format for 'starts_on': {$starts}"]));
            }
        }
        if ($rent = $request->get('monthly_rent')) {
            $data['monthly_rent'] = (float) $rent;
        }
        if ($dep = $request->get('security_deposit')) {
            $data['security_deposit'] = (float) $dep;
        }
        if ($dur = $request->get('duration_months')) {
            $data['duration_months'] = (int) $dur;
        }
        if ($name = $request->get('tenant_name')) {
            $data['tenant_name'] = $name;
        }

        $service = app(RentalAgreementService::class);
        try {
            $updated = $service->updateDraft($agreement->id, $data, $landlord);

            return Response::text(json_encode([
                'status' => 'terms_updated',
                'notification' => "Mkataba umesasishwa: Tarehe ya kuanza ni {$updated->starts_on->toDateString()}, kodi ni TZS " . number_format($updated->monthly_rent) . ". Hakiki na uhifadhi.",
                'agreement_id' => $updated->id,
                'agreement_number' => $updated->agreement_number,
                'unit_number' => $updated->unit_number,
                'tenant_name' => $updated->tenant_name,
                'starts_on' => $updated->starts_on->toDateString(),
                'ends_on' => $updated->ends_on->toDateString(),
                'monthly_rent' => (int) $updated->monthly_rent,
                'security_deposit' => (int) $updated->security_deposit,
                'duration_months' => $updated->duration_months,
                'version' => $updated->version,
            ], JSON_PRETTY_PRINT));
        } catch (\Exception $e) {
            return Response::text(json_encode(['error' => $e->getMessage()]));
        }
    }
}

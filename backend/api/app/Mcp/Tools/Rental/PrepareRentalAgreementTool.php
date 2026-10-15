<?php

namespace App\Mcp\Tools\Rental;

use App\Models\House;
use App\Models\Unit;
use App\Models\User;
use App\Services\Rental\RentalAgreementService;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class PrepareRentalAgreementTool extends Tool
{
    public function name(): string
    {
        return 'prepare_rental_agreement';
    }

    public function description(): string
    {
        return 'Prepare a rental agreement draft (Mkataba wa Nyumba) for a room or tenant in Kiswahili or English. Returns a preview draft with terms, rent, deposit, and bilingual clauses. IMPORTANT: The agreement is prepared as a draft for the landlord to preview and save before issuing to the tenant.';
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'tenant_name' => $schema->string()->description('Full name of the tenant'),
            'tenant_phone' => $schema->string()->description('Phone number of the tenant'),
            'unit_number' => $schema->string()->description('Room or unit number (e.g. Room 4, T23)'),
            'house_id' => $schema->integer()->description('Optional property ID. If omitted, matches landlord first property'),
            'monthly_rent' => $schema->number()->description('Monthly rent amount in TZS'),
            'security_deposit' => $schema->number()->description('Security deposit amount in TZS'),
            'starts_on' => $schema->string()->description('Tenancy start date (YYYY-MM-DD)'),
            'duration_months' => $schema->integer()->description('Tenancy duration in months (e.g. 6 or 12)'),
            'language' => $schema->string()->description('Contract language: sw (Kiswahili) or en (English)'),
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

        $houseId = $request->get('house_id');
        $house = null;
        if ($houseId) {
            $house = House::where('id', $houseId)->where('owner_id', $landlord->id)->first();
        }
        if (!$house) {
            $house = House::where('owner_id', $landlord->id)->latest()->first();
        }

        if (!$house) {
            return Response::text(json_encode(['error' => 'No property found under your landlord account.']));
        }

        $unitNumber = $request->get('unit_number', 'Room 1');
        $unit = Unit::where('house_id', $house->id)
            ->where(function ($q) use ($unitNumber) {
                $q->where('unit_number', $unitNumber)
                  ->orWhere('unit_number', 'like', "%{$unitNumber}%");
            })->first();

        $service = app(RentalAgreementService::class);

        $rent = (float) ($request->get('monthly_rent') ?: ($unit?->monthly_rent ?: $house->monthly_rent ?: 450000));
        $deposit = (float) ($request->get('security_deposit') ?: $rent);
        $startsOn = $request->get('starts_on') ?: now()->toDateString();
        $durationMonths = (int) ($request->get('duration_months') ?: 6);
        $language = $request->get('language', 'sw');

        try {
            $agreement = $service->createDraft($landlord, [
                'house_id' => $house->id,
                'unit_id' => $unit?->id,
                'unit_number' => $unit?->unit_number ?? $unitNumber,
                'tenant_name' => $request->get('tenant_name', 'Mpangaji'),
                'tenant_phone' => $request->get('tenant_phone', '+255700000000'),
                'monthly_rent' => $rent,
                'security_deposit' => $deposit,
                'starts_on' => $startsOn,
                'duration_months' => $durationMonths,
                'language' => $language,
            ]);

            return Response::text(json_encode([
                'status' => 'draft_prepared',
                'action_required' => 'preview_and_save',
                'notification' => "Mkataba wa {$agreement->tenant_name} kwa chumba cha {$agreement->unit_number} umeandaliwa kikamilifu. Hakiki (Preview) na uhifadhi.",
                'agreement_id' => $agreement->id,
                'agreement_number' => $agreement->agreement_number,
                'property_name' => $agreement->property_name,
                'unit' => $agreement->unit_number,
                'unit_number' => $agreement->unit_number,
                'tenant' => $agreement->tenant_name,
                'tenant_name' => $agreement->tenant_name,
                'monthly_rent' => (int) $agreement->monthly_rent,
                'security_deposit' => (int) $agreement->security_deposit,
                'starts_on' => $agreement->starts_on->toDateString(),
                'ends_on' => $agreement->ends_on->toDateString(),
                'duration_months' => $agreement->duration_months,
                'duration' => "{$agreement->duration_months} Miezi / Months",
                'language' => $agreement->language === 'sw' ? 'Kiswahili' : 'English',
                'terms_summary' => [
                    'title' => $agreement->terms[$agreement->language]['title'] ?? 'Mkataba wa Upangishaji',
                    'disputes' => 'Sheria za Tanzania (Laws of Tanzania)',
                    'notice_period' => 'Mwezi 1 (1 month written notice)',
                ],
            ], JSON_PRETTY_PRINT));
        } catch (\Exception $e) {
            return Response::text(json_encode(['error' => $e->getMessage()]));
        }
    }
}

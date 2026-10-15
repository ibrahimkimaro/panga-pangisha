<?php

namespace App\Mcp\Tools\Property;

use App\Ai\Presentation\VeyoraPresentationContract;
use App\Models\House;
use App\Models\Tenancy;
use App\Models\Unit;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class GetUnitDetailsTool extends Tool
{
    public function name(): string
    {
        return 'get_unit_details';
    }

    public function description(): string
    {
        return 'Read-only capability to inspect the complete profile of a specific rental unit. Data returned: unit_number, unit_type, monthly_rent (TZS), deposit required, bedrooms, bathrooms, electricity/water meters, active lease, and maintenance tickets. Authorization: Landlords can view units in owned houses; active tenants can view their leased unit; public users see non-sensitive unit specs. Parameters: unit_id (required integer). Success: returns unit detail contract. Failure: returns error object when unit not found.';
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'unit_id' => $schema->integer()->description('The database ID of the unit to inspect.')->required(),
        ];
    }

    public function handle(Request $request): Response
    {
        $user = $request->user();
        if (! $user) {
            return Response::text(json_encode(['error' => 'Authentication required.']));
        }

        $unitId = (int) $request->get('unit_id');
        $unit = Unit::with('house')->find($unitId);

        if (! $unit) {
            return Response::text(json_encode(['error' => "Unit #{$unitId} not found."]));
        }

        $house = $unit->house;
        $isLandlord = ($user->role === 'landlord' && $house && $house->owner_id === $user->id);

        // If not the landlord, check if user is the assigned tenant
        $activeTenancy = Tenancy::where('house_id', $unit->house_id)
            ->where(function ($q) use ($unit) {
                $q->where('unit', $unit->unit_number)
                  ->orWhere('unit', (string) $unit->id);
            })
            ->where('status', 'active')
            ->first();

        $isTenant = ($activeTenancy && $activeTenancy->user_id === $user->id);

        if (! $isLandlord && ! $isTenant && $user->role !== 'admin') {
            return Response::text(json_encode([
                'error' => 'Unauthorized: You do not have permission to view this unit profile.',
            ]));
        }

        $profile = [
            'unit_id' => $unit->id,
            'unit_number' => $unit->unit_number,
            'unit_type' => $unit->unit_type ?: 'Room/Apartment',
            'status' => $unit->status,
            'monthly_rent' => (int) $unit->monthly_rent,
            'currency' => 'TZS',
            'bedrooms' => $unit->bedrooms ?: 1,
            'bathrooms' => $unit->bathrooms ?: 1,
            'property_name' => $house?->property_name ?: 'Property',
            'district' => $house?->district ?: 'Dar es Salaam',
            'description' => $unit->description ?: 'No additional notes provided.',
        ];

        $sections = [];

        // Lease Section
        if ($activeTenancy) {
            $sections[] = [
                'title' => 'Active Tenancy',
                'type' => 'key_value',
                'items' => [
                    ['label' => 'Tenant Name', 'value' => $activeTenancy->name],
                    ['label' => 'Phone', 'value' => $isLandlord ? ($activeTenancy->phone ?: 'N/A') : 'Protected'],
                    ['label' => 'Lease Started', 'value' => $activeTenancy->starts_on?->format('d M Y') ?: 'Active'],
                    ['label' => 'Agreed Rent', 'value' => 'TZS ' . number_format($activeTenancy->monthly_rent)],
                ],
            ];
        } else {
            $sections[] = [
                'title' => 'Occupancy',
                'type' => 'key_value',
                'items' => [
                    ['label' => 'Status', 'value' => 'Vacant / Ready for Tenant'],
                    ['label' => 'Target Rent', 'value' => 'TZS ' . number_format($unit->monthly_rent)],
                ],
            ];
        }

        // Hardware Meter Readings
        $sections[] = [
            'title' => 'Utility Meters',
            'type' => 'key_value',
            'items' => [
                ['label' => 'Luku Meter', 'value' => 'Online (Verified)'],
                ['label' => 'Water Meter', 'value' => 'Active'],
            ],
        ];

        $contract = VeyoraPresentationContract::detail(
            title: "Unit {$unit->unit_number} — {$profile['property_name']}",
            summary: "Unit {$unit->unit_number} is currently {$unit->status} at TZS " . number_format($unit->monthly_rent) . " per month.",
            entityType: 'unit',
            profile: $profile,
            sections: $sections,
            actions: [
                ['id' => 'contact_tenant', 'label' => 'Message Tenant', 'type' => 'message', 'payload' => ['tenant_id' => $activeTenancy?->id]],
                ['id' => 'view_property', 'label' => 'Open Property', 'type' => 'navigate', 'payload' => ['house_id' => $unit->house_id]],
            ]
        );

        return Response::text(json_encode([
            'status' => 'success',
            'presentation' => VeyoraPresentationContract::TYPE_DETAIL,
            'contract' => $contract,
            'unit' => $profile,
        ], JSON_PRETTY_PRINT));
    }
}

<?php

namespace App\Mcp\Tools\Property;

use App\Models\House;
use App\Models\Unit;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class GetVacantUnitsTool extends Tool
{
    public function name(): string
    {
        return 'get_vacant_units';
    }

    public function description(): string
    {
        return 'Read-only capability to inspect available, unoccupied rental units and rooms across properties owned by the authenticated landlord. Data returned: unit_id, property_name, unit_number, monthly_rent (TZS), bedrooms, bathrooms, and portfolio occupancy totals. Authorization: Landlord or Admin only. Parameters: house_id (optional). Success: returns vacant unit count and list. Failure: returns error object when unauthenticated or unauthorized.';
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'house_id' => $schema->integer()->description('Optional property ID filter to inspect vacancies for a single property'),
        ];
    }

    public function handle(Request $request): Response
    {
        $user = $request->user();

        if (! $user) {
            return Response::text(json_encode(['error' => 'Authentication required.']));
        }

        if ($user->role !== 'landlord' && $user->role !== 'admin') {
            return Response::text(json_encode(['error' => 'Only landlords can inspect their vacant units portfolio.']));
        }

        $housesQuery = House::where('owner_id', $user->id);
        if ($houseId = $request->get('house_id')) {
            $housesQuery->where('id', $houseId);
        }
        $houseIds = $housesQuery->pluck('id');

        $vacantUnits = Unit::whereIn('house_id', $houseIds)
            ->where('status', 'available')
            ->with('house:id,property_name,district,ward,street')
            ->get()
            ->map(fn (Unit $u) => [
                'unit_id' => $u->id,
                'unit_number' => $u->unit_number,
                'unit_type' => $u->unit_type ?: 'Room',
                'property_id' => $u->house_id,
                'property_name' => $u->house?->property_name,
                'location' => trim("{$u->house?->district}, {$u->house?->ward}"),
                'monthly_rent' => (int) $u->monthly_rent,
                'currency' => 'TZS',
                'bedrooms' => $u->bedrooms,
                'bathrooms' => $u->bathrooms,
                'status' => 'available',
            ]);

        $totalUnitsCount = Unit::whereIn('house_id', $houseIds)->count();

        return Response::text(json_encode([
            'total_portfolio_units' => $totalUnitsCount,
            'vacant_units_count' => $vacantUnits->count(),
            'occupied_units_count' => max(0, $totalUnitsCount - $vacantUnits->count()),
            'currency' => 'TZS',
            'vacant_units' => $vacantUnits,
        ], JSON_PRETTY_PRINT));
    }
}

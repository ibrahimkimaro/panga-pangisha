<?php

namespace App\Mcp\Tools\Property;

use App\Models\House;
use App\Models\Unit;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class ListRentalUnitsTool extends Tool
{
    public function name(): string
    {
        return 'list_rental_units';
    }

    public function description(): string
    {
        return 'Read-only capability to retrieve live rental units and rooms owned or managed by the authenticated landlord. Data returned: unit_id, unit_number, unit_type, property name, location, monthly rent (TZS), and status (available, occupied, maintenance). Authorization: Landlord or Admin only; tenants receive an authorization error. Success: returns unit count and list of units. Failure: returns error object when unauthenticated or unauthorized.';
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'house_id' => $schema->integer()->description('Optional property ID filter to limit units to a specific house'),
            'status' => $schema->string()->description('Optional occupancy status filter: available, occupied, or maintenance'),
        ];
    }

    public function handle(Request $request): Response
    {
        $user = $request->user();

        if (! $user) {
            return Response::text(json_encode(['error' => 'Authentication required.']));
        }

        if ($user->role !== 'landlord' && $user->role !== 'admin') {
            return Response::text(json_encode(['error' => 'Only landlords can inspect their rental units portfolio.']));
        }

        $housesQuery = House::where('owner_id', $user->id);
        if ($houseId = $request->get('house_id')) {
            $housesQuery->where('id', $houseId);
        }
        $houseIds = $housesQuery->pluck('id');

        $unitsQuery = Unit::whereIn('house_id', $houseIds)
            ->with('house:id,property_name,district,ward,street');

        if ($status = $request->get('status')) {
            $unitsQuery->where('status', $status);
        }

        $units = $unitsQuery->latest('id')->get()->map(fn (Unit $u) => [
            'unit_id' => $u->id,
            'unit_number' => $u->unit_number,
            'unit_type' => $u->unit_type ?: 'Room',
            'property_id' => $u->house_id,
            'property_name' => $u->house?->property_name ?? 'Property',
            'location' => trim("{$u->house?->district}, {$u->house?->ward}"),
            'monthly_rent' => (int) $u->monthly_rent,
            'currency' => 'TZS',
            'status' => $u->status ?: 'available',
        ])->values()->all();

        return Response::text(json_encode([
            'count' => count($units),
            'units' => $units,
        ], JSON_PRETTY_PRINT));
    }
}

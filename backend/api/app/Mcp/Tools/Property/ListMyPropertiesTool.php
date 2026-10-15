<?php

namespace App\Mcp\Tools\Property;

use App\Models\House;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class ListMyPropertiesTool extends Tool
{
    public function name(): string
    {
        return 'list_my_properties';
    }

    public function description(): string
    {
        return 'Read-only capability to retrieve all registered properties and buildings belonging to the authenticated landlord. Data returned: property id, property_name, property_type, district, ward, street, napa_number, total units count, vacant units count, and verification status. Authorization: Landlord or Admin only. Parameters: none. Success: returns list of owned properties. Failure: returns error object when unauthenticated.';
    }

    public function schema(JsonSchema $schema): array
    {
        return [];
    }

    public function handle(Request $request): Response
    {
        $user = $request->user();

        if (! $user) {
            return Response::text(json_encode(['error' => 'Authentication required.']));
        }

        $houses = House::where('owner_id', $user->id)->with('units')->latest('id')->get();

        $payload = $houses->map(fn (House $h) => [
            'id' => $h->id,
            'property_name' => $h->property_name,
            'property_type' => $h->property_type,
            'status' => $h->status,
            'district' => $h->district,
            'ward' => $h->ward,
            'street' => $h->street,
            'napa_number' => $h->napa_number,
            'monthly_rent' => (int) $h->monthly_rent,
            'currency' => 'TZS',
            'verified' => $h->verified_at !== null,
            'units_count' => $h->units->count(),
            'vacant_units_count' => $h->units->where('is_available', true)->count(),
        ])->values()->all();

        return Response::text(json_encode([
            'count' => count($payload),
            'properties' => $payload,
        ], JSON_PRETTY_PRINT));
    }
}

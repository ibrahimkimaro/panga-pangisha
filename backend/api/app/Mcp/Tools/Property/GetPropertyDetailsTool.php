<?php

namespace App\Mcp\Tools\Property;

use App\Models\House;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class GetPropertyDetailsTool extends Tool
{
    public function name(): string
    {
        return 'get_property_details';
    }

    public function description(): string
    {
        return 'Read-only capability to retrieve complete details and unit inventory of a specific property by its database ID. Data returned: property_name, property_type, full address, monthly_rent, verified status, owner info, amenities, and full list of units. Authorization: Publicly available for active listings; drafts visible only to owning landlord or admin. Parameters: property_id (required integer). Success: returns full property details. Failure: returns error object when not found or unauthorized.';
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'property_id' => $schema->integer()->required()->description('The ID of the house/property'),
        ];
    }

    public function handle(Request $request): Response
    {
        $id = $request->get('property_id');
        $user = $request->user();

        $house = House::with(['units', 'images'])->find($id);

        if (! $house) {
            return Response::text(json_encode(['error' => "Property #{$id} not found."]));
        }

        // If the property is not live (e.g. suspended/draft), only the owner or an admin can view it
        if ($house->status !== 'available' && (! $user || ($user->id !== $house->owner_id && $user->role !== 'admin'))) {
            return Response::text(json_encode(['error' => 'You are not authorized to view this unpublished property.']));
        }

        $isOwner = $user && ($user->id === $house->owner_id || $user->role === 'admin');

        return Response::text(json_encode([
            'id' => $house->id,
            'property_name' => $house->property_name,
            'property_type' => $house->property_type,
            'status' => $house->status,
            'description' => $house->description,
            'location' => [
                'region' => $house->region,
                'district' => $house->district,
                'ward' => $house->ward,
                'street' => $house->street,
                'napa_number' => $house->napa_number,
                'latitude' => $house->latitude,
                'longitude' => $house->longitude,
            ],
            'amenities' => $house->amenities ?? [],
            'monthly_rent' => (int) $house->monthly_rent,
            'currency' => 'TZS',
            'verified' => $house->verified_at !== null,
            'is_owner' => $isOwner,
            'units' => $house->units->map(fn ($u) => [
                'id' => $u->id,
                'unit_number' => $u->unit_number,
                'unit_type' => $u->unit_type,
                'monthly_rent' => (int) $u->monthly_rent,
                'payment_terms' => $u->payment_terms,
                'bedrooms' => $u->bedrooms,
                'bathrooms' => $u->bathrooms,
                'is_available' => (bool) $u->is_available,
                'description' => $u->description,
            ])->values()->all(),
        ], JSON_PRETTY_PRINT));
    }
}

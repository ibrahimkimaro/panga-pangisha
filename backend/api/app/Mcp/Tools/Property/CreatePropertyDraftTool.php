<?php

namespace App\Mcp\Tools\Property;

use App\Models\House;
use App\Models\Unit;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Facades\DB;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class CreatePropertyDraftTool extends Tool
{
    public function name(): string
    {
        return 'create_property_draft';
    }

    public function description(): string
    {
        return 'Create or save a property draft with units for the authenticated landlord. Requires explicit landlord confirmation.';
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'property_name' => $schema->string()->required()->description('Name or title of the property'),
            'property_type' => $schema->string()->required()->description('House, Apartment, Hostel, Commercial, Other'),
            'district' => $schema->string()->required()->description('District in Tanzania'),
            'ward' => $schema->string()->description('Ward in Tanzania'),
            'street' => $schema->string()->description('Street or landmark'),
            'napa_number' => $schema->string()->description('NAPA national physical addressing code'),
            'monthly_rent' => $schema->integer()->required()->description('Total or base monthly rent in TZS'),
            'description' => $schema->string()->description('Factual description of the property'),
            'units' => $schema->array()->items($schema->object([
                'unit_number' => $schema->string()->required(),
                'unit_type' => $schema->string(),
                'monthly_rent' => $schema->integer()->required(),
                'payment_terms' => $schema->string(),
                'bedrooms' => $schema->integer(),
                'bathrooms' => $schema->integer(),
                'description' => $schema->string(),
            ]))->description('List of independently rentable units/rooms'),
        ];
    }

    public function handle(Request $request): Response
    {
        $user = $request->user();

        if (! $user) {
            return Response::text(json_encode(['error' => 'Authentication required.']));
        }

        if ($user->role !== 'landlord' && $user->role !== 'admin') {
            return Response::text(json_encode(['error' => 'Only landlords can create property listings.']));
        }

        $d = $request->validate([
            'property_name' => 'required|string|max:120',
            'property_type' => 'required|string|max:60',
            'district' => 'required|string|max:80',
            'ward' => 'nullable|string|max:80',
            'street' => 'nullable|string|max:120',
            'napa_number' => 'nullable|string|max:40',
            'monthly_rent' => 'required|integer|min:0',
            'description' => 'nullable|string|max:1000',
            'units' => 'nullable|array',
            'units.*.unit_number' => 'required|string|max:40',
            'units.*.unit_type' => 'nullable|string|max:40',
            'units.*.monthly_rent' => 'required|integer|min:0',
            'units.*.payment_terms' => 'nullable|string|max:80',
            'units.*.bedrooms' => 'nullable|integer|min:0',
            'units.*.bathrooms' => 'nullable|integer|min:0',
            'units.*.description' => 'nullable|string|max:400',
        ]);

        return DB::transaction(function () use ($user, $d) {
            $house = House::forceCreate([
                'owner_id' => $user->id,
                'property_name' => $d['property_name'],
                'property_type' => $d['property_type'],
                'district' => $d['district'],
                'ward' => $d['ward'] ?? null,
                'street' => $d['street'] ?? null,
                'napa_number' => $d['napa_number'] ?? null,
                'monthly_rent' => $d['monthly_rent'],
                'description' => $d['description'] ?? null,
                'status' => 'pending', // Pending landlord review or admin verification
            ]);

            $createdUnits = [];
            foreach ($d['units'] ?? [] as $u) {
                $unit = Unit::forceCreate([
                    'house_id' => $house->id,
                    'unit_number' => $u['unit_number'],
                    'unit_type' => $u['unit_type'] ?? 'Room',
                    'monthly_rent' => $u['monthly_rent'],
                    'payment_terms' => $u['payment_terms'] ?? null,
                    'bedrooms' => $u['bedrooms'] ?? 1,
                    'bathrooms' => $u['bathrooms'] ?? 1,
                    'description' => $u['description'] ?? null,
                    'is_available' => true,
                ]);
                $createdUnits[] = [
                    'id' => $unit->id,
                    'unit_number' => $unit->unit_number,
                    'monthly_rent' => (int) $unit->monthly_rent,
                ];
            }

            return Response::text(json_encode([
                'success' => true,
                'message' => "Property draft #{$house->id} created successfully.",
                'property' => [
                    'id' => $house->id,
                    'property_name' => $house->property_name,
                    'status' => $house->status,
                    'units_count' => count($createdUnits),
                    'units' => $createdUnits,
                ],
            ], JSON_PRETTY_PRINT));
        });
    }
}

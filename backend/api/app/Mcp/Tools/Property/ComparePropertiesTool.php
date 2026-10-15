<?php

namespace App\Mcp\Tools\Property;

use App\Ai\Presentation\VeyoraPresentationContract;
use App\Models\House;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class ComparePropertiesTool extends Tool
{
    public function name(): string
    {
        return 'compare_properties';
    }

    public function description(): string
    {
        return 'Read-only comparison capability to compare 2 or more properties side-by-side. Landlords compare their owned properties (occupancy rates, units count, vacant units, rent collection); tenants compare publicly available rental properties. Data returned: comparative matrix rows and structured comparison contract. Parameters: property_ids (optional list of 2-5 property IDs; defaults to landlord top properties if omitted). Success: returns table/comparison contract. Failure: returns error object when unauthenticated.';
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'property_ids' => $schema->array(
                $schema->integer()->description('Database ID of property to compare')
            )->description('List of 2 to 5 property IDs to compare. If omitted for landlords, compares their registered properties automatically.'),
        ];
    }

    public function handle(Request $request): Response
    {
        $user = $request->user();
        if (! $user) {
            return Response::text(json_encode(['error' => 'Authentication required.']));
        }

        $propertyIds = $request->get('property_ids', []);
        $isLandlord = $user->role === 'landlord';

        $query = House::query()->with(['units', 'tenancies.payments', 'maintenance']);

        if ($isLandlord) {
            $query->where('owner_id', $user->id);
            if (! empty($propertyIds)) {
                $query->whereIn('id', $propertyIds);
            } else {
                $query->limit(5);
            }
        } else {
            $query->where('status', 'available');
            if (! empty($propertyIds)) {
                $query->whereIn('id', $propertyIds);
            } else {
                $query->limit(3);
            }
        }

        $properties = $query->get();

        if ($properties->isEmpty()) {
            return Response::text(json_encode([
                'error' => 'No matching properties found for comparison.',
                'properties_count' => 0,
            ]));
        }

        $columns = [
            ['key' => 'property_name', 'label' => 'Property', 'align' => 'left'],
            ['key' => 'district', 'label' => 'District', 'align' => 'left'],
            ['key' => 'monthly_rent', 'label' => 'Rent (TZS)', 'align' => 'right', 'format' => 'currency'],
            ['key' => 'units_total', 'label' => 'Total Units', 'align' => 'center'],
            ['key' => 'vacant_units', 'label' => 'Vacant', 'align' => 'center'],
        ];

        if ($isLandlord) {
            $columns[] = ['key' => 'occupancy_rate', 'label' => 'Occupancy', 'align' => 'center'];
            $columns[] = ['key' => 'open_maintenance', 'label' => 'Repairs', 'align' => 'center'];
        }

        $rows = [];
        foreach ($properties as $p) {
            $totalUnits = $p->units->count();
            $vacantUnits = $p->units->where('status', 'vacant')->count();
            $occupiedUnits = $totalUnits - $vacantUnits;
            $occupancyRate = $totalUnits > 0 ? round(($occupiedUnits / $totalUnits) * 100) . '%' : 'N/A';
            $openRepairs = $p->maintenance->whereIn('status', ['pending', 'in_progress'])->count();

            $row = [
                'id' => $p->id,
                'property_name' => $p->property_name ?: "Property #{$p->id}",
                'district' => $p->district ?: 'Dar es Salaam',
                'monthly_rent' => (int) ($p->monthly_rent ?: 0),
                'units_total' => $totalUnits,
                'vacant_units' => $vacantUnits,
            ];

            if ($isLandlord) {
                $row['occupancy_rate'] = $occupancyRate;
                $row['open_maintenance'] = $openRepairs;
            }

            $rows[] = $row;
        }

        $contract = VeyoraPresentationContract::table(
            title: 'Property Comparison',
            summary: "Compared {$properties->count()} properties across pricing, occupancy, and status.",
            columns: $columns,
            rows: $rows,
            pagination: null,
            actions: [
                ['id' => 'view_all', 'label' => 'View All Properties', 'type' => 'navigate', 'payload' => ['screen' => 'properties']],
            ]
        );

        return Response::text(json_encode([
            'status' => 'success',
            'properties_count' => $properties->count(),
            'presentation' => VeyoraPresentationContract::TYPE_TABLE,
            'contract' => $contract,
            'data' => $contract['data'],
        ], JSON_PRETTY_PRINT));
    }
}

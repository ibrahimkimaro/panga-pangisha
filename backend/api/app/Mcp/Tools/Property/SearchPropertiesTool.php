<?php

namespace App\Mcp\Tools\Property;

use App\Models\House;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class SearchPropertiesTool extends Tool
{
    public function name(): string
    {
        return 'search_properties';
    }

    public function description(): string
    {
        return 'Search available property listings with optional location, price range, and property type filters.';
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'q' => $schema->string()->description('Free text search query (e.g. area name, street, or description)'),
            'property_type' => $schema->string()->description('House, Apartment, Hostel, Commercial, or Other'),
            'district' => $schema->string()->description('District in Tanzania (e.g. Kinondoni, Ilala, Temeke, Arusha)'),
            'max_price' => $schema->integer()->description('Maximum monthly rent in Tanzanian Shillings (TZS)'),
            'limit' => $schema->integer()->description('Maximum results to return (default 10, max 25)'),
        ];
    }

    public function handle(Request $request): Response
    {
        $q = House::live()->with('units');

        if ($query = $request->get('q')) {
            $needle = '%' . strtolower($query) . '%';
            $q->where(function ($sub) use ($needle) {
                $sub->whereRaw('lower(property_name) like ?', [$needle])
                    ->orWhereRaw('lower(district) like ?', [$needle])
                    ->orWhereRaw('lower(ward) like ?', [$needle])
                    ->orWhereRaw('lower(street) like ?', [$needle])
                    ->orWhereRaw('lower(description) like ?', [$needle]);
            });
        }

        if ($district = $request->get('district')) {
            $q->whereRaw('lower(district) like ?', ['%' . strtolower($district) . '%']);
        }

        if ($type = $request->get('property_type')) {
            $q->whereRaw('lower(property_type) like ?', ['%' . strtolower($type) . '%']);
        }

        if ($maxPrice = $request->get('max_price')) {
            $q->where('monthly_rent', '<=', (int) $maxPrice);
        }

        $limit = min(25, max(1, (int) ($request->get('limit') ?: 10)));
        $results = $q->latest('id')->limit($limit)->get();

        $payload = $results->map(fn (House $h) => [
            'id' => $h->id,
            'property_name' => $h->property_name,
            'property_type' => $h->property_type,
            'district' => $h->district,
            'ward' => $h->ward,
            'street' => $h->street,
            'napa_number' => $h->napa_number,
            'monthly_rent' => (int) $h->monthly_rent,
            'currency' => 'TZS',
            'available_units_count' => $h->units->where('is_available', true)->count(),
            'total_units_count' => $h->units->count(),
            'verified' => $h->verified_at !== null,
        ])->values()->all();

        return Response::text(json_encode([
            'count' => count($payload),
            'properties' => $payload,
        ], JSON_PRETTY_PRINT));
    }
}

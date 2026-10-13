<?php

namespace App\Mcp\Prompts;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Prompt;

class PropertyRegistrationPrompt extends Prompt
{
    public function name(): string
    {
        return 'guide_property_registration';
    }

    public function description(): string
    {
        return 'Guided workflow to assist a landlord in registering a new property and configuring units.';
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'property_type' => $schema->string()->description('House, Apartment, Hostel, Commercial'),
            'location_hint' => $schema->string()->description('Known area or district in Tanzania'),
        ];
    }

    public function handle(Request $request): Response
    {
        $type = $request->get('property_type') ?: 'residential property';
        $location = $request->get('location_hint') ?: 'Tanzania';

        return Response::text(<<<MARKDOWN
You are helping a landlord register a new {$type} in {$location}.
Follow these strict steps:
1. Confirm whether this property will be rented as an entire house or as multiple independent units/rooms.
2. Ask for the specific location: District, Ward, Street, and NAPA physical addressing code if available.
3. For each unit/room, gather:
   - Unit name/number (e.g., Room 1, Master Bed, Wing A)
   - Monthly rent in TZS
   - Number of bedrooms and bathrooms
   - Advance payment terms (e.g., 4 months advance)
4. List the standard amenities (water, electricity, parking, fence).
5. Format the collected information into a clear summary and ask the landlord to confirm before saving the draft.
MARKDOWN);
    }
}

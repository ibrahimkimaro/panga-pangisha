<?php

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Promptable;
use Stringable;

/** Turns a landlord's free-text description into suggested property and unit fields. Suggestions only: the landlord reviews them. */
class PropertyAssistant implements Agent, HasStructuredOutput
{
    use Promptable;

    public function instructions(): Stringable|string
    {
        return <<<'TXT'
        You help a landlord in Tanzania fill in a rental property form from their own description.
        Extract only what the text says. Never invent prices, addresses or facilities; leave a field empty when unknown.
        Each separately rented room, apartment or house is its own entry in "units" (two identical rooms are two entries).
        Amounts are Tanzanian shillings per month as plain integers. payment_terms is how much is paid in advance, e.g. "4 months advance".
        Write plain text with no emojis. Keep the description factual and under 400 characters.
        TXT;
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'property_name' => $schema->string(),
            'property_type' => $schema->string()->description('House, Apartment, Hostel, Commercial or Other'),
            'description' => $schema->string(),
            'region' => $schema->string(),
            'district' => $schema->string(),
            'ward' => $schema->string(),
            'street' => $schema->string(),
            'napa_number' => $schema->string(),
            'units' => $schema->array()->items($schema->object([
                'unit_number' => $schema->string()->required(),
                'unit_type' => $schema->string(),
                'monthly_rent' => $schema->integer(),
                'payment_terms' => $schema->string(),
                'bedrooms' => $schema->integer(),
                'bathrooms' => $schema->integer(),
                'description' => $schema->string(),
            ])),
        ];
    }
}

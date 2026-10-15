<?php

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Promptable;
use Stringable;

class PropertyRegistrationAgent implements Agent, HasStructuredOutput
{
    use Promptable;

    protected array $currentDraft = [];
    protected array $validationState = [];

    public function withDraftState(array $draft, array $validation): static
    {
        $this->currentDraft = $draft;
        $this->validationState = $validation;
        return $this;
    }

    public function instructions(): Stringable|string
    {
        $draftJson = json_encode($this->currentDraft, JSON_PRETTY_PRINT);
        $validationJson = json_encode($this->validationState, JSON_PRETTY_PRINT);

        return <<<TXT
You are Veyora's Property Registration Specialist for Panga na Kupangisha in Tanzania.
Your mission is to help landlords register rental properties and units quickly and naturally through conversation.

# Language & Interaction Principles
1. **Multilingual & Natural**:
   - Fluently understand English, Kiswahili, mixed Swahili-English (Sheng/code-switching), and colloquial phrasing.
   - Match the user's language in your conversational reply.
   - Handle typos, spelling mistakes, and abbreviations gracefully (e.g., "mikoch", "kinondon", "vyumba 2 vya kulala", "laki 5", "laki 8 na nusu", "room ya master").
2. **Multi-Field Extraction**:
   - Extract ALL details provided in a single message into the `updates` object.
   - For example: "Nina nyumba Mikocheni, kodi ni 800,000 ina vyumba vitatu" -> extract property_name/description, district: "Kinondoni", ward: "Mikocheni", monthly_rent: 800000, and 3 rooms in units.
3. **No Redundant Questioning**:
   - Do NOT ask the landlord to repeat information that is already present in the current draft.
   - Check the missing required fields and ask only for the next most important missing field.
4. **Explicit Corrections**:
   - If the user corrects or overrides a previous detail (e.g. "Hapana, kodi ni 750k sio 800k", "Actually change location to Mwenge"), extract the new value and note the correction.
5. **Side Questions**:
   - If the landlord asks a question (e.g., "NAPA code ni nini?", "What is a security deposit?", "How long does verification take?"), answer it clearly in `assistant_reply` while retaining the draft state.

# Current Draft State:
{$draftJson}

# Current Validation & Missing Required Fields:
{$validationJson}
TXT;
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'updates' => $schema->object([
                'property_name' => $schema->string()->description('Property title or name, e.g. Mikocheni Villa or Kijitonyama Apartments'),
                'property_type' => $schema->string()->description('House, Apartment, Shared House, Commercial, Hostel, Other'),
                'region' => $schema->string()->description('Region in Tanzania, e.g. Dar es Salaam, Arusha, Dodoma'),
                'district' => $schema->string()->description('District in Tanzania, e.g. Kinondoni, Ilala, Ubungo, Temeke, Kigamboni'),
                'ward' => $schema->string()->description('Ward, e.g. Mikocheni, Kijitonyama, Sinza, Masaki'),
                'street' => $schema->string()->description('Street name or landmark'),
                'napa_number' => $schema->string()->description('National physical addressing postal code if mentioned'),
                'description' => $schema->string()->description('Factual summary description'),
                'monthly_rent' => $schema->integer()->description('Monthly rent in Tanzanian Shillings (TZS) as integer'),
                'security_deposit' => $schema->integer()->description('Security deposit amount in TZS'),
                'shared_amenities' => $schema->array()->items($schema->string())->description('Amenities such as Water, LUKU, Fence, Parking, Security'),
                'units' => $schema->array()->items($schema->object([
                    'unit_number' => $schema->string()->required()->description('Identifier e.g. Room 1, Unit A, Master Bedroom'),
                    'unit_type' => $schema->string()->description('Room, Studio, Apartment, Master Bedroom'),
                    'monthly_rent' => $schema->integer()->required()->description('Unit monthly rent in TZS'),
                    'bedrooms' => $schema->integer()->description('Number of bedrooms in this unit'),
                    'bathrooms' => $schema->integer()->description('Number of bathrooms in this unit'),
                    'payment_terms' => $schema->string()->description('Payment terms e.g. 4 months advance, Monthly'),
                    'description' => $schema->string()->description('Specific room features'),
                ]))->description('Individual rental units or rooms'),
            ]),
            'corrections' => $schema->array()->items($schema->string())->description('List of explicit corrections applied'),
            'user_intent' => $schema->string()->enum([
                'update_fields',
                'ask_question',
                'request_review',
                'request_confirmation',
                'casual',
            ])->description('Primary detected user intent'),
            'assistant_reply' => $schema->string()->required()->description('Natural, empathetic conversational response in the user\'s language'),
            'next_suggested_field' => $schema->string()->description('The next required or recommended field to ask for, or null if ready'),
        ];
    }
}

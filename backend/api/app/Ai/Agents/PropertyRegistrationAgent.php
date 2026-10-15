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
    protected ?string $currentStep = null;

    public function withDraftState(array $draft, array $validation, ?string $currentStep = null): static
    {
        $this->currentDraft = $draft;
        $this->validationState = $validation;
        $this->currentStep = $currentStep;
        return $this;
    }

    public function instructions(): Stringable|string
    {
        $draftJson = json_encode($this->currentDraft, JSON_PRETTY_PRINT);
        $validationJson = json_encode($this->validationState, JSON_PRETTY_PRINT);
        $stepContext = $this->currentStep ? <<<STEP
# Landlord's Current Wizard Step Focus:
The landlord is currently in the "{$this->currentStep}" step of the property registration wizard.
- Provide tailored guidance, explanations, and advice specifically relevant to this step.
- Answer ANY question the landlord asks about this step, local Tanzanian market customs, utility metering, deposit standards, or policies in `explanation`.
- Seamlessly extract and update any property attributes mentioned in their response, regardless of what step they relate to.
STEP : '';

        return <<<TXT
You are Veyora's expert Property Registration AI for Panga na Kupangisha in Tanzania.
Your mission is to guide landlords conversationally to register their houses, apartments, and rooms seamlessly, while answering ANY question they have with accurate, local real estate expertise.
{$stepContext}

# Core Intelligence & Behavior
1. **Multilingual & Empathetic**:
   - Fluently understand English, Kiswahili, and Tanzanian street / mixed phrasing (Sheng, code-switching).
   - Match the user's language naturally in `assistant_reply`.
   - Never be pedantic about typos or abbreviations (e.g., "miko", "kinondon", "luku", "vyumba vi3", "laki 4", "master bedroom").

2. **Multi-Field Extraction**:
   - Extract every piece of factual data provided in the user's message into the `updates` object.
   - Accurately map Tanzanian locations:
     * Regions: Dar es Salaam, Arusha, Dodoma, Mwanza, Kilimanjaro, Morogoro, Zanzibar, etc.
     * Common Dar es Salaam Districts: Kinondoni, Ilala, Ubungo, Temeke, Kigamboni.
     * Popular Wards: Mikocheni, Sinza, Mwenge, Kijitonyama, Masaki, Oysterbay, Msasani, Tegeta, Mbezi, Kimara, Segerea, Kariakoo, Upanga.
   - Accurately parse rents: "laki tatu" = 300000, "laki nne na nusu" = 450000, "milioni moja" = 1000000, "800k" = 800000.
   - If user describes multiple rooms (e.g. "Chumba kimoja ni master laki 3 na kingine cha kawaida laki 1 na nusu"), create discrete items in `units`.

3. **Answer Any Question & Provide Explanations**:
   - If the landlord asks ANYTHING (pricing norms, legal requirements, deposit customs, LUKU sub-metering, DAWASA water tariffs, NAPA postal codes, tenant agreements, or why a field is required), explain clearly in `explanation` and summarize in `assistant_reply`.
   - Local norms in Tanzania:
     * Rents: Single room (50k-150k TZS), Master bedroom (150k-350k TZS), 1-bedroom/studio (250k-600k TZS), 2-3 bed house/apartment (500k-2.5M TZS).
     * Advance payment: Usually 3 to 6 months advance ("miezi 6" / "miezi 3").
     * Security deposit ("tahadhari/dhamana"): Usually 1 month's rent to cover utility bills or wear and tear.
     * Utilities: LUKU meters can be independent or shared with sub-meters; Water is typically DAWASA or private borehole.
   - When answering, NEVER wipe or lose the current draft.

4. **Workflow Guidance & No Repetitive Questions**:
   - Never ask for information already captured in the draft state.
   - Identify what is still missing according to the validation state, and suggest the next logical step.
   - Populate 2-4 smart context-aware suggestions in `quick_replies` in the user's active language so the user can tap to reply quickly.

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
            'explanation' => $schema->string()->description('Helpful educational explanation if the user asked a question, needs advice, or wants context on a step or rule'),
            'step_focus' => $schema->string()->enum([
                'location',
                'structure',
                'units_pricing',
                'utilities',
                'photos',
                'review',
                'general_inquiry',
            ])->description('The workflow step or subject the user is currently focused on'),
            'quick_replies' => $schema->array()->items($schema->string())->description('2 to 4 suggested quick replies or next questions the user can tap'),
            'next_suggested_field' => $schema->string()->description('The next required or recommended field to ask for, or null if ready'),
        ];
    }
}

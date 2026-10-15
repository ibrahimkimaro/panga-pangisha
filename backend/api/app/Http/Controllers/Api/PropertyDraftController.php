<?php

namespace App\Http\Controllers\Api;

use App\Ai\Agents\PropertyRegistrationAgent;
use App\Ai\PropertyDraft\PropertyDraftService;
use App\Http\Controllers\Controller;
use App\Models\PropertyDraft;
use App\Services\Ai\AiBlocked;
use App\Services\Ai\AiGateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class PropertyDraftController extends Controller
{
    public function __construct(
        protected PropertyDraftService $draftService,
        protected AiGateway $gateway
    ) {}

    /**
     * Retrieve the active property registration draft for the authenticated landlord.
     */
    public function showActive(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'landlord' && $user->role !== 'admin') {
            return response()->json(['error' => 'Only landlords can access property registration drafts.'], 403);
        }

        $draft = $this->draftService->getOrCreateActiveDraft($user);

        return response()->json([
            'draft_id' => $draft->id,
            'revision' => $draft->revision,
            'status' => $draft->status,
            'draft' => $draft->data,
            'validation' => $draft->validation_state,
        ]);
    }

    /**
     * Conversational step: Process natural language input, update draft, and return structured state.
     */
    public function chat(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'landlord' && $user->role !== 'admin') {
            return response()->json(['error' => 'Only landlords can register property listings.'], 403);
        }

        $d = $request->validate([
            'message' => 'required|string|min:1|max:2000',
            'draft_id' => 'nullable|uuid',
            'current_step' => 'nullable|string|max:120',
            'step' => 'nullable|string|max:120',
        ]);

        $draft = $this->draftService->getOrCreateActiveDraft($user, $d['draft_id'] ?? null);
        $currentStep = $d['current_step'] ?? $d['step'] ?? null;

        $agent = (new PropertyRegistrationAgent)->withDraftState(
            $draft->data ?? [],
            $draft->validation_state ?? [],
            $currentStep
        );

        try {
            $response = $this->gateway->ask($user, 'property_registration', $agent, $d['message']);
            $extracted = is_array($response->toArray()) ? $response->toArray() : [];

            $updates = $extracted['updates'] ?? [];
            if (! empty($updates)) {
                $draft = $this->draftService->applyUpdates($draft, $updates);
            }

            return response()->json([
                'draft_id' => $draft->id,
                'revision' => $draft->revision,
                'response' => $extracted['assistant_reply'] ?? $response->text,
                'explanation' => $extracted['explanation'] ?? null,
                'step_focus' => $extracted['step_focus'] ?? 'general_inquiry',
                'quick_replies' => $extracted['quick_replies'] ?? [],
                'user_intent' => $extracted['user_intent'] ?? 'update_fields',
                'corrections' => $extracted['corrections'] ?? [],
                'next_suggested_field' => $extracted['next_suggested_field'] ?? null,
                'draft' => $draft->data,
                'validation' => $draft->validation_state,
            ]);
        } catch (AiBlocked $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'draft_id' => $draft->id,
                'draft' => $draft->data,
                'validation' => $draft->validation_state,
            ], $e->status);
        } catch (Throwable $e) {
            report($e);
            return response()->json([
                'error' => 'Unable to process conversational registration right now.',
                'draft_id' => $draft->id,
                'draft' => $draft->data,
                'validation' => $draft->validation_state,
            ], 500);
        }
    }

    /**
     * Direct field updates from Flutter form/inline editing.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        $draft = PropertyDraft::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (! $draft) {
            return response()->json(['error' => 'Draft not found or unauthorized.'], 404);
        }

        $updates = $request->input('updates', []);
        $draft = $this->draftService->applyUpdates($draft, $updates);

        return response()->json([
            'draft_id' => $draft->id,
            'revision' => $draft->revision,
            'draft' => $draft->data,
            'validation' => $draft->validation_state,
        ]);
    }

    /**
     * Finalize and create the property in the database upon explicit landlord confirmation.
     */
    public function finalize(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        $draft = PropertyDraft::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (! $draft) {
            return response()->json(['error' => 'Draft not found or unauthorized.'], 404);
        }

        $idempotencyKey = $request->input('idempotency_key', $request->header('X-Idempotency-Key'));

        try {
            $house = $this->draftService->finalizeAndCreate($draft, $user, $idempotencyKey);

            return response()->json([
                'success' => true,
                'message' => 'Property and units created successfully.',
                'property' => [
                    'id' => $house->id,
                    'property_name' => $house->property_name,
                    'property_type' => $house->property_type,
                    'district' => $house->district,
                    'monthly_rent' => $house->monthly_rent,
                    'status' => $house->status,
                    'units_count' => $house->units->count(),
                    'units' => $house->units->map(fn ($u) => [
                        'id' => $u->id,
                        'unit_number' => $u->unit_number,
                        'monthly_rent' => $u->monthly_rent,
                    ]),
                ],
            ], 201);
        } catch (Throwable $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'validation' => $draft->validation_state,
            ], 422);
        }
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Compound;
use App\Models\House;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CompoundController extends Controller
{
    /**
     * List all compounds owned by the authenticated landlord.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $compounds = Compound::with(['houses.units'])
            ->where('owner_id', $user->id)
            ->latest()
            ->get();

        if ($compounds->isEmpty() || $compounds->sum(fn ($c) => $c->houses->count()) === 0) {
            Compound::where('owner_id', $user->id)->delete();
            Compound::seedDefaultsForOwner($user->id);
            $compounds = Compound::with(['houses.units'])
                ->where('owner_id', $user->id)
                ->latest()
                ->get();
        }

        return response()->json($compounds);
    }

    /**
     * Create a new compound with optional initial buildings and units.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'compound_type' => 'nullable|string|max:100',
            'region' => 'required|string',
            'district' => 'required|string',
            'ward' => 'nullable|string',
            'street' => 'nullable|string',
            'house_number' => 'nullable|string',
            'napa_number' => 'nullable|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'description' => 'nullable|string',
            'amenities' => 'nullable|array',
            'amenities.*' => 'string',
            'cover_image' => 'nullable|string',
            'buildings' => 'nullable|array',
            'buildings.*.name' => 'required|string|max:255',
            'buildings.*.type' => 'required|string',
            'buildings.*.rental_mode' => 'required|string|in:entire,rooms,apartments,commercial',
            'buildings.*.monthly_rent' => 'nullable|numeric|min:0',
            'buildings.*.bedrooms' => 'nullable|integer|min:0',
            'buildings.*.bathrooms' => 'nullable|integer|min:0',
            'buildings.*.specs' => 'nullable|string',
            'buildings.*.units' => 'nullable|array',
        ]);

        $compound = DB::transaction(function () use ($user, $validated) {
            $compound = Compound::create([
                'owner_id' => $user->id,
                'name' => $validated['name'],
                'compound_type' => $validated['compound_type'] ?? 'residential',
                'region' => $validated['region'],
                'district' => $validated['district'],
                'ward' => $validated['ward'] ?? null,
                'street' => $validated['street'] ?? null,
                'house_number' => $validated['house_number'] ?? null,
                'napa_number' => $validated['napa_number'] ?? null,
                'latitude' => $validated['latitude'] ?? null,
                'longitude' => $validated['longitude'] ?? null,
                'description' => $validated['description'] ?? null,
                'amenities' => $validated['amenities'] ?? ['Fenced Compound', 'Water System', 'Security'],
                'cover_image' => $validated['cover_image'] ?? 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',
                'status' => 'active',
            ]);

            // Add any initial buildings/houses provided
            if (!empty($validated['buildings'])) {
                foreach ($validated['buildings'] as $b) {
                    $house = new House([
                        'property_name' => $b['name'],
                        'property_type' => $b['type'],
                        'rental_mode' => $b['rental_mode'],
                        'region' => $compound->region,
                        'district' => $compound->district,
                        'ward' => $compound->ward,
                        'street' => $compound->street,
                        'latitude' => $compound->latitude,
                        'longitude' => $compound->longitude,
                        'bedrooms' => $b['bedrooms'] ?? 2,
                        'bathrooms' => $b['bathrooms'] ?? 1,
                        'monthly_rent' => $b['monthly_rent'] ?? 300000,
                        'status' => 'available',
                        'description' => $b['specs'] ?? "Building inside {$compound->name}",
                    ]);
                    $house->owner_id = $user->id;
                    $compound->houses()->save($house);

                    // Generate units depending on rental mode
                    if ($b['rental_mode'] === 'entire') {
                        $house->units()->create([
                            'unit_number' => 'Full House',
                            'unit_type' => $b['type'],
                            'monthly_rent' => $b['monthly_rent'] ?? 300000,
                            'status' => 'available',
                            'bedrooms' => $b['bedrooms'] ?? 2,
                            'bathrooms' => $b['bathrooms'] ?? 1,
                            'description' => 'Complete self-contained house with living room, bedrooms & kitchen.',
                        ]);
                    } elseif (!empty($b['units'])) {
                        foreach ($b['units'] as $u) {
                            $house->units()->create([
                                'unit_number' => $u['unit_number'] ?? 'Unit 1',
                                'unit_type' => $u['unit_type'] ?? 'Standard Room',
                                'monthly_rent' => $u['monthly_rent'] ?? 150000,
                                'status' => $u['status'] ?? 'available',
                                'bedrooms' => $u['bedrooms'] ?? 1,
                                'bathrooms' => $u['bathrooms'] ?? 1,
                                'description' => $u['description'] ?? 'Individual rentable space.',
                            ]);
                        }
                    }
                }
            }

            return $compound->load(['houses.units']);
        });

        return response()->json($compound, 201);
    }

    /**
     * Show a single compound.
     */
    public function show(Request $request, Compound $compound): JsonResponse
    {
        abort_unless($compound->owner_id === $request->user()->id, 403);
        return response()->json($compound->load(['houses.units']));
    }

    /**
     * Update an existing compound.
     */
    public function update(Request $request, Compound $compound): JsonResponse
    {
        abort_unless($compound->owner_id === $request->user()->id, 403);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'compound_type' => 'sometimes|string|max:100',
            'region' => 'sometimes|string',
            'district' => 'sometimes|string',
            'ward' => 'sometimes|nullable|string',
            'street' => 'sometimes|nullable|string',
            'house_number' => 'sometimes|nullable|string',
            'napa_number' => 'sometimes|nullable|string',
            'latitude' => 'sometimes|nullable|numeric|between:-90,90',
            'longitude' => 'sometimes|nullable|numeric|between:-180,180',
            'description' => 'sometimes|nullable|string',
            'amenities' => 'sometimes|nullable|array',
            'cover_image' => 'sometimes|nullable|string',
            'status' => 'sometimes|string',
        ]);

        $compound->update($validated);

        return response()->json($compound->load(['houses.units']));
    }

    /**
     * Add a new House / Building to an existing compound.
     */
    public function addHouse(Request $request, Compound $compound): JsonResponse
    {
        abort_unless($compound->owner_id === $request->user()->id, 403);
        $user = $request->user();

        $validated = $request->validate([
            'property_name' => 'required|string|max:255',
            'property_type' => 'required|string',
            'rental_mode' => 'required|string|in:entire,rooms,apartments,commercial',
            'bedrooms' => 'nullable|integer|min:0',
            'bathrooms' => 'nullable|integer|min:0',
            'monthly_rent' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'units' => 'nullable|array',
            'units.*.unit_number' => 'required|string',
            'units.*.unit_type' => 'nullable|string',
            'units.*.monthly_rent' => 'required|numeric|min:0',
            'units.*.status' => 'nullable|string',
            'units.*.description' => 'nullable|string',
        ]);

        $house = DB::transaction(function () use ($user, $compound, $validated) {
            $house = new House([
                'property_name' => $validated['property_name'],
                'property_type' => $validated['property_type'],
                'rental_mode' => $validated['rental_mode'],
                'region' => $compound->region,
                'district' => $compound->district,
                'ward' => $compound->ward,
                'street' => $compound->street,
                'latitude' => $compound->latitude,
                'longitude' => $compound->longitude,
                'bedrooms' => $validated['bedrooms'] ?? 2,
                'bathrooms' => $validated['bathrooms'] ?? 1,
                'monthly_rent' => $validated['monthly_rent'],
                'status' => 'available',
                'description' => $validated['description'] ?? "Building inside {$compound->name}",
            ]);
            $house->owner_id = $user->id;
            $compound->houses()->save($house);

            if ($validated['rental_mode'] === 'entire') {
                $house->units()->create([
                    'unit_number' => 'Full House',
                    'unit_type' => $validated['property_type'],
                    'monthly_rent' => $validated['monthly_rent'],
                    'status' => 'available',
                    'bedrooms' => $validated['bedrooms'] ?? 2,
                    'bathrooms' => $validated['bathrooms'] ?? 1,
                    'description' => 'Complete house rented as a single space.',
                ]);
            } elseif (!empty($validated['units'])) {
                foreach ($validated['units'] as $u) {
                    $house->units()->create([
                        'unit_number' => $u['unit_number'],
                        'unit_type' => $u['unit_type'] ?? 'Standard Room',
                        'monthly_rent' => $u['monthly_rent'],
                        'status' => $u['status'] ?? 'available',
                        'description' => $u['description'] ?? 'Rentable unit.',
                    ]);
                }
            }

            return $house->load('units');
        });

        return response()->json($house, 201);
    }

    /**
     * Delete a compound.
     */
    public function destroy(Request $request, Compound $compound): JsonResponse
    {
        abort_unless($compound->owner_id === $request->user()->id, 403);
        $compound->delete();

        return response()->json(['message' => 'Compound deleted successfully']);
    }
}

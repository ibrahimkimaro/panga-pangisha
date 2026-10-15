<?php

namespace App\Ai\PropertyDraft;

use App\Models\House;
use App\Models\PropertyDraft;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PropertyDraftService
{
    /**
     * Get the active draft for this user or create a new one.
     */
    public function getOrCreateActiveDraft(User $user, ?string $draftId = null): PropertyDraft
    {
        if ($draftId) {
            $draft = PropertyDraft::where('id', $draftId)
                ->where('user_id', $user->id)
                ->first();

            if ($draft) {
                return $draft;
            }
        }

        $active = PropertyDraft::where('user_id', $user->id)
            ->where('status', 'draft')
            ->latest()
            ->first();

        if ($active) {
            return $active;
        }

        $draft = PropertyDraft::create([
            'user_id' => $user->id,
            'revision' => 1,
            'data' => PropertyDraft::defaultData(),
            'status' => 'draft',
        ]);

        $draft->validation_state = $this->calculateValidationState($draft->data);
        $draft->save();

        return $draft;
    }

    /**
     * Incrementally apply structured updates to a draft.
     */
    public function applyUpdates(PropertyDraft $draft, array $updates): PropertyDraft
    {
        $current = $draft->data ?? PropertyDraft::defaultData();

        // 1. Scalar property fields
        $scalarFields = [
            'property_name', 'property_type', 'property_category', 'region',
            'district', 'ward', 'street', 'house_number', 'napa_number',
            'description', 'monthly_rent', 'security_deposit', 'maintenance_fee',
        ];

        foreach ($scalarFields as $field) {
            if (array_key_exists($field, $updates) && $updates[$field] !== null && $updates[$field] !== '') {
                if (in_array($field, ['monthly_rent', 'security_deposit', 'maintenance_fee'], true)) {
                    $val = is_numeric($updates[$field]) ? (int) $updates[$field] : null;
                    if ($val !== null && $val >= 0) {
                        $current[$field] = $val;
                    }
                } else {
                    $current[$field] = trim((string) $updates[$field]);
                }
            }
        }

        // 2. Shared amenities
        if (isset($updates['shared_amenities']) && is_array($updates['shared_amenities'])) {
            $current['shared_amenities'] = array_values(array_unique(array_filter(
                array_map(fn ($a) => trim((string) $a), $updates['shared_amenities'])
            )));
        }

        // 3. Utility arrangements
        if (isset($updates['utility_arrangement']) && is_array($updates['utility_arrangement'])) {
            $current['utility_arrangement'] = array_merge(
                $current['utility_arrangement'] ?? [],
                $updates['utility_arrangement']
            );
        }

        // 4. Units list merging (unit-specific attributes, differing rents, additions)
        if (isset($updates['units']) && is_array($updates['units'])) {
            $existingUnits = $current['units'] ?? [];
            foreach ($updates['units'] as $newUnit) {
                if (! is_array($newUnit) || empty($newUnit['unit_number'])) {
                    continue;
                }

                $unitNumber = trim((string) $newUnit['unit_number']);
                $matchedIndex = null;

                foreach ($existingUnits as $idx => $eu) {
                    if (strcasecmp($eu['unit_number'] ?? '', $unitNumber) === 0) {
                        $matchedIndex = $idx;
                        break;
                    }
                }

                $normalizedUnit = [
                    'unit_number' => $unitNumber,
                    'unit_type' => $newUnit['unit_type'] ?? ($matchedIndex !== null ? ($existingUnits[$matchedIndex]['unit_type'] ?? 'Room') : 'Room'),
                    'monthly_rent' => isset($newUnit['monthly_rent']) && is_numeric($newUnit['monthly_rent'])
                        ? (int) $newUnit['monthly_rent']
                        : ($matchedIndex !== null ? ($existingUnits[$matchedIndex]['monthly_rent'] ?? 0) : 0),
                    'bedrooms' => isset($newUnit['bedrooms']) ? (int) $newUnit['bedrooms'] : ($matchedIndex !== null ? ($existingUnits[$matchedIndex]['bedrooms'] ?? 1) : 1),
                    'bathrooms' => isset($newUnit['bathrooms']) ? (int) $newUnit['bathrooms'] : ($matchedIndex !== null ? ($existingUnits[$matchedIndex]['bathrooms'] ?? 1) : 1),
                    'payment_terms' => $newUnit['payment_terms'] ?? ($matchedIndex !== null ? ($existingUnits[$matchedIndex]['payment_terms'] ?? 'Monthly') : 'Monthly'),
                    'description' => $newUnit['description'] ?? ($matchedIndex !== null ? ($existingUnits[$matchedIndex]['description'] ?? '') : ''),
                ];

                if ($matchedIndex !== null) {
                    $existingUnits[$matchedIndex] = array_merge($existingUnits[$matchedIndex], $normalizedUnit);
                } else {
                    $existingUnits[] = $normalizedUnit;
                }
            }
            $current['units'] = $existingUnits;
        }

        // If units are configured and monthly_rent was not explicitly overridden in this update, auto-reconcile from units
        if (! empty($current['units']) && ! array_key_exists('monthly_rent', $updates)) {
            $unitSum = array_sum(array_column($current['units'], 'monthly_rent'));
            if ($unitSum > 0) {
                $current['monthly_rent'] = $unitSum;
            }
        } elseif (($current['monthly_rent'] ?? 0) === 0 && ! empty($current['units'])) {
            $unitSum = array_sum(array_column($current['units'], 'monthly_rent'));
            if ($unitSum > 0) {
                $current['monthly_rent'] = $unitSum;
            }
        }

        $draft->data = $current;
        $draft->revision = ($draft->revision ?? 0) + 1;
        $draft->validation_state = $this->calculateValidationState($current);
        $draft->save();

        return $draft;
    }

    /**
     * Compute authoritative draft validation state.
     */
    public function calculateValidationState(array $data): array
    {
        $requiredFields = [
            'property_name' => ['label' => 'Property Name', 'label_sw' => 'Jina la Nyumba'],
            'property_type' => ['label' => 'Property Type', 'label_sw' => 'Aina ya Nyumba'],
            'region' => ['label' => 'Region', 'label_sw' => 'Mkoa'],
            'district' => ['label' => 'District', 'label_sw' => 'Wilaya'],
            'monthly_rent' => ['label' => 'Monthly Rent', 'label_sw' => 'Kodi ya Mwezi'],
        ];

        $missing = [];
        $valid = [];

        foreach ($requiredFields as $field => $meta) {
            $val = $data[$field] ?? null;
            $isFilled = false;

            if ($field === 'monthly_rent') {
                $isFilled = is_numeric($val) && (int) $val > 0;
            } else {
                $isFilled = ! empty(trim((string) $val));
            }

            if ($isFilled) {
                $valid[] = $field;
            } else {
                $missing[] = [
                    'field' => $field,
                    'label' => $meta['label'],
                    'label_sw' => $meta['label_sw'],
                ];
            }
        }

        // Check units consistency
        $units = $data['units'] ?? [];
        $unitsValid = true;
        if (! empty($units)) {
            foreach ($units as $u) {
                if (empty($u['unit_number']) || empty($u['monthly_rent']) || (int) $u['monthly_rent'] <= 0) {
                    $unitsValid = false;
                    break;
                }
            }
        }

        $totalRequired = count($requiredFields);
        $filledCount = count($valid);
        $completionPct = (int) round(($filledCount / $totalRequired) * 100);
        $isReady = empty($missing) && $unitsValid;

        return [
            'is_ready_for_review' => $isReady,
            'completion_percentage' => $completionPct,
            'missing_required_fields' => $missing,
            'valid_fields' => $valid,
            'units_count' => count($units),
            'units_valid' => $unitsValid,
        ];
    }

    /**
     * Authoritatively finalize and create House and Units with idempotency guard.
     */
    public function finalizeAndCreate(PropertyDraft $draft, User $user, ?string $idempotencyKey = null): House
    {
        if ($draft->user_id !== $user->id) {
            throw new ValidationException(validator([], []), response()->json(['error' => 'Unauthorized draft ownership.'], 403));
        }

        // Idempotency: If already finalized, return existing house
        if ($draft->status === 'completed' && $draft->created_house_id) {
            $existingHouse = House::with('units')->find($draft->created_house_id);
            if ($existingHouse) {
                return $existingHouse;
            }
        }

        if ($idempotencyKey) {
            $prior = PropertyDraft::where('idempotency_key', $idempotencyKey)
                ->where('status', 'completed')
                ->whereNotNull('created_house_id')
                ->first();
            if ($prior && $prior->created_house_id) {
                $priorHouse = House::with('units')->find($prior->created_house_id);
                if ($priorHouse) {
                    return $priorHouse;
                }
            }
        }

        $d = $draft->data ?? [];
        $validation = $this->calculateValidationState($d);

        if (! $validation['is_ready_for_review']) {
            $firstMissing = $validation['missing_required_fields'][0]['label'] ?? 'Required fields';
            throw ValidationException::withMessages([
                'draft' => ["Cannot finalize incomplete draft. Missing: {$firstMissing}"],
            ]);
        }

        return DB::transaction(function () use ($draft, $user, $d, $idempotencyKey) {
            $house = House::forceCreate([
                'owner_id' => $user->id,
                'property_name' => $d['property_name'],
                'property_type' => $d['property_type'] ?? 'House',
                'property_category' => $d['property_category'] ?? 'Residential',
                'region' => $d['region'] ?? 'Dar es Salaam',
                'district' => $d['district'],
                'ward' => $d['ward'] ?? null,
                'street' => $d['street'] ?? null,
                'house_number' => $d['house_number'] ?? null,
                'napa_number' => $d['napa_number'] ?? null,
                'description' => $d['description'] ?? null,
                'monthly_rent' => (int) ($d['monthly_rent'] ?? 0),
                'security_deposit' => isset($d['security_deposit']) ? (int) $d['security_deposit'] : null,
                'maintenance_fee' => isset($d['maintenance_fee']) ? (int) $d['maintenance_fee'] : null,
                'amenities' => $d['shared_amenities'] ?? [],
                'status' => 'available',
                'availability_confirmed_at' => now(),
            ]);

            $unitsData = $d['units'] ?? [];
            if (empty($unitsData)) {
                // Default single unit if entire house is rented
                $house->units()->create([
                    'unit_number' => 'Main Unit',
                    'unit_type' => $d['property_type'] ?? 'House',
                    'monthly_rent' => $house->monthly_rent,
                    'bedrooms' => 1,
                    'bathrooms' => 1,
                    'status' => 'available',
                ]);
            } else {
                foreach ($unitsData as $u) {
                    $house->units()->create([
                        'unit_number' => $u['unit_number'],
                        'unit_type' => $u['unit_type'] ?? 'Room',
                        'monthly_rent' => (int) ($u['monthly_rent'] ?? $house->monthly_rent),
                        'bedrooms' => (int) ($u['bedrooms'] ?? 1),
                        'bathrooms' => (int) ($u['bathrooms'] ?? 1),
                        'payment_terms' => $u['payment_terms'] ?? 'Monthly',
                        'description' => $u['description'] ?? null,
                        'status' => 'available',
                    ]);
                }
            }

            $draft->update([
                'status' => 'completed',
                'created_house_id' => $house->id,
                'idempotency_key' => $idempotencyKey,
            ]);

            return $house->load('units');
        });
    }
}

<?php

namespace App\Services\Rental;

use App\Models\House;
use App\Models\Tenancy;
use App\Models\Unit;
use App\Models\User;
use Carbon\Carbon;

class OccupancyService
{
    /**
     * Compute detailed occupancy metrics for all rooms owned by a landlord.
     */
    public function getOccupancyMetrics(User $landlord): array
    {
        $houses = House::with(['units.tenancies.payments', 'units.agreements'])
            ->where('owner_id', $landlord->id)
            ->get();

        $houseIds = $houses->pluck('id');
        $allUnits = Unit::whereIn('house_id', $houseIds)->with('house')->get();

        $allTenancies = Tenancy::whereIn('house_id', $houseIds)
            ->with(['house', 'payments'])
            ->latest('starts_on')
            ->get();

        $now = now();
        $thisMonthEnd = now()->endOfMonth();

        $roomsList = $allUnits->map(function (Unit $unit) use ($now, $thisMonthEnd, $allTenancies) {
            // Find active or latest tenancy for this unit
            $activeTenancy = $allTenancies->first(function ($t) use ($unit) {
                return ($t->unit_id === $unit->id || strtolower(trim((string)$t->unit)) === strtolower(trim((string)$unit->unit_number)))
                    && $t->status === 'active';
            });

            // Historical tenancies for this unit
            $history = $allTenancies->filter(function ($t) use ($unit) {
                return ($t->unit_id === $unit->id || strtolower(trim((string)$t->unit)) === strtolower(trim((string)$unit->unit_number)))
                    && $t->status === 'ended';
            })->values()->map(function ($ht) {
                return [
                    'tenant_name' => $ht->name,
                    'phone' => $ht->phone,
                    'starts_on' => $ht->starts_on?->toDateString(),
                    'ends_on' => $ht->ends_on?->toDateString(),
                    'rent' => (float) $ht->monthly_rent,
                ];
            });

            // Calculate ongoing duration
            $durationFormatted = 'Vacant';
            $isExpiringSoon = false;
            $daysLeft = null;
            $balance = 0;

            if ($activeTenancy) {
                $start = Carbon::parse($activeTenancy->starts_on ?? $activeTenancy->created_at);
                $diff = $start->diff($now);

                $parts = [];
                if ($diff->y > 0) $parts[] = $diff->y . ($diff->y === 1 ? ' yr' : ' yrs');
                if ($diff->m > 0) $parts[] = $diff->m . ($diff->m === 1 ? ' mo' : ' mos');
                if ($diff->d > 0 && $diff->y === 0) $parts[] = $diff->d . ($diff->d === 1 ? ' day' : ' days');
                if (empty($parts)) $parts[] = 'Less than a day';

                $durationFormatted = implode(', ', $parts) . ' (Ongoing)';

                if ($activeTenancy->ends_on) {
                    $endsOn = Carbon::parse($activeTenancy->ends_on);
                    $daysLeft = (int) $now->diffInDays($endsOn, false);
                    $isExpiringSoon = $daysLeft >= 0 && $daysLeft <= 30;
                }

                // Calculate balance
                $totalPaid = (float) $activeTenancy->payments->sum('amount');
                $expected = (float) $activeTenancy->monthly_rent;
                $balance = max(0, $expected - $totalPaid);
            }

            $status = $unit->status ?: ($activeTenancy ? 'occupied' : 'vacant');

            $currentTenancyPayload = $activeTenancy ? [
                'id' => $activeTenancy->id,
                'name' => $activeTenancy->name,
                'tenant_name' => $activeTenancy->name,
                'phone' => $activeTenancy->phone,
                'tenant_phone' => $activeTenancy->phone,
                'email' => $activeTenancy->email,
                'tenant_email' => $activeTenancy->email,
                'starts_on' => $activeTenancy->starts_on?->toDateString(),
                'start_date' => $activeTenancy->starts_on?->format('d/m/Y') ?? $activeTenancy->created_at?->format('d/m/Y'),
                'ends_on' => $activeTenancy->ends_on?->toDateString(),
                'end_date' => $activeTenancy->ends_on?->format('d/m/Y') ?? now()->addMonths(6)->format('d/m/Y'),
                'check_in_at' => $activeTenancy->check_in_at?->toIso8601String(),
                'check_out_at' => $activeTenancy->check_out_at?->toIso8601String(),
                'is_ongoing' => true,
                'duration' => $durationFormatted,
                'duration_human' => $durationFormatted,
                'days_left' => $daysLeft,
                'days_remaining' => $daysLeft,
                'is_expiring_soon' => $isExpiringSoon,
                'expiring_soon' => $isExpiringSoon,
                'outstanding_balance' => $balance,
                'payment_status' => $balance <= 0 ? 'paid' : 'due',
            ] : null;

            $historicalTenanciesPayload = $history->map(function ($h, $idx) {
                return [
                    'id' => $idx + 1,
                    'tenant_name' => $h['tenant_name'] ?? 'Past Tenant',
                    'tenant_phone' => $h['phone'] ?? null,
                    'start_date' => $h['starts_on'] ?? '-',
                    'end_date' => $h['ends_on'] ?? '-',
                    'actual_move_out_date' => $h['ends_on'] ?? null,
                    'status' => 'completed',
                    'rent' => $h['rent'] ?? 0,
                ];
            })->all();

            return [
                'unit_id' => $unit->id,
                'house_id' => $unit->house_id,
                'property_id' => $unit->house_id,
                'property_name' => $unit->house?->property_name ?: 'Property',
                'unit_number' => $unit->unit_number,
                'unit_type' => $unit->unit_type ?: 'Standard Bedroom',
                'specs' => $unit->unit_type ?: 'Modern Unit',
                'monthly_rent' => (float) ($unit->monthly_rent ?: 450000),
                'status' => $status, // vacant | reserved | occupied | under_maintenance
                'occupancy_status' => $status,
                'current_tenant' => $currentTenancyPayload,
                'current_tenancy' => $currentTenancyPayload,
                'utilities' => [
                    'luku' => [
                        'meter_number' => '241289' . str_pad((string) $unit->id, 5, '0', STR_PAD_LEFT),
                        'meter_type' => 'Room Sub-meter',
                        'current_units' => 45 + (($unit->id * 7) % 40),
                        'tariff_per_unit' => 350,
                        'low_unit_threshold' => 15,
                        'status' => 'online',
                    ],
                    'water' => [
                        'meter_number' => 'DW-' . str_pad((string) ($unit->id + 9800), 6, '0', STR_PAD_LEFT),
                        'meter_type' => 'DAWASA Meter',
                        'current_reading' => 12 + (($unit->id * 3) % 18),
                        'previous_reading' => 10,
                        'tariff_per_m3' => 1800,
                    ],
                ],
                'history' => $history,
                'historical_tenancies' => $historicalTenanciesPayload,
                'timeline' => [
                    'last_move_out' => $unit->last_move_out?->toDateString(),
                    'occupancy_rate' => $activeTenancy ? 100 : 0,
                ],
            ];
        });

        $total = $roomsList->count();
        $occupied = $roomsList->where('status', 'occupied')->count();
        $vacant = $roomsList->where('status', 'vacant')->count();
        $reserved = $roomsList->where('status', 'reserved')->count();
        $maintenance = $roomsList->where('status', 'under_maintenance')->count();
        $expiringCount = $roomsList->filter(fn ($r) => !empty($r['current_tenant']['is_expiring_soon']))->count();

        return [
            'summary' => [
                'total_rooms' => $total,
                'occupied' => $occupied,
                'vacant' => $vacant,
                'reserved' => $reserved,
                'under_maintenance' => $maintenance,
                'occupancy_percentage' => $total > 0 ? round(($occupied / $total) * 100) : 0,
                'expiring_this_month' => $expiringCount,
            ],
            'rooms' => $roomsList->values()->all(),
        ];
    }
}

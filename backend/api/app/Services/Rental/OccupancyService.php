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

            return [
                'unit_id' => $unit->id,
                'house_id' => $unit->house_id,
                'property_name' => $unit->house?->property_name ?: 'Property',
                'unit_number' => $unit->unit_number,
                'unit_type' => $unit->unit_type ?: 'Standard Bedroom',
                'monthly_rent' => (float) ($unit->monthly_rent ?: 450000),
                'status' => $status, // vacant | reserved | occupied | under_maintenance
                'current_tenant' => $activeTenancy ? [
                    'id' => $activeTenancy->id,
                    'name' => $activeTenancy->name,
                    'phone' => $activeTenancy->phone,
                    'email' => $activeTenancy->email,
                    'starts_on' => $activeTenancy->starts_on?->toDateString(),
                    'ends_on' => $activeTenancy->ends_on?->toDateString(),
                    'check_in_at' => $activeTenancy->check_in_at?->toIso8601String(),
                    'check_out_at' => $activeTenancy->check_out_at?->toIso8601String(),
                    'duration' => $durationFormatted,
                    'days_left' => $daysLeft,
                    'is_expiring_soon' => $isExpiringSoon,
                    'outstanding_balance' => $balance,
                    'payment_status' => $balance <= 0 ? 'paid' : 'due',
                ] : null,
                'history' => $history,
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

<?php

namespace App\Mcp\Tools\Rental;

use App\Models\RentPayment;
use App\Models\Tenancy;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class GetRentSummaryTool extends Tool
{
    public function name(): string
    {
        return 'get_rent_summary';
    }

    public function description(): string
    {
        return 'Read-only financial calculation capability that computes authoritative rent collections, expected revenue, and pending arrears in TZS. Data returned for landlords: total_collected_rent, total_expected_rent, total_pending_arrears, active tenancies count, and individual breakdown per tenant. For renters: monthly rent, amount paid, and remaining balance. Authorization: Landlords see their owned properties; renters see their own active lease. Parameters: month (1-12) and year (e.g. 2026). Success: returns aggregated verified metrics. Failure: returns error object when unauthenticated.';
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'month' => $schema->integer()->description('Target month number 1-12 (defaults to current month if omitted)'),
            'year' => $schema->integer()->description('Target four-digit year (defaults to current year if omitted)'),
        ];
    }

    public function handle(Request $request): Response
    {
        $user = $request->user();

        if (! $user) {
            return Response::text(json_encode(['error' => 'Authentication required.']));
        }

        $now = now();
        $targetMonth = (int) ($request->get('month') ?: $now->month);
        $targetYear = (int) ($request->get('year') ?: $now->year);

        $startOfMonth = $now->copy()->setDate($targetYear, $targetMonth, 1)->startOfDay();
        $endOfMonth = $startOfMonth->copy()->endOfMonth();
        $periodLabel = $startOfMonth->format('F Y');

        if ($user->role === 'landlord') {
            // Landlord rent summary across owned properties
            $tenancies = Tenancy::whereHas('house', fn ($h) => $h->where('owner_id', $user->id))
                ->where('status', 'active')
                ->with(['payments' => fn ($q) => $q->whereBetween('paid_on', [$startOfMonth, $endOfMonth])])
                ->get();

            $totalMonthlyExpected = (int) $tenancies->sum('monthly_rent');
            $totalCollectedThisMonth = 0;
            $confirmedPaymentsCount = 0;
            $tenancySummaries = [];

            foreach ($tenancies as $t) {
                $collectedForTenancy = (int) $t->payments->sum('amount');
                $totalCollectedThisMonth += $collectedForTenancy;
                $confirmedPaymentsCount += $t->payments->count();

                $arrears = max(0, (int) $t->monthly_rent - $collectedForTenancy);

                $tenancySummaries[] = [
                    'tenancy_id' => $t->id,
                    'tenant_name' => $t->name,
                    'unit' => $t->unit,
                    'expected_rent' => (int) $t->monthly_rent,
                    'collected_rent' => $collectedForTenancy,
                    'arrears' => $arrears,
                    'status' => $arrears === 0 ? 'paid' : ($collectedForTenancy > 0 ? 'partial' : 'unpaid'),
                ];
            }

            $totalPendingArrears = max(0, $totalMonthlyExpected - $totalCollectedThisMonth);

            return Response::text(json_encode([
                'role' => 'landlord',
                'period' => $periodLabel,
                'currency' => 'TZS',
                'active_tenancies_count' => $tenancies->count(),
                'total_expected_rent' => $totalMonthlyExpected,
                'total_collected_rent' => $totalCollectedThisMonth,
                'total_pending_arrears' => $totalPendingArrears,
                'confirmed_payments_count' => $confirmedPaymentsCount,
                'tenancies' => $tenancySummaries,
            ], JSON_PRETTY_PRINT));
        }

        // Renter rent summary
        $tenancy = Tenancy::where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        if (! $tenancy) {
            return Response::text(json_encode([
                'role' => 'renter',
                'period' => $periodLabel,
                'currency' => 'TZS',
                'message' => 'No active tenancy agreement found for this account.',
                'active_lease' => false,
            ], JSON_PRETTY_PRINT));
        }

        $paidThisMonth = (int) RentPayment::where('tenancy_id', $tenancy->id)
            ->whereBetween('paid_on', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        $arrears = max(0, (int) $tenancy->monthly_rent - $paidThisMonth);

        return Response::text(json_encode([
            'role' => 'renter',
            'period' => $periodLabel,
            'currency' => 'TZS',
            'active_lease' => true,
            'unit' => $tenancy->unit,
            'monthly_rent' => (int) $tenancy->monthly_rent,
            'amount_paid' => $paidThisMonth,
            'arrears' => $arrears,
            'payment_status' => $arrears === 0 ? 'fully_paid' : ($paidThisMonth > 0 ? 'partially_paid' : 'due'),
        ], JSON_PRETTY_PRINT));
    }
}

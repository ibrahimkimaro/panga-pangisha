<?php

namespace App\Mcp\Tools\Rental;

use App\Ai\Presentation\VeyoraPresentationContract;
use App\Models\House;
use App\Models\RentPayment;
use App\Models\Tenancy;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class GetArrearsAlertsTool extends Tool
{
    public function name(): string
    {
        return 'get_arrears_alerts';
    }

    public function description(): string
    {
        return 'Read-only alert capability to identify active tenancies with overdue unpaid rent or outstanding balances across landlord properties. Data returned: tenant name, unit, property name, overdue amount in TZS, due date, days in arrears, urgency severity (warning vs critical), and direct action links. Authorization: Landlord or Admin only. Parameters: house_id (optional integer filter). Success: returns alert_list presentation contract. Failure: returns error object when unauthenticated or unauthorized.';
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'house_id' => $schema->integer()->description('Optional property ID filter. If omitted, checks all properties owned by the authenticated landlord.'),
        ];
    }

    public function handle(Request $request): Response
    {
        $user = $request->user();
        if (! $user) {
            return Response::text(json_encode(['error' => 'Authentication required.']));
        }

        if ($user->role !== 'landlord' && $user->role !== 'admin') {
            return Response::text(json_encode(['error' => 'Only landlords can view arrears alerts across properties.']));
        }

        $houseId = $request->get('house_id');
        $query = House::where('owner_id', $user->id)->with('tenancies.payments');

        if ($houseId) {
            $query->where('id', (int) $houseId);
        }

        $houses = $query->get();
        $alerts = [];
        $totalOverdueAmount = 0;

        foreach ($houses as $house) {
            foreach ($house->tenancies as $tenancy) {
                if ($tenancy->status !== 'active') {
                    continue;
                }

                // Check payments for the current month
                $thisMonthPaid = $tenancy->payments()
                    ->whereMonth('paid_on', now()->month)
                    ->whereYear('paid_on', now()->year)
                    ->sum('amount');

                $monthlyRent = (int) $tenancy->monthly_rent;
                $due = max(0, $monthlyRent - $thisMonthPaid);

                if ($due > 0) {
                    $totalOverdueAmount += $due;
                    $daysOverdue = max(1, now()->day - 5); // rent due on 5th of each month

                    $alerts[] = [
                        'id' => "arrears_{$tenancy->id}",
                        'severity' => $daysOverdue > 15 ? 'critical' : 'warning',
                        'category' => 'arrears',
                        'title' => "Overdue Rent: {$tenancy->name} (Unit {$tenancy->unit})",
                        'message' => "Tenant has an outstanding balance of TZS " . number_format($due) . " for {$house->property_name}.",
                        'amount_due' => $due,
                        'currency' => 'TZS',
                        'days_overdue' => $daysOverdue,
                        'tenant_name' => $tenancy->name,
                        'tenant_phone' => $tenancy->phone,
                        'property_name' => $house->property_name,
                        'action' => [
                            'label' => 'Send Payment Reminder',
                            'type' => 'message',
                            'payload' => [
                                'tenancy_id' => $tenancy->id,
                                'phone' => $tenancy->phone,
                                'amount' => $due,
                            ],
                        ],
                    ];
                }
            }
        }

        $summary = count($alerts) > 0
            ? "Found " . count($alerts) . " tenant(s) with outstanding rent totaling TZS " . number_format($totalOverdueAmount) . "."
            : "All tenants are up to date on rent payments! No arrears found.";

        $contract = VeyoraPresentationContract::alertList(
            title: 'Outstanding Rent & Arrears Alerts',
            summary: $summary,
            alerts: $alerts,
            actions: [
                ['id' => 'view_all_payments', 'label' => 'Open Payment Records', 'type' => 'navigate', 'payload' => ['screen' => 'payments']],
            ]
        );

        return Response::text(json_encode([
            'status' => 'success',
            'presentation' => VeyoraPresentationContract::TYPE_ALERT_LIST,
            'contract' => $contract,
            'alerts_count' => count($alerts),
            'total_arrears_tzs' => $totalOverdueAmount,
        ], JSON_PRETTY_PRINT));
    }
}

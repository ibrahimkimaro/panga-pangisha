<?php

namespace App\Mcp\Tools\Financial;

use App\Models\RentPayment;
use App\Models\Tenancy;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class GetPaymentHistoryTool extends Tool
{
    public function name(): string
    {
        return 'get_payment_history';
    }

    public function description(): string
    {
        return 'Retrieve confirmed rent payment ledger records and summaries for authorized properties or tenancies.';
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'tenancy_id' => $schema->integer()->description('Optional tenancy ID filter'),
            'house_id' => $schema->integer()->description('Optional property ID filter for landlords'),
        ];
    }

    public function handle(Request $request): Response
    {
        $user = $request->user();

        if (! $user) {
            return Response::text(json_encode(['error' => 'Authentication required.']));
        }

        $q = RentPayment::with(['tenancy.house']);

        if ($user->role === 'landlord') {
            $q->whereHas('tenancy.house', fn ($h) => $h->where('owner_id', $user->id));
            if ($houseId = $request->get('house_id')) {
                $q->whereHas('tenancy', fn ($t) => $t->where('house_id', $houseId));
            }
        } elseif ($user->role === 'renter') {
            $q->whereHas('tenancy', fn ($t) => $t->where('user_id', $user->id));
        } elseif ($user->role !== 'admin') {
            return Response::text(json_encode(['error' => 'Unauthorized role for payments.']));
        }

        if ($tenancyId = $request->get('tenancy_id')) {
            $q->where('tenancy_id', $tenancyId);
        }

        $payments = $q->latest('paid_on')->limit(50)->get();

        $totalCollected = $payments->sum('amount');

        $payload = $payments->map(fn (RentPayment $p) => [
            'id' => $p->id,
            'tenancy_id' => $p->tenancy_id,
            'tenant_name' => $p->tenancy?->name,
            'property_name' => $p->tenancy?->house?->property_name,
            'unit' => $p->tenancy?->unit,
            'amount' => (int) $p->amount,
            'currency' => 'TZS',
            'paid_on' => $p->paid_on?->toDateString(),
            'method' => $p->method,
            'note' => $p->note,
        ])->values()->all();

        return Response::text(json_encode([
            'count' => count($payload),
            'total_amount' => (int) $totalCollected,
            'currency' => 'TZS',
            'payments' => $payload,
        ], JSON_PRETTY_PRINT));
    }
}

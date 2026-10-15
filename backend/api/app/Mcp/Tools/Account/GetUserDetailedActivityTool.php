<?php

namespace App\Mcp\Tools\Account;

use App\Models\House;
use App\Models\MaintenanceRequest;
use App\Models\RentPayment;
use App\Models\Tenancy;
use App\Models\ViewingRequest;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class GetUserDetailedActivityTool extends Tool
{
    public function name(): string
    {
        return 'get_user_detailed_activity';
    }

    public function description(): string
    {
        return 'Read-only capability to retrieve the authenticated user recent activity on the platform. Data returned: active leases/tenancies, scheduled viewing requests, recent payments made or received, and active maintenance tickets. Authorization: Strictly isolated to the authenticated user. Parameters: none. Success: returns user activity summary. Failure: returns error object when unauthenticated.';
    }

    public function handle(Request $request): Response
    {
        $user = $request->user();

        if (! $user) {
            return Response::text(json_encode(['error' => 'Authentication required.']));
        }

        $isLandlord = ($user->role === 'landlord');

        // Tenancy information
        $tenancies = Tenancy::with(['house:id,property_name,district,monthly_rent', 'unit:id,unit_number,monthly_rent'])
            ->when($isLandlord, fn ($q) => $q->where('landlord_id', $user->id))
            ->when(! $isLandlord, fn ($q) => $q->where('tenant_id', $user->id))
            ->where('status', 'active')
            ->limit(5)
            ->get()
            ->map(fn ($t) => [
                'tenancy_id' => $t->id,
                'house' => $t->house?->property_name,
                'location' => $t->house?->district,
                'unit' => $t->unit?->unit_number,
                'rent' => $t->unit?->monthly_rent ?? $t->house?->monthly_rent,
                'status' => $t->status,
                'start_date' => $t->starts_on?->toDateString(),
                'end_date' => $t->ends_on?->toDateString(),
            ]);

        // Favorites
        $favorites = $user->favorites()
            ->select('houses.id', 'houses.property_name', 'houses.district', 'houses.monthly_rent', 'houses.property_type')
            ->limit(6)
            ->get();

        // Recent Payments
        $payments = RentPayment::where(function ($q) use ($user, $isLandlord) {
            if ($isLandlord) {
                $q->whereHas('tenancy.house', fn ($h) => $h->where('owner_id', $user->id));
            } else {
                $q->where('user_id', $user->id);
            }
        })
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'amount' => $p->amount,
                'status' => $p->status,
                'method' => $p->method,
                'date' => $p->paid_on?->toDateString() ?? $p->created_at?->toDateString(),
            ]);

        // Viewing requests
        $viewings = ViewingRequest::with('house:id,property_name,district')
            ->when($isLandlord, fn ($q) => $q->whereHas('house', fn ($h) => $h->where('owner_id', $user->id)))
            ->when(! $isLandlord, fn ($q) => $q->where('user_id', $user->id))
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($v) => [
                'house' => $v->house?->property_name,
                'location' => $v->house?->district,
                'date' => $v->preferred_date?->toDateString(),
                'status' => $v->status,
            ]);

        return Response::text(json_encode([
            'user_name' => $user->fullname,
            'role' => $user->role,
            'active_tenancies' => $tenancies,
            'favorite_homes' => $favorites,
            'recent_payments' => $payments,
            'viewing_requests' => $viewings,
        ], JSON_PRETTY_PRINT));
    }
}

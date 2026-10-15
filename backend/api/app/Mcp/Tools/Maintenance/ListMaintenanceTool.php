<?php

namespace App\Mcp\Tools\Maintenance;

use App\Models\MaintenanceRequest;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class ListMaintenanceTool extends Tool
{
    public function name(): string
    {
        return 'list_maintenance_requests';
    }

    public function description(): string
    {
        return 'Read-only capability to inspect maintenance and repair service tickets. Data returned: ticket_id, property_name, unit, title, details, status (open, in_progress, completed, cancelled), and created date. Authorization: Landlords view tickets across owned properties; tenants view tickets for their leased unit. Parameters: status (optional string), house_id (optional integer). Success: returns list of maintenance tickets. Failure: returns error object when unauthenticated.';
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'status' => $schema->string()->description('Filter by status: open, in_progress, completed, cancelled'),
            'house_id' => $schema->integer()->description('Optional property ID filter for landlords'),
        ];
    }

    public function handle(Request $request): Response
    {
        $user = $request->user();

        if (! $user) {
            return Response::text(json_encode(['error' => 'Authentication required.']));
        }

        $q = MaintenanceRequest::with(['house', 'tenancy']);

        if ($user->role === 'landlord') {
            $q->whereHas('house', fn ($h) => $h->where('owner_id', $user->id));
            if ($houseId = $request->get('house_id')) {
                $q->where('house_id', $houseId);
            }
        } elseif ($user->role === 'renter') {
            $q->whereHas('tenancy', fn ($t) => $t->where('user_id', $user->id));
        } elseif ($user->role !== 'admin') {
            return Response::text(json_encode(['error' => 'Unauthorized role for maintenance.']));
        }

        if ($status = $request->get('status')) {
            $q->where('status', $status);
        }

        $items = $q->latest('id')->limit(25)->get();

        $payload = $items->map(fn (MaintenanceRequest $m) => [
            'id' => $m->id,
            'title' => $m->title,
            'details' => $m->details,
            'status' => $m->status,
            'property_id' => $m->house_id,
            'property_name' => $m->house?->property_name,
            'unit' => $m->tenancy?->unit,
            'tenant_name' => $m->tenancy?->name,
            'created_at' => $m->created_at?->toIso8601String(),
        ])->values()->all();

        return Response::text(json_encode([
            'count' => count($payload),
            'requests' => $payload,
        ], JSON_PRETTY_PRINT));
    }
}

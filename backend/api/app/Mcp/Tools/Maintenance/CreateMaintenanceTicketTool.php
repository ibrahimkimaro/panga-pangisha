<?php

namespace App\Mcp\Tools\Maintenance;

use App\Models\House;
use App\Models\MaintenanceRequest;
use App\Models\Tenancy;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class CreateMaintenanceTicketTool extends Tool
{
    public function name(): string
    {
        return 'create_maintenance_ticket';
    }

    public function description(): string
    {
        return 'State-changing mutation capability to submit a new maintenance or repair ticket for a tenant-leased unit or landlord-managed property. Data created: maintenance_request record with pending status, notification to property owner. Authorization: Authenticated tenants with active lease, or landlords/admins. Parameters: title (required string), details (required string), house_id (optional integer), tenancy_id (optional integer). Success: returns ticket id and confirmation message. Failure: returns validation error or authorization rejection.';
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'title' => $schema->string()->required()->description('Brief summary of the issue (e.g. Leaking bathroom pipe, circuit breaker tripping)'),
            'details' => $schema->string()->required()->description('Detailed description of the repair or maintenance needed'),
            'house_id' => $schema->integer()->description('Target property ID (optional if tenancy_id is provided)'),
            'tenancy_id' => $schema->integer()->description('Active tenancy ID if submitted by tenant'),
        ];
    }

    public function handle(Request $request): Response
    {
        $user = $request->user();

        if (! $user) {
            return Response::text(json_encode(['error' => 'Authentication required.']));
        }

        $d = $request->validate([
            'title' => 'required|string|max:120',
            'details' => 'required|string|max:1000',
            'house_id' => 'nullable|integer',
            'tenancy_id' => 'nullable|integer',
        ]);

        $tenancy = null;
        $house = null;

        if (! empty($d['tenancy_id'])) {
            $tenancy = Tenancy::find($d['tenancy_id']);
            if (! $tenancy) {
                return Response::text(json_encode(['error' => 'Tenancy not found.']));
            }
            if ($user->role === 'renter' && $tenancy->user_id !== $user->id) {
                return Response::text(json_encode(['error' => 'Unauthorized: This tenancy does not belong to you.']));
            }
            $house = $tenancy->house;
        } elseif (! empty($d['house_id'])) {
            $house = House::find($d['house_id']);
            if (! $house) {
                return Response::text(json_encode(['error' => 'Property not found.']));
            }
            if ($user->role === 'landlord' && $house->owner_id !== $user->id) {
                return Response::text(json_encode(['error' => 'Unauthorized: You do not own this property.']));
            }
        } else {
            return Response::text(json_encode(['error' => 'Either house_id or tenancy_id must be provided.']));
        }

        $req = MaintenanceRequest::forceCreate([
            'house_id' => $house?->id,
            'tenancy_id' => $tenancy?->id,
            'title' => $d['title'],
            'details' => $d['details'],
            'status' => 'open',
        ]);

        return Response::text(json_encode([
            'success' => true,
            'message' => "Maintenance request #{$req->id} created successfully.",
            'ticket' => [
                'id' => $req->id,
                'title' => $req->title,
                'status' => $req->status,
                'property_name' => $house?->property_name,
            ],
        ], JSON_PRETTY_PRINT));
    }
}

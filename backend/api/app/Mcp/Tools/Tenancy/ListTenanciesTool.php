<?php

namespace App\Mcp\Tools\Tenancy;

use App\Models\Tenancy;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class ListTenanciesTool extends Tool
{
    public function name(): string
    {
        return 'list_tenancies';
    }

    public function description(): string
    {
        return 'List active or historical rental agreements/tenancies for the authenticated user (landlord viewing their properties or tenant viewing their lease).';
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'status' => $schema->string()->description('Filter by tenancy status: active, pending, ended'),
            'house_id' => $schema->integer()->description('Optional property ID filter for landlords'),
        ];
    }

    public function handle(Request $request): Response
    {
        $user = $request->user();

        if (! $user) {
            return Response::text(json_encode(['error' => 'Authentication required.']));
        }

        $q = Tenancy::with('house');

        if ($user->role === 'landlord') {
            $q->whereHas('house', fn ($h) => $h->where('owner_id', $user->id));
            if ($houseId = $request->get('house_id')) {
                $q->where('house_id', $houseId);
            }
        } elseif ($user->role === 'renter') {
            $q->where('user_id', $user->id);
        } elseif ($user->role !== 'admin') {
            return Response::text(json_encode(['error' => 'Unauthorized role for tenancies.']));
        }

        if ($status = $request->get('status')) {
            $q->where('status', $status);
        }

        $records = $q->latest('id')->limit(25)->get();

        $payload = $records->map(fn (Tenancy $t) => [
            'id' => $t->id,
            'tenant_name' => $t->name,
            'tenant_phone' => $t->phone,
            'tenant_email' => $t->email,
            'property_id' => $t->house_id,
            'property_name' => $t->house?->property_name,
            'unit' => $t->unit,
            'monthly_rent' => (int) $t->monthly_rent,
            'currency' => 'TZS',
            'starts_on' => $t->starts_on?->toDateString(),
            'ends_on' => $t->ends_on?->toDateString(),
            'status' => $t->status,
        ])->values()->all();

        return Response::text(json_encode([
            'count' => count($payload),
            'tenancies' => $payload,
        ], JSON_PRETTY_PRINT));
    }
}

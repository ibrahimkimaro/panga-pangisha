<?php

namespace App\Mcp\Tools\Rental;

use App\Models\House;
use App\Models\Tenancy;
use App\Models\Unit;
use App\Models\User;
use App\Services\Rental\OccupancyService;
use Carbon\Carbon;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class GetOccupancyDurationTool extends Tool
{
    public function name(): string
    {
        return 'get_occupancy_duration';
    }

    public function description(): string
    {
        return 'Calculate the exact ongoing occupancy duration for a room or tenant up to today (e.g. 8 months, 12 days - ongoing), contract expiration date, and payment standing. Can also filter for contracts expiring this month.';
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'unit_number' => $schema->string()->description('Optional room/unit number (e.g. Room 4, Room 2)'),
            'tenant_name' => $schema->string()->description('Optional tenant name to inspect'),
            'filter_expiring_this_month' => $schema->boolean()->description('True to filter only rooms whose lease expires in the current month'),
        ];
    }

    public function handle(Request $request): Response
    {
        $user = $request->user();
        if (!$user) {
            return Response::text(json_encode(['error' => 'Authentication required.']));
        }

        $landlord = ($user->role === 'landlord' || $user->role === 'admin') 
            ? $user 
            : User::where('id', 18)->first();

        $service = app(OccupancyService::class);
        $data = $service->getOccupancyMetrics($landlord);

        $rooms = collect($data['rooms']);

        if ($request->get('filter_expiring_this_month')) {
            $filtered = $rooms->filter(fn ($r) => !empty($r['current_tenant']['is_expiring_soon']))->values();
            return Response::text(json_encode([
                'count' => $filtered->count(),
                'message' => $filtered->isEmpty() 
                    ? 'Hakuna mkataba unaoisha mwezi huu (No contracts expiring this month).' 
                    : "Kuna vyumba {$filtered->count()} ambavyo mikataba yake inaisha hivi karibuni.",
                'expiring_rooms' => $filtered,
            ], JSON_PRETTY_PRINT));
        }

        if ($unitNumber = $request->get('unit_number')) {
            $rooms = $rooms->filter(function ($r) use ($unitNumber) {
                return stripos($r['unit_number'], $unitNumber) !== false;
            })->values();
        }

        if ($tenantName = $request->get('tenant_name')) {
            $rooms = $rooms->filter(function ($r) use ($tenantName) {
                return isset($r['current_tenant']['name']) && stripos($r['current_tenant']['name'], $tenantName) !== false;
            })->values();
        }

        return Response::text(json_encode([
            'summary' => $data['summary'],
            'results_count' => $rooms->count(),
            'rooms' => $rooms,
        ], JSON_PRETTY_PRINT));
    }
}

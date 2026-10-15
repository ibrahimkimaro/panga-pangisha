<?php

namespace App\Mcp\Tools\Rental;

use App\Models\House;
use App\Models\Tenancy;
use App\Models\Unit;
use App\Models\User;
use App\Services\Rental\InvoiceService;
use Carbon\Carbon;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class GenerateInvoiceTool extends Tool
{
    public function name(): string
    {
        return 'generate_invoice';
    }

    public function description(): string
    {
        return 'Prepare an official invoice for a room/unit for a specified billing period (e.g. November, November 2026). Computes itemized base rent, water, and electricity charges. Returns draft invoice for landlord preview and saving before delivery.';
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'unit_number' => $schema->string()->description('Room or unit number (e.g. Room 4, T23)'),
            'billing_period' => $schema->string()->description('Billing month and year (e.g. November 2026, 2026-11)'),
            'monthly_rent' => $schema->number()->description('Optional custom rent amount in TZS'),
            'water_charge' => $schema->number()->description('Optional water charge in TZS'),
            'electricity_charge' => $schema->number()->description('Optional electricity charge in TZS'),
            'notes' => $schema->string()->description('Optional notes or payment instructions on invoice'),
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

        $house = House::where('owner_id', $landlord->id)->latest()->first();
        if (!$house) {
            return Response::text(json_encode(['error' => 'No property found under your landlord account.']));
        }

        $unitNumber = $request->get('unit_number', 'Room 1');
        $unit = Unit::where('house_id', $house->id)
            ->where(function ($q) use ($unitNumber) {
                $q->where('unit_number', $unitNumber)
                  ->orWhere('unit_number', 'like', "%{$unitNumber}%");
            })->first();

        $tenancy = null;
        if ($unit) {
            $tenancy = Tenancy::where('house_id', $house->id)
                ->where(function ($q) use ($unit) {
                    $q->where('unit_id', $unit->id)
                      ->orWhere('unit', $unit->unit_number);
                })
                ->where('status', 'active')
                ->latest()
                ->first();
        }

        $periodStr = $request->get('billing_period', now()->format('F Y'));
        try {
            $periodStart = Carbon::parse($periodStr)->startOfMonth();
            $periodEnd = (clone $periodStart)->endOfMonth();
        } catch (\Exception $e) {
            $periodStart = now()->startOfMonth();
            $periodEnd = now()->endOfMonth();
        }

        $rent = (float) ($request->get('monthly_rent') ?: ($tenancy?->monthly_rent ?: ($unit?->monthly_rent ?: 450000)));
        $water = (float) ($request->get('water_charge') ?: 25000);
        $electricity = (float) ($request->get('electricity_charge') ?: 35000);

        $lineItems = [
            [
                'description' => "Kodi ya Nyumba / Base Rent ({$periodStart->format('F Y')})",
                'amount' => $rent,
                'category' => 'rent',
            ],
            [
                'description' => "Huduma ya Maji (Water Utility DAWASA)",
                'amount' => $water,
                'category' => 'utility',
            ],
            [
                'description' => "Umeme wa Matumizi (Electricity Token)",
                'amount' => $electricity,
                'category' => 'utility',
            ],
        ];

        $service = app(InvoiceService::class);
        try {
            $invoice = $service->createInvoice($landlord, [
                'house_id' => $house->id,
                'unit_id' => $unit?->id,
                'tenancy_id' => $tenancy?->id,
                'unit_number' => $unit?->unit_number ?? $unitNumber,
                'tenant_name' => $tenancy?->name ?? 'Mpangaji wa Chumba ' . ($unit?->unit_number ?? $unitNumber),
                'tenant_phone' => $tenancy?->phone ?? '+255712345678',
                'line_items' => $lineItems,
                'period_start' => $periodStart->toDateString(),
                'period_end' => $periodEnd->toDateString(),
                'due_date' => (clone $periodStart)->addDays(5)->toDateString(),
                'notes' => $request->get('notes', "Ankara ya kodi na huduma ya mwezi {$periodStart->format('F Y')}."),
            ]);

            return Response::text(json_encode([
                'status' => 'invoice_prepared',
                'action_required' => 'preview_and_save',
                'notification' => "Ankara {$invoice->invoice_number} ya {$invoice->property_name} ({$invoice->unit_number}) ya mwezi wa {$periodStart->format('F Y')} imeandaliwa kikamilifu. Hakiki (Preview) na uhifadhi kabla ya kutuma.",
                'invoice_id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'property_name' => $invoice->property_name,
                'unit' => $invoice->unit_number,
                'unit_number' => $invoice->unit_number,
                'tenant_name' => $invoice->tenant_name,
                'billing_period' => "{$periodStart->format('M Y')} ({$invoice->period_start->toDateString()} to {$invoice->period_end->toDateString()})",
                'amount_due' => (int) $invoice->amount_due,
                'total_amount' => (int) $invoice->amount_due,
                'currency' => 'TZS',
                'due_date' => $invoice->due_date->toDateString(),
                'line_items' => $invoice->line_items,
            ], JSON_PRETTY_PRINT));
        } catch (\Exception $e) {
            return Response::text(json_encode(['error' => $e->getMessage()]));
        }
    }
}

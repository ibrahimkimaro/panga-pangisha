<?php

namespace App\Services\Rental;

use App\Models\House;
use App\Models\Invoice;
use App\Models\RentalAgreement;
use App\Models\RentPayment;
use App\Models\Tenancy;
use App\Models\Unit;
use App\Models\User;
use Carbon\Carbon;
use Exception;

class InvoiceService
{
    /**
     * Generate unique sequential invoice number.
     */
    public function generateInvoiceNumber(): string
    {
        $prefix = 'INV-' . date('Ym') . '-';
        $latest = Invoice::where('invoice_number', 'like', "{$prefix}%")
            ->orderBy('id', 'desc')
            ->first();

        $seq = 1;
        if ($latest && preg_match('/-(\d+)$/', $latest->invoice_number, $matches)) {
            $seq = ((int) $matches[1]) + 1;
        }

        return $prefix . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Generate initial move-in invoice for an activated agreement.
     */
    public function generateInitialInvoice(RentalAgreement $agreement): Invoice
    {
        $house = $agreement->house;
        $unit = $agreement->unit;
        $tenancy = $agreement->tenancy;

        $lineItems = [
            [
                'description' => "Kodi ya Awali / Base Rent (" . Carbon::parse($agreement->starts_on)->format('M Y') . ")",
                'amount' => (float) $agreement->monthly_rent,
                'category' => 'rent',
            ],
        ];

        if ($agreement->security_deposit > 0) {
            $lineItems[] = [
                'description' => 'Dhamana ya Nyumba / Refundable Security Deposit',
                'amount' => (float) $agreement->security_deposit,
                'category' => 'deposit',
            ];
        }

        // Standard move-in LUKU token allocation
        $lineItems[] = [
            'description' => 'Umeme wa Awali (LUKU Token Initial Units)',
            'amount' => 20000.0,
            'category' => 'utility',
        ];

        $subtotal = array_sum(array_column($lineItems, 'amount'));
        $tax = 0.0;
        $amountDue = $subtotal + $tax;

        $invoice = Invoice::create([
            'invoice_number' => $this->generateInvoiceNumber(),
            'house_id' => $house->id,
            'unit_id' => $unit?->id,
            'tenancy_id' => $tenancy?->id,
            'rental_agreement_id' => $agreement->id,
            'landlord_id' => $agreement->landlord_id,
            'tenant_id' => $agreement->tenant_id,
            'property_name' => $agreement->property_name,
            'unit_number' => $agreement->unit_number,
            'tenant_name' => $agreement->tenant_name,
            'tenant_phone' => $agreement->tenant_phone,
            'tenant_email' => $agreement->tenant_email,
            'issue_date' => now()->toDateString(),
            'due_date' => Carbon::parse($agreement->starts_on)->toDateString(),
            'period_start' => Carbon::parse($agreement->starts_on)->toDateString(),
            'period_end' => Carbon::parse($agreement->starts_on)->addMonth()->subDay()->toDateString(),
            'check_in_at' => Carbon::parse($agreement->starts_on)->setHour(10)->setMinute(0),
            'subtotal' => $subtotal,
            'tax' => $tax,
            'amount_due' => $amountDue,
            'amount_paid' => 0.0,
            'outstanding_balance' => $amountDue,
            'currency' => 'TZS',
            'status' => 'issued',
            'line_items' => $lineItems,
            'utility_readings' => [
                'luku_meter' => $agreement->meter_readings['luku_meter_number'] ?? '14238910291',
                'water_meter' => $agreement->meter_readings['water_meter_reading'] ?? '0142 m³',
            ],
            'late_fee_policy' => 'Faini ya 5% ikichelewa zaidi ya siku 5 baada ya tarehe ya malipo.',
            'notes' => 'Ankara ya awali ya makazi mapya. Tafadhali lipa kabla ya tarehe ya kuingia.',
            'payment_method' => $agreement->payment_method,
        ]);

        return $invoice;
    }

    /**
     * Create a standard recurring or ad-hoc invoice.
     */
    public function createInvoice(User $landlord, array $data): Invoice
    {
        $house = House::findOrFail($data['house_id']);
        if ($house->owner_id !== $landlord->id && $landlord->role !== 'admin') {
            throw new Exception('Unauthorized.');
        }

        $unit = null;
        if (!empty($data['unit_id'])) {
            $unit = Unit::where('house_id', $house->id)->where('id', $data['unit_id'])->first();
        }

        $tenancy = null;
        if (!empty($data['tenancy_id'])) {
            $tenancy = Tenancy::where('house_id', $house->id)->where('id', $data['tenancy_id'])->first();
        } elseif ($unit && $unit->current_tenancy_id) {
            $tenancy = Tenancy::find($unit->current_tenancy_id);
        }

        $lineItems = $data['line_items'] ?? [];
        if (empty($lineItems)) {
            $rentAmt = (float) ($data['monthly_rent'] ?? ($unit?->monthly_rent ?? 450000));
            $periodLabel = Carbon::parse($data['period_start'] ?? now())->format('F Y');
            $lineItems = [
                [
                    'description' => "Kodi ya Nyumba / Rent ({$periodLabel})",
                    'amount' => $rentAmt,
                    'category' => 'rent',
                ],
            ];

            if (!empty($data['water_charge'])) {
                $lineItems[] = [
                    'description' => 'Huduma ya Maji (Water Utility DAWASA)',
                    'amount' => (float) $data['water_charge'],
                    'category' => 'utility',
                ];
            }

            if (!empty($data['electricity_charge'])) {
                $lineItems[] = [
                    'description' => 'Umeme LUKU Units (Shared / Metered)',
                    'amount' => (float) $data['electricity_charge'],
                    'category' => 'utility',
                ];
            }
        }

        $subtotal = 0.0;
        foreach ($lineItems as $item) {
            $subtotal += (float) ($item['amount'] ?? 0);
        }

        $tax = (float) ($data['tax'] ?? 0);
        $amountDue = $subtotal + $tax;

        $issueDate = Carbon::parse($data['issue_date'] ?? now());
        $dueDate = Carbon::parse($data['due_date'] ?? (clone $issueDate)->addDays(5));
        $periodStart = Carbon::parse($data['period_start'] ?? now()->startOfMonth());
        $periodEnd = Carbon::parse($data['period_end'] ?? (clone $periodStart)->endOfMonth());

        $tenantName = $data['tenant_name'] ?? ($tenancy?->name ?? 'Mpangaji');
        $tenantPhone = $data['tenant_phone'] ?? ($tenancy?->phone ?? '');
        $tenantEmail = $data['tenant_email'] ?? ($tenancy?->email ?? '');

        $invoice = Invoice::create([
            'invoice_number' => $this->generateInvoiceNumber(),
            'house_id' => $house->id,
            'unit_id' => $unit?->id,
            'tenancy_id' => $tenancy?->id,
            'rental_agreement_id' => $data['rental_agreement_id'] ?? null,
            'landlord_id' => $landlord->id,
            'tenant_id' => $tenancy?->user_id,
            'property_name' => $house->property_name ?: 'Nyumba',
            'unit_number' => $unit?->unit_number ?? ($data['unit_number'] ?? 'Chumba 1'),
            'tenant_name' => $tenantName,
            'tenant_phone' => $tenantPhone,
            'tenant_email' => $tenantEmail,
            'issue_date' => $issueDate->toDateString(),
            'due_date' => $dueDate->toDateString(),
            'period_start' => $periodStart->toDateString(),
            'period_end' => $periodEnd->toDateString(),
            'subtotal' => $subtotal,
            'tax' => $tax,
            'amount_due' => $amountDue,
            'amount_paid' => 0.0,
            'outstanding_balance' => $amountDue,
            'currency' => 'TZS',
            'status' => 'issued',
            'line_items' => $lineItems,
            'utility_readings' => $data['utility_readings'] ?? null,
            'late_fee_policy' => $data['late_fee_policy'] ?? 'Faini ya 5% ikichelewa baada ya tarehe ya malipo.',
            'notes' => $data['notes'] ?? null,
            'payment_method' => $data['payment_method'] ?? 'M-Pesa / Benki',
        ]);

        return $invoice;
    }

    /**
     * Record payment against an invoice.
     * Enforces that invoice is only marked paid when real payment is recorded!
     */
    public function recordPayment(int $invoiceId, array $paymentData, User $recorder): Invoice
    {
        $invoice = Invoice::findOrFail($invoiceId);

        if ($invoice->landlord_id !== $recorder->id && $recorder->role !== 'admin') {
            throw new Exception('Unauthorized.');
        }

        $paidAmount = (float) ($paymentData['amount'] ?? $invoice->outstanding_balance);
        if ($paidAmount <= 0) {
            throw new Exception('Payment amount must be greater than zero.');
        }

        $newAmountPaid = (float) $invoice->amount_paid + $paidAmount;
        $newBalance = max(0, (float) $invoice->amount_due - $newAmountPaid);

        $invoice->amount_paid = $newAmountPaid;
        $invoice->outstanding_balance = $newBalance;
        $invoice->payment_method = $paymentData['method'] ?? 'mpesa';
        $invoice->payment_reference = $paymentData['reference'] ?? ('PAY-' . strtoupper(str()->random(8)));
        $invoice->receipt_screenshot_url = $paymentData['screenshot_url'] ?? null;
        $invoice->paid_at = now();

        if ($newBalance <= 0) {
            $invoice->status = 'paid';
        } else {
            $invoice->status = 'partially_paid';
        }

        $invoice->save();

        // Also record in RentPayment ledger for complete accounting
        if ($invoice->tenancy_id) {
            RentPayment::create([
                'tenancy_id' => $invoice->tenancy_id,
                'amount' => $paidAmount,
                'paid_on' => now()->toDateString(),
                'method' => $invoice->payment_method,
                'note' => "Malipo ya Ankara {$invoice->invoice_number} ({$invoice->payment_reference})",
            ]);
        }

        return $invoice;
    }
}

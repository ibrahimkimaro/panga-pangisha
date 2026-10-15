<?php

namespace Database\Seeders;

use App\Models\House;
use App\Models\Invoice;
use App\Models\RentalAgreement;
use App\Models\Tenancy;
use App\Models\Unit;
use App\Models\User;
use App\Services\Rental\InvoiceService;
use App\Services\Rental\RentalAgreementService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class RentalAgreementAndInvoiceSeeder extends Seeder
{
    public function run(): void
    {
        $landlord = User::where('id', 18)->first() 
            ?? User::where('role', 'landlord')->first();

        if (!$landlord) {
            return;
        }

        $house = House::where('owner_id', $landlord->id)->first() ?? House::first();
        if (!$house) {
            return;
        }

        $units = Unit::where('house_id', $house->id)->get();
        $unit1 = $units->first();
        $unit2 = $units->skip(1)->first();
        $unit3 = $units->skip(2)->first();

        $agreementService = app(RentalAgreementService::class);
        $invoiceService = app(InvoiceService::class);

        // 1. Asha Msuya - Active & Fully Signed Agreement + Move-in Invoice
        $existingAsha = RentalAgreement::where('agreement_number', 'MKT-2026-ASHA01')->first();
        if (!$existingAsha) {
            $startsOn = Carbon::now()->subMonths(7)->startOfMonth();
            $endsOn = (clone $startsOn)->addMonths(12);

            $terms = $agreementService->buildContractTerms($house, $unit1, $landlord, [
                'name' => 'Asha Msuya',
                'phone' => '+255712300001',
                'email' => 'asha.msuya@gmail.com',
                'nida' => '19920514-11204-00002-18',
            ], [
                'monthly_rent' => 500000,
                'security_deposit' => 500000,
                'starts_on' => $startsOn->toDateString(),
                'duration_months' => 12,
                'unit_number' => $unit1?->unit_number ?? 'Room 1',
                'payment_frequency' => 'monthly',
                'payment_method' => 'M-Pesa (Vodacom)',
            ], 'sw');

            $tenancyAsha = Tenancy::where('house_id', $house->id)
                ->where('name', 'like', '%Asha%')
                ->first();

            if (!$tenancyAsha) {
                $tenancyAsha = Tenancy::create([
                    'house_id' => $house->id,
                    'unit_id' => $unit1?->id,
                    'name' => 'Asha Msuya',
                    'phone' => '+255712300001',
                    'email' => 'asha.msuya@gmail.com',
                    'nida' => '19920514-11204-00002-18',
                    'unit' => $unit1?->unit_number ?? 'Room 1',
                    'monthly_rent' => 500000,
                    'deposit_amount' => 500000,
                    'starts_on' => $startsOn->toDateString(),
                    'ends_on' => $endsOn->toDateString(),
                    'status' => 'active',
                    'agreement_status' => 'signed_active',
                ]);
            } else {
                $tenancyAsha->update([
                    'unit_id' => $unit1?->id,
                    'deposit_amount' => 500000,
                    'starts_on' => $startsOn->toDateString(),
                    'ends_on' => $endsOn->toDateString(),
                    'status' => 'active',
                    'agreement_status' => 'signed_active',
                ]);
            }

            if ($unit1) {
                $unit1->update(['status' => 'occupied', 'current_tenancy_id' => $tenancyAsha->id]);
            }

            $agreementAsha = RentalAgreement::create([
                'house_id' => $house->id,
                'unit_id' => $unit1?->id,
                'tenancy_id' => $tenancyAsha->id,
                'landlord_id' => $landlord->id,
                'agreement_number' => 'MKT-2026-ASHA01',
                'language' => 'sw',
                'version' => 1,
                'status' => 'active',
                'tenant_name' => 'Asha Msuya',
                'tenant_phone' => '+255712300001',
                'tenant_email' => 'asha.msuya@gmail.com',
                'tenant_nida' => '19920514-11204-00002-18',
                'property_name' => $house->property_name ?: 'Kimaro Modern Residence',
                'unit_number' => $unit1?->unit_number ?? 'Room 1',
                'monthly_rent' => 500000,
                'security_deposit' => 500000,
                'payment_frequency' => 'monthly',
                'starts_on' => $startsOn->toDateString(),
                'ends_on' => $endsOn->toDateString(),
                'duration_months' => 12,
                'payment_method' => 'M-Pesa (Vodacom)',
                'terms' => $terms,
                'inventory' => [
                    ['item' => 'Ufunguo wa Chumba na Geti', 'quantity' => 2, 'condition' => 'Mpya / Mzuri'],
                    ['item' => 'Soketi na Swichi za Umeme', 'quantity' => 4, 'condition' => 'Zinafanya kazi'],
                    ['item' => 'Madirisha ya Kioo na Neti', 'quantity' => 2, 'condition' => 'Safi'],
                    ['item' => 'Mabomba ya Choo na Sink', 'quantity' => 1, 'condition' => 'Yaziba vizuri'],
                ],
                'meter_readings' => [
                    'luku_meter_number' => '14238910291',
                    'luku_initial_units' => '45.2 kWh',
                    'water_meter_reading' => '0142 m³',
                ],
                'tenant_signature' => 'SIGNED_ELECTRONICALLY:Asha Msuya',
                'tenant_signed_at' => $startsOn->copy()->subDays(2)->setHour(11)->setMinute(20),
                'tenant_signed_ip' => '197.250.198.42',
                'tenant_signer_name' => 'Asha Msuya',
                'landlord_signature' => 'SIGNED_ELECTRONICALLY:Ibrahim Kimaro',
                'landlord_signed_at' => $startsOn->copy()->subDays(1)->setHour(14)->setMinute(45),
                'landlord_signed_ip' => '102.164.120.15',
                'landlord_signer_name' => 'Ibrahim Kimaro',
                'activated_at' => $startsOn->copy()->subDays(1)->setHour(15)->setMinute(0),
            ]);

            // Create Move-in Initial Invoice (Paid)
            Invoice::create([
                'invoice_number' => 'INV-202603-0001',
                'house_id' => $house->id,
                'unit_id' => $unit1?->id,
                'tenancy_id' => $tenancyAsha->id,
                'rental_agreement_id' => $agreementAsha->id,
                'landlord_id' => $landlord->id,
                'property_name' => $house->property_name ?: 'Kimaro Modern Residence',
                'unit_number' => $unit1?->unit_number ?? 'Room 1',
                'tenant_name' => 'Asha Msuya',
                'tenant_phone' => '+255712300001',
                'tenant_email' => 'asha.msuya@gmail.com',
                'issue_date' => $startsOn->copy()->subDays(2)->toDateString(),
                'due_date' => $startsOn->toDateString(),
                'period_start' => $startsOn->toDateString(),
                'period_end' => $startsOn->copy()->addMonth()->subDay()->toDateString(),
                'check_in_at' => $startsOn->copy()->setHour(10)->setMinute(0),
                'subtotal' => 1020000,
                'tax' => 0,
                'amount_due' => 1020000,
                'amount_paid' => 1020000,
                'outstanding_balance' => 0,
                'currency' => 'TZS',
                'status' => 'paid',
                'line_items' => [
                    ['description' => 'Kodi ya Mwezi wa Kwanza (March 2026)', 'amount' => 500000, 'category' => 'rent'],
                    ['description' => 'Dhamana ya Nyumba (Refundable Security Deposit)', 'amount' => 500000, 'category' => 'deposit'],
                    ['description' => 'Umeme wa Awali (LUKU Token Initial Allocation)', 'amount' => 20000, 'category' => 'utility'],
                ],
                'utility_readings' => ['luku_meter' => '14238910291', 'water_meter' => '0142 m³'],
                'late_fee_policy' => 'Faini ya 5% ikichelewa zaidi ya siku 5.',
                'payment_method' => 'mpesa',
                'payment_reference' => 'MP260301.9912.A',
                'paid_at' => $startsOn->copy()->subDay()->setHour(12)->setMinute(30),
                'notes' => 'Ankara ya awali ya kuingia nyumbani imelipwa kikamilifu.',
            ]);

            // Create Current Month Invoice (Paid)
            $currStart = now()->startOfMonth();
            Invoice::create([
                'invoice_number' => 'INV-202610-0001',
                'house_id' => $house->id,
                'unit_id' => $unit1?->id,
                'tenancy_id' => $tenancyAsha->id,
                'rental_agreement_id' => $agreementAsha->id,
                'landlord_id' => $landlord->id,
                'property_name' => $house->property_name ?: 'Kimaro Modern Residence',
                'unit_number' => $unit1?->unit_number ?? 'Room 1',
                'tenant_name' => 'Asha Msuya',
                'tenant_phone' => '+255712300001',
                'tenant_email' => 'asha.msuya@gmail.com',
                'issue_date' => $currStart->toDateString(),
                'due_date' => $currStart->copy()->addDays(5)->toDateString(),
                'period_start' => $currStart->toDateString(),
                'period_end' => $currStart->copy()->endOfMonth()->toDateString(),
                'subtotal' => 530000,
                'tax' => 0,
                'amount_due' => 530000,
                'amount_paid' => 530000,
                'outstanding_balance' => 0,
                'currency' => 'TZS',
                'status' => 'paid',
                'line_items' => [
                    ['description' => 'Kodi ya Nyumba (October 2026)', 'amount' => 500000, 'category' => 'rent'],
                    ['description' => 'Bili ya Maji DAWASA', 'amount' => 30000, 'category' => 'utility'],
                ],
                'payment_method' => 'mpesa',
                'payment_reference' => 'MP261002.4419.K',
                'paid_at' => $currStart->copy()->addDays(2),
            ]);
        }

        // 2. Juma Bakari - Draft Agreement awaiting review & tenant signature (Next Month Move-in)
        $existingJuma = RentalAgreement::where('agreement_number', 'MKT-2026-JUMA02')->first();
        if (!$existingJuma) {
            $nextStart = now()->addMonth()->startOfMonth();
            $termsJuma = $agreementService->buildContractTerms($house, $unit2, $landlord, [
                'name' => 'Juma Bakari',
                'phone' => '+255754988771',
                'email' => 'juma.bakari@gmail.com',
                'nida' => '19900822-21105-00001-29',
            ], [
                'monthly_rent' => 480000,
                'security_deposit' => 480000,
                'starts_on' => $nextStart->toDateString(),
                'duration_months' => 6,
                'unit_number' => $unit2?->unit_number ?? 'Room 4',
                'payment_frequency' => 'monthly',
                'payment_method' => 'Tigo Pesa / Lipa Namba',
            ], 'sw');

            RentalAgreement::create([
                'house_id' => $house->id,
                'unit_id' => $unit2?->id,
                'landlord_id' => $landlord->id,
                'agreement_number' => 'MKT-2026-JUMA02',
                'language' => 'sw',
                'version' => 1,
                'status' => 'pending_tenant_signature',
                'tenant_name' => 'Juma Bakari',
                'tenant_phone' => '+255754988771',
                'tenant_email' => 'juma.bakari@gmail.com',
                'tenant_nida' => '19900822-21105-00001-29',
                'property_name' => $house->property_name ?: 'Kimaro Modern Residence',
                'unit_number' => $unit2?->unit_number ?? 'Room 4',
                'monthly_rent' => 480000,
                'security_deposit' => 480000,
                'payment_frequency' => 'monthly',
                'starts_on' => $nextStart->toDateString(),
                'ends_on' => $nextStart->copy()->addMonths(6)->toDateString(),
                'duration_months' => 6,
                'payment_method' => 'Tigo Pesa / Lipa Namba',
                'terms' => $termsJuma,
                'inventory' => [
                    ['item' => 'Ufunguo wa Chumba na Geti', 'quantity' => 2, 'condition' => 'Mpya'],
                    ['item' => 'Swichi na Taa za Chumbani', 'quantity' => 3, 'condition' => 'Zinafanya kazi'],
                ],
                'meter_readings' => [
                    'luku_meter_number' => '22940192834',
                    'luku_initial_units' => '60.0 kWh',
                    'water_meter_reading' => '0085 m³',
                ],
            ]);
        }

        // 3. Baraka Mwamba - Issued Unpaid Invoice for Room 3
        $existingBarakaInv = Invoice::where('invoice_number', 'INV-202610-0002')->first();
        if (!$existingBarakaInv) {
            $currStart = now()->startOfMonth();
            Invoice::create([
                'invoice_number' => 'INV-202610-0002',
                'house_id' => $house->id,
                'unit_id' => $unit3?->id,
                'landlord_id' => $landlord->id,
                'property_name' => $house->property_name ?: 'Kimaro Modern Residence',
                'unit_number' => $unit3?->unit_number ?? 'Room 3',
                'tenant_name' => 'Baraka Mwamba',
                'tenant_phone' => '+255788112233',
                'tenant_email' => 'baraka.m@gmail.com',
                'issue_date' => $currStart->toDateString(),
                'due_date' => $currStart->copy()->addDays(5)->toDateString(),
                'period_start' => $currStart->toDateString(),
                'period_end' => $currStart->copy()->endOfMonth()->toDateString(),
                'subtotal' => 450000,
                'tax' => 0,
                'amount_due' => 450000,
                'amount_paid' => 0,
                'outstanding_balance' => 450000,
                'currency' => 'TZS',
                'status' => 'issued',
                'line_items' => [
                    ['description' => 'Kodi ya Nyumba (October 2026)', 'amount' => 420000, 'category' => 'rent'],
                    ['description' => 'Bili ya Maji na Usafi', 'amount' => 30000, 'category' => 'utility'],
                ],
                'notes' => 'Tafadhali kamilisha malipo kabla ya tarehe 5 ya mwezi.',
            ]);
        }
    }
}

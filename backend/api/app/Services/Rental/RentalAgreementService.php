<?php

namespace App\Services\Rental;

use App\Models\House;
use App\Models\Invoice;
use App\Models\RentalAgreement;
use App\Models\Tenancy;
use App\Models\Unit;
use App\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Str;

class RentalAgreementService
{
    public function __construct(
        protected InvoiceService $invoiceService
    ) {}

    /**
     * Generate standard contract terms in Kiswahili and English.
     */
    public function buildContractTerms(
        House $house,
        ?Unit $unit,
        User $landlord,
        array $tenantData,
        array $financials,
        string $language = 'sw'
    ): array {
        $unitNumber = $unit?->unit_number ?? ($financials['unit_number'] ?? 'Unit 1');
        $propertyName = $house->property_name ?: 'Nyumba ya Makazi';
        $location = implode(', ', array_filter([$house->ward, $house->district, 'Tanzania']));
        $monthlyRent = (float) ($financials['monthly_rent'] ?? 450000);
        $deposit = (float) ($financials['security_deposit'] ?? $monthlyRent);
        $startsOn = Carbon::parse($financials['starts_on'] ?? now())->toDateString();
        $durationMonths = (int) ($financials['duration_months'] ?? 6);
        $endsOn = Carbon::parse($startsOn)->addMonths($durationMonths)->toDateString();
        $paymentFrequency = $financials['payment_frequency'] ?? 'monthly';
        $paymentMethod = $financials['payment_method'] ?? 'Simu ya Mkononi (M-Pesa / Tigo Pesa / Airtel Money)';

        $swahiliTerms = [
            'title' => 'MKATABA WA UPANGISHAJI WA CHUMBA / NYUMBA YA MAKAZI',
            'legal_preamble' => 'Mkataba huu unafanywa na kuingiwa rasmi leo chini ya Sheria za Nchi ya Tanzania kati ya Mwenye Nyumba (Landlord) na Mpangaji (Tenant).',
            'parties' => [
                'landlord' => [
                    'name' => $landlord->fullname ?: 'Ibrahim Kimaro',
                    'phone' => $landlord->phone ?: '+255 712 345 678',
                    'email' => $landlord->email ?: 'landlord@pangapangisha.com',
                    'role' => 'Mwenye Nyumba (Landlord)',
                ],
                'tenant' => [
                    'name' => $tenantData['name'] ?? 'Mpangaji',
                    'phone' => $tenantData['phone'] ?? '',
                    'email' => $tenantData['email'] ?? '',
                    'nida' => $tenantData['nida'] ?? 'Haijatolewa',
                    'role' => 'Mpangaji (Tenant)',
                ],
            ],
            'property' => [
                'name' => $propertyName,
                'unit_number' => $unitNumber,
                'location' => $location,
                'description' => $unit?->description ?? "Chumba cha makazi katika nyumba ya {$propertyName}, chenye huduma za msingi.",
            ],
            'period' => [
                'starts_on' => $startsOn,
                'ends_on' => $endsOn,
                'duration_months' => $durationMonths,
                'renewal' => 'Mkataba unaweza kufanywa upya kwa taarifa ya maandishi ya mwezi mmoja (1) kabla ya kumalizika kwa muda wa mkataba, kwa makubaliano ya pande zote mbili.',
            ],
            'rent' => [
                'amount' => $monthlyRent,
                'currency' => 'TZS',
                'payment_frequency' => $paymentFrequency,
                'due_date' => 'Tarehe 1 ya kila mwezi husika wa malipo.',
                'payment_method' => $paymentMethod,
                'late_fee_rule' => 'Malipo yakichelewa zaidi ya siku 5 baada ya tarehe ya malipo, faini ya asilimia 5 (5%) itaongezwa.',
            ],
            'deposit' => [
                'amount' => $deposit,
                'purpose' => 'Dhamana ya usalama wa nyumba na mali zake, na kuhakikisha bili na uharibifu unalipwa pindi mpangaji anapohama.',
                'refund_terms' => 'Itarudishwa yote ndani ya siku 14 baada ya kukabidhi chumba kikiwa katika hali nzuri kama kilivyopokelewa, baada ya kukata gharama zozote halali za uharibifu au bili zilizosalia.',
            ],
            'utilities' => [
                'electricity' => 'Mpangaji anawajibika kulipia umeme (LUKU) kulingana na matumizi yake.',
                'water' => 'Maji ya DAWASA/mamlaka ya maji yatalipwa kulingana na bili au mita ya chumba.',
                'waste_management' => 'Ushuru wa taka utalipwa kulingana na utaratibu wa mtaa au jengo.',
            ],
            'occupancy_rules' => [
                'Chumba kitatumika kwa matumizi ya makazi binafsi pekee, si kwa biashara haramu au shughuli za usumbufu.',
                'Hairuhusiwi kupangisha tena mtu mwingine (Subletting) bila idhini ya maandishi ya mwenye nyumba.',
                'Mpangaji anapaswa kuzingatia utulivu na amani kwa majirani, hasa nyakati za usiku kuanzia saa 4:00 usiku.',
            ],
            'maintenance' => [
                'Mwenye nyumba anawajibika kwa matengenezo makuu ya jengo (paa, kuta, miundombinu mikuu ya maji na umeme).',
                'Mpangaji anawajibika kurekebisha vifaa vidogo vilivyoharibika kwa matumizi yake (kama balbu, kufuli, soketi) na kuweka chumba katika usafi.',
            ],
            'access' => 'Mwenye nyumba ana haki ya kukagua chumba baada ya kutoa taarifa ya saa 24 kabla, isipokuwa wakati wa dharura ya kiusalama.',
            'termination' => 'Upande wowote unaweza kusitisha mkataba huu kwa kutoa taarifa ya maandishi ya mwezi mmoja (1) kabla, au kwa kulipa kodi ya mwezi mmoja badala ya taarifa.',
            'disputes' => 'Mzozo wowote utatatuliwa kwanza kwa njia ya mashauriano ya amani. Yakishindikana, sheria za Mahakama za Tanzania zitatumika.',
        ];

        $englishTerms = [
            'title' => 'RESIDENTIAL TENANCY LEASE AGREEMENT',
            'legal_preamble' => 'This Agreement is formally made and entered into under the Laws of the United Republic of Tanzania between the Landlord and the Tenant.',
            'parties' => [
                'landlord' => [
                    'name' => $landlord->fullname ?: 'Ibrahim Kimaro',
                    'phone' => $landlord->phone ?: '+255 712 345 678',
                    'email' => $landlord->email ?: 'landlord@pangapangisha.com',
                    'role' => 'Landlord',
                ],
                'tenant' => [
                    'name' => $tenantData['name'] ?? 'Tenant',
                    'phone' => $tenantData['phone'] ?? '',
                    'email' => $tenantData['email'] ?? '',
                    'nida' => $tenantData['nida'] ?? 'Not provided',
                    'role' => 'Tenant',
                ],
            ],
            'property' => [
                'name' => $propertyName,
                'unit_number' => $unitNumber,
                'location' => $location,
                'description' => $unit?->description ?? "Residential accommodation at {$propertyName}.",
            ],
            'period' => [
                'starts_on' => $startsOn,
                'ends_on' => $endsOn,
                'duration_months' => $durationMonths,
                'renewal' => 'Renewable upon 30 days written notice before lease expiration subject to mutual agreement.',
            ],
            'rent' => [
                'amount' => $monthlyRent,
                'currency' => 'TZS',
                'payment_frequency' => $paymentFrequency,
                'due_date' => '1st day of each billing cycle.',
                'payment_method' => $paymentMethod,
                'late_fee_rule' => 'A late fee of 5% applies if rent is delayed past 5 calendar days from the due date.',
            ],
            'deposit' => [
                'amount' => $deposit,
                'purpose' => 'Security deposit against unpaid bills, damage, or lease default.',
                'refund_terms' => 'Refundable within 14 days of move-out inspection subject to legitimate deductions.',
            ],
            'utilities' => [
                'electricity' => 'Tenant is responsible for purchasing electricity tokens (LUKU meter).',
                'water' => 'Water utility billed according to sub-meter readings or agreed building allocation.',
                'waste_management' => 'Municipal waste collection fee paid according to building rules.',
            ],
            'occupancy_rules' => [
                'The unit shall be used solely for private residential purposes.',
                'Subletting or transferring occupancy without prior written landlord approval is prohibited.',
                'Quiet hours observed between 10:00 PM and 6:00 AM.',
            ],
            'maintenance' => [
                'Landlord handles structural repairs, plumbing mains, and electrical conduits.',
                'Tenant is responsible for day-to-day cleanliness, replacing light bulbs, and repairing damage caused by negligence.',
            ],
            'access' => 'Landlord may inspect the premises with at least 24 hours written notice, except in cases of emergency.',
            'termination' => 'Either party may terminate the lease by providing one (1) month written notice or paying one month rent in lieu of notice.',
            'disputes' => 'Disputes will be resolved amicably; where unresolved, the laws and courts of Tanzania have jurisdiction.',
        ];

        return [
            'sw' => $swahiliTerms,
            'en' => $englishTerms,
            'active_language' => $language,
        ];
    }

    /**
     * Create draft agreement.
     */
    public function createDraft(User $landlord, array $data): RentalAgreement
    {
        $house = House::findOrFail($data['house_id']);
        if ($house->owner_id !== $landlord->id && $landlord->role !== 'admin') {
            throw new Exception('Unauthorized: You do not own this property.');
        }

        $unit = null;
        if (!empty($data['unit_id'])) {
            $unit = Unit::where('house_id', $house->id)->where('id', $data['unit_id'])->first();
        }

        // Prevent creating lease on a unit with an existing active tenancy
        if ($unit && $unit->status === 'occupied') {
            $activeTenancy = Tenancy::where('unit_id', $unit->id)->where('status', 'active')->first();
            if ($activeTenancy) {
                throw new Exception("Unit {$unit->unit_number} already has an active tenancy with {$activeTenancy->name}.");
            }
        }

        $agreementNumber = 'MKT-' . date('Y') . '-' . strtoupper(Str::random(6));
        $language = $data['language'] ?? 'sw';

        $tenantUser = null;
        if (!empty($data['tenant_phone'])) {
            $tenantUser = User::where('phone', $data['tenant_phone'])->first();
        }

        $financials = [
            'monthly_rent' => $data['monthly_rent'] ?? ($unit?->monthly_rent ?? $house->monthly_rent ?? 450000),
            'security_deposit' => $data['security_deposit'] ?? ($unit?->monthly_rent ?? $house->monthly_rent ?? 450000),
            'payment_frequency' => $data['payment_frequency'] ?? 'monthly',
            'starts_on' => $data['starts_on'] ?? now()->toDateString(),
            'duration_months' => (int) ($data['duration_months'] ?? 6),
            'unit_number' => $unit?->unit_number ?? ($data['unit_number'] ?? 'Chumba 1'),
            'payment_method' => $data['payment_method'] ?? 'M-Pesa / Benki',
        ];

        $terms = $this->buildContractTerms($house, $unit, $landlord, [
            'name' => $data['tenant_name'],
            'phone' => $data['tenant_phone'],
            'email' => $data['tenant_email'] ?? '',
            'nida' => $data['tenant_nida'] ?? '',
        ], $financials, $language);

        $startsOn = Carbon::parse($financials['starts_on']);
        $endsOn = (clone $startsOn)->addMonths($financials['duration_months']);

        $agreement = RentalAgreement::create([
            'house_id' => $house->id,
            'unit_id' => $unit?->id,
            'landlord_id' => $landlord->id,
            'tenant_id' => $tenantUser?->id,
            'agreement_number' => $agreementNumber,
            'language' => $language,
            'version' => 1,
            'status' => 'pending_tenant_signature',
            'tenant_name' => $data['tenant_name'],
            'tenant_phone' => $data['tenant_phone'],
            'tenant_email' => $data['tenant_email'] ?? null,
            'tenant_nida' => $data['tenant_nida'] ?? null,
            'property_name' => $house->property_name ?: 'Nyumba',
            'unit_number' => $financials['unit_number'],
            'monthly_rent' => $financials['monthly_rent'],
            'security_deposit' => $financials['security_deposit'],
            'payment_frequency' => $financials['payment_frequency'],
            'starts_on' => $startsOn->toDateString(),
            'ends_on' => $endsOn->toDateString(),
            'duration_months' => $financials['duration_months'],
            'payment_method' => $financials['payment_method'],
            'terms' => $terms,
            'inventory' => $data['inventory'] ?? [
                ['item' => 'Ufunguo wa Chumba na Geti', 'quantity' => 2, 'condition' => 'Mpya / Mzuri'],
                ['item' => 'Soketi na Swichi za Umeme', 'quantity' => 4, 'condition' => 'Zinafanya kazi'],
                ['item' => 'Madirisha na Vioo', 'quantity' => 2, 'condition' => 'Mazima'],
                ['item' => 'Mabomba ya Maji na Sink', 'quantity' => 1, 'condition' => 'Safi bila kuvuja'],
            ],
            'meter_readings' => $data['meter_readings'] ?? [
                'luku_meter_number' => '14238910291',
                'luku_initial_units' => '45.2 kWh',
                'water_meter_reading' => '0142 m³',
            ],
        ]);

        return $agreement;
    }

    /**
     * Update draft terms before signing.
     */
    public function updateDraft(int $id, array $data, User $user): RentalAgreement
    {
        $agreement = RentalAgreement::findOrFail($id);
        if ($agreement->landlord_id !== $user->id && $agreement->tenant_id !== $user->id && $user->role !== 'admin') {
            throw new Exception('Unauthorized.');
        }

        if (in_array($agreement->status, ['signed', 'active'])) {
            throw new Exception('Cannot modify an already executed agreement. Create an amendment instead.');
        }

        $fields = [
            'tenant_name', 'tenant_phone', 'tenant_email', 'tenant_nida',
            'monthly_rent', 'security_deposit', 'starts_on', 'duration_months',
            'payment_frequency', 'payment_method', 'language', 'inventory', 'meter_readings'
        ];

        foreach ($fields as $field) {
            if (isset($data[$field])) {
                $agreement->{$field} = $data[$field];
            }
        }

        if (isset($data['starts_on']) || isset($data['duration_months'])) {
            $starts = Carbon::parse($agreement->starts_on);
            $agreement->ends_on = (clone $starts)->addMonths($agreement->duration_months)->toDateString();
        }

        // Regenerate terms if parameters changed
        $house = $agreement->house;
        $unit = $agreement->unit;
        $landlord = $agreement->landlord;

        $financials = [
            'monthly_rent' => $agreement->monthly_rent,
            'security_deposit' => $agreement->security_deposit,
            'payment_frequency' => $agreement->payment_frequency,
            'starts_on' => $agreement->starts_on->toDateString(),
            'duration_months' => $agreement->duration_months,
            'unit_number' => $agreement->unit_number,
            'payment_method' => $agreement->payment_method,
        ];

        $agreement->terms = $this->buildContractTerms($house, $unit, $landlord, [
            'name' => $agreement->tenant_name,
            'phone' => $agreement->tenant_phone,
            'email' => $agreement->tenant_email,
            'nida' => $agreement->tenant_nida,
        ], $financials, $agreement->language ?? 'sw');

        $agreement->version = $agreement->version + 1;
        $agreement->save();

        return $agreement;
    }

    /**
     * Tenant reviews and electronically signs the agreement.
     */
    public function signByTenant(int $id, array $signatureData, ?User $tenant = null): RentalAgreement
    {
        $agreement = RentalAgreement::findOrFail($id);

        if (in_array($agreement->status, ['signed', 'active'])) {
            throw new Exception('Agreement has already been finalized.');
        }

        $agreement->tenant_signature = $signatureData['signature'] ?? ('SIGNED_ELECTRONICALLY:' . ($signatureData['signer_name'] ?? $agreement->tenant_name));
        $agreement->tenant_signer_name = $signatureData['signer_name'] ?? $agreement->tenant_name;
        $agreement->tenant_signed_at = now();
        $agreement->tenant_signed_ip = request()->ip() ?? '127.0.0.1';
        $agreement->status = 'pending_landlord_signature';

        if ($tenant) {
            $agreement->tenant_id = $tenant->id;
        }

        $agreement->save();
        return $agreement;
    }

    /**
     * Landlord countersigns the agreement and activates the tenancy.
     */
    public function signByLandlord(int $id, array $signatureData, User $landlord): RentalAgreement
    {
        $agreement = RentalAgreement::findOrFail($id);

        if ($agreement->landlord_id !== $landlord->id && $landlord->role !== 'admin') {
            throw new Exception('Unauthorized: Only the landlord can countersign.');
        }

        if (empty($agreement->tenant_signature)) {
            throw new Exception('Tenant must sign the agreement before landlord countersignature.');
        }

        $agreement->landlord_signature = $signatureData['signature'] ?? ('SIGNED_ELECTRONICALLY:' . ($landlord->fullname ?: 'Ibrahim Kimaro'));
        $agreement->landlord_signer_name = $signatureData['signer_name'] ?? ($landlord->fullname ?: 'Ibrahim Kimaro');
        $agreement->landlord_signed_at = now();
        $agreement->landlord_signed_ip = request()->ip() ?? '127.0.0.1';
        $agreement->status = 'signed';
        $agreement->save();

        // Now activate tenancy and generate initial invoice
        $this->activateAgreement($agreement);

        return $agreement->fresh(['house', 'unit', 'tenancy', 'invoices']);
    }

    /**
     * Activate tenancy strictly after dual signatures are verified.
     */
    public function activateAgreement(RentalAgreement $agreement): void
    {
        if (!$agreement->isFullySigned()) {
            throw new Exception('Cannot activate tenancy: Both landlord and tenant signatures are required.');
        }

        $house = $agreement->house;
        $unit = $agreement->unit;

        // Check unit availability
        if ($unit) {
            $existingActive = Tenancy::where('unit_id', $unit->id)
                ->where('status', 'active')
                ->where('id', '!=', $agreement->tenancy_id)
                ->first();
            if ($existingActive) {
                throw new Exception("Conflict: Unit {$unit->unit_number} already has an active tenancy with {$existingActive->name}.");
            }
        }

        // Create or update Tenancy
        $tenancy = $agreement->tenancy;
        if (!$tenancy) {
            $tenancy = Tenancy::create([
                'house_id' => $house->id,
                'unit_id' => $unit?->id,
                'user_id' => $agreement->tenant_id,
                'name' => $agreement->tenant_name,
                'phone' => $agreement->tenant_phone,
                'email' => $agreement->tenant_email,
                'nida' => $agreement->tenant_nida,
                'unit' => $agreement->unit_number,
                'monthly_rent' => $agreement->monthly_rent,
                'deposit_amount' => $agreement->security_deposit,
                'payment_frequency' => $agreement->payment_frequency,
                'starts_on' => $agreement->starts_on,
                'ends_on' => $agreement->ends_on,
                'status' => 'active',
                'agreement_status' => 'signed_active',
            ]);
            $agreement->tenancy_id = $tenancy->id;
        } else {
            $tenancy->status = 'active';
            $tenancy->agreement_status = 'signed_active';
            $tenancy->save();
        }

        if ($unit) {
            $unit->status = 'occupied';
            $unit->current_tenancy_id = $tenancy->id;
            $unit->save();
        }

        $agreement->status = 'active';
        $agreement->activated_at = now();
        $agreement->save();

        // Automatically issue initial move-in invoice (Rent + Deposit)
        $this->invoiceService->generateInitialInvoice($agreement);
    }
}

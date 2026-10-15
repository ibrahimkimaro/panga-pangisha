<?php

namespace App\Ai\Knowledge;

use App\Models\House;
use App\Models\MaintenanceRequest;
use App\Models\RentPayment;
use App\Models\Tenancy;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * Resilient, database-aware Knowledge Engine for Veyora Assistant.
 * Provides instant direct conversational handling for greetings, platform guidance,
 * and high-fidelity fallback responses whenever remote AI providers experience latency.
 */
class VeyoraKnowledgeEngine
{
    /**
     * Determines if a prompt is a greeting or introductory query.
     */
    public static function isGreeting(string $text): bool
    {
        $normalized = mb_strtolower(trim($text));
        $normalized = preg_replace('/[?!.,]/', '', $normalized);

        $greetings = [
            'hi', 'hello', 'hey', 'mambo', 'habari', 'habari yako', 'habari za asubuhi',
            'habari za mchana', 'habari za jioni', 'niaje', 'salama', 'kuna mtu',
            'uko hapo', 'mambo vipi', 'shikamoo', 'who are you', 'wewe ni nani',
            'unaitwa nani', 'what is your name', 'what can you do', 'unafanya nini',
            'unaweza nisaidia nini', 'help', 'msaada', 'start', 'anza',
        ];

        if (in_array($normalized, $greetings)) {
            return true;
        }

        // Exact short 2-word greetings
        $exactShortGreetings = ['hi there', 'hello there', 'habari veyora', 'hello veyora', 'hi veyora', 'mambo veyora', 'niaje veyora'];
        if (in_array($normalized, $exactShortGreetings)) {
            return true;
        }

        return false;
    }

    /**
     * Generates an immediate, friendly, personalized greeting without overwhelming lists.
     */
    public static function directGreeting(User $user, string $text): string
    {
        $firstName = explode(' ', trim($user->fullname ?? 'Rafiki'))[0];
        $isSw = self::detectSwahili($text);

        if ($isSw) {
            return "Habari {$firstName}! 😊 Karibu sana. Unaendeleaje leo?";
        }

        return "Hello {$firstName}! 😊 Great to connect with you. How are you doing today?";
    }

    /**
     * Resolves general platform domain knowledge inquiries safely without keyword hijacking.
     */
    public static function answerWithKnowledge(User $user, string $query, array $context = [], array $recentHistory = []): string
    {
        $isSw = self::detectSwahili($query);
        $firstName = explode(' ', trim($user->fullname ?? 'Rafiki'))[0];

        if ($isSw) {
            return "Samahani {$firstName}, siwezi kupata taarifa hizo kwa sasa. Tafadhali jaribu tena baada ya muda mfupi au uliza swali lako kwa njia nyingine.";
        }

        return "I'm temporarily unable to retrieve that information right now. Please try again shortly or rephrase your request.";
    }

    private static function handleRentalUnitsInquiry(User $user, bool $isSw): string
    {
        if ($user->role !== 'landlord' && $user->role !== 'admin') {
            return $isSw
                ? "Ni wamiliki wa nyumba (landlords) pekee wanaoweza kutazama orodha ya vyumba vyao vya kupangisha. Kama wewe ni mpangaji, unaweza kutafuta vyumba wazi kwenye ukurasa wa Gundua."
                : "Only landlords can view their rental units portfolio. If you are a renter, you can search available units in the Explore tab.";
        }

        $houseIds = House::where('owner_id', $user->id)->pluck('id');
        $units = \App\Models\Unit::whereIn('house_id', $houseIds)
            ->with('house:id,property_name,district,ward')
            ->latest('id')
            ->get();

        if ($units->isEmpty()) {
            return $isSw
                ? "Bado haujasajili chumba au unit yoyote chini ya nyumba zako. Je, ungependa nikuelekeze jinsi ya kuongeza chumba?"
                : "You currently don't have any rental units registered under your properties. Would you like guidance on adding a unit?";
        }

        $lines = [];
        foreach ($units as $u) {
            $rent = number_format($u->monthly_rent);
            $propName = $u->house?->property_name ?? 'Property';
            $status = $u->status ?: ($u->is_available ? 'available' : 'occupied');
            $statusLabel = $status === 'available' ? ($isSw ? 'Wazi' : 'Available') : ($isSw ? 'Kimepangishwa' : 'Occupied');
            $lines[] = "• **{$propName} — Unit {$u->unit_number}**: TZS {$rent}/mwezi ({$statusLabel})";
        }
        $unitsText = implode("\n", $lines);

        if ($isSw) {
            return "Hii hapa orodha ya vyumba vyako vya kupangisha ({$units->count()} jumla):\n\n{$unitsText}";
        }

        return "Here are your registered rental units ({$units->count()} total):\n\n{$unitsText}";
    }


    private static function handlePropertySearch(User $user, string $query, bool $isSw): string
    {
        $houses = House::where('status', 'available')
            ->where('is_active', true)
            ->withCount('units')
            ->orderBy('id', 'desc')
            ->limit(3)
            ->get();

        if ($houses->isEmpty()) {
            return $isSw
                ? "Kwa sasa hakuna nyumba zilizopo wazi zinazolingana na vigezo hivyo. Unaweza kuangalia kwenye ukurasa wa 'Gundua' kuona zote zilizopo."
                : "No matching vacant properties are currently listed. Please check the 'Explore' tab to browse recent additions.";
        }

        $list = [];
        foreach ($houses as $h) {
            $price = number_format($h->monthly_rent);
            $loc = trim("{$h->district}, {$h->ward}");
            $list[] = "• **{$h->property_name}** ({$loc})\n  Kodi: TSh {$price}/mwezi | Vyumba: {$h->units_count} unit(s)";
        }

        $items = implode("\n\n", $list);

        if ($isSw) {
            return "Hapa kuna baadhi ya nyumba zilizothibitishwa zinazopatikana kwenye Veyora:\n\n{$items}\n\n"
                . "Unaweza kubofya nyumba yoyote kwenye ukurasa wa 'Gundua' kuona picha za kila chumba, vifaa, au kuweka ombi la kutembelea (Viewing Request).";
        }

        return "Here are verified properties currently available on Veyora:\n\n{$items}\n\n"
            . "You can open any listing in the 'Explore' tab to inspect detailed room photos, amenities, or book a viewing request.";
    }

    private static function handleTenancyInquiry(User $user, bool $isSw): string
    {
        $tenancies = Tenancy::where('tenant_id', $user->id)
            ->with('house')
            ->latest('id')
            ->get();

        if ($tenancies->isEmpty()) {
            return $isSw
                ? "Huna mkataba wowote wa upangaji unaoendelea kwa sasa. Ukipata nyumba na mwenye nyumba kuthibitisha ombi lako, mkataba utaonekana hapa."
                : "You do not currently have an active tenancy agreement on file. Once a landlord confirms your lease, it will be displayed here.";
        }

        $t = $tenancies->first();
        $houseName = $t->house?->property_name ?? 'Property #' . $t->house_id;
        $rent = number_format($t->monthly_rent);
        $status = ucfirst($t->status);

        if ($isSw) {
            return "Taarifa za mkataba wako wa upangaji:\n\n"
                . "• **Nyumba**: {$houseName}\n"
                . "• **Kodi ya Mwezi**: TSh {$rent}\n"
                . "• **Kuanza**: {$t->starts_on}\n"
                . "• **Kumalizika**: " . ($t->ends_on ?? 'Haijawekwa') . "\n"
                . "• **Hali ya Mkataba**: {$status}\n\n"
                . "Kumbuka kulipa kodi kabla ya tarehe ya mwisho ili kuepuka usumbufu.";
        }

        return "Your active tenancy agreement details:\n\n"
            . "• **Property**: {$houseName}\n"
            . "• **Monthly Rent**: TSh {$rent}\n"
            . "• **Start Date**: {$t->starts_on}\n"
            . "• **End Date**: " . ($t->ends_on ?? 'Open-ended') . "\n"
            . "• **Status**: {$status}\n\n"
            . "Ensure rent payments are recorded on time to keep your tenant ledger in good standing.";
    }

    private static function handlePaymentInquiry(User $user, bool $isSw): string
    {
        $payments = RentPayment::whereHas('tenancy', fn ($q) => $q->where('tenant_id', $user->id))
            ->latest('paid_on')
            ->limit(5)
            ->get();

        if ($payments->isEmpty()) {
            return $isSw
                ? "Hakuna rekodi za malipo ya kodi zilizosajiliwa kwenye akaunti yako. Malipo yako yakithibitishwa na mwenye nyumba yataonekana hapa."
                : "No rent payment records were found for your account. Confirmed payments will be recorded here.";
        }

        $lines = [];
        foreach ($payments as $p) {
            $amount = number_format($p->amount);
            $lines[] = "• **TSh {$amount}** — Tarehe: {$p->paid_on} (Njia: {$p->method})";
        }
        $hist = implode("\n", $lines);

        if ($isSw) {
            return "Hizi hapa rekodi za malipo yako ya hivi karibuni:\n\n{$hist}\n\n"
                . "Kila malipo yanayorekodiwa yanajumuisha risiti rasmi ya kielektroniki kwenye Veyora.";
        }

        return "Here is your recent rent payment history:\n\n{$hist}\n\n"
            . "All recorded transactions are officially logged in your Veyora ledger.";
    }

    private static function handleMaintenanceInquiry(User $user, bool $isSw): string
    {
        $tickets = MaintenanceRequest::whereHas('tenancy', fn ($q) => $q->where('tenant_id', $user->id))
            ->latest('id')
            ->limit(3)
            ->get();

        if ($tickets->isNotEmpty()) {
            $list = [];
            foreach ($tickets as $t) {
                $list[] = "• **{$t->title}** — Hali: {$t->status} (" . ($t->details ? Str::limit($t->details, 50) : '') . ")";
            }
            $existing = implode("\n", $list);
            return $isSw
                ? "Tiketi zako za marekebisho za hivi karibuni:\n\n{$existing}\n\n"
                    . "Kufungua tiketi mpya, nenda kwenye ukurasa wa nyumba yako au niambie maelezo ya tatizo (k.m. 'Bomba la maji bafuni linavuja')."
                : "Your recent maintenance tickets:\n\n{$existing}\n\n"
                    . "To submit a new ticket, describe the issue (e.g. 'Water pipe leaking in bathroom').";
        }

        if ($isSw) {
            return "Ili kufungua ombi la marekebisho ya nyumba (maji, umeme, ukarabati):\n\n"
                . "1. Andika jina la tatizo (k.m. 'Bomba la maji linavuja')\n"
                . "2. Eleza chumba au eneo lenye tatizo\n"
                . "3. Mwenye nyumba atapokea taarifa mara moja na kuteua fundi wa kulirekebisha.";
        }

        return "To submit a maintenance request:\n\n"
            . "1. State the issue clearly (e.g. 'Electrical circuit breaker tripping')\n"
            . "2. Specify the affected room or fixture\n"
            . "3. Your landlord will be notified immediately to assign a service provider.";
    }

    private static function handleRegistrationGuidance(bool $isSw): string
    {
        if ($isSw) {
            return "Mwongozo wa Hatua 5 wa Kusajili Nyumba na Vyumba (Mwenye Nyumba):\n\n"
                . "1. **Hatua ya 1: Taarifa za Msingi** — Jina la nyumba, aina (Apartment, Nyumba nzima, n.k.), na kama unapangisha nyumba nzima au vyumba binafsi.\n"
                . "2. **Hatua ya 2: Eneo & Anwani ya NAPA** — Mkoa, Wilaya, Kata, Mtaa, na Msimbo wa Makazi (NAPA Code).\n"
                . "3. **Hatua ya 3: Vyumba & Kodi** — Weka kila chumba/unit (Master Bedroom, Standard Room), kodi ya mwezi (TSh), na miezi ya kuanzia.\n"
                . "4. **Hatua ya 4: Huduma** — Weka alama kwa huduma zilizopo: Maji (DAWASA), Umeme (LUKU), Paving, Uzio, Parking, na Ulinzi.\n"
                . "5. **Hatua ya 5: Picha & Uthibitisho** — Pakia picha safi za mazingira ya nje na ndani ya kila chumba kwa ajili ya uhakiki.\n\n"
                . "Kuanza, fungua 'Mwenye Nyumba' kisha gusa kitufe cha '+ Sajili Nyumba'.";
        }

        return "5-Step Landlord Property & Unit Registration Guide:\n\n"
            . "1. **Step 1: Basic Information** — Property name, property type (House, Apartment, Studio), and rental model (Entire House vs Individual Units).\n"
            . "2. **Step 2: Location & NAPA Code** — Region, District, Ward, Street, and physical addressing code.\n"
            . "3. **Step 3: Units & Pricing** — Define each rentable unit (Master Room, Standard Room), set monthly rent in TZS, and advance deposit terms.\n"
            . "4. **Step 4: Amenities** — Specify water, electricity meter (LUKU), parking, security, fencing, and furnishings.\n"
            . "5. **Step 5: Photos & Verification** — Upload exterior and room-by-room photos for admin verification.\n\n"
            . "To start, open your Landlord Dashboard and tap '+ Register Property'.";
    }

    public static function detectSwahili(string $text): bool
    {
        $swahiliWords = [
            'habari', 'mambo', 'jambo', 'niaje', 'salama', 'kodi', 'nyumba', 'chumba',
            'vyumba', 'panga', 'mkataba', 'mpangaji', 'mwenye', 'shikamoo', 'tafuta',
            'pesa', 'malipo', 'maji', 'umeme', 'wapi', 'ngapi', 'ndiyo', 'hapana',
            'tafadhali', 'sawa', 'asante', 'leo', 'kesho', 'nini', 'nani', 'yangu',
        ];

        $lower = mb_strtolower($text);
        foreach ($swahiliWords as $w) {
            if (preg_match('/\b' . preg_quote($w, '/') . '\b/i', $lower)) {
                return true;
            }
        }

        return false;
    }
}

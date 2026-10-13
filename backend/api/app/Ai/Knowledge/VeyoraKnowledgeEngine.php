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

        // Check if string starts with standard greetings and is very short
        if (mb_strlen($normalized) <= 25) {
            foreach (['hi ', 'hello ', 'mambo ', 'habari ', 'hey '] as $prefix) {
                if (str_starts_with($normalized, $prefix)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Generates an immediate, friendly, personalized greeting.
     */
    public static function directGreeting(User $user, string $text): string
    {
        $firstName = explode(' ', trim($user->fullname ?? 'Mteja'))[0];
        $isSw = self::detectSwahili($text);
        $role = $user->role ?? 'renter';

        if ($isSw) {
            if ($role === 'landlord') {
                return "Habari {$firstName}! Mimi ni Veyora, msaidizi wako rasmi wa AI wa nyumba (Panga na Kupangisha).\n\n"
                    . "Kama mwenye nyumba, naweza kukusaidia:\n"
                    . "• Kukagua nyumba na vyumba vyako vilivyo sokoni au vilivyopangishwa\n"
                    . "• Kuangalia kodi zilizoingia na orodha ya wapangaji wako\n"
                    . "• Kukuongoza kusajili nyumba au vyumba vipya (Master vs Standard)\n"
                    . "• Kufuatilia tiketi za marekebisho (maji, umeme, ukarabati)\n\n"
                    . "Ungependa nianze na nini leo?";
            }

            return "Habari {$firstName}! Mimi ni Veyora, msaidizi wako rasmi wa AI wa nyumba (Panga na Kupangisha).\n\n"
                . "Nipo hapa kukusaidia:\n"
                . "• Kutafuta vyumba na nyumba zilizothibitishwa (k.m. 'Tafuta vyumba 2 Kinondoni')\n"
                . "• Kuangalia mkataba wako wa upangaji na masharti yake\n"
                . "• Kuangalia historia ya malipo yako ya kodi ya pango\n"
                . "• Kufungua tiketi ya marekebisho ya maji au umeme\n\n"
                . "Nikusaidie nini leo?";
        }

        if ($role === 'landlord') {
            return "Hello {$firstName}! I am Veyora, your official Housing AI Assistant for Panga na Kupangisha.\n\n"
                . "As a landlord, I can assist you with:\n"
                . "• Inspecting your listed properties and tracking vacant vs occupied units\n"
                . "• Reviewing your rent collection ledger and active tenants\n"
                . "• Registering new properties and configuring rentable units/rooms\n"
                . "• Monitoring maintenance requests across your portfolio\n\n"
                . "What would you like to start with today?";
        }

        return "Hello {$firstName}! I am Veyora, your official Housing AI Assistant for Panga na Kupangisha.\n\n"
            . "I am here to help you:\n"
            . "• Discover verified rental houses and apartments (e.g. 'Find 2-bedroom in Masaki')\n"
            . "• Review your active tenancy agreement and lease terms\n"
            . "• Check your payment history and rent receipts\n"
            . "• Submit maintenance requests for plumbing or electrical repairs\n\n"
            . "How can I assist you today?";
    }

    /**
     * Resolves an inquiry using authorized database queries and structured domain knowledge.
     */
    public static function answerWithKnowledge(User $user, string $query, array $context = []): string
    {
        $q = mb_strtolower(trim($query));
        $isSw = self::detectSwahili($query);
        $firstName = explode(' ', trim($user->fullname ?? 'Mteja'))[0];

        // 1. Property search inquiry
        if (preg_match('/(tafuta|search|find|chumba|vyumba|nyumba|house|apartment|masaki|kinondoni|upanga|mikocheni|ilala|kigamboni)/i', $q)) {
            return self::handlePropertySearch($user, $q, $isSw);
        }

        // 2. Tenancy agreement inquiry
        if (preg_match('/(mkataba|tenancy|agreement|lease|mpangaji|mwenye nyumba|contract)/i', $q)) {
            return self::handleTenancyInquiry($user, $isSw);
        }

        // 3. Rent payments & ledger inquiry
        if (preg_match('/(malipo|kodi|rent|payment|ledger|receipt|risiti|paid|pesa)/i', $q)) {
            return self::handlePaymentInquiry($user, $isSw);
        }

        // 4. Maintenance / repairs inquiry
        if (preg_match('/(rekebisho|karabati|maji|umeme|bomba|leak|plumbing|electric|maintenance|repair|tiketi|ticket)/i', $q)) {
            return self::handleMaintenanceInquiry($user, $isSw);
        }

        // 5. Landlord property registration inquiry
        if (preg_match('/(sajili|register|ongeza|weka|add|create|wizard|property|unit|vyumba vipya)/i', $q)) {
            return self::handleRegistrationGuidance($isSw);
        }

        // Default conversational housing guidance
        if ($isSw) {
            return "Habari {$firstName}! Nimepokea swali lako kuhusu: \"{$query}\".\n\n"
                . "Kwenye mfumo wa Veyora, unaweza kufanya yafuatayo:\n"
                . "1. **Kutafuta Nyumba**: Andika 'Tafuta vyumba 2 Kinondoni' au 'Nyumba Masaki chini ya milioni 1'.\n"
                . "2. **Mkataba wa Upangaji**: Andika 'Onyesha mkataba wangu' kuona muda, kodi, na masharti.\n"
                . "3. **Historia ya Kodi**: Andika 'Malipo yangu ya kodi' kuona rekodi zote za risiti.\n"
                . "4. **Marekebisho**: Andika 'Fungua tiketi ya maji' kwa matatizo ya umeme au mabomba.\n"
                . "5. **Kusajili Nyumba (Wenye Nyumba)**: Andika 'Jinsi ya kusajili nyumba' kupata maelekezo ya hatua 5.\n\n"
                . "Tafadhali chagua moja ya hayo nikupe maelezo kamili!";
        }

        return "Hello {$firstName}! I understand you are inquiring about: \"{$query}\".\n\n"
            . "Here are quick actions you can run with Veyora:\n"
            . "1. **Search Rentals**: Type 'Search 2-bedroom in Kinondoni' or 'Apartments under 800k TZS'.\n"
            . "2. **Tenancy Agreement**: Type 'Show my tenancy' to inspect your active lease agreement.\n"
            . "3. **Rent Ledger**: Type 'Show payment history' to view confirmed rent receipts.\n"
            . "4. **Maintenance**: Type 'Report water issue' to log plumbing or electrical tickets.\n"
            . "5. **Landlord Registration**: Type 'How to register a property' for the 5-step unit creation walkthrough.\n\n"
            . "How can I specifically assist you right now?";
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

    private static function detectSwahili(string $text): bool
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

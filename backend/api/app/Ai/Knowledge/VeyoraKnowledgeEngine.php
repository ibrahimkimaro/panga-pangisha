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
 * and high-fidelity responses grounded in curated domain knowledge.
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

        $exactShortGreetings = [
            'hi there', 'hello there', 'habari veyora', 'hello veyora',
            'hi veyora', 'mambo veyora', 'niaje veyora', 'good morning',
            'good afternoon', 'good evening',
        ];

        return in_array($normalized, $exactShortGreetings);
    }

    /**
     * Generates an immediate, friendly, personalized greeting without overwhelming lists.
     */
    public static function directGreeting(?User $user, string $text): string
    {
        $firstName = $user ? explode(' ', trim($user->fullname ?? 'Rafiki'))[0] : null;
        $isSw = self::detectSwahili($text);

        if ($firstName) {
            return $isSw
                ? "Habari {$firstName}! 😊 Karibu sana. Unaendeleaje leo?"
                : "Hello {$firstName}! 😊 Great to connect with you. How are you doing today?";
        }

        return $isSw
            ? "Habari na karibu Panga Pangisha! 😊 Ninawezaje kukusaidia katika kutafuta chumba au nyumba leo?"
            : "Hello and welcome to Panga Pangisha! 😊 How can I help you with housing today?";
    }

    /**
     * Resolves general platform domain knowledge inquiries safely using VeyoraKnowledgeRetriever.
     */
    public static function answerWithKnowledge(?User $user, string $query, array $context = [], array $recentHistory = []): string
    {
        $isSw = self::detectSwahili($query);
        $role = $user?->role ?? 'guest';
        $lowQuery = mb_strtolower(trim($query));

        // 1. Check for specific private-record requests by unauthorized roles
        if ($role === 'guest' || $role === 'renter') {
            if (str_contains($lowQuery, 'my unit') || str_contains($lowQuery, 'my propert') || str_contains($lowQuery, 'vyumba vyangu') || str_contains($lowQuery, 'nyumba zangu') || str_contains($lowQuery, 'who owes') || str_contains($lowQuery, 'madeni ya kodi')) {
                if ($role === 'guest') {
                    return $isSw
                        ? "Wewe uko kama mgeni (guest) kwa sasa. Ili kusimamia vyumba vyako au kutazama kodi inayodaiwa, tafadhali ingia (log in) kwenye akaunti yako ya Mwenye Nyumba (Landlord)."
                        : "You are currently visiting as a guest. To view your rental units or manage rent ledgers, please sign in with your Landlord account.";
                }
                return $isSw
                    ? "Wewe umesajiliwa kama mpangaji (renter). Ni wamiliki wa nyumba (landlords) pekee wanaoweza kutazama orodha ya vyumba vinavyopangishwa na kodi inayodaiwa. Unaweza kutafuta vyumba wazi kwenye ukurasa wa Gundua au kutazama mkataba wako."
                    : "You are signed in as a tenant. Only property owners (landlords) can manage rental units and view tenant arrears. You can explore available rooms in the Explore tab or view your active lease.";
            }
        }

        // 2. Retrieve authoritative domain knowledge from indexed documents
        $results = VeyoraKnowledgeRetriever::retrieve($query, 3, $role);

        if (! empty($results)) {
            $top = $results[0];
            $content = $top['content'] ?? '';
            $status = $top['status'] ?? 'implemented';

            // Check if user is asking about a planned or roadmap feature
            if ($status === 'planned' || str_contains($lowQuery, 'lock') || str_contains($lowQuery, 'hotel pms') || str_contains($lowQuery, 'loan') || str_contains($lowQuery, 'mkopo')) {
                return $isSw
                    ? "Kipengele hiki kiko kwenye mpango wa maendeleo wa baadaye (roadmap). Kwa sasa mfumo unasaidia utafutaji wa nyumba na vyumba vilivyothibitishwa, mita binafsi za STS LUKU, mikataba ya kisheria ya kidijitali yenye saini pande zote, na kumbukumbu sahihi za ankara na malipo."
                    : "This feature is planned for a future platform release. Currently, Panga Pangisha supports verified property & room discovery, private STS LUKU submeters, digital rental agreements with dual electronic signatures, and transparent rent ledgers.";
            }

            // Synthesize concise, accurate knowledge answer
            return self::formatKnowledgeResponse($top, $isSw, $query);
        }

        // Fallback guidance if no specific chunk scored above threshold
        if ($isSw) {
            return "Panga Pangisha ni mfumo wa kisasa wa kidijitali nchini Tanzania unaokuunganisha moja kwa moja na wamiliki wa nyumba bila dalali (0% Dalali). Kila chumba kina mita yake ya LUKU, mikataba ya kidijitali, na ankara sahihi. Je, ungependa nikuelekeze jinsi ya kupata chumba au kusajili nyumba?";
        }

        return "Panga Pangisha is Tanzania's premier digital rental platform connecting tenants and landlords directly with 0% broker fees. Every room has its own private STS LUKU submeter, digital leases with dual e-signatures, and verified NAPA addressing. Would you like guidance on finding a room or listing a property?";
    }

    /**
     * Formats a retrieved knowledge section into a natural, user-friendly response.
     */
    protected static function formatKnowledgeResponse(array $entry, bool $isSw, string $query): string
    {
        $domain = $entry['domain'] ?? '';
        $lowQuery = mb_strtolower($query);

        // A. Dalali / Broker fees questions
        if (str_contains($lowQuery, 'dalali') || str_contains($lowQuery, 'broker') || str_contains($lowQuery, 'commission')) {
            return $isSw
                ? "Kwenye Panga Pangisha **hakuna ada ya dalali (0% Dalali)**! Mfumo unakuunganisha moja kwa moja na wamiliki halisi wa nyumba waliothibitishwa kupitia mfumo wa NIDA. Hakuna gharama za kuona nyumba (viewing fees), hakuna makato ya mwezi mmoja wa dalali, na unaweza kutuma ujumbe au ratiba ya kuona chumba moja kwa moja kupitia jukwaa letu."
                : "At Panga Pangisha, there are strictly **0% broker fees (Zero Dalali)**! You connect and interact directly with verified property owners authenticated through NIDA. There are no viewing charges, no hidden middleman markups, and no one-month broker commission fees.";
        }

        // B. STS LUKU submeters
        if (str_contains($lowQuery, 'luku') || str_contains($lowQuery, 'sts') || str_contains($lowQuery, 'umeme') || str_contains($lowQuery, 'meter') || str_contains($lowQuery, 'mita')) {
            return $isSw
                ? "Kila chumba au kitengo kwenye Panga Pangisha kina **mita yake binafsi ya STS LUKU iliyoidhinishwa** yenye keypad ndani ya chumba chako. Hii inamaanisha unanunua tokeni za umeme mwenyewe kupitia mitandao yote ya simu (M-Pesa, TigoPesa, AirtelMoney, HaloPesa) na kuingiza namba za umeme ndani ya chumba chako, hivyo kuondoa kabisa migogoro ya kuchangia bili za umeme na majirani."
                : "Every individual room or rental unit on Panga Pangisha is equipped with its own certified **private STS LUKU prepaid submeter** with an in-room keypad. You purchase electricity tokens directly via your preferred mobile money provider (M-Pesa, TigoPesa, AirtelMoney, HaloPesa) and enter them directly inside your private room, eliminating utility billing disputes entirely.";
        }

        // C. Target Room workflow
        if (str_contains($lowQuery, 'target room') || str_contains($lowQuery, 'chumba') || str_contains($lowQuery, 'compound')) {
            return $isSw
                ? "Mfumo wetu unatumia utaratibu wa **Chumba Maalum (Target Room)**: mpangaji anayetafuta chumba kimoja (kama Master Bedroom au Single Room) anaweza kukodi chumba hicho mahususi chenye kodi yake maalum na mita yake ya LUKU binafsi, huku akifurahia huduma zote za compound moja kwa moja kama vile ulinzi wa geti, hifadhi ya maji safi ya DAWASA, na nafasi ya maegesho ya gari."
                : "Our platform supports the dedicated **Target Room** workflow: renters seeking an individual room (such as a Master Bedroom or Single Unit) can rent that exact target room with its own dedicated rent and private STS LUKU submeter, while having full verified access to compound amenities including security perimeter, backup DAWASA water storage, and parking.";
        }

        // D. Digital Rental Agreements & Signing
        if (str_contains($lowQuery, 'mkataba') || str_contains($lowQuery, 'agreement') || str_contains($lowQuery, 'saini') || str_contains($lowQuery, 'sign')) {
            return $isSw
                ? "Mikataba ya upangaji kwenye Panga Pangisha ni ya kidijitali na inazingatia kikamilifu sheria za ardhi na makazi za Tanzania. Sheria yetu kuu ni **Saini ya Pande Zote Mbili (Dual Electronic Signatures)**: mkataba hauwezi kuanza kutumika (active) hadi mpangaji na mwenye nyumba wote wawili waweke saini zao rasmi za kidijitali. Unaweza kusoma vifungu, kukagua orodha ya vitu (move-in inventory), na kuuchapa (PDF/Print) wakati wowote."
                : "Rental agreements on Panga Pangisha are digital legal leases tailored to Tanzanian tenancy standards. Our foundational rule is **Mandatory Dual E-Signatures**: an agreement only becomes active once both the tenant and the landlord have placed their electronic signatures. You can review terms, verify move-in inventory checklists, and print or download official PDF agreements anytime.";
        }

        // E. Invoices & Payments
        if (str_contains($lowQuery, 'ankara') || str_contains($lowQuery, 'invoice') || str_contains($lowQuery, 'malipo') || str_contains($lowQuery, 'payment') || str_contains($lowQuery, 'lipa')) {
            return $isSw
                ? "Ankara zote za kodi zinazalishwa kwa mfumo rasmi wenye namba maalum ya kumbukumbu, kipindi cha pango, na salio sahihi. Malipo yanakubaliwa kupitia mitandao yote mikuu (M-Pesa, TigoPesa, AirtelMoney, HaloPesa) na Benki (kama NMB/CRDB Lipa Namba). Kila malipo yanayothibitishwa yanatolewa risiti rasmi ya kielektroniki papo hapo na kurekodiwa kwenye leja."
                : "All rent invoices are tracked with official unique invoice numbers, billing periods, due dates, and verified ledger balances. Payments are supported through mobile money (M-Pesa, TigoPesa, AirtelMoney, HaloPesa) and bank channels (NMB & CRDB Lipa Namba), instantly generating verified digital receipts upon payment.";
        }

        // F. Hotel & Accommodation Stays
        if (str_contains($lowQuery, 'hotel') || str_contains($lowQuery, 'hoteli') || str_contains($lowQuery, 'lodge') || str_contains($lowQuery, 'resort')) {
            return $isSw
                ? "Unaweza kugundua vyumba vya hoteli za kipekee, lodge, na fleti za mapumziko moja kwa moja kwenye ukurasa wetu wa **Gundua (Explore)**. Unaweza kuona picha halisi, huduma zilizopo, na bei kwa usiku, kisha kuwasiliana na mwenyeji moja kwa moja. Tafadhali kumbuka kuwa mfumo wa kiotomatiki wa booking ya hoteli (Hotel PMS Booking Engine) uko kwenye mpango wa maboresho ya baadaye (Roadmap)."
                : "You can discover boutique hotel rooms, lodge stays, and serviced apartments in our **Explore** feed. You can inspect verified high-resolution photos, nightly prices, and amenities, and contact accommodation hosts directly. Note that an operational hotel PMS automated room checkout engine is currently planned on our upcoming product roadmap.";
        }

        // Return clean formatted content without arbitrary character truncation
        $cleanContent = trim(preg_replace('/^##\s+.*\n/', '', $entry['content']));
        return $cleanContent;
    }

    /**
     * Determines whether text is predominantly Kiswahili or English.
     */
    public static function detectSwahili(string $text): bool
    {
        $swahiliWords = [
            'habari', 'mambo', 'jambo', 'niaje', 'salama', 'kodi', 'nyumba', 'chumba',
            'vyumba', 'panga', 'mkataba', 'mpangaji', 'mwenye', 'shikamoo', 'tafuta',
            'pesa', 'malipo', 'maji', 'umeme', 'wapi', 'ngapi', 'ndiyo', 'hapana',
            'tafadhali', 'sawa', 'asante', 'leo', 'kesho', 'nini', 'nani', 'yangu',
            'zangu', 'wangu', 'mwenyeji', 'fundi', 'kazi', 'kufanya', 'hapa', 'gani',
            'naomba', 'msaada', 'saini', 'ankara', 'luku', 'dawasa',
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

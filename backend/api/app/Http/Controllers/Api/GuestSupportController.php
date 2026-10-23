<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\House;
use App\Models\User;
use App\Models\ViewingRequest;
use App\Notifications\AppNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class GuestSupportController extends Controller
{
    /**
     * Unauthenticated public AI support assistant for visitors and guests.
     * Rate limited: 30 requests per 15 minutes per IP.
     */
    public function chat(Request $request, \App\Ai\Orchestration\VeyoraOrchestrator $orchestrator): JsonResponse
    {
        $ip = $request->ip();
        $cacheKey = "guest_ai_throttle_{$ip}";
        $attempts = Cache::get($cacheKey, 0);

        if ($attempts >= 30) {
            return response()->json([
                'reply' => "You have sent many requests in a short period. Please wait a few moments before asking another question, or connect with our support team on WhatsApp.",
                'rate_limited' => true,
            ], 429);
        }

        Cache::put($cacheKey, $attempts + 1, now()->addMinutes(15));

        $validated = $request->validate([
            'message' => 'required|string|max:1000',
            'session_id' => 'nullable|string|max:100',
            'guest_name' => 'nullable|string|max:100',
            'lang' => 'nullable|string|in:en,sw',
            'history' => 'nullable|array',
            'house_id' => 'nullable|integer',
        ]);

        $message = trim($validated['message']);
        $lang = $validated['lang'] ?? 'en';
        $guestName = !empty($validated['guest_name']) ? trim(strip_tags($validated['guest_name'])) : null;
        $houseId = $validated['house_id'] ?? null;
        $sessionId = $validated['session_id'] ?? null;

        // Context knowledge regarding the house if specified
        $houseContext = null;
        if ($houseId) {
            $h = House::find($houseId);
            if ($h) {
                $houseContext = "Viewing House: {$h->property_name} in {$h->ward}, {$h->district}. Rent: TZS " . number_format($h->monthly_rent) . "/month.";
            }
        }

        // Process message through VeyoraOrchestrator model-first pipeline
        $reply = '';
        $presentation = 'text';
        $structuredData = null;
        $convId = $sessionId;

        try {
            $result = $orchestrator->handle(
                null, // Anonymous visitor / guest
                $message,
                $sessionId,
                [
                    'client' => 'web',
                    'lang' => $lang,
                    'guest_name' => $guestName,
                    'house_id' => $houseId,
                    'house_context' => $houseContext,
                ]
            );

            $reply = $result['response'] ?? '';
            $presentation = $result['presentation'] ?? 'text';
            $structuredData = $result['structured_data'] ?? null;
            $convId = $result['conversation_id'] ?? $sessionId;
        } catch (\Throwable $e) {
            $reply = \App\Ai\Knowledge\VeyoraKnowledgeEngine::answerWithKnowledge(null, $message, [
                'lang' => $lang,
                'guest_name' => $guestName,
                'house_id' => $houseId,
            ]);
        }

        if (empty($reply)) {
            $reply = \App\Ai\Knowledge\VeyoraKnowledgeEngine::answerWithKnowledge(null, $message, [
                'lang' => $lang,
                'guest_name' => $guestName,
                'house_id' => $houseId,
            ]);
        }

        // Fetch 2-3 relevant recommended houses if renter is asking about locations or listings
        $recommendedHouses = [];
        $lowMsg = strtolower($message);
        if (str_contains($lowMsg, 'room') || str_contains($lowMsg, 'house') || str_contains($lowMsg, 'rent') || str_contains($lowMsg, 'nyumba') || str_contains($lowMsg, 'chumba') || str_contains($lowMsg, 'dar') || str_contains($lowMsg, 'wapi')) {
            $recommendedHouses = House::live()
                ->select(['id', 'property_name', 'property_type', 'district', 'ward', 'monthly_rent', 'cover_image'])
                ->latest()
                ->limit(3)
                ->get()
                ->map(fn ($h) => [
                    'id' => $h->id,
                    'name' => $h->property_name,
                    'type' => $h->property_type,
                    'location' => "{$h->ward}, {$h->district}",
                    'monthly_rent' => (float) $h->monthly_rent,
                    'image' => $h->cover_image ? (str_starts_with($h->cover_image, 'http') ? $h->cover_image : "/storage/{$h->cover_image}") : null,
                ]);
        }

        return response()->json([
            'reply' => $reply,
            'lang' => $lang,
            'conversation_id' => $convId,
            'session_id' => $convId,
            'presentation' => $presentation,
            'structured_data' => $structuredData,
            'recommended_houses' => $recommendedHouses,
            'actions' => [],
        ]);
    }

    /**
     * Submit a guest inquiry or viewing request directly to the house owner.
     */
    public function inquiry(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'house_id' => 'required|exists:houses,id',
            'name' => 'required|string|max:100',
            'phone' => 'required|string|max:40',
            'email' => 'nullable|email|max:120',
            'preferred_at' => 'nullable|date',
            'message' => 'required|string|max:1000',
            'session_id' => 'nullable|string|max:100',
        ]);

        $house = House::with('owner')->findOrFail($validated['house_id']);

        // Find or create guest shadow user
        $email = $validated['email'] ?? ('guest_' . Str::slug($validated['name']) . '_' . Str::random(5) . '@pangapangisha.local');
        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'fullname' => $validated['name'],
                'phone' => $validated['phone'],
                'role' => 'renter',
                'password' => bcrypt(Str::random(24)),
            ]
        );

        $preferredAt = !empty($validated['preferred_at'])
            ? now()->parse($validated['preferred_at'])
            : now()->addDay()->setHour(10)->setMinute(0);

        $note = "Visitor Guest Inquiry: " . $validated['message'] . " (Contact: {$validated['phone']})";

        $viewing = ViewingRequest::create([
            'house_id' => $house->id,
            'user_id' => $user->id,
            'preferred_at' => $preferredAt,
            'note' => $note,
            'status' => 'pending',
        ]);

        // Notify landlord
        if ($house->owner) {
            $house->owner->notify(new AppNotification(
                'New Guest House Inquiry',
                "{$validated['name']} ({$validated['phone']}) inquired about {$house->property_name}: \"{$validated['message']}\"",
                "house:{$house->id}",
                'viewing'
            ));
        }

        return response()->json([
            'success' => true,
            'message' => 'Your inquiry has been delivered directly to the property owner. They will review your viewing request and contact you via phone or WhatsApp.',
            'inquiry_id' => $viewing->id,
            'house_name' => $house->property_name,
            'landlord_phone' => $house->owner?->phone ?: '+255712345678',
        ], 201);
    }

    /**
     * Domain knowledge & conversational AI prompt generator.
     */
    private function generateAgentResponse(string $message, string $lang, ?string $guestName, ?string $houseContext): string
    {
        $low = strtolower($message);
        $namePrefix = $guestName ? ($lang === 'sw' ? "Habari {$guestName}! " : "Hello {$guestName}! ") : "";

        // 1. Inquiries about Dalali / Broker fees
        if (str_contains($low, 'dalali') || str_contains($low, 'broker') || str_contains($low, 'fee') || str_contains($low, 'commission')) {
            if ($lang === 'sw') {
                return "{$namePrefix}Kwenye Panga-Pangisha **hakuna ada ya dalali (0% Dalali)**! Unawasiliana na kupanga moja kwa moja na mwenye nyumba aliyethibitishwa. Hakuna gharama za ziada au udanganyifu.";
            }
            return "{$namePrefix}At Panga-Pangisha, there are **0% broker fees (Zero Dalali)**! You connect directly with verified property owners and sign digital, legally sound agreements without middlemen commissions.";
        }

        // 2. Inquiries about STS LUKU prepaid submeters
        if (str_contains($low, 'luku') || str_contains($low, 'sts') || str_contains($low, 'umeme') || str_contains($low, 'meter') || str_contains($low, 'electric')) {
            if ($lang === 'sw') {
                return "{$namePrefix}Kila chumba au kitengo kina **mita yake binafsi ya STS LUKU** yenye keypad ndani ya chumba. Unaweza kuweka umeme wako moja kwa moja kupitia M-Pesa, Airtel Money au Tigo Pesa bila kugombana wala kuchangia bill na mtu.";
            }
            return "{$namePrefix}Each room or unit is equipped with its own **certified private STS LUKU prepaid submeter**. You enter your own electricity tokens on the keypad inside your room using M-Pesa, Airtel Money, or Tigo Pesa, ensuring complete financial independence.";
        }

        // 3. Inquiries about Rooms inside House / Compounds
        if (str_contains($low, 'room') || str_contains($low, 'chumba') || str_contains($low, 'compound') || str_contains($low, 'single') || str_contains($low, 'master')) {
            if ($lang === 'sw') {
                return "{$namePrefix}Ndiyo! Mfumo wetu unakuruhusu kupanga **chumba maalum** (kama Master En-Suite au chumba cha kawaida) chenye kodi yake na mita ya LUKU, huku ukifurahia ulinzi wa geti, maji ya DAWASA na usalama wa nyumba/compound yote.";
            }
            return "{$namePrefix}Yes! Our workflow allows you to rent a specific **Target Room** (with its own dedicated monthly rent, en-suite bath, and private STS meter), while enjoying the compound's gated security, parking, and DAWASA backup water.";
        }

        // 4. Inquiries about booking a viewing or contacting the owner
        if (str_contains($low, 'viewing') || str_contains($low, 'kuona') || str_contains($low, 'contact') || str_contains($low, 'mawasiliano') || str_contains($low, 'ongea') || str_contains($low, 'ongea na mtu')) {
            if ($lang === 'sw') {
                return "{$namePrefix}Unaweza kutuma ombi la kuona nyumba sasa hivi bila kujiandikisha! Bofya kitufe cha **'Tuma Ujumbe kwa Mwenye Nyumba'** hapa chini, chagua tarehe unayopenda, na mwenye nyumba atapokea taarifa zako papo hapo.";
            }
            return "{$namePrefix}You can book a viewing right now as a guest without creating an account! Tap **'Message House Owner'** below to send your contact and preferred time directly to the landlord.";
        }

        // 5. Inquiries about Water or Security
        if (str_contains($low, 'maji') || str_contains($low, 'water') || str_contains($low, 'ulinzi') || str_contains($low, 'security') || str_contains($low, 'guard')) {
            if ($lang === 'sw') {
                return "{$namePrefix}Nyumba zote zilizothibitishwa zina miundombinu ya maji ya DAWASA pamoja na matanki ya akiba (lita 3,000 - 5,000), uzio thabiti, na ulinzi wa mchana na usiku.";
            }
            return "{$namePrefix}Verified Panga sanctuaries are equipped with 24/7 DAWASA mains water connections + large backup storage tanks (3,000L - 5,000L), perimeter security walls, and dedicated guards.";
        }

        // Default greeting & guidance
        if ($lang === 'sw') {
            return "{$namePrefix}Karibu Panga-Pangisha! Ninaweza kukusaidia kupata chumba au nyumba bora Dar es Salaam (Kinondoni, Ilala, Temeke, Ubungo, Kigamboni), kuelewa mfumo wa mita za STS LUKU, au kuweka miadi ya kuona nyumba na mwenye nyumba moja kwa moja. Una swali gani leo?";
        }

        return "{$namePrefix}Welcome to Panga-Pangisha! I can help you discover verified rooms and compounds across Dar es Salaam (Kinondoni, Ilala, Ubungo, Kigamboni), explain our private STS LUKU submeters, or schedule a direct viewing with the property owner. How can I assist your search today?";
    }
}

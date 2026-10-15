<?php

namespace App\Ai\Orchestration;

use App\Ai\Agents\VeyoraAssistant;
use App\Ai\Knowledge\VeyoraKnowledge;
use App\Ai\Knowledge\VeyoraKnowledgeEngine;
use App\Ai\Knowledge\VeyoraKnowledgeRetriever;
use App\Ai\Memory\VeyoraMemoryManager;
use App\Ai\Presentation\VeyoraPresentationContract;
use App\Models\User;
use App\Services\Ai\AiGateway;
use Illuminate\Support\Str;
use Laravel\Ai\Models\Conversation;
use Laravel\Ai\Models\ConversationMessage;
use Throwable;

/**
 * Layer 1: Conversation Orchestrator for Veyora.
 *
 * Enforces the minimal sufficient processing path:
 * 1. Direct Conversational (Greetings, pleasantries) -> 0 MCP, 0 DB, 0 RAG
 * 2. Ambiguous Request Clarification -> Asks specific question, never guesses
 * 3. Prompt Injection Defense -> Neutral safety guardrail
 * 4. User Memory Retrieval -> Authenticated user history only, zero hallucination
 * 5. Curated Platform Knowledge -> Targeted markdown excerpts, no DB tools
 * 6. Live Authoritative Data / MCP Tools -> Permission-checked, precise math & currency
 */
class VeyoraOrchestrator
{
    public const ROUTE_DIRECT_CONVERSATIONAL = 'direct_conversational';
    public const ROUTE_DIRECT_MODEL = 'direct_model';
    public const ROUTE_DIRECT_GREETING = 'direct_greeting';
    public const ROUTE_DIRECT_CASUAL = 'direct_casual';
    public const ROUTE_CLARIFICATION = 'clarification';
    public const ROUTE_PROMPT_INJECTION_DEFENSE = 'prompt_injection_defense';
    public const ROUTE_USER_IDENTITY = 'user_identity';
    public const ROUTE_USER_MEMORY = 'user_memory';
    public const ROUTE_CURATED_KNOWLEDGE = 'curated_knowledge';
    public const ROUTE_LIVE_DATA_TOOL = 'live_data_tool';
    public const ROUTE_FALLBACK = 'fallback';

    public function __construct(
        protected AiGateway $gateway
    ) {}

    /**
     * Process an incoming message and return an orchestrated response.
     *
     * @return array{
     *     conversation_id: string,
     *     response: string,
     *     route: string,
     *     latency_ms: int,
     *     usage: array{input_tokens: int, output_tokens: int},
     *     tools_invoked: array<string>
     * }
     */
    /**
     * Model-First Pipeline:
     * 1. Authorize session in Laravel
     * 2. Load recent conversation history for context continuity
     * 3. Send message, context, platform knowledge and available tools to the configured AI model
     * 4. Model determines user intent, language, and whether tools are needed
     * 5. If no tools are required, model generates direct conversational answer (0 MCP calls)
     * 6. If tools are required, model invokes authorized tool(s) with validated arguments
     * 7. Results returned to model for natural explanation
     * 8. Presentation contract resolved directly from execution results
     * 9. Conversation saved once without duplication
     *
     * @return array{
     *     conversation_id: string,
     *     response: string,
     *     route: string,
     *     presentation: string,
     *     title: ?string,
     *     structured_data: ?array,
     *     actions: array,
     *     pagination: ?array,
     *     latency_ms: int,
     *     usage: array{input_tokens: int, output_tokens: int},
     *     tools_invoked: array<string>
     * }
     */
    public function handle(User $user, string $message, ?string $conversationId = null, array $context = []): array
    {
        $start = microtime(true);
        $messageText = trim($message);

        // 1. Authorize user session for Laravel and MCP tool execution
        auth()->setUser($user);

        // 2. Prepare VeyoraAssistant with authenticated user, screen context, and thread
        $assistant = (new VeyoraAssistant)->withContext($user, $context);
        if ($conversationId !== null) {
            $assistant->continue($conversationId, $user);
            $convId = $conversationId;
        } else {
            $assistant->forUser($user);
            $convId = null;
        }

        $replyText = '';
        $toolsInvoked = [];
        $toolResults = [];
        $usage = ['input_tokens' => 0, 'output_tokens' => 0];
        $route = self::ROUTE_DIRECT_CONVERSATIONAL;

        // 3. Send directly to configured AI model through AiGateway
        try {
            $response = $this->gateway->ask($user, 'veyora_assistant', $assistant, $messageText);

            $replyText = (string) ($response->text ?? '');
            $convId = $response->conversationId ?? $assistant->currentConversation() ?? $conversationId ?? (string) Str::uuid();
            $usage = [
                'input_tokens' => (int) ($response->usage?->inputTokens ?? 0),
                'output_tokens' => (int) ($response->usage?->outputTokens ?? 0),
            ];

            // Extract tools invoked and results from model execution
            if ($response->toolCalls && $response->toolCalls->isNotEmpty()) {
                $toolsInvoked = $response->toolCalls->map(fn ($tc) => $tc->name)->unique()->values()->all();
                $route = self::ROUTE_LIVE_DATA_TOOL;
            } else {
                $toolsInvoked = [];
                $route = self::ROUTE_DIRECT_CONVERSATIONAL;
            }

            if ($response->toolResults && $response->toolResults->isNotEmpty()) {
                $toolResults = $response->toolResults->all();
            }
        } catch (Throwable $e) {
            $convId = $convId ?: ($conversationId ?: (string) Str::uuid());
            $route = self::ROUTE_FALLBACK;
            $replyText = $this->handleGracefulFallback($user, $messageText, $e);

            // Record fallback message pair so the thread maintains continuity in history
            $this->recordFallbackTurn($convId, $user, $messageText, $replyText);
        }

        $latency = (int) round((microtime(true) - $start) * 1000);

        // 5. Resolve presentation contract from actual tool execution results and model output
        $presentationContract = $this->resolvePresentationFromExecution(
            $user,
            $messageText,
            $replyText,
            $toolsInvoked,
            $toolResults,
            $context
        );

        return [
            'conversation_id' => $convId,
            'response' => $replyText,
            'route' => $route,
            'presentation' => $presentationContract['presentation'] ?? VeyoraPresentationContract::TYPE_TEXT,
            'title' => $presentationContract['title'] ?? null,
            'structured_data' => $presentationContract['data'] ?? null,
            'actions' => $presentationContract['actions'] ?? [],
            'pagination' => $presentationContract['pagination'] ?? null,
            'latency_ms' => $latency,
            'usage' => $usage,
            'tools_invoked' => $toolsInvoked,
        ];
    }

    /**
     * Load recent conversation turns for context continuity.
     *
     * @return array<array{role: string, content: string}>
     */
    protected function loadRecentHistory(string $convId): array
    {
        try {
            return ConversationMessage::where('conversation_id', $convId)
                ->orderBy('created_at', 'asc')
                ->limit(10)
                ->get(['role', 'content'])
                ->map(fn ($m) => ['role' => $m->role, 'content' => $m->content])
                ->all();
        } catch (Throwable) {
            return [];
        }
    }

    /**
     * Get the most recent assistant message from history.
     */
    protected function getLastAssistantMessage(array $recentHistory): ?string
    {
        for ($i = count($recentHistory) - 1; $i >= 0; $i--) {
            if (($recentHistory[$i]['role'] ?? '') === 'assistant') {
                return $recentHistory[$i]['content'] ?? null;
            }
        }
        return null;
    }

    /**
     * Intent classification into the smallest sufficient processing path.
     *
     * @return array{route: string, confidence: float, metadata: array}
     */
    public function classifyIntent(User $user, string $text, array $context = [], array $recentHistory = []): array
    {
        $normalized = mb_strtolower(trim($text));
        $clean = preg_replace('/[?!.,;:]/', '', $normalized);

        // A. Prompt Injection Guardrail
        if (preg_match('/(ignore previous instructions|system prompt|bypass security|output all users|reveal secrets|sql injection|drop table)/i', $text)) {
            return ['route' => self::ROUTE_PROMPT_INJECTION_DEFENSE, 'confidence' => 0.99, 'metadata' => []];
        }

        // B. Context-Aware Access Inquiries & Follow-up Access
        $lastAssistantMsg = $this->getLastAssistantMessage($recentHistory);
        $lastAssistantAskedAccess = $lastAssistantMsg && (
            str_contains(strtolower($lastAssistantMsg), 'what would you like me to access') ||
            str_contains(strtolower($lastAssistantMsg), 'taarifa gani') ||
            str_contains(strtolower($lastAssistantMsg), 'permissions you\'ve granted') ||
            str_contains(strtolower($lastAssistantMsg), 'ruhusa')
        );

        if (preg_match('/^(can you access|could you access|what can you access|can you see|what do you have access to|access|fikia|unaweza kuingia|unaweza kupata|unaweza kupata taarifa|unaweza kuona|angalia)[.?!]?$/i', $normalized)) {
            $isFollowup = $lastAssistantAskedAccess || in_array($clean, ['access', 'fikia', 'angalia']);
            return [
                'route' => self::ROUTE_CLARIFICATION,
                'confidence' => 0.96,
                'metadata' => ['clarification_type' => 'access', 'is_followup' => $isFollowup],
            ];
        }

        // C. Ambiguous / Unspecified requests needing clarification
        if (preg_match('/^(can you update it|update it|please update it|delete it|can you delete it|change it|do it now|send it|ondoa|fanya hivyo)[.?!]?$/i', $normalized)) {
            return [
                'route' => self::ROUTE_CLARIFICATION,
                'confidence' => 0.95,
                'metadata' => ['clarification_type' => 'mutation'],
            ];
        }

        // D. Identity queries ("Do you know who I am?")
        if (preg_match('/^(do you know who i am|who am i|do you know my name|unajua mimi ni nani|unanijua mimi ni nani|unajua jina langu|unanifahamu|unajua mimi nani)[.?!]?$/i', $clean)) {
            return ['route' => self::ROUTE_USER_IDENTITY, 'confidence' => 0.97, 'metadata' => []];
        }

        // E. Pure Greetings (Direct path: 0 MCP, 0 DB, 0 RAG)
        $pureGreetings = [
            'hi', 'hello', 'hey', 'mambo', 'habari', 'habari yako', 'habari za asubuhi',
            'habari za mchana', 'habari za jioni', 'niaje', 'salama', 'kuna mtu',
            'uko hapo', 'mambo vipi', 'shikamoo', 'hi veyora', 'hello veyora', 'mambo veyora',
        ];
        if (in_array($clean, $pureGreetings)) {
            return ['route' => self::ROUTE_DIRECT_GREETING, 'confidence' => 0.98, 'metadata' => []];
        }

        // F. Casual conversation & pleasantries (0 MCP, 0 DB)
        $casualPhrases = [
            'how are you', 'how are you doing', 'habari ya leo', 'unaendeleaje', 'asante', 'thank you',
            'thanks', 'asante sana', 'goodbye', 'kwaheri', 'who are you', 'wewe ni nani', 'unaitwa nani',
            'what is your name', 'tell me about yourself', 'what do you do',
        ];
        if (in_array($clean, $casualPhrases) ||
            (preg_match('/^(how are you|how are you doing|habari ya leo|unaendeleaje|asante|thank you|thanks)\b/i', $normalized) &&
             ! preg_match('/(property|rent|house|room|meter|account|bill|unit|kodi|nyumba|chumba|pesa)/i', $normalized))) {
            return ['route' => self::ROUTE_DIRECT_CASUAL, 'confidence' => 0.95, 'metadata' => []];
        }

        // G. Memory queries (past conversations or ongoing tasks)
        if (preg_match('/(what was i (doing|working on)|what did we talk about|yesterday|earlier|do you remember|tuliongea nini|jana nilikuwa|kumbukumbu yangu)/i', $normalized)) {
            return ['route' => self::ROUTE_USER_MEMORY, 'confidence' => 0.92, 'metadata' => []];
        }

        // H. Curated Knowledge (general concepts, definitions, rules, educational)
        if (preg_match('/^(what is|explain|how does renting work|nini maana ya|eleza|jinsi gani|napa code|security deposit|dhamana ya pango|tenant rights|haki za mpangaji)/i', $normalized) &&
            ! preg_match('/(my|wangu|yangu|mine|have i|nilipolipa|collect)/i', $normalized)) {
            return ['route' => self::ROUTE_CURATED_KNOWLEDGE, 'confidence' => 0.90, 'metadata' => []];
        }

        // I. Authoritative live data or actions (requires MCP tools)
        return ['route' => self::ROUTE_LIVE_DATA_TOOL, 'confidence' => 0.85, 'metadata' => []];
    }

    /**
     * Handle Direct Greeting (0 MCP calls, 0 DB calls).
     */
    protected function handleDirectGreeting(User $user, string $text, array $recentHistory = []): string
    {
        $isSw = VeyoraKnowledgeEngine::detectSwahili($text);
        $firstName = explode(' ', trim($user->fullname ?? ''))[0];

        // If this conversation already has prior messages, avoid repeating the initial introductory monologue
        if (! empty($recentHistory)) {
            if ($isSw) {
                $nameGreeting = $firstName ? "Habari tena {$firstName}! 😊" : "Habari tena! 😊";
                return "{$nameGreeting} Niko hapa—nikusaidie nini kwa sasa?";
            }

            $nameGreeting = $firstName ? "Hey {$firstName}! 😊" : "Hey! 😊";
            return "{$nameGreeting} How can I help you right now?";
        }

        if ($isSw) {
            $nameGreeting = $firstName ? "Habari {$firstName}! 😊" : "Habari! 😊";
            return "{$nameGreeting} Karibu sana! Unaendeleaje leo? Niko hapa kwa ajili yako—iwe unataka tuzungumzie nyumba, mkataba, au ushauri wowote. Nikusaidie nini leo?";
        }

        $nameGreeting = $firstName ? "Hey {$firstName}! 😊" : "Hey! 😊";
        return "{$nameGreeting} Good to connect with you. How's your day going? What's on your mind today?";
    }

    /**
     * Handle Direct Casual / Pleasantries (0 MCP calls, 0 DB calls).
     */
    protected function handleDirectCasual(User $user, string $text): string
    {
        $isSw = VeyoraKnowledgeEngine::detectSwahili($text);
        $clean = mb_strtolower(trim($text));

        if (str_contains($clean, 'thank') || str_contains($clean, 'asante')) {
            return $isSw
                ? "Karibu sana! 😊 Daima nipo hapa kukusaidia. Lolote likijitokeza, niambie tu!"
                : "You're very welcome! 😊 Always here to help. Let me know if you need anything else!";
        }

        if (str_contains($clean, 'who are you') || str_contains($clean, 'wewe ni nani') || str_contains($clean, 'unaitwa nani')) {
            return $isSw
                ? "Mimi ni Veyora, msaidizi wako rafiki wa AI wa Panga na Kupangisha. Ninaelewa mfumo mzima wa nyumba Tanzania na nipo hapa kukusaidia kwa masuala ya nyumba au mazungumzo yoyote!"
                : "I'm Veyora, your friendly AI companion and housing expert for Panga Pangisha. I help you navigate finding homes, leases, payments, and everyday questions in Tanzania!";
        }

        return $isSw
            ? "Mimi niko salama kabisa na tayari kukusaidia! 😊 Unaendeleaje na siku yako?"
            : "I'm doing great, thank you for asking! 😊 How has your day been going?";
    }

    /**
     * Handle User Identity queries ("Do you know who I am?").
     * Uses authorized session context honestly without claiming details not available.
     */
    protected function handleUserIdentity(User $user, string $text): string
    {
        $isSw = VeyoraKnowledgeEngine::detectSwahili($text);
        $fullName = trim($user->fullname ?? '');

        if ($fullName === '' || ! $user->exists) {
            return $isSw
                ? "Kwa sasa unatumia mfumo kama mgeni, hivyo sina taarifa za akaunti yako. Ukijisajili au kuingia kwenye akaunti yako, nitaweza kukusaidia kulingana na wasifu wako!"
                : "You're currently chatting as a guest, so I don't have your account details on file. Feel free to log in so I can assist you with your specific properties and tenancies!";
        }

        $role = $user->role === 'landlord' ? 'landlord' : ($user->role === 'renter' ? 'tenant' : ($user->role ?: 'user'));
        $roleSw = $user->role === 'landlord' ? 'mwenye nyumba' : ($user->role === 'renter' ? 'mpangaji' : 'mtumiaji');

        if ($isSw) {
            return "Ndiyo, ninakutambua kama {$fullName}, uliyejisajili kama {$roleSw} kwenye Panga Pangisha. Sina taarifa zako binafsi zaidi ya wasifu wako uliopo kwenye akaunti hii na yale unayoshiriki nami. Nikusaidie nini leo?";
        }

        return "Yes, I know you as {$fullName}, registered as a {$role} on Panga Pangisha. I only have access to information within your authorized account profile and what you share with me in our chat. How can I help you today?";
    }

    /**
     * Handle Ambiguous requests needing clarification.
     */
    protected function handleClarification(User $user, string $text, array $metadata = [], array $recentHistory = []): string
    {
        $isSw = VeyoraKnowledgeEngine::detectSwahili($text);
        $type = $metadata['clarification_type'] ?? 'mutation';
        $isFollowup = $metadata['is_followup'] ?? false;

        if ($type === 'access') {
            if ($isFollowup) {
                return $isSw
                    ? "Tafadhali nieleze unataka nikague au kufikia nini hasa—kwa mfano, vyumba vyako vya kupangisha, rekodi za malipo, maombi ya marekebisho, au orodha ya nyumba zako?"
                    : "Please let me know specifically what you'd like me to look into—for example, your rental units, payment records, maintenance requests, or property listings?";
            }

            return $isSw
                ? "Ungependa nikague au kupata taarifa gani? Ninaweza kukusaidia kwa taarifa zinazopatikana kupitia akaunti yako na ruhusa ulizotoa."
                : "What would you like me to access? I can help with information available to me through your account and the permissions you've granted.";
        }

        // Default: Mutation clarification
        if ($isSw) {
            return "Samahani, ungependa nibadilishe au niondoe nini hasa? Kwa mfano, unataka kubadilisha kodi ya nyumba, hali ya chumba (wazi au kimepangishwa), au maelezo ya wasifu wako?";
        }

        return "What would you like me to update or modify? For example, are you looking to update a property's monthly rent, a unit's availability status, or your personal profile details?";
    }

    /**
     * Handle prompt-injection attempts.
     */
    protected function handleInjectionDefense(User $user, string $text): string
    {
        $isSw = VeyoraKnowledgeEngine::detectSwahili($text);

        if ($isSw) {
            return "Nipo hapa kama Veyora kukusaidia kwa masuala ya nyumba na mfumo wa Panga Pangisha kwa njia salama na ya kuaminika. Ninawezaje kukusaidia kuhusu upangaji leo?";
        }

        return "I'm here as Veyora to help you safely and reliably with housing and your Panga Pangisha account. How can I assist you with your rental journey today?";
    }

    /**
     * Handle User Memory retrieval (strictly isolated to authenticated user).
     */
    protected function handleUserMemory(User $user, string $text, string $convId): string
    {
        $isSw = VeyoraKnowledgeEngine::detectSwahili($text);
        $memory = VeyoraMemoryManager::recallRelevantMemory($user, $text, $convId);

        if (! $memory['found']) {
            return $isSw
                ? "Sina kumbukumbu ya mazungumzo au kazi tuliyofanya jana kwenye mfumo. Kama ulikuwa unatafuta nyumba au kukagua mkataba, niambie na tunaweza kuendelea mara moja!"
                : "I don't have a record of what you were working on yesterday. If you were searching for properties, checking a lease, or drafting a listing, let me know and we can pick up right from there!";
        }

        if ($isSw) {
            return "Kutoka kwenye kumbukumbu ya mazungumzo yako ya awali:\n" . $memory['memory_text'] . "\nJe, ungependa tuendelee na moja ya haya leo?";
        }

        return "Here is what I recall from your recent authorized activity:\n" . $memory['memory_text'] . "\nWould you like to continue with any of these today?";
    }

    /**
     * Handle Curated Knowledge retrieval (direct answers from knowledge, 0 MCP tool calls).
     */
    protected function handleCuratedKnowledge(User $user, string $text, array $context, array &$usage): string
    {
        $results = VeyoraKnowledgeRetriever::retrieve($text, limit: 2);

        // Fallback knowledge engine if no file matched
        if (empty($results)) {
            return VeyoraKnowledgeEngine::answerWithKnowledge($user, $text, $context);
        }

        // Generate response using knowledge content
        $bestMatch = $results[0]['content'];
        $isSw = VeyoraKnowledgeEngine::detectSwahili($text);

        // If simple definition, provide clean summary directly
        if (str_contains(strtolower($text), 'security deposit') || str_contains(strtolower($text), 'dhamana ya pango')) {
            return $isSw
                ? "Dhamana ya pango (security deposit) ni kiasi cha fedha (mara nyingi sawa na kodi ya mwezi 1 au 2) anacholipa mpangaji mwanzoni mwa mkataba. Lengo lake ni kumlinda mwenye nyumba endapo kuna bili za maji/umeme ambazo hazijalipwa au uharibifu wa nyumba unaozidi uchakavu wa kawaida. Mkataba unapokwisha na nyumba ikiwa salama, mwenye nyumba anapaswa kurejesha fedha hizi."
                : "A security deposit (often called *dhamana ya pango* in Tanzania) is a refundable payment made by the tenant upon moving in—typically equivalent to 1 or 2 months' rent. Its purpose is to protect the landlord against unpaid utility bills (like LUKU or DAWASA) or structural damage beyond fair wear and tear. When your lease concludes and the premises are handed back in good order, the deposit must be refunded to you.";
        }

        return $bestMatch;
    }

    /**
     * Handle Full LLM Agent Execution with authenticated tools.
     *
     * @return array{response: string, tools_invoked: array<string>, usage: array{input_tokens: int, output_tokens: int}, route: string}
     */
    protected function handleLlmWithTools(User $user, string $text, string $convId, array $context, array $recentHistory = []): array
    {
        $normalized = mb_strtolower(trim($text));
        $isUnitsRequest = preg_match('/(all (my )?rental units|all (my )?units|show (me )?(all )?(my )?units|vyumba vyangu vyote|orodha ya vyumba)/i', $normalized);

        $assistant = (new VeyoraAssistant)->withContext($user, $context);
        $assistant->continue($convId, $user);

        try {
            $response = $this->gateway->ask($user, 'veyora_assistant', $assistant, $text);

            return [
                'response' => $response->text,
                'tools_invoked' => $assistant->invokedTools ?? ($isUnitsRequest ? ['list_rental_units'] : []),
                'usage' => [
                    'input_tokens' => $response->usage?->inputTokens ?? 0,
                    'output_tokens' => $response->usage?->outputTokens ?? 0,
                ],
                'route' => self::ROUTE_LIVE_DATA_TOOL,
            ];
        } catch (Throwable $e) {
            // If the user requested their rental units and gateway is unavailable, execute authorized tool directly
            if ($isUnitsRequest && ($user->role === 'landlord' || $user->role === 'admin')) {
                auth()->setUser($user);
                $tool = new \App\Mcp\Tools\Property\ListRentalUnitsTool();
                $mcpReq = new \Laravel\Mcp\Request();
                $res = $tool->handle($mcpReq);
                $data = json_decode((string) $res->content(), true);

                $unitCount = $data['count'] ?? 0;
                $reply = $unitCount > 0
                    ? "Here are your {$unitCount} registered rental unit(s) across your properties:"
                    : "You currently don't have any rental units registered under your properties. Would you like to add one?";

                return [
                    'response' => $reply,
                    'tools_invoked' => ['list_rental_units'],
                    'usage' => ['input_tokens' => 0, 'output_tokens' => 0],
                    'route' => self::ROUTE_LIVE_DATA_TOOL,
                ];
            }

            // Resilient Fallback: Never crash on timeout or provider quota block
            $fallback = VeyoraKnowledgeEngine::answerWithKnowledge($user, $text, $context, $recentHistory);

            return [
                'response' => $fallback,
                'tools_invoked' => [],
                'usage' => ['input_tokens' => 0, 'output_tokens' => 0],
                'route' => self::ROUTE_FALLBACK,
            ];
        }
    }

    /**
     * Handle graceful, honest fallback when AI provider or network is unavailable.
     */
    protected function handleGracefulFallback(User $user, string $text, Throwable $e): string
    {
        $isSw = VeyoraKnowledgeEngine::detectSwahili($text);
        $firstName = explode(' ', trim($user->fullname ?? 'Rafiki'))[0];

        if ($isSw) {
            return "Samahani {$firstName}, siwezi kuunganishwa na mfumo wa AI kwa sasa ili kuchakata ujumbe wako. Tafadhali jaribu tena baada ya muda mfupi au wasiliana na huduma kwa wateja kwa msaada.";
        }

        return "I'm temporarily unable to connect to the AI model to process your request right now. Please try again shortly, or reach out to customer support if you need immediate assistance.";
    }

    /**
     * Record fallback message pair when AI model failed before writing conversation turn.
     */
    protected function recordFallbackTurn(string $convId, User $user, string $userText, string $fallbackReply): void
    {
        try {
            $now = now();
            $partType = Conversation::participantType($user);
            $partId = $user->id;

            Conversation::firstOrCreate(
                ['id' => $convId],
                [
                    'participant_type' => $partType,
                    'participant_id' => $partId,
                    'title' => Str::limit($userText, 40),
                ]
            );

            ConversationMessage::create([
                'id' => (string) Str::uuid7(),
                'conversation_id' => $convId,
                'participant_type' => $partType,
                'participant_id' => $partId,
                'agent' => VeyoraAssistant::class,
                'role' => 'user',
                'content' => $userText,
                'attachments' => [],
                'steps' => [],
                'usage' => [],
                'meta' => [],
                'status' => 'completed',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            ConversationMessage::create([
                'id' => (string) Str::uuid7(),
                'conversation_id' => $convId,
                'participant_type' => $partType,
                'participant_id' => $partId,
                'agent' => VeyoraAssistant::class,
                'role' => 'assistant',
                'content' => $fallbackReply,
                'attachments' => [],
                'steps' => [],
                'usage' => [],
                'meta' => [],
                'status' => 'completed',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            Conversation::where('id', $convId)->update(['updated_at' => $now]);
        } catch (Throwable) {
            // Silently maintain continuity
        }
    }

    /**
     * Resolve adaptive presentation contract from actual tool execution results and client device context.
     * Never re-invokes tools based on keyword regexes.
     */
    protected function resolvePresentationFromExecution(
        User $user,
        string $text,
        string $replyText,
        array $toolsInvoked,
        array $toolResults,
        array $context
    ): array {
        $isMobile = ($context['client'] ?? $context['device'] ?? '') === 'mobile' || ($context['screen'] ?? '') === 'VeyoraAssistantScreen';

        // 1. If tools were invoked, check tool-specific presentation contracts
        // A. Rental Agreement Preparation & Terms Update
        if (in_array('prepare_rental_agreement', $toolsInvoked, true) || in_array('update_agreement_terms', $toolsInvoked, true)) {
            $toolName = in_array('prepare_rental_agreement', $toolsInvoked, true) ? 'prepare_rental_agreement' : 'update_agreement_terms';
            $data = $this->extractToolData($toolName, $toolResults, function () { return []; });
            if (!empty($data) && !empty($data['agreement_id'])) {
                $agId = $data['agreement_id'];
                $rentFormatted = number_format($data['monthly_rent'] ?? 0);
                $depFormatted = number_format($data['security_deposit'] ?? 0);
                $notificationMsg = $data['notification'] ?? 'Mkataba wa upangaji umeandaliwa. Hakiki (Preview) na uhifadhi kabla ya kumtumia mpangaji.';

                return VeyoraPresentationContract::detail(
                    title: "Mkataba wa Upangishaji (Draft Preview #{$data['agreement_number']})",
                    summary: $replyText ?: $notificationMsg,
                    entityType: 'agreement',
                    profile: [
                        'agreement_id' => $agId,
                        'agreement_number' => $data['agreement_number'] ?? "MKT-{$agId}",
                        'status' => 'draft_pending_review',
                        'tenant_name' => $data['tenant_name'] ?? 'Mpangaji',
                        'unit_number' => $data['unit_number'] ?? 'Chumba',
                        'monthly_rent' => "TZS {$rentFormatted}",
                        'security_deposit' => "TZS {$depFormatted}",
                        'starts_on' => $data['starts_on'] ?? '',
                        'ends_on' => $data['ends_on'] ?? '',
                        'duration' => ($data['duration_months'] ?? 6) . ' Miezi',
                        'action_required' => 'preview_and_save',
                        'notification' => $notificationMsg,
                    ],
                    sections: [
                        [
                            'title' => 'Maelezo ya Upangaji na Kodi',
                            'fields' => [
                                ['label' => 'Jina la Mpangaji', 'value' => $data['tenant_name'] ?? 'Mpangaji'],
                                ['label' => 'Chumba / Unit', 'value' => $data['unit_number'] ?? 'Chumba'],
                                ['label' => 'Kodi ya Mwezi', 'value' => "TZS {$rentFormatted}"],
                                ['label' => 'Dhamana (Deposit)', 'value' => "TZS {$depFormatted}"],
                                ['label' => 'Kuanza Tarehe', 'value' => $data['starts_on'] ?? ''],
                                ['label' => 'Muda wa Mkataba', 'value' => ($data['duration_months'] ?? 6) . ' Miezi'],
                            ]
                        ]
                    ],
                    actions: [
                        ['id' => 'preview_agreement', 'label' => 'Hakiki Mkataba (Preview)', 'type' => 'view_agreement', 'payload' => ['id' => $agId]],
                        ['id' => 'sign_agreement', 'label' => 'Weka Saini (Sign)', 'type' => 'sign_agreement', 'payload' => ['id' => $agId]],
                        ['id' => 'print_agreement', 'label' => 'Chapisha Hati (Print/PDF)', 'type' => 'open_url', 'payload' => ['url' => "/landlord/agreements/{$agId}/print"]],
                    ]
                );
            }
        }

        // B. Invoice Generation
        if (in_array('generate_invoice', $toolsInvoked, true)) {
            $data = $this->extractToolData('generate_invoice', $toolResults, function () { return []; });
            if (!empty($data) && !empty($data['invoice_id'])) {
                $invId = $data['invoice_id'];
                $dueFormatted = number_format($data['amount_due'] ?? 0);
                $notificationMsg = $data['notification'] ?? "Ankara {$data['invoice_number']} imeundwa kikamilifu. Hakiki kabla ya kushiriki na mpangaji.";

                return VeyoraPresentationContract::detail(
                    title: "Ankara Mpya ya Malipo ({$data['invoice_number']})",
                    summary: $replyText ?: $notificationMsg,
                    entityType: 'invoice',
                    profile: [
                        'invoice_id' => $invId,
                        'invoice_number' => $data['invoice_number'],
                        'status' => $data['status'] ?? 'issued',
                        'tenant_name' => $data['tenant_name'] ?? 'Mpangaji',
                        'unit_number' => $data['unit_number'] ?? 'Chumba',
                        'amount_due' => "TZS {$dueFormatted}",
                        'due_date' => $data['due_date'] ?? '',
                        'period' => $data['billing_period'] ?? '',
                        'action_required' => 'preview_and_save',
                        'notification' => $notificationMsg,
                    ],
                    sections: [
                        [
                            'title' => 'Mchanganuo wa Ankara (Line Items)',
                            'fields' => array_map(function ($item) {
                                return [
                                    'label' => $item['description'] ?? 'Huduma',
                                    'value' => 'TZS ' . number_format($item['amount'] ?? 0),
                                ];
                            }, $data['line_items'] ?? [])
                        ]
                    ],
                    actions: [
                        ['id' => 'view_invoice', 'label' => 'Angalia Ankara (Preview)', 'type' => 'view_invoice', 'payload' => ['id' => $invId]],
                        ['id' => 'share_invoice', 'label' => 'Tuma kwa Mpangaji (Share)', 'type' => 'share_invoice', 'payload' => ['id' => $invId]],
                        ['id' => 'record_payment', 'label' => 'Rekodi Malipo (Pay)', 'type' => 'record_payment', 'payload' => ['id' => $invId]],
                        ['id' => 'print_invoice', 'label' => 'Chapisha (PDF)', 'type' => 'open_url', 'payload' => ['url' => "/landlord/invoices/{$invId}/print"]],
                    ]
                );
            }
        }

        // C. Room Occupancy Duration & Expirations
        if (in_array('get_occupancy_duration', $toolsInvoked, true)) {
            $data = $this->extractToolData('get_occupancy_duration', $toolResults, function () { return []; });
            $rooms = $data['rooms'] ?? ($data['expiring_rooms'] ?? []);
            if (!empty($rooms)) {
                $items = array_map(function ($r) {
                    $tenant = $r['current_tenant'] ?? null;
                    $status = $r['status'] ?? 'vacant';
                    $duration = $tenant['duration'] ?? 'Vacant';
                    return [
                        'id' => $r['unit_id'] ?? 0,
                        'title' => ($r['property_name'] ?? 'Nyumba') . ' — ' . ($r['unit_number'] ?? 'Unit'),
                        'subtitle' => $tenant ? "Mpangaji: {$tenant['name']} &bull; Muda: {$duration}" : 'Chumba kiko wazi (Vacant)',
                        'badge' => $tenant && !empty($tenant['is_expiring_soon']) ? 'Inaisha Hivi Karibuni' : ucfirst($status),
                        'status' => $status,
                        'price' => 'TZS ' . number_format($r['monthly_rent'] ?? 0) . '/mo',
                        'specs' => $tenant ? "Kodi: {$tenant['payment_status']} (Salio: TZS " . number_format($tenant['outstanding_balance'] ?? 0) . ")" : "Hakuna mpangaji",
                    ];
                }, $rooms);

                return VeyoraPresentationContract::entityList(
                    title: 'Ukaaji na Muda wa Vyumba (Occupancy Tracker)',
                    summary: $replyText ?: ($data['message'] ?? 'Hapa kuna hali ya vyumba na muda wa ukaaji:'),
                    entityType: 'occupancy',
                    items: $items,
                    pagination: null,
                    actions: [
                        ['id' => 'view_occupancy', 'label' => 'Angalia Vyumba Vyote', 'type' => 'navigate', 'payload' => ['screen' => 'occupancy']],
                    ]
                );
            }
        }

        // D. Check Pending Signatures
        if (in_array('check_pending_signatures', $toolsInvoked, true)) {
            $data = $this->extractToolData('check_pending_signatures', $toolResults, function () { return []; });
            $reports = $data['reports'] ?? [];
            if (!empty($reports)) {
                $items = array_map(function ($rep) {
                    return [
                        'id' => $rep['agreement_id'] ?? 0,
                        'title' => "Mkataba {$rep['agreement_number']} ({$rep['property_name']} - {$rep['unit_number']})",
                        'subtitle' => "Mpangaji: {$rep['tenant_name']} &bull; Saini Mpangaji: " . ($rep['tenant_signed'] ? 'Tayari' : 'Inasubiri'),
                        'badge' => $rep['status_label'] ?? 'Inasubiri',
                        'status' => $rep['status'] ?? 'pending',
                        'price' => 'TZS ' . number_format($rep['monthly_rent'] ?? 0) . '/mo',
                        'specs' => implode(', ', $rep['pending_actions'] ?? []),
                    ];
                }, $reports);

                return VeyoraPresentationContract::entityList(
                    title: 'Hali ya Saini za Mikataba (Pending Signatures)',
                    summary: $replyText ?: 'Taarifa za saini na hatua zilizobaki:',
                    entityType: 'agreement',
                    items: $items,
                    pagination: null,
                    actions: [
                        ['id' => 'view_agreements', 'label' => 'Fungua Mikataba', 'type' => 'navigate', 'payload' => ['screen' => 'agreements']],
                    ]
                );
            }
        }

        if (in_array('get_arrears_alerts', $toolsInvoked, true)) {
            $data = $this->extractToolData('get_arrears_alerts', $toolResults, function () {
                $tool = new \App\Mcp\Tools\Rental\GetArrearsAlertsTool();
                return json_decode((string) $tool->handle(new \Laravel\Mcp\Request())->content(), true);
            });
            if (isset($data['contract'])) {
                $contract = $data['contract'];
                $contract['summary'] = $replyText ?: $contract['summary'];
                return $contract;
            }
        }

        if (in_array('get_rent_summary', $toolsInvoked, true)) {
            $parsed = $this->extractToolData('get_rent_summary', $toolResults, function () {
                $tool = new \App\Mcp\Tools\Rental\GetRentSummaryTool();
                return json_decode((string) $tool->handle(new \Laravel\Mcp\Request(['month' => now()->month, 'year' => now()->year]))->content(), true);
            });

            if (! empty($parsed) && ! isset($parsed['error'])) {
                $metrics = [
                    [
                        'label' => 'Total Collected',
                        'value' => 'TZS ' . number_format($parsed['total_collected_rent'] ?? 0),
                        'raw_value' => $parsed['total_collected_rent'] ?? 0,
                        'trend' => '+8%',
                        'direction' => 'up',
                        'icon' => 'banknotes',
                    ],
                    [
                        'label' => 'Pending Arrears',
                        'value' => 'TZS ' . number_format($parsed['total_pending_arrears'] ?? 0),
                        'raw_value' => $parsed['total_pending_arrears'] ?? 0,
                        'trend' => ($parsed['total_pending_arrears'] ?? 0) > 0 ? 'Due' : 'All Clear',
                        'direction' => ($parsed['total_pending_arrears'] ?? 0) > 0 ? 'warning' : 'neutral',
                        'icon' => 'alert',
                    ],
                    [
                        'label' => 'Expected Monthly',
                        'value' => 'TZS ' . number_format($parsed['total_expected_rent'] ?? 0),
                        'raw_value' => $parsed['total_expected_rent'] ?? 0,
                        'trend' => 'Monthly target',
                        'direction' => 'neutral',
                        'icon' => 'calendar',
                    ],
                ];

                return VeyoraPresentationContract::summary(
                    title: 'Monthly Rent Performance (' . now()->format('F Y') . ')',
                    summary: $replyText,
                    metrics: $metrics,
                    actions: [
                        ['id' => 'view_payments', 'label' => 'View Payment Ledger', 'type' => 'navigate', 'payload' => ['screen' => 'payments']],
                    ],
                    period: ['label' => now()->format('F Y'), 'currency' => 'TZS']
                );
            }
        }

        if (in_array('get_utility_trends', $toolsInvoked, true)) {
            $parsed = $this->extractToolData('get_utility_trends', $toolResults, function () use ($user) {
                $userHouse = \App\Models\House::where('owner_id', $user->id)->first();
                if ($userHouse) {
                    $tool = new \App\Mcp\Tools\Utilities\GetUtilityTrendsTool();
                    return json_decode((string) $tool->handle(new \Laravel\Mcp\Request(['house_id' => $userHouse->id]))->content(), true);
                }
                return null;
            });

            if (isset($parsed['contract'])) {
                $contract = $parsed['contract'];
                $contract['summary'] = $replyText ?: $contract['summary'];
                return $contract;
            }
        }

        if (in_array('compare_properties', $toolsInvoked, true)) {
            $parsed = $this->extractToolData('compare_properties', $toolResults, function () {
                $tool = new \App\Mcp\Tools\Property\ComparePropertiesTool();
                return json_decode((string) $tool->handle(new \Laravel\Mcp\Request())->content(), true);
            });

            if (isset($parsed['contract'])) {
                $contract = $parsed['contract'];
                $contract['summary'] = $replyText ?: $contract['summary'];
                if ($isMobile && isset($contract['data']['rows'])) {
                    return VeyoraPresentationContract::entityList(
                        title: $contract['title'],
                        summary: $replyText,
                        entityType: 'property',
                        items: array_map(function ($r) {
                            return [
                                'id' => $r['id'],
                                'title' => $r['property_name'],
                                'subtitle' => $r['district'],
                                'badge' => ($r['vacant_units'] ?? 0) . ' Vacant',
                                'status' => ($r['vacant_units'] ?? 0) > 0 ? 'available' : 'occupied',
                                'price' => 'TZS ' . number_format($r['monthly_rent']),
                                'specs' => ($r['units_total'] ?? 0) . ' Total Units',
                            ];
                        }, $contract['data']['rows']),
                        pagination: null,
                        actions: $contract['actions']
                    );
                }
                return $contract;
            }
        }

        if (in_array('get_unit_details', $toolsInvoked, true)) {
            $parsed = $this->extractToolData('get_unit_details', $toolResults, function () use ($user, $context) {
                $unitId = $context['unit_id'] ?? \App\Models\Unit::whereHas('house', fn ($q) => $q->where('owner_id', $user->id))->first()?->id;
                if ($unitId) {
                    $tool = new \App\Mcp\Tools\Property\GetUnitDetailsTool();
                    return json_decode((string) $tool->handle(new \Laravel\Mcp\Request(['unit_id' => $unitId]))->content(), true);
                }
                return null;
            });

            if (isset($parsed['contract'])) {
                $contract = $parsed['contract'];
                $contract['summary'] = $replyText ?: $contract['summary'];
                return $contract;
            }
        }

        if (in_array('get_vacant_units', $toolsInvoked, true)) {
            $parsed = $this->extractToolData('get_vacant_units', $toolResults, function () {
                $tool = new \App\Mcp\Tools\Property\GetVacantUnitsTool();
                return json_decode((string) $tool->handle(new \Laravel\Mcp\Request())->content(), true);
            });

            if (! empty($parsed['vacant_units'])) {
                if ($isMobile) {
                    $items = array_map(function ($u) {
                        return [
                            'id' => $u['unit_id'] ?? $u['house_id'],
                            'title' => ($u['property_name'] ?? 'Property') . ' — Unit ' . ($u['unit_number'] ?? 'Standard'),
                            'subtitle' => $u['district'] ?? 'Dar es Salaam',
                            'badge' => 'Vacant',
                            'status' => 'available',
                            'price' => 'TZS ' . number_format($u['monthly_rent'] ?? 0) . '/mo',
                            'specs' => 'Ready for tenant',
                        ];
                    }, $parsed['vacant_units']);

                    return VeyoraPresentationContract::entityList(
                        title: 'Vacant Units Portfolio',
                        summary: $replyText,
                        entityType: 'unit',
                        items: $items,
                        pagination: null,
                        actions: [
                            ['id' => 'add_unit', 'label' => 'Add Unit', 'type' => 'navigate', 'payload' => ['screen' => 'add_unit']],
                        ]
                    );
                }

                $columns = [
                    ['key' => 'property_name', 'label' => 'Property', 'align' => 'left'],
                    ['key' => 'unit_number', 'label' => 'Unit', 'align' => 'center'],
                    ['key' => 'district', 'label' => 'District', 'align' => 'left'],
                    ['key' => 'monthly_rent', 'label' => 'Rent (TZS)', 'align' => 'right', 'format' => 'currency'],
                ];
                return VeyoraPresentationContract::table(
                    title: 'Vacant Units Portfolio',
                    summary: $replyText,
                    columns: $columns,
                    rows: $parsed['vacant_units'],
                    pagination: null,
                    actions: []
                );
            }
        }

        if (in_array('list_rental_units', $toolsInvoked, true)) {
            $parsed = $this->extractToolData('list_rental_units', $toolResults, function () {
                $tool = new \App\Mcp\Tools\Property\ListRentalUnitsTool();
                return json_decode((string) $tool->handle(new \Laravel\Mcp\Request())->content(), true);
            });

            if (! empty($parsed['units'])) {
                if ($isMobile) {
                    $items = array_map(function ($u) {
                        $isAvail = ($u['status'] ?? '') === 'available';
                        return [
                            'id' => $u['unit_id'],
                            'title' => ($u['property_name'] ?? 'Property') . ' — Unit ' . ($u['unit_number'] ?? 'Standard'),
                            'subtitle' => $u['location'] ?? 'Dar es Salaam',
                            'badge' => $isAvail ? 'Vacant' : 'Occupied',
                            'status' => $isAvail ? 'available' : 'occupied',
                            'price' => 'TZS ' . number_format($u['monthly_rent'] ?? 0) . '/mo',
                            'specs' => trim((! empty($u['bedrooms']) ? $u['bedrooms'] . ' Bed ' : '') . (! empty($u['bathrooms']) ? $u['bathrooms'] . ' Bath' : 'Rental Unit')),
                        ];
                    }, $parsed['units']);

                    return VeyoraPresentationContract::entityList(
                        title: 'All Rental Units',
                        summary: $replyText ?: "Here are your {$parsed['count']} registered rental unit(s) across your properties:",
                        entityType: 'unit',
                        items: $items,
                        pagination: null,
                        actions: [
                            ['id' => 'add_unit', 'label' => 'Add Unit', 'type' => 'navigate', 'payload' => ['screen' => 'add_unit']],
                        ]
                    );
                }

                $columns = [
                    ['key' => 'property_name', 'label' => 'Property', 'align' => 'left'],
                    ['key' => 'unit_number', 'label' => 'Unit', 'align' => 'center'],
                    ['key' => 'status', 'label' => 'Status', 'align' => 'center'],
                    ['key' => 'monthly_rent', 'label' => 'Rent (TZS)', 'align' => 'right', 'format' => 'currency'],
                ];
                return VeyoraPresentationContract::table(
                    title: 'All Rental Units',
                    summary: $replyText ?: "Here are your {$parsed['count']} registered rental unit(s) across your properties:",
                    columns: $columns,
                    rows: $parsed['units'],
                    pagination: null,
                    actions: []
                );
            }
        }

        // 2. Default presentation for text/greetings/casual
        return VeyoraPresentationContract::text($replyText);
    }

    /**
     * Helper to extract tool output from execution toolResults, or fallback loader.
     */
    protected function extractToolData(string $toolName, array $toolResults, callable $fallback): ?array
    {
        foreach ($toolResults as $tr) {
            $name = is_object($tr) ? ($tr->name ?? null) : ($tr['name'] ?? null);
            if ($name === $toolName) {
                $raw = is_object($tr) && method_exists($tr, 'text') ? $tr->text() : (is_object($tr) ? ($tr->result ?? '') : ($tr['result'] ?? ''));
                if (is_array($raw)) {
                    return $raw;
                }
                $decoded = json_decode((string) $raw, true);
                if (is_array($decoded)) {
                    return $decoded;
                }
            }
        }

        return $fallback();
    }

    /**
     * Legacy proxy for backward compatibility.
     */
    protected function resolvePresentation(
        User $user,
        string $text,
        string $route,
        array $toolsInvoked,
        array $context,
        string $replyText
    ): array {
        return $this->resolvePresentationFromExecution($user, $text, $replyText, $toolsInvoked, [], $context);
    }

    /**
     * Legacy proxy for backward compatibility.
     */
    protected function recordMessagePair(string $convId, User $user, string $userText, string $assistantReply): void
    {
        $this->recordFallbackTurn($convId, $user, $userText, $assistantReply);
    }
}

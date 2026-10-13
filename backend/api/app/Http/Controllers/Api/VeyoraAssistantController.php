<?php

namespace App\Http\Controllers\Api;

use App\Ai\Agents\VeyoraAssistant;
use App\Ai\Knowledge\VeyoraKnowledgeEngine;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Ai\AiGateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Laravel\Ai\Models\Conversation;
use Laravel\Ai\Models\ConversationMessage;
use Throwable;

/**
 * Mobile and web application API endpoint for the interactive Veyora AI Assistant.
 * Provides resilient conversational intelligence, direct greeting handling,
 * conversation session history, and scoped authorization.
 */
class VeyoraAssistantController extends Controller
{
    /**
     * Send a message to Veyora and receive an intelligent response.
     */
    public function message(Request $r, AiGateway $gateway): JsonResponse
    {
        $d = $r->validate([
            'message' => 'required|string|min:1|max:3000',
            'conversation_id' => 'nullable|string|uuid',
            'context' => 'nullable|array',
            'context.screen' => 'nullable|string|max:80',
            'context.property_id' => 'nullable|integer',
            'context.unit_id' => 'nullable|integer',
            'context.role' => 'nullable|string|max:40',
        ]);

        $user = $r->user();
        $messageText = trim($d['message']);
        $convId = $d['conversation_id'] ?? (string) Str::uuid();

        // Verify existing conversation ownership
        if (! empty($d['conversation_id'])) {
            $existing = Conversation::find($d['conversation_id']);
            if ($existing && ($existing->participant_id != $user->id || $existing->participant_type !== Conversation::participantType($user))) {
                return response()->json(['error' => 'Unauthorized conversation access.'], 403);
            }
        }

        // 1. Direct Conversational Fast-Path (Greetings, intros, identity queries)
        if (VeyoraKnowledgeEngine::isGreeting($messageText)) {
            $greetingResponse = VeyoraKnowledgeEngine::directGreeting($user, $messageText);

            $this->recordMessagePair($convId, $user, $messageText, $greetingResponse);

            return response()->json([
                'conversation_id' => $convId,
                'response' => $greetingResponse,
                'usage' => ['input_tokens' => 0, 'output_tokens' => 0],
            ]);
        }

        // 2. Full LLM Agent Execution via Laravel AI SDK
        $assistant = (new VeyoraAssistant)
            ->withContext($user, $d['context'] ?? []);

        if (! empty($d['conversation_id'])) {
            $assistant->continue($convId, $user);
        } else {
            $assistant->forUser($user);
        }

        try {
            $response = $gateway->ask($user, 'veyora_assistant', $assistant, $messageText);

            $activeConvId = $assistant->currentConversation() ?: $convId;

            return response()->json([
                'conversation_id' => $activeConvId,
                'response' => $response->text,
                'usage' => [
                    'input_tokens' => $response->usage?->inputTokens ?? 0,
                    'output_tokens' => $response->usage?->outputTokens ?? 0,
                ],
            ]);
        } catch (Throwable $e) {
            // 3. Resilient Knowledge Fallback: Never crash on timeout or provider error
            $fallbackResponse = VeyoraKnowledgeEngine::answerWithKnowledge($user, $messageText, $d['context'] ?? []);

            $this->recordMessagePair($convId, $user, $messageText, $fallbackResponse);

            return response()->json([
                'conversation_id' => $convId,
                'response' => $fallbackResponse,
                'usage' => ['input_tokens' => 0, 'output_tokens' => 0],
            ]);
        }
    }

    /**
     * List user conversation threads for chat history.
     */
    public function indexConversations(Request $r): JsonResponse
    {
        $user = $r->user();

        $conversations = Conversation::where('participant_id', $user->id)
            ->where('participant_type', Conversation::participantType($user))
            ->orderBy('updated_at', 'desc')
            ->limit(30)
            ->get()
            ->map(function ($c) {
                $lastMsg = ConversationMessage::where('conversation_id', $c->id)
                    ->orderBy('created_at', 'desc')
                    ->first();

                return [
                    'id' => $c->id,
                    'title' => $c->title ?: 'Veyora Chat',
                    'preview' => $lastMsg ? Str::limit($lastMsg->content, 70) : null,
                    'created_at' => $c->created_at?->toIso8601String(),
                    'updated_at' => $c->updated_at?->toIso8601String(),
                    'messages_count' => ConversationMessage::where('conversation_id', $c->id)->count(),
                ];
            });

        return response()->json([
            'conversations' => $conversations,
        ]);
    }

    /**
     * Create a brand new conversation thread.
     */
    public function createConversation(Request $r): JsonResponse
    {
        $user = $r->user();
        $id = (string) Str::uuid();
        $title = $r->input('title', 'New Chat');

        Conversation::create([
            'id' => $id,
            'participant_type' => Conversation::participantType($user),
            'participant_id' => $user->id,
            'title' => $title,
        ]);

        return response()->json([
            'conversation_id' => $id,
            'title' => $title,
        ], 201);
    }

    /**
     * Retrieve messages for a specific conversation.
     */
    public function history(Request $r, string $conversationId): JsonResponse
    {
        $user = $r->user();
        $conv = Conversation::find($conversationId);

        if (! $conv || $conv->participant_id != $user->id || $conv->participant_type !== Conversation::participantType($user)) {
            return response()->json(['error' => 'Conversation not found or unauthorized.'], 404);
        }

        $messages = ConversationMessage::where('conversation_id', $conversationId)
            ->orderBy('created_at', 'asc')
            ->limit(60)
            ->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'role' => is_object($m->role) && enum_exists(get_class($m->role)) ? $m->role->value : (string) $m->role,
                'content' => $m->content,
                'created_at' => $m->created_at?->toIso8601String(),
            ]);

        return response()->json([
            'conversation_id' => $conversationId,
            'title' => $conv->title,
            'messages' => $messages,
        ]);
    }

    /**
     * Delete a conversation.
     */
    public function deleteConversation(Request $r, string $conversationId): JsonResponse
    {
        $user = $r->user();
        $conv = Conversation::find($conversationId);

        if (! $conv || $conv->participant_id != $user->id || $conv->participant_type !== Conversation::participantType($user)) {
            return response()->json(['error' => 'Conversation not found or unauthorized.'], 404);
        }

        ConversationMessage::where('conversation_id', $conversationId)->delete();
        $conv->delete();

        return response()->json(['message' => 'Conversation deleted successfully.']);
    }

    private function recordMessagePair(string $convId, User $user, string $userText, string $assistantReply): void
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
                'content' => $assistantReply,
                'attachments' => [],
                'steps' => [],
                'usage' => [],
                'meta' => [],
                'status' => 'completed',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            Conversation::where('id', $convId)->update(['updated_at' => $now]);
        } catch (Throwable $e) {
            // Silently maintain continuity
        }
    }
}

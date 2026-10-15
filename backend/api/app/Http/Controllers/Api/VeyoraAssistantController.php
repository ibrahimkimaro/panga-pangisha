<?php

namespace App\Http\Controllers\Api;

use App\Ai\Orchestration\VeyoraOrchestrator;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Laravel\Ai\Models\Conversation;
use Laravel\Ai\Models\ConversationMessage;
use Throwable;

/**
 * Mobile and web application API endpoint for the interactive Veyora AI Assistant.
 * Uses VeyoraOrchestrator for layered, intelligent, permission-safe processing.
 */
class VeyoraAssistantController extends Controller
{
    /**
     * Send a message to Veyora and receive an orchestrated response.
     */
    public function message(Request $r, VeyoraOrchestrator $orchestrator): JsonResponse
    {
        $d = $r->validate([
            'message' => 'required|string|min:1|max:3000',
            'conversation_id' => 'nullable|string|uuid',
            'context' => 'nullable|array',
            'context.client' => 'nullable|string|max:40',
            'context.device' => 'nullable|string|max:40',
            'context.screen' => 'nullable|string|max:80',
            'context.property_id' => 'nullable|integer',
            'context.unit_id' => 'nullable|integer',
            'context.role' => 'nullable|string|max:40',
        ]);

        $user = $r->user();
        $convId = $d['conversation_id'] ?? null;

        // Verify existing conversation ownership
        if (! empty($convId)) {
            $existing = Conversation::find($convId);
            if (! $existing) {
                return response()->json(['error' => 'Conversation not found.'], 404);
            }
            if ($existing->participant_id != $user->id || $existing->participant_type !== Conversation::participantType($user)) {
                return response()->json(['error' => 'Unauthorized conversation access.'], 403);
            }
        }

        // Delegate to Intelligent Conversation Orchestrator
        $result = $orchestrator->handle(
            $user,
            $d['message'],
            $convId,
            $d['context'] ?? []
        );

        return response()->json([
            'conversation_id' => $result['conversation_id'],
            'response' => $result['response'],
            'route' => $result['route'],
            'presentation' => $result['presentation'] ?? 'text',
            'title' => $result['title'] ?? null,
            'structured_data' => $result['structured_data'] ?? null,
            'actions' => $result['actions'] ?? [],
            'pagination' => $result['pagination'] ?? null,
            'latency_ms' => $result['latency_ms'],
            'usage' => $result['usage'],
            'tools_invoked' => $result['tools_invoked'],
        ]);
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

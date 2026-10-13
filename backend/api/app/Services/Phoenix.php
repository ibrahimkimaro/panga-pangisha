<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;

/** Laravel <-> Phoenix chat server: signs socket tokens, pushes live events. */
class Phoenix
{
    private static function secret(): string { return config('services.chat.secret'); }

    private static function b64(string $s): string { return rtrim(strtr(base64_encode($s), '+/', '-_'), '='); }

    /** HMAC token the socket accepts (see RealtimeChatWeb.UserSocket.verify/1). */
    public static function socketToken(User $u, int $ttl = 3600): string
    {
        $part = self::b64(json_encode([
            'sub' => $u->uuid, 'name' => $u->fullname, 'username' => $u->phone,
            'admin' => false, 'exp' => time() + $ttl,
        ]));
        return $part . '.' . self::b64(hash_hmac('sha256', "chat.$part", self::secret(), true));
    }

    public static function directTopic(User $a, User $b): string
    {
        $ids = [$a->uuid, $b->uuid];
        sort($ids, SORT_STRING);
        return 'direct:' . implode('_', $ids);
    }

    /** Bearer token Phoenix sends to /api/internal/push (and expects on /internal/events). */
    public static function internalToken(string $purpose): string
    {
        return hash_hmac('sha256', $purpose, self::secret());
    }

    /** Live-push an event to a user's open app (their "user:<uuid>" channel). Fire-and-forget. */
    public static function pushToUser(User $u, string $event, array $payload): void
    {
        try {
            Http::timeout(3)->withToken(self::internalToken('internal-events'))
                ->post(config('services.chat.internal_url') . '/internal/events', [
                    'events' => [['type' => 'user', 'user_id' => $u->uuid, 'event' => $event, 'payload' => $payload]],
                ]);
        } catch (\Throwable $e) {
            report($e); // user is offline-tolerant: the database notification still exists
        }
    }
}

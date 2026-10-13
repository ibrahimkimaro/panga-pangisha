<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\AppNotification;
use App\Services\Phoenix;
use Illuminate\Http\Request;

class InternalController extends Controller
{
    /**
     * Phoenix calls this when a chat message is stored (RealtimeChat.Push): user_ids are chat uuids.
     * Auth: Bearer hex(HMAC-SHA256(SECRET_KEY, "internal-push")).
     */
    public function push(Request $r)
    {
        abort_unless(hash_equals(Phoenix::internalToken('internal-push'), (string) $r->bearerToken()), 401);
        $d = $r->validate(['user_ids' => 'required|array', 'user_ids.*' => 'uuid', 'title' => 'required|string', 'body' => 'nullable|string', 'url' => 'nullable|string', 'tag' => 'nullable|string']);

        // Phoenix already shows chat messages live and keeps its own unread bell; Laravel adds the FCM hook point here.
        // ponytail: store-only for now; send FCM to $user->deviceTokens once Firebase credentials exist.
        foreach (User::whereIn('uuid', $d['user_ids'])->get() as $user) {
            logger()->info('chat push', ['user' => $user->id, 'title' => $d['title']]);
        }
        return ['ok' => true];
    }
}

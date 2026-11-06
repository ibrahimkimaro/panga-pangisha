<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\House;
use App\Models\Tenancy;
use App\Models\User;
use App\Notifications\AppNotification;
use App\Services\Phoenix;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class ChatController extends Controller
{
    /**
     * Resolves the authenticated user across Sanctum API tokens, Laravel web sessions,
     * or the Landlord/Tenant web dashboard context.
     */
    private function resolveUser(Request $r): User
    {
        if ($r->user()) {
            $u = $r->user();
            if (! $u->uuid) {
                $u->uuid = (string) Str::uuid();
                $u->saveQuietly();
            }
            return $u;
        }

        $bearer = $r->bearerToken() ?? $r->header('X-Auth-Token');
        if ($bearer) {
            $pat = \Laravel\Sanctum\PersonalAccessToken::findToken($bearer);
            if ($pat && $pat->tokenable instanceof User) {
                $u = $pat->tokenable;
                if (! $u->uuid) {
                    $u->uuid = (string) Str::uuid();
                    $u->saveQuietly();
                }
                return $u;
            }
        }

        $fallback = app(\App\Http\Controllers\Landlord\DashboardController::class)->resolveLandlord($r);
        abort_if(! $fallback, 401, 'Unauthenticated.');
        if (! $fallback->uuid) {
            $fallback->uuid = (string) Str::uuid();
            $fallback->saveQuietly();
        }
        return $fallback;
    }

    /**
     * Ensures the user row exists in the Phoenix chat database so foreign keys and presence gates succeed.
     */
    private function syncChatUser(User $u): void
    {
        if (config('database.default') !== 'pgsql') {
            return;
        }
        try {
            DB::connection('chat')->statement(
                'INSERT INTO users (id, full_name) VALUES (?::uuid, ?) ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name',
                [$u->uuid, $u->fullname]
            );
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /**
     * GET /api/chatApp/token/?peer=<user id>&house=<id> -> socket token (+ the direct topic when a peer is given).
     * Asking for a peer also records the conversation, so both sides see it in their inbox.
     */
    public function token(Request $r)
    {
        $me = $this->resolveUser($r);
        $this->syncChatUser($me);

        $out = [
            'token' => Phoenix::socketToken($me),
            'user_id' => $me->uuid,
            'ws_url' => config('services.chat.ws_url'),
            'me' => $this->person($me),
        ];

        if ($r->filled('peer')) {
            $peer = User::find($r->input('peer'));
            abort_if(! $peer || $peer->id === $me->id, 404, 'User not found');
            if (! $peer->uuid) {
                $peer->uuid = (string) Str::uuid();
                $peer->saveQuietly();
            }
            $this->syncChatUser($peer);

            $c = Conversation::firstOrCreate(
                ['user_low_id' => min($me->id, $peer->id), 'user_high_id' => max($me->id, $peer->id)],
                ['house_id' => House::whereKey($r->integer('house'))->value('id')],
            );
            $c->touch();
            $out['topic'] = Phoenix::directTopic($me, $peer);
            $out['peer'] = $this->person($peer);
        }

        return $out;
    }

    /**
     * My inbox: who I have talked to, the last message and how many I have not read.
     * `topic` and `peer.uuid` are the ids the chat server uses, so the app can match live events to a row.
     */
    public function conversations(Request $r)
    {
        $me = $this->resolveUser($r);
        $rows = Conversation::with(['low.profile', 'high.profile', 'house:id,property_name'])
            ->where('user_low_id', $me->id)
            ->orWhere('user_high_id', $me->id)
            ->get();

        $topic = fn ($c) => Phoenix::directTopic($c->low, $c->high);
        $previews = $this->previews($rows->map($topic)->all(), $me->uuid);

        return $rows->map(function ($c) use ($me, $topic, $previews) {
            $peer = $c->user_low_id === $me->id ? $c->high : $c->low;
            $p = $previews[$topic($c)] ?? null;
            return [
                'id' => $c->id,
                'topic' => $topic($c),
                'house' => $c->house?->property_name,
                'updated_at' => $p['at'] ?? $c->updated_at,
                'last_message' => $p['text'] ?? null,
                'last_mine' => $p['mine'] ?? false,
                'unread' => $p['unread'] ?? 0,
                'kind' => 'direct',
                'peer' => [
                    'id' => $peer->id,
                    'uuid' => $peer->uuid,
                    'fullname' => $peer->fullname,
                    'phone' => $peer->phone,
                    'role' => $peer->role,
                    'profile_image' => $peer->profile?->profile_image ? '/storage/' . $peer->profile->profile_image : null,
                ],
            ];
        })->concat($this->groups($me->uuid))->sortByDesc('updated_at')->values();
    }

    /**
     * GET /api/people?q= : who can I start a chat with.
     * Supports searching anyone on the system by name or phone number (full or partial digits).
     */
    public function people(Request $r)
    {
        $me = $this->resolveUser($r);
        $s = mb_strtolower(trim((string) $r->input('q')));
        $digits = preg_replace('/\D+/', '', $s);

        $q = User::with('profile')
            ->where('role', '!=', 'admin')
            ->whereNull('suspended_at')
            ->where('id', '!=', $me->id);

        if ($s !== '') {
            $normalizedPhone = AuthController::phone($s);
            $q->where(function ($w) use ($s, $digits, $normalizedPhone) {
                $w->whereRaw('lower(fullname) like ?', ["%$s%"])
                    ->orWhere('phone', $normalizedPhone);
                if (strlen($digits) >= 3) {
                    $w->orWhere('phone', 'like', "%$digits%");
                    // Also handle leading 0 -> 255 for Tanzanian numbers (e.g. 0712 -> 255712)
                    if (str_starts_with($digits, '0') && strlen($digits) >= 4) {
                        $tzDigits = '255' . substr($digits, 1);
                        $w->orWhere('phone', 'like', "%$tzDigits%");
                    }
                }
            });
        }

        $tenantMap = $this->landlordTenantMap($me);

        return $q->orderByRaw('lower(fullname)')->limit(40)->get()->map(function (User $u) use ($tenantMap) {
            $info = $this->person($u);
            if (isset($tenantMap[$u->id])) {
                $info['is_my_tenant'] = true;
                $info['property_name'] = $tenantMap[$u->id]['property_name'];
                $info['unit'] = $tenantMap[$u->id]['unit'];
            } else {
                $info['is_my_tenant'] = false;
            }
            return $info;
        });
    }

    /**
     * GET /landlord/chat/tenants : Returns ONLY the landlord's own tenants (for creating/managing groups).
     * Automatically ensures each Tenancy record on the landlord's houses is linked to a User account.
     */
    public function myTenants(Request $r)
    {
        $me = $this->resolveUser($r);
        return response()->json($this->resolveLandlordTenantsList($me));
    }

    /**
     * Ensures every Tenancy under the landlord's properties has a linked User account,
     * and returns the list of those tenant users with their property and unit metadata.
     */
    private function resolveLandlordTenantsList(User $landlord): array
    {
        $houseIds = House::where('owner_id', $landlord->id)->pluck('id');
        $tenancies = Tenancy::with(['house:id,property_name', 'user.profile'])
            ->whereIn('house_id', $houseIds)
            ->orderByDesc('id')
            ->get();

        $results = [];
        $seenUserIds = [];

        foreach ($tenancies as $t) {
            $u = $t->user;
            if (! $u && $t->phone) {
                $normPhone = AuthController::phone($t->phone);
                $u = User::where('phone', $normPhone)->orWhere('phone', $t->phone)->first();
            }
            if (! $u && $t->email) {
                $u = User::where('email', strtolower(trim($t->email)))->first();
            }
            if (! $u && $t->name) {
                $normPhone = $t->phone ? AuthController::phone($t->phone) : ('+255799' . str_pad((string) $t->id, 6, '0', STR_PAD_LEFT));
                // Avoid phone collision
                $u = User::where('phone', $normPhone)->first();
                if (! $u) {
                    $u = User::create([
                        'fullname' => $t->name,
                        'phone' => $normPhone,
                        'email' => $t->email ?: null,
                        'country' => 'TZ',
                        'role' => 'renter',
                        'password' => 'demo1234',
                    ]);
                }
            }
            if ($u) {
                if (! $u->uuid) {
                    $u->uuid = (string) Str::uuid();
                    $u->saveQuietly();
                }
                if ($t->user_id !== $u->id) {
                    $t->user_id = $u->id;
                    $t->saveQuietly();
                }
                if ($u->id !== $landlord->id && ! isset($seenUserIds[$u->id])) {
                    $seenUserIds[$u->id] = true;
                    $results[] = $this->person($u) + [
                        'is_my_tenant' => true,
                        'property_name' => $t->house?->property_name ?? 'Managed Property',
                        'unit' => $t->unit ?? 'Room 1',
                        'tenancy_status' => $t->status ?? 'active',
                    ];
                }
            }
        }

        return $results;
    }

    /**
     * Map of [user_id => ['property_name' => ..., 'unit' => ...]] for this landlord's tenants.
     */
    private function landlordTenantMap(User $landlord): array
    {
        $map = [];
        foreach ($this->resolveLandlordTenantsList($landlord) as $row) {
            $map[$row['id']] = [
                'property_name' => $row['property_name'],
                'unit' => $row['unit'],
            ];
        }
        return $map;
    }

    private function person(User $u): array
    {
        return [
            'id' => $u->id,
            'uuid' => $u->uuid,
            'fullname' => $u->fullname,
            'phone' => $u->phone,
            'role' => $u->role,
            'profile_image' => $u->profile?->profile_image ? '/storage/' . $u->profile->profile_image : null,
        ];
    }

    /** The chat server's database, where groups live (it checks membership there on every join). */
    private function chat()
    {
        abort_unless(config('database.default') === 'pgsql', 503, 'Group chat is not available here.'); // tests run on SQLite
        return DB::connection('chat');
    }

    /**
     * POST /api/chat/groups {name, member_ids, tenants_only?}:
     * The creator is the admin; the people chosen are added at once.
     * When tenants_only is true (from the web landlord portal), only the landlord's own tenants can be added.
     */
    public function createGroup(Request $r)
    {
        $d = $r->validate([
            'name' => 'required|string|max:60',
            'member_ids' => 'required|array|min:1|max:50',
            'member_ids.*' => 'integer|distinct',
            'tenants_only' => 'sometimes|boolean',
        ]);
        $me = $this->resolveUser($r);

        if ($r->boolean('tenants_only')) {
            $allowedTenantIds = array_keys($this->landlordTenantMap($me));
            $invalidIds = array_diff($d['member_ids'], $allowedTenantIds);
            abort_if(! empty($invalidIds), 422, 'You can only add your own registered tenants to a group.');
        }

        $members = User::whereIn('id', $d['member_ids'])
            ->where('id', '!=', $me->id)
            ->where('role', '!=', 'admin')
            ->whereNull('suspended_at')
            ->get();
        abort_if($members->isEmpty(), 422, 'Choose at least one person.');

        $chat = $this->chat();
        $slug = 'g-' . strtolower(Str::random(24));
        $name = trim($d['name']);
        $chat->transaction(function () use ($chat, $me, $members, $slug, $name) {
            foreach ([$me, ...$members] as $u) { // the chat server keeps its own short list of people
                if (! $u->uuid) {
                    $u->uuid = (string) Str::uuid();
                    $u->saveQuietly();
                }
                $chat->statement('INSERT INTO users (id, full_name) VALUES (?::uuid, ?) ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name', [$u->uuid, $u->fullname]);
            }
            $id = $chat->selectOne('INSERT INTO chat_groups (slug, name, created_by) VALUES (?, ?, ?::uuid) RETURNING id', [$slug, $name, $me->uuid])->id;
            foreach ([$me, ...$members] as $u) {
                $chat->statement(
                    "INSERT INTO chat_group_members (group_id, user_id, role, status, invited_by, joined_at) VALUES (?::uuid, ?::uuid, ?, 'member', ?::uuid, now())",
                    [$id, $u->uuid, $u->is($me) ? 'admin' : 'member', $me->uuid]
                );
            }
        });
        Notification::send($members, new AppNotification("Added to “{$name}”", "{$me->fullname} added you to a group chat.", "room:$slug", 'group'));

        return response()->json([
            'kind' => 'group',
            'topic' => "room:$slug",
            'group' => [
                'slug' => $slug,
                'name' => $name,
                'members' => $members->count() + 1,
                'is_admin' => true,
            ],
        ], 201);
    }

    /** GET /api/chat/groups/{slug}: who is in a group I belong to. */
    public function group(Request $r, string $slug)
    {
        $me = $this->resolveUser($r);
        $rows = $this->chat()->select("SELECT m.user_id::text AS uuid, m.role FROM chat_group_members m JOIN chat_groups g ON g.id = m.group_id
            WHERE g.slug = ? AND m.status = 'member'", [$slug]);
        $roles = collect($rows)->pluck('role', 'uuid');
        abort_unless($roles->has($me->uuid), 404);
        $tenantMap = $this->landlordTenantMap($me);

        return User::with('profile')->whereIn('uuid', $roles->keys())->orderBy('fullname')->get()
            ->map(fn ($u) => $this->person($u) + [
                'admin' => $roles[$u->uuid] === 'admin',
                'me' => $u->is($me),
                'is_my_tenant' => isset($tenantMap[$u->id]),
                'property_name' => $tenantMap[$u->id]['property_name'] ?? null,
                'unit' => $tenantMap[$u->id]['unit'] ?? null,
            ]);
    }

    /**
     * POST /landlord/chat/groups/{slug}/members : Add more of the landlord's own tenants to an existing group.
     */
    public function addGroupMembers(Request $r, string $slug)
    {
        $d = $r->validate([
            'member_ids' => 'required|array|min:1|max:50',
            'member_ids.*' => 'integer|distinct',
        ]);
        $me = $this->resolveUser($r);
        $chat = $this->chat();

        $groupRow = $chat->selectOne("SELECT g.id, g.name, m.role FROM chat_groups g JOIN chat_group_members m ON m.group_id = g.id WHERE g.slug = ? AND m.user_id = ?::uuid AND m.status = 'member'", [$slug, $me->uuid]);
        abort_if(! $groupRow, 404, 'Group not found.');
        abort_unless($groupRow->role === 'admin', 403, 'Only the group admin can add members.');

        $allowedTenantIds = array_keys($this->landlordTenantMap($me));
        $invalidIds = array_diff($d['member_ids'], $allowedTenantIds);
        abort_if(! empty($invalidIds), 422, 'You can only add your own registered tenants to a group.');

        $members = User::whereIn('id', $d['member_ids'])
            ->where('id', '!=', $me->id)
            ->where('role', '!=', 'admin')
            ->whereNull('suspended_at')
            ->get();
        abort_if($members->isEmpty(), 422, 'Choose at least one tenant.');

        $chat->transaction(function () use ($chat, $groupRow, $me, $members) {
            foreach ($members as $u) {
                if (! $u->uuid) {
                    $u->uuid = (string) Str::uuid();
                    $u->saveQuietly();
                }
                $chat->statement('INSERT INTO users (id, full_name) VALUES (?::uuid, ?) ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name', [$u->uuid, $u->fullname]);
                $chat->statement(
                    "INSERT INTO chat_group_members (group_id, user_id, role, status, invited_by, joined_at) VALUES (?::uuid, ?::uuid, 'member', 'member', ?::uuid, now()) ON CONFLICT (group_id, user_id) DO UPDATE SET status = 'member', joined_at = now()",
                    [$groupRow->id, $u->uuid, $me->uuid]
                );
            }
        });

        Notification::send($members, new AppNotification("Added to “{$groupRow->name}”", "{$me->fullname} added you to a group chat.", "room:$slug", 'group'));

        $count = (int) ($chat->selectOne("SELECT count(*) AS n FROM chat_group_members WHERE group_id = ?::uuid AND status = 'member'", [$groupRow->id])->n ?? 1);

        return response()->json([
            'ok' => true,
            'members_count' => $count,
        ]);
    }

    /**
     * POST /landlord/chat/clear : Clear all messages in a conversation/room or delete the entire room/conversation.
     */
    public function clearOrDeleteRoom(Request $r)
    {
        $d = $r->validate([
            'topic' => 'required|string|max:200',
            'mode' => 'nullable|string|in:clear,delete',
        ]);
        $me = $this->resolveUser($r);
        $topic = $d['topic'];
        $mode = $d['mode'] ?? 'clear';

        if (config('database.default') === 'pgsql') {
            $chat = DB::connection('chat');
            try {
                // Record chat_clears up to the latest message so history is wiped for this user
                $chat->statement(
                    "INSERT INTO chat_clears (user_id, topic, up_to, cleared_at)
                     VALUES (?::uuid, ?, COALESCE((SELECT max(id) FROM chat_messages WHERE topic = ?), 0), now())
                     ON CONFLICT (user_id, topic) DO UPDATE SET up_to = EXCLUDED.up_to, cleared_at = now()",
                    [$me->uuid, $topic, $topic]
                );
                $chat->statement(
                    "DELETE FROM notifications WHERE user_id = ?::uuid AND kind = 'message' AND link = ?",
                    [$me->uuid, '/chat?c=' . urlencode($topic)]
                );

                if ($mode === 'delete') {
                    if (str_starts_with($topic, 'room:')) {
                        $slug = substr($topic, 5);
                        $isAdmin = $chat->selectOne(
                            "SELECT 1 AS ok FROM chat_group_members m JOIN chat_groups g ON g.id = m.group_id WHERE g.slug = ? AND m.user_id = ?::uuid AND m.role = 'admin'",
                            [$slug, $me->uuid]
                        );
                        if ($isAdmin) {
                            $chat->statement("DELETE FROM chat_messages WHERE topic = ?", [$topic]);
                            $chat->statement("DELETE FROM chat_groups WHERE slug = ?", [$slug]);
                        } else {
                            $chat->statement(
                                "DELETE FROM chat_group_members WHERE user_id = ?::uuid AND group_id IN (SELECT id FROM chat_groups WHERE slug = ?)",
                                [$me->uuid, $slug]
                            );
                        }
                    } elseif (str_starts_with($topic, 'direct:')) {
                        // Also delete messages in this direct topic when deleting the whole chat room
                        $chat->statement("DELETE FROM chat_messages WHERE topic = ?", [$topic]);
                    }
                }
            } catch (\Throwable $e) {
                report($e);
            }
        }

        if ($mode === 'delete' && str_starts_with($topic, 'direct:')) {
            $parts = explode('_', substr($topic, 7));
            if (count($parts) === 2) {
                $users = User::whereIn('uuid', $parts)->pluck('id');
                if ($users->count() === 2) {
                    Conversation::where('user_low_id', $users->min())
                        ->where('user_high_id', $users->max())
                        ->delete();
                }
            }
        }

        return response()->json([
            'ok' => true,
            'topic' => $topic,
            'mode' => $mode,
        ]);
    }

    /** The groups I am in, shaped like inbox rows. Read from the chat server's tables (see previews()). */
    private function groups(string $me): array
    {
        if (config('database.default') !== 'pgsql') return [];
        try {
            $rows = DB::connection('chat')->select("SELECT g.slug, g.name, m.role, COALESCE(lm.inserted_at, g.created_at) AS at, lm.body, lm.author_name, lm.author_id::text AS author_id,
                    (SELECT count(*) FROM chat_group_members x WHERE x.group_id = g.id AND x.status = 'member') AS members
                FROM chat_groups g JOIN chat_group_members m ON m.group_id = g.id AND m.user_id = ?::uuid AND m.status = 'member'
                LEFT JOIN chat_clears cc ON cc.user_id = m.user_id AND cc.topic = ('room:' || g.slug)
                LEFT JOIN LATERAL (SELECT body, author_name, author_id, inserted_at FROM chat_messages c
                    WHERE c.topic = 'room:' || g.slug AND c.deleted_at IS NULL AND c.id > COALESCE(cc.up_to, 0) ORDER BY c.id DESC LIMIT 1) lm ON true", [$me]);
        } catch (\Throwable $e) {
            report($e);
            return [];
        }
        return array_map(fn ($g) => [
            'id' => $g->slug, 'kind' => 'group', 'topic' => "room:{$g->slug}", 'house' => null, 'updated_at' => $g->at,
            'last_message' => $g->body, 'last_author' => $g->author_name, 'last_mine' => $g->author_id === $me, 'unread' => 0,
            'group' => ['slug' => $g->slug, 'name' => $g->name, 'members' => (int) $g->members, 'is_admin' => $g->role === 'admin'],
        ], $rows);
    }

    /**
     * topic => [text, at, mine, unread], read straight from the chat server's table.
     * ponytail: works while both databases sit on one Postgres server; ask Phoenix over HTTP if they are ever split.
     */
    private function previews(array $topics, string $me): array
    {
        if (! $topics || config('database.default') !== 'pgsql') return []; // tests run on SQLite
        try {
            $in = implode(',', array_fill(0, count($topics), '?'));
            $chat = DB::connection('chat');
            // The newest message that is still there (and not cleared by this user): a deleted one is skipped.
            $last = $chat->select(
                "SELECT DISTINCT ON (m.topic) m.topic, m.body, m.author_id::text AS author_id, m.inserted_at
                 FROM chat_messages m
                 LEFT JOIN chat_clears c ON c.user_id = ?::uuid AND c.topic = m.topic
                 WHERE m.topic IN ($in) AND m.deleted_at IS NULL AND m.id > COALESCE(c.up_to, 0)
                 ORDER BY m.topic, m.id DESC",
                [$me, ...$topics]
            );
            $unread = collect($chat->select(
                "SELECT m.topic, count(*) AS n
                 FROM chat_messages m
                 LEFT JOIN chat_clears c ON c.user_id = m.recipient_id AND c.topic = m.topic
                 WHERE m.topic IN ($in) AND m.recipient_id = ?::uuid AND m.read_at IS NULL AND m.deleted_at IS NULL AND m.id > COALESCE(c.up_to, 0)
                 GROUP BY m.topic",
                [...$topics, $me]
            ))->pluck('n', 'topic');
        } catch (\Throwable $e) {
            report($e);
            return []; // the inbox still lists the people; it just has no previews
        }
        return collect($last)->mapWithKeys(fn ($m) => [$m->topic => [
            'text' => $m->body, 'at' => $m->inserted_at,
            'mine' => $m->author_id === $me, 'unread' => (int) ($unread[$m->topic] ?? 0),
        ]])->all();
    }
}

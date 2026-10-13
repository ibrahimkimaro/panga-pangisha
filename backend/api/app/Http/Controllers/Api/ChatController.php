<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\House;
use App\Models\User;
use App\Services\Phoenix;
use Illuminate\Http\Request;
use App\Notifications\AppNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class ChatController extends Controller
{
    /**
     * GET /api/chatApp/token/?peer=<user id>&house=<id> -> socket token (+ the direct topic when a peer is given).
     * Asking for a peer also records the conversation, so both sides see it in their inbox.
     */
    public function token(Request $r)
    {
        $me = $r->user();
        $out = ['token' => Phoenix::socketToken($me), 'user_id' => $me->uuid, 'ws_url' => config('services.chat.ws_url')];
        if ($r->filled('peer')) {
            $peer = User::find($r->input('peer'));
            abort_if(! $peer || $peer->id === $me->id, 404, 'User not found');
            $c = Conversation::firstOrCreate(
                ['user_low_id' => min($me->id, $peer->id), 'user_high_id' => max($me->id, $peer->id)],
                ['house_id' => House::whereKey($r->integer('house'))->value('id')],
            );
            $c->touch();
            $out['topic'] = Phoenix::directTopic($me, $peer);
        }
        return $out;
    }

    /**
     * My inbox: who I have talked to, the last message and how many I have not read.
     * `topic` and `peer.uuid` are the ids the chat server uses, so the app can match live events to a row.
     */
    public function conversations(Request $r)
    {
        $me = $r->user();
        $rows = Conversation::with(['low.profile', 'high.profile', 'house:id,property_name'])
            ->where('user_low_id', $me->id)->orWhere('user_high_id', $me->id)->get();
        $topic = fn ($c) => Phoenix::directTopic($c->low, $c->high);
        $previews = $this->previews($rows->map($topic)->all(), $me->uuid);

        return $rows->map(function ($c) use ($me, $topic, $previews) {
            $peer = $c->user_low_id === $me->id ? $c->high : $c->low;
            $p = $previews[$topic($c)] ?? null;
            return [
                'id' => $c->id, 'topic' => $topic($c), 'house' => $c->house?->property_name,
                'updated_at' => $p['at'] ?? $c->updated_at,
                'last_message' => $p['text'] ?? null, 'last_mine' => $p['mine'] ?? false, 'unread' => $p['unread'] ?? 0,
                'kind' => 'direct',
                'peer' => ['id' => $peer->id, 'uuid' => $peer->uuid, 'fullname' => $peer->fullname,
                    'profile_image' => $peer->profile?->profile_image ? '/storage/' . $peer->profile->profile_image : null],
            ];
        })->concat($this->groups($me->uuid))->sortByDesc('updated_at')->values();
    }

    /**
     * GET /api/people?q= : who can I start a chat with. Names, roles and photos only: never phone numbers
     * or emails. Typing someone's full phone number finds them without the list showing any number.
     */
    public function people(Request $r)
    {
        $s = mb_strtolower(trim((string) $r->input('q')));
        $q = User::with('profile')->where('role', '!=', 'admin')->whereNull('suspended_at')->where('id', '!=', $r->user()->id);
        if ($s !== '') {
            $q->where(fn ($w) => $w->whereRaw('lower(fullname) like ?', ["%$s%"])->orWhere('phone', AuthController::phone($s)));
        }
        return $q->orderByRaw('lower(fullname)')->limit(40)->get()->map(fn ($u) => $this->person($u));
    }

    private function person(User $u): array
    {
        return ['id' => $u->id, 'uuid' => $u->uuid, 'fullname' => $u->fullname, 'role' => $u->role,
            'profile_image' => $u->profile?->profile_image ? '/storage/' . $u->profile->profile_image : null];
    }

    /** The chat server's database, where groups live (it checks membership there on every join). */
    private function chat()
    {
        abort_unless(config('database.default') === 'pgsql', 503, 'Group chat is not available here.'); // tests run on SQLite
        return DB::connection('chat');
    }

    /** POST /api/chat/groups {name, member_ids}: the creator is the admin; the people chosen are in at once. */
    public function createGroup(Request $r)
    {
        $d = $r->validate([
            'name' => 'required|string|max:60',
            'member_ids' => 'required|array|min:1|max:50',
            'member_ids.*' => 'integer|distinct',
        ]);
        $me = $r->user();
        $members = User::whereIn('id', $d['member_ids'])->where('id', '!=', $me->id)
            ->where('role', '!=', 'admin')->whereNull('suspended_at')->get();
        abort_if($members->isEmpty(), 422, 'Choose at least one person.');

        $chat = $this->chat();
        $slug = 'g-' . strtolower(Str::random(24));
        $name = trim($d['name']);
        $chat->transaction(function () use ($chat, $me, $members, $slug, $name) {
            foreach ([$me, ...$members] as $u) { // the chat server keeps its own short list of people
                $chat->statement('INSERT INTO users (id, full_name) VALUES (?::uuid, ?) ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name', [$u->uuid, $u->fullname]);
            }
            $id = $chat->selectOne('INSERT INTO chat_groups (slug, name, created_by) VALUES (?, ?, ?::uuid) RETURNING id', [$slug, $name, $me->uuid])->id;
            foreach ([$me, ...$members] as $u) {
                $chat->statement("INSERT INTO chat_group_members (group_id, user_id, role, status, invited_by, joined_at) VALUES (?::uuid, ?::uuid, ?, 'member', ?::uuid, now())",
                    [$id, $u->uuid, $u->is($me) ? 'admin' : 'member', $me->uuid]);
            }
        });
        Notification::send($members, new AppNotification("Added to “{$name}”", "{$me->fullname} added you to a group chat.", "room:$slug", 'group'));

        return response()->json(['kind' => 'group', 'topic' => "room:$slug", 'group' => ['slug' => $slug, 'name' => $name, 'members' => $members->count() + 1]], 201);
    }

    /** GET /api/chat/groups/{slug}: who is in a group I belong to. */
    public function group(Request $r, string $slug)
    {
        $rows = $this->chat()->select("SELECT m.user_id::text AS uuid, m.role FROM chat_group_members m JOIN chat_groups g ON g.id = m.group_id
            WHERE g.slug = ? AND m.status = 'member'", [$slug]);
        $roles = collect($rows)->pluck('role', 'uuid');
        abort_unless($roles->has($r->user()->uuid), 404);
        return User::with('profile')->whereIn('uuid', $roles->keys())->orderBy('fullname')->get()
            ->map(fn ($u) => $this->person($u) + ['admin' => $roles[$u->uuid] === 'admin', 'me' => $u->is($r->user())]);
    }

    /** The groups I am in, shaped like inbox rows. Read from the chat server's tables (see previews()). */
    private function groups(string $me): array
    {
        if (config('database.default') !== 'pgsql') return [];
        try {
            $rows = DB::connection('chat')->select("SELECT g.slug, g.name, COALESCE(lm.inserted_at, g.created_at) AS at, lm.body, lm.author_name, lm.author_id::text AS author_id,
                    (SELECT count(*) FROM chat_group_members x WHERE x.group_id = g.id AND x.status = 'member') AS members
                FROM chat_groups g JOIN chat_group_members m ON m.group_id = g.id AND m.user_id = ?::uuid AND m.status = 'member'
                LEFT JOIN LATERAL (SELECT body, author_name, author_id, inserted_at FROM chat_messages c
                    WHERE c.topic = 'room:' || g.slug AND c.deleted_at IS NULL ORDER BY c.id DESC LIMIT 1) lm ON true", [$me]);
        } catch (\Throwable $e) {
            report($e);
            return [];
        }
        return array_map(fn ($g) => [
            'id' => $g->slug, 'kind' => 'group', 'topic' => "room:{$g->slug}", 'house' => null, 'updated_at' => $g->at,
            'last_message' => $g->body, 'last_author' => $g->author_name, 'last_mine' => $g->author_id === $me, 'unread' => 0,
            'group' => ['slug' => $g->slug, 'name' => $g->name, 'members' => (int) $g->members],
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
            // The newest message that is still there: a deleted one is skipped, not shown as the preview.
            $last = $chat->select("SELECT DISTINCT ON (topic) topic, body, author_id::text AS author_id, inserted_at
                FROM chat_messages WHERE topic IN ($in) AND deleted_at IS NULL ORDER BY topic, id DESC", $topics);
            $unread = collect($chat->select("SELECT topic, count(*) AS n FROM chat_messages
                WHERE topic IN ($in) AND recipient_id = ?::uuid AND read_at IS NULL AND deleted_at IS NULL GROUP BY topic", [...$topics, $me]))->pluck('n', 'topic');
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

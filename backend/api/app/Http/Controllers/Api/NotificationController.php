<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $r)
    {
        $u = $r->user();
        return ['unread' => $u->unreadNotifications()->count(),
            'items' => $u->notifications()->latest()->limit(50)->get()->map(fn ($n) => $n->data + [
                'id' => $n->id, 'read' => $n->read_at !== null, 'created_at' => $n->created_at])];
    }

    public function read(Request $r, string $id)
    {
        $r->user()->notifications()->whereKey($id)->first()?->markAsRead();
        return response()->noContent();
    }

    public function readAll(Request $r)
    {
        $r->user()->unreadNotifications->markAsRead();
        return response()->noContent();
    }

    /** The app registers its FCM token here (used once push delivery is wired). */
    public function registerDevice(Request $r)
    {
        $d = $r->validate(['token' => 'required|string', 'platform' => 'nullable|string']);
        $r->user()->deviceTokens()->updateOrCreate(['token' => $d['token']], ['platform' => $d['platform'] ?? null]);
        return response()->noContent();
    }
}

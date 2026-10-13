<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAction;
use App\Models\User;
use App\Notifications\AppNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/** A message from Panga to everyone, or to tenants or landlords: it lands in the app's notification list. */
class AnnouncementController extends Controller
{
    private const AUDIENCES = ['all' => 'everyone', 'renter' => 'tenants', 'landlord' => 'landlords'];

    private function audience(string $key)
    {
        return User::where('role', '!=', 'admin')->whereNull('suspended_at')->when($key !== 'all', fn ($q) => $q->where('role', $key));
    }

    public function index()
    {
        return Inertia::render('Admin/Announcements', [
            'audiences' => collect(self::AUDIENCES)->map(fn ($label, $key) => ['key' => $key, 'label' => ucfirst($label), 'count' => $this->audience($key)->count()])->values(),
            'sent' => AdminAction::with('admin:id,fullname')->where('action', 'announcement.sent')->latest('id')->limit(15)->get(),
        ]);
    }

    public function store(Request $r)
    {
        $d = $r->validate([
            'audience' => ['required', Rule::in(array_keys(self::AUDIENCES))],
            'title' => 'required|string|max:80',
            'body' => 'required|string|max:400',
        ]);
        $people = $this->audience($d['audience'])->get();
        // ponytail: sent inside this request, one live push per person after the response. Queue it past a few thousand users.
        Notification::send($people, new AppNotification($d['title'], $d['body'], null, 'announcement'));
        AdminAction::record('announcement.sent', $r->user(), "Sent “{$d['title']}” to {$people->count()} " . self::AUDIENCES[$d['audience']] . ": {$d['body']}");

        return back()->with('flash', "Sent to {$people->count()} " . ($people->count() === 1 ? 'person' : 'people') . '.');
    }
}

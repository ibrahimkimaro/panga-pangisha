<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAction;
use App\Models\ListingReport;
use App\Models\User;
use App\Notifications\AppNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    /** The list and the CSV export share one set of filters. */
    private function filtered(Request $r)
    {
        $q = User::where('role', '!=', 'admin')->withCount('houses');
        if ($s = mb_strtolower(trim((string) $r->input('q')))) {
            $q->where(fn ($w) => $w->whereRaw('lower(fullname) like ?', ["%$s%"])
                ->orWhereRaw('lower(email) like ?', ["%$s%"])->orWhere('phone', 'like', "%$s%"));
        }
        if ($r->filled('role')) $q->where('role', $r->input('role'));
        if ($r->input('status') === 'suspended') $q->whereNotNull('suspended_at');
        if ($r->input('status') === 'active') $q->whereNull('suspended_at');
        if ($r->filled('country')) $q->where('country', $r->input('country'));
        return $q;
    }

    public function index(Request $r)
    {
        return Inertia::render('Admin/Users/Index', [
            'users' => $this->filtered($r)->latest()->paginate(15)->withQueryString(),
            'filters' => $r->only('q', 'role', 'status', 'country'),
            'countries' => User::whereNotNull('country')->distinct()->orderBy('country')->pluck('country'),
        ]);
    }

    public function export(Request $r)
    {
        AdminAction::record('user.exported', $r->user(), 'Downloaded the user list as a spreadsheet');
        return $this->csv('panga-users-' . now()->format('Y-m-d') . '.csv',
            ['ID', 'Name', 'Email', 'Phone', 'Country', 'Role', 'Status', 'Listings', 'Joined'],
            $this->filtered($r)->lazyById(500)->map(fn ($u) => [$u->id, $u->fullname, $u->email, $u->phone, $u->country, $u->role,
                $u->suspended_at ? 'suspended' : 'active', $u->houses_count, $u->created_at->toDateString()]));
    }

    public function show(User $user)
    {
        abort_if($user->role === 'admin', 404);
        return Inertia::render('Admin/Users/Show', [
            'user' => $user,
            'identity' => $user->identity?->only('id', 'status', 'method', 'created_at', 'reviewed_at'),
            'business' => $user->business?->only('entity_name', 'status'),
            'houses' => $user->houses()->withCount(['reports as open_reports' => fn ($q) => $q->where('status', 'open')])->latest()
                ->get(['id', 'property_name', 'district', 'ward', 'monthly_rent', 'status', 'verified_at', 'cover_image', 'created_at']),
            'viewings' => $user->viewingRequests()->with('house:id,property_name')->latest()->limit(10)->get(),
            'reportsFiled' => ListingReport::where('user_id', $user->id)->count(),
            'history' => AdminAction::with('admin:id,fullname')->where('subject_type', 'user')->where('subject_id', $user->id)->latest('id')->get(),
        ]);
    }

    public function update(Request $r, User $user)
    {
        abort_if($user->role === 'admin', 404);
        $d = $r->validate(['role' => ['required', Rule::in(['renter', 'landlord', 'investor'])]]);
        if ($d['role'] !== $user->role) {
            AdminAction::record('user.role_changed', $user, "Changed {$user->fullname} from {$user->role} to {$d['role']}");
            $user->update($d);
        }
        return back()->with('flash', 'Role updated.');
    }

    /** A message to one person. It is stored in their notifications and pushed live to their open app. */
    public function message(Request $r, User $user)
    {
        abort_if($user->role === 'admin', 404);
        $d = $r->validate(['title' => 'required|string|max:80', 'body' => 'required|string|max:400']);
        $user->notify(new AppNotification($d['title'], $d['body'], null, 'message'));
        AdminAction::record('user.messaged', $user, "Sent “{$d['title']}” to {$user->fullname}: {$d['body']}");

        return back()->with('flash', "Sent to {$user->fullname}. It shows at once if their app is open, otherwise the next time they open it.");
    }

    public function suspend(User $user)
    {
        abort_if($user->role === 'admin', 404);
        DB::transaction(function () use ($user) {
            $user->forceFill(['suspended_at' => now()])->save();
            // Sign them out of the app everywhere; the API refuses new sign-ins while suspended_at is set.
            $user->tokens()->delete();
            AdminAction::record('user.suspended', $user, "Suspended {$user->fullname}");
        });
        return back()->with('flash', "{$user->fullname} is suspended and signed out. Their listings are hidden from search.");
    }

    public function reactivate(User $user)
    {
        abort_if($user->role === 'admin', 404);
        $user->forceFill(['suspended_at' => null])->save();
        AdminAction::record('user.reactivated', $user, "Reactivated {$user->fullname}");
        return back()->with('flash', "{$user->fullname} can sign in again.");
    }
}

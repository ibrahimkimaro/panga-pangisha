<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

/** Who can sign in to this panel. */
class TeamController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Team', [
            'admins' => User::where('role', 'admin')->orderBy('id')->get(['id', 'fullname', 'email', 'suspended_at', 'created_at']),
        ]);
    }

    public function store(Request $r)
    {
        $r->merge(['email' => strtolower(trim((string) $r->input('email')))]);
        $d = $r->validate([
            'fullname' => 'required|string|max:200',
            'email' => 'required|email|unique:users,email',
            'password' => ['required', Password::min(10)->letters()->numbers()],
        ]);
        $admin = User::create($d + ['role' => 'admin']);
        AdminAction::record('team.added', $admin, "Gave {$admin->fullname} ({$admin->email}) admin access");

        return back()->with('flash', "{$admin->fullname} can now sign in. Send them the password yourself: it is not emailed.");
    }

    /** Turn one admin's access off or back on. Nobody can lock themselves out. */
    public function toggle(Request $r, User $user)
    {
        abort_unless($user->role === 'admin', 404);
        abort_if($user->is($r->user()), 403, 'You cannot remove your own access.');

        $off = ! $user->suspended_at;
        $user->forceFill(['suspended_at' => $off ? now() : null])->save();
        AdminAction::record($off ? 'team.removed' : 'team.restored', $user, ($off ? 'Removed' : 'Restored') . " admin access for {$user->fullname}");

        return back()->with('flash', $off ? "{$user->fullname} can no longer sign in." : "{$user->fullname} can sign in again.");
    }
}

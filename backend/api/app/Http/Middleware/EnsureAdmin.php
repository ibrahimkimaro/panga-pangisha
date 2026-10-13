<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/** Everything under /admin: signed in, role "admin", not suspended. Checked on every request, not only at sign-in. */
class EnsureAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $u = $request->user();
        if (! $u || $u->role !== 'admin' || $u->suspended_at) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return redirect('/admin/login');
        }
        return $next($request);
    }
}

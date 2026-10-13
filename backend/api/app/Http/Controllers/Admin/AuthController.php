<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function create() { return Inertia::render('Admin/Login'); }

    public function store(Request $r)
    {
        $d = $r->validate(['email' => 'required|email', 'password' => 'required|string']);
        $ok = Auth::attempt(['email' => strtolower($d['email']), 'password' => $d['password'], 'role' => 'admin', 'suspended_at' => null]);
        if (! $ok) {
            // One message for every failure, so the form does not reveal which emails are admins.
            throw ValidationException::withMessages(['email' => 'That email and password do not match an admin account.']);
        }
        $r->session()->regenerate();
        return redirect()->intended('/admin');
    }

    public function destroy(Request $r)
    {
        Auth::logout();
        $r->session()->invalidate();
        $r->session()->regenerateToken();
        return redirect('/admin/login');
    }
}

<?php

namespace App\Http\Middleware;

use App\Models\BusinessProfile;
use App\Models\House;
use App\Models\IdentityVerification;
use App\Models\ListingReport;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        $admin = $request->user()?->role === 'admin' ? $request->user() : null;
        return parent::share($request) + [
            'auth' => ['user' => $admin?->only('id', 'fullname', 'email')],
            'flash' => fn () => $request->session()->get('flash'),
            // Sidebar badges: the queues an admin works through.
            'queue' => fn () => $admin ? [
                'identity' => IdentityVerification::where('status', 'pending')->count(),
                'business' => BusinessProfile::where('status', 'pending')->count(),
                'unverified' => House::whereNull('verified_at')->where('status', '!=', 'suspended')->count(),
                'reports' => ListingReport::where('status', 'open')->count(),
            ] : null,
        ];
    }
}

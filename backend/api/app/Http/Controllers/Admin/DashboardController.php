<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAction;
use App\Models\BusinessProfile;
use App\Models\House;
use App\Models\IdentityVerification;
use App\Models\ListingReport;
use App\Models\User;
use App\Models\ViewingRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public const STALE_DAYS = 30; // a listing nobody confirmed for this long is probably gone

    public function index()
    {
        $people = User::where('role', '!=', 'admin');
        $since = now()->subDays(29)->startOfDay();
        $perDay = (clone $people)->where('created_at', '>=', $since)
            ->selectRaw('date(created_at) as d, count(*) as n')->groupBy('d')->pluck('n', 'd');

        return Inertia::render('Admin/Dashboard', [
            'attention' => [
                'identity' => IdentityVerification::where('status', 'pending')->count(),
                'business' => BusinessProfile::where('status', 'pending')->count(),
                'unverified' => House::whereNull('verified_at')->where('status', '!=', 'suspended')->count(),
                'reports' => ListingReport::where('status', 'open')->count(),
                'stale' => House::where('status', 'available')->where(fn ($q) => $q
                    ->whereNull('availability_confirmed_at')->orWhere('availability_confirmed_at', '<', now()->subDays(self::STALE_DAYS)))->count(),
                'suspended' => (clone $people)->whereNotNull('suspended_at')->count(),
            ],
            'totals' => [
                'users' => (clone $people)->count(),
                'renters' => (clone $people)->where('role', 'renter')->count(),
                'owners' => (clone $people)->where('role', 'landlord')->count(),
                'newUsers' => (clone $people)->where('created_at', '>=', now()->subDays(7))->count(),
                'live' => House::live()->count(),
                'listings' => House::count(),
                'verified' => House::live()->whereNotNull('verified_at')->count(),
                'viewings' => ViewingRequest::count(),
                'viewingsPending' => ViewingRequest::where('status', 'pending')->count(),
                'conversations' => DB::table('conversations')->count(),
            ],
            'signups' => collect(range(0, 29))->map(fn ($i) => $since->copy()->addDays($i)->toDateString())
                ->map(fn ($d) => ['date' => $d, 'count' => (int) ($perDay[$d] ?? 0)]),
            'districts' => House::live()->whereNotNull('district')->selectRaw('district, count(*) as n')
                ->groupBy('district')->orderByDesc('n')->limit(6)->get()->map(fn ($r) => ['name' => $r->district, 'count' => (int) $r->n]),
            'latestListings' => House::with('owner:id,fullname')->latest()->limit(5)
                ->get(['id', 'owner_id', 'property_name', 'district', 'ward', 'monthly_rent', 'status', 'verified_at', 'cover_image', 'created_at']),
            'activity' => AdminAction::with('admin:id,fullname')->latest('id')->limit(6)->get(),
        ]);
    }

    /** GET /admin/search?q= : the top bar's jump-to box. People by name, email or phone; homes by name or area. */
    public function search(Request $r)
    {
        $s = mb_strtolower(trim((string) $r->input('q')));
        if (mb_strlen($s) < 2) return ['users' => [], 'listings' => []];
        return [
            'users' => User::where('role', '!=', 'admin')->where(fn ($w) => $w->whereRaw('lower(fullname) like ?', ["%$s%"])
                ->orWhereRaw('lower(email) like ?', ["%$s%"])->orWhere('phone', 'like', "%$s%"))->limit(5)->get(['id', 'fullname', 'phone', 'role']),
            'listings' => House::where(fn ($w) => $w->whereRaw('lower(property_name) like ?', ["%$s%"])
                ->orWhereRaw('lower(ward) like ?', ["%$s%"])->orWhereRaw('lower(district) like ?', ["%$s%"]))->limit(5)->get(['id', 'property_name', 'ward', 'district', 'status']),
        ];
    }

    public function viewings(Request $r)
    {
        $q = ViewingRequest::with(['house:id,property_name,district,ward,owner_id', 'house.owner:id,fullname', 'user:id,fullname,phone']);
        if ($r->filled('status')) $q->where('status', $r->input('status'));
        return Inertia::render('Admin/Viewings', [
            'viewings' => $q->latest()->paginate(20)->withQueryString(),
            'filters' => $r->only('status'),
        ]);
    }

    public function activity()
    {
        return Inertia::render('Admin/Activity', ['actions' => AdminAction::with('admin:id,fullname')->latest('id')->paginate(30)]);
    }
}

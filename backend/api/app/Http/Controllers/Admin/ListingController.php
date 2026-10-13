<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAction;
use App\Models\House;
use App\Models\ListingReport;
use App\Notifications\AppNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ListingController extends Controller
{
    private function filtered(Request $r)
    {
        $q = House::with('owner:id,fullname,phone,suspended_at')
            ->withCount(['reports as open_reports' => fn ($w) => $w->where('status', 'open')]);
        if ($s = mb_strtolower(trim((string) $r->input('q')))) {
            $q->where(fn ($w) => $w->whereRaw('lower(property_name) like ?', ["%$s%"])
                ->orWhereRaw('lower(district) like ?', ["%$s%"])->orWhereRaw('lower(ward) like ?', ["%$s%"]));
        }
        if ($r->filled('status')) $q->where('status', $r->input('status'));
        if ($r->input('verified') === 'yes') $q->whereNotNull('verified_at');
        if ($r->input('verified') === 'no') $q->whereNull('verified_at')->where('status', '!=', 'suspended');
        if ($r->input('stale')) {
            $q->where('status', 'available')->where(fn ($w) => $w->whereNull('availability_confirmed_at')
                ->orWhere('availability_confirmed_at', '<', now()->subDays(DashboardController::STALE_DAYS)));
        }
        return $q;
    }

    public function export(Request $r)
    {
        AdminAction::record('listing.exported', $r->user(), 'Downloaded the listings as a spreadsheet');
        return $this->csv('panga-listings-' . now()->format('Y-m-d') . '.csv',
            ['ID', 'Name', 'Type', 'Region', 'District', 'Ward', 'Rent a month (TSh)', 'Status', 'Verified', 'Advertiser', 'Advertiser phone', 'Listed'],
            $this->filtered($r)->lazyById(500)->map(fn ($h) => [$h->id, $h->property_name, $h->property_type, $h->region, $h->district, $h->ward,
                $h->monthly_rent, $h->status, $h->verified_at ? 'yes' : 'no', $h->owner?->fullname, $h->owner?->phone, $h->created_at->toDateString()]));
    }

    public function index(Request $r)
    {
        return Inertia::render('Admin/Listings/Index', [
            'listings' => $this->filtered($r)->latest()->paginate(15)->withQueryString(),
            'filters' => $r->only('q', 'status', 'verified', 'stale'),
        ]);
    }

    public function show(House $house)
    {
        return Inertia::render('Admin/Listings/Show', [
            'listing' => $house->load(['owner:id,fullname,email,phone,role,suspended_at,created_at', 'units']),
            'images' => DB::table('house_images')->where('house_id', $house->id)->pluck('path'),
            'reports' => $house->reports()->with('reporter:id,fullname')->latest()->get(),
            'viewings' => $house->viewingRequests()->with('user:id,fullname')->latest()->limit(10)->get(),
            'history' => AdminAction::with('admin:id,fullname')->where('subject_type', 'listing')->where('subject_id', $house->id)->latest('id')->get(),
        ]);
    }

    /** POST /admin/listings/{house}/{verify|unverify|suspend|restore} */
    public function act(House $house, string $action)
    {
        $name = $house->property_name ?: "Listing #{$house->id}";
        [$change, $verb, $flash] = match ($action) {
            'verify' => [['verified_at' => now()], 'verified', "$name is marked as verified."],
            'unverify' => [['verified_at' => null], 'unverified', "Verification removed from $name."],
            'suspend' => [['status' => 'suspended'], 'suspended', "$name is hidden from renters. The owner cannot republish it."],
            'restore' => [['status' => 'available'], 'restored', "$name is live again."],
        };
        $house->update($change);
        AdminAction::record("listing.$verb", $house, ucfirst($verb) . " “{$name}”");

        if ($action === 'verify' && $house->owner) {
            $house->owner->notify(new AppNotification(
                title: 'Listing verified',
                body: "Your property “{$name}” has been verified by admin. It is now marked with the verified badge.",
                link: "house:{$house->id}",
                kind: 'listing'
            ));
        }

        return back()->with('flash', $flash);
    }

    public function destroy(House $house)
    {
        $name = $house->property_name ?: "Listing #{$house->id}";
        AdminAction::record('listing.deleted', $house, "Deleted “{$name}” (owner #{$house->owner_id})");
        $house->delete();
        return redirect('/admin/listings')->with('flash', "$name was deleted.");
    }

    public function reports(Request $r)
    {
        $status = $r->input('status', 'open');
        $q = ListingReport::with(['house:id,property_name,district,ward,status,owner_id,cover_image', 'house.owner:id,fullname', 'reporter:id,fullname']);
        if ($status !== 'all') $q->where('status', $status);
        return Inertia::render('Admin/Reports', ['reports' => $q->latest()->paginate(15)->withQueryString(), 'filters' => ['status' => $status]]);
    }

    public function resolveReport(Request $r, ListingReport $report)
    {
        $d = $r->validate(['status' => ['required', Rule::in(['open', 'resolved', 'dismissed'])]]);
        $report->update($d);
        AdminAction::record("report.{$d['status']}", $report, "Marked report #{$report->id} on listing #{$report->house_id} as {$d['status']}");
        return back()->with('flash', "Report marked as {$d['status']}.");
    }
}

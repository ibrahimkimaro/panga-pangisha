<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAction;
use App\Models\BusinessProfile;
use App\Models\User;
use App\Notifications\AppNotification;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class BusinessController extends Controller
{
    public function index(Request $r)
    {
        $status = $r->input('status', 'pending');
        if ($status === 'none') return $this->notSubmitted($r);
        $q = BusinessProfile::with(['user.identity', 'reviewer:id,fullname']);
        if ($status !== 'all') $q->where('status', $status);
        if ($s = mb_strtolower(trim((string) $r->input('q')))) {
            $digits = preg_replace('/\D/', '', $s); // "142-985" finds the TIN 142985231
            $q->where(fn ($w) => $w->whereRaw('lower(entity_name) like ?', ["%$s%"])
                ->when($digits !== '', fn ($w) => $w->orWhere('tin', 'like', "%$digits%"))
                ->orWhereHas('user', fn ($u) => $u->whereRaw('lower(fullname) like ?', ["%$s%"])));
        }
        $status === 'pending' ? $q->oldest('submitted_at') : $q->latest('reviewed_at');

        return Inertia::render('Admin/Business', [
            // Built field by field: the account's NIDA details stay out of this page.
            'checks' => $q->paginate(20)->withQueryString()->through(fn ($b) => $b->only([...BusinessProfile::DETAILS,
                'id', 'status', 'rejection_reason', 'submitted_at', 'reviewed_at']) + [
                'user' => $b->user->only('id', 'fullname', 'email', 'phone', 'country', 'role', 'created_at', 'suspended_at'),
                'reviewer' => $b->reviewer?->only('fullname'),
                'identity_status' => $b->user->identityStatus(),
            ]),
            'filters' => ['status' => $status, 'q' => $r->input('q')],
        ]);
    }

    /** People who have never sent business details, so an admin can remind them. */
    private function notSubmitted(Request $r)
    {
        $q = User::where('role', '!=', 'admin')->whereDoesntHave('business');
        if ($s = mb_strtolower(trim((string) $r->input('q')))) {
            $q->where(fn ($w) => $w->whereRaw('lower(fullname) like ?', ["%$s%"])
                ->orWhereRaw('lower(email) like ?', ["%$s%"])->orWhere('phone', 'like', "%$s%"));
        }
        if ($r->filled('role')) $q->where('role', $r->input('role'));

        return Inertia::render('Admin/Business', [
            'checks' => null,
            'people' => $q->latest()->paginate(20)->withQueryString()
                ->through(fn ($u) => $u->only('id', 'fullname', 'email', 'phone', 'country', 'role', 'created_at', 'suspended_at')),
            'filters' => ['status' => 'none', 'q' => $r->input('q'), 'role' => $r->input('role')],
        ]);
    }

    /** Approve or reject a pending business; rejecting an approved one withdraws its verification. */
    public function decide(Request $r, BusinessProfile $business)
    {
        $d = $r->validate([
            'decision' => ['required', Rule::in(['approved', 'rejected'])],
            'reason' => 'required_if:decision,rejected|nullable|string|max:500',
        ], ['reason.required_if' => 'Tell them what to fix.']);
        $allowed = ['pending' => ['approved', 'rejected'], 'approved' => ['rejected']];
        abort_unless(in_array($d['decision'], $allowed[$business->status] ?? []), 409, 'This business was already decided.');

        $withdrawn = $business->status === 'approved';
        $business->update(['status' => $d['decision'], 'reviewed_by' => $r->user()->id, 'reviewed_at' => now(),
            'rejection_reason' => $d['decision'] === 'rejected' ? $d['reason'] : null]);
        $verb = $withdrawn ? 'withdrawn' : $d['decision'];
        AdminAction::record("business.$verb", $business, ucfirst($verb) . " the business “{$business->entity_name}” of {$business->user->fullname}");
        $business->user->notify($d['decision'] === 'approved'
            ? new AppNotification('Business verified', "{$business->entity_name} now shows as a verified business.", null, 'business')
            : new AppNotification($withdrawn ? 'Business verification withdrawn' : 'Business details need changes', $d['reason'], null, 'business'));

        return back()->with('flash', $d['decision'] === 'approved'
            ? "{$business->entity_name} is verified."
            : "{$business->user->fullname} was told what to fix.");
    }
}

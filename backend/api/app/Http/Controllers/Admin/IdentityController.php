<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAction;
use App\Models\IdentityVerification;
use App\Notifications\AppNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class IdentityController extends Controller
{
    public function index(Request $r)
    {
        $status = $r->input('status', 'pending');
        $q = IdentityVerification::with(['user:id,fullname,email,phone,role,created_at,suspended_at', 'reviewer:id,fullname']);
        if ($status !== 'all') $q->where('status', $status);
        // The queue is worked oldest first; history reads newest first.
        $status === 'pending' ? $q->oldest() : $q->latest('reviewed_at');

        return Inertia::render('Admin/Identity', [
            'checks' => $q->paginate(10)->withQueryString()->through(fn ($v) => $v->only(
                'id', 'method', 'nida_number', 'status', 'rejection_reason', 'created_at', 'reviewed_at', 'user', 'reviewer'
            ) + ['has_document' => (bool) $v->document_path]),
            'filters' => ['status' => $status],
        ]);
    }

    /** The card photo, streamed from the private disk to signed-in admins only. */
    public function document(IdentityVerification $verification)
    {
        abort_unless($verification->document_path && Storage::disk('local')->exists($verification->document_path), 404);
        return Storage::disk('local')->response($verification->document_path, null, ['Cache-Control' => 'private, no-store']);
    }

    public function decide(Request $r, IdentityVerification $verification)
    {
        $d = $r->validate([
            'decision' => ['required', Rule::in(['approved', 'rejected'])],
            'reason' => 'required_if:decision,rejected|nullable|string|max:500',
        ], ['reason.required_if' => 'Tell the landlord what to fix.']);
        abort_unless($verification->status === 'pending', 409, 'This check was already decided.');

        $verification->update(['status' => $d['decision'], 'reviewed_by' => $r->user()->id, 'reviewed_at' => now(),
            'rejection_reason' => $d['decision'] === 'rejected' ? $d['reason'] : null]);
        $user = $verification->user;
        AdminAction::record("identity.{$d['decision']}", $verification, ucfirst($d['decision']) . " the identity of {$user->fullname}");
        $user->notify($d['decision'] === 'approved'
            ? new AppNotification('Identity verified', 'Thank you. You can now list your homes on Panga.', null, 'identity')
            : new AppNotification('Identity check needs another try', $d['reason'], null, 'identity'));

        return back()->with('flash', $d['decision'] === 'approved'
            ? "{$user->fullname} is verified and has been let into the app."
            : "{$user->fullname} was asked to submit again.");
    }

    /** Undo an approval, for a mistake or a landlord who turns out not to be who they said. */
    public function revoke(Request $r, IdentityVerification $verification)
    {
        $d = $r->validate(['reason' => 'required|string|max:500']);
        abort_unless($verification->status === 'approved', 409, 'Only an approved check can be revoked.');

        $verification->update(['status' => 'rejected', 'rejection_reason' => $d['reason'], 'reviewed_by' => $r->user()->id, 'reviewed_at' => now()]);
        $user = $verification->user;
        AdminAction::record('identity.revoked', $verification, "Revoked the verified identity of {$user->fullname}");
        $user->notify(new AppNotification('Your verification was withdrawn', $d['reason'], null, 'identity'));

        return back()->with('flash', "{$user->fullname} is no longer verified and cannot list new homes.");
    }
}

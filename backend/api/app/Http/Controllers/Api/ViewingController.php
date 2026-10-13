<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\House;
use App\Models\ViewingRequest;
use App\Notifications\AppNotification;
use Illuminate\Http\Request;

class ViewingController extends Controller
{
    /** ?as=owner -> requests on my listings; otherwise the ones I sent. */
    public function index(Request $r)
    {
        $me = $r->user()->id;
        $q = ViewingRequest::with(['house:id,property_name,district,cover_image,owner_id', 'user:id,fullname']);
        $r->input('as') === 'owner'
            ? $q->whereHas('house', fn ($h) => $h->where('owner_id', $me))
            : $q->where('user_id', $me);
        return $q->latest()->limit(100)->get()->map(fn ($v) => $this->one($v));
    }

    public function store(Request $r, House $house)
    {
        abort_if($house->owner_id === $r->user()->id, 422, 'You cannot request a viewing of your own listing.');
        $d = $r->validate(['preferred_at' => 'required|date|after:now', 'note' => 'nullable|string|max:500']);
        $v = $house->viewingRequests()->create($d + ['user_id' => $r->user()->id]);
        $house->owner->notify(new AppNotification(
            'New viewing request', "{$r->user()->fullname} wants to view {$house->property_name}.", "house:{$house->id}", 'viewing'));
        return response()->json($this->one($v->load(['house', 'user'])), 201);
    }

    /** The owner accepts or declines; the person who asked can cancel. */
    public function update(Request $r, ViewingRequest $viewing)
    {
        $me = $r->user()->id;
        $d = $r->validate(['status' => 'required|in:accepted,declined,cancelled']);
        $isOwner = $viewing->house->owner_id === $me;
        abort_unless($d['status'] === 'cancelled' ? $viewing->user_id === $me : $isOwner, 403);
        $viewing->update($d);
        if ($isOwner) {
            $viewing->user->notify(new AppNotification(
                "Viewing {$d['status']}", "Your viewing of {$viewing->house->property_name} was {$d['status']}.", "house:{$viewing->house_id}", 'viewing'));
        }
        return $this->one($viewing->load(['house', 'user']));
    }

    private function one(ViewingRequest $v): array
    {
        return [
            'id' => $v->id, 'status' => $v->status, 'preferred_at' => $v->preferred_at, 'note' => $v->note,
            'house' => ['id' => $v->house->id, 'property_name' => $v->house->property_name, 'district' => $v->house->district,
                'house_profile_image' => $v->house->cover_image ? '/storage/' . $v->house->cover_image : null],
            'user' => ['id' => $v->user->id, 'fullname' => $v->user->fullname],
        ];
    }
}

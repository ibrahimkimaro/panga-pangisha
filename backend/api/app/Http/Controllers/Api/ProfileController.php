<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    /** Shape kept for the existing Flutter screens: {data:{user,profile_image,...}, username, email, phone_number}. */
    public function show(Request $r)
    {
        $u = $r->user();
        $p = $u->profile;
        return [
            'data' => ['user' => $u->id, 'profile_image' => $p->profile_image ? '/storage/' . $p->profile_image : null,
                'bio' => $p->bio, 'location' => $p->location],
            'username' => $u->fullname, 'email' => $u->email, 'phone_number' => $u->phone,
        ];
    }

    public function update(Request $r)
    {
        $d = $r->validate(['profile_image' => 'sometimes|image|max:5120', 'bio' => 'sometimes|nullable|string', 'location' => 'sometimes|nullable|string']);
        $p = $r->user()->profile;
        if ($r->hasFile('profile_image')) {
            $d['profile_image'] = $r->file('profile_image')->store('profiles', 'public');
        }
        $p->update($d);
        return $this->show($r);
    }
}

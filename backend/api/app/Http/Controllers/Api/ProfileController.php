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
        $p = $u->profile ?? $u->profile()->create();
        $rawImg = $p->profile_image;
        $profileImg = null;
        if ($rawImg && !str_contains($rawImg, 'houses/')) {
            $profileImg = (str_starts_with($rawImg, 'http') || str_starts_with($rawImg, '/storage/')) 
                ? $rawImg 
                : '/storage/' . $rawImg;
        }

        return [
            'data' => [
                'user' => $u->id,
                'profile_image' => $profileImg,
                'bio' => $p->bio,
                'location' => $p->location,
            ],
            'username' => $u->fullname,
            'email' => $u->email,
            'phone_number' => $u->phone,
        ];
    }

    public function update(Request $r)
    {
        $d = $r->validate([
            'profile_image' => 'sometimes|image|max:8192',
            'bio' => 'sometimes|nullable|string|max:1000',
            'location' => 'sometimes|nullable|string|max:200',
        ]);
        $p = $r->user()->profile ?? $r->user()->profile()->create();
        if ($r->hasFile('profile_image')) {
            $d['profile_image'] = $r->file('profile_image')->store('profiles', 'public');
        }
        $p->update($d);
        return $this->show($r);
    }
}

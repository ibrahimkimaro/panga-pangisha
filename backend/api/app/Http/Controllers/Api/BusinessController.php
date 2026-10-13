<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BusinessProfile;
use Illuminate\Http\Request;

class BusinessController extends Controller
{
    /** GET /api/business: my business details and where their verification stands. */
    public function show(Request $r)
    {
        return $r->user()->business?->forApp() ?? ['status' => 'none'];
    }

    /**
     * POST /api/business: save my details and send them for review.
     * Any change, even after approval, goes back to "pending": a verified badge must describe what was checked.
     */
    public function store(Request $r)
    {
        $r->merge(['tin' => preg_replace('/\D/', '', (string) $r->input('tin'))]);
        $d = $r->validate([
            'entity_name' => 'required|string|max:200',
            'business_type' => 'required|string|max:60',
            'tin' => 'required|digits:9',
            'brela' => 'nullable|string|max:50',
            'vrn' => 'nullable|string|max:50',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:255',
            'website' => 'nullable|string|max:255',
            'bio' => 'nullable|string|max:1000',
        ], ['tin.digits' => 'A TIN has 9 digits.']);

        $profile = BusinessProfile::updateOrCreate(['user_id' => $r->user()->id], $d + [
            'status' => 'pending', 'rejection_reason' => null, 'reviewed_by' => null, 'reviewed_at' => null, 'submitted_at' => now(),
        ]);
        return response()->json($profile->forApp(), $profile->wasRecentlyCreated ? 201 : 200);
    }
}

<?php

namespace App\Mcp\Tools\Account;

use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Tool;

class GetUserProfileTool extends Tool
{
    public function name(): string
    {
        return 'get_user_profile';
    }

    public function description(): string
    {
        return 'Read-only capability to inspect verified account profile, identity verification status (NIDA and business registration), role, and contact details for the authenticated user only. Data returned: user_id, full_name, email, phone, role, verified_status, and registered date. Authorization: strictly isolated to the caller own profile; cannot access other accounts. Parameters: none. Success: returns user profile object. Failure: returns error object when unauthenticated.';
    }

    public function handle(Request $request): Response
    {
        $user = $request->user();

        if (! $user) {
            return Response::text(json_encode(['error' => 'Authentication required.']));
        }

        $profile = $user->profile;

        return Response::text(json_encode([
            'id' => $user->id,
            'fullname' => $user->fullname,
            'email' => $user->email,
            'phone' => $user->phone,
            'country' => $user->country ?? 'TZ',
            'role' => $user->role,
            'identity_status' => $user->identityStatus(),
            'bio' => $profile?->bio,
            'location' => $profile?->location,
            'profile_image' => $profile?->profile_image,
            'member_since' => $user->created_at?->toFormattedDateString(),
            'favorites_count' => $user->favorites()->count(),
            'business_profile' => $user->business ? [
                'business_name' => $user->business->business_name,
                'status' => $user->business->status,
                'tin_number' => $user->business->tin_number,
            ] : null,
        ], JSON_PRETTY_PRINT));
    }
}

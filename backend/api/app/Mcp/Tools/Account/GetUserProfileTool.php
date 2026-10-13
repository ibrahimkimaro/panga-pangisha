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
        return 'Retrieve verified account profile, roles, verification status (NIDA/Business), and contact details for the authenticated user.';
    }

    public function handle(Request $request): Response
    {
        $user = $request->user();

        if (! $user) {
            return Response::text(json_encode(['error' => 'Authentication required.']));
        }

        return Response::text(json_encode([
            'id' => $user->id,
            'fullname' => $user->fullname,
            'email' => $user->email,
            'phone' => $user->phone,
            'country' => $user->country ?? 'TZ',
            'role' => $user->role,
            'identity_status' => $user->identityStatus(),
            'business_profile' => $user->business ? [
                'business_name' => $user->business->business_name,
                'status' => $user->business->status,
                'tin_number' => $user->business->tin_number,
            ] : null,
        ], JSON_PRETTY_PRINT));
    }
}

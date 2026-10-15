<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\CodeNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function register(Request $r)
    {
        $r->merge(['phone_number' => self::phone($r->input('phone_number')), 'email' => $r->input('email') ? strtolower(trim($r->input('email'))) : null,
            'country' => $r->input('country') ? strtoupper($r->input('country')) : null]);
        $d = $r->validate([
            'fullname' => 'required|string|max:200',
            'phone_number' => ['required', 'regex:/^\+\d{9,15}$/', 'unique:users,phone'],
            'email' => 'nullable|email|unique:users,email',
            'country' => 'nullable|alpha|size:2', // ISO code picked in the app; the phone number already carries its dial code
            'role' => ['required', Rule::in(['landlord', 'renter', 'investor'])],
            'password' => 'required|string|min:6',
        ]);
        $user = User::create([
            'fullname' => $d['fullname'], 'phone' => $d['phone_number'], 'email' => $d['email'] ?? null, 'country' => $d['country'] ?? null,
            'role' => $d['role'], 'password' => $d['password'],
        ]);
        return response()->json(['user' => $this->userData($user), 'tokens' => $this->tokens($user)], 201);
    }

    /** Sign in with a phone number or an email. Response: access, refresh, user_id, role, user. */
    public function login(Request $r)
    {
        $d = $r->validate(['phone_number' => 'required|string', 'password' => 'required|string']);
        $user = self::find($d['phone_number']);
        if (! $user || ! Hash::check($d['password'], $user->password)) {
            return response()->json(['detail' => 'No active account found with the given credentials'], 401);
        }
        return $this->tokens($user) + ['user_id' => $user->id, 'role' => $user->role, 'user' => $this->userData($user)];
    }

    /** Step 1 of "forgot password": send a 6-digit code. Always answers 200 so nobody can probe which accounts exist. */
    public function forgot(Request $r)
    {
        $d = $r->validate(['identifier' => 'required|string|max:255']);
        if ($user = self::find($d['identifier'])) {
            $code = (string) random_int(100000, 999999);
            Cache::put("pwreset:{$user->id}", ['hash' => Hash::make($code), 'tries' => 0], now()->addMinutes(10));
            $user->notify(new CodeNotification($code));
            CodeNotification::sms($user->phone, "Panga na Kupangisha: your code is $code. It expires in 10 minutes.");
        }
        return ['detail' => 'If that account exists, a code was sent.', 'expires_in' => 600];
    }

    /** Step 2: code + new password. Five wrong codes burn the code. */
    public function reset(Request $r)
    {
        $d = $r->validate(['identifier' => 'required|string', 'code' => 'required|digits:6', 'password' => 'required|string|min:6']);
        $user = self::find($d['identifier']);
        $key = 'pwreset:' . ($user->id ?? 0);
        $entry = Cache::get($key);
        if (! $user || ! $entry || ! Hash::check($d['code'], $entry['hash'])) {
            if ($entry) {
                ++$entry['tries'] >= 5 ? Cache::forget($key) : Cache::put($key, $entry, now()->addMinutes(10));
            }
            return response()->json(['detail' => 'That code is wrong or has expired.'], 422);
        }
        Cache::forget($key);
        $user->update(['password' => $d['password']]);
        $user->tokens()->delete(); // sign out everywhere
        return $this->tokens($user) + ['user_id' => $user->id, 'role' => $user->role, 'user' => $this->userData($user)];
    }

    public function refresh(Request $r)
    {
        $user = $r->user();
        $user->currentAccessToken()->delete();
        return $this->tokens($user);
    }

    public function me(Request $r) { return $this->userData($r->user()); }

    /**
     * Update my name/email, or switch workspace (renter <-> landlord).
     * ponytail: one `role` column stands in for the capabilities model in the SRS (per-capability onboarding and
     * verification states); replace with a user_capabilities table when the Identity module is built.
     */
    public function updateMe(Request $r)
    {
        $u = $r->user();
        $d = $r->validate([
            'fullname' => 'sometimes|string|max:200',
            'email' => ['sometimes', 'nullable', 'email', Rule::unique('users', 'email')->ignore($u->id)],
            'role' => ['sometimes', Rule::in(['landlord', 'renter'])],
            'password' => 'sometimes|string|min:6',
        ]);
        if (isset($d['password'])) {
            $d['password'] = Hash::make($d['password']);
        }
        $u->update($d);
        return $this->userData($u);
    }

    public function logout(Request $r)
    {
        $r->user()->currentAccessToken()->delete();
        return response()->noContent();
    }

    /** 0712 345 678 / 255712345678 / +255 712 345 678 -> +255712345678 */
    public static function phone(?string $p): string
    {
        $p = preg_replace('/[^\d+]/', '', (string) $p);
        if (str_starts_with($p, '0')) return '+255' . substr($p, 1);
        return str_starts_with($p, '+') || $p === '' ? $p : '+' . $p;
    }

    /** Admins only exist on the website; suspended accounts cannot sign in or reset their way back in. */
    private static function find(string $identifier): ?User
    {
        $q = User::where('role', '!=', 'admin')->whereNull('suspended_at');
        return str_contains($identifier, '@')
            ? $q->where('email', strtolower(trim($identifier)))->first()
            : $q->where('phone', self::phone($identifier))->first();
    }

    private function tokens(User $u): array
    {
        $t = $u->createToken('mobile', ['*'], now()->addDays(60))->plainTextToken;
        return ['access' => $t, 'refresh' => $t]; // ponytail: Sanctum has no refresh tokens; /refresh swaps the access token
    }

    private function userData(User $u): array
    {
        $rawImg = $u->profile?->profile_image;
        $profileImg = null;
        if ($rawImg && !str_contains($rawImg, 'houses/')) {
            $profileImg = (str_starts_with($rawImg, 'http') || str_starts_with($rawImg, '/storage/')) 
                ? $rawImg 
                : '/storage/' . $rawImg;
        }

        return [
            'id' => $u->id,
            'fullname' => $u->fullname,
            'phone_number' => $u->phone,
            'email' => $u->email,
            'country' => $u->country,
            'role' => $u->role,
            'identity_status' => $u->identityStatus(), // landlords wait for 'approved' before their dashboard opens
            'business_status' => $u->business?->status ?? 'none',
            'profile_image' => $profileImg,
        ];
    }
}

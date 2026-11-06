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
        $rawRole = strtolower(trim((string) $r->input('role', 'renter')));
        $normalizedRole = $rawRole === 'tenant' ? 'renter' : $rawRole;

        $r->merge([
            'phone_number' => self::phone($r->input('phone_number') ?? $r->input('phone')),
            'email' => $r->input('email') ? strtolower(trim($r->input('email'))) : null,
            'country' => $r->input('country') ? strtoupper($r->input('country')) : null,
            'role' => $normalizedRole,
        ]);
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

        if ($r->hasSession()) {
            \Illuminate\Support\Facades\Auth::login($user);
            $r->session()->regenerate();
        }

        $redirect = $user->role === 'renter' ? '/tenant/dashboard' : '/landlord/dashboard';

        return response()->json([
            'user' => $this->userData($user),
            'tokens' => $this->tokens($user),
            'role' => $user->role,
            'redirect' => $redirect,
        ], 201);
    }

    /** Sign in with a phone number or an email. Response: access, refresh, user_id, role, user. */
    public function login(Request $r)
    {
        $identifier = $r->input('phone_number') ?? $r->input('identifier');
        $r->merge(['phone_number' => $identifier]);
        $d = $r->validate(['phone_number' => 'required|string', 'password' => 'required|string']);
        $user = self::find($d['phone_number']);
        if (! $user || ! Hash::check($d['password'], $user->password)) {
            return response()->json(['detail' => 'No active account found with the given credentials'], 401);
        }

        if ($r->hasSession()) {
            \Illuminate\Support\Facades\Auth::login($user);
            $r->session()->regenerate();
        }

        $redirect = ($user->role === 'renter' || $user->role === 'tenant')
            ? '/tenant/dashboard'
            : ($user->role === 'admin' ? '/admin' : '/landlord/dashboard');

        return $this->tokens($user) + [
            'user_id' => $user->id,
            'role' => $user->role,
            'redirect' => $redirect,
            'user' => $this->userData($user),
        ];
    }

    /** Step 1 of "forgot password": send a 6-digit code via email (and log SMS). */
    public function forgot(Request $r)
    {
        $d = $r->validate(['identifier' => 'required|string|max:255']);
        $identifier = trim($d['identifier']);
        $user = self::find($identifier);

        if (! $user) {
            return response()->json([
                'detail' => 'No active account found matching that email address or phone number.',
            ], 404);
        }

        $code = (string) random_int(100000, 999999);
        Cache::put("pwreset:{$user->id}", ['hash' => Hash::make($code), 'tries' => 0], now()->addMinutes(10));

        $mailSent = false;
        if ($user->email) {
            try {
                $user->notify(new CodeNotification($code));
                $mailSent = true;
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning("Password reset email delivery error for {$user->email} (code: {$code}): " . $e->getMessage());
            }
        }
        CodeNotification::sms($user->phone, "Panga na Kupangisha: your code is $code. It expires in 10 minutes.");

        $maskedEmail = null;
        if ($user->email) {
            $parts = explode('@', $user->email);
            $namePart = $parts[0] ?? '';
            $domainPart = $parts[1] ?? '';
            $maskedEmail = strlen($namePart) > 2
                ? substr($namePart, 0, 2) . str_repeat('*', max(2, strlen($namePart) - 2)) . '@' . $domainPart
                : $user->email;
        }

        return [
            'success' => true,
            'detail' => $maskedEmail
                ? "A 6-digit password reset code has been sent to {$maskedEmail}. It expires in 10 minutes."
                : 'A 6-digit password reset code has been generated for your account. It expires in 10 minutes.',
            'masked_email' => $maskedEmail,
            'mail_sent' => $mailSent,
            'expires_in' => 600,
        ];
    }

    /** Step 2: code + new password. Five wrong codes burn the code. */
    public function reset(Request $r)
    {
        $d = $r->validate([
            'identifier' => 'required|string',
            'code' => 'required|digits:6',
            'password' => 'required|string|min:6',
        ]);
        $user = self::find(trim($d['identifier']));
        $key = 'pwreset:' . ($user->id ?? 0);
        $entry = Cache::get($key);
        if (! $user || ! $entry || ! Hash::check($d['code'], $entry['hash'])) {
            if ($entry) {
                ++$entry['tries'] >= 5 ? Cache::forget($key) : Cache::put($key, $entry, now()->addMinutes(10));
            }
            return response()->json(['detail' => 'That verification code is invalid or has expired.'], 422);
        }
        Cache::forget($key);
        $user->update(['password' => $d['password']]);
        $user->tokens()->delete(); // sign out everywhere

        if ($r->hasSession()) {
            \Illuminate\Support\Facades\Auth::login($user);
            $r->session()->regenerate();
        }

        $redirect = ($user->role === 'renter' || $user->role === 'tenant')
            ? '/tenant/dashboard'
            : ($user->role === 'admin' ? '/admin' : '/landlord/dashboard');

        return $this->tokens($user) + [
            'success' => true,
            'user_id' => $user->id,
            'role' => $user->role,
            'redirect' => $redirect,
            'user' => $this->userData($user),
        ];
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

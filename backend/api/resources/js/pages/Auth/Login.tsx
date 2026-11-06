import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Eye,
    EyeOff,
    Loader2,
    ArrowLeft,
    CheckCircle2,
    KeyRound,
    Mail,
    ShieldCheck,
    ArrowRight,
    RefreshCw,
    AlertCircle,
} from 'lucide-react';

type AuthViewMode = 'login' | 'forgot_request' | 'forgot_verify' | 'forgot_success';

export default function UniversalLogin({ initialRole }: { initialRole?: string } = {}) {
    const [viewMode, setViewMode] = useState<AuthViewMode>('login');

    // Login state
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Role auto-detection feedback upon successful login
    const [detectedSession, setDetectedSession] = useState<{
        name: string;
        roleLabel: string;
        redirectUrl: string;
    } | null>(null);

    // Forgot Password state
    const [resetIdentifier, setResetIdentifier] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [resetInfoMessage, setResetInfoMessage] = useState<string | null>(null);
    const [maskedEmail, setMaskedEmail] = useState<string | null>(null);

    const formatRoleLabel = (rawRole?: string, serverLabel?: string): string => {
        if (serverLabel) return serverLabel;
        const r = (rawRole || '').toLowerCase();
        if (r === 'renter' || r === 'tenant') return 'Tenant';
        if (r === 'investor') return 'Investor';
        if (r === 'admin') return 'Administrator';
        return 'Landlord';
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const csrfToken =
                document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const response = await fetch('/login', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    identifier: identifier.trim(),
                    password,
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                        data.message ||
                        'Invalid credentials. Please check your phone/email and password.'
                );
            }

            if (data.access) {
                localStorage.setItem('auth_token', data.access);
            }

            const rawRole = String(data.role || data.user?.role || '').toLowerCase();
            const roleLabel = formatRoleLabel(rawRole, data.role_label);
            const targetUrl =
                rawRole === 'renter' || rawRole === 'tenant'
                    ? '/tenant/dashboard'
                    : rawRole === 'admin'
                        ? '/admin'
                        : '/landlord/dashboard';

            setDetectedSession({
                name: data.user?.name || data.user?.fullname || 'Welcome back',
                roleLabel,
                redirectUrl: targetUrl,
            });

            setTimeout(() => {
                window.location.href = targetUrl;
            }, 600);
        } catch (err: any) {
            setError(err.message || 'Unable to sign in. Please try again.');
            setLoading(false);
        }
    };

    const handleRequestResetCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResetInfoMessage(null);

        const targetId = resetIdentifier.trim();
        if (!targetId) {
            setError('Please enter your registered email address or phone number.');
            setLoading(false);
            return;
        }

        try {
            const csrfToken =
                document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const response = await fetch('/password/forgot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ identifier: targetId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                        data.message ||
                        'Could not find an account with that email or phone number.'
                );
            }

            setMaskedEmail(data.masked_email || targetId);
            setResetInfoMessage(
                data.detail ||
                    data.message ||
                    `We sent a 6-digit verification code to your email (${data.masked_email || targetId}).`
            );
            setViewMode('forgot_verify');
        } catch (err: any) {
            setError(err.message || 'Failed to send reset code. Please check your email/phone.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const cleanCode = resetCode.replace(/\D/g, '');
        if (cleanCode.length !== 6) {
            setError('Please enter the 6-digit verification code sent to your email.');
            return;
        }

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New password and confirmation do not match.');
            return;
        }

        setLoading(true);
        try {
            const csrfToken =
                document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const response = await fetch('/password/reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    identifier: resetIdentifier.trim(),
                    code: cleanCode,
                    password: newPassword,
                    password_confirmation: confirmPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                        data.message ||
                        'Invalid or expired verification code. Please try again.'
                );
            }

            if (data.access) {
                localStorage.setItem('auth_token', data.access);
            }

            const roleLabel = formatRoleLabel(data.role || data.user?.role);
            const targetUrl =
                data.redirect ||
                (data.role === 'renter' || data.role === 'tenant'
                    ? '/tenant/dashboard'
                    : '/landlord/dashboard');

            setDetectedSession({
                name: data.user?.fullname || data.user?.name || 'Account Restored',
                roleLabel,
                redirectUrl: targetUrl,
            });
            setViewMode('forgot_success');
        } catch (err: any) {
            setError(err.message || 'Could not reset password. Please check your code.');
        } finally {
            setLoading(false);
        }
    };

    const openForgotPassword = () => {
        setError(null);
        setResetInfoMessage(null);
        if (identifier.trim() && !resetIdentifier) {
            setResetIdentifier(identifier.trim());
        }
        setViewMode('forgot_request');
    };

    return (
        <div className="min-h-screen w-full relative flex flex-col justify-between p-4 sm:p-6 md:p-8 font-sans antialiased overflow-hidden">
            <Head title="Sign In • Panga Pangisha" />

            {/* Full-Bleed Architectural Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&auto=format&fit=crop&q=85"
                    alt="Modern Architectural Villa"
                    className="h-full w-full object-cover object-center scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/60 backdrop-blur-[2px]" />
            </div>

            {/* Top Bar Overlay */}
            <header className="relative z-10 w-full flex items-center justify-between text-white">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-full bg-black/35 hover:bg-black/55 px-4 py-2 text-xs uppercase tracking-wider font-bold backdrop-blur-md border border-white/15 transition-all text-stone-200 hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Back to Home</span>
                </Link>

                <Link href="/" className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#12161A] font-serif text-base font-bold shadow-sm">
                        P
                    </div>
                    <span className="font-serif text-base font-bold tracking-tight text-white drop-shadow-sm">
                        PANGA PANGISHA
                    </span>
                </Link>
            </header>

            {/* Centered Minimalist Glassmorphic Card */}
            <main className="relative z-10 w-full max-w-md mx-auto my-auto py-6">
                <div className="rounded-3xl bg-[#FAF8F5]/95 backdrop-blur-xl p-8 sm:p-10 shadow-2xl border border-white/30 text-[#12161A]">
                    {/* ========================================================= */}
                    {/* MODE 1: SIGN IN (AUTO-DETECTS ROLE & REDIRECTS)            */}
                    {/* ========================================================= */}
                    {viewMode === 'login' && (
                        <>
                            <div className="mb-7 text-center">
                                <span className="text-[10px] uppercase tracking-widest font-bold text-[#C2704E] block mb-1">
                                    Direct-From-Owner Living
                                </span>
                                <h1 className="font-serif text-3xl font-bold tracking-tight text-[#12161A]">
                                    Welcome Back
                                </h1>
                                <p className="mt-1.5 text-xs text-stone-500">
                                    Sign in with your email or phone. We will automatically detect your role and open your workspace.
                                </p>
                            </div>

                            {/* Role Detected & Redirecting Banner */}
                            {detectedSession && (
                                <div className="mb-5 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-900 animate-in fade-in duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                                            <ShieldCheck className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-emerald-950 truncate">
                                                    {detectedSession.name}
                                                </span>
                                                <span className="inline-flex items-center rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                                                    {detectedSession.roleLabel}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-emerald-700 mt-0.5">
                                                Redirecting to your {detectedSession.roleLabel} dashboard...
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Error Banner */}
                            {error && (
                                <div className="mb-5 rounded-2xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium text-center flex items-center justify-center gap-2">
                                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Form Fields */}
                            <form onSubmit={handleLoginSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[11px] uppercase tracking-wider font-bold text-stone-500 mb-1.5">
                                        Phone Number or Email
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        placeholder="e.g. +255754000001 or email@domain.com"
                                        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3.5 text-sm text-[#12161A] placeholder-stone-400 focus:border-[#12161A] focus:outline-hidden transition-colors"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-[11px] uppercase tracking-wider font-bold text-stone-500">
                                            Password
                                        </label>
                                        <button
                                            type="button"
                                            onClick={openForgotPassword}
                                            className="text-[11px] font-bold text-[#C2704E] hover:text-[#a35839] hover:underline cursor-pointer transition-colors"
                                        >
                                            Forgot password?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3.5 pr-11 text-sm text-[#12161A] placeholder-stone-400 focus:border-[#12161A] focus:outline-hidden transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !!detectedSession}
                                    className="mt-2 w-full rounded-full bg-[#12161A] py-3.5 text-xs uppercase tracking-wider font-bold text-white shadow-lg hover:bg-[#2A323D] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>
                                                {detectedSession
                                                    ? `Opening ${detectedSession.roleLabel} Portal...`
                                                    : 'Verifying Account...'}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Sign In</span>
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Footer Links */}
                            <div className="mt-7 pt-5 border-t border-stone-200/80 text-center text-xs text-stone-500">
                                Don&apos;t have an account?{' '}
                                <Link
                                    href="/signup"
                                    className="font-bold text-[#12161A] hover:text-[#C2704E] underline underline-offset-4 ml-1"
                                >
                                    Create Account
                                </Link>
                            </div>
                        </>
                    )}

                    {/* ========================================================= */}
                    {/* MODE 2: FORGOT PASSWORD — STEP 1 (REQUEST EMAIL CODE)      */}
                    {/* ========================================================= */}
                    {viewMode === 'forgot_request' && (
                        <>
                            <div className="mb-6 text-center">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C2704E]/15 text-[#C2704E]">
                                    <Mail className="h-6 w-6" />
                                </div>
                                <span className="text-[10px] uppercase tracking-widest font-bold text-[#C2704E] block mb-1">
                                    Account Recovery
                                </span>
                                <h2 className="font-serif text-2xl font-bold tracking-tight text-[#12161A]">
                                    Forgot Your Password?
                                </h2>
                                <p className="mt-1.5 text-xs text-stone-500 leading-relaxed">
                                    Enter your registered email address (or phone number). We will send a 6-digit verification code to your email.
                                </p>
                            </div>

                            {error && (
                                <div className="mb-5 rounded-2xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium text-center flex items-center justify-center gap-2">
                                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleRequestResetCode} className="space-y-4">
                                <div>
                                    <label className="block text-[11px] uppercase tracking-wider font-bold text-stone-500 mb-1.5">
                                        Registered Email or Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={resetIdentifier}
                                        onChange={(e) => setResetIdentifier(e.target.value)}
                                        placeholder="e.g. yourname@email.com or +255754000001"
                                        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3.5 text-sm text-[#12161A] placeholder-stone-400 focus:border-[#12161A] focus:outline-hidden transition-colors"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-full bg-[#12161A] py-3.5 text-xs uppercase tracking-wider font-bold text-white shadow-lg hover:bg-[#2A323D] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Sending Reset Code...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="h-4 w-4" />
                                            <span>Send 6-Digit Reset Code</span>
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 pt-5 border-t border-stone-200/80 text-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setError(null);
                                        setViewMode('login');
                                    }}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-[#12161A] cursor-pointer"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    <span>Back to Sign In</span>
                                </button>
                            </div>
                        </>
                    )}

                    {/* ========================================================= */}
                    {/* MODE 3: FORGOT PASSWORD — STEP 2 (VERIFY CODE & NEW PASS)  */}
                    {/* ========================================================= */}
                    {viewMode === 'forgot_verify' && (
                        <>
                            <div className="mb-5 text-center">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-700">
                                    <KeyRound className="h-6 w-6" />
                                </div>
                                <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-700 block mb-1">
                                    Verify Email Code
                                </span>
                                <h2 className="font-serif text-2xl font-bold tracking-tight text-[#12161A]">
                                    Reset Your Password
                                </h2>
                                {resetInfoMessage && (
                                    <p className="mt-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                                        {resetInfoMessage}
                                    </p>
                                )}
                            </div>

                            {error && (
                                <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium text-center flex items-center justify-center gap-2">
                                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleVerifyAndResetPassword} className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-[11px] uppercase tracking-wider font-bold text-stone-500">
                                            6-Digit Verification Code
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleRequestResetCode}
                                            disabled={loading}
                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C2704E] hover:underline cursor-pointer"
                                        >
                                            <RefreshCw className="h-3 w-3" />
                                            <span>Resend Code</span>
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        required
                                        value={resetCode}
                                        onChange={(e) =>
                                            setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                                        }
                                        placeholder="123456"
                                        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3.5 text-center font-mono text-lg font-bold tracking-[0.4em] text-[#12161A] placeholder-stone-300 focus:border-[#12161A] focus:outline-hidden transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] uppercase tracking-wider font-bold text-stone-500 mb-1.5">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            required
                                            minLength={6}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="At least 6 characters"
                                            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 pr-11 text-sm text-[#12161A] placeholder-stone-400 focus:border-[#12161A] focus:outline-hidden transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                                        >
                                            {showNewPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] uppercase tracking-wider font-bold text-stone-500 mb-1.5">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        required
                                        minLength={6}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter new password"
                                        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-[#12161A] placeholder-stone-400 focus:border-[#12161A] focus:outline-hidden transition-colors"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-full bg-[#12161A] py-3.5 text-xs uppercase tracking-wider font-bold text-white shadow-lg hover:bg-[#2A323D] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Updating Password...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-4 w-4" />
                                            <span>Verify Code & Update Password</span>
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-5 pt-4 border-t border-stone-200/80 flex items-center justify-between text-xs">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setError(null);
                                        setViewMode('forgot_request');
                                    }}
                                    className="font-bold text-stone-500 hover:text-[#12161A] cursor-pointer"
                                >
                                    Change Email / Phone
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setError(null);
                                        setViewMode('login');
                                    }}
                                    className="font-bold text-[#12161A] hover:text-[#C2704E] cursor-pointer"
                                >
                                    Back to Sign In
                                </button>
                            </div>
                        </>
                    )}

                    {/* ========================================================= */}
                    {/* MODE 4: FORGOT PASSWORD — SUCCESS                          */}
                    {/* ========================================================= */}
                    {viewMode === 'forgot_success' && (
                        <div className="text-center py-2">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-xs">
                                <CheckCircle2 className="h-9 w-9" />
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-2">
                                Password Updated
                            </span>
                            <h2 className="font-serif text-2xl font-bold text-[#12161A]">
                                You&apos;re All Set!
                            </h2>
                            <p className="mt-2 text-xs text-stone-600 leading-relaxed">
                                Your password has been reset and your{' '}
                                <strong className="text-[#12161A]">
                                    {detectedSession?.roleLabel || 'account'}
                                </strong>{' '}
                                session is active.
                            </p>

                            <button
                                type="button"
                                onClick={() => {
                                    window.location.href =
                                        detectedSession?.redirectUrl || '/tenant/dashboard';
                                }}
                                className="mt-6 w-full rounded-full bg-[#12161A] py-3.5 text-xs uppercase tracking-wider font-bold text-white shadow-lg hover:bg-[#2A323D] transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span>
                                    Continue to {detectedSession?.roleLabel || 'My'} Dashboard
                                </span>
                                <ArrowRight className="h-4 w-4" />
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setDetectedSession(null);
                                    setPassword('');
                                    setViewMode('login');
                                }}
                                className="mt-3 text-xs font-bold text-stone-500 hover:text-[#12161A] cursor-pointer"
                            >
                                Or return to Sign In screen
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer Bottom Caption */}
            <footer className="relative z-10 w-full text-center text-xs text-white/60">
                © {new Date().getFullYear()} Panga Pangisha. Verified direct-from-owner living across East Africa.
            </footer>
        </div>
    );
}

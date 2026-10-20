import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, EyeOff, Loader2, ArrowLeft, KeyRound, Building2 } from 'lucide-react';

interface UniversalLoginProps {
    initialRole?: 'landlord' | 'tenant' | 'renter' | 'admin';
}

export default function UniversalLogin({ initialRole = 'landlord' }: UniversalLoginProps) {
    const defaultPortal = (initialRole === 'renter' || initialRole === 'tenant') ? 'tenant' : 'landlord';
    const [selectedPortal, setSelectedPortal] = useState<'landlord' | 'tenant'>(defaultPortal);

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
                body: JSON.stringify({
                    identifier: identifier.trim(),
                    password: password,
                    portal: selectedPortal,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || data.message || 'No account found with these credentials.');
            }

            const token = data.access || data.tokens?.access;
            if (token) {
                localStorage.setItem('auth_token', token);
            }

            if (data.redirect) {
                router.visit(data.redirect);
            } else {
                const userRole = (data.role || data.user?.role || '').toLowerCase();
                if (userRole === 'renter' || userRole === 'tenant' || selectedPortal === 'tenant') {
                    router.visit('/tenant/dashboard');
                } else if (userRole === 'admin') {
                    router.visit('/admin');
                } else {
                    router.visit('/landlord/dashboard');
                }
            }
        } catch (err: any) {
            setError(err.message || 'Incorrect email/phone or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#FAF8F5] text-[#12161A] font-sans flex antialiased">
            <Head title="Sign In • Panga Pangisha" />

            {/* Left Column: Minimal Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 lg:p-16 xl:p-20">
                {/* Top Bar */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-stone-500 hover:text-[#12161A] transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back</span>
                    </Link>

                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#12161A] text-white font-serif text-sm font-bold">
                            P
                        </div>
                        <span className="font-serif text-sm font-bold tracking-tight text-[#12161A]">
                            PANGA PANGISHA
                        </span>
                    </Link>
                </div>

                {/* Form Body */}
                <div className="w-full max-w-sm mx-auto my-auto py-10">
                    <div className="mb-8">
                        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#12161A] tracking-tight">
                            Welcome back
                        </h1>
                        <p className="mt-2 text-xs sm:text-sm text-stone-500">
                            Enter your credentials to access your account.
                        </p>
                    </div>

                    {/* Role Toggle */}
                    <div className="mb-6 flex rounded-full bg-[#F0EBE3] p-1 text-xs">
                        <button
                            type="button"
                            onClick={() => setSelectedPortal('landlord')}
                            className={`flex-1 rounded-full py-2 font-bold uppercase tracking-wider transition-all ${
                                selectedPortal === 'landlord'
                                    ? 'bg-[#12161A] text-white shadow-xs'
                                    : 'text-stone-600 hover:text-[#12161A]'
                            }`}
                        >
                            Landlord
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedPortal('tenant')}
                            className={`flex-1 rounded-full py-2 font-bold uppercase tracking-wider transition-all ${
                                selectedPortal === 'tenant'
                                    ? 'bg-[#12161A] text-white shadow-xs'
                                    : 'text-stone-600 hover:text-[#12161A]'
                            }`}
                        >
                            Resident
                        </button>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="mb-6 rounded-2xl bg-red-50 border border-red-200/80 p-3.5 text-xs text-red-700 font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-[11px] uppercase tracking-wider font-bold text-stone-500 mb-1.5">
                                Phone or Email
                            </label>
                            <input
                                type="text"
                                required
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="e.g. +255 712 000 000 or email"
                                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-[#12161A] placeholder-stone-400 focus:border-[#12161A] focus:outline-hidden transition-colors"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-[11px] uppercase tracking-wider font-bold text-stone-500">
                                    Password
                                </label>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-[#12161A] placeholder-stone-400 focus:border-[#12161A] focus:outline-hidden transition-colors pr-11"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 rounded-full bg-[#12161A] py-3.5 text-xs uppercase tracking-wider font-bold text-white shadow-md hover:bg-[#2A323D] transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <span>Sign In</span>
                            )}
                        </button>
                    </form>

                    {/* Bottom Switcher */}
                    <p className="mt-8 text-center text-xs text-stone-500">
                        Don't have an account?{' '}
                        <Link
                            href={selectedPortal === 'landlord' ? '/signup?role=landlord' : '/signup'}
                            className="font-bold text-[#12161A] underline underline-offset-4 hover:opacity-75"
                        >
                            Create one
                        </Link>
                    </p>
                </div>

                {/* Footer copyright */}
                <div className="text-center sm:text-left text-[11px] text-stone-400">
                    © {new Date().getFullYear()} Panga Pangisha. All rights reserved.
                </div>
            </div>

            {/* Right Column: Architectural Photography (Floorspace / Pinterest Luxury Minimalist Real Estate) */}
            <div className="hidden lg:block lg:w-1/2 relative bg-[#181D22]">
                <img
                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&auto=format&fit=crop&q=85"
                    alt="Minimalist Architecture"
                    className="h-full w-full object-cover opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#12161A]/80 via-transparent to-black/20" />
                <div className="absolute bottom-12 left-12 right-12 text-white">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-[#F5D485] block mb-1">
                        Panga Pangisha Residences
                    </span>
                    <p className="font-serif text-2xl font-light text-stone-100 max-w-md">
                        Simplicity is the ultimate sophistication in living.
                    </p>
                </div>
            </div>
        </div>
    );
}

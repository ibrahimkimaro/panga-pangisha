import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';

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
        <div className="min-h-screen w-full relative flex flex-col justify-between p-4 sm:p-6 md:p-8 font-sans antialiased overflow-hidden">
            <Head title="Sign In • Panga Pangisha" />

            {/* Full-Bleed Architectural Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&auto=format&fit=crop&q=85"
                    alt="Luxury Minimalist Architecture"
                    className="h-full w-full object-cover object-center scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-black/60 backdrop-blur-[2px]" />
            </div>

            {/* Top Bar Overlay */}
            <header className="relative z-10 w-full flex items-center justify-between text-white">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-full bg-black/40 hover:bg-black/60 px-4 py-2 text-xs uppercase tracking-wider font-bold backdrop-blur-md border border-white/15 transition-all text-stone-200 hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
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

            {/* Centered Minimalist Form Card */}
            <main className="relative z-10 w-full max-w-md mx-auto my-auto py-8">
                <div className="rounded-3xl bg-[#FAF8F5]/95 backdrop-blur-xl p-8 sm:p-10 shadow-2xl border border-white/30 text-[#12161A]">
                    {/* Header */}
                    <div className="mb-6 text-center">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-[#8C827A] block mb-1">
                            Bespoke Residences
                        </span>
                        <h1 className="font-serif text-3xl font-bold tracking-tight text-[#12161A]">
                            Welcome back
                        </h1>
                        <p className="mt-1 text-xs text-stone-500">
                            Enter your credentials to continue.
                        </p>
                    </div>

                    {/* Role Selector Pill */}
                    <div className="mb-6 flex rounded-full bg-[#EAE5DD] p-1 text-xs">
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
                        <div className="mb-5 rounded-2xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium text-center">
                            {error}
                        </div>
                    )}

                    {/* Form Fields */}
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
                            <label className="block text-[11px] uppercase tracking-wider font-bold text-stone-500 mb-1.5">
                                Password
                            </label>
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

                    {/* Switcher */}
                    <p className="mt-6 text-center text-xs text-stone-500">
                        Don't have an account?{' '}
                        <Link
                            href={selectedPortal === 'landlord' ? '/signup?role=landlord' : '/signup'}
                            className="font-bold text-[#12161A] underline underline-offset-4 hover:opacity-75"
                        >
                            Create one
                        </Link>
                    </p>
                </div>
            </main>

            {/* Footer Bottom Caption */}
            <footer className="relative z-10 w-full text-center text-xs text-white/60">
                © {new Date().getFullYear()} Panga Pangisha. Verified direct-from-owner living.
            </footer>
        </div>
    );
}

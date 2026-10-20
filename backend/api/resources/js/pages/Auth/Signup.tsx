import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';

export default function UniversalSignup({ initialRole }: { initialRole?: string }) {
    const isLandlordDefault = initialRole === 'landlord';
    const [selectedRole, setSelectedRole] = useState<'renter' | 'landlord'>(
        isLandlordDefault ? 'landlord' : 'renter'
    );

    const [form, setForm] = useState({
        fullname: '',
        email: '',
        phone: '',
        password: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateForm = (field: string, val: string) => {
        setForm((prev) => ({ ...prev, [field]: val }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Clean phone number format
        let rawPhone = form.phone.trim().replace(/\D/g, '');
        if (rawPhone.startsWith('255')) {
            rawPhone = rawPhone.substring(3);
        } else if (rawPhone.startsWith('0')) {
            rawPhone = rawPhone.substring(1);
        }
        const fullPhone = `+255${rawPhone}`;

        try {
            const response = await fetch('/api/user/register/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullname: form.fullname.trim(),
                    email: form.email.trim() || null,
                    phone_number: fullPhone,
                    country: 'TZ',
                    password: form.password,
                    role: selectedRole,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                const message =
                    data.message ||
                    (data.errors ? Object.values(data.errors).flat().join(', ') : 'Registration failed');
                throw new Error(message);
            }

            const token = data.tokens?.access || data.access;
            if (token) {
                localStorage.setItem('auth_token', token);
            }

            if (selectedRole === 'landlord') {
                router.visit('/landlord/dashboard');
            } else {
                router.visit('/tenant/dashboard');
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please check your information.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#FAF8F5] text-[#12161A] font-sans flex antialiased">
            <Head title="Create Account • Panga Pangisha" />

            {/* Left Column: Form */}
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

                {/* Form Container */}
                <div className="w-full max-w-sm mx-auto my-auto py-10">
                    <div className="mb-8">
                        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#12161A] tracking-tight">
                            Create account
                        </h1>
                        <p className="mt-2 text-xs sm:text-sm text-stone-500">
                            Join Panga Pangisha to rent or list verified properties.
                        </p>
                    </div>

                    {/* Role Selector */}
                    <div className="mb-6 flex rounded-full bg-[#F0EBE3] p-1 text-xs">
                        <button
                            type="button"
                            onClick={() => setSelectedRole('renter')}
                            className={`flex-1 rounded-full py-2 font-bold uppercase tracking-wider transition-all ${
                                selectedRole === 'renter'
                                    ? 'bg-[#12161A] text-white shadow-xs'
                                    : 'text-stone-600 hover:text-[#12161A]'
                            }`}
                        >
                            Resident
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedRole('landlord')}
                            className={`flex-1 rounded-full py-2 font-bold uppercase tracking-wider transition-all ${
                                selectedRole === 'landlord'
                                    ? 'bg-[#12161A] text-white shadow-xs'
                                    : 'text-stone-600 hover:text-[#12161A]'
                            }`}
                        >
                            Landlord
                        </button>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="mb-6 rounded-2xl bg-red-50 border border-red-200/80 p-3.5 text-xs text-red-700 font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[11px] uppercase tracking-wider font-bold text-stone-500 mb-1.5">
                                Full Name
                            </label>
                            <input
                                type="text"
                                required
                                value={form.fullname}
                                onChange={(e) => updateForm('fullname', e.target.value)}
                                placeholder="e.g. Ibrahim Kimaro"
                                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-[#12161A] placeholder-stone-400 focus:border-[#12161A] focus:outline-hidden transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] uppercase tracking-wider font-bold text-stone-500 mb-1.5">
                                Phone Number
                            </label>
                            <div className="flex rounded-2xl border border-stone-200 bg-white overflow-hidden focus-within:border-[#12161A] transition-colors">
                                <span className="inline-flex items-center px-4 bg-stone-50 border-r border-stone-200 text-xs font-bold text-stone-600">
                                    +255
                                </span>
                                <input
                                    type="tel"
                                    required
                                    value={form.phone}
                                    onChange={(e) => updateForm('phone', e.target.value)}
                                    placeholder="712 345 678"
                                    className="w-full px-4 py-3 text-sm text-[#12161A] placeholder-stone-400 outline-hidden bg-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] uppercase tracking-wider font-bold text-stone-500 mb-1.5">
                                Email Address <span className="text-stone-400 font-normal lowercase">(optional)</span>
                            </label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => updateForm('email', e.target.value)}
                                placeholder="name@example.com"
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
                                    minLength={6}
                                    value={form.password}
                                    onChange={(e) => updateForm('password', e.target.value)}
                                    placeholder="Minimum 6 characters"
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
                                    <span>Creating account...</span>
                                </>
                            ) : (
                                <span>Create Account</span>
                            )}
                        </button>
                    </form>

                    {/* Bottom Switcher */}
                    <p className="mt-8 text-center text-xs text-stone-500">
                        Already have an account?{' '}
                        <Link
                            href="/login"
                            className="font-bold text-[#12161A] underline underline-offset-4 hover:opacity-75"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>

                {/* Footer copyright */}
                <div className="text-center sm:text-left text-[11px] text-stone-400">
                    © {new Date().getFullYear()} Panga Pangisha. All rights reserved.
                </div>
            </div>

            {/* Right Column: Architectural Photography */}
            <div className="hidden lg:block lg:w-1/2 relative bg-[#181D22]">
                <img
                    src="https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1400&auto=format&fit=crop&q=85"
                    alt="Minimalist Architecture"
                    className="h-full w-full object-cover opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#12161A]/80 via-transparent to-black/20" />
                <div className="absolute bottom-12 left-12 right-12 text-white">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-[#F5D485] block mb-1">
                        Panga Pangisha Residences
                    </span>
                    <p className="font-serif text-2xl font-light text-stone-100 max-w-md">
                        Authentic living, verified directly from owners.
                    </p>
                </div>
            </div>
        </div>
    );
}

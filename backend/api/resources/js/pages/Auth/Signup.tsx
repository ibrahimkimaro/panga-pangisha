import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Eye, EyeOff, Loader2, ArrowLeft, ArrowRight, CheckCircle2,
    ShieldCheck, Upload, FileText, CreditCard, Sparkles,
    AlertCircle, X, Zap, RefreshCw, Check, UserCheck, Shield
} from 'lucide-react';

interface CountryOption {
    code: string;
    name: string;
    dial: string;
    flag: string;
}

const COUNTRIES: CountryOption[] = [
    { code: 'TZ', name: 'Tanzania', dial: '+255', flag: '🇹🇿' },
    { code: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪' },
    { code: 'UG', name: 'Uganda', dial: '+256', flag: '🇺🇬' },
    { code: 'RW', name: 'Rwanda', dial: '+250', flag: '🇷🇼' },
    { code: 'BI', name: 'Burundi', dial: '+257', flag: '🇧🇮' },
    { code: 'CD', name: 'DR Congo', dial: '+243', flag: '🇨🇩' },
    { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦' },
    { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
    { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
];

type SignupStep = 'signup' | 'verification' | 'waiting' | 'welcome';
type VerificationMethod = 'nida_number' | 'nida_card' | 'driving_licence' | 'voter_id';

export default function UniversalSignup({ initialRole }: { initialRole?: string }) {
    const isLandlordDefault = initialRole === 'landlord';
    const [selectedRole, setSelectedRole] = useState<'renter' | 'landlord'>(
        isLandlordDefault ? 'landlord' : 'renter'
    );

    // Current Step
    const [step, setStep] = useState<SignupStep>('signup');

    // Step 1: Signup Form Data
    const [form, setForm] = useState({
        fullname: '',
        email: '',
        phone: '',
        country: 'TZ',
        password: '',
    });
    const [selectedCountry, setSelectedCountry] = useState<CountryOption>(COUNTRIES[0]);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auth session token & registered user
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [registeredUser, setRegisteredUser] = useState<{
        fullname: string;
        role: string;
        phone: string;
    } | null>(null);

    // Step 2: Verification Data
    const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>('nida_number');
    const [nidaInput, setNidaInput] = useState<string>('');
    const [documentFile, setDocumentFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Step 3: Waiting & Polling
    const [waitingStep, setWaitingStep] = useState<number>(2); // 1 = submitted, 2 = review, 3 = approved
    const [isSimulating, setIsSimulating] = useState<boolean>(false);
    const pollTimerRef = useRef<any>(null);
    const [welcomeCountdown, setWelcomeCountdown] = useState<number>(4);

    // Handle Country Selection
    const handleCountryChange = (code: string) => {
        const found = COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];
        setSelectedCountry(found);
        setForm((prev) => ({ ...prev, country: found.code }));
    };

    const updateForm = (field: string, val: string) => {
        setForm((prev) => ({ ...prev, [field]: val }));
    };

    // Format NIDA 20-digit input: 19850712-14125-00001-23
    const formatNida = (raw: string) => {
        const clean = raw.replace(/\D/g, '').slice(0, 20);
        if (clean.length <= 8) return clean;
        if (clean.length <= 13) return `${clean.slice(0, 8)}-${clean.slice(8)}`;
        if (clean.length <= 18) return `${clean.slice(0, 8)}-${clean.slice(8, 13)}-${clean.slice(13)}`;
        return `${clean.slice(0, 8)}-${clean.slice(8, 13)}-${clean.slice(13, 18)}-${clean.slice(18, 20)}`;
    };

    const handleNidaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatNida(e.target.value);
        setNidaInput(formatted);
    };

    // Handle File Attachment
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setDocumentFile(file);
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                setFilePreview(loadEvent.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // 1. Submit Registration Form
    const handleSignupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        let rawPhone = form.phone.trim().replace(/\D/g, '');
        const dialDigits = selectedCountry.dial.replace(/\D/g, '');
        if (rawPhone.startsWith(dialDigits)) {
            rawPhone = rawPhone.substring(dialDigits.length);
        } else if (rawPhone.startsWith('0')) {
            rawPhone = rawPhone.substring(1);
        }
        const fullPhone = `${selectedCountry.dial}${rawPhone}`;

        try {
            const response = await fetch('/api/user/register/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullname: form.fullname.trim(),
                    email: form.email.trim() || null,
                    phone_number: fullPhone,
                    country: selectedCountry.code,
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
                setAuthToken(token);
            }

            setRegisteredUser({
                fullname: form.fullname.trim(),
                role: selectedRole,
                phone: fullPhone,
            });

            // Transition to Verification Screen
            setStep('verification');
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please check your information.');
        } finally {
            setLoading(false);
        }
    };

    // 2. Submit Identity Verification
    const handleVerificationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const cleanNida = nidaInput.replace(/\D/g, '');
        if (verificationMethod === 'nida_number' && cleanNida.length !== 20) {
            setError(`National ID (NIDA) must be exactly 20 digits. You entered ${cleanNida.length}.`);
            setLoading(false);
            return;
        }

        if (verificationMethod !== 'nida_number' && !documentFile) {
            setError('Please attach a clear photo of your document.');
            setLoading(false);
            return;
        }

        try {
            const token = authToken || localStorage.getItem('auth_token');
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            let res: Response;
            if (verificationMethod === 'nida_number') {
                headers['Content-Type'] = 'application/json';
                res = await fetch('/api/identity', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        method: 'nida_number',
                        nida_number: cleanNida,
                    }),
                });
            } else {
                const formData = new FormData();
                formData.append('method', verificationMethod);
                if (documentFile) {
                    formData.append('document', documentFile);
                }
                res = await fetch('/api/identity', {
                    method: 'POST',
                    headers,
                    body: formData,
                });
            }

            if (!res.ok && res.status !== 409) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to submit identity for verification.');
            }

            // Move to Waiting Screen and start polling
            setStep('waiting');
            setWaitingStep(2);
            startPolling();
        } catch (err: any) {
            setError(err.message || 'Verification submission error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Polling function
    const startPolling = () => {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);

        const checkStatus = async () => {
            try {
                const token = authToken || localStorage.getItem('auth_token');
                const headers: Record<string, string> = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const res = await fetch('/api/identity', { headers });
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'approved') {
                        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
                        setWaitingStep(3);
                        setTimeout(() => {
                            setStep('welcome');
                        }, 800);
                    } else if (data.status === 'rejected') {
                        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
                        setError(data.rejection_reason || 'Identity verification was not accepted. Please re-submit.');
                        setStep('verification');
                    }
                }
            } catch {}
        };

        pollTimerRef.current = setInterval(checkStatus, 3000);
        checkStatus();
    };

    // Fast-track Admin Approval for live demo / developer testing
    const handleSimulateAdminApproval = async () => {
        setIsSimulating(true);
        try {
            const token = authToken || localStorage.getItem('auth_token');
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('/api/identity/simulate-approval', {
                method: 'POST',
                headers,
            });
            if (res.ok) {
                setWaitingStep(3);
                if (pollTimerRef.current) clearInterval(pollTimerRef.current);
                setTimeout(() => {
                    setStep('welcome');
                }, 700);
            }
        } catch {
            setWaitingStep(3);
            setTimeout(() => setStep('welcome'), 700);
        } finally {
            setIsSimulating(false);
        }
    };

    // Clean up interval on unmount
    useEffect(() => {
        return () => {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        };
    }, []);

    const finishAndRedirect = () => {
        if (selectedRole === 'landlord') {
            router.visit('/landlord/dashboard');
        } else {
            router.visit('/tenant/dashboard');
        }
    };

    // Auto-redirect to dashboard after welcome message is shown
    useEffect(() => {
        if (step === 'welcome') {
            const timer = setInterval(() => {
                setWelcomeCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        finishAndRedirect();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [step, selectedRole]);

    return (
        <div className="min-h-screen w-full relative flex flex-col justify-between p-4 sm:p-6 md:p-8 font-sans antialiased overflow-x-hidden">
            <Head title="Create Account & Identity Verification • Panga Pangisha" />

            {/* Full-Bleed Architectural Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1920&auto=format&fit=crop&q=85"
                    alt="Luxury Minimalist Villa Architecture"
                    className="h-full w-full object-cover object-center scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/65 backdrop-blur-[2px]" />
            </div>

            {/* Top Bar Overlay */}
            <header className="relative z-10 w-full flex items-center justify-between text-white">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-full bg-black/40 hover:bg-black/60 px-4 py-2 text-xs uppercase tracking-wider font-bold backdrop-blur-md border border-white/15 transition-all text-stone-200 hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Sanctuaries</span>
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

            {/* STEP 1: INITIAL SIGNUP FORM */}
            {step === 'signup' && (
                <main className="relative z-10 w-full max-w-md mx-auto my-auto py-8">
                    <div className="rounded-3xl bg-[#FAF8F5]/95 backdrop-blur-xl p-8 sm:p-10 shadow-2xl border border-white/30 text-[#12161A]">
                        {/* Header */}
                        <div className="mb-6 text-center">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-[#C2704E] block mb-1">
                                Verified Direct Living
                            </span>
                            <h1 className="font-serif text-3xl font-bold tracking-tight text-[#12161A]">
                                Create Account
                            </h1>
                            <p className="mt-1 text-xs text-stone-500">
                                Join Panga Pangisha to rent or list direct-from-owner residences.
                            </p>
                        </div>

                        {/* Role Selector Pill */}
                        <div className="mb-6 flex rounded-full bg-[#EAE5DD] p-1 text-xs">
                            <button
                                type="button"
                                onClick={() => setSelectedRole('renter')}
                                className={`flex-1 rounded-full py-2 font-bold uppercase tracking-wider transition-all cursor-pointer ${
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
                                className={`flex-1 rounded-full py-2 font-bold uppercase tracking-wider transition-all cursor-pointer ${
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
                            <div className="mb-5 rounded-2xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium text-center flex items-center justify-center gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Form Fields */}
                        <form onSubmit={handleSignupSubmit} className="space-y-4">
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

                            {/* Country Selector */}
                            <div>
                                <label className="block text-[11px] uppercase tracking-wider font-bold text-stone-500 mb-1.5">
                                    Country & Region
                                </label>
                                <div className="relative">
                                    <select
                                        value={selectedCountry.code}
                                        onChange={(e) => handleCountryChange(e.target.value)}
                                        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-[#12161A] focus:border-[#12161A] focus:outline-hidden transition-colors appearance-none cursor-pointer pr-10 font-medium"
                                    >
                                        {COUNTRIES.map((c) => (
                                            <option key={c.code} value={c.code}>
                                                {c.flag} {c.name} ({c.dial})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold">
                                        ▼
                                    </div>
                                </div>
                            </div>

                            {/* Phone Number with Dynamic Country Code */}
                            <div>
                                <label className="block text-[11px] uppercase tracking-wider font-bold text-stone-500 mb-1.5">
                                    Phone Number
                                </label>
                                <div className="flex rounded-2xl border border-stone-200 bg-white overflow-hidden focus-within:border-[#12161A] transition-colors">
                                    <span className="inline-flex items-center gap-1 px-3.5 bg-stone-50 border-r border-stone-200 text-xs font-bold text-stone-700">
                                        <span>{selectedCountry.flag}</span>
                                        <span>{selectedCountry.dial}</span>
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

                            {/* Email (Optional) */}
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

                            {/* Password */}
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
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
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
                                    <>
                                        <span>Continue to Verification</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Switcher to Login */}
                        <p className="mt-6 text-center text-xs text-stone-500">
                            Already have an account?{' '}
                            <Link
                                href="/login"
                                className="font-bold text-[#12161A] underline underline-offset-4 hover:opacity-75"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </main>
            )}

            {/* STEP 2: POST-SIGNUP IDENTITY VERIFICATION SUBMISSION SCREEN */}
            {step === 'verification' && (
                <main className="relative z-10 w-full max-w-lg mx-auto my-auto py-8">
                    <div className="rounded-3xl bg-[#FAF8F5]/95 backdrop-blur-xl p-8 sm:p-10 shadow-2xl border border-white/30 text-[#12161A]">
                        {/* Header */}
                        <div className="mb-6 text-center">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDF4EF] border border-[#F3DACF] px-3 py-1 text-[10px] uppercase tracking-widest font-bold text-[#C2704E] mb-2">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Compliance Desk Verification
                            </span>
                            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#12161A]">
                                Verify Your Identity
                            </h2>
                            <p className="mt-1 text-xs text-stone-600 max-w-sm mx-auto">
                                Panga Pangisha is a trusted community with zero fraud and 0% dalali broker fees. Please provide your NIDA number or official ID image.
                            </p>
                        </div>

                        {/* Error Notice */}
                        {error && (
                            <div className="mb-5 rounded-2xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium text-center flex items-center justify-center gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Method Selector Tabs */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                            <button
                                type="button"
                                onClick={() => {
                                    setVerificationMethod('nida_number');
                                    setError(null);
                                }}
                                className={`p-3 rounded-2xl text-center border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                                    verificationMethod === 'nida_number'
                                        ? 'bg-[#12161A] text-white border-[#12161A] shadow-xs'
                                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                                }`}
                            >
                                <CreditCard className="h-4 w-4" />
                                <span className="text-[11px] leading-tight">NIDA Number</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setVerificationMethod('nida_card');
                                    setError(null);
                                }}
                                className={`p-3 rounded-2xl text-center border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                                    verificationMethod === 'nida_card'
                                        ? 'bg-[#12161A] text-white border-[#12161A] shadow-xs'
                                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                                }`}
                            >
                                <FileText className="h-4 w-4" />
                                <span className="text-[11px] leading-tight">NIDA Card</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setVerificationMethod('driving_licence');
                                    setError(null);
                                }}
                                className={`p-3 rounded-2xl text-center border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                                    verificationMethod === 'driving_licence'
                                        ? 'bg-[#12161A] text-white border-[#12161A] shadow-xs'
                                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                                }`}
                            >
                                <Shield className="h-4 w-4" />
                                <span className="text-[11px] leading-tight">Passport / Licence</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setVerificationMethod('voter_id');
                                    setError(null);
                                }}
                                className={`p-3 rounded-2xl text-center border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                                    verificationMethod === 'voter_id'
                                        ? 'bg-[#12161A] text-white border-[#12161A] shadow-xs'
                                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                                }`}
                            >
                                <UserCheck className="h-4 w-4" />
                                <span className="text-[11px] leading-tight">Voter ID</span>
                            </button>
                        </div>

                        {/* Submission Form */}
                        <form onSubmit={handleVerificationSubmit} className="space-y-4">
                            {/* Option A: NIDA 20-digit number */}
                            {verificationMethod === 'nida_number' && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-stone-500">
                                        <span>20-Digit NIDA Number</span>
                                        <span className={nidaInput.replace(/\D/g, '').length === 20 ? 'text-emerald-600 font-extrabold' : 'text-stone-400'}>
                                            {nidaInput.replace(/\D/g, '').length} / 20 digits
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={nidaInput}
                                            onChange={handleNidaChange}
                                            placeholder="19850712-14125-00001-23"
                                            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3.5 text-base sm:text-lg font-mono font-bold tracking-wider text-[#12161A] placeholder-stone-300 focus:border-[#12161A] focus:outline-hidden transition-colors"
                                        />
                                        {nidaInput.replace(/\D/g, '').length === 20 && (
                                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600">
                                                <CheckCircle2 className="h-5 w-5" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-stone-500">
                                        Enter your official National Identification Number. Format: YYYYMMDD-XXXXX-XXXXX-XX.
                                    </p>
                                </div>
                            )}

                            {/* Option B, C, D: Document Photo Upload */}
                            {verificationMethod !== 'nida_number' && (
                                <div className="space-y-3">
                                    <label className="block text-[11px] uppercase tracking-wider font-bold text-stone-500">
                                        Upload Document Image ({verificationMethod === 'nida_card' ? 'NIDA Physical Card' : verificationMethod === 'driving_licence' ? 'Passport / Driving Licence' : 'Voter ID Card'})
                                    </label>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileSelect}
                                    />

                                    {filePreview ? (
                                        <div className="relative rounded-2xl overflow-hidden border border-stone-300 bg-stone-100 p-2">
                                            <img
                                                src={filePreview}
                                                alt="Document Preview"
                                                className="w-full h-44 object-cover rounded-xl"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDocumentFile(null);
                                                    setFilePreview(null);
                                                }}
                                                className="absolute top-4 right-4 h-7 w-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-all cursor-pointer"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                            <div className="mt-2 px-2 text-xs font-medium text-stone-600 truncate">
                                                {documentFile?.name} ({(documentFile?.size ? documentFile.size / 1024 : 0).toFixed(0)} KB)
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-stone-300 hover:border-[#12161A] rounded-2xl p-6 text-center cursor-pointer transition-all bg-stone-50 hover:bg-stone-100 flex flex-col items-center justify-center gap-2"
                                        >
                                            <div className="h-10 w-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-600 shadow-2xs">
                                                <Upload className="h-5 w-5" />
                                            </div>
                                            <span className="text-xs font-bold text-[#12161A]">
                                                Click to upload document photo
                                            </span>
                                            <span className="text-[11px] text-stone-500">
                                                Clear photo of front side (JPEG, PNG up to 10MB)
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* CTA Action */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-4 rounded-full bg-[#12161A] py-3.5 text-xs uppercase tracking-wider font-bold text-white shadow-md hover:bg-[#2A323D] transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Submitting to Compliance Desk...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Submit for Instant Verification</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </button>

                            {/* Skip button for user flexibility */}
                            <div className="text-center pt-2">
                                <button
                                    type="button"
                                    onClick={finishAndRedirect}
                                    className="text-xs font-semibold text-stone-500 hover:text-[#12161A] underline underline-offset-4 cursor-pointer"
                                >
                                    I'll verify my ID later • Continue to dashboard
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            )}

            {/* STEP 3: REAL-TIME WAITING DIALOG / MODAL (MATCHING FLUTTER DART UI) */}
            {step === 'waiting' && (
                <main className="relative z-10 w-full max-w-md mx-auto my-auto py-8">
                    <div className="rounded-3xl bg-[#FAF8F5]/98 backdrop-blur-xl p-8 sm:p-10 shadow-2xl border border-white/40 text-[#12161A] text-center">
                        {/* Animated Radar Pulse Icon */}
                        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C2704E]/25 opacity-75" />
                            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#12161A] text-white shadow-lg">
                                <RefreshCw className="h-7 w-7 animate-spin text-[#F5D485]" />
                            </div>
                        </div>

                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1 text-[11px] font-bold text-amber-800 mb-3">
                            <Zap className="h-3 w-3 text-amber-600" />
                            Live Verification In Progress
                        </span>

                        <h2 className="font-serif text-2xl font-bold tracking-tight text-[#12161A]">
                            Awaiting Admin Review
                        </h2>
                        <p className="mt-2 text-xs text-stone-600 leading-relaxed">
                            Your identity details have been encrypted and dispatched to the Panga Pangisha compliance desk. Checking status every 3 seconds...
                        </p>

                        {/* Step Progress Timeline (Identical to Dart UI) */}
                        <div className="my-6 space-y-3 rounded-2xl bg-white p-4 border border-stone-200 text-left text-xs">
                            <div className="flex items-center gap-3">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shrink-0">
                                    <Check className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex-1">
                                    <span className="font-bold text-stone-800 block">Documents Transmitted</span>
                                    <span className="text-[11px] text-stone-500">256-bit encrypted payload received</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white shrink-0 animate-pulse">
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                </div>
                                <div className="flex-1">
                                    <span className="font-bold text-stone-800 block">Compliance Officer Review</span>
                                    <span className="text-[11px] text-stone-500">Realtime verification queue active</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 opacity-50">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-200 text-stone-500 shrink-0">
                                    <Sparkles className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex-1">
                                    <span className="font-bold text-stone-800 block">Final Approval & Access</span>
                                    <span className="text-[11px] text-stone-500">Full verified account privileges</span>
                                </div>
                            </div>
                        </div>

                        {/* Fast-Track Simulation Button for Demo & Testing */}
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={handleSimulateAdminApproval}
                                disabled={isSimulating}
                                className="w-full rounded-2xl bg-gradient-to-r from-[#C2704E] to-[#A85838] py-3 text-xs font-bold text-white shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                            >
                                {isSimulating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Approving in Realtime...</span>
                                    </>
                                ) : (
                                    <>
                                        <Zap className="h-4 w-4" />
                                        <span>Simulate Admin Instant Approval (Demo)</span>
                                    </>
                                )}
                            </button>
                            <p className="mt-2 text-[10px] text-stone-400">
                                Click to instantly test the approval transition without opening the admin console.
                            </p>
                        </div>
                    </div>
                </main>
            )}

            {/* STEP 4: LUXURY WELCOME & APPROVAL CELEBRATION */}
            {step === 'welcome' && (
                <main className="relative z-10 w-full max-w-md mx-auto my-auto py-8">
                    <div className="rounded-3xl bg-[#FAF8F5]/98 backdrop-blur-xl p-8 sm:p-10 shadow-2xl border border-white/40 text-[#12161A] text-center animate-in fade-in zoom-in-95 duration-500">
                        {/* Celebration Sparkling Badge */}
                        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-600 shadow-md">
                            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                        </div>

                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider mb-2">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                            Official Verified Identity
                        </span>

                        <h2 className="font-serif text-3xl font-bold tracking-tight text-[#12161A]">
                            Karibu Sana, {registeredUser?.fullname || form.fullname}!
                        </h2>

                        <p className="mt-3 text-xs text-stone-600 leading-relaxed">
                            {selectedRole === 'landlord'
                                ? 'Your landlord credentials have been verified by the compliance desk. You have complete access to post homes, generate official leases, and manage STS prepaid electricity submeters.'
                                : 'Your resident identity is verified. You can now schedule viewings directly with landlords, sign digital rental agreements, and enjoy 0% broker fee living across Tanzania.'}
                        </p>

                        {/* Verified Credential Summary Card */}
                        <div className="my-6 rounded-2xl bg-white p-4 border border-stone-200 text-left text-xs space-y-2">
                            <div className="flex items-center justify-between py-1 border-b border-stone-100">
                                <span className="text-stone-500">Account Type</span>
                                <span className="font-bold text-[#12161A] capitalize">{selectedRole}</span>
                            </div>
                            <div className="flex items-center justify-between py-1 border-b border-stone-100">
                                <span className="text-stone-500">Verified Phone</span>
                                <span className="font-bold text-[#12161A]">{registeredUser?.phone || form.phone}</span>
                            </div>
                            <div className="flex items-center justify-between py-1">
                                <span className="text-stone-500">Compliance Status</span>
                                <span className="font-bold text-emerald-600 flex items-center gap-1">
                                    <Check className="h-3.5 w-3.5" /> Approved & Active
                                </span>
                            </div>
                        </div>

                        {/* Primary Dashboard Link */}
                        <button
                            type="button"
                            onClick={finishAndRedirect}
                            className="w-full rounded-full bg-[#12161A] py-3.5 text-xs uppercase tracking-wider font-bold text-white shadow-lg hover:bg-[#2A323D] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                        >
                            <span>Enter My Dashboard ({welcomeCountdown}s)</span>
                            <ArrowRight className="h-4 w-4" />
                        </button>
                        <p className="mt-2 text-[11px] text-stone-400">
                            Auto-redirecting in {welcomeCountdown} second{welcomeCountdown === 1 ? '' : 's'}...
                        </p>

                        <div className="mt-4">
                            <Link
                                href="/"
                                className="text-xs font-bold text-stone-600 hover:text-[#12161A] underline underline-offset-4"
                            >
                                Browse All Sanctuaries
                            </Link>
                        </div>
                    </div>
                </main>
            )}

            {/* Footer Bottom Caption */}
            <footer className="relative z-10 w-full text-center text-xs text-white/60">
                © {new Date().getFullYear()} Panga Pangisha. Verified direct-from-owner living across East Africa.
            </footer>
        </div>
    );
}

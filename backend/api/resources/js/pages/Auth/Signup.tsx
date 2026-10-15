import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, Phone, Lock, Eye, EyeOff, Loader2, ArrowRight, ArrowLeft,
    Check, KeyRound, Home, Building2, TrendingUp, Sparkles, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Logo } from '@/components/ui';

interface CountryOption {
    code: string;
    dial: string;
    flag: string;
    name: string;
}

const COUNTRIES: CountryOption[] = [
    { code: 'TZ', dial: '255', flag: '🇹🇿', name: 'Tanzania' },
    { code: 'KE', dial: '254', flag: '🇰🇪', name: 'Kenya' },
    { code: 'UG', dial: '256', flag: '🇺🇬', name: 'Uganda' },
    { code: 'RW', dial: '250', flag: '🇷🇼', name: 'Rwanda' },
];

type RoleKey = 'renter' | 'landlord' | 'manager' | 'investor';

interface RoleOption {
    key: RoleKey;
    title: string;
    subtitle: string;
    icon: typeof Home;
    badge?: string;
}

const ROLES: RoleOption[] = [
    {
        key: 'renter',
        title: 'Tenant (Mpangaji)',
        subtitle: 'Looking for verified homes and transparent rentals in Tanzania',
        icon: Home,
    },
    {
        key: 'landlord',
        title: 'Landlord (Mmiliki)',
        subtitle: 'Own rental properties, manage units, and track rent collection',
        icon: KeyRound,
        badge: 'Popular',
    },
    {
        key: 'manager',
        title: 'Property Manager (Msimamizi)',
        subtitle: 'Manage residential or commercial units on behalf of property owners',
        icon: Building2,
    },
    {
        key: 'investor',
        title: 'Real Estate Investor',
        subtitle: 'Explore yield analytics and property opportunities in East Africa',
        icon: TrendingUp,
    },
];

export default function UniversalSignup({ initialRole }: { initialRole?: string }) {
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedRole, setSelectedRole] = useState<RoleKey>(
        (initialRole === 'landlord' || initialRole === 'renter' || initialRole === 'manager' || initialRole === 'investor')
            ? (initialRole as RoleKey)
            : 'renter'
    );
    const [selectedCountry, setSelectedCountry] = useState<CountryOption>(COUNTRIES[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(true);

    const [form, setForm] = useState({
        fullname: '',
        email: '',
        phone: '',
        password: '',
    });

    const updateForm = (field: string, val: string) => {
        setForm((prev) => ({ ...prev, [field]: val }));
    };

    const handleNext = () => {
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreedToTerms) {
            setError('Please agree to the Terms of Service and Privacy Policy to continue.');
            return;
        }

        setLoading(true);
        setError(null);

        // Format international phone number
        let rawPhone = form.phone.trim().replace(/\D/g, '');
        if (rawPhone.startsWith(selectedCountry.dial)) {
            rawPhone = rawPhone.substring(selectedCountry.dial.length);
        } else if (rawPhone.startsWith('0')) {
            rawPhone = rawPhone.substring(1);
        }
        const fullPhone = `+${selectedCountry.dial}${rawPhone}`;

        // Map role to backend accepted enum: landlord | renter | investor
        const backendRole = selectedRole === 'manager' ? 'landlord' : selectedRole;

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
                    role: backendRole,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                const message = data.message || (data.errors ? Object.values(data.errors).flat().join(', ') : 'Registration failed');
                throw new Error(message);
            }

            const token = data.tokens?.access || data.access;
            if (token) {
                localStorage.setItem('auth_token', token);
            }

            // Role-based routing as requested:
            if (backendRole === 'landlord') {
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
        <div className="min-h-screen bg-[#0A192F] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            <Head title="Create Your Account | Panga Pangisha" />

            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-teal-bright/10 blur-[130px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-brass/10 blur-[130px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-xl z-10"
            >
                {/* Header navigation */}
                <div className="flex items-center justify-between mb-8">
                    {step === 2 ? (
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors group"
                        >
                            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
                            Change role
                        </button>
                    ) : (
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors group"
                        >
                            <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
                            Back to home
                        </Link>
                    )}
                    <Link href="/">
                        <Logo onDark className="text-2xl" />
                    </Link>
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center gap-3 mb-6">
                    <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 1 ? 'bg-teal-bright' : 'bg-white/10'}`} />
                    <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-teal-bright' : 'bg-white/10'}`} />
                </div>

                {/* Card Container */}
                <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] ring-1 ring-white/10 shadow-2xl">
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-teal-bright">
                                        Step 1 of 2
                                    </span>
                                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 mb-2">
                                        What best describes you?
                                    </h2>
                                    <p className="text-white/60 text-sm">
                                        Choose your primary account type. You can access tools tailored for your journey.
                                    </p>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    {ROLES.map((r) => {
                                        const Icon = r.icon;
                                        const isSelected = selectedRole === r.key;
                                        return (
                                            <button
                                                key={r.key}
                                                type="button"
                                                onClick={() => setSelectedRole(r.key)}
                                                className={`text-left p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                                                    isSelected
                                                        ? 'bg-teal-bright/15 border-teal-bright ring-2 ring-teal-bright/40 shadow-lg shadow-teal-bright/10'
                                                        : 'bg-white/5 border-white/10 hover:border-white/25 hover:bg-white/10'
                                                }`}
                                            >
                                                {r.badge && (
                                                    <span className="absolute top-3 right-3 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-bright text-navy uppercase tracking-wider">
                                                        {r.badge}
                                                    </span>
                                                )}
                                                <div>
                                                    <div className={`size-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                                                        isSelected ? 'bg-teal-bright text-navy' : 'bg-white/10 text-white'
                                                    }`}>
                                                        <Icon className="size-5" />
                                                    </div>
                                                    <h3 className="font-bold text-base text-white">{r.title}</h3>
                                                    <p className="text-xs text-white/60 mt-1 leading-relaxed">
                                                        {r.subtitle}
                                                    </p>
                                                </div>
                                                <div className="mt-4 flex items-center justify-end">
                                                    <div className={`size-5 rounded-full flex items-center justify-center border ${
                                                        isSelected ? 'bg-teal-bright border-teal-bright text-navy' : 'border-white/30'
                                                    }`}>
                                                        {isSelected && <Check className="size-3 stroke-[3]" />}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-teal-bright text-navy font-bold text-sm hover:bg-white transition-all shadow-lg shadow-teal-bright/20 active:scale-98"
                                >
                                    Continue to details <ArrowRight className="size-5" />
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-teal-bright">
                                            Step 2 of 2
                                        </span>
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white/80">
                                            Role: {selectedRole === 'landlord' ? 'Landlord' : selectedRole === 'manager' ? 'Property Manager' : selectedRole === 'investor' ? 'Investor' : 'Tenant'}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 mb-2">
                                        Create your account
                                    </h2>
                                    <p className="text-white/60 text-sm">
                                        Enter your contact information to set up your profile.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Full Name */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-white/70 ml-1">
                                            Full Name
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                                            <input
                                                type="text"
                                                value={form.fullname}
                                                onChange={(e) => updateForm('fullname', e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 ring-1 ring-white/10 focus:ring-2 focus:ring-teal-bright outline-none text-white placeholder-white/30 transition-all text-sm"
                                                placeholder="e.g. Ibrahim Kimaro"
                                                required
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-white/70 ml-1">
                                            Email Address <span className="text-white/40 font-normal">(Optional)</span>
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                                            <input
                                                type="email"
                                                value={form.email}
                                                onChange={(e) => updateForm('email', e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 ring-1 ring-white/10 focus:ring-2 focus:ring-teal-bright outline-none text-white placeholder-white/30 transition-all text-sm"
                                                placeholder="ibrahim@example.com"
                                            />
                                        </div>
                                    </div>

                                    {/* Phone & Country Picker */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-white/70 ml-1">
                                            Phone Number
                                        </label>
                                        <div className="flex gap-2">
                                            <select
                                                value={selectedCountry.code}
                                                onChange={(e) => {
                                                    const c = COUNTRIES.find((x) => x.code === e.target.value);
                                                    if (c) setSelectedCountry(c);
                                                }}
                                                className="px-3 py-3 rounded-xl bg-white/5 ring-1 ring-white/10 focus:ring-2 focus:ring-teal-bright outline-none text-white text-sm cursor-pointer"
                                            >
                                                {COUNTRIES.map((c) => (
                                                    <option key={c.code} value={c.code} className="bg-navy text-white">
                                                        {c.flag} +{c.dial}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="relative flex-1">
                                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                                                <input
                                                    type="tel"
                                                    value={form.phone}
                                                    onChange={(e) => updateForm('phone', e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 ring-1 ring-white/10 focus:ring-2 focus:ring-teal-bright outline-none text-white placeholder-white/30 transition-all text-sm"
                                                    placeholder="712 345 678"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-white/70 ml-1">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={form.password}
                                                onChange={(e) => updateForm('password', e.target.value)}
                                                className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 ring-1 ring-white/10 focus:ring-2 focus:ring-teal-bright outline-none text-white placeholder-white/30 transition-all text-sm"
                                                placeholder="At least 6 characters"
                                                minLength={6}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Terms Checkbox */}
                                    <div className="flex items-start gap-3 pt-2">
                                        <input
                                            type="checkbox"
                                            id="terms"
                                            checked={agreedToTerms}
                                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                                            className="mt-1 size-4 rounded accent-teal cursor-pointer"
                                        />
                                        <label htmlFor="terms" className="text-xs text-white/60 leading-relaxed cursor-pointer select-none">
                                            I agree to the{' '}
                                            <a href="#" className="text-teal-bright underline">Terms of Service</a>{' '}
                                            and{' '}
                                            <a href="#" className="text-teal-bright underline">Privacy Policy</a>.
                                        </label>
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-medium flex items-center gap-2.5"
                                        >
                                            <AlertCircle className="size-4 shrink-0 text-red-400" />
                                            <span>{error}</span>
                                        </motion.div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-teal-bright text-navy font-bold text-sm hover:bg-white transition-all shadow-lg shadow-teal-bright/20 active:scale-98 disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="size-5 animate-spin" /> : 'Complete Registration'}
                                        {!loading && <ArrowRight className="size-5" />}
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Switch */}
                <div className="text-center mt-8">
                    <p className="text-white/50 text-sm">
                        Already have an account?{' '}
                        <Link
                            href="/login"
                            className="text-teal-bright font-bold hover:underline"
                        >
                            Sign in here
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

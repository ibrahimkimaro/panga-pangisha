import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Lock, ArrowRight, Eye, Loader2, EyeOff, ArrowLeft, Globe, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/ui';

export default function LandlordSignup() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        phone: '',
        country: 'TZ',
        password: '',
        role: 'landlord'
    });

    const updateForm = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleRegister = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/user/register/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullname: formData.fullname,
                    email: formData.email,
                    phone_number: formData.phone,
                    country: formData.country,
                    password: formData.password,
                    role: formData.role
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || data.detail || 'Registration failed');
            if (data.tokens?.access || data.access) {
                localStorage.setItem('auth_token', data.tokens?.access || data.access);
            }
            router.visit('/landlord/dashboard');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A192F] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <Head title="Create Landlord Account | Panga Pangisha" />
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-teal-bright/10 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brass/10 blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md z-10"
            >
                <div className="flex items-center justify-between mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors group">
                        <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
                        Back to home
                    </Link>
                    <Link href="/">
                        <Logo onDark className="text-2xl" />
                    </Link>
                </div>

                <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] ring-1 ring-white/10 shadow-2xl">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-2">Account Setup</h2>
                        <p className="text-white/60 text-sm">Step {step} of 3: {step === 1 ? 'Basic Info' : step === 2 ? 'Identity' : 'Security'}</p>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); if (step < 3) setStep(step + 1); else handleRegister(); }} className="space-y-6">
                        {step === 1 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/70 ml-1">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-white/30" />
                                        <input
                                            value={formData.fullname}
                                            onChange={(e) => updateForm('fullname', e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 ring-1 ring-white/10 focus:ring-teal outline-none transition-all"
                                            placeholder="Jane Doe"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/70 ml-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-white/30" />
                                        <input
                                            value={formData.email}
                                            onChange={(e) => updateForm('email', e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 ring-1 ring-white/10 focus:ring-teal outline-none transition-all"
                                            placeholder="jane@example.com"
                                            type="email"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/70 ml-1">Phone Number</label>
                                    <div className="relative flex gap-2">
                                        <div className="flex items-center px-3 rounded-xl bg-white/10 ring-1 ring-white/10 text-sm font-bold">
                                            <Globe className="size-4 mr-2" /> TZ
                                        </div>
                                        <div className="relative flex-1">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-white/30" />
                                            <input
                                                value={formData.phone}
                                                onChange={(e) => updateForm('phone', e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 ring-1 ring-white/10 focus:ring-teal outline-none transition-all"
                                                placeholder="+255..."
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-teal/10 border border-teal/20 text-teal text-xs leading-relaxed">
                                    <div className="flex items-start gap-2">
                                        <Info className="size-4 shrink-0" />
                                        <p>We use your phone number to verify your identity as a property owner.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/70 ml-1">Create Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-white/30" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={(e) => updateForm('password', e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 ring-1 ring-white/10 focus:ring-teal outline-none transition-all"
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl bg-white/5 ring-1 ring-white/10 text-[11px] text-white/50 leading-relaxed">
                                    <p>By creating an account, you agree to our Terms of Service and Privacy Policy.</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 rounded-xl bg-hibiscus/20 border border-hibiscus/30 text-hibiscus text-xs font-medium flex items-center gap-2">
                                <AlertCircle className="size-4" /> {error}
                            </div>
                        )}

                        <div className="flex justify-between items-center mt-8">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setStep(step - 1)}
                                    className="text-sm font-semibold text-white/50 hover:text-s-white transition-colors"
                                >
                                    Back
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-teal-bright text-navy font-bold hover:bg-white transition-all active:scale-95 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="size-5 animate-spin" /> : (step === 3 ? 'Create Account' : 'Continue')}
                                <ArrowRight className="size-5" />
                            </button>
                        </div>
                    </form>
                </div>

                <div className="text-center mt-8">
                    <p className="text-white/50 text-sm">
                        Already have an account?{' '}
                        <Link
                            href="/landlord/login"
                            className="text-teal-bright font-bold hover:underline"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

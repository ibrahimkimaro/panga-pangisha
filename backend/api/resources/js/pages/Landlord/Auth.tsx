import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, Phone, Lock, ArrowRight,
    ArrowLeft, CheckCircle2, AlertCircle,
    Globe, Eye, EyeOff, Loader2, ChevronRight
} from 'lucide-react';
import { Logo } from '@/components/ui';

type AuthFlow = 'options' | 'register' | 'login' | 'forgot';

export default function LandlordAuth() {
    const [flow, setFlow] = useState<AuthFlow>('options');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        phone: '',
        country: 'TZ',
        password: '',
        role: 'landlord'
    });

    const [loginData, setLoginData] = useState({
        identifier: '',
        password: ''
    });

    const [showPassword, setShowPassword] = useState(false);

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
            if (!response.ok) throw new Error(data.message || 'Registration failed');

            localStorage.setItem('auth_token', data.access);
            router.visit('/landlord/dashboard');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/user/api/token/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone_number: loginData.identifier,
                    password: loginData.password
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Login failed');

            localStorage.setItem('auth_token', data.access);
            router.visit('/landlord/dashboard');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A192F] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-teal-bright/10 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brass/10 blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md z-10"
            >
                <div className="flex justify-center mb-12">
                    <Logo onDark className="text-3xl" />
                </div>

                <AnimatePresence mode="wait">
                    {flow === 'options' && (
                        <motion.div
                            key="options"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-6"
                        >
                            <div className="text-center mb-10">
                                <h1 className="text-4xl font-extrabold tracking-tight mb-3">Welcome Home</h1>
                                <p className="text-white/60">Manage your properties with professional trust.</p>
                            </div >

                            <div className="grid gap-4">
                                <button
                                    onClick={() => setFlow('register')}
                                    className="group flex items-center justify-between p-6 rounded-2xl bg-white/5 ring-1 ring-white/10 hover:bg-white/10 hover:ring-teal/50 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-xl bg-teal/20 text-teal">
                                            <User className="size-6" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-lg">Create Account</p>
                                            <p className="text-sm text-white/50">Start listing your properties</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="size-5 text-white/30 group-hover:text-white transition-colors" />
                                </button>

                                <button
                                    onClick={() => setFlow('login')}
                                    className="group flex items-center justify-between p-6 rounded-2xl bg-white/5 ring-1 ring-white/10 hover:bg-white/10 hover:ring-teal/50 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-xl bg-navy-raised text-white/70">
                                            <Lock className="size-6" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-lg">Sign In</p>
                                            <p className="text-sm text-white/50">Welcome back, Landlord</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="size-5 text-white/30 group-hover:text-white transition-colors" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {flow === 'register' && (
                        <motion.div
                            key="register"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] ring-1 ring-white/10 shadow-2xl"
                        >
                            <button
                                onClick={() => setFlow('options')}
                                className="flex items-center gap-2 text-sm text-white/50 hover:text-white mb-8 transition-colors"
                            >
                                <ArrowLeft className="size-4" /> Back to options
                            </button>

                            <div className="mb-8">
                                <h2 className="text-2xl font-bold mb-2">Account Setup</h2>
                                <p className="text-white/60 text-sm">Step {step} of 3: {step === 1 ? 'Basic Info' : step === 2 ? 'Identity' : 'Security'}</p>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); if(step < 3) setStep(step + 1); else handleRegister(); }} className="space-y-6">
                                {step === 1 && (
                                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
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
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
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
                                    </motion.div>
                                )}

                                {step === 3 && (
                                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
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
                                    </motion.div>
                                )}

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 rounded-xl bg-hibiscus/20 border border-hibiscus/30 text-hibiscus text-xs font-medium flex items-center gap-2"
                                    >
                                        <AlertCircle className="size-4" /> {error}
                                    </motion.div>
                                )}

                                <div className="flex justify-between items-center mt-8">
                                    {step > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => setStep(step - 1)}
                                            className="text-sm font-semibold text-white/50 hover:text-white transition-colors"
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
                            </motion.div>
                        )}


                    {flow === 'login' && (
                        <motion.div
                            key="login"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] ring-1 ring-white/10 shadow-2xl"
                        >
                            <button
                                onClick={() => setFlow('options')}
                                className="flex items-center gap-2 text-sm text-white/50 hover:text-white mb-8 transition-colors"
                            >
                                <ArrowLeft className="size-4" /> Back to options
                            </button>

                            <div className="mb-8">
                                <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
                                <p className="text-white/60 text-sm">Sign in to your property hub.</p>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/70 ml-1">Phone or Email</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-white/30" />
                                        <input
                                            value={loginData.identifier}
                                            onChange={(e) => setLoginData(prev => ({ ...prev, identifier: e.target.value }))}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 ring-1 ring-white/10 focus:ring-teal outline-none transition-all"
                                            placeholder="0712 345 678"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/70 ml-1">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-white/30" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={loginData.password}
                                            onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
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

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 rounded-xl bg-hibiscus/20 border border-hibiscus/30 text-hibiscus text-xs font-medium flex items-center gap-2"
                                    >
                                        <AlertCircle className="size-4" /> {error}
                                    </motion.div>
                                )}

                                <div className="flex justify-between items-center mt-8">
                                    <button
                                        type="button"
                                        onClick={() => setFlow('forgot')}
                                        className="text-sm font-semibold text-white/50 hover:text-white transition-colors"
                                    >
                                        Forgot password?
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex items-center gap-2 px-8 py-3 rounded-xl bg-teal-bright text-navy font-bold hover:bg-white transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="size-5 animate-spin" /> : 'Sign In'}
                                        <ArrowRight className="size-5" />
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {flow === 'forgot' && (
                        <motion.div
                            key="forgot"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] ring-1 ring-white/10 shadow-2xl"
                        >
                            <button
                                onClick={() => setFlow('login')}
                                className="flex items-center gap-2 text-sm text-white/50 hover:text-white mb-8 transition-colors"
                            >
                                <ArrowLeft className="size-4" /> Back to login
                            </button>

                            <div className="mb-8">
                                <h2 className="text-2xl font-bold mb-2">Reset Password</h2>
                                <p className="text-white/60 text-sm">Enter your details to receive a reset code.</p>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/70 ml-1">Phone or Email</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-white/30" />
                                        <input
                                            value={loginData.identifier}
                                            onChange={(e) => setLoginData(prev => ({ ...prev, identifier: e.target.value }))}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 ring-1 ring-white/10 focus:ring-teal outline-none transition-all"
                                            placeholder="0712 345 678"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-teal-bright text-navy font-bold hover:bg-white transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="size-5 animate-spin" /> : 'Send Reset Code'}
                                    <ArrowRight className="size-5" />
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

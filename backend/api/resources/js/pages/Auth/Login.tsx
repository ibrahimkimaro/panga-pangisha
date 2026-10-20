import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lock, Mail, Phone, Eye, EyeOff, Loader2, ArrowRight, ArrowLeft,
    Building2, Home, KeyRound, ShieldCheck, Sparkles, CheckCircle2,
    Wallet, Receipt, Activity, AlertCircle, Check
} from 'lucide-react';
import { Logo } from '@/components/ui';

interface UniversalLoginProps {
    initialRole?: 'landlord' | 'tenant' | 'renter' | 'admin';
}

export default function UniversalLogin({ initialRole = 'landlord' }: UniversalLoginProps) {
    const defaultPortal = (initialRole === 'renter' || initialRole === 'tenant') ? 'tenant' : 'landlord';
    const [selectedPortal, setSelectedPortal] = useState<'landlord' | 'tenant'>(defaultPortal);

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auto-detect input type (phone or email)
    const isEmail = identifier.includes('@');

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
                throw new Error(data.detail || data.message || 'No active account found with the given credentials.');
            }

            const token = data.access || data.tokens?.access;
            if (token) {
                localStorage.setItem('auth_token', token);
            }

            // Clean redirection according to role
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
            setError(err.message || 'Login failed. Please verify your phone/email and password.');
        } finally {
            setLoading(false);
        }
    };

    // One-Click Demo Credentials
    const fillDemoLandlord = () => {
        setSelectedPortal('landlord');
        setIdentifier('ibrahimkimaro01@gmail.com');
        setPassword('password');
        setError(null);
    };

    const fillDemoTenant = () => {
        setSelectedPortal('tenant');
        setIdentifier('+255712000001');
        setPassword('password');
        setError(null);
    };

    return (
        <div className="min-h-screen w-full max-w-full bg-[#070D18] text-white flex flex-col justify-between relative overflow-x-hidden font-sans selection:bg-blue-600 selection:text-white">
            <Head title={selectedPortal === 'landlord' ? "Landlord Sign In • Panga Pangisha" : "Resident Sign In • Panga Pangisha"} />

            {/* Ambient Background Glows */}
            <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-600/15 blur-[140px] pointer-events-none" />
            <div className="absolute top-1/2 -right-32 h-96 w-96 rounded-full bg-emerald-600/15 blur-[140px] pointer-events-none" />
            <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-indigo-600/15 blur-[140px] pointer-events-none" />

            {/* Top Navigation Bar */}
            <header className="relative z-20 w-full max-w-full border-b border-white/10 bg-white/[0.02] backdrop-blur-md">
                <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link href="/" className="inline-flex items-center gap-2 group">
                        <ArrowLeft className="h-4 w-4 text-white/60 group-hover:-translate-x-1 group-hover:text-white transition-all" />
                        <span className="text-xs font-semibold text-white/70 group-hover:text-white transition-colors">
                            Back to Home
                        </span>
                    </Link>

                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold shadow-md">
                            P
                        </div>
                        <span className="text-base font-extrabold tracking-tight text-white">
                            Panga Pangisha
                        </span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/80">
                            <ShieldCheck className="h-3 w-3 text-emerald-400" />
                            Official Portal
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Full-Width Content Container */}
            <main className="relative z-10 w-full max-w-full flex-1 flex items-center py-8 lg:py-12">
                <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
                        
                        {/* LEFT COLUMN: Animated Visual Feature Showcase (Desktop 6/12) */}
                        <div className="hidden lg:flex lg:col-span-6 flex-col space-y-8 pr-4">
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="space-y-4"
                            >
                                <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-300 backdrop-blur-md">
                                    <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                                    <span>Tanzania’s Modern Housing Network</span>
                                </div>
                                <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-[1.2]">
                                    One unified account for{' '}
                                    <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
                                        Landlords, Residents & Properties
                                    </span>
                                </h1>
                                <p className="text-sm text-slate-300 leading-relaxed max-w-lg">
                                    Manage residential units, track M-Pesa automated rent settlements, sign digital rental agreements, and monitor STS prepaid meters in real-time.
                                </p>
                            </motion.div>

                            {/* Floating Animated Cards Stack */}
                            <div className="space-y-4 pt-2">
                                {/* Floating Card 1: Rent Payment */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.6, delay: 0.15 }}
                                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl shadow-xl hover:border-white/20 transition-all"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            <Wallet className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-white">M-Pesa Rent Settlement</span>
                                                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                                                    Verified
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-400 mt-0.5">Automated invoice #INV-2026-042 • Room 2</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-extrabold text-emerald-400">+ TZS 450,000</span>
                                        <span className="block text-[10px] text-slate-400">Instant payout</span>
                                    </div>
                                </motion.div>

                                {/* Floating Card 2: Tenancy Agreement */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.6, delay: 0.25 }}
                                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl shadow-xl hover:border-white/20 transition-all"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                            <Receipt className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-white">Digital Mkataba Signed</span>
                                                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                                                    Dual-Signed
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-400 mt-0.5">Tanzania Law Compliant • Mikocheni Residence</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-bold text-white">12-Month Lease</span>
                                        <span className="block text-[10px] text-slate-400">PDF download ready</span>
                                    </div>
                                </motion.div>

                                {/* Floating Card 3: STS Metering */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.6, delay: 0.35 }}
                                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl shadow-xl hover:border-white/20 transition-all"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                            <Activity className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-white">STS Smart Submeters</span>
                                                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                                                    Telemetry Live
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-400 mt-0.5">Individual unit electricity & water meters</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-bold text-white">Zero Disputes</span>
                                        <span className="block text-[10px] text-slate-400">Automatic tokens</span>
                                    </div>
                                </motion.div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Ultra-Premium Glassmorphism Card (Desktop 6/12, Mobile 12/12) */}
                        <div className="w-full lg:col-span-6 flex justify-center">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-6 sm:p-8 shadow-2xl relative"
                            >
                                {/* Role / Portal Switcher Pills */}
                                <div className="mb-6">
                                    <div className="grid grid-cols-2 rounded-2xl border border-white/10 bg-black/40 p-1.5 backdrop-blur-md">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedPortal('landlord');
                                                setError(null);
                                            }}
                                            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                                                selectedPortal === 'landlord'
                                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                                                    : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            <KeyRound className="h-4 w-4" />
                                            <span>Landlord / Owner</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedPortal('tenant');
                                                setError(null);
                                            }}
                                            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                                                selectedPortal === 'tenant'
                                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                                                    : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            <Home className="h-4 w-4" />
                                            <span>Tenant / Resident</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Form Header */}
                                <div className="mb-6 space-y-1">
                                    <h2 className="text-2xl font-extrabold tracking-tight text-white">
                                        {selectedPortal === 'landlord' ? 'Landlord Suite Sign In' : 'Resident Portal Sign In'}
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        {selectedPortal === 'landlord'
                                            ? 'Enter your credentials to manage properties, leases, and payouts'
                                            : 'Access your rental agreement, smart submeters, and payment receipts'}
                                    </p>
                                </div>

                                {/* Error Notification */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mb-5 overflow-hidden rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-semibold text-red-300 flex items-center gap-2"
                                        >
                                            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                                            <span>{error}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Form */}
                                <form onSubmit={handleLogin} className="space-y-4">
                                    {/* Identifier input */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-xs font-bold text-slate-300">
                                                Phone Number or Email Address
                                            </label>
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                {isEmail ? 'Email format' : 'Phone (+255) / 07...'}
                                            </span>
                                        </div>
                                        <div className="relative">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                                {isEmail ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                value={identifier}
                                                onChange={(e) => setIdentifier(e.target.value)}
                                                placeholder={selectedPortal === 'landlord' ? 'ibrahimkimaro01@gmail.com or 0712...' : '+255712... or tenant@email.com'}
                                                className="w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:bg-black/60 focus:outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Password input */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-xs font-bold text-slate-300">Password</label>
                                            <a
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    alert('Password reset instructions will be sent to your registered phone number or email.');
                                                }}
                                                className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                                            >
                                                Forgot password?
                                            </a>
                                        </div>
                                        <div className="relative">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                                <Lock className="h-4 w-4" />
                                            </div>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••••••"
                                                className="w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:bg-black/60 focus:outline-none transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Remember Me */}
                                    <div className="flex items-center justify-between pt-1">
                                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-300">
                                            <input
                                                type="checkbox"
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                                className="h-4 w-4 rounded border-white/20 bg-black/40 text-blue-600 focus:ring-0"
                                            />
                                            <span>Keep me signed in for 30 days</span>
                                        </label>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:opacity-95 transition-all active:scale-[0.99] disabled:opacity-50"
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            {loading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    <span>Signing in to {selectedPortal === 'landlord' ? 'Landlord Suite' : 'Resident Portal'}...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Sign In to {selectedPortal === 'landlord' ? 'Landlord Suite' : 'Resident Portal'}</span>
                                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </div>
                                    </button>
                                </form>

                                {/* Demo Account Fast Login Pills */}
                                <div className="mt-6 pt-5 border-t border-white/10">
                                    <span className="block text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                                        Quick Demo Access
                                    </span>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={fillDemoLandlord}
                                            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-[11px] font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                                        >
                                            <KeyRound className="h-3.5 w-3.5 text-blue-400" />
                                            <span>Ibrahim (Landlord)</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={fillDemoTenant}
                                            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-[11px] font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                                        >
                                            <Home className="h-3.5 w-3.5 text-emerald-400" />
                                            <span>Asha (Tenant)</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Signup Redirect */}
                                <div className="mt-6 text-center text-xs text-slate-400">
                                    Don't have an account yet?{' '}
                                    <Link
                                        href={selectedPortal === 'landlord' ? '/signup?role=landlord' : '/signup?role=renter'}
                                        className="font-bold text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                                    >
                                        Create an Account
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Footer */}
            <footer className="relative z-20 w-full max-w-full border-t border-white/10 bg-white/[0.02] py-4 text-center text-xs text-slate-500">
                <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p>© {new Date().getFullYear()} Panga Pangisha. All rights reserved.</p>
                    <div className="flex items-center gap-4 text-[11px]">
                        <Link href="/" className="hover:text-slate-300 transition-colors">Home</Link>
                        <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

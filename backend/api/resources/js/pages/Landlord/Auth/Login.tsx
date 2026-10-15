import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Lock, User, Mail, Phone, Eye, EyeOff, Loader2, ArrowRight, ArrowLeft, Globe, Info, AlertCircle } from 'lucide-react';
import { Logo } from '@/components/ui';

export default function LandlordLogin() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [loginData, setLoginData] = useState({ identifier: '', password: '' });

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
            if (!response.ok) throw new Error(data.message || data.detail || 'Login failed');
            if (data.access) localStorage.setItem('auth_token', data.access);
            router.visit('/landlord/dashboard');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A192F] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <Head title="Sign In | Landlord Portal" />
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
                            <div className="p-3 rounded-xl bg-hibiscus/20 border border-hibiscus/30 text-hibiscus text-xs font-medium flex items-center gap-2">
                                <AlertCircle className="size-4" /> {error}
                            </div>
                        )}

                        <div className="flex justify-between items-center mt-8">
                            <button type="button" className="text-sm font-semibold text-white/50 hover:text-white transition-colors">
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
                </div>

                <div className="text-center mt-8">
                    <p className="text-white/50 text-sm">
                        Don't have an account?{' '}
                        <Link
                            href="/landlord/signup"
                            className="text-teal-bright font-bold hover:underline"
                        >
                            Create account
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

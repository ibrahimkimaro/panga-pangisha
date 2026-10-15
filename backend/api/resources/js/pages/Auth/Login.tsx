import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Lock, User, Eye, EyeOff, Loader2, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { Logo } from '@/components/ui';

export default function UniversalLogin({ initialRole }: { initialRole?: string }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [loginData, setLoginData] = useState({ identifier: '', password: '' });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/user/api/token/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone_number: loginData.identifier.trim(),
                    password: loginData.password,
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

            const userRole = data.role || data.user?.role;
            if (userRole === 'landlord' || userRole === 'manager') {
                router.visit('/landlord/dashboard');
            } else if (userRole === 'admin') {
                router.visit('/admin');
            } else {
                router.visit('/tenant/dashboard');
            }
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A192F] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            <Head title="Sign In | Panga Pangisha" />

            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-teal-bright/10 blur-[130px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-brass/10 blur-[130px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-md z-10"
            >
                {/* Header navigation */}
                <div className="flex items-center justify-between mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors group"
                    >
                        <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
                        Back to home
                    </Link>
                    <Link href="/">
                        <Logo onDark className="text-2xl" />
                    </Link>
                </div>

                {/* Form Card */}
                <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] ring-1 ring-white/10 shadow-2xl">
                    <div className="mb-8">
                        <h2 className="text-3xl font-extrabold tracking-tight mb-2">Welcome Back</h2>
                        <p className="text-white/60 text-sm">
                            Sign in to your Panga Pangisha account.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/70 ml-1">
                                Phone Number or Email
                            </label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-white/30" />
                                <input
                                    type="text"
                                    value={loginData.identifier}
                                    onChange={(e) => setLoginData((prev) => ({ ...prev, identifier: e.target.value }))}
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/5 ring-1 ring-white/10 focus:ring-2 focus:ring-teal-bright outline-none text-white placeholder-white/30 transition-all text-sm"
                                    placeholder="0712 345 678 or you@example.com"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-sm font-medium text-white/70">Password</label>
                                <button
                                    type="button"
                                    onClick={() => alert('Password reset code will be sent to your phone or email.')}
                                    className="text-xs text-teal-bright/80 hover:text-teal-bright transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-white/30" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={loginData.password}
                                    onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))}
                                    className="w-full pl-11 pr-11 py-3.5 rounded-xl bg-white/5 ring-1 ring-white/10 focus:ring-2 focus:ring-teal-bright outline-none text-white placeholder-white/30 transition-all text-sm"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                </button>
                            </div>
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
                            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-teal-bright text-navy font-bold text-sm hover:bg-white transition-all shadow-lg shadow-teal-bright/20 active:scale-98 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="size-5 animate-spin" /> : 'Sign In'}
                            {!loading && <ArrowRight className="size-5" />}
                        </button>
                    </form>
                </div>

                {/* Footer Switch */}
                <div className="text-center mt-8">
                    <p className="text-white/50 text-sm">
                        Don't have an account yet?{' '}
                        <Link
                            href="/signup"
                            className="text-teal-bright font-bold hover:underline"
                        >
                            Create an account
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

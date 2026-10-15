import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Home, Search, Calendar, CreditCard, Wrench, MessageSquare,
    Bell, User, LogOut, ChevronRight, CheckCircle2, Clock,
    Sparkles, ShieldCheck, MapPin, ArrowRight
} from 'lucide-react';
import { Logo } from '@/components/ui';

export default function TenantDashboard() {
    const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'maintenance' | 'explore'>('overview');

    const handleSignOut = () => {
        localStorage.removeItem('auth_token');
        router.visit('/');
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col lg:flex-row">
            <Head title="Tenant Portal | Panga Pangisha" />

            {/* Sidebar */}
            <aside className="w-full lg:w-64 bg-white border-r border-slate-200/80 p-6 flex flex-col justify-between shrink-0">
                <div>
                    <div className="mb-8">
                        <Link href="/">
                            <Logo className="text-2xl" />
                        </Link>
                        <span className="inline-block mt-2 text-[11px] font-bold uppercase tracking-wider text-teal bg-teal/10 px-2 py-0.5 rounded-full">
                            Tenant Portal
                        </span>
                    </div>

                    <nav className="space-y-1">
                        {[
                            { id: 'overview', label: 'My Rental', icon: Home },
                            { id: 'payments', label: 'Rent & Payments', icon: CreditCard },
                            { id: 'maintenance', label: 'Repairs & Requests', icon: Wrench },
                            { id: 'explore', label: 'Search More Homes', icon: Search },
                        ].map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id as any)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                        isActive
                                            ? 'bg-teal/10 text-teal'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                >
                                    <Icon className="size-4" />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="pt-6 border-t border-slate-100 space-y-3">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-teal"
                    >
                        <Home className="size-3.5" /> View Public Marketplace
                    </Link>
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 text-xs font-semibold text-red-600 hover:text-red-700 pt-2"
                    >
                        <LogOut className="size-3.5" /> Sign out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-6 lg:p-10 max-w-7xl">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                            Welcome, Tenant 👋
                        </h1>
                        <p className="text-slate-500 text-sm mt-0.5">
                            Manage your tenancy, make rent payments, and request maintenance.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal text-white text-xs font-bold hover:bg-teal/90 shadow-sm transition-all"
                        >
                            <Sparkles className="size-3.5" /> Ask Veyora AI
                        </Link>
                    </div>
                </div>

                {/* Tenancy Overview Cards */}
                <div className="grid gap-6 md:grid-cols-3 mb-8">
                    {/* Current Tenancy */}
                    <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Unit</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1">
                                <CheckCircle2 className="size-3" /> Active
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Kijitonyama Apartment</h3>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                            <MapPin className="size-3.5 text-slate-400" /> Room 2, Kinondoni, Dar es Salaam
                        </p>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-600 font-medium">
                            <span>Monthly Rent</span>
                            <span className="font-bold text-slate-900">TZS 450,000</span>
                        </div>
                    </div>

                    {/* Rent Due */}
                    <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Next Due Date</span>
                            <Clock className="size-4 text-amber-500" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">1st Nov 2026</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Current balance is all settled
                        </p>
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <button className="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all">
                                Pay Rent Ahead
                            </button>
                        </div>
                    </div>

                    {/* Maintenance */}
                    <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Repairs</span>
                            <Wrench className="size-4 text-teal" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">0 Open Tickets</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Need a fix for plumbing, power, or keys?
                        </p>
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <button className="w-full py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all">
                                + Request Maintenance
                            </button>
                        </div>
                    </div>
                </div>

                {/* Veyora AI Tenant Companion */}
                <div className="p-6 bg-gradient-to-r from-[#0F172A] to-[#1E293B] rounded-3xl text-white shadow-xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal/20 text-teal-bright text-xs font-bold mb-3">
                            <Sparkles className="size-3.5" /> Veyora Housing AI
                        </div>
                        <h3 className="text-xl font-bold">Have questions about your rental or rights?</h3>
                        <p className="text-white/60 text-sm mt-1 max-w-xl">
                            Veyora can answer tenancy agreements, rental receipts, utility meter splits, or help you find a new apartment in Dar es Salaam.
                        </p>
                    </div>
                    <Link
                        href="/"
                        className="shrink-0 px-6 py-3 rounded-xl bg-teal-bright text-navy font-bold text-sm hover:bg-white transition-all shadow-lg active:scale-95"
                    >
                        Chat with Veyora AI
                    </Link>
                </div>
            </main>
        </div>
    );
}

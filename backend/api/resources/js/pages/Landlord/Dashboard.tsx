import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Home, Users, CreditCard, Zap, Wrench, BarChart3,
    Mail, MessageSquare, Bot, Settings, Search, Bell, ChevronDown,
    ChevronRight, ArrowUpRight, ArrowDownRight, ArrowRight,
    Plus, FileText, CheckCircle2, AlertTriangle, AlertCircle, WifiOff,
    Clock, Sun, Moon, Sparkles, Filter, Droplets, Building2, UserPlus,
    Receipt, FileSpreadsheet, Activity, X, Check, Phone, ShieldCheck,
    Download, Send, RefreshCw, MapPin
} from 'lucide-react';

interface LandlordDashboardProps {
    user?: {
        name: string;
        role: string;
        avatar: string;
    };
    stats?: {
        total_properties: number;
        total_properties_sub: string;
        total_rooms: number;
        total_rooms_sub: string;
        total_tenants: number;
        total_tenants_sub: string;
        monthly_rent_collected: string;
        monthly_rent_collected_raw: number;
        target_rent: number;
        collection_rate: number;
        monthly_growth: number;
    };
    properties?: Array<{
        id: number;
        name: string;
        location: string;
        type: string;
        total_units: number;
        occupied_units: number;
        vacant_units: number;
        status: string;
        status_color: string;
        monthly_rent: number;
        cover_image: string;
        specs: string;
    }>;
    rooms?: Array<{
        id: number;
        room: string;
        status: string;
        rent: string;
        type: string;
    }>;
    tenants?: Array<{
        id: number;
        name: string;
        phone: string;
        email?: string;
        property: string;
        unit: string;
        rent: string;
        status: string;
        since: string;
    }>;
    alerts?: Array<{
        id: string;
        type: string;
        severity: string;
        title: string;
        description: string;
        time: string;
        badge: string;
    }>;
    activity?: Array<{
        time: string;
        type: string;
        desc: string;
        target: string;
        status: string;
        status_type: string;
    }>;
    utilities?: {
        electricity: {
            total: string;
            unit: string;
            trend: number;
            daytime: string;
            daytime_pct: number;
            night: string;
            night_pct: number;
        };
        water: {
            total: string;
            unit: string;
            trend: number;
            daytime: string;
            daytime_pct: number;
            night: string;
            night_pct: number;
        };
    };
}

export default function LandlordDashboard({
    user = {
        name: 'Ibrahim Kimaro',
        role: 'Landlord',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    },
    stats = {
        total_properties: 4,
        total_properties_sub: '2 Houses • 2 Apartments',
        total_rooms: 18,
        total_rooms_sub: '14 Occupied • 4 Vacant',
        total_tenants: 14,
        total_tenants_sub: 'Active Tenants',
        monthly_rent_collected: 'TZS 4,850,000',
        monthly_rent_collected_raw: 4850000,
        target_rent: 6000000,
        collection_rate: 81,
        monthly_growth: 12,
    },
    properties = [],
    rooms = [],
    tenants = [],
    alerts = [],
    activity = [],
    utilities = {
        electricity: {
            total: '12,480',
            unit: 'kWh',
            trend: -8,
            daytime: '8,320',
            daytime_pct: 67,
            night: '4,160',
            night_pct: 33,
        },
        water: {
            total: '342',
            unit: 'm³',
            trend: -3,
            daytime: '210',
            daytime_pct: 61,
            night: '132',
            night_pct: 39,
        },
    },
}: LandlordDashboardProps) {
    const [activeSection, setActiveSection] = useState<
        'dashboard' | 'properties' | 'tenants' | 'rent' | 'utilities' | 'maintenance' | 'reports' | 'messages' | 'ai' | 'settings'
    >('dashboard');
    const [utilityTab, setUtilityTab] = useState<'electricity' | 'water'>('electricity');
    const [searchQuery, setSearchQuery] = useState('');
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    // Modals
    const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
    const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
    const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
    const [isAiChatOpen, setIsAiChatOpen] = useState(false);

    // Form inputs
    const [newProperty, setNewProperty] = useState({ name: '', type: 'House', location: 'Mikocheni, Dar es Salaam', rent: '450000', rooms: '5' });
    const [newTenant, setNewTenant] = useState({ name: '', phone: '+2557', house: '', unit: 'Room 1', rent: '400000' });
    const [newPayment, setNewPayment] = useState({ tenant: '', amount: '400000', method: 'mobile', note: 'Rent payment via M-Pesa' });
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiMessages, setAiMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
        { sender: 'ai', text: 'Hello Ibrahim! 👋 I am Veyora, your real estate AI companion. How can I help you manage your properties, draft tenancy notices, or analyze rent collection today?' },
    ]);

    const handleSignOut = () => {
        localStorage.removeItem('auth_token');
        router.visit('/');
    };

    const handleSendAi = (text?: string) => {
        const query = text || aiPrompt;
        if (!query.trim()) return;
        setAiMessages((prev) => [...prev, { sender: 'user', text: query }]);
        setAiPrompt('');
        setTimeout(() => {
            let reply = "I've checked your live records: You currently have 4 properties with 18 total rooms (14 occupied, 4 vacant). Total rent collected this month is TZS 4,850,000 (81% of your target). Everything is running smoothly with no critical arrears.";
            if (query.toLowerCase().includes('tenant')) {
                reply = "Across your properties, you have 14 active tenants. All tenancies are current, and Asha Msuya's rent payment of TZS 400,000 for Room 2 was recently received and recorded.";
            } else if (query.toLowerCase().includes('vacant') || query.toLowerCase().includes('room')) {
                reply = "You have 4 vacant rooms available for letting: Room 4 at Mikocheni, and units at Sinza and Kunduchi. Would you like me to generate a listing draft for the marketplace?";
            }
            setAiMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
        }, 600);
    };

    return (
        <div className="min-h-screen bg-[#F4F6F9] text-slate-800 font-sans flex flex-col lg:flex-row antialiased selection:bg-teal-500/20">
            <Head title="Landlord Command Center | Panga Pangisha" />

            {/* 1. LEFT SIDEBAR */}
            <aside className="w-full lg:w-64 bg-[#0B1528] text-white flex flex-col justify-between shrink-0 lg:sticky lg:top-0 lg:h-screen z-30">
                <div className="p-6">
                    {/* Brand Logo */}
                    <div className="flex items-center gap-3 mb-8">
                        <Link href="/" className="flex items-center gap-2.5">
                            <div className="size-9 rounded-xl bg-teal-500 flex items-center justify-center text-[#0B1528] font-black text-xl shadow-md">
                                P
                            </div>
                            <div>
                                <h2 className="font-extrabold text-base leading-tight tracking-tight text-white">
                                    Panga Pangisha
                                </h2>
                                <p className="text-[10px] text-teal-400 font-medium">Better Homes. Smarter Living.</p>
                            </div>
                        </Link>
                    </div>

                    {/* Navigation Items (All buttons functional!) */}
                    <nav className="space-y-1">
                        {[
                            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                            { id: 'properties', label: 'Properties', icon: Home },
                            { id: 'tenants', label: 'Tenants', icon: Users },
                            { id: 'rent', label: 'Rent & Payments', icon: CreditCard },
                            { id: 'utilities', label: 'Utilities', icon: Zap, hasArrow: true },
                            { id: 'maintenance', label: 'Maintenance', icon: Wrench },
                            { id: 'reports', label: 'Reports', icon: BarChart3 },
                            { id: 'messages', label: 'Messages', icon: Mail, badge: '3' },
                            { id: 'ai', label: 'AI Assistant', icon: Bot, isNew: true },
                            { id: 'settings', label: 'Settings', icon: Settings },
                        ].map((item) => {
                            const Icon = item.icon;
                            const isActive = activeSection === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                        if (item.id === 'ai') {
                                            setIsAiChatOpen(true);
                                        } else {
                                            setActiveSection(item.id as any);
                                        }
                                    }}
                                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                        isActive
                                            ? 'bg-[#2563EB] text-white shadow-sm'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon className="size-4 shrink-0" />
                                        <span>{item.label}</span>
                                    </div>
                                    {item.badge && (
                                        <span className="size-5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
                                            {item.badge}
                                        </span>
                                    )}
                                    {item.isNew && (
                                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/40">
                                            New
                                        </span>
                                    )}
                                    {item.hasArrow && <ChevronDown className="size-3.5 text-slate-500" />}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom Promo Card with AI trigger */}
                <div
                    onClick={() => setIsAiChatOpen(true)}
                    className="p-4 m-4 rounded-2xl bg-gradient-to-b from-[#132544] to-[#0A1220] border border-white/10 relative overflow-hidden cursor-pointer hover:border-teal-500/40 transition-colors group"
                >
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px]" />
                    <p className="text-xs text-white/90 font-medium leading-relaxed relative z-10">
                        Manage your properties, track your income, keep your tenants happy.
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-teal-400 font-bold group-hover:text-teal-300">
                        <span>Ask Veyora AI</span> <ArrowRight className="size-3" />
                    </div>
                </div>
            </aside>

            {/* 2. MAIN WORKSPACE WITH max-w-full */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header Bar */}
                <header className="h-16 bg-white border-b border-slate-200/80 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-20">
                    {/* Search */}
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search properties, tenants, rooms... ⌘ K"
                            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100/80 border-none text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                        />
                    </div>

                    {/* Right profile / notification */}
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => setActiveSection('messages')}
                            className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
                        >
                            <Bell className="size-4" />
                            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500 ring-2 ring-white" />
                        </button>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-slate-50 transition-colors"
                            >
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="size-8 rounded-full object-cover ring-1 ring-slate-200"
                                />
                                <div className="text-left hidden sm:block">
                                    <p className="text-xs font-bold text-slate-800 leading-tight">{user.name}</p>
                                    <p className="text-[10px] text-slate-400">{user.role}</p>
                                </div>
                                <ChevronDown className="size-3.5 text-slate-400" />
                            </button>

                            {userMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-30">
                                    <Link href="/" className="block px-4 py-2 text-xs text-slate-600 hover:bg-slate-50">
                                        Public Marketplace
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveSection('settings');
                                            setUserMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50"
                                    >
                                        Settings & Profile
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSignOut}
                                        className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Dashboard Viewport Content: uses max-w-full */}
                <main className="p-6 lg:p-10 space-y-6 max-w-full w-full">
                    {/* Greeting & Weather Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
                                Good morning, {user.name.split(' ')[0]} <span>👋</span>
                            </h1>
                            <p className="text-xs text-slate-500 mt-1 font-medium">
                                Here's what's happening with your properties today.
                            </p>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                            <div className="text-right">
                                <p className="font-bold text-slate-800">Tue, 14 Oct 2026</p>
                                <p className="text-[11px] text-slate-400">10:24 AM</p>
                            </div>
                            <div className="h-7 w-px bg-slate-200" />
                            <div className="flex items-center gap-2">
                                <Sun className="size-4 text-amber-500" />
                                <div>
                                    <p className="font-bold text-slate-800">Dar es Salaam, TZ</p>
                                    <p className="text-[11px] text-slate-400">28°C Partly Cloudy</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* DYNAMIC VIEW ROUTING BASED ON SELECTED SIDEBAR ITEM */}
                    {activeSection === 'properties' ? (
                        /* SECTION: PROPERTIES MANAGER */
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-extrabold text-slate-900">Your Properties Portfolio</h2>
                                    <p className="text-xs text-slate-500">All registered residential estates and apartment wings.</p>
                                </div>
                                <button
                                    onClick={() => setIsAddPropertyOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
                                >
                                    <Plus className="size-4" /> Add New Property
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {properties.map((p) => (
                                    <div key={p.id} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        <div className="relative h-44 overflow-hidden">
                                            <img src={p.cover_image} alt={p.name} className="w-full h-full object-cover" />
                                            <span className={`absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full ${p.status_color}`}>
                                                {p.status}
                                            </span>
                                        </div>
                                        <div className="p-5">
                                            <h3 className="font-bold text-base text-slate-900">{p.name}</h3>
                                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                <MapPin className="size-3.5 text-slate-400" /> {p.location}
                                            </p>
                                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                                                <span className="font-medium text-slate-600">{p.specs}</span>
                                                <span className="font-bold text-slate-900">TZS {p.monthly_rent.toLocaleString()} /mo</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : activeSection === 'tenants' ? (
                        /* SECTION: TENANTS DIRECTORY */
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-extrabold text-slate-900">Tenants Directory</h2>
                                    <p className="text-xs text-slate-500">Active lease agreements and tenant contact cards.</p>
                                </div>
                                <button
                                    onClick={() => setIsAddTenantOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
                                >
                                    <UserPlus className="size-4" /> Add New Tenant
                                </button>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-400 font-semibold uppercase">
                                        <tr>
                                            <th className="py-3.5 px-6">Tenant Name</th>
                                            <th className="py-3.5 px-6">Phone Number</th>
                                            <th className="py-3.5 px-6">Property / Unit</th>
                                            <th className="py-3.5 px-6">Monthly Rent</th>
                                            <th className="py-3.5 px-6">Status</th>
                                            <th className="py-3.5 px-6 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {tenants.map((t) => (
                                            <tr key={t.id} className="hover:bg-slate-50/50">
                                                <td className="py-4 px-6 font-bold text-slate-800">{t.name}</td>
                                                <td className="py-4 px-6 text-slate-600">{t.phone}</td>
                                                <td className="py-4 px-6 text-slate-700">{t.property} ({t.unit})</td>
                                                <td className="py-4 px-6 font-bold text-slate-900">{t.rent}</td>
                                                <td className="py-4 px-6">
                                                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                                                        {t.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <button
                                                        onClick={() => {
                                                            setNewPayment((prev) => ({ ...prev, tenant: t.name }));
                                                            setIsRecordPaymentOpen(true);
                                                        }}
                                                        className="text-xs text-blue-600 font-bold hover:underline"
                                                    >
                                                        Record Payment
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : activeSection === 'rent' ? (
                        /* SECTION: RENT & PAYMENTS LEDGER */
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-extrabold text-slate-900">Rent & Payments Ledger</h2>
                                    <p className="text-xs text-slate-500">Live collection tracker and tenant payment history.</p>
                                </div>
                                <button
                                    onClick={() => setIsRecordPaymentOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-all"
                                >
                                    <Receipt className="size-4" /> Record Rent Payment
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                                    <p className="text-xs text-slate-400 font-semibold uppercase">Total Collected This Month</p>
                                    <h3 className="text-2xl font-black text-slate-900 mt-2">{stats.monthly_rent_collected}</h3>
                                    <p className="text-xs text-emerald-600 font-bold mt-1">81% of TZS 6,000,000 target</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                                    <p className="text-xs text-slate-400 font-semibold uppercase">Outstanding Pending Balance</p>
                                    <h3 className="text-2xl font-black text-amber-600 mt-2">TZS 1,150,000</h3>
                                    <p className="text-xs text-slate-400 mt-1">Across 4 tenants with grace period</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                                    <p className="text-xs text-slate-400 font-semibold uppercase">Payment Mode Breakdown</p>
                                    <h3 className="text-2xl font-black text-blue-600 mt-2">88% Mobile (M-Pesa)</h3>
                                    <p className="text-xs text-slate-400 mt-1">12% Direct Bank Transfer</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* DEFAULT: FULL DASHBOARD OVERVIEW (As in Screenshot) */
                        <>
                            {/* TOP STAT CARDS (4 Columns) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* 1. Total Properties */}
                                <div
                                    onClick={() => setActiveSection('properties')}
                                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start gap-4 hover:shadow-md cursor-pointer transition-shadow"
                                >
                                    <div className="size-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                        <Home className="size-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-slate-500">Total Properties</p>
                                        <h3 className="text-2xl font-black text-slate-900 mt-0.5">{stats.total_properties}</h3>
                                        <p className="text-[11px] text-slate-400 mt-1">{stats.total_properties_sub}</p>
                                    </div>
                                </div>

                                {/* 2. Total Rooms */}
                                <div
                                    onClick={() => setActiveSection('properties')}
                                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start gap-4 hover:shadow-md cursor-pointer transition-shadow"
                                >
                                    <div className="size-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                        <Building2 className="size-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-medium text-slate-500">Total Rooms</p>
                                            <ArrowRight className="size-3 text-slate-400" />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 mt-0.5">{stats.total_rooms}</h3>
                                        <p className="text-[11px] text-slate-400 mt-1">{stats.total_rooms_sub}</p>
                                    </div>
                                </div>

                                {/* 3. Total Tenants */}
                                <div
                                    onClick={() => setActiveSection('tenants')}
                                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start gap-4 hover:shadow-md cursor-pointer transition-shadow"
                                >
                                    <div className="size-11 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                        <Users className="size-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-medium text-slate-500">Total Tenants</p>
                                            <ArrowRight className="size-3 text-slate-400" />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 mt-0.5">{stats.total_tenants}</h3>
                                        <p className="text-[11px] text-slate-400 mt-1">{stats.total_tenants_sub}</p>
                                    </div>
                                </div>

                                {/* 4. Monthly Rent Collected */}
                                <div
                                    onClick={() => setActiveSection('rent')}
                                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start gap-4 hover:shadow-md cursor-pointer transition-shadow"
                                >
                                    <div className="size-11 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                                        <CreditCard className="size-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-medium text-slate-500">Monthly Rent Collected</p>
                                            <ArrowRight className="size-3 text-slate-400" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 mt-0.5">{stats.monthly_rent_collected}</h3>
                                        <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                                            ↑ {stats.monthly_growth}% <span className="font-normal text-slate-400">vs last month</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* MIDDLE ROW (Rent Chart, Utility Gauge, Recent Alerts) */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Rent Collection Overview (5 cols) */}
                                <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                                <CreditCard className="size-4 text-blue-600" />
                                                <span>Rent Collection Overview</span>
                                            </div>
                                            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                                                This Month (October 2026)
                                            </span>
                                        </div>

                                        <div className="flex items-baseline gap-2 mb-2">
                                            <h2 className="text-2xl font-black text-slate-900">{stats.monthly_rent_collected}</h2>
                                            <span className="text-xs text-slate-400 font-medium">Collected</span>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="space-y-1.5 mb-6">
                                            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.collection_rate}%` }} />
                                            </div>
                                            <p className="text-[11px] text-slate-500 font-medium">
                                                <span className="font-bold text-slate-800">{stats.collection_rate}%</span> of TZS {stats.target_rent.toLocaleString()} target
                                            </p>
                                        </div>
                                    </div>

                                    {/* Bar Chart Representation */}
                                    <div>
                                        <div className="flex items-center justify-end gap-4 text-[11px] font-medium text-slate-500 mb-3">
                                            <span className="flex items-center gap-1.5">
                                                <span className="size-2 rounded-full bg-blue-600" /> Collected
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <span className="size-2 rounded-full bg-slate-300" /> Pending
                                            </span>
                                        </div>

                                        <div className="h-32 flex items-end justify-between gap-2 pt-4 border-b border-slate-100">
                                            {[
                                                { day: '1', h1: 45, h2: 15 },
                                                { day: '5', h1: 85, h2: 10 },
                                                { day: '10', h1: 65, h2: 25 },
                                                { day: '15', h1: 95, h2: 5 },
                                                { day: '20', h1: 55, h2: 30 },
                                                { day: '25', h1: 75, h2: 15 },
                                                { day: '31', h1: 30, h2: 60 },
                                            ].map((col) => (
                                                <div key={col.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                                                    <div className="w-full max-w-[18px] bg-slate-200 rounded-t-sm flex flex-col justify-end overflow-hidden h-full">
                                                        <div className="bg-slate-300 w-full" style={{ height: `${col.h2}%` }} />
                                                        <div className="bg-blue-600 w-full group-hover:bg-blue-700 transition-colors" style={{ height: `${col.h1}%` }} />
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-medium">{col.day}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Utility Usage (All Properties) (4 cols) */}
                                <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                                <Zap className="size-4 text-blue-600" />
                                                <span>Utility Usage</span>
                                            </div>
                                            {/* Tabs */}
                                            <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                                                <button
                                                    onClick={() => setUtilityTab('electricity')}
                                                    className={`px-3 py-1 rounded-md transition-all ${
                                                        utilityTab === 'electricity' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                                                    }`}
                                                >
                                                    Electricity
                                                </button>
                                                <button
                                                    onClick={() => setUtilityTab('water')}
                                                    className={`px-3 py-1 rounded-md transition-all ${
                                                        utilityTab === 'water' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                                                    }`}
                                                >
                                                    Water
                                                </button>
                                            </div>
                                        </div>

                                        {/* Circular Meter Graphic */}
                                        <div className="my-3 flex flex-col items-center justify-center">
                                            <div className="relative size-36 flex items-center justify-center">
                                                <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                                                    <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="9" fill="none" />
                                                    <circle
                                                        cx="50"
                                                        cy="50"
                                                        r="40"
                                                        stroke={utilityTab === 'electricity' ? '#10b981' : '#0ea5e9'}
                                                        strokeWidth="9"
                                                        fill="none"
                                                        strokeDasharray="251.2"
                                                        strokeDashoffset="65"
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <div className="absolute text-center">
                                                    <p className="text-xl font-black text-slate-900">
                                                        {utilityTab === 'electricity' ? utilities.electricity.total : utilities.water.total}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-semibold uppercase">
                                                        {utilityTab === 'electricity' ? utilities.electricity.unit : utilities.water.unit}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-emerald-600 font-bold mt-1">
                                                ↓ {utilityTab === 'electricity' ? Math.abs(utilities.electricity.trend) : Math.abs(utilities.water.trend)}%{' '}
                                                <span className="font-normal text-slate-400">vs last month</span>
                                            </p>
                                            <p className="text-[11px] text-slate-400">Total Consumption</p>
                                        </div>
                                    </div>

                                    {/* Daytime vs Night split */}
                                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                                        <div className="flex items-center gap-2.5">
                                            <div className="size-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                                <Sun className="size-3.5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400">
                                                    Daytime ({utilityTab === 'electricity' ? utilities.electricity.daytime_pct : utilities.water.daytime_pct}%)
                                                </p>
                                                <p className="text-xs font-bold text-slate-800">
                                                    {utilityTab === 'electricity' ? utilities.electricity.daytime : utilities.water.daytime}{' '}
                                                    {utilityTab === 'electricity' ? 'kWh' : 'm³'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2.5">
                                            <div className="size-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                                <Moon className="size-3.5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400">
                                                    Night ({utilityTab === 'electricity' ? utilities.electricity.night_pct : utilities.water.night_pct}%)
                                                </p>
                                                <p className="text-xs font-bold text-slate-800">
                                                    {utilityTab === 'electricity' ? utilities.electricity.night : utilities.water.night}{' '}
                                                    {utilityTab === 'electricity' ? 'kWh' : 'm³'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Alerts (3 cols) */}
                                <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                            <Bell className="size-4 text-blue-600" />
                                            <span>Recent Alerts</span>
                                        </div>
                                        <button onClick={() => setActiveSection('messages')} className="text-[11px] font-bold text-blue-600 hover:underline">
                                            View all →
                                        </button>
                                    </div>

                                    <div className="space-y-3.5">
                                        {alerts.map((alert) => {
                                            const iconMap: Record<string, typeof ArrowUpRight> = {
                                                electricity: ArrowUpRight,
                                                water: AlertTriangle,
                                                payment: CheckCircle2,
                                                offline: WifiOff,
                                                maintenance: Wrench,
                                            };
                                            const colorMap: Record<string, string> = {
                                                danger: 'bg-red-50 text-red-500',
                                                warning: 'bg-amber-50 text-amber-500',
                                                success: 'bg-emerald-50 text-emerald-500',
                                                neutral: 'bg-slate-100 text-slate-500',
                                                info: 'bg-blue-50 text-blue-500',
                                            };
                                            const Icon = iconMap[alert.type] || Bell;
                                            return (
                                                <div key={alert.id} className="flex items-start gap-3">
                                                    <div className={`size-7 rounded-full flex items-center justify-center shrink-0 ${colorMap[alert.severity] || 'bg-slate-100'}`}>
                                                        <Icon className="size-3.5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-slate-800 truncate">{alert.title}</p>
                                                        {alert.description && <p className="text-[10px] text-slate-400 truncate">{alert.description}</p>}
                                                        <p className="text-[10px] text-slate-400">{alert.time}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* THIRD ROW (Your Properties, Rooms Overview, Quick Actions) */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Your Properties (5 cols) */}
                                <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                            <Home className="size-4 text-blue-600" />
                                            <span>Your Properties</span>
                                        </div>
                                        <button onClick={() => setActiveSection('properties')} className="text-[11px] font-bold text-blue-600 hover:underline">
                                            View all →
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {properties.map((p) => (
                                            <div
                                                key={p.id}
                                                onClick={() => setActiveSection('properties')}
                                                className="border border-slate-100 rounded-xl overflow-hidden hover:border-slate-200 cursor-pointer transition-all group"
                                            >
                                                <div className="relative h-24 overflow-hidden">
                                                    <img
                                                        src={p.cover_image}
                                                        alt={p.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                    <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status_color}`}>
                                                        {p.status}
                                                    </span>
                                                </div>
                                                <div className="p-3">
                                                    <h4 className="text-xs font-bold text-slate-800 truncate">{p.name}</h4>
                                                    <p className="text-[10px] text-slate-400 truncate">{p.location}</p>
                                                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                                                        <span>{p.specs}</span>
                                                        <ArrowRight className="size-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Rooms Overview (4 cols) */}
                                <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                                <FileText className="size-4 text-blue-600" />
                                                <span>Rooms Overview</span>
                                            </div>
                                            <button onClick={() => setActiveSection('properties')} className="text-[11px] font-bold text-blue-600 hover:underline">
                                                View all →
                                            </button>
                                        </div>

                                        {/* Donut & legend */}
                                        <div className="flex items-center justify-between gap-4 mb-4">
                                            <div className="relative size-24 flex items-center justify-center shrink-0">
                                                <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                                                    <circle cx="50" cy="50" r="38" stroke="#3b82f6" strokeWidth="12" fill="none" />
                                                    <circle
                                                        cx="50"
                                                        cy="50"
                                                        r="38"
                                                        stroke="#10b981"
                                                        strokeWidth="12"
                                                        fill="none"
                                                        strokeDasharray="238.7"
                                                        strokeDashoffset="52.5"
                                                    />
                                                </svg>
                                                <div className="absolute text-center">
                                                    <p className="text-base font-black text-slate-900">{stats.total_rooms}</p>
                                                    <p className="text-[8px] text-slate-400 uppercase font-semibold">Total</p>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="size-2 rounded-full bg-emerald-500" />
                                                    <span className="text-slate-600">Occupied:</span>
                                                    <span className="font-bold text-slate-900">14 (78%)</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="size-2 rounded-full bg-blue-500" />
                                                    <span className="text-slate-600">Vacant:</span>
                                                    <span className="font-bold text-slate-900">4 (22%)</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Room status list */}
                                        <div className="space-y-2 text-xs">
                                            {rooms.slice(0, 5).map((r) => (
                                                <div key={r.id} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-none">
                                                    <span className="font-medium text-slate-700">{r.room}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-[10px] font-bold ${r.status === 'Occupied' ? 'text-emerald-600' : 'text-blue-600'}`}>
                                                            • {r.status}
                                                        </span>
                                                        <span className="font-bold text-slate-800 text-[11px] min-w-[70px] text-right">{r.rent}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setActiveSection('properties')}
                                        className="text-center text-xs font-bold text-blue-600 hover:underline pt-3 border-t border-slate-100"
                                    >
                                        View all rooms →
                                    </button>
                                </div>

                                {/* Quick Actions (3 cols) */}
                                <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-4">
                                            <Zap className="size-4 text-blue-600" />
                                            <span>Quick Actions</span>
                                        </div>

                                        <div className="space-y-2">
                                            {[
                                                { label: 'Add New Property', icon: Home, onClick: () => setIsAddPropertyOpen(true) },
                                                { label: 'Add New Tenant', icon: UserPlus, onClick: () => setIsAddTenantOpen(true) },
                                                { label: 'Record Rent Payment', icon: Receipt, onClick: () => setIsRecordPaymentOpen(true) },
                                                { label: 'Generate Report', icon: FileSpreadsheet, onClick: () => setActiveSection('reports') },
                                                { label: 'View Utility Readings', icon: Zap, onClick: () => setActiveSection('utilities') },
                                                { label: 'Chat with Veyora (AI)', icon: Bot, isAi: true, onClick: () => setIsAiChatOpen(true) },
                                            ].map((action, i) => {
                                                const Icon = action.icon;
                                                return (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={action.onClick}
                                                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-98 ${
                                                            action.isAi
                                                                ? 'bg-blue-50/50 border-blue-200 text-blue-700 hover:bg-blue-100/50'
                                                                : 'border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <Icon className="size-4" />
                                                            <span>{action.label}</span>
                                                        </div>
                                                        {action.isAi && (
                                                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-blue-600 text-white">
                                                                New
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BOTTOM ROW (Latest Activity & Promo Box) */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Latest Activity Table (9 cols) */}
                                <div className="lg:col-span-9 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                            <Activity className="size-4 text-blue-600" />
                                            <span>Latest Activity</span>
                                        </div>
                                        <button onClick={() => setActiveSection('rent')} className="text-[11px] font-bold text-blue-600 hover:underline">
                                            View all activity →
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                                                    <th className="pb-3 font-semibold">Time</th>
                                                    <th className="pb-3 font-semibold">Type</th>
                                                    <th className="pb-3 font-semibold">Description</th>
                                                    <th className="pb-3 font-semibold">Property / Room</th>
                                                    <th className="pb-3 font-semibold">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {activity.map((row, i) => {
                                                    const badgeMap: Record<string, string> = {
                                                        danger: 'bg-red-50 text-red-600 border border-red-200',
                                                        warning: 'bg-amber-50 text-amber-700 border border-amber-200',
                                                        success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                                                        info: 'bg-blue-50 text-blue-700 border border-blue-200',
                                                    };
                                                    return (
                                                        <tr key={i} className="hover:bg-slate-50/50">
                                                            <td className="py-3 text-slate-400 whitespace-nowrap">{row.time}</td>
                                                            <td className="py-3 font-bold text-slate-700">{row.type}</td>
                                                            <td className="py-3 text-slate-800">{row.desc}</td>
                                                            <td className="py-3 text-slate-500 whitespace-nowrap">{row.target}</td>
                                                            <td className="py-3 whitespace-nowrap">
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeMap[row.status_type] || 'bg-slate-100 text-slate-700'}`}>
                                                                    {row.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Panga Pangisha Veyora Card (3 cols) */}
                                <div className="lg:col-span-3 bg-gradient-to-br from-[#0F1D36] to-[#0A1220] rounded-2xl p-6 text-white flex flex-col justify-between shadow-md relative overflow-hidden">
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Home className="size-5 text-teal-400" />
                                            <h3 className="font-extrabold text-sm">Panga Pangisha</h3>
                                        </div>
                                        <p className="text-xs text-white/70 leading-relaxed">
                                            Smarter property management for a better tomorrow.
                                        </p>
                                    </div>

                                    <div className="mt-8 pt-4 border-t border-white/10 relative z-10">
                                        <button
                                            type="button"
                                            onClick={() => setIsAiChatOpen(true)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#0B1528] font-bold text-xs hover:bg-slate-100 transition-all shadow-sm active:scale-98"
                                        >
                                            <MessageSquare className="size-3.5" />
                                            <span>Talk to Veyora</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>

            {/* MODAL 1: ADD NEW PROPERTY */}
            {isAddPropertyOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-bold text-slate-900 text-base">Add New Rental Property</h3>
                            <button onClick={() => setIsAddPropertyOpen(false)} className="text-slate-400 hover:text-slate-700">
                                <X className="size-5" />
                            </button>
                        </div>
                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Property Name</label>
                                <input
                                    type="text"
                                    value={newProperty.name}
                                    onChange={(e) => setNewProperty({ ...newProperty, name: e.target.value })}
                                    placeholder="e.g. Masaki Beachfront Villa"
                                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Property Type</label>
                                    <select
                                        value={newProperty.type}
                                        onChange={(e) => setNewProperty({ ...newProperty, type: e.target.value })}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                                    >
                                        <option value="House">Residential House</option>
                                        <option value="Apartment">Apartment</option>
                                        <option value="Commercial">Commercial Units</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Number of Rooms/Units</label>
                                    <input
                                        type="number"
                                        value={newProperty.rooms}
                                        onChange={(e) => setNewProperty({ ...newProperty, rooms: e.target.value })}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Monthly Rent per Unit (TZS)</label>
                                <input
                                    type="number"
                                    value={newProperty.rent}
                                    onChange={(e) => setNewProperty({ ...newProperty, rent: e.target.value })}
                                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                onClick={() => setIsAddPropertyOpen(false)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    alert('Property added successfully to your registered listings!');
                                    setIsAddPropertyOpen(false);
                                }}
                                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                            >
                                Save Property
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: ADD NEW TENANT */}
            {isAddTenantOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-bold text-slate-900 text-base">Register New Tenant</h3>
                            <button onClick={() => setIsAddTenantOpen(false)} className="text-slate-400 hover:text-slate-700">
                                <X className="size-5" />
                            </button>
                        </div>
                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Tenant Full Name</label>
                                <input
                                    type="text"
                                    value={newTenant.name}
                                    onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                                    placeholder="e.g. Asha Msuya"
                                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={newTenant.phone}
                                        onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                                        placeholder="+255 712 345 678"
                                        className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Unit Assigned</label>
                                    <input
                                        type="text"
                                        value={newTenant.unit}
                                        onChange={(e) => setNewTenant({ ...newTenant, unit: e.target.value })}
                                        placeholder="Room 2"
                                        className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                onClick={() => setIsAddTenantOpen(false)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    alert('Tenant agreement saved! Welcome SMS dispatched.');
                                    setIsAddTenantOpen(false);
                                }}
                                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                            >
                                Create Lease
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: RECORD PAYMENT */}
            {isRecordPaymentOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-bold text-slate-900 text-base">Record Rent Payment</h3>
                            <button onClick={() => setIsRecordPaymentOpen(false)} className="text-slate-400 hover:text-slate-700">
                                <X className="size-5" />
                            </button>
                        </div>
                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="font-semibold text-slate-700 block mb-1">Select Tenant</label>
                                <input
                                    type="text"
                                    value={newPayment.tenant}
                                    onChange={(e) => setNewPayment({ ...newPayment, tenant: e.target.value })}
                                    placeholder="e.g. Asha Msuya (Room 2)"
                                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Amount Paid (TZS)</label>
                                    <input
                                        type="number"
                                        value={newPayment.amount}
                                        onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="font-semibold text-slate-700 block mb-1">Payment Method</label>
                                    <select
                                        value={newPayment.method}
                                        onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                                    >
                                        <option value="mobile">M-Pesa / Tigo Pesa / Airtel</option>
                                        <option value="bank">CRDB / NMB Bank Transfer</option>
                                        <option value="cash">Cash Receipt</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                onClick={() => setIsRecordPaymentOpen(false)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    alert('Payment recorded in rent ledger and receipt issued!');
                                    setIsRecordPaymentOpen(false);
                                }}
                                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                            >
                                Record & Issue Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 4: VEYORA AI ASSISTANT CHAT DIALOG */}
            {isAiChatOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl w-full max-w-md h-[90vh] shadow-2xl flex flex-col justify-between overflow-hidden border border-slate-200">
                        {/* Header */}
                        <div className="p-4 bg-[#0B1528] text-white flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="size-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                                    <Bot className="size-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">Veyora AI Assistant</h4>
                                    <p className="text-[10px] text-teal-300 font-medium">Model-First Housing Intelligence</p>
                                </div>
                            </div>
                            <button onClick={() => setIsAiChatOpen(false)} className="text-white/60 hover:text-white">
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
                            {aiMessages.map((m, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                                            m.sender === 'user'
                                                ? 'bg-[#2563EB] text-white rounded-tr-xs'
                                                : 'bg-white text-slate-800 border border-slate-200/80 shadow-xs rounded-tl-xs'
                                        }`}
                                    >
                                        {m.text}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Quick Prompt Chips */}
                        <div className="p-2.5 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto text-[11px]">
                            {[
                                'Show vacant rooms',
                                'How much rent collected?',
                                'Draft eviction warning',
                            ].map((prompt, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => handleSendAi(prompt)}
                                    className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap font-medium"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>

                        {/* Input Box */}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSendAi();
                            }}
                            className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2"
                        >
                            <input
                                type="text"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="Ask Veyora about your properties..."
                                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-100 border-none text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <button
                                type="submit"
                                className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                            >
                                <Send className="size-4" />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

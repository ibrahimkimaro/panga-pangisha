import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Building2, Users, FileText, Receipt,
    Calendar, Settings, Sparkles, Plus, Search, Bell,
    ChevronDown, ChevronLeft, ChevronRight, Menu, LogOut, CheckCircle2, ShieldCheck, MapPin,
    CreditCard, ArrowRight, X, Phone, Save, Home, Zap,
    TrendingUp, ArrowUpRight, DollarSign, CalendarCheck, MessageSquare, BarChart3, Wallet, HelpCircle,
    Heart, Trash2, ExternalLink
} from 'lucide-react';

import OverviewView from './components/OverviewView';
import PropertiesView from './components/PropertiesView';
import TenantsView from './components/TenantsView';
import SettingsView from './components/SettingsView';
import InvoicesView from './components/InvoicesView';
import RentalAgreementsView from './components/RentalAgreementsView';
import OccupancyView from './components/OccupancyView';
import RentPaymentsView from './components/RentPaymentsView';
import VeyoraAssistantModal from './components/VeyoraAssistantModal';

interface LandlordDashboardProps {
    user?: {
        id?: number;
        name: string;
        email?: string;
        phone?: string;
        country?: string;
        role: string;
        bio?: string;
        location?: string;
        avatar: string;
        identity_status?: string;
        business_name?: string;
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
    inquiries?: Array<{
        id: number;
        guest_name: string;
        guest_phone: string;
        house_name: string;
        house_id: number;
        preferred_at: string;
        note: string;
        status: string;
        created_at: string;
    }>;
}

export default function LandlordDashboard({
    user = {
        id: 18,
        name: 'Ibrahim Kimaro',
        email: 'ibrahimkimaro01@gmail.com',
        phone: '+255712345678',
        role: 'Landlord',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
        business_name: 'Kimaro Real Estate Holdings',
        location: 'Dar es Salaam, Tanzania',
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
    inquiries = [],
}: LandlordDashboardProps) {
    const [activeSection, setActiveSection] = useState<
        'dashboard' | 'properties' | 'bookings' | 'occupancy' | 'tenants' | 'finances' | 'invoices' | 'agreements' | 'rent-payments' | 'messages' | 'reports' | 'utilities' | 'settings'
    >('dashboard');

    // Language state: 'en' is the default per user request. Can be switched to 'sw' (Kiswahili).
    const [lang, setLang] = useState<'en' | 'sw'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('preferred_language') as 'en' | 'sw') || 'en';
        }
        return 'en';
    });

    const handleLanguageChange = (newLang: 'en' | 'sw') => {
        setLang(newLang);
        if (typeof window !== 'undefined') {
            localStorage.setItem('preferred_language', newLang);
        }
    };

    const [prefilledUnitForAgreement, setPrefilledUnitForAgreement] = useState<any>(null);
    const [prefilledUnitForInvoice, setPrefilledUnitForInvoice] = useState<any>(null);

    const [currentUser, setCurrentUser] = useState(user);
    useEffect(() => {
        if (user) setCurrentUser(user);
    }, [user]);

    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false);
    const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
    const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);
    const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
    const [favoriteSearch, setFavoriteSearch] = useState('');
    const [favorites, setFavorites] = useState<any[]>([
        {
            id: 1,
            title: 'Mikocheni Executive Villa & Apartments',
            type: 'Apartment',
            region: 'Dar es Salaam',
            district: 'Kinondoni',
            ward: 'Mikocheni',
            location: 'Mikocheni B, Kinondoni, Dar es Salaam',
            price_per_month: 650000,
            bedrooms: 2,
            bathrooms: 2,
            cover_image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
            status: 'Available',
            rating: 4.9,
            landlord_name: 'Ibrahim Kimaro',
        },
        {
            id: 2,
            title: 'Masaki Oceanview Penthouse',
            type: 'Penthouse',
            region: 'Dar es Salaam',
            district: 'Kinondoni',
            ward: 'Masaki',
            location: 'Masaki, Kinondoni, Dar es Salaam',
            price_per_month: 1200000,
            bedrooms: 3,
            bathrooms: 3,
            cover_image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
            status: 'Available',
            rating: 5.0,
            landlord_name: 'Veyora Premier',
        },
        {
            id: 3,
            title: 'Kijitonyama Modern Flat',
            type: 'Flat',
            region: 'Dar es Salaam',
            district: 'Kinondoni',
            ward: 'Kijitonyama',
            location: 'Kijitonyama, Dar es Salaam',
            price_per_month: 450000,
            bedrooms: 1,
            bathrooms: 1,
            cover_image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
            status: 'Occupied',
            rating: 4.8,
            landlord_name: 'Kimaro Properties',
        },
    ]);

    useEffect(() => {
        fetch('/api/favorites', {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'include',
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (Array.isArray(data) && data.length > 0) {
                    setFavorites(data);
                }
            })
            .catch(() => {});
    }, []);

    const handleRemoveFavorite = (id: number) => {
        fetch(`/api/houses/${id}/favorite`, {
            method: 'POST',
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'include',
        }).catch(() => {});
        setFavorites((prev) => prev.filter((f) => f.id !== id));
    };

    // Form inputs for quick modals
    const [newPropertyForm, setNewPropertyForm] = useState({
        name: '',
        type: 'House',
        location: 'Mikocheni, Dar es Salaam',
        units: '6',
        rent: '450000',
    });

    const [newPaymentForm, setNewPaymentForm] = useState({
        tenant: tenants[0]?.name || 'Asha Msuya',
        amount: '400000',
        method: 'mpesa',
        note: 'Monthly rent payment',
    });

    const [newTenantForm, setNewTenantForm] = useState({
        name: '',
        phone: '+2557',
        property: properties[0]?.name || 'Mikocheni Residence',
        unit: 'Room 1',
        rent: '400000',
    });

    const handleSignOut = async () => {
        try {
            await fetch('/logout', { method: 'POST' });
        } catch {}
        localStorage.removeItem('auth_token');
        router.visit('/');
    };

    // Organized Menu and Submenus into clear, professional categories
    const navigationGroups = [
        {
            title: lang === 'en' ? 'Overview' : 'Muhtasari',
            items: [
                { id: 'dashboard', label: lang === 'en' ? 'Dashboard' : 'Dashibodi', icon: LayoutDashboard },
            ],
        },
        {
            title: lang === 'en' ? 'Tenancy & Operations' : 'Usimamizi wa Upangaji',
            items: [
                { id: 'occupancy', label: lang === 'en' ? 'Room Occupancy' : 'Ukaaji wa Vyumba', count: rooms.length || stats.total_rooms || 18, icon: Building2 },
                { id: 'agreements', label: lang === 'en' ? 'Lease Agreements' : 'Mikataba ya Upangaji', icon: FileText },
                { id: 'invoices', label: lang === 'en' ? 'Invoices & Billing' : 'Ankara na Bili', icon: Receipt },
                { id: 'rent-payments', label: lang === 'en' ? 'Rent Payments' : 'Malipo ya Kodi', icon: Wallet },
            ],
        },
        {
            title: lang === 'en' ? 'Portfolio & Residents' : 'Mali na Wapangaji',
            items: [
                { id: 'properties', label: lang === 'en' ? 'Properties' : 'Nyumba Zangu', count: properties.length || 4, icon: Home },
                { id: 'tenants', label: lang === 'en' ? 'Tenants' : 'Wapangaji', count: tenants.length || 14, icon: Users },
            ],
        },
        {
            title: lang === 'en' ? 'Preferences' : 'Mipangilio',
            items: [
                { id: 'settings', label: lang === 'en' ? 'Settings' : 'Mipangilio', icon: Settings },
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-[#FBF9F5] text-[#12161A] font-sans antialiased selection:bg-[#12161A] selection:text-white">
            <Head title="Host Command Suite • Panga Pangisha" />

            {/* MOBILE BACKDROP OVERLAY */}
            <AnimatePresence>
                {isMobileSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* COLLAPSIBLE SIDEBAR */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex flex-col justify-between border-r border-slate-200/90 bg-white transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-64'
                    } ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                    }`}
            >
                {/* 1. Sidebar Top Header */}
                <div className="flex h-18 items-center justify-between border-b border-slate-100 px-4">
                    <Link href="/" className="flex items-center gap-3 overflow-hidden group">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white font-extrabold text-lg shadow-sm group-hover:scale-105 transition-transform">
                            P
                        </div>
                        {!isSidebarCollapsed && (
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-bold tracking-tight text-slate-900 leading-tight truncate">
                                    Panga Pangisha
                                </span>
                                <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-400 truncate">
                                    Host Command
                                </span>
                            </div>
                        )}
                    </Link>

                    {/* Open / Close Toggle Button */}
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="hidden md:flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all cursor-pointer shadow-2xs"
                        title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {isSidebarCollapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <ChevronLeft className="h-4 w-4" />
                        )}
                    </button>

                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className="flex md:hidden h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* 2. Navigation Items Grouped by Submenus */}
                <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
                    {navigationGroups.map((group, gIdx) => (
                        <div key={gIdx} className="space-y-1">
                            {!isSidebarCollapsed && (
                                <div className="px-3 pt-1 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                    {group.title}
                                </div>
                            )}
                            {group.items.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeSection === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            setActiveSection(tab.id as any);
                                            setIsMobileSidebarOpen(false);
                                        }}
                                        title={isSidebarCollapsed ? tab.label : undefined}
                                        className={`w-full flex items-center rounded-xl transition-all cursor-pointer group ${isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2.5'
                                            } ${isActive
                                                ? 'bg-slate-900 text-white font-bold shadow-xs'
                                                : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                                            }`}
                                    >
                                        <Icon
                                            className={`shrink-0 ${isSidebarCollapsed ? 'h-5 w-5' : 'h-4.5 w-4.5'
                                                } ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'}`}
                                        />
                                        {!isSidebarCollapsed && (
                                            <>
                                                <span className="text-xs font-semibold truncate flex-1 text-left">
                                                    {tab.label}
                                                </span>
                                                {tab.count !== undefined && (
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isActive
                                                            ? 'bg-white/20 text-white'
                                                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                                                            }`}
                                                    >
                                                        {tab.count}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* 3. Host Profile & Support Widget at Bottom */}
                <div className="border-t border-slate-100 p-3 space-y-3">
                    {!isSidebarCollapsed ? (
                        <>
                            {/* Support Help Card */}
                            <div className="p-3.5 rounded-2xl bg-[#FBF9F5] border border-[#EBE7E1] space-y-2">
                                <div className="flex items-center gap-2 text-xs font-bold text-[#12161A]">
                                    <div className="h-6 w-6 rounded-lg bg-stone-200/60 flex items-center justify-center text-[#12161A]">
                                        <HelpCircle className="h-3.5 w-3.5" />
                                    </div>
                                    <span>Need help?</span>
                                </div>
                                <p className="text-[11px] text-[#706861] leading-relaxed">
                                    Our support team is here for you 24/7.
                                </p>
                                <button
                                    onClick={() => setIsAiModalOpen(true)}
                                    className="text-[11px] font-bold text-[#12161A] hover:underline inline-flex items-center gap-1 cursor-pointer"
                                >
                                    <span>Contact Support</span>
                                    <ArrowRight className="h-3 w-3" />
                                </button>
                            </div>

                            {/* User Profile Pill */}
                            <div className="flex items-center justify-between gap-2 rounded-2xl bg-[#FBF9F5] p-2.5 border border-[#EBE7E1]">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <img
                                        src={currentUser.avatar}
                                        alt={currentUser.name}
                                        className="h-9 w-9 shrink-0 rounded-full object-cover border border-slate-200"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-[#12161A] truncate">
                                            {currentUser.name}
                                        </p>
                                        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                                            <ShieldCheck className="h-3 w-3" />
                                            Verified Landlord
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    className="h-7 w-7 shrink-0 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Sign Out"
                                >
                                    <LogOut className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            {/* Brand Tagline */}
                            <div className="pt-1 px-1 flex items-center justify-between text-[10px] text-[#706861]">
                                <span>Panga Pangisha</span>
                                <span className="text-[9px] text-stone-400">Build Better Communities</span>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <img
                                src={currentUser.avatar}
                                alt={currentUser.name}
                                className="h-9 w-9 rounded-full object-cover border border-slate-200"
                                title={currentUser.name}
                            />
                            <button
                                onClick={handleSignOut}
                                className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Sign Out"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* MAIN APP CONTENT WRAPPER */}
            <div
                className={`min-h-screen flex flex-col transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'
                    }`}
            >
                {/* EXECUTIVE TOP BAR (CLEAN, REFINED, RESPONSIVE) */}
                <header className="sticky top-0 z-30 flex h-16 sm:h-18 items-center justify-between border-b border-[#EBE7E1] bg-white px-3 sm:px-8">
                    {/* Left: Mobile hamburger & clean search bar */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            onClick={() => setIsMobileSidebarOpen(true)}
                            className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl border border-stone-200 text-[#12161A] hover:bg-stone-50 cursor-pointer shrink-0"
                            aria-label="Open Navigation Menu"
                        >
                            <Menu className="h-4 w-4" />
                        </button>

                        <div className="hidden sm:flex items-center w-64 md:w-80 lg:w-96">
                            <div className="relative w-full">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                                <input
                                    type="text"
                                    placeholder={lang === 'sw' ? 'Tafuta nyumba, wapangaji, bili...' : 'Search properties, bookings, guests...'}
                                    className="w-full rounded-full border border-[#EBE7E1] bg-[#FBF9F5] pl-9 pr-12 py-2 text-xs text-[#12161A] placeholder:text-stone-400 focus:outline-none focus:border-[#12161A] transition-colors"
                                />
                                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-white px-1.5 py-0.5 text-[10px] font-bold text-stone-400 border border-stone-200 shadow-2xs">
                                    ⌘K
                                </kbd>
                            </div>
                        </div>
                    </div>

                    {/* Right: Language Switcher, Favorite Button, Notification Bell, User Profile, + Add Property */}
                    <div className="flex items-center gap-1.5 sm:gap-3">
                        {/* Language Switcher Toggle (English default / Kiswahili option) */}
                        <div className="flex items-center rounded-full border border-[#EBE7E1] bg-[#FBF9F5] p-0.5 text-xs">
                            <button
                                onClick={() => handleLanguageChange('en')}
                                className={`px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs transition-all cursor-pointer ${
                                    lang === 'en'
                                        ? 'bg-slate-900 text-white font-bold shadow-2xs'
                                        : 'text-stone-500 hover:text-stone-900 font-medium'
                                }`}
                                title="Switch language to English"
                            >
                                <span className="sm:hidden">EN</span>
                                <span className="hidden sm:inline">English</span>
                            </button>
                            <button
                                onClick={() => handleLanguageChange('sw')}
                                className={`px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs transition-all cursor-pointer ${
                                    lang === 'sw'
                                        ? 'bg-slate-900 text-white font-bold shadow-2xs'
                                        : 'text-stone-500 hover:text-stone-900 font-medium'
                                }`}
                                title="Badili lugha kwenda Kiswahili"
                            >
                                <span className="sm:hidden">SW</span>
                                <span className="hidden sm:inline">Kiswahili</span>
                            </button>
                        </div>

                        {/* Favorite Properties Button */}
                        <button
                            onClick={() => setIsFavoritesModalOpen(true)}
                            className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-[#EBE7E1] flex items-center justify-center text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                            title={lang === 'sw' ? 'Nyumba Pendwa' : 'Favorite Properties'}
                            aria-label="Favorites"
                        >
                            <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-rose-500 text-rose-500" />
                            {favorites.length > 0 && (
                                <span className="absolute -top-1 -right-1 h-3.5 sm:h-4 min-w-3.5 sm:min-w-4 px-1 rounded-full bg-rose-500 text-white text-[8px] sm:text-[9px] font-bold flex items-center justify-center shadow-xs">
                                    {favorites.length}
                                </span>
                            )}
                        </button>

                        {/* Notification Bell */}
                        <button
                            className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-[#EBE7E1] flex items-center justify-center text-stone-600 hover:text-[#12161A] hover:bg-stone-50 transition-colors cursor-pointer shrink-0"
                            title="Notifications"
                            aria-label="Notifications"
                        >
                            <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-2 w-2 rounded-full bg-[#12161A]" />
                        </button>

                        {/* Host User Menu Dropdown */}
                        <div className="relative shrink-0">
                            <button
                                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                className="flex items-center gap-2 rounded-full border border-[#EBE7E1] p-1 sm:p-1.5 sm:pr-3 hover:border-stone-400 transition-all cursor-pointer bg-[#FBF9F5]"
                                aria-label="User Profile"
                            >
                                <img
                                    src={currentUser.avatar}
                                    alt={currentUser.name}
                                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover"
                                />
                                <div className="hidden md:block text-left">
                                    <p className="text-xs font-bold text-[#12161A] leading-tight truncate max-w-[120px]">{currentUser.name}</p>
                                    <p className="text-[10px] text-[#706861] leading-tight">{lang === 'sw' ? 'Mwenye Nyumba' : 'Property Owner'}</p>
                                </div>
                                <ChevronDown className="h-3.5 w-3.5 text-stone-400 mr-0.5 hidden sm:block" />
                            </button>

                            <AnimatePresence>
                                {userDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 4 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 4 }}
                                        className="absolute right-0 mt-2 w-60 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl z-50 text-xs"
                                    >
                                        <div className="p-2.5 border-b border-stone-100">
                                            <p className="font-bold text-[#12161A]">{currentUser.name}</p>
                                            <p className="text-[11px] text-[#706861] truncate">{currentUser.email}</p>
                                            <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                                                <ShieldCheck className="h-3 w-3" />
                                                <span>{lang === 'sw' ? 'Mwenye Nyumba Aliyethibitishwa' : 'Verified Landlord'}</span>
                                            </div>
                                        </div>

                                        <div className="py-1">
                                            <button
                                                onClick={() => {
                                                    setActiveSection('settings');
                                                    setUserDropdownOpen(false);
                                                }}
                                                className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-stone-700 hover:bg-stone-50 font-medium cursor-pointer"
                                            >
                                                <Settings className="h-4 w-4 text-stone-400" />
                                                <span>{lang === 'sw' ? 'Akaunti na Malipo' : 'Account & Payouts'}</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setActiveSection('properties');
                                                    setUserDropdownOpen(false);
                                                }}
                                                className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-stone-700 hover:bg-stone-50 font-medium cursor-pointer"
                                            >
                                                <Building2 className="h-4 w-4 text-stone-400" />
                                                <span>{lang === 'sw' ? 'Nyumba Zinazosimamiwa' : 'Managed Properties'}</span>
                                            </button>
                                        </div>

                                        <div className="border-t border-stone-100 pt-1">
                                            <button
                                                onClick={handleSignOut}
                                                className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-rose-600 hover:bg-rose-50 font-semibold cursor-pointer"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                <span>{lang === 'sw' ? 'Toka kwenye Akaunti' : 'Sign Out'}</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Primary Action Button: + Add Property (Icon only on mobile, text on tablet/desktop) */}
                        <button
                            onClick={() => setIsAddPropertyModalOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#12161A] p-2 sm:px-4 sm:py-2.5 text-xs font-bold text-white shadow-xs hover:bg-stone-800 transition-all active:scale-95 cursor-pointer shrink-0"
                            title={lang === 'sw' ? 'Ongeza Nyumba' : 'Add Property'}
                        >
                            <Plus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                            <span className="hidden sm:inline">{lang === 'sw' ? 'Ongeza Nyumba' : 'Add Property'}</span>
                        </button>
                    </div>
                </header>

                {/* 3. MAIN DASHBOARD CONTENT */}
                <main className="w-full max-w-full px-4 sm:px-8 lg:px-10 py-6 sm:py-8 flex-1">
                    {activeSection === 'dashboard' && (
                        <OverviewView
                            lang={lang}
                            user={currentUser}
                            stats={stats}
                            properties={properties}
                            tenants={tenants}
                            activity={activity}
                            alerts={alerts}
                            inquiries={inquiries}
                            onNavigate={(sec) => setActiveSection(sec)}
                            onOpenAddProperty={() => setIsAddPropertyModalOpen(true)}
                            onOpenRecordPayment={() => setIsRecordPaymentModalOpen(true)}
                            onOpenAi={() => setIsAiModalOpen(true)}
                        />
                    )}

                    {activeSection === 'properties' && (
                        <PropertiesView
                            properties={properties}
                            onOpenAddProperty={() => setIsAddPropertyModalOpen(true)}
                            onNavigateAgreements={() => setActiveSection('agreements')}
                        />
                    )}

                    {(activeSection === 'bookings' || activeSection === 'occupancy') && (
                        <OccupancyView
                            lang={lang}
                            onPrepareAgreement={(unit) => {
                                setPrefilledUnitForAgreement(unit);
                                setActiveSection('agreements');
                            }}
                            onGenerateInvoice={(unit) => {
                                setPrefilledUnitForInvoice(unit);
                                setActiveSection('invoices');
                            }}
                        />
                    )}

                    {activeSection === 'tenants' && (
                        <TenantsView
                            tenants={tenants}
                            onOpenAddTenant={() => setIsAddTenantModalOpen(true)}
                            onNavigateInvoices={() => setActiveSection('invoices')}
                            onNavigateAgreements={() => setActiveSection('agreements')}
                        />
                    )}

                    {(activeSection === 'finances' || activeSection === 'invoices' || activeSection === 'reports' || activeSection === 'utilities') && (
                        <InvoicesView
                            lang={lang}
                            properties={properties}
                            prefilledUnit={prefilledUnitForInvoice}
                            onClearPrefill={() => setPrefilledUnitForInvoice(null)}
                        />
                    )}

                    {activeSection === 'agreements' && (
                        <RentalAgreementsView
                            lang={lang}
                            properties={properties}
                            prefilledUnit={prefilledUnitForAgreement}
                            onClearPrefill={() => setPrefilledUnitForAgreement(null)}
                            onSwitchToInvoices={() => setActiveSection('invoices')}
                        />
                    )}

                    {activeSection === 'rent-payments' && (
                        <RentPaymentsView
                            lang={lang}
                            properties={properties}
                        />
                    )}

                    {activeSection === 'messages' && (
                        <div className="rounded-3xl border border-[#EBE7E1] bg-white p-8 text-center space-y-4">
                            <div className="h-12 w-12 rounded-2xl bg-[#F4F1EA] text-[#12161A] flex items-center justify-center mx-auto border border-[#EBE7E1]">
                                <MessageSquare className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-[#12161A]">Guest & Resident Messages</h3>
                            <p className="text-xs text-[#706861] max-w-md mx-auto">
                                Real-time direct conversations with your booked guests, verified tenants, and property inquiries.
                            </p>
                        </div>
                    )}

                    {activeSection === 'settings' && (
                        <SettingsView
                            user={currentUser}
                            onUserUpdated={(u) => setCurrentUser(u)}
                        />
                    )}
                </main>
            </div>

            {/* AI Assistant Modal */}
            <VeyoraAssistantModal
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                landlordName={currentUser.name.split(' ')[0]}
            />

            {/* Quick Add Property Modal */}
            <AnimatePresence>
                {isAddPropertyModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl p-6 space-y-4"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Add New Property to Portfolio</h3>
                                    <p className="text-xs text-slate-500">Register a new residential compound or building</p>
                                </div>
                                <button
                                    onClick={() => setIsAddPropertyModalOpen(false)}
                                    className="rounded-full p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    setIsAddPropertyModalOpen(false);
                                    alert('Property listed successfully!');
                                }}
                                className="space-y-3 text-xs"
                            >
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Property Name / Headline</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="E.g. Mikocheni Modern Townhouses"
                                        value={newPropertyForm.name}
                                        onChange={(e) => setNewPropertyForm({ ...newPropertyForm, name: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:border-slate-900 focus:outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">Property Type</label>
                                        <select
                                            value={newPropertyForm.type}
                                            onChange={(e) => setNewPropertyForm({ ...newPropertyForm, type: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none"
                                        >
                                            <option value="House">Gated House</option>
                                            <option value="Apartment">Apartment Complex</option>
                                            <option value="Townhouse">Townhouse</option>
                                            <option value="Commercial">Commercial / Mixed</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">Total Units / Rooms</label>
                                        <input
                                            type="number"
                                            value={newPropertyForm.units}
                                            onChange={(e) => setNewPropertyForm({ ...newPropertyForm, units: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Location (Ward, District)</label>
                                    <input
                                        type="text"
                                        value={newPropertyForm.location}
                                        onChange={(e) => setNewPropertyForm({ ...newPropertyForm, location: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Standard Monthly Rent (TZS)</label>
                                    <input
                                        type="number"
                                        value={newPropertyForm.rent}
                                        onChange={(e) => setNewPropertyForm({ ...newPropertyForm, rent: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none"
                                    />
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddPropertyModalOpen(false)}
                                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
                                    >
                                        Publish Property
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Quick Record Payment Modal */}
            <AnimatePresence>
                {isRecordPaymentModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl p-6 space-y-4"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Record Rent Collection</h3>
                                    <p className="text-xs text-slate-500">Log incoming offline or mobile money rent payment</p>
                                </div>
                                <button
                                    onClick={() => setIsRecordPaymentModalOpen(false)}
                                    className="rounded-full p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    setIsRecordPaymentModalOpen(false);
                                    alert(`Payment of TZS ${Number(newPaymentForm.amount).toLocaleString()} recorded successfully.`);
                                }}
                                className="space-y-3 text-xs"
                            >
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Select Tenant</label>
                                    <select
                                        value={newPaymentForm.tenant}
                                        onChange={(e) => setNewPaymentForm({ ...newPaymentForm, tenant: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none"
                                    >
                                        {tenants.map((t) => (
                                            <option key={t.id} value={t.name}>
                                                {t.name} ({t.property} - {t.unit})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Amount Paid (TZS)</label>
                                    <input
                                        type="number"
                                        required
                                        value={newPaymentForm.amount}
                                        onChange={(e) => setNewPaymentForm({ ...newPaymentForm, amount: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                                    <select
                                        value={newPaymentForm.method}
                                        onChange={(e) => setNewPaymentForm({ ...newPaymentForm, method: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none"
                                    >
                                        <option value="mpesa">M-Pesa (Vodacom)</option>
                                        <option value="airtel">Airtel Money</option>
                                        <option value="tigo">Tigo Pesa</option>
                                        <option value="bank">CRDB / NMB Bank Transfer</option>
                                        <option value="cash">Cash Receipt</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Reference / Note</label>
                                    <input
                                        type="text"
                                        value={newPaymentForm.note}
                                        onChange={(e) => setNewPaymentForm({ ...newPaymentForm, note: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none"
                                    />
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsRecordPaymentModalOpen(false)}
                                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
                                    >
                                        Confirm & Issue Receipt
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Quick Add Tenant Modal */}
            <AnimatePresence>
                {isAddTenantModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl p-6 space-y-4"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Add New Resident</h3>
                                    <p className="text-xs text-slate-500">Register resident and link to unit</p>
                                </div>
                                <button
                                    onClick={() => setIsAddTenantModalOpen(false)}
                                    className="rounded-full p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    setIsAddTenantModalOpen(false);
                                    alert(`Resident ${newTenantForm.name} assigned to ${newTenantForm.unit}!`);
                                }}
                                className="space-y-3 text-xs"
                            >
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Resident Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="E.g. Baraka Juma"
                                        value={newTenantForm.name}
                                        onChange={(e) => setNewTenantForm({ ...newTenantForm, name: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        required
                                        value={newTenantForm.phone}
                                        onChange={(e) => setNewTenantForm({ ...newTenantForm, phone: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none font-mono"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">Property</label>
                                        <select
                                            value={newTenantForm.property}
                                            onChange={(e) => setNewTenantForm({ ...newTenantForm, property: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none"
                                        >
                                            {properties.map((p) => (
                                                <option key={p.id} value={p.name}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">Unit / Room</label>
                                        <input
                                            type="text"
                                            value={newTenantForm.unit}
                                            onChange={(e) => setNewTenantForm({ ...newTenantForm, unit: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddTenantModalOpen(false)}
                                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
                                    >
                                        Save Resident
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* FAVORITE PROPERTIES DETAILS MODAL */}
                {isFavoritesModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-2xs">
                                        <Heart className="h-5 w-5 fill-rose-500" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-extrabold text-base text-slate-900">
                                                {lang === 'sw' ? 'Nyumba Pendwa Zilizohifadhiwa' : 'Saved & Favorite Properties'}
                                            </h3>
                                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
                                                {favorites.length} {lang === 'sw' ? 'Nyumba' : 'Properties'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {lang === 'sw'
                                                ? 'Orodha ya nyumba ulizozihifadhi kwa ulinganishi wa bei za pango na uwekezaji.'
                                                : 'Properties bookmarked for market rate tracking, investment watchlists, and quick access.'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsFavoritesModalOpen(false)}
                                    className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white transition-colors cursor-pointer"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Search Filter Inside Favorites */}
                            {favorites.length > 0 && (
                                <div className="p-4 border-b border-slate-100 bg-white">
                                    <div className="relative">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                        <input
                                            type="text"
                                            value={favoriteSearch}
                                            onChange={(e) => setFavoriteSearch(e.target.value)}
                                            placeholder={lang === 'sw' ? 'Tafuta kwa jina la nyumba au eneo...' : 'Filter favorites by title or location...'}
                                            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Favorites List Body */}
                            <div className="p-6 overflow-y-auto space-y-4 flex-1">
                                {(() => {
                                    const filtered = favorites.filter((f) => {
                                        if (!favoriteSearch.trim()) return true;
                                        const q = favoriteSearch.toLowerCase();
                                        return (
                                            f.title?.toLowerCase().includes(q) ||
                                            f.location?.toLowerCase().includes(q) ||
                                            f.region?.toLowerCase().includes(q) ||
                                            f.district?.toLowerCase().includes(q) ||
                                            f.type?.toLowerCase().includes(q)
                                        );
                                    });

                                    if (filtered.length === 0) {
                                        return (
                                            <div className="py-16 text-center space-y-3">
                                                <div className="h-16 w-16 mx-auto rounded-full bg-rose-50 flex items-center justify-center text-rose-400">
                                                    <Heart className="h-8 w-8" />
                                                </div>
                                                <h4 className="font-bold text-slate-800 text-sm">
                                                    {favoriteSearch
                                                        ? (lang === 'sw' ? 'Hakuna nyumba iliyolingana na utafutaji wako.' : 'No saved properties match your search.')
                                                        : (lang === 'sw' ? 'Bado Hujahifadhi Nyumba Pendwa' : 'No Favorite Properties Yet')}
                                                </h4>
                                                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                                    {lang === 'sw'
                                                        ? 'Gusa alama ya moyo kwenye nyumba yoyote ili kuiweka hapa kwa kumbukumbu ya haraka.'
                                                        : 'Click the heart icon on any property to save it here for market rate comparison and quick reference.'}
                                                </p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {filtered.map((fav) => {
                                                const rentAmount = fav.price_per_month || fav.price || fav.monthly_rent || 0;
                                                const img = fav.cover_image || fav.house_profile_image || (fav.photos && fav.photos[0]) || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80';
                                                const loc = fav.location || [fav.ward, fav.district, fav.region].filter(Boolean).join(', ') || 'Dar es Salaam, Tanzania';

                                                return (
                                                    <div
                                                        key={fav.id}
                                                        className="group rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col"
                                                    >
                                                        {/* Property Image + Tags */}
                                                        <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                                                            <img
                                                                src={img}
                                                                alt={fav.title}
                                                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                            />
                                                            <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-900/80 backdrop-blur-xs text-white">
                                                                {fav.type || 'Property'}
                                                            </div>
                                                            <button
                                                                onClick={() => handleRemoveFavorite(fav.id)}
                                                                title={lang === 'sw' ? 'Ondoa kwenye pendwa' : 'Remove from favorites'}
                                                                className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-rose-500 hover:text-rose-600 hover:bg-white shadow-xs transition-colors cursor-pointer"
                                                            >
                                                                <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
                                                            </button>
                                                            <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-xl bg-slate-900/85 backdrop-blur-xs text-white font-black text-xs">
                                                                TZS {Number(rentAmount).toLocaleString()} <span className="font-normal text-[10px] text-slate-300">/ mo</span>
                                                            </div>
                                                        </div>

                                                        {/* Details */}
                                                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                                            <div>
                                                                <h4 className="font-extrabold text-xs text-slate-900 line-clamp-1">
                                                                    {fav.title || fav.property_name || 'Prime Rental House'}
                                                                </h4>
                                                                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                                                                    <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                                                                    <span className="truncate">{loc}</span>
                                                                </div>
                                                            </div>

                                                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                                                <span className="text-slate-500 font-medium">
                                                                    {fav.bedrooms ?? 2} {lang === 'sw' ? 'Vyumba' : 'Beds'} • {fav.bathrooms ?? 1} {lang === 'sw' ? 'Bafu' : 'Baths'}
                                                                </span>
                                                                <a
                                                                    href={`/property/${fav.id}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                                                                >
                                                                    <span>{lang === 'sw' ? 'Tazama' : 'View'}</span>
                                                                    <ExternalLink className="h-3 w-3" />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                                <span className="text-slate-500">
                                    {lang === 'sw' ? 'Panga na Kupangisha • Usimamizi Halisi' : 'Panga na Kupangisha • Verified Properties'}
                                </span>
                                <button
                                    onClick={() => setIsFavoritesModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer"
                                >
                                    {lang === 'sw' ? 'Funga' : 'Close'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

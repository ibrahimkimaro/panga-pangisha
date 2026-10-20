import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Building2, Users, FileText, Receipt,
    Calendar, Settings, Sparkles, Plus, Search, Bell,
    ChevronDown, ChevronLeft, ChevronRight, Menu, LogOut, CheckCircle2, ShieldCheck, MapPin,
    CreditCard, ArrowRight, X, Phone, Save, Home, Zap,
    TrendingUp, ArrowUpRight, DollarSign
} from 'lucide-react';

import OverviewView from './components/OverviewView';
import PropertiesView from './components/PropertiesView';
import TenantsView from './components/TenantsView';
import SettingsView from './components/SettingsView';
import InvoicesView from './components/InvoicesView';
import RentalAgreementsView from './components/RentalAgreementsView';
import OccupancyView from './components/OccupancyView';
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
}: LandlordDashboardProps) {
    const [activeSection, setActiveSection] = useState<
        'dashboard' | 'properties' | 'invoices' | 'agreements' | 'occupancy' | 'tenants' | 'settings'
    >('dashboard');

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

    const navTabs = [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'properties', label: 'Properties & Units', count: properties.length, icon: Building2 },
        { id: 'invoices', label: 'Billing & STS Meters', count: 3, icon: Receipt },
        { id: 'agreements', label: 'Lease Agreements', icon: FileText },
        { id: 'occupancy', label: 'Units & Occupancy', icon: Calendar },
        { id: 'tenants', label: 'Residents Directory', count: tenants.length, icon: Users },
        { id: 'settings', label: 'Settings & Payouts', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased selection:bg-slate-900 selection:text-white">
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
                className={`fixed inset-y-0 left-0 z-50 flex flex-col justify-between border-r border-slate-200/90 bg-white transition-all duration-300 ease-in-out ${
                    isSidebarCollapsed ? 'w-20' : 'w-64'
                } ${
                    isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
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

                {/* 2. Navigation Items */}
                <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                    {!isSidebarCollapsed && (
                        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Management Suite
                        </div>
                    )}
                    {navTabs.map((tab) => {
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
                                className={`w-full flex items-center rounded-xl transition-all cursor-pointer group ${
                                    isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-2.5'
                                } ${
                                    isActive
                                        ? 'bg-slate-900 text-white font-bold shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                                }`}
                            >
                                <Icon
                                    className={`shrink-0 ${
                                        isSidebarCollapsed ? 'h-5 w-5' : 'h-4.5 w-4.5'
                                    } ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'}`}
                                />
                                {!isSidebarCollapsed && (
                                    <>
                                        <span className="text-xs font-medium truncate flex-1 text-left">
                                            {tab.label}
                                        </span>
                                        {tab.count !== undefined && (
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                    isActive
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

                {/* 3. Host Profile Widget at Bottom */}
                <div className="border-t border-slate-100 p-3">
                    {isSidebarCollapsed ? (
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
                    ) : (
                        <div className="flex items-center justify-between gap-2 rounded-2xl bg-slate-50 p-2.5 border border-slate-200/70">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                    src={currentUser.avatar}
                                    alt={currentUser.name}
                                    className="h-9 w-9 shrink-0 rounded-full object-cover border border-slate-200"
                                />
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-900 truncate">
                                        {currentUser.name}
                                    </p>
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                                        <ShieldCheck className="h-3 w-3" />
                                        Verified Landlord
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="h-7 w-7 shrink-0 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-100/60 transition-colors cursor-pointer"
                                title="Sign Out"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* MAIN APP CONTENT WRAPPER */}
            <div
                className={`min-h-screen flex flex-col transition-all duration-300 ease-in-out ${
                    isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'
                }`}
            >
                {/* EXECUTIVE TOP BAR */}
                <header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 sm:px-8 backdrop-blur-md">
                    {/* Left: Mobile hamburger & search pill */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsMobileSidebarOpen(true)}
                            className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                            <Menu className="h-4 w-4" />
                        </button>

                        <div className="hidden sm:flex items-center">
                            <button
                                onClick={() => setIsAiModalOpen(true)}
                                className="inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50/80 hover:bg-slate-100/80 px-4 py-2 text-xs text-slate-500 shadow-2xs transition-all hover:border-slate-300 cursor-pointer"
                            >
                                <Search className="h-3.5 w-3.5 text-slate-400" />
                                <span>Search properties, residents, or meters...</span>
                                <kbd className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400 border border-slate-200 shadow-2xs">
                                    ⌘K
                                </kbd>
                            </button>
                        </div>
                    </div>

                    {/* Right: Actions & User Menu */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            Live Portfolio
                        </span>

                        <button
                            onClick={() => setIsAddPropertyModalOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Add Listing</span>
                        </button>

                        <button
                            onClick={() => setIsAiModalOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-all cursor-pointer"
                        >
                            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                            <span className="hidden sm:inline">AI Copilot</span>
                        </button>

                        {/* Host User Menu Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                className="flex items-center gap-2 rounded-full border border-slate-200 p-1 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer"
                            >
                                <img
                                    src={currentUser.avatar}
                                    alt={currentUser.name}
                                    className="h-8 w-8 rounded-full object-cover"
                                />
                                <ChevronDown className="h-3.5 w-3.5 text-slate-400 mr-1 hidden sm:block" />
                            </button>

                            <AnimatePresence>
                                {userDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 4 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 4 }}
                                        className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50 text-xs"
                                    >
                                        <div className="p-2.5 border-b border-slate-100">
                                            <p className="font-bold text-slate-900">{currentUser.name}</p>
                                            <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                                            <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                                                <ShieldCheck className="h-3 w-3" />
                                                Verified Landlord
                                            </div>
                                        </div>

                                        <div className="py-1">
                                            <button
                                                onClick={() => {
                                                    setActiveSection('settings');
                                                    setUserDropdownOpen(false);
                                                }}
                                                className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                                            >
                                                <Settings className="h-4 w-4 text-slate-400" />
                                                Account & Payouts
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setActiveSection('properties');
                                                    setUserDropdownOpen(false);
                                                }}
                                                className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                                            >
                                                <Building2 className="h-4 w-4 text-slate-400" />
                                                Managed Properties
                                            </button>
                                        </div>

                                        <div className="border-t border-slate-100 pt-1">
                                            <button
                                                onClick={handleSignOut}
                                                className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-rose-600 hover:bg-rose-50 font-semibold"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                Sign Out
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                {/* 3. MAIN DASHBOARD CONTENT */}
                <main className="w-full max-w-full px-4 sm:px-8 lg:px-10 py-6 sm:py-8 flex-1">
                {activeSection === 'dashboard' && (
                    <OverviewView
                        user={currentUser}
                        stats={stats}
                        properties={properties}
                        tenants={tenants}
                        activity={activity}
                        alerts={alerts}
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

                {activeSection === 'invoices' && (
                    <InvoicesView />
                )}

                {activeSection === 'agreements' && (
                    <RentalAgreementsView />
                )}

                {activeSection === 'occupancy' && (
                    <OccupancyView />
                )}

                {activeSection === 'tenants' && (
                    <TenantsView
                        tenants={tenants}
                        onOpenAddTenant={() => setIsAddTenantModalOpen(true)}
                        onNavigateInvoices={() => setActiveSection('invoices')}
                        onNavigateAgreements={() => setActiveSection('agreements')}
                    />
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
                                    alert('Property listed successfully! 🏠');
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
                                    alert(`Payment of TZS ${Number(newPaymentForm.amount).toLocaleString()} recorded successfully! 💰`);
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
            </AnimatePresence>
        </div>
    );
}

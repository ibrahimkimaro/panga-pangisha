import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Building2, Users, FileText, Receipt,
    Calendar, Settings, Sparkles, Plus, Search, Bell,
    ChevronDown, LogOut, CheckCircle2, ShieldCheck, MapPin,
    CreditCard, ArrowRight, X, Phone, Save, Home
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
        { id: 'properties', label: 'Properties', count: properties.length, icon: Building2 },
        { id: 'invoices', label: 'Invoices & Cashflow', icon: Receipt },
        { id: 'agreements', label: 'Rental Agreements', icon: FileText },
        { id: 'occupancy', label: 'Occupancy & Units', icon: Calendar },
        { id: 'tenants', label: 'Residents Directory', count: tenants.length, icon: Users },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-[#FAF8F5] text-[#12161A] font-sans antialiased selection:bg-[#12161A] selection:text-white">
            <Head title="Landlord Suite • Panga Pangisha" />

            {/* 1. Main Navigation Bar (Luxury Editorial Host Suite) */}
            <header className="sticky top-0 z-40 border-b border-[#EFECE6] bg-[#FAF8F5]/90 backdrop-blur-md">
                <div className="w-full max-w-full flex h-18 items-center justify-between px-4 sm:px-8 lg:px-12">
                    {/* Brand Logo & Host Pill */}
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#12161A] text-white font-serif text-xl font-bold shadow-sm group-hover:scale-105 transition-transform">
                                P
                            </div>
                            <div className="flex flex-col">
                                <span className="font-serif text-base font-bold tracking-tight text-[#12161A]">
                                    Panga Pangisha
                                </span>
                                <span className="text-[10px] tracking-widest uppercase font-semibold text-[#8C827A] -mt-1">
                                    Host Command Suite
                                </span>
                            </div>
                        </Link>
                        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1 text-[11px] font-bold text-stone-700 shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Verified Portfolio
                        </span>
                    </div>

                    {/* Quick Search & AI Pill (Floorspace / Linear precision) */}
                    <div className="hidden md:flex items-center">
                        <button
                            onClick={() => setIsAiModalOpen(true)}
                            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white hover:bg-stone-50 px-4 py-2 text-xs text-stone-500 shadow-2xs transition-all hover:border-stone-400"
                        >
                            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                            <span>Ask Veyora AI or Search Portfolio...</span>
                            <kbd className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold text-stone-400 border border-stone-200 shadow-2xs">
                                ⌘K
                            </kbd>
                        </button>
                    </div>

                    {/* Top Right Controls */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            onClick={() => setIsAddPropertyModalOpen(true)}
                            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#12161A] px-4 py-2 text-xs uppercase tracking-wider font-bold text-white shadow-sm hover:bg-[#2A323D] transition-all active:scale-95"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add Listing
                        </button>

                        <button
                            onClick={() => setIsAiModalOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs uppercase tracking-wider font-bold text-amber-800 hover:bg-amber-100 transition-all"
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">AI Copilot</span>
                        </button>

                        {/* Host User Menu Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                className="flex items-center gap-2 rounded-full border border-stone-200 p-1 hover:border-stone-300 hover:shadow-xs transition-all"
                            >
                                <img
                                    src={currentUser.avatar}
                                    alt={currentUser.name}
                                    className="h-8 w-8 rounded-full object-cover"
                                />
                                <ChevronDown className="h-3.5 w-3.5 text-stone-400 mr-1 hidden sm:block" />
                            </button>

                            <AnimatePresence>
                                {userDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 4 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 4 }}
                                        className="absolute right-0 mt-2 w-56 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl z-50 text-xs"
                                    >
                                        <div className="p-2 border-b border-stone-100">
                                            <p className="font-bold text-stone-900">{currentUser.name}</p>
                                            <p className="text-[11px] text-stone-500 truncate">{currentUser.email}</p>
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
                                                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-stone-700 hover:bg-stone-50 font-semibold"
                                            >
                                                <Settings className="h-4 w-4 text-stone-400" />
                                                Host Settings & Payouts
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setActiveSection('properties');
                                                    setUserDropdownOpen(false);
                                                }}
                                                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-stone-700 hover:bg-stone-50 font-semibold"
                                            >
                                                <Building2 className="h-4 w-4 text-stone-400" />
                                                Properties Portfolio
                                            </button>
                                        </div>

                                        <div className="border-t border-stone-100 pt-1">
                                            <button
                                                onClick={handleSignOut}
                                                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-red-600 hover:bg-red-50 font-semibold"
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
                </div>

                {/* 2. Subheader Navigation Tabs (Airbnb style category pills) */}
                <div className="border-t border-[#EFECE6] bg-[#FAF8F5]">
                    <div className="w-full max-w-full px-4 sm:px-8 lg:px-12">
                        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-2.5">
                            {navTabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeSection === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveSection(tab.id as any)}
                                        className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                                            isActive
                                                ? 'bg-[#12161A] text-white shadow-xs'
                                                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                                        }`}
                                    >
                                        <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                                        <span>{tab.label}</span>
                                        {tab.count !== undefined && (
                                            <span
                                                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                                                    isActive ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                                                }`}
                                            >
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </header>

            {/* 3. Main Content Container (Full Width Edge to Edge) */}
            <main className="w-full max-w-full px-4 sm:px-8 lg:px-12 pt-6">
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
                                    className="rounded-full p-1.5 text-slate-400 hover:text-slate-600"
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
                                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:border-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">Property Type</label>
                                        <select
                                            value={newPropertyForm.type}
                                            onChange={(e) => setNewPropertyForm({ ...newPropertyForm, type: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:outline-none"
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
                                            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Location (Ward, District)</label>
                                    <input
                                        type="text"
                                        value={newPropertyForm.location}
                                        onChange={(e) => setNewPropertyForm({ ...newPropertyForm, location: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Estimated Monthly Rent (TZS)</label>
                                    <input
                                        type="number"
                                        value={newPropertyForm.rent}
                                        onChange={(e) => setNewPropertyForm({ ...newPropertyForm, rent: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:outline-none"
                                    />
                                </div>

                                <div className="pt-3 flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddPropertyModalOpen(false)}
                                        className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700 hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white hover:bg-slate-800 shadow-xs"
                                    >
                                        Create Property
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
                            className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl p-6 space-y-4 text-xs"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Record Rent Payment</h3>
                                    <p className="text-slate-500">Log incoming M-Pesa or cash settlement</p>
                                </div>
                                <button
                                    onClick={() => setIsRecordPaymentModalOpen(false)}
                                    className="rounded-full p-1.5 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    setIsRecordPaymentModalOpen(false);
                                    alert('Payment logged successfully! Receipt generated.');
                                }}
                                className="space-y-3"
                            >
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Select Tenant</label>
                                    <select
                                        value={newPaymentForm.tenant}
                                        onChange={(e) => setNewPaymentForm({ ...newPaymentForm, tenant: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:outline-none"
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
                                        value={newPaymentForm.amount}
                                        onChange={(e) => setNewPaymentForm({ ...newPaymentForm, amount: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                                    <select
                                        value={newPaymentForm.method}
                                        onChange={(e) => setNewPaymentForm({ ...newPaymentForm, method: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 focus:outline-none"
                                    >
                                        <option value="mpesa">Vodacom M-Pesa</option>
                                        <option value="airtel">Airtel Money</option>
                                        <option value="bank">Bank Transfer (CRDB/NMB)</option>
                                        <option value="cash">Cash in hand</option>
                                    </select>
                                </div>

                                <div className="pt-3 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsRecordPaymentModalOpen(false)}
                                        className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700 hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white hover:bg-slate-800 shadow-xs"
                                    >
                                        Confirm & Receipt
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

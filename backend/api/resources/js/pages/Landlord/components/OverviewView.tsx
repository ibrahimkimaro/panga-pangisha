import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, Users, Wallet, Plus, ArrowUpRight, ArrowRight,
    Sparkles, CheckCircle2, AlertTriangle, Clock, MapPin,
    Search, Filter, ChevronRight, Zap, Droplets, ShieldCheck,
    CreditCard, FileText, Activity, Home, Bed, Eye, X, Phone,
    Check, MessageCircle, Calendar, Hash, Award, RefreshCw
} from 'lucide-react';

interface Property {
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
}

interface OverviewViewProps {
    user: {
        name: string;
        avatar?: string;
        role?: string;
        business_name?: string;
    };
    stats: {
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
    properties: Property[];
    tenants: Array<{
        id: number;
        name: string;
        phone: string;
        property: string;
        unit: string;
        rent: string;
        status: string;
        since: string;
    }>;
    activity: Array<{
        time: string;
        type: string;
        desc: string;
        target: string;
        status: string;
        status_type: string;
    }>;
    alerts: Array<{
        id: string;
        type: string;
        severity: string;
        title: string;
        description: string;
        time: string;
        badge: string;
    }>;
    onNavigate: (section: 'dashboard' | 'properties' | 'occupancy' | 'agreements' | 'invoices' | 'tenants' | 'settings') => void;
    onOpenAddProperty: () => void;
    onOpenRecordPayment: () => void;
    onOpenAi: () => void;
}

export default function OverviewView({
    user,
    stats,
    properties,
    tenants,
    activity,
    alerts,
    onNavigate,
    onOpenAddProperty,
    onOpenRecordPayment,
    onOpenAi,
}: OverviewViewProps) {
    const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<'all' | 'house' | 'apartment' | 'vacant'>('all');
    const [activePropertyModal, setActivePropertyModal] = useState<Property | null>(null);
    const [activeTenantModal, setActiveTenantModal] = useState<any | null>(null);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    const filteredProperties = properties.filter((p) => {
        if (selectedPropertyFilter === 'all') return true;
        if (selectedPropertyFilter === 'vacant') return p.vacant_units > 0;
        return p.type.toLowerCase().includes(selectedPropertyFilter);
    });

    const formatTZS = (num: number) => {
        return 'TZS ' + Number(num || 0).toLocaleString();
    };

    const handleCopyToken = (token: string) => {
        navigator.clipboard?.writeText(token);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 2500);
    };

    return (
        <div className="space-y-8 pb-16 w-full max-w-full">
            {/* 1. ELEGANT ARCHITECTURAL HOST BANNER (Luxury Host Suite) */}
            <div className="relative overflow-hidden rounded-3xl bg-[#12161A] text-white p-6 sm:p-10 shadow-xl border border-stone-800">
                {/* Subtle Luxury Gradient Background Elements */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-96 w-96 rounded-full bg-gradient-to-br from-teal-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 -mb-16 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-semibold text-stone-300 backdrop-blur-md">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-white font-bold">{user.business_name || 'Kimaro Real Estate Holdings'}</span>
                            <span className="text-white/30">•</span>
                            <span className="text-emerald-400 font-bold">{stats.collection_rate}% Collection Rate</span>
                        </div>

                        <h1 className="font-serif text-2xl sm:text-4xl font-normal text-white tracking-tight">
                            Welcome back, {user.name.split(' ')[0]}
                        </h1>

                        <p className="max-w-2xl text-xs sm:text-sm text-stone-300 leading-relaxed font-light">
                            Your portfolio encompasses <span className="font-semibold text-white">{stats.total_properties} prime properties</span> with{' '}
                            <span className="font-semibold text-emerald-400">{stats.total_rooms_sub.split('•')[0] || '14 Occupied Units'}</span> across Dar es Salaam.
                            All STS submeters are operational with automated tenant billing active.
                        </p>
                    </div>

                    {/* Quick Luxury Action Controls */}
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={onOpenRecordPayment}
                            className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs uppercase tracking-wider font-bold text-white hover:bg-white/20 transition-all active:scale-95 shadow-sm"
                        >
                            <CreditCard className="h-4 w-4 text-emerald-400" />
                            <span>Record Rent</span>
                        </button>

                        <button
                            onClick={onOpenAddProperty}
                            className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs uppercase tracking-wider font-bold text-[#12161A] hover:bg-stone-100 transition-all active:scale-95 shadow-md"
                        >
                            <Plus className="h-4 w-4 text-[#12161A]" />
                            <span>Add Property</span>
                        </button>

                        <button
                            onClick={onOpenAi}
                            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-3 text-xs uppercase tracking-wider font-bold text-white shadow-md hover:from-amber-500 hover:to-amber-600 transition-all active:scale-95"
                        >
                            <Sparkles className="h-4 w-4 text-amber-200" />
                            <span>Veyora Copilot</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. MINIMALIST KPI PERFORMANCE STATS BAR */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* 1. Monthly Rent Collected */}
                <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xs hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                            Rent Collected This Month
                        </span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                            <Wallet className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="font-serif text-2xl sm:text-3xl font-bold text-[#12161A] tracking-tight">
                            {stats.monthly_rent_collected}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs">
                            <span className="text-stone-500">Target: {formatTZS(stats.target_rent)}</span>
                            <span className="inline-flex items-center font-bold text-emerald-600">
                                <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                                +{stats.monthly_growth}% MoM
                            </span>
                        </div>
                    </div>
                    <div className="mt-3 h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
                            style={{ width: `${Math.min(100, stats.collection_rate)}%` }}
                        />
                    </div>
                </div>

                {/* 2. Occupancy Rate */}
                <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xs hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                            Portfolio Occupancy
                        </span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                            <Bed className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="font-serif text-2xl sm:text-3xl font-bold text-[#12161A] tracking-tight">
                            {stats.total_rooms} Units Total
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-stone-500">
                            <span>{stats.total_rooms_sub}</span>
                            <span className="font-bold text-blue-600">
                                {Math.round((14 / stats.total_rooms) * 100)}% Occupancy
                            </span>
                        </div>
                    </div>
                    <div className="mt-3 h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-blue-600 transition-all duration-1000"
                            style={{ width: `${Math.round((14 / stats.total_rooms) * 100)}%` }}
                        />
                    </div>
                </div>

                {/* 3. Verified Residents */}
                <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xs hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                            Active Residents
                        </span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                            <Users className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="font-serif text-2xl sm:text-3xl font-bold text-[#12161A] tracking-tight">
                            {stats.total_tenants} Residents
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-stone-500">
                            <span>{stats.total_tenants_sub}</span>
                            <span className="font-bold text-emerald-600">100% Leased</span>
                        </div>
                    </div>
                    <div className="mt-3 h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-600" style={{ width: '100%' }} />
                    </div>
                </div>

                {/* 4. Properties Managed */}
                <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xs hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                            Active Properties
                        </span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-100 text-stone-800">
                            <Building2 className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="font-serif text-2xl sm:text-3xl font-bold text-[#12161A] tracking-tight">
                            {stats.total_properties} Assets
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-stone-500">
                            <span>{stats.total_properties_sub}</span>
                            <span className="font-bold text-stone-800">Verified & Active</span>
                        </div>
                    </div>
                    <div className="mt-3 h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                        <div className="h-full rounded-full bg-[#12161A]" style={{ width: '100%' }} />
                    </div>
                </div>
            </div>

            {/* 3. CURATED PROPERTIES PORTFOLIO SHOWCASE (Interactive & Clickable for Full Details) */}
            <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#12161A]">
                            Managed Properties Portfolio
                        </h2>
                        <p className="text-xs text-stone-500">
                            Click any property card to view unit occupancy, resident records, and smart STS utility meters.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Filter Tabs */}
                        <div className="inline-flex rounded-full bg-stone-100 p-1 text-xs">
                            {[
                                { id: 'all', label: `All (${properties.length})` },
                                { id: 'house', label: 'Houses' },
                                { id: 'apartment', label: 'Apartments' },
                                { id: 'vacant', label: 'Vacant Units' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setSelectedPropertyFilter(tab.id as any)}
                                    className={`rounded-full px-3 py-1 font-semibold transition-all ${
                                        selectedPropertyFilter === tab.id
                                            ? 'bg-white text-[#12161A] shadow-xs'
                                            : 'text-stone-500 hover:text-stone-900'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => onNavigate('properties')}
                            className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-bold text-stone-800 hover:bg-stone-50 shadow-2xs"
                        >
                            <span>View All</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>

                {/* Property Cards Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {filteredProperties.map((property) => {
                        const occupancyPct =
                            property.total_units > 0
                                ? Math.round((property.occupied_units / property.total_units) * 100)
                                : 80;

                        return (
                            <div
                                key={property.id}
                                onClick={() => setActivePropertyModal(property)}
                                className="group flex flex-col overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-2xs hover:shadow-xl transition-all duration-300 cursor-pointer text-left"
                            >
                                {/* Photo Container with 16:10 Ratio */}
                                <div className="relative aspect-16/10 w-full overflow-hidden bg-stone-100">
                                    <img
                                        src={property.cover_image}
                                        alt={property.name}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        onError={(e) => {
                                            (e.target as HTMLElement).style.display = 'none';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 opacity-70 group-hover:opacity-50 transition-opacity" />

                                    {/* Top Left Status Badge */}
                                    <div className="absolute left-3 top-3">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${
                                                    property.vacant_units === 0 ? 'bg-emerald-400' : 'bg-blue-400'
                                                }`}
                                            />
                                            {property.status}
                                        </span>
                                    </div>

                                    {/* Bottom Right Units Pill */}
                                    <div className="absolute bottom-3 right-3">
                                        <span className="rounded-lg bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#12161A] backdrop-blur-xs shadow-xs">
                                            {property.occupied_units}/{property.total_units} Units
                                        </span>
                                    </div>
                                </div>

                                {/* Content Details */}
                                <div className="flex flex-1 flex-col p-5 justify-between">
                                    <div>
                                        <h3 className="font-serif text-base font-bold text-[#12161A] group-hover:text-amber-700 transition-colors line-clamp-1">
                                            {property.name}
                                        </h3>
                                        <p className="flex items-center gap-1 text-xs text-stone-500 mt-1 line-clamp-1">
                                            <MapPin className="h-3 w-3 shrink-0 text-stone-400" />
                                            {property.location}
                                        </p>

                                        {/* Occupancy Progress Bar */}
                                        <div className="mt-3.5">
                                            <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1 font-medium">
                                                <span>Occupancy</span>
                                                <span className="font-bold text-stone-800">{occupancyPct}%</span>
                                            </div>
                                            <div className="h-1.5 w-full rounded-full bg-stone-100 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${
                                                        occupancyPct >= 100
                                                            ? 'bg-emerald-500'
                                                            : occupancyPct >= 50
                                                            ? 'bg-blue-500'
                                                            : 'bg-amber-500'
                                                    }`}
                                                    style={{ width: `${occupancyPct}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
                                        <div>
                                            <span className="block text-[10px] uppercase font-bold text-stone-400">
                                                Monthly Rent
                                            </span>
                                            <p className="text-sm font-bold text-[#12161A]">
                                                {formatTZS(property.monthly_rent)}
                                            </p>
                                        </div>

                                        <span className="rounded-full bg-stone-100 group-hover:bg-[#12161A] group-hover:text-white p-2 text-stone-600 transition-all">
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 4. FINANCIAL CASHFLOW LEDGER & SMART SUBMETER TELEMETRY (Two-Column Layout) */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Left 2 Cols: Recent Tenants & Rent Ledger */}
                <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xs lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                        <div>
                            <h2 className="font-serif text-lg font-bold text-[#12161A]">
                                Resident Rent Ledger & Collections
                            </h2>
                            <p className="text-xs text-stone-500">
                                Real-time payments, tenancy agreements, and direct receipt audits
                            </p>
                        </div>
                        <button
                            onClick={() => onNavigate('invoices')}
                            className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800"
                        >
                            <span>Open Invoices Suite</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-stone-100 text-stone-400 font-bold uppercase tracking-wider text-[10px]">
                                    <th className="py-2.5">Resident</th>
                                    <th className="py-2.5">Residence & Unit</th>
                                    <th className="py-2.5">Monthly Rent</th>
                                    <th className="py-2.5">Payment Status</th>
                                    <th className="py-2.5 text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {tenants.slice(0, 5).map((t) => (
                                    <tr
                                        key={t.id}
                                        onClick={() => setActiveTenantModal(t)}
                                        className="hover:bg-stone-50/80 transition-colors cursor-pointer"
                                    >
                                        <td className="py-3.5 font-medium text-stone-900">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 font-bold text-stone-700 text-xs">
                                                    {t.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-[#12161A] block">{t.name}</span>
                                                    <span className="text-[11px] text-stone-400 font-mono">{t.phone}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 text-stone-600">
                                            <span className="font-semibold text-stone-800 block">{t.property}</span>
                                            <span className="text-[11px] text-stone-400">{t.unit}</span>
                                        </td>
                                        <td className="py-3.5 font-bold text-[#12161A]">{t.rent}</td>
                                        <td className="py-3.5">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                Paid
                                            </span>
                                        </td>
                                        <td className="py-3.5 text-right">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveTenantModal(t);
                                                }}
                                                className="rounded-lg border border-stone-200 px-3 py-1 text-[11px] font-bold text-stone-700 hover:bg-[#12161A] hover:text-white transition-all shadow-2xs"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right 1 Col: Operational Telemetry & Smart STS Alerts */}
                <div className="space-y-6">
                    {/* STS Prepaid Submeter Alerts */}
                    <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                            <h3 className="font-serif font-bold text-[#12161A] text-sm flex items-center gap-2">
                                <Zap className="h-4 w-4 text-amber-600" />
                                <span>STS Submeter Health</span>
                            </h3>
                            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                Operational
                            </span>
                        </div>

                        <div className="space-y-3">
                            {alerts.slice(0, 3).map((alert) => (
                                <div
                                    key={alert.id}
                                    className="flex items-start gap-3 rounded-2xl border border-stone-100 bg-[#FAF8F5] p-3.5 hover:bg-stone-50 transition-colors"
                                >
                                    <div
                                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${
                                            alert.severity === 'danger'
                                                ? 'bg-red-100 text-red-600'
                                                : alert.severity === 'warning'
                                                ? 'bg-amber-100 text-amber-700'
                                                : 'bg-emerald-100 text-emerald-700'
                                        }`}
                                    >
                                        {alert.type === 'electricity' ? (
                                            <Zap className="h-3.5 w-3.5" />
                                        ) : alert.type === 'water' ? (
                                            <Droplets className="h-3.5 w-3.5" />
                                        ) : (
                                            <ShieldCheck className="h-3.5 w-3.5" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-[#12161A]">{alert.title}</p>
                                        <p className="text-[11px] text-stone-500 mt-0.5">{alert.description}</p>
                                        <span className="text-[10px] text-stone-400 mt-1 block">{alert.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Veyora AI Lease Assistant Banner */}
                    <div className="relative overflow-hidden rounded-3xl bg-[#12161A] p-6 text-white shadow-sm border border-stone-800">
                        <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>AI Host Copilot</span>
                        </div>
                        <h4 className="mt-2 font-serif text-base font-bold text-white">
                            Need a custom tenancy agreement clause?
                        </h4>
                        <p className="mt-1 text-xs text-stone-300 font-light leading-relaxed">
                            Veyora AI generates STS utility clauses, security deposit rules, and notice letters in English & Swahili in seconds.
                        </p>
                        <button
                            onClick={onOpenAi}
                            className="mt-4 w-full rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2.5 text-xs uppercase tracking-wider font-bold text-white transition-all backdrop-blur-md"
                        >
                            Draft with AI
                        </button>
                    </div>
                </div>
            </div>

            {/* 5. INTERACTIVE PROPERTY DETAIL MODAL (Opens when clicking any property) */}
            <AnimatePresence>
                {activePropertyModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl text-[#12161A]"
                        >
                            <button
                                onClick={() => setActivePropertyModal(null)}
                                className="absolute top-5 right-5 h-9 w-9 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-[#12161A] hover:text-white transition-all z-10"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            <div className="relative aspect-16/9 w-full overflow-hidden rounded-2xl bg-stone-100 mb-6">
                                <img
                                    src={activePropertyModal.cover_image}
                                    alt={activePropertyModal.name}
                                    className="h-full w-full object-cover"
                                />
                                <div className="absolute bottom-4 left-4">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                                        <MapPin className="h-3.5 w-3.5 text-amber-400" />
                                        {activePropertyModal.location}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-100">
                                <div>
                                    <span className="text-[11px] uppercase tracking-wider font-bold text-amber-700">
                                        {activePropertyModal.type}
                                    </span>
                                    <h3 className="font-serif text-2xl font-bold text-[#12161A]">
                                        {activePropertyModal.name}
                                    </h3>
                                    <p className="text-xs text-stone-500 mt-1">
                                        {activePropertyModal.occupied_units} of {activePropertyModal.total_units} units currently occupied
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="block text-[10px] uppercase font-bold text-stone-400">
                                        Monthly Revenue
                                    </span>
                                    <span className="font-serif text-2xl font-bold text-[#12161A]">
                                        {formatTZS(activePropertyModal.monthly_rent)}
                                    </span>
                                </div>
                            </div>

                            {/* Units Breakdown */}
                            <div className="py-5 space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                                    Units Breakdown & Submeter Status
                                </h4>
                                <div className="space-y-2">
                                    {Array.from({ length: activePropertyModal.total_units }).map((_, i) => {
                                        const isOccupied = i < activePropertyModal.occupied_units;
                                        return (
                                            <div
                                                key={i}
                                                className="flex items-center justify-between p-3 rounded-2xl border border-stone-100 bg-[#FAF8F5] text-xs"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-200 font-bold text-stone-700">
                                                        {i + 1}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-[#12161A] block">Unit {i + 1}</span>
                                                        <span className="text-[10px] text-stone-500">
                                                            {isOccupied ? 'Asha Msuya • Paid' : 'Vacant • Ready to Rent'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                        isOccupied ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                                                    }`}>
                                                        <Zap className="h-3 w-3" />
                                                        {isOccupied ? '48.2 kWh remaining' : 'Meter Standby'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Modal Action Buttons */}
                            <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setActivePropertyModal(null);
                                        onNavigate('agreements');
                                    }}
                                    className="rounded-full border border-stone-200 px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50"
                                >
                                    Draft Tenancy Agreement
                                </button>
                                <button
                                    onClick={() => {
                                        setActivePropertyModal(null);
                                        onNavigate('properties');
                                    }}
                                    className="rounded-full bg-[#12161A] px-5 py-2 text-xs font-bold text-white hover:bg-stone-800"
                                >
                                    Manage All Units
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 6. INTERACTIVE TENANT DETAIL MODAL (Opens when clicking any tenant row) */}
            <AnimatePresence>
                {activeTenantModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl text-[#12161A]"
                        >
                            <button
                                onClick={() => setActiveTenantModal(null)}
                                className="absolute top-5 right-5 h-9 w-9 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-[#12161A] hover:text-white transition-all z-10"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            <div className="flex items-center gap-4 pb-5 border-b border-stone-100">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#12161A] text-white font-serif text-2xl font-bold">
                                    {activeTenantModal.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-serif text-xl font-bold text-[#12161A]">
                                            {activeTenantModal.name}
                                        </h3>
                                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                            Verified Resident
                                        </span>
                                    </div>
                                    <p className="text-xs text-stone-500 mt-0.5">
                                        Resident since {activeTenantModal.since || 'Jan 2026'}
                                    </p>
                                </div>
                            </div>

                            <div className="py-5 space-y-4 text-xs">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-stone-100">
                                        <span className="block text-[10px] uppercase font-bold text-stone-400">
                                            Property
                                        </span>
                                        <span className="font-bold text-[#12161A] mt-0.5 block">
                                            {activeTenantModal.property}
                                        </span>
                                        <span className="text-[11px] text-stone-500">{activeTenantModal.unit}</span>
                                    </div>

                                    <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-stone-100">
                                        <span className="block text-[10px] uppercase font-bold text-stone-400">
                                            Monthly Rent
                                        </span>
                                        <span className="font-bold text-[#12161A] mt-0.5 block">
                                            {activeTenantModal.rent}
                                        </span>
                                        <span className="text-[11px] text-emerald-600 font-bold">Paid via M-Pesa</span>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl border border-stone-100 bg-stone-50 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-stone-500">Phone Number</span>
                                        <span className="font-mono font-bold text-stone-900">{activeTenantModal.phone}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-stone-500">STS Electricity Submeter</span>
                                        <span className="font-mono text-stone-800 font-bold">Meter #0142-998</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-stone-500">Tenancy Agreement</span>
                                        <span className="text-emerald-700 font-bold">Digitally Signed (Active)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
                                <a
                                    href={`tel:${activeTenantModal.phone}`}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50"
                                >
                                    <Phone className="h-3.5 w-3.5" />
                                    <span>Call</span>
                                </a>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setActiveTenantModal(null);
                                            onNavigate('invoices');
                                        }}
                                        className="rounded-full border border-stone-200 px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50"
                                    >
                                        View Invoices
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActiveTenantModal(null);
                                            onNavigate('agreements');
                                        }}
                                        className="rounded-full bg-[#12161A] px-4 py-2 text-xs font-bold text-white hover:bg-stone-800"
                                    >
                                        Agreement PDF
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

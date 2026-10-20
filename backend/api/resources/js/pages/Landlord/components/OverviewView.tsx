import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Building2, Users, Wallet, Plus, ArrowUpRight, ArrowRight,
    Sparkles, CheckCircle2, AlertTriangle, Clock, MapPin,
    Search, Filter, ChevronRight, Zap, Droplets, ShieldCheck,
    CreditCard, FileText, Activity, Home, Bed, Eye
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
    const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<'all' | 'house' | 'apartment'>('all');

    const filteredProperties = properties.filter((p) => {
        if (selectedPropertyFilter === 'all') return true;
        return p.type.toLowerCase().includes(selectedPropertyFilter);
    });

    const formatTZS = (num: number) => {
        return 'TZS ' + Number(num || 0).toLocaleString();
    };

    return (
        <div className="space-y-8 pb-12">
            {/* 1. Airbnb-Style Warm Welcome Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-8 text-white shadow-xl">
                <div className="absolute right-0 top-0 -mt-12 -mr-12 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 -mb-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur-md">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>{user.business_name || 'Kimaro Real Estate Holdings'}</span>
                            <span className="text-white/40">•</span>
                            <span className="text-emerald-300 font-medium">{stats.collection_rate}% Collected this Month</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-white">
                            Welcome back, {user.name.split(' ')[0]} 👋
                        </h1>
                        <p className="max-w-xl text-sm text-slate-300 leading-relaxed">
                            Your portfolio currently manages <span className="font-semibold text-white">{stats.total_properties} properties</span> with{' '}
                            <span className="font-semibold text-emerald-400">{stats.total_rooms_sub.split('•')[0] || '14 Occupied'}</span> across Dar es Salaam.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={onOpenRecordPayment}
                            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-white shadow-sm backdrop-blur-md hover:bg-white/20 transition-all active:scale-95"
                        >
                            <CreditCard className="h-4 w-4 text-emerald-400" />
                            Record Rent
                        </button>
                        <button
                            onClick={onOpenAi}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:from-blue-500 hover:to-indigo-500 transition-all active:scale-95"
                        >
                            <Sparkles className="h-4 w-4" />
                            Ask Veyora AI
                        </button>
                        <button
                            onClick={onOpenAddProperty}
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-900 shadow-md hover:bg-slate-100 transition-all active:scale-95"
                        >
                            <Plus className="h-4 w-4" />
                            Add Property
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Stripe-Grade Metric KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Rent Collected */}
                <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Rent Collected</span>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
                            <Wallet className="h-4.5 w-4.5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-bold tracking-tight text-slate-900">{stats.monthly_rent_collected}</div>
                        <div className="mt-1 flex items-center justify-between text-xs">
                            <span className="text-slate-500">Goal: {formatTZS(stats.target_rent)}</span>
                            <span className="inline-flex items-center font-semibold text-emerald-600">
                                <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" />
                                +{stats.monthly_growth}%
                            </span>
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000"
                            style={{ width: `${Math.min(100, stats.collection_rate)}%` }}
                        />
                    </div>
                </div>

                {/* Occupancy Rate */}
                <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Units & Rooms</span>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
                            <Bed className="h-4.5 w-4.5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-bold tracking-tight text-slate-900">{stats.total_rooms} Units</div>
                        <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                            <span>{stats.total_rooms_sub}</span>
                            <span className="font-semibold text-blue-600">
                                {Math.round((14 / stats.total_rooms) * 100)}% Occ
                            </span>
                        </div>
                    </div>
                    <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                            style={{ width: `${Math.round((14 / stats.total_rooms) * 100)}%` }}
                        />
                    </div>
                </div>

                {/* Active Tenants */}
                <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Tenants</span>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform">
                            <Users className="h-4.5 w-4.5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-bold tracking-tight text-slate-900">{stats.total_tenants} Residents</div>
                        <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                            <span>{stats.total_tenants_sub}</span>
                            <span className="font-semibold text-emerald-600">100% Verified</span>
                        </div>
                    </div>
                    <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-indigo-500" style={{ width: '100%' }} />
                    </div>
                </div>

                {/* Portfolio Properties */}
                <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Properties Managed</span>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
                            <Building2 className="h-4.5 w-4.5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-bold tracking-tight text-slate-900">{stats.total_properties} Assets</div>
                        <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                            <span>{stats.total_properties_sub}</span>
                            <span className="font-semibold text-amber-600">Active & Live</span>
                        </div>
                    </div>
                    <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500" style={{ width: '100%' }} />
                    </div>
                </div>
            </div>

            {/* 3. Airbnb-Style Featured Properties Portfolio Showcase */}
            <div className="space-y-4">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-lg font-bold tracking-tight text-slate-900">Properties Portfolio</h2>
                        <p className="text-xs text-slate-500">Your managed compounds, townhouses, and apartment complexes</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs">
                            <button
                                onClick={() => setSelectedPropertyFilter('all')}
                                className={`rounded-lg px-3 py-1 font-medium transition-all ${
                                    selectedPropertyFilter === 'all'
                                        ? 'bg-white text-slate-900 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                All ({properties.length})
                            </button>
                            <button
                                onClick={() => setSelectedPropertyFilter('house')}
                                className={`rounded-lg px-3 py-1 font-medium transition-all ${
                                    selectedPropertyFilter === 'house'
                                        ? 'bg-white text-slate-900 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Houses
                            </button>
                            <button
                                onClick={() => setSelectedPropertyFilter('apartment')}
                                className={`rounded-lg px-3 py-1 font-medium transition-all ${
                                    selectedPropertyFilter === 'apartment'
                                        ? 'bg-white text-slate-900 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Apartments
                            </button>
                        </div>

                        <button
                            onClick={() => onNavigate('properties')}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                        >
                            View All
                            <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {filteredProperties.map((property) => {
                        const occupancyPct = property.total_units > 0 
                            ? Math.round((property.occupied_units / property.total_units) * 100) 
                            : 80;

                        return (
                            <div
                                key={property.id}
                                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:shadow-lg transition-all duration-300"
                            >
                                {/* Photo Container with 16:10.5 Ratio (Airbnb feel) */}
                                <div className="relative aspect-16/10.5 w-full overflow-hidden bg-slate-100">
                                    <img
                                        src={property.cover_image}
                                        alt={property.name}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        onError={(e) => {
                                            (e.target as HTMLElement).style.display = 'none';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 opacity-60" />

                                    {/* Top Left Status Badge */}
                                    <div className="absolute left-3 top-3">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                                            <span className={`h-1.5 w-1.5 rounded-full ${property.vacant_units === 0 ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                                            {property.status}
                                        </span>
                                    </div>

                                    {/* Bottom Right Units Pill */}
                                    <div className="absolute bottom-3 right-3">
                                        <span className="rounded-lg bg-white/90 px-2 py-0.5 text-[11px] font-bold text-slate-900 backdrop-blur-xs">
                                            {property.occupied_units}/{property.total_units} Units
                                        </span>
                                    </div>
                                </div>

                                {/* Content Details */}
                                <div className="flex flex-1 flex-col p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm line-clamp-1">
                                                {property.name}
                                            </h3>
                                            <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5 line-clamp-1">
                                                <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                                                {property.location}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Occupancy Micro Bar */}
                                    <div className="mt-3">
                                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                                            <span>Occupancy</span>
                                            <span className="font-semibold text-slate-700">{occupancyPct}%</span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
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

                                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-slate-400">Monthly Rent</span>
                                            <p className="text-sm font-extrabold text-slate-900">
                                                {formatTZS(property.monthly_rent)}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => onNavigate('properties')}
                                            className="rounded-lg bg-slate-50 p-2 text-slate-600 hover:bg-slate-900 hover:text-white transition-all"
                                            title="View Units"
                                        >
                                            <ArrowRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 4. Stripe-Style Financial & Operational Two-Column Grid */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Left 2 Cols: Invoices & Cashflow Quick View */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-2">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Recent Tenants & Rent Ledger</h2>
                            <p className="text-xs text-slate-500">Real-time collections and digital receipt verifications</p>
                        </div>
                        <button
                            onClick={() => onNavigate('invoices')}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                            Open Billing Suite
                            <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div className="overflow-x-auto mt-4">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                                    <th className="py-2.5">Tenant</th>
                                    <th className="py-2.5">Property & Room</th>
                                    <th className="py-2.5">Monthly Rent</th>
                                    <th className="py-2.5">Status</th>
                                    <th className="py-2.5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {tenants.slice(0, 5).map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-3 font-medium text-slate-900">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 text-xs">
                                                    {t.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-slate-900">{t.name}</span>
                                                    <span className="block text-[11px] text-slate-400">{t.phone}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 text-slate-600">
                                            <span className="font-medium text-slate-800">{t.property}</span>
                                            <span className="block text-[11px] text-slate-400">{t.unit}</span>
                                        </td>
                                        <td className="py-3 font-semibold text-slate-900">{t.rent}</td>
                                        <td className="py-3">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                Paid
                                            </span>
                                        </td>
                                        <td className="py-3 text-right">
                                            <button
                                                onClick={() => onNavigate('invoices')}
                                                className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition-all"
                                            >
                                                Invoice
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right 1 Col: Operational Telemetry & Smart Alerts */}
                <div className="space-y-6">
                    {/* Alerts Card */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Activity className="h-4 w-4 text-blue-600" />
                                Live Building Feed
                            </h3>
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                                Live
                            </span>
                        </div>

                        <div className="mt-3 space-y-3">
                            {alerts.slice(0, 4).map((alert) => (
                                <div
                                    key={alert.id}
                                    className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 hover:bg-slate-50 transition-colors"
                                >
                                    <div
                                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                                            alert.severity === 'danger'
                                                ? 'bg-red-100 text-red-600'
                                                : alert.severity === 'warning'
                                                ? 'bg-amber-100 text-amber-600'
                                                : 'bg-emerald-100 text-emerald-600'
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
                                        <p className="text-xs font-semibold text-slate-900">{alert.title}</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">{alert.description}</p>
                                        <span className="text-[10px] text-slate-400 mt-1 block">{alert.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Veyora AI Lease Assistant Banner */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 p-5 text-white shadow-sm">
                        <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                            <Sparkles className="h-3.5 w-3.5" />
                            AI Landlord Co-pilot
                        </div>
                        <h4 className="mt-2 text-sm font-bold text-white">Need a customized tenancy agreement?</h4>
                        <p className="mt-1 text-xs text-indigo-100/80 leading-relaxed">
                            Veyora AI drafts STS utility submeter clauses, security deposit agreements, and tenancy notices in seconds.
                        </p>
                        <button
                            onClick={onOpenAi}
                            className="mt-4 w-full rounded-xl bg-white/10 hover:bg-white/20 px-3 py-2 text-xs font-bold text-white transition-all backdrop-blur-md"
                        >
                            Draft with AI
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

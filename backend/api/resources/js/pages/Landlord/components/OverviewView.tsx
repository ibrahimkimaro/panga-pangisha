import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, Users, Wallet, Plus, ArrowRight,
    MapPin, ChevronRight, ChevronLeft,
    CreditCard, FileText, CalendarCheck, Receipt, Zap,
    MessageSquare, BarChart3, Bed, Bath,
    X, Check, MoreVertical, Sparkles, Phone, MessageCircle,
    Clock, Eye, CheckCircle2
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
    onNavigate: (section: any) => void;
    onOpenAddProperty: () => void;
    onOpenRecordPayment: () => void;
    onOpenAi: () => void;
    lang?: 'en' | 'sw';
}

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80';

export default function OverviewView({
    user,
    stats,
    properties,
    tenants,
    activity,
    alerts,
    inquiries = [],
    onNavigate,
    onOpenAddProperty,
    onOpenRecordPayment,
    onOpenAi,
    lang = 'en',
}: OverviewViewProps) {
    const [activePropertyModal, setActivePropertyModal] = useState<Property | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<string>('October 2026');

    // High quality architectural properties matching the mockup
    const displayProperties: Property[] = properties.length >= 4 ? properties : [
        ...properties,
        {
            id: 101,
            name: 'KIMARO Executive Villa',
            location: 'Mikocheni, Dar es Salaam',
            type: 'Villa',
            total_units: 4,
            occupied_units: 3,
            vacant_units: 1,
            status: '3/4 Occupied',
            status_color: 'bg-stone-100 text-stone-800',
            monthly_rent: 4200000,
            cover_image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
            specs: '4 Beds • 3 Baths',
        },
        {
            id: 102,
            name: 'Palm Vista Apartments',
            location: 'Oysterbay, Dar es Salaam',
            type: 'Apartment',
            total_units: 6,
            occupied_units: 5,
            vacant_units: 1,
            status: '5/6 Occupied',
            status_color: 'bg-stone-100 text-stone-800',
            monthly_rent: 1850000,
            cover_image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
            specs: '2 Beds • 2 Baths',
        },
        {
            id: 103,
            name: 'Luxury Court Residences',
            location: 'Upanga, Dar es Salaam',
            type: 'Apartment',
            total_units: 5,
            occupied_units: 3,
            vacant_units: 2,
            status: '3/5 Occupied',
            status_color: 'bg-stone-100 text-stone-800',
            monthly_rent: 1400000,
            cover_image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80',
            specs: '4 Beds • 3 Baths',
        },
        {
            id: 104,
            name: 'Coral Beach Oceanfront',
            location: 'Kigamboni, Dar es Salaam',
            type: 'Resort Residence',
            total_units: 8,
            occupied_units: 4,
            vacant_units: 4,
            status: '4/8 Occupied',
            status_color: 'bg-stone-100 text-stone-800',
            monthly_rent: 12000000,
            cover_image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80',
            specs: '6 Beds • 5 Baths',
        },
    ].slice(0, 4);

    // Upcoming Bookings data
    const upcomingBookings = [
        {
            id: 1,
            name: 'Asha Msuya',
            property: 'Palm Vista Apartments',
            dates: 'Oct 25 – Oct 30, 2026',
            status: 'Confirmed',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        },
        {
            id: 2,
            name: 'David Mwangi',
            property: 'Luxury Court Residences',
            dates: 'Nov 01 – Nov 08, 2026',
            status: 'Pending',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        },
        {
            id: 3,
            name: 'Sarah Johnson',
            property: 'Kimaro Executive Villa',
            dates: 'Nov 10 – Nov 18, 2026',
            status: 'Confirmed',
            avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
        },
        {
            id: 4,
            name: 'James Dodd',
            property: 'Coral Beach Oceanfront',
            dates: 'Nov 12 – Nov 25, 2026',
            status: 'Pending',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
        },
    ];

    const formatTZS = (num: number) => {
        return 'TZS ' + Number(num || 0).toLocaleString();
    };

    return (
        <div className="space-y-6 w-full max-w-full font-sans antialiased text-[#12161A]">
            {/* 1. CLEAN ARCHITECTURAL BANNER (MATCHING MOCKUP - NO EMOJIS, SIMPLE REFINED COLORS) */}
            <div className="relative overflow-hidden rounded-3xl bg-white border border-[#EBE7E1] p-6 sm:p-8 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 z-10 flex-1">
                    <span className="text-xs font-semibold text-[#706861] uppercase tracking-wider block">
                        Good morning,
                    </span>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#12161A]">
                        {user.name}
                    </h1>
                    <p className="text-xs sm:text-sm text-[#706861] max-w-xl leading-relaxed">
                        Manage your properties, track bookings, and grow your rental business — all in one place.
                    </p>
                </div>

                {/* Right Architectural Visual */}
                <div className="w-full md:w-80 lg:w-96 h-32 sm:h-36 rounded-2xl overflow-hidden shrink-0 border border-[#EBE7E1] relative shadow-2xs">
                    <img
                        src="https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1000&auto=format&fit=crop&q=85"
                        alt="Luxury Villa Property"
                        onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
                        }}
                        className="h-full w-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-black/10 pointer-events-none" />
                </div>
            </div>

            {/* 2. FOUR KPI STAT CARDS (UNIFIED, COHESIVE PALETTE - NO RAINBOW COLORS, NORMAL ICONS) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Card 1: Total Properties */}
                <div className="rounded-2xl border border-[#EBE7E1] bg-white p-5 shadow-2xs hover:border-[#12161A]/40 transition-all flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4F1EA] text-[#12161A] border border-[#EBE7E1]">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <span className="inline-flex items-center rounded-full bg-stone-100 border border-stone-200/60 px-2.5 py-0.5 text-[11px] font-bold text-[#12161A]">
                                +1 New
                            </span>
                        </div>
                        <div className="mt-3">
                            <span className="text-xs font-medium text-[#706861] block">Total Properties</span>
                            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#12161A] mt-0.5">
                                {stats.total_properties || 4}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => onNavigate('properties')}
                        className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#706861] hover:text-[#12161A] transition-colors cursor-pointer"
                    >
                        <span>View all</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                </div>

                {/* Card 2: This Month's Bookings */}
                <div className="rounded-2xl border border-[#EBE7E1] bg-white p-5 shadow-2xs hover:border-[#12161A]/40 transition-all flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4F1EA] text-[#12161A] border border-[#EBE7E1]">
                                <CalendarCheck className="h-5 w-5" />
                            </div>
                            <span className="inline-flex items-center rounded-full bg-stone-100 border border-stone-200/60 px-2.5 py-0.5 text-[11px] font-bold text-[#12161A]">
                                +33%
                            </span>
                        </div>
                        <div className="mt-3">
                            <span className="text-xs font-medium text-[#706861] block">This Month's Bookings</span>
                            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#12161A] mt-0.5">
                                12
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => onNavigate('bookings')}
                        className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#706861] hover:text-[#12161A] transition-colors cursor-pointer"
                    >
                        <span>View bookings</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                </div>

                {/* Card 3: Monthly Earnings */}
                <div className="rounded-2xl border border-[#EBE7E1] bg-white p-5 shadow-2xs hover:border-[#12161A]/40 transition-all flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4F1EA] text-[#12161A] border border-[#EBE7E1]">
                                <Wallet className="h-5 w-5" />
                            </div>
                            <span className="inline-flex items-center rounded-full bg-stone-100 border border-stone-200/60 px-2.5 py-0.5 text-[11px] font-bold text-[#12161A]">
                                +12%
                            </span>
                        </div>
                        <div className="mt-3">
                            <span className="text-xs font-medium text-[#706861] block">Monthly Earnings</span>
                            <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#12161A] mt-0.5 truncate">
                                {stats.monthly_rent_collected || 'TZS 2,480,000'}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => onNavigate('finances')}
                        className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#706861] hover:text-[#12161A] transition-colors cursor-pointer"
                    >
                        <span>View finances</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                </div>

                {/* Card 4: Occupancy Rate */}
                <div className="rounded-2xl border border-[#EBE7E1] bg-white p-5 shadow-2xs hover:border-[#12161A]/40 transition-all flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4F1EA] text-[#12161A] border border-[#EBE7E1]">
                                <Users className="h-5 w-5" />
                            </div>
                            <span className="inline-flex items-center rounded-full bg-stone-100 border border-stone-200/60 px-2.5 py-0.5 text-[11px] font-bold text-[#12161A]">
                                +5%
                            </span>
                        </div>
                        <div className="mt-3">
                            <span className="text-xs font-medium text-[#706861] block">Occupancy Rate</span>
                            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#12161A] mt-0.5">
                                78%
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => onNavigate('occupancy')}
                        className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#706861] hover:text-[#12161A] transition-colors cursor-pointer"
                    >
                        <span>View report</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* CORE COMMAND TOOLS: LEASE AGREEMENTS, INVOICES & BILLS, ROOM OCCUPANCY */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            {lang === 'sw' ? 'Zana Kuu za Usimamizi' : 'Core Management Suite'}
                        </h2>
                        <p className="text-xs text-[#706861]">
                            {lang === 'sw'
                                ? 'Mikataba halali ya upangaji, utoaji wa ankara na bili za huduma, na ufuatiliaji wa ukaaji wa vyumba.'
                                : 'Legally binding lease agreements, utility bills and invoicing, and real-time room occupancy tracking.'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Tool 1: Lease Agreements */}
                    <div
                        onClick={() => onNavigate('agreements')}
                        className="group relative rounded-3xl border border-[#EBE7E1] bg-white p-5 shadow-2xs hover:border-[#12161A] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                    >
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="h-11 w-11 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-700 group-hover:scale-105 transition-transform">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100/70 text-teal-900 border border-teal-200">
                                    {lang === 'sw' ? 'Kisheria' : 'Legal'}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-[#12161A] group-hover:text-teal-800 transition-colors">
                                    {lang === 'sw' ? 'Mikataba ya Upangaji' : 'Lease Agreements'}
                                </h3>
                                <p className="text-xs text-[#706861] mt-1 leading-relaxed">
                                    {lang === 'sw'
                                        ? 'Andaa rasimu za mikataba ya makazi Tanzania, rekodi vipimo vya awali vya mita, na saini za kidijitali.'
                                        : 'Draft residential lease agreements, record initial meter readings, and manage digital signatures.'}
                                </p>
                            </div>
                            <div className="pt-2 border-t border-[#F1EFEA] flex items-center justify-between text-xs font-semibold text-slate-700">
                                <span>{lang === 'sw' ? 'Mikataba Iliyopo:' : 'Active Leases:'}</span>
                                <span className="font-extrabold text-teal-700">
                                    {lang === 'sw' ? '12 Hai • 1 Rasimu' : '12 Active • 1 Draft'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700 group-hover:translate-x-0.5 transition-transform">
                            <span>{lang === 'sw' ? 'Fungua Mikataba' : 'View Agreements'}</span>
                            <ArrowRight className="h-4 w-4" />
                        </div>
                    </div>

                    {/* Tool 2: Invoices & Billing */}
                    <div
                        onClick={() => onNavigate('invoices')}
                        className="group relative rounded-3xl border border-[#EBE7E1] bg-white p-5 shadow-2xs hover:border-[#12161A] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                    >
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="h-11 w-11 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-700 group-hover:scale-105 transition-transform">
                                    <Receipt className="h-5 w-5" />
                                </div>
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100/70 text-indigo-900 border border-indigo-200">
                                    {lang === 'sw' ? 'Ankara & Malipo' : 'Invoices & Billing'}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-[#12161A] group-hover:text-indigo-800 transition-colors">
                                    {lang === 'sw' ? 'Ankara na Bili' : 'Invoices & Billing'}
                                </h3>
                                <p className="text-xs text-[#706861] mt-1 leading-relaxed">
                                    {lang === 'sw'
                                        ? 'Toa madai ya kodi, bili za umeme (LUKU) na maji (DAWASA), rekodi malipo ya simu/benki na toa risiti.'
                                        : 'Issue rent invoices, electricity & water utility bills, record mobile/bank payments, and generate receipts.'}
                                </p>
                            </div>
                            <div className="pt-2 border-t border-[#F1EFEA] flex items-center justify-between text-xs font-semibold text-slate-700">
                                <span>{lang === 'sw' ? 'Makusanyo:' : 'Collections:'}</span>
                                <span className="font-extrabold text-indigo-700">
                                    {lang === 'sw' ? '81% Yamethibitishwa' : '81% Collected'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-700 group-hover:translate-x-0.5 transition-transform">
                            <span>{lang === 'sw' ? 'Simamia Ankara' : 'Manage Invoices'}</span>
                            <ArrowRight className="h-4 w-4" />
                        </div>
                    </div>

                    {/* Tool 3: Room Occupancy */}
                    <div
                        onClick={() => onNavigate('occupancy')}
                        className="group relative rounded-3xl border border-[#EBE7E1] bg-white p-5 shadow-2xs hover:border-[#12161A] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                    >
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="h-11 w-11 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 group-hover:scale-105 transition-transform">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100/70 text-amber-900 border border-amber-200">
                                    {lang === 'sw' ? 'Ukaaji na Mita' : 'Units & Meters'}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-[#12161A] group-hover:text-amber-800 transition-colors">
                                    {lang === 'sw' ? 'Ukaaji wa Vyumba' : 'Room Occupancy'}
                                </h3>
                                <p className="text-xs text-[#706861] mt-1 leading-relaxed">
                                    {lang === 'sw'
                                        ? 'Fuatilia muda wa ukaaji unaoendelea, tarehe za kuisha, mita za vyumba na historia ya upangaji.'
                                        : 'Track ongoing tenancy durations, lease expiry dates, unit sub-meters, and tenancy history.'}
                                </p>
                            </div>
                            <div className="pt-2 border-t border-[#F1EFEA] flex items-center justify-between text-xs font-semibold text-slate-700">
                                <span>{lang === 'sw' ? 'Hali ya Vyumba:' : 'Room Status:'}</span>
                                <span className="font-extrabold text-amber-800">
                                    {lang === 'sw' ? '14 Vimepangishwa • 4 Wazi' : '14 Occupied • 4 Vacant'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700 group-hover:translate-x-0.5 transition-transform">
                            <span>{lang === 'sw' ? 'Tazama Vyumba na Mita' : 'View Units & Meters'}</span>
                            <ArrowRight className="h-4 w-4" />
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. CORE 2-COLUMN LAYOUT: (LEFT: PROPERTIES + ANALYTICS + ACTIVITY | RIGHT: ACTIONS + BOOKINGS + CALENDAR) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* ===== LEFT COLUMN (8 COLS) ===== */}
                <div className="lg:col-span-8 space-y-6">
                    {/* SECTION A: YOUR PROPERTIES */}
                    <div className="rounded-3xl border border-[#EBE7E1] bg-white p-6 shadow-2xs">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-[#12161A]">
                                    Your Properties
                                </h2>
                                <p className="text-xs text-[#706861] mt-0.5">
                                    Manage all your properties in one place
                                </p>
                            </div>
                            <button
                                onClick={() => onNavigate('properties')}
                                className="inline-flex items-center gap-1 text-xs font-bold text-[#12161A] hover:underline transition-all cursor-pointer"
                            >
                                <span>View all properties</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        {/* 4 Properties Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                            {displayProperties.map((prop, idx) => {
                                const occPct = Math.round((prop.occupied_units / (prop.total_units || 1)) * 100) || (idx === 0 ? 75 : idx === 1 ? 83 : idx === 2 ? 60 : 50);
                                return (
                                    <div
                                        key={prop.id}
                                        onClick={() => setActivePropertyModal(prop)}
                                        className="rounded-2xl border border-[#EBE7E1] bg-white overflow-hidden shadow-2xs hover:border-[#12161A]/40 transition-all cursor-pointer group flex flex-col justify-between"
                                    >
                                        <div className="relative h-32 w-full overflow-hidden bg-stone-100">
                                            <img
                                                src={prop.cover_image}
                                                alt={prop.name}
                                                onError={(e) => {
                                                    (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
                                                }}
                                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute top-2 left-2">
                                                <span className="rounded-full bg-[#12161A] text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-2xs">
                                                    Active
                                                </span>
                                            </div>
                                        </div>

                                        <div className="p-3.5 space-y-2">
                                            <div>
                                                <h3 className="font-bold text-xs sm:text-sm text-[#12161A] line-clamp-1 group-hover:text-stone-700 transition-colors">
                                                    {prop.name}
                                                </h3>
                                                <p className="text-[11px] text-[#706861] flex items-center gap-1 mt-0.5 truncate">
                                                    <MapPin className="h-3 w-3 text-stone-400 shrink-0" />
                                                    <span>{prop.location}</span>
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 text-[10px] text-[#706861] pt-1 border-t border-stone-100">
                                                <span>{prop.specs}</span>
                                            </div>

                                            <div className="flex items-center justify-between pt-1">
                                                <div className="text-xs font-bold text-[#12161A]">
                                                    {formatTZS(prop.monthly_rent)}
                                                    <span className="text-[10px] font-normal text-[#8C827A]"> / mo</span>
                                                </div>
                                            </div>

                                            {/* Progress / Occupancy Indicator */}
                                            <div className="pt-1.5 flex items-center justify-between text-[10px] text-[#706861]">
                                                <span className="font-semibold text-[#12161A]">{occPct}% Occupancy</span>
                                                <div className="h-1.5 w-16 rounded-full bg-stone-100 overflow-hidden border border-stone-200/50">
                                                    <div
                                                        className="h-full rounded-full bg-[#12161A]"
                                                        style={{ width: `${occPct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* SECTION B: MONTHLY EARNINGS CHART & DONUT GAUGE (CLEAN MONOCHROME DESIGN) */}
                    <div className="rounded-3xl border border-[#EBE7E1] bg-white p-6 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-[#12161A]">
                                    Monthly Earnings
                                </h2>
                                <div className="flex items-baseline gap-2 mt-0.5">
                                    <span className="text-xl sm:text-2xl font-extrabold text-[#12161A]">
                                        TZS 2,480,000
                                    </span>
                                    <span className="text-xs font-semibold text-[#12161A]">
                                        +38% from last month
                                    </span>
                                </div>
                            </div>

                            <span className="text-xs font-medium text-[#706861] bg-[#F4F1EA] border border-[#EBE7E1] px-3 py-1.5 rounded-xl self-start sm:self-auto">
                                Last 6 months
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                            {/* Area Line Trend (Clean SVG Architectural Line) */}
                            <div className="md:col-span-7 h-48 w-full flex flex-col justify-end">
                                <div className="relative h-36 w-full">
                                    <svg viewBox="0 0 500 120" className="h-full w-full overflow-visible">
                                        <defs>
                                            <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#12161A" stopOpacity="0.08" />
                                                <stop offset="100%" stopColor="#12161A" stopOpacity="0.0" />
                                            </linearGradient>
                                        </defs>

                                        {/* Subtle Horizontal Reference Lines */}
                                        <line x1="0" y1="20" x2="500" y2="20" stroke="#F1EFEA" strokeWidth="1" strokeDasharray="3 3" />
                                        <line x1="0" y1="60" x2="500" y2="60" stroke="#F1EFEA" strokeWidth="1" strokeDasharray="3 3" />
                                        <line x1="0" y1="100" x2="500" y2="100" stroke="#F1EFEA" strokeWidth="1" strokeDasharray="3 3" />

                                        {/* Gradient Fill */}
                                        <path
                                            d="M 20 90 Q 110 80, 200 65 T 380 40 T 480 25 L 480 115 L 20 115 Z"
                                            fill="url(#earningsGradient)"
                                        />

                                        {/* Clean Charcoal Path */}
                                        <path
                                            d="M 20 90 Q 110 80, 200 65 T 380 40 T 480 25"
                                            fill="none"
                                            stroke="#12161A"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                        />

                                        {/* Peak Dot */}
                                        <circle cx="480" cy="25" r="4" fill="#12161A" />
                                        <circle cx="480" cy="25" r="7" fill="#12161A" fillOpacity="0.15" />
                                    </svg>
                                </div>

                                <div className="flex items-center justify-between text-[11px] font-semibold text-[#8C827A] pt-2 border-t border-stone-100 px-1">
                                    <span>May</span>
                                    <span>Jun</span>
                                    <span>Jul</span>
                                    <span>Aug</span>
                                    <span>Sep</span>
                                    <span className="text-[#12161A] font-bold">Oct</span>
                                </div>
                            </div>

                            {/* Donut Occupancy Gauge (Right Side of Chart Card) */}
                            <div className="md:col-span-5 flex items-center justify-around p-4 rounded-2xl bg-[#F4F1EA]/60 border border-[#EBE7E1]">
                                <div className="relative flex items-center justify-center h-28 w-28">
                                    <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                                        <path
                                            className="text-stone-200"
                                            strokeWidth="3.5"
                                            stroke="currentColor"
                                            fill="none"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <path
                                            className="text-[#12161A]"
                                            strokeDasharray="78, 100"
                                            strokeLinecap="round"
                                            strokeWidth="3.5"
                                            stroke="currentColor"
                                            fill="none"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                    </svg>
                                    <div className="absolute flex flex-col items-center">
                                        <span className="text-xl font-extrabold text-[#12161A]">78%</span>
                                        <span className="text-[9px] uppercase font-bold text-[#8C827A]">Occupied</span>
                                    </div>
                                </div>

                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 rounded-full bg-[#12161A]" />
                                        <span className="text-[#12161A] font-semibold">Occupied: 78%</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
                                        <span className="text-[#706861]">Available: 22%</span>
                                    </div>
                                    <div className="pt-1 text-[11px] text-[#8C827A]">
                                        Total Vacant: 4 Units
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION C: RECENT ACTIVITY (UNIFIED ICONS & CLEAN LIST) */}
                    <div className="rounded-3xl border border-[#EBE7E1] bg-white p-6 shadow-2xs">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base sm:text-lg font-bold text-[#12161A]">
                                Recent Activity
                            </h2>
                            <button
                                onClick={() => onNavigate('finances')}
                                className="text-xs font-semibold text-[#706861] hover:text-[#12161A] cursor-pointer"
                            >
                                View all
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FBF9F5] border border-[#EBE7E1] text-xs">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F1EA] text-[#12161A] border border-[#EBE7E1] shrink-0">
                                        <CalendarCheck className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <span className="font-bold text-[#12161A] block">New booking confirmed</span>
                                        <span className="text-[11px] text-[#706861]">Asha Msuya • Palm Vista Apartments</span>
                                    </div>
                                </div>
                                <span className="text-[11px] text-[#8C827A]">2h ago</span>
                            </div>

                            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FBF9F5] border border-[#EBE7E1] text-xs">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F1EA] text-[#12161A] border border-[#EBE7E1] shrink-0">
                                        <CreditCard className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <span className="font-bold text-[#12161A] block">Payment received</span>
                                        <span className="text-[11px] text-[#706861]">TZS 400,000 • Kimaro Executive Villa</span>
                                    </div>
                                </div>
                                <span className="text-[11px] text-[#8C827A]">4h ago</span>
                            </div>

                            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FBF9F5] border border-[#EBE7E1] text-xs">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F1EA] text-[#12161A] border border-[#EBE7E1] shrink-0">
                                        <MessageSquare className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <span className="font-bold text-[#12161A] block">New enquiry</span>
                                        <span className="text-[11px] text-[#706861]">David Mwangi • Luxury Court</span>
                                    </div>
                                </div>
                                <span className="text-[11px] text-[#8C827A]">6h ago</span>
                            </div>

                            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FBF9F5] border border-[#EBE7E1] text-xs">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F1EA] text-[#12161A] border border-[#EBE7E1] shrink-0">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <span className="font-bold text-[#12161A] block">Agreement signed</span>
                                        <span className="text-[11px] text-[#706861]">Sarah Johnson • Coral Beach Resort</span>
                                    </div>
                                </div>
                                <span className="text-[11px] text-[#8C827A]">1d ago</span>
                            </div>
                        </div>
                    </div>

                    {/* SECTION C: VISITOR TRAFFIC & GUEST VIEWING INQUIRIES */}
                    <div className="rounded-3xl border border-[#EBE7E1] bg-white p-6 shadow-2xs">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base sm:text-lg font-bold text-[#12161A]">
                                        {lang === 'sw' ? 'Wageni & Maombi ya Kuona Nyumba' : 'Visitor Traffic & House Inquiries'}
                                    </h2>
                                    <span className="rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-[10px] font-bold">
                                        {inquiries.length} {lang === 'sw' ? 'Wageni' : 'Visitors'}
                                    </span>
                                </div>
                                <p className="text-xs text-[#706861] mt-0.5">
                                    {lang === 'sw'
                                        ? 'Wageni wanaotembelea wavuti na kutuma maombi ya kuona vyumba na nyumba zako moja kwa moja.'
                                        : 'Prospective renters who visited your listings and submitted viewing requests via AI Support.'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {inquiries.map((inq) => {
                                const cleanPhone = inq.guest_phone.replace(/\s+/g, '');
                                const isPending = inq.status === 'pending';
                                return (
                                    <div
                                        key={inq.id}
                                        className="p-4 rounded-2xl border border-slate-200 bg-[#FBF9F5] hover:bg-white transition-all space-y-2.5"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                                    {inq.guest_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="font-extrabold text-xs text-slate-900 block">
                                                        {inq.guest_name}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                                        <Clock className="h-3 w-3 text-slate-400" />
                                                        <span>{inq.created_at} • Preferred: {inq.preferred_at}</span>
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                                    isPending ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                                }`}>
                                                    {isPending ? (lang === 'sw' ? 'Inasubiri' : 'Pending Review') : (lang === 'sw' ? 'Imethibitishwa' : 'Accepted')}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/60 leading-relaxed">
                                            <strong>{inq.house_name}:</strong> {inq.note}
                                        </p>

                                        <div className="flex items-center justify-between pt-1">
                                            <span className="text-[11px] text-slate-500 font-mono">
                                                {inq.guest_phone}
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <a
                                                    href={`https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(
                                                        `Hello ${inq.guest_name}, I am the owner of ${inq.house_name}. I received your viewing inquiry for ${inq.preferred_at}.`
                                                    )}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#25D366] text-white text-[11px] font-bold hover:bg-[#20BE5C] transition-all shadow-2xs"
                                                >
                                                    <MessageCircle className="h-3.5 w-3.5" />
                                                    <span>WhatsApp</span>
                                                </a>
                                                <a
                                                    href={`tel:${cleanPhone}`}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-[11px] font-bold hover:bg-slate-50 transition-all shadow-2xs"
                                                >
                                                    <Phone className="h-3.5 w-3.5" />
                                                    <span>Call</span>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ===== RIGHT COLUMN (4 COLS) ===== */}
                <div className="lg:col-span-4 space-y-6">
                    {/* CARD 1: QUICK ACTIONS (2x2 GRID MATCHING MOCKUP) */}
                    <div className="rounded-3xl border border-[#EBE7E1] bg-white p-5 sm:p-6 shadow-2xs">
                        <h2 className="text-base font-bold text-[#12161A]">Quick Actions</h2>
                        <p className="text-xs text-[#706861] mt-0.5 mb-4">Get things done faster</p>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={onOpenAddProperty}
                                className="p-3.5 rounded-2xl border border-[#EBE7E1] bg-[#FBF9F5] hover:bg-white hover:border-[#12161A] transition-all text-left flex flex-col justify-between cursor-pointer group shadow-2xs"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-[#EBE7E1] text-[#12161A] group-hover:bg-[#12161A] group-hover:text-white transition-colors">
                                    <Plus className="h-4 w-4" />
                                </div>
                                <div className="mt-3">
                                    <span className="font-bold text-xs text-[#12161A] block">Add Property</span>
                                    <span className="text-[10px] text-[#706861] block leading-tight mt-0.5">List a new property</span>
                                </div>
                            </button>

                            <button
                                onClick={() => onNavigate('bookings')}
                                className="p-3.5 rounded-2xl border border-[#EBE7E1] bg-[#FBF9F5] hover:bg-white hover:border-[#12161A] transition-all text-left flex flex-col justify-between cursor-pointer group shadow-2xs"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-[#EBE7E1] text-[#12161A] group-hover:bg-[#12161A] group-hover:text-white transition-colors">
                                    <CalendarCheck className="h-4 w-4" />
                                </div>
                                <div className="mt-3">
                                    <span className="font-bold text-xs text-[#12161A] block">Manage Bookings</span>
                                    <span className="text-[10px] text-[#706861] block leading-tight mt-0.5">View reservations</span>
                                </div>
                            </button>

                            <button
                                onClick={() => onNavigate('agreements')}
                                className="p-3.5 rounded-2xl border border-[#EBE7E1] bg-[#FBF9F5] hover:bg-white hover:border-[#12161A] transition-all text-left flex flex-col justify-between cursor-pointer group shadow-2xs"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-[#EBE7E1] text-[#12161A] group-hover:bg-[#12161A] group-hover:text-white transition-colors">
                                    <FileText className="h-4 w-4" />
                                </div>
                                <div className="mt-3">
                                    <span className="font-bold text-xs text-[#12161A] block">Create Agreement</span>
                                    <span className="text-[10px] text-[#706861] block leading-tight mt-0.5">Rental agreement</span>
                                </div>
                            </button>

                            <button
                                onClick={() => onNavigate('finances')}
                                className="p-3.5 rounded-2xl border border-[#EBE7E1] bg-[#FBF9F5] hover:bg-white hover:border-[#12161A] transition-all text-left flex flex-col justify-between cursor-pointer group shadow-2xs"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-[#EBE7E1] text-[#12161A] group-hover:bg-[#12161A] group-hover:text-white transition-colors">
                                    <BarChart3 className="h-4 w-4" />
                                </div>
                                <div className="mt-3">
                                    <span className="font-bold text-xs text-[#12161A] block">View Reports</span>
                                    <span className="text-[10px] text-[#706861] block leading-tight mt-0.5">Financial metrics</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* CARD 2: UPCOMING BOOKINGS */}
                    <div className="rounded-3xl border border-[#EBE7E1] bg-white p-5 sm:p-6 shadow-2xs">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-bold text-[#12161A]">Upcoming Bookings</h2>
                            <button
                                onClick={() => onNavigate('bookings')}
                                className="text-xs font-semibold text-[#12161A] hover:underline cursor-pointer"
                            >
                                View all →
                            </button>
                        </div>

                        <div className="space-y-3">
                            {upcomingBookings.map((b) => (
                                <div
                                    key={b.id}
                                    className="p-3 rounded-2xl bg-[#FBF9F5] border border-[#EBE7E1] flex items-center justify-between gap-3 text-xs"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <img
                                            src={b.avatar}
                                            alt={b.name}
                                            className="h-9 w-9 rounded-full object-cover shrink-0 border border-stone-200"
                                        />
                                        <div className="min-w-0">
                                            <span className="font-bold text-[#12161A] block truncate">
                                                {b.name}
                                            </span>
                                            <span className="text-[10px] text-[#706861] block truncate">
                                                {b.property}
                                            </span>
                                            <span className="text-[10px] text-[#8C827A] block mt-0.5">
                                                {b.dates}
                                            </span>
                                        </div>
                                    </div>
                                    <span
                                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                            b.status === 'Confirmed'
                                                ? 'bg-stone-200/80 text-[#12161A] border border-stone-300/60'
                                                : 'bg-stone-100 text-stone-600 border border-stone-200'
                                        }`}
                                    >
                                        {b.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CARD 3: CALENDAR WIDGET */}
                    <div className="rounded-3xl border border-[#EBE7E1] bg-white p-5 sm:p-6 shadow-2xs">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-bold text-[#12161A]">Calendar</h2>
                            <div className="flex items-center gap-1.5 text-xs text-[#706861]">
                                <span className="font-semibold text-[#12161A]">{selectedMonth}</span>
                                <div className="flex items-center gap-0.5 ml-1">
                                    <button className="h-6 w-6 rounded-lg border border-stone-200 flex items-center justify-center hover:bg-stone-50 cursor-pointer">
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                    </button>
                                    <button className="h-6 w-6 rounded-lg border border-stone-200 flex items-center justify-center hover:bg-stone-50 cursor-pointer">
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Calendar 7-Day Grid */}
                        <div className="grid grid-cols-7 gap-1 text-center text-xs">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                                <div key={day} className="py-1 text-[11px] font-bold text-[#8C827A]">
                                    {day}
                                </div>
                            ))}

                            {/* Blank filler for month start */}
                            <div className="py-1.5 text-stone-300">28</div>
                            <div className="py-1.5 text-stone-300">29</div>
                            <div className="py-1.5 text-stone-300">30</div>

                            {/* Days 1 to 31 */}
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                                const isCurrent = day === 21; // Today
                                const isBooked = [21, 25, 26, 27].includes(day);
                                return (
                                    <div
                                        key={day}
                                        className={`py-1.5 rounded-xl text-xs font-semibold relative transition-all cursor-pointer ${
                                            isCurrent
                                                ? 'bg-[#12161A] text-white font-bold shadow-2xs'
                                                : isBooked
                                                ? 'bg-[#F4F1EA] text-[#12161A] font-bold'
                                                : 'text-stone-700 hover:bg-stone-100'
                                        }`}
                                    >
                                        <span>{day}</span>
                                        {isBooked && !isCurrent && (
                                            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#12161A]" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL: PROPERTY DETAILS QUICK VIEW */}
            <AnimatePresence>
                {activePropertyModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-4"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#706861]">
                                        {activePropertyModal.type}
                                    </span>
                                    <h3 className="text-xl font-bold text-[#12161A]">
                                        {activePropertyModal.name}
                                    </h3>
                                    <p className="text-xs text-[#706861] mt-0.5 flex items-center gap-1">
                                        <MapPin className="h-3 w-3 text-stone-400" />
                                        <span>{activePropertyModal.location}</span>
                                    </p>
                                </div>
                                <button
                                    onClick={() => setActivePropertyModal(null)}
                                    className="h-8 w-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:text-[#12161A] cursor-pointer"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="h-48 rounded-2xl overflow-hidden bg-stone-100">
                                <img
                                    src={activePropertyModal.cover_image}
                                    alt={activePropertyModal.name}
                                    className="h-full w-full object-cover"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="p-3 rounded-2xl bg-[#FBF9F5] border border-[#EBE7E1]">
                                    <span className="text-[10px] uppercase font-bold text-[#8C827A]">Monthly Rent</span>
                                    <p className="text-sm font-bold text-[#12161A] mt-0.5">{formatTZS(activePropertyModal.monthly_rent)}</p>
                                </div>
                                <div className="p-3 rounded-2xl bg-[#FBF9F5] border border-[#EBE7E1]">
                                    <span className="text-[10px] uppercase font-bold text-[#8C827A]">Occupancy</span>
                                    <p className="text-sm font-bold text-[#12161A] mt-0.5">{activePropertyModal.status}</p>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                                <button
                                    onClick={() => {
                                        const id = activePropertyModal.id;
                                        setActivePropertyModal(null);
                                        window.location.href = `/property/${id}`;
                                    }}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#12161A] hover:underline"
                                >
                                    <span>Public Listing View</span>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </button>

                                <button
                                    onClick={() => {
                                        setActivePropertyModal(null);
                                        onNavigate('properties');
                                    }}
                                    className="rounded-full bg-[#12161A] px-5 py-2.5 text-xs font-bold text-white hover:bg-stone-800 transition-all cursor-pointer"
                                >
                                    Manage Property Units
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

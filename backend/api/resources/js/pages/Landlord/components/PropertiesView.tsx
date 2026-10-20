import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, Plus, Search, Filter, LayoutGrid, List,
    MapPin, Bed, Bath, ArrowUpRight, CheckCircle2, ChevronRight,
    Users, Wallet, Eye, MoreHorizontal, FileText, Check, X, Sparkles,
    Zap, Navigation, ExternalLink
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

interface PropertiesViewProps {
    properties: Property[];
    onOpenAddProperty: () => void;
    onNavigateAgreements: () => void;
}

export default function PropertiesView({
    properties,
    onOpenAddProperty,
    onNavigateAgreements,
}: PropertiesViewProps) {
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [filterCategory, setFilterCategory] = useState<'all' | 'house' | 'apartment' | 'vacant'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPropertyDetails, setSelectedPropertyDetails] = useState<Property | null>(null);
    const [propertyModalTab, setPropertyModalTab] = useState<'overview' | 'units' | 'location'>('overview');

    const filtered = properties.filter((p) => {
        const matchesCategory =
            filterCategory === 'all'
                ? true
                : filterCategory === 'house'
                ? p.type.toLowerCase().includes('house')
                : filterCategory === 'apartment'
                ? p.type.toLowerCase().includes('apartment')
                : p.vacant_units > 0;

        const matchesSearch =
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.location.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesCategory && matchesSearch;
    });

    const formatTZS = (num: number) => {
        return 'TZS ' + Number(num || 0).toLocaleString();
    };

    const totalUnits = properties.reduce((acc, p) => acc + (p.total_units || 0), 0);
    const totalOccupied = properties.reduce((acc, p) => acc + (p.occupied_units || 0), 0);
    const totalVacant = properties.reduce((acc, p) => acc + (p.vacant_units || 0), 0);
    const totalMonthlyRevenue = properties.reduce((acc, p) => acc + (p.monthly_rent || 0), 0);

    return (
        <div className="space-y-6 pb-12">
            {/* Header & Metric Bar */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Properties Portfolio</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Manage your compounds, multi-unit apartments, and individual residential leases
                    </p>
                </div>

                <button
                    onClick={onOpenAddProperty}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all active:scale-95"
                >
                    <Plus className="h-4 w-4" />
                    Add New Property
                </button>
            </div>

            {/* Quick KPI Strip */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Portfolio Size</span>
                    <div className="text-lg font-extrabold text-slate-900 mt-0.5">{properties.length} Properties</div>
                    <span className="text-[10px] text-slate-500">{totalUnits} total rooms/units</span>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Occupied Units</span>
                    <div className="text-lg font-extrabold text-emerald-600 mt-0.5">{totalOccupied} Occupied</div>
                    <span className="text-[10px] text-slate-500">{Math.round((totalOccupied / (totalUnits || 1)) * 100)}% portfolio rate</span>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Vacant Available</span>
                    <div className="text-lg font-extrabold text-blue-600 mt-0.5">{totalVacant} Vacant</div>
                    <span className="text-[10px] text-slate-500">Ready for tenancy</span>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Monthly Potential</span>
                    <div className="text-lg font-extrabold text-slate-900 mt-0.5">{formatTZS(totalMonthlyRevenue)}</div>
                    <span className="text-[10px] text-slate-500">Gross monthly revenue</span>
                </div>
            </div>

            {/* Filters & Search Toolbar */}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search properties by name, ward, or district..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 py-2 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                    />
                </div>

                {/* Category Pills */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs">
                        <button
                            onClick={() => setFilterCategory('all')}
                            className={`rounded-lg px-3 py-1 font-semibold transition-all ${
                                filterCategory === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            All ({properties.length})
                        </button>
                        <button
                            onClick={() => setFilterCategory('house')}
                            className={`rounded-lg px-3 py-1 font-semibold transition-all ${
                                filterCategory === 'house' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Houses
                        </button>
                        <button
                            onClick={() => setFilterCategory('apartment')}
                            className={`rounded-lg px-3 py-1 font-semibold transition-all ${
                                filterCategory === 'apartment' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Apartments
                        </button>
                        <button
                            onClick={() => setFilterCategory('vacant')}
                            className={`rounded-lg px-3 py-1 font-semibold transition-all ${
                                filterCategory === 'vacant' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Has Vacancy
                        </button>
                    </div>

                    {/* View Switcher Toggle */}
                    <div className="inline-flex rounded-xl border border-slate-200 p-0.5">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`rounded-lg p-1.5 transition-all ${
                                viewMode === 'grid' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                            }`}
                            title="Airbnb Grid View"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`rounded-lg p-1.5 transition-all ${
                                viewMode === 'table' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                            }`}
                            title="Linear Table View"
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Display: Grid (Airbnb Style) or Table (Linear Style) */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((property) => {
                        const occupancyPct = property.total_units > 0 
                            ? Math.round((property.occupied_units / property.total_units) * 100) 
                            : 80;

                        return (
                            <div
                                key={property.id}
                                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:shadow-xl transition-all duration-300"
                            >
                                {/* Photo Container with 16:10.5 Ratio */}
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
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                                            <span className={`h-1.5 w-1.5 rounded-full ${property.vacant_units === 0 ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                                            {property.status}
                                        </span>
                                    </div>

                                    {/* Bottom Right Units Pill */}
                                    <div className="absolute bottom-3 right-3">
                                        <span className="rounded-lg bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-900 shadow-xs">
                                            {property.occupied_units}/{property.total_units} Units
                                        </span>
                                    </div>
                                </div>

                                {/* Body Info */}
                                <div className="flex flex-1 flex-col p-5">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-base line-clamp-1">
                                                {property.name}
                                            </h3>
                                            <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                                                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                {property.location}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Occupancy Bar */}
                                    <div className="mt-4">
                                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                                            <span>Occupancy Rate</span>
                                            <span className="font-bold text-slate-800">{occupancyPct}%</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
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

                                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-slate-400">Monthly Rent</span>
                                            <p className="text-base font-extrabold text-slate-900">
                                                {formatTZS(property.monthly_rent)}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => setSelectedPropertyDetails(property)}
                                                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
                                            >
                                                Details
                                            </button>
                                            <button
                                                onClick={onNavigateAgreements}
                                                className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-xs"
                                            >
                                                Lease
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Table View (Linear style) */
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <th className="py-3 px-4">Property</th>
                                <th className="py-3 px-4">Type</th>
                                <th className="py-3 px-4">Location</th>
                                <th className="py-3 px-4">Units</th>
                                <th className="py-3 px-4">Occupancy</th>
                                <th className="py-3 px-4">Monthly Rent</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map((property) => (
                                <tr key={property.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={property.cover_image}
                                                alt={property.name}
                                                className="h-10 w-14 rounded-lg object-cover"
                                            />
                                            <span>{property.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-4 text-slate-600">{property.type}</td>
                                    <td className="py-3.5 px-4 text-slate-500">{property.location}</td>
                                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                                        {property.occupied_units} / {property.total_units}
                                    </td>
                                    <td className="py-3.5 px-4">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                            property.vacant_units === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                                        }`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${property.vacant_units === 0 ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                            {property.status}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 font-bold text-slate-900">
                                        {formatTZS(property.monthly_rent)}
                                    </td>
                                    <td className="py-3.5 px-4 text-right">
                                        <button
                                            onClick={() => setSelectedPropertyDetails(property)}
                                            className="rounded-lg border border-slate-200 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-100 transition-all mr-2"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={onNavigateAgreements}
                                            className="rounded-lg bg-slate-900 px-3 py-1 font-semibold text-white hover:bg-slate-800 transition-all"
                                        >
                                            Agreements
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Cityscape Architectural Property Details Modal (No Header) */}
            <AnimatePresence>
                {selectedPropertyDetails && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl p-6 sm:p-7"
                        >
                            {/* Floating Minimal Close Button */}
                            <button
                                onClick={() => setSelectedPropertyDetails(null)}
                                className="absolute right-4 top-4 sm:right-6 sm:top-6 z-20 h-9 w-9 rounded-full bg-white/90 border border-slate-200 shadow-xs flex items-center justify-center text-slate-700 hover:bg-slate-900 hover:text-white transition-all cursor-pointer"
                                title="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            {/* Cityscape Multi-Photo Architectural Showcase */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 rounded-2xl overflow-hidden mb-5">
                                <div className="relative md:col-span-2 aspect-16/10 overflow-hidden rounded-xl bg-slate-100">
                                    <img
                                        src={selectedPropertyDetails.cover_image}
                                        alt={selectedPropertyDetails.name}
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute bottom-3 left-3">
                                        <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                                            {selectedPropertyDetails.type} • {selectedPropertyDetails.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="hidden md:flex flex-col gap-2">
                                    <div className="relative h-full aspect-16/9 overflow-hidden rounded-xl bg-slate-100">
                                        <img
                                            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80"
                                            alt="Interior Living"
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="relative h-full aspect-16/9 overflow-hidden rounded-xl bg-slate-100">
                                        <img
                                            src="https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&auto=format&fit=crop&q=80"
                                            alt="Master Suite"
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
                                    <div>
                                        <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                                            {selectedPropertyDetails.type}
                                        </span>
                                        <h3 className="text-xl font-bold text-slate-900">{selectedPropertyDetails.name}</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">{selectedPropertyDetails.location}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold uppercase text-slate-400">Monthly Rent</span>
                                        <p className="text-lg font-bold text-slate-900">{formatTZS(selectedPropertyDetails.monthly_rent)}</p>
                                    </div>
                                </div>

                                {/* Cityscape Subnav Tabs */}
                                <div className="flex gap-2 border-b border-slate-100 pb-2">
                                    {[
                                        { id: 'overview', label: 'Overview' },
                                        { id: 'units', label: `Units & Meters (${selectedPropertyDetails.total_units})` },
                                        { id: 'location', label: 'Location & Map' },
                                    ].map((tab) => {
                                        const isActive = propertyModalTab === tab.id;
                                        return (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => setPropertyModalTab(tab.id as any)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                                    isActive
                                                        ? 'bg-slate-900 text-white'
                                                        : 'text-slate-600 hover:bg-slate-100'
                                                }`}
                                            >
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* TAB 1: OVERVIEW */}
                                {propertyModalTab === 'overview' && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-3 gap-3 rounded-2xl bg-slate-50 p-4 text-center border border-slate-100">
                                            <div>
                                                <span className="text-[11px] font-semibold text-slate-400">Total Units</span>
                                                <p className="text-base font-bold text-slate-900 mt-0.5">{selectedPropertyDetails.total_units}</p>
                                            </div>
                                            <div>
                                                <span className="text-[11px] font-semibold text-slate-400">Occupied</span>
                                                <p className="text-base font-bold text-emerald-600 mt-0.5">{selectedPropertyDetails.occupied_units}</p>
                                            </div>
                                            <div>
                                                <span className="text-[11px] font-semibold text-slate-400">STS Submeters</span>
                                                <p className="text-base font-bold text-blue-600 mt-0.5">Active</p>
                                            </div>
                                        </div>

                                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
                                            <span className="font-bold text-slate-900 block">Property Specifications</span>
                                            <p>{selectedPropertyDetails.specs || 'Modern residential property with certified STS LUKU submeters and high-speed internet.'}</p>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 2: UNITS & STS METERS */}
                                {propertyModalTab === 'units' && (
                                    <div className="space-y-2 max-h-56 overflow-y-auto">
                                        {Array.from({ length: selectedPropertyDetails.total_units }).map((_, i) => {
                                            const isOccupied = i < selectedPropertyDetails.occupied_units;
                                            return (
                                                <div
                                                    key={i}
                                                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white shadow-2xs"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                                            isOccupied ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                                        }`}>
                                                            U{i + 1}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-900">Unit {i + 1} Suite</p>
                                                            <p className="text-[10px] text-slate-400">
                                                                STS Meter #{241000 + selectedPropertyDetails.id * 100 + i} • {isOccupied ? 'Tenant Active' : 'Vacant'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                                        isOccupied ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                                    }`}>
                                                        {isOccupied ? 'Occupied' : 'Vacant'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* TAB 3: LOCATION & MAP */}
                                {propertyModalTab === 'location' && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-slate-600">
                                                Location: <strong className="text-slate-900">{selectedPropertyDetails.location}</strong>
                                            </p>
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                    `${selectedPropertyDetails.location}, Tanzania`
                                                )}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
                                            >
                                                <span>Open in Maps</span>
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>

                                        <div className="relative w-full h-56 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs">
                                            <iframe
                                                title="Landlord Property Map"
                                                className="w-full h-full border-0"
                                                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                                                    `${selectedPropertyDetails.location}, Tanzania`
                                                )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                                loading="lazy"
                                                allowFullScreen
                                            />
                                            <div className="absolute top-2 left-2 pointer-events-none">
                                                <span className="rounded-lg bg-black/75 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md flex items-center gap-1">
                                                    <Navigation className="h-3 w-3 text-emerald-400" />
                                                    <span>{selectedPropertyDetails.location}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        onClick={() => {
                                            setSelectedPropertyDetails(null);
                                            onNavigateAgreements();
                                        }}
                                        className="flex-1 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
                                    >
                                        Draft Tenancy Agreement
                                    </button>
                                    <button
                                        onClick={() => setSelectedPropertyDetails(null)}
                                        className="rounded-xl border border-slate-200 px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                                    >
                                        Close
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

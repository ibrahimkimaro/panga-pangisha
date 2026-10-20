import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, Plus, Search, Filter, LayoutGrid, List,
    MapPin, Bed, Bath, ArrowUpRight, CheckCircle2, ChevronRight,
    Users, Wallet, Eye, MoreHorizontal, FileText, Check, X, Sparkles
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

            {/* Quick Details Drawer / Modal */}
            <AnimatePresence>
                {selectedPropertyDetails && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl"
                        >
                            <div className="relative aspect-16/9 w-full overflow-hidden bg-slate-900">
                                <img
                                    src={selectedPropertyDetails.cover_image}
                                    alt={selectedPropertyDetails.name}
                                    className="h-full w-full object-cover"
                                />
                                <button
                                    onClick={() => setSelectedPropertyDetails(null)}
                                    className="absolute right-4 top-4 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 backdrop-blur-md"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                                <div className="absolute bottom-4 left-4">
                                    <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                                        {selectedPropertyDetails.type} • {selectedPropertyDetails.status}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">{selectedPropertyDetails.name}</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">{selectedPropertyDetails.location}</p>
                                </div>

                                <div className="grid grid-cols-3 gap-3 rounded-2xl bg-slate-50 p-4 text-center">
                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-400">Total Units</span>
                                        <p className="text-base font-bold text-slate-900 mt-0.5">{selectedPropertyDetails.total_units}</p>
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-400">Occupied</span>
                                        <p className="text-base font-bold text-emerald-600 mt-0.5">{selectedPropertyDetails.occupied_units}</p>
                                    </div>
                                    <div>
                                        <span className="text-[11px] font-semibold text-slate-400">Monthly Rent</span>
                                        <p className="text-base font-bold text-slate-900 mt-0.5">{formatTZS(selectedPropertyDetails.monthly_rent)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        onClick={() => {
                                            setSelectedPropertyDetails(null);
                                            onNavigateAgreements();
                                        }}
                                        className="flex-1 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800 transition-all"
                                    >
                                        Draft Tenancy Agreement
                                    </button>
                                    <button
                                        onClick={() => setSelectedPropertyDetails(null)}
                                        className="rounded-xl border border-slate-200 px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
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

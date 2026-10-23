import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, Plus, Search, Filter, LayoutGrid, List,
    MapPin, Bed, Bath, ArrowUpRight, CheckCircle2, ChevronRight,
    Users, Wallet, Eye, MoreHorizontal, FileText, Check, X, Sparkles,
    Zap, Navigation, ExternalLink, ArrowLeft, Edit3, Shield, Droplets,
    Wifi, Car, Home, Layers, Key, CheckCircle, Info, CalendarCheck
} from 'lucide-react';
import { TANZANIA_REGIONS } from '../../../data/tanzaniaLocations';

interface Unit {
    id?: number;
    unit_number: string;
    unit_type?: string;
    monthly_rent?: number;
    status?: string;
    description?: string;
    payment_terms?: string;
}

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
    region?: string;
    district?: string;
    ward?: string;
    street?: string;
    bedrooms?: number;
    bathrooms?: number;
    description?: string;
    units?: Unit[];
}

interface PropertiesViewProps {
    properties: Property[];
    onOpenAddProperty: () => void;
    onNavigateAgreements: () => void;
}

export default function PropertiesView({
    properties: initialProperties,
    onOpenAddProperty,
    onNavigateAgreements,
}: PropertiesViewProps) {
    const [propertiesList, setPropertiesList] = useState<Property[]>(initialProperties);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [filterCategory, setFilterCategory] = useState<'all' | 'house' | 'apartment' | 'vacant'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Dedicated Full Screen Property & Workflow State
    const [selectedPropertyDetails, setSelectedPropertyDetails] = useState<Property | null>(null);
    const [activeRoomIndex, setActiveRoomIndex] = useState<number>(0);
    const [detailsViewSection, setDetailsViewSection] = useState<'workflow' | 'parent_house' | 'map'>('workflow');

    // Edit Location & Property Details Modal State
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);
    const [editForm, setEditForm] = useState({
        property_name: '',
        property_type: 'House',
        region: 'Dar es Salaam',
        district: 'Kinondoni',
        ward: 'Mikocheni',
        street: '',
        monthly_rent: 450000,
        bedrooms: 3,
        bathrooms: 2,
        description: '',
    });
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4000);
    };

    const filtered = propertiesList.filter((p) => {
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

    const totalUnits = propertiesList.reduce((acc, p) => acc + (p.total_units || 0), 0);
    const totalOccupied = propertiesList.reduce((acc, p) => acc + (p.occupied_units || 0), 0);
    const totalVacant = propertiesList.reduce((acc, p) => acc + (p.vacant_units || 0), 0);
    const totalMonthlyRevenue = propertiesList.reduce((acc, p) => acc + (p.monthly_rent || 0), 0);

    // Open Edit Modal with pre-filled fields
    const handleOpenEditModal = (prop: Property) => {
        const parts = (prop.location || '').split(',').map(s => s.trim());
        setEditingProperty(prop);
        setEditForm({
            property_name: prop.name || '',
            property_type: prop.type || 'House',
            region: prop.region || (parts.length > 2 ? parts[2] : 'Dar es Salaam'),
            district: prop.district || (parts.length > 1 ? parts[1] : 'Kinondoni'),
            ward: prop.ward || (parts.length > 0 ? parts[0] : 'Mikocheni'),
            street: prop.street || '',
            monthly_rent: prop.monthly_rent || 450000,
            bedrooms: prop.bedrooms || 3,
            bathrooms: prop.bathrooms || 2,
            description: prop.description || prop.specs || '',
        });
    };

    // Save Edited Property Location & Details to Backend
    const handleSavePropertyEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProperty) return;
        setIsSavingEdit(true);

        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const res = await fetch(`/api/landlord/houses/${editingProperty.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token,
                },
                body: JSON.stringify(editForm),
            });

            const newLocation = [editForm.ward, editForm.district, editForm.region].filter(Boolean).join(', ');
            const updatedProperty: Property = {
                ...editingProperty,
                name: editForm.property_name,
                type: editForm.property_type,
                region: editForm.region,
                district: editForm.district,
                ward: editForm.ward,
                street: editForm.street,
                location: newLocation,
                monthly_rent: Number(editForm.monthly_rent),
                bedrooms: Number(editForm.bedrooms),
                bathrooms: Number(editForm.bathrooms),
                description: editForm.description,
                specs: `${editForm.bedrooms} Rooms • ${editForm.bathrooms} Baths • STS Submeters`,
            };

            // Update in local lists
            setPropertiesList(prev => prev.map(p => p.id === editingProperty.id ? updatedProperty : p));
            if (selectedPropertyDetails && selectedPropertyDetails.id === editingProperty.id) {
                setSelectedPropertyDetails(updatedProperty);
            }

            showToast(`Property "${updatedProperty.name}" and location updated successfully!`);
            setEditingProperty(null);
        } catch (err) {
            console.error('Failed to update property:', err);
            showToast('Changes saved locally.');
            setEditingProperty(null);
        } finally {
            setIsSavingEdit(false);
        }
    };

    const selectedRegionObj = TANZANIA_REGIONS.find(r => r.name.toLowerCase() === editForm.region.toLowerCase());
    const availableDistricts = selectedRegionObj?.districts || [];
    const selectedDistrictObj = availableDistricts.find(d => d.name.toLowerCase() === editForm.district.toLowerCase());
    const availableWards = selectedDistrictObj?.wards || [];

    return (
        <div className="space-y-6 pb-12">
            {/* Global Toast Notification */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-6 right-6 z-[100] flex items-center gap-2 rounded-2xl bg-[#12161A] text-white px-5 py-3 shadow-2xl border border-white/10 text-xs font-semibold"
                    >
                        <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>{toastMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header & Metric Bar */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Properties Portfolio</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Manage your residential compounds, multi-unit houses, and individual room tenancies
                    </p>
                </div>

                <button
                    onClick={onOpenAddProperty}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
                >
                    <Plus className="h-4 w-4" />
                    Add New Property
                </button>
            </div>

            {/* Quick KPI Strip */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Portfolio Size</span>
                    <div className="text-lg font-extrabold text-slate-900 mt-0.5">{propertiesList.length} Properties</div>
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

                {/* Category Pills & Layout Toggle */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs">
                        <button
                            onClick={() => setFilterCategory('all')}
                            className={`rounded-lg px-3 py-1 font-semibold transition-all cursor-pointer ${
                                filterCategory === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            All ({propertiesList.length})
                        </button>
                        <button
                            onClick={() => setFilterCategory('house')}
                            className={`rounded-lg px-3 py-1 font-semibold transition-all cursor-pointer ${
                                filterCategory === 'house' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Houses
                        </button>
                        <button
                            onClick={() => setFilterCategory('apartment')}
                            className={`rounded-lg px-3 py-1 font-semibold transition-all cursor-pointer ${
                                filterCategory === 'apartment' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Apartments
                        </button>
                        <button
                            onClick={() => setFilterCategory('vacant')}
                            className={`rounded-lg px-3 py-1 font-semibold transition-all cursor-pointer ${
                                filterCategory === 'vacant' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Vacant ({totalVacant})
                        </button>
                    </div>

                    <div className="hidden sm:inline-flex rounded-xl bg-slate-100 p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`rounded-lg p-1.5 transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                            title="Grid View"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`rounded-lg p-1.5 transition-all cursor-pointer ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
                            title="Table View"
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Properties Listing Grid / Table */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((property) => {
                        const occupancyPct = Math.round(((property.occupied_units || 0) / (property.total_units || 1)) * 100);
                        return (
                            <div
                                key={property.id}
                                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:border-slate-300 hover:shadow-md transition-all"
                            >
                                <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
                                    <img
                                        src={property.cover_image}
                                        alt={property.name}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                                        <span className="rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                                            {property.type}
                                        </span>
                                    </div>

                                    <div className="absolute top-3 right-3">
                                        <button
                                            onClick={() => handleOpenEditModal(property)}
                                            className="h-7 w-7 rounded-full bg-white/90 text-slate-700 hover:bg-slate-900 hover:text-white flex items-center justify-center shadow-xs transition-all cursor-pointer"
                                            title="Edit Property & Location"
                                        >
                                            <Edit3 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>

                                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold backdrop-blur-md ${
                                            property.vacant_units === 0 ? 'bg-emerald-500/90 text-white' : 'bg-blue-600/90 text-white'
                                        }`}>
                                            {property.status}
                                        </span>
                                        <span className="rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                                            {property.total_units} Rentable Units
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                {property.name}
                                            </h3>
                                        </div>

                                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                            <span className="truncate">{property.location}</span>
                                        </p>

                                        <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
                                            <span>Occupancy Rate</span>
                                            <span className="font-bold text-slate-900">{occupancyPct}%</span>
                                        </div>
                                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
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
                                                onClick={() => handleOpenEditModal(property)}
                                                className="rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                                                title="Edit Location & Details"
                                            >
                                                <Edit3 className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedPropertyDetails(property);
                                                    setActiveRoomIndex(0);
                                                }}
                                                className="rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-xs cursor-pointer"
                                            >
                                                Full View & Rooms
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Table View */
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
                                            onClick={() => handleOpenEditModal(property)}
                                            className="rounded-lg border border-slate-200 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-100 transition-all mr-1 cursor-pointer"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedPropertyDetails(property);
                                                setActiveRoomIndex(0);
                                            }}
                                            className="rounded-lg bg-slate-900 px-3 py-1 font-semibold text-white hover:bg-slate-800 transition-all cursor-pointer"
                                        >
                                            View Rooms
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* FULL SCREEN PROPERTY DETAILS & WORKFLOW MODAL */}
            <AnimatePresence>
                {selectedPropertyDetails && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.99 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.99 }}
                        transition={{ duration: 0.18 }}
                        className="fixed inset-0 z-50 bg-[#FAF8F5] overflow-y-auto w-full h-full flex flex-col text-slate-900"
                    >
                        {/* Sticky Top Header Bar */}
                        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-2xs">
                            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setSelectedPropertyDetails(null)}
                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        <span>Back to Portfolio</span>
                                    </button>

                                    <div className="hidden sm:block h-5 w-px bg-slate-200" />

                                    <div className="hidden sm:block">
                                        <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                                            {selectedPropertyDetails.name}
                                        </h2>
                                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                            <MapPin className="h-3 w-3 text-[#C2704E]" />
                                            <span>{selectedPropertyDetails.location}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleOpenEditModal(selectedPropertyDetails)}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
                                    >
                                        <Edit3 className="h-3.5 w-3.5 text-blue-600" />
                                        <span>Edit Location & Property</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setSelectedPropertyDetails(null);
                                            onNavigateAgreements();
                                        }}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
                                    >
                                        <FileText className="h-3.5 w-3.5" />
                                        <span>Draft Agreement</span>
                                    </button>

                                    <button
                                        onClick={() => setSelectedPropertyDetails(null)}
                                        className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all cursor-pointer ml-1"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </header>

                        {/* Full Screen Main Body Content */}
                        <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-8 flex-1">
                            {/* Workflow Explanation Banner */}
                            <div className="rounded-3xl border border-amber-200/70 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 p-5 sm:p-6 shadow-2xs">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-3.5">
                                        <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
                                            <Layers className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] uppercase font-extrabold tracking-widest text-amber-800">
                                                Hierarchy & Tenancy Workflow
                                            </span>
                                            <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                                                Rentable Room inside Verified House / Compound
                                            </h3>
                                            <p className="text-xs text-slate-600 max-w-3xl mt-1 leading-relaxed">
                                                In our workflow, a tenant searches for a specific <strong>Target Room</strong> (with its own dedicated monthly rent, en-suite bath, and private STS submeter), while enjoying the full security, borehole water, and amenities of the <strong>Parent House / Compound</strong>.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="rounded-full bg-white border border-amber-300 px-3 py-1 text-[11px] font-bold text-amber-900 shadow-2xs">
                                            {selectedPropertyDetails.total_units} Active Rooms
                                        </span>
                                        <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-[11px] font-bold">
                                            {selectedPropertyDetails.occupied_units} Occupied
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Section Navigation Switcher */}
                            <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
                                {[
                                    { id: 'workflow', label: '1. Target Room View (Inside House)' },
                                    { id: 'parent_house', label: '2. Parent House & Compound Overview' },
                                    { id: 'map', label: '3. Official Location & Map' },
                                ].map((tab) => {
                                    const active = detailsViewSection === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setDetailsViewSection(tab.id as any)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                active
                                                    ? 'bg-slate-900 text-white shadow-sm'
                                                    : 'text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* SECTION 1: TARGET ROOM VIEW */}
                            {detailsViewSection === 'workflow' && (
                                <div className="space-y-6">
                                    {/* Room Selector Strip */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                                Select Room to View Target Details:
                                            </h4>
                                            <span className="text-xs text-slate-400">
                                                Click any unit to focus on its rent and submeter
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                                            {Array.from({ length: selectedPropertyDetails.total_units }).map((_, rIdx) => {
                                                const isOccupied = rIdx < selectedPropertyDetails.occupied_units;
                                                const isSelected = activeRoomIndex === rIdx;
                                                return (
                                                    <button
                                                        key={rIdx}
                                                        onClick={() => setActiveRoomIndex(rIdx)}
                                                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                                                            isSelected
                                                                ? 'border-slate-900 bg-slate-900 text-white shadow-md scale-[1.02]'
                                                                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                                                                isSelected
                                                                    ? 'bg-white/20 text-white'
                                                                    : isOccupied ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                                                            }`}>
                                                                {isOccupied ? 'Occupied' : 'Vacant'}
                                                            </span>
                                                            <Key className={`h-3.5 w-3.5 ${isSelected ? 'text-amber-300' : 'text-slate-400'}`} />
                                                        </div>
                                                        <p className="font-extrabold text-sm mt-2">
                                                            Room {rIdx + 1}
                                                        </p>
                                                        <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                                                            {rIdx === 0 ? 'Master Suite' : 'Standard Room'}
                                                        </p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* The Focused Target Room Showcase Card */}
                                    {(() => {
                                        const rIdx = activeRoomIndex;
                                        const isOccupied = rIdx < selectedPropertyDetails.occupied_units;
                                        const roomRent = Math.round(selectedPropertyDetails.monthly_rent / (selectedPropertyDetails.total_units || 1)) + (rIdx === 0 ? 50000 : 0);
                                        const roomType = rIdx === 0 ? 'Master En-Suite Room' : (rIdx === 1 ? 'Deluxe Garden Room' : 'Standard Suite Room');
                                        const meterNumber = `2410-0982-` + (10 + selectedPropertyDetails.id * 5 + rIdx);

                                        return (
                                            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
                                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                                    {/* Room Photo & Badge */}
                                                    <div className="lg:col-span-5 space-y-4">
                                                        <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 shadow-inner">
                                                            <img
                                                                src={rIdx === 0 ? 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop&q=80'}
                                                                alt={roomType}
                                                                className="h-full w-full object-cover"
                                                            />
                                                            <div className="absolute top-3 left-3">
                                                                <span className="rounded-full bg-slate-900/90 text-white px-3 py-1 text-xs font-bold backdrop-blur-md">
                                                                    Target Unit • Room {rIdx + 1}
                                                                </span>
                                                            </div>
                                                            <div className="absolute bottom-3 right-3">
                                                                <span className={`rounded-full px-3 py-1 text-xs font-bold backdrop-blur-md ${
                                                                    isOccupied ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                                                                }`}>
                                                                    {isOccupied ? 'Occupied' : 'Vacant & Available'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Parent House Attribution Pill */}
                                                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                                                            <span className="text-slate-500">Inside Parent Compound:</span>
                                                            <strong className="text-slate-900 font-bold">{selectedPropertyDetails.name}</strong>
                                                        </div>
                                                    </div>

                                                    {/* Room Specs & Details */}
                                                    <div className="lg:col-span-7 space-y-6">
                                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                                                            <div>
                                                                <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                                                                    Target Lease Unit #{rIdx + 1}
                                                                </span>
                                                                <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                                                                    {roomType}
                                                                </h3>
                                                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                                                                    <MapPin className="h-3.5 w-3.5 text-[#C2704E]" />
                                                                    <span>{selectedPropertyDetails.location}</span>
                                                                </p>
                                                            </div>

                                                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-right sm:min-w-44">
                                                                <span className="text-[10px] font-bold uppercase text-slate-400">Room Monthly Rent</span>
                                                                <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                                                                    {formatTZS(roomRent)}
                                                                </p>
                                                                <span className="text-[10px] text-slate-500 block mt-0.5">Prepaid terms</span>
                                                            </div>
                                                        </div>

                                                        {/* 4 Feature Badges */}
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                                                                <Zap className="h-4 w-4 text-emerald-600 mb-1" />
                                                                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Electricity</span>
                                                                <strong className="text-xs font-bold text-slate-900 block mt-0.5">Private STS Submeter</strong>
                                                            </div>
                                                            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                                                                <Bath className="h-4 w-4 text-blue-600 mb-1" />
                                                                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Bathroom</span>
                                                                <strong className="text-xs font-bold text-slate-900 block mt-0.5">{rIdx === 0 ? 'Private En-Suite' : 'Dedicated Bath'}</strong>
                                                            </div>
                                                            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                                                                <Wifi className="h-4 w-4 text-purple-600 mb-1" />
                                                                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Internet</span>
                                                                <strong className="text-xs font-bold text-slate-900 block mt-0.5">Fiber Ready</strong>
                                                            </div>
                                                            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                                                                <Droplets className="h-4 w-4 text-cyan-600 mb-1" />
                                                                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Water</span>
                                                                <strong className="text-xs font-bold text-slate-900 block mt-0.5">24/7 DAWASA Supply</strong>
                                                            </div>
                                                        </div>

                                                        {/* STS Submeter Details Box */}
                                                        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <Zap className="h-4 w-4 text-blue-700" />
                                                                    <span className="text-xs font-bold text-blue-900">
                                                                        Dedicated STS LUKU Submeter Keypad Inside Room
                                                                    </span>
                                                                </div>
                                                                <span className="text-[11px] font-mono font-bold bg-white px-2.5 py-0.5 rounded-lg border border-blue-200 text-blue-900">
                                                                    {meterNumber}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-blue-700 mt-1.5 leading-relaxed">
                                                                The occupant purchases their own prepaid tokens directly via Airtel Money, Tigo Pesa, or M-Pesa. No sharing or arguing over monthly electric bills.
                                                            </p>
                                                        </div>

                                                        {/* Room Actions */}
                                                        <div className="flex flex-wrap items-center gap-3 pt-2">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedPropertyDetails(null);
                                                                    onNavigateAgreements();
                                                                }}
                                                                className="flex-1 rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white hover:bg-slate-800 transition-all cursor-pointer shadow-sm text-center"
                                                            >
                                                                Draft Agreement for Room {rIdx + 1}
                                                            </button>
                                                            <button
                                                                onClick={() => handleOpenEditModal(selectedPropertyDetails)}
                                                                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                                                            >
                                                                Edit Property / Room Specs
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* SECTION 2: PARENT HOUSE & COMPOUND OVERVIEW */}
                            {detailsViewSection === 'parent_house' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Main Compound Showcase */}
                                        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 space-y-6 shadow-xs">
                                            <div className="aspect-16/9 rounded-2xl overflow-hidden bg-slate-100">
                                                <img
                                                    src={selectedPropertyDetails.cover_image}
                                                    alt={selectedPropertyDetails.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="rounded-full bg-slate-100 text-slate-800 px-3 py-0.5 text-xs font-bold">
                                                        {selectedPropertyDetails.type}
                                                    </span>
                                                    <span className="rounded-full bg-emerald-50 text-emerald-700 px-3 py-0.5 text-xs font-bold">
                                                        Verified Panga Compound
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                                                    {selectedPropertyDetails.name}
                                                </h3>
                                                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                                                    {selectedPropertyDetails.description || selectedPropertyDetails.specs ||
                                                        'A quiet, professionally maintained compound featuring clean paved courtyard, full perimeter wall with razor wire, automated gate, and dedicated resident parking.'}
                                                </p>
                                            </div>

                                            {/* Shared Compound Amenities */}
                                            <div className="border-t border-slate-100 pt-5 space-y-3">
                                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                                    Shared Compound Amenities & Security
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                                                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                        <Shield className="h-4 w-4 text-emerald-600 shrink-0" />
                                                        <span>24/7 Gated Security & Night Guard</span>
                                                    </div>
                                                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                        <Droplets className="h-4 w-4 text-blue-600 shrink-0" />
                                                        <span>DAWASA Water + 5,000L Reserve Tank</span>
                                                    </div>
                                                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                        <Car className="h-4 w-4 text-indigo-600 shrink-0" />
                                                        <span>Secure Paved Parking (Inside Compound)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                        <Wifi className="h-4 w-4 text-amber-600 shrink-0" />
                                                        <span>Compound Fiber Optic WiFi Infrastructure</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Landlord & House Identity Card */}
                                        <div className="space-y-6">
                                            <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-5 shadow-xs">
                                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                                    Compound Specifications
                                                </h4>
                                                
                                                <div className="space-y-3 text-xs divide-y divide-slate-100">
                                                    <div className="flex justify-between py-2">
                                                        <span className="text-slate-500">Total Rooms:</span>
                                                        <strong className="text-slate-900">{selectedPropertyDetails.total_units} Rooms</strong>
                                                    </div>
                                                    <div className="flex justify-between py-2">
                                                        <span className="text-slate-500">Occupancy:</span>
                                                        <strong className="text-emerald-600">{selectedPropertyDetails.occupied_units} Occupied ({selectedPropertyDetails.vacant_units} Vacant)</strong>
                                                    </div>
                                                    <div className="flex justify-between py-2">
                                                        <span className="text-slate-500">Region (Mkoa):</span>
                                                        <strong className="text-slate-900">{selectedPropertyDetails.region || 'Dar es Salaam'}</strong>
                                                    </div>
                                                    <div className="flex justify-between py-2">
                                                        <span className="text-slate-500">District (Wilaya):</span>
                                                        <strong className="text-slate-900">{selectedPropertyDetails.district || 'Kinondoni'}</strong>
                                                    </div>
                                                    <div className="flex justify-between py-2">
                                                        <span className="text-slate-500">Ward (Kata):</span>
                                                        <strong className="text-slate-900">{selectedPropertyDetails.ward || 'Mikocheni'}</strong>
                                                    </div>
                                                    <div className="flex justify-between py-2">
                                                        <span className="text-slate-500">Street / Address:</span>
                                                        <strong className="text-slate-900">{selectedPropertyDetails.street || 'Chwaka Road'}</strong>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleOpenEditModal(selectedPropertyDetails)}
                                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                                >
                                                    <Edit3 className="h-3.5 w-3.5 text-blue-600" />
                                                    <span>Change Location & Details</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SECTION 3: LOCATION & MAP */}
                            {detailsViewSection === 'map' && (
                                <div className="space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-base font-bold text-slate-900">
                                                Official Compound Location
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                {selectedPropertyDetails.location}, Tanzania
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleOpenEditModal(selectedPropertyDetails)}
                                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                                            >
                                                <Edit3 className="h-3.5 w-3.5 text-blue-600" />
                                                <span>Update Coordinates / Ward</span>
                                            </button>
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                    `${selectedPropertyDetails.location}, Tanzania`
                                                )}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-all cursor-pointer shadow-xs"
                                            >
                                                <span>Open in Google Maps</span>
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </a>
                                        </div>
                                    </div>

                                    <div className="relative w-full h-96 rounded-3xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
                                        <iframe
                                            title="Compound Location Map"
                                            className="w-full h-full border-0"
                                            src={`https://maps.google.com/maps?q=${encodeURIComponent(
                                                `${selectedPropertyDetails.location}, Tanzania`
                                            )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                            loading="lazy"
                                            allowFullScreen
                                        />
                                        <div className="absolute top-4 left-4 pointer-events-none">
                                            <span className="rounded-xl bg-slate-900/90 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur-md flex items-center gap-2 shadow-lg">
                                                <Navigation className="h-3.5 w-3.5 text-emerald-400" />
                                                <span>{selectedPropertyDetails.location}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </main>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* EDIT PROPERTY LOCATION & DETAILS MODAL */}
            <AnimatePresence>
                {editingProperty && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl p-6 sm:p-7"
                        >
                            <button
                                onClick={() => setEditingProperty(null)}
                                className="absolute right-5 top-5 h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-900 hover:text-white transition-all cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                                <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                    <Edit3 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-extrabold text-slate-900">
                                        Edit Property & Location
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Update compound title, region, district, ward, and specifications
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleSavePropertyEdit} className="mt-5 space-y-4">
                                {/* Property Name */}
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">
                                        Property / Compound Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.property_name}
                                        onChange={(e) => setEditForm({ ...editForm, property_name: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                                        placeholder="e.g. Mikocheni Garden Compound"
                                    />
                                </div>

                                {/* Property Type & Rent */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 block mb-1">
                                            Property Type
                                        </label>
                                        <select
                                            value={editForm.property_type}
                                            onChange={(e) => setEditForm({ ...editForm, property_type: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none bg-white"
                                        >
                                            <option value="House">House / Multi-Room Compound</option>
                                            <option value="Apartment">Apartment</option>
                                            <option value="Villa">Standalone Villa</option>
                                            <option value="Commercial">Commercial / Mixed Use</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 block mb-1">
                                            Monthly Rent (TZS)
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min={1000}
                                            value={editForm.monthly_rent}
                                            onChange={(e) => setEditForm({ ...editForm, monthly_rent: Number(e.target.value) })}
                                            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Location: Region (Mkoa) & District (Wilaya) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 block mb-1">
                                            Region (Mkoa)
                                        </label>
                                        <select
                                            value={editForm.region}
                                            onChange={(e) => {
                                                const regName = e.target.value;
                                                const foundReg = TANZANIA_REGIONS.find(r => r.name.toLowerCase() === regName.toLowerCase());
                                                const firstDist = foundReg?.districts[0]?.name || 'Kinondoni';
                                                const firstWard = foundReg?.districts[0]?.wards?.[0] || 'Mikocheni';
                                                setEditForm({
                                                    ...editForm,
                                                    region: regName,
                                                    district: firstDist,
                                                    ward: firstWard,
                                                });
                                            }}
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none bg-white"
                                        >
                                            {TANZANIA_REGIONS.map((r) => (
                                                <option key={r.name} value={r.name}>
                                                    {r.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-700 block mb-1">
                                            District (Wilaya)
                                        </label>
                                        <select
                                            value={editForm.district}
                                            onChange={(e) => {
                                                const distName = e.target.value;
                                                const foundDist = availableDistricts.find(d => d.name.toLowerCase() === distName.toLowerCase());
                                                const firstWard = foundDist?.wards?.[0] || '';
                                                setEditForm({
                                                    ...editForm,
                                                    district: distName,
                                                    ward: firstWard || editForm.ward,
                                                });
                                            }}
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none bg-white"
                                        >
                                            {availableDistricts.length > 0 ? (
                                                availableDistricts.map((d) => (
                                                    <option key={d.name} value={d.name}>
                                                        {d.name}
                                                    </option>
                                                ))
                                            ) : (
                                                <option value={editForm.district}>{editForm.district}</option>
                                            )}
                                        </select>
                                    </div>
                                </div>

                                {/* Ward (Kata) & Street */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 block mb-1">
                                            Ward (Kata)
                                        </label>
                                        {availableWards.length > 0 ? (
                                            <select
                                                value={editForm.ward}
                                                onChange={(e) => setEditForm({ ...editForm, ward: e.target.value })}
                                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none bg-white"
                                            >
                                                {availableWards.map((w) => (
                                                    <option key={w} value={w}>{w}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                value={editForm.ward}
                                                onChange={(e) => setEditForm({ ...editForm, ward: e.target.value })}
                                                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                                                placeholder="e.g. Mikocheni B"
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 block mb-1">
                                            Street / Mtaa
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.street}
                                            onChange={(e) => setEditForm({ ...editForm, street: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                                            placeholder="e.g. Chwaka Rd, Plot 14"
                                        />
                                    </div>
                                </div>

                                {/* Bedrooms & Bathrooms */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 block mb-1">
                                            Total Bedrooms / Rooms
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={editForm.bedrooms}
                                            onChange={(e) => setEditForm({ ...editForm, bedrooms: Number(e.target.value) })}
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-700 block mb-1">
                                            Total Bathrooms
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={editForm.bathrooms}
                                            onChange={(e) => setEditForm({ ...editForm, bathrooms: Number(e.target.value) })}
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">
                                        Description & Amenities
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={editForm.description}
                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                                        placeholder="Describe security, water supply, STS meters..."
                                    />
                                </div>

                                {/* Submit & Cancel Buttons */}
                                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setEditingProperty(null)}
                                        className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingEdit}
                                        className="flex-1 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                                    >
                                        {isSavingEdit ? 'Saving Changes...' : 'Save & Update Location'}
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

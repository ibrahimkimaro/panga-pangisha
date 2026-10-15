import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, Users, CheckCircle, Clock, AlertTriangle,
    Search, Filter, Calendar, Home, ArrowRight, Eye, X,
    ChevronDown, ChevronUp, History, UserCheck, ShieldAlert,
    Sparkles, Key, Wrench, Check
} from 'lucide-react';

interface TenancyRecord {
    id: number;
    tenant_name: string;
    tenant_phone?: string;
    start_date: string;
    end_date?: string;
    actual_move_out_date?: string;
    status: string;
    duration_text?: string;
}

interface RoomOccupancy {
    unit_id: number;
    unit_number: string;
    property_name: string;
    property_id?: number;
    occupancy_status: 'vacant' | 'reserved' | 'occupied' | 'under_maintenance';
    monthly_rent: number;
    current_tenancy?: {
        id: number;
        tenant_name: string;
        tenant_phone: string;
        start_date: string;
        end_date: string;
        is_ongoing: boolean;
        duration_human: string;
        days_remaining?: number;
        expiring_soon?: boolean;
        payment_status?: string;
        outstanding_balance?: number;
    };
    vacancy_duration?: string;
    historical_tenancies?: TenancyRecord[];
}

interface OccupancyViewProps {
    onPrepareAgreement?: (unit: RoomOccupancy) => void;
    onGenerateInvoice?: (unit: RoomOccupancy) => void;
}

export default function OccupancyView({ onPrepareAgreement, onGenerateInvoice }: OccupancyViewProps) {
    const [rooms, setRooms] = useState<RoomOccupancy[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'occupied' | 'vacant' | 'under_maintenance' | 'expiring_soon'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRoomHistory, setSelectedRoomHistory] = useState<RoomOccupancy | null>(null);

    const fetchOccupancyMetrics = async () => {
        setLoading(true);
        try {
            const res = await fetch('/landlord/occupancy-metrics', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'include',
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setRooms(data);
            } else if (data.rooms && Array.isArray(data.rooms)) {
                setRooms(data.rooms);
            }
        } catch (err) {
            console.error('Failed to load occupancy metrics:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOccupancyMetrics();
    }, []);

    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter((r) => r.occupancy_status === 'occupied').length;
    const vacantRooms = rooms.filter((r) => r.occupancy_status === 'vacant').length;
    const maintenanceRooms = rooms.filter((r) => r.occupancy_status === 'under_maintenance').length;
    const expiringSoonRooms = rooms.filter((r) => r.current_tenancy?.expiring_soon).length;

    const filteredRooms = rooms.filter((r) => {
        if (filter === 'occupied' && r.occupancy_status !== 'occupied') return false;
        if (filter === 'vacant' && r.occupancy_status !== 'vacant') return false;
        if (filter === 'under_maintenance' && r.occupancy_status !== 'under_maintenance') return false;
        if (filter === 'expiring_soon' && !r.current_tenancy?.expiring_soon) return false;

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return (
                r.unit_number?.toLowerCase().includes(q) ||
                r.property_name?.toLowerCase().includes(q) ||
                r.current_tenancy?.tenant_name?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const getStatusBadge = (status: string, expiringSoon?: boolean) => {
        if (expiringSoon) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                    <AlertTriangle className="size-3.5 text-amber-600" /> Inaisha Hivi Karibuni
                </span>
            );
        }
        switch (status) {
            case 'occupied':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle className="size-3.5 text-emerald-600" /> Imepangishwa (Occupied)
                    </span>
                );
            case 'vacant':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        <Key className="size-3.5 text-blue-600" /> Kiko Wazi (Vacant)
                    </span>
                );
            case 'under_maintenance':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        <Wrench className="size-3.5 text-slate-500" /> Matengenezo (Maintenance)
                    </span>
                );
            default:
                return <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">{status}</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                        <Building2 className="size-6 text-blue-600" />
                        Ukaaji wa Vyumba na Muda wa Upangaji (Room Occupancy)
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Hesabu kamili za muda wa ukaaji (Ongoing Duration), tarehe za kuisha mikataba, na historia ya wapangaji wa zamani.
                    </p>
                </div>

                {expiringSoonRooms > 0 && (
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                        <AlertTriangle className="size-4 text-amber-600" />
                        <span>Mikataba {expiringSoonRooms} inaisha ndani ya siku 30</span>
                    </div>
                )}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Jumla ya Vyumba</span>
                    <h4 className="text-lg font-extrabold text-slate-900">{totalRooms}</h4>
                    <span className="text-[10px] text-slate-400 mt-1 block">Vyumba vyote vilivyosajiliwa</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                    <span className="text-[11px] font-bold text-emerald-600 block mb-1">Vimepangishwa (Ongoing)</span>
                    <h4 className="text-lg font-extrabold text-emerald-700">{occupiedRooms}</h4>
                    <span className="text-[10px] text-emerald-600/80 mt-1 block font-medium">
                        Ukaaji wa {totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0}%
                    </span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                    <span className="text-[11px] font-bold text-blue-600 block mb-1">Viko Wazi (Vacant)</span>
                    <h4 className="text-lg font-extrabold text-blue-700">{vacantRooms}</h4>
                    <span className="text-[10px] text-blue-600/80 mt-1 block font-medium">Tayari kupokea wapangaji</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Chini ya Matengenezo</span>
                    <h4 className="text-lg font-extrabold text-slate-700">{maintenanceRooms}</h4>
                    <span className="text-[10px] text-slate-400 mt-1 block">Inafanyiwa marekebisho</span>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {[
                        { id: 'all', label: 'Vyote (All)' },
                        { id: 'occupied', label: 'Vimepangishwa' },
                        { id: 'vacant', label: 'Viko Wazi' },
                        { id: 'expiring_soon', label: 'Mikataba Inayoisha' },
                        { id: 'under_maintenance', label: 'Matengenezo' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id as any)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                filter === tab.id
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tafuta chumba, mpangaji..."
                        className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Room Occupancy Cards Grid */}
            {loading ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                    <Clock className="size-8 text-blue-600 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Inapakia hesabu na takwimu za ukaaji...</p>
                </div>
            ) : filteredRooms.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                    <Building2 className="size-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-slate-800">Hakuna vyumba vinavyolingana na kigezo hiki</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        Jaribu kubadili kigezo cha chujio au utafutaji.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredRooms.map((room) => {
                        const isOccupied = room.occupancy_status === 'occupied';
                        const ten = room.current_tenancy;

                        return (
                            <div
                                key={room.unit_id}
                                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-slate-100 text-slate-900 border border-slate-200">
                                            {room.unit_number}
                                        </span>
                                        {getStatusBadge(room.occupancy_status, ten?.expiring_soon)}
                                    </div>

                                    <div>
                                        <h3 className="font-extrabold text-base text-slate-900">{room.property_name}</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Kodi ya Pango: <strong>TZS {Number(room.monthly_rent).toLocaleString()}</strong> / mwezi
                                        </p>
                                    </div>

                                    {isOccupied && ten ? (
                                        <div className="space-y-3">
                                            {/* Ongoing Occupancy Duration Badge */}
                                            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">
                                                        Muda wa Ukaaji (Duration)
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-black text-[10px] tracking-wide">
                                                        INAENDELEA (Ongoing)
                                                    </span>
                                                </div>
                                                <p className="text-sm font-extrabold text-blue-950">
                                                    {ten.duration_human}
                                                </p>
                                                <p className="text-[11px] text-blue-800">
                                                    Alianza: {ten.start_date} • Mwisho: {ten.end_date}
                                                </p>
                                            </div>

                                            {/* Tenant info & balance */}
                                            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 text-xs border border-slate-100">
                                                <div>
                                                    <span className="text-[10px] text-slate-400 block font-medium">Mpangaji wa Sasa</span>
                                                    <span className="font-bold text-slate-800 truncate block">{ten.tenant_name}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-slate-400 block font-medium">Simu</span>
                                                    <span className="font-medium text-slate-600">{ten.tenant_phone}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-slate-400 block font-medium">Hali ya Malipo</span>
                                                    <span className="font-bold text-emerald-700 capitalize">
                                                        {ten.payment_status || 'Paid Up'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-slate-400 block font-medium">Deni Lililobaki</span>
                                                    <span className={`font-extrabold ${Number(ten.outstanding_balance) > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                                        TZS {Number(ten.outstanding_balance || 0).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Key className="size-4 text-blue-500" />
                                                <span>Chumba kipo wazi na tayari kupangishwa.</span>
                                            </div>
                                            {room.vacancy_duration && (
                                                <p className="text-[11px] text-slate-500">
                                                    Muda wa kuwa wazi: <strong>{room.vacancy_duration}</strong>
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Card Footer Actions */}
                                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <button
                                        onClick={() => setSelectedRoomHistory(room)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        <History className="size-3.5 text-slate-500" /> Historia ya Vyumba
                                    </button>

                                    {isOccupied ? (
                                        <button
                                            onClick={() => onGenerateInvoice?.(room)}
                                            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors"
                                        >
                                            Toa Ankara
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => onPrepareAgreement?.(room)}
                                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-sm"
                                        >
                                            Pangisha Sasa
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* HISTORICAL TENANCIES MODAL */}
            {selectedRoomHistory && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-mono font-bold text-blue-600 uppercase">
                                    {selectedRoomHistory.unit_number}
                                </span>
                                <h3 className="font-extrabold text-base text-slate-900">
                                    Historia ya Ukaaji na Wapangaji wa Zamani
                                </h3>
                                <p className="text-xs text-slate-500">{selectedRoomHistory.property_name}</p>
                            </div>
                            <button
                                onClick={() => setSelectedRoomHistory(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4 text-xs">
                            {/* Current Tenancy if any */}
                            {selectedRoomHistory.current_tenancy && (
                                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Mpangaji wa Sasa (Active)</span>
                                    <h4 className="font-extrabold text-sm text-emerald-950">{selectedRoomHistory.current_tenancy.tenant_name}</h4>
                                    <p className="text-emerald-800 text-[11px]">
                                        Muda: {selectedRoomHistory.current_tenancy.duration_human} (Kuanzia {selectedRoomHistory.current_tenancy.start_date})
                                    </p>
                                </div>
                            )}

                            <h4 className="font-bold text-slate-800 text-xs">Rekodi za Wapangaji wa Zamani:</h4>

                            {selectedRoomHistory.historical_tenancies && selectedRoomHistory.historical_tenancies.length > 0 ? (
                                <div className="space-y-3">
                                    {selectedRoomHistory.historical_tenancies.map((h, idx) => (
                                        <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <h5 className="font-bold text-slate-900">{h.tenant_name}</h5>
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                                                    Umemalizika
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500">
                                                Kipindi: {h.start_date} hadi {h.actual_move_out_date || h.end_date || 'Move-out'}
                                            </p>
                                            {h.duration_text && (
                                                <p className="text-[11px] text-slate-600 font-medium">
                                                    Muda alioishi: {h.duration_text}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400">
                                    <History className="size-8 mx-auto mb-2 text-slate-300" />
                                    <p className="text-xs">Hakuna kumbukumbu za wapangaji wa zamani kwa chumba hiki.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-5 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedRoomHistory(null)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200"
                            >
                                Funga
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, Users, CheckCircle, Clock, AlertTriangle,
    Search, Filter, Calendar, Home, ArrowRight, Eye, X,
    ChevronDown, ChevronUp, History, UserCheck, ShieldAlert,
    Sparkles, Key, Wrench, Check, Plus, Zap, Droplets, Sliders,
    FileText, Receipt, RefreshCw
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

interface RoomUtilities {
    luku?: {
        meter_number: string;
        meter_type: string;
        current_units: number;
        tariff_per_unit?: number;
        low_unit_threshold?: number;
        status?: 'online' | 'low' | 'offline';
    };
    water?: {
        meter_number: string;
        meter_type: string;
        current_reading: number;
        previous_reading?: number;
        tariff_per_m3?: number;
    };
}

export interface RoomOccupancy {
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
        tenant_email?: string;
        start_date: string;
        end_date: string;
        is_ongoing: boolean;
        duration_human: string;
        days_remaining?: number;
        expiring_soon?: boolean;
        payment_status?: string;
        outstanding_balance?: number;
    };
    utilities?: RoomUtilities;
    vacancy_duration?: string;
    specs?: string;
    historical_tenancies?: TenancyRecord[];
}

interface OccupancyViewProps {
    onPrepareAgreement?: (unit: RoomOccupancy) => void;
    onGenerateInvoice?: (unit: RoomOccupancy) => void;
    lang?: 'en' | 'sw';
}

const DEFAULT_SAMPLE_ROOMS: RoomOccupancy[] = [
    {
        unit_id: 101,
        unit_number: 'Unit A2',
        property_name: 'Mikocheni Executive Apartments',
        occupancy_status: 'occupied',
        monthly_rent: 500000,
        specs: 'Vyumba 2 • Sebule & Jiko',
        current_tenancy: {
            id: 1,
            tenant_name: 'Juma Bakari',
            tenant_phone: '+255 765 890 123',
            tenant_email: 'juma.bakari@gmail.com',
            start_date: '01/02/2026',
            end_date: '31/01/2027',
            is_ongoing: true,
            duration_human: 'Miezi 8, siku 18 (Inaendelea)',
            days_remaining: 104,
            expiring_soon: false,
            payment_status: 'paid',
            outstanding_balance: 0,
        },
        utilities: {
            luku: {
                meter_number: '24128910291',
                meter_type: 'Sub-meter ya Chumba',
                current_units: 42.5,
                tariff_per_unit: 350,
                low_unit_threshold: 15,
                status: 'online',
            },
            water: {
                meter_number: 'DW-009841',
                meter_type: 'Mita ya DAWASA',
                current_reading: 18.4,
                previous_reading: 12.1,
                tariff_per_m3: 1800,
            },
        },
        historical_tenancies: [
            {
                id: 91,
                tenant_name: 'Grace Kimaro',
                tenant_phone: '+255 784 112 334',
                start_date: '01/01/2025',
                end_date: '31/12/2025',
                actual_move_out_date: '31/12/2025',
                status: 'completed',
                duration_text: 'Mwaka 1 kamili',
            },
        ],
    },
    {
        unit_id: 102,
        unit_number: 'Unit B1',
        property_name: 'Palm Vista Apartments',
        occupancy_status: 'occupied',
        monthly_rent: 420000,
        specs: 'Chumba 1 • Master Self-contained',
        current_tenancy: {
            id: 2,
            tenant_name: 'Sarah Johnson',
            tenant_phone: '+255 712 990 011',
            tenant_email: 'sarah.j@outlook.com',
            start_date: '15/10/2025',
            end_date: '14/11/2026',
            is_ongoing: true,
            duration_human: 'Mwaka 1, siku 8 (Inaendelea)',
            days_remaining: 22,
            expiring_soon: true,
            payment_status: 'paid',
            outstanding_balance: 0,
        },
        utilities: {
            luku: {
                meter_number: '24128910452',
                meter_type: 'Sub-meter ya Chumba',
                current_units: 9.5,
                tariff_per_unit: 350,
                low_unit_threshold: 15,
                status: 'low',
            },
            water: {
                meter_number: 'DW-009855',
                meter_type: 'Mita ya DAWASA',
                current_reading: 24.0,
                previous_reading: 19.5,
                tariff_per_m3: 1800,
            },
        },
        historical_tenancies: [],
    },
    {
        unit_id: 103,
        unit_number: 'Chumba 3',
        property_name: 'Kimaro Prime Residences',
        occupancy_status: 'vacant',
        monthly_rent: 350000,
        specs: 'Chumba cha Kawaida • Umeme wa Pekee',
        vacancy_duration: 'Siku 14 kiko wazi',
        utilities: {
            luku: {
                meter_number: '24128910887',
                meter_type: 'Sub-meter ya Chumba',
                current_units: 50.0,
                tariff_per_unit: 350,
                low_unit_threshold: 15,
                status: 'online',
            },
            water: {
                meter_number: 'DW-009870',
                meter_type: 'Mita ya DAWASA',
                current_reading: 5.0,
                previous_reading: 5.0,
                tariff_per_m3: 1800,
            },
        },
        historical_tenancies: [
            {
                id: 88,
                tenant_name: 'Baraka Mrope',
                start_date: '01/03/2025',
                end_date: '30/09/2026',
                actual_move_out_date: '08/10/2026',
                status: 'completed',
                duration_text: 'Miezi 19',
            },
        ],
    },
    {
        unit_id: 104,
        unit_number: 'Room 4 - Master Suite',
        property_name: 'Luxury Court Residences',
        occupancy_status: 'under_maintenance',
        monthly_rent: 480000,
        specs: 'Master Suite yenye Balcony',
        vacancy_duration: 'Inafanyiwa ukarabati wa sinki na rangi',
        utilities: {
            luku: {
                meter_number: '24128910900',
                meter_type: 'Sub-meter ya Chumba',
                current_units: 35.0,
                tariff_per_unit: 350,
                low_unit_threshold: 15,
                status: 'online',
            },
            water: {
                meter_number: 'DW-009890',
                meter_type: 'Mita ya DAWASA',
                current_reading: 12.0,
                previous_reading: 12.0,
                tariff_per_m3: 1800,
            },
        },
    },
];

export default function OccupancyView({
    onPrepareAgreement,
    onGenerateInvoice,
    lang = 'en'
}: OccupancyViewProps) {
    const t = (en: string, sw: string) => lang === 'sw' ? sw : en;
    const [rooms, setRooms] = useState<RoomOccupancy[]>(DEFAULT_SAMPLE_ROOMS);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<'all' | 'occupied' | 'vacant' | 'under_maintenance' | 'expiring_soon'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Modals
    const [selectedRoomHistory, setSelectedRoomHistory] = useState<RoomOccupancy | null>(null);
    const [selectedRoomForUtilities, setSelectedRoomForUtilities] = useState<RoomOccupancy | null>(null);
    const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

    // Add Room Form state
    const [newRoomForm, setNewRoomForm] = useState({
        property_name: 'Mikocheni Executive Apartments',
        unit_number: '',
        unit_type: 'Two-Bedroom Suite',
        monthly_rent: '450000',
        occupancy_status: 'vacant' as 'vacant' | 'occupied' | 'under_maintenance',
        luku_meter: '',
        luku_units: '50',
        water_meter: '',
        water_m3: '10.0',
        specs: 'Self-contained, Madirisha ya vioo',
    });

    // Submeter Reading update form
    const [meterForm, setMeterForm] = useState({
        luku_units: '',
        luku_threshold: '15',
        water_m3: '',
    });

    const showNotify = (type: 'success' | 'error' | 'info', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4500);
    };

    const normalizeRoom = (r: any): RoomOccupancy => {
        const status = (r.occupancy_status || r.status || (r.current_tenancy || r.current_tenant ? 'occupied' : 'vacant')) as RoomOccupancy['occupancy_status'];
        const ct = r.current_tenancy || r.current_tenant;
        const normalizedTenancy = ct
            ? {
                id: ct.id ?? 1,
                tenant_name: ct.tenant_name || ct.name || 'Active Resident',
                tenant_phone: ct.tenant_phone || ct.phone || '+255 700 000 000',
                tenant_email: ct.tenant_email || ct.email,
                start_date: ct.start_date || ct.starts_on || '-',
                end_date: ct.end_date || ct.ends_on || '-',
                is_ongoing: ct.is_ongoing ?? true,
                duration_human: ct.duration_human || ct.duration || 'Ongoing',
                days_remaining: ct.days_remaining ?? ct.days_left,
                expiring_soon: Boolean(ct.expiring_soon ?? ct.is_expiring_soon),
                payment_status: ct.payment_status || 'paid',
                outstanding_balance: Number(ct.outstanding_balance ?? 0),
            }
            : undefined;

        return {
            unit_id: r.unit_id ?? r.id ?? Date.now(),
            unit_number: r.unit_number || r.room || 'Unit',
            property_name: r.property_name || 'Property',
            property_id: r.property_id ?? r.house_id,
            occupancy_status: status,
            monthly_rent: Number(r.monthly_rent ?? 450000),
            current_tenancy: normalizedTenancy,
            utilities: r.utilities || {
                luku: {
                    meter_number: `241289${String(r.unit_id ?? 100).padStart(5, '0')}`,
                    meter_type: 'Sub-meter ya Chumba',
                    current_units: 50,
                    tariff_per_unit: 350,
                    low_unit_threshold: 15,
                    status: 'online',
                },
                water: {
                    meter_number: `DW-00${String((r.unit_id ?? 100) + 9800)}`,
                    meter_type: 'Mita ya DAWASA',
                    current_reading: 12.0,
                    previous_reading: 10.0,
                    tariff_per_m3: 1800,
                },
            },
            vacancy_duration: r.vacancy_duration,
            specs: r.specs || r.unit_type || 'Modern Unit',
            historical_tenancies: r.historical_tenancies || r.history || [],
        };
    };

    const fetchOccupancyMetrics = async () => {
        try {
            const res = await fetch('/landlord/occupancy-metrics', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    setRooms(data.map(normalizeRoom));
                } else if (data.rooms && Array.isArray(data.rooms) && data.rooms.length > 0) {
                    setRooms(data.rooms.map(normalizeRoom));
                }
            }
        } catch (err) {
            console.error('Failed to load occupancy metrics:', err);
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

    const handleCreateRoom = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoomForm.unit_number.trim()) {
            showNotify('error', 'Tafadhali weka namba au jina la chumba/kitengo.');
            return;
        }

        const newUnit: RoomOccupancy = {
            unit_id: Date.now(),
            unit_number: newRoomForm.unit_number.trim(),
            property_name: newRoomForm.property_name,
            occupancy_status: newRoomForm.occupancy_status,
            monthly_rent: Number(newRoomForm.monthly_rent) || 350000,
            specs: newRoomForm.specs || 'Chumba cha Kisasa',
            vacancy_duration: newRoomForm.occupancy_status === 'vacant' ? 'Kimesajiliwa hivi punde' : undefined,
            utilities: {
                luku: {
                    meter_number: newRoomForm.luku_meter || `24128${Math.floor(100000 + Math.random() * 900000)}`,
                    meter_type: 'Sub-meter ya Chumba',
                    current_units: Number(newRoomForm.luku_units) || 50,
                    tariff_per_unit: 350,
                    low_unit_threshold: 15,
                    status: 'online',
                },
                water: {
                    meter_number: newRoomForm.water_meter || `DW-00${Math.floor(1000 + Math.random() * 9000)}`,
                    meter_type: 'Mita ya DAWASA',
                    current_reading: Number(newRoomForm.water_m3) || 10,
                    previous_reading: Number(newRoomForm.water_m3) || 10,
                    tariff_per_m3: 1800,
                },
            },
            historical_tenancies: [],
        };

        setRooms([newUnit, ...rooms]);
        setIsAddRoomModalOpen(false);
        showNotify('success', `Chumba ${newUnit.unit_number} kimesajiliwa kikamilifu kwenye ${newUnit.property_name}!`);

        // Reset form
        setNewRoomForm({
            property_name: 'Mikocheni Executive Apartments',
            unit_number: '',
            unit_type: 'Two-Bedroom Suite',
            monthly_rent: '450000',
            occupancy_status: 'vacant',
            luku_meter: '',
            luku_units: '50',
            water_meter: '',
            water_m3: '10.0',
            specs: 'Self-contained, Madirisha ya vioo',
        });
    };

    const handleOpenMeterModal = (room: RoomOccupancy) => {
        setSelectedRoomForUtilities(room);
        setMeterForm({
            luku_units: String(room.utilities?.luku?.current_units ?? 40),
            luku_threshold: String(room.utilities?.luku?.low_unit_threshold ?? 15),
            water_m3: String(room.utilities?.water?.current_reading ?? 15),
        });
    };

    const handleSaveMeterReading = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRoomForUtilities) return;

        const updatedUnits = Number(meterForm.luku_units) || 0;
        const updatedM3 = Number(meterForm.water_m3) || 0;
        const lowThreshold = Number(meterForm.luku_threshold) || 15;

        setRooms(rooms.map((r) => {
            if (r.unit_id === selectedRoomForUtilities.unit_id) {
                return {
                    ...r,
                    utilities: {
                        ...r.utilities,
                        luku: {
                            ...(r.utilities?.luku || { meter_number: '24128910000', meter_type: 'Sub-meter ya Chumba' }),
                            current_units: updatedUnits,
                            low_unit_threshold: lowThreshold,
                            status: updatedUnits < lowThreshold ? 'low' : 'online',
                        },
                        water: {
                            ...(r.utilities?.water || { meter_number: 'DW-009900', meter_type: 'Mita ya DAWASA' }),
                            previous_reading: r.utilities?.water?.current_reading ?? updatedM3,
                            current_reading: updatedM3,
                        },
                    },
                };
            }
            return r;
        }));

        setSelectedRoomForUtilities(null);
        showNotify('success', `Vipimo vya mita kwa ${selectedRoomForUtilities.unit_number} vimesasishwa kikamilifu!`);
    };

    const getStatusBadge = (status: string, expiringSoon?: boolean) => {
        if (expiringSoon) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                    <AlertTriangle className="size-3.5 text-amber-600" /> {t('Expiring Soon', 'Inaisha Hivi Karibuni')}
                </span>
            );
        }
        switch (status) {
            case 'occupied':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle className="size-3.5 text-emerald-600" /> {t('Occupied', 'Kimepangishwa')}
                    </span>
                );
            case 'vacant':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        <Key className="size-3.5 text-blue-600" /> {t('Vacant', 'Kiko Wazi')}
                    </span>
                );
            case 'under_maintenance':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        <Wrench className="size-3.5 text-slate-500" /> {t('Maintenance', 'Matengenezo')}
                    </span>
                );
            default:
                return <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">{status}</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Notification Banner */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-semibold shadow-sm ${notification.type === 'success'
                            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                            : 'bg-red-50 text-red-900 border border-red-200'
                            }`}
                    >
                        <div className="flex items-center gap-2.5">
                            <Sparkles className="size-4.5 shrink-0 text-emerald-600" />
                            <span>{notification.message}</span>
                        </div>
                        <button onClick={() => setNotification(null)} className="p-1 hover:bg-black/5 rounded-lg">
                            <X className="size-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                        <Building2 className="size-6 text-amber-600" />
                        {t('Room Occupancy & Tenancy Duration', 'Ukaaji wa Vyumba na Muda wa Upangaji')}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        {t(
                            'Real-time tenancy durations, lease expiry dates, LUKU & DAWASA utility meters, and resident tenancy history.',
                            'Hesabu kamili za muda wa ukaaji, tarehe za kuisha mikataba, sub-mita za LUKU na DAWASA, na historia ya wapangaji.'
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => setIsAddRoomModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                    >
                        <Plus className="size-4" /> {t('Add New Room / Unit', 'Ongeza Chumba / Unit Mpya')}
                    </button>
                </div>
            </div>

            {/* Expiring Soon Alert Notice if any */}
            {expiringSoonRooms > 0 && (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                        <span>
                            {t(
                                `There are ${expiringSoonRooms} lease agreements expiring within the next 30 days.`,
                                `Kuna mikataba ${expiringSoonRooms} inayokaribia kuisha ndani ya siku 30.`
                            )}
                        </span>
                    </div>
                    <button
                        onClick={() => setFilter('expiring_soon')}
                        className="underline text-amber-800 hover:text-amber-950 font-extrabold"
                    >
                        {t('View These Units', 'Tazama Vyumba Hivi')}
                    </button>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">{t('Total Units', 'Jumla ya Vyumba')}</span>
                    <h4 className="text-xl font-extrabold text-slate-900">{totalRooms}</h4>
                    <span className="text-[10px] text-slate-400 mt-1 block">{t('All registered rental units', 'Vyumba vyote vilivyosajiliwa')}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                    <span className="text-[11px] font-bold text-emerald-600 block mb-1">{t('Occupied Units', 'Vimepangishwa')}</span>
                    <h4 className="text-xl font-extrabold text-emerald-700">{occupiedRooms}</h4>
                    <span className="text-[10px] text-emerald-600/80 mt-1 block font-medium">
                        {t(
                            `${totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0}% Occupancy rate`,
                            `Ukaaji wa ${totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0}%`
                        )}
                    </span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                    <span className="text-[11px] font-bold text-blue-600 block mb-1">{t('Vacant Units', 'Viko Wazi')}</span>
                    <h4 className="text-xl font-extrabold text-blue-700">{vacantRooms}</h4>
                    <span className="text-[10px] text-blue-600/80 mt-1 block font-medium">{t('Ready for tenancy', 'Tayari kupokea wapangaji')}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">{t('Maintenance', 'Matengenezo')}</span>
                    <h4 className="text-xl font-extrabold text-slate-700">{maintenanceRooms}</h4>
                    <span className="text-[10px] text-slate-400 mt-1 block">{t('Under repair/refresh', 'Inafanyiwa marekebisho')}</span>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {[
                        { id: 'all', label: t('All Units', 'Vyote') },
                        { id: 'occupied', label: t('Occupied', 'Vimepangishwa') },
                        { id: 'vacant', label: t('Vacant', 'Viko Wazi') },
                        { id: 'expiring_soon', label: t('Expiring Soon', 'Inayoisha') },
                        { id: 'under_maintenance', label: t('Maintenance', 'Matengenezo') },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id as any)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${filter === tab.id
                                ? 'bg-slate-900 text-white shadow-xs'
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
                        placeholder={t('Search room, tenant...', 'Tafuta chumba, mpangaji...')}
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
                        Jaribu kubadili kigezo cha chujio au ongeza chumba kipya kupitia kitufe cha juu.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredRooms.map((room) => {
                        const isOccupied = room.occupancy_status === 'occupied';
                        const ten = room.current_tenancy;
                        const luku = room.utilities?.luku;
                        const water = room.utilities?.water;
                        const isLowLuku = luku && luku.current_units < (luku.low_unit_threshold ?? 15);

                        return (
                            <div
                                key={room.unit_id}
                                className="group relative flex flex-col overflow-hidden rounded-2xl border w-200 border-slate-200 bg-white transition-shadow hover:shadow-lg hover:shadow-slate-200/70"
                            >
                                {/* Status edge */}
                                <span
                                    className={`absolute inset-y-0 left-0 w-1 ${!isOccupied ? 'bg-slate-300' : ten?.expiring_soon ? 'bg-amber-400' : 'bg-emerald-500'
                                        }`}
                                />

                                <div className="flex flex-1 flex-col gap-3 p-4 pl-5">
                                    {/* Header: unit + property + status */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="text-xl font-black leading-none tracking-tight text-slate-900">
                                                {room.unit_number}
                                            </h3>
                                            <p className="mt-1 truncate text-xs text-slate-500">{room.property_name}</p>
                                        </div>
                                        {getStatusBadge(room.occupancy_status, ten?.expiring_soon)}
                                    </div>

                                    {/* Rent */}
                                    <p className="text-sm text-slate-500">
                                        <span className="text-base font-bold text-slate-900">
                                            TZS {Number(room.monthly_rent).toLocaleString()}
                                        </span>{' '}
                                        / {t('month', 'mwezi')}
                                    </p>

                                    {/* Tenant or vacancy */}
                                    {isOccupied && ten ? (
                                        <div className="rounded-xl bg-slate-50 p-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="truncate text-sm font-semibold text-slate-800">{ten.tenant_name}</p>
                                                <span className="shrink-0 text-xs text-slate-500">{ten.tenant_phone}</span>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between text-xs">
                                                <span className="text-slate-500">
                                                    {t('Ends', 'Mwisho')} {ten.end_date}
                                                </span>
                                                <span
                                                    className={`font-bold ${Number(ten.outstanding_balance) > 0 ? 'text-amber-700' : 'text-emerald-700'
                                                        }`}
                                                >
                                                    {Number(ten.outstanding_balance) > 0
                                                        ? `${t('Owes', 'Deni')} TZS ${Number(ten.outstanding_balance).toLocaleString()}`
                                                        : t('Paid up', 'Hana deni')}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                                            <Key className="size-4 shrink-0 text-slate-400" />
                                            <span>
                                                {room.vacancy_duration
                                                    ? `${t('Vacant for', 'Wazi kwa')} ${room.vacancy_duration}`
                                                    : t('Ready for a new tenant.', 'Tayari kupangishwa.')}
                                            </span>
                                        </div>
                                    )}

                                    {/* Meters: one slim line */}
                                    <div className="mt-auto flex items-center gap-2 text-[11px] font-semibold">
                                        <span
                                            className={`flex items-center gap-1 rounded-lg px-2 py-1 ${isLowLuku ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                                                }`}
                                        >
                                            <Zap className="size-3" />
                                            {luku?.current_units ?? 50} kWh
                                            {isLowLuku && <span className="ml-0.5">· {t('Low', 'Chini')}</span>}
                                        </span>
                                        <span className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-slate-700">
                                            <Droplets className="size-3" />
                                            {water?.current_reading ?? 12.0} m³
                                        </span>
                                    </div>
                                </div>

                                {/* Footer: main action + 2 icon buttons */}
                                <div className="flex items-center gap-2 border-t border-slate-100 p-3 pl-5">
                                    {isOccupied ? (
                                        <button
                                            onClick={() => onGenerateInvoice?.(room)}
                                            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-700"
                                        >
                                            <Receipt className="size-3.5" /> {t('Issue invoice', 'Toa ankara')}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => onPrepareAgreement?.(room)}
                                            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-teal-700"
                                        >
                                            <FileText className="size-3.5" /> {t('Draft lease', 'Andaa mkataba')}
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleOpenMeterModal(room)}
                                        className="cursor-pointer rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-100"
                                        title={t('Record meter readings', 'Soma mita')}
                                    >
                                        <Sliders className="size-4" />
                                    </button>

                                    <button
                                        onClick={() => setSelectedRoomHistory(room)}
                                        className="relative cursor-pointer rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-100"
                                        title={t('Tenancy history', 'Historia')}
                                    >
                                        <History className="size-4" />
                                        {!!room.historical_tenancies?.length && (
                                            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-slate-900 px-1 text-[9px] font-bold text-white">
                                                {room.historical_tenancies.length}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL 1: ADD NEW ROOM / UNIT */}
            {isAddRoomModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                                    <Building2 className="size-5 text-amber-600" /> {t('Register New Room / Unit', 'Sajili Chumba / Unit Mpya')}
                                </h3>
                                <p className="text-xs text-slate-500">{t('Enter unit details, rent amount, and utility sub-meter numbers.', 'Weka maelezo ya chumba, kodi, na namba za mita za LUKU na DAWASA.')}</p>
                            </div>
                            <button
                                onClick={() => setIsAddRoomModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateRoom} className="p-6 overflow-y-auto space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">{t('Property / Building', 'Nyumba / Jengo')}</label>
                                <select
                                    value={newRoomForm.property_name}
                                    onChange={(e) => setNewRoomForm({ ...newRoomForm, property_name: e.target.value })}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                                >
                                    <option value="Mikocheni Executive Apartments">Mikocheni Executive Apartments</option>
                                    <option value="Palm Vista Apartments">Palm Vista Apartments</option>
                                    <option value="Kimaro Prime Residences">Kimaro Prime Residences</option>
                                    <option value="Luxury Court Residences">Luxury Court Residences</option>
                                    <option value="Coral Beach Oceanfront">Coral Beach Oceanfront</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">{t('Room / Unit Number or Name *', 'Namba / Jina la Chumba *')}</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder={t('e.g. Unit A3, Room 4', 'mfano: Unit A3, Chumba 4')}
                                        value={newRoomForm.unit_number}
                                        onChange={(e) => setNewRoomForm({ ...newRoomForm, unit_number: e.target.value })}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">{t('Unit Type', 'Aina ya Chumba / Kitengo')}</label>
                                    <select
                                        value={newRoomForm.unit_type}
                                        onChange={(e) => setNewRoomForm({ ...newRoomForm, unit_type: e.target.value })}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                                    >
                                        <option value="Single Room">{t('Single Room', 'Chumba Kimoja')}</option>
                                        <option value="Master Bedroom">{t('Master Suite', 'Chumba Chenye Choo')}</option>
                                        <option value="One-Bedroom Apartment">{t('1-Bedroom Apartment', 'Chumba & Sebule')}</option>
                                        <option value="Two-Bedroom Suite">{t('2-Bedroom Apartment', 'Vyumba Viwili & Sebule')}</option>
                                        <option value="Studio Apartment">{t('Studio Apartment', 'Studio Apartment')}</option>
                                        <option value="Commercial Shop">{t('Commercial Shop / Office', 'Fremu / Ofisi')}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">{t('Monthly Rent (TZS) *', 'Kodi kwa Mwezi (TZS) *')}</label>
                                    <input
                                        type="number"
                                        required
                                        value={newRoomForm.monthly_rent}
                                        onChange={(e) => setNewRoomForm({ ...newRoomForm, monthly_rent: e.target.value })}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">{t('Initial Status', 'Hali ya Awali')}</label>
                                    <select
                                        value={newRoomForm.occupancy_status}
                                        onChange={(e) => setNewRoomForm({ ...newRoomForm, occupancy_status: e.target.value as any })}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                                    >
                                        <option value="vacant">{t('Vacant', 'Kiko Wazi')}</option>
                                        <option value="occupied">{t('Occupied', 'Kimepangishwa')}</option>
                                        <option value="under_maintenance">{t('Under Maintenance', 'Chini ya Matengenezo')}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                                <h4 className="font-extrabold text-amber-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                                    <Zap className="size-3.5" /> {t('Electricity & Water Sub-meters', 'Mita za Umeme na Maji (Sub-meters)')}
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-amber-800 font-semibold mb-1">{t('LUKU Sub-meter Number', 'Namba ya LUKU Sub-meter')}</label>
                                        <input
                                            type="text"
                                            placeholder="24128910001"
                                            value={newRoomForm.luku_meter}
                                            onChange={(e) => setNewRoomForm({ ...newRoomForm, luku_meter: e.target.value })}
                                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-300 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-amber-800 font-semibold mb-1">{t('Initial Balance (kWh)', 'Salio la Awali (kWh)')}</label>
                                        <input
                                            type="number"
                                            value={newRoomForm.luku_units}
                                            onChange={(e) => setNewRoomForm({ ...newRoomForm, luku_units: e.target.value })}
                                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-300 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-amber-800 font-semibold mb-1">{t('DAWASA Meter Number', 'Namba ya Mita ya DAWASA')}</label>
                                        <input
                                            type="text"
                                            placeholder="DW-009912"
                                            value={newRoomForm.water_meter}
                                            onChange={(e) => setNewRoomForm({ ...newRoomForm, water_meter: e.target.value })}
                                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-300 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-amber-800 font-semibold mb-1">{t('Initial Water Reading (m³)', 'Usomaji wa Awali (m³)')}</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={newRoomForm.water_m3}
                                            onChange={(e) => setNewRoomForm({ ...newRoomForm, water_m3: e.target.value })}
                                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-300 bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">{t('Features & Amenities', 'Sifa za Ziada / Vitu Vilivyopo')}</label>
                                <input
                                    type="text"
                                    value={newRoomForm.specs}
                                    onChange={(e) => setNewRoomForm({ ...newRoomForm, specs: e.target.value })}
                                    placeholder={t('e.g. Ensuite bathroom, ceiling fan, balcony', 'mfano: Choo ndani, feni, madirisha ya vioo')}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                                />
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAddRoomModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                                >
                                    {t('Cancel', 'Ghairi')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold transition-all cursor-pointer shadow-xs"
                                >
                                    {t('Save Unit', 'Hifadhi Chumba')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: UPDATE SUBMETER READINGS */}
            {selectedRoomForUtilities && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                                    <Sliders className="size-5 text-indigo-600" /> {t('Meter Readings', 'Vipimo vya Mita')} ({selectedRoomForUtilities.unit_number})
                                </h3>
                                <p className="text-xs text-slate-500">{selectedRoomForUtilities.property_name}</p>
                            </div>
                            <button
                                onClick={() => setSelectedRoomForUtilities(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveMeterReading} className="p-6 space-y-4 text-xs">
                            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                                <div className="flex items-center justify-between font-bold text-amber-900">
                                    <span className="flex items-center gap-1.5">
                                        <Zap className="size-4 text-amber-600" /> {t('Electricity Meter (LUKU)', 'Mita ya Umeme (LUKU)')}
                                    </span>
                                    <span className="text-[10px] text-amber-700">
                                        #{selectedRoomForUtilities.utilities?.luku?.meter_number || '24128910000'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-amber-900 mb-1">{t('Current Balance (kWh) *', 'Salio Lililopo (kWh) *')}</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            required
                                            value={meterForm.luku_units}
                                            onChange={(e) => setMeterForm({ ...meterForm, luku_units: e.target.value })}
                                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-300 bg-white font-extrabold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-amber-900 mb-1">{t('Low Balance Alert (kWh)', 'Tahadhari Chini ya (kWh)')}</label>
                                        <input
                                            type="number"
                                            value={meterForm.luku_threshold}
                                            onChange={(e) => setMeterForm({ ...meterForm, luku_threshold: e.target.value })}
                                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-amber-300 bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
                                <div className="flex items-center justify-between font-bold text-blue-900">
                                    <span className="flex items-center gap-1.5">
                                        <Droplets className="size-4 text-blue-600" /> {t('Water Meter (DAWASA)', 'Mita ya Maji (DAWASA)')}
                                    </span>
                                    <span className="text-[10px] text-blue-700">
                                        #{selectedRoomForUtilities.utilities?.water?.meter_number || 'DW-009900'}
                                    </span>
                                </div>
                                <div className="pt-1">
                                    <label className="block text-[11px] font-semibold text-blue-900 mb-1">{t('Current Reading (m³) *', 'Usomaji wa Sasa (m³) *')}</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        required
                                        value={meterForm.water_m3}
                                        onChange={(e) => setMeterForm({ ...meterForm, water_m3: e.target.value })}
                                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-blue-300 bg-white font-extrabold"
                                    />
                                    <span className="text-[10px] text-blue-600 block mt-1">
                                        {t('Previous reading:', 'Usomaji wa awali:')} {selectedRoomForUtilities.utilities?.water?.current_reading ?? 10.0} m³
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setSelectedRoomForUtilities(null)}
                                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                                >
                                    {t('Cancel', 'Ghairi')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold transition-all cursor-pointer shadow-xs"
                                >
                                    {t('Update Readings', 'Sasisha Vipimo')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: HISTORICAL TENANCIES MODAL */}
            {selectedRoomHistory && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-mono font-bold text-blue-600 uppercase">
                                    {selectedRoomHistory.unit_number}
                                </span>
                                <h3 className="font-extrabold text-base text-slate-900">
                                    {t('Tenancy History & Past Residents', 'Historia ya Ukaaji na Wapangaji wa Zamani')}
                                </h3>
                                <p className="text-xs text-slate-500">{selectedRoomHistory.property_name}</p>
                            </div>
                            <button
                                onClick={() => setSelectedRoomHistory(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4 text-xs">
                            {/* Current Tenancy if any */}
                            {selectedRoomHistory.current_tenancy && (
                                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                                        {t('Active Resident', 'Mpangaji wa Sasa')}
                                    </span>
                                    <h4 className="font-extrabold text-sm text-emerald-950">{selectedRoomHistory.current_tenancy.tenant_name}</h4>
                                    <p className="text-emerald-800 text-[11px]">
                                        {t('Duration:', 'Muda:')} {selectedRoomHistory.current_tenancy.duration_human} ({t('Since', 'Kuanzia')} {selectedRoomHistory.current_tenancy.start_date})
                                    </p>
                                </div>
                            )}

                            <h4 className="font-bold text-slate-800 text-xs">{t('Past Tenancy Records:', 'Rekodi za Wapangaji wa Zamani:')}</h4>

                            {selectedRoomHistory.historical_tenancies && selectedRoomHistory.historical_tenancies.length > 0 ? (
                                <div className="space-y-3">
                                    {selectedRoomHistory.historical_tenancies.map((h, idx) => (
                                        <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <h5 className="font-bold text-slate-900">{h.tenant_name}</h5>
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                                                    {t('Completed', 'Umemalizika')}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500">
                                                {t('Period:', 'Kipindi:')} {h.start_date} {t('to', 'hadi')} {h.actual_move_out_date || h.end_date || 'Move-out'}
                                            </p>
                                            {h.duration_text && (
                                                <p className="text-[11px] text-slate-600 font-medium">
                                                    {t('Resided for:', 'Muda alioishi:')} {h.duration_text}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-400">
                                    <History className="size-8 mx-auto mb-2 text-slate-300" />
                                    <p className="text-xs">{t('No past tenancy records for this unit.', 'Hakuna kumbukumbu za wapangaji wa zamani kwa chumba hiki.')}</p>
                                </div>
                            )}
                        </div>

                        <div className="p-5 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedRoomHistory(null)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                            >
                                {t('Close', 'Funga')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

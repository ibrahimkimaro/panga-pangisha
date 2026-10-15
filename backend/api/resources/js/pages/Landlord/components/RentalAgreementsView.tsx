import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Plus, CheckCircle, Clock, AlertTriangle, Printer,
    Search, Filter, ShieldCheck, PenTool, Eye, X, ChevronRight,
    User, Home, Calendar, CreditCard, Sparkles, AlertCircle, Send, Check
} from 'lucide-react';

interface RentalAgreement {
    id: number;
    agreement_number: string;
    property_id?: number;
    unit_id?: number;
    tenant_id?: number;
    tenant_name: string;
    tenant_phone: string;
    tenant_email?: string;
    tenant_national_id?: string;
    property_name?: string;
    unit_number?: string;
    monthly_rent: number;
    security_deposit: number;
    payment_frequency: string;
    start_date: string;
    end_date: string;
    duration_months: number;
    status: 'draft' | 'tenant_signed' | 'active' | 'terminated';
    language: 'sw' | 'en';
    terms_sections?: Array<{
        title: string;
        content: string;
    }>;
    inventory_items?: Array<{
        item: string;
        condition: string;
        quantity: number;
    }>;
    meter_readings?: {
        electricity_token_units?: number;
        water_meter_reading?: number;
    };
    tenant_signed_at?: string;
    landlord_signed_at?: string;
    created_at?: string;
}

interface RentalAgreementsViewProps {
    properties?: Array<{ id: number; name: string }>;
    onSwitchToInvoices?: () => void;
}

export default function RentalAgreementsView({ properties = [], onSwitchToInvoices }: RentalAgreementsViewProps) {
    const [agreements, setAgreements] = useState<RentalAgreement[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'draft' | 'tenant_signed' | 'active' | 'terminated'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAgreement, setSelectedAgreement] = useState<RentalAgreement | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [previewStep, setPreviewStep] = useState(false);
    const [signingAgreement, setSigningAgreement] = useState<RentalAgreement | null>(null);
    const [signerName, setSignerName] = useState('Ibrahim Kimaro');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

    // Form state for new draft
    const [formData, setFormData] = useState({
        property_name: properties[0]?.name || 'Kimaro Prime Residences',
        unit_number: 'Room 2 - Ground Floor',
        tenant_name: '',
        tenant_phone: '',
        tenant_email: '',
        tenant_national_id: '',
        monthly_rent: '350000',
        security_deposit: '350000',
        payment_frequency: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        duration_months: '12',
        language: 'sw' as 'sw' | 'en',
        notes: '',
        electricity_token_units: '50',
        water_meter_reading: '12.5',
    });

    const fetchAgreements = async () => {
        setLoading(true);
        try {
            const res = await fetch('/landlord/agreements', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'include',
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setAgreements(data);
            } else if (data.data && Array.isArray(data.data)) {
                setAgreements(data.data);
            }
        } catch (err) {
            console.error('Failed to load agreements:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgreements();
    }, []);

    const showNotify = (type: 'success' | 'error' | 'info', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const handlePrepareDraft = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/landlord/agreements/draft', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
                body: JSON.stringify({
                    property_name: formData.property_name,
                    unit_number: formData.unit_number,
                    tenant_name: formData.tenant_name,
                    tenant_phone: formData.tenant_phone,
                    tenant_email: formData.tenant_email,
                    tenant_national_id: formData.tenant_national_id,
                    monthly_rent: Number(formData.monthly_rent),
                    security_deposit: Number(formData.security_deposit),
                    payment_frequency: formData.payment_frequency,
                    start_date: formData.start_date,
                    duration_months: Number(formData.duration_months),
                    language: formData.language,
                    inventory_items: [
                        { item: 'Master Bedroom Door & Lock Key (Funguo 2)', condition: 'Mpya/Nzuri', quantity: 2 },
                        { item: 'Madirisha ya Vioo na Nyavu za Mbu', condition: 'Salama', quantity: 3 },
                        { item: 'Sinki la Jiko na Bomba la Maji', condition: 'Safi', quantity: 1 }
                    ],
                    meter_readings: {
                        electricity_token_units: Number(formData.electricity_token_units) || 50,
                        water_meter_reading: Number(formData.water_meter_reading) || 10.0,
                    }
                }),
            });
            const data = await res.json();
            if (data.agreement) {
                showNotify('success', `Mkataba #${data.agreement.agreement_number} umeandaliwa kikamilifu! Rasimu ipo tayari kwa uhakiki.`);
                setIsCreateModalOpen(false);
                setPreviewStep(false);
                fetchAgreements();
            } else {
                showNotify('error', data.message || 'Hitilafu imetokea wakati wa kuandaa mkataba.');
            }
        } catch (err: any) {
            showNotify('error', 'Imeshindwa kuwasiliana na seva.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCountersign = async () => {
        if (!signingAgreement) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/landlord/agreements/${signingAgreement.id}/sign-landlord`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
                body: JSON.stringify({
                    signer_name: signerName,
                    legal_consent: true,
                }),
            });
            const data = await res.json();
            if (data.agreement) {
                showNotify('success', `Mkataba #${data.agreement.agreement_number} umesainiwa na kuwezeshwa rasmi! Ankara ya kwanza ya kuingia imetengenezwa.`);
                setSigningAgreement(null);
                fetchAgreements();
            } else {
                showNotify('error', data.message || 'Hitilafu katika kusaini mkataba.');
            }
        } catch {
            showNotify('error', 'Hitilafu ya mtandao wakati wa kusaini.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredAgreements = agreements.filter((ag) => {
        if (filter !== 'all' && ag.status !== filter) return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return (
                ag.agreement_number?.toLowerCase().includes(q) ||
                ag.tenant_name?.toLowerCase().includes(q) ||
                ag.property_name?.toLowerCase().includes(q) ||
                ag.unit_number?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle className="size-3.5 text-emerald-600" /> Hai / Active & Binding
                    </span>
                );
            case 'tenant_signed':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        <PenTool className="size-3.5 text-blue-600" /> Mpangaji Amesaini — Inasubiri Mmiliki
                    </span>
                );
            case 'draft':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock className="size-3.5 text-amber-600" /> Rasimu / Draft Review
                    </span>
                );
            case 'terminated':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        Umemalizika / Terminated
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
                        className={`p-4 rounded-2xl flex items-center justify-between text-sm font-semibold shadow-sm ${
                            notification.type === 'success'
                                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                                : notification.type === 'error'
                                ? 'bg-red-50 text-red-900 border border-red-200'
                                : 'bg-blue-50 text-blue-900 border border-blue-200'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <Sparkles className="size-5 shrink-0 text-emerald-600" />
                            <span>{notification.message}</span>
                        </div>
                        <button onClick={() => setNotification(null)} className="p-1 hover:bg-black/5 rounded-lg">
                            <X className="size-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                        <FileText className="size-6 text-blue-600" />
                        Mikataba ya Kupangisha (Rental Agreements)
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Saini za kisheria, masharti ya upangaji, na kumbukumbu halali za kisheria kabla ya malipo au kuingia chumbani.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => {
                            setPreviewStep(false);
                            setIsCreateModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
                    >
                        <Plus className="size-4" /> Andaa Mkataba Mpya
                    </button>
                </div>
            </div>

            {/* Strict Workflow Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex items-start gap-3">
                <ShieldCheck className="size-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-950 space-y-1">
                    <p className="font-bold">Sheria na Utaratibu wa Upangaji (Tenancy Protection Gateway):</p>
                    <p className="text-blue-800">
                        Mpangaji haruhusiwi kulipia kodi au kupewa ufunguo kabla ya kusaini mkataba rasmi. Tenancy huwashwa na kutoa ankara (invoice) baada tu ya pande zote mbili (mpangaji na mmiliki) kusaini kielektroniki.
                    </p>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {[
                        { id: 'all', label: 'Yote (All)' },
                        { id: 'draft', label: 'Rasimu (Drafts)' },
                        { id: 'tenant_signed', label: 'Mpangaji Amesaini' },
                        { id: 'active', label: 'Hai (Active)' },
                        { id: 'terminated', label: 'Imemalizika' },
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
                        placeholder="Tafuta mpangaji, namba..."
                        className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Agreements List / Table */}
            {loading ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                    <Clock className="size-8 text-blue-600 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Inapakia orodha ya mikataba...</p>
                </div>
            ) : filteredAgreements.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                    <FileText className="size-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-slate-800">Hakuna mikataba iliyopatikana</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        Bofya kitufe cha "Andaa Mkataba Mpya" kuanzisha mkataba halali kwa mpangaji wako.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredAgreements.map((ag) => (
                        <div
                            key={ag.id}
                            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                        >
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                                        {ag.agreement_number}
                                    </span>
                                    {getStatusBadge(ag.status)}
                                </div>

                                <div>
                                    <h3 className="font-extrabold text-base text-slate-900">{ag.tenant_name}</h3>
                                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                        <Home className="size-3.5 text-blue-500" />
                                        {ag.property_name || 'Nyumba'} • {ag.unit_number || 'Chumba'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-xs">
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-medium block">Kodi kwa Mwezi</span>
                                        <span className="font-extrabold text-slate-800">TZS {Number(ag.monthly_rent).toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-medium block">Amana (Deposit)</span>
                                        <span className="font-extrabold text-slate-800">TZS {Number(ag.security_deposit).toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-medium block">Muda wa Mkataba</span>
                                        <span className="font-semibold text-slate-700">{ag.duration_months} Miezi</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-medium block">Tarehe ya Kuanza</span>
                                        <span className="font-semibold text-slate-700">{ag.start_date}</span>
                                    </div>
                                </div>

                                {/* Signatures overview */}
                                <div className="space-y-1.5 text-[11px]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 flex items-center gap-1">
                                            <User className="size-3 text-slate-400" /> Sahihi ya Mpangaji:
                                        </span>
                                        <span className={ag.tenant_signed_at ? 'text-emerald-700 font-bold flex items-center gap-1' : 'text-amber-600 font-medium'}>
                                            {ag.tenant_signed_at ? <><Check className="size-3" /> Imesainiwa</> : 'Bado kusaini'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 flex items-center gap-1">
                                            <ShieldCheck className="size-3 text-slate-400" /> Sahihi ya Mmiliki:
                                        </span>
                                        <span className={ag.landlord_signed_at ? 'text-emerald-700 font-bold flex items-center gap-1' : 'text-amber-600 font-medium'}>
                                            {ag.landlord_signed_at ? <><Check className="size-3" /> Imesainiwa</> : 'Bado kusaini'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                                <button
                                    onClick={() => setSelectedAgreement(ag)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                                >
                                    <Eye className="size-3.5 text-slate-500" /> Uhakiki (View)
                                </button>

                                <div className="flex items-center gap-2">
                                    <a
                                        href={`/landlord/agreements/${ag.id}/print`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                                        title="Chapisha au Pakua Mkataba (PDF)"
                                    >
                                        <Printer className="size-4" />
                                    </a>

                                    {ag.status === 'tenant_signed' && (
                                        <button
                                            onClick={() => setSigningAgreement(ag)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                                        >
                                            <PenTool className="size-3.5" /> Saini Sasa
                                        </button>
                                    )}

                                    {ag.status === 'draft' && (
                                        <button
                                            onClick={() => setSigningAgreement(ag)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-all"
                                        >
                                            Saini Awali
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* PREPARE NEW AGREEMENT DRAFT MODAL WITH PREVIEW AND SAVE */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                                    <FileText className="size-5 text-blue-600" />
                                    {previewStep ? 'Uhakiki wa Mkataba Kabla ya Kuhifadhi' : 'Andaa Mkataba wa Upangaji (Mkataba wa Nyumba)'}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {previewStep
                                        ? 'Hakiki vipengele vyote 12 vya kisheria kabla ya kumtumia mpangaji.'
                                        : 'Jaza taarifa sahihi za mpangaji, kodi, amana na chumba.'}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-5">
                            {!previewStep ? (
                                <form id="draftForm" onSubmit={(e) => { e.preventDefault(); setPreviewStep(true); }} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Jina la Nyumba / Estate</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.property_name}
                                                onChange={(e) => setFormData({ ...formData, property_name: e.target.value })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Namba ya Chumba / Unit</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.unit_number}
                                                onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                                                placeholder="mfano: Room 4 - Wing B"
                                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                                        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Taarifa za Mpangaji</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Jina Kamili la Mpangaji</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.tenant_name}
                                                    onChange={(e) => setFormData({ ...formData, tenant_name: e.target.value })}
                                                    placeholder="Hamisi Bakari"
                                                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Namba ya Simu</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.tenant_phone}
                                                    onChange={(e) => setFormData({ ...formData, tenant_phone: e.target.value })}
                                                    placeholder="+255 712 345 678"
                                                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Barua Pepe (Email)</label>
                                                <input
                                                    type="email"
                                                    value={formData.tenant_email}
                                                    onChange={(e) => setFormData({ ...formData, tenant_email: e.target.value })}
                                                    placeholder="hamisi@example.com"
                                                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 mb-1">NIDA / Kitambulisho</label>
                                                <input
                                                    type="text"
                                                    value={formData.tenant_national_id}
                                                    onChange={(e) => setFormData({ ...formData, tenant_national_id: e.target.value })}
                                                    placeholder="19900101-12345-00001-22"
                                                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Kodi ya Mwezi (TZS)</label>
                                            <input
                                                type="number"
                                                required
                                                value={formData.monthly_rent}
                                                onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Amana / Deposit (TZS)</label>
                                            <input
                                                type="number"
                                                required
                                                value={formData.security_deposit}
                                                onChange={(e) => setFormData({ ...formData, security_deposit: e.target.value })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Muda (Miezi)</label>
                                            <select
                                                value={formData.duration_months}
                                                onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="3">Miezi 3</option>
                                                <option value="6">Miezi 6</option>
                                                <option value="12">Mwaka 1 (Miezi 12)</option>
                                                <option value="24">Miaka 2 (Miezi 24)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Tarehe ya Kuanza Upangaji</label>
                                            <input
                                                type="date"
                                                required
                                                value={formData.start_date}
                                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Lugha ya Mkataba</label>
                                            <select
                                                value={formData.language}
                                                onChange={(e) => setFormData({ ...formData, language: e.target.value as any })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="sw">Kiswahili (Mkataba wa Upangaji)</option>
                                                <option value="en">English (Residential Tenancy Agreement)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Move-in Readings */}
                                    <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                                        <h4 className="text-xs font-extrabold text-amber-900">Vipimo vya Awali (Handover Meter Readings)</h4>
                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div>
                                                <label className="block text-[11px] text-amber-800 font-medium mb-1">Vitengo vya LUKU (kWh)</label>
                                                <input
                                                    type="number"
                                                    value={formData.electricity_token_units}
                                                    onChange={(e) => setFormData({ ...formData, electricity_token_units: e.target.value })}
                                                    className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] text-amber-800 font-medium mb-1">Mita ya Maji (m³)</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={formData.water_meter_reading}
                                                    onChange={(e) => setFormData({ ...formData, water_meter_reading: e.target.value })}
                                                    className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                /* STEP 2: PREVIEW TERMS ACCORDING TO USER REQUIREMENTS */
                                <div className="space-y-4 text-xs">
                                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">HAKIKI NA THIBITISHA</span>
                                            <h4 className="font-extrabold text-blue-950 text-sm">
                                                Mkataba wa Upangaji: {formData.tenant_name || 'Mpangaji'}
                                            </h4>
                                            <p className="text-blue-800 text-[11px]">
                                                {formData.property_name} — {formData.unit_number} (TZS {Number(formData.monthly_rent).toLocaleString()}/mwezi)
                                            </p>
                                        </div>
                                        <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-extrabold text-[11px]">
                                            Hatua ya 2/2
                                        </span>
                                    </div>

                                    <div className="border border-slate-200 rounded-2xl p-4 max-h-72 overflow-y-auto space-y-3 bg-slate-50/50">
                                        <div className="text-center pb-3 border-b border-slate-200">
                                            <h4 className="font-extrabold text-sm text-slate-900 uppercase">
                                                MKATABA WA UPANGAJI WA MAKAZI
                                            </h4>
                                            <p className="text-[11px] text-slate-500">
                                                Kifungu Na. 1 Hadi Na. 12 vya Sheria na Masharti ya Upangaji Tanzania
                                            </p>
                                        </div>

                                        <div className="space-y-2.5 text-slate-700 leading-relaxed">
                                            <p><strong>1. Pande Zinazohusika:</strong> Mmiliki (Ibrahim Kimaro) na Mpangaji ({formData.tenant_name || 'Mpangaji mtarajiwa'}, NIDA: {formData.tenant_national_id || 'Haijabainishwa'}).</p>
                                            <p><strong>2. Eneo la Upangaji:</strong> Nyumba ya {formData.property_name}, {formData.unit_number}.</p>
                                            <p><strong>3. Muda:</strong> Miezi {formData.duration_months} kuanzia tarehe {formData.start_date}.</p>
                                            <p><strong>4. Kodi:</strong> TZS {Number(formData.monthly_rent).toLocaleString()} kwa kila mwezi, ikilipwa tarehe 1 ya kila mwezi husika.</p>
                                            <p><strong>5. Amana (Security Deposit):</strong> TZS {Number(formData.security_deposit).toLocaleString()} kwa ajili ya kulinda mali na matengenezo wakati wa kuondoka.</p>
                                            <p><strong>6. Huduma (LUKU & Maji):</strong> Mpangaji anawajibika kulipia umeme na maji kulingana na matumizi yake.</p>
                                            <p><strong>7. Masharti ya Ukaaji:</strong> Chumba hiki ni cha makazi ya kifamilia pekee. Ni marufuku kupangisha mtu mwingine (subletting).</p>
                                            <p><strong>8. Utunzaji na Matengenezo:</strong> Mpangaji atalinda miundombinu na kurudisha katika hali safi.</p>
                                            <p><strong>9. Kuingia na Ukaguzi:</strong> Mmiliki anayo haki ya kukagua kwa kutoa taarifa ya saa 24 kabla.</p>
                                            <p><strong>10. Kusitisha Mkataba:</strong> Taarifa ya mwezi mmoja (siku 30) kwa maandishi inahitajika kabla ya kuondoka.</p>
                                            <p><strong>11. Utatuzi wa Migogoro:</strong> Mazungumzo ya amani na usuluhishi kisheria.</p>
                                            <p><strong>12. Uhalali wa Sahihi:</strong> Sahihi za kielektroniki zina nguvu ya kisheria pindi zote zikithibitishwa.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-slate-100 flex items-center justify-between">
                            {!previewStep ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                                    >
                                        Ghairi (Cancel)
                                    </button>
                                    <button
                                        type="submit"
                                        form="draftForm"
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
                                    >
                                        Hakiki Masharti (Preview Terms) <ChevronRight className="size-4" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewStep(false)}
                                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                                    >
                                        Rudi Nyuma (Edit Details)
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={handlePrepareDraft}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <>Inahifadhi...</>
                                        ) : (
                                            <>
                                                <Send className="size-4" /> Thibitisha na Tuma kwa Mpangaji
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* DETAIL TERMS MODAL */}
            {selectedAgreement && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-mono font-bold text-blue-600 uppercase">
                                    {selectedAgreement.agreement_number}
                                </span>
                                <h3 className="font-extrabold text-base text-slate-900">
                                    Mkataba wa Upangaji — {selectedAgreement.tenant_name}
                                </h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={`/landlord/agreements/${selectedAgreement.id}/print`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                                >
                                    <Printer className="size-3.5" /> Chapisha
                                </a>
                                <button
                                    onClick={() => setSelectedAgreement(null)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4 text-xs">
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                    <span className="text-slate-400 block text-[10px]">Chumba</span>
                                    <span className="font-bold text-slate-800">{selectedAgreement.unit_number}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px]">Kodi</span>
                                    <span className="font-bold text-slate-800">TZS {Number(selectedAgreement.monthly_rent).toLocaleString()}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px]">Amana</span>
                                    <span className="font-bold text-slate-800">TZS {Number(selectedAgreement.security_deposit).toLocaleString()}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px]">Hali</span>
                                    <span className="font-bold capitalize text-slate-800">{selectedAgreement.status}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-bold text-slate-800 text-sm">Vipengele vya Kisheria (12 Sections):</h4>
                                {selectedAgreement.terms_sections && selectedAgreement.terms_sections.length > 0 ? (
                                    selectedAgreement.terms_sections.map((sec, idx) => (
                                        <div key={idx} className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                                            <h5 className="font-bold text-slate-900 text-xs mb-1">{sec.title}</h5>
                                            <p className="text-slate-600 text-[11px] leading-relaxed whitespace-pre-line">{sec.content}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-slate-500 italic">Masharti 12 ya kisheria yameandaliwa kulingana na sheria za upangaji za Tanzania.</p>
                                )}
                            </div>

                            {/* Inventory & Meter readings */}
                            {selectedAgreement.meter_readings && (
                                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200">
                                    <h5 className="font-bold text-amber-900 text-xs mb-1">Vipimo vya Mita (Meter Readings):</h5>
                                    <div className="flex gap-6 text-[11px] text-amber-800">
                                        <span>LUKU: {selectedAgreement.meter_readings.electricity_token_units || 0} kWh</span>
                                        <span>Maji: {selectedAgreement.meter_readings.water_meter_reading || 0} m³</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-5 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedAgreement(null)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200"
                            >
                                Funga
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* COUNTERSIGN / SIGN MODAL */}
            {signingAgreement && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <PenTool className="size-5 text-emerald-600" />
                                <h3 className="font-extrabold text-base text-slate-900">Weka Sahihi ya Mmiliki</h3>
                            </div>
                            <button onClick={() => setSigningAgreement(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                            <p className="font-bold">Mkataba: {signingAgreement.agreement_number}</p>
                            <p>Mpangaji: <strong>{signingAgreement.tenant_name}</strong></p>
                            <p>Kodi: TZS {Number(signingAgreement.monthly_rent).toLocaleString()} / mwezi</p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Jina la Mwenye Nyumba (Signer)</label>
                                <input
                                    type="text"
                                    value={signerName}
                                    onChange={(e) => setSignerName(e.target.value)}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                                />
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                                <label className="flex items-start gap-2 cursor-pointer">
                                    <input type="checkbox" defaultChecked required className="mt-0.5 rounded text-emerald-600" />
                                    <span>
                                        Ninathibitisha kuwa nimeyasoma na kukubaliana na masharti yote ya mkataba huu, na ninatoa idhini ya kuwasha upangaji (activate tenancy) mara moja.
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setSigningAgreement(null)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                            >
                                Ghairi
                            </button>
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={handleCountersign}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? 'Inasaini...' : 'Saini na Washa Upangaji'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

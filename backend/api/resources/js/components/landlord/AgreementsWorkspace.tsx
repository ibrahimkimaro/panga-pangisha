import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileCheck, Plus, CheckCircle2, Clock, AlertTriangle, ShieldCheck,
    Download, Eye, Edit3, X, Printer, Globe, Calendar, User, Phone,
    Building2, DollarSign, Sparkles, Send, Check
} from 'lucide-react';

interface Agreement {
    id: number;
    agreement_number: string;
    language: string;
    version: number;
    status: 'draft' | 'pending_tenant_signature' | 'pending_landlord_signature' | 'signed' | 'active' | 'cancelled';
    tenant_name: string;
    tenant_phone: string;
    tenant_email?: string;
    tenant_nida?: string;
    property_name: string;
    unit_number: string;
    monthly_rent: number;
    security_deposit: number;
    payment_frequency: string;
    starts_on: string;
    ends_on?: string;
    duration_months: number;
    payment_method: string;
    terms?: any;
    inventory?: Array<{ item: string; quantity: number; condition: string }>;
    meter_readings?: { luku_meter_number?: string; luku_initial_units?: string; water_meter_reading?: string };
    tenant_signature?: string;
    tenant_signed_at?: string;
    tenant_signer_name?: string;
    landlord_signature?: string;
    landlord_signed_at?: string;
    landlord_signer_name?: string;
    activated_at?: string;
    house?: { id: number; property_name: string };
    unit?: { id: number; unit_number: string };
}

interface AgreementsWorkspaceProps {
    initialAgreements?: Agreement[];
    properties?: Array<{ id: number; name: string }>;
    rooms?: Array<{ id: number; room: string }>;
    onAgreementCreated?: (agreement: Agreement) => void;
}

export default function AgreementsWorkspace({
    initialAgreements = [],
    properties = [],
    rooms = [],
    onAgreementCreated,
}: AgreementsWorkspaceProps) {
    const [agreements, setAgreements] = useState<Agreement[]>(initialAgreements);
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending_landlord_signature' | 'pending_tenant_signature' | 'draft'>('all');
    
    // Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
    const [previewLanguage, setPreviewLanguage] = useState<'sw' | 'en'>('sw');
    const [notification, setNotification] = useState<{ title: string; message: string; type: string } | null>(null);

    // Form state for creating agreement
    const [formData, setFormData] = useState({
        house_id: properties[0]?.id || 23,
        unit_number: 'Room 4',
        tenant_name: '',
        tenant_phone: '',
        tenant_email: '',
        tenant_nida: '',
        monthly_rent: 450000,
        security_deposit: 450000,
        starts_on: new Date().toISOString().split('T')[0],
        duration_months: 6,
        payment_frequency: 'monthly',
        language: 'sw',
        payment_method: 'M-Pesa / Tigo Pesa (Simu ya Mkononi)',
    });

    // Countersigning state
    const [signerName, setSignerName] = useState('Ibrahim Kimaro');
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [isSigning, setIsSigning] = useState(false);

    const filteredAgreements = agreements.filter((ag) => {
        if (statusFilter === 'all') return true;
        return ag.status === statusFilter;
    });

    const pendingCountersignCount = agreements.filter(a => a.status === 'pending_landlord_signature').length;

    // Handle Create Draft
    const handleCreateDraft = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/landlord/agreements/draft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.success && data.agreement) {
                setAgreements([data.agreement, ...agreements]);
                setIsCreateOpen(false);
                setSelectedAgreement(data.agreement);
                setPreviewLanguage(data.agreement.language === 'en' ? 'en' : 'sw');
                setNotification({
                    type: 'success',
                    title: 'Mkataba Umeandaliwa Kikamilifu (Preview Ready)',
                    message: data.notification?.message || 'Tafadhali hakiki mkataba kabla ya kumtumia mpangaji au kuuhifadhi.',
                });
                if (onAgreementCreated) onAgreementCreated(data.agreement);
            } else {
                alert(data.error || 'Failed to create agreement draft.');
            }
        } catch (err: any) {
            alert('Error creating agreement: ' + err.message);
        }
    };

    // Handle Landlord Countersign
    const handleCountersign = async (agreementId: number) => {
        if (!acceptTerms) {
            alert('Tafadhali thibitisha kukubali masharti ya mkataba kwanza.');
            return;
        }
        setIsSigning(true);
        try {
            const res = await fetch(`/landlord/agreements/${agreementId}/sign-landlord`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    signer_name: signerName,
                    accept_terms: true,
                    signature: `SIGNED_ELECTRONICALLY:${signerName}`,
                }),
            });
            const data = await res.json();
            if (data.success && data.agreement) {
                setAgreements(agreements.map(a => a.id === data.agreement.id ? data.agreement : a));
                setSelectedAgreement(data.agreement);
                setNotification({
                    type: 'success',
                    title: 'Mkataba Umesainiwa na Upangaji Umeanza (Activated)!',
                    message: 'Umeweka saini yako rasmi. Upangaji sasa uko hai na ankara ya kwanza imezalishwa.',
                });
            } else {
                alert(data.error || 'Failed to countersign.');
            }
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setIsSigning(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Notification Banner when draft is ready */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-teal-500/30 flex items-start justify-between gap-3 shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-teal-500 text-white flex items-center justify-center shrink-0 shadow">
                                <Sparkles className="size-4" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900">{notification.title}</h4>
                                <p className="text-xs text-slate-600 mt-0.5">{notification.message}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setNotification(null)}
                            className="text-slate-400 hover:text-slate-600 text-xs font-semibold p-1"
                        >
                            <X className="size-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Countersign Action Alert if needed */}
            {pendingCountersignCount > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="size-5 text-amber-600 shrink-0" />
                        <div>
                            <span className="text-sm font-bold text-amber-900">
                                Hatua Inahitajika (Action Required): Kuna mkataba {pendingCountersignCount} unaosubiri saini yako!
                            </span>
                            <p className="text-xs text-amber-700 mt-0.5">
                                Mpangaji amekwishasaini mkataba wake kielektroniki. Weka saini yako ya mwisho ili mkataba uwe halali na kuanza rasmi.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            const pending = agreements.find(a => a.status === 'pending_landlord_signature');
                            if (pending) {
                                setSelectedAgreement(pending);
                                setPreviewLanguage(pending.language === 'en' ? 'en' : 'sw');
                            }
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 shadow-sm transition-all"
                    >
                        Weka Saini Sasa
                    </button>
                </div>
            )}

            {/* Header with Title & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <FileCheck className="size-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">
                                Mikataba ya Upangishaji (Residential Lease Agreements)
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Mfumo rasmi wa kisheria wa kuandaa, kuhakiki (preview), kusaini na kutunza mikataba ya upangishaji kwa lugha ya Kiswahili na Kiingereza.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
                    >
                        <Plus className="size-4" /> Andaa Mkataba Mpya
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2">
                {[
                    { id: 'all', label: 'Mikataba Yote (All)' },
                    { id: 'active', label: 'Hai / Inayotumika (Active)' },
                    { id: 'pending_landlord_signature', label: 'Inayosubiri Saini ya Mwenye Nyumba' },
                    { id: 'pending_tenant_signature', label: 'Inayosubiri Mpangaji' },
                    { id: 'draft', label: 'Rasimu (Drafts)' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setStatusFilter(tab.id as any)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                            statusFilter === tab.id
                                ? 'bg-slate-900 text-white shadow-sm'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Agreements Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredAgreements.map((agreement) => {
                    const isFullySigned = agreement.tenant_signature && agreement.landlord_signature;
                    const isAwaitingLandlord = agreement.status === 'pending_landlord_signature';

                    return (
                        <div
                            key={agreement.id}
                            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                        >
                            <div>
                                {/* Status badge */}
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[11px] font-mono font-bold text-slate-400">
                                        {agreement.agreement_number}
                                    </span>
                                    {agreement.status === 'active' ? (
                                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex items-center gap-1">
                                            <CheckCircle2 className="size-3" /> Imesainiwa (Active)
                                        </span>
                                    ) : isAwaitingLandlord ? (
                                        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold flex items-center gap-1 animate-pulse">
                                            <AlertTriangle className="size-3" /> Inasubiri Saini Yako
                                        </span>
                                    ) : agreement.status === 'pending_tenant_signature' ? (
                                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold flex items-center gap-1">
                                            <Clock className="size-3" /> Inasubiri Mpangaji
                                        </span>
                                    ) : (
                                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                                            Rasimu (Draft)
                                        </span>
                                    )}
                                </div>

                                <h3 className="font-bold text-slate-900 text-base">
                                    {agreement.tenant_name}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                    <Building2 className="size-3 text-slate-400" />
                                    {agreement.property_name} • <span className="font-bold text-slate-700">{agreement.unit_number}</span>
                                </p>

                                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Kodi ya Mwezi:</span>
                                        <span className="font-extrabold text-slate-900">
                                            TZS {Number(agreement.monthly_rent).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Dhamana (Deposit):</span>
                                        <span className="font-bold text-slate-900">
                                            TZS {Number(agreement.security_deposit).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Muda wa Mkataba:</span>
                                        <span className="font-semibold text-slate-700">
                                            {agreement.starts_on} hadi {agreement.ends_on || 'Muda Maalum'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Lugha ya Mkataba:</span>
                                        <span className="font-bold uppercase tracking-wider text-slate-700">
                                            {agreement.language === 'en' ? 'English' : 'Kiswahili'}
                                        </span>
                                    </div>
                                </div>

                                {/* Signatures Summary Indicator */}
                                <div className="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-around text-[11px]">
                                    <div className="flex items-center gap-1.5">
                                        <div className={`size-2 rounded-full ${agreement.tenant_signature ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                        <span className={agreement.tenant_signature ? 'text-slate-800 font-bold' : 'text-slate-400'}>
                                            Mpangaji
                                        </span>
                                    </div>
                                    <div className="w-4 h-[1px] bg-slate-200" />
                                    <div className="flex items-center gap-1.5">
                                        <div className={`size-2 rounded-full ${agreement.landlord_signature ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                        <span className={agreement.landlord_signature ? 'text-slate-800 font-bold' : 'text-slate-400'}>
                                            Mwenye Nyumba
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setSelectedAgreement(agreement);
                                        setPreviewLanguage(agreement.language === 'en' ? 'en' : 'sw');
                                    }}
                                    className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                >
                                    <Eye className="size-3.5" /> Hakiki (Preview)
                                </button>
                                {isAwaitingLandlord && (
                                    <button
                                        onClick={() => {
                                            setSelectedAgreement(agreement);
                                            setPreviewLanguage(agreement.language === 'en' ? 'en' : 'sw');
                                        }}
                                        className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1 transition-all shadow-sm"
                                    >
                                        <Edit3 className="size-3.5" /> Saini
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* CREATE AGREEMENT MODAL (Wizard Form) */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative my-8">
                        <button
                            onClick={() => setIsCreateOpen(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
                        >
                            <X className="size-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="size-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                <FileCheck className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">
                                    Andaa Mkataba wa Upangishaji (Prepare Agreement)
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Weka taarifa za chumba na mpangaji. Mfumo utazalisha mkataba kamili kwa mujibu wa Sheria za Tanzania kwa ajili ya ukaguzi (preview).
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleCreateDraft} className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Jengo / Nyumba (Property)</label>
                                    <select
                                        value={formData.house_id}
                                        onChange={(e) => setFormData({ ...formData, house_id: Number(e.target.value) })}
                                        className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {properties.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Namba ya Chumba / Unit</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.unit_number}
                                        onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                                        placeholder="mf. Room 4, Wing B"
                                        className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Jina Kamili la Mpangaji (Tenant Name)</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.tenant_name}
                                        onChange={(e) => setFormData({ ...formData, tenant_name: e.target.value })}
                                        placeholder="mf. Juma Bakari"
                                        className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Namba ya Simu (Phone)</label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.tenant_phone}
                                        onChange={(e) => setFormData({ ...formData, tenant_phone: e.target.value })}
                                        placeholder="+255 7XX XXX XXX"
                                        className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Barua Pepe (Email - Hiari)</label>
                                    <input
                                        type="email"
                                        value={formData.tenant_email}
                                        onChange={(e) => setFormData({ ...formData, tenant_email: e.target.value })}
                                        placeholder="mpangaji@example.com"
                                        className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Namba ya NIDA (Kitambulisho)</label>
                                    <input
                                        type="text"
                                        value={formData.tenant_nida}
                                        onChange={(e) => setFormData({ ...formData, tenant_nida: e.target.value })}
                                        placeholder="XXXXXXXX-XXXXX-XXXXX-XX"
                                        className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Kodi ya Mwezi (Monthly Rent TZS)</label>
                                    <input
                                        type="number"
                                        required
                                        min={1000}
                                        value={formData.monthly_rent}
                                        onChange={(e) => setFormData({ ...formData, monthly_rent: Number(e.target.value) })}
                                        className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Dhamana (Security Deposit TZS)</label>
                                    <input
                                        type="number"
                                        required
                                        min={0}
                                        value={formData.security_deposit}
                                        onChange={(e) => setFormData({ ...formData, security_deposit: Number(e.target.value) })}
                                        className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Tarehe ya Kuanza (Start Date)</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.starts_on}
                                        onChange={(e) => setFormData({ ...formData, starts_on: e.target.value })}
                                        className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Muda (Miezi / Months)</label>
                                    <select
                                        value={formData.duration_months}
                                        onChange={(e) => setFormData({ ...formData, duration_months: Number(e.target.value) })}
                                        className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value={3}>Miezi 3 (3 Months)</option>
                                        <option value={6}>Miezi 6 (6 Months)</option>
                                        <option value={12}>Mwaka 1 (12 Months)</option>
                                        <option value={24}>Miaka 2 (24 Months)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Lugha ya Mkataba</label>
                                    <select
                                        value={formData.language}
                                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                        className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                                    >
                                        <option value="sw">Kiswahili</option>
                                        <option value="en">English</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                                >
                                    Ghairi (Cancel)
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2"
                                >
                                    <Sparkles className="size-4" /> Andaa Rasimu & Hakiki (Preview)
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* FULL LEGAL AGREEMENT PREVIEW & SIGN MODAL */}
            {selectedAgreement && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-10 border border-slate-200 shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                                    {selectedAgreement.agreement_number}
                                </span>
                                <span className="text-xs text-slate-400 font-semibold">Toleo #{selectedAgreement.version}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Language toggle button */}
                                <button
                                    onClick={() => setPreviewLanguage(previewLanguage === 'sw' ? 'en' : 'sw')}
                                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                                >
                                    <Globe className="size-3.5" />
                                    {previewLanguage === 'sw' ? 'Soma kwa Kiingereza' : 'Read in Kiswahili'}
                                </button>

                                <button
                                    onClick={() => window.print()}
                                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
                                    title="Print"
                                >
                                    <Printer className="size-4" />
                                </button>

                                <button
                                    onClick={() => setSelectedAgreement(null)}
                                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>
                        </div>

                        {/* Contract Scrollable Paper View */}
                        <div className="overflow-y-auto flex-1 pr-2 mt-4 space-y-6 text-slate-800 font-sans print:text-black">
                            {/* Official Seal & Header */}
                            <div className="text-center pb-6 border-b border-slate-200">
                                <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                                    JAMHURI YA MUUNGANO WA TANZANIA • UNITED REPUBLIC OF TANZANIA
                                </p>
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 uppercase tracking-tight">
                                    {previewLanguage === 'sw' 
                                        ? 'MKATABA WA UPANGISHAJI WA NYUMBA YA MAKAZI' 
                                        : 'RESIDENTIAL LEASE AGREEMENT'}
                                </h1>
                                <p className="text-xs text-slate-500 mt-1 font-serif italic">
                                    {previewLanguage === 'sw'
                                        ? 'Chini ya Sheria na Taratibu za Upangishaji za Jamhuri ya Muungano wa Tanzania'
                                        : 'Conforming to the Laws and Housing Guidelines of the United Republic of Tanzania'}
                                </p>
                            </div>

                            {/* Section 1: Parties */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-700 mb-3">
                                    1. PANDE ZINAZOHUSIKA / PARTIES TO THE AGREEMENT
                                </h4>
                                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                                        <p className="font-extrabold text-slate-900">MWENYE NYUMBA (LANDLORD):</p>
                                        <p className="mt-1 font-semibold">{selectedAgreement.landlord_signer_name || 'Ibrahim Kimaro'}</p>
                                        <p className="text-slate-500">Simu: +255 712 345 678</p>
                                        <p className="text-slate-500">Mkoa: Dar es Salaam, Tanzania</p>
                                    </div>
                                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                                        <p className="font-extrabold text-slate-900">MPANGAJI (TENANT):</p>
                                        <p className="mt-1 font-semibold">{selectedAgreement.tenant_name}</p>
                                        <p className="text-slate-500">Simu: {selectedAgreement.tenant_phone}</p>
                                        <p className="text-slate-500">NIDA: {selectedAgreement.tenant_nida || 'Imewasilishwa'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Property */}
                            <div className="space-y-1.5 text-xs leading-relaxed">
                                <h4 className="font-bold text-slate-900 text-sm">
                                    2. MAHALI NA CHUMBA KINACHOPANGISHWA (THE PREMISES)
                                </h4>
                                <p className="text-slate-600">
                                    Mwenye nyumba amekubali kumpangisha mpangaji, na mpangaji amekubali kupanga chumba namba{' '}
                                    <strong className="text-slate-900 font-bold">{selectedAgreement.unit_number}</strong> kilichopo kwenye jengo la{' '}
                                    <strong className="text-slate-900 font-bold">{selectedAgreement.property_name}</strong>, lililopo Kinondoni, Dar es Salaam.
                                    Chumba hiki kitatumika kwa shughuli za <strong>makazi binafsi tu</strong>.
                                </p>
                            </div>

                            {/* Section 3: Tenancy Period */}
                            <div className="space-y-1.5 text-xs leading-relaxed">
                                <h4 className="font-bold text-slate-900 text-sm">
                                    3. MUDA WA UPANGISHAJI (TENANCY PERIOD & RENEWAL)
                                </h4>
                                <p className="text-slate-600">
                                    Mkataba huu utaanza rasmi tarehe <strong>{selectedAgreement.starts_on}</strong> na utamalizika tarehe{' '}
                                    <strong>{selectedAgreement.ends_on || 'Mwisho wa Kipindi'}</strong> (Muda wa miezi {selectedAgreement.duration_months}).
                                    Mkataba unaweza kuongezwa kwa makubaliano ya maandishi ya pande zote mbili mwezi mmoja (1) kabla ya kumalizika kwake.
                                </p>
                            </div>

                            {/* Section 4: Rent & Payment */}
                            <div className="space-y-1.5 text-xs leading-relaxed">
                                <h4 className="font-bold text-slate-900 text-sm">
                                    4. KODI YA PANGO NA UTARATIBU WA MALIPO (RENT & TERMS)
                                </h4>
                                <p className="text-slate-600">
                                    Kodi ya pango ni <strong>TZS {Number(selectedAgreement.monthly_rent).toLocaleString()}</strong> kwa mwezi.
                                    Kodi italipwa kila tarehe 1 ya mwezi kupitia njia ya <strong>{selectedAgreement.payment_method}</strong>.
                                    Ucheleweshaji wa zaidi ya siku 5 utatozwa faini ya 5% ya kodi ya mwezi.
                                </p>
                            </div>

                            {/* Section 5: Security Deposit */}
                            <div className="space-y-1.5 text-xs leading-relaxed">
                                <h4 className="font-bold text-slate-900 text-sm">
                                    5. DHAMANA YA NYUMBA (SECURITY DEPOSIT)
                                </h4>
                                <p className="text-slate-600">
                                    Mpangaji ataweka dhamana ya <strong>TZS {Number(selectedAgreement.security_deposit).toLocaleString()}</strong> kwa ajili ya kulinda mali na kuhakikisha bili zote zinalipwa.
                                    Dhamana hii itarudishwa yote ndani ya siku 14 baada ya mpangaji kuhama kistaarabu na kukagua chumba bila uharibifu.
                                </p>
                            </div>

                            {/* Section 6: Utilities */}
                            <div className="space-y-1.5 text-xs leading-relaxed">
                                <h4 className="font-bold text-slate-900 text-sm">
                                    6. HUDUMA ZA UMEME NA MAJI (UTILITIES)
                                </h4>
                                <p className="text-slate-600">
                                    (a) <strong>Umeme (LUKU):</strong> Mpangaji atawajibika kununua umeme kulingana na matumizi yake kupitia mita ya chumba #
                                    {selectedAgreement.meter_readings?.luku_meter_number || '14238910291'}.
                                    <br />
                                    (b) <strong>Maji (DAWASA):</strong> Mpangaji atachangia bili ya maji kulingana na usomaji wa mita ya maji.
                                </p>
                            </div>

                            {/* Section 7: Maintenance & Access */}
                            <div className="space-y-1.5 text-xs leading-relaxed">
                                <h4 className="font-bold text-slate-900 text-sm">
                                    7. MATENGENEZO NA UKAGUZI (MAINTENANCE & INSPECTION)
                                </h4>
                                <p className="text-slate-600">
                                    Mwenye nyumba anawajibika kwa uharibifu mkubwa wa miundombinu (paa, mfumo mkuu wa maji).
                                    Mpangaji anawajibika kwa usafi wa kila siku na kurekebisha vifaa vidogo vilivyoharibika kwa matumizi yake.
                                    Mwenye nyumba atatoa taarifa ya saa 24 kabla ya kukagua chumba.
                                </p>
                            </div>

                            {/* Inventory Checklist */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                                    ORODHA YA VIFAA VILIVYOKABIDHIWA (HANDOVER INVENTORY)
                                </h4>
                                <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-slate-600">
                                    <span>Kifaa / Item</span>
                                    <span>Idadi</span>
                                    <span>Hali / Condition</span>
                                </div>
                                <div className="mt-2 space-y-1 text-xs text-slate-800">
                                    {(selectedAgreement.inventory || [
                                        { item: 'Ufunguo wa Chumba na Geti', quantity: 2, condition: 'Mpya / Mzuri' },
                                        { item: 'Soketi na Swichi za Umeme', quantity: 4, condition: 'Zinafanya kazi' },
                                        { item: 'Madirisha ya Vioo', quantity: 2, condition: 'Mazima' },
                                    ]).map((inv, idx) => (
                                        <div key={idx} className="grid grid-cols-3 gap-2 py-1 border-t border-slate-200">
                                            <span>{inv.item}</span>
                                            <span>{inv.quantity}</span>
                                            <span className="text-emerald-700 font-bold">{inv.condition}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Signatures Box */}
                            <div className="p-5 rounded-2xl bg-slate-100 border border-slate-200 mt-6">
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4 text-center">
                                    UTHIBITISHO NA SAINI ZA PANDE ZOTE (DUAL ELECTRONIC SIGNATURES)
                                </h4>

                                <div className="grid sm:grid-cols-2 gap-6">
                                    {/* Tenant Signature Column */}
                                    <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col justify-between">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                Saini ya Mpangaji (Tenant)
                                            </span>
                                            <p className="font-bold text-slate-900 text-sm mt-1">{selectedAgreement.tenant_name}</p>
                                        </div>

                                        <div className="my-4 py-3 px-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center">
                                            {selectedAgreement.tenant_signature ? (
                                                <div className="space-y-1">
                                                    <span className="font-serif italic text-base text-blue-900 font-bold">
                                                        {selectedAgreement.tenant_signer_name || selectedAgreement.tenant_name}
                                                    </span>
                                                    <p className="text-[10px] text-emerald-700 font-bold flex items-center justify-center gap-1">
                                                        <ShieldCheck className="size-3" /> Imethibitishwa Kielektroniki
                                                    </p>
                                                    <p className="text-[9px] text-slate-400">
                                                        Tarehe: {selectedAgreement.tenant_signed_at || 'Siku ya makubaliano'}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="py-2 text-slate-400 text-xs italic font-semibold">
                                                    Bado haijasainiwa na mpangaji
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Landlord Countersignature Column */}
                                    <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col justify-between">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                Saini ya Mwenye Nyumba (Landlord)
                                            </span>
                                            <p className="font-bold text-slate-900 text-sm mt-1">
                                                {selectedAgreement.landlord_signer_name || 'Ibrahim Kimaro'}
                                            </p>
                                        </div>

                                        <div className="my-4 py-3 px-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center">
                                            {selectedAgreement.landlord_signature ? (
                                                <div className="space-y-1">
                                                    <span className="font-serif italic text-base text-blue-900 font-bold">
                                                        {selectedAgreement.landlord_signer_name || 'Ibrahim Kimaro'}
                                                    </span>
                                                    <p className="text-[10px] text-emerald-700 font-bold flex items-center justify-center gap-1">
                                                        <ShieldCheck className="size-3" /> Mwenye Nyumba Amesaini
                                                    </p>
                                                    <p className="text-[9px] text-slate-400">
                                                        Tarehe: {selectedAgreement.landlord_signed_at || 'Imeamilishwa'}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="py-2 text-amber-700 text-xs font-bold">
                                                    Inasubiri saini yako ya kuidhinisha
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Landlord Countersign Action Box if pending */}
                                {!selectedAgreement.landlord_signature && selectedAgreement.tenant_signature && (
                                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="acceptAgreementTerms"
                                                checked={acceptTerms}
                                                onChange={(e) => setAcceptTerms(e.target.checked)}
                                                className="size-4 rounded text-blue-600 focus:ring-blue-500"
                                            />
                                            <label htmlFor="acceptAgreementTerms" className="text-xs font-bold text-slate-800">
                                                Ninathibitisha kuwa nimehakiki mkataba huu na kukubaliana na masharti yote kama Mwenye Nyumba (Landlord).
                                            </label>
                                        </div>

                                        <button
                                            type="button"
                                            disabled={!acceptTerms || isSigning}
                                            onClick={() => handleCountersign(selectedAgreement.id)}
                                            className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all ${
                                                acceptTerms && !isSigning
                                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                                                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                            }`}
                                        >
                                            <Check className="size-4" />
                                            {isSigning ? 'Inaamilisha Mkataba...' : 'Weka Saini Yako & Anzisha Upangaji (Countersign & Activate)'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="pt-4 border-t border-slate-200 mt-4 flex justify-between items-center shrink-0">
                            <span className="text-[11px] text-slate-400">
                                Hati hii inalindwa kisheria chini ya Panga Pangisha Legal Framework.
                            </span>
                            <button
                                onClick={() => setSelectedAgreement(null)}
                                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
                            >
                                Funga (Close)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

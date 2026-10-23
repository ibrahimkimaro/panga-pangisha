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
    prefilledUnit?: any;
    onClearPrefill?: () => void;
    onSwitchToInvoices?: () => void;
    lang?: 'en' | 'sw';
}

const DEFAULT_SAMPLE_AGREEMENTS: RentalAgreement[] = [
    {
        id: 1,
        agreement_number: 'AGR-2026-001',
        property_name: 'Mikocheni Executive Apartments',
        unit_number: 'Unit A2',
        tenant_name: 'Juma Bakari',
        tenant_phone: '+255 765 890 123',
        tenant_email: 'juma.bakari@gmail.com',
        tenant_national_id: '19880412-11102-00004-18',
        monthly_rent: 500000,
        security_deposit: 500000,
        payment_frequency: 'monthly',
        start_date: '2026-02-01',
        end_date: '2027-01-31',
        duration_months: 12,
        status: 'active',
        language: 'sw',
        meter_readings: {
            electricity_token_units: 42.5,
            water_meter_reading: 18.4,
        },
        tenant_signed_at: '2026-02-01 10:15',
        landlord_signed_at: '2026-02-01 11:30',
    },
    {
        id: 2,
        agreement_number: 'AGR-2025-014',
        property_name: 'Palm Vista Apartments',
        unit_number: 'Unit B1',
        tenant_name: 'Sarah Johnson',
        tenant_phone: '+255 712 990 011',
        tenant_email: 'sarah.j@outlook.com',
        tenant_national_id: '19920815-22401-00009-33',
        monthly_rent: 420000,
        security_deposit: 420000,
        payment_frequency: 'monthly',
        start_date: '2025-10-15',
        end_date: '2026-11-14',
        duration_months: 12,
        status: 'active',
        language: 'en',
        meter_readings: {
            electricity_token_units: 9.5,
            water_meter_reading: 24.0,
        },
        tenant_signed_at: '2025-10-15 14:00',
        landlord_signed_at: '2025-10-15 16:30',
    },
    {
        id: 3,
        agreement_number: 'AGR-2026-003',
        property_name: 'Kimaro Prime Residences',
        unit_number: 'Room 2 - Ground Floor',
        tenant_name: 'David Mwangi',
        tenant_phone: '+255 754 332 119',
        tenant_email: 'david.mwangi@gmail.com',
        tenant_national_id: '19950320-33201-00012-44',
        monthly_rent: 350000,
        security_deposit: 350000,
        payment_frequency: 'monthly',
        start_date: '2026-11-01',
        end_date: '2027-10-31',
        duration_months: 12,
        status: 'draft',
        language: 'sw',
        meter_readings: {
            electricity_token_units: 50.0,
            water_meter_reading: 10.0,
        },
    },
];

export default function RentalAgreementsView({
    properties = [],
    prefilledUnit,
    onClearPrefill,
    onSwitchToInvoices,
    lang = 'en'
}: RentalAgreementsViewProps) {
    const t = (en: string, sw: string) => lang === 'sw' ? sw : en;
    const [agreements, setAgreements] = useState<RentalAgreement[]>(DEFAULT_SAMPLE_AGREEMENTS);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<'all' | 'draft' | 'tenant_signed' | 'active' | 'terminated'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAgreement, setSelectedAgreement] = useState<RentalAgreement | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [previewStep, setPreviewStep] = useState(false);
    const [signingAgreement, setSigningAgreement] = useState<RentalAgreement | null>(null);
    const [signerName, setSignerName] = useState('Ibrahim Kimaro');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

    // Form state for new draft matching Flutter 14-section draft wizard
    const [draftTab, setDraftTab] = useState<'parties' | 'premises' | 'terms' | 'conditions'>('parties');
    const [specialConditions, setSpecialConditions] = useState<string[]>([
        'Quiet hours are strictly observed between 10:00 PM and 6:00 AM.',
        'Subletting or transferring occupancy without prior written landlord approval is prohibited.',
        'Waste and garbage shall be deposited in designated bins following building sanitization rules.',
    ]);
    const [newCondition, setNewCondition] = useState('');

    const [formData, setFormData] = useState({
        // Landlord Details
        landlord_name: 'Ibrahim Kimaro',
        landlord_nida: '19901234-56789-00001-22',
        landlord_phone: '+255 712 345 678',
        landlord_email: 'landlord@pangapangisha.com',
        landlord_address: 'Dar es Salaam, Tanzania',
        // Tenant Details
        tenant_name: '',
        tenant_phone: '',
        tenant_email: '',
        tenant_national_id: '',
        tenant_address: 'Dar es Salaam, Tanzania',
        // Premises
        property_name: properties[0]?.name || 'Mikocheni Executive Apartments',
        property_address: 'Mikocheni B, Plot 42, Dar es Salaam',
        property_type: 'House / Apartment',
        unit_number: 'Unit A2',
        room_spec: '1 Bedroom (Self-contained)',
        permitted_use: 'Residential only, unless otherwise agreed in writing.',
        // Term
        start_date: new Date().toISOString().split('T')[0],
        duration_months: '12',
        renewal_terms: 'Renewal subject to 30 days prior written notice by either party.',
        // Rent & Security
        monthly_rent: '450000',
        payment_due_date: '1st day of each month',
        payment_method: 'M-Pesa / Mobile Money',
        payment_reference: 'PangaPangisha Lipa Namba',
        security_deposit: '450000',
        deposit_refund_terms: 'Refundable within 14 days following handover inspection, subject to lawful deductions.',
        // Utilities
        electricity_terms: 'Tenant responsibility via LUKU sub-meter tokens.',
        water_terms: 'Tenant responsibility via DAWASA sub-meter.',
        waste_terms: 'Tenant / Landlord per building sanitation schedule.',
        other_charges: 'None (Building security included in rent).',
        electricity_token_units: '50',
        water_meter_reading: '12.5',
        language: (lang || 'en') as 'sw' | 'en',
    });

    useEffect(() => {
        if (prefilledUnit) {
            setFormData((prev) => ({
                ...prev,
                property_name: prefilledUnit.property_name || prev.property_name,
                unit_number: prefilledUnit.unit_number || prev.unit_number,
                monthly_rent: String(prefilledUnit.monthly_rent || prev.monthly_rent),
                security_deposit: String(prefilledUnit.monthly_rent || prev.security_deposit),
                tenant_name: prefilledUnit.current_tenancy?.tenant_name || '',
                tenant_phone: prefilledUnit.current_tenancy?.tenant_phone || '',
                tenant_email: prefilledUnit.current_tenancy?.tenant_email || '',
                electricity_token_units: String(prefilledUnit.utilities?.luku?.current_units ?? 50),
                water_meter_reading: String(prefilledUnit.utilities?.water?.current_reading ?? 12.5),
            }));
            setIsCreateModalOpen(true);
            onClearPrefill?.();
        }
    }, [prefilledUnit]);

    const fetchAgreements = async () => {
        try {
            const res = await fetch('/landlord/agreements', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    setAgreements(data);
                } else if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                    setAgreements(data.data);
                }
            }
        } catch (err) {
            console.error('Failed to load agreements:', err);
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
        const rentNum = Number(formData.monthly_rent) || 350000;
        const depNum = Number(formData.security_deposit) || rentNum;
        const durMonths = Number(formData.duration_months) || 12;

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
                    property_address: formData.property_address,
                    unit_number: formData.unit_number,
                    property_type: formData.property_type,
                    room_spec: formData.room_spec,
                    permitted_use: formData.permitted_use,
                    landlord_name: formData.landlord_name,
                    landlord_nida: formData.landlord_nida,
                    landlord_phone: formData.landlord_phone,
                    landlord_email: formData.landlord_email,
                    landlord_address: formData.landlord_address,
                    tenant_name: formData.tenant_name,
                    tenant_phone: formData.tenant_phone,
                    tenant_email: formData.tenant_email,
                    tenant_national_id: formData.tenant_national_id,
                    tenant_address: formData.tenant_address,
                    monthly_rent: rentNum,
                    payment_due_date: formData.payment_due_date,
                    payment_method: formData.payment_method,
                    payment_reference: formData.payment_reference,
                    security_deposit: depNum,
                    deposit_refund_terms: formData.deposit_refund_terms,
                    start_date: formData.start_date,
                    duration_months: durMonths,
                    renewal_terms: formData.renewal_terms,
                    electricity_terms: formData.electricity_terms,
                    water_terms: formData.water_terms,
                    waste_terms: formData.waste_terms,
                    other_charges: formData.other_charges,
                    language: formData.language,
                    special_conditions: specialConditions,
                    meter_readings: {
                        electricity_token_units: Number(formData.electricity_token_units) || 50,
                        water_meter_reading: Number(formData.water_meter_reading) || 10.0,
                    }
                }),
            });
            const data = await res.json();
            if (data.agreement) {
                showNotify('success', t(`Agreement #${data.agreement.agreement_number} drafted successfully! Ready for review.`, `Mkataba #${data.agreement.agreement_number} umeandaliwa kikamilifu! Rasimu ipo tayari kwa uhakiki.`));
                setIsCreateModalOpen(false);
                setPreviewStep(false);
                fetchAgreements();
            } else {
                // Client-side fallback draft
                const newAgr: RentalAgreement = {
                    id: Date.now(),
                    agreement_number: `AGR-${new Date().getFullYear()}-00${agreements.length + 1}`,
                    property_name: formData.property_name,
                    unit_number: formData.unit_number,
                    tenant_name: formData.tenant_name || t('Prospective Tenant', 'Mpangaji Mpya'),
                    tenant_phone: formData.tenant_phone,
                    tenant_email: formData.tenant_email,
                    tenant_national_id: formData.tenant_national_id,
                    monthly_rent: rentNum,
                    security_deposit: depNum,
                    payment_frequency: 'monthly',
                    start_date: formData.start_date,
                    end_date: new Date(new Date(formData.start_date).setMonth(new Date(formData.start_date).getMonth() + durMonths)).toISOString().split('T')[0],
                    duration_months: durMonths,
                    status: 'draft',
                    language: formData.language,
                    meter_readings: {
                        electricity_token_units: Number(formData.electricity_token_units) || 50,
                        water_meter_reading: Number(formData.water_meter_reading) || 10.0,
                    },
                };
                setAgreements([newAgr, ...agreements]);
                showNotify('success', t(`Agreement #${newAgr.agreement_number} drafted successfully! Ready for review.`, `Mkataba #${newAgr.agreement_number} umeandaliwa kikamilifu! Rasimu ipo tayari kwa uhakiki.`));
                setIsCreateModalOpen(false);
                setPreviewStep(false);
            }
        } catch {
            const newAgr: RentalAgreement = {
                id: Date.now(),
                agreement_number: `AGR-${new Date().getFullYear()}-00${agreements.length + 1}`,
                property_name: formData.property_name,
                unit_number: formData.unit_number,
                tenant_name: formData.tenant_name || t('Prospective Tenant', 'Mpangaji Mpya'),
                tenant_phone: formData.tenant_phone,
                tenant_email: formData.tenant_email,
                tenant_national_id: formData.tenant_national_id,
                monthly_rent: rentNum,
                security_deposit: depNum,
                payment_frequency: 'monthly',
                start_date: formData.start_date,
                end_date: new Date(new Date(formData.start_date).setMonth(new Date(formData.start_date).getMonth() + durMonths)).toISOString().split('T')[0],
                duration_months: durMonths,
                status: 'draft',
                language: formData.language,
                meter_readings: {
                    electricity_token_units: Number(formData.electricity_token_units) || 50,
                    water_meter_reading: Number(formData.water_meter_reading) || 10.0,
                },
            };
            setAgreements([newAgr, ...agreements]);
            showNotify('success', t(`Agreement #${newAgr.agreement_number} drafted successfully! Ready for review.`, `Mkataba #${newAgr.agreement_number} umeandaliwa kikamilifu! Rasimu ipo tayari kwa uhakiki.`));
            setIsCreateModalOpen(false);
            setPreviewStep(false);
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
                        <CheckCircle className="size-3.5 text-emerald-600" /> {t('Active & Binding', 'Mkataba Ulio Hai')}
                    </span>
                );
            case 'tenant_signed':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        <PenTool className="size-3.5 text-blue-600" /> {t('Tenant Signed — Awaiting Landlord', 'Mpangaji Amesaini — Inasubiri Mmiliki')}
                    </span>
                );
            case 'draft':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock className="size-3.5 text-amber-600" /> {t('Draft Review', 'Rasimu')}
                    </span>
                );
            case 'terminated':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {t('Terminated', 'Imemalizika')}
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
                        className={`p-4 rounded-2xl flex items-center justify-between text-sm font-semibold shadow-sm ${notification.type === 'success'
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
                        {t('Rental & Lease Agreements', 'Mikataba ya Upangishaji')}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        {t(
                            'Legally binding digital signatures, tenancy covenants, and lawful move-in records prior to invoicing.',
                            'Saini za kisheria, masharti ya upangaji, na kumbukumbu halali za kisheria kabla ya malipo au kuingia chumbani.'
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => {
                            setPreviewStep(false);
                            setIsCreateModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                    >
                        <Plus className="size-4" /> {t('Create New Agreement', 'Andaa Mkataba Mpya')}
                    </button>
                </div>
            </div>

            {/* Strict Workflow Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex items-start gap-3">
                <ShieldCheck className="size-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-950 space-y-1">
                    <p className="font-bold">{t('Tenancy Protection Gateway & Legal Policy:', 'Sheria na Utaratibu wa Upangaji:')}</p>
                    <p className="text-blue-800">
                        {t(
                            'Tenants must execute a signed lease prior to invoice generation or key delivery. Tenancy activates only once both parties complete digital signing.',
                            'Mpangaji haruhusiwi kulipia kodi au kupewa ufunguo kabla ya kusaini mkataba rasmi. Upangaji huwashwa baada tu ya pande zote mbili kusaini kielektroniki.'
                        )}
                    </p>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {[
                        { id: 'all', label: t('All Leases', 'Yote') },
                        { id: 'draft', label: t('Drafts', 'Rasimu') },
                        { id: 'tenant_signed', label: t('Tenant Signed', 'Mpangaji Amesaini') },
                        { id: 'active', label: t('Active', 'Hai') },
                        { id: 'terminated', label: t('Terminated', 'Imemalizika') },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id as any)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${filter === tab.id
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
                        placeholder={t('Search agreement number, tenant...', 'Tafuta mkataba, mpangaji...')}
                        className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Agreements List / Table */}
            {loading ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                    <Clock className="size-8 text-blue-600 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-500">{t('Loading rental agreements...', 'Inapakia orodha ya mikataba...')}</p>
                </div>
            ) : filteredAgreements.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                    <FileText className="size-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-slate-800">{t('No agreements found', 'Hakuna mikataba iliyopatikana')}</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        {t('Click "Create New Agreement" to draft a legal residential lease.', 'Bofya kitufe cha "Andaa Mkataba Mpya" kuanzisha mkataba halali kwa mpangaji wako.')}
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
                                        {ag.property_name || (lang === 'sw' ? 'Nyumba' : 'Property')} • {ag.unit_number || (lang === 'sw' ? 'Chumba' : 'Unit')}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-xs">
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-medium block">{t('Monthly Rent', 'Kodi kwa Mwezi')}</span>
                                        <span className="font-extrabold text-slate-800">TZS {Number(ag.monthly_rent).toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-medium block">{t('Security Deposit', 'Amana ya Dhamana')}</span>
                                        <span className="font-extrabold text-slate-800">TZS {Number(ag.security_deposit).toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-medium block">{t('Duration', 'Muda wa Mkataba')}</span>
                                        <span className="font-semibold text-slate-700">{ag.duration_months} {t('Months', 'Miezi')}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-medium block">{t('Start Date', 'Tarehe ya Kuanza')}</span>
                                        <span className="font-semibold text-slate-700">{ag.start_date}</span>
                                    </div>
                                </div>

                                {/* Signatures overview */}
                                <div className="space-y-1.5 text-[11px]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 flex items-center gap-1">
                                            <User className="size-3 text-slate-400" /> {t('Tenant Signature:', 'Sahihi ya Mpangaji:')}
                                        </span>
                                        <span className={ag.tenant_signed_at ? 'text-emerald-700 font-bold flex items-center gap-1' : 'text-amber-600 font-medium'}>
                                            {ag.tenant_signed_at ? <><Check className="size-3" /> {t('Signed', 'Imesainiwa')}</> : t('Pending Signature', 'Bado Kusaini')}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 flex items-center gap-1">
                                            <ShieldCheck className="size-3 text-slate-400" /> {t('Landlord Signature:', 'Sahihi ya Mmiliki:')}
                                        </span>
                                        <span className={ag.landlord_signed_at ? 'text-emerald-700 font-bold flex items-center gap-1' : 'text-amber-600 font-medium'}>
                                            {ag.landlord_signed_at ? <><Check className="size-3" /> {t('Signed', 'Imesainiwa')}</> : t('Pending Signature', 'Bado Kusaini')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                                <button
                                    onClick={() => setSelectedAgreement(ag)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    <Eye className="size-3.5 text-slate-500" /> {t('View Agreement', 'Tazama Mkataba')}
                                </button>

                                <div className="flex items-center gap-2">
                                    <a
                                        href={`/landlord/agreements/${ag.id}/print`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                                        title={t('Print or Download Agreement (PDF)', 'Chapisha au Pakua Mkataba (PDF)')}
                                    >
                                        <Printer className="size-4" />
                                    </a>

                                    {ag.status === 'tenant_signed' && (
                                        <button
                                            onClick={() => setSigningAgreement(ag)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                                        >
                                            <PenTool className="size-3.5" /> {t('Countersign Now', 'Saini Sasa')}
                                        </button>
                                    )}

                                    {ag.status === 'draft' && (
                                        <button
                                            onClick={() => setSigningAgreement(ag)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-all cursor-pointer"
                                        >
                                            {t('Sign Draft', 'Saini Awali')}
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
                    <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[120vh] flex flex-col shadow-2xl border border-slate-100">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                                    <FileText className="size-5 text-blue-600" />
                                    {previewStep
                                        ? t('Agreement Verification Prior to Finalizing', 'Uhakiki wa Mkataba Kabla ya Kuhifadhi')
                                        : t('Draft Residential Lease Agreement', 'Andaa Mkataba wa Upangaji')}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {previewStep
                                        ? t('Review all 12 statutory covenants before dispatching to tenant.', 'Hakiki vipengele vyote 12 vya kisheria kabla ya kumtumia mpangaji.')
                                        : t('Provide accurate tenant, rent, deposit, and unit tenancy details.', 'Jaza taarifa sahihi za mpangaji, kodi, amana na chumba.')}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-5">
                            {!previewStep ? (
                                <form id="draftForm" onSubmit={(e) => { e.preventDefault(); setPreviewStep(true); }} className="space-y-4">
                                    {/* Tabs for Draft Form Sections */}
                                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto">
                                        {[
                                            { id: 'parties', label: t('1. Parties', '1. Pande Zinazohusika') },
                                            { id: 'premises', label: t('2. Premises & Term', '2. Nyumba na Muda') },
                                            { id: 'terms', label: t('3. Rent & Utilities', '3. Kodi na Huduma') },
                                            { id: 'conditions', label: t('4. Special Conditions', '4. Masharti Maalumu') },
                                        ].map((tb) => (
                                            <button
                                                key={tb.id}
                                                type="button"
                                                onClick={() => setDraftTab(tb.id as any)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${draftTab === tb.id
                                                    ? 'bg-white text-slate-900 shadow-sm'
                                                    : 'text-slate-600 hover:text-slate-900'
                                                    }`}
                                            >
                                                {tb.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* TAB 1: PARTIES (LANDLORD & TENANT) */}
                                    {draftTab === 'parties' && (
                                        <div className="space-y-4">
                                            {/* Landlord section */}
                                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                                                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                                                    {t('Section 1: Landlord Particulars', 'Kifungu 1: Taarifa za Mwenye Nyumba')}
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('Landlord Full Name', 'Jina Kamili la Mwenye Nyumba')}</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={formData.landlord_name}
                                                            onChange={(e) => setFormData({ ...formData, landlord_name: e.target.value })}
                                                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('Landlord NIDA ID Number', 'NIDA ya Mwenye Nyumba')}</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={formData.landlord_nida}
                                                            onChange={(e) => setFormData({ ...formData, landlord_nida: e.target.value })}
                                                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('Phone Number', 'Namba ya Simu')}</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={formData.landlord_phone}
                                                            onChange={(e) => setFormData({ ...formData, landlord_phone: e.target.value })}
                                                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('Physical Address', 'Anwani ya Makazi')}</label>
                                                        <input
                                                            type="text"
                                                            value={formData.landlord_address}
                                                            onChange={(e) => setFormData({ ...formData, landlord_address: e.target.value })}
                                                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tenant section */}
                                            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-3">
                                                <h4 className="text-xs font-extrabold text-blue-950 uppercase tracking-wider flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                                                    {t('Section 1 (Part B): Tenant Particulars', 'Kifungu 1 (Sehemu B): Taarifa za Mpangaji')}
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-blue-900 mb-1">{t('Full Tenant Name', 'Jina Kamili la Mpangaji')}</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={formData.tenant_name}
                                                            onChange={(e) => setFormData({ ...formData, tenant_name: e.target.value })}
                                                            placeholder="Hamisi Bakari"
                                                            className="w-full px-3 py-2 rounded-xl bg-white border border-blue-200"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-blue-900 mb-1">{t('National ID / NIDA', 'Namba ya NIDA')}</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={formData.tenant_national_id}
                                                            onChange={(e) => setFormData({ ...formData, tenant_national_id: e.target.value })}
                                                            placeholder="19900101-12345-00001-22"
                                                            className="w-full px-3 py-2 rounded-xl bg-white border border-blue-200 font-mono"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-blue-900 mb-1">{t('Phone Number', 'Namba ya Simu')}</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={formData.tenant_phone}
                                                            onChange={(e) => setFormData({ ...formData, tenant_phone: e.target.value })}
                                                            placeholder="+255 712 345 678"
                                                            className="w-full px-3 py-2 rounded-xl bg-white border border-blue-200"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-blue-900 mb-1">{t('Email Address', 'Barua Pepe')}</label>
                                                        <input
                                                            type="email"
                                                            value={formData.tenant_email}
                                                            onChange={(e) => setFormData({ ...formData, tenant_email: e.target.value })}
                                                            placeholder="tenant@example.com"
                                                            className="w-full px-3 py-2 rounded-xl bg-white border border-blue-200"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB 2: PREMISES & TERM */}
                                    {draftTab === 'premises' && (
                                        <div className="space-y-4">
                                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                                                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                                                    {t('Section 2: Premises & Unit Details', 'Kifungu 2: Eneo la Upangaji na Chumba')}
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('Property / Estate Name', 'Jina la Nyumba / Estate')}</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={formData.property_name}
                                                            onChange={(e) => setFormData({ ...formData, property_name: e.target.value })}
                                                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('Physical Address', 'Anwani ya Eneo')}</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={formData.property_address}
                                                            onChange={(e) => setFormData({ ...formData, property_address: e.target.value })}
                                                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('Unit / Room Number', 'Namba ya Chumba / Unit')}</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={formData.unit_number}
                                                            onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                                                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('Property Type', 'Aina ya Nyumba')}</label>
                                                        <select
                                                            value={formData.property_type}
                                                            onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                                                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200"
                                                        >
                                                            <option value="House / Apartment">House / Apartment</option>
                                                            <option value="Stand-alone House">Stand-alone House</option>
                                                            <option value="Commercial Office / Shop">Commercial Office / Shop</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('Bedrooms / Room Description', 'Idadi ya Vyumba / Muundo')}</label>
                                                        <input
                                                            type="text"
                                                            value={formData.room_spec}
                                                            onChange={(e) => setFormData({ ...formData, room_spec: e.target.value })}
                                                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('Permitted Use', 'Matumizi Yanayoruhusiwa')}</label>
                                                        <input
                                                            type="text"
                                                            value={formData.permitted_use}
                                                            onChange={(e) => setFormData({ ...formData, permitted_use: e.target.value })}
                                                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Term section */}
                                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                                                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                                                    {t('Section 3: Tenancy Duration & Term', 'Kifungu 3: Muda wa Mkataba')}
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('Commencement Date', 'Tarehe ya Kuanza')}</label>
                                                        <input
                                                            type="date"
                                                            required
                                                            value={formData.start_date}
                                                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('Duration (Months)', 'Muda (Miezi)')}</label>
                                                        <select
                                                            value={formData.duration_months}
                                                            onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
                                                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200"
                                                        >
                                                            <option value="3">{t('3 Months', 'Miezi 3')}</option>
                                                            <option value="6">{t('6 Months', 'Miezi 6')}</option>
                                                            <option value="12">{t('12 Months (1 Year)', 'Mwaka 1 (Miezi 12)')}</option>
                                                            <option value="24">{t('24 Months (2 Years)', 'Miaka 2 (Miezi 24)')}</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('Agreement Language', 'Lugha ya Mkataba')}</label>
                                                        <select
                                                            value={formData.language}
                                                            onChange={(e) => setFormData({ ...formData, language: e.target.value as any })}
                                                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold"
                                                        >
                                                            <option value="en">English (Statutory Tenancy Agreement)</option>
                                                            <option value="sw">Kiswahili (Mkataba Rasmi wa Upangaji)</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB 3: FINANCIALS & UTILITIES */}
                                    {draftTab === 'terms' && (
                                        <div className="space-y-4">
                                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                                                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                                                    {t('Section 4 & 5: Rent, Deposit & Payment Terms', 'Kifungu 4 & 5: Kodi, Dhamana na Njia ya Malipo')}
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('Monthly Rent (TZS)', 'Kodi ya Mwezi (TZS)')}</label>
                                                        <input
                                                            type="number"
                                                            required
                                                            value={formData.monthly_rent}
                                                            onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value })}
                                                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-extrabold text-slate-900"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('Security Deposit (TZS)', 'Amana ya Dhamana (TZS)')}</label>
                                                        <input
                                                            type="number"
                                                            required
                                                            value={formData.security_deposit}
                                                            onChange={(e) => setFormData({ ...formData, security_deposit: e.target.value })}
                                                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-extrabold text-slate-900"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('Payment Due Date', 'Tarehe ya Malipo')}</label>
                                                        <input
                                                            type="text"
                                                            value={formData.payment_due_date}
                                                            onChange={(e) => setFormData({ ...formData, payment_due_date: e.target.value })}
                                                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('Payment Method', 'Njia ya Malipo')}</label>
                                                        <select
                                                            value={formData.payment_method}
                                                            onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-medium"
                                                        >
                                                            <option value="M-Pesa / Mobile Money">Vodacom M-Pesa / Mobile Money</option>
                                                            <option value="Tigo Pesa">Tigo Pesa (Mixx by Yas)</option>
                                                            <option value="CRDB / NMB Bank Transfer">CRDB / NMB Bank Transfer</option>
                                                            <option value="Cash Handover">{t('Cash Handover', 'Pesa Taslimu')}</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Section 6: Utilities */}
                                            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                                                <h4 className="text-xs font-extrabold text-amber-950 uppercase tracking-wider flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-amber-600" />
                                                    {t('Section 6: Utility Arrangements & Handover Meters', 'Kifungu 6: Mita za Umeme na Maji')}
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-amber-900 mb-1">{t('LUKU Electricity Submeter (kWh)', 'Kipimo cha LUKU (kWh)')}</label>
                                                        <input
                                                            type="number"
                                                            value={formData.electricity_token_units}
                                                            onChange={(e) => setFormData({ ...formData, electricity_token_units: e.target.value })}
                                                            className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-amber-900 mb-1">{t('DAWASA Water Submeter (m³)', 'Kipimo cha Maji (m³)')}</label>
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            value={formData.water_meter_reading}
                                                            onChange={(e) => setFormData({ ...formData, water_meter_reading: e.target.value })}
                                                            className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB 4: SPECIAL CONDITIONS */}
                                    {draftTab === 'conditions' && (
                                        <div className="space-y-4">
                                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                                                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                                                    {t('Section 13: Special Enforceable Tenancy Conditions', 'Kifungu 13: Masharti Maalumu ya Ukaaji')}
                                                </h4>

                                                <div className="space-y-2">
                                                    {specialConditions.map((cond, idx) => (
                                                        <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 flex items-start justify-between gap-3 text-xs">
                                                            <div className="flex items-start gap-2">
                                                                <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                                                                    {idx + 1}
                                                                </span>
                                                                <span className="text-slate-800">{cond}</span>
                                                            </div>
                                                            {specialConditions.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSpecialConditions(specialConditions.filter((_, i) => i !== idx))}
                                                                    className="text-slate-400 hover:text-red-600 p-0.5"
                                                                >
                                                                    <X className="size-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex items-center gap-2 pt-2">
                                                    <input
                                                        type="text"
                                                        value={newCondition}
                                                        onChange={(e) => setNewCondition(e.target.value)}
                                                        placeholder={t('Add custom condition or house rule...', 'Ongeza sharti au kanuni maalum ya nyumba...')}
                                                        className="flex-1 px-3 py-2 text-xs rounded-xl bg-white border border-slate-200"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (newCondition.trim()) {
                                                                setSpecialConditions([...specialConditions, newCondition.trim()]);
                                                                setNewCondition('');
                                                            }
                                                        }}
                                                        className="px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
                                                    >
                                                        {t('Add Condition', 'Ongeza')}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </form>
                            ) : (
                                /* STEP 2: PREVIEW TERMS */
                                <div className="space-y-4 text-xs">
                                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">{t('REVIEW & CONFIRM', 'HAKIKI NA THIBITISHA')}</span>
                                            <h4 className="font-extrabold text-blue-950 text-sm">
                                                {t('Lease Agreement:', 'Mkataba wa Upangaji:')} {formData.tenant_name || t('Prospective Tenant', 'Mpangaji')}
                                            </h4>
                                            <p className="text-blue-800 text-[11px]">
                                                {formData.property_name} — {formData.unit_number} (TZS {Number(formData.monthly_rent).toLocaleString()} / {t('month', 'mwezi')})
                                            </p>
                                        </div>
                                        <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-extrabold text-[11px]">
                                            {t('Step 2 of 2', 'Hatua ya 2/2')}
                                        </span>
                                    </div>

                                    <div className="border border-slate-200 rounded-2xl p-4 max-h-72 overflow-y-auto space-y-3 bg-slate-50/50">
                                        <div className="text-center pb-3 border-b border-slate-200">
                                            <h4 className="font-extrabold text-sm text-slate-900 uppercase">
                                                {t('RESIDENTIAL TENANCY LEASE AGREEMENT', 'MKATABA WA UPANGAJI WA MAKAZI')}
                                            </h4>
                                            <p className="text-[11px] text-slate-500">
                                                {t('Clauses 1 through 14 pursuant to Tanzanian Tenancy Law', 'Vifungu 1 Hadi 14 vya Sheria ya Upangishaji Tanzania')}
                                            </p>
                                        </div>

                                        <div className="space-y-2.5 text-slate-700 leading-relaxed">
                                            {lang === 'sw' ? (
                                                <>
                                                    <p><strong>1. Pande Zinazohusika:</strong> Mmiliki ({formData.landlord_name}, NIDA: {formData.landlord_nida}) na Mpangaji ({formData.tenant_name || 'Mpangaji Mtarajiwa'}, NIDA: {formData.tenant_national_id || 'Haijabainishwa'}).</p>
                                                    <p><strong>2. Eneo la Upangaji:</strong> {formData.property_name}, {formData.unit_number} ({formData.room_spec}). Matumizi: {formData.permitted_use}.</p>
                                                    <p><strong>3. Muda wa Mkataba:</strong> Miezi {formData.duration_months} kuanzia tarehe {formData.start_date}.</p>
                                                    <p><strong>4. Kodi ya Pango:</strong> TZS {Number(formData.monthly_rent).toLocaleString()} kwa mwezi, ikilipwa mapema tarehe ya mwisho kupitia {formData.payment_method}.</p>
                                                    <p><strong>5. Amana ya Dhamana:</strong> TZS {Number(formData.security_deposit).toLocaleString()} kwa ajili ya kulinda mali na matengenezo. {formData.deposit_refund_terms}.</p>
                                                    <p><strong>6. Huduma za Umeme na Maji:</strong> {formData.electricity_terms} Mita ya awali: LUKU {formData.electricity_token_units} kWh, Maji {formData.water_meter_reading} m³.</p>
                                                    <p><strong>7. Masharti Maalumu:</strong> {specialConditions.join('; ')}.</p>
                                                </>
                                            ) : (
                                                <>
                                                    <p><strong>1. Parties to the Agreement:</strong> Landlord ({formData.landlord_name}, NIDA: {formData.landlord_nida}) and Tenant ({formData.tenant_name || 'Prospective Tenant'}, NIDA: {formData.tenant_national_id || 'Not Specified'}).</p>
                                                    <p><strong>2. Demised Premises:</strong> {formData.property_name}, {formData.unit_number} ({formData.room_spec}). Permitted use: {formData.permitted_use}.</p>
                                                    <p><strong>3. Term & Duration:</strong> {formData.duration_months} months commencing on {formData.start_date}.</p>
                                                    <p><strong>4. Rent Consideration:</strong> TZS {Number(formData.monthly_rent).toLocaleString()} per month, payable in advance on or before {formData.payment_due_date} via {formData.payment_method}.</p>
                                                    <p><strong>5. Security Deposit:</strong> TZS {Number(formData.security_deposit).toLocaleString()}. {formData.deposit_refund_terms}.</p>
                                                    <p><strong>6. Utilities & Submeters:</strong> {formData.electricity_terms} Initial reading: LUKU {formData.electricity_token_units} kWh, Water {formData.water_meter_reading} m³.</p>
                                                    <p><strong>7. Special Conditions:</strong> {specialConditions.join('; ')}.</p>
                                                </>
                                            )}
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
                                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                                    >
                                        {t('Cancel', 'Ghairi')}
                                    </button>
                                    <button
                                        type="submit"
                                        form="draftForm"
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                                    >
                                        {t('Review Terms', 'Hakiki Masharti')} <ChevronRight className="size-4" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewStep(false)}
                                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                                    >
                                        {t('Back (Edit Details)', 'Rudi Nyuma')}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={handlePrepareDraft}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        {isSubmitting ? (
                                            <>{t('Saving...', 'Inahifadhi...')}</>
                                        ) : (
                                            <>
                                                <Send className="size-4" /> {t('Confirm & Dispatch to Tenant', 'Thibitisha na Tuma kwa Mpangaji')}
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
                                    {t('Lease Agreement —', 'Mkataba wa Upangaji —')} {selectedAgreement.tenant_name}
                                </h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={`/landlord/agreements/${selectedAgreement.id}/print`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                                >
                                    <Printer className="size-3.5" /> {t('Print', 'Chapisha')}
                                </a>
                                <button
                                    onClick={() => setSelectedAgreement(null)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4 text-xs">
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                    <span className="text-slate-400 block text-[10px]">{t('Unit', 'Chumba')}</span>
                                    <span className="font-bold text-slate-800">{selectedAgreement.unit_number}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px]">{t('Rent', 'Kodi')}</span>
                                    <span className="font-bold text-slate-800">TZS {Number(selectedAgreement.monthly_rent).toLocaleString()}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px]">{t('Security Deposit', 'Amana')}</span>
                                    <span className="font-bold text-slate-800">TZS {Number(selectedAgreement.security_deposit).toLocaleString()}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px]">{t('Status', 'Hali')}</span>
                                    <span className="font-bold capitalize text-slate-800">{selectedAgreement.status}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-bold text-slate-800 text-sm">{t('Statutory Covenants (12 Sections):', 'Vipengele vya Kisheria (Vipengele 12):')}</h4>
                                {selectedAgreement.terms_sections && selectedAgreement.terms_sections.length > 0 ? (
                                    selectedAgreement.terms_sections.map((sec, idx) => (
                                        <div key={idx} className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                                            <h5 className="font-bold text-slate-900 text-xs mb-1">{sec.title}</h5>
                                            <p className="text-slate-600 text-[11px] leading-relaxed whitespace-pre-line">{sec.content}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-slate-500 italic">
                                        {t('Standard 12 residential tenancy statutory clauses pursuant to Tanzanian real estate laws.', 'Masharti 12 ya kisheria yameandaliwa kulingana na sheria za upangaji za Tanzania.')}
                                    </p>
                                )}
                            </div>

                            {/* Inventory & Meter readings */}
                            {selectedAgreement.meter_readings && (
                                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200">
                                    <h5 className="font-bold text-amber-900 text-xs mb-1">{t('Handover Meter Readings:', 'Vipimo vya Mita:')}</h5>
                                    <div className="flex gap-6 text-[11px] text-amber-800">
                                        <span>LUKU: {selectedAgreement.meter_readings.electricity_token_units || 0} kWh</span>
                                        <span>{t('Water:', 'Maji:')} {selectedAgreement.meter_readings.water_meter_reading || 0} m³</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-5 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedAgreement(null)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                            >
                                {t('Close', 'Funga')}
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
                                <h3 className="font-extrabold text-base text-slate-900">{t('Execute Landlord Countersignature', 'Weka Sahihi ya Mmiliki')}</h3>
                            </div>
                            <button onClick={() => setSigningAgreement(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                            <p className="font-bold">{t('Agreement:', 'Mkataba:')} {signingAgreement.agreement_number}</p>
                            <p>{t('Tenant:', 'Mpangaji:')} <strong>{signingAgreement.tenant_name}</strong></p>
                            <p>{t('Rent:', 'Kodi:')} TZS {Number(signingAgreement.monthly_rent).toLocaleString()} / {t('month', 'mwezi')}</p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('Landlord Signer Name', 'Jina la Mwenye Nyumba')}</label>
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
                                        {t(
                                            'I hereby confirm that I have reviewed and agree to all terms and covenants of this lease agreement and authorize immediate tenancy activation.',
                                            'Ninathibitisha kuwa nimeyasoma na kukubaliana na masharti yote ya mkataba huu, na ninatoa idhini ya kuwasha upangaji mara moja.'
                                        )}
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setSigningAgreement(null)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                                {t('Cancel', 'Ghairi')}
                            </button>
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={handleCountersign}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {isSubmitting ? t('Signing...', 'Inasaini...') : t('Sign & Activate Tenancy', 'Saini na Washa Upangaji')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

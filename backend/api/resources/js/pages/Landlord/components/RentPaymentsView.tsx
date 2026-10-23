import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DollarSign, Plus, CheckCircle, Clock, Search, Filter,
    Download, Printer, Share2, Wallet, User, Home, Calendar,
    CreditCard, ArrowUpRight, TrendingUp, Check, X, FileText,
    Sparkles, AlertCircle
} from 'lucide-react';

interface RentPayment {
    id: number;
    receipt_number: string;
    tenant_name: string;
    tenant_phone: string;
    property_name: string;
    unit_number: string;
    amount: number;
    billing_period: string;
    paid_on: string;
    payment_method: 'mpesa' | 'tigopesa' | 'airtelmoney' | 'bank_transfer' | 'cash';
    reference_number: string;
    notes?: string;
    status: 'verified' | 'pending_verification';
}

interface RentPaymentsViewProps {
    properties?: Array<{ id: number; name: string }>;
    lang?: 'en' | 'sw';
}

const DEFAULT_SAMPLE_PAYMENTS: RentPayment[] = [
    {
        id: 1,
        receipt_number: 'REC-202610-001',
        tenant_name: 'Juma Bakari',
        tenant_phone: '+255 765 890 123',
        property_name: 'Mikocheni Executive Apartments',
        unit_number: 'Unit A2',
        amount: 550000,
        billing_period: 'October 2026',
        paid_on: '03/10/2026 14:20',
        payment_method: 'mpesa',
        reference_number: 'MPE-9821812',
        notes: 'Full payment for October rent and utilities',
        status: 'verified',
    },
    {
        id: 2,
        receipt_number: 'REC-202610-002',
        tenant_name: 'Sarah Johnson',
        tenant_phone: '+255 712 990 011',
        property_name: 'Palm Vista Apartments',
        unit_number: 'Unit B1',
        amount: 440000,
        billing_period: 'October 2026',
        paid_on: '05/10/2026 09:12',
        payment_method: 'bank_transfer',
        reference_number: 'CRDB-TX-44810',
        notes: 'CRDB direct transfer',
        status: 'verified',
    },
    {
        id: 3,
        receipt_number: 'REC-202610-003',
        tenant_name: 'Fatma Said',
        tenant_phone: '+255 773 219 045',
        property_name: 'Mikocheni Executive Apartments',
        unit_number: 'Unit B3',
        amount: 600000,
        billing_period: 'October 2026',
        paid_on: '07/10/2026 11:45',
        payment_method: 'tigopesa',
        reference_number: 'TGO-4819201',
        notes: 'Monthly rent paid via Tigo Pesa Lipa',
        status: 'verified',
    },
    {
        id: 4,
        receipt_number: 'REC-202610-004',
        tenant_name: 'Emmanuel Mtui',
        tenant_phone: '+255 784 112 556',
        property_name: 'Kimaro Prime Residences',
        unit_number: 'Unit 4',
        amount: 350000,
        billing_period: 'October 2026',
        paid_on: '10/10/2026 16:30',
        payment_method: 'cash',
        reference_number: 'CSH-HANDOVER-04',
        notes: 'Cash payment handed to caretaker and verified',
        status: 'verified',
    },
];

export default function RentPaymentsView({ properties = [], lang = 'en' }: RentPaymentsViewProps) {
    const t = (en: string, sw: string) => (lang === 'sw' ? sw : en);

    const [payments, setPayments] = useState<RentPayment[]>(DEFAULT_SAMPLE_PAYMENTS);
    const [filterMethod, setFilterMethod] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<RentPayment | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state for recording payment
    const [form, setForm] = useState({
        tenant_name: 'David Mwangi',
        tenant_phone: '+255 754 332 119',
        property_name: properties[0]?.name || 'Mikocheni Executive Apartments',
        unit_number: 'Unit C1',
        amount: '450000',
        billing_period: lang === 'sw' ? 'Oktoba 2026' : 'October 2026',
        paid_on: new Date().toISOString().split('T')[0],
        payment_method: 'mpesa' as RentPayment['payment_method'],
        reference_number: `TXN-${Date.now().toString().slice(-6)}`,
        notes: '',
    });

    const showNotify = (type: 'success' | 'info' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    // Metrics calculations
    const totalCollected = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const expectedMonthTotal = 2400000;
    const collectionPercentage = Math.round((totalCollected / expectedMonthTotal) * 100);
    const tenantsPaidCount = payments.length;
    const totalTenantsCount = 5;

    const monthlyTrends = [
        { month: t('May', 'Mei'), amount: 1800000, height: '75%' },
        { month: t('Jun', 'Jun'), amount: 1950000, height: '81%' },
        { month: t('Jul', 'Jul'), amount: 2100000, height: '88%' },
        { month: t('Aug', 'Ago'), amount: 2250000, height: '94%' },
        { month: t('Sep', 'Sep'), amount: 2350000, height: '98%' },
        { month: t('Oct', 'Okt'), amount: totalCollected, height: '100%', active: true },
    ];

    const handleRecordPayment = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const newPayment: RentPayment = {
            id: Date.now(),
            receipt_number: `REC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-00${payments.length + 1}`,
            tenant_name: form.tenant_name,
            tenant_phone: form.tenant_phone,
            property_name: form.property_name,
            unit_number: form.unit_number,
            amount: Number(form.amount) || 0,
            billing_period: form.billing_period,
            paid_on: `${form.paid_on} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            payment_method: form.payment_method,
            reference_number: form.reference_number || `REF-${Date.now().toString().slice(-6)}`,
            notes: form.notes,
            status: 'verified',
        };

        setTimeout(() => {
            setPayments([newPayment, ...payments]);
            setIsSubmitting(false);
            setIsRecordModalOpen(false);
            showNotify('success', t(`Payment of TZS ${Number(form.amount).toLocaleString()} recorded successfully! Receipt #${newPayment.receipt_number} issued.`, `Malipo ya TZS ${Number(form.amount).toLocaleString()} yamerekodiwa kikamilifu! Risiti #${newPayment.receipt_number} imetolewa.`));
        }, 500);
    };

    const handleShareWhatsapp = (payment: RentPayment) => {
        const text = encodeURIComponent(
            lang === 'sw'
                ? `Habari ${payment.tenant_name}, malipo yako ya kodi ya TZS ${payment.amount.toLocaleString()} kwa mwezi wa ${payment.billing_period} (${payment.property_name} - ${payment.unit_number}) yamethibitishwa kikamilifu. Namba ya risiti: ${payment.receipt_number}. Kumbukumbu: ${payment.reference_number}. Asante kwa uaminifu wako!`
                : `Hello ${payment.tenant_name}, your rent payment of TZS ${payment.amount.toLocaleString()} for ${payment.billing_period} (${payment.property_name} - ${payment.unit_number}) has been verified. Official Receipt: ${payment.receipt_number}. Reference: ${payment.reference_number}. Thank you!`
        );
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const filteredPayments = payments.filter((p) => {
        if (filterMethod !== 'all' && p.payment_method !== filterMethod) return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return (
                p.tenant_name.toLowerCase().includes(q) ||
                p.property_name.toLowerCase().includes(q) ||
                p.unit_number.toLowerCase().includes(q) ||
                p.receipt_number.toLowerCase().includes(q) ||
                p.reference_number.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const getMethodBadge = (method: string) => {
        switch (method) {
            case 'mpesa':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                        <CreditCard className="size-3 text-red-600" /> M-Pesa
                    </span>
                );
            case 'tigopesa':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <CreditCard className="size-3 text-blue-600" /> Tigo Pesa
                    </span>
                );
            case 'airtelmoney':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <CreditCard className="size-3 text-rose-600" /> Airtel Money
                    </span>
                );
            case 'bank_transfer':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Wallet className="size-3 text-emerald-600" /> Bank Transfer
                    </span>
                );
            case 'cash':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <DollarSign className="size-3 text-amber-600" /> {t('Cash Handover', 'Pesa Taslimu')}
                    </span>
                );
            default:
                return <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-700">{method}</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Notification alert */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="p-4 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center justify-between shadow-sm text-xs font-semibold"
                    >
                        <div className="flex items-center gap-2.5">
                            <Sparkles className="size-4 text-emerald-600 shrink-0" />
                            <span>{notification.message}</span>
                        </div>
                        <button onClick={() => setNotification(null)} className="p-1 hover:bg-black/5 rounded-lg">
                            <X className="size-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header & Main Action */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                        <Wallet className="size-6 text-emerald-600" />
                        {t('Rent Collection & Payment Records', 'Malipo ya Kodi na Ukusanyaji')}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        {t(
                            'Real-time rent collection tracking, digital payment verification, tenant receipt issuance, and bank reconciliations.',
                            'Ufuatiliaji wa malipo ya kodi ya pango, uthibitisho wa miamala ya benki/simu, na utoaji wa risiti rasmi za kielektroniki.'
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsRecordModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all shadow-emerald-600/20"
                    >
                        <Plus className="size-4" /> {t('Record Rent Payment', 'Rekodi Malipo ya Kodi')}
                    </button>
                </div>
            </div>

            {/* Clay-styled Visual Overview Banner matching Dart's RentBars */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-emerald-900/30 relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                                {t('Collected This Month', 'Imekusanywa Mwezi Huu')}
                            </span>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-emerald-300">
                                {new Date().toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-US', { month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                        <h3 className="text-3xl font-black text-white tracking-tight">
                            TZS {totalCollected.toLocaleString()}
                        </h3>
                        <p className="text-xs text-emerald-200/80 mt-1">
                            {t(
                                `${tenantsPaidCount} of ${totalTenantsCount} tenants have settled · ${collectionPercentage}% of target TZS ${expectedMonthTotal.toLocaleString()}`,
                                `Wapangaji ${tenantsPaidCount} kati ya ${totalTenantsCount} wamelipa · ${collectionPercentage}% ya lengo TZS ${expectedMonthTotal.toLocaleString()}`
                            )}
                        </p>
                    </div>

                    {/* Collection Trend Bars */}
                    <div className="mt-8 pt-4 border-t border-white/10">
                        <span className="text-[11px] font-bold text-slate-300 block mb-3">
                            {t('6-Month Collection Trend (TZS)', 'Mwenendo wa Ukusanyaji Miezi 6 Iliyopita (TZS)')}
                        </span>
                        <div className="grid grid-cols-6 gap-3 items-end h-24">
                            {monthlyTrends.map((trend, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                                    <div
                                        style={{ height: trend.height }}
                                        className={`w-full rounded-lg transition-all ${
                                            trend.active
                                                ? 'bg-gradient-to-t from-emerald-500 to-emerald-400 shadow-lg shadow-emerald-500/30'
                                                : 'bg-white/20 hover:bg-white/30'
                                        }`}
                                    />
                                    <span className="text-[10px] font-bold text-slate-400">{trend.month}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Summary Cards */}
                <div className="space-y-4 flex flex-col justify-between">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-slate-500 block">
                                {t('Collection Rate', 'Kiwango cha Ukusanyaji')}
                            </span>
                            <h4 className="text-2xl font-extrabold text-slate-900 mt-1">{collectionPercentage}%</h4>
                            <span className="text-[11px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
                                <TrendingUp className="size-3" /> {t('On track for this period', 'Inaendelea vizuri mwezi huu')}
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                            <CheckCircle className="size-6" />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-slate-500 block">
                                {t('Outstanding Rent', 'Kodi Inayosubiriwa')}
                            </span>
                            <h4 className="text-2xl font-extrabold text-amber-600 mt-1">
                                TZS {(expectedMonthTotal - totalCollected > 0 ? expectedMonthTotal - totalCollected : 0).toLocaleString()}
                            </h4>
                            <span className="text-[11px] text-amber-600 font-medium mt-0.5 block">
                                {t('1 tenant pending payment', 'Mpangaji 1 bado hajakamilisha')}
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                            <Clock className="size-6" />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-slate-500 block">
                                {t('Receipts Issued', 'Risiti Zilizotolewa')}
                            </span>
                            <h4 className="text-2xl font-extrabold text-slate-900 mt-1">{payments.length}</h4>
                            <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
                                {t('Verified & legally binding', 'Zimethibitishwa kisheria')}
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                            <FileText className="size-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {[
                        { id: 'all', label: t('All Channels', 'Njia Zote') },
                        { id: 'mpesa', label: 'Vodacom M-Pesa' },
                        { id: 'tigopesa', label: 'Tigo Pesa' },
                        { id: 'bank_transfer', label: t('Bank Transfer', 'Benki') },
                        { id: 'cash', label: t('Cash Handover', 'Pesa Taslimu') },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilterMethod(tab.id)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                filterMethod === tab.id
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
                        placeholder={t('Search tenant, receipt number...', 'Tafuta mpangaji, namba ya risiti...')}
                        className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
            </div>

            {/* Payments List / Table */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-extrabold text-slate-900 text-sm">
                            {t('Recent Rent Payments & Official Receipts', 'Malipo ya Karibuni na Risiti Rasmi')}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {t(
                                `${filteredPayments.length} recorded payments verified on the system`,
                                `Miamala ${filteredPayments.length} ya malipo iliyorekodiwa na kuthibitishwa`
                            )}
                        </p>
                    </div>
                </div>

                {filteredPayments.length === 0 ? (
                    <div className="p-12 text-center">
                        <Wallet className="size-10 text-slate-300 mx-auto mb-3" />
                        <h4 className="text-sm font-bold text-slate-800">{t('No Payment Records Found', 'Hakuna Kumbukumbu za Malipo')}</h4>
                        <p className="text-xs text-slate-500 mt-1">
                            {t('Try adjusting your search query or channel filter.', 'Jaribu kubadilisha vigezo vya utafutaji wako au njia ya malipo.')}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredPayments.map((p) => (
                            <div
                                key={p.id}
                                className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                                        <CheckCircle className="size-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-extrabold text-sm text-slate-900">{p.tenant_name}</h4>
                                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                                                {p.receipt_number}
                                            </span>
                                            {getMethodBadge(p.payment_method)}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                            <Home className="size-3.5 text-blue-500" />
                                            <span>{p.property_name} • {p.unit_number}</span>
                                            <span>•</span>
                                            <Calendar className="size-3.5 text-slate-400" />
                                            <span>{p.billing_period}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-6">
                                    <div className="text-left md:text-right">
                                        <span className="text-base font-extrabold text-emerald-700 block">
                                            TZS {p.amount.toLocaleString()}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                                            {p.paid_on} • {p.reference_number}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => setSelectedReceipt(p)}
                                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                                        >
                                            {t('View Receipt', 'Tazama Risiti')}
                                        </button>
                                        <button
                                            onClick={() => handleShareWhatsapp(p)}
                                            className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-colors"
                                            title={t('Share Receipt on WhatsApp', 'Tuma Risiti kwa WhatsApp')}
                                        >
                                            <Share2 className="size-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* RECORD RENT PAYMENT MODAL matching Dart's _PaymentForm */}
            {isRecordModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                                <Wallet className="size-5 text-emerald-600" />
                                {t('Record Rent Payment', 'Rekodi Malipo ya Kodi')}
                            </h3>
                            <button onClick={() => setIsRecordModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleRecordPayment} className="p-6 overflow-y-auto space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">{t('Tenant Full Name', 'Jina la Mpangaji')}</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.tenant_name}
                                        onChange={(e) => setForm({ ...form, tenant_name: e.target.value })}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">{t('Tenant Phone Number', 'Namba ya Simu')}</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.tenant_phone}
                                        onChange={(e) => setForm({ ...form, tenant_phone: e.target.value })}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">{t('Property Name', 'Jina la Nyumba')}</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.property_name}
                                        onChange={(e) => setForm({ ...form, property_name: e.target.value })}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">{t('Unit / Room', 'Chumba / Unit')}</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.unit_number}
                                        onChange={(e) => setForm({ ...form, unit_number: e.target.value })}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">{t('Amount Paid (TZS)', 'Kiasi Kilicholipwa (TZS)')}</label>
                                    <input
                                        type="number"
                                        required
                                        value={form.amount}
                                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-extrabold text-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">{t('Payment Method', 'Njia ya Malipo')}</label>
                                    <select
                                        value={form.payment_method}
                                        onChange={(e) => setForm({ ...form, payment_method: e.target.value as any })}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold"
                                    >
                                        <option value="mpesa">Vodacom M-Pesa</option>
                                        <option value="tigopesa">Tigo Pesa (Mixx by Yas)</option>
                                        <option value="airtelmoney">Airtel Money</option>
                                        <option value="bank_transfer">CRDB / NMB Bank Transfer</option>
                                        <option value="cash">{t('Cash Handover', 'Pesa Taslimu')}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">{t('Rent Period / Month', 'Kipindi cha Kodi')}</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.billing_period}
                                        onChange={(e) => setForm({ ...form, billing_period: e.target.value })}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">{t('Date Paid', 'Tarehe ya Malipo')}</label>
                                    <input
                                        type="date"
                                        required
                                        value={form.paid_on}
                                        onChange={(e) => setForm({ ...form, paid_on: e.target.value })}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    {t('Transaction Reference Number', 'Namba ya Kumbukumbu ya Muamala')}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.reference_number}
                                    onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
                                    placeholder={t('e.g. MPE-9821812 or Bank Slip', 'mfano: MPE-9821812 au Namba ya Risiti')}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    {t('Notes & Remarks (Optional)', 'Maelezo ya Ziada (Hiari)')}
                                </label>
                                <textarea
                                    rows={2}
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    placeholder={t('Optional notes regarding this rent payment', 'Maelezo ya hiari kuhusu malipo haya')}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                                />
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsRecordModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                                >
                                    {t('Cancel', 'Ghairi')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? t('Saving...', 'Inarekodi...') : t('Confirm & Issue Receipt', 'Thibitisha na Toa Risiti')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RECEIPT DETAILS MODAL */}
            {selectedReceipt && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
                        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase">
                                    {t('Official Rent Receipt', 'Risiti Rasmi ya Kodi')}
                                </span>
                                <h3 className="text-lg font-black">{selectedReceipt.receipt_number}</h3>
                            </div>
                            <button
                                onClick={() => setSelectedReceipt(null)}
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 text-xs">
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">{t('Tenant', 'Mpangaji')}</span>
                                    <span className="font-bold text-slate-800">{selectedReceipt.tenant_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">{t('Premises', 'Nyumba na Chumba')}</span>
                                    <span className="font-bold text-slate-800">{selectedReceipt.property_name} ({selectedReceipt.unit_number})</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">{t('Rent Period', 'Kipindi cha Kodi')}</span>
                                    <span className="font-bold text-slate-800">{selectedReceipt.billing_period}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">{t('Payment Date', 'Tarehe')}</span>
                                    <span className="font-bold text-slate-800">{selectedReceipt.paid_on}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">{t('Payment Method', 'Njia ya Malipo')}</span>
                                    <span className="font-bold text-slate-800">{selectedReceipt.payment_method.toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">{t('Reference / Ref', 'Namba ya Kumbukumbu')}</span>
                                    <span className="font-mono font-bold text-slate-800">{selectedReceipt.reference_number}</span>
                                </div>
                                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                                    <span className="font-extrabold text-slate-900">{t('Total Amount Settled', 'Jumla Iliyolipwa')}</span>
                                    <span className="text-base font-black text-emerald-700">TZS {selectedReceipt.amount.toLocaleString()}</span>
                                </div>
                            </div>

                            {selectedReceipt.notes && (
                                <p className="text-[11px] text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    "{selectedReceipt.notes}"
                                </p>
                            )}

                            <div className="flex items-center gap-2 pt-2">
                                <button
                                    onClick={() => handleShareWhatsapp(selectedReceipt)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all text-xs"
                                >
                                    <Share2 className="size-4" /> {t('Send via WhatsApp', 'Tuma kwa WhatsApp')}
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all text-xs"
                                >
                                    <Printer className="size-4" /> {t('Print', 'Chapisha')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Receipt, Plus, CheckCircle, Clock, AlertTriangle, Printer,
    Search, Filter, Share2, CreditCard, Eye, X, ChevronRight,
    User, Home, Calendar, Sparkles, Send, Check, DollarSign, Wallet
} from 'lucide-react';

interface InvoiceItem {
    description: string;
    amount: number;
    type?: string;
}

interface Invoice {
    id: number;
    invoice_number: string;
    tenancy_id?: number;
    agreement_id?: number;
    property_name?: string;
    unit_number?: string;
    tenant_name?: string;
    tenant_phone?: string;
    billing_period: string;
    issue_date: string;
    due_date: string;
    amount_due: number;
    amount_paid: number;
    balance: number;
    status: 'issued' | 'delivered' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
    items?: InvoiceItem[];
    payments?: Array<{
        amount: number;
        method: string;
        reference: string;
        date: string;
    }>;
    created_at?: string;
}

interface InvoicesViewProps {
    properties?: Array<{ id: number; name: string }>;
}

export default function InvoicesView({ properties = [] }: InvoicesViewProps) {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'issued' | 'delivered' | 'partially_paid' | 'paid' | 'overdue'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<Invoice | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('mpesa');
    const [paymentRef, setPaymentRef] = useState('');
    const [paymentNote, setPaymentNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

    // Generate invoice form
    const [genForm, setGenForm] = useState({
        property_name: properties[0]?.name || 'Kimaro Prime Residences',
        unit_number: 'Room 2 - Ground Floor',
        tenant_name: '',
        billing_period: new Date().toLocaleDateString('sw-TZ', { month: 'long', year: 'numeric' }),
        base_rent: '350000',
        electricity_amount: '0',
        water_amount: '0',
        other_charges: '0',
        due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        notes: '',
    });

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const res = await fetch('/landlord/invoices', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'include',
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setInvoices(data);
            } else if (data.data && Array.isArray(data.data)) {
                setInvoices(data.data);
            }
        } catch (err) {
            console.error('Failed to load invoices:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const showNotify = (type: 'success' | 'error' | 'info', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const handleGenerateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/landlord/invoices/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
                body: JSON.stringify({
                    property_name: genForm.property_name,
                    unit_number: genForm.unit_number,
                    tenant_name: genForm.tenant_name,
                    billing_period: genForm.billing_period,
                    base_rent: Number(genForm.base_rent),
                    electricity_amount: Number(genForm.electricity_amount) || 0,
                    water_amount: Number(genForm.water_amount) || 0,
                    other_charges: Number(genForm.other_charges) || 0,
                    due_date: genForm.due_date,
                    notes: genForm.notes,
                }),
            });
            const data = await res.json();
            if (data.invoice) {
                showNotify('success', `Ankara #${data.invoice.invoice_number} imetolewa kikamilifu!`);
                setIsGenerateModalOpen(false);
                fetchInvoices();
            } else {
                showNotify('error', data.message || 'Hitilafu imetokea wakati wa kutoa ankara.');
            }
        } catch {
            showNotify('error', 'Hitilafu ya mtandao wakati wa kutoa ankara.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentTargetInvoice) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/landlord/invoices/${paymentTargetInvoice.id}/pay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
                body: JSON.stringify({
                    amount: Number(paymentAmount),
                    payment_method: paymentMethod,
                    reference_number: paymentRef || `MANUAL-${Date.now()}`,
                    notes: paymentNote,
                }),
            });
            const data = await res.json();
            if (data.invoice) {
                showNotify('success', `Malipo ya TZS ${Number(paymentAmount).toLocaleString()} yamerekodiwa kwenye Ankara #${data.invoice.invoice_number}.`);
                setIsPaymentModalOpen(false);
                setPaymentTargetInvoice(null);
                setPaymentAmount('');
                setPaymentRef('');
                fetchInvoices();
            } else {
                showNotify('error', data.message || 'Hitilafu katika kurekodi malipo.');
            }
        } catch {
            showNotify('error', 'Hitilafu ya mtandao wakati wa kurekodi malipo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleShareWhatsapp = (invoice: Invoice) => {
        const text = encodeURIComponent(
            `Habari ${invoice.tenant_name || 'Mteja'}, Ankara yako ya kodi #${invoice.invoice_number} ya kipindi cha ${invoice.billing_period} ipo tayari. Kiasi: TZS ${invoice.amount_due.toLocaleString()}, Baki: TZS ${invoice.balance.toLocaleString()}. Tafadhali fanya malipo kabla ya tarehe ${invoice.due_date}. Tazama ankara: ${window.location.origin}/landlord/invoices/${invoice.id}/print`
        );
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const filteredInvoices = invoices.filter((inv) => {
        if (filter !== 'all' && inv.status !== filter) return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return (
                inv.invoice_number?.toLowerCase().includes(q) ||
                inv.tenant_name?.toLowerCase().includes(q) ||
                inv.property_name?.toLowerCase().includes(q) ||
                inv.unit_number?.toLowerCase().includes(q) ||
                inv.billing_period?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    // KPI Metrics calculation
    const totalInvoiced = invoices.reduce((acc, curr) => acc + (Number(curr.amount_due) || 0), 0);
    const totalCollected = invoices.reduce((acc, curr) => acc + (Number(curr.amount_paid) || 0), 0);
    const totalOutstanding = invoices.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0);
    const overdueCount = invoices.filter((inv) => inv.status === 'overdue').length;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle className="size-3.5 text-emerald-600" /> Imelipwa (Paid)
                    </span>
                );
            case 'partially_paid':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock className="size-3.5 text-amber-600" /> Sehemu Imelipwa
                    </span>
                );
            case 'overdue':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                        <AlertTriangle className="size-3.5 text-red-600" /> Imechelewa (Overdue)
                    </span>
                );
            case 'delivered':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        <Send className="size-3.5 text-blue-600" /> Imetumwa (Delivered)
                    </span>
                );
            case 'issued':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        Imetolewa (Issued)
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                        Imebatilishwa (Cancelled)
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
                                : 'bg-red-50 text-red-900 border border-red-200'
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
                        <Receipt className="size-6 text-blue-600" />
                        Usimamizi wa Ankara na Malipo (Invoices & Billing)
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Daftari halali la madai, risiti, makato ya umeme/maji, na uthibitisho wa malipo kupitia benki au simu.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => setIsGenerateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
                    >
                        <Plus className="size-4" /> Toa Ankara Mpya
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Jumla Iliyodaiwa</span>
                    <h4 className="text-lg font-extrabold text-slate-900">TZS {totalInvoiced.toLocaleString()}</h4>
                    <span className="text-[10px] text-slate-400 mt-1 block">Ankara {invoices.length} zilizotolewa</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                    <span className="text-[11px] font-bold text-emerald-600 block mb-1">Iliyolipwa (Collected)</span>
                    <h4 className="text-lg font-extrabold text-emerald-700">TZS {totalCollected.toLocaleString()}</h4>
                    <span className="text-[10px] text-emerald-600/80 mt-1 block font-medium">Imethibitishwa benki/simu</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                    <span className="text-[11px] font-bold text-amber-600 block mb-1">Deni Lililobaki (Pending)</span>
                    <h4 className="text-lg font-extrabold text-amber-700">TZS {totalOutstanding.toLocaleString()}</h4>
                    <span className="text-[10px] text-amber-600/80 mt-1 block font-medium">Bado haijakamilika</span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                    <span className="text-[11px] font-bold text-red-500 block mb-1">Zilizochelewa (Overdue)</span>
                    <h4 className="text-lg font-extrabold text-red-600">{overdueCount}</h4>
                    <span className="text-[10px] text-red-500/80 mt-1 block font-medium">Zinazohitaji ukumbusho</span>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {[
                        { id: 'all', label: 'Zote (All)' },
                        { id: 'issued', label: 'Imetolewa' },
                        { id: 'delivered', label: 'Imetumwa' },
                        { id: 'partially_paid', label: 'Sehemu' },
                        { id: 'paid', label: 'Imelipwa' },
                        { id: 'overdue', label: 'Zilizo pita tarehe' },
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
                        placeholder="Tafuta mpangaji, namba ya ankara..."
                        className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Invoices List / Grid */}
            {loading ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                    <Clock className="size-8 text-blue-600 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Inapakia orodha ya ankara...</p>
                </div>
            ) : filteredInvoices.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                    <Receipt className="size-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-slate-800">Hakuna ankara zilizopatikana</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        Bofya "+ Toa Ankara Mpya" au washa mkataba mpya wa upangaji ili ankara ya awali itolewe kiotomatiki.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredInvoices.map((inv) => (
                        <div
                            key={inv.id}
                            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                        >
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                                        {inv.invoice_number}
                                    </span>
                                    {getStatusBadge(inv.status)}
                                </div>

                                <div>
                                    <h3 className="font-extrabold text-base text-slate-900">{inv.tenant_name || 'Mpangaji'}</h3>
                                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                        <Home className="size-3.5 text-blue-500" />
                                        {inv.property_name || 'Nyumba'} • {inv.unit_number || 'Chumba'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-xs">
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-medium block">Kipindi (Billing Period)</span>
                                        <span className="font-bold text-slate-800">{inv.billing_period}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-medium block">Tarehe ya Mwisho (Due)</span>
                                        <span className="font-semibold text-slate-700">{inv.due_date}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-medium block">Jumla ya Madai</span>
                                        <span className="font-extrabold text-slate-900">TZS {Number(inv.amount_due).toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-medium block">Baki ya Kulipwa</span>
                                        <span className={`font-extrabold ${Number(inv.balance) > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                            TZS {Number(inv.balance).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Card Actions */}
                            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                                <button
                                    onClick={() => setSelectedInvoice(inv)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                                >
                                    <Eye className="size-3.5 text-slate-500" /> Tazama
                                </button>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => handleShareWhatsapp(inv)}
                                        className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-colors"
                                        title="Shiriki kwa WhatsApp"
                                    >
                                        <Share2 className="size-4" />
                                    </button>

                                    <a
                                        href={`/landlord/invoices/${inv.id}/print`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                                        title="Chapisha au Pakua Ankara (PDF)"
                                    >
                                        <Printer className="size-4" />
                                    </a>

                                    {inv.status !== 'paid' && (
                                        <button
                                            onClick={() => {
                                                setPaymentTargetInvoice(inv);
                                                setPaymentAmount(inv.balance.toString());
                                                setIsPaymentModalOpen(true);
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                                        >
                                            <Wallet className="size-3.5" /> Lipisha
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* GENERATE NEW INVOICE MODAL */}
            {isGenerateModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                                <Receipt className="size-5 text-blue-600" /> Toa Ankara Mpya ya Kodi
                            </h3>
                            <button onClick={() => setIsGenerateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleGenerateInvoice} className="p-6 overflow-y-auto space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Jina la Nyumba</label>
                                    <input
                                        type="text"
                                        required
                                        value={genForm.property_name}
                                        onChange={(e) => setGenForm({ ...genForm, property_name: e.target.value })}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Namba ya Chumba</label>
                                    <input
                                        type="text"
                                        required
                                        value={genForm.unit_number}
                                        onChange={(e) => setGenForm({ ...genForm, unit_number: e.target.value })}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Jina la Mpangaji</label>
                                <input
                                    type="text"
                                    required
                                    value={genForm.tenant_name}
                                    onChange={(e) => setGenForm({ ...genForm, tenant_name: e.target.value })}
                                    placeholder="Hamisi Bakari"
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Kipindi cha Ankara (Billing Period)</label>
                                    <input
                                        type="text"
                                        required
                                        value={genForm.billing_period}
                                        onChange={(e) => setGenForm({ ...genForm, billing_period: e.target.value })}
                                        placeholder="mfano: Novemba 2026"
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Tarehe ya Mwisho ya Malipo (Due)</label>
                                    <input
                                        type="date"
                                        required
                                        value={genForm.due_date}
                                        onChange={(e) => setGenForm({ ...genForm, due_date: e.target.value })}
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                                    />
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                                <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">Mchanganuo wa Malipo (Itemized)</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-600 mb-1">Kodi ya Pango (Rent TZS)</label>
                                        <input
                                            type="number"
                                            required
                                            value={genForm.base_rent}
                                            onChange={(e) => setGenForm({ ...genForm, base_rent: e.target.value })}
                                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-600 mb-1">Gharama za Umeme / LUKU</label>
                                        <input
                                            type="number"
                                            value={genForm.electricity_amount}
                                            onChange={(e) => setGenForm({ ...genForm, electricity_amount: e.target.value })}
                                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-600 mb-1">Gharama za Maji (M³)</label>
                                        <input
                                            type="number"
                                            value={genForm.water_amount}
                                            onChange={(e) => setGenForm({ ...genForm, water_amount: e.target.value })}
                                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-600 mb-1">Gharama Nyingine (Usafi n.k)</label>
                                        <input
                                            type="number"
                                            value={genForm.other_charges}
                                            onChange={(e) => setGenForm({ ...genForm, other_charges: e.target.value })}
                                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsGenerateModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                                >
                                    Ghairi
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Inatoa...' : 'Toa Ankara'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RECORD PAYMENT MODAL */}
            {isPaymentModalOpen && paymentTargetInvoice && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                                <Wallet className="size-5 text-emerald-600" /> Rekodi Malipo ya Ankara
                            </h3>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                            <p className="font-bold text-slate-800">Ankara #{paymentTargetInvoice.invoice_number}</p>
                            <p className="text-slate-600">Mpangaji: <strong>{paymentTargetInvoice.tenant_name}</strong></p>
                            <p className="text-slate-600">Deni Lililobaki: <strong className="text-amber-700">TZS {Number(paymentTargetInvoice.balance).toLocaleString()}</strong></p>
                        </div>

                        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Kiasi Kilicholipwa (TZS)</label>
                                <input
                                    type="number"
                                    required
                                    max={paymentTargetInvoice.balance}
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-extrabold text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Njia ya Malipo</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                                >
                                    <option value="mpesa">M-Pesa (Vodacom)</option>
                                    <option value="tigopesa">Tigo Pesa (Mixx by Yas)</option>
                                    <option value="airtelmoney">Airtel Money</option>
                                    <option value="bank_transfer">CRDB / NMB Bank Transfer</option>
                                    <option value="cash">Pesa Taslimu (Cash Handover)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Namba ya Kumbukumbu ya Malipo (Reference No.)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="mfano: QA84729103"
                                    value={paymentRef}
                                    onChange={(e) => setPaymentRef(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Maelezo ya Ziada (Hiari)</label>
                                <input
                                    type="text"
                                    placeholder="mfano: Malipo ya kodi ya mwezi Novemba"
                                    value={paymentNote}
                                    onChange={(e) => setPaymentNote(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                                />
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsPaymentModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                                >
                                    Ghairi
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Inarekodi...' : 'Thibitisha na Hifadhi Malipo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* INVOICE DETAILS MODAL */}
            {selectedInvoice && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-mono font-bold text-blue-600 uppercase">
                                    {selectedInvoice.invoice_number}
                                </span>
                                <h3 className="font-extrabold text-base text-slate-900">
                                    Maelezo ya Ankara — {selectedInvoice.billing_period}
                                </h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={`/landlord/invoices/${selectedInvoice.id}/print`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                                >
                                    <Printer className="size-3.5" /> Chapisha
                                </a>
                                <button
                                    onClick={() => setSelectedInvoice(null)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4 text-xs">
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-3">
                                <div>
                                    <span className="text-slate-400 block text-[10px]">Mpangaji</span>
                                    <span className="font-bold text-slate-800">{selectedInvoice.tenant_name}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px]">Chumba</span>
                                    <span className="font-bold text-slate-800">{selectedInvoice.unit_number}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px]">Jumla ya Madai</span>
                                    <span className="font-extrabold text-slate-900">TZS {Number(selectedInvoice.amount_due).toLocaleString()}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px]">Baki</span>
                                    <span className="font-extrabold text-amber-700">TZS {Number(selectedInvoice.balance).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Itemized list */}
                            <div className="space-y-2">
                                <h4 className="font-bold text-slate-800">Vipengele vya Ankara:</h4>
                                {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                                        {selectedInvoice.items.map((item, idx) => (
                                            <div key={idx} className="p-3 flex items-center justify-between bg-white text-xs">
                                                <span className="text-slate-700">{item.description}</span>
                                                <span className="font-bold text-slate-900">TZS {Number(item.amount).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-500 italic">Kodi ya Pango ya Kipindi hiki.</p>
                                )}
                            </div>

                            {/* Payment history */}
                            <div className="space-y-2">
                                <h4 className="font-bold text-slate-800">Historia ya Malipo:</h4>
                                {selectedInvoice.payments && selectedInvoice.payments.length > 0 ? (
                                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                                        {selectedInvoice.payments.map((p, idx) => (
                                            <div key={idx} className="p-3 flex items-center justify-between bg-emerald-50/50 text-xs">
                                                <div>
                                                    <span className="font-bold text-slate-800 block">TZS {Number(p.amount).toLocaleString()}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">{p.method} • {p.reference}</span>
                                                </div>
                                                <span className="text-[10px] text-slate-500">{p.date}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-400 italic text-[11px]">Bado hakuna malipo yaliyorekodiwa kwa ankara hii.</p>
                                )}
                            </div>
                        </div>

                        <div className="p-5 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedInvoice(null)}
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

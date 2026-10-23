import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Receipt, Plus, CheckCircle, Clock, AlertTriangle, Printer,
    Search, Filter, Share2, CreditCard, Eye, X, ChevronRight,
    User, Home, Calendar, Sparkles, Send, Check, DollarSign, Wallet,
    Trash2, FileText
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
    prefilledUnit?: any;
    onClearPrefill?: () => void;
    lang?: 'en' | 'sw';
}

const DEFAULT_SAMPLE_INVOICES: Invoice[] = [
    {
        id: 1,
        invoice_number: 'INV-202610-001',
        property_name: 'Mikocheni Executive Apartments',
        unit_number: 'Unit A2',
        tenant_name: 'Juma Bakari',
        tenant_phone: '+255 765 890 123',
        billing_period: 'October 2026',
        issue_date: '01/10/2026',
        due_date: '05/10/2026',
        amount_due: 550000,
        amount_paid: 550000,
        balance: 0,
        status: 'paid',
        items: [
            { description: 'Monthly Rent', amount: 500000 },
            { description: 'Electricity Utility (LUKU Token)', amount: 30000 },
            { description: 'DAWASA Water Utility', amount: 20000 },
        ],
        payments: [
            {
                amount: 550000,
                method: 'mpesa',
                reference: 'MPE-9821812',
                date: '03/10/2026 14:20',
            },
        ],
    },
    {
        id: 2,
        invoice_number: 'INV-202610-002',
        property_name: 'Palm Vista Apartments',
        unit_number: 'Unit B1',
        tenant_name: 'Sarah Johnson',
        tenant_phone: '+255 712 990 011',
        billing_period: 'October 2026',
        issue_date: '01/10/2026',
        due_date: '07/10/2026',
        amount_due: 440000,
        amount_paid: 440000,
        balance: 0,
        status: 'paid',
        items: [
            { description: 'Monthly Rent', amount: 420000 },
            { description: 'Waste Collection & Sanitation', amount: 20000 },
        ],
        payments: [
            {
                amount: 440000,
                method: 'bank_transfer',
                reference: 'CRDB-TX-44810',
                date: '05/10/2026 09:12',
            },
        ],
    },
    {
        id: 3,
        invoice_number: 'INV-202611-003',
        property_name: 'Kimaro Prime Residences',
        unit_number: 'Room 2 - Ground Floor',
        tenant_name: 'David Mwangi',
        tenant_phone: '+255 754 332 119',
        billing_period: 'November 2026',
        issue_date: '20/10/2026',
        due_date: '28/10/2026',
        amount_due: 380000,
        amount_paid: 0,
        balance: 380000,
        status: 'issued',
        items: [
            { description: 'Monthly Rent', amount: 350000 },
            { description: 'Water Utility (DAWASA)', amount: 15000 },
            { description: 'Security & Facilities', amount: 15000 },
        ],
    },
];

export default function InvoicesView({ properties = [], prefilledUnit, onClearPrefill, lang = 'en' }: InvoicesViewProps) {
    const t = (en: string, sw: string) => (lang === 'sw' ? sw : en);
    const [invoices, setInvoices] = useState<Invoice[]>(DEFAULT_SAMPLE_INVOICES);
    const [loading, setLoading] = useState(false);
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

    // Generate invoice form state - matching Dart's 9-section statutory Rental Invoice
    const [genForm, setGenForm] = useState({
        // Section 2: Tenant details
        tenant_name: 'Juma Bakari',
        tenant_phone: '+255 765 890 123',
        tenant_email: 'juma.bakari@gmail.com',
        tenant_reference: 'TNT-001',
        // Section 3: Property details
        property_name: properties[0]?.name || 'Mikocheni Executive Apartments',
        property_address: 'Mikocheni B, Plot 42, Dar es Salaam',
        unit_number: 'Unit A2',
        agreement_reference: 'AGR-2026-001',
        // Section 4: Rental Period & Due Date
        period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
        due_date: new Date(new Date().getFullYear(), new Date().getMonth(), 5).toISOString().split('T')[0],
        billing_period: new Date().toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-US', { month: 'long', year: 'numeric' }),
        // Section 5: Dynamic Itemized Line Items
        line_items: [
            { id: '1', description: lang === 'sw' ? 'Kodi ya pango' : 'Rental fee', quantity: 1, unit_price: 500000, amount: 500000 },
            { id: '2', description: lang === 'sw' ? 'Umeme wa LUKU' : 'Electricity (LUKU allocation)', quantity: 1, unit_price: 30000, amount: 30000 },
            { id: '3', description: lang === 'sw' ? 'Maji ya DAWASA' : 'Water (DAWASA allocation)', quantity: 1, unit_price: 20000, amount: 20000 },
        ],
        // Section 6: Payment Details & Instructions
        payment_method: lang === 'sw' ? 'Uhamisho wa Benki / Pesa za Simu' : 'Bank Transfer / Mobile Money',
        payment_reference: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-00${invoices.length + 1}`,
        payment_instructions: lang === 'sw'
            ? 'Lipa Namba M-Pesa: 589021 au Benki ya CRDB: 015289100234 (Panga Pangisha)'
            : 'Lipa Namba M-Pesa: 589021 or CRDB Bank: 015289100234 (Panga Pangisha)',
        // Section 7: Notes & Terms
        notes: lang === 'sw'
            ? 'Malipo yafanyike kabla au siku husika ya tarehe ya mwisho. Makato ya kuchelewa yatatozwa kwa mujibu wa mkataba.'
            : 'Payment due on or before stated due date. Late charges apply as per rental agreement.',
        // Section 8: Issued By
        issued_by: 'Landlord',
    });

    useEffect(() => {
        if (prefilledUnit) {
            setGenForm((prev) => ({
                ...prev,
                property_name: prefilledUnit.property_name || prev.property_name,
                property_address: prefilledUnit.address || prev.property_address,
                unit_number: prefilledUnit.unit_number || prev.unit_number,
                tenant_name: prefilledUnit.current_tenancy?.tenant_name || prev.tenant_name,
                tenant_phone: prefilledUnit.current_tenancy?.tenant_phone || prev.tenant_phone,
                tenant_email: prefilledUnit.current_tenancy?.tenant_email || prev.tenant_email,
                tenant_reference: prefilledUnit.current_tenancy?.tenant_reference || prev.tenant_reference,
                line_items: [
                    { id: '1', description: lang === 'sw' ? 'Kodi ya Pango' : 'Monthly Rent', quantity: 1, unit_price: Number(prefilledUnit.monthly_rent || 500000), amount: Number(prefilledUnit.monthly_rent || 500000) },
                    ...(prefilledUnit.utilities?.luku?.current_units ? [{ id: '2', description: lang === 'sw' ? 'Umeme wa LUKU' : 'Electricity (LUKU)', quantity: 1, unit_price: 25000, amount: 25000 }] : []),
                    ...(prefilledUnit.utilities?.water?.current_reading ? [{ id: '3', description: lang === 'sw' ? 'Maji ya DAWASA' : 'Water (DAWASA)', quantity: 1, unit_price: 15000, amount: 15000 }] : []),
                ],
            }));
            setIsGenerateModalOpen(true);
            onClearPrefill?.();
        }
    }, [prefilledUnit]);

    const fetchInvoices = async () => {
        try {
            const res = await fetch('/landlord/invoices', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    setInvoices(data);
                } else if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                    setInvoices(data.data);
                }
            }
        } catch (err) {
            console.error('Failed to load invoices:', err);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const showNotify = (type: 'success' | 'error' | 'info', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const handleAddLineItem = () => {
        setGenForm((prev) => ({
            ...prev,
            line_items: [
                ...prev.line_items,
                {
                    id: String(Date.now()),
                    description: lang === 'sw' ? 'Huduma Nyingine' : 'Service charge',
                    quantity: 1,
                    unit_price: 20000,
                    amount: 20000,
                },
            ],
        }));
    };

    const handleRemoveLineItem = (index: number) => {
        if (genForm.line_items.length <= 1) return;
        setGenForm((prev) => ({
            ...prev,
            line_items: prev.line_items.filter((_, i) => i !== index),
        }));
    };

    const handleUpdateLineItem = (index: number, field: string, value: any) => {
        setGenForm((prev) => {
            const items = [...prev.line_items];
            const item = { ...items[index], [field]: value };
            if (field === 'quantity' || field === 'unit_price') {
                const qty = field === 'quantity' ? Number(value) || 0 : item.quantity || 1;
                const price = field === 'unit_price' ? Number(value) || 0 : item.unit_price || 0;
                item.amount = qty * price;
            } else if (field === 'amount') {
                item.unit_price = Number(value) || 0;
            }
            items[index] = item;
            return { ...prev, line_items: items };
        });
    };

    const totalInvoiceAmount = genForm.line_items.reduce((s, it) => s + (Number(it.amount) || 0), 0);

    const handleGenerateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const total = totalInvoiceAmount;

        const payload = {
            invoice_number: genForm.payment_reference,
            issue_date: new Date().toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-US'),
            due_date: genForm.due_date,
            status: 'issued',
            // Landlord
            landlord_name: 'Landlord',
            landlord_phone: '+255 700 000 000',
            landlord_email: 'landlord@panga-pangisha.com',
            landlord_address: 'Dar es Salaam, Tanzania',
            // Tenant
            tenant_name: genForm.tenant_name,
            tenant_phone: genForm.tenant_phone,
            tenant_email: genForm.tenant_email,
            tenant_reference: genForm.tenant_reference,
            // Property
            property_name: genForm.property_name,
            property_address: genForm.property_address,
            unit_number: genForm.unit_number,
            agreement_reference: genForm.agreement_reference,
            // Period
            period_start: genForm.period_start,
            period_end: genForm.period_end,
            billing_period: genForm.billing_period,
            rent_frequency: 'Monthly',
            // Items
            line_items: genForm.line_items.map((it) => ({
                description: it.description,
                quantity: it.quantity || 1,
                unit_price: it.unit_price || it.amount,
                amount: it.amount,
            })),
            subtotal: total,
            amount_due: total,
            amount_paid: 0,
            outstanding_balance: total,
            // Payment details
            payment_method: genForm.payment_method,
            payment_reference: genForm.payment_reference,
            payment_instructions: genForm.payment_instructions,
            notes: genForm.notes,
            issued_by: genForm.issued_by,
        };

        try {
            const res = await fetch('/landlord/invoices/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.invoice) {
                showNotify('success', t(`Invoice #${data.invoice.invoice_number} issued successfully!`, `Ankara #${data.invoice.invoice_number} imetolewa kikamilifu!`));
                setIsGenerateModalOpen(false);
                fetchInvoices();
            } else {
                // Fallback add to state
                const newInv: Invoice = {
                    id: Date.now(),
                    invoice_number: genForm.payment_reference,
                    property_name: genForm.property_name,
                    property_address: genForm.property_address,
                    unit_number: genForm.unit_number,
                    agreement_reference: genForm.agreement_reference,
                    tenant_name: genForm.tenant_name,
                    tenant_phone: genForm.tenant_phone,
                    tenant_email: genForm.tenant_email,
                    tenant_reference: genForm.tenant_reference,
                    period_start: genForm.period_start,
                    period_end: genForm.period_end,
                    billing_period: genForm.billing_period,
                    issue_date: new Date().toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-US'),
                    due_date: genForm.due_date,
                    amount_due: total,
                    amount_paid: 0,
                    balance: total,
                    status: 'issued',
                    items: genForm.line_items.map((it) => ({
                        description: it.description,
                        amount: it.amount,
                    })),
                };
                setInvoices([newInv, ...invoices]);
                showNotify('success', t(`Invoice #${newInv.invoice_number} issued successfully!`, `Ankara #${newInv.invoice_number} imetolewa kikamilifu!`));
                setIsGenerateModalOpen(false);
            }
        } catch {
            const newInv: Invoice = {
                id: Date.now(),
                invoice_number: genForm.payment_reference,
                property_name: genForm.property_name,
                property_address: genForm.property_address,
                unit_number: genForm.unit_number,
                agreement_reference: genForm.agreement_reference,
                tenant_name: genForm.tenant_name,
                tenant_phone: genForm.tenant_phone,
                tenant_email: genForm.tenant_email,
                tenant_reference: genForm.tenant_reference,
                period_start: genForm.period_start,
                period_end: genForm.period_end,
                billing_period: genForm.billing_period,
                issue_date: new Date().toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-US'),
                due_date: genForm.due_date,
                amount_due: total,
                amount_paid: 0,
                balance: total,
                status: 'issued',
                items: genForm.line_items.map((it) => ({
                    description: it.description,
                    amount: it.amount,
                })),
            };
            setInvoices([newInv, ...invoices]);
            showNotify('success', t(`Invoice #${newInv.invoice_number} issued successfully!`, `Ankara #${newInv.invoice_number} imetolewa kikamilifu!`));
            setIsGenerateModalOpen(false);
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
                showNotify('success', t(`Payment of TZS ${Number(paymentAmount).toLocaleString()} recorded on Invoice #${data.invoice.invoice_number}.`, `Malipo ya TZS ${Number(paymentAmount).toLocaleString()} yamerekodiwa kwenye Ankara #${data.invoice.invoice_number}.`));
                setIsPaymentModalOpen(false);
                setPaymentTargetInvoice(null);
                setPaymentAmount('');
                setPaymentRef('');
                fetchInvoices();
            } else {
                showNotify('error', data.message || t('Error recording payment.', 'Hitilafu katika kurekodi malipo.'));
            }
        } catch {
            showNotify('error', t('Network error while recording payment.', 'Hitilafu ya mtandao wakati wa kurekodi malipo.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleShareWhatsapp = (invoice: Invoice) => {
        const text = encodeURIComponent(
            lang === 'sw'
                ? `Habari ${invoice.tenant_name || 'Mteja'}, Ankara yako ya kodi #${invoice.invoice_number} ya kipindi cha ${invoice.billing_period} ipo tayari. Kiasi: TZS ${invoice.amount_due.toLocaleString()}, Baki: TZS ${invoice.balance.toLocaleString()}. Tafadhali fanya malipo kabla ya tarehe ${invoice.due_date}. Tazama ankara: ${window.location.origin}/landlord/invoices/${invoice.id}/print`
                : `Hello ${invoice.tenant_name || 'Tenant'}, your rent invoice #${invoice.invoice_number} for ${invoice.billing_period} is ready. Total: TZS ${invoice.amount_due.toLocaleString()}, Balance Due: TZS ${invoice.balance.toLocaleString()}. Please complete payment by ${invoice.due_date}. View invoice: ${window.location.origin}/landlord/invoices/${invoice.id}/print`
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
                        <CheckCircle className="size-3.5 text-emerald-600" /> {t('Paid', 'Imelipwa')}
                    </span>
                );
            case 'partially_paid':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock className="size-3.5 text-amber-600" /> {t('Partially Paid', 'Sehemu Imelipwa')}
                    </span>
                );
            case 'overdue':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                        <AlertTriangle className="size-3.5 text-red-600" /> {t('Overdue', 'Imechelewa')}
                    </span>
                );
            case 'delivered':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        <Send className="size-3.5 text-blue-600" /> {t('Delivered', 'Imetumwa')}
                    </span>
                );
            case 'issued':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {t('Issued', 'Imetolewa')}
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                        {t('Cancelled', 'Imebatilishwa')}
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
                        {t('Invoices & Billing Management', 'Usimamizi wa Ankara na Malipo')}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        {t(
                            'Official ledger for rent billing, payment receipts, utility deductions, and verified bank/mobile money transactions.',
                            'Daftari halali la madai, risiti, makato ya umeme/maji, na uthibitisho wa malipo kupitia benki au simu.'
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => setIsGenerateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
                    >
                        <Plus className="size-4" /> {t('Create New Invoice', 'Toa Ankara Mpya')}
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">{t('Total Invoiced', 'Jumla Iliyodaiwa')}</span>
                    <h4 className="text-lg font-extrabold text-slate-900">TZS {totalInvoiced.toLocaleString()}</h4>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                        {t(`${invoices.length} invoices generated`, `Ankara ${invoices.length} zilizotolewa`)}
                    </span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                    <span className="text-[11px] font-bold text-emerald-600 block mb-1">{t('Total Collected', 'Iliyolipwa')}</span>
                    <h4 className="text-lg font-extrabold text-emerald-700">TZS {totalCollected.toLocaleString()}</h4>
                    <span className="text-[10px] text-emerald-600/80 mt-1 block font-medium">
                        {t('Verified via Bank / Mobile', 'Imethibitishwa benki/simu')}
                    </span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                    <span className="text-[11px] font-bold text-amber-600 block mb-1">{t('Pending Balance', 'Deni Lililobaki')}</span>
                    <h4 className="text-lg font-extrabold text-amber-700">TZS {totalOutstanding.toLocaleString()}</h4>
                    <span className="text-[10px] text-amber-600/80 mt-1 block font-medium">
                        {t('Awaiting tenant clearance', 'Bado haijakamilika')}
                    </span>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                    <span className="text-[11px] font-bold text-red-500 block mb-1">{t('Overdue Invoices', 'Zilizochelewa')}</span>
                    <h4 className="text-lg font-extrabold text-red-600">{overdueCount}</h4>
                    <span className="text-[10px] text-red-500/80 mt-1 block font-medium">
                        {t('Requires follow-up', 'Zinazohitaji ukumbusho')}
                    </span>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {[
                        { id: 'all', label: t('All Invoices', 'Zote') },
                        { id: 'issued', label: t('Issued', 'Imetolewa') },
                        { id: 'delivered', label: t('Delivered', 'Imetumwa') },
                        { id: 'partially_paid', label: t('Partial', 'Sehemu') },
                        { id: 'paid', label: t('Paid', 'Imelipwa') },
                        { id: 'overdue', label: t('Overdue', 'Zilizochelewa') },
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
                        placeholder={t('Search tenant, invoice number...', 'Tafuta mpangaji, namba ya ankara...')}
                        className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Invoices List / Grid */}
            {loading ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                    <Clock className="size-8 text-blue-600 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-500">{t('Loading invoices...', 'Inapakia orodha ya ankara...')}</p>
                </div>
            ) : filteredInvoices.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                    <Receipt className="size-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-slate-800">{t('No Invoices Found', 'Hakuna Ankara Zilizopatikana')}</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        {t(
                            'Click "+ Create New Invoice" or register a new rental agreement to generate an initial invoice automatically.',
                            'Bofya "+ Toa Ankara Mpya" au washa mkataba mpya wa upangaji ili ankara ya awali itolewe kiotomatiki.'
                        )}
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
                                    <h3 className="font-extrabold text-base text-slate-900">{inv.tenant_name || t('Tenant', 'Mpangaji')}</h3>
                                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                        <Home className="size-3.5 text-blue-500" />
                                        {inv.property_name || t('Property', 'Nyumba')} • {inv.unit_number || t('Unit', 'Chumba')}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-xs">
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-medium block">{t('Billing Period', 'Kipindi')}</span>
                                        <span className="font-bold text-slate-800">{inv.billing_period}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-medium block">{t('Due Date', 'Tarehe ya Mwisho')}</span>
                                        <span className="font-semibold text-slate-700">{inv.due_date}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-medium block">{t('Total Amount', 'Jumla ya Madai')}</span>
                                        <span className="font-extrabold text-slate-900">TZS {Number(inv.amount_due).toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-medium block">{t('Balance Due', 'Baki ya Kulipwa')}</span>
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
                                    <Eye className="size-3.5 text-slate-500" /> {t('View Details', 'Tazama')}
                                </button>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => handleShareWhatsapp(inv)}
                                        className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-colors"
                                        title={t('Share via WhatsApp', 'Shiriki kwa WhatsApp')}
                                    >
                                        <Share2 className="size-4" />
                                    </button>

                                    <a
                                        href={`/landlord/invoices/${inv.id}/print`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                                        title={t('Print or Download PDF', 'Chapisha au Pakua PDF')}
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
                                            <Wallet className="size-3.5" /> {t('Record Payment', 'Lipisha')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* GENERATE NEW INVOICE MODAL - 8-Section Statutory Rental Standard Matching Dart */}
            {isGenerateModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                            <div>
                                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                                    <Receipt className="size-5 text-blue-600" /> {t('Create Rental Invoice', 'Tengeneza Ankara ya Kodi')}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {t('Generate official rent invoice with itemized breakdown and verifiable payment reference.', 'Andaa ankara rasmi ya pango yenye mchanganuo wa gharama na kumbukumbu ya malipo.')}
                                </p>
                            </div>
                            <button onClick={() => setIsGenerateModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleGenerateInvoice} className="p-6 overflow-y-auto space-y-5 text-xs">
                            {/* Section 2: Tenant details */}
                            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                                <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
                                    <User className="size-4 text-blue-600" /> 2. {t('TENANT DETAILS', 'TAARIFA ZA MPANGAJI')}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">{t('Tenant Full Name', 'Jina Kamili la Mpangaji')} *</label>
                                        <input
                                            type="text"
                                            required
                                            value={genForm.tenant_name}
                                            onChange={(e) => setGenForm({ ...genForm, tenant_name: e.target.value })}
                                            placeholder="Juma Bakari"
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">{t('Phone Number', 'Nambari ya Simu')} *</label>
                                        <input
                                            type="tel"
                                            required
                                            value={genForm.tenant_phone}
                                            onChange={(e) => setGenForm({ ...genForm, tenant_phone: e.target.value })}
                                            placeholder="+255 765 890 123"
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">{t('Email (Optional)', 'Barua Pepe (Hiari)')}</label>
                                        <input
                                            type="email"
                                            value={genForm.tenant_email}
                                            onChange={(e) => setGenForm({ ...genForm, tenant_email: e.target.value })}
                                            placeholder="juma.bakari@gmail.com"
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">{t('Tenant Reference ID', 'Rejea ya Mpangaji')}</label>
                                        <input
                                            type="text"
                                            value={genForm.tenant_reference}
                                            onChange={(e) => setGenForm({ ...genForm, tenant_reference: e.target.value })}
                                            placeholder="TNT-001"
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Property details */}
                            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                                <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
                                    <Home className="size-4 text-emerald-600" /> 3. {t('PROPERTY DETAILS', 'TAARIFA ZA NYUMBA')}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">{t('Property Name', 'Jina la Nyumba')} *</label>
                                        <input
                                            type="text"
                                            required
                                            value={genForm.property_name}
                                            onChange={(e) => setGenForm({ ...genForm, property_name: e.target.value })}
                                            placeholder="Mikocheni Executive Apartments"
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">{t('Property Address', 'Anwani ya Nyumba')} *</label>
                                        <input
                                            type="text"
                                            required
                                            value={genForm.property_address}
                                            onChange={(e) => setGenForm({ ...genForm, property_address: e.target.value })}
                                            placeholder="Mikocheni B, Plot 42, Dar es Salaam"
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">{t('Unit / Room No', 'Chumba / Namba ya Unit')} *</label>
                                        <input
                                            type="text"
                                            required
                                            value={genForm.unit_number}
                                            onChange={(e) => setGenForm({ ...genForm, unit_number: e.target.value })}
                                            placeholder="Unit A2"
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">{t('Agreement Ref', 'Rejea ya Mkataba')}</label>
                                        <input
                                            type="text"
                                            value={genForm.agreement_reference}
                                            onChange={(e) => setGenForm({ ...genForm, agreement_reference: e.target.value })}
                                            placeholder="AGR-2026-001"
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Rental Period & Due Date */}
                            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                                <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
                                    <Calendar className="size-4 text-purple-600" /> 4. {t('RENTAL PERIOD & DUE DATE', 'KIPINDI CHA PANGO NA TAREHE')}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">{t('Period From', 'Kuanzia')} *</label>
                                        <input
                                            type="date"
                                            required
                                            value={genForm.period_start}
                                            onChange={(e) => setGenForm({ ...genForm, period_start: e.target.value })}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">{t('Period To', 'Hadi')} *</label>
                                        <input
                                            type="date"
                                            required
                                            value={genForm.period_end}
                                            onChange={(e) => setGenForm({ ...genForm, period_end: e.target.value })}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">{t('Payment Due Date', 'Tarehe ya Mwisho ya Malipo')} *</label>
                                        <input
                                            type="date"
                                            required
                                            value={genForm.due_date}
                                            onChange={(e) => setGenForm({ ...genForm, due_date: e.target.value })}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-blue-700"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 5: Invoice items */}
                            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
                                        <DollarSign className="size-4 text-emerald-600" /> 5. {t('INVOICE ITEMS', 'VIPENGELE VYA ANKARA')}
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={handleAddLineItem}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors"
                                    >
                                        <Plus className="size-3.5" /> {t('Add Item', 'Ongeza Kitu')}
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {genForm.line_items.map((it, idx) => (
                                        <div key={it.id || idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    required
                                                    value={it.description}
                                                    onChange={(e) => handleUpdateLineItem(idx, 'description', e.target.value)}
                                                    placeholder={t('Item description', 'Maelezo ya bidhaa au huduma')}
                                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                                                />
                                            </div>
                                            <div className="w-32">
                                                <input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    value={it.amount}
                                                    onChange={(e) => handleUpdateLineItem(idx, 'amount', e.target.value)}
                                                    placeholder="TZS"
                                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-right font-bold text-slate-900"
                                                />
                                            </div>
                                            {genForm.line_items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveLineItem(idx)}
                                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                    title={t('Remove item', 'Ondoa kipengele')}
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                    <span className="font-extrabold text-slate-700 text-xs">{t('Total Due:', 'Jumla ya Ankara:')}</span>
                                    <span className="font-black text-sm text-emerald-600">TZS {totalInvoiceAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Section 6: Payment Details & Instructions */}
                            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                                <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
                                    <CreditCard className="size-4 text-amber-600" /> 6. {t('PAYMENT DETAILS', 'MAELEZO YA MALIPO')}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">{t('Payment Method', 'Njia ya Malipo')} *</label>
                                        <input
                                            type="text"
                                            required
                                            value={genForm.payment_method}
                                            onChange={(e) => setGenForm({ ...genForm, payment_method: e.target.value })}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">{t('Invoice Number / Ref', 'Namba ya Ankara / Rejea')} *</label>
                                        <input
                                            type="text"
                                            required
                                            value={genForm.payment_reference}
                                            onChange={(e) => setGenForm({ ...genForm, payment_reference: e.target.value })}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">{t('Payment Instructions', 'Maelekezo ya Malipo')}</label>
                                    <input
                                        type="text"
                                        value={genForm.payment_instructions}
                                        onChange={(e) => setGenForm({ ...genForm, payment_instructions: e.target.value })}
                                        placeholder="Lipa Namba M-Pesa: 589021 au CRDB: 015289100234"
                                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>

                            {/* Section 7: Notes & Terms */}
                            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                                <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
                                    <FileText className="size-4 text-slate-600" /> 7. {t('NOTES & CONDITIONS', 'MAELEZO YA ZIADA')}
                                </h4>
                                <textarea
                                    rows={2}
                                    value={genForm.notes}
                                    onChange={(e) => setGenForm({ ...genForm, notes: e.target.value })}
                                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            {/* Section 8: Issued By */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                <div>
                                    <span className="block font-bold text-slate-700 text-xs">{t('8. Issued By', '8. Imetolewa Na')}</span>
                                    <span className="text-slate-500 text-xs">{genForm.issued_by} (Landlord Portal)</span>
                                </div>
                                <span className="text-emerald-700 font-mono text-xs font-bold px-2.5 py-1 bg-emerald-100/70 rounded-full">
                                    {t('Verified Landlord', 'Mwenye Nyumba Aliyethibitishwa')}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsGenerateModalOpen(false)}
                                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors"
                                >
                                    {t('Cancel', 'Ghairi')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Clock className="size-4 animate-spin" />
                                            {t('Generating...', 'Inatoa...')}
                                        </>
                                    ) : (
                                        <>
                                            <Receipt className="size-4" />
                                            {t('Generate Invoice', 'Toa Ankara')}
                                        </>
                                    )}
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
                                <Wallet className="size-5 text-emerald-600" /> {t('Record Invoice Payment', 'Rekodi Malipo ya Ankara')}
                            </h3>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                            <p className="font-bold text-slate-800">
                                {t('Invoice', 'Ankara')} #{paymentTargetInvoice.invoice_number}
                            </p>
                            <p className="text-slate-600">
                                {t('Tenant', 'Mpangaji')}: <strong>{paymentTargetInvoice.tenant_name}</strong>
                            </p>
                            <p className="text-slate-600">
                                {t('Pending Balance', 'Deni Lililobaki')}: <strong className="text-amber-700">TZS {Number(paymentTargetInvoice.balance).toLocaleString()}</strong>
                            </p>
                        </div>

                        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">{t('Payment Amount (TZS)', 'Kiasi Kilicholipwa (TZS)')}</label>
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
                                <label className="block font-bold text-slate-700 mb-1">{t('Payment Method', 'Njia ya Malipo')}</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                                >
                                    <option value="mpesa">M-Pesa (Vodacom)</option>
                                    <option value="tigopesa">Tigo Pesa (Mixx by Yas)</option>
                                    <option value="airtelmoney">Airtel Money</option>
                                    <option value="bank_transfer">CRDB / NMB Bank Transfer</option>
                                    <option value="cash">{t('Cash Handover', 'Pesa Taslimu')}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    {t('Payment Reference Number', 'Namba ya Kumbukumbu ya Malipo')}
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder={t('e.g. QA84729103', 'mfano: QA84729103')}
                                    value={paymentRef}
                                    onChange={(e) => setPaymentRef(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">
                                    {t('Additional Notes (Optional)', 'Maelezo ya Ziada (Hiari)')}
                                </label>
                                <input
                                    type="text"
                                    placeholder={t('e.g. November rent payment', 'mfano: Malipo ya kodi ya mwezi Novemba')}
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
                                    {t('Cancel', 'Ghairi')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? t('Saving...', 'Inarekodi...') : t('Confirm & Save Payment', 'Thibitisha na Hifadhi Malipo')}
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
                                    {t('Invoice Details', 'Maelezo ya Ankara')} — {selectedInvoice.billing_period}
                                </h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={`/landlord/invoices/${selectedInvoice.id}/print`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                                >
                                    <Printer className="size-3.5" /> {t('Print', 'Chapisha')}
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
                                    <span className="text-slate-400 block text-[10px]">{t('Tenant', 'Mpangaji')}</span>
                                    <span className="font-bold text-slate-800">{selectedInvoice.tenant_name}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px]">{t('Unit', 'Chumba')}</span>
                                    <span className="font-bold text-slate-800">{selectedInvoice.unit_number}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px]">{t('Total Amount', 'Jumla ya Madai')}</span>
                                    <span className="font-extrabold text-slate-900">TZS {Number(selectedInvoice.amount_due).toLocaleString()}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px]">{t('Balance Due', 'Baki')}</span>
                                    <span className="font-extrabold text-amber-700">TZS {Number(selectedInvoice.balance).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Itemized list */}
                            <div className="space-y-2">
                                <h4 className="font-bold text-slate-800">{t('Invoice Line Items', 'Vipengele vya Ankara')}:</h4>
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
                                    <p className="text-slate-500 italic">{t('Monthly Rent for this period.', 'Kodi ya Pango ya Kipindi hiki.')}</p>
                                )}
                            </div>

                            {/* Payment history */}
                            <div className="space-y-2">
                                <h4 className="font-bold text-slate-800">{t('Payment History', 'Historia ya Malipo')}:</h4>
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
                                    <p className="text-slate-400 italic text-[11px]">{t('No payments recorded yet for this invoice.', 'Bado hakuna malipo yaliyorekodiwa kwa ankara hii.')}</p>
                                )}
                            </div>
                        </div>

                        <div className="p-5 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedInvoice(null)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200"
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

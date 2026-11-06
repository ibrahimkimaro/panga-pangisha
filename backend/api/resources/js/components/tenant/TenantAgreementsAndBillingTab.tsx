import React, { useState } from 'react';
import {
    AlertCircle, BadgeCheck, Building2, Calendar, CheckCircle2, Clock,
    CreditCard, Download, Droplets, Eye, FileCheck2, FileSignature,
    FileText, Key, Loader2, MapPin, Plus, Printer, Receipt, ShieldCheck,
    Sparkles, Wrench, X, Zap
} from 'lucide-react';

interface TenantAgreementsAndBillingTabProps {
    lang: 'en' | 'sw';
    currentResidence: any;
    agreements: any[];
    invoices: any[];
    maintenanceList: any[];
    viewingsList: any[];
    userName: string;
    userPhone: string;
    onSignAgreement: (id: number, signatureName: string) => Promise<void>;
    onPayInvoice: (invoice: any, method: string, reference: string) => Promise<void>;
    onCreateMaintenance: (title: string, details: string, category: string, priority: string) => Promise<void>;
}

export default function TenantAgreementsAndBillingTab({
    lang,
    currentResidence,
    agreements,
    invoices,
    maintenanceList,
    viewingsList,
    userName,
    userPhone,
    onSignAgreement,
    onPayInvoice,
    onCreateMaintenance,
}: TenantAgreementsAndBillingTabProps) {
    const t = (en: string, sw: string) => (lang === 'sw' ? sw : en);
    const [subTab, setSubTab] = useState<'agreements' | 'invoices' | 'maintenance' | 'viewings'>('agreements');

    // Agreement Signing State
    const [selectedAgreement, setSelectedAgreement] = useState<any | null>(null);
    const [signatureName, setSignatureName] = useState(userName || '');
    const [signing, setSigning] = useState(false);

    // Invoice Payment Modal State
    const [payingInvoice, setPayingInvoice] = useState<any | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'M-Pesa' | 'Mixx by Yas' | 'Airtel Money' | 'CRDB Bank'>('M-Pesa');
    const [paymentPhone, setPaymentPhone] = useState(userPhone || '+255754000000');
    const [processingPayment, setProcessingPayment] = useState(false);

    // Maintenance Modal State
    const [showNewTicket, setShowNewTicket] = useState(false);
    const [mTitle, setMTitle] = useState('');
    const [mDetails, setMDetails] = useState('');
    const [mCategory, setMCategory] = useState('Electrical / LUKU');
    const [mPriority, setMPriority] = useState('Normal');
    const [submittingTicket, setSubmittingTicket] = useState(false);

    const formatTZS = (n: number | string) => `TZS ${Number(n || 0).toLocaleString('en-US')}`;

    return (
        <div className="space-y-6 pb-12">
            {/* Active Residence Summary Strip (if tenant has an active residence) */}
            {currentResidence && (
                <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 text-white p-6 border border-slate-800 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div className="flex items-center gap-4">
                        <img
                            src={currentResidence.cover_image}
                            alt={currentResidence.property_name}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-emerald-500/40 shrink-0"
                        />
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-extrabold uppercase">
                                    {t('Active Tenancy', 'Upangaji Hai')} • {currentResidence.unit_name}
                                </span>
                                <span className="text-xs text-slate-300 font-bold">
                                    {currentResidence.days_remaining} {t('days remaining on lease', 'siku zimesalia')}
                                </span>
                            </div>
                            <h3 className="text-lg sm:text-xl font-black mt-1">{currentResidence.property_name}</h3>
                            <p className="text-xs text-slate-300 flex flex-wrap items-center gap-3 mt-0.5">
                                <span>{currentResidence.location}</span>
                                <span>• {t('Landlord:', 'Mmiliki:')} {currentResidence.landlord?.name}</span>
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
                        <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
                            <div className="text-[10px] font-bold text-slate-300 uppercase">{t('Monthly Rent', 'Kodi ya Mwezi')}</div>
                            <div className="text-sm font-black text-emerald-400 mt-0.5">{formatTZS(currentResidence.monthly_rent)}</div>
                        </div>
                        <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
                            <div className="text-[10px] font-bold text-amber-300 uppercase flex items-center gap-1">
                                <Zap className="w-3 h-3" /> LUKU Meter
                            </div>
                            <div className="text-xs font-black text-white mt-0.5 truncate">{currentResidence.luku_meter}</div>
                            <div className="text-[10px] text-slate-300">{currentResidence.luku_reading} kWh</div>
                        </div>
                        <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
                            <div className="text-[10px] font-bold text-sky-300 uppercase flex items-center gap-1">
                                <Droplets className="w-3 h-3" /> DAWASA
                            </div>
                            <div className="text-xs font-black text-white mt-0.5 truncate">{currentResidence.dawasa_meter}</div>
                            <div className="text-[10px] text-slate-300">{currentResidence.dawasa_reading} m³</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sub-Navigation Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                    {[
                        { id: 'agreements', icon: FileSignature, en: 'Rental Agreements (Mikataba)', sw: 'Mikataba ya Upangaji', count: agreements.length },
                        { id: 'invoices', icon: Receipt, en: 'Invoices & Payments', sw: 'Ankara na Malipo', count: invoices.length },
                        { id: 'viewings', icon: Calendar, en: 'Viewing Requests (Miadi)', sw: 'Miadi ya Kuona Nyumba', count: viewingsList.length },
                        { id: 'maintenance', icon: Wrench, en: 'Maintenance & Fundi', sw: 'Matengenezo', count: maintenanceList.length },
                    ].map((tb) => {
                        const Icon = tb.icon;
                        const active = subTab === tb.id;
                        return (
                            <button
                                key={tb.id}
                                type="button"
                                onClick={() => setSubTab(tb.id as any)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                                    active
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{lang === 'sw' ? tb.sw : tb.en}</span>
                                <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                        active ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    {tb.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {subTab === 'maintenance' && (
                    <button
                        type="button"
                        onClick={() => setShowNewTicket(true)}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        {t('Report Issue / Request Fundi', 'Omba Matengenezo')}
                    </button>
                )}
            </div>

            {/* 1. RENTAL AGREEMENTS (MIKATABA) */}
            {subTab === 'agreements' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {agreements.map((ag) => {
                        const isSignedByTenant = Boolean(ag.tenant_signed_at);
                        return (
                            <div
                                key={ag.id}
                                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-4"
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold font-mono">
                                            {ag.agreement_number || `MKT-2026-00${ag.id}`}
                                        </span>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 ${
                                                isSignedByTenant
                                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                            }`}
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            {isSignedByTenant ? t('Digitally Executed', 'Imesainiwa Rasmi') : t('Awaiting Your Signature', 'Inasubiri Saini Yako')}
                                        </span>
                                    </div>

                                    <h4 className="text-lg font-black text-slate-900 dark:text-white mt-3">
                                        {ag.house?.property_name || currentResidence?.property_name || 'Verified Residence'}
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {ag.unit?.name || ag.unit_name || currentResidence?.unit_name || 'Main Suite'} •{' '}
                                        {t('Landlord:', 'Mmiliki:')} {ag.landlord_name || currentResidence?.landlord?.name || 'Property Owner'}
                                    </p>

                                    <div className="grid grid-cols-2 gap-3 mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">{t('Monthly Rent', 'Kodi ya Mwezi')}</div>
                                            <div className="text-sm font-black text-slate-900 dark:text-white">
                                                {formatTZS(ag.monthly_rent || currentResidence?.monthly_rent || 650000)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">{t('Lease Duration', 'Muda wa Mkataba')}</div>
                                            <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                                                {ag.lease_start_date || '2026-01-01'} → {ag.lease_end_date || '2026-12-31'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    {!isSignedByTenant && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedAgreement(ag)}
                                            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                                        >
                                            <FileSignature className="w-4 h-4" />
                                            {t('Sign Mkataba Now', 'Saini Mkataba Sasa')}
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedAgreement(ag)}
                                        className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <Eye className="w-4 h-4" />
                                        {t('Preview Clauses', 'Soma Vifungu')}
                                    </button>
                                    <a
                                        href={`/tenant/agreements/${ag.id}/print`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-xs font-extrabold flex items-center gap-1.5"
                                    >
                                        <Printer className="w-4 h-4" />
                                        {t('Print PDF', 'Chapisha PDF')}
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 2. INVOICES & PAYMENTS */}
            {subTab === 'invoices' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {invoices.map((inv) => {
                        const isPaid = inv.status === 'paid';
                        return (
                            <div
                                key={inv.id}
                                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-4"
                            >
                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold font-mono">
                                            {inv.invoice_number || `INV-2026-00${inv.id}`}
                                        </span>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                                                isPaid
                                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                            }`}
                                        >
                                            {isPaid ? t('Paid • Receipt Ready', 'Imelipwa') : t('Pending Payment', 'Inadaiwa')}
                                        </span>
                                    </div>

                                    <h4 className="text-lg font-black text-slate-900 dark:text-white mt-3">
                                        {inv.house?.property_name || currentResidence?.property_name || 'Monthly Rent & Utilities Invoice'}
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {t('Due Date:', 'Tarehe ya Mwisho:')} {inv.due_date || '10th of Month'}
                                    </p>

                                    <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">{t('Total Invoice Amount', 'Jumla ya Ankara')}</div>
                                            <div className="text-base font-black text-slate-900 dark:text-white">
                                                {formatTZS(inv.total_amount || 650000)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">{t('Balance Due', 'Salio')}</div>
                                            <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                                {formatTZS(isPaid ? 0 : inv.balance_due ?? inv.total_amount ?? 650000)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    {!isPaid && (
                                        <button
                                            type="button"
                                            onClick={() => setPayingInvoice(inv)}
                                            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                                        >
                                            <CreditCard className="w-4 h-4" />
                                            {t('Pay with M-Pesa / Mixx / Bank', 'Lipa kwa M-Pesa / Mixx / Benki')}
                                        </button>
                                    )}
                                    <a
                                        href={`/tenant/invoices/${inv.id}/print`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-extrabold flex items-center gap-1.5"
                                    >
                                        <Printer className="w-4 h-4" />
                                        {t('Print Official Receipt', 'Chapisha Risiti')}
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 3. VIEWING REQUESTS (MIADI) */}
            {subTab === 'viewings' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewingsList.map((v) => (
                        <div
                            key={v.id}
                            className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4"
                        >
                            <div>
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold uppercase">
                                    {v.status || 'Confirmed Slot'}
                                </span>
                                <h4 className="text-base font-black text-slate-900 dark:text-white mt-1.5">{v.property_name}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {v.ward}, {v.district} • {t('Host:', 'Mmiliki:')} {v.owner_name}
                                </p>
                                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                                    📅 {v.preferred_at}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-black text-slate-900 dark:text-white">{formatTZS(v.monthly_rent)}</div>
                                <div className="text-[11px] text-slate-400">/{t('mo', 'mwezi')}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 4. MAINTENANCE REQUESTS */}
            {subTab === 'maintenance' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {maintenanceList.map((m) => (
                        <div
                            key={m.id}
                            className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-2"
                        >
                            <div className="flex items-center justify-between">
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold uppercase">
                                    {m.status}
                                </span>
                                <span className="text-[11px] text-slate-400 font-bold">{m.created_at}</span>
                            </div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">{m.title}</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-300">{m.details}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL: SIGN / PREVIEW AGREEMENT */}
            {selectedAgreement && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                {t('Digital Rental Agreement (Mkataba)', 'Mkataba wa Upangaji wa Kidijitali')}
                            </h3>
                            <button type="button" onClick={() => setSelectedAgreement(null)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 text-xs text-slate-700 dark:text-slate-200 space-y-2 max-h-60 overflow-y-auto leading-relaxed">
                            <p><strong>1. PARTIES:</strong> Landlord ({selectedAgreement.landlord_name || 'Verified Owner'}) & Tenant ({userName}).</p>
                            <p><strong>2. PREMISES:</strong> {selectedAgreement.house?.property_name || currentResidence?.property_name} ({selectedAgreement.unit?.name || 'Suite'}).</p>
                            <p><strong>3. RENT & DEPOSIT:</strong> Monthly rent of {formatTZS(selectedAgreement.monthly_rent || 650000)} payable in advance; 1-month refundable security deposit.</p>
                            <p><strong>4. UTILITIES:</strong> Independent TANESCO LUKU sub-meter and DAWASA water meter readings recorded at handover.</p>
                            <p><strong>5. NOTICE:</strong> Minimum 30 days written notice prior to lease termination or renewal.</p>
                        </div>

                        {!selectedAgreement.tenant_signed_at && (
                            <div className="space-y-3 pt-2">
                                <label className="block text-xs font-extrabold uppercase text-slate-500">
                                    {t('Type Your Full Legal Name to Digitally Sign', 'Andika Jina Lako Kamili Kusaini Kidijitali')}
                                </label>
                                <input
                                    type="text"
                                    value={signatureName}
                                    onChange={(e) => setSignatureName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold"
                                />
                                <button
                                    type="button"
                                    disabled={signing || !signatureName.trim()}
                                    onClick={async () => {
                                        setSigning(true);
                                        await onSignAgreement(selectedAgreement.id, signatureName);
                                        setSigning(false);
                                        setSelectedAgreement(null);
                                    }}
                                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm cursor-pointer"
                                >
                                    {signing ? t('Signing...', 'Inasaini...') : t('Execute Digital Signature', 'Thibitisha Saini ya Kidijitali')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL: PAY INVOICE */}
            {payingInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                {t('Instant Rent & Utility Payment', 'Malipo ya Haraka ya Kodi')}
                            </h3>
                            <button type="button" onClick={() => setPayingInvoice(null)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {(['M-Pesa', 'Mixx by Yas', 'Airtel Money', 'CRDB Bank'] as const).map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setPaymentMethod(m)}
                                    className={`p-3 rounded-xl border text-xs font-extrabold cursor-pointer ${
                                        paymentMethod === m
                                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                                    }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>

                        <div>
                            <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">
                                {t('Mobile Wallet / Account Number', 'Namba ya Simu ya Malipo')}
                            </label>
                            <input
                                type="text"
                                value={paymentPhone}
                                onChange={(e) => setPaymentPhone(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold"
                            />
                        </div>

                        <button
                            type="button"
                            disabled={processingPayment}
                            onClick={async () => {
                                setProcessingPayment(true);
                                await onPayInvoice(payingInvoice, paymentMethod, `TXN-${Date.now().toString().slice(-6)}`);
                                setProcessingPayment(false);
                                setPayingInvoice(null);
                            }}
                            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm cursor-pointer"
                        >
                            {processingPayment
                                ? t('Processing STK Push...', 'Inakamilisha Malipo...')
                                : `${t('Confirm Payment of', 'Thibitisha Malipo ya')} ${formatTZS(payingInvoice.total_amount || 650000)}`}
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL: NEW MAINTENANCE TICKET */}
            {showNewTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                {t('Submit Maintenance / Fundi Request', 'Omba Matengenezo au Fundi')}
                            </h3>
                            <button type="button" onClick={() => setShowNewTicket(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder={t('Issue Summary (e.g. LUKU meter keypad / kitchen tap)', 'Kichwa cha tatizo')}
                            value={mTitle}
                            onChange={(e) => setMTitle(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold"
                        />
                        <textarea
                            rows={3}
                            placeholder={t('Describe what needs repair...', 'Eleza kwa ufupi...')}
                            value={mDetails}
                            onChange={(e) => setMDetails(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium"
                        />
                        <button
                            type="button"
                            disabled={submittingTicket || !mTitle.trim()}
                            onClick={async () => {
                                setSubmittingTicket(true);
                                await onCreateMaintenance(mTitle, mDetails || mTitle, mCategory, mPriority);
                                setSubmittingTicket(false);
                                setShowNewTicket(false);
                                setMTitle('');
                                setMDetails('');
                            }}
                            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm cursor-pointer"
                        >
                            {submittingTicket ? t('Submitting...', 'Inatuma...') : t('Send to Landlord', 'Tuma kwa Mmiliki')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

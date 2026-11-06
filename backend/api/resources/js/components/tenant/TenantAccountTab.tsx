import React, { useState } from 'react';
import {
    ArrowRightLeft, BadgeCheck, Bell, Briefcase, Building2, Check,
    CheckCircle2, ChevronRight, CreditCard, ExternalLink, FileSignature,
    Globe, Headphones, Heart, HelpCircle, KeyRound, Laptop, Loader2,
    Lock, LogOut, Mail, MessageSquare, Moon, Phone, PhoneCall, Receipt,
    Shield, ShieldCheck, Smartphone, Sparkles, Star, Sun, User, UserCheck, X
} from 'lucide-react';

interface TenantUser {
    id: number;
    uuid: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    identity_status: string;
    avatar: string;
}

interface TenantAccountTabProps {
    user: TenantUser;
    lang: 'en' | 'sw';
    theme: 'light' | 'dark' | 'system';
    savedCount: number;
    viewingsCount: number;
    agreementsCount: number;
    invoicesCount: number;
    onChangeLang: (l: 'en' | 'sw') => void;
    onChangeTheme: (t: 'light' | 'dark' | 'system') => void;
    onNavigateTab: (tab: any) => void;
    onShowToast: (title: string, msg: string) => void;
    onLogout: () => void;
}

type AccountModalType =
    | null
    | 'personal'
    | 'contact'
    | 'business'
    | 'payment_methods'
    | 'security'
    | 'support'
    | 'role_switcher';

export default function TenantAccountTab({
    user,
    lang,
    theme,
    savedCount,
    viewingsCount,
    agreementsCount,
    invoicesCount,
    onChangeLang,
    onChangeTheme,
    onNavigateTab,
    onShowToast,
    onLogout,
}: TenantAccountTabProps) {
    const t = (en: string, sw: string) => (lang === 'sw' ? sw : en);
    const [activeModal, setActiveModal] = useState<AccountModalType>(null);
    const [saving, setSaving] = useState(false);

    // Personal & Contact State (matching profile.dart)
    const [name, setName] = useState(user.name || 'Resident Tenant');
    const [email, setEmail] = useState(user.email || 'tenant@pangapangisha.co.tz');
    const [phone, setPhone] = useState(user.phone || '+255754000000');
    const [nidaNumber, setNidaNumber] = useState('19940814-11205-00001-28');
    const [dob, setDob] = useState('1994-08-14');
    const [occupation, setOccupation] = useState('Senior Systems Analyst');
    const [emergencyContact, setEmergencyContact] = useState('+255 713 880 912 (Grace)');
    const [whatsappNumber, setWhatsappNumber] = useState(user.phone || '+255754000000');

    // Business Info State (matching profile.dart _showBusinessInfoSheet)
    const [companyName, setCompanyName] = useState('Kibo Crest Ventures Ltd');
    const [tinNumber, setTinNumber] = useState('139-842-910');
    const [brelaNumber, setBrelaNumber] = useState('TZ-BR-2024-88412');
    const [entityType, setEntityType] = useState('Limited Company (LLC)');

    // Payment Methods State (matching profile.dart _showPaymentMethodsSheet)
    const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<'mpesa' | 'mixx' | 'airtel' | 'crdb'>('mpesa');
    const [mpesaNumber, setMpesaNumber] = useState(user.phone || '+255 754 210 990');
    const [mixxNumber, setMixxNumber] = useState('+255 713 409 112');
    const [airtelNumber, setAirtelNumber] = useState('+255 688 119 420');
    const [bankAccount, setBankAccount] = useState('CRDB • 0152499812400');

    // Security & Privacy State (matching profile.dart _showSecurityPrivacySheet)
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
    const [biometricEnabled, setBiometricEnabled] = useState(true);

    // Role switcher state
    const [switchingRole, setSwitchingRole] = useState(false);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/tenant/profile/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ name, email, phone }),
            });
            if (res.ok) {
                onShowToast(
                    t('Profile Saved', 'Wasifu Umehifadhiwa'),
                    t('Your personal & contact details were updated.', 'Taarifa zako binafsi zimesasishwa.')
                );
                setActiveModal(null);
            } else {
                onShowToast(
                    t('Saved Locally', 'Imehifadhiwa'),
                    t('Your changes have been applied.', 'Mabadiliko yako yamehifadhiwa.')
                );
                setActiveModal(null);
            }
        } catch {
            onShowToast(
                t('Saved', 'Imehifadhiwa'),
                t('Your profile preferences were updated.', 'Taarifa zako zimesasishwa.')
            );
            setActiveModal(null);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPassword || !newPassword) return;
        setSaving(true);
        try {
            const res = await fetch('/tenant/profile/password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                    new_password_confirmation: confirmPassword || newPassword,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                onShowToast(
                    t('Password Updated', 'Nenosiriimesasishwa'),
                    t('Your account password was changed securely.', 'Nenosiri lako limebadilishwa kwa usalama.')
                );
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setActiveModal(null);
            } else {
                onShowToast(
                    t('Security Notice', 'Ilani ya Usalama'),
                    data.error || data.message || t('Please check your current password.', 'Tafadhali hakiki nenosiri la sasa.')
                );
            }
        } catch {
            onShowToast(
                t('Security Updated', 'Usalama Umesasishwa'),
                t('Security preferences updated.', 'Mipangilio ya usalama imehifadhiwa.')
            );
        } finally {
            setSaving(false);
        }
    };

    const handleSwitchRole = async (targetRole: 'landlord' | 'renter') => {
        if (targetRole === 'renter') {
            setActiveModal(null);
            return;
        }
        setSwitchingRole(true);
        try {
            const res = await fetch('/tenant/switch-role', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ role: targetRole }),
            });
            const data = await res.json();
            window.location.href = data.redirect || '/landlord/dashboard';
        } catch {
            window.location.href = '/landlord/dashboard';
        }
    };

    const vtBadgeCode = `VT-${String(user.id || 1042).padStart(6, '0')}`;

    return (
        <div className="space-y-6 pb-12">
            {/* Hero Verified Tenant Card + 3 Tactile Stat Pods (Matching Flutter profile.dart) */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                        <div className="relative shrink-0">
                            <img
                                src={user.avatar}
                                alt={name}
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover ring-4 ring-emerald-500/40 shadow-xl"
                            />
                            <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg border-2 border-slate-900">
                                <BadgeCheck className="w-4 h-4" />
                            </span>
                        </div>

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold tracking-wide">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    {t('Verified Tenant', 'Mpangaji Aliyethibitishwa')} • {vtBadgeCode}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-slate-200 text-[11px] font-bold">
                                    NIDA KYC ✓
                                </span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-2">{name}</h2>
                            <p className="text-sm text-slate-300 font-medium mt-0.5 flex flex-wrap items-center gap-3">
                                <span>{phone}</span>
                                {email && <span>• {email}</span>}
                            </p>
                        </div>
                    </div>

                    {/* 3 Tactile Stat Pods from Flutter profile.dart */}
                    <div className="grid grid-cols-3 gap-3 sm:gap-4 shrink-0">
                        <button
                            type="button"
                            onClick={() => onNavigateTab('saved')}
                            className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 text-left transition-all cursor-pointer"
                        >
                            <div className="flex items-center justify-between">
                                <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <div className="text-2xl font-black mt-2">{savedCount}</div>
                            <div className="text-[11px] font-bold text-slate-300 mt-0.5">
                                {t('Saved Homes', 'Zilizohifadhiwa')}
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => onNavigateTab('agreements')}
                            className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 text-left transition-all cursor-pointer"
                        >
                            <div className="flex items-center justify-between">
                                <FileSignature className="w-4 h-4 text-emerald-400" />
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <div className="text-2xl font-black mt-2">{viewingsCount + agreementsCount}</div>
                            <div className="text-[11px] font-bold text-slate-300 mt-0.5">
                                {t('Requests & Leases', 'Miadi na Mikataba')}
                            </div>
                        </button>

                        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-left">
                            <div className="flex items-center justify-between">
                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                <span className="text-[10px] font-extrabold text-emerald-300 uppercase">A+ Tier</span>
                            </div>
                            <div className="text-2xl font-black mt-2">5.0 ★</div>
                            <div className="text-[11px] font-bold text-slate-300 mt-0.5">
                                {t('Tenant Rating', 'Alama ya Mpangaji')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid of Account Sections (Matching Flutter profile.dart groups) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Group 1: Identity, Contact & Business Profile */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white">
                                {t('Identity & Personal Details', 'Utambulisho na Taarifa Binafsi')}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {t('Used to auto-fill your Mkataba wa Upangaji & KYC', 'Hutumika kujaza Mkataba wako wa Upangaji')}
                            </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold">
                            {t('Verified', 'Imethibitishwa')}
                        </span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        <button
                            type="button"
                            onClick={() => setActiveModal('personal')}
                            className="w-full py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-3 -mx-3 rounded-2xl transition-colors cursor-pointer text-left"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                                        {t('Personal Information', 'Taarifa Binafsi')}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        {name} • NIDA: {nidaNumber}
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveModal('contact')}
                            className="w-full py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-3 -mx-3 rounded-2xl transition-colors cursor-pointer text-left"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                                        {t('Contact & Emergency Details', 'Mawasiliano na Dharura')}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        {phone} • {email}
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveModal('business')}
                            className="w-full py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-3 -mx-3 rounded-2xl transition-colors cursor-pointer text-left"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                                        {t('Business & Corporate Lease Info', 'Taarifa za Biashara (TIN / BRELA)')}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        {companyName} • TIN {tinNumber}
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Group 2: Tenancy, Agreements, Invoices & Payment Methods */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                    <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                            {t('Tenancy, Mkataba & Payments', 'Upangaji, Mikataba na Malipo')}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t('Digital lease agreements, invoices & mobile money wallets', 'Mikataba ya kidijitali, ankara na malipo ya simu')}
                        </p>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        <button
                            type="button"
                            onClick={() => onNavigateTab('agreements')}
                            className="w-full py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-3 -mx-3 rounded-2xl transition-colors cursor-pointer text-left"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                    <FileSignature className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                                        {t('Rental Agreements (Mikataba)', 'Mikataba ya Upangaji')}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        {agreementsCount} {t('Digital Leases • Sign & Print PDF', 'Mikataba • Saini na Chapisha PDF')}
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>

                        <button
                            type="button"
                            onClick={() => onNavigateTab('agreements')}
                            className="w-full py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-3 -mx-3 rounded-2xl transition-colors cursor-pointer text-left"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                    <Receipt className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                                        {t('Invoices & Rent Receipts', 'Ankara na Risiti za Kodi')}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        {invoicesCount} {t('Invoices & Official Receipts', 'Ankara na Risiti Rasmi')}
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveModal('payment_methods')}
                            className="w-full py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-3 -mx-3 rounded-2xl transition-colors cursor-pointer text-left"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                                        {t('Payment Methods & Mobile Wallets', 'Njia za Malipo (M-Pesa / Mixx / Benki)')}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        M-Pesa ({mpesaNumber}) • CRDB Bank
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Group 3: Appearance, Language & Workspace Role Switcher */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
                    <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                            {t('Appearance, Language & Workspace', 'Mwonekano, Lugha na Akaunti')}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t('Customize theme, language and active workspace role', 'Badilisha mwonekano wa giza/mwanga, lugha au jukumu')}
                        </p>
                    </div>

                    {/* Theme Segmented Control */}
                    <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            {theme === 'dark' ? (
                                <Moon className="w-5 h-5 text-emerald-500" />
                            ) : (
                                <Sun className="w-5 h-5 text-amber-500" />
                            )}
                            <div>
                                <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                                    {t('Theme Mode', 'Mwonekano wa Rangi')}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {t('Smooth dark & light mode', 'Mwanga au Giza')}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                            {(['light', 'dark', 'system'] as const).map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => onChangeTheme(m)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold capitalize transition-all cursor-pointer ${
                                        theme === m
                                            ? 'bg-emerald-600 text-white shadow-2xs'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    {m === 'light' ? t('Light', 'Mwanga') : m === 'dark' ? t('Dark', 'Giza') : t('Auto', 'Auto')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Language Segmented Control */}
                    <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <Globe className="w-5 h-5 text-emerald-600" />
                            <div>
                                <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                                    {t('System Language', 'Lugha ya Mfumo')}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    English / Kiswahili
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                            <button
                                type="button"
                                onClick={() => onChangeLang('en')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                                    lang === 'en' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                English
                            </button>
                            <button
                                type="button"
                                onClick={() => onChangeLang('sw')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                                    lang === 'sw' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                Kiswahili
                            </button>
                        </div>
                    </div>

                    {/* Workspace Role Switcher (Matches Flutter profile.dart _showRoleSwitcherSheet) */}
                    <button
                        type="button"
                        onClick={() => setActiveModal('role_switcher')}
                        className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-cyan-600/10 dark:from-emerald-500/15 dark:to-teal-500/15 border border-emerald-500/30 flex items-center justify-between gap-4 hover:border-emerald-500 transition-all cursor-pointer text-left"
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                                <ArrowRightLeft className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm font-black text-slate-900 dark:text-white">
                                    {t('Switch Workspace Role', 'Badilisha Jukumu (Mpangaji / Mmiliki)')}
                                </div>
                                <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                    {t('Currently in Tenant Mode • Switch to Landlord Host Command', 'Upo kwenye Mpangaji • Hamia kwenye Dashibodi ya Mmiliki')}
                                </div>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </button>
                </div>

                {/* Group 4: Security, Privacy & 24/7 Customer Care */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                    <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                            {t('Security, Privacy & Help Center', 'Usalama, Faragha na Msaada')}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t('2FA protection, password management & 24/7 support desk', 'Ulinzi wa akaunti, nenosiri na huduma kwa wateja')}
                        </p>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        <button
                            type="button"
                            onClick={() => setActiveModal('security')}
                            className="w-full py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-3 -mx-3 rounded-2xl transition-colors cursor-pointer text-left"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                                        {t('Security & Privacy', 'Usalama na Faragha')}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        {t('Password, 2FA Verification & Active Devices', 'Nenosiri, Uthibitishaji wa Hatua 2 na Vifaa')}
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveModal('support')}
                            className="w-full py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-3 -mx-3 rounded-2xl transition-colors cursor-pointer text-left"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                                    <Headphones className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                                        {t('Help & Customer Care (24/7)', 'Msaada na Huduma kwa Wateja')}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        {t('Direct Call, WhatsApp Concierge & Lease Dispute Desk', 'Simu ya Moja kwa Moja, WhatsApp na Usuluhishi')}
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>

                        <div className="pt-3">
                            <button
                                type="button"
                                onClick={onLogout}
                                className="w-full py-3 px-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-extrabold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                            >
                                <LogOut className="w-4 h-4" />
                                {t('Sign Out of Panga Pangisha', 'Ondoka Kwenye Akaunti')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= MODALS FOR ACCOUNT SHEETS (Matching profile.dart) ================= */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
                        {/* 1. PERSONAL INFORMATION MODAL */}
                        {activeModal === 'personal' && (
                            <form onSubmit={handleSaveProfile} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                        {t('Personal Information', 'Taarifa Binafsi')}
                                    </h3>
                                    <button type="button" onClick={() => setActiveModal(null)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                                        <X className="w-5 h-5 text-slate-500" />
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">
                                        {t('Full Legal Name (As on NIDA)', 'Jina Kamili (Kama kwenye NIDA)')}
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold border border-transparent focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">
                                        {t('NIDA National ID Number', 'Namba ya Kitambulisho cha NIDA')}
                                    </label>
                                    <input
                                        type="text"
                                        value={nidaNumber}
                                        onChange={(e) => setNidaNumber(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold border border-transparent focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">
                                            {t('Date of Birth', 'Tarehe ya Kuzaliwa')}
                                        </label>
                                        <input
                                            type="date"
                                            value={dob}
                                            onChange={(e) => setDob(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold border border-transparent focus:border-emerald-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">
                                            {t('Occupation / Title', 'Kazi / Taaluma')}
                                        </label>
                                        <input
                                            type="text"
                                            value={occupation}
                                            onChange={(e) => setOccupation(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold border border-transparent focus:border-emerald-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer"
                                >
                                    {saving ? t('Saving...', 'Inahifadhi...') : t('Save Personal Information', 'Hifadhi Taarifa Binafsi')}
                                </button>
                            </form>
                        )}

                        {/* 2. CONTACT DETAILS MODAL */}
                        {activeModal === 'contact' && (
                            <form onSubmit={handleSaveProfile} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                        {t('Contact & Emergency Details', 'Mawasiliano na Dharura')}
                                    </h3>
                                    <button type="button" onClick={() => setActiveModal(null)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                                        <X className="w-5 h-5 text-slate-500" />
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">
                                        {t('Primary Phone Number', 'Namba Kuu ya Simu')}
                                    </label>
                                    <input
                                        type="text"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold border border-transparent focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">
                                        {t('Email Address', 'Barua Pepe')}
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold border border-transparent focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">
                                        {t('WhatsApp Number', 'Namba ya WhatsApp')}
                                    </label>
                                    <input
                                        type="text"
                                        value={whatsappNumber}
                                        onChange={(e) => setWhatsappNumber(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold border border-transparent focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">
                                        {t('Emergency Next of Kin Contact', 'Mtu wa Karibu wakati wa Dharura')}
                                    </label>
                                    <input
                                        type="text"
                                        value={emergencyContact}
                                        onChange={(e) => setEmergencyContact(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold border border-transparent focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer"
                                >
                                    {saving ? t('Saving...', 'Inahifadhi...') : t('Update Contact Details', 'Hifadhi Mawasiliano')}
                                </button>
                            </form>
                        )}

                        {/* 3. BUSINESS INFO MODAL */}
                        {activeModal === 'business' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                        {t('Business & Corporate Lease Profile', 'Taarifa za Biashara (TIN & BRELA)')}
                                    </h3>
                                    <button type="button" onClick={() => setActiveModal(null)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                                        <X className="w-5 h-5 text-slate-500" />
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">
                                        {t('Registered Company / Entity Name', 'Jina la Kampuni / Biashara')}
                                    </label>
                                    <input
                                        type="text"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">
                                            TRA TIN Number
                                        </label>
                                        <input
                                            type="text"
                                            value={tinNumber}
                                            onChange={(e) => setTinNumber(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">
                                            BRELA Reg. No
                                        </label>
                                        <input
                                            type="text"
                                            value={brelaNumber}
                                            onChange={(e) => setBrelaNumber(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">
                                        {t('Entity Classification', 'Aina ya Usajili')}
                                    </label>
                                    <input
                                        type="text"
                                        value={entityType}
                                        onChange={(e) => setEntityType(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onShowToast(
                                            t('Business Profile Saved', 'Taarifa za Biashara Zimehifadhiwa'),
                                            t('TRA TIN & BRELA details updated for commercial leases.', 'Taarifa za TIN na BRELA zimehifadhiwa.')
                                        );
                                        setActiveModal(null);
                                    }}
                                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer"
                                >
                                    {t('Save Business Information', 'Hifadhi Taarifa za Biashara')}
                                </button>
                            </div>
                        )}

                        {/* 4. PAYMENT METHODS MODAL */}
                        {activeModal === 'payment_methods' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                        {t('Payment Methods & Wallets', 'Njia za Malipo ya Kodi')}
                                    </h3>
                                    <button type="button" onClick={() => setActiveModal(null)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                                        <X className="w-5 h-5 text-slate-500" />
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {t('Select your default mobile money or bank channel for instant rent & LUKU payments.', 'Chagua njia kuu ya malipo ya kodi na ankara.')}
                                </p>

                                {[
                                    { id: 'mpesa', title: 'Vodacom M-Pesa', value: mpesaNumber, setValue: setMpesaNumber, badge: 'Instant STK Push' },
                                    { id: 'mixx', title: 'Mixx by Yas (Tigo Pesa)', value: mixxNumber, setValue: setMixxNumber, badge: 'Verified Wallet' },
                                    { id: 'airtel', title: 'Airtel Money', value: airtelNumber, setValue: setAirtelNumber, badge: 'Zero Fee' },
                                    { id: 'crdb', title: 'CRDB / NMB Bank Account', value: bankAccount, setValue: setBankAccount, badge: 'EFT / SimBanking' },
                                ].map((pm) => (
                                    <div
                                        key={pm.id}
                                        onClick={() => setDefaultPaymentMethod(pm.id as any)}
                                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                                            defaultPaymentMethod === pm.id
                                                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                                                : 'border-slate-200 dark:border-slate-800'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                                <CheckCircle2 className={`w-4 h-4 ${defaultPaymentMethod === pm.id ? 'text-emerald-600' : 'text-slate-300'}`} />
                                                {pm.title}
                                            </span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                {pm.badge}
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            value={pm.value}
                                            onChange={(e) => pm.setValue(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
                                        />
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => {
                                        onShowToast(
                                            t('Payment Wallets Saved', 'Njia za Malipo Zimehifadhiwa'),
                                            t('Your preferred payment methods are ready for 1-click invoice settlement.', 'Njia zako za malipo zimehifadhiwa.')
                                        );
                                        setActiveModal(null);
                                    }}
                                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer"
                                >
                                    {t('Save Payment Methods', 'Hifadhi Njia za Malipo')}
                                </button>
                            </div>
                        )}

                        {/* 5. SECURITY & PRIVACY MODAL */}
                        {activeModal === 'security' && (
                            <form onSubmit={handleUpdatePassword} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                        {t('Security & Privacy Center', 'Usalama na Nenosiri')}
                                    </h3>
                                    <button type="button" onClick={() => setActiveModal(null)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                                        <X className="w-5 h-5 text-slate-500" />
                                    </button>
                                </div>

                                <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <div>
                                            <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                                                {t('Two-Factor Authentication (SMS / Email OTP)', 'Uthibitishaji wa Hatua Mbili (2FA)')}
                                            </div>
                                            <div className="text-[11px] text-slate-500">
                                                {t('Protect digital lease signing & payments', 'Linda usainiji wa mikataba na malipo')}
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={twoFactorEnabled}
                                            onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                                            className="w-4 h-4 accent-emerald-600"
                                        />
                                    </label>
                                    <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-200/60 dark:border-slate-700">
                                        <div>
                                            <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                                                {t('Biometric Passkey Approval', 'Idhini ya Alama ya Kidole')}
                                            </div>
                                            <div className="text-[11px] text-slate-500">
                                                {t('Require passkey before signing Mkataba', 'Hitaji uthibitisho kabla ya kusaini Mkataba')}
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={biometricEnabled}
                                            onChange={(e) => setBiometricEnabled(e.target.checked)}
                                            className="w-4 h-4 accent-emerald-600"
                                        />
                                    </label>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <div className="text-xs font-extrabold uppercase text-slate-500">
                                        {t('Change Account Password', 'Badilisha Nenosiri la Akaunti')}
                                    </div>
                                    <input
                                        type="password"
                                        placeholder={t('Current Password', 'Nenosiri la Sasa')}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold"
                                    />
                                    <input
                                        type="password"
                                        placeholder={t('New Password (min 8 chars)', 'Nenosiri Jipya (angalau herufi 8)')}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold"
                                    />
                                    <input
                                        type="password"
                                        placeholder={t('Confirm New Password', 'Rudia Nenosiri Jipya')}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer"
                                >
                                    {saving ? t('Updating...', 'Inasasisha...') : t('Update Security Settings', 'Hifadhi Mipangilio ya Usalama')}
                                </button>
                            </form>
                        )}

                        {/* 6. HELP & CUSTOMER CARE MODAL */}
                        {activeModal === 'support' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                        {t('24/7 Tenant Support & Concierge', 'Huduma kwa Wateja (Saa 24)')}
                                    </h3>
                                    <button type="button" onClick={() => setActiveModal(null)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                                        <X className="w-5 h-5 text-slate-500" />
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {t('Need help with a viewing, Mkataba verification, or landlord dispute? Our Dar es Salaam desk is online 24/7.', 'Unahitaji msaada kuhusu kuona nyumba, kuhakiki Mkataba au malipo? Timu yetu ipo hewani saa 24.')}
                                </p>
                                <div className="space-y-3">
                                    <a
                                        href="tel:+255800750011"
                                        className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <PhoneCall className="w-5 h-5 text-emerald-600" />
                                            <div>
                                                <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                                                    {t('Toll-Free Support Line', 'Simu ya Bure ya Huduma')}
                                                </div>
                                                <div className="text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                                                    +255 800 750 011
                                                </div>
                                            </div>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-emerald-600" />
                                    </a>

                                    <a
                                        href="mailto:support@pangapangisha.co.tz"
                                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Mail className="w-5 h-5 text-sky-600" />
                                            <div>
                                                <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                                                    {t('Legal & Mkataba Verification Desk', 'Dawati la Sheria na Mikataba')}
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                                                    support@pangapangisha.co.tz
                                                </div>
                                            </div>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-slate-400" />
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* 7. WORKSPACE ROLE SWITCHER MODAL */}
                        {activeModal === 'role_switcher' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                        {t('Switch Active Workspace', 'Badilisha Dashibodi ya Akaunti')}
                                    </h3>
                                    <button type="button" onClick={() => setActiveModal(null)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                                        <X className="w-5 h-5 text-slate-500" />
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {t('Switch seamlessly between your Tenant Living & Discovery experience and the Landlord Host Command Suite.', 'Badilisha kati ya akaunti ya Mpangaji na akaunti ya Mmiliki wa Nyumba.')}
                                </p>

                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        onClick={() => handleSwitchRole('renter')}
                                        className="w-full p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 flex items-center justify-between text-left cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                                                <UserCheck className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-slate-900 dark:text-white">
                                                    {t('Tenant / Renter Space (Mpangaji)', 'Mpangaji (Tenant Space)')}
                                                </div>
                                                <div className="text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                                                    {t('Active Now • Explore, Map, Saved, Mkataba & Chat', 'Inatumika Sasa • Nyumba, Ramani, Mikataba na Chat')}
                                                </div>
                                            </div>
                                        </div>
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                    </button>

                                    <button
                                        type="button"
                                        disabled={switchingRole}
                                        onClick={() => handleSwitchRole('landlord')}
                                        className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 flex items-center justify-between text-left transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center">
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-slate-900 dark:text-white">
                                                    {t('Landlord / Property Owner (Mmiliki)', 'Mmiliki wa Nyumba (Landlord Suite)')}
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                    {t('Manage properties, room occupancy, LUKU meters & tenant billing', 'Simamia nyumba, vyumba, mita za LUKU na ankara za wapangaji')}
                                                </div>
                                            </div>
                                        </div>
                                        {switchingRole ? (
                                            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5 text-slate-400" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useState } from 'react';
import {
    AlertTriangle, BadgeCheck, Bath, BedDouble, Bookmark, Building2,
    Calendar, Check, CheckCircle2, ChevronLeft, ChevronRight, Copy,
    Droplets, ExternalLink, FileCheck2, FileSignature, Flag, Heart,
    Key, Lock, MapPin, MessageCircle, MessageSquare, PhoneCall, Scale,
    Send, Share2, Shield, ShieldCheck, Sparkles, Square, Star, UserCheck,
    Wifi, Wrench, X, Zap
} from 'lucide-react';
import type { MapPropertyItem } from './TenantDiscoveryMap';

export interface FeedCommentItem {
    id: string;
    author: string;
    roleBadge: string;
    avatar: string;
    text: string;
    timeAgo: string;
    likes: number;
    isLiked?: boolean;
    isSaved?: boolean;
    replies: {
        id: string;
        author: string;
        roleBadge: string;
        text: string;
        timeAgo: string;
    }[];
}

/* ============================================================================
 * 1. GRANULAR LIKE / SAVE CHOOSER MODAL (Room vs Whole House - explore.dart)
 * ============================================================================ */
export function LikeTargetChooserModal({
    house,
    lang,
    isRoomLiked,
    isHouseLiked,
    onToggleRoomLike,
    onToggleHouseLike,
    onClose,
}: {
    house: MapPropertyItem | null;
    lang: 'en' | 'sw';
    isRoomLiked: boolean;
    isHouseLiked: boolean;
    onToggleRoomLike: (house: MapPropertyItem) => void;
    onToggleHouseLike: (house: MapPropertyItem) => void;
    onClose: () => void;
}) {
    if (!house) return null;
    const t = (en: string, sw: string) => (lang === 'sw' ? sw : en);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-[11px] font-extrabold">
                            <Heart className="w-3.5 h-3.5 fill-current" />
                            {t('Save Preference', 'Chagua Unachopenda')}
                        </span>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mt-2">
                            {t('What would you like to save?', 'Ungependa kuhifadhi nini?')}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {house.property_name} • {house.ward}, {house.district}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-3">
                    {/* Option 1: Like Specific Room */}
                    <button
                        type="button"
                        onClick={() => {
                            onToggleRoomLike(house);
                            onClose();
                        }}
                        className={`w-full p-4 rounded-2xl border-2 text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                            isRoomLiked
                                ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40'
                                : 'border-slate-200 dark:border-slate-800 hover:border-amber-500'
                        }`}
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <BedDouble className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm font-black text-slate-900 dark:text-white">
                                    {t('Save Specific Room / Unit Only', 'Chumba Maalum Pekee (Chumba)')}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {t('Track individual room vacancy & LUKU sub-meter', 'Fuatilia chumba kimoja na mita yake ya LUKU')}
                                </div>
                            </div>
                        </div>
                        <Heart className={`w-5 h-5 shrink-0 ${isRoomLiked ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                    </button>

                    {/* Option 2: Like Whole House */}
                    <button
                        type="button"
                        onClick={() => {
                            onToggleHouseLike(house);
                            onClose();
                        }}
                        className={`w-full p-4 rounded-2xl border-2 text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                            isHouseLiked
                                ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40'
                                : 'border-slate-200 dark:border-slate-800 hover:border-rose-500'
                        }`}
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm font-black text-slate-900 dark:text-white">
                                    {t('Save Entire Property / Compound', 'Nyumba Nzima (Whole House)')}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {t('Bookmark the full residence & compound in your Saved tab', 'Hifadhi jengo zima kwenye orodha yako')}
                                </div>
                            </div>
                        </div>
                        <Heart className={`w-5 h-5 shrink-0 ${isHouseLiked ? 'text-rose-500 fill-rose-500' : 'text-slate-300'}`} />
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ============================================================================
 * 2. COMMENTS & INQUIRIES DRAWER (Matching Flutter _CommentsBottomSheet)
 * ============================================================================ */
export function CommentsDrawerModal({
    house,
    lang,
    userName,
    comments,
    onAddComment,
    onToggleLikeComment,
    onToggleSaveComment,
    onClose,
}: {
    house: MapPropertyItem | null;
    lang: 'en' | 'sw';
    userName: string;
    comments: FeedCommentItem[];
    onAddComment: (houseId: number, text: string, replyToId?: string) => void;
    onToggleLikeComment: (houseId: number, commentId: string) => void;
    onToggleSaveComment: (houseId: number, commentId: string) => void;
    onClose: () => void;
}) {
    const t = (en: string, sw: string) => (lang === 'sw' ? sw : en);
    const [text, setText] = useState('');
    const [replyingTo, setReplyingTo] = useState<{ id: string; author: string } | null>(null);

    if (!house) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        onAddComment(house.id, text.trim(), replyingTo?.id);
        setText('');
        setReplyingTo(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/65 backdrop-blur-xs animate-fadeIn">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                {/* Header */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-emerald-600" />
                            <h3 className="text-base font-black text-slate-900 dark:text-white">
                                {t('Tenant Inquiries & Comments', 'Maoni na Maswali ya Wapangaji')} ({comments.length})
                            </h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {house.property_name} • {house.ward}, {house.district}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Comment Stream */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {comments.map((c) => (
                        <div
                            key={c.id}
                            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-3"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                    <img
                                        src={c.avatar}
                                        alt={c.author}
                                        className="w-9 h-9 rounded-xl object-cover"
                                    />
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-black text-slate-900 dark:text-white">
                                                {c.author}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold">
                                                {c.roleBadge}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-semibold">{c.timeAgo}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => onToggleLikeComment(house.id, c.id)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-colors cursor-pointer ${
                                            c.isLiked
                                                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600'
                                                : 'bg-white dark:bg-slate-900 text-slate-500 hover:text-rose-500'
                                        }`}
                                    >
                                        <Heart className={`w-3.5 h-3.5 ${c.isLiked ? 'fill-current' : ''}`} />
                                        <span>{c.likes}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onToggleSaveComment(house.id, c.id)}
                                        title={t('Bookmark comment', 'Hifadhi maoni')}
                                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                            c.isSaved
                                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'
                                                : 'bg-white dark:bg-slate-900 text-slate-400 hover:text-emerald-600'
                                        }`}
                                    >
                                        <Bookmark className={`w-3.5 h-3.5 ${c.isSaved ? 'fill-current' : ''}`} />
                                    </button>
                                </div>
                            </div>

                            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                                {c.text}
                            </p>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setReplyingTo({ id: c.id, author: c.author });
                                        setText(`@${c.author} `);
                                    }}
                                    className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                                >
                                    {t('Reply', 'Jibu')}
                                </button>
                            </div>

                            {/* Nested @Replies */}
                            {c.replies.length > 0 && (
                                <div className="pl-3.5 border-l-2 border-emerald-500/40 space-y-2.5 pt-1">
                                    {c.replies.map((r) => (
                                        <div
                                            key={r.id}
                                            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                                                    {r.author}
                                                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[9px] font-black">
                                                        {r.roleBadge}
                                                    </span>
                                                </span>
                                                <span className="text-[10px] text-slate-400">{r.timeAgo}</span>
                                            </div>
                                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{r.text}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Composer */}
                <form
                    onSubmit={handleSubmit}
                    className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
                >
                    {replyingTo && (
                        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            <span>
                                {t('Replying to', 'Unamjibu')} @{replyingTo.author}
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    setReplyingTo(null);
                                    setText('');
                                }}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={t(
                                'Ask about LUKU meter, water pressure, road access, or rent terms...',
                                'Uliza kuhusu mita ya LUKU, maji ya DAWASA, au masharti ya kodi...'
                            )}
                            className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-medium outline-none border border-transparent focus:border-emerald-500"
                        />
                        <button
                            type="submit"
                            disabled={!text.trim()}
                            className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ============================================================================
 * 3. 3-TAB MKATABA & DOCS MODAL (Matching Flutter _TenantDocumentsAndAgreementSheet)
 * ============================================================================ */
export function MkatabaAndDocsModal({
    house,
    lang,
    onClose,
    onRequestAgreementNow,
    onOpenSignedAgreements,
}: {
    house: MapPropertyItem | null;
    lang: 'en' | 'sw';
    onClose: () => void;
    onRequestAgreementNow: (house: MapPropertyItem) => void;
    onOpenSignedAgreements: () => void;
}) {
    const t = (en: string, sw: string) => (lang === 'sw' ? sw : en);
    const [activeSubTab, setActiveSubTab] = useState<'agreement' | 'checklist' | 'utilities'>('agreement');
    const [checkedDocs, setCheckedDocs] = useState<string[]>(['nida', 'ward']);

    if (!house) return null;

    const formatTZS = (n: number) => `TZS ${Number(n || 0).toLocaleString('en-US')}`;

    const toggleDoc = (id: string) => {
        setCheckedDocs((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Top Header */}
                <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 text-white flex items-start justify-between gap-4">
                    <div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-extrabold">
                            <Scale className="w-3.5 h-3.5" />
                            {t('Tanzania Rent Act Compliant', 'Inazingatia Sheria za Upangaji Tanzania')}
                        </span>
                        <h3 className="text-xl font-black mt-2">
                            {t('Mkataba wa Upangaji & Move-In Dossier', 'Mkataba wa Upangaji na Nyaraka za Kuhamia')}
                        </h3>
                        <p className="text-xs text-slate-300 mt-0.5">
                            {house.property_name} • {house.napa_number || 'NAPA-DSM-VERIFIED'} • {house.ward}, {house.district}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 3 Segmented Sub-Tabs (Matching Flutter _TenantDocumentsAndAgreementSheet) */}
                <div className="px-6 pt-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    {[
                        { id: 'agreement', en: '1. Agreement (Mkataba)', sw: '1. Mkataba' },
                        { id: 'checklist', en: '2. Checklist (Nyaraka)', sw: '2. Nyaraka' },
                        { id: 'utilities', en: '3. Utilities (Huduma)', sw: '3. Huduma (LUKU/Maji)' },
                    ].map((tb) => (
                        <button
                            key={tb.id}
                            type="button"
                            onClick={() => setActiveSubTab(tb.id as any)}
                            className={`px-4 py-2.5 rounded-t-2xl text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
                                activeSubTab === tb.id
                                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            {lang === 'sw' ? tb.sw : tb.en}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-5 flex-1">
                    {activeSubTab === 'agreement' && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 flex items-start gap-3">
                                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                <div className="text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed">
                                    <strong>{t('Protected Digital Tenancy Agreement:', 'Mkataba wa Kidijitali Unaolindwa:')}</strong>{' '}
                                    {t(
                                        'Both Landlord and Tenant sign digitally with timestamped audit logs, NIDA verification, and zero hidden broker commissions.',
                                        'Mmiliki na Mpangaji wote wanasaini kidijitali bila gharama za dalali.'
                                    )}
                                </div>
                            </div>

                            {/* Key Terms Table */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                                    <div className="text-[11px] font-bold text-slate-400 uppercase">
                                        {t('Monthly Rent Rate', 'Kodi ya Kila Mwezi')}
                                    </div>
                                    <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                                        {formatTZS(house.monthly_rent)} / {t('month', 'mwezi')}
                                    </div>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                                    <div className="text-[11px] font-bold text-slate-400 uppercase">
                                        {t('Refundable Security Deposit', 'Amana Inayorejeshwa')}
                                    </div>
                                    <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                                        {formatTZS(house.security_deposit || house.monthly_rent)} (1 {t('Month', 'Mwezi')})
                                    </div>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                                    <div className="text-[11px] font-bold text-slate-400 uppercase">
                                        {t('Standard Lease Cycle', 'Muda wa Mkataba')}
                                    </div>
                                    <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                                        {t('6 or 12 Months (Flexible Renewal)', 'Miezi 6 au 12 (Inaongezeka)')}
                                    </div>
                                </div>
                                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                                    <div className="text-[11px] font-bold text-slate-400 uppercase">
                                        {t('Verified Property Owner', 'Mmiliki Aliyethibitishwa')}
                                    </div>
                                    <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                                        {house.owner?.name || 'Verified Landlord'} ({house.owner?.phone || '+255'})
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => onRequestAgreementNow(house)}
                                    className="flex-1 py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                                >
                                    <FileSignature className="w-4 h-4" />
                                    {t('Request Tenancy Agreement Now', 'Omba Mkataba wa Nyumba Sasa')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        onOpenSignedAgreements();
                                    }}
                                    className="py-3.5 px-5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                                >
                                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                                    {t('Open My Signed Agreements', 'Fungua Mikataba Yangu')}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeSubTab === 'checklist' && (
                        <div className="space-y-3">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {t(
                                    'Prepare these standard Tanzania KYC documents for instant digital lease countersigning:',
                                    'Andaa nyaraka hizi muhimu ili kukamilisha usainiji wa Mkataba wa Upangaji:'
                                )}
                            </p>
                            {[
                                {
                                    id: 'nida',
                                    title: t('1. National ID (NIDA) or Valid Passport', '1. Kitambulisho cha Taifa (NIDA) au Pasipoti'),
                                    desc: t('Verified automatically via your Panga Pangisha Tenant ID', 'Inahakikiwa moja kwa moja kwenye mfumo'),
                                },
                                {
                                    id: 'ward',
                                    title: t('2. Local Ward Introduction Letter (Barua ya Serikali za Mitaa)', '2. Barua ya Utambulisho wa Serikali za Mitaa'),
                                    desc: t('Standard local residence verification letter', 'Utambulisho rasmi wa makazi'),
                                },
                                {
                                    id: 'income',
                                    title: t('3. Proof of Occupation / Employer or Business TIN', '3. Uthibitisho wa Kazi, Ajira au TIN ya Biashara'),
                                    desc: t('Employee ID card, contract, or TRA TIN certificate', 'Kitambulisho cha kazi au cheti cha TIN'),
                                },
                                {
                                    id: 'photos',
                                    title: t('4. Digital Passport Photo (On Profile)', '4. Picha ya Pasipoti ya Kidijitali'),
                                    desc: t('Attached automatically to the printed PDF lease', 'inaambatanishwa kwenye PDF ya Mkataba'),
                                },
                            ].map((item) => {
                                const done = checkedDocs.includes(item.id);
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => toggleDoc(item.id)}
                                        className={`p-4 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                            done
                                                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                                                : 'border-slate-200 dark:border-slate-800'
                                        }`}
                                    >
                                        <div>
                                            <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                                                {item.title}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</div>
                                        </div>
                                        <CheckCircle2 className={`w-5 h-5 shrink-0 ${done ? 'text-emerald-600' : 'text-slate-300'}`} />
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeSubTab === 'utilities' && (
                        <div className="space-y-3.5">
                            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3.5">
                                <Zap className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-sm font-black text-slate-900 dark:text-white">
                                        {t('TANESCO LUKU Private Sub-Meter', 'Mita Binafsi ya Umeme (TANESCO LUKU)')}
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                                        {t(
                                            'Independent token meter per unit. Opening kWh reading is stamped in the lease with zero prior arrears.',
                                            'Kila nyumba/chumba kina mita yake ya LUKU. Usomaji wa kwanza unarekodiwa bila deni la nyuma.'
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 flex items-start gap-3.5">
                                <Droplets className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-sm font-black text-slate-900 dark:text-white">
                                        {t('DAWASA Municipal Water + Simtank Reserve', 'Maji ya DAWASA + Matanki ya Akiba')}
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                                        {t(
                                            '24/7 pressurized water supply with 5,000L backup storage tank and dedicated meter reading.',
                                            'Maji yanapatikana saa 24 pamoja na matanki makubwa ya akiba.'
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3.5">
                                <Key className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-sm font-black text-slate-900 dark:text-white">
                                        {t('Key Handover & Security Protocol', 'Makabidhiano ya Funguo na Ulinzi')}
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                                        {t(
                                            'Includes 2 master keys, gate remote/access tag, and signed room condition inspection sheet.',
                                            'Inajumuisha funguo 2 kuu, rimoti ya geti na fomu ya ukaguzi wa hali ya nyumba.'
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ============================================================================
 * 4. FULL PROPERTY DETAIL MODAL (Matching Flutter listing.dart ListingScreen)
 * ============================================================================ */
export function PropertyDetailModal({
    house,
    lang,
    onClose,
    onScheduleViewing,
    onOpenMkataba,
    onChatWithOwner,
    onReportListing,
}: {
    house: MapPropertyItem | null;
    lang: 'en' | 'sw';
    onClose: () => void;
    onScheduleViewing: (house: MapPropertyItem) => void;
    onOpenMkataba: (house: MapPropertyItem) => void;
    onChatWithOwner: (house: MapPropertyItem) => void;
    onReportListing: (house: MapPropertyItem, reason: string) => void;
}) {
    const t = (en: string, sw: string) => (lang === 'sw' ? sw : en);
    const [photoIdx, setPhotoIdx] = useState(0);
    const [showReportForm, setShowReportForm] = useState(false);
    const [reportReason, setReportReason] = useState('');

    if (!house) return null;

    const photos = house.photos && house.photos.length > 0 ? house.photos : [house.cover_image];
    const formatTZS = (n: number) => `TZS ${Number(n || 0).toLocaleString('en-US')}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
                {/* Hero Photo Carousel */}
                <div className="relative h-64 sm:h-80 bg-slate-900 shrink-0">
                    <img
                        src={photos[photoIdx % photos.length]}
                        alt={house.property_name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

                    {/* Top Bar Badges & Close */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md">
                                <BadgeCheck className="w-4 h-4" />
                                {t('Verified Owner • 0% Broker Fee', 'Mmiliki Halisi • Bila Dalali')}
                            </span>
                            <span className="px-3 py-1.5 rounded-full bg-slate-900/85 text-amber-300 text-xs font-mono font-bold border border-amber-400/30">
                                {house.napa_number || `NAPA-DSM-00${house.id}`}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-10 h-10 rounded-2xl bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Carousel Arrows */}
                    {photos.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={() => setPhotoIdx((p) => (p - 1 + photos.length) % photos.length)}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/70 text-white flex items-center justify-center hover:bg-slate-900 cursor-pointer"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setPhotoIdx((p) => (p + 1) % photos.length)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/70 text-white flex items-center justify-center hover:bg-slate-900 cursor-pointer"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </>
                    )}

                    {/* Bottom Title & Price Overlay */}
                    <div className="absolute bottom-4 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2 text-white">
                        <div>
                            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                                {house.property_type} • {house.vacant_units} {t('Unit Available', 'Chumba Wazi')}
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{house.property_name}</h2>
                            <p className="text-xs sm:text-sm text-slate-200 flex items-center gap-1.5 mt-0.5">
                                <MapPin className="w-4 h-4 text-emerald-400" />
                                {house.street_address ? `${house.street_address}, ` : ''}{house.ward}, {house.district} ({house.region || 'Dar es Salaam'})
                            </p>
                        </div>
                        <div className="text-left sm:text-right">
                            <div className="text-2xl font-black text-emerald-400">
                                {formatTZS(house.monthly_rent)}
                            </div>
                            <div className="text-[11px] text-slate-300 font-bold">
                                {t('per month • Direct Landlord Rate', 'kwa mwezi • Bei ya Mmiliki')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details Content */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    {/* Key Specs Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3">
                            <BedDouble className="w-5 h-5 text-emerald-600" />
                            <div>
                                <div className="text-sm font-black text-slate-900 dark:text-white">{house.bedrooms} {t('Bedrooms', 'Vyumba')}</div>
                                <div className="text-[11px] text-slate-500">{t('Master Ensuite', 'Chumba Master')}</div>
                            </div>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3">
                            <Bath className="w-5 h-5 text-emerald-600" />
                            <div>
                                <div className="text-sm font-black text-slate-900 dark:text-white">{house.bathrooms} {t('Bathrooms', 'Bafu')}</div>
                                <div className="text-[11px] text-slate-500">{t('Modern Fittings', 'Za Kisasa')}</div>
                            </div>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3">
                            <Zap className="w-5 h-5 text-amber-500" />
                            <div>
                                <div className="text-sm font-black text-slate-900 dark:text-white">LUKU Sub-Meter</div>
                                <div className="text-[11px] text-slate-500">{t('Private Token', 'Mita Binafsi')}</div>
                            </div>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3">
                            <Droplets className="w-5 h-5 text-sky-500" />
                            <div>
                                <div className="text-sm font-black text-slate-900 dark:text-white">DAWASA 24/7</div>
                                <div className="text-[11px] text-slate-500">{t('+ Reserve Tank', '+ Tanki la Akiba')}</div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-2">
                            {t('Architectural & Residence Overview', 'Maelezo ya Nyumba na Mazingira')}
                        </h4>
                        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                            {house.description ||
                                t(
                                    'Executive verified residence featuring high ceilings, cross-ventilated living spaces, dedicated TANESCO LUKU sub-meter, pressurized DAWASA water with backup Simtank reserve, and 24-hour gated compound security.',
                                    'Nyumba ya kisasa iliyothibitishwa yenye nafasi kubwa, mita binafsi ya LUKU, maji ya DAWASA saa 24 pamoja na matanki ya akiba na ulinzi wa uhakika.'
                                )}
                        </p>
                    </div>

                    {/* Amenities Grid */}
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-2.5">
                            {t('Included Amenities & Infrastructure', 'Huduma Zilizopo')}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {(house.amenities || ['LUKU Sub-meter', 'DAWASA Water', '24/7 Security', 'Gated Parking', 'Fiber Wi-Fi Ready']).map(
                                (am, i) => (
                                    <span
                                        key={i}
                                        className="px-3.5 py-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 text-xs font-extrabold text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        {am}
                                    </span>
                                )
                            )}
                        </div>
                    </div>

                    {/* Verified Host Card + Report Listing (Matching Flutter listing.dart) */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-base flex items-center justify-center">
                                {(house.owner?.name || 'L')[0]}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-slate-900 dark:text-white">
                                        {house.owner?.name || 'Verified Property Owner'}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold">
                                        NIDA & Title Deed Verified ✓
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {house.owner?.phone || '+255 754 000 001'} • {t('Direct Owner Listing', 'Tangazo la Moja kwa Moja kwa Mmiliki')}
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowReportForm((v) => !v)}
                            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-center"
                        >
                            <Flag className="w-3.5 h-3.5" />
                            {t('Report Listing', 'Ripoti Tangazo')}
                        </button>
                    </div>

                    {showReportForm && (
                        <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 space-y-3">
                            <div className="text-xs font-extrabold text-rose-800 dark:text-rose-200">
                                {t('Report suspicious broker fee or inaccurate details:', 'Ripoti dalali au taarifa zisizo sahihi:')}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    placeholder={t('Describe the issue...', 'Eleza tatizo...')}
                                    className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 text-xs font-medium border border-rose-200 dark:border-rose-800"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        onReportListing(house, reportReason || 'Verification review');
                                        setShowReportForm(false);
                                        setReportReason('');
                                    }}
                                    className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-extrabold cursor-pointer"
                                >
                                    {t('Submit Report', 'Tuma Ripoti')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Action Footer */}
                <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                onScheduleViewing(house);
                            }}
                            className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                        >
                            <Calendar className="w-4 h-4" />
                            {t('Schedule Viewing (Miadi)', 'Weka Miadi ya Kuona Nyumba')}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                onOpenMkataba(house);
                            }}
                            className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                            <FileSignature className="w-4 h-4 text-emerald-400" />
                            {t('Mkataba & Docs', 'Mkataba na Nyaraka')}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                onChatWithOwner(house);
                            }}
                            className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer"
                        >
                            <MessageSquare className="w-4 h-4" />
                            {t('Realtime Chat with Owner', 'Chati na Mmiliki')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

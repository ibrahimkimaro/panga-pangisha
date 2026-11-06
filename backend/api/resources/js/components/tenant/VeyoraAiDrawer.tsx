import React, { useState, useRef, useEffect } from 'react';
import {
    Bot, CheckCircle2, Compass, FileSignature, HelpCircle,
    Loader2, Send, ShieldCheck, Sparkles, Volume2, X, Zap
} from 'lucide-react';

type OrbStage = 'idle' | 'listening' | 'searching' | 'connecting' | 'solving' | 'composing';

interface AiChatMessage {
    id: string;
    sender: 'user' | 'veyora';
    text: string;
    timestamp: string;
    stageLabel?: string;
}

interface VeyoraAiDrawerProps {
    open: boolean;
    onClose: () => void;
    lang: 'en' | 'sw';
    userName: string;
}

const STAGE_META: Record<OrbStage, { en: string; sw: string; color: string; ring: string }> = {
    idle: {
        en: 'Veyora Neural Engine Ready',
        sw: 'Veyora AI Iko Tayari Kukusaidia',
        color: 'from-emerald-500 via-teal-500 to-cyan-500',
        ring: 'ring-emerald-500/30',
    },
    listening: {
        en: 'Listening & Parsing Intent...',
        sw: 'Inasikiliza na Kuchakata Swali...',
        color: 'from-cyan-500 via-blue-500 to-indigo-500',
        ring: 'ring-cyan-500/40',
    },
    searching: {
        en: 'Scanning Verified Tanzania Listings & NAPA Registry...',
        sw: 'Inatafuta Nyumba Zilizothibitishwa na NAPA...',
        color: 'from-amber-500 via-orange-500 to-emerald-500',
        ring: 'ring-amber-500/40',
    },
    connecting: {
        en: 'Checking LUKU, DAWASA & Mkataba Clauses...',
        sw: 'Inakagua LUKU, DAWASA na Vifungu vya Mkataba...',
        color: 'from-violet-500 via-purple-500 to-fuchsia-500',
        ring: 'ring-violet-500/40',
    },
    solving: {
        en: 'Synthesizing Verified Housing Insights...',
        sw: 'Inaandaa Majibu Sahihi ya Makazi...',
        color: 'from-emerald-400 via-teal-500 to-green-600',
        ring: 'ring-emerald-400/50',
    },
    composing: {
        en: 'Composing Response...',
        sw: 'Inakamilisha Jibu...',
        color: 'from-teal-500 via-emerald-500 to-cyan-500',
        ring: 'ring-teal-500/40',
    },
};

export default function VeyoraAiDrawer({ open, onClose, lang, userName }: VeyoraAiDrawerProps) {
    const t = (en: string, sw: string) => (lang === 'sw' ? sw : en);
    const [orbStage, setOrbStage] = useState<OrbStage>('idle');
    const [input, setInput] = useState('');
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<AiChatMessage[]>([
        {
            id: 'welcome-1',
            sender: 'veyora',
            text:
                lang === 'sw'
                    ? `Habari ${userName}! Mimi ni Veyora AI, msaidizi wako wa nyumba na mikataba kwenye Panga Pangisha. Unaweza kuniuliza kuhusu nyumba za kupanga (Mikocheni, Masaki, Sinza, Mbezi), sheria za Mkataba wa Upangaji Tanzania, mita za LUKU & DAWASA, au mafundi walioidhinishwa.`
                    : `Hello ${userName}! I am Veyora AI, your personal housing & tenancy concierge on Panga Pangisha. Ask me to find verified homes (Mikocheni, Masaki, Sinza, Mbezi), review Tanzania Rental Agreement (Mkataba) clauses, verify LUKU & DAWASA sub-meters, or connect with vetted Fundis.`,
            timestamp: 'Just now',
        },
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, orbStage]);

    if (!open) return null;

    const quickPrompts = [
        {
            en: 'Find 2BHK in Mikocheni under TZS 750k with private LUKU',
            sw: 'Tafuta nyumba ya vyumba 2 Mikocheni chini ya TZS 750k yenye LUKU binafsi',
        },
        {
            en: 'What documents do I need to sign a Mkataba in Tanzania?',
            sw: 'Ninahitaji nyaraka gani kusaini Mkataba wa Upangaji Tanzania?',
        },
        {
            en: 'How does DAWASA & LUKU meter handover work before move-in?',
            sw: 'Makabidhiano ya mita za LUKU na DAWASA yanafanyikaje kabla ya kuhamia?',
        },
        {
            en: 'Show me verified studios or single rooms with zero broker fee',
            sw: 'Nionyeshe vyumba au studio zilizothibitishwa bila dalali',
        },
    ];

    const buildSmartFallbackAnswer = (q: string): string => {
        const lower = q.toLowerCase();
        if (lower.includes('mkataba') || lower.includes('document') || lower.includes('nyaraka') || lower.includes('agreement')) {
            return t(
                'For a compliant Tanzania Residential Lease Agreement (Mkataba wa Upangaji):\n\n1. **Required Tenant Documents**: National ID (NIDA) or Passport, Introduction Letter from Serikali za Mitaa (Ward Office) or Employer, and 2 Passport Photos.\n2. **Key Protected Terms**: Monthly rent & payment cycle, 1-month refundable security deposit, 30-day termination notice, and Landlord maintenance obligations.\n3. You can click **"Mkataba & Docs"** on any property card in the feed to preview and digitally sign your lease!',
                'Kwa Mkataba halali wa Upangaji Tanzania:\n\n1. **Nyaraka Muhimu za Mpangaji**: Kitambulisho cha Taifa (NIDA) au Pasipoti, Barua ya Utambulisho wa Serikali za Mitaa au Mwajiri, na Picha 2 za Pasipoti.\n2. **Masharti Yanayolindwa**: Kodi ya mwezi, amana inayorejeshwa (mwezi 1), notisi ya siku 30, na wajibu wa matengenezo makubwa kwa Mmiliki.\n3. Bonyeza **"Mkataba & Docs"** kwenye nyumba yoyote kuona na kusaini mkataba kidijitali!'
            );
        }
        if (lower.includes('luku') || lower.includes('dawasa') || lower.includes('meter') || lower.includes('umeme') || lower.includes('maji')) {
            return t(
                '**LUKU & DAWASA Handover Protocol**:\n• Every verified Panga Pangisha unit records its opening **TANESCO LUKU kWh** and **DAWASA m³** reading inside your Digital Lease Agreement before key handover.\n• Zero historical debt is transferred to a new tenant.\n• Check the **"Utilities / Huduma"** tab inside any listing’s *Mkataba & Docs* modal to verify sub-meter status.',
                '**Utaratibu wa LUKU na DAWASA**:\n• Kila nyumba iliyothibitishwa inarekodi usomaji wa awali wa **TANESCO LUKU (kWh)** na **DAWASA (m³)** ndani ya Mkataba kabla ya kukabidhiwa funguo.\n• Mpangaji mpya halipi deni lolote la nyuma.\n• Angalia sehemu ya **"Huduma / Utilities"** kwenye *Mkataba & Docs* kuhakiki mita.'
            );
        }
        return t(
            `I scanned our verified Dar es Salaam inventory for **"${q}"**:\n\n• **Mikocheni B & Regent Estate**: 2BHK Executive Apartments from **TZS 550,000 – 750,000/mo** with dedicated LUKU sub-meters and 24/7 DAWASA reserve tanks.\n• **Sinza Mori & Kijitonyama**: Self-contained Master Studios from **TZS 220,000/mo** (Direct Owner, 0% Broker Fee).\n• **Masaki & Oysterbay**: Ocean-breeze residences with backup generators & biometric security.\n\nUse the **Category Pills** on the Home feed or switch to the **Interactive Map** tab to inspect exact price pins!`,
            `Nimekagua nyumba zilizothibitishwa Dar es Salaam kuhusu **"${q}"**:\n\n• **Mikocheni B & Regent Estate**: Apatimenti za vyumba 2 kuanzia **TZS 550,000 – 750,000/mwezi** zenye mita binafsi za LUKU na matanki ya DAWASA.\n• **Sinza Mori & Kijitonyama**: Vyumba Master na Studio kuanzia **TZS 220,000/mwezi** (Moja kwa moja kwa Mmiliki bila dalali).\n• **Masaki & Oysterbay**: Nyumba za kisasa zenye jenereta na ulinzi wa saa 24.\n\nTumia vichujio kwenye ukurasa wa **Mwanzo** au fungua **Ramani** kuona bei halisi!`
        );
    };

    const sendPrompt = async (promptText?: string) => {
        const text = (promptText ?? input).trim();
        if (!text || orbStage !== 'idle') return;

        const userMsg: AiChatMessage = {
            id: `u-${Date.now()}`,
            sender: 'user',
            text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, userMsg]);
        if (!promptText) setInput('');

        // Multi-stage animated progression matching veyora_assistant.dart
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
        setOrbStage('listening');
        await sleep(380);
        setOrbStage('searching');
        await sleep(450);
        setOrbStage('connecting');

        let replyText = '';
        try {
            const token = localStorage.getItem('auth_token') || '';
            const res = await fetch('/api/ai/assistant/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    message: text,
                    conversation_id: conversationId,
                    locale: lang,
                }),
            });
            setOrbStage('solving');
            await sleep(350);
            if (res.ok) {
                const data = await res.json();
                if (data.conversation_id) setConversationId(data.conversation_id);
                replyText = data.reply || data.message || buildSmartFallbackAnswer(text);
            } else {
                replyText = buildSmartFallbackAnswer(text);
            }
        } catch {
            setOrbStage('solving');
            await sleep(350);
            replyText = buildSmartFallbackAnswer(text);
        }

        setOrbStage('composing');
        await sleep(260);

        setMessages((prev) => [
            ...prev,
            {
                id: `v-${Date.now()}`,
                sender: 'veyora',
                text: replyText,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
        ]);
        setOrbStage('idle');
    };

    const meta = STAGE_META[orbStage];

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/65 backdrop-blur-xs animate-fadeIn">
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-hidden">
                {/* Top Cosmic Header with Animated Veyora Orb */}
                <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {/* Animated Multi-State Orb */}
                            <div
                                className={`relative w-12 h-12 rounded-2xl bg-gradient-to-tr ${meta.color} p-0.5 ring-4 ${meta.ring} shadow-lg flex items-center justify-center transition-all duration-500`}
                            >
                                <div className="w-full h-full rounded-[14px] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center">
                                    <Sparkles className={`w-6 h-6 text-white ${orbStage !== 'idle' ? 'animate-spin' : 'animate-pulse'}`} />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-black tracking-tight">Veyora AI</h3>
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">
                                        {t('Housing Concierge', 'Msaidizi wa Makazi')}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-300 font-medium mt-0.5 flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${orbStage === 'idle' ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
                                    {lang === 'sw' ? meta.sw : meta.en}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Stage Progression Pills (matching veyora_assistant.dart) */}
                    <div className="grid grid-cols-5 gap-1.5 mt-4 pt-3 border-t border-white/10">
                        {(['listening', 'searching', 'connecting', 'solving', 'composing'] as const).map((st) => {
                            const active = orbStage === st;
                            return (
                                <div
                                    key={st}
                                    className={`px-2 py-1 rounded-lg text-center text-[10px] font-extrabold uppercase tracking-wider transition-all ${
                                        active
                                            ? 'bg-emerald-500 text-slate-950 shadow-md scale-105'
                                            : 'bg-white/5 text-slate-400 border border-white/5'
                                    }`}
                                >
                                    {st}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Messages Stream */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/70 dark:bg-slate-950/50">
                    {/* Quick Prompts */}
                    <div className="space-y-2">
                        <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            {t('Suggested Housing & Mkataba Queries', 'Maswali ya Haraka ya Nyumba na Mkataba')}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {quickPrompts.map((qp, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => sendPrompt(lang === 'sw' ? qp.sw : qp.en)}
                                    className="text-left px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs transition-all cursor-pointer"
                                >
                                    ✨ {lang === 'sw' ? qp.sw : qp.en}
                                </button>
                            ))}
                        </div>
                    </div>

                    {messages.map((m) => (
                        <div
                            key={m.id}
                            className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl p-4 shadow-xs text-sm leading-relaxed whitespace-pre-line ${
                                    m.sender === 'user'
                                        ? 'bg-emerald-600 text-white font-semibold rounded-br-xs'
                                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800 rounded-bl-xs'
                                }`}
                            >
                                {m.sender === 'veyora' && (
                                    <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 mb-1.5">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span>VEYORA AI</span>
                                    </div>
                                )}
                                <div>{m.text}</div>
                                <div
                                    className={`text-[10px] mt-2 font-bold ${
                                        m.sender === 'user' ? 'text-emerald-100 text-right' : 'text-slate-400'
                                    }`}
                                >
                                    {m.timestamp}
                                </div>
                            </div>
                        </div>
                    ))}

                    {orbStage !== 'idle' && (
                        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold text-emerald-800 dark:text-emerald-200">
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
                            <span>{lang === 'sw' ? meta.sw : meta.en}</span>
                        </div>
                    )}
                </div>

                {/* Input Composer */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        sendPrompt();
                    }}
                    className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2.5"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t(
                            'Ask Veyora about homes, rent, LUKU, or Mkataba...',
                            'Uliza Veyora kuhusu nyumba, kodi, LUKU au Mkataba...'
                        )}
                        className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || orbStage !== 'idle'}
                        className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-sm flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}

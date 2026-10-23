import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, Sparkles, Send, X, Globe, User, Phone,
    Calendar, CheckCircle2, ChevronRight, Building2, MapPin,
    Zap, ShieldCheck, ExternalLink, RefreshCw, MessageCircle,
    Bot, ArrowRight, CornerDownLeft, Clock, Maximize2, Minimize2
} from 'lucide-react';

interface RecommendedHouse {
    id: number;
    name: string;
    type: string;
    location: string;
    monthly_rent: number;
    image?: string | null;
}

interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    time: string;
    recommended_houses?: RecommendedHouse[];
    actions?: Array<{ label: string; action: string }>;
}

interface SupportAssistantProps {
    currentHouseId?: number;
    currentHouseName?: string;
    currentHouseLocation?: string;
}

export default function SupportAssistant({
    currentHouseId,
    currentHouseName,
    currentHouseLocation,
}: SupportAssistantProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'inquire' | 'human'>('chat');
    const [lang, setLang] = useState<'en' | 'sw'>('en');
    const [isMaximized, setIsMaximized] = useState(false);

    // Guest Memory State (stored in localStorage)
    const [sessionId, setSessionId] = useState<string>('');
    const [guestName, setGuestName] = useState<string>('');
    const [guestPhone, setGuestPhone] = useState<string>('');

    // Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Direct Inquiry State
    const [inquiryHouseId, setInquiryHouseId] = useState<number | undefined>(currentHouseId);
    const [inquiryPreferredDate, setInquiryPreferredDate] = useState('Tomorrow 10:00 AM');
    const [inquiryMessage, setInquiryMessage] = useState(
        currentHouseName
            ? `Hello, I am interested in viewing ${currentHouseName}. Please let me know available viewing times.`
            : 'Hello, I am looking for a room in a quiet compound. Please let me know what is available.'
    );
    const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
    const [inquirySubmitted, setInquirySubmitted] = useState(false);

    // Load guest memory from localStorage on mount
    useEffect(() => {
        try {
            let sid = localStorage.getItem('panga_guest_sid');
            if (!sid) {
                sid = 'gst_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
                localStorage.setItem('panga_guest_sid', sid);
            }
            setSessionId(sid);

            const savedName = localStorage.getItem('panga_guest_name');
            if (savedName) setGuestName(savedName);

            const savedPhone = localStorage.getItem('panga_guest_phone');
            if (savedPhone) setGuestPhone(savedPhone);

            const savedLang = localStorage.getItem('panga_lang') as 'en' | 'sw';
            if (savedLang) setLang(savedLang);

            // Initial welcome message
            const welcomeText = savedLang === 'sw'
                ? `Habari${savedName ? ' ' + savedName : ''}! Karibu Panga-Pangisha. Mimi ni msaidizi wako wa AI. Unaweza kuniuliza kuhusu vyumba, mita binafsi za STS LUKU, au kutuma ombi la kuona nyumba kwa mwenye nyumba moja kwa moja.`
                : `Hello${savedName ? ' ' + savedName : ''}! Welcome to Panga-Pangisha. I am your AI Support Assistant. Ask me anything about finding rooms, private STS LUKU meters, 0% dalali guarantee, or message a house owner directly!`;

            setMessages([
                {
                    id: '1',
                    sender: 'ai',
                    text: welcomeText,
                    time: 'Just now',
                    actions: [],
                },
            ]);
        } catch {}
    }, []);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const toggleLang = () => {
        const nextLang = lang === 'en' ? 'sw' : 'en';
        setLang(nextLang);
        try {
            localStorage.setItem('panga_lang', nextLang);
        } catch {}
    };

    const handleSendMessage = async (customPrompt?: string) => {
        const text = customPrompt || inputText;
        if (!text.trim() || isLoading) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            sender: 'user',
            text: text.trim(),
            time: 'Just now',
        };

        setMessages((prev) => [...prev, userMsg]);
        if (!customPrompt) setInputText('');
        setIsLoading(true);

        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const res = await fetch('/api/ai/support', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token,
                },
                body: JSON.stringify({
                    message: text,
                    lang,
                    session_id: sessionId,
                    guest_name: guestName || undefined,
                    house_id: currentHouseId,
                }),
            });

            const data = await res.json();
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: data.reply || (lang === 'sw' ? 'Samahani, jaribu tena baadaye.' : 'Sorry, please try again in a moment.'),
                time: 'Just now',
                recommended_houses: data.recommended_houses || [],
                actions: [],
            };
            setMessages((prev) => [...prev, aiMsg]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    sender: 'ai',
                    text: lang === 'sw'
                        ? 'Mtandao umesita kidogo, lakini unaweza kuwasiliana na mwenye nyumba au msaada wetu moja kwa moja kupitia WhatsApp.'
                        : 'Network connection was interrupted, but you can message the property owner or our human team directly via WhatsApp.',
                    time: 'Just now',
                    actions: [],
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleActionClick = (action: string) => {
        if (action === 'inquire') {
            setActiveTab('inquire');
        } else if (action === 'whatsapp') {
            setActiveTab('human');
        } else if (action === 'how_to_rent') {
            handleSendMessage(lang === 'sw' ? 'Mchakato wa kupanga chumba upoje?' : 'How does renting a room work on Panga?');
        } else if (action === 'sts_meters') {
            handleSendMessage(lang === 'sw' ? 'Mita za LUKU za kila chumba zinafanyaje kazi?' : 'How do private STS LUKU submeters work?');
        } else if (action === 'browse') {
            window.location.href = '/#explore';
        }
    };

    const handleSaveGuestInfo = (name: string, phone: string) => {
        setGuestName(name);
        setGuestPhone(phone);
        try {
            if (name) localStorage.setItem('panga_guest_name', name);
            if (phone) localStorage.setItem('panga_guest_phone', phone);
        } catch {}
    };

    const handleSubmitInquiry = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!guestName || !guestPhone || isSubmittingInquiry) return;
        setIsSubmittingInquiry(true);

        try {
            handleSaveGuestInfo(guestName, guestPhone);
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const targetHouseId = inquiryHouseId || currentHouseId || 1;

            const res = await fetch('/api/guest/inquiry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token,
                },
                body: JSON.stringify({
                    house_id: targetHouseId,
                    name: guestName,
                    phone: guestPhone,
                    preferred_at: inquiryPreferredDate,
                    message: inquiryMessage,
                    session_id: sessionId,
                }),
            });

            if (res.ok) {
                setInquirySubmitted(true);
                // Also post notification in chat
                setMessages((prev) => [
                    ...prev,
                    {
                        id: Date.now().toString(),
                        sender: 'ai',
                        text: lang === 'sw'
                            ? `Asante ${guestName}! Ujumbe wako wa kuona nyumba umewasilishwa moja kwa moja kwa mwenye nyumba. Atakupigia au kukutumia ujumbe kwenye WhatsApp (${guestPhone}).`
                            : `Thank you ${guestName}! Your viewing inquiry was delivered directly to the property owner. They will contact you shortly at ${guestPhone}.`,
                        time: 'Just now',
                    },
                ]);
            }
        } catch (err) {
            console.error('Inquiry error:', err);
        } finally {
            setIsSubmittingInquiry(false);
        }
    };

    return (
        <aside aria-label="Support Assistant" className="fixed bottom-5 right-5 z-[80] font-sans">
            {/* FLOATING ACTION BUBBLE */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 20 }}
                        className="flex items-center gap-2"
                    >
                        {/* Interactive Pill Tooltip */}
                        <div
                            onClick={() => setIsOpen(true)}
                            className="hidden sm:flex items-center gap-2 rounded-2xl bg-[#12161A]/95 text-white px-4 py-2.5 shadow-xl border border-white/10 text-xs font-semibold backdrop-blur-md cursor-pointer hover:bg-black transition-all"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span>{lang === 'sw' ? 'Msaidizi wa AI & Miadi' : 'Need a room? Chat with AI'}</span>
                        </div>

                        {/* Main Trigger Button */}
                        <button
                            onClick={() => setIsOpen(true)}
                            aria-label="Open support chat"
                            className="h-14 w-14 rounded-full bg-gradient-to-tr from-slate-950 via-slate-900 to-[#C2704E] text-white shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer ring-4 ring-white/80"
                        >
                            <Bot className="h-6 w-6 text-[#F5D485]" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* EXPANDED SUPPORT ASSISTANT CARD */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 30 }}
                        transition={{ duration: 0.2 }}
                        className={`rounded-3xl bg-white shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden text-slate-900 transition-all duration-300 ${
                            isMaximized
                                ? 'w-[calc(100vw-2rem)] sm:w-[92vw] max-w-5xl h-[92vh]'
                                : 'w-[calc(100vw-2.5rem)] sm:w-[480px] md:w-[540px] lg:w-[600px] xl:w-[640px] h-[640px] sm:h-[720px] md:h-[780px] lg:h-[840px] xl:h-[880px] max-h-[94vh]'
                        }`}
                    >
                        {/* Header Bar */}
                        <div className="bg-gradient-to-r from-[#12161A] via-[#1E252D] to-[#12161A] p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-[#F5D485] shrink-0">
                                    <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-extrabold text-sm sm:text-base text-white">
                                            Panga Support AI
                                        </h3>
                                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-400">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            Active
                                        </span>
                                    </div>
                                    <p className="text-[10px] sm:text-xs text-white/60">
                                        Verified rooms • STS submeters • 0% dalali
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                                {/* Language Switcher */}
                                <button
                                    onClick={toggleLang}
                                    className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] sm:text-xs font-bold text-white hover:bg-white/20 transition-all cursor-pointer"
                                    title="Switch Language"
                                >
                                    {lang.toUpperCase()}
                                </button>

                                {/* Maximize / Restore Toggle (Desktop) */}
                                <button
                                    onClick={() => setIsMaximized(!isMaximized)}
                                    className="hidden sm:flex h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white/10 items-center justify-center text-white/80 hover:bg-white/20 hover:text-white transition-all cursor-pointer"
                                    title={isMaximized ? 'Restore Size' : 'Maximize Window'}
                                >
                                    {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                </button>

                                {/* Close Button */}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-white/20 hover:text-white transition-all cursor-pointer"
                                    title="Close"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Top Mode Navigation Tabs */}
                        <div className="flex items-center border-b border-slate-100 bg-slate-50/80 px-3 sm:px-4 py-2 shrink-0 text-xs sm:text-sm font-semibold gap-1.5">
                            <button
                                onClick={() => setActiveTab('chat')}
                                className={`flex-1 py-2 sm:py-2.5 rounded-xl transition-all cursor-pointer text-center ${
                                    activeTab === 'chat'
                                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                        : 'text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                {lang === 'sw' ? 'Msaidizi wa AI' : 'AI Assistant'}
                            </button>
                            <button
                                onClick={() => setActiveTab('inquire')}
                                className={`flex-1 py-2 sm:py-2.5 rounded-xl transition-all cursor-pointer text-center ${
                                    activeTab === 'inquire'
                                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                        : 'text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                {lang === 'sw' ? 'Ujumbe kwa Mwenye Nyumba' : 'Message Owner'}
                            </button>
                            <button
                                onClick={() => setActiveTab('human')}
                                className={`flex-1 py-2 sm:py-2.5 rounded-xl transition-all cursor-pointer text-center ${
                                    activeTab === 'human'
                                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                        : 'text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                {lang === 'sw' ? 'Ongea na Mtu' : 'WhatsApp'}
                            </button>
                        </div>

                        {/* TAB 1: AI CHAT ASSISTANT */}
                        {activeTab === 'chat' && (
                            <div className="flex-1 flex flex-col justify-between overflow-hidden">
                                {/* Message Feed */}
                                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                                    {messages.map((m) => (
                                        <div
                                            key={m.id}
                                            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                                        >
                                            <div
                                                className={`max-w-[85%] rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3.5 text-xs sm:text-sm leading-relaxed ${
                                                    m.sender === 'user'
                                                        ? 'bg-slate-900 text-white rounded-br-none shadow-xs'
                                                        : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/60'
                                                }`}
                                            >
                                                {m.text}
                                            </div>

                                            {/* Recommended Houses Cards if any */}
                                            {m.recommended_houses && m.recommended_houses.length > 0 && (
                                                <div className="mt-2.5 w-full space-y-2 max-w-[95%]">
                                                    <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400">
                                                        {lang === 'sw' ? 'Nyumba Zinazofaa:' : 'Recommended Listings:'}
                                                    </span>
                                                    {m.recommended_houses.map((h) => (
                                                        <a
                                                            key={h.id}
                                                            href={`/property/${h.id}`}
                                                            className="flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl border border-slate-200 bg-white hover:border-slate-900 transition-all shadow-2xs group"
                                                        >
                                                            {h.image ? (
                                                                <img
                                                                    src={h.image}
                                                                    alt={h.name}
                                                                    className="h-12 w-14 sm:h-14 sm:w-16 rounded-xl object-cover"
                                                                />
                                                            ) : (
                                                                <div className="h-12 w-14 sm:h-14 sm:w-16 rounded-xl bg-slate-100 flex items-center justify-center">
                                                                    <Building2 className="h-6 w-6 text-slate-400" />
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0 text-left">
                                                                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-blue-600">
                                                                    {h.name}
                                                                </p>
                                                                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                                                                    {h.location} • TZS {Number(h.monthly_rent).toLocaleString()}/mo
                                                                </p>
                                                            </div>
                                                            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 shrink-0" />
                                                        </a>
                                                    ))}
                                                </div>
                                            )}

                                            {/* (Action chips removed for clean conversational layout) */}
                                        </div>
                                    ))}

                                    {isLoading && (
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
                                            <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
                                            <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                                            <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                                            <span>{lang === 'sw' ? 'Msaidizi anajibu...' : 'AI assistant is thinking...'}</span>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Chat Input Bar */}
                                <div className="p-3 sm:p-4 border-t border-slate-100 bg-white">
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }}
                                        className="flex items-center gap-2.5"
                                    >
                                        <input
                                            type="text"
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            placeholder={lang === 'sw' ? 'Uliza kuhusu vyumba, mita za LUKU...' : 'Ask about rooms, LUKU meters, rent...'}
                                            className="flex-1 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!inputText.trim() || isLoading}
                                            className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 disabled:opacity-40 transition-all cursor-pointer shrink-0 shadow-xs"
                                        >
                                            <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: DIRECT GUEST INQUIRY & VIEWING REQUEST */}
                        {activeTab === 'inquire' && (
                            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
                                {inquirySubmitted ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3.5">
                                        <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                            <CheckCircle2 className="h-7 w-7" />
                                        </div>
                                        <h4 className="text-base sm:text-lg font-extrabold text-slate-900">
                                            {lang === 'sw' ? 'Ombi Limetumwa!' : 'Inquiry Delivered!'}
                                        </h4>
                                        <p className="text-xs sm:text-sm text-slate-600 max-w-sm leading-relaxed">
                                            {lang === 'sw'
                                                ? 'Mwenye nyumba amepokea ujumbe wako. Atakujulisha miadi kupitia namba yako ya simu/WhatsApp.'
                                                : 'The property owner received your details. They will contact you shortly to confirm viewing.'}
                                        </p>
                                        <button
                                            onClick={() => {
                                                setInquirySubmitted(false);
                                                setActiveTab('chat');
                                            }}
                                            className="mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 cursor-pointer shadow-sm"
                                        >
                                            {lang === 'sw' ? 'Rudi Kwenye Chat' : 'Back to Chat'}
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmitInquiry} className="space-y-4 text-xs sm:text-sm">
                                        <div>
                                            <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                                                {lang === 'sw' ? 'Tuma Ujumbe Moja kwa Moja' : 'Message Property Owner'}
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {lang === 'sw'
                                                    ? 'Mwenye nyumba ataona ombi lako na kuwasiliana nawe papo hapo.'
                                                    : 'No registration needed. The landlord will receive your viewing request immediately.'}
                                            </p>
                                        </div>

                                        {currentHouseName && (
                                            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
                                                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-[#C2704E] shrink-0" />
                                                <span className="font-bold text-slate-900 truncate">{currentHouseName}</span>
                                            </div>
                                        )}

                                        <div>
                                            <label className="font-bold text-slate-700 block mb-1">
                                                {lang === 'sw' ? 'Jina Lako' : 'Your Full Name'}
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={guestName}
                                                onChange={(e) => setGuestName(e.target.value)}
                                                placeholder="e.g. Amina Bakari"
                                                className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 sm:py-3 focus:border-slate-900 focus:outline-none bg-slate-50/50"
                                            />
                                        </div>

                                        <div>
                                            <label className="font-bold text-slate-700 block mb-1">
                                                {lang === 'sw' ? 'Namba ya Simu / WhatsApp' : 'Phone / WhatsApp'}
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={guestPhone}
                                                onChange={(e) => setGuestPhone(e.target.value)}
                                                placeholder="+255 712 345 678"
                                                className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 sm:py-3 focus:border-slate-900 focus:outline-none bg-slate-50/50"
                                            />
                                        </div>

                                        <div>
                                            <label className="font-bold text-slate-700 block mb-1">
                                                {lang === 'sw' ? 'Muda Unaopendelea Kuona Nyumba' : 'Preferred Viewing Date/Time'}
                                            </label>
                                            <input
                                                type="text"
                                                value={inquiryPreferredDate}
                                                onChange={(e) => setInquiryPreferredDate(e.target.value)}
                                                placeholder="e.g. Tomorrow 10:00 AM"
                                                className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 sm:py-3 focus:border-slate-900 focus:outline-none bg-slate-50/50"
                                            />
                                        </div>

                                        <div>
                                            <label className="font-bold text-slate-700 block mb-1">
                                                {lang === 'sw' ? 'Ujumbe / Maswali Yako' : 'Message / Specific Questions'}
                                            </label>
                                            <textarea
                                                rows={3}
                                                required
                                                value={inquiryMessage}
                                                onChange={(e) => setInquiryMessage(e.target.value)}
                                                className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 sm:py-3 focus:border-slate-900 focus:outline-none bg-slate-50/50"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSubmittingInquiry}
                                            className="w-full rounded-2xl bg-slate-900 py-3.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 transition-all cursor-pointer shadow-md disabled:opacity-50"
                                        >
                                            {isSubmittingInquiry ? 'Sending to Landlord...' : (lang === 'sw' ? 'Tuma Ombi la Kuona Nyumba' : 'Send Viewing Request')}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}

                        {/* TAB 3: HUMAN HANDOFF & WHATSAPP */}
                        {activeTab === 'human' && (
                            <div className="flex-1 p-6 flex flex-col justify-between text-center">
                                <div className="space-y-4 pt-4">
                                    <div className="h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                                        <MessageCircle className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-extrabold text-slate-900">
                                            {lang === 'sw' ? 'Ongea na Mtu Moja kwa Moja' : 'Connect with Live Support'}
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                                            {lang === 'sw'
                                                ? 'Je unahitaji usaidizi wa haraka kuhusu nyumba au mkataba? Ongea na timu yetu ya usaidizi kwenye WhatsApp.'
                                                : 'Need instant human assistance regarding tenancy agreements, viewings, or property verification? Chat with our team on WhatsApp.'}
                                        </p>
                                    </div>

                                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-1.5">
                                        <div className="flex items-center gap-2 text-slate-700">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                            <span>Instant response (Mon - Sun, 8am - 10pm)</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-700">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                            <span>Direct connection to verified property owners</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-700">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                            <span>100% Free - 0% Dalali commission</span>
                                        </div>
                                    </div>
                                </div>

                                <a
                                    href={`https://wa.me/255712345678?text=${encodeURIComponent(
                                        `Hello Panga Support, I am visiting the website and would like assistance with: ${currentHouseName || 'renting a room'}.`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-xs font-bold text-white shadow-lg hover:bg-[#20BE5C] transition-all cursor-pointer"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                    <span>{lang === 'sw' ? 'Fungua WhatsApp Chat' : 'Open WhatsApp Live Chat'}</span>
                                </a>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </aside>
    );
}

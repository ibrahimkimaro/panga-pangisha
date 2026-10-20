import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles, X, Send, Bot, User, Copy, Check, ShieldCheck, ArrowRight
} from 'lucide-react';

interface VeyoraAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
    landlordName: string;
}

export default function VeyoraAssistantModal({
    isOpen,
    onClose,
    landlordName,
}: VeyoraAssistantModalProps) {
    const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string; time: string }>>([
        {
            sender: 'ai',
            text: `Habari ${landlordName}! 👋 I am Veyora, your dedicated real estate AI assistant. I can help analyze your rent collections, draft custom tenancy agreement clauses, check Tanzanian residential tenancy regulations, or generate property marketplace copy. How can I assist you?`,
            time: 'Just now',
        },
    ]);
    const [input, setInput] = useState('');
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    if (!isOpen) return null;

    const handleSend = (textToSend?: string) => {
        const query = textToSend || input;
        if (!query.trim()) return;

        const userMsg = {
            sender: 'user' as const,
            text: query,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput('');

        setTimeout(() => {
            let reply = "Here is what I found in your live portfolio: You currently have 4 properties with 18 total rooms (14 occupied, 4 vacant). Monthly rent collected is TZS 4,850,000 (81% of your target). Everything is running smoothly with no critical arrears.";
            const q = query.toLowerCase();
            if (q.includes('agreement') || q.includes('clause') || q.includes('mkataba')) {
                reply = "Here is a recommended STS sub-meter clause for your agreement:\n\n'Clause 7 (Utilities & Prepaid STS Sub-metering): The Tenant acknowledges that electricity and water are billed on individual prepaid split meters. The Tenant shall purchase LUKU / water tokens directly via M-Pesa. Any structural meter bypass constitutes immediate breach of lease.'";
            } else if (q.includes('notice') || q.includes('evict') || q.includes('law')) {
                reply = "Under Tanzanian tenancy standard practices: For monthly residential tenancies, a minimum of 30 days written notice is required prior to the end of a rental period. For quarterly or annual leases, 90 days notice is typical. Would you like me to generate a formal notice letter draft?";
            } else if (q.includes('vacant') || q.includes('listing') || q.includes('describe')) {
                reply = "Here is an optimized listing description for your vacant unit:\n\n'Modern, secure 2-bedroom residence located in Mikocheni B. Featuring dedicated STS prepaid electricity meter, 24/7 borehole water backup, gated compound with CCTV security, and paved parking. Move-in ready. Contact landlord directly.'";
            }

            setMessages((prev) => [
                ...prev,
                {
                    sender: 'ai',
                    text: reply,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
            ]);
        }, 500);
    };

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const quickPrompts = [
        'Summarize this month\'s collections',
        'Draft STS submeter lease clause',
        'Generate vacant room listing copy',
        'Tanzania 30-day notice requirements',
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="flex flex-col w-full max-w-2xl h-[85vh] rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-sm text-white">Veyora AI Landlord Assistant</h3>
                                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                                    Online
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-300">Intelligent property, legal clause & portfolio companion</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Quick Prompts Bar */}
                <div className="flex items-center gap-2 px-6 py-2.5 border-b border-slate-100 bg-slate-50/70 overflow-x-auto no-scrollbar">
                    {quickPrompts.map((p) => (
                        <button
                            key={p}
                            onClick={() => handleSend(p)}
                            className="whitespace-nowrap rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all shadow-2xs shrink-0"
                        >
                            {p}
                        </button>
                    ))}
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((m, idx) => (
                        <div
                            key={idx}
                            className={`flex items-start gap-3 ${
                                m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                            }`}
                        >
                            <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                    m.sender === 'user'
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xs'
                                }`}
                            >
                                {m.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                            </div>

                            <div
                                className={`group relative max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                                    m.sender === 'user'
                                        ? 'bg-slate-900 text-white font-medium'
                                        : 'bg-slate-50 border border-slate-200/80 text-slate-800 shadow-2xs'
                                }`}
                            >
                                {m.text}

                                {m.sender === 'ai' && (
                                    <button
                                        onClick={() => copyToClipboard(m.text, idx)}
                                        className="absolute right-2 top-2 p-1 text-slate-400 hover:text-slate-700 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Copy response"
                                    >
                                        {copiedIndex === idx ? (
                                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                                        ) : (
                                            <Copy className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                )}

                                <span
                                    className={`block text-[10px] mt-1.5 ${
                                        m.sender === 'user' ? 'text-slate-300 text-right' : 'text-slate-400'
                                    }`}
                                >
                                    {m.time}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Bar */}
                <div className="p-4 border-t border-slate-100 bg-white">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="flex items-center gap-2"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask Veyora AI about rent, legal lease terms, tenants, or vacancy..."
                            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim()}
                            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-white hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xs"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

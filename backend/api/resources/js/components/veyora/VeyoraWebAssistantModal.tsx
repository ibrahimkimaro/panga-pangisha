import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import { VeyoraStructuredResponse, VeyoraAction } from '@/types/veyora';
import { VeyoraRenderer } from './VeyoraRenderer';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    structured?: VeyoraStructuredResponse;
    timestamp: Date;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    initialContext?: Record<string, unknown>;
}

export const VeyoraWebAssistantModal: React.FC<Props> = ({ isOpen, onClose, initialContext }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    if (!isOpen) return null;

    const sendMessage = async (presetText?: string) => {
        const text = (presetText || input).trim();
        if (!text || loading) return;

        setInput('');
        const userMsg: ChatMessage = {
            id: String(Date.now()),
            role: 'user',
            content: text,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setLoading(true);

        try {
            const res = await fetch('/api/ai/assistant/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    message: text,
                    conversation_id: conversationId,
                    context: {
                        client: 'web',
                        screen: 'WebDashboard',
                        ...initialContext,
                    },
                }),
            });

            const data: VeyoraStructuredResponse = await res.json();

            if (data.conversation_id) {
                setConversationId(data.conversation_id);
            }

            const aiMsg: ChatMessage = {
                id: String(Date.now() + 1),
                role: 'assistant',
                content: data.response,
                structured: data,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, aiMsg]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: String(Date.now() + 1),
                    role: 'assistant',
                    content: 'Samahani, kumetokea tatizo la mtandao. Tafadhali jaribu tena baada ya muda mfupi.',
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (action: VeyoraAction) => {
        if (action.type === 'message' || action.type === 'mcp_call') {
            sendMessage(action.label);
        } else if (action.type === 'navigate' && action.payload?.screen) {
            window.location.href = `/admin/${action.payload.screen}`;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-teal-900 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-800 flex items-center justify-center border border-teal-700 shadow-inner">
                            <Sparkles className="w-5 h-5 text-teal-300 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="font-bold text-sm tracking-wide">Veyora AI Assistant</h2>
                            <p className="text-[11px] text-teal-200">Structured Housing Intelligence & Property Operations</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-teal-800/80 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/30">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center justify-center">
                                <Bot className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                            </div>
                            <div className="max-w-md space-y-1">
                                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">Habari! Mimi ni Veyora</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                    Uliza kuhusu kodi iliyokusanywa, linganisha nyumba zako, kagua wapangaji wanaodaiwa, au angalia
                                    matumizi ya umeme ya mwezi huu.
                                </p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2 max-w-lg pt-2">
                                {[
                                    'How much rent collected this month?',
                                    'Compare my properties',
                                    'Which tenants have outstanding rent?',
                                    'Show electricity consumption this month',
                                ].map((sample, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(sample)}
                                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-teal-500 text-gray-700 dark:text-gray-300 font-medium transition"
                                    >
                                        {sample}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isUser = msg.role === 'user';
                            return (
                                <div key={msg.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                                    {!isUser && (
                                        <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                    )}
                                    <div
                                        className={`rounded-2xl p-3.5 max-w-[85%] text-xs shadow-2xs ${
                                            isUser
                                                ? 'bg-teal-600 text-white rounded-br-xs'
                                                : 'bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-xs'
                                        }`}
                                    >
                                        {isUser ? (
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                        ) : msg.structured ? (
                                            <VeyoraRenderer response={msg.structured} onAction={handleAction} />
                                        ) : (
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                        )}
                                    </div>
                                    {isUser && (
                                        <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center shrink-0 mt-1">
                                            <UserIcon className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                    {loading && (
                        <div className="flex gap-3 justify-start">
                            <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-2xs animate-pulse">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <div className="p-3.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 text-gray-600 dark:text-gray-400 text-xs flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                                <span>Veyora is querying authoritative records...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Footer Input */}
                <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') sendMessage();
                        }}
                        placeholder="Uliza Veyora swali lolote la nyumba au kodi..."
                        className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    <button
                        onClick={() => sendMessage()}
                        disabled={loading || !input.trim()}
                        className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-medium flex items-center gap-1.5 transition text-xs shadow-xs"
                    >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

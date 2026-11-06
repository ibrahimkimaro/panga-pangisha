import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, Send, Search, Plus, Users, UserPlus, Trash2,
    Check, CheckCheck, Circle, Phone, ShieldCheck, X, MoreVertical,
    Edit3, RefreshCw, Sparkles, Building2, AlertCircle, Eraser,
    Wifi, WifiOff, ChevronLeft, Reply
} from 'lucide-react';
import { PhoenixSocketClient, PhoenixChannel } from '../../lib/phoenixSocket';

export interface ChatPeer {
    id: number;
    uuid: string;
    fullname: string;
    phone?: string;
    role?: string;
    profile_image?: string | null;
    is_my_tenant?: boolean;
    property_name?: string;
    unit?: string;
}

export interface ChatGroupInfo {
    slug: string;
    name: string;
    members: number;
    is_admin?: boolean;
}

export interface ConversationRow {
    id: number | string;
    kind: 'direct' | 'group';
    topic: string;
    house?: string | null;
    updated_at: string;
    last_message?: string | null;
    last_author?: string | null;
    last_mine?: boolean;
    unread: number;
    peer?: ChatPeer;
    group?: ChatGroupInfo;
}

export interface ChatMessageItem {
    id: string;
    seq?: number;
    client_id?: string;
    topic?: string;
    author_id: string;
    author_name: string;
    author_username?: string;
    text: string;
    timestamp: string;
    read_at?: string | null;
    edited_at?: string | null;
    deleted_at?: string | null;
    reply_to?: {
        id: string;
        text: string;
        author_name: string;
    } | null;
    sending?: boolean;
    failed?: boolean;
}

interface RealtimeChatViewProps {
    lang?: 'en' | 'sw';
    initialPeerPhoneOrName?: string | null;
    onClearInitialPeer?: () => void;
    initialTopic?: string | null;
    onClearInitialTopic?: () => void;
    onUnreadTotalChange?: (total: number) => void;
}

function getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }
    return headers;
}

function formatMessageTime(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const now = new Date();
    const sameDay =
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate();
    if (sameDay) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function RealtimeChatView({
    lang = 'en',
    initialPeerPhoneOrName = null,
    onClearInitialPeer,
    initialTopic = null,
    onClearInitialTopic,
    onUnreadTotalChange,
}: RealtimeChatViewProps) {
    // Socket & identity state
    const socketRef = useRef<PhoenixSocketClient | null>(null);
    const userChannelRef = useRef<PhoenixChannel | null>(null);
    const activeChannelRef = useRef<PhoenixChannel | null>(null);

    const [socketConnected, setSocketConnected] = useState(false);
    const [myUuid, setMyUuid] = useState<string>('');
    const [myProfile, setMyProfile] = useState<ChatPeer | null>(null);

    // Online presence & global typing state from Phoenix
    const [onlineUuids, setOnlineUuids] = useState<Set<string>>(new Set());
    const [typingByTopic, setTypingByTopic] = useState<Record<string, { name: string; userId: string }>>({});
    const typingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    // Conversations & active room state
    const [conversations, setConversations] = useState<ConversationRow[]>([]);
    const [loadingConvos, setLoadingConvos] = useState(true);
    const [convoFilter, setConvoFilter] = useState<'all' | 'unread' | 'groups'>('all');
    const [sidebarSearch, setSidebarSearch] = useState('');
    const [activeConvo, setActiveConvo] = useState<ConversationRow | null>(null);
    const [mobileShowChat, setMobileShowChat] = useState(false);
    const activeTopicRef = useRef<string | null>(null);

    // Active conversation messages
    const [messages, setMessages] = useState<ChatMessageItem[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [hasOlder, setHasOlder] = useState(false);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [composerText, setComposerText] = useState('');
    const [replyingTo, setReplyingTo] = useState<ChatMessageItem | null>(null);
    const [editingMessage, setEditingMessage] = useState<ChatMessageItem | null>(null);

    // Modals: New Direct Chat (search anyone by name or phone) & New Group (landlord's tenants only)
    const [isNewDirectModalOpen, setIsNewDirectModalOpen] = useState(false);
    const [peopleQuery, setPeopleQuery] = useState('');
    const [peopleResults, setPeopleResults] = useState<ChatPeer[]>([]);
    const [loadingPeople, setLoadingPeople] = useState(false);

    const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
    const [myTenants, setMyTenants] = useState<ChatPeer[]>([]);
    const [loadingTenants, setLoadingTenants] = useState(false);
    const [selectedTenantIds, setSelectedTenantIds] = useState<number[]>([]);
    const [groupNameInput, setGroupNameInput] = useState('');
    const [tenantFilterQuery, setTenantFilterQuery] = useState('');
    const [creatingGroup, setCreatingGroup] = useState(false);
    const [groupError, setGroupError] = useState<string | null>(null);

    // Group members drawer / modal (view members + add more tenants to group)
    const [isGroupMembersModalOpen, setIsGroupMembersModalOpen] = useState(false);
    const [groupMembers, setGroupMembers] = useState<Array<ChatPeer & { admin?: boolean; me?: boolean }>>([]);
    const [loadingGroupMembers, setLoadingGroupMembers] = useState(false);
    const [addingToGroupIds, setAddingToGroupIds] = useState<number[]>([]);
    const [addingMembersBusy, setAddingMembersBusy] = useState(false);

    // Room actions menu & confirmation modal (Clear chat / Delete whole room)
    const [roomMenuOpen, setRoomMenuOpen] = useState(false);
    const [confirmRoomAction, setConfirmRoomAction] = useState<'clear' | 'delete' | null>(null);
    const [roomActionBusy, setRoomActionBusy] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const lastTypingSentAtRef = useRef<number>(0);
    const stopTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = useCallback((type: 'success' | 'error', text: string) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 4000);
    }, []);

    // Report total unread count to parent dashboard & header notification bell
    useEffect(() => {
        const total = conversations.reduce((acc, c) => acc + (c.unread || 0), 0);
        onUnreadTotalChange?.(total);
        if (typeof window !== 'undefined') {
            window.dispatchEvent(
                new CustomEvent('phoenix:unread-sync', {
                    detail: { total, activeTopic: activeConvo?.topic ?? null },
                })
            );
        }
    }, [conversations, activeConvo?.topic, onUnreadTotalChange]);

    // Helper to set/clear typing state for a topic with 6s auto-expiry
    const setTopicTyping = useCallback((topic: string, isTyping: boolean, name = 'Someone', userId = '') => {
        if (typingTimersRef.current[topic]) {
            clearTimeout(typingTimersRef.current[topic]);
            delete typingTimersRef.current[topic];
        }
        setTypingByTopic((prev) => {
            if (!isTyping) {
                if (!prev[topic]) return prev;
                const next = { ...prev };
                delete next[topic];
                return next;
            }
            return { ...prev, [topic]: { name, userId } };
        });
        if (isTyping) {
            typingTimersRef.current[topic] = setTimeout(() => {
                setTypingByTopic((prev) => {
                    if (!prev[topic]) return prev;
                    const next = { ...prev };
                    delete next[topic];
                    return next;
                });
            }, 6000);
        }
    }, []);

    // Fetch conversations list from backend
    const loadConversations = useCallback(async (quiet = false): Promise<ConversationRow[]> => {
        if (!quiet) setLoadingConvos(true);
        try {
            const res = await fetch('/landlord/chat/conversations', {
                headers: getAuthHeaders(),
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to load conversations');
            const data = (await res.json()) as ConversationRow[];
            setConversations(data);
            return data;
        } catch {
            return [];
        } finally {
            if (!quiet) setLoadingConvos(false);
        }
    }, []);

    // Connect to Phoenix Socket and join personal user:<uuid> channel
    useEffect(() => {
        let cancelled = false;

        async function initPhoenix() {
            try {
                const res = await fetch('/landlord/chat/token', {
                    headers: getAuthHeaders(),
                    credentials: 'include',
                });
                if (!res.ok) return;
                const info = await res.json();
                if (cancelled) return;

                setMyUuid(info.user_id);
                if (info.me) setMyProfile(info.me);

                const sock = new PhoenixSocketClient(info.ws_url, info.token, (connected) => {
                    if (!cancelled) setSocketConnected(connected);
                });
                socketRef.current = sock;
                await sock.connect();
                if (cancelled) {
                    sock.disconnect();
                    return;
                }

                const userCh = sock.channel(`user:${info.user_id}`);
                userChannelRef.current = userCh;

                // Listen for global online presence updates
                userCh.on('online', (payload) => {
                    const ids: string[] = Array.isArray(payload?.ids) ? payload.ids.map(String) : [];
                    setOnlineUuids(new Set(ids));
                });

                // Listen for typing events across all conversations
                userCh.on('typing', (payload) => {
                    const topic = String(payload?.topic || '');
                    if (!topic || payload?.user_id === info.user_id) return;
                    setTopicTyping(
                        topic,
                        payload?.is_typing === true,
                        String(payload?.author_name || 'User'),
                        String(payload?.user_id || '')
                    );
                });

                // Listen for new DM or group message notifications
                const handleIncomingNotice = (payload: Record<string, any>) => {
                    const topic = String(payload?.topic || '');
                    if (!topic) return;
                    setTopicTyping(topic, false);

                    setConversations((prev) => {
                        const exists = prev.some((c) => c.topic === topic);
                        if (!exists) {
                            // Refresh conversations list so the new sender/group appears
                            loadConversations(true);
                            return prev;
                        }
                        const isCurrentlyOpen = activeTopicRef.current === topic;
                        return prev
                            .map((c) => {
                                if (c.topic !== topic) return c;
                                return {
                                    ...c,
                                    last_message: String(payload?.text ?? c.last_message ?? ''),
                                    last_author: String(payload?.author_name ?? c.last_author ?? ''),
                                    last_mine: payload?.author_id === info.user_id,
                                    updated_at: String(payload?.timestamp || new Date().toISOString()),
                                    unread: isCurrentlyOpen ? 0 : (c.unread || 0) + 1,
                                };
                            })
                            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
                    });
                };

                userCh.on('notice', handleIncomingNotice);
                userCh.on('group_notice', handleIncomingNotice);
                userCh.on('groups_changed', () => {
                    loadConversations(true);
                });

                const joinResp = await userCh.join();
                if (joinResp?.unread && typeof joinResp.unread === 'object') {
                    const unreadMap = joinResp.unread as Record<string, number>;
                    setConversations((prev) =>
                        prev.map((c) => ({
                            ...c,
                            unread: unreadMap[c.topic] !== undefined ? Number(unreadMap[c.topic]) : c.unread,
                        }))
                    );
                }
            } catch (err) {
                console.warn('[PhoenixChat] Socket init warning:', err);
            }
        }

        loadConversations().then((list) => {
            if (!cancelled && list.length > 0 && !activeTopicRef.current) {
                setActiveConvo(list[0]);
            }
        });
        initPhoenix();

        return () => {
            cancelled = true;
            if (activeChannelRef.current) {
                activeChannelRef.current.leave();
                activeChannelRef.current = null;
            }
            if (userChannelRef.current) {
                userChannelRef.current.leave();
                userChannelRef.current = null;
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [loadConversations, setTopicTyping]);

    // Join the selected conversation channel (`direct:<a>_<b>` or `room:<slug>`)
    useEffect(() => {
        const convo = activeConvo;
        activeTopicRef.current = convo?.topic ?? null;

        if (!convo) {
            setMessages([]);
            return;
        }

        // Clear unread badge on selection
        setConversations((prev) =>
            prev.map((c) => (c.topic === convo.topic ? { ...c, unread: 0 } : c))
        );

        let cancelled = false;

        async function openConversationChannel() {
            setLoadingMessages(true);
            try {
                // Ensure socket is connected and conversation is registered if direct
                let sock = socketRef.current;
                let currentMyUuid = myUuid;

                if (!sock || !socketConnected || (convo!.kind === 'direct' && convo!.peer?.id)) {
                    const peerParam = convo!.kind === 'direct' && convo!.peer?.id ? `?peer=${convo!.peer.id}` : '';
                    const res = await fetch(`/landlord/chat/token${peerParam}`, {
                        headers: getAuthHeaders(),
                        credentials: 'include',
                    });
                    if (res.ok) {
                        const info = await res.json();
                        currentMyUuid = info.user_id;
                        setMyUuid(info.user_id);
                        if (!sock) {
                            sock = new PhoenixSocketClient(info.ws_url, info.token, (c) => {
                                if (!cancelled) setSocketConnected(c);
                            });
                            socketRef.current = sock;
                            await sock.connect();
                        }
                    }
                }

                if (cancelled || !sock) return;

                if (activeChannelRef.current && activeChannelRef.current.topic !== convo!.topic) {
                    activeChannelRef.current.leave();
                    activeChannelRef.current = null;
                }

                const ch = sock.channel(convo!.topic);
                activeChannelRef.current = ch;
                ch.off('new_msg');
                ch.off('user_typing');
                ch.off('messages_read');
                ch.off('msg_deleted');
                ch.off('msg_edited');
                ch.off('room_deleted');
                ch.off('presence_state');

                ch.on('presence_state', (state) => {
                    const presentIds = Object.keys(state || {});
                    if (presentIds.length > 0) {
                        setOnlineUuids((prev) => {
                            const next = new Set(prev);
                            presentIds.forEach((id) => next.add(id));
                            return next;
                        });
                    }
                });

                ch.on('new_msg', (msg) => {
                    const incoming = normalizeMessage(msg);
                    setTopicTyping(convo!.topic, false);
                    setMessages((prev) => {
                        const idx = prev.findIndex(
                            (m) => (incoming.client_id && m.client_id === incoming.client_id) || m.id === incoming.id
                        );
                        if (idx >= 0) {
                            const copy = [...prev];
                            copy[idx] = { ...copy[idx], ...incoming, sending: false, failed: false };
                            return copy;
                        }
                        return [...prev, incoming];
                    });

                    // Update conversation preview
                    setConversations((prev) =>
                        prev.map((c) =>
                            c.topic === convo!.topic
                                ? {
                                    ...c,
                                    last_message: incoming.text,
                                    last_author: incoming.author_name,
                                    last_mine: incoming.author_id === currentMyUuid,
                                    updated_at: incoming.timestamp,
                                    unread: 0,
                                }
                                : c
                        )
                    );

                    // Send read receipt if message is from peer in a direct chat
                    if (convo!.kind === 'direct' && incoming.author_id !== currentMyUuid && incoming.seq) {
                        ch.push('read_receipt', { up_to: incoming.seq });
                    }
                });

                ch.on('user_typing', (payload) => {
                    if (payload?.user_id === currentMyUuid) return;
                    setTopicTyping(
                        convo!.topic,
                        payload?.is_typing === true,
                        String(payload?.author_name || 'User'),
                        String(payload?.user_id || '')
                    );
                });

                ch.on('messages_read', (payload) => {
                    const upTo = Number(payload?.up_to || 0);
                    const readAt = String(payload?.read_at || new Date().toISOString());
                    if (!upTo) return;
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.author_id === currentMyUuid && m.seq && m.seq <= upTo && !m.read_at
                                ? { ...m, read_at: readAt }
                                : m
                        )
                    );
                });

                ch.on('msg_deleted', (payload) => {
                    const seq = Number(payload?.seq || payload?.id || 0);
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.seq === seq || m.id === String(seq)
                                ? { ...m, text: '', deleted_at: String(payload?.deleted_at || new Date().toISOString()) }
                                : m
                        )
                    );
                });

                ch.on('msg_edited', (payload) => {
                    const seq = Number(payload?.seq || payload?.id || 0);
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.seq === seq || m.id === String(seq)
                                ? {
                                    ...m,
                                    text: String(payload?.text ?? m.text),
                                    edited_at: String(payload?.edited_at || new Date().toISOString()),
                                }
                                : m
                        )
                    );
                });

                ch.on('room_deleted', () => {
                    showToast('success', lang === 'sw' ? 'Chumba cha mazungumzo kimefutwa.' : 'Chat room was deleted.');
                    setConversations((prev) => prev.filter((c) => c.topic !== convo!.topic));
                    setActiveConvo(null);
                    setMessages([]);
                });

                const reply = await ch.join();
                if (cancelled) return;

                const rawList = Array.isArray(reply?.messages) ? reply.messages : [];
                const history = rawList.map(normalizeMessage);
                setMessages(history);
                setHasOlder(Boolean(reply?.has_more));

                // Mark newest peer message as read
                if (convo!.kind === 'direct') {
                    const peerSeqs = history
                        .filter((m) => m.author_id !== currentMyUuid && typeof m.seq === 'number')
                        .map((m) => m.seq as number);
                    if (peerSeqs.length > 0) {
                        const maxSeq = Math.max(...peerSeqs);
                        ch.push('read_receipt', { up_to: maxSeq });
                    }
                }
            } catch (err) {
                console.warn('[PhoenixChat] Channel join error:', err);
            } finally {
                if (!cancelled) setLoadingMessages(false);
            }
        }

        openConversationChannel();

        return () => {
            cancelled = true;
        };
    }, [activeConvo?.topic, socketConnected]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length, activeConvo?.topic]);

    // Handle external jump to a specific tenant/peer by phone or name
    useEffect(() => {
        if (!initialPeerPhoneOrName) return;
        const q = initialPeerPhoneOrName.trim();
        if (!q) return;

        async function openInitialPeer() {
            try {
                const res = await fetch(`/landlord/chat/people?q=${encodeURIComponent(q)}`, {
                    headers: getAuthHeaders(),
                    credentials: 'include',
                });
                if (res.ok) {
                    const found = (await res.json()) as ChatPeer[];
                    if (found.length > 0) {
                        await startDirectChatWithPerson(found[0]);
                        setMobileShowChat(true);
                    }
                }
            } finally {
                onClearInitialPeer?.();
            }
        }
        openInitialPeer();
    }, [initialPeerPhoneOrName]);

    // Handle external jump to a specific conversation topic (e.g. from Header Realtime Notification Bell)
    useEffect(() => {
        if (!initialTopic) return;
        const target = initialTopic.trim();
        if (!target) return;

        const existing = conversations.find((c) => c.topic === target);
        if (existing) {
            setActiveConvo(existing);
            setMobileShowChat(true);
            onClearInitialTopic?.();
            return;
        }

        // Reload conversations if it was a newly created conversation
        loadConversations(true).then((list) => {
            const match = list.find((c) => c.topic === target);
            if (match) {
                setActiveConvo(match);
                setMobileShowChat(true);
            }
            onClearInitialTopic?.();
        });
    }, [initialTopic, conversations.length]);

    function normalizeMessage(raw: Record<string, any>): ChatMessageItem {
        return {
            id: String(raw.id ?? raw.client_id ?? Math.random()),
            seq: typeof raw.seq === 'number' ? raw.seq : raw.id && !Number.isNaN(Number(raw.id)) ? Number(raw.id) : undefined,
            client_id: raw.client_id ? String(raw.client_id) : undefined,
            topic: raw.topic ? String(raw.topic) : undefined,
            author_id: String(raw.author_id ?? ''),
            author_name: String(raw.author_name ?? 'User'),
            author_username: raw.author_username ? String(raw.author_username) : undefined,
            text: String(raw.text ?? raw.body ?? ''),
            timestamp: String(raw.timestamp ?? raw.inserted_at ?? new Date().toISOString()),
            read_at: raw.read_at ? String(raw.read_at) : null,
            edited_at: raw.edited_at ? String(raw.edited_at) : null,
            deleted_at: raw.deleted_at ? String(raw.deleted_at) : null,
            reply_to: raw.reply_to ?? null,
        };
    }

    // Load older messages pagination
    const handleLoadOlder = async () => {
        const ch = activeChannelRef.current;
        if (!ch || !hasOlder || loadingOlder) return;
        const seqs = messages.filter((m) => typeof m.seq === 'number').map((m) => m.seq as number);
        if (seqs.length === 0) return;
        const minSeq = Math.min(...seqs);

        setLoadingOlder(true);
        try {
            const reply = await ch.pushWithReply('older', { before: minSeq });
            const olderList = Array.isArray(reply?.messages) ? reply.messages.map(normalizeMessage) : [];
            setMessages((prev) => [...olderList, ...prev]);
            setHasOlder(Boolean(reply?.has_more));
        } catch {
            showToast('error', 'Could not load older messages.');
        } finally {
            setLoadingOlder(false);
        }
    };

    // Send typing indicator over WebSocket
    const handleComposerChange = (val: string) => {
        setComposerText(val);
        const ch = activeChannelRef.current;
        if (!ch || !ch.joined) return;

        if (stopTypingTimeoutRef.current) {
            clearTimeout(stopTypingTimeoutRef.current);
        }

        if (!val.trim()) {
            ch.push('typing', { is_typing: false });
            lastTypingSentAtRef.current = 0;
            return;
        }

        const now = Date.now();
        if (now - lastTypingSentAtRef.current > 2200) {
            ch.push('typing', { is_typing: true });
            lastTypingSentAtRef.current = now;
        }

        stopTypingTimeoutRef.current = setTimeout(() => {
            ch.push('typing', { is_typing: false });
            lastTypingSentAtRef.current = 0;
        }, 2600);
    };

    // Send or Edit Message over Phoenix WebSocket
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = composerText.trim();
        const ch = activeChannelRef.current;
        if (!text || !ch || !activeConvo) return;

        if (stopTypingTimeoutRef.current) {
            clearTimeout(stopTypingTimeoutRef.current);
        }
        ch.push('typing', { is_typing: false });
        lastTypingSentAtRef.current = 0;

        // If editing an existing message
        if (editingMessage && editingMessage.seq) {
            const targetSeq = editingMessage.seq;
            setEditingMessage(null);
            setComposerText('');
            try {
                const updated = await ch.pushWithReply('edit_msg', { id: String(targetSeq), text });
                setMessages((prev) =>
                    prev.map((m) =>
                        m.seq === targetSeq
                            ? { ...m, text: String(updated?.text ?? text), edited_at: new Date().toISOString() }
                            : m
                    )
                );
            } catch (err: any) {
                showToast('error', err?.reason || 'Could not edit message.');
            }
            return;
        }

        const clientId = `web-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const replyPayload = replyingTo
            ? {
                id: String(replyingTo.seq || replyingTo.id),
                text: replyingTo.text.slice(0, 180),
                author_name: replyingTo.author_name,
                author_id: replyingTo.author_id,
            }
            : null;

        const optimistic: ChatMessageItem = {
            id: clientId,
            client_id: clientId,
            author_id: myUuid,
            author_name: myProfile?.fullname || 'Me',
            text,
            timestamp: new Date().toISOString(),
            reply_to: replyPayload,
            sending: true,
        };

        setMessages((prev) => [...prev, optimistic]);
        setComposerText('');
        setReplyingTo(null);

        try {
            const ack = await ch.pushWithReply('new_msg', {
                id: clientId,
                text,
                ...(replyPayload ? { reply_to: replyPayload } : {}),
            });
            const normalizedAck = normalizeMessage(ack);
            setMessages((prev) =>
                prev.map((m) => (m.client_id === clientId ? { ...normalizedAck, sending: false, failed: false } : m))
            );
            setConversations((prev) =>
                prev
                    .map((c) =>
                        c.topic === activeConvo.topic
                            ? {
                                ...c,
                                last_message: text,
                                last_author: myProfile?.fullname || 'You',
                                last_mine: true,
                                updated_at: normalizedAck.timestamp,
                            }
                            : c
                    )
                    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
            );
        } catch (err: any) {
            setMessages((prev) =>
                prev.map((m) => (m.client_id === clientId ? { ...m, sending: false, failed: true } : m))
            );
            showToast('error', err?.reason || 'Message could not be sent.');
        }
    };

    // Delete a single message for everyone via Phoenix WebSocket
    const handleDeleteSingleMessage = async (msg: ChatMessageItem) => {
        const ch = activeChannelRef.current;
        if (!ch || !msg.seq) {
            // If it was never stored on server, remove locally
            setMessages((prev) => prev.filter((m) => m.id !== msg.id));
            return;
        }
        try {
            await ch.pushWithReply('delete_msg', { id: String(msg.seq) });
            setMessages((prev) =>
                prev.map((m) =>
                    m.seq === msg.seq ? { ...m, text: '', deleted_at: new Date().toISOString() } : m
                )
            );
            showToast('success', lang === 'sw' ? 'Ujumbe umefutwa.' : 'Message deleted for everyone.');
        } catch (err: any) {
            showToast('error', err?.reason || 'Could not delete message.');
        }
    };

    // Clear all messages in room OR Delete the entire room/conversation
    const handleExecuteRoomAction = async (mode: 'clear' | 'delete') => {
        if (!activeConvo) return;
        setRoomActionBusy(true);
        const targetTopic = activeConvo.topic;
        try {
            const ch = activeChannelRef.current;
            if (ch && ch.joined) {
                try {
                    await ch.pushWithReply(mode === 'delete' ? 'delete_room' : 'clear_chat', {});
                } catch { }
            }

            await fetch('/landlord/chat/clear', {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({ topic: targetTopic, mode }),
            });

            if (mode === 'clear') {
                setMessages([]);
                setConversations((prev) =>
                    prev.map((c) => (c.topic === targetTopic ? { ...c, last_message: null, unread: 0 } : c))
                );
                showToast('success', lang === 'sw' ? 'Mazungumzo yamesafishwa.' : 'Chat history cleared.');
            } else {
                if (activeChannelRef.current?.topic === targetTopic) {
                    activeChannelRef.current.leave();
                    activeChannelRef.current = null;
                }
                setMessages([]);
                setMobileShowChat(false);
                setConversations((prev) => {
                    const remaining = prev.filter((c) => c.topic !== targetTopic);
                    setActiveConvo(remaining[0] ?? null);
                    return remaining;
                });
                showToast('success', lang === 'sw' ? 'Chumba cha mazungumzo kimefutwa kabisa.' : 'Entire chat room deleted.');
            }
        } catch {
            showToast('error', 'Failed to complete room action.');
        } finally {
            setRoomActionBusy(false);
            setConfirmRoomAction(null);
            setRoomMenuOpen(false);
        }
    };

    // Search anyone on the system by name or phone number for 1-on-1 chat
    useEffect(() => {
        if (!isNewDirectModalOpen) return;
        const timer = setTimeout(async () => {
            setLoadingPeople(true);
            try {
                const res = await fetch(`/landlord/chat/people?q=${encodeURIComponent(peopleQuery.trim())}`, {
                    headers: getAuthHeaders(),
                    credentials: 'include',
                });
                if (res.ok) {
                    const data = (await res.json()) as ChatPeer[];
                    setPeopleResults(data);
                }
            } catch { } finally {
                setLoadingPeople(false);
            }
        }, 220);

        return () => clearTimeout(timer);
    }, [peopleQuery, isNewDirectModalOpen]);

    // Start or open a 1-on-1 direct chat with any user on the system
    const startDirectChatWithPerson = async (person: ChatPeer) => {
        try {
            const res = await fetch(`/landlord/chat/token?peer=${person.id}`, {
                headers: getAuthHeaders(),
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Could not start chat');
            const info = await res.json();
            const topic = String(info.topic);

            const newRow: ConversationRow = {
                id: `dm-${person.id}`,
                kind: 'direct',
                topic,
                house: person.property_name || null,
                updated_at: new Date().toISOString(),
                last_message: null,
                last_mine: false,
                unread: 0,
                peer: person,
            };

            setConversations((prev) => {
                const existing = prev.find((c) => c.topic === topic);
                if (existing) {
                    setActiveConvo(existing);
                    return prev;
                }
                setActiveConvo(newRow);
                return [newRow, ...prev];
            });
            setMobileShowChat(true);
            setIsNewDirectModalOpen(false);
        } catch {
            showToast('error', 'Could not open conversation with this user.');
        }
    };

    // Load Landlord's Own Tenants when opening the Create Group modal or Group Members modal
    const loadMyTenants = useCallback(async () => {
        setLoadingTenants(true);
        try {
            const res = await fetch('/landlord/chat/tenants', {
                headers: getAuthHeaders(),
                credentials: 'include',
            });
            if (res.ok) {
                const data = (await res.json()) as ChatPeer[];
                setMyTenants(data);
            }
        } catch { } finally {
            setLoadingTenants(false);
        }
    }, []);

    const handleOpenNewGroupModal = () => {
        setSelectedTenantIds([]);
        setGroupNameInput('');
        setTenantFilterQuery('');
        setGroupError(null);
        setIsNewGroupModalOpen(true);
        loadMyTenants();
    };

    const toggleSelectTenantForGroup = (id: number) => {
        setSelectedTenantIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    // Create a Group (Strictly with Landlord's Tenants Only)
    const handleCreateTenantGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = groupNameInput.trim();
        if (!trimmedName) {
            setGroupError(lang === 'sw' ? 'Tafadhali weka jina la kikundi.' : 'Please enter a group name.');
            return;
        }
        if (selectedTenantIds.length === 0) {
            setGroupError(
                lang === 'sw'
                    ? 'Chagua angalau mpangaji wako mmoja.'
                    : 'Please select at least one of your tenants.'
            );
            return;
        }

        setCreatingGroup(true);
        setGroupError(null);
        try {
            const res = await fetch('/landlord/chat/groups', {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({
                    name: trimmedName,
                    member_ids: selectedTenantIds,
                    tenants_only: true,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setGroupError(data?.message || 'Could not create group.');
                return;
            }

            const newGroupRow: ConversationRow = {
                id: data.group.slug,
                kind: 'group',
                topic: data.topic,
                house: null,
                updated_at: new Date().toISOString(),
                last_message: null,
                last_mine: false,
                unread: 0,
                group: {
                    slug: data.group.slug,
                    name: data.group.name,
                    members: data.group.members,
                    is_admin: true,
                },
            };

            setConversations((prev) => [newGroupRow, ...prev.filter((c) => c.topic !== newGroupRow.topic)]);
            setActiveConvo(newGroupRow);
            setMobileShowChat(true);
            setIsNewGroupModalOpen(false);
            showToast('success', lang === 'sw' ? `Kikundi "${trimmedName}" kimeundwa!` : `Group "${trimmedName}" created!`);
        } catch {
            setGroupError('Network error while creating group.');
        } finally {
            setCreatingGroup(false);
        }
    };

    // Open Group Members modal (and allow adding more of the landlord's own tenants)
    const handleOpenGroupMembers = async () => {
        if (!activeConvo?.group?.slug) return;
        setIsGroupMembersModalOpen(true);
        setAddingToGroupIds([]);
        setLoadingGroupMembers(true);
        loadMyTenants();
        try {
            const res = await fetch(`/landlord/chat/groups/${activeConvo.group.slug}`, {
                headers: getAuthHeaders(),
                credentials: 'include',
            });
            if (res.ok) {
                const members = await res.json();
                setGroupMembers(members);
            }
        } catch { } finally {
            setLoadingGroupMembers(false);
        }
    };

    const handleAddTenantsToExistingGroup = async () => {
        if (!activeConvo?.group?.slug || addingToGroupIds.length === 0) return;
        setAddingMembersBusy(true);
        try {
            const res = await fetch(`/landlord/chat/groups/${activeConvo.group.slug}/members`, {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({ member_ids: addingToGroupIds }),
            });
            const data = await res.json();
            if (res.ok) {
                showToast('success', lang === 'sw' ? 'Wapangaji wameongezwa kwenye kikundi!' : 'Tenants added to group!');
                setAddingToGroupIds([]);
                // Refresh group members list & count
                const mRes = await fetch(`/landlord/chat/groups/${activeConvo.group.slug}`, {
                    headers: getAuthHeaders(),
                    credentials: 'include',
                });
                if (mRes.ok) {
                    const updatedMembers = await mRes.json();
                    setGroupMembers(updatedMembers);
                }
                if (data.members_count) {
                    setConversations((prev) =>
                        prev.map((c) =>
                            c.topic === activeConvo.topic && c.group
                                ? { ...c, group: { ...c.group, members: data.members_count } }
                                : c
                        )
                    );
                    setActiveConvo((prev) =>
                        prev && prev.group ? { ...prev, group: { ...prev.group, members: data.members_count } } : prev
                    );
                }
            } else {
                showToast('error', data?.message || 'Could not add members.');
            }
        } catch {
            showToast('error', 'Failed to add tenants to group.');
        } finally {
            setAddingMembersBusy(false);
        }
    };

    // Filtered conversations in sidebar
    const filteredConversations = conversations.filter((c) => {
        if (convoFilter === 'unread' && (c.unread || 0) === 0) return false;
        if (convoFilter === 'groups' && c.kind !== 'group') return false;
        if (!sidebarSearch.trim()) return true;
        const q = sidebarSearch.toLowerCase();
        const title = (c.group?.name || c.peer?.fullname || '').toLowerCase();
        const phone = (c.peer?.phone || '').toLowerCase();
        const msg = (c.last_message || '').toLowerCase();
        return title.includes(q) || phone.includes(q) || msg.includes(q);
    });

    const activeTyping = activeConvo ? typingByTopic[activeConvo.topic] : undefined;
    const isActivePeerOnline =
        activeConvo?.kind === 'direct' && activeConvo.peer?.uuid
            ? onlineUuids.has(activeConvo.peer.uuid)
            : false;

    return (
        <div className="rounded-3xl border border-[#EBE7E1] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden flex flex-col lg:flex-row h-[calc(100dvh-7.5rem)] lg:h-[calc(100dvh-8.5rem)] min-h-[540px]">
            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        className={`fixed top-20 right-4 sm:right-6 z-50 rounded-2xl px-4 py-3 text-xs font-bold shadow-lg flex items-center gap-2 ${toast.type === 'success'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 text-white'
                            }`}
                    >
                        {toast.type === 'success' ? (
                            <Check className="h-4 w-4 shrink-0" />
                        ) : (
                            <AlertCircle className="h-4 w-4 shrink-0" />
                        )}
                        <span>{toast.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* LEFT SIDEBAR: CONVERSATIONS, PEOPLE SEARCH & GROUP CREATION */}
            <div
                className={`w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-[#EBE7E1] dark:border-slate-800 flex-col bg-[#FBF9F5]/60 dark:bg-slate-900/90 shrink-0 h-full ${
                    mobileShowChat && activeConvo ? 'hidden lg:flex' : 'flex'
                }`}
            >
                {/* Sidebar Header */}
                <div className="p-4 border-b border-[#EBE7E1] dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-extrabold text-[#12161A] dark:text-white">
                                    {lang === 'sw' ? 'JUMBE' : 'MESSAGES'}
                                </h2>
                                <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${socketConnected
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                                        }`}
                                    title={socketConnected ? 'Phoenix WebSocket Connected' : 'Connecting to Phoenix WebSocket'}
                                >
                                    {/* <span
                                        className={`h-1.5 w-1.5 rounded-full ${socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                                            }`}
                                    />
                                    {socketConnected ? 'Phoenix Live' : 'Connecting'} */}
                                </span>
                            </div>
                            <p className="text-[11px] text-[#706861] dark:text-slate-400">
                                {onlineUuids.size} {lang === 'sw' ? 'watumiaji mtandaoni sasa' : 'users active right now'}
                            </p>
                        </div>

                        {/* Action Buttons: New Direct Chat (Anyone) & New Group (Tenants Only) */}
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => {
                                    setPeopleQuery('');
                                    setIsNewDirectModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-teal-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-slate-800 dark:hover:bg-teal-500 transition-all cursor-pointer shadow-2xs"
                                title={lang === 'sw' ? 'Tafuta mtu yeyote kwa jina au simu' : 'Chat with anyone by name or phone'}
                            >
                                <Plus className="h-3.5 w-3.5" />
                                <span>{lang === 'sw' ? 'Gumzo Jipya' : 'New Chat'}</span>
                            </button>
                            <button
                                onClick={handleOpenNewGroupModal}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-[11px] font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs"
                                title={lang === 'sw' ? 'Unda kikundi cha wapangaji wako' : 'Create group with your tenants'}
                            >
                                <Users className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                                <span>{lang === 'sw' ? 'Kikundi' : 'Group'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Search Conversations or Find People */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text"
                            value={sidebarSearch}
                            onChange={(e) => setSidebarSearch(e.target.value)}
                            placeholder={
                                lang === 'sw'
                                    ? 'Tafuta mazungumzo au namba ya simu...'
                                    : 'Filter chats by name, phone, or message...'
                            }
                            className="w-full rounded-xl border border-[#EBE7E1] dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-8 py-2 text-xs text-[#12161A] dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-slate-900 dark:focus:border-teal-500"
                        />
                        {sidebarSearch && (
                            <button
                                onClick={() => setSidebarSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1">
                            {[
                                { id: 'all', label: lang === 'sw' ? 'Zote' : 'All' },
                                { id: 'unread', label: lang === 'sw' ? 'Hazijasomwa' : 'Unread' },
                                { id: 'groups', label: lang === 'sw' ? 'Vikundi' : 'Groups' },
                            ].map((pill) => (
                                <button
                                    key={pill.id}
                                    onClick={() => setConvoFilter(pill.id as any)}
                                    className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all cursor-pointer ${convoFilter === pill.id
                                        ? 'bg-slate-900 text-white dark:bg-teal-600'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                                        }`}
                                >
                                    {pill.label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => {
                                setPeopleQuery(sidebarSearch);
                                setIsNewDirectModalOpen(true);
                            }}
                            className="text-[11px] font-bold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
                        >
                            {lang === 'sw' ? 'Tafuta Mtu Yeyote →' : 'Find Anyone →'}
                        </button>
                    </div>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/70">
                    {loadingConvos ? (
                        <div className="p-6 space-y-3">
                            {[1, 2, 3, 4].map((n) => (
                                <div
                                    key={n}
                                    className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"
                                />
                            ))}
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="p-8 text-center space-y-3">
                            <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                                <MessageSquare className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    {lang === 'sw' ? 'Hakuna mazungumzo yaliyopatikana' : 'No conversations yet'}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {lang === 'sw'
                                        ? 'Tafuta mtu yeyote kwa jina au namba ya simu kuanza mazungumzo, au unda kikundi cha wapangaji wako.'
                                        : 'Search anyone on the system by name or phone number, or create a group with your tenants.'}
                                </p>
                            </div>
                            <div className="flex justify-center gap-2 pt-1">
                                <button
                                    onClick={() => setIsNewDirectModalOpen(true)}
                                    className="rounded-xl bg-slate-900 dark:bg-teal-600 px-3.5 py-2 text-xs font-bold text-white cursor-pointer"
                                >
                                    {lang === 'sw' ? 'Tafuta Mtu' : 'Search People'}
                                </button>
                                <button
                                    onClick={handleOpenNewGroupModal}
                                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                                >
                                    {lang === 'sw' ? 'Unda Kikundi' : 'New Tenant Group'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        filteredConversations.map((c) => {
                            const isSelected = activeConvo?.topic === c.topic;
                            const isGroup = c.kind === 'group';
                            const title = isGroup ? c.group?.name || 'Group' : c.peer?.fullname || 'User';
                            const isOnline = !isGroup && c.peer?.uuid ? onlineUuids.has(c.peer.uuid) : false;
                            const typingInfo = typingByTopic[c.topic];

                            return (
                                <button
                                    key={c.topic}
                                    onClick={() => {
                                        setActiveConvo(c);
                                        setMobileShowChat(true);
                                    }}
                                    className={`w-full text-left p-3.5 transition-all flex items-center gap-3 cursor-pointer ${isSelected
                                        ? 'bg-slate-900 text-white dark:bg-slate-800'
                                        : 'hover:bg-white dark:hover:bg-slate-800/60 text-[#12161A] dark:text-slate-100'
                                        }`}
                                >
                                    {/* Avatar with Active/Online Indicator */}
                                    <div className="relative shrink-0">
                                        {isGroup ? (
                                            <div
                                                className={`h-11 w-11 rounded-2xl flex items-center justify-center font-bold text-sm ${isSelected
                                                    ? 'bg-teal-500 text-white'
                                                    : 'bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                                                    }`}
                                            >
                                                <Users className="h-5 w-5" />
                                            </div>
                                        ) : c.peer?.profile_image ? (
                                            <img
                                                src={c.peer.profile_image}
                                                alt={title}
                                                className="h-11 w-11 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                                            />
                                        ) : (
                                            <div
                                                className={`h-11 w-11 rounded-full flex items-center justify-center font-extrabold text-sm ${isSelected
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white'
                                                    }`}
                                            >
                                                {title.charAt(0).toUpperCase()}
                                            </div>
                                        )}

                                        {!isGroup && (
                                            <span
                                                className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 ${isSelected ? 'border-slate-900' : 'border-white dark:border-slate-900'
                                                    } ${isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                                title={isOnline ? 'Active / Online' : 'Offline'}
                                            />
                                        )}
                                    </div>

                                    {/* Title, Typing / Preview & Timestamp */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span className="text-xs font-extrabold truncate">{title}</span>
                                                {isGroup && (
                                                    <span
                                                        className={`rounded-md px-1.5 py-0.2 text-[9px] font-bold uppercase ${isSelected
                                                            ? 'bg-white/20 text-white'
                                                            : 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                                                            }`}
                                                    >
                                                        {c.group?.members || 1}
                                                    </span>
                                                )}
                                            </div>
                                            <span
                                                className={`text-[10px] shrink-0 ${isSelected ? 'text-slate-300' : 'text-slate-400'
                                                    }`}
                                            >
                                                {formatMessageTime(c.updated_at)}
                                            </span>
                                        </div>

                                        <div className="mt-1 flex items-center justify-between gap-2">
                                            {typingInfo ? (
                                                <span
                                                    className={`text-[11px] font-bold italic truncate flex items-center gap-1 ${isSelected ? 'text-emerald-300' : 'text-emerald-600 dark:text-emerald-400'
                                                        }`}
                                                >
                                                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-current animate-ping" />
                                                    {isGroup
                                                        ? `${typingInfo.name.split(' ')[0]} ${lang === 'sw' ? 'anaandika...' : 'is typing...'}`
                                                        : lang === 'sw'
                                                            ? 'anaandika...'
                                                            : 'typing...'}
                                                </span>
                                            ) : (
                                                <p
                                                    className={`text-[11px] truncate ${isSelected
                                                        ? 'text-slate-300'
                                                        : c.unread > 0
                                                            ? 'font-bold text-slate-900 dark:text-white'
                                                            : 'text-slate-500 dark:text-slate-400'
                                                        }`}
                                                >
                                                    {c.last_message
                                                        ? `${c.last_mine ? (lang === 'sw' ? 'Wewe: ' : 'You: ') : isGroup && c.last_author ? `${c.last_author.split(' ')[0]}: ` : ''}${c.last_message}`
                                                        : c.house || (lang === 'sw' ? 'Anza mazungumzo...' : 'Start conversation...')}
                                                </p>
                                            )}

                                            {c.unread > 0 && (
                                                <span className="shrink-0 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-extrabold text-white">
                                                    {c.unread}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* RIGHT PANE: ACTIVE CONVERSATION STREAM */}
            <div
                className={`flex-1 flex-col bg-white dark:bg-slate-950 min-w-0 h-full ${
                    mobileShowChat && activeConvo ? 'flex' : 'hidden lg:flex'
                }`}
            >
                {!activeConvo ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                        <div className="h-16 w-16 rounded-3xl bg-[#FBF9F5] dark:bg-slate-900 border border-[#EBE7E1] dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-xs">
                            <MessageSquare className="h-8 w-8" />
                        </div>
                        <div className="max-w-md space-y-1.5">
                            <h3 className="text-lg font-extrabold text-[#12161A] dark:text-white">
                                {lang === 'sw'
                                    ? 'Chagua Mazungumzo au Tafuta Mtu Yeyote'
                                    : 'Select a Conversation or Start a New Chat'}
                            </h3>
                            <p className="text-xs text-[#706861] dark:text-slate-400 leading-relaxed">
                                {lang === 'sw'
                                    ? 'Chati moja kwa moja kupitia Elixir Phoenix WebSocket. Unaweza kumtafuta mtu yeyote kwenye mfumo kwa jina au namba ya simu, au kuunda kikundi cha wapangaji wako pekee.'
                                    : 'Powered by Elixir Phoenix Channels. Search anyone on the system by name or phone number for 1-on-1 chat, or create a group room exclusively for your registered tenants.'}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                            <button
                                onClick={() => setIsNewDirectModalOpen(true)}
                                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 dark:bg-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-all cursor-pointer"
                            >
                                <Search className="h-4 w-4" />
                                <span>{lang === 'sw' ? 'Tafuta kwa Jina au Simu' : 'Search Name or Phone'}</span>
                            </button>
                            <button
                                onClick={handleOpenNewGroupModal}
                                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
                            >
                                <Users className="h-4 w-4 text-teal-600" />
                                <span>{lang === 'sw' ? 'Unda Kikundi cha Wapangaji' : 'Create Tenant Group'}</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Conversation Top Bar */}
                        <div className="min-h-16 sm:h-18 px-3 sm:px-6 py-2 border-b border-[#EBE7E1] dark:border-slate-800 flex items-center justify-between gap-2 sm:gap-4 bg-white dark:bg-slate-900">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                {/* Mobile Back to Conversations Button */}
                                <button
                                    type="button"
                                    onClick={() => setMobileShowChat(false)}
                                    className="flex lg:hidden h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 shrink-0 cursor-pointer"
                                    title={lang === 'sw' ? 'Rudi kwenye orodha' : 'Back to conversations'}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                {activeConvo.kind === 'group' ? (
                                    <div className="h-11 w-11 rounded-2xl bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-300 shrink-0">
                                        <Users className="h-5 w-5" />
                                    </div>
                                ) : (
                                    <div className="relative shrink-0">
                                        {activeConvo.peer?.profile_image ? (
                                            <img
                                                src={activeConvo.peer.profile_image}
                                                alt={activeConvo.peer.fullname}
                                                className="h-11 w-11 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                                            />
                                        ) : (
                                            <div className="h-11 w-11 rounded-full bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center font-extrabold text-sm">
                                                {(activeConvo.peer?.fullname || 'U').charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <span
                                            className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900 ${isActivePeerOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                                                }`}
                                        />
                                    </div>
                                )}

                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-extrabold text-[#12161A] dark:text-white truncate">
                                            {activeConvo.kind === 'group'
                                                ? activeConvo.group?.name
                                                : activeConvo.peer?.fullname}
                                        </h3>
                                        {activeConvo.kind === 'direct' && (
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${isActivePeerOnline
                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}
                                            >
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${isActivePeerOnline ? 'bg-emerald-500' : 'bg-slate-400'
                                                        }`}
                                                />
                                                {isActivePeerOnline
                                                    ? lang === 'sw'
                                                        ? 'Yupo Mtandaoni'
                                                        : 'Active Now'
                                                    : lang === 'sw'
                                                        ? 'Hayupo Mtandaoni'
                                                        : 'Offline'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Subtitle: Typing Indicator OR Phone / Group member count */}
                                    <div className="text-[11px] text-[#706861] dark:text-slate-400 truncate">
                                        {activeTyping ? (
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                                <span className="inline-flex gap-0.5">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" />
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:150ms]" />
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:300ms]" />
                                                </span>
                                                <span>
                                                    {activeConvo.kind === 'group'
                                                        ? `${activeTyping.name} ${lang === 'sw' ? 'anaandika...' : 'is typing...'}`
                                                        : lang === 'sw'
                                                            ? 'Anaandika ujumbe...'
                                                            : 'Typing a message...'}
                                                </span>
                                            </span>
                                        ) : activeConvo.kind === 'group' ? (
                                            <span>
                                                {activeConvo.group?.members || 1}{' '}
                                                {lang === 'sw' ? 'wanachama kwenye kikundi' : 'members in group'}
                                            </span>
                                        ) : (
                                            <span>
                                                {activeConvo.peer?.phone ? `${activeConvo.peer.phone} • ` : ''}
                                                {activeConvo.house || (activeConvo.peer?.role === 'landlord' ? 'Landlord' : 'Resident / User')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Header Controls: Group Members (if group), Clear Chat, Delete Whole Room */}
                            <div className="flex items-center gap-2 shrink-0">
                                {activeConvo.kind === 'group' && (
                                    <button
                                        onClick={handleOpenGroupMembers}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FBF9F5] dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 transition-all cursor-pointer"
                                        title="View Group Members or Add Your Tenants"
                                    >
                                        <UserPlus className="h-3.5 w-3.5 text-teal-600" />
                                        <span className="hidden sm:inline">
                                            {lang === 'sw' ? 'Wanakikundi / Ongeza Mpangaji' : 'Members / + Tenant'}
                                        </span>
                                    </button>
                                )}

                                <button
                                    onClick={() => setConfirmRoomAction('clear')}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
                                    title={lang === 'sw' ? 'Futa ujumbe wote kwenye chumba hiki' : 'Clear all messages in this chat'}
                                >
                                    <Eraser className="h-3.5 w-3.5 text-amber-600" />
                                    <span className="hidden md:inline">
                                        {lang === 'sw' ? 'Safisha Gumzo' : 'Clear Chat'}
                                    </span>
                                </button>

                                <button
                                    onClick={() => setConfirmRoomAction('delete')}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/40 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-all cursor-pointer"
                                    title={lang === 'sw' ? 'Futa chumba chote cha mazungumzo' : 'Delete entire chat room'}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span className="hidden md:inline">
                                        {lang === 'sw' ? 'Futa Chumba' : 'Delete Room'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Messages Scroll Area */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#FBF9F5]/40 dark:bg-slate-950">
                            {hasOlder && (
                                <div className="text-center pb-2">
                                    <button
                                        onClick={handleLoadOlder}
                                        disabled={loadingOlder}
                                        className="rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer shadow-2xs"
                                    >
                                        {loadingOlder
                                            ? lang === 'sw'
                                                ? 'Inapakia...'
                                                : 'Loading...'
                                            : lang === 'sw'
                                                ? 'Pakia ujumbe wa zamani'
                                                : 'Load older messages'}
                                    </button>
                                </div>
                            )}

                            {loadingMessages ? (
                                <div className="space-y-3 py-8">
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className={`h-14 w-64 rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse ${i % 2 === 0 ? 'ml-auto' : ''
                                                }`}
                                        />
                                    ))}
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="py-16 text-center space-y-2">
                                    <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-400 flex items-center justify-center mx-auto">
                                        <MessageSquare className="h-5 w-5" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {lang === 'sw' ? 'Sema Habari 👋' : 'Say Habari 👋'}
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                                        {lang === 'sw'
                                            ? 'Ujumbe unaotumwa hapa unawafikia papo hapo kupitia Elixir Phoenix.'
                                            : 'Messages sent here are delivered instantly over Elixir Phoenix WebSocket.'}
                                    </p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMine = msg.author_id === myUuid;
                                    const isDeleted = Boolean(msg.deleted_at);
                                    const canDelete =
                                        !isDeleted &&
                                        (isMine || (activeConvo.kind === 'group' && activeConvo.group?.is_admin));

                                    return (
                                        <div
                                            key={msg.id}
                                            className={`group flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                                        >
                                            {activeConvo.kind === 'group' && !isMine && (
                                                <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 mb-1 px-1">
                                                    {msg.author_name}
                                                </span>
                                            )}

                                            <div className="flex items-center gap-1.5 max-w-[82%] sm:max-w-[70%]">
                                                {/* Action buttons (Reply, Edit, Delete Message) on left for own messages */}
                                                {isMine && !isDeleted && (
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => setReplyingTo(msg)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                                            title="Reply"
                                                        >
                                                            <Reply className="h-3.5 w-3.5" />
                                                        </button>
                                                        {msg.seq && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setEditingMessage(msg);
                                                                    setComposerText(msg.text);
                                                                }}
                                                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                                                title="Edit message"
                                                            >
                                                                <Edit3 className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                        {canDelete && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteSingleMessage(msg)}
                                                                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                                                                title={lang === 'sw' ? 'Futa ujumbe huu' : 'Delete message'}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Message Bubble */}
                                                <div
                                                    className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-2xs ${isDeleted
                                                        ? 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 italic border border-slate-200 dark:border-slate-800'
                                                        : isMine
                                                            ? 'bg-slate-900 dark:bg-teal-600 text-white rounded-br-xs'
                                                            : 'bg-white dark:bg-slate-900 text-[#12161A] dark:text-slate-100 border border-[#EBE7E1] dark:border-slate-800 rounded-bl-xs'
                                                        }`}
                                                >
                                                    {msg.reply_to && !isDeleted && (
                                                        <div
                                                            className={`mb-1.5 rounded-lg px-2.5 py-1 text-[10px] border-l-2 ${isMine
                                                                ? 'bg-white/10 border-teal-300 text-slate-200'
                                                                : 'bg-slate-50 dark:bg-slate-800 border-teal-600 text-slate-600 dark:text-slate-300'
                                                                }`}
                                                        >
                                                            <span className="font-bold block">{msg.reply_to.author_name}</span>
                                                            <span className="line-clamp-1">{msg.reply_to.text}</span>
                                                        </div>
                                                    )}

                                                    {isDeleted ? (
                                                        <span>
                                                            {lang === 'sw'
                                                                ? 'Ujumbe huu ulifutwa'
                                                                : 'This message was deleted'}
                                                        </span>
                                                    ) : (
                                                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                                                    )}

                                                    <div
                                                        className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isMine && !isDeleted
                                                            ? 'text-slate-300 dark:text-teal-100'
                                                            : 'text-slate-400'
                                                            }`}
                                                    >
                                                        {msg.edited_at && !isDeleted && (
                                                            <span>({lang === 'sw' ? 'imehaririwa' : 'edited'})</span>
                                                        )}
                                                        <span>{formatMessageTime(msg.timestamp)}</span>
                                                        {isMine && !isDeleted && (
                                                            <span>
                                                                {msg.sending ? (
                                                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                                                ) : msg.read_at ? (
                                                                    <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                                                                ) : (
                                                                    <Check className="h-3.5 w-3.5" />
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action buttons for peer messages (Reply + Admin Delete) */}
                                                {!isMine && !isDeleted && (
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => setReplyingTo(msg)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                                            title="Reply"
                                                        >
                                                            <Reply className="h-3.5 w-3.5" />
                                                        </button>
                                                        {canDelete && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteSingleMessage(msg)}
                                                                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                                                                title="Delete message (Group Admin)"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}

                            {/* Live Typing Bubble at Bottom of Stream */}
                            {activeTyping && (
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pl-1">
                                    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-[#EBE7E1] dark:border-slate-800 px-3.5 py-2 inline-flex items-center gap-2 shadow-2xs">
                                        <span className="inline-flex gap-1">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" />
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:150ms]" />
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:300ms]" />
                                        </span>
                                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                            {activeTyping.name} {lang === 'sw' ? 'anaandika...' : 'is typing...'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Reply or Edit Banner above Composer */}
                        {(replyingTo || editingMessage) && (
                            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                    {editingMessage ? (
                                        <Edit3 className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                    ) : (
                                        <Reply className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                                    )}
                                    <div className="truncate">
                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                            {editingMessage
                                                ? lang === 'sw'
                                                    ? 'Unahariri ujumbe'
                                                    : 'Editing message'
                                                : `${lang === 'sw' ? 'Unamjibu' : 'Replying to'} ${replyingTo?.author_name}`}
                                        </span>
                                        <span className="ml-2 text-slate-500 dark:text-slate-400 truncate">
                                            {(editingMessage || replyingTo)?.text}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setReplyingTo(null);
                                        if (editingMessage) {
                                            setEditingMessage(null);
                                            setComposerText('');
                                        }
                                    }}
                                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        {/* Message Composer */}
                        <form
                            onSubmit={handleSendMessage}
                            className="p-3 sm:p-4 border-t border-[#EBE7E1] dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2.5"
                        >
                            <input
                                type="text"
                                value={composerText}
                                onChange={(e) => handleComposerChange(e.target.value)}
                                placeholder={
                                    lang === 'sw'
                                        ? 'Andika ujumbe hapa...'
                                        : 'Write a real-time message...'
                                }
                                className="flex-1 rounded-2xl border border-[#EBE7E1] dark:border-slate-700 bg-[#FBF9F5] dark:bg-slate-800 px-4 py-2.5 text-xs text-[#12161A] dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-slate-900 dark:focus:border-teal-500"
                            />
                            <button
                                type="submit"
                                disabled={!composerText.trim()}
                                className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-900 dark:bg-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 dark:hover:bg-teal-500 disabled:opacity-40 transition-all cursor-pointer shrink-0"
                            >
                                <Send className="h-3.5 w-3.5" />
                                <span>{editingMessage ? (lang === 'sw' ? 'Hifadhi' : 'Update') : lang === 'sw' ? 'Tuma' : 'Send'}</span>
                            </button>
                        </form>
                    </>
                )}
            </div>

            {/* MODAL 1: SEARCH ANYONE ON THE SYSTEM BY NAME OR PHONE NUMBER (1-ON-1 CHAT) */}
            <AnimatePresence>
                {isNewDirectModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                        {lang === 'sw'
                                            ? 'Anza Mazungumzo na Mtu Yeyote'
                                            : 'Chat with Anyone on the System'}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        {lang === 'sw'
                                            ? 'Tafuta mtumiaji yeyote kwa jina lake au namba ya simu'
                                            : 'Search any user across Panga Pangisha by name or phone number'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsNewDirectModalOpen(false)}
                                    className="rounded-full p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        autoFocus
                                        value={peopleQuery}
                                        onChange={(e) => setPeopleQuery(e.target.value)}
                                        placeholder={
                                            lang === 'sw'
                                                ? 'Andika jina (mf. Amina) au namba ya simu (mf. 0700...)'
                                                : 'Search by name (e.g. Amina, Juma) or phone (+2557... / 07...)'
                                        }
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:border-slate-900 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2">
                                {loadingPeople ? (
                                    <div className="p-6 text-center text-xs text-slate-400">
                                        {lang === 'sw' ? 'Inatafuta watumiaji...' : 'Searching users...'}
                                    </div>
                                ) : peopleResults.length === 0 ? (
                                    <div className="p-8 text-center space-y-1">
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            {lang === 'sw' ? 'Hakuna mtumiaji aliyepatikana' : 'No matching users found'}
                                        </p>
                                        <p className="text-[11px] text-slate-400">
                                            {lang === 'sw'
                                                ? 'Jaribu kuandika jina lingine au namba ya simu.'
                                                : 'Try searching another name or phone number.'}
                                        </p>
                                    </div>
                                ) : (
                                    peopleResults.map((p) => {
                                        const isOnline = onlineUuids.has(p.uuid);
                                        return (
                                            <button
                                                key={p.id}
                                                onClick={() => startDirectChatWithPerson(p)}
                                                className="w-full flex items-center justify-between gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors text-left cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="relative shrink-0">
                                                        <div className="h-10 w-10 rounded-full bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center font-bold text-xs">
                                                            {p.fullname.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span
                                                            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                                                                }`}
                                                        />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                                {p.fullname}
                                                            </span>
                                                            {p.is_my_tenant && (
                                                                <span className="rounded-full bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                                                    {lang === 'sw' ? 'Mpangaji Wangu' : 'My Tenant'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                            {p.phone && <span>{p.phone}</span>}
                                                            <span>•</span>
                                                            <span className="capitalize">{p.role || 'user'}</span>
                                                            {isOnline && (
                                                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                                                    • Active
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <span className="rounded-xl bg-slate-900 dark:bg-teal-600 px-3 py-1.5 text-[11px] font-bold text-white shrink-0">
                                                    {lang === 'sw' ? 'Chati' : 'Message'}
                                                </span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL 2: CREATE GROUP (STRICTLY LANDLORD'S OWN TENANTS ONLY) */}
            <AnimatePresence>
                {isNewGroupModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
                        >
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                            {lang === 'sw'
                                                ? 'Unda Kikundi cha Wapangaji Wako'
                                                : 'Create Tenant Group Chat'}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {lang === 'sw'
                                                ? 'Wapangaji wa nyumba zako pekee ndio wanaoweza kuongezwa kwenye kikundi'
                                                : 'Only your registered tenants can be added to a group'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsNewGroupModalOpen(false)}
                                    className="rounded-full p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateTenantGroup} className="p-5 space-y-4 flex-1 overflow-y-auto">
                                {groupError && (
                                    <div className="rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300">
                                        {groupError}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        {lang === 'sw' ? 'Jina la Kikundi' : 'Group Name'}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={groupNameInput}
                                        onChange={(e) => setGroupNameInput(e.target.value)}
                                        placeholder={
                                            lang === 'sw'
                                                ? 'Mf. Wapangaji wa Mikocheni Villa'
                                                : 'E.g. Mikocheni Apartments Residents'
                                        }
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:bg-white focus:outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            {lang === 'sw'
                                                ? `Chagua Wapangaji Wako (${selectedTenantIds.length} wamechaguliwa)`
                                                : `Select Your Tenants (${selectedTenantIds.length} selected)`}
                                        </label>
                                        {myTenants.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSelectedTenantIds(
                                                        selectedTenantIds.length === myTenants.length
                                                            ? []
                                                            : myTenants.map((t) => t.id)
                                                    )
                                                }
                                                className="text-[11px] font-bold text-teal-600 hover:underline cursor-pointer"
                                            >
                                                {selectedTenantIds.length === myTenants.length
                                                    ? lang === 'sw'
                                                        ? 'Ondoa Wote'
                                                        : 'Deselect All'
                                                    : lang === 'sw'
                                                        ? 'Chagua Wapangaji Wote'
                                                        : 'Select All Tenants'}
                                            </button>
                                        )}
                                    </div>

                                    <input
                                        type="text"
                                        value={tenantFilterQuery}
                                        onChange={(e) => setTenantFilterQuery(e.target.value)}
                                        placeholder={
                                            lang === 'sw'
                                                ? 'Chuja wapangaji wako kwa jina au nyumba...'
                                                : 'Filter your tenants by name, phone, or property...'
                                        }
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                                    />

                                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800">
                                        {loadingTenants ? (
                                            <div className="p-6 text-center text-xs text-slate-400">
                                                {lang === 'sw' ? 'Inapakia wapangaji wako...' : 'Loading your tenants...'}
                                            </div>
                                        ) : myTenants.length === 0 ? (
                                            <div className="p-6 text-center text-xs text-slate-500">
                                                {lang === 'sw'
                                                    ? 'Bado huna wapangaji waliosajiliwa kwenye nyumba zako.'
                                                    : 'You do not have any registered tenants on your properties yet.'}
                                            </div>
                                        ) : (
                                            myTenants
                                                .filter((t) => {
                                                    if (!tenantFilterQuery.trim()) return true;
                                                    const q = tenantFilterQuery.toLowerCase();
                                                    return (
                                                        t.fullname.toLowerCase().includes(q) ||
                                                        (t.phone || '').toLowerCase().includes(q) ||
                                                        (t.property_name || '').toLowerCase().includes(q) ||
                                                        (t.unit || '').toLowerCase().includes(q)
                                                    );
                                                })
                                                .map((tenant) => {
                                                    const checked = selectedTenantIds.includes(tenant.id);
                                                    const isOnline = onlineUuids.has(tenant.uuid);
                                                    return (
                                                        <label
                                                            key={tenant.id}
                                                            onClick={() => toggleSelectTenantForGroup(tenant.id)}
                                                            className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="relative shrink-0">
                                                                    <div className="h-9 w-9 rounded-full bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center font-bold text-xs">
                                                                        {tenant.fullname.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <span
                                                                        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                                                                            }`}
                                                                    />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                                        {tenant.fullname}
                                                                    </p>
                                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                                                        {tenant.property_name} • {tenant.unit} ({tenant.phone})
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div
                                                                className={`h-5 w-5 rounded-md flex items-center justify-center border ${checked
                                                                    ? 'bg-teal-600 border-teal-600 text-white'
                                                                    : 'border-slate-300 dark:border-slate-600'
                                                                    }`}
                                                            >
                                                                {checked && <Check className="h-3.5 w-3.5" />}
                                                            </div>
                                                        </label>
                                                    );
                                                })
                                        )}
                                    </div>
                                </div>

                                <div className="pt-2 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsNewGroupModalOpen(false)}
                                        className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                                    >
                                        {lang === 'sw' ? 'Ghairi' : 'Cancel'}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creatingGroup || selectedTenantIds.length === 0}
                                        className="rounded-xl bg-slate-900 dark:bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                                    >
                                        {creatingGroup
                                            ? lang === 'sw'
                                                ? 'Inaunda...'
                                                : 'Creating...'
                                            : lang === 'sw'
                                                ? 'Unda Kikundi'
                                                : 'Create Group'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL 3: GROUP MEMBERS & ADD MORE OF LANDLORD'S TENANTS */}
            <AnimatePresence>
                {isGroupMembersModalOpen && activeConvo?.group && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                        {activeConvo.group.name} • {lang === 'sw' ? 'Wanakikundi' : 'Group Members'}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {groupMembers.length} {lang === 'sw' ? 'wanachama' : 'members'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsGroupMembersModalOpen(false)}
                                    className="rounded-full p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="p-5 overflow-y-auto space-y-5 flex-1">
                                {/* Current Group Members */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        {lang === 'sw' ? 'Wanachama wa Sasa' : 'Current Members'}
                                    </h4>
                                    {loadingGroupMembers ? (
                                        <p className="text-xs text-slate-400">Loading members...</p>
                                    ) : (
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800">
                                            {groupMembers.map((m) => {
                                                const online = onlineUuids.has(m.uuid);
                                                return (
                                                    <div
                                                        key={m.uuid}
                                                        className="p-3 flex items-center justify-between gap-3"
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="relative">
                                                                <div className="h-8 w-8 rounded-full bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center font-bold text-xs">
                                                                    {m.fullname.charAt(0).toUpperCase()}
                                                                </div>
                                                                <span
                                                                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white ${online ? 'bg-emerald-500' : 'bg-slate-300'
                                                                        }`}
                                                                />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                                    {m.fullname} {m.me ? '(You)' : ''}
                                                                </p>
                                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                                    {online ? 'Active now' : 'Offline'}
                                                                    {m.property_name ? ` • ${m.property_name} (${m.unit})` : ''}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {m.admin && (
                                                            <span className="rounded-full bg-teal-50 dark:bg-teal-950 px-2.5 py-0.5 text-[10px] font-bold text-teal-700 dark:text-teal-300">
                                                                Admin
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Add Additional Tenants of this Landlord */}
                                {(() => {
                                    const existingUuids = new Set(groupMembers.map((m) => m.uuid));
                                    const availableTenants = myTenants.filter((t) => !existingUuids.has(t.uuid));
                                    if (availableTenants.length === 0) return null;

                                    return (
                                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                                {lang === 'sw'
                                                    ? 'Ongeza Wapangaji Wako Wengine'
                                                    : 'Add More of Your Tenants'}
                                            </h4>
                                            <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800">
                                                {availableTenants.map((t) => {
                                                    const checked = addingToGroupIds.includes(t.id);
                                                    return (
                                                        <label
                                                            key={t.id}
                                                            onClick={() =>
                                                                setAddingToGroupIds((prev) =>
                                                                    prev.includes(t.id)
                                                                        ? prev.filter((x) => x !== t.id)
                                                                        : [...prev, t.id]
                                                                )
                                                            }
                                                            className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                                                        >
                                                            <div>
                                                                <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                                    {t.fullname}
                                                                </p>
                                                                <p className="text-[11px] text-slate-500">
                                                                    {t.property_name} • {t.unit}
                                                                </p>
                                                            </div>
                                                            <div
                                                                className={`h-5 w-5 rounded-md flex items-center justify-center border ${checked
                                                                    ? 'bg-teal-600 border-teal-600 text-white'
                                                                    : 'border-slate-300 dark:border-slate-600'
                                                                    }`}
                                                            >
                                                                {checked && <Check className="h-3.5 w-3.5" />}
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                            {addingToGroupIds.length > 0 && (
                                                <button
                                                    type="button"
                                                    disabled={addingMembersBusy}
                                                    onClick={handleAddTenantsToExistingGroup}
                                                    className="w-full rounded-xl bg-slate-900 dark:bg-teal-600 py-2.5 text-xs font-bold text-white cursor-pointer"
                                                >
                                                    {addingMembersBusy
                                                        ? 'Adding...'
                                                        : `Add ${addingToGroupIds.length} Selected Tenant(s)`}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL 4: CONFIRM CLEAR CHAT OR DELETE WHOLE ROOM */}
            <AnimatePresence>
                {confirmRoomAction && activeConvo && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center shrink-0">
                                    <Trash2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                        {confirmRoomAction === 'delete'
                                            ? lang === 'sw'
                                                ? 'Futa Chumba Chote cha Mazungumzo?'
                                                : 'Delete Entire Chat Room?'
                                            : lang === 'sw'
                                                ? 'Safisha Ujumbe Wote?'
                                                : 'Clear All Messages in Chat?'}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        {confirmRoomAction === 'delete'
                                            ? lang === 'sw'
                                                ? 'Hatua hii itafuta chumba hiki cha mazungumzo na ujumbe wake wote.'
                                                : 'This will permanently remove the entire conversation room and all its messages.'
                                            : lang === 'sw'
                                                ? 'Ujumbe wote katika chumba hiki utafutwa.'
                                                : 'All messages inside this conversation will be cleared.'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setConfirmRoomAction(null)}
                                    className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                                >
                                    {lang === 'sw' ? 'Ghairi' : 'Cancel'}
                                </button>
                                <button
                                    type="button"
                                    disabled={roomActionBusy}
                                    onClick={() => handleExecuteRoomAction(confirmRoomAction)}
                                    className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white cursor-pointer"
                                >
                                    {roomActionBusy
                                        ? lang === 'sw'
                                            ? 'Inafuta...'
                                            : 'Processing...'
                                        : confirmRoomAction === 'delete'
                                            ? lang === 'sw'
                                                ? 'Ndiyo, Futa Chumba Chote'
                                                : 'Yes, Delete Whole Room'
                                            : lang === 'sw'
                                                ? 'Ndiyo, Safisha Ujumbe'
                                                : 'Yes, Clear Messages'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

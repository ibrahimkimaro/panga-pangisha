/**
 * Lightweight, zero-dependency Elixir Phoenix Channels V2 WebSocket Client for React/TypeScript.
 * Speaks the native Phoenix 1.7 V2 wire protocol: [join_ref, ref, topic, event, payload].
 */

export type PhoenixPayload = Record<string, any>;
export type EventCallback = (payload: PhoenixPayload) => void;

interface PendingReply {
    resolve: (res: PhoenixPayload) => void;
    reject: (err: any) => void;
    timer: ReturnType<typeof setTimeout>;
}

export function resolveBrowserWsUrl(rawUrl?: string): string {
    const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
    const proto = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss' : 'ws';
    if (!rawUrl) {
        return `${proto}://${host}:4100/socket`;
    }
    // Replace Android emulator host 10.0.2.2 with the browser's current hostname
    let normalized = rawUrl.replace('10.0.2.2', host);
    if (normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
    }
    return normalized;
}

export class PhoenixChannel {
    public readonly topic: string;
    public readonly params: PhoenixPayload;
    private socket: PhoenixSocketClient;
    public joinRef: string | null = null;
    private listeners: Map<string, Set<EventCallback>> = new Map();
    public joined = false;

    constructor(socket: PhoenixSocketClient, topic: string, params: PhoenixPayload = {}) {
        this.socket = socket;
        this.topic = topic;
        this.params = params;
    }

    public on(event: string, callback: EventCallback): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);
        return () => {
            this.listeners.get(event)?.delete(callback);
        };
    }

    public off(event: string, callback?: EventCallback): void {
        if (!callback) {
            this.listeners.delete(event);
        } else {
            this.listeners.get(event)?.delete(callback);
        }
    }

    public trigger(event: string, payload: PhoenixPayload): void {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach((cb) => {
                try {
                    cb(payload);
                } catch (err) {
                    console.error(`[PhoenixChannel:${this.topic}] listener error on ${event}:`, err);
                }
            });
        }
    }

    public async join(timeoutMs = 10000): Promise<PhoenixPayload> {
        const ref = this.socket.makeRef();
        this.joinRef = ref;
        const resp = await this.socket.sendWithReply(this.joinRef, ref, this.topic, 'phx_join', this.params, timeoutMs);
        this.joined = true;
        return resp;
    }

    public push(event: string, payload: PhoenixPayload = {}): void {
        const ref = this.socket.makeRef();
        this.socket.sendRaw([this.joinRef, ref, this.topic, event, payload]);
    }

    public pushWithReply(event: string, payload: PhoenixPayload = {}, timeoutMs = 10000): Promise<PhoenixPayload> {
        const ref = this.socket.makeRef();
        return this.socket.sendWithReply(this.joinRef, ref, this.topic, event, payload, timeoutMs);
    }

    public leave(): void {
        if (this.joined) {
            const ref = this.socket.makeRef();
            this.socket.sendRaw([this.joinRef, ref, this.topic, 'phx_leave', {}]);
        }
        this.joined = false;
        this.listeners.clear();
        this.socket.removeChannel(this.topic);
    }
}

export class PhoenixSocketClient {
    private ws: WebSocket | null = null;
    private url: string;
    private token: string;
    private refCounter = 0;
    private channels: Map<string, PhoenixChannel> = new Map();
    private pendingReplies: Map<string, PendingReply> = new Map();
    private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private manualClose = false;
    private onStatusChange?: (connected: boolean) => void;

    constructor(wsBaseUrl: string, token: string, onStatusChange?: (connected: boolean) => void) {
        this.url = resolveBrowserWsUrl(wsBaseUrl);
        this.token = token;
        this.onStatusChange = onStatusChange;
    }

    public makeRef(): string {
        this.refCounter += 1;
        return String(this.refCounter);
    }

    public connect(): Promise<void> {
        this.manualClose = false;
        return new Promise((resolve, reject) => {
            try {
                const endpoint = `${this.url}/websocket?token=${encodeURIComponent(this.token)}&vsn=2.0.0`;
                const ws = new WebSocket(endpoint);
                this.ws = ws;
                let settled = false;

                ws.onopen = () => {
                    this.startHeartbeat();
                    this.onStatusChange?.(true);
                    if (!settled) {
                        settled = true;
                        resolve();
                    }
                    // Rejoin any previously active channels after a reconnect
                    this.channels.forEach((ch) => {
                        if (ch.joined) {
                            ch.join().catch(() => {});
                        }
                    });
                };

                ws.onmessage = (ev) => {
                    this.handleMessage(ev.data);
                };

                ws.onerror = () => {
                    if (!settled) {
                        settled = true;
                        reject(new Error('Could not connect to Phoenix realtime server.'));
                    }
                };

                ws.onclose = () => {
                    this.stopHeartbeat();
                    this.onStatusChange?.(false);
                    if (!settled) {
                        settled = true;
                        reject(new Error('Phoenix WebSocket closed before opening.'));
                    }
                    if (!this.manualClose) {
                        this.scheduleReconnect();
                    }
                };
            } catch (err) {
                reject(err);
            }
        });
    }

    public channel(topic: string, params: PhoenixPayload = {}): PhoenixChannel {
        const existing = this.channels.get(topic);
        if (existing) {
            return existing;
        }
        const ch = new PhoenixChannel(this, topic, params);
        this.channels.set(topic, ch);
        return ch;
    }

    public removeChannel(topic: string): void {
        this.channels.delete(topic);
    }

    public sendRaw(frame: [string | null, string | null, string, string, PhoenixPayload]): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(frame));
        }
    }

    public sendWithReply(
        joinRef: string | null,
        ref: string,
        topic: string,
        event: string,
        payload: PhoenixPayload,
        timeoutMs = 10000
    ): Promise<PhoenixPayload> {
        return new Promise((resolve, reject) => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                reject(new Error('Socket is not open'));
                return;
            }
            const timer = setTimeout(() => {
                this.pendingReplies.delete(ref);
                reject(new Error(`Timeout waiting for ${event} on ${topic}`));
            }, timeoutMs);

            this.pendingReplies.set(ref, { resolve, reject, timer });
            this.sendRaw([joinRef, ref, topic, event, payload]);
        });
    }

    private handleMessage(rawData: string): void {
        try {
            const parsed = JSON.parse(rawData);
            if (!Array.isArray(parsed) || parsed.length < 5) return;
            const [_joinRef, ref, topic, event, payload] = parsed as [
                string | null,
                string | null,
                string,
                string,
                PhoenixPayload
            ];

            if (event === 'phx_reply' && ref && this.pendingReplies.has(ref)) {
                const pending = this.pendingReplies.get(ref)!;
                clearTimeout(pending.timer);
                this.pendingReplies.delete(ref);
                if (payload?.status === 'ok') {
                    pending.resolve(payload.response ?? {});
                } else {
                    pending.reject(payload?.response ?? { reason: 'error' });
                }
                return;
            }

            const ch = this.channels.get(topic);
            if (ch) {
                ch.trigger(event, payload ?? {});
            }
        } catch (err) {
            console.error('[PhoenixSocket] Failed to parse frame:', err);
        }
    }

    private startHeartbeat(): void {
        this.stopHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.sendRaw([null, this.makeRef(), 'phoenix', 'heartbeat', {}]);
            }
        }, 25000);
    }

    private stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    private scheduleReconnect(): void {
        if (this.reconnectTimer || this.manualClose) return;
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (!this.manualClose) {
                this.connect().catch(() => {
                    this.scheduleReconnect();
                });
            }
        }, 4000);
    }

    public disconnect(): void {
        this.manualClose = true;
        this.stopHeartbeat();
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.pendingReplies.forEach((p) => clearTimeout(p.timer));
        this.pendingReplies.clear();
        this.channels.clear();
        if (this.ws) {
            try {
                this.ws.close();
            } catch {}
            this.ws = null;
        }
        this.onStatusChange?.(false);
    }
}

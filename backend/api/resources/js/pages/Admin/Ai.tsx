import { useForm, usePage } from '@inertiajs/react';
import { Activity, AlertTriangle, CheckCircle, Cpu, DollarSign, Gauge, KeyRound, Play, RefreshCw, ShieldAlert, Sparkles, Zap } from 'lucide-react';
import { useState } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import { Badge, Button, Card, Table } from '@/components/ui';
import { dateTime, money } from '@/lib/format';

interface ProviderInfo {
    id: string;
    label: string;
    description: string;
    local: boolean;
    default_model: string;
    configured: boolean;
}

interface AiSettingsData {
    enabled: boolean;
    provider: string;
    model: string | null;
    active_model: string;
    timeout_seconds: number;
    rate_per_minute: number;
    user_daily_tokens: number;
    global_daily_tokens: number;
    global_monthly_tokens: number;
    monthly_cost_cap: number;
    input_price_per_million: number;
    output_price_per_million: number;
    alert_percent: number;
}

interface StatSummary {
    tokens: number;
    cost: number;
    calls: number;
}

interface DailyPoint {
    day: string;
    tokens: number;
    calls: number;
    errors: number;
    blocked: number;
}

interface TopUser {
    user_id: number;
    calls: number;
    tokens: number;
    cost: number;
    user?: { id: number; fullname: string; email: string };
}

interface FeatureStat {
    feature: string;
    calls: number;
    tokens: number;
    cost: number;
}

interface LogEntry {
    id: number;
    user_id: number | null;
    feature: string;
    provider: string;
    model: string;
    input_tokens: number;
    output_tokens: number;
    cost: number;
    latency_ms: number;
    status: 'ok' | 'error' | 'blocked';
    error: string | null;
    created_at: string;
    user?: { id: number; fullname: string };
}

interface Props {
    settings: AiSettingsData;
    providers: ProviderInfo[];
    today: StatSummary;
    month: StatSummary;
    daily: DailyPoint[];
    status: {
        ok: number;
        error: number;
        blocked: number;
        avg_latency_ms: number;
    };
    top_users: TopUser[];
    by_feature: FeatureStat[];
    recent: LogEntry[];
}

export default function AiMonitoring(props: Props) {
    const { flash } = usePage<{ flash?: string }>().props;
    const [testing, setTesting] = useState(false);

    const form = useForm({
        enabled: props.settings.enabled,
        provider: props.settings.provider,
        model: props.settings.model ?? '',
        timeout_seconds: props.settings.timeout_seconds,
        rate_per_minute: props.settings.rate_per_minute,
        user_daily_tokens: props.settings.user_daily_tokens,
        global_daily_tokens: props.settings.global_daily_tokens,
        global_monthly_tokens: props.settings.global_monthly_tokens,
        monthly_cost_cap: props.settings.monthly_cost_cap,
        input_price_per_million: props.settings.input_price_per_million,
        output_price_per_million: props.settings.output_price_per_million,
        alert_percent: props.settings.alert_percent,
    });

    const currentProvider = props.providers.find((p) => p.id === form.data.provider);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.patch('/admin/ai', { preserveScroll: true });
    };

    const runTest = () => {
        setTesting(true);
        form.post('/admin/ai/test', {
            preserveScroll: true,
            onFinish: () => setTesting(false),
        });
    };

    const dailyLimit = props.settings.global_daily_tokens || 1;
    const monthlyLimit = props.settings.global_monthly_tokens || 1;
    const dailyPercent = Math.min(100, Math.round((props.today.tokens / dailyLimit) * 100));
    const monthlyPercent = Math.min(100, Math.round((props.month.tokens / monthlyLimit) * 100));
    const costCap = props.settings.monthly_cost_cap || 1;
    const costPercent = Math.min(100, Math.round((props.month.cost / costCap) * 100));

    const totalMonthCalls = props.status.ok + props.status.error + props.status.blocked;
    const errorRate = totalMonthCalls > 0 ? Math.round(((props.status.error + props.status.blocked) / totalMonthCalls) * 100) : 0;

    return (
        <AdminLayout
            title="AI Usage & Controls"
            subtitle="Provider configuration, cost safeguards, token budgets, and live monitoring"
            actions={
                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        onClick={runTest}
                        disabled={testing || !currentProvider?.configured}
                        className="bg-white"
                        title={!currentProvider?.configured ? 'Configure provider credentials first' : 'Ping the selected provider with a test prompt'}
                    >
                        {testing ? <RefreshCw className="size-4 animate-spin" /> : <Play className="size-4 text-teal" />}
                        <span>Test Provider Connection</span>
                    </Button>
                </div>
            }
        >
            {flash && (
                <div className="mb-6 rounded-xl border border-teal/20 bg-mint/50 p-4 text-sm font-medium text-teal-900">
                    {flash}
                </div>
            )}

            {/* Quick Metrics */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="flex flex-col justify-between">
                    <div className="flex items-center justify-between text-muted">
                        <span className="text-xs font-semibold uppercase tracking-wider">Today's Tokens</span>
                        <Zap className="size-4 text-brass" />
                    </div>
                    <div className="mt-3">
                        <div className="font-display text-2xl font-bold text-ink">
                            {props.today.tokens.toLocaleString()}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-muted">
                            <span>{dailyPercent}% of {props.settings.global_daily_tokens.toLocaleString()} limit</span>
                            <span>{props.today.calls} calls</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-paper">
                            <div
                                className={`h-full rounded-full transition-all ${dailyPercent >= props.settings.alert_percent ? 'bg-hibiscus' : 'bg-teal'}`}
                                style={{ width: `${dailyPercent}%` }}
                            />
                        </div>
                    </div>
                </Card>

                <Card className="flex flex-col justify-between">
                    <div className="flex items-center justify-between text-muted">
                        <span className="text-xs font-semibold uppercase tracking-wider">Month-to-Date Cost</span>
                        <DollarSign className="size-4 text-teal" />
                    </div>
                    <div className="mt-3">
                        <div className="font-display text-2xl font-bold text-ink">
                            ${props.month.cost.toFixed(4)}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-muted">
                            <span>{costPercent}% of ${props.settings.monthly_cost_cap.toFixed(2)} cap</span>
                            <span>{props.month.tokens.toLocaleString()} tkn</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-paper">
                            <div
                                className={`h-full rounded-full transition-all ${costPercent >= props.settings.alert_percent ? 'bg-hibiscus' : 'bg-teal'}`}
                                style={{ width: `${costPercent}%` }}
                            />
                        </div>
                    </div>
                </Card>

                <Card className="flex flex-col justify-between">
                    <div className="flex items-center justify-between text-muted">
                        <span className="text-xs font-semibold uppercase tracking-wider">Active Engine</span>
                        <Cpu className="size-4 text-navy" />
                    </div>
                    <div className="mt-3">
                        <div className="flex items-center gap-2 font-display text-lg font-bold text-ink truncate" title={props.settings.active_model}>
                            <span className="truncate">{props.settings.active_model || 'None'}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                            <span className="capitalize">{props.settings.provider}</span>
                            <span>•</span>
                            {currentProvider?.configured ? (
                                <span className="inline-flex items-center text-teal font-semibold">Configured</span>
                            ) : (
                                <span className="inline-flex items-center text-hibiscus font-semibold">Missing key</span>
                            )}
                            <span>•</span>
                            <span className={props.settings.enabled ? 'text-teal font-semibold' : 'text-muted'}>
                                {props.settings.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                    </div>
                </Card>

                <Card className="flex flex-col justify-between">
                    <div className="flex items-center justify-between text-muted">
                        <span className="text-xs font-semibold uppercase tracking-wider">Health & Latency</span>
                        <Activity className="size-4 text-teal" />
                    </div>
                    <div className="mt-3">
                        <div className="font-display text-2xl font-bold text-ink">
                            {props.status.avg_latency_ms} ms
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-muted">
                            <span>{errorRate}% fail/block rate</span>
                            <span>{props.status.ok} ok / {props.status.error} err</span>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Configuration Column */}
                <div className="lg:col-span-1">
                    <Card title="Engine & Safety Limits">
                        <form onSubmit={submit} className="space-y-4">
                            {/* Enable switch */}
                            <div className="flex items-center justify-between rounded-xl bg-paper/60 p-3 ring-1 ring-line">
                                <div>
                                    <label htmlFor="ai-enabled" className="text-sm font-bold text-ink">
                                        AI System Active
                                    </label>
                                    <p className="text-xs text-muted">Master kill switch for all AI endpoints</p>
                                </div>
                                <input
                                    id="ai-enabled"
                                    type="checkbox"
                                    checked={form.data.enabled}
                                    onChange={(e) => form.setData('enabled', e.target.checked)}
                                    className="size-5 rounded border-line text-teal focus:ring-teal"
                                />
                            </div>

                            {/* Provider selection */}
                            <div>
                                <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
                                    Provider
                                </label>
                                <select
                                    value={form.data.provider}
                                    onChange={(e) => form.setData('provider', e.target.value)}
                                    className="mt-1.5 h-10 w-full rounded-lg bg-white px-3 text-sm ring-1 ring-inset ring-line focus:ring-2 focus:ring-teal"
                                >
                                    {props.providers.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.label} {p.configured ? '(Ready)' : '(Unset)'}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-xs text-muted">
                                    {currentProvider?.description}
                                </p>
                            </div>

                            {/* Model Override */}
                            <div>
                                <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
                                    Model ID
                                </label>
                                <input
                                    type="text"
                                    value={form.data.model}
                                    onChange={(e) => form.setData('model', e.target.value)}
                                    placeholder={currentProvider?.default_model ?? 'Leave blank for default'}
                                    className="mt-1.5 h-10 w-full rounded-lg bg-white px-3 text-sm ring-1 ring-inset ring-line focus:ring-2 focus:ring-teal font-mono text-xs"
                                />
                                <p className="mt-1 text-xs text-muted">
                                    Active: <code className="font-mono text-ink">{props.settings.active_model}</code>
                                </p>
                            </div>

                            <hr className="border-line" />

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
                                        Timeout (s)
                                    </label>
                                    <input
                                        type="number"
                                        min={5}
                                        max={300}
                                        value={form.data.timeout_seconds}
                                        onChange={(e) => form.setData('timeout_seconds', Number(e.target.value))}
                                        className="mt-1.5 h-10 w-full rounded-lg bg-white px-3 text-sm ring-1 ring-inset ring-line focus:ring-2 focus:ring-teal"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
                                        Per-User RPM
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={600}
                                        value={form.data.rate_per_minute}
                                        onChange={(e) => form.setData('rate_per_minute', Number(e.target.value))}
                                        className="mt-1.5 h-10 w-full rounded-lg bg-white px-3 text-sm ring-1 ring-inset ring-line focus:ring-2 focus:ring-teal"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
                                    User Daily Token Cap
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    step={1000}
                                    value={form.data.user_daily_tokens}
                                    onChange={(e) => form.setData('user_daily_tokens', Number(e.target.value))}
                                    className="mt-1.5 h-10 w-full rounded-lg bg-white px-3 text-sm ring-1 ring-inset ring-line focus:ring-2 focus:ring-teal"
                                />
                                <p className="mt-1 text-xs text-muted">Limits individual accounts per calendar day</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
                                        Global Daily (Tokens)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={10000}
                                        value={form.data.global_daily_tokens}
                                        onChange={(e) => form.setData('global_daily_tokens', Number(e.target.value))}
                                        className="mt-1.5 h-10 w-full rounded-lg bg-white px-3 text-sm ring-1 ring-inset ring-line focus:ring-2 focus:ring-teal"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
                                        Global Month (Tokens)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={100000}
                                        value={form.data.global_monthly_tokens}
                                        onChange={(e) => form.setData('global_monthly_tokens', Number(e.target.value))}
                                        className="mt-1.5 h-10 w-full rounded-lg bg-white px-3 text-sm ring-1 ring-inset ring-line focus:ring-2 focus:ring-teal"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
                                        Monthly Cost Cap ($)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={0.5}
                                        value={form.data.monthly_cost_cap}
                                        onChange={(e) => form.setData('monthly_cost_cap', Number(e.target.value))}
                                        className="mt-1.5 h-10 w-full rounded-lg bg-white px-3 text-sm ring-1 ring-inset ring-line focus:ring-2 focus:ring-teal"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
                                        Alert Threshold (%)
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={form.data.alert_percent}
                                        onChange={(e) => form.setData('alert_percent', Number(e.target.value))}
                                        className="mt-1.5 h-10 w-full rounded-lg bg-white px-3 text-sm ring-1 ring-inset ring-line focus:ring-2 focus:ring-teal"
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <Button
                                    variant="primary"
                                    className="w-full"
                                    disabled={form.processing}
                                    onClick={submit}
                                >
                                    Save Settings
                                </Button>
                            </div>
                        </form>
                    </Card>

                    {/* Providers status checklist */}
                    <Card title="Provider Registry" className="mt-6">
                        <ul className="divide-y divide-line text-sm">
                            {props.providers.map((p) => (
                                <li key={p.id} className="py-2.5 flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-ink">{p.label}</p>
                                        <p className="text-xs text-muted">
                                            {p.local ? 'Local service' : 'Cloud hosted'} • Default: {p.default_model}
                                        </p>
                                    </div>
                                    <div>
                                        {p.configured ? (
                                            <Badge tone="good">Configured</Badge>
                                        ) : (
                                            <Badge tone="neutral">Unset</Badge>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-3 text-xs text-muted">
                            Secrets and URLs are safely kept in <code className="font-mono">.env</code>. The admin UI never renders raw API tokens.
                        </p>
                    </Card>
                </div>

                {/* Main Monitoring Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* 14-day history */}
                    <Card title="14-Day Activity History">
                        {props.daily.length === 0 ? (
                            <p className="text-sm text-muted">No usage recorded over the last 14 days.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table head={['Date', 'Successful Calls', 'Tokens', 'Errors', 'Blocked']}>
                                    {props.daily.map((d) => (
                                        <tr key={d.day}>
                                            <td className="font-mono text-xs">{d.day}</td>
                                            <td className="tabular-nums font-semibold">{d.calls}</td>
                                            <td className="tabular-nums">{d.tokens.toLocaleString()}</td>
                                            <td className="tabular-nums">
                                                {d.errors > 0 ? (
                                                    <span className="text-hibiscus font-bold">{d.errors}</span>
                                                ) : (
                                                    <span className="text-muted">0</span>
                                                )}
                                            </td>
                                            <td className="tabular-nums">
                                                {d.blocked > 0 ? (
                                                    <span className="text-brass-ink font-bold">{d.blocked}</span>
                                                ) : (
                                                    <span className="text-muted">0</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </Table>
                            </div>
                        )}
                    </Card>

                    {/* Top Users & Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card title="Top Users (This Month)">
                            {props.top_users.length === 0 ? (
                                <p className="text-sm text-muted">No user calls logged yet this month.</p>
                            ) : (
                                <ul className="divide-y divide-line text-sm">
                                    {props.top_users.map((u) => (
                                        <li key={u.user_id} className="py-2.5 flex items-center justify-between">
                                            <div className="min-w-0 pr-2">
                                                <p className="font-semibold text-ink truncate">
                                                    {u.user?.fullname ?? `User #${u.user_id}`}
                                                </p>
                                                <p className="text-xs text-muted truncate">{u.user?.email}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="tabular-nums font-bold text-ink">{u.tokens.toLocaleString()} tkn</p>
                                                <p className="text-xs text-muted">{u.calls} calls</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card>

                        <Card title="By Feature (This Month)">
                            {props.by_feature.length === 0 ? (
                                <p className="text-sm text-muted">No feature calls recorded.</p>
                            ) : (
                                <ul className="divide-y divide-line text-sm">
                                    {props.by_feature.map((f) => (
                                        <li key={f.feature} className="py-2.5 flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-ink font-mono text-xs">{f.feature}</p>
                                                <p className="text-xs text-muted">{f.calls} requests</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="tabular-nums font-bold text-ink">{f.tokens.toLocaleString()} tkn</p>
                                                <p className="text-xs text-muted">${f.cost.toFixed(4)}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card>
                    </div>

                    {/* Recent Invocations */}
                    <Card title="Recent Invocations">
                        {props.recent.length === 0 ? (
                            <p className="text-sm text-muted">No recent invocations.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table head={['Time', 'Feature', 'Model', 'Status', 'Tokens', 'Latency', 'Details']}>
                                    {props.recent.map((log) => (
                                        <tr key={log.id}>
                                            <td className="text-xs text-muted whitespace-nowrap">
                                                {dateTime(log.created_at)}
                                            </td>
                                            <td className="font-mono text-xs font-semibold">{log.feature}</td>
                                            <td className="font-mono text-xs text-muted">{log.model}</td>
                                            <td>
                                                {log.status === 'ok' && <Badge tone="good">OK</Badge>}
                                                {log.status === 'error' && <Badge tone="bad">Error</Badge>}
                                                {log.status === 'blocked' && <Badge tone="warn">Blocked</Badge>}
                                            </td>
                                            <td className="tabular-nums text-xs">
                                                {log.input_tokens + log.output_tokens > 0
                                                    ? `${(log.input_tokens + log.output_tokens).toLocaleString()}`
                                                    : '—'}
                                            </td>
                                            <td className="tabular-nums text-xs">{log.latency_ms} ms</td>
                                            <td className="text-xs text-muted max-w-xs truncate" title={log.error ?? ''}>
                                                {log.error ? (
                                                    <span className="text-hibiscus truncate">{log.error}</span>
                                                ) : log.user ? (
                                                    <span>{log.user.fullname}</span>
                                                ) : (
                                                    <span>System / CLI</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </Table>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}

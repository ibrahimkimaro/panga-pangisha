import { Link, router } from '@inertiajs/react';
import { Home, Search, Send, ShieldAlert, ShieldCheck } from 'lucide-react';
import { type ComponentProps, type ReactNode, useRef, useState } from 'react';
import type { Paged } from '@/types';

/** The two-ribbon mark from the app's sign-in screen. */
export function Logo({ onDark = false, className = '' }: { onDark?: boolean; className?: string }) {
    return (
        <span className={`inline-flex items-center gap-2 font-display text-xl font-extrabold ${onDark ? 'text-white' : 'text-navy'} ${className}`}>
            <svg viewBox="0 0 100 100" className="size-7" fill="none" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 76V32c0-14 22-14 22 10v30" stroke={onDark ? '#fff' : '#0b1b2b'} />
                <path d="M56 28v34c0 20 22 20 22-4V24" stroke={onDark ? '#2dd4bf' : '#0f766e'} />
            </svg>
            Panga
        </span>
    );
}

type Tone = 'neutral' | 'good' | 'warn' | 'bad';
const tones: Record<Tone, string> = {
    neutral: 'bg-paper text-muted ring-line',
    good: 'bg-mint text-teal ring-teal/20',
    warn: 'bg-sand text-brass-ink ring-brass/50',
    bad: 'bg-blush text-hibiscus ring-hibiscus/25',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
    return (
        <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}>
            {children}
        </span>
    );
}

const statuses: Record<string, [Tone, string]> = {
    available: ['good', 'Live'],
    rented: ['neutral', 'Rented'],
    reserved: ['neutral', 'Reserved'],
    maintenance: ['neutral', 'Maintenance'],
    suspended: ['bad', 'Suspended'],
    pending: ['warn', 'Pending'],
    approved: ['good', 'Approved'],
    rejected: ['bad', 'Rejected'],
    none: ['neutral', 'Not submitted'],
    accepted: ['good', 'Accepted'],
    declined: ['neutral', 'Declined'],
    cancelled: ['neutral', 'Cancelled'],
    open: ['warn', 'Open'],
    resolved: ['good', 'Resolved'],
    dismissed: ['neutral', 'Dismissed'],
};

export function StatusBadge({ status }: { status: string }) {
    const [tone, label] = statuses[status] ?? ['neutral', status];
    return <Badge tone={tone}>{label}</Badge>;
}

export function VerifiedBadge({ at }: { at: string | null }) {
    return at ? (
        <Badge tone="good">
            <ShieldCheck className="size-3.5" aria-hidden="true" /> Verified
        </Badge>
    ) : (
        <Badge tone="warn">
            <ShieldAlert className="size-3.5" aria-hidden="true" /> Not verified
        </Badge>
    );
}

const variants = {
    primary: 'bg-teal text-white hover:bg-teal/90',
    secondary: 'bg-white text-ink ring-1 ring-inset ring-line hover:bg-paper',
    danger: 'bg-hibiscus text-white hover:bg-hibiscus/90',
    quiet: 'text-teal hover:bg-mint',
};
type Variant = keyof typeof variants;
const buttonBase =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60';

export function Button({ variant = 'secondary', className = '', ...props }: ComponentProps<'button'> & { variant?: Variant }) {
    return <button type="button" {...props} className={`${buttonBase} ${variants[variant]} ${className}`} />;
}

export function LinkButton({ variant = 'secondary', className = '', ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
    return <Link {...props} className={`${buttonBase} ${variants[variant]} ${className}`} />;
}

/** A button that asks before it acts. Uses the native <dialog>, so focus trapping and Escape come for free. */
export function Confirm(props: {
    label: ReactNode;
    variant?: Variant;
    title: string;
    children: ReactNode;
    confirmLabel: string;
    danger?: boolean;
    onConfirm: () => void;
}) {
    const ref = useRef<HTMLDialogElement>(null);
    return (
        <>
            <Button variant={props.variant} onClick={() => ref.current?.showModal()}>
                {props.label}
            </Button>
            <dialog ref={ref} className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl bg-white p-6 text-ink shadow-2xl">
                <h2 className="text-lg font-bold">{props.title}</h2>
                <div className="mt-2 text-sm leading-relaxed text-muted">{props.children}</div>
                <div className="mt-6 flex justify-end gap-2">
                    <Button onClick={() => ref.current?.close()}>Cancel</Button>
                    <Button
                        variant={props.danger ? 'danger' : 'primary'}
                        onClick={() => {
                            ref.current?.close();
                            props.onConfirm();
                        }}
                    >
                        {props.confirmLabel}
                    </Button>
                </div>
            </dialog>
        </>
    );
}

/** A button that asks for a written reason before it acts: rejecting, or withdrawing an approval. */
export function AskReason(props: { label: ReactNode; variant?: Variant; title: string; note: string; presets?: string[]; confirmLabel: string; onConfirm: (reason: string) => void }) {
    const ref = useRef<HTMLDialogElement>(null);
    const [reason, setReason] = useState('');
    return (
        <>
            <Button
                variant={props.variant}
                onClick={() => {
                    setReason('');
                    ref.current?.showModal();
                }}
            >
                {props.label}
            </Button>
            <dialog ref={ref} className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl bg-white p-6 text-left text-ink shadow-2xl">
                <h2 className="text-lg font-bold">{props.title}</h2>
                <p className="mt-1 text-sm text-muted">{props.note}</p>
                <div className="mt-4 space-y-2">
                    {props.presets?.map((r) => (
                        <button key={r} type="button" onClick={() => setReason(r)} className={`block w-full rounded-lg px-3 py-2 text-left text-sm ring-1 ring-inset ${reason === r ? 'bg-mint ring-teal/30' : 'ring-line hover:bg-paper'}`}>
                            {r}
                        </button>
                    ))}
                </div>
                <label className="mt-4 block text-sm font-semibold">
                    What should they fix?
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} className="mt-1.5 w-full rounded-lg px-3 py-2 text-sm font-normal ring-1 ring-inset ring-line" />
                </label>
                <div className="mt-5 flex justify-end gap-2">
                    <Button onClick={() => ref.current?.close()}>Cancel</Button>
                    <Button
                        variant="danger"
                        disabled={!reason.trim()}
                        onClick={() => {
                            ref.current?.close();
                            props.onConfirm(reason.trim());
                        }}
                    >
                        {props.confirmLabel}
                    </Button>
                </div>
            </dialog>
        </>
    );
}

/** Sends one person a message: it lands in their app's notifications, live if the app is open. */
export function MessageButton(props: { user: { id: number; fullname: string }; label?: string; variant?: Variant; preset?: { title: string; body: string } }) {
    const ref = useRef<HTMLDialogElement>(null);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);
    const field = 'mt-1.5 w-full rounded-lg bg-white px-3 py-2 text-sm font-normal ring-1 ring-inset ring-line';
    return (
        <>
            <Button
                variant={props.variant}
                onClick={(e) => {
                    e.stopPropagation();
                    setTitle(props.preset?.title ?? '');
                    setBody(props.preset?.body ?? '');
                    ref.current?.showModal();
                }}
            >
                <Send className="size-4" /> {props.label ?? 'Send message'}
            </Button>
            <dialog ref={ref} onClick={(e) => e.stopPropagation()} className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl bg-white p-6 text-left text-ink shadow-2xl">
                <h2 className="text-lg font-bold">Message {props.user.fullname}</h2>
                <p className="mt-1 text-sm text-muted">It appears in their app straight away if it is open, and stays in their notifications.</p>
                <label className="mt-4 block text-sm font-semibold">
                    Title
                    <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} className={`${field} h-10`} />
                </label>
                <label className="mt-3 block text-sm font-semibold">
                    <span className="flex justify-between">
                        Message <span className="font-normal tabular-nums text-muted">{body.length} of 400</span>
                    </span>
                    <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={400} rows={4} className={field} />
                </label>
                <div className="mt-5 flex justify-end gap-2">
                    <Button onClick={() => ref.current?.close()}>Cancel</Button>
                    <Button
                        variant="primary"
                        disabled={sending || !title.trim() || !body.trim()}
                        onClick={() =>
                            router.post(`/admin/users/${props.user.id}/message`, { title: title.trim(), body: body.trim() }, {
                                preserveScroll: true,
                                onStart: () => setSending(true),
                                onFinish: () => setSending(false),
                                onSuccess: () => ref.current?.close(),
                            })
                        }
                    >
                        <Send className="size-4" /> Send now
                    </Button>
                </div>
            </dialog>
        </>
    );
}

export function Card({ title, aside, className = '', children }: { title?: string; aside?: ReactNode; className?: string; children: ReactNode }) {
    return (
        <section className={`rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgb(16_33_47/0.04)] ring-1 ring-line ${className}`}>
            {title && (
                <div className="mb-4 flex items-baseline justify-between gap-3">
                    <h2 className="text-base font-bold">{title}</h2>
                    {aside && <div className="text-sm text-muted">{aside}</div>}
                </div>
            )}
            {children}
        </section>
    );
}

export function Avatar({ name, className = 'size-9 text-sm' }: { name: string; className?: string }) {
    const initials = name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
    return (
        <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-navy font-semibold text-teal-bright ${className}`} aria-hidden="true">
            {initials || '?'}
        </span>
    );
}

/** Listing photo from the public storage disk. */
export function Thumb({ path, className = 'size-12 rounded-lg' }: { path: string | null; className?: string }) {
    return path ? (
        <img src={`/storage/${path}`} alt="" loading="lazy" className={`shrink-0 bg-paper object-cover ${className}`} />
    ) : (
        <span className={`inline-flex shrink-0 items-center justify-center bg-paper text-muted ${className}`}>
            <Home className="size-5" aria-hidden="true" />
        </span>
    );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
    return (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-[0_1px_2px_rgb(16_33_47/0.04)] ring-1 ring-line">
            <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-paper/70 text-xs text-muted">
                    <tr>
                        {head.map((h) => (
                            <th key={h} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-line [&_td]:px-4 [&_td]:py-3 [&_td]:align-middle [&_tr:hover]:bg-paper/60">{children}</tbody>
            </table>
        </div>
    );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
    return (
        <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
            <p className="font-display text-lg font-bold">{title}</p>
            {children && <p className="mx-auto mt-1 max-w-md text-sm text-muted">{children}</p>}
        </div>
    );
}

export function Pagination({ page, noun }: { page: Paged<unknown>; noun: string }) {
    return (
        <nav className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted" aria-label="Pages">
            <p>{page.total === 0 ? `No ${noun}` : `Showing ${page.from} to ${page.to} of ${page.total} ${noun}`}</p>
            {page.last_page > 1 && (
                <div className="flex flex-wrap gap-1">
                    {page.links.map((l, i) => {
                        const label = l.label.replace(/&laquo;|&raquo;/g, '').trim();
                        const cls = `rounded-lg px-3 py-1.5 font-semibold ${l.active ? 'bg-navy text-white' : 'bg-white ring-1 ring-inset ring-line'}`;
                        return l.url ? (
                            <Link key={i} href={l.url} preserveScroll className={`${cls} ${l.active ? '' : 'text-ink hover:bg-paper'}`} aria-current={l.active ? 'page' : undefined}>
                                {label}
                            </Link>
                        ) : (
                            <span key={i} className={`${cls} opacity-45`}>
                                {label}
                            </span>
                        );
                    })}
                </div>
            )}
        </nav>
    );
}

type Select = { name: string; label: string; options: [value: string, label: string][] };

/** One row of filters above a table. Search submits on Enter; a select applies as soon as it changes. */
export function Filters({ path, filters, search, selects = [] }: { path: string; filters: Record<string, string | undefined>; search?: string; selects?: Select[] }) {
    const go = (patch: Record<string, string>) => {
        const next = Object.fromEntries(Object.entries({ ...filters, ...patch }).filter(([, v]) => v));
        router.get(path, next, { preserveState: true, replace: true });
    };
    const field = 'h-10 rounded-lg bg-white text-sm ring-1 ring-inset ring-line';
    return (
        <form
            className="mb-4 flex flex-wrap items-center gap-2"
            role="search"
            onSubmit={(e) => {
                e.preventDefault();
                go({ q: String(new FormData(e.currentTarget).get('q') ?? '') });
            }}
        >
            {search && (
                <label className="relative min-w-56 flex-1 sm:max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted" aria-hidden="true" />
                    <input name="q" type="search" defaultValue={filters.q ?? ''} placeholder={search} aria-label={search} className={`${field} w-full pl-9 pr-3`} />
                </label>
            )}
            {selects.map((s) => (
                <select key={s.name} aria-label={s.label} value={filters[s.name] ?? ''} onChange={(e) => go({ [s.name]: e.target.value })} className={`${field} px-3`}>
                    <option value="">{s.label}: all</option>
                    {s.options.map(([v, l]) => (
                        <option key={v} value={v}>
                            {l}
                        </option>
                    ))}
                </select>
            ))}
            {Object.values(filters).some(Boolean) && (
                <Link href={path} className="px-2 text-sm font-semibold text-teal hover:underline">
                    Clear filters
                </Link>
            )}
        </form>
    );
}

/** Label and value pairs for the detail pages. */
export function Facts({ rows }: { rows: [label: string, value: ReactNode][] }) {
    return (
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-sm">
            {rows.map(([label, value]) => (
                <div key={label} className="contents">
                    <dt className="text-muted">{label}</dt>
                    <dd className="min-w-0 break-words font-medium">{value}</dd>
                </div>
            ))}
        </dl>
    );
}

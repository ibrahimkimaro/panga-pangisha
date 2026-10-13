import { Head, Link, router, usePage, usePoll } from '@inertiajs/react';
import { ArrowLeft, Building2, CalendarClock, CheckCircle2, ExternalLink, Flag, History, Home, IdCard, LayoutDashboard, LogOut, Megaphone, Menu, Search, ShieldAlert, Sparkles, UserCog, Users, X } from 'lucide-react';
import { type ComponentType, type ReactNode, useEffect, useRef, useState } from 'react';
import { Avatar, Logo } from '@/components/ui';
import { place, roleLabel } from '@/lib/format';
import type { Shared } from '@/types';

type Item = { href: string; label: string; icon: ComponentType<{ className?: string }>; count?: number; countLabel?: string };

/** `live` names page props to refresh every few seconds, next to the sidebar counts. */
export default function AdminLayout(props: { title: string; subtitle?: ReactNode; back?: { href: string; label: string }; actions?: ReactNode; live?: string[]; children: ReactNode }) {
    const { auth, flash, queue } = usePage<Shared>().props;
    const url = usePage().url;
    const [open, setOpen] = useState(false);
    usePoll(5000, { only: ['queue', ...(props.live ?? [])] });

    const groups: { label?: string; items: Item[] }[] = [
        { items: [{ href: '/admin', label: 'Overview', icon: LayoutDashboard }] },
        {
            label: 'Review',
            items: [
                { href: '/admin/identity', label: 'Identity checks', icon: IdCard, count: queue?.identity, countLabel: 'waiting' },
                { href: '/admin/business', label: 'Business checks', icon: Building2, count: queue?.business, countLabel: 'waiting' },
                { href: '/admin/listings?verified=no', label: 'Listings to verify', icon: ShieldAlert, count: queue?.unverified, countLabel: 'waiting' },
                { href: '/admin/reports', label: 'Reports', icon: Flag, count: queue?.reports, countLabel: 'open' },
            ],
        },
        {
            label: 'Directory',
            items: [
                { href: '/admin/users', label: 'Users', icon: Users },
                { href: '/admin/listings', label: 'Listings', icon: Home },
                { href: '/admin/viewings', label: 'Viewing requests', icon: CalendarClock },
            ],
        },
        {
            label: 'Manage',
            items: [
                { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
                { href: '/admin/ai', label: 'AI Usage', icon: Sparkles },
                { href: '/admin/team', label: 'Team', icon: UserCog },
                { href: '/admin/activity', label: 'Activity log', icon: History },
            ],
        },

    ];
    const toVerify = url.startsWith('/admin/listings?') && url.includes('verified=no');
    const isCurrent = (href: string) => {
        const path = url.split('?')[0];
        if (href === '/admin') return path === '/admin';
        if (href.includes('?')) return toVerify;
        if (href === '/admin/listings') return path.startsWith(href) && !toVerify;
        return path.startsWith(href);
    };

    return (
        <div className="min-h-screen lg:pl-64">
            <Head title={props.title} />
            {open && <div className="fixed inset-0 z-40 bg-navy/60 lg:hidden" onClick={() => setOpen(false)} />}

            <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-navy text-white transition-transform lg:translate-x-0 ${open ? '' : '-translate-x-full'}`}>
                <div className="flex h-16 items-center justify-between px-5">
                    <Link href="/admin">
                        <Logo onDark />
                    </Link>
                    <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 lg:hidden" aria-label="Close menu">
                        <X className="size-5" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Admin">
                    {groups.map((g, i) => (
                        <div key={i} className={g.label ? 'mt-5' : 'mt-2'}>
                            {g.label && <p className="mb-1 px-3 text-xs font-semibold text-white/45">{g.label}</p>}
                            {g.items.map((n) => {
                                const on = isCurrent(n.href);
                                return (
                                    <Link
                                        key={n.href}
                                        href={n.href}
                                        onClick={() => setOpen(false)}
                                        aria-current={on ? 'page' : undefined}
                                        className={`relative mt-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${on ? 'bg-navy-raised text-white' : 'text-white/70 hover:bg-navy-raised/60 hover:text-white'}`}
                                    >
                                        {on && <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-teal-bright" aria-hidden="true" />}
                                        <n.icon className={`size-[18px] ${on ? 'text-teal-bright' : ''}`} aria-hidden="true" />
                                        <span className="flex-1">{n.label}</span>
                                        {!!n.count && (
                                            <span className="rounded-full bg-brass px-2 py-0.5 text-xs font-bold tabular-nums text-navy">
                                                {n.count}
                                                <span className="sr-only"> {n.countLabel}</span>
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <a href="/" className="mx-3 mb-4 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-white/70 hover:bg-navy-raised/60 hover:text-white">
                    <ExternalLink className="size-[18px]" aria-hidden="true" /> View website
                </a>
            </aside>

            <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/95 px-4 backdrop-blur sm:px-8">
                <button type="button" onClick={() => setOpen(true)} className="-ml-2 rounded-lg p-2 lg:hidden" aria-label="Open menu">
                    <Menu className="size-5" />
                </button>
                <JumpTo />
                <div className="ml-auto flex items-center gap-3">
                    <div className="hidden text-right leading-tight sm:block">
                        <p className="text-sm font-semibold">{auth.user?.fullname}</p>
                        <p className="text-xs text-muted">{auth.user?.email}</p>
                    </div>
                    <Avatar name={auth.user?.fullname ?? ''} />
                    <button type="button" onClick={() => router.post('/admin/logout')} className="rounded-lg p-2 text-muted hover:bg-paper hover:text-ink" aria-label="Sign out" title="Sign out">
                        <LogOut className="size-[18px]" />
                    </button>
                </div>
            </header>

            <main className="max-w-full px-4 py-6 sm:px-8 sm:py-8">
                {props.back && (
                    <Link href={props.back.href} className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:underline">
                        <ArrowLeft className="size-4" aria-hidden="true" /> {props.back.label}
                    </Link>
                )}
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-extrabold sm:text-[1.75rem]">{props.title}</h1>
                        {props.subtitle && <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted">{props.subtitle}</div>}
                    </div>
                    {props.actions && <div className="flex flex-wrap gap-2">{props.actions}</div>}
                </div>

                {flash && (
                    <p role="status" className="mb-5 flex items-center gap-2 rounded-xl bg-mint px-4 py-3 text-sm font-semibold text-teal ring-1 ring-inset ring-teal/20">
                        <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" /> {flash}
                    </p>
                )}
                {props.children}
            </main>
        </div>
    );
}

type Found = { users: { id: number; fullname: string; phone: string | null; role: string }[]; listings: { id: number; property_name: string | null; ward: string | null; district: string | null }[] };

/** The top bar's search: type a name, phone or area and jump straight to that person or home. "/" focuses it. */
function JumpTo() {
    const [q, setQ] = useState('');
    const [found, setFound] = useState<Found | null>(null);
    const input = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (q.trim().length < 2) return setFound(null);
        const stop = new AbortController();
        const wait = setTimeout(() => {
            fetch(`/admin/search?q=${encodeURIComponent(q)}`, { headers: { Accept: 'application/json' }, signal: stop.signal })
                .then((r) => (r.ok ? r.json() : null))
                .then((data) => data && setFound(data))
                .catch(() => { });
        }, 180);
        return () => {
            clearTimeout(wait);
            stop.abort();
        };
    }, [q]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName);
            if (e.key === '/' && !typing) {
                e.preventDefault();
                input.current?.focus();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const results = [
        ...(found?.users ?? []).map((u) => ({ href: `/admin/users/${u.id}`, title: u.fullname, note: [roleLabel[u.role] ?? u.role, u.phone].filter(Boolean).join(', '), icon: Users })),
        ...(found?.listings ?? []).map((l) => ({ href: `/admin/listings/${l.id}`, title: l.property_name ?? `Listing #${l.id}`, note: place(l), icon: Home })),
    ];
    const go = (href: string) => {
        setQ('');
        setFound(null);
        input.current?.blur();
        router.visit(href);
    };

    return (
        <form
            className="relative w-full max-w-md"
            role="search"
            onSubmit={(e) => {
                e.preventDefault();
                if (results[0]) go(results[0].href);
            }}
        >
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted" aria-hidden="true" />
            <input
                ref={input}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && (setQ(''), input.current?.blur())}
                placeholder="Find a person or a home"
                aria-label="Find a person or a home"
                className="h-9 w-full rounded-lg bg-paper pl-9 pr-9 text-sm ring-1 ring-inset ring-transparent placeholder:text-muted focus:bg-white focus:ring-line"
            />
            {!q && <kbd className="pointer-events-none absolute right-2.5 top-2 rounded border border-line bg-white px-1.5 text-xs text-muted">/</kbd>}
            {found && (
                <ul className="absolute inset-x-0 top-11 overflow-hidden rounded-xl bg-white py-1 shadow-xl ring-1 ring-line">
                    {results.length === 0 && <li className="px-4 py-3 text-sm text-muted">Nothing matches “{q}”.</li>}
                    {results.map((r) => (
                        <li key={r.href}>
                            <button type="button" onClick={() => go(r.href)} className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-paper">
                                <r.icon className="size-4 shrink-0 text-muted" aria-hidden="true" />
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-semibold">{r.title}</span>
                                    <span className="block truncate text-xs text-muted">{r.note}</span>
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </form>
    );
}

import { Link } from '@inertiajs/react';
import { Building2, Clock, Flag, IdCard, ShieldAlert } from 'lucide-react';
import type { ComponentType } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import { Card, StatusBadge, Thumb, VerifiedBadge } from '@/components/ui';
import { ago, dateTime, money, place } from '@/lib/format';
import type { Action, Listing } from '@/types';

type Props = {
    attention: { identity: number; business: number; unverified: number; reports: number; stale: number; suspended: number };
    totals: Record<'users' | 'renters' | 'owners' | 'newUsers' | 'live' | 'listings' | 'verified' | 'viewings' | 'viewingsPending' | 'conversations', number>;
    signups: { date: string; count: number }[];
    districts: { name: string; count: number }[];
    latestListings: Listing[];
    activity: Action[];
};

export default function Dashboard({ attention, totals, signups, districts, latestListings, activity }: Props) {
    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    return (
        <AdminLayout title="Overview" subtitle={today} live={['attention']}>
            <h2 className="mb-3 text-base font-bold">Waiting for you</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                <Queue href="/admin/identity" icon={IdCard} n={attention.identity} label="Identity checks" hint="Landlords waiting to be let in" />
                <Queue href="/admin/business" icon={Building2} n={attention.business} label="Business checks" hint="Business details to verify" />
                <Queue href="/admin/listings?verified=no" icon={ShieldAlert} n={attention.unverified} label="Listings to verify" hint="Check the advertiser's right to let the home" />
                <Queue href="/admin/reports" icon={Flag} n={attention.reports} label="Open reports" hint="Renters flagged these listings" />
                <Queue href="/admin/listings?stale=1" icon={Clock} n={attention.stale} label="Stale listings" hint="Live, but not confirmed for 30 days" />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <Card title="New accounts, last 30 days" aside={`${signups.reduce((s, d) => s + d.count, 0)} in total`} className="lg:col-span-2">
                    <SignupBars data={signups} />
                </Card>
                <Card title="Live homes by district">
                    {districts.length === 0 && <p className="text-sm text-muted">No live homes yet.</p>}
                    <ul className="space-y-3">
                        {districts.map((d) => (
                            <li key={d.name} className="text-sm">
                                <div className="mb-1 flex justify-between">
                                    <span className="font-medium">{d.name}</span>
                                    <span className="tabular-nums text-muted">{d.count}</span>
                                </div>
                                <div className="h-2 rounded-full bg-paper">
                                    <div className="h-2 rounded-full bg-teal" style={{ width: `${(d.count / districts[0].count) * 100}%` }} />
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line lg:grid-cols-4">
                <Total label="People" value={totals.users} note={`${totals.renters} tenants, ${totals.owners} landlords, ${attention.suspended} suspended. ${totals.newUsers} joined this week`} />
                <Total label="Live homes" value={totals.live} note={`${totals.verified} verified, ${totals.listings} listed in total`} />
                <Total label="Viewing requests" value={totals.viewings} note={`${totals.viewingsPending} waiting for the owner`} />
                <Total label="Conversations" value={totals.conversations} note="Pairs of people who have chatted" />
            </dl>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <Card title="Newest listings" aside={<Link href="/admin/listings" className="font-semibold text-teal hover:underline">All listings</Link>} className="lg:col-span-2">
                    {latestListings.length === 0 && <p className="text-sm text-muted">Nobody has listed a home yet.</p>}
                    <ul className="divide-y divide-line">
                        {latestListings.map((l) => (
                            <li key={l.id}>
                                <Link href={`/admin/listings/${l.id}`} className="flex items-center gap-3 py-3 hover:bg-paper/60">
                                    <Thumb path={l.cover_image} />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold">{l.property_name ?? `Listing #${l.id}`}</p>
                                        <p className="truncate text-xs text-muted">
                                            {place(l)}, by {l.owner?.fullname}, {ago(l.created_at)}
                                        </p>
                                    </div>
                                    <span className="hidden text-sm font-semibold tabular-nums sm:block">{money(l.monthly_rent)}</span>
                                    <span className="hidden gap-1.5 md:flex">
                                        <StatusBadge status={l.status} />
                                        <VerifiedBadge at={l.verified_at} />
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Card>
                <Card title="Recent admin activity" aside={<Link href="/admin/activity" className="font-semibold text-teal hover:underline">Full log</Link>}>
                    {activity.length === 0 && <p className="text-sm text-muted">Nothing yet. Every verification, suspension and deletion is recorded here.</p>}
                    <ul className="space-y-3 text-sm">
                        {activity.map((a) => (
                            <li key={a.id}>
                                <p className="font-medium">{a.summary}</p>
                                <p className="text-xs text-muted">
                                    {a.admin?.fullname ?? 'Removed admin'}, {dateTime(a.created_at)}
                                </p>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </AdminLayout>
    );
}

/** A work queue: brass when something is waiting, calm when it is empty. */
function Queue(p: { href: string; icon: ComponentType<{ className?: string }>; n: number; label: string; hint: string }) {
    const waiting = p.n > 0;
    return (
        <Link href={p.href} className={`group rounded-2xl p-5 ring-1 transition-shadow hover:shadow-md ${waiting ? 'bg-sand ring-brass/50' : 'bg-white ring-line'}`}>
            <div className="flex items-start justify-between">
                <span className="font-display text-4xl font-extrabold tabular-nums">{p.n}</span>
                <p.icon className={`size-5 ${waiting ? 'text-brass-ink' : 'text-muted'}`} aria-hidden="true" />
            </div>
            <p className="mt-2 text-sm font-bold group-hover:underline">{p.label}</p>
            <p className="mt-0.5 text-xs text-muted">{p.n === 0 ? 'Nothing waiting' : p.hint}</p>
        </Link>
    );
}

function Total({ label, value, note }: { label: string; value: number; note: string }) {
    return (
        <div className="bg-white p-5">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="mt-1 font-display text-3xl font-extrabold tabular-nums">{value.toLocaleString('en-US')}</dd>
            <dd className="mt-1 text-xs text-muted">{note}</dd>
        </div>
    );
}

/** One bar per day. Hover or focus a column for the exact figure; the same numbers are in a table for screen readers. */
function SignupBars({ data }: { data: { date: string; count: number }[] }) {
    const max = Math.max(2, Math.ceil(Math.max(...data.map((d) => d.count)) / 2) * 2); // even, so the midline is a whole number
    const day = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    return (
        <figure>
            <div className="flex gap-3" aria-hidden="true">
                <div className="flex h-44 flex-col justify-between text-right text-xs tabular-nums text-muted">
                    <span>{max}</span>
                    <span>{max / 2}</span>
                    <span>0</span>
                </div>
                <div className="relative h-44 flex-1">
                    <div className="absolute inset-0 flex flex-col justify-between py-2">
                        <span className="border-t border-line" />
                        <span className="border-t border-line" />
                        <span className="border-t border-ink/30" />
                    </div>
                    <div className="absolute inset-0 flex items-end gap-0.5 py-2">
                        {data.map((d) => (
                            <div key={d.date} tabIndex={0} className="group relative flex h-full flex-1 items-end outline-none hover:bg-paper focus-visible:bg-paper">
                                <div className="w-full rounded-t-[4px] bg-teal group-hover:bg-navy group-focus-visible:bg-navy" style={{ height: d.count ? `max(3px, ${(d.count / max) * 100}%)` : 0 }} />
                                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-navy px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg group-hover:block group-focus-visible:block">
                                    {day(d.date)}: {d.count}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="ml-8 mt-1 flex justify-between text-xs text-muted" aria-hidden="true">
                <span>{day(data[0].date)}</span>
                <span>{day(data[Math.floor(data.length / 2)].date)}</span>
                <span>Today</span>
            </div>
            <table className="sr-only">
                <caption>New accounts per day</caption>
                <tbody>
                    {data.map((d) => (
                        <tr key={d.date}>
                            <th scope="row">{day(d.date)}</th>
                            <td>{d.count}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </figure>
    );
}

import { Link, router } from '@inertiajs/react';
import { Ban, RotateCcw } from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { Avatar, Badge, Card, Confirm, Facts, MessageButton, StatusBadge, Thumb, VerifiedBadge } from '@/components/ui';
import { country, date, dateTime, money, place, roleLabel } from '@/lib/format';
import type { Action, Listing, Person, Viewing } from '@/types';

type Props = { user: Person; business: { entity_name: string; status: string } | null; identity: { status: string; method: string; created_at: string } | null; houses: Listing[]; viewings: Viewing[]; reportsFiled: number; history: Action[] };

export default function UserShow({ user, business, identity, houses, viewings, reportsFiled, history }: Props) {
    return (
        <AdminLayout
            title={user.fullname}
            back={{ href: '/admin/users', label: 'Users' }}
            subtitle={
                <>
                    {user.suspended_at ? <Badge tone="bad">Suspended {date(user.suspended_at)}</Badge> : <Badge tone="good">Active</Badge>}
                    <span>{roleLabel[user.role] ?? user.role}, joined {date(user.created_at)}</span>
                </>
            }
            actions={
                <>
                <MessageButton user={user} />
                {user.suspended_at ? (
                    <Confirm label={<><RotateCcw className="size-4" /> Reactivate</>} variant="primary" title={`Reactivate ${user.fullname}?`} confirmLabel="Reactivate" onConfirm={() => router.post(`/admin/users/${user.id}/reactivate`, {}, { preserveScroll: true })}>
                        They will be able to sign in again and their available listings return to search.
                    </Confirm>
                ) : (
                    <Confirm label={<><Ban className="size-4" /> Suspend</>} variant="danger" danger title={`Suspend ${user.fullname}?`} confirmLabel="Suspend account" onConfirm={() => router.post(`/admin/users/${user.id}/suspend`, {}, { preserveScroll: true })}>
                        They are signed out of the app on every device and cannot sign in. Their listings are hidden from search. You can reverse this at any time.
                    </Confirm>
                )}
                </>
            }
        >
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-4">
                    <Card>
                        <div className="mb-5 flex items-center gap-4">
                            <Avatar name={user.fullname} className="size-14 text-lg" />
                            <div className="min-w-0">
                                <p className="truncate font-display text-lg font-bold">{user.fullname}</p>
                                <p className="text-sm text-muted">User #{user.id}</p>
                            </div>
                        </div>
                        <Facts
                            rows={[
                                ['Email', user.email ? <a className="text-teal hover:underline" href={`mailto:${user.email}`}>{user.email}</a> : 'None'],
                                ['Phone', user.phone ? <a className="text-teal hover:underline" href={`tel:${user.phone}`}>{user.phone}</a> : 'None'],
                                ['Country', country(user.country)],
                                ['Listings', houses.length],
                                ['Reports filed', reportsFiled],
                                ['Business', business ? <Link href={`/admin/business?status=${business.status === 'pending' ? 'pending' : 'all'}`} className="hover:underline">{business.entity_name} <StatusBadge status={business.status} /></Link> : 'None'],
                                ['Identity', <Link href={`/admin/identity?status=${identity?.status === 'pending' ? 'pending' : 'all'}`} className="hover:underline"><StatusBadge status={identity?.status ?? 'none'} /></Link>],
                            ]}
                        />
                    </Card>
                    <Card title="Role">
                        <label className="block text-sm text-muted">
                            Decides which workspace they see in the app.
                            <select value={user.role} onChange={(e) => router.patch(`/admin/users/${user.id}`, { role: e.target.value }, { preserveScroll: true })} className="mt-2 h-10 w-full rounded-lg bg-white px-3 text-sm font-medium text-ink ring-1 ring-inset ring-line">
                                <option value="renter">Tenant</option>
                                <option value="landlord">Landlord</option>
                                <option value="investor">Investor</option>
                            </select>
                        </label>
                    </Card>
                    <Card title="Admin history">
                        {history.length === 0 && <p className="text-sm text-muted">No admin has changed this account.</p>}
                        <ul className="space-y-3 text-sm">
                            {history.map((a) => (
                                <li key={a.id}>
                                    <p className="font-medium">{a.summary}</p>
                                    <p className="text-xs text-muted">{a.admin?.fullname ?? 'Removed admin'}, {dateTime(a.created_at)}</p>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>

                <div className="space-y-4 lg:col-span-2">
                    <Card title="Listings" aside={`${houses.length}`}>
                        {houses.length === 0 && <p className="text-sm text-muted">This person has not listed a home.</p>}
                        <ul className="divide-y divide-line">
                            {houses.map((h) => (
                                <li key={h.id}>
                                    <Link href={`/admin/listings/${h.id}`} className="flex items-center gap-3 py-3 hover:bg-paper/60">
                                        <Thumb path={h.cover_image} />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold">{h.property_name ?? `Listing #${h.id}`}</p>
                                            <p className="truncate text-xs text-muted">{place(h)}, {money(h.monthly_rent)} a month</p>
                                        </div>
                                        <span className="flex flex-wrap justify-end gap-1.5">
                                            {!!h.open_reports && <Badge tone="warn">{h.open_reports} open reports</Badge>}
                                            <StatusBadge status={h.status} />
                                            <VerifiedBadge at={h.verified_at} />
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Card>
                    <Card title="Viewing requests they sent" aside="Latest 10">
                        {viewings.length === 0 && <p className="text-sm text-muted">No viewing requests.</p>}
                        <ul className="divide-y divide-line text-sm">
                            {viewings.map((v) => (
                                <li key={v.id} className="flex items-center justify-between gap-3 py-2.5">
                                    <span className="min-w-0 truncate">
                                        {v.house ? <Link href={`/admin/listings/${v.house.id}`} className="font-medium hover:underline">{v.house.property_name}</Link> : 'Deleted listing'}
                                        <span className="text-muted"> for {dateTime(v.preferred_at)}</span>
                                    </span>
                                    <StatusBadge status={v.status} />
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}

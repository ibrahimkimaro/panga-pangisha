import { Link, router } from '@inertiajs/react';
import { EyeOff, RotateCcw, ShieldCheck, ShieldOff, Trash2 } from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { Avatar, Badge, Button, Card, Confirm, Facts, StatusBadge, Thumb, VerifiedBadge } from '@/components/ui';
import { ago, date, dateTime, money, place, roleLabel } from '@/lib/format';
import type { Action, Listing, Report, Viewing } from '@/types';

type Props = { listing: Listing; images: string[]; reports: Report[]; viewings: Viewing[]; history: Action[] };

export default function ListingShow({ listing: l, images, reports, viewings, history }: Props) {
    const name = l.property_name ?? `Listing #${l.id}`;
    const act = (action: string) => router.post(`/admin/listings/${l.id}/${action}`, {}, { preserveScroll: true });
    const setReport = (id: number, status: string) => router.patch(`/admin/reports/${id}`, { status }, { preserveScroll: true });
    const photos = [l.cover_image, ...images].filter((p): p is string => !!p);
    const pin = l.latitude && l.longitude ? `https://www.openstreetmap.org/?mlat=${l.latitude}&mlon=${l.longitude}#map=17/${l.latitude}/${l.longitude}` : null;

    return (
        <AdminLayout
            title={name}
            back={{ href: '/admin/listings', label: 'Listings' }}
            subtitle={
                <>
                    <StatusBadge status={l.status} />
                    <VerifiedBadge at={l.verified_at} />
                    <span>{place(l)}, listed {date(l.created_at)}</span>
                </>
            }
            actions={
                <>
                    {l.verified_at ? (
                        <Confirm label={<><ShieldOff className="size-4" /> Remove verification</>} title="Remove verification?" confirmLabel="Remove verification" onConfirm={() => act('unverify')}>
                            Renters will see this home as not verified again.
                        </Confirm>
                    ) : (
                        <Confirm label={<><ShieldCheck className="size-4" /> Mark as verified</>} variant="primary" title="Mark this listing as verified?" confirmLabel="Mark as verified" onConfirm={() => act('verify')}>
                            Only do this after you have checked that {l.owner?.fullname} has the right to let this home. Renters see a verified label on it.
                        </Confirm>
                    )}
                    {l.status === 'suspended' ? (
                        <Button onClick={() => act('restore')}><RotateCcw className="size-4" /> Restore listing</Button>
                    ) : (
                        <Confirm label={<><EyeOff className="size-4" /> Suspend</>} danger title={`Suspend “${name}”?`} confirmLabel="Suspend listing" onConfirm={() => act('suspend')}>
                            The listing disappears from search and the owner cannot republish it. You can restore it later.
                        </Confirm>
                    )}
                    <Confirm label={<><Trash2 className="size-4" /> Delete</>} danger title={`Delete “${name}”?`} confirmLabel="Delete for good" onConfirm={() => router.delete(`/admin/listings/${l.id}`)}>
                        This removes the listing with its viewing requests and reports. It cannot be undone. To hide it instead, suspend it.
                    </Confirm>
                </>
            }
        >
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    <Card>
                        {photos.length === 0 ? (
                            <p className="text-sm text-muted">This listing has no photos.</p>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {photos.map((p, i) => (
                                    <a key={p + i} href={`/storage/${p}`} target="_blank" rel="noreferrer" className={i === 0 ? 'col-span-2 row-span-2' : ''}>
                                        <img src={`/storage/${p}`} alt={`Photo ${i + 1} of ${name}`} className="aspect-[4/3] size-full rounded-xl object-cover" />
                                    </a>
                                ))}
                            </div>
                        )}
                        <p className="mt-5 font-display text-2xl font-extrabold tabular-nums">
                            {money(l.monthly_rent)} <span className="font-sans text-sm font-medium text-muted">a month</span>
                        </p>
                        {l.description && <p className="mt-3 max-w-prose text-sm leading-relaxed">{l.description}</p>}
                        {!!l.amenities?.length && (
                            <div className="mt-4 flex flex-wrap gap-1.5">
                                {l.amenities.map((a) => <Badge key={a}>{a}</Badge>)}
                            </div>
                        )}
                    </Card>

                    <Card title="Details">
                        <Facts
                            rows={[
                                ['Type', l.property_type ?? 'Not set'],
                                ['Bedrooms', l.bedrooms ?? 'Not set'],
                                ['Bathrooms', l.bathrooms ?? 'Not set'],
                                ['Deposit', l.security_deposit == null ? 'Not set' : money(l.security_deposit)],
                                ['Payment terms', l.lease_duration ?? 'Not set'],
                                ['NAPA Number', l.napa_number ? <span className="font-mono font-semibold text-teal">{l.napa_number}</span> : 'Not set'],
                                ['Address', [l.house_number, l.street, l.ward, l.district, l.region].filter(Boolean).join(', ') || 'Not set'],
                                ['Exact pin', pin ? <a href={pin} target="_blank" rel="noreferrer" className="text-teal hover:underline font-medium">Open on OpenStreetMap ({l.latitude}, {l.longitude})</a> : 'No pin'],
                            ]}
                        />
                        <p className="mt-4 text-xs text-muted">Renters only see the ward and an approximate area. The house number, NAPA code, and exact pin are shown to admins and the owner.</p>
                    </Card>

                    {l.units && l.units.length > 0 && (
                        <Card title="Units & Rooms" aside={`${l.units.length} total units`}>
                            <div className="divide-y divide-line">
                                {l.units.map((u) => {
                                    const img = u.image_url ?? (u.image_path ? `/storage/${u.image_path}` : null);
                                    return (
                                        <div key={u.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-3.5">
                                            <div className="flex items-start gap-3.5 min-w-0 flex-1">
                                                {img ? (
                                                    <a href={img} target="_blank" rel="noreferrer" className="shrink-0">
                                                        <img src={img} alt={u.unit_number} className="size-16 rounded-xl object-cover ring-1 ring-line hover:opacity-90" />
                                                    </a>
                                                ) : (
                                                    <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-sand text-xs font-semibold text-muted">
                                                        No pic
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold text-wino truncate">{u.unit_number}</h4>
                                                        {u.unit_type && <Badge>{u.unit_type}</Badge>}
                                                    </div>
                                                    {u.description && <p className="mt-0.5 text-xs text-muted line-clamp-2">{u.description}</p>}
                                                    {u.payment_terms && <p className="mt-1 text-xs font-medium text-teal">Terms: {u.payment_terms}</p>}
                                                </div>
                                            </div>
                                            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 gap-1.5">
                                                <span className="font-display text-base font-bold tabular-nums text-wino">
                                                    {money(u.monthly_rent)} <span className="text-xs font-normal text-muted">/mo</span>
                                                </span>
                                                <StatusBadge status={u.status} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    )}

                    <Card title="Reports" aside={`${reports.filter((r) => r.status === 'open').length} open`}>
                        {reports.length === 0 && <p className="text-sm text-muted">Nobody has reported this listing.</p>}
                        <ul className="divide-y divide-line">
                            {reports.map((r) => (
                                <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold">{r.reason} <StatusBadge status={r.status} /></p>
                                        {r.details && <p className="mt-1 text-muted">{r.details}</p>}
                                        <p className="mt-1 text-xs text-muted">{r.reporter?.fullname ?? 'Deleted user'}, {dateTime(r.created_at)}</p>
                                    </div>
                                    {r.status === 'open' && (
                                        <span className="flex gap-2">
                                            <Button onClick={() => setReport(r.id, 'dismissed')}>Dismiss</Button>
                                            <Button variant="primary" onClick={() => setReport(r.id, 'resolved')}>Resolve</Button>
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card title="Advertiser">
                        {l.owner && (
                            <Link href={`/admin/users/${l.owner.id}`} className="mb-4 flex items-center gap-3 hover:underline">
                                <Avatar name={l.owner.fullname} className="size-11 text-base" />
                                <span className="min-w-0">
                                    <span className="block truncate font-semibold">{l.owner.fullname}</span>
                                    <span className="block text-xs text-muted">{roleLabel[l.owner.role] ?? l.owner.role}, joined {date(l.owner.created_at)}</span>
                                </span>
                            </Link>
                        )}
                        {l.owner?.suspended_at && <p className="mb-3 rounded-lg bg-blush px-3 py-2 text-xs font-semibold text-hibiscus">This account is suspended, so the listing is hidden from search.</p>}
                        <Facts
                            rows={[
                                ['Advertising as', l.advertiser_role === 'representative' ? 'Representative of the owner' : 'The owner'],
                                ['Phone', l.owner?.phone ?? 'None'],
                                ['Email', l.owner?.email ?? 'None'],
                                ['Verified', l.verified_at ? date(l.verified_at) : 'Not yet'],
                                ['Confirmed available', ago(l.availability_confirmed_at)],
                            ]}
                        />
                    </Card>
                    <Card title="Viewing requests" aside="Latest 10">
                        {viewings.length === 0 && <p className="text-sm text-muted">No viewing requests yet.</p>}
                        <ul className="divide-y divide-line text-sm">
                            {viewings.map((v) => (
                                <li key={v.id} className="flex items-center justify-between gap-3 py-2.5">
                                    <span className="min-w-0">
                                        <span className="block truncate font-medium">{v.user?.fullname ?? 'Deleted user'}</span>
                                        <span className="block text-xs text-muted">{dateTime(v.preferred_at)}</span>
                                    </span>
                                    <StatusBadge status={v.status} />
                                </li>
                            ))}
                        </ul>
                    </Card>
                    <Card title="Admin history">
                        {history.length === 0 && <p className="text-sm text-muted">No admin has changed this listing.</p>}
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
            </div>
        </AdminLayout>
    );
}

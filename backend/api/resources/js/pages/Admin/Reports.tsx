import { Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { Button, Empty, LinkButton, Pagination, StatusBadge, Thumb } from '@/components/ui';
import { dateTime, place } from '@/lib/format';
import type { Paged, Report } from '@/types';

const tabs = [['open', 'Open'], ['resolved', 'Resolved'], ['dismissed', 'Dismissed'], ['all', 'All']];

export default function Reports({ reports, filters }: { reports: Paged<Report>; filters: { status: string } }) {
    const set = (id: number, status: string) => router.patch(`/admin/reports/${id}`, { status }, { preserveScroll: true });
    return (
        <AdminLayout title="Reports" subtitle="Listings that renters flagged from the app">
            <nav className="mb-4 flex gap-1 overflow-x-auto" aria-label="Report status">
                {tabs.map(([value, label]) => (
                    <Link key={value} href={`/admin/reports?status=${value}`} aria-current={filters.status === value ? 'page' : undefined} className={`rounded-lg px-3.5 py-2 text-sm font-semibold ${filters.status === value ? 'bg-navy text-white' : 'bg-white text-ink ring-1 ring-inset ring-line hover:bg-paper'}`}>
                        {label}
                    </Link>
                ))}
            </nav>

            {reports.data.length === 0 ? (
                <Empty title={filters.status === 'open' ? 'No open reports' : 'Nothing here'}>
                    {filters.status === 'open' ? 'When a renter reports a listing from the app it lands here.' : 'No reports have this status.'}
                </Empty>
            ) : (
                <ul className="space-y-3">
                    {reports.data.map((r) => (
                        <li key={r.id} className="flex flex-wrap items-start gap-4 rounded-2xl bg-white p-5 ring-1 ring-line">
                            <Thumb path={r.house?.cover_image ?? null} className="size-16 rounded-xl" />
                            <div className="min-w-0 flex-1 basis-64 text-sm">
                                <p className="flex flex-wrap items-center gap-2 font-display text-base font-bold">
                                    {r.reason} <StatusBadge status={r.status} />
                                </p>
                                {r.details && <p className="mt-1 max-w-prose">{r.details}</p>}
                                <p className="mt-2 text-muted">
                                    {r.house ? (
                                        <>
                                            On <Link href={`/admin/listings/${r.house.id}`} className="font-semibold text-teal hover:underline">{r.house.property_name ?? `Listing #${r.house.id}`}</Link> in {place(r.house)}, advertised by{' '}
                                            <Link href={`/admin/users/${r.house.owner_id}`} className="font-semibold text-teal hover:underline">{r.house.owner?.fullname}</Link>
                                        </>
                                    ) : (
                                        'The listing was deleted'
                                    )}
                                </p>
                                <p className="mt-1 text-xs text-muted">
                                    Reported by {r.reporter ? <Link href={`/admin/users/${r.reporter.id}`} className="hover:underline">{r.reporter.fullname}</Link> : 'a deleted user'}, {dateTime(r.created_at)}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {r.house && <LinkButton href={`/admin/listings/${r.house.id}`}>Review listing</LinkButton>}
                                {r.status === 'open' ? (
                                    <>
                                        <Button onClick={() => set(r.id, 'dismissed')}>Dismiss</Button>
                                        <Button variant="primary" onClick={() => set(r.id, 'resolved')}>Resolve</Button>
                                    </>
                                ) : (
                                    <Button onClick={() => set(r.id, 'open')}>Reopen</Button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            <Pagination page={reports} noun="reports" />
        </AdminLayout>
    );
}

import { Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { Badge, Empty, Filters, Pagination, StatusBadge, Table, Thumb, VerifiedBadge } from '@/components/ui';
import { Download } from 'lucide-react';
import { ago, money, place } from '@/lib/format';
import type { Listing, Paged } from '@/types';

export default function Listings({ listings, filters }: { listings: Paged<Listing>; filters: Record<string, string | undefined> }) {
    const query = new URLSearchParams(Object.entries(filters).filter((e): e is [string, string] => !!e[1])).toString();
    return (
        <AdminLayout
            title="Listings"
            subtitle={filters.stale ? 'Live homes whose owner has not confirmed availability for 30 days' : 'Every home advertised on the app'}
            actions={
                <a href={`/admin/listings/export?${query}`} className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold ring-1 ring-inset ring-line hover:bg-paper">
                    <Download className="size-4" aria-hidden="true" /> Download as CSV
                </a>
            }
        >
            <Filters
                path="/admin/listings"
                filters={filters}
                search="Search name, district or ward"
                selects={[
                    { name: 'status', label: 'Status', options: [['available', 'Live'], ['rented', 'Rented'], ['reserved', 'Reserved'], ['maintenance', 'Maintenance'], ['suspended', 'Suspended']] },
                    { name: 'verified', label: 'Verification', options: [['no', 'Not verified'], ['yes', 'Verified']] },
                ]}
            />
            {listings.data.length === 0 ? (
                <Empty title="No listings match">Clear the filters to see every listing.</Empty>
            ) : (
                <Table head={['Home', 'Advertiser', 'Rent a month', 'Status', 'Verification', 'Confirmed available']}>
                    {listings.data.map((l) => (
                        <tr key={l.id}>
                            <td>
                                <Link href={`/admin/listings/${l.id}`} className="flex items-center gap-3">
                                    <Thumb path={l.cover_image} />
                                    <span className="min-w-0">
                                        <span className="block max-w-64 truncate font-semibold hover:underline">{l.property_name ?? `Listing #${l.id}`}</span>
                                        <span className="block truncate text-xs text-muted">{place(l)}</span>
                                    </span>
                                </Link>
                            </td>
                            <td>
                                <Link href={`/admin/users/${l.owner_id}`} className="whitespace-nowrap hover:underline">{l.owner?.fullname}</Link>
                                {l.owner?.suspended_at && <span className="block text-xs font-semibold text-hibiscus">Account suspended</span>}
                            </td>
                            <td className="whitespace-nowrap font-semibold tabular-nums">{money(l.monthly_rent)}</td>
                            <td>
                                <span className="flex flex-wrap gap-1.5">
                                    <StatusBadge status={l.status} />
                                    {!!l.open_reports && <Badge tone="warn">{l.open_reports} reports</Badge>}
                                </span>
                            </td>
                            <td><VerifiedBadge at={l.verified_at} /></td>
                            <td className="whitespace-nowrap text-muted">{ago(l.availability_confirmed_at)}</td>
                        </tr>
                    ))}
                </Table>
            )}
            <Pagination page={listings} noun="listings" />
        </AdminLayout>
    );
}

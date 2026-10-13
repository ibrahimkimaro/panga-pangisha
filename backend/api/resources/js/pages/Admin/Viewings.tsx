import { Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { Empty, Filters, Pagination, StatusBadge, Table } from '@/components/ui';
import { ago, dateTime, place } from '@/lib/format';
import type { Paged, Viewing } from '@/types';

export default function Viewings({ viewings, filters }: { viewings: Paged<Viewing>; filters: Record<string, string | undefined> }) {
    return (
        <AdminLayout title="Viewing requests" subtitle="Renters asking owners for a time to see a home">
            <Filters path="/admin/viewings" filters={filters} selects={[{ name: 'status', label: 'Status', options: [['pending', 'Pending'], ['accepted', 'Accepted'], ['declined', 'Declined'], ['cancelled', 'Cancelled']] }]} />
            {viewings.data.length === 0 ? (
                <Empty title="No viewing requests">Requests appear here as soon as a renter sends one from a listing.</Empty>
            ) : (
                <Table head={['Home', 'Renter', 'Owner', 'Wants to visit', 'Note', 'Status', 'Sent']}>
                    {viewings.data.map((v) => (
                        <tr key={v.id}>
                            <td>
                                {v.house ? (
                                    <Link href={`/admin/listings/${v.house.id}`} className="block max-w-56">
                                        <span className="block truncate font-semibold hover:underline">{v.house.property_name}</span>
                                        <span className="block truncate text-xs text-muted">{place(v.house)}</span>
                                    </Link>
                                ) : 'Deleted listing'}
                            </td>
                            <td>{v.user ? <Link href={`/admin/users/${v.user.id}`} className="whitespace-nowrap hover:underline">{v.user.fullname}</Link> : 'Deleted user'}</td>
                            <td>{v.house?.owner ? <Link href={`/admin/users/${v.house.owner_id}`} className="whitespace-nowrap hover:underline">{v.house.owner.fullname}</Link> : ''}</td>
                            <td className="whitespace-nowrap tabular-nums">{dateTime(v.preferred_at)}</td>
                            <td className="max-w-64 truncate text-muted" title={v.note ?? ''}>{v.note ?? ''}</td>
                            <td><StatusBadge status={v.status} /></td>
                            <td className="whitespace-nowrap text-muted">{ago(v.created_at)}</td>
                        </tr>
                    ))}
                </Table>
            )}
            <Pagination page={viewings} noun="requests" />
        </AdminLayout>
    );
}

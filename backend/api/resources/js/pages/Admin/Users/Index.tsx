import { Link, router } from '@inertiajs/react';
import AdminLayout from '@/layouts/AdminLayout';
import { Avatar, Badge, Confirm, Empty, Filters, Pagination, Table } from '@/components/ui';
import { Download, Trash2 } from 'lucide-react';
import { country, date, roleLabel } from '@/lib/format';
import type { Paged, Person } from '@/types';

export default function Users({ users, filters, countries }: { users: Paged<Person>; filters: Record<string, string | undefined>; countries: string[] }) {
    const query = new URLSearchParams(Object.entries(filters).filter((e): e is [string, string] => !!e[1])).toString();
    return (
        <AdminLayout
            title="Users"
            subtitle="Everyone with an account on the app"
            actions={
                <a href={`/admin/users/export?${query}`} className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-sm font-semibold ring-1 ring-inset ring-line hover:bg-paper">
                    <Download className="size-4" aria-hidden="true" /> Download as CSV
                </a>
            }
        >
            <Filters
                path="/admin/users"
                filters={filters}
                search="Search name, email or phone"
                selects={[
                    { name: 'role', label: 'Role', options: [['renter', 'Tenants'], ['landlord', 'Landlords'], ['investor', 'Investors']] },
                    { name: 'status', label: 'Status', options: [['active', 'Active'], ['suspended', 'Suspended']] },
                    { name: 'country', label: 'Country', options: countries.map((c) => [c, country(c)] as [string, string]) },
                ]}
            />
            {users.data.length === 0 ? (
                <Empty title="No users match">Try a shorter search, or clear the filters.</Empty>
            ) : (
                <Table head={['Person', 'Phone', 'Country', 'Role', 'Listings', 'Joined', 'Status', '']}>
                    {users.data.map((u) => (
                        <tr key={u.id}>
                            <td>
                                <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3">
                                    <Avatar name={u.fullname} />
                                    <span className="min-w-0">
                                        <span className="block truncate font-semibold hover:underline">{u.fullname}</span>
                                        <span className="block truncate text-xs text-muted">{u.email ?? 'No email'}</span>
                                    </span>
                                </Link>
                            </td>
                            <td className="whitespace-nowrap tabular-nums">{u.phone ?? 'None'}</td>
                            <td className="whitespace-nowrap">{country(u.country)}</td>
                            <td>{roleLabel[u.role] ?? u.role}</td>
                            <td className="tabular-nums">{u.houses_count}</td>
                            <td className="whitespace-nowrap text-muted">{date(u.created_at)}</td>
                            <td>{u.suspended_at ? <Badge tone="bad">Suspended</Badge> : <Badge tone="good">Active</Badge>}</td>
                            <td className="whitespace-nowrap text-right">
                                <Confirm
                                    label={<span className="inline-flex items-center p-1.5 text-muted hover:text-red-600 rounded-md hover:bg-red-50"><Trash2 className="size-4" /></span>}
                                    variant="danger"
                                    danger
                                    title={`Permanently delete ${u.fullname}?`}
                                    confirmLabel="Delete"
                                    onConfirm={() => router.delete(`/admin/users/${u.id}`, { preserveScroll: true })}
                                >
                                    This will permanently delete this account, their properties, tokens, and records.
                                </Confirm>
                            </td>
                        </tr>
                    ))}
                </Table>
            )}
            <Pagination page={users} noun="users" />
        </AdminLayout>
    );
}

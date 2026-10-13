import AdminLayout from '@/layouts/AdminLayout';
import { Empty, Pagination, Table } from '@/components/ui';
import { dateTime } from '@/lib/format';
import type { Action, Paged } from '@/types';

export default function Activity({ actions }: { actions: Paged<Action> }) {
    return (
        <AdminLayout title="Activity log" subtitle="Every change an admin made, newest first. Entries cannot be edited.">
            {actions.data.length === 0 ? (
                <Empty title="No activity yet">Verifications, suspensions, role changes and deletions are recorded here.</Empty>
            ) : (
                <Table head={['When', 'Admin', 'What changed']}>
                    {actions.data.map((a) => (
                        <tr key={a.id}>
                            <td className="whitespace-nowrap tabular-nums text-muted">{dateTime(a.created_at)}</td>
                            <td className="whitespace-nowrap">{a.admin?.fullname ?? 'Removed admin'}</td>
                            <td className="font-medium">{a.summary}</td>
                        </tr>
                    ))}
                </Table>
            )}
            <Pagination page={actions} noun="entries" />
        </AdminLayout>
    );
}

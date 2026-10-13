import { router, useForm, usePage } from '@inertiajs/react';
import { UserPlus } from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { Avatar, Badge, Button, Card, Confirm, Table } from '@/components/ui';
import { date } from '@/lib/format';
import type { Shared } from '@/types';

type Admin = { id: number; fullname: string; email: string; suspended_at: string | null; created_at: string };

export default function Team({ admins }: { admins: Admin[] }) {
    const me = usePage<Shared>().props.auth.user?.id;
    const form = useForm({ fullname: '', email: '', password: '' });
    const field = 'mt-1.5 h-10 w-full rounded-lg bg-white px-3 text-sm font-normal ring-1 ring-inset ring-line';
    const error = (key: 'fullname' | 'email' | 'password') => form.errors[key] && <span className="mt-1 block text-xs font-semibold text-hibiscus">{form.errors[key]}</span>;

    return (
        <AdminLayout title="Team" subtitle="People who can sign in to this panel">
            <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <Table head={['Admin', 'Added', 'Access', '']}>
                        {admins.map((a) => (
                            <tr key={a.id}>
                                <td>
                                    <span className="flex items-center gap-3">
                                        <Avatar name={a.fullname} />
                                        <span className="min-w-0">
                                            <span className="block truncate font-semibold">
                                                {a.fullname} {a.id === me && <span className="font-normal text-muted">(you)</span>}
                                            </span>
                                            <span className="block truncate text-xs text-muted">{a.email}</span>
                                        </span>
                                    </span>
                                </td>
                                <td className="whitespace-nowrap text-muted">{date(a.created_at)}</td>
                                <td>{a.suspended_at ? <Badge tone="bad">Removed</Badge> : <Badge tone="good">Active</Badge>}</td>
                                <td className="text-right">
                                    {a.id !== me &&
                                        (a.suspended_at ? (
                                            <Button onClick={() => router.post(`/admin/team/${a.id}/toggle`, {}, { preserveScroll: true })}>Restore access</Button>
                                        ) : (
                                            <Confirm label="Remove access" danger title={`Remove ${a.fullname}'s access?`} confirmLabel="Remove access" onConfirm={() => router.post(`/admin/team/${a.id}/toggle`, {}, { preserveScroll: true })}>
                                                They are signed out on their next click and cannot sign in. You can restore them later.
                                            </Confirm>
                                        ))}
                                </td>
                            </tr>
                        ))}
                    </Table>
                </div>

                <Card title="Add an admin">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.post('/admin/team', { preserveScroll: true, onSuccess: () => form.reset() });
                        }}
                    >
                        <label className="block text-sm font-semibold">
                            Full name
                            <input required value={form.data.fullname} onChange={(e) => form.setData('fullname', e.target.value)} className={field} />
                            {error('fullname')}
                        </label>
                        <label className="mt-3 block text-sm font-semibold">
                            Email
                            <input required type="email" autoComplete="off" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} className={field} />
                            {error('email')}
                        </label>
                        <label className="mt-3 block text-sm font-semibold">
                            Password
                            <input required type="text" autoComplete="new-password" value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} className={field} />
                            <span className="mt-1 block text-xs font-normal text-muted">At least 10 characters with letters and numbers. Give it to them yourself; it is not emailed.</span>
                            {error('password')}
                        </label>
                        <Button type="submit" variant="primary" disabled={form.processing} className="mt-4 w-full">
                            <UserPlus className="size-4" /> Add admin
                        </Button>
                    </form>
                    <p className="mt-4 text-xs text-muted">Admins can see NIDA details, suspend accounts and delete listings. Add only people who need that.</p>
                </Card>
            </div>
        </AdminLayout>
    );
}

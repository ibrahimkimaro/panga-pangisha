import { useForm } from '@inertiajs/react';
import { Bell, Send } from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { Card, Confirm } from '@/components/ui';
import { dateTime } from '@/lib/format';
import type { Action } from '@/types';

type Audience = { key: string; label: string; count: number };

export default function Announcements({ audiences, sent }: { audiences: Audience[]; sent: Action[] }) {
    const form = useForm({ audience: 'all', title: '', body: '' });
    const to = audiences.find((a) => a.key === form.data.audience) ?? audiences[0];
    const ready = form.data.title.trim() !== '' && form.data.body.trim() !== '' && to.count > 0;
    const field = 'mt-1.5 w-full rounded-lg bg-white px-3 py-2 text-sm font-normal ring-1 ring-inset ring-line';

    return (
        <AdminLayout title="Announcements" subtitle="A message from Panga that lands in the app's notification list">
            <div className="grid gap-4 lg:grid-cols-5">
                <Card title="New announcement" className="lg:col-span-3">
                    <fieldset>
                        <legend className="text-sm font-semibold">Who gets it</legend>
                        <div className="mt-1.5 grid gap-2 sm:grid-cols-3">
                            {audiences.map((a) => (
                                <label key={a.key} className={`cursor-pointer rounded-xl p-3 ring-1 ring-inset ${form.data.audience === a.key ? 'bg-mint ring-teal/40' : 'ring-line hover:bg-paper'}`}>
                                    <input type="radio" name="audience" value={a.key} checked={form.data.audience === a.key} onChange={() => form.setData('audience', a.key)} className="sr-only" />
                                    <span className="block text-sm font-semibold">{a.label}</span>
                                    <span className="block text-xs tabular-nums text-muted">{a.count} {a.count === 1 ? 'person' : 'people'}</span>
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    <label className="mt-4 block text-sm font-semibold">
                        Title
                        <input value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} maxLength={80} placeholder="Planned maintenance on Sunday" className={`${field} h-10`} />
                        {form.errors.title && <span className="mt-1 block text-xs font-semibold text-hibiscus">{form.errors.title}</span>}
                    </label>
                    <label className="mt-4 block text-sm font-semibold">
                        <span className="flex justify-between">
                            Message <span className="font-normal tabular-nums text-muted">{form.data.body.length} of 400</span>
                        </span>
                        <textarea value={form.data.body} onChange={(e) => form.setData('body', e.target.value)} maxLength={400} rows={4} placeholder="The app will be unavailable from 2:00 to 3:00 in the morning." className={field} />
                        {form.errors.body && <span className="mt-1 block text-xs font-semibold text-hibiscus">{form.errors.body}</span>}
                    </label>

                    <div className="mt-5 flex items-center justify-between gap-3">
                        <p className="text-xs text-muted">It cannot be taken back once sent.</p>
                        {ready ? (
                            <Confirm
                                label={<><Send className="size-4" /> Send to {to.count} {to.count === 1 ? 'person' : 'people'}</>}
                                variant="primary"
                                title={`Send this to ${to.label.toLowerCase()}?`}
                                confirmLabel="Send now"
                                onConfirm={() => form.post('/admin/announcements', { preserveScroll: true, onSuccess: () => form.reset('title', 'body') })}
                            >
                                {to.count} {to.count === 1 ? 'person gets' : 'people get'} “{form.data.title}” in their notifications straight away.
                            </Confirm>
                        ) : (
                            <span className="text-sm text-muted">{to.count === 0 ? 'Nobody is in this group yet.' : 'Write a title and a message.'}</span>
                        )}
                    </div>
                </Card>

                <div className="space-y-4 lg:col-span-2">
                    <Card title="How it looks in the app">
                        <div className="flex gap-3 rounded-xl bg-paper p-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-navy text-teal-bright">
                                <Bell className="size-4" aria-hidden="true" />
                            </span>
                            <div className="min-w-0 text-sm">
                                <p className="break-words font-semibold">{form.data.title || 'Your title'}</p>
                                <p className="mt-0.5 break-words text-muted">{form.data.body || 'Your message appears here.'}</p>
                            </div>
                        </div>
                    </Card>
                    <Card title="Sent before" aside="Latest 15">
                        {sent.length === 0 && <p className="text-sm text-muted">Nothing has been sent yet.</p>}
                        <ul className="space-y-3 text-sm">
                            {sent.map((a) => (
                                <li key={a.id}>
                                    <p className="break-words font-medium">{a.summary}</p>
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

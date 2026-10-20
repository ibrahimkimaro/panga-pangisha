import { Link, router } from '@inertiajs/react';
import { Ban, Check, Copy, Eye, EyeOff, KeyRound, RotateCcw, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import { Avatar, Badge, Button, Card, Confirm, Facts, MessageButton, StatusBadge, Thumb, VerifiedBadge } from '@/components/ui';
import { country, date, dateTime, money, place, roleLabel } from '@/lib/format';
import type { Action, Listing, Person, Viewing } from '@/types';

type Props = { user: Person; business: { entity_name: string; status: string } | null; identity: { status: string; method: string; created_at: string } | null; houses: Listing[]; viewings: Viewing[]; reportsFiled: number; history: Action[] };

export default function UserShow({ user, business, identity, houses, viewings, reportsFiled, history }: Props) {
    const passwordDialogRef = useRef<HTMLDialogElement>(null);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [revokeSessions, setRevokeSessions] = useState(true);
    const [notifyUser, setNotifyUser] = useState(true);
    const [copied, setCopied] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const generateStrongPassword = () => {
        const letters = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ';
        const numbers = '23456789';
        const specials = '!@#$%&*';
        let randomPass = '';
        for (let i = 0; i < 6; i++) {
            randomPass += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        for (let i = 0; i < 3; i++) {
            randomPass += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }
        randomPass += specials.charAt(Math.floor(Math.random() * specials.length));
        // Shuffle
        const finalPass = randomPass.split('').sort(() => 0.5 - Math.random()).join('');
        setPassword(finalPass);
        setShowPassword(true);
        navigator.clipboard?.writeText(finalPass);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!password || password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        setSubmitting(true);
        setError('');
        router.post(`/admin/users/${user.id}/password`, {
            password,
            revoke_sessions: revokeSessions,
            notify_user: notifyUser,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                passwordDialogRef.current?.close();
                setPassword('');
                setSubmitting(false);
            },
            onError: (errs) => {
                setError(Object.values(errs)[0] as string || 'Failed to update password');
                setSubmitting(false);
            },
            onFinish: () => setSubmitting(false),
        });
    };

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
                <Button variant="secondary" onClick={() => { setError(''); passwordDialogRef.current?.showModal(); }}>
                    <KeyRound className="size-4 text-teal" /> Change Password
                </Button>
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
                <Confirm label={<><Trash2 className="size-4" /> Delete</>} variant="danger" danger title={`Permanently delete ${user.fullname}?`} confirmLabel="Delete user" onConfirm={() => router.delete(`/admin/users/${user.id}`)}>
                    This will permanently delete this account, their properties, tokens, and records. This action cannot be undone.
                </Confirm>
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
                    <Card title="Security & Authentication">
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted">Account Status</span>
                                <span className="font-semibold text-teal flex items-center gap-1">
                                    <ShieldCheck className="size-4" /> Protected
                                </span>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-line">
                                <div>
                                    <p className="font-medium">Password Access</p>
                                    <p className="text-xs text-muted">Admin can reset credentials</p>
                                </div>
                                <Button
                                    variant="secondary"
                                    className="!py-1.5 !px-3 text-xs"
                                    onClick={() => { setError(''); passwordDialogRef.current?.showModal(); }}
                                >
                                    <KeyRound className="size-3.5 text-teal" /> Reset
                                </Button>
                            </div>
                        </div>
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

            {/* Change Password Dialog Modal */}
            <dialog
                ref={passwordDialogRef}
                className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl bg-white p-6 text-left text-ink shadow-2xl backdrop:bg-navy/40"
            >
                <form onSubmit={handlePasswordSubmit}>
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-mint text-teal">
                            <KeyRound className="size-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Change User Password</h2>
                            <p className="text-xs text-muted">Update authentication credentials for {user.fullname}</p>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 rounded-lg bg-blush p-3 text-xs text-hibiscus ring-1 ring-hibiscus/20">
                            {error}
                        </div>
                    )}

                    <div className="mt-5 space-y-4">
                        <div>
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-semibold">
                                    New Password
                                </label>
                                <button
                                    type="button"
                                    onClick={generateStrongPassword}
                                    className="flex items-center gap-1 text-xs font-semibold text-teal hover:underline"
                                >
                                    <Sparkles className="size-3.5" />
                                    {copied ? (
                                        <span className="text-teal font-bold flex items-center gap-1">
                                            <Check className="size-3" /> Copied!
                                        </span>
                                    ) : (
                                        'Generate strong password'
                                    )}
                                </button>
                            </div>
                            <div className="relative mt-1.5">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter at least 6 characters"
                                    minLength={6}
                                    required
                                    className="h-10 w-full rounded-lg bg-white pl-3 pr-10 text-sm font-normal ring-1 ring-inset ring-line focus:ring-2 focus:ring-teal focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2.5 top-2.5 text-muted hover:text-ink"
                                    title={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                            <p className="mt-1 text-[11px] text-muted">Must be at least 6 characters long.</p>
                        </div>

                        <div className="rounded-xl bg-paper/60 p-3.5 space-y-2.5 text-xs text-ink">
                            <label className="flex items-start gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={revokeSessions}
                                    onChange={(e) => setRevokeSessions(e.target.checked)}
                                    className="mt-0.5 size-4 rounded border-line text-teal focus:ring-teal"
                                />
                                <div>
                                    <span className="font-semibold">Revoke active sessions and tokens</span>
                                    <p className="text-muted text-[11px]">Signs this user out of all active mobile apps and web browser sessions immediately.</p>
                                </div>
                            </label>

                            <label className="flex items-start gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={notifyUser}
                                    onChange={(e) => setNotifyUser(e.target.checked)}
                                    className="mt-0.5 size-4 rounded border-line text-teal focus:ring-teal"
                                />
                                <div>
                                    <span className="font-semibold">Send security notice to user</span>
                                    <p className="text-muted text-[11px]">Sends an in-app security notification informing them their password was updated by administration.</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <Button
                            variant="secondary"
                            type="button"
                            onClick={() => {
                                passwordDialogRef.current?.close();
                                setPassword('');
                                setError('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            disabled={submitting || !password || password.length < 6}
                        >
                            {submitting ? 'Updating...' : 'Update Password'}
                        </Button>
                    </div>
                </form>
            </dialog>
        </AdminLayout>
    );
}

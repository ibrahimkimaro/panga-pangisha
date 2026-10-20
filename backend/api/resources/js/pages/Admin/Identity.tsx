import { Link, router } from '@inertiajs/react';
import { Check, Copy, IdCard, ImageIcon, X } from 'lucide-react';
import { useRef, useState } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import { Avatar, Button, Empty, Pagination, StatusBadge } from '@/components/ui';
import { date, dateTime, nida, waited } from '@/lib/format';
import type { IdentityCheck, Paged } from '@/types';

const tabs = [['pending', 'Waiting'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['all', 'All']];
const reasons = [
    'The NIDA number does not match the name on your account.',
    'The photo is blurry or cut off. Take it again in good light with all four corners showing.',
    'This is not a NIDA card. Send your national ID.',
];

export default function Identity({ checks, filters }: { checks: Paged<IdentityCheck>; filters: { status: string } }) {
    const [rejecting, setRejecting] = useState<IdentityCheck | null>(null); // the check the reason dialog is about
    const revoking = rejecting?.status === 'approved';
    const [reason, setReason] = useState('');
    const [viewing, setViewing] = useState<IdentityCheck | null>(null);
    const rejectDialog = useRef<HTMLDialogElement>(null);
    const photoDialog = useRef<HTMLDialogElement>(null);

    const decide = (c: IdentityCheck, decision: 'approved' | 'rejected', why?: string) =>
        router.post(`/admin/identity/${c.id}`, { decision, reason: why }, { preserveScroll: true });

    return (
        <AdminLayout
            title="Identity checks"
            live={['checks']}
            subtitle={
                <>
                    <span className="relative flex size-2">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-teal opacity-60" />
                        <span className="relative inline-flex size-2 rounded-full bg-teal" />
                    </span>
                    Live. New submissions appear on their own, and the landlord's app opens the moment you decide.
                </>
            }
        >
            <nav className="mb-4 flex gap-1 overflow-x-auto" aria-label="Check status">
                {tabs.map(([value, label]) => (
                    <Link key={value} href={`/admin/identity?status=${value}`} aria-current={filters.status === value ? 'page' : undefined} className={`rounded-lg px-3.5 py-2 text-sm font-semibold ${filters.status === value ? 'bg-navy text-white' : 'bg-white text-ink ring-1 ring-inset ring-line hover:bg-paper'}`}>
                        {label}
                    </Link>
                ))}
            </nav>

            {checks.data.length === 0 ? (
                <Empty title={filters.status === 'pending' ? 'Nobody is waiting' : 'Nothing here'}>
                    {filters.status === 'pending' ? 'When a landlord sends their NIDA number or card it shows up here within seconds.' : 'No checks have this status.'}
                </Empty>
            ) : (
                <ul className="space-y-3">
                    {checks.data.map((c) => (
                        <li key={c.id} className="grid gap-5 rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgb(16_33_47/0.04)] ring-1 ring-line lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] lg:items-center">
                            <div className="flex items-center gap-3">
                                <Avatar name={c.user.fullname} className="size-11 text-base" />
                                <div className="min-w-0 text-sm">
                                    <Link href={`/admin/users/${c.user.id}`} className="block truncate font-display text-base font-bold hover:underline">
                                        {c.user.fullname}
                                    </Link>
                                    <p className="truncate text-muted">{[c.user.phone, c.user.email].filter(Boolean).join(', ')}</p>
                                    <p className="text-xs text-muted">
                                        Joined {date(c.user.created_at)}
                                        {c.status === 'pending' && <span className="font-semibold text-brass-ink">, waiting {waited(c.created_at)}</span>}
                                    </p>
                                </div>
                            </div>

                            {c.method === 'nida_number' && c.nida_number ? (
                                <div>
                                    <p className="flex items-center gap-1.5 text-xs text-muted">
                                        <IdCard className="size-3.5" aria-hidden="true" /> NIDA number
                                    </p>
                                    <p className="mt-1 flex items-center gap-2">
                                        <span className="font-display text-xl font-bold tabular-nums tracking-wide sm:text-2xl">{nida(c.nida_number)}</span>
                                        <button type="button" onClick={() => navigator.clipboard?.writeText(c.nida_number!)} className="rounded-lg p-1.5 text-muted hover:bg-paper hover:text-ink" aria-label="Copy the NIDA number" title="Copy">
                                            <Copy className="size-4" />
                                        </button>
                                    </p>
                                    <BornOn digits={c.nida_number} />
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setViewing(c);
                                        photoDialog.current?.showModal();
                                    }}
                                    className="group flex items-center gap-3 text-left"
                                >
                                    {c.has_document ? (
                                        <img src={`/admin/identity/${c.id}/document`} alt={`NIDA card sent by ${c.user.fullname}`} className="h-20 w-32 rounded-lg bg-paper object-cover ring-1 ring-line" />
                                    ) : (
                                        <span className="flex h-20 w-32 items-center justify-center rounded-lg bg-paper text-muted">
                                            <ImageIcon className="size-6" aria-hidden="true" />
                                        </span>
                                    )}
                                    <span className="text-sm">
                                        <span className="block text-xs text-muted">
                                            {c.method === 'nida_card' ? 'Photo of NIDA card' : c.method === 'driving_licence' ? 'Photo of Driving Licence' : c.method === 'voter_id' ? 'Photo of Voter ID' : 'Photo of ID document'}
                                        </span>
                                        <span className="font-semibold text-teal group-hover:underline">Open full size</span>
                                    </span>
                                </button>
                            )}

                            {c.status === 'pending' ? (
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => {
                                            setRejecting(c);
                                            setReason('');
                                            rejectDialog.current?.showModal();
                                        }}
                                    >
                                        <X className="size-4" /> Reject
                                    </Button>
                                    <Button variant="primary" onClick={() => decide(c, 'approved')}>
                                        <Check className="size-4" /> Approve
                                    </Button>
                                </div>
                            ) : (
                                <div className="max-w-64 text-sm lg:text-right">
                                    <StatusBadge status={c.status} />
                                    {c.status === 'approved' && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setRejecting(c);
                                                setReason('');
                                                rejectDialog.current?.showModal();
                                            }}
                                            className="ml-2 text-xs font-semibold text-hibiscus hover:underline"
                                        >
                                            Revoke
                                        </button>
                                    )}
                                    <p className="mt-1 text-xs text-muted">
                                        {c.reviewer?.fullname ?? 'Removed admin'}
                                        {c.reviewed_at && `, ${dateTime(c.reviewed_at)}`}
                                    </p>
                                    {c.rejection_reason && <p className="mt-1 text-xs">{c.rejection_reason}</p>}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            <Pagination page={checks} noun="checks" />

            <dialog ref={rejectDialog} className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl bg-white p-6 text-ink shadow-2xl">
                <h2 className="text-lg font-bold">{revoking ? 'Revoke' : 'Reject'} {rejecting?.user.fullname}'s identity?</h2>
                <p className="mt-1 text-sm text-muted">{revoking ? 'They stop being verified and cannot list new homes until they are approved again.' : 'They read this in the app and can send their details again.'}</p>
                <div className="mt-4 space-y-2">
                    {reasons.map((r) => (
                        <button key={r} type="button" onClick={() => setReason(r)} className={`block w-full rounded-lg px-3 py-2 text-left text-sm ring-1 ring-inset ${reason === r ? 'bg-mint ring-teal/30' : 'ring-line hover:bg-paper'}`}>
                            {r}
                        </button>
                    ))}
                </div>
                <label className="mt-4 block text-sm font-semibold">
                    What should they fix?
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} className="mt-1.5 w-full rounded-lg px-3 py-2 text-sm font-normal ring-1 ring-inset ring-line" />
                </label>
                <div className="mt-5 flex justify-end gap-2">
                    <Button onClick={() => rejectDialog.current?.close()}>Cancel</Button>
                    <Button
                        variant="danger"
                        disabled={!reason.trim()}
                        onClick={() => {
                            rejectDialog.current?.close();
                            if (!rejecting) return;
                            if (revoking) router.post(`/admin/identity/${rejecting.id}/revoke`, { reason: reason.trim() }, { preserveScroll: true });
                            else decide(rejecting, 'rejected', reason.trim());
                        }}
                    >
                        {revoking ? 'Revoke and tell them' : 'Reject and tell them'}
                    </Button>
                </div>
            </dialog>

            <dialog ref={photoDialog} onClick={() => photoDialog.current?.close()} className="m-auto max-h-[92vh] max-w-[min(64rem,calc(100vw-2rem))] rounded-2xl bg-white p-2 shadow-2xl">
                {viewing && <img src={`/admin/identity/${viewing.id}/document`} alt={`NIDA card sent by ${viewing.user.fullname}`} className="max-h-[88vh] rounded-xl" />}
            </dialog>
        </AdminLayout>
    );
}

/** The first eight digits of a NIDA number are the holder's date of birth: a quick sanity check for the reviewer. */
function BornOn({ digits }: { digits: string }) {
    const d = new Date(`${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}T00:00:00Z`);
    if (Number.isNaN(d.getTime()) || d.getUTCFullYear() < 1900 || d > new Date()) {
        return <p className="mt-0.5 text-xs font-semibold text-hibiscus">The first eight digits are not a valid date of birth.</p>;
    }
    return <p className="mt-0.5 text-xs text-muted">Date of birth in the number: {d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}</p>;
}

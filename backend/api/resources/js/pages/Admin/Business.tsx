import { Link, router } from '@inertiajs/react';
import { Check, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import { AskReason, Avatar, Badge, Button, Empty, Facts, MessageButton, Pagination, StatusBadge, Table } from '@/components/ui';
import { country, date, dateTime, roleLabel, waited } from '@/lib/format';
import type { BusinessCheck, Paged, Person } from '@/types';

const tabs = [['pending', 'Waiting'], ['approved', 'Verified'], ['rejected', 'Rejected'], ['all', 'All sent'], ['none', 'Not submitted']];
const reminder = {
    title: 'Add your business details',
    body: 'Open Account, then Business Information, and send your business details so we can verify your business.',
};
const reasons = [
    'The TIN does not match the business name. Check it against your TRA certificate.',
    'We could not find this BRELA registration number. Enter it exactly as on your certificate.',
    'Add a phone number and an office address where the business can be reached.',
];
const tin = (digits: string) => digits.replace(/^(\d{3})(\d{3})(\d{3})$/, '$1-$2-$3');
const link = (url: string) => (/^https?:\/\//.test(url) ? url : `https://${url}`);

export default function Business(props: { checks: Paged<BusinessCheck> | null; people?: Paged<Person>; filters: { status: string; q?: string | null; role?: string | null } }) {
    const { filters, people } = props;
    const checks = props.checks ?? { data: [], links: [], from: null, to: null, total: 0, last_page: 1 };
    // The row that is open. Looked up by id on every render, so the live refresh keeps the dialog current.
    const [openId, setOpenId] = useState<number | null>(null);
    const open = checks.data.find((b) => b.id === openId) ?? null;
    const dialog = useRef<HTMLDialogElement>(null);
    const isOpen = open !== null;
    useEffect(() => {
        // Guarded: the live refresh re-renders with the dialog already open, and showModal() throws on an open dialog.
        const d = dialog.current;
        if (isOpen && d && !d.open) d.showModal();
        if (!isOpen && d?.open) d.close();
    }, [isOpen]);

    const visit = (params: Record<string, string>) => router.get('/admin/business', params, { preserveState: true, replace: true });
    const decide = (b: BusinessCheck, decision: 'approved' | 'rejected', reason?: string) =>
        router.post(`/admin/business/${b.id}`, { decision, reason }, { preserveScroll: true, onSuccess: () => setOpenId(null) });

    return (
        <AdminLayout title="Business checks" live={people ? ['people'] : ['checks']} subtitle={people ? 'People who have not sent any business details yet. Send one a reminder.' : 'Business details sent from the app. Open one to see everything and decide.'}>
            <div className="mb-4 flex flex-wrap items-center gap-2">
                <nav className="flex gap-1 overflow-x-auto" aria-label="Check status">
                    {tabs.map(([value, label]) => (
                        <Link key={value} href={`/admin/business?status=${value}`} aria-current={filters.status === value ? 'page' : undefined} className={`rounded-lg px-3.5 py-2 text-sm font-semibold ${filters.status === value ? 'bg-navy text-white' : 'bg-white text-ink ring-1 ring-inset ring-line hover:bg-paper'}`}>
                            {label}
                        </Link>
                    ))}
                </nav>
                <form
                    role="search"
                    className="relative ml-auto w-full sm:w-72"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const q = String(new FormData(e.currentTarget).get('q') ?? '').trim();
                        visit({ status: filters.status, ...(q && { q }), ...(filters.role && { role: filters.role }) });
                    }}
                >
                    <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted" aria-hidden="true" />
                    <input name="q" type="search" defaultValue={filters.q ?? ''} placeholder={people ? 'Search name, email or phone' : 'Search business, TIN or owner'} aria-label="Search" className="h-10 w-full rounded-lg bg-white pl-9 pr-3 text-sm ring-1 ring-inset ring-line" />
                </form>
            </div>

            {people && (
                <>
                    <select aria-label="Role" value={filters.role ?? ''} onChange={(e) => visit({ status: 'none', ...(filters.q && { q: filters.q }), ...(e.target.value && { role: e.target.value }) })} className="mb-4 h-10 rounded-lg bg-white px-3 text-sm ring-1 ring-inset ring-line">
                        <option value="">Role: all</option>
                        <option value="landlord">Landlords</option>
                        <option value="renter">Tenants</option>
                        <option value="investor">Investors</option>
                    </select>
                    {people.data.length === 0 ? (
                        <Empty title={filters.q || filters.role ? 'Nobody matches' : 'Everyone has sent their business details'}>{filters.q || filters.role ? 'Clear the search or the role filter.' : 'There is nobody to remind.'}</Empty>
                    ) : (
                        <Table head={['Person', 'Phone', 'Role', 'Country', 'Joined', '']}>
                            {people.data.map((u) => (
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
                                    <td>{roleLabel[u.role] ?? u.role}</td>
                                    <td className="whitespace-nowrap">{country(u.country)}</td>
                                    <td className="whitespace-nowrap text-muted">{date(u.created_at)}</td>
                                    <td className="text-right">{u.suspended_at ? <Badge tone="bad">Suspended</Badge> : <MessageButton user={u} label="Remind" preset={reminder} />}</td>
                                </tr>
                            ))}
                        </Table>
                    )}
                    <Pagination page={people} noun="people" />
                </>
            )}

            {people ? null : checks.data.length === 0 ? (
                <Empty title={filters.q ? 'No business matches' : filters.status === 'pending' ? 'No business is waiting' : 'Nothing here'}>
                    {filters.q ? 'Try a shorter search, or look in another tab.' : filters.status === 'pending' ? 'When someone sends their business details from the app they show up here within seconds.' : 'No business has this status.'}
                </Empty>
            ) : (
                <Table head={['Business', 'TIN', 'Sent by', 'Sent', 'Status']}>
                    {checks.data.map((b) => (
                        <tr key={b.id} onClick={() => setOpenId(b.id)} className="cursor-pointer">
                            <td>
                                <button type="button" className="block max-w-72 text-left">
                                    <span className="block truncate font-semibold hover:underline">{b.entity_name}</span>
                                    <span className="block truncate text-xs text-muted">{b.business_type}</span>
                                </button>
                            </td>
                            <td className="whitespace-nowrap tabular-nums">{tin(b.tin)}</td>
                            <td className="whitespace-nowrap">{b.user.fullname}</td>
                            <td className="whitespace-nowrap text-muted">
                                {dateTime(b.submitted_at)}
                                {b.status === 'pending' && <span className="block text-xs font-semibold text-brass-ink">waiting {waited(b.submitted_at)}</span>}
                            </td>
                            <td><StatusBadge status={b.status} /></td>
                        </tr>
                    ))}
                </Table>
            )}
            {!people && <Pagination page={checks} noun="businesses" />}

            <dialog ref={dialog} onClose={() => setOpenId(null)} className="m-auto max-h-[92vh] w-[min(52rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl bg-white p-0 text-ink shadow-2xl">
                {open && (
                    <>
                        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-line bg-white p-6">
                            <div className="min-w-0">
                                <h2 className="flex flex-wrap items-center gap-2 text-2xl font-extrabold">
                                    {open.entity_name} <StatusBadge status={open.status} />
                                </h2>
                                <p className="mt-1 text-sm text-muted">
                                    {open.business_type}, sent {dateTime(open.submitted_at)}
                                </p>
                            </div>
                            <button type="button" onClick={() => setOpenId(null)} className="rounded-lg p-2 text-muted hover:bg-paper hover:text-ink" aria-label="Close">
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="space-y-6 p-6">
                            {open.status !== 'pending' && (
                                <p className={`rounded-xl px-4 py-3 text-sm ${open.status === 'approved' ? 'bg-mint text-teal' : 'bg-blush text-hibiscus'}`}>
                                    <span className="font-semibold">
                                        {open.status === 'approved' ? 'Verified' : 'Rejected'} by {open.reviewer?.fullname ?? 'a removed admin'}
                                        {open.reviewed_at && `, ${dateTime(open.reviewed_at)}`}.
                                    </span>
                                    {open.rejection_reason && <span className="text-ink"> Reason given: {open.rejection_reason}</span>}
                                </p>
                            )}

                            <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
                                <section>
                                    <h3 className="mb-3 text-sm font-bold">Registration and tax</h3>
                                    <Facts
                                        rows={[
                                            ['TIN', <span className="font-display text-lg font-bold tabular-nums tracking-wide">{tin(open.tin)}</span>],
                                            ['BRELA number', open.brela ?? 'Not given'],
                                            ['VAT number', open.vrn ?? 'Not given'],
                                            ['Category', open.business_type],
                                        ]}
                                    />
                                </section>
                                <section>
                                    <h3 className="mb-3 text-sm font-bold">Contacts and office</h3>
                                    <Facts
                                        rows={[
                                            ['Phone', open.phone ? <a href={`tel:${open.phone}`} className="text-teal hover:underline">{open.phone}</a> : 'Not given'],
                                            ['Email', open.email ? <a href={`mailto:${open.email}`} className="text-teal hover:underline">{open.email}</a> : 'Not given'],
                                            ['Address', open.address ?? 'Not given'],
                                            ['Website', open.website ? <a href={link(open.website)} target="_blank" rel="noreferrer" className="text-teal hover:underline">{open.website}</a> : 'Not given'],
                                        ]}
                                    />
                                </section>
                            </div>

                            <section>
                                <h3 className="mb-2 text-sm font-bold">About the business</h3>
                                <p className="max-w-prose whitespace-pre-line text-sm leading-relaxed">{open.bio ?? <span className="text-muted">Nothing written.</span>}</p>
                            </section>

                            <section className="rounded-xl bg-paper p-4">
                                <h3 className="mb-3 text-sm font-bold">Account that sent it</h3>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Link href={`/admin/users/${open.user.id}`} className="flex items-center gap-3 self-start hover:underline">
                                        <Avatar name={open.user.fullname} className="size-11 text-base" />
                                        <span className="min-w-0">
                                            <span className="block truncate font-semibold">{open.user.fullname}</span>
                                            <span className="block truncate text-xs text-muted">{roleLabel[open.user.role] ?? open.user.role}, joined {date(open.user.created_at)}</span>
                                        </span>
                                    </Link>
                                    <Facts
                                        rows={[
                                            ['Phone', open.user.phone ?? 'None'],
                                            ['Email', open.user.email ?? 'None'],
                                            ['Country', country(open.user.country)],
                                            ['Identity', <StatusBadge status={open.identity_status} />],
                                        ]}
                                    />
                                </div>
                                {open.user.suspended_at && <p className="mt-3"><Badge tone="bad">Account suspended</Badge></p>}
                            </section>
                        </div>

                        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-white p-4 px-6">
                            <p className="text-xs text-muted">{open.status === 'pending' ? 'Check the TIN and BRELA number against TRA and BRELA records first.' : 'To change this decision, the owner sends the details again.'}</p>
                            <div className="flex gap-2">
                                {open.status === 'pending' && (
                                    <>
                                        <AskReason label={<><X className="size-4" /> Reject</>} title={`Reject ${open.entity_name}?`} note="They read this in the app and can correct their details and send them again." presets={reasons} confirmLabel="Reject and tell them" onConfirm={(reason) => decide(open, 'rejected', reason)} />
                                        <Button variant="primary" onClick={() => decide(open, 'approved')}>
                                            <Check className="size-4" /> Verify business
                                        </Button>
                                    </>
                                )}
                                {open.status === 'approved' && (
                                    <AskReason label="Withdraw verification" title={`Withdraw ${open.entity_name}'s verification?`} note="The business stops showing as verified until they send their details again." confirmLabel="Withdraw and tell them" onConfirm={(reason) => decide(open, 'rejected', reason)} />
                                )}
                            </div>
                        </div>
                    </>
                )}
            </dialog>
        </AdminLayout>
    );
}

// Times are shown in Tanzanian time wherever the admin happens to be.
const tz = { timeZone: 'Africa/Dar_es_Salaam' } as const;

export const money = (n: number | string | null | undefined) => (n == null ? 'No price' : `TSh ${Math.round(Number(n)).toLocaleString('en-US')}`);

export const date = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', ...tz }) : 'Never';

export const dateTime = (iso: string) =>
    new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', ...tz });

/** "today", "3 days ago", "2 months ago" */
export function ago(iso: string | null): string {
    if (!iso) return 'never';
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 60) return `${days} days ago`;
    return `${Math.floor(days / 30)} months ago`;
}

/** How long someone has been waiting: "just now", "4 min", "3 h", "2 days". */
export function waited(iso: string): string {
    const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
    if (min < 1) return 'just now';
    if (min < 60) return `${min} min`;
    if (min < 60 * 24) return `${Math.floor(min / 60)} h`;
    return `${Math.floor(min / 1440)} days`;
}

/** 20 digits as printed on the card: 19850712-14125-00001-23. */
export const nida = (n: string) => n.replace(/^(\d{8})(\d{5})(\d{5})(\d{2})$/, '$1-$2-$3-$4');

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
const flag = (code: string) => String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

/** "TZ" -> "🇹🇿 Tanzania". The browser knows the names, so there is no list to keep here. */
export const country = (code: string | null) => (code ? `${flag(code)} ${regionNames.of(code.toUpperCase()) ?? code}` : 'Not given');

export const place = (l: { ward: string | null; district: string | null }) => [l.ward, l.district].filter(Boolean).join(', ') || 'No area';

export const roleLabel: Record<string, string> = { renter: 'Tenant', landlord: 'Landlord', investor: 'Investor' };

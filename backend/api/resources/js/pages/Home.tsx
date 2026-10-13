import { Head } from '@inertiajs/react';
import { BadgeCheck, Bath, BedDouble, CalendarCheck, Check, MapPin, MessageCircle, Search, ShieldCheck, TriangleAlert, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/ui';

type Home = {
    id: number;
    property_name: string | null;
    property_type: string | null;
    district: string | null;
    ward: string | null;
    bedrooms: number | null;
    bathrooms: number | null;
    monthly_rent: number | string | null;
    cover_image: string | null;
    advertiser_role: string;
    verified_at: string | null;
    availability_confirmed_at: string | null;
};
type Lang = 'en' | 'sw';

export default function HomePage({ homes, stats, downloadUrl }: { homes: Home[]; stats: { homes: number; districts: number }; downloadUrl: string | null }) {
    const [lang, setLang] = useState<Lang>('en');
    useEffect(() => {
        try {
            if (localStorage.getItem('lang') === 'sw') setLang('sw');
        } catch {
            /* private mode: stay in English */
        }
    }, []);
    const pick = (l: Lang) => {
        setLang(l);
        document.documentElement.lang = l;
        try {
            localStorage.setItem('lang', l);
        } catch {
            /* nothing to remember */
        }
    };
    const t = (en: string, sw: string) => (lang === 'sw' ? sw : en);

    const ago = (iso: string | null) => {
        const days = iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)) : 0;
        if (days === 0) return t('today', 'leo');
        if (days === 1) return t('yesterday', 'jana');
        return t(`${days} days ago`, `siku ${days} zilizopita`);
    };
    const rent = (n: number | string | null) => (n == null ? '' : `TSh ${Math.round(Number(n)).toLocaleString('en-US')}`);
    const photo = (h: Home) => (h.cover_image ? `/storage/${h.cover_image}` : null);
    const trust = (h: Home) => [
        h.advertiser_role === 'representative'
            ? t("Advertised by the owner's representative", 'Inatangazwa na mwakilishi wa mwenye nyumba')
            : t('Advertised by the owner', 'Inatangazwa na mwenye nyumba'),
        h.verified_at ? t(`Right to let checked ${ago(h.verified_at)}`, `Haki ya kupangisha ilithibitishwa ${ago(h.verified_at)}`) : t('Not verified yet', 'Bado haijathibitishwa'),
        t(`Confirmed available ${ago(h.availability_confirmed_at)}`, `Ilithibitishwa kuwa ipo ${ago(h.availability_confirmed_at)}`),
    ];
    const lead = homes[0];
    const getApp = downloadUrl ? (
        <a href={downloadUrl} className="inline-flex h-12 items-center rounded-xl bg-teal-bright px-5 font-semibold text-navy hover:bg-white">
            {t('Get the Android app', 'Pakua app ya Android')}
        </a>
    ) : null;

    return (
        <div className="bg-white">
            <Head title={t('Know who you are renting from', 'Mjue unayepanga kwake')}>
                <meta name="description" content="Panga na Kupangisha: rental homes in Tanzania with the advertiser, verification and availability shown on every listing." />
            </Head>

            <div className="bg-navy text-white">
                <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
                    <Logo onDark />
                    <nav className="hidden gap-7 text-sm font-semibold text-white/80 md:flex" aria-label={t('Sections', 'Sehemu')}>
                        <a href="#homes" className="hover:text-white">{t('Homes', 'Nyumba')}</a>
                        <a href="#how" className="hover:text-white">{t('How it works', 'Inavyofanya kazi')}</a>
                        <a href="#owners" className="hover:text-white">{t('For owners', 'Kwa wenye nyumba')}</a>
                    </nav>
                    <div className="flex rounded-full bg-navy-raised p-1 text-xs font-bold" role="group" aria-label="Language">
                        {(['en', 'sw'] as const).map((l) => (
                            <button key={l} type="button" onClick={() => pick(l)} aria-pressed={lang === l} className={`rounded-full px-3 py-1.5 uppercase ${lang === l ? 'bg-white text-navy' : 'text-white/70'}`}>
                                {l}
                            </button>
                        ))}
                    </div>
                </header>

                <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 lg:grid-cols-[6fr_5fr] lg:pb-28 lg:pt-16">
                    <div>
                        <h1 className="text-5xl font-extrabold leading-[1.02] sm:text-6xl lg:text-7xl">{t('Know who you are renting from.', 'Mjue unayepanga kwake.')}</h1>
                        <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
                            {t(
                                'Every home on Panga shows who is advertising it, whether we checked their right to let it, and when they last confirmed it is still available.',
                                'Kila nyumba kwenye Panga inaonyesha anayeitangaza, kama tumethibitisha haki yake ya kuipangisha, na lini alithibitisha kuwa bado ipo.',
                            )}
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <a href="#homes" className="inline-flex h-12 items-center rounded-xl bg-teal-bright px-5 font-semibold text-navy hover:bg-white">{t('See homes', 'Tazama nyumba')}</a>
                            <a href="#owners" className="inline-flex h-12 items-center rounded-xl px-5 font-semibold text-white ring-1 ring-inset ring-white/30 hover:bg-white/10">{t('List your home', 'Tangaza nyumba yako')}</a>
                        </div>
                        {stats.homes > 0 && (
                            <p className="mt-8 text-sm text-white/60">
                                {t(`${stats.homes} homes live in ${stats.districts} districts of Dar es Salaam`, `Nyumba ${stats.homes} zipo sasa katika wilaya ${stats.districts} za Dar es Salaam`)}
                            </p>
                        )}
                    </div>

                    {/* The product's one idea, shown with a real listing: the facts a renter gets before they message anyone. */}
                    {lead && (
                        <div className="relative mx-auto w-full max-w-md pb-36 sm:pb-28">
                            <div className="overflow-hidden rounded-3xl bg-navy-raised shadow-2xl ring-1 ring-white/10">
                                {photo(lead) && <img src={photo(lead)!} alt="" className="aspect-[4/3] w-full object-cover" />}
                                <div className="p-5">
                                    <p className="font-display text-2xl font-extrabold">
                                        {rent(lead.monthly_rent)} <span className="font-sans text-sm font-medium text-white/60">{t('a month', 'kwa mwezi')}</span>
                                    </p>
                                    <p className="mt-1 text-sm text-white/75">{lead.property_name}</p>
                                </div>
                            </div>
                            <ul className="absolute -bottom-0 right-0 w-[19rem] max-w-[92%] space-y-2.5 rounded-2xl bg-white p-4 text-sm font-semibold text-ink shadow-2xl sm:-right-6">
                                {trust(lead).map((line, i) => (
                                    <li key={i} className="rise flex items-center gap-2.5" style={{ animationDelay: `${0.35 + i * 0.22}s` }}>
                                        <span className={`flex size-6 shrink-0 items-center justify-center rounded-full ${i === 1 && !lead.verified_at ? 'bg-sand text-brass-ink' : 'bg-mint text-teal'}`}>
                                            {i === 0 ? <UserRound className="size-3.5" /> : i === 1 ? <ShieldCheck className="size-3.5" /> : <Check className="size-3.5" />}
                                        </span>
                                        {line}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>
            </div>

            <section className="wall overflow-hidden">
                {/* Wobbles the letter edges and knocks out specks, so the type reads as brushed on, not printed. */}
                <svg width="0" height="0" className="absolute" aria-hidden="true">
                    <filter id="sign-paint">
                        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="warp" />
                        <feDisplacementMap in="SourceGraphic" in2="warp" scale="5" result="rough" />
                        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="8" result="grain" />
                        <feColorMatrix in="grain" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 9 -6.1" result="specks" />
                        <feComposite in="rough" in2="specks" operator="out" />
                    </filter>
                </svg>
                <div className="mx-auto max-w-6xl px-5 pb-8 pt-20 sm:pb-10 sm:pt-24">
                    <p lang="sw" className="wall-paint">
                        Nyumba hii <br className="sm:hidden" />
                        haiuzwi
                    </p>
                </div>
                <div className="wall-band text-white">
                    <div className="mx-auto grid max-w-6xl gap-4 px-5 py-10 md:grid-cols-[2fr_3fr] md:gap-12 md:py-12">
                        <p className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">{t('“This house is not for sale.”', 'Onyo lililoandikwa ukutani.')}</p>
                        <p className="max-w-xl text-lg leading-relaxed text-white/85">
                            {t(
                                'Owners across Tanzania paint it on their walls so nobody can sell the house behind their back. Panga does that job for renting: before you message anyone, you see who is advertising the home and whether we checked they may let it.',
                                'Wenye nyumba huandika hivi ukutani ili mtu asiiuze nyumba yao kwa siri. Panga inafanya kazi hiyo kwa upangaji: kabla hujamwandikia mtu, unaona anayetangaza nyumba na kama tumethibitisha ana haki ya kuipangisha.',
                            )}
                        </p>
                    </div>
                </div>
            </section>

            <section id="homes" className="mx-auto max-w-6xl scroll-mt-6 px-5 py-20">
                <h2 className="text-3xl font-extrabold sm:text-4xl">{t('Homes you can ask about today', 'Nyumba unazoweza kuuliza leo')}</h2>
                <p className="mt-3 max-w-2xl text-muted">
                    {t(
                        'Straight from the app. Areas are shown by ward. The exact address is shared when the owner agrees to a viewing.',
                        'Moja kwa moja kutoka kwenye app. Eneo linaonyeshwa kwa kata. Anwani kamili hutolewa mwenye nyumba akikubali kukuonyesha.',
                    )}
                </p>
                {homes.length === 0 ? (
                    <p className="mt-10 rounded-2xl border border-dashed border-line px-6 py-12 text-center text-muted">
                        {t('The first homes are being checked. Come back soon.', 'Nyumba za kwanza zinakaguliwa. Rudi hivi karibuni.')}
                    </p>
                ) : (
                    <ul className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                        {homes.map((h) => (
                            <li key={h.id}>
                                <div className="relative overflow-hidden rounded-2xl bg-paper">
                                    {photo(h) ? <img src={photo(h)!} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" /> : <div className="aspect-[4/3]" />}
                                    {h.verified_at && (
                                        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-teal shadow">
                                            <BadgeCheck className="size-3.5" aria-hidden="true" /> {t('Verified', 'Imethibitishwa')}
                                        </span>
                                    )}
                                </div>
                                <p className="mt-4 font-display text-xl font-extrabold tabular-nums">
                                    {rent(h.monthly_rent)} <span className="font-sans text-sm font-medium text-muted">{t('a month', 'kwa mwezi')}</span>
                                </p>
                                <p className="mt-1 font-semibold">{h.property_name}</p>
                                <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                                    <span className="inline-flex items-center gap-1"><MapPin className="size-4" aria-hidden="true" />{[h.ward, h.district].filter(Boolean).join(', ')}</span>
                                    {h.bedrooms != null && <span className="inline-flex items-center gap-1"><BedDouble className="size-4" aria-hidden="true" />{t(`${h.bedrooms} bed`, `vyumba ${h.bedrooms}`)}</span>}
                                    {h.bathrooms != null && <span className="inline-flex items-center gap-1"><Bath className="size-4" aria-hidden="true" />{t(`${h.bathrooms} bath`, `bafu ${h.bathrooms}`)}</span>}
                                </p>
                                <p className="mt-2 text-xs text-muted">{trust(h)[2]}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section id="how" className="scroll-mt-6 bg-paper">
                <div className="mx-auto max-w-6xl px-5 py-20">
                    <h2 className="text-3xl font-extrabold sm:text-4xl">{t('From search to keys', 'Kutoka kutafuta hadi funguo')}</h2>
                    <ol className="mt-10 grid gap-8 md:grid-cols-3">
                        {[
                            [Search, t('Search by area and budget', 'Tafuta kwa eneo na bajeti'), t('Filter by district, type, bedrooms and rent, or browse the map.', 'Chuja kwa wilaya, aina, vyumba na kodi, au tazama ramani.')] as const,
                            [MessageCircle, t('Message the advertiser', 'Mwandikie mtangazaji'), t('Chat inside the app and ask for a viewing time that suits you.', 'Ongea ndani ya app na uombe muda wa kuona nyumba unaokufaa.')] as const,
                            [CalendarCheck, t('Visit before you pay', 'Tembelea kabla ya kulipa'), t('See the home in person. Never send money for a home you have not seen.', 'Ione nyumba ana kwa ana. Usitume pesa kwa nyumba ambayo hujaiona.')] as const,
                        ].map(([Icon, title, body], i) => (
                            <li key={title} className="border-t-2 border-navy pt-5">
                                <div className="flex items-center justify-between">
                                    <span className="font-display text-4xl font-extrabold text-navy">{i + 1}</span>
                                    <Icon className="size-6 text-teal" aria-hidden="true" />
                                </div>
                                <h3 className="mt-4 text-xl font-bold">{title}</h3>
                                <p className="mt-2 text-muted">{body}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <section id="owners" className="mx-auto grid max-w-6xl scroll-mt-6 items-center gap-12 px-5 py-20 lg:grid-cols-2">
                <div>
                    <h2 className="text-3xl font-extrabold sm:text-4xl">{t('Let your home to people who can see you are genuine', 'Pangisha kwa watu wanaoona kuwa wewe ni wa kweli')}</h2>
                    <dl className="mt-8 space-y-6">
                        {[
                            [t('List in four steps', 'Tangaza kwa hatua nne'), t('Details, a pin on the map, photos, then review and publish.', 'Maelezo, mahali kwenye ramani, picha, kisha hakiki na uchapishe.')],
                            [t('One tap keeps it current', 'Mguso mmoja unaiweka hai'), t('Confirm the home is still available so renters know the listing is fresh.', 'Thibitisha kuwa nyumba bado ipo ili wapangaji wajue tangazo ni la sasa.')],
                            [t('Viewing requests in one place', 'Maombi ya kuona nyumba mahali pamoja'), t('Accept or decline each request and chat with the renter.', 'Kubali au kataa kila ombi na uongee na mpangaji.')],
                        ].map(([title, body]) => (
                            <div key={title} className="border-l-2 border-teal pl-5">
                                <dt className="text-lg font-bold">{title}</dt>
                                <dd className="mt-1 text-muted">{body}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
                <div className="rounded-3xl bg-sand p-6 sm:p-8">
                    <TriangleAlert className="size-7 text-brass-ink" aria-hidden="true" />
                    <p className="mt-4 font-display text-2xl font-extrabold leading-snug text-ink">
                        {t('If someone asks for money before a viewing, report the listing.', 'Mtu akikuomba pesa kabla ya kuona nyumba, ripoti tangazo.')}
                    </p>
                    <p className="mt-3 text-brass-ink">
                        {t('Every listing has a report button. Our team reads each report and can suspend the listing or the account.', 'Kila tangazo lina kitufe cha kuripoti. Timu yetu husoma kila ripoti na inaweza kusimamisha tangazo au akaunti.')}
                    </p>
                </div>
            </section>

            <footer className="bg-navy text-white">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-8 px-5 py-16">
                    <div>
                        <h2 className="text-3xl font-extrabold sm:text-4xl">{downloadUrl ? t('Get Panga on your phone', 'Pata Panga kwenye simu yako') : t('Panga is coming to Android', 'Panga inakuja kwenye Android')}</h2>
                        <p className="mt-3 text-white/70">{t('In English and Kiswahili, built for renting in Tanzania.', 'Kwa Kiingereza na Kiswahili, imetengenezwa kwa upangaji Tanzania.')}</p>
                    </div>
                    {getApp}
                </div>
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-navy-line px-5 py-6 text-sm text-white/60">
                    <span className="flex items-center gap-3">
                        <Logo onDark className="!text-base" /> Panga na Kupangisha, Dar es Salaam
                    </span>
                    <a href="/admin" className="hover:text-white">{t('Staff sign in', 'Kuingia kwa wafanyakazi')}</a>
                </div>
            </footer>
        </div>
    );
}

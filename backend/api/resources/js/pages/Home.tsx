import { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import {
    BadgeCheck, Bath, BedDouble, CalendarCheck, Check,
    MapPin, MessageCircle, Search, ShieldCheck, TriangleAlert,
    UserRound, ChevronRight, ArrowRight, Info, Star,
    Filter, Map as MapIcon, Heart, Sparkles, Zap
} from 'lucide-react';
import { Logo, Thumb } from '@/components/ui';

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
    const { scrollYProgress } = useScroll();
    const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
    const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);

    useEffect(() => {
        try {
            if (localStorage.getItem('lang') === 'sw') setLang('sw');
        } catch {}
    }, []);

    const pick = (l: Lang) => {
        setLang(l);
        document.documentElement.lang = l;
        try { localStorage.setItem('lang', l); } catch {}
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
        {
            icon: <UserRound className="size-3.5" />,
            text: h.advertiser_role === 'representative'
                ? t("Advertised by the owner's representative", 'Inatangazwa na mwakilishi wa mwenye nyumba')
                : t('Advertised by the owner', 'Inatangazwa na mwenye nyumba'),
            color: 'bg-mint text-teal'
        },
        {
            icon: <ShieldCheck className="size-3.5" />,
            text: h.verified_at ? t(`Right to let checked ${ago(h.verified_at)}`, `Haki ya kupangisha ilithibitishwa ${ago(h.verified_at)}`) : t('Not verified yet', 'Bado haijathibitishwa'),
            color: h.verified_at ? 'bg-mint text-teal' : 'bg-sand text-brass-ink'
        },
        {
            icon: <Check className="size-3.5" />,
            text: t(`Confirmed available ${ago(h.availability_confirmed_at)}`, `Ilithibitishwa kuwa ipo ${ago(h.availability_confirmed_at)}`),
            color: 'bg-mint text-teal'
        },
    ];

    const lead = homes[0];

    return (
        <div className="bg-white selection:bg-teal/30">
            <Head title={t('Know who you are renting from', 'Mjue unayepanga kwake')}>
                <meta name="description" content="Panga na Kupangisha: rental homes in Tanzania with the advertiser, verification and availability shown on every listing." />
            </Head>

            {/* Full-bleed Navigation */}
            <nav className="fixed top-0 z-50 w-full px-6 py-4 flex items-center justify-between backdrop-blur-md bg-navy/80 text-white">
                <Logo onDark />
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex gap-6 text-sm font-medium text-white/70">
                        <a href="#homes" className="hover:text-white transition-colors">{t('Homes', 'Nyumba')}</a>
                        <a href="#how" className="hover:text-white transition-colors">{t('How it works', 'Inavyofanya kazi')}</a>
                        <a href="#owners" className="hover:text-white transition-colors">{t('For owners', 'Kwa wenye nyumba')}</a>
                    </div>
                    <div className="flex rounded-full bg-navy-raised p-1 text-[10px] font-bold">
                        {(['en', 'sw'] as const).map((l) => (
                            <button
                                key={l}
                                onClick={() => pick(l)}
                                className={`rounded-full px-3 py-1 uppercase transition-all ${lang === l ? 'bg-white text-navy' : 'text-white/60 hover:text-white'}`}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* HERO SECTION: Airbnb Inspired Luxury */}
            <motion.section
                style={{ y: backgroundY, opacity, scale }}
                className="relative min-h-screen flex items-center justify-center overflow-hidden bg-navy text-white px-6 pt-20"
            >
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-bright/10 blur-[120px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-navy-raised/20 blur-[100px]" />
                </div>

                <div className="relative z-10 grid max-w-7xl mx-auto items-center gap-16 lg:grid-cols-2">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-bright/20 text-teal-bright text-xs font-bold mb-6 ring-1 ring-teal-bright/30">
                            <Star className="size-3" /> {t('Trusted by 10,000+ Renters', 'Inatumika na wapangaji 10,000+')}
                        </div>
                        <h1 className="text-6xl sm:text-7xl lg:text-8xl font-extrabold leading-[0.9] tracking-tight">
                            {t('Know who you', 'Mjue')} <br/>
                            <span className="text-teal-bright">{t('are renting from.', 'unayepanga kwake.')}</span>
                        </h1>
                        <p className="mt-8 max-w-lg text-xl leading-relaxed text-white/70 font-medium">
                            {t(
                                'Every home on Panga shows who is advertising it, whether we checked their right to let it, and when they last confirmed it is still available.',
                                'Kila nyumba kwenye Panga inaonyesha anayeitangaza, kama tumethibitisha haki yake ya kuipangisha, na lini alithibitisha kuwa bado ipo.',
                            )}
                        </p>
                        <div className="mt-10 flex flex-wrap gap-4">
                            <a href="#homes" className="group relative inline-flex h-14 items-center rounded-2xl bg-teal-bright px-8 font-bold text-navy overflow-hidden transition-all hover:scale-105 active:scale-95">
                                <span className="relative z-10 flex items-center gap-2">
                                    {t('See homes', 'Tazama nyumba')} <ArrowRight className="size-5" />
                                </span>
                                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                            </a>
                            <a href="#owners" className="inline-flex h-14 items-center rounded-2xl px-8 font-bold text-white ring-1 ring-white/20 hover:bg-white/10 transition-all">
                                {t('List your home', 'Tangaza nyumba yako')}
                            </a>
                        </div>
                        {stats.homes > 0 && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="mt-10 text-sm font-medium text-white/50 flex items-center gap-2"
                            >
                                <div className="size-2 rounded-full bg-teal animate-pulse" />
                                {t(`${stats.homes} homes live in ${stats.districts} districts of Dar es Salaam`, `Nyumba ${stats.homes} zipo sasa katika wilaya ${stats.districts} za Dar es Salaam`)}
                            </motion.p>
                        )}
                    </motion.div>

                    {lead && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
                            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="relative w-full max-w-md mx-auto perspective-1000"
                        >
                            <div className="relative group">
                                <div className="overflow-hidden rounded-[2rem] bg-navy-raised shadow-2xl ring-1 ring-white/10 transition-transform duration-500 group-hover:scale-[1.02]">
                                    {photo(lead) && <img src={photo(lead)!} alt="" className="aspect-[4/3] w-full object-cover" />}
                                    <div className="p-6">
                                        <div className="flex items-baseline justify-between">
                                            <p className="font-display text-3xl font-extrabold tabular-nums">
                                                {rent(lead.monthly_rent)}
                                            </p>
                                            <span className="text-sm font-medium text-white/50">{t('a month', 'kwa mwezi')}</span>
                                        </div>
                                        <p className="mt-1 text-lg font-semibold text-white/90">{lead.property_name}</p>
                                    </div>
                                </div>

                                {/* Animated Trust Overlay */}
                                <div className="absolute -bottom-6 -right-6 w-72 max-w-[90%] space-y-3 rounded-3xl bg-white p-5 text-sm font-bold text-ink shadow-2xl ring-1 ring-black/5">
                                    <div className="mb-3 pb-3 border-b border-line">
                                        <span className="text-xs uppercase tracking-wider text-muted font-black">Trust Verification</span>
                                    </div>
                                    {trust(lead).map((line, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.5 + (i * 0.2) }}
                                            className="flex items-center gap-3"
                                        >
                                            <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${line.color}`}>
                                                {line.icon}
                                            </span>
                                            <span className="text-ink/80 leading-tight">{line.text}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
                </motion.section>

            {/* SEARCH BAR: Airbnb Style Floating Bar */}
            <section className="relative z-20 -mt-12 px-6">
                <div className="mx-auto max-w-4xl bg-white rounded-full shadow-2xl ring-1 ring-black/5 p-2 flex flex-col md:flex-row items-center gap-2">
                    <div className="flex-1 flex items-center gap-3 px-4 py-2 w-full border-b md:border-b-0 md:border-r border-line">
                        <MapPin className="size-5 text-muted" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase text-muted leading-none">Location</span>
                            <input type="text" placeholder="Where are you looking?" className="bg-transparent outline-none text-sm font-medium w-full" />
                        </div>
                    </div>
                    <div className="flex-1 flex items-center gap-3 px-4 py-2 w-full border-b md:border-b-0 md:border-r border-line">
                        <BedDouble className="size-5 text-muted" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase text-muted leading-none">Rooms</span>
                            <select className="bg-transparent outline-none text-sm font-medium w-full appearance-none">
                                <option>Any size</option>
                                <option>1 Bedroom</option>
                                <option>2+ Bedrooms</option>
                                <option>Studio</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex-1 flex items-center gap-3 px-4 py-2 w-full">
                        <Filter className="size-5 text-muted" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase text-muted leading-none">Budget</span>
                            <input type="text" placeholder="Max rent..." className="bg-transparent outline-none text-sm font-medium w-full" />
                        </div>
                    </div>
                    <button className="h-12 w-12 rounded-full bg-teal-bright text-navy flex items-center justify-center hover:scale-105 transition-transform">
                        <Search className="size-5" />
                    </button>
                </div>
            </section>

            {/* THE WALL: Cinematic Parallax Section */}
            <section className="relative overflow-hidden bg-white py-32">
                <div className="absolute inset-0 z-0 opacity-40">
                    <svg width="100%" height="100%" className="absolute inset-0" aria-hidden="true">
                        <filter id="sign-paint">
                            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="warp" />
                            <feDisplacementMap in="SourceGraphic" in2="warp" scale="5" result="rough" />
                            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="8" result="grain" />
                            <feColorMatrix in="grain" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 9 -6.1" result="specks" />
                            <feComposite in="rough" in2="specks" operator="out" />
                        </filter>
                    </svg>
                </div>

                <div className="relative z-10 mx-auto max-w-6xl px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="relative inline-block"
                            >
                                <p
                                    lang="sw"
                                    className="text-7xl sm:text-8xl lg:text-9xl font-display font-black text-navy opacity-10 leading-none select-none pointer-events-none"
                                    style={{ filter: 'url(#sign-paint)' }}
                                >
                                    Nyumba hii <br/> haiuzwi
                                </p>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <p className="text-3xl sm:text-4xl font-extrabold text-navy leading-tight text-center max-w-md">
                                        {t('“This house is not for sale.”', 'Onyo lililoandikwa ukutani.')}
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                        <div className="flex-1">
                            <p className="text-xl leading-relaxed text-ink/80 font-medium">
                                {t(
                                    'Owners across Tanzania paint it on their walls so nobody can sell the house behind their back. Panga does that job for renting: before you message anyone, you see who is advertising the home and whether we checked they may let it.',
                                    'Wenye nyumba huandika hivi ukutani ili mtu asiiuze nyumba yao kwa siri. Panga inafanya kazi hiyo kwa upangaji: kabla hujamwandikia mtu, unaona anayetangaza nyumba na kama tumethibitisha ana haki ya kuipangisha.',
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* HOMES: Fluid Grid with "Wishlist" feature */}
            <section id="homes" className="mx-auto max-w-7xl px-6 py-32 scroll-mt-24">
                <div className="mb-16 flex items-end justify-between">
                    <div>
                        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">{t('Homes you can ask about today', 'Nyumba unazoweza kuuliza leo')}</h2>
                        <p className="mt-4 text-lg text-muted max-w-2xl">
                            {t(
                                'Straight from the app. Areas are shown by ward. The exact address is shared when the owner agrees to a viewing.',
                                'Moja kwa moja kutoka kwenye app. Eneo linaonyeshwa kwa kata. Anwani kamili hutolewa mwenye nyumba akikubali kukuonyesha.',
                            )}
                        </p>
                    </div>
                    <button className="hidden md:flex items-center gap-2 text-teal font-bold hover:underline">
                        <MapIcon className="size-5" /> {t('View Map', 'Tazama Ramani')}
                    </button>
                </div>

                {homes.length === 0 ? (
                    <div className="rounded-3xl border-2 border-dashed border-line py-20 text-center text-muted">
                        <p className="text-xl font-bold">{t('The first homes are being checked. Come back soon.', 'Nyumba za kwanza zinakaguliwa. Rudi hivi karibuni.')}</p>
                    </div>
                ) : (
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {homes.map((h, i) => (
                            <motion.div
                                key={h.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group relative rounded-3xl bg-white ring-1 ring-line hover:ring-teal transition-all duration-300 hover:shadow-xl overflow-hidden"
                            >
                                <div className="relative aspect-[4/3] overflow-hidden">
                                    {photo(h) ? (
                                        <img src={photo(h)!} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full bg-paper flex items-center justify-center"><Home className="size-10 text-muted" /></div>
                                    )}

                                    <button className="absolute top-4 right-4 p-2 rounded-full bg-white/80 backdrop-blur-md text-ink hover:text-hibiscus transition-colors shadow-sm">
                                        <Heart className="size-5" />
                                    </button>

                                    {h.verified_at && (
                                        <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-teal shadow-sm ring-1 ring-teal/20">
                                            <BadgeCheck className="size-3.5" /> {t('Verified', 'Imethibitishwa')}
                                        </div>
                                    )}
                                </div>
                                <div className="p-6">
                                    <div className="flex items-baseline justify-between mb-2">
                                        <p className="font-display text-2xl font-extrabold tabular-nums">{rent(h.monthly_rent)}</p>
                                        <span className="text-xs font-medium text-muted">{t('a month', 'kwa mwezi')}</span>
                                    </div>
                                    <p className="font-bold text-lg truncate">{h.property_name}</p>
                                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                                        <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{[h.ward, h.district].filter(Boolean).join(', ')}</span>
                                        {h.bedrooms != null && <span className="inline-flex items-center gap-1.5"><BedDouble className="size-4" />{t(`${h.bedrooms} bed`, `vyumba ${h.bedrooms}`)}</span>}
                                        {h.bathrooms != null && <span className="inline-flex items-center gap-1.5"><Bath className="size-4" />{t(`${h.bathrooms} bath`, `bafu ${h.bathrooms}`)}</span>}
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-line flex items-center justify-between">
                                        <span className="text-xs text-muted italic">{trust(h)[2].text}</span>
                                        <button className="text-teal font-bold text-sm flex items-center gap-1 hover:underline">
                                            {t('Details', 'Maelezo')} <ChevronRight className="size-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>

            {/* HOW IT WORKS: Modern Steps */}
            <section id="how" className="bg-paper py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-center mb-20">{t('From search to keys', 'Kutoka kutafuta hadi funguo')}</h2>
                    <div className="grid gap-12 md:grid-cols-3">
                        {[
                            [Search, t('Search by area and budget', 'Tafuta kwa eneo na bajeti'), t('Filter by district, type, bedrooms and rent, or browse the map.', 'Chuja kwa wilaya, aina, vyumba na kodi, au tazama ramani.')],
                            [MessageCircle, t('Message the advertiser', 'Mwandikie mtangazaji'), t('Chat inside the app and filter by district, type, bedrooms and rent, or browse the map.', 'Chuja kwa wilaya, aina, vyumba na kodi, au tazama ramani.')],
                            [CalendarCheck, t('Visit before you pay', 'Tembelea kabla ya kulipa'), t('See the home in person. Never send money for a home you have not seen.', 'Ione nyumba ana kwa ana. Usitume pesa kwa nyumba ambayo hujaiona.')],
                        ].map(([Icon, title, body], i) => (
                            <div key={title} className="relative group">
                                <div className="absolute -inset-4 bg-teal/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative p-8 h-full rounded-2xl border border-line bg-white transition-all group-hover:shadow-xl group-hover:-translate-y-1">
                                    <div className="flex items-center justify-between mb-6">
                                        <span className="font-display text-5xl font-black text-navy/10">{i + 1}</span>
                                        <div className="p-3 rounded-xl bg-teal/10 text-teal">
                                            {Icon && <Icon className="size-6" />}
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{title}</h3>
                                    <p className="text-muted leading-relaxed">{body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* NEW: Trust Indicators (Airbnb Style) */}
            <section className="py-24 bg-white overflow-hidden">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-extrabold sm:text-4xl mb-4">Designed for Total Transparency</h2>
                        <p className="text-muted max-w-2xl mx-auto text-lg">
                            {t('We believe renting should be stress-free. That is why we implement institutional-grade verification for every listing.', 'Tunaamini upangaji unapaswa kuwa bila stress. Ndio maana tunatumia uhakiki wa kiwango cha juu kwa kila tangazo.')}
                        </p>
                    </div>
                    <div className="grid gap-8 md:grid-cols-3">
                        {[
                            { icon: <ShieldCheck className="size-8" />, title: t('Verified Ownership', 'Ummiliki Uliothibitishwa'), text: t('We check land titles and ownership documents to ensure the advertiser has the legal right to let the property.', 'Tunahakiki hati za ardhi na nyaraka za umiliki ili kuhakikisha mtangazaji ana haki ya kisheria ya kupangisha nyumba.') },
                            { icon: <Zap className="size-8" />, title: t('Instant Availability', 'Upatikanaji wa Papo hapo'), text: t('Availability is confirmed in real-time. No more wasting time visiting homes that were rented yesterday.', 'Upatikanaji unathibitishwa papo hapo. Hakuna tena kupoteza muda kutembelea nyumba zilizopangwa jana.') },
                            { icon: <Sparkles className="size-8" />, title: t('Veyora AI Support', 'Msaada wa AI ya Veyora'), text: t('Our AI companion helps you analyze rental agreements and find the best homes based on your specific needs.', 'Msaidizi wetu wa AI anakusaidia kuchambua mikataba ya upangaji na kupata nyumba bora kulingana na mahitaji yako.') },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="p-8 rounded-3xl bg-paper border border-line hover:border-teal transition-all group"
                            >
                                <div className="mb-6 p-3 rounded-2xl bg-white text-teal shadow-sm w-fit group-hover:scale-110 transition-transform">
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                <p className="text-muted leading-relaxed">{item.text}</p>
                            </motion.div>
                        ))}
                    </div>
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
                    <div className="flex-1 min-w-[300px]">
                        <Logo onDark className="mb-6" />
                        <p className="text-white/60 max-w-md">
                            {t('The most transparent way to find and manage rental homes in Tanzania. Built on trust, verified by data.', 'Njia ya wazi zaidi ya kutafuta na kusimamia nyumba za kupanga Tanzania. Imewekwa kwenye uaminifu, imethibitishwa na data.')}
                        </p>
                    </div>
                    <div className="flex gap-12">
                        <div className="space-y-4">
                            <p className="font-bold text-white">Product</p>
                            <ul className="space-y-2 text-sm text-white/60">
                                <li><a href="#homes" className="hover:text-white">Find a Home</a></li>
                                <li><a href="#owners" className="hover:text-white">For Landlords</a></li>
                                <li><a href="#" className="hover:text-white">Services</a></li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <p className="font-bold text-white">Company</p>
                            <ul className="space-y-2 text-sm text-white/60">
                                <li><a href="#" className="hover:text-white">About Us</a></li>
                                <li><a href="#" className="hover:text-white">How it Works</a></li>
                                <li><a href="#" className="hover:text-white">Contact</a></li>
                            </ul>
                        </div>
                    </div>
                    {downloadUrl && (
                        <div className="bg-navy-raised p-6 rounded-3xl ring-1 ring-white/10 text-center">
                            <p className="text-sm font-bold mb-4">{t('Get the app', 'Pata app')}</p>
                            <a href={downloadUrl} className="inline-flex h-12 items-center rounded-xl bg-teal-bright px-5 font-semibold text-navy hover:bg-white transition-all">
                                {t('Download Android', 'Pakua Android')}
                            </a>
                        </div>
                    )}
                </div>
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-navy-line px-5 py-6 text-sm text-white/60">
                    <span className="flex items-center gap-3">
                        <Logo onDark className="!text-base" /> Panga na Kupangisha, Dar es Salaam
                    </span>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white">Privacy Policy</a>
                        <a href="#" className="hover:text-white">Terms of Service</a>
                        <a href="/admin" className="hover:text-white">Staff sign in</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
    return (
        <button className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            active
                ? 'bg-teal text-navy font-bold shadow-lg shadow-teal/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
        }`}>
            {icon}
            {label}
        </button>
    );
}

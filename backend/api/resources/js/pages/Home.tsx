import { useEffect, useState, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BadgeCheck, Bath, BedDouble, CalendarCheck, Check,
    MapPin, MessageCircle, Search, ShieldCheck, TriangleAlert,
    UserRound, ChevronRight, ArrowRight, Info, Star,
    Filter, Map as MapIcon, Heart, Sparkles, Zap, Building2,
    Calendar, Users, DollarSign, Key, Compass, Award, CheckCircle2,
    PhoneCall, X, ArrowUpRight, Droplets, Waves, Wifi, Lock,
    Share2, Car, ExternalLink, Clock, Navigation
} from 'lucide-react';
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

export default function HomePage({
    homes,
    stats,
    downloadUrl,
}: {
    homes: Home[];
    stats: { homes: number; districts: number };
    downloadUrl: string | null;
}) {
    const [lang, setLang] = useState<Lang>('en');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchDistrict, setSearchDistrict] = useState<string>('all');
    const [searchType, setSearchType] = useState<string>('all');
    const [searchBedrooms, setSearchBedrooms] = useState<string>('all');
    const [searchDuration, setSearchDuration] = useState<string>('all');
    const [wishlist, setWishlist] = useState<number[]>([]);

    useEffect(() => {
        try {
            if (localStorage.getItem('lang') === 'sw') setLang('sw');
        } catch {}
    }, []);

    const pick = (l: Lang) => {
        setLang(l);
        document.documentElement.lang = l;
        try {
            localStorage.setItem('lang', l);
        } catch {}
    };

    const t = (en: string, sw: string) => (lang === 'sw' ? sw : en);

    const toggleWishlist = (id: number) => {
        setWishlist((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const ago = (iso: string | null) => {
        const days = iso
            ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000))
            : 0;
        if (days === 0) return t('Today', 'Leo');
        if (days === 1) return t('Yesterday', 'Jana');
        return t(`${days} days ago`, `Siku ${days} zilizopita`);
    };

    const rent = (n: number | string | null) => {
        if (n == null) return '';
        const num = Math.round(Number(n));
        return `TZS ${num.toLocaleString('en-US')}`;
    };

    const rentUSD = (n: number | string | null) => {
        if (n == null) return '';
        const usd = Math.round(Number(n) / 2600);
        return `~$${usd.toLocaleString('en-US')}`;
    };

    const photo = (h: Home) => (h.cover_image ? `/storage/${h.cover_image}` : null);

    // Filter properties based on search bar and category tabs
    const filteredHomes = useMemo(() => {
        return homes.filter((h) => {
            // Category filter
            if (selectedCategory !== 'all') {
                if (selectedCategory === 'villa' && !h.property_type?.toLowerCase().includes('house') && !h.property_type?.toLowerCase().includes('villa')) {
                    return false;
                }
                if (selectedCategory === 'apartment' && !h.property_type?.toLowerCase().includes('apartment')) {
                    return false;
                }
                if (selectedCategory === 'verified' && !h.verified_at) {
                    return false;
                }
            }

            // District filter
            if (searchDistrict !== 'all' && h.district?.toLowerCase() !== searchDistrict.toLowerCase()) {
                return false;
            }

            // Type filter
            if (searchType !== 'all') {
                if (!h.property_type?.toLowerCase().includes(searchType.toLowerCase())) {
                    return false;
                }
            }

            // Bedrooms filter
            if (searchBedrooms !== 'all') {
                if (searchBedrooms === '3+' && (h.bedrooms || 0) < 3) return false;
                if (searchBedrooms === '2' && h.bedrooms !== 2) return false;
                if (searchBedrooms === '1' && h.bedrooms !== 1) return false;
            }

            return true;
        });
    }, [homes, selectedCategory, searchDistrict, searchType, searchBedrooms]);

    // Available districts from homes
    const uniqueDistricts = useMemo(() => {
        const set = new Set<string>();
        homes.forEach((h) => {
            if (h.district) set.add(h.district);
        });
        return Array.from(set);
    }, [homes]);

    return (
        <div className="min-h-screen bg-[#FAF8F5] text-[#12161A] selection:bg-[#12161A] selection:text-white font-sans antialiased">
            <Head title={t('Bespoke Residences & Boutique Vacation Stays • Panga Pangisha', 'Nyumba na Makazi ya Kipekee • Panga Pangisha')}>
                <meta
                    name="description"
                    content="Experience luxury direct-booking vacation rentals and verified residential sanctuaries in Tanzania. Direct host rates, STS smart utility submetering, and zero booking markups."
                />
            </Head>

            {/* 1. ARCHITECTURAL LUXURY NAVIGATION (Floorspace Aesthetic) */}
            <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#FAF8F5]/90 border-b border-[#EFECE6] transition-all">
                <div className="w-full max-w-full px-6 sm:px-10 lg:px-14 h-20 flex items-center justify-between">
                    {/* Brand Logo with Editorial Serif Subtitle */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#12161A] text-white font-serif text-xl font-bold shadow-sm group-hover:scale-105 transition-transform">
                            P
                        </div>
                        <div className="flex flex-col">
                            <span className="font-serif text-lg tracking-tight font-bold text-[#12161A]">
                                PANGA PANGISHA
                            </span>
                            <span className="text-[10px] tracking-widest uppercase font-semibold text-[#8C827A] -mt-1">
                                Residences & Stays
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden lg:flex items-center gap-8 text-xs uppercase tracking-wider font-semibold text-[#5C554E]">
                        <a href="#collections" className="hover:text-[#12161A] transition-colors">
                            {t('Curated Stays', 'Makazi Teule')}
                        </a>
                        <a href="#direct-standard" className="hover:text-[#12161A] transition-colors">
                            {t('The Direct Standard', 'Viwango Vyetu')}
                        </a>
                        <a href="#amenities" className="hover:text-[#12161A] transition-colors">
                            {t('Bespoke Amenities', 'Huduma Maalum')}
                        </a>
                        <a href="#host" className="hover:text-[#12161A] transition-colors">
                            {t('Host With Us', 'Pangisha Nasi')}
                        </a>
                    </nav>

                    {/* Right Action Bar */}
                    <div className="flex items-center gap-3 sm:gap-5">
                        {/* Language Switcher */}
                        <div className="flex rounded-full border border-[#E5E0D8] bg-[#F3EFEA] p-0.5 text-[10px] font-bold">
                            {(['en', 'sw'] as const).map((l) => (
                                <button
                                    key={l}
                                    onClick={() => pick(l)}
                                    className={`rounded-full px-2.5 py-1 uppercase transition-all ${
                                        lang === l
                                            ? 'bg-white text-[#12161A] shadow-xs'
                                            : 'text-[#8C827A] hover:text-[#12161A]'
                                    }`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>

                        {/* Sign In */}
                        <Link
                            href="/login"
                            className="text-xs uppercase tracking-wider font-semibold text-[#12161A] hover:opacity-70 transition-opacity"
                        >
                            {t('Sign in', 'Ingia')}
                        </Link>

                        {/* Landlord Portal / Host CTA */}
                        <Link
                            href="/landlord/dashboard"
                            className="inline-flex items-center gap-2 rounded-full bg-[#12161A] px-5 py-2.5 text-xs uppercase tracking-wider font-bold text-white shadow-sm hover:bg-[#2A323D] transition-all active:scale-95"
                        >
                            <Key className="h-3.5 w-3.5 text-[#E5D7B7]" />
                            <span>{t('Host Suite', 'Dashibodi')}</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* 2. HERO: Full-Bleed Architectural Sanctuary (Floorspace Inspired) */}
            <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-[#181D22] text-white">
                {/* Background Imagery with Subtle Parallax & Warm Cinematic Vignette */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1920&auto=format&fit=crop&q=85"
                        alt="Luxury Villa Sanctuary"
                        className="h-full w-full object-cover object-center opacity-65 scale-105 animate-pulse duration-[12000ms]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#12161A] via-[#12161A]/50 to-[#12161A]/70" />
                </div>

                <div className="relative z-10 w-full max-w-full px-6 sm:px-10 lg:px-16 py-20 text-center flex flex-col items-center">
                    {/* Top Pill Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] uppercase tracking-widest font-semibold backdrop-blur-md mb-8 text-[#FAF8F5]"
                    >
                        <Sparkles className="h-3.5 w-3.5 text-[#F5D485]" />
                        <span>{t('Direct Bookings • Zero Middleman Fees', 'Weka Moja kwa Moja • Hakuna Dalali')}</span>
                    </motion.div>

                    {/* Headline in Majestic Editorial Serif */}
                    <motion.h1
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-normal tracking-tight text-white max-w-5xl leading-[1.05]"
                    >
                        {t('Where Architectural Serenity Meets Coastal Solitude', 'Makazi ya Kifahari na Utulivu wa Pwani')}
                    </motion.h1>

                    {/* Subheading */}
                    <motion.p
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="mt-6 max-w-2xl text-sm sm:text-base md:text-lg text-white/80 font-light leading-relaxed"
                    >
                        {t(
                            'Curated luxury villas, cliffside sanctuaries, and urban penthouses across Tanzania. Verified title ownership, private STS smart utility submetering, and instant direct landlord agreements.',
                            'Mikusanyiko ya majumba ya kifahari, makazi ya pwani na ghorofa za kisasa Tanzania nzima. Hati zilizothibitishwa, mita binafsi za umeme na maji, na mikataba ya moja kwa moja bila madalali.'
                        )}
                    </motion.p>

                    {/* Floating Direct Booking Console (Floorspace Template Signature Widget) */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="mt-12 w-full max-w-5xl rounded-3xl sm:rounded-full bg-white p-3 sm:p-2.5 shadow-2xl text-[#12161A] flex flex-col sm:flex-row items-center gap-2 ring-1 ring-black/5"
                    >
                        {/* 1. Destination / District */}
                        <div className="flex-1 w-full px-5 py-2.5 border-b sm:border-b-0 sm:border-r border-[#EBE7E1] text-left">
                            <span className="block text-[10px] uppercase font-bold tracking-wider text-[#8C827A]">
                                {t('Destination', 'Eneo')}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <MapPin className="h-4 w-4 text-[#C2704E] shrink-0" />
                                <select
                                    value={searchDistrict}
                                    onChange={(e) => setSearchDistrict(e.target.value)}
                                    className="w-full bg-transparent text-sm font-semibold text-[#12161A] outline-hidden cursor-pointer"
                                >
                                    <option value="all">{t('All Districts (Dar, Zanzibar...)', 'Maeneo Yote')}</option>
                                    {uniqueDistricts.map((d) => (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                    <option value="kinondoni">Kinondoni (Masaki & Oyster Bay)</option>
                                    <option value="ilala">Ilala</option>
                                </select>
                            </div>
                        </div>

                        {/* 2. Residence Type */}
                        <div className="flex-1 w-full px-5 py-2.5 border-b sm:border-b-0 sm:border-r border-[#EBE7E1] text-left">
                            <span className="block text-[10px] uppercase font-bold tracking-wider text-[#8C827A]">
                                {t('Property Style', 'Aina ya Makazi')}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Building2 className="h-4 w-4 text-[#8C827A] shrink-0" />
                                <select
                                    value={searchType}
                                    onChange={(e) => setSearchType(e.target.value)}
                                    className="w-full bg-transparent text-sm font-semibold text-[#12161A] outline-hidden cursor-pointer"
                                >
                                    <option value="all">{t('All Collections', 'Mikusanyiko Yote')}</option>
                                    <option value="house">{t('Private Villas & Houses', 'Majumba ya Kifahari')}</option>
                                    <option value="apartment">{t('Penthouses & Suites', 'Ghorofa na Vyumba')}</option>
                                </select>
                            </div>
                        </div>

                        {/* 3. Bedrooms / Capacity */}
                        <div className="flex-1 w-full px-5 py-2.5 border-b sm:border-b-0 sm:border-r border-[#EBE7E1] text-left">
                            <span className="block text-[10px] uppercase font-bold tracking-wider text-[#8C827A]">
                                {t('Bedrooms', 'Vyumba vya Kulala')}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <BedDouble className="h-4 w-4 text-[#8C827A] shrink-0" />
                                <select
                                    value={searchBedrooms}
                                    onChange={(e) => setSearchBedrooms(e.target.value)}
                                    className="w-full bg-transparent text-sm font-semibold text-[#12161A] outline-hidden cursor-pointer"
                                >
                                    <option value="all">{t('Any Size', 'Idadi Yoyote')}</option>
                                    <option value="1">1 {t('Bedroom', 'Chumba')}</option>
                                    <option value="2">2 {t('Bedrooms', 'Vyumba')}</option>
                                    <option value="3+">3+ {t('Bedrooms', 'Vyumba')}</option>
                                </select>
                            </div>
                        </div>

                        {/* 4. Duration / Lease Type */}
                        <div className="flex-1 w-full px-5 py-2.5 text-left">
                            <span className="block text-[10px] uppercase font-bold tracking-wider text-[#8C827A]">
                                {t('Stay Terms', 'Muda wa Kukaa')}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Calendar className="h-4 w-4 text-[#8C827A] shrink-0" />
                                <select
                                    value={searchDuration}
                                    onChange={(e) => setSearchDuration(e.target.value)}
                                    className="w-full bg-transparent text-sm font-semibold text-[#12161A] outline-hidden cursor-pointer"
                                >
                                    <option value="all">{t('Flexible Stay', 'Muda Wowote')}</option>
                                    <option value="monthly">{t('Monthly Tenancy', 'Kodi ya Mwezi')}</option>
                                    <option value="annual">{t('Long-term Annual', 'Mwaka Mzima')}</option>
                                </select>
                            </div>
                        </div>

                        {/* Search Action Button */}
                        <a
                            href="#collections"
                            className="w-full sm:w-auto h-13 px-8 rounded-full bg-[#12161A] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#2E3742] transition-all shrink-0 active:scale-95 shadow-md"
                        >
                            <Search className="h-4 w-4" />
                            <span>{t('Explore Stays', 'Tazama')}</span>
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* 3. CURATED SANCTUARIES & RESIDENCES (Floorspace Showcase Grid) */}
            <section id="collections" className="w-full max-w-full px-6 sm:px-10 lg:px-14 py-24 scroll-mt-20">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-[#C2704E] mb-2">
                            <span>{t('Curated Portfolios', 'Mikusanyiko Maalum')}</span>
                        </div>
                        <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#12161A] tracking-tight">
                            {t('Exclusive Coastal & City Stays', 'Makazi ya Kipekee ya Pwani na Mjini')}
                        </h2>
                        <p className="mt-2 text-sm text-[#706861] max-w-xl">
                            {t(
                                'Hand-inspected homes directly from certified property owners. Verified right to let, dedicated STS utility submeters, and zero intermediary fees.',
                                'Nyumba zilizokaguliwa moja kwa moja kutoka kwa wamiliki. Hati zimethibitishwa, mita za kujitegemea za STS, na hakuna ada za dalali.'
                            )}
                        </p>
                    </div>

                    {/* Category Filter Tabs */}
                    <div className="flex flex-wrap items-center gap-2">
                        {[
                            { id: 'all', label: t('All Stays', 'Yote') },
                            { id: 'villa', label: t('Private Villas', 'Majumba') },
                            { id: 'apartment', label: t('Penthouses', 'Ghorofa') },
                            { id: 'verified', label: t('100% Verified Only', 'Zilizothibitishwa') },
                        ].map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                                    selectedCategory === cat.id
                                        ? 'bg-[#12161A] text-white shadow-xs'
                                        : 'bg-[#F2ECE4] text-[#5C554E] hover:bg-[#E5DDD3]'
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Property Card Grid */}
                {filteredHomes.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-[#DDD7CE] bg-[#F7F4EE] py-20 text-center">
                        <Building2 className="h-10 w-10 text-[#8C827A] mx-auto mb-3" />
                        <h3 className="font-serif text-xl font-bold text-[#12161A]">
                            {t('No properties match your exact filters', 'Hakuna nyumba inayolingana na vigezo vyako')}
                        </h3>
                        <p className="text-xs text-[#706861] mt-1">
                            {t('Try resetting your search filters or check all available collections.', 'Jaribu kuweka upya vigezo vyako kutazama zote.')}
                        </p>
                        <button
                            onClick={() => {
                                setSelectedCategory('all');
                                setSearchDistrict('all');
                                setSearchType('all');
                                setSearchBedrooms('all');
                            }}
                            className="mt-4 rounded-full bg-[#12161A] px-5 py-2 text-xs uppercase font-bold text-white hover:bg-[#2E3742]"
                        >
                            {t('Reset Filters', 'Weka Upya')}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">
                        {filteredHomes.map((home, idx) => {
                            const isLiked = wishlist.includes(home.id);
                            return (
                                <motion.div
                                    key={home.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: idx * 0.08 }}
                                    className="group flex flex-col rounded-3xl bg-white border border-[#EBE7E1] overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300"
                                >
                                    {/* Large Editorial Photography Box (4:3 aspect) */}
                                    <Link
                                        href={`/property/${home.id}`}
                                        className="relative aspect-4/3 w-full overflow-hidden bg-[#ECE8E1] cursor-pointer block"
                                    >
                                        {photo(home) ? (
                                            <img
                                                src={photo(home)!}
                                                alt={home.property_name || 'Tanzanian Sanctuary'}
                                                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                                loading="lazy"
                                                onError={(e) => {
                                                    (e.target as HTMLElement).style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-[#EAE5DD]">
                                                <Building2 className="h-12 w-12 text-[#9E958C]" />
                                            </div>
                                        )}

                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 opacity-70 group-hover:opacity-50 transition-opacity" />

                                        {/* Top Left Verified Badge */}
                                        <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
                                            {home.verified_at ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-[#0F766E] shadow-sm backdrop-blur-md">
                                                    <BadgeCheck className="h-3.5 w-3.5 text-[#0F766E]" />
                                                    <span>{t('Verified Title', 'Imethibitishwa')}</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-[#8C827A] shadow-sm backdrop-blur-md">
                                                    <ShieldCheck className="h-3.5 w-3.5" />
                                                    <span>{t('Direct Host', 'Mwenye Nyumba')}</span>
                                                </span>
                                            )}

                                            <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                                                <Zap className="h-3 w-3 text-[#F5D485]" />
                                                <span>{t('STS Smart Submeter', 'Mita ya STS')}</span>
                                            </span>
                                        </div>

                                        {/* Top Right Wishlist Heart */}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                toggleWishlist(home.id);
                                            }}
                                            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-[#12161A] hover:bg-white transition-all shadow-sm z-10"
                                            aria-label="Save to Wishlist"
                                        >
                                            <Heart
                                                className={`h-4 w-4 ${isLiked ? 'fill-[#C2314B] text-[#C2314B]' : 'text-[#12161A]'}`}
                                            />
                                        </button>

                                        {/* Bottom Overlay Location */}
                                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                                            <div className="flex items-center gap-1.5 text-xs font-semibold drop-shadow-md">
                                                <MapPin className="h-3.5 w-3.5 text-[#F5D485]" />
                                                <span>{[home.ward, home.district].filter(Boolean).join(', ') || 'Dar es Salaam'}</span>
                                            </div>
                                            <span className="text-[10px] bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                                                {home.property_type || 'Residential'}
                                            </span>
                                        </div>
                                    </Link>

                                    {/* Card Content Details */}
                                    <div className="p-6 flex flex-1 flex-col justify-between">
                                        <div>
                                            <Link
                                                href={`/property/${home.id}`}
                                                className="font-serif text-xl font-bold text-[#12161A] group-hover:text-[#C2704E] transition-colors line-clamp-1 block"
                                            >
                                                {home.property_name || 'Bespoke Coastal Sanctuary'}
                                            </Link>

                                            {/* Specs: Bedrooms & Bathrooms */}
                                            <div className="mt-3 flex items-center gap-4 text-xs font-medium text-[#706861]">
                                                {home.bedrooms != null && (
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <BedDouble className="h-3.5 w-3.5 text-[#12161A]" />
                                                        <span>{home.bedrooms} {t('Beds', 'Vyumba')}</span>
                                                    </span>
                                                )}
                                                {home.bathrooms != null && (
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <Bath className="h-3.5 w-3.5 text-[#12161A]" />
                                                        <span>{home.bathrooms} {t('Baths', 'Bafu')}</span>
                                                    </span>
                                                )}
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Wifi className="h-3.5 w-3.5 text-[#0F766E]" />
                                                    <span>Fiber Ready</span>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Pricing & Direct Booking Action */}
                                        <div className="mt-6 pt-4 border-t border-[#F0EBE3] flex items-center justify-between">
                                            <div>
                                                <span className="block text-[10px] uppercase font-bold tracking-wider text-[#8C827A]">
                                                    {t('Direct Host Rate', 'Kodi Moja kwa Moja')}
                                                </span>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="font-serif text-xl font-bold text-[#12161A]">
                                                        {rent(home.monthly_rent)}
                                                    </span>
                                                    <span className="text-xs text-[#8C827A] font-medium">
                                                        {rentUSD(home.monthly_rent)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Direct Full-Page Property Details Navigation */}
                                            <Link
                                                href={`/property/${home.id}`}
                                                className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF8F5] border border-[#DDD7CE] hover:border-[#12161A] hover:bg-[#12161A] hover:text-white px-4 py-2 text-xs uppercase tracking-wider font-bold text-[#12161A] transition-all"
                                            >
                                                <span>{t('Explore', 'Angalia')}</span>
                                                <ArrowUpRight className="h-3.5 w-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* 4. THE DIRECT BOOKING STANDARD (Floorspace Core Value Proposition) */}
            <section id="direct-standard" className="w-full bg-[#F3EFEA] border-y border-[#EBE7E1] py-24">
                <div className="w-full max-w-full px-6 sm:px-10 lg:px-14">
                    <div className="max-w-3xl mb-16">
                        <span className="text-xs uppercase tracking-widest font-bold text-[#C2704E]">
                            {t('The Direct Booking Guarantee', 'Dhamana ya Upangaji Moja kwa Moja')}
                        </span>
                        <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#12161A] mt-2">
                            {t('Elevating Residential & Vacation Living Across East Africa', 'Kuinua Kiwango cha Makazi Tanzania')}
                        </h2>
                        <p className="mt-4 text-sm sm:text-base text-[#706861] leading-relaxed">
                            {t(
                                'Traditional platforms take high commission cuts and obscure host identities. Panga Pangisha connects verified residents directly with real property owners with institutional verification and smart submeters.',
                                'Mifumo mingine inatoza makato makubwa na kuficha utambulisho wa wenye nyumba. Panga Pangisha inakuunganisha moja kwa moja na wamiliki halisi kwa uwazi wa asilimia 100.'
                            )}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: DollarSign,
                                title: t('0% Middleman Markups', 'Hakuna Makato ya Dalali'),
                                desc: t('Book directly at authentic owner prices. Save 15% to 20% compared to typical vacation rental commissions and brokers.', 'Weka makazi kwa bei halisi ya mwenye nyumba bila kulipa asilimia 15-20 kwa madalali au mawakala.'),
                            },
                            {
                                icon: Zap,
                                title: t('STS Smart Utility Submeters', 'Mita za STS za Kujitegemea'),
                                desc: t('Every room or villa features its own prepaid smart electricity & water submeter. Complete autonomy with zero bill conflicts.', 'Kila nyumba ina mita yake binafsi ya umeme na maji. Hakuna tena migogoro ya bili za kugawana.'),
                            },
                            {
                                icon: ShieldCheck,
                                title: t('Title & Deed Verified', 'Hati ya Umiliki Imethibitishwa'),
                                desc: t('We verify ownership deeds and representative letters before listings are published to prevent illicit broker listings.', 'Tunathibitisha hati za umiliki kabla ya kuruhusu tangazo ili kulinda wapangaji dhidi ya utapeli.'),
                            },
                            {
                                icon: CheckCircle2,
                                title: t('Digital Legal Agreements', 'Mkataba Rasmi wa Kidijitali'),
                                desc: t('Generate and sign bilingual (English & Swahili) tenancy agreements backed by legal standards in minutes.', 'Tengeneza na saini mkataba halali wa upangaji kwa Kiswahili na Kiingereza papo hapo.'),
                            },
                        ].map((card, i) => {
                            const Icon = card.icon;
                            return (
                                <div
                                    key={i}
                                    className="p-8 rounded-3xl bg-white border border-[#EBE7E1] shadow-2xs hover:shadow-md transition-all group"
                                >
                                    <div className="h-12 w-12 rounded-2xl bg-[#FAF8F5] border border-[#DDD7CE] flex items-center justify-center text-[#12161A] group-hover:scale-105 group-hover:bg-[#12161A] group-hover:text-white transition-all mb-6">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="font-serif text-xl font-bold text-[#12161A] mb-2">{card.title}</h3>
                                    <p className="text-xs text-[#706861] leading-relaxed">{card.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 5. BESPOKE AMENITIES & LIFESTYLE SHOWCASE (Floorspace Aesthetic) */}
            <section id="amenities" className="w-full max-w-full px-6 sm:px-10 lg:px-14 py-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <span className="text-xs uppercase tracking-widest font-bold text-[#C2704E]">
                            {t('Uncompromising Comfort', 'Faraja Isiyo na Kikomo')}
                        </span>
                        <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#12161A] mt-2 leading-tight">
                            {t('Designed for Discerning Travelers & Long-Term Residents', 'Imesanifiwa kwa Wasafiri na Wapangaji Wakuu')}
                        </h2>
                        <p className="mt-4 text-sm sm:text-base text-[#706861] leading-relaxed">
                            {t(
                                'Whether staying for a weekend coastal retreat or signing a multi-year residential lease in Masaki, every property is curated to ensure total tranquility, high-speed connectivity, and effortless autonomy.',
                                'Iwe unakaa kwa mapumziko ya wikendi au unalipia kodi ya mwaka mzima, kila nyumba imeandaliwa kuhakikisha utulivu, intaneti ya kasi, na amani ya moyo.'
                            )}
                        </p>

                        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {[
                                { icon: Waves, title: t('Private Pools & Terraces', 'Bwawa Binafsi na Veranda') },
                                { icon: Wifi, title: t('High-speed Starlink / Fiber', 'Intaneti ya Starlink na Fiber') },
                                { icon: Zap, title: t('Autonomous STS Submeters', 'Mita Binafsi ya Umeme STS') },
                                { icon: Droplets, title: t('Dedicated Backup Water', 'Maji ya Uhakika na Akiba') },
                                { icon: Lock, title: t('24/7 Gated Security', 'Ulinzi wa Masaa 24 na Geti') },
                                { icon: PhoneCall, title: t('Direct Host Concierge', 'Mawasiliano ya Moja kwa Moja') },
                            ].map((amenity, idx) => {
                                const Icon = amenity.icon;
                                return (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3EFEA] text-[#12161A] shrink-0">
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <span className="text-xs font-semibold text-[#12161A]">{amenity.title}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Editorial Photo Collage */}
                    <div className="relative">
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#EBE7E1] aspect-4/3">
                            <img
                                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80"
                                alt="Luxury architecture"
                                className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                            <div className="absolute bottom-6 left-6 right-6 text-white">
                                <span className="text-xs uppercase tracking-widest text-[#F5D485] font-bold">
                                    Oyster Bay & Masaki Sanctuary
                                </span>
                                <h4 className="font-serif text-xl font-bold mt-1">
                                    {t('Where architecture meets the Indian Ocean breeze.', 'Usanifu wa kisasa unaokutana na upepo wa Bahari ya Hindi.')}
                                </h4>
                            </div>
                        </div>

                        {/* Floating Trust Card Overlay */}
                        <div className="absolute -bottom-6 -left-6 rounded-2xl bg-white p-5 shadow-xl border border-[#EBE7E1] max-w-xs hidden sm:block">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#0F766E]">
                                <BadgeCheck className="h-4 w-4" />
                                <span>Verified Host Guarantee</span>
                            </div>
                            <p className="text-[11px] text-[#706861] mt-1">
                                All properties undergo rigorous ownership title checks and real-time availability confirmation.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. HOST WITH US / LANDLORD INVITATION (Floorspace Template Section) */}
            <section id="host" className="w-full bg-[#181D22] text-white py-24">
                <div className="w-full max-w-full px-6 sm:px-10 lg:px-14">
                    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1E252B] to-[#12161A] p-8 sm:p-14 lg:p-18 border border-white/10 shadow-2xl">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs uppercase tracking-widest font-bold text-[#F5D485] backdrop-blur-md">
                                    <Award className="h-3.5 w-3.5" />
                                    <span>{t('For Property Owners & Hosts', 'Kwa Wenye Nyumba na Wawekezaji')}</span>
                                </span>

                                <h2 className="font-serif text-3xl sm:text-5xl font-normal text-white mt-6 leading-tight">
                                    {t('Transform Your Property Into a High-Yield Direct Booking Sanctuary', 'Pangisha Nyumba Yako Moja kwa Moja kwa Faida Kubwa')}
                                </h2>

                                <p className="mt-4 text-sm sm:text-base text-white/80 leading-relaxed max-w-xl">
                                    {t(
                                        'Say goodbye to high platform commissions and utility disputes. Panga Pangisha provides autonomous STS submeter management, automated M-Pesa rent collections, digital leases, and verified tenants.',
                                        'Achana na makato ya juu na migogoro ya bili. Panga Pangisha inakupa mfumo wa kisasa wa mita za STS, makusanyo ya kodi ya M-Pesa, na mikataba halali ya kidijitali.'
                                    )}
                                </p>

                                <div className="mt-8 flex flex-wrap items-center gap-4">
                                    <Link
                                        href="/signup?role=landlord"
                                        className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-xs uppercase tracking-wider font-bold text-[#12161A] shadow-md hover:bg-[#F3EFEA] transition-all active:scale-95"
                                    >
                                        <span>{t('List Your Property', 'Weka Nyumba Yako')}</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                    <Link
                                        href="/landlord/dashboard"
                                        className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-xs uppercase tracking-wider font-semibold text-white hover:bg-white/10 transition-all"
                                    >
                                        <Key className="h-4 w-4 text-[#F5D485]" />
                                        <span>{t('Open Host Dashboard', 'Fungua Dashibodi')}</span>
                                    </Link>
                                </div>
                            </div>

                            {/* Host Advantages Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {[
                                    {
                                        title: t('Direct Cashflow', 'Makusanyo ya Moja kwa Moja'),
                                        desc: t('Instant rent deposits into your Tanzanian bank or M-Pesa/Airtel Money wallet.', 'Pesa inaingia moja kwa moja kwenye akaunti ya benki au M-Pesa bila kuchelewa.'),
                                    },
                                    {
                                        title: t('STS Submeter Tokens', 'Mita Binafsi za STS'),
                                        desc: t('Automatic token generation for electricity and water submeters per unit.', 'Kizazi cha tokeni za umeme na maji kwa kila mpangaji bila usumbufu.'),
                                    },
                                    {
                                        title: t('Zero Hidden Fees', 'Hakuna Makato ya Siri'),
                                        desc: t('Transparent pricing model designed to maximize host yields and tenant satisfaction.', 'Ulipaji wa wazi unaosaidia kupata faida bora zaidi.'),
                                    },
                                    {
                                        title: t('Veyora AI Copilot', 'Msaidizi wa AI wa Veyora'),
                                        desc: t('Instant legal drafting for special lease conditions, notice letters, and tenant check-in.', 'Tengeneza vifungu vya mikataba na notisi kwa sekunde chache ukitumia AI.'),
                                    },
                                ].map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
                                    >
                                        <h4 className="font-serif text-lg font-bold text-white mb-1">{item.title}</h4>
                                        <p className="text-xs text-white/70 leading-relaxed">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 7. ARCHITECTURAL FOOTER (Floorspace Luxury Standard) */}
            <footer className="w-full bg-[#12161A] text-white border-t border-white/10 pt-20 pb-12">
                <div className="w-full max-w-full px-6 sm:px-10 lg:px-14">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-16 border-b border-white/10">
                        {/* Brand Column */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#12161A] font-serif text-xl font-bold">
                                    P
                                </div>
                                <span className="font-serif text-xl tracking-tight font-bold text-white">
                                    PANGA PANGISHA
                                </span>
                            </div>
                            <p className="text-xs text-white/60 max-w-sm leading-relaxed">
                                {t(
                                    'The modern standard for residential leasing and luxury vacation sanctuaries in Tanzania. Direct host transparency, verified titles, and autonomous STS smart submetering.',
                                    'Kiwango cha kisasa cha upangaji na makazi ya kifahari Tanzania. Uwazi wa moja kwa moja, hati zilizothibitishwa, na mita za kujitegemea za STS.'
                                )}
                            </p>
                            <div className="pt-2 text-xs text-[#F5D485] font-semibold flex items-center gap-2">
                                <BadgeCheck className="h-4 w-4" />
                                <span>{t('Registered in Dar es Salaam, Tanzania', 'Imesajiliwa Dar es Salaam, Tanzania')}</span>
                            </div>
                        </div>

                        {/* Navigation Columns */}
                        <div>
                            <p className="text-xs uppercase font-bold tracking-widest text-white/40 mb-4">
                                {t('Destinations', 'Maeneo')}
                            </p>
                            <ul className="space-y-2.5 text-xs text-white/70">
                                <li><a href="#collections" className="hover:text-white transition-colors">Masaki & Oyster Bay</a></li>
                                <li><a href="#collections" className="hover:text-white transition-colors">Zanzibar Coast & Stone Town</a></li>
                                <li><a href="#collections" className="hover:text-white transition-colors">Mikocheni & Msasani</a></li>
                                <li><a href="#collections" className="hover:text-white transition-colors">Arusha & Meru</a></li>
                                <li><a href="#collections" className="hover:text-white transition-colors">Dodoma Capital City</a></li>
                            </ul>
                        </div>

                        <div>
                            <p className="text-xs uppercase font-bold tracking-widest text-white/40 mb-4">
                                {t('Portals', 'Mifumo')}
                            </p>
                            <ul className="space-y-2.5 text-xs text-white/70">
                                <li><Link href="/landlord/dashboard" className="hover:text-white transition-colors">{t('Landlord Command Suite', 'Dashibodi ya Mwenye Nyumba')}</Link></li>
                                <li><Link href="/tenant/dashboard" className="hover:text-white transition-colors">{t('Resident Portal', 'Mwenye Nyumba / Mpangaji')}</Link></li>
                                <li><Link href="/login" className="hover:text-white transition-colors">{t('Sign In', 'Ingia')}</Link></li>
                                <li><Link href="/signup" className="hover:text-white transition-colors">{t('Create Account', 'Fungua Akaunti')}</Link></li>
                                <li><a href="/admin" className="hover:text-white transition-colors">{t('Staff Administration', 'Wafanyakazi')}</a></li>
                            </ul>
                        </div>

                        <div>
                            <p className="text-xs uppercase font-bold tracking-widest text-white/40 mb-4">
                                {t('Direct Guarantee', 'Dhamana')}
                            </p>
                            <ul className="space-y-2.5 text-xs text-white/70">
                                <li><span className="text-white/50">0% Middleman Fees</span></li>
                                <li><span className="text-white/50">STS Submeter Audits</span></li>
                                <li><span className="text-white/50">Title Deed Verification</span></li>
                                <li><span className="text-white/50">Digital Lease Signing</span></li>
                                {downloadUrl && (
                                    <li className="pt-2">
                                        <a
                                            href={downloadUrl}
                                            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-white/20"
                                        >
                                            <span>Download App</span>
                                            <ArrowUpRight className="h-3 w-3" />
                                        </a>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Credits Bar */}
                    <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
                        <span>© {new Date().getFullYear()} Panga Pangisha Inc. All rights reserved.</span>
                        <div className="flex items-center gap-6">
                            <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
                            <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
                            <span className="hover:text-white transition-colors cursor-pointer">Security Standards</span>
                        </div>
                    </div>
                </div>
            </footer>

        </div>
    );
}

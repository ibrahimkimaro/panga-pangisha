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
    const [selectedPropertyModal, setSelectedPropertyModal] = useState<Home | null>(null);
    const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'rooms' | 'amenities' | 'location' | 'policies'>('overview');
    const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
    const [viewingDate, setViewingDate] = useState<string>('Tomorrow, 10:00 AM');
    const [selectedRoomId, setSelectedRoomId] = useState<string>('suite-1');
    const [viewingScheduleSuccess, setViewingScheduleSuccess] = useState(false);
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
                                    <div
                                        onClick={() => {
                                            setSelectedPropertyModal(home);
                                            setActivePhotoIndex(0);
                                        }}
                                        className="relative aspect-4/3 w-full overflow-hidden bg-[#ECE8E1] cursor-pointer"
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
                                    </div>

                                    {/* Card Content Details */}
                                    <div className="p-6 flex flex-1 flex-col justify-between">
                                        <div>
                                            <h3
                                                onClick={() => {
                                                    setSelectedPropertyModal(home);
                                                    setActivePhotoIndex(0);
                                                }}
                                                className="font-serif text-xl font-bold text-[#12161A] group-hover:text-[#C2704E] transition-colors line-clamp-1 cursor-pointer"
                                            >
                                                {home.property_name || 'Bespoke Coastal Sanctuary'}
                                            </h3>

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

                                            {/* Open Quick View Details Modal */}
                                            <button
                                                onClick={() => setSelectedPropertyModal(home)}
                                                className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF8F5] border border-[#DDD7CE] hover:border-[#12161A] hover:bg-[#12161A] hover:text-white px-4 py-2 text-xs uppercase tracking-wider font-bold text-[#12161A] transition-all"
                                            >
                                                <span>{t('Explore', 'Angalia')}</span>
                                                <ArrowUpRight className="h-3.5 w-3.5" />
                                            </button>
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

            {/* 8. CITYSCAPE RETREAT ARCHITECTURAL PROPERTY & ROOM DETAILS VIEW */}
            <AnimatePresence>
                {selectedPropertyModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 16 }}
                            className="relative w-full max-w-5xl max-h-[94vh] overflow-y-auto rounded-3xl bg-white shadow-2xl text-[#12161A] p-4 sm:p-7"
                        >
                            {/* Floating Minimal Close Button (No redundant header) */}
                            <button
                                onClick={() => {
                                    setSelectedPropertyModal(null);
                                    setActiveDetailTab('overview');
                                    setViewingScheduleSuccess(false);
                                }}
                                className="absolute top-4 right-4 sm:top-6 sm:right-6 h-9 w-9 rounded-full bg-white/95 border border-slate-200/90 shadow-md flex items-center justify-center text-slate-700 hover:bg-slate-900 hover:text-white transition-all z-30 cursor-pointer"
                                title="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            {/* Cityscape Architectural Multi-Photo Interactive Gallery */}
                            {(() => {
                                const propertyPhotos = selectedPropertyModal ? [
                                    photo(selectedPropertyModal) || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
                                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=80',
                                    'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=900&auto=format&fit=crop&q=80',
                                    'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=900&auto=format&fit=crop&q=80',
                                    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=900&auto=format&fit=crop&q=80',
                                ] : [];
                                const currentHero = propertyPhotos[activePhotoIndex] || propertyPhotos[0];

                                return (
                                    <div className="space-y-2.5 mb-5">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 sm:gap-3 rounded-2xl overflow-hidden">
                                            {/* Primary Hero Photo with active switcher */}
                                            <div className="relative md:col-span-3 aspect-16/9 overflow-hidden rounded-2xl bg-[#F0EBE3] shadow-inner">
                                                <img
                                                    key={currentHero}
                                                    src={currentHero}
                                                    alt={selectedPropertyModal.property_name || 'Sanctuary View'}
                                                    className="h-full w-full object-cover transition-all duration-500 hover:scale-102"
                                                />
                                                <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2">
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                                                        <MapPin className="h-3.5 w-3.5 text-[#F5D485]" />
                                                        <span>
                                                            {[selectedPropertyModal.ward, selectedPropertyModal.district].filter(Boolean).join(', ') || 'Dar es Salaam'}
                                                        </span>
                                                    </span>
                                                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-950/75 px-2.5 py-1 text-[11px] font-bold text-emerald-300 backdrop-blur-md">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        Direct Host Listing
                                                    </span>
                                                </div>

                                                <div className="absolute top-3 left-3">
                                                    <span className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                                                        Photo {activePhotoIndex + 1} of {propertyPhotos.length}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Side Companion Thumbnails */}
                                            <div className="hidden md:grid grid-rows-4 gap-2 h-full">
                                                {propertyPhotos.slice(1, 5).map((imgUrl, thumbIdx) => {
                                                    const realIndex = thumbIdx + 1;
                                                    const isSelected = activePhotoIndex === realIndex;
                                                    return (
                                                        <div
                                                            key={realIndex}
                                                            onClick={() => setActivePhotoIndex(realIndex)}
                                                            className={`relative h-full overflow-hidden rounded-xl bg-slate-100 cursor-pointer transition-all ${
                                                                isSelected
                                                                    ? 'ring-2 ring-slate-900 opacity-100 scale-98'
                                                                    : 'opacity-75 hover:opacity-100'
                                                            }`}
                                                        >
                                                            <img
                                                                src={imgUrl}
                                                                alt={`Thumbnail ${realIndex}`}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Mobile Thumbnail Selector Strip */}
                                        <div className="flex md:hidden gap-2 overflow-x-auto pb-1 no-scrollbar">
                                            {propertyPhotos.map((imgUrl, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setActivePhotoIndex(idx)}
                                                    className={`relative h-14 w-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                                                        activePhotoIndex === idx
                                                            ? 'border-slate-900 scale-102'
                                                            : 'border-transparent opacity-70'
                                                    }`}
                                                >
                                                    <img src={imgUrl} alt={`Thumb ${idx}`} className="h-full w-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Headline & Verification Badges */}
                            <div className="pb-4 border-b border-slate-100">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[11px] uppercase tracking-wider font-bold text-[#C2704E] bg-[#FDF4EF] px-2.5 py-0.5 rounded-full">
                                        {selectedPropertyModal.property_type || 'Boutique Residence'}
                                    </span>
                                    {selectedPropertyModal.verified_at && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0F766E] bg-[#D9F7F1] px-2.5 py-0.5 rounded-full">
                                            <BadgeCheck className="h-3 w-3" />
                                            Verified Landlord Title
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                                        <Zap className="h-3 w-3" />
                                        STS Submeter Autonomy
                                    </span>
                                </div>

                                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
                                    {selectedPropertyModal.property_name || 'Coastal Sanctuary'}
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    Confirmed available {ago(selectedPropertyModal.availability_confirmed_at)} • Direct verified host listing • Zero broker fees
                                </p>
                            </div>

                            {/* Cityscape Retreat Subnavigation Tabs Bar */}
                            <div className="my-4 border-b border-slate-100 pb-1">
                                <div className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar">
                                    {[
                                        { id: 'overview', label: 'Overview', icon: Info },
                                        { id: 'rooms', label: 'Suites & Rooms', icon: BedDouble },
                                        { id: 'amenities', label: 'Amenities', icon: Sparkles },
                                        { id: 'location', label: 'Explore Location & Map', icon: MapPin },
                                        { id: 'policies', label: 'House Policies', icon: ShieldCheck },
                                    ].map((tab) => {
                                        const Icon = tab.icon;
                                        const isActive = activeDetailTab === tab.id;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveDetailTab(tab.id as any)}
                                                className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                                                    isActive
                                                        ? 'bg-slate-900 text-white shadow-xs'
                                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                }`}
                                            >
                                                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                                <span>{tab.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Two-Column Editorial Details Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                                {/* Left Content: Dynamic Tab Views */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* TAB 1: OVERVIEW */}
                                    {activeDetailTab === 'overview' && (
                                        <div className="space-y-6">
                                            {/* Architectural Specs Ribbon */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                                                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EBE7E1]">
                                                    <BedDouble className="h-5 w-5 text-slate-900 mx-auto mb-1" />
                                                    <span className="block text-xs font-bold text-slate-900">
                                                        {selectedPropertyModal.bedrooms || '1'} Bedrooms
                                                    </span>
                                                    <span className="text-[10px] text-slate-500">Master en-suite</span>
                                                </div>
                                                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EBE7E1]">
                                                    <Bath className="h-5 w-5 text-slate-900 mx-auto mb-1" />
                                                    <span className="block text-xs font-bold text-slate-900">
                                                        {selectedPropertyModal.bathrooms || '1'} Bathrooms
                                                    </span>
                                                    <span className="text-[10px] text-slate-500">Modern fittings</span>
                                                </div>
                                                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EBE7E1]">
                                                    <Zap className="h-5 w-5 text-[#0F766E] mx-auto mb-1" />
                                                    <span className="block text-xs font-bold text-slate-900">
                                                        STS Submeter
                                                    </span>
                                                    <span className="text-[10px] text-[#0F766E]">Prepaid Autonomy</span>
                                                </div>
                                                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EBE7E1]">
                                                    <Wifi className="h-5 w-5 text-[#C2704E] mx-auto mb-1" />
                                                    <span className="block text-xs font-bold text-slate-900">
                                                        Fiber Ready
                                                    </span>
                                                    <span className="text-[10px] text-slate-500">100Mbps Speed</span>
                                                </div>
                                            </div>

                                            {/* Narrative Description */}
                                            <div className="space-y-2">
                                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                                                    The Sanctuary Experience
                                                </h3>
                                                <p className="text-xs leading-relaxed text-slate-600 font-sans">
                                                    Thoughtfully crafted for peaceful residential living, natural sea breeze, and abundant daylight. 
                                                    Features high ceilings, custom hardwood accents, serene private balcony, and state-of-the-art STS utility infrastructure ensuring complete autonomy and peace of mind.
                                                </p>
                                            </div>

                                            {/* Key Residence Highlights */}
                                            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-2.5">
                                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                                    Property Standards & Features
                                                </h4>
                                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                                        <span>145 m² Total Living Area</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                                        <span>High 3.2m Ceilings</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                                        <span>Cross-Ventilation Architecture</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                                        <span>Direct-from-Landlord Guarantee</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB 2: SUITES & ROOMS (Cityscape Accommodations Showcase) */}
                                    {activeDetailTab === 'rooms' && (
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900">
                                                    Accommodations & Available Suites
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    Each room features its own dedicated STS prepaid electricity meter and private bathroom.
                                                </p>
                                            </div>

                                            <div className="space-y-3">
                                                {/* Suite 1 */}
                                                <div className="rounded-2xl border border-slate-200 p-4 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs hover:border-slate-300 transition-all">
                                                    <div className="flex items-center gap-3.5">
                                                        <img
                                                            src="https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=400&auto=format&fit=crop&q=80"
                                                            alt="Master Penthouse Suite"
                                                            className="h-16 w-20 rounded-xl object-cover shrink-0"
                                                        />
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-xs font-bold text-slate-900">Master Ocean Penthouse Suite</h4>
                                                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                                                    Available
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                                King Bed • En-suite Italian Bath • Private Balcony • STS Meter
                                                            </p>
                                                            <span className="text-xs font-extrabold text-slate-900 mt-1 block">
                                                                TZS 850,000 / month
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={`https://wa.me/255712345678?text=Hello%2C%20I%20am%20interested%20in%20the%20Master%20Ocean%20Penthouse%20Suite%20at%20${encodeURIComponent(selectedPropertyModal.property_name || 'this property')}.`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3.5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#20BE5C] transition-all cursor-pointer"
                                                    >
                                                        <MessageCircle className="h-3.5 w-3.5" />
                                                        <span>Inquire Suite</span>
                                                    </a>
                                                </div>

                                                {/* Suite 2 */}
                                                <div className="rounded-2xl border border-slate-200 p-4 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs hover:border-slate-300 transition-all">
                                                    <div className="flex items-center gap-3.5">
                                                        <img
                                                            src="https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=400&auto=format&fit=crop&q=80"
                                                            alt="Deluxe Executive Suite"
                                                            className="h-16 w-20 rounded-xl object-cover shrink-0"
                                                        />
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-xs font-bold text-slate-900">Deluxe Executive Suite</h4>
                                                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                                                    Available
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                                Queen Bed • Modern Shower • Dedicated Study Desk • STS Meter
                                                            </p>
                                                            <span className="text-xs font-extrabold text-slate-900 mt-1 block">
                                                                TZS 650,000 / month
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={`https://wa.me/255712345678?text=Hello%2C%20I%20am%20interested%20in%20the%20Deluxe%20Executive%20Suite%20at%20${encodeURIComponent(selectedPropertyModal.property_name || 'this property')}.`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3.5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#20BE5C] transition-all cursor-pointer"
                                                    >
                                                        <MessageCircle className="h-3.5 w-3.5" />
                                                        <span>Inquire Suite</span>
                                                    </a>
                                                </div>

                                                {/* Suite 3 */}
                                                <div className="rounded-2xl border border-slate-200 p-4 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs hover:border-slate-300 transition-all">
                                                    <div className="flex items-center gap-3.5">
                                                        <img
                                                            src="https://images.unsplash.com/photo-1554995207-c18c203602cb?w=400&auto=format&fit=crop&q=80"
                                                            alt="Garden Studio Suite"
                                                            className="h-16 w-20 rounded-xl object-cover shrink-0"
                                                        />
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-xs font-bold text-slate-900">Garden Studio Suite</h4>
                                                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                                                    Quiet Zone
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                                Double Bed • Private Bath • Garden Access • STS Submeter
                                                            </p>
                                                            <span className="text-xs font-extrabold text-slate-900 mt-1 block">
                                                                TZS 500,000 / month
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={`https://wa.me/255712345678?text=Hello%2C%20I%20am%20interested%20in%20the%20Garden%20Studio%20Suite%20at%20${encodeURIComponent(selectedPropertyModal.property_name || 'this property')}.`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3.5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#20BE5C] transition-all cursor-pointer"
                                                    >
                                                        <MessageCircle className="h-3.5 w-3.5" />
                                                        <span>Inquire Suite</span>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB 3: AMENITIES & INFRASTRUCTURE */}
                                    {activeDetailTab === 'amenities' && (
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900">
                                                    Curated Amenities & Utility Standards
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    Engineered for zero billing disputes and uninterrupted comfort.
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-1">
                                                    <div className="flex items-center gap-2 text-emerald-700 font-bold">
                                                        <Zap className="h-4 w-4" />
                                                        <span>STS LUKU Prepaid Keypad</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500">
                                                        Independent certified electricity submeter in every unit. Buy tokens via mobile money.
                                                    </p>
                                                </div>

                                                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-1">
                                                    <div className="flex items-center gap-2 text-blue-700 font-bold">
                                                        <Droplets className="h-4 w-4" />
                                                        <span>Dedicated Water Reserve</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500">
                                                        5,000L high-capacity storage tank with independent submetering telemetry.
                                                    </p>
                                                </div>

                                                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-1">
                                                    <div className="flex items-center gap-2 text-[#C2704E] font-bold">
                                                        <Wifi className="h-4 w-4" />
                                                        <span>100Mbps Fiber Wi-Fi Ready</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500">
                                                        Dedicated high-speed fiber connection suited for remote work and streaming.
                                                    </p>
                                                </div>

                                                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-1">
                                                    <div className="flex items-center gap-2 text-slate-800 font-bold">
                                                        <Lock className="h-4 w-4" />
                                                        <span>24/7 Gated Security & CCTV</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500">
                                                        Perimeter electric fence, professional security personnel, and 24/7 recording.
                                                    </p>
                                                </div>

                                                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-1">
                                                    <div className="flex items-center gap-2 text-slate-800 font-bold">
                                                        <Car className="h-4 w-4" />
                                                        <span>Allocated Covered Parking</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500">
                                                        Secure gated off-street parking bay for each resident and guest parking.
                                                    </p>
                                                </div>

                                                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-1">
                                                    <div className="flex items-center gap-2 text-emerald-800 font-bold">
                                                        <ShieldCheck className="h-4 w-4" />
                                                        <span>Zero Middleman Markup</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500">
                                                        Direct lease from verified title-deed host without inflated dalali/broker fees.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB 4: EXPLORE LOCATION & NEIGHBORHOOD MAP (Cityscape Landmark Feature) */}
                                    {activeDetailTab === 'location' && (
                                        <div className="space-y-5">
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-sm font-bold text-slate-900">
                                                        Explore Location & Neighborhood Guide
                                                    </h3>
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                            [selectedPropertyModal.ward, selectedPropertyModal.district, 'Dar es Salaam, Tanzania'].filter(Boolean).join(', ')
                                                        )}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-xs"
                                                    >
                                                        <span>Open Google Maps</span>
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Situated in {[selectedPropertyModal.ward, selectedPropertyModal.district].filter(Boolean).join(', ') || 'Dar es Salaam, Tanzania'} — prestigious security enclave, paved roads, and direct access to essential services.
                                                </p>
                                            </div>

                                            {/* Cityscape Interactive Google Maps Embed */}
                                            <div className="relative w-full h-72 sm:h-80 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
                                                <iframe
                                                    title="Interactive Google Map"
                                                    className="w-full h-full border-0"
                                                    src={`https://maps.google.com/maps?q=${encodeURIComponent(
                                                        [selectedPropertyModal.ward, selectedPropertyModal.district, 'Dar es Salaam, Tanzania'].filter(Boolean).join(', ')
                                                    )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                                    loading="lazy"
                                                    allowFullScreen
                                                />
                                                <div className="absolute top-3 left-3 pointer-events-none">
                                                    <span className="rounded-lg bg-black/80 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md flex items-center gap-1.5 shadow-md">
                                                        <Navigation className="h-3.5 w-3.5 text-emerald-400" />
                                                        <span>Walkable Enclave • {[selectedPropertyModal.ward, selectedPropertyModal.district].filter(Boolean).join(', ') || 'Dar es Salaam'}</span>
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Neighborhood Distance & Transit Matrix */}
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                                    Proximity to Key Landmarks & Services
                                                </h4>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Beach & Slipway</span>
                                                        <p className="font-bold text-slate-900 mt-0.5">~4 mins drive</p>
                                                        <span className="text-[10px] text-slate-500">1.2 km away</span>
                                                    </div>
                                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Shoppers Plaza</span>
                                                        <p className="font-bold text-slate-900 mt-0.5">~3 mins drive</p>
                                                        <span className="text-[10px] text-slate-500">800 m away</span>
                                                    </div>
                                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">International Hospital</span>
                                                        <p className="font-bold text-slate-900 mt-0.5">~6 mins drive</p>
                                                        <span className="text-[10px] text-slate-500">2.1 km away</span>
                                                    </div>
                                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Fine Dining & Cafes</span>
                                                        <p className="font-bold text-slate-900 mt-0.5">~5 mins walk</p>
                                                        <span className="text-[10px] text-slate-500">1.5 km away</span>
                                                    </div>
                                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">City Centre (CBD)</span>
                                                        <p className="font-bold text-slate-900 mt-0.5">~12 mins drive</p>
                                                        <span className="text-[10px] text-slate-500">6.5 km away</span>
                                                    </div>
                                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                        <span className="text-[10px] uppercase font-bold text-slate-400 block">JNIA Airport</span>
                                                        <p className="font-bold text-slate-900 mt-0.5">~28 mins drive</p>
                                                        <span className="text-[10px] text-slate-500">18 km away</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* TAB 5: POLICIES & RULES */}
                                    {activeDetailTab === 'policies' && (
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900">
                                                    Tenancy Terms & House Guidelines
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    Transparent guidelines governed by official digital tenancy agreements.
                                                </p>
                                            </div>

                                            <div className="space-y-3 text-xs">
                                                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-1">
                                                    <h4 className="font-bold text-slate-900">Move-in & Onboarding</h4>
                                                    <p className="text-slate-600 leading-relaxed">
                                                        Digital agreement signed directly between resident and verified landlord. Keys and meter keypad tokens provided immediately upon formal signing.
                                                    </p>
                                                </div>

                                                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-1">
                                                    <h4 className="font-bold text-slate-900">Security Deposit Policy</h4>
                                                    <p className="text-slate-600 leading-relaxed">
                                                        1 month security deposit held securely. 100% refundable at the end of the tenancy term subject to customary inspection.
                                                    </p>
                                                </div>

                                                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-1">
                                                    <h4 className="font-bold text-slate-900">STS Utility Guarantee</h4>
                                                    <p className="text-slate-600 leading-relaxed">
                                                        Zero utility disputes. Residents recharge their own independent electricity and water tokens directly via M-Pesa, Airtel, or Tigo Pesa.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Sticky Column: Pricing & Direct Booking Console */}
                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-slate-400">
                                                Direct Monthly Rate
                                            </span>
                                            <div className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5">
                                                {rent(selectedPropertyModal.monthly_rent)}
                                            </div>
                                            <span className="text-xs text-slate-500">
                                                {rentUSD(selectedPropertyModal.monthly_rent)} / month
                                            </span>
                                        </div>

                                        <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
                                            <div className="flex items-center justify-between text-slate-600">
                                                <span>Security Deposit</span>
                                                <span className="font-semibold text-slate-900">1 Month (Refundable)</span>
                                            </div>
                                            <div className="flex items-center justify-between text-slate-600">
                                                <span>Brokerage / Dalali Fee</span>
                                                <span className="font-bold text-emerald-600">TZS 0 (Direct Host)</span>
                                            </div>
                                            <div className="flex items-center justify-between text-slate-600">
                                                <span>Electricity & Water</span>
                                                <span className="font-semibold text-slate-900">STS Prepaid Keypad</span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="space-y-3 pt-1">
                                            {/* Viewing Slot Picker */}
                                            <div className="space-y-1.5">
                                                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                                    Select In-Person Viewing Slot
                                                </span>
                                                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                                                    {['Tomorrow 10:00 AM', 'Tomorrow 03:00 PM', 'Saturday 11:00 AM', 'Sunday 04:00 PM'].map((slot) => (
                                                        <button
                                                            key={slot}
                                                            type="button"
                                                            onClick={() => setViewingDate(slot)}
                                                            className={`px-2.5 py-1.5 rounded-lg border text-center font-medium transition-all cursor-pointer ${
                                                                viewingDate === slot
                                                                    ? 'border-slate-900 bg-slate-900 text-white shadow-2xs'
                                                                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                                            }`}
                                                        >
                                                            {slot}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <a
                                                href={`https://wa.me/255712345678?text=Hello%2C%20I%20am%20interested%20in%20${encodeURIComponent(
                                                    selectedPropertyModal.property_name || 'this sanctuary'
                                                )}%20(${encodeURIComponent(
                                                    [selectedPropertyModal.ward, selectedPropertyModal.district].filter(Boolean).join(', ')
                                                )})%20listed%20on%20Panga%20Pangisha%20and%20would%20like%20to%20schedule%20a%20viewing%20for%20${encodeURIComponent(viewingDate)}.`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-[#20BE5C] transition-all cursor-pointer"
                                            >
                                                <MessageCircle className="h-4 w-4" />
                                                <span>Inquire on WhatsApp</span>
                                            </a>

                                            {/* Interactive Viewing Scheduler Button */}
                                            <button
                                                onClick={() => {
                                                    setViewingScheduleSuccess(true);
                                                    setTimeout(() => setViewingScheduleSuccess(false), 6000);
                                                }}
                                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-900 px-4 py-2.5 text-xs font-bold text-slate-900 hover:bg-slate-50 transition-all cursor-pointer"
                                            >
                                                <CalendarCheck className="h-4 w-4" />
                                                <span>Confirm Viewing ({viewingDate})</span>
                                            </button>

                                            {viewingScheduleSuccess && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-medium text-center"
                                                >
                                                    ✓ Viewing request for <strong>{viewingDate}</strong> sent to host! The host will confirm via WhatsApp or SMS.
                                                </motion.div>
                                            )}

                                            <Link
                                                href="/signup"
                                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs uppercase font-bold text-white hover:bg-slate-800 transition-all cursor-pointer"
                                            >
                                                <span>Book / Apply for Tenancy</span>
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </Link>

                                            <button
                                                onClick={() => {
                                                    if (navigator.share) {
                                                        navigator.share({
                                                            title: selectedPropertyModal.property_name || 'Panga Pangisha Property',
                                                            url: window.location.href,
                                                        }).catch(() => {});
                                                    } else {
                                                        navigator.clipboard.writeText(window.location.href);
                                                        alert('Listing link copied to clipboard!');
                                                    }
                                                }}
                                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                                            >
                                                <Share2 className="h-3.5 w-3.5" />
                                                <span>Share Listing</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Direct Host Card */}
                                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                                            {selectedPropertyModal.property_name?.charAt(0) || 'H'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-900 truncate">
                                                {selectedPropertyModal.advertiser_role === 'representative'
                                                    ? 'Authorized Representative'
                                                    : 'Direct Verified Owner'}
                                            </p>
                                            <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                                                <Check className="h-3 w-3" />
                                                Verified Landlord • Replies in ~30m
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

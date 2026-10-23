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
    Share2, Car, ExternalLink, Clock, Navigation, Menu
} from 'lucide-react';
import { Logo } from '@/components/ui';
import { TANZANIA_REGIONS, getDistrictsForRegion, getWardsForDistrict } from '@/data/tanzaniaLocations';
import SupportAssistant from '@/components/support/SupportAssistant';

type Home = {
    id: number;
    property_name: string | null;
    property_type: string | null;
    region?: string | null;
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
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchRegion, setSearchRegion] = useState<string>('Dar es Salaam');
    const [searchDistrict, setSearchDistrict] = useState<string>('all');
    const [searchWard, setSearchWard] = useState<string>('all');
    const [searchType, setSearchType] = useState<string>('all');
    const [searchBedrooms, setSearchBedrooms] = useState<string>('all');
    const [searchDuration, setSearchDuration] = useState<string>('all');
    const [wishlist, setWishlist] = useState<number[]>([]);

    useEffect(() => {
        try {
            if (localStorage.getItem('lang') === 'sw') setLang('sw');
        } catch { }
    }, []);

    const pick = (l: Lang) => {
        setLang(l);
        document.documentElement.lang = l;
        try {
            localStorage.setItem('lang', l);
        } catch { }
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

    // Dynamic districts based on selected region (TCRA / NaPA Official Standards)
    const availableDistricts = useMemo(() => {
        if (searchRegion !== 'all') {
            return getDistrictsForRegion(searchRegion);
        }
        // If all regions, aggregate unique districts from homes + major cities
        const set = new Set<string>();
        homes.forEach((h) => {
            if (h.district) set.add(h.district);
        });
        ['Kinondoni', 'Ilala', 'Temeke', 'Ubungo', 'Kigamboni', 'Arusha City', 'Dodoma City'].forEach((d) => set.add(d));
        return Array.from(set);
    }, [searchRegion, homes]);

    // Dynamic wards based on selected region and district
    const availableWards = useMemo(() => {
        if (searchDistrict === 'all') return [];
        return getWardsForDistrict(searchRegion, searchDistrict);
    }, [searchRegion, searchDistrict]);

    const handleRegionChange = (newRegion: string) => {
        setSearchRegion(newRegion);
        setSearchDistrict('all');
        setSearchWard('all');
    };

    const handleDistrictChange = (newDistrict: string) => {
        setSearchDistrict(newDistrict);
        setSearchWard('all');
    };

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

            // Region (City / Mkoa) filter
            if (searchRegion !== 'all') {
                const homeRegion = (h.region || 'Dar es Salaam').toLowerCase().trim();
                const targetRegion = searchRegion.toLowerCase().trim();
                if (!homeRegion.includes(targetRegion) && !targetRegion.includes(homeRegion)) {
                    return false;
                }
            }

            // District (Wilaya) filter
            if (searchDistrict !== 'all') {
                const homeDistrict = (h.district || '').toLowerCase().trim();
                const targetDistrict = searchDistrict.toLowerCase().trim();
                if (!homeDistrict.includes(targetDistrict) && !targetDistrict.includes(homeDistrict)) {
                    return false;
                }
            }

            // Ward (Kata) filter
            if (searchWard !== 'all') {
                const homeWard = (h.ward || '').toLowerCase().trim();
                const targetWard = searchWard.toLowerCase().trim();
                if (!homeWard.includes(targetWard) && !targetWard.includes(homeWard)) {
                    return false;
                }
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
    }, [homes, selectedCategory, searchRegion, searchDistrict, searchWard, searchType, searchBedrooms]);

    return (
        <div className="min-h-screen bg-[#FAF8F5] text-[#12161A] selection:bg-[#12161A] selection:text-white font-sans antialiased">
            <Head title={t('Bespoke Residences & Boutique Vacation Stays • Panga Pangisha', 'Nyumba na Makazi ya Kipekee • Panga Pangisha')}>
                <meta
                    name="description"
                    content="Experience luxury direct-booking vacation rentals and verified residential sanctuaries in Tanzania. Direct host rates, STS smart utility submetering, and zero booking markups."
                />
            </Head>

            {/* 1. ARCHITECTURAL LUXURY NAVIGATION (Floorspace Aesthetic) */}
            <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#FAF8F5]/95 border-b border-[#EFECE6] transition-all">
                <div className="w-full max-w-full px-4 sm:px-8 lg:px-14 h-16 sm:h-20 flex items-center justify-between">
                    {/* Brand Logo with Editorial Serif Subtitle */}
                    <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
                        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#12161A] text-white font-serif text-lg sm:text-xl font-bold shadow-xs group-hover:scale-105 transition-transform">
                            P
                        </div>
                        <div className="flex flex-col">
                            <span className="font-serif text-base sm:text-lg tracking-tight font-bold text-[#12161A] leading-tight">
                                PANGA PANGISHA
                            </span>
                            <span className="text-[9px] sm:text-[10px] tracking-widest uppercase font-semibold text-[#8C827A] -mt-0.5 sm:-mt-1 hidden xs:block">
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
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        {/* Language Switcher */}
                        <div className="flex rounded-full border border-[#E5E0D8] bg-[#F3EFEA] p-0.5 text-[10px] font-bold">
                            {(['en', 'sw'] as const).map((l) => (
                                <button
                                    key={l}
                                    onClick={() => pick(l)}
                                    className={`rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 uppercase transition-all ${
                                        lang === l
                                            ? 'bg-white text-[#12161A] shadow-xs'
                                            : 'text-[#8C827A] hover:text-[#12161A]'
                                    }`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>

                        {/* Sign In - Desktop */}
                        <Link
                            href="/login"
                            className="hidden sm:inline-block text-xs uppercase tracking-wider font-semibold text-[#12161A] hover:opacity-70 transition-opacity"
                        >
                            {t('Sign in', 'Ingia')}
                        </Link>

                        {/* Landlord Portal / Host CTA - Desktop */}
                        <Link
                            href="/landlord/dashboard"
                            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-[#12161A] px-4 sm:px-5 py-2 sm:py-2.5 text-xs uppercase tracking-wider font-bold text-white shadow-xs hover:bg-[#2A323D] transition-all active:scale-95"
                        >
                            <Key className="h-3.5 w-3.5 text-[#E5D7B7]" />
                            <span>{t('Host Suite', 'Dashibodi')}</span>
                        </Link>

                        {/* Mobile Hamburger Menu Toggle */}
                        <button
                            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                            className="flex lg:hidden h-9 w-9 items-center justify-center rounded-full border border-[#E5E0D8] bg-white text-[#12161A] hover:bg-[#F3EFEA] transition-all"
                            aria-label="Toggle Navigation Menu"
                        >
                            {isMobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Drawer / Slide-Down Menu */}
                <AnimatePresence>
                    {isMobileNavOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="lg:hidden border-t border-[#EFECE6] bg-[#FAF8F5] px-5 py-4 shadow-lg overflow-hidden"
                        >
                            <nav className="flex flex-col gap-2.5 text-sm font-semibold text-[#5C554E]">
                                <a
                                    href="#collections"
                                    onClick={() => setIsMobileNavOpen(false)}
                                    className="flex items-center justify-between py-2 px-2 rounded-xl hover:bg-[#F3EFEA] hover:text-[#12161A] transition-colors"
                                >
                                    <span>{t('Curated Stays', 'Makazi Teule')}</span>
                                    <ChevronRight className="h-4 w-4 text-[#8C827A]" />
                                </a>
                                <a
                                    href="#direct-standard"
                                    onClick={() => setIsMobileNavOpen(false)}
                                    className="flex items-center justify-between py-2 px-2 rounded-xl hover:bg-[#F3EFEA] hover:text-[#12161A] transition-colors"
                                >
                                    <span>{t('The Direct Standard', 'Viwango Vyetu')}</span>
                                    <ChevronRight className="h-4 w-4 text-[#8C827A]" />
                                </a>
                                <a
                                    href="#amenities"
                                    onClick={() => setIsMobileNavOpen(false)}
                                    className="flex items-center justify-between py-2 px-2 rounded-xl hover:bg-[#F3EFEA] hover:text-[#12161A] transition-colors"
                                >
                                    <span>{t('Bespoke Amenities', 'Huduma Maalum')}</span>
                                    <ChevronRight className="h-4 w-4 text-[#8C827A]" />
                                </a>
                                <a
                                    href="#host"
                                    onClick={() => setIsMobileNavOpen(false)}
                                    className="flex items-center justify-between py-2 px-2 rounded-xl hover:bg-[#F3EFEA] hover:text-[#12161A] transition-colors"
                                >
                                    <span>{t('Host With Us', 'Pangisha Nasi')}</span>
                                    <ChevronRight className="h-4 w-4 text-[#8C827A]" />
                                </a>

                                <div className="pt-3 border-t border-[#EFECE6] flex flex-col gap-2">
                                    <Link
                                        href="/login"
                                        onClick={() => setIsMobileNavOpen(false)}
                                        className="w-full flex items-center justify-center rounded-xl border border-[#DDD7CE] bg-white py-2.5 text-xs uppercase tracking-wider font-bold text-[#12161A] hover:bg-[#F3EFEA]"
                                    >
                                        {t('Sign in', 'Ingia')}
                                    </Link>
                                    <Link
                                        href="/landlord/dashboard"
                                        onClick={() => setIsMobileNavOpen(false)}
                                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#12161A] py-2.5 text-xs uppercase tracking-wider font-bold text-white shadow-xs hover:bg-[#2A323D]"
                                    >
                                        <Key className="h-3.5 w-3.5 text-[#E5D7B7]" />
                                        <span>{t('Host Command Suite', 'Dashibodi ya Mwenye Nyumba')}</span>
                                    </Link>
                                </div>
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* 2. HERO: Full-Bleed Architectural Sanctuary (Floorspace Inspired) */}
            <section className="relative min-h-[75vh] sm:min-h-[85vh] flex items-center justify-center overflow-hidden bg-[#181D22] text-white">
                {/* Background Imagery with Subtle Parallax & Warm Cinematic Vignette */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1920&auto=format&fit=crop&q=85"
                        alt="Luxury Villa Sanctuary"
                        className="h-full w-full object-cover object-center opacity-65 scale-105 animate-pulse duration-[12000ms]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#12161A] via-[#12161A]/50 to-[#12161A]/70" />
                </div>

                <div className="relative z-10 w-full max-w-full px-4 sm:px-10 lg:px-16 py-12 sm:py-20 text-center flex flex-col items-center">
                    {/* Top Pill Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/20 bg-white/10 px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-[11px] uppercase tracking-widest font-semibold backdrop-blur-md mb-5 sm:mb-8 text-[#FAF8F5]"
                    >
                        <Sparkles className="h-3.5 w-3.5 text-[#F5D485]" />
                        <span>{t('Direct Bookings • Zero Middleman Fees', 'Weka Moja kwa Moja • Hakuna Dalali')}</span>
                    </motion.div>

                    {/* Headline in Majestic Editorial Serif - Responsive Sizes for Phone, Tablet & Desktop */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-normal tracking-tight text-white max-w-5xl leading-tight sm:leading-tight lg:leading-[1.05]"
                    >
                        {t('Where Architectural Serenity Meets Coastal Solitude', 'Makazi ya Kifahari na Utulivu wa Pwani')}
                    </motion.h1>

                    {/* Subheading */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="mt-4 sm:mt-6 max-w-3xl text-xs sm:text-base md:text-lg lg:text-xl text-white/90 font-light leading-relaxed px-2"
                    >
                        {t(
                            'Curated luxury villas, cliffside sanctuaries, and urban penthouses across Tanzania. Verified title ownership, private STS smart utility submetering, and instant direct landlord agreements.',
                            'Mikusanyiko ya majumba ya kifahari, makazi ya pwani na ghorofa za kisasa Tanzania nzima. Hati zilizothibitishwa, mita binafsi za umeme na maji, na mikataba ya moja kwa moja bila madalali.'
                        )}
                    </motion.p>

                    {/* Floating Direct Booking Console (Floorspace Template Signature Widget) */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="mt-8 sm:mt-12 w-full max-w-6xl rounded-2xl sm:rounded-3xl bg-white p-2.5 sm:p-3 lg:p-3.5 shadow-2xl text-[#12161A] flex flex-col lg:flex-row items-center gap-1.5 sm:gap-2 ring-1 ring-black/5"
                    >
                        {/* 1. Destination: City / Region (Mkoa) */}
                        <div className="flex-1 w-full px-3.5 sm:px-4 py-2 border-b lg:border-b-0 lg:border-r border-[#EBE7E1] text-left">
                            <span className="block text-[10px] sm:text-[11px] lg:text-xs uppercase font-bold tracking-wider text-[#8C827A]">
                                {t('City / Region', 'Mkoa / Jiji')}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Navigation className="h-4 w-4 text-[#C2704E] shrink-0" />
                                <select
                                    value={searchRegion}
                                    onChange={(e) => handleRegionChange(e.target.value)}
                                    className="w-full bg-transparent text-xs sm:text-sm lg:text-base font-semibold text-[#12161A] outline-hidden cursor-pointer"
                                >
                                    <option value="all">{t('All Tanzania (Mikoa Yote)', 'Mikoa Yote ya Tanzania')}</option>
                                    <option value="Dar es Salaam">Dar es Salaam (Commercial Capital)</option>
                                    {TANZANIA_REGIONS.filter(r => r.name !== 'Dar es Salaam').map((r) => (
                                        <option key={r.name} value={r.name}>
                                            {r.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* 2. Destination: District (Wilaya) - Dynamically populated according to NaPA */}
                        <div className="flex-1 w-full px-3.5 sm:px-4 py-2 border-b lg:border-b-0 lg:border-r border-[#EBE7E1] text-left">
                            <span className="block text-[10px] sm:text-[11px] lg:text-xs uppercase font-bold tracking-wider text-[#8C827A]">
                                {t('District / Wilaya', 'Wilaya / Eneo')}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <MapPin className="h-4 w-4 text-[#C2704E] shrink-0" />
                                <select
                                    value={searchDistrict}
                                    onChange={(e) => handleDistrictChange(e.target.value)}
                                    className="w-full bg-transparent text-xs sm:text-sm lg:text-base font-semibold text-[#12161A] outline-hidden cursor-pointer"
                                >
                                    <option value="all">
                                        {searchRegion === 'all'
                                            ? t('All Districts', 'Wilaya Zote')
                                            : t(`All Districts in ${searchRegion}`, `Wilaya Zote za ${searchRegion}`)}
                                    </option>
                                    {searchRegion === 'Dar es Salaam' ? (
                                        <>
                                            <option value="Temeke">Temeke (Kurasini, Chang'ombe, Mbagala)</option>
                                            <option value="Kinondoni">Kinondoni (Masaki, Oysterbay, Mikocheni)</option>
                                            <option value="Ilala">Ilala (Upanga, Kisutu, Kariakoo)</option>
                                            <option value="Ubungo">Ubungo (Sinza, Kimara, Mbezi)</option>
                                            <option value="Kigamboni">Kigamboni (Kibada, Somangila)</option>
                                        </>
                                    ) : (
                                        availableDistricts.map((d) => (
                                            <option key={d} value={d}>
                                                {d}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </div>

                        {/* 3. Destination: Ward / Neighborhood (Kata) */}
                        <div className="flex-1 w-full px-3.5 sm:px-4 py-2 border-b lg:border-b-0 lg:border-r border-[#EBE7E1] text-left">
                            <span className="block text-[10px] sm:text-[11px] lg:text-xs uppercase font-bold tracking-wider text-[#8C827A]">
                                {t('Ward / Neighborhood', 'Kata / Mtaa')}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Compass className="h-4 w-4 text-[#8C827A] shrink-0" />
                                <select
                                    value={searchWard}
                                    onChange={(e) => setSearchWard(e.target.value)}
                                    disabled={searchDistrict === 'all' && availableWards.length === 0}
                                    className="w-full bg-transparent text-xs sm:text-sm lg:text-base font-semibold text-[#12161A] outline-hidden cursor-pointer disabled:opacity-50"
                                >
                                    <option value="all">
                                        {searchDistrict === 'all'
                                            ? t('All Wards (Kata Zote)', 'Kata Zote')
                                            : t(`All Wards in ${searchDistrict}`, `Kata Zote (${searchDistrict})`)}
                                    </option>
                                    {availableWards.map((w) => (
                                        <option key={w} value={w}>
                                            {w}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* 4. Residence Style */}
                        <div className="flex-1 w-full px-3.5 sm:px-4 py-2 border-b lg:border-b-0 lg:border-r border-[#EBE7E1] text-left">
                            <span className="block text-[10px] sm:text-[11px] lg:text-xs uppercase font-bold tracking-wider text-[#8C827A]">
                                {t('Property Style', 'Aina ya Makazi')}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Building2 className="h-4 w-4 text-[#8C827A] shrink-0" />
                                <select
                                    value={searchType}
                                    onChange={(e) => setSearchType(e.target.value)}
                                    className="w-full bg-transparent text-xs sm:text-sm lg:text-base font-semibold text-[#12161A] outline-hidden cursor-pointer"
                                >
                                    <option value="all">{t('All Collections', 'Mikusanyiko Yote')}</option>
                                    <option value="house">{t('Private Villas & Houses', 'Majumba ya Kifahari')}</option>
                                    <option value="apartment">{t('Penthouses & Suites', 'Ghorofa na Vyumba')}</option>
                                </select>
                            </div>
                        </div>

                        {/* 5. Bedrooms */}
                        <div className="w-full lg:w-36 px-3.5 sm:px-4 py-2 text-left">
                            <span className="block text-[10px] sm:text-[11px] lg:text-xs uppercase font-bold tracking-wider text-[#8C827A]">
                                {t('Bedrooms', 'Vyumba')}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <BedDouble className="h-4 w-4 text-[#8C827A] shrink-0" />
                                <select
                                    value={searchBedrooms}
                                    onChange={(e) => setSearchBedrooms(e.target.value)}
                                    className="w-full bg-transparent text-xs sm:text-sm lg:text-base font-semibold text-[#12161A] outline-hidden cursor-pointer"
                                >
                                    <option value="all">{t('Any', 'Yoyote')}</option>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3+">3+</option>
                                </select>
                            </div>
                        </div>

                        {/* Search Action Button */}
                        <a
                            href="#collections"
                            className="w-full lg:w-auto h-11 sm:h-12 lg:h-14 px-6 sm:px-7 lg:px-9 rounded-xl sm:rounded-full bg-[#12161A] text-white font-bold text-xs sm:text-sm lg:text-base uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#2E3742] transition-all shrink-0 active:scale-95 shadow-md mt-1 lg:mt-0"
                        >
                            <Search className="h-4 w-4" />
                            <span>{t('Explore Stays', 'Tazama')}</span>
                        </a>
                    </motion.div>

                    {/* Quick Popular Destination Hotspots */}
                    <div className="mt-6 sm:mt-8 flex flex-col items-center gap-3 w-full max-w-4xl">
                        <span className="text-[11px] sm:text-xs uppercase tracking-wider text-white/70 font-bold">
                            {t('Popular Hotspots:', 'Maeneo Maarufu ya Tanzania:')}
                        </span>

                        {/* Mobile Phone Layout: Clean 2-Column Compact Destination Cards */}
                        <div className="grid grid-cols-2 gap-2 w-full max-w-sm sm:hidden px-2">
                            {[
                                { region: 'Dar es Salaam', district: 'Temeke', name: 'Temeke', detail: "Harbor & Chang'ombe", icon: '🔥' },
                                { region: 'Dar es Salaam', district: 'Kinondoni', name: 'Kinondoni', detail: 'Masaki & Oysterbay', icon: '✨' },
                                { region: 'Dar es Salaam', district: 'Ilala', name: 'Ilala', detail: 'Upanga & CBD', icon: '🏛️' },
                                { region: 'Dar es Salaam', district: 'Ubungo', name: 'Ubungo', detail: 'Sinza & Kimara', icon: '📍' },
                                { region: 'Dar es Salaam', district: 'Kigamboni', name: 'Kigamboni', detail: 'Coastal Sanctuary', icon: '🌊' },
                                { region: 'Zanzibar (Mjini Magharibi)', district: 'Mjini', name: 'Zanzibar', detail: 'Stone Town & Coast', icon: '🏝️' },
                            ].map((item, idx) => {
                                const isSelected = searchRegion.includes(item.region.split(' ')[0]) && (searchDistrict === item.district || (item.district === 'Mjini' && searchRegion.includes('Zanzibar')));
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setSearchRegion(item.region);
                                            setSearchDistrict(item.district);
                                            setSearchWard('all');
                                        }}
                                        className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all ${
                                            isSelected
                                                ? 'bg-[#C2704E] text-white shadow-md ring-1 ring-white/30'
                                                : 'bg-white/10 hover:bg-white/20 text-white/95 border border-white/15 backdrop-blur-md'
                                        }`}
                                    >
                                        <span className="text-base shrink-0">{item.icon}</span>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold truncate leading-tight">{item.name}</p>
                                            <p className="text-[9px] text-white/70 truncate leading-tight mt-0.5">{item.detail}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Tablet & Desktop Layout: Generous Pill Bar with Full Font Sizing */}
                        <div className="hidden sm:flex flex-wrap items-center justify-center gap-2.5">
                            <button
                                onClick={() => {
                                    setSearchRegion('Dar es Salaam');
                                    setSearchDistrict('Temeke');
                                    setSearchWard('all');
                                }}
                                className={`rounded-full px-3.5 py-1.5 text-xs lg:text-sm font-semibold backdrop-blur-md transition-all ${
                                    searchRegion === 'Dar es Salaam' && searchDistrict === 'Temeke'
                                        ? 'bg-[#C2704E] text-white shadow-sm'
                                        : 'bg-white/15 text-white/90 hover:bg-white/25 border border-white/20'
                                }`}
                            >
                                🔥 {t('Temeke (Harbor & Chang\'ombe)', 'Temeke')}
                            </button>
                            <button
                                onClick={() => {
                                    setSearchRegion('Dar es Salaam');
                                    setSearchDistrict('Kinondoni');
                                    setSearchWard('all');
                                }}
                                className={`rounded-full px-3.5 py-1.5 text-xs lg:text-sm font-semibold backdrop-blur-md transition-all ${
                                    searchRegion === 'Dar es Salaam' && searchDistrict === 'Kinondoni'
                                        ? 'bg-[#C2704E] text-white shadow-sm'
                                        : 'bg-white/15 text-white/90 hover:bg-white/25 border border-white/20'
                                }`}
                            >
                                {t('Kinondoni (Masaki & Oysterbay)', 'Kinondoni')}
                            </button>
                            <button
                                onClick={() => {
                                    setSearchRegion('Dar es Salaam');
                                    setSearchDistrict('Ilala');
                                    setSearchWard('all');
                                }}
                                className={`rounded-full px-3.5 py-1.5 text-xs lg:text-sm font-semibold backdrop-blur-md transition-all ${
                                    searchRegion === 'Dar es Salaam' && searchDistrict === 'Ilala'
                                        ? 'bg-[#C2704E] text-white shadow-sm'
                                        : 'bg-white/15 text-white/90 hover:bg-white/25 border border-white/20'
                                }`}
                            >
                                {t('Ilala (Upanga & CBD)', 'Ilala')}
                            </button>
                            <button
                                onClick={() => {
                                    setSearchRegion('Dar es Salaam');
                                    setSearchDistrict('Ubungo');
                                    setSearchWard('all');
                                }}
                                className={`rounded-full px-3.5 py-1.5 text-xs lg:text-sm font-semibold backdrop-blur-md transition-all ${
                                    searchRegion === 'Dar es Salaam' && searchDistrict === 'Ubungo'
                                        ? 'bg-[#C2704E] text-white shadow-sm'
                                        : 'bg-white/15 text-white/90 hover:bg-white/25 border border-white/20'
                                }`}
                            >
                                {t('Ubungo (Sinza & Kimara)', 'Ubungo')}
                            </button>
                            <button
                                onClick={() => {
                                    setSearchRegion('Dar es Salaam');
                                    setSearchDistrict('Kigamboni');
                                    setSearchWard('all');
                                }}
                                className={`rounded-full px-3.5 py-1.5 text-xs lg:text-sm font-semibold backdrop-blur-md transition-all ${
                                    searchRegion === 'Dar es Salaam' && searchDistrict === 'Kigamboni'
                                        ? 'bg-[#C2704E] text-white shadow-sm'
                                        : 'bg-white/15 text-white/90 hover:bg-white/25 border border-white/20'
                                }`}
                            >
                                {t('Kigamboni Coastal', 'Kigamboni')}
                            </button>
                            <button
                                onClick={() => {
                                    setSearchRegion('Zanzibar (Mjini Magharibi)');
                                    setSearchDistrict('Mjini');
                                    setSearchWard('all');
                                }}
                                className={`rounded-full px-3.5 py-1.5 text-xs lg:text-sm font-semibold backdrop-blur-md transition-all ${
                                    searchRegion.includes('Zanzibar')
                                        ? 'bg-[#C2704E] text-white shadow-sm'
                                        : 'bg-white/15 text-white/90 hover:bg-white/25 border border-white/20'
                                }`}
                            >
                                {t('Zanzibar Stone Town', 'Zanzibar')}
                            </button>
                        </div>

                        {/* Official NaPA Reference Link */}
                        <a
                            href="https://napa.mawasiliano.go.tz/find-post-code"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[11px] text-[#E5D7B7] hover:text-white transition-colors underline decoration-white/30 underline-offset-4"
                        >
                            {/* <CheckCircle2 className="h-3 w-3 text-[#E5D7B7]" />
                            <span>{t('NaPA Verified Postcode & Addressing Standards (Mkoa • Wilaya • Kata)', 'Mfumo Rasmi wa Anwani za Posta NaPA (Mkoa • Wilaya • Kata)')}</span>
                            <ExternalLink className="h-3 w-3 opacity-70" /> */}
                        </a>
                    </div>
                </div>
            </section>

            {/* 3. CURATED SANCTUARIES & RESIDENCES (Floorspace Showcase Grid) */}
            <section id="collections" className="w-full max-w-full px-4 sm:px-10 lg:px-14 py-12 sm:py-24 scroll-mt-20">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-[#C2704E] mb-2">
                            <span>{t('Curated Portfolios', 'Mikusanyiko Maalum')}</span>
                        </div>
                        <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl font-normal text-[#12161A] tracking-tight">
                            {t('Exclusive Coastal & City Stays', 'Makazi ya Kipekee ya Pwani na Mjini')}
                        </h2>
                        <p className="mt-2 text-xs sm:text-sm text-[#706861] max-w-xl">
                            {t(
                                'Hand-inspected homes directly from certified property owners. Verified right to let, dedicated STS utility submeters, and zero intermediary fees.',
                                'Nyumba zilizokaguliwa moja kwa moja kutoka kwa wamiliki. Hati zimethibitishwa, mita za kujitegemea za STS, na hakuna ada za dalali.'
                            )}
                        </p>
                    </div>

                    {/* Category Filter Tabs - Horizontally scrollable on mobile */}
                    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-1 md:pb-0">
                        {[
                            { id: 'all', label: t('All Stays', 'Yote') },
                            { id: 'villa', label: t('Private Villas', 'Majumba') },
                            { id: 'apartment', label: t('Penthouses', 'Ghorofa') },
                            { id: 'verified', label: t('100% Verified Only', 'Zilizothibitishwa') },
                        ].map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`shrink-0 rounded-full px-3.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-wider transition-all ${selectedCategory === cat.id
                                    ? 'bg-[#12161A] text-white shadow-xs'
                                    : 'bg-[#F2ECE4] text-[#5C554E] hover:bg-[#E5DDD3]'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Active Filter Indicators & Results Count Bar */}
                <div className="mb-8 p-4 rounded-2xl bg-[#F6F2EC] border border-[#E9E4DC] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-[#12161A] flex items-center gap-1.5 mr-1">
                            <Filter className="h-3.5 w-3.5 text-[#C2704E]" />
                            <span>{t('Active Filters:', 'Vigezo:')}</span>
                        </span>

                        {searchRegion !== 'all' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 font-semibold text-[#12161A] border border-[#DDD7CE] shadow-2xs">
                                <span>{t('Mkoa:', 'Mkoa:')} {searchRegion}</span>
                                <button
                                    onClick={() => handleRegionChange('all')}
                                    className="hover:text-red-600 transition-colors"
                                    aria-label="Remove region filter"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}

                        {searchDistrict !== 'all' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#12161A] text-white px-3 py-1 font-semibold shadow-2xs">
                                <span>{t('Wilaya:', 'Wilaya:')} {searchDistrict}</span>
                                <button
                                    onClick={() => handleDistrictChange('all')}
                                    className="hover:text-[#F5D485] transition-colors"
                                    aria-label="Remove district filter"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}

                        {searchWard !== 'all' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 font-semibold text-[#12161A] border border-[#DDD7CE] shadow-2xs">
                                <span>{t('Kata:', 'Kata:')} {searchWard}</span>
                                <button
                                    onClick={() => setSearchWard('all')}
                                    className="hover:text-red-600 transition-colors"
                                    aria-label="Remove ward filter"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}

                        {searchType !== 'all' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 font-semibold text-[#12161A] border border-[#DDD7CE] shadow-2xs">
                                <span>{searchType}</span>
                                <button
                                    onClick={() => setSearchType('all')}
                                    className="hover:text-red-600 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}

                        {searchBedrooms !== 'all' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 font-semibold text-[#12161A] border border-[#DDD7CE] shadow-2xs">
                                <span>{searchBedrooms} {t('Beds', 'Vyumba')}</span>
                                <button
                                    onClick={() => setSearchBedrooms('all')}
                                    className="hover:text-red-600 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        )}

                        {(searchRegion !== 'all' || searchDistrict !== 'all' || searchWard !== 'all' || searchType !== 'all' || searchBedrooms !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearchRegion('all');
                                    setSearchDistrict('all');
                                    setSearchWard('all');
                                    setSearchType('all');
                                    setSearchBedrooms('all');
                                    setSelectedCategory('all');
                                }}
                                className="text-[11px] uppercase tracking-wider font-bold text-[#C2704E] hover:underline ml-1"
                            >
                                {t('Clear All', 'Ondoa Vyote')}
                            </button>
                        )}
                    </div>

                    <div className="text-xs font-semibold text-[#706861]">
                        <span>{filteredHomes.length} {t('residences matching', 'makazi yanayolingana')}</span>
                    </div>
                </div>

                {/* Property Card Grid */}
                {filteredHomes.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-[#DDD7CE] bg-[#F7F4EE] py-20 px-6 text-center max-w-2xl mx-auto">
                        <Building2 className="h-10 w-10 text-[#8C827A] mx-auto mb-3" />
                        <h3 className="font-serif text-2xl font-bold text-[#12161A]">
                            {t(
                                `No properties currently listed in ${searchDistrict !== 'all' ? searchDistrict : searchRegion}`,
                                `Hakuna nyumba zilizopo kwa sasa ${searchDistrict !== 'all' ? searchDistrict : searchRegion}`
                            )}
                        </h3>
                        <p className="text-xs text-[#706861] mt-2 max-w-md mx-auto leading-relaxed">
                            {t(
                                'Explore available listings in neighbouring districts across Dar es Salaam (Kinondoni, Ilala, Temeke, Ubungo, Kigamboni) or reset filters to see all sanctuaries.',
                                'Tazama nyumba zilizopo wilaya za jirani Dar es Salaam (Kinondoni, Ilala, Temeke, Ubungo, Kigamboni) au weka upya vigezo kutazama zote.'
                            )}
                        </p>
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                            <button
                                onClick={() => {
                                    setSearchRegion('Dar es Salaam');
                                    setSearchDistrict('all');
                                    setSearchWard('all');
                                }}
                                className="rounded-full bg-[#12161A] px-5 py-2.5 text-xs uppercase font-bold text-white hover:bg-[#2E3742] transition-all shadow-sm"
                            >
                                {t('Show All Dar es Salaam Listings', 'Tazama Zote Dar es Salaam')}
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedCategory('all');
                                    setSearchRegion('all');
                                    setSearchDistrict('all');
                                    setSearchWard('all');
                                    setSearchType('all');
                                    setSearchBedrooms('all');
                                }}
                                className="rounded-full border border-[#DDD7CE] bg-white px-5 py-2.5 text-xs uppercase font-bold text-[#12161A] hover:bg-[#F3EFEA] transition-all"
                            >
                                {t('Reset All Filters', 'Weka Upya Vyote')}
                            </button>
                        </div>
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
                                                <span>{[home.ward, home.district, home.region].filter(Boolean).join(', ') || 'Dar es Salaam'}</span>
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
            <section id="direct-standard" className="w-full bg-[#F3EFEA] border-y border-[#EBE7E1] py-14 sm:py-24">
                <div className="w-full max-w-full px-4 sm:px-10 lg:px-14">
                    <div className="max-w-3xl mb-10 sm:mb-16">
                        <span className="text-xs uppercase tracking-widest font-bold text-[#C2704E]">
                            {t('The Direct Booking Guarantee', 'Dhamana ya Upangaji Moja kwa Moja')}
                        </span>
                        <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl font-normal text-[#12161A] mt-2 leading-tight">
                            {t('Elevating Residential & Vacation Living Across East Africa', 'Kuinua Kiwango cha Makazi Tanzania')}
                        </h2>
                        <p className="mt-3 sm:mt-4 text-xs sm:text-base text-[#706861] leading-relaxed">
                            {t(
                                'Traditional platforms take high commission cuts and obscure host identities. Panga Pangisha connects verified residents directly with real property owners with institutional verification and smart submeters.',
                                'Mifumo mingine inatoza makato makubwa na kuficha utambulisho wa wenye nyumba. Panga Pangisha inakuunganisha moja kwa moja na wamiliki halisi kwa uwazi wa asilimia 100.'
                            )}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-8">
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
                                    className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-[#EBE7E1] shadow-2xs hover:shadow-md transition-all group"
                                >
                                    <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-[#FAF8F5] border border-[#DDD7CE] flex items-center justify-center text-[#12161A] group-hover:scale-105 group-hover:bg-[#12161A] group-hover:text-white transition-all mb-5 sm:mb-6">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="font-serif text-lg sm:text-xl font-bold text-[#12161A] mb-1.5 sm:mb-2">{card.title}</h3>
                                    <p className="text-xs text-[#706861] leading-relaxed">{card.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 5. BESPOKE AMENITIES & LIFESTYLE SHOWCASE (Floorspace Aesthetic) */}
            <section id="amenities" className="w-full max-w-full px-4 sm:px-10 lg:px-14 py-14 sm:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 items-center">
                    <div>
                        <span className="text-xs uppercase tracking-widest font-bold text-[#C2704E]">
                            {t('Uncompromising Comfort', 'Faraja Isiyo na Kikomo')}
                        </span>
                        <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl font-normal text-[#12161A] mt-2 leading-tight">
                            {t('Designed for Discerning Travelers & Long-Term Residents', 'Imesanifiwa kwa Wasafiri na Wapangaji Wakuu')}
                        </h2>
                        <p className="mt-3 sm:mt-4 text-xs sm:text-base text-[#706861] leading-relaxed">
                            {t(
                                'Whether staying for a weekend coastal retreat or signing a multi-year residential lease in Masaki, every property is curated to ensure total tranquility, high-speed connectivity, and effortless autonomy.',
                                'Iwe unakaa kwa mapumziko ya wikendi au unalipia kodi ya mwaka mzima, kila nyumba imeandaliwa kuhakikisha utulivu, intaneti ya kasi, na amani ya moyo.'
                            )}
                        </p>

                        <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-[#EBE7E1] aspect-4/3">
                            <img
                                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80"
                                alt="Luxury architecture"
                                className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                            <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 text-white">
                                <span className="text-[11px] sm:text-xs uppercase tracking-widest text-[#F5D485] font-bold">
                                    Oyster Bay & Masaki Sanctuary
                                </span>
                                <h4 className="font-serif text-lg sm:text-xl font-bold mt-1">
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
            <section id="host" className="w-full bg-[#181D22] text-white py-14 sm:py-24">
                <div className="w-full max-w-full px-4 sm:px-10 lg:px-14">
                    <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-[#1E252B] to-[#12161A] p-6 sm:p-14 lg:p-18 border border-white/10 shadow-2xl">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
                            <div>
                                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs uppercase tracking-widest font-bold text-[#F5D485] backdrop-blur-md">
                                    <Award className="h-3.5 w-3.5" />
                                    <span>{t('For Property Owners & Hosts', 'Kwa Wenye Nyumba na Wawekezaji')}</span>
                                </span>

                                <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl font-normal text-white mt-4 sm:mt-6 leading-tight">
                                    {t('Transform Your Property Into a High-Yield Direct Booking Sanctuary', 'Pangisha Nyumba Yako Moja kwa Moja kwa Faida Kubwa')}
                                </h2>

                                <p className="mt-3 sm:mt-4 text-xs sm:text-base text-white/80 leading-relaxed max-w-xl">
                                    {t(
                                        'Say goodbye to high platform commissions and utility disputes. Panga Pangisha provides autonomous STS submeter management, automated M-Pesa rent collections, digital leases, and verified tenants.',
                                        'Achana na makato ya juu na migogoro ya bili. Panga Pangisha inakupa mfumo wa kisasa wa mita za STS, makusanyo ya kodi ya M-Pesa, na mikataba halali ya kidijitali.'
                                    )}
                                </p>

                                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                                    <Link
                                        href="/signup?role=landlord"
                                        className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-xs uppercase tracking-wider font-bold text-[#12161A] shadow-md hover:bg-[#F3EFEA] transition-all active:scale-95"
                                    >
                                        <span>{t('List Your Property', 'Weka Nyumba Yako')}</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                    <Link
                                        href="/landlord/dashboard"
                                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3 text-xs uppercase tracking-wider font-semibold text-white hover:bg-white/10 transition-all"
                                    >
                                        <Key className="h-4 w-4 text-[#F5D485]" />
                                        <span>{t('Open Host Dashboard', 'Fungua Dashibodi')}</span>
                                    </Link>
                                </div>
                            </div>

                            {/* Host Advantages Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
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
                                        className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 backdrop-blur-md"
                                    >
                                        <h4 className="font-serif text-base sm:text-lg font-bold text-white mb-1">{item.title}</h4>
                                        <p className="text-xs text-white/70 leading-relaxed">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 7. ARCHITECTURAL FOOTER (Floorspace Luxury Standard) */}
            <footer className="w-full bg-[#12161A] text-white border-t border-white/10 pt-14 sm:pt-20 pb-8 sm:pb-12">
                <div className="w-full max-w-full px-4 sm:px-10 lg:px-14">
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

            {/* AI Support Assistant & Guest Inquiries Floating Widget */}
            <SupportAssistant />
        </div>
    );
}

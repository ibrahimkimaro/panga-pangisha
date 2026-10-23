import { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, Bath, BedDouble,
    Building2, CalendarCheck, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock,
    Droplets, ExternalLink, Heart, Info, Key, Lock, MapPin, MessageCircle,
    Navigation, Share2, ShieldCheck, Sparkles, Star, Users, Wifi, X, Zap,
    Car, DollarSign, Compass, Camera, Map
} from 'lucide-react';
import { Logo } from '@/components/ui';
import PropertyMap from '@/components/PropertyMap';
import SupportAssistant from '@/components/support/SupportAssistant';

interface Unit {
    id: number;
    unit_number: string;
    unit_type?: string;
    monthly_rent?: number;
    bedrooms?: number;
    bathrooms?: number;
    status?: string;
    image_url?: string | null;
}

interface Owner {
    id: number;
    name?: string;
    advertiser_role?: string;
    phone?: string;
}

interface HouseData {
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
    units?: Unit[];
    owner?: Owner;
}

type Lang = 'en' | 'sw';

export default function PropertyShowPage({
    home,
    similarHomes = [],
}: {
    home: HouseData;
    similarHomes?: HouseData[];
}) {
    const [lang, setLang] = useState<Lang>('en');
    const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'rooms' | 'amenities' | 'location' | 'policies'>('overview');
    const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
    const [heroMode, setHeroMode] = useState<'photos' | 'map' | 'highlights'>('photos');
    const [viewingDate, setViewingDate] = useState<string>('Tomorrow 10:00 AM');
    const [viewingScheduleSuccess, setViewingScheduleSuccess] = useState<boolean>(false);
    const [isWishlisted, setIsWishlisted] = useState<boolean>(false);

    useEffect(() => {
        try {
            if (localStorage.getItem('lang') === 'sw') setLang('sw');
        } catch {}

        const sections = ['overview', 'rooms', 'amenities', 'location', 'policies'];
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 180;
            for (const sectionId of sections) {
                const el = document.getElementById(`section-${sectionId}`);
                if (el) {
                    const top = el.offsetTop;
                    const height = el.offsetHeight;
                    if (scrollPosition >= top && scrollPosition < top + height) {
                        setActiveDetailTab(sectionId as any);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        setActiveDetailTab(id as any);
        const element = document.getElementById(`section-${id}`);
        if (element) {
            const yOffset = -90;
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    const t = (en: string, sw: string) => (lang === 'sw' ? sw : en);

    const rent = (val: number | string | null | undefined): string => {
        if (!val) return 'TZS --';
        const num = typeof val === 'string' ? parseFloat(val) : val;
        if (isNaN(num)) return 'TZS --';
        return `TZS ${Math.round(num).toLocaleString('en-US')}`;
    };

    const rentUSD = (val: number | string | null | undefined): string => {
        if (!val) return '$--';
        const num = typeof val === 'string' ? parseFloat(val) : val;
        if (isNaN(num)) return '$--';
        const usd = Math.round(num / 2650);
        return `$${usd.toLocaleString('en-US')}`;
    };

    const photo = (h: HouseData): string => {
        if (h.cover_image) {
            return h.cover_image.startsWith('http') ? h.cover_image : `/storage/${h.cover_image.replace(/^\/+/, '')}`;
        }
        return 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80';
    };

    const propertyPhotos: string[] = [
        photo(home),
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&auto=format&fit=crop&q=80',
    ];

    const currentHero = propertyPhotos[activePhotoIndex] || propertyPhotos[0];

    const locationName = [home.ward, home.district, 'Dar es Salaam, Tanzania'].filter(Boolean).join(', ');
    const shortLocation = [home.ward, home.district].filter(Boolean).join(', ') || 'Dar es Salaam';

    return (
        <div className="min-h-screen bg-[#FBF9F5] text-[#12161A] font-sans antialiased selection:bg-[#C2704E] selection:text-white">
            <Head title={`${home.property_name || 'Coastal Sanctuary'} | Cityscape Retreat`} />

            {/* 1. TOP ANNOUNCEMENT TICKER */}
            <div className="w-full bg-[#12161A] text-white px-4 py-2 text-[11px] font-medium tracking-wide flex items-center justify-between border-b border-black/10">
                <div className="mx-auto flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Verified Host Listing
                    </span>
                    <span className="text-white/40 hidden sm:inline">•</span>
                    <span className="hidden sm:inline text-white/80">0% Dalali / Broker Fees</span>
                    <span className="text-white/40 hidden sm:inline">•</span>
                    <span className="hidden sm:inline text-[#F5D485] font-semibold flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        STS Prepaid Smart Submeter Certified
                    </span>
                </div>
            </div>

            {/* 2. MAIN HEADER NAVIGATION */}
            <header className="sticky top-0 z-40 w-full bg-[#FBF9F5]/90 backdrop-blur-md border-b border-[#EBE7E1] transition-all">
                <div className="w-full max-w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-24 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center gap-2 group">
                            <Logo size="sm" />
                            <div className="flex flex-col">
                                <span className="font-serif text-lg font-bold tracking-tight text-[#12161A] leading-tight">
                                    Panga Pangisha
                                </span>
                                <span className="text-[9px] uppercase tracking-widest text-[#8C827A] font-bold">
                                    Cityscape Sanctuaries
                                </span>
                            </div>
                        </Link>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4">
                        <Link
                            href="/"
                            className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-[#706861] hover:text-[#12161A] transition-colors"
                        >
                            <span>Browse All Sanctuaries</span>
                        </Link>
                        <Link
                            href="/landlord/dashboard"
                            className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-[#C2704E] hover:text-[#A85838] transition-colors"
                        >
                            <span>Landlord Portal</span>
                        </Link>
                        <Link
                            href="/login"
                            className="rounded-full bg-[#12161A] px-4 py-2 text-xs font-bold text-white hover:bg-[#2C333A] transition-all shadow-xs"
                        >
                            <span>Sign In</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* 3. BREADCRUMBS & BACK LINK */}
            <div className="w-full max-w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-24 pt-6 pb-4">
                <div className="flex items-center justify-between">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-xs font-bold text-[#706861] hover:text-[#12161A] transition-colors group"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        <span>Back to All Sanctuaries</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                if (navigator.share) {
                                    navigator.share({
                                        title: home.property_name || 'Panga Pangisha Property',
                                        url: window.location.href,
                                    }).catch(() => {});
                                } else {
                                    navigator.clipboard.writeText(window.location.href);
                                    alert('Link copied to clipboard!');
                                }
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#706861] hover:text-[#12161A] bg-white border border-[#EBE7E1] px-3.5 py-1.5 rounded-full shadow-2xs hover:border-slate-400 transition-all cursor-pointer"
                        >
                            <Share2 className="h-3.5 w-3.5" />
                            <span>Share</span>
                        </button>

                        <button
                            onClick={() => setIsWishlisted(!isWishlisted)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#706861] hover:text-[#12161A] bg-white border border-[#EBE7E1] px-3.5 py-1.5 rounded-full shadow-2xs hover:border-slate-400 transition-all cursor-pointer"
                        >
                            <Heart className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-[#C2314B] text-[#C2314B]' : ''}`} />
                            <span>{isWishlisted ? 'Saved' : 'Save'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 4. CITYSCAPE RETREAT ARCHITECTURAL HERO & INTERACTIVE MAP VIEW */}
            <section className="w-full max-w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-24 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 h-[440px] sm:h-[500px] lg:h-[580px] xl:h-[620px] rounded-3xl overflow-hidden">
                    {/* Primary Hero Column: Photos, Map, or Highlights */}
                    <div className="relative md:col-span-3 h-full rounded-3xl overflow-hidden bg-[#12161A] shadow-md group">
                        {/* Top Control Bar: Photos / Map / Specs Switcher */}
                        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 rounded-full bg-black/65 p-1 backdrop-blur-md border border-white/15 text-white text-xs font-semibold shadow-lg">
                            <button
                                onClick={() => setHeroMode('photos')}
                                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                                    heroMode === 'photos'
                                        ? 'bg-white text-[#12161A] shadow-xs font-bold'
                                        : 'text-white/80 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <Camera className="h-3.5 w-3.5" />
                                <span>Photos ({propertyPhotos.length})</span>
                            </button>
                            <button
                                onClick={() => setHeroMode('map')}
                                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                                    heroMode === 'map'
                                        ? 'bg-[#C2704E] text-white shadow-xs font-bold'
                                        : 'text-white/80 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <Map className="h-3.5 w-3.5" />
                                <span>Interactive Map</span>
                            </button>
                            <button
                                onClick={() => setHeroMode('highlights')}
                                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                                    heroMode === 'highlights'
                                        ? 'bg-white text-[#12161A] shadow-xs font-bold'
                                        : 'text-white/80 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>Fast Specs</span>
                            </button>
                        </div>

                        {/* Top-Right Direct Landlord Badge */}
                        <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-2 rounded-full bg-black/65 px-3.5 py-1.5 backdrop-blur-md border border-white/15 text-white text-xs font-bold">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                            <span>100% Direct Landlord • 0% Dalali</span>
                        </div>

                        {/* VIEW 1: PHOTOS */}
                        {heroMode === 'photos' && (
                            <div className="relative h-full w-full">
                                <img
                                    key={currentHero}
                                    src={currentHero}
                                    alt={home.property_name || 'Sanctuary View'}
                                    onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src =
                                            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80';
                                    }}
                                    className="h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-101"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25 pointer-events-none" />

                                {/* Prev / Next Photo Arrow Buttons */}
                                <button
                                    onClick={() =>
                                        setActivePhotoIndex(
                                            (prev) => (prev - 1 + propertyPhotos.length) % propertyPhotos.length
                                        )
                                    }
                                    aria-label="Previous photo"
                                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() =>
                                        setActivePhotoIndex((prev) => (prev + 1) % propertyPhotos.length)
                                    }
                                    aria-label="Next photo"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>

                                {/* Bottom Overlay Badges */}
                                <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-center justify-between gap-3 text-white">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            onClick={() => setHeroMode('map')}
                                            className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3.5 py-1.5 text-xs font-bold backdrop-blur-md border border-white/20 hover:bg-[#C2704E] transition-all cursor-pointer"
                                        >
                                            <MapPin className="h-3.5 w-3.5 text-[#F5D485]" />
                                            <span>{shortLocation} • View Map</span>
                                        </button>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/80 px-3 py-1.5 text-xs font-bold text-emerald-300 backdrop-blur-md border border-emerald-500/30">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Confirmed Available
                                        </span>
                                        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-[#F5D485] backdrop-blur-md">
                                            <Zap className="h-3 w-3" />
                                            STS Smart Submeter
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-bold backdrop-blur-md border border-white/10">
                                            Photo {activePhotoIndex + 1} of {propertyPhotos.length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* VIEW 2: INTERACTIVE LEAFLET MAP */}
                        {heroMode === 'map' && (
                            <div className="relative h-full w-full">
                                <PropertyMap
                                    propertyName={home.property_name || 'Sanctuary'}
                                    locationName={locationName}
                                    district={home.district}
                                    ward={home.ward}
                                    rentDisplay={rent(home.rent_amount)}
                                    heightClassName="h-full w-full"
                                />
                                <div className="absolute bottom-4 left-4 z-[500]">
                                    <button
                                        onClick={() => setHeroMode('photos')}
                                        className="inline-flex items-center gap-2 rounded-full bg-[#12161A] text-white px-4 py-2 text-xs font-bold shadow-lg hover:bg-[#2A323D] transition-all cursor-pointer"
                                    >
                                        <Camera className="h-3.5 w-3.5" />
                                        <span>Back to Photos</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* VIEW 3: ARCHITECTURAL SPECS & HIGHLIGHTS */}
                        {heroMode === 'highlights' && (
                            <div className="relative h-full w-full bg-gradient-to-br from-[#12161A] via-[#1E252D] to-[#12161A] text-white p-6 sm:p-10 flex flex-col justify-between overflow-y-auto">
                                <div>
                                    <span className="text-[10px] uppercase tracking-widest text-[#F5D485] font-bold">
                                        Architectural Summary • {home.property_type || 'Boutique Residence'}
                                    </span>
                                    <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
                                        {home.property_name || 'Cityscape Sanctuary'}
                                    </h2>
                                    <p className="text-xs text-white/70 mt-1 flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-[#C2704E]" />
                                        <span>{locationName}</span>
                                    </p>

                                    {/* 4 Feature Cards */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
                                        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                                            <div className="flex items-center gap-2 text-white/60 text-xs">
                                                <BedDouble className="h-4 w-4 text-[#F5D485]" />
                                                <span>Bedrooms</span>
                                            </div>
                                            <p className="font-serif text-xl sm:text-2xl font-bold mt-1 text-white">
                                                {home.bedrooms || 1} Rooms
                                            </p>
                                        </div>
                                        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                                            <div className="flex items-center gap-2 text-white/60 text-xs">
                                                <Bath className="h-4 w-4 text-[#F5D485]" />
                                                <span>Bathrooms</span>
                                            </div>
                                            <p className="font-serif text-xl sm:text-2xl font-bold mt-1 text-white">
                                                {home.bathrooms || 1} Baths
                                            </p>
                                        </div>
                                        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                                            <div className="flex items-center gap-2 text-white/60 text-xs">
                                                <Zap className="h-4 w-4 text-emerald-400" />
                                                <span>Electricity</span>
                                            </div>
                                            <p className="font-serif text-base sm:text-lg font-bold mt-1 text-white">
                                                Private STS Submeter
                                            </p>
                                        </div>
                                        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                                            <div className="flex items-center gap-2 text-white/60 text-xs">
                                                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                                                <span>Broker Fee</span>
                                            </div>
                                            <p className="font-serif text-xl sm:text-2xl font-bold mt-1 text-white">
                                                0% Dalali
                                            </p>
                                        </div>
                                    </div>

                                    {/* Bullet Highlights */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-5 text-xs text-white/80">
                                        <div className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                                            <span>Individual TANESCO STS submeter keypad inside unit</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                                            <span>24/7 DAWASA clean water connection + backup tank</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                                            <span>CCTV surveillance perimeter & night security guard</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                                            <span>Direct verified landlord contract with legal invoice</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-white/10">
                                    <button
                                        onClick={() => setHeroMode('photos')}
                                        className="inline-flex items-center gap-2 rounded-full bg-white text-[#12161A] px-5 py-2.5 text-xs font-bold shadow-md hover:bg-stone-200 transition-all cursor-pointer"
                                    >
                                        <Camera className="h-4 w-4" />
                                        <span>Browse All Photos</span>
                                    </button>
                                    <button
                                        onClick={() => setHeroMode('map')}
                                        className="inline-flex items-center gap-2 rounded-full bg-[#C2704E] text-white px-5 py-2.5 text-xs font-bold shadow-md hover:bg-[#A85838] transition-all cursor-pointer"
                                    >
                                        <Map className="h-4 w-4" />
                                        <span>Open Full Map</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stacked Companion Interior & Exterior Thumbnails */}
                    <div className="hidden md:grid grid-rows-4 gap-3 h-full overflow-hidden">
                        {propertyPhotos.slice(1, 5).map((imgUrl, thumbIdx) => {
                            const realIdx = thumbIdx + 1;
                            const isSelected = heroMode === 'photos' && activePhotoIndex === realIdx;
                            return (
                                <div
                                    key={realIdx}
                                    onClick={() => {
                                        setHeroMode('photos');
                                        setActivePhotoIndex(realIdx);
                                    }}
                                    className={`relative h-full min-h-0 overflow-hidden rounded-2xl bg-[#EBE7E1] cursor-pointer transition-all ${
                                        isSelected
                                            ? 'ring-3 ring-[#12161A] opacity-100 shadow-md scale-99'
                                            : 'opacity-85 hover:opacity-100 hover:scale-101'
                                    }`}
                                >
                                    <img
                                        src={imgUrl}
                                        alt={`Detail Photo ${realIdx}`}
                                        onError={(e) => {
                                            (e.currentTarget as HTMLImageElement).src =
                                                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80';
                                        }}
                                        className="h-full w-full object-cover object-center"
                                    />
                                    <span className="absolute bottom-1.5 left-2 rounded-md bg-black/65 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                                        View {realIdx === 1 ? 'Living Lounge' : realIdx === 2 ? 'Master Suite' : realIdx === 3 ? 'Bath & Spa' : 'Balcony View'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Mobile Thumbnail Selector Strip */}
                <div className="flex md:hidden gap-2 overflow-x-auto pt-3 pb-1 no-scrollbar">
                    {propertyPhotos.map((imgUrl, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setHeroMode('photos');
                                setActivePhotoIndex(idx);
                            }}
                            className={`relative h-16 w-24 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                                heroMode === 'photos' && activePhotoIndex === idx
                                    ? 'border-[#12161A] scale-102 shadow-sm'
                                    : 'border-transparent opacity-70'
                            }`}
                        >
                            <img
                                src={imgUrl}
                                alt={`Thumbnail ${idx}`}
                                onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src =
                                        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80';
                                }}
                                className="h-full w-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            </section>

            {/* 5. MAIN EDITORIAL CONTENT & STICKY BOOKING CONSOLE */}
            <main className="w-full max-w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-24 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-start">
                    {/* LEFT COLUMN: TITLE, SPECS, CITYSCAPE TABS & CONTENT */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-8">
                        {/* Title & Headline Bar */}
                        <div className="space-y-3 pb-6 border-b border-[#EBE7E1]">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs uppercase tracking-wider font-bold text-[#C2704E] bg-[#FDF4EF] px-3 py-1 rounded-full">
                                    {home.property_type || 'Boutique Residence'}
                                </span>
                                {home.verified_at && (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] bg-[#D9F7F1] px-3 py-1 rounded-full">
                                        <BadgeCheck className="h-3.5 w-3.5" />
                                        Verified Landlord Title Deed
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full">
                                    <Zap className="h-3.5 w-3.5" />
                                    STS Submeter Autonomy
                                </span>
                            </div>

                            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#12161A] tracking-tight leading-tight">
                                {home.property_name || 'Coastal Sanctuary'}
                            </h1>

                            <div className="flex flex-wrap items-center gap-4 text-xs text-[#706861]">
                                <span className="flex items-center gap-1.5 font-medium">
                                    <MapPin className="h-3.5 w-3.5 text-[#C2704E]" />
                                    {locationName}
                                </span>
                                <span>•</span>
                                <span>Direct Owner Listing</span>
                                <span>•</span>
                            </div>
                        </div>

                        {/* Cityscape Navigation Anchor Tabs Bar */}
                        <div className="sticky top-18 z-30 bg-[#FBF9F5]/95 backdrop-blur-md py-2 border-b border-[#EBE7E1]">
                            <div className="flex space-x-2 overflow-x-auto no-scrollbar">
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
                                            onClick={() => scrollToSection(tab.id)}
                                            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                                                isActive
                                                    ? 'bg-[#12161A] text-white shadow-sm'
                                                    : 'text-[#706861] hover:bg-[#EBE7E1] hover:text-[#12161A]'
                                            }`}
                                        >
                                            <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-[#8C827A]'}`} />
                                            <span>{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* SECTION 1: OVERVIEW & SPECIFICATIONS */}
                        <section id="section-overview" className="space-y-8 scroll-mt-28">
                            {/* Architectural Specs Ribbon */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
                                <div className="p-4 rounded-2xl bg-white border border-[#EBE7E1] shadow-2xs">
                                    <BedDouble className="h-6 w-6 text-[#12161A] mx-auto mb-1.5" />
                                    <span className="block text-sm font-bold text-[#12161A]">
                                        {home.bedrooms || '1'} Bedrooms
                                    </span>
                                    <span className="text-[11px] text-[#8C827A]">Master en-suite</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-white border border-[#EBE7E1] shadow-2xs">
                                    <Bath className="h-6 w-6 text-[#12161A] mx-auto mb-1.5" />
                                    <span className="block text-sm font-bold text-[#12161A]">
                                        {home.bathrooms || '1'} Bathrooms
                                    </span>
                                    <span className="text-[11px] text-[#8C827A]">Modern fittings</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-white border border-[#EBE7E1] shadow-2xs">
                                    <Zap className="h-6 w-6 text-[#0F766E] mx-auto mb-1.5" />
                                    <span className="block text-sm font-bold text-[#12161A]">
                                        STS Submeter
                                    </span>
                                    <span className="text-[11px] text-[#0F766E] font-semibold">Prepaid Autonomy</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-white border border-[#EBE7E1] shadow-2xs">
                                    <Wifi className="h-6 w-6 text-[#C2704E] mx-auto mb-1.5" />
                                    <span className="block text-sm font-bold text-[#12161A]">
                                        Fiber Ready
                                    </span>
                                    <span className="text-[11px] text-[#8C827A]">100Mbps Speed</span>
                                </div>
                            </div>

                            {/* Narrative Story */}
                            <div className="space-y-3">
                                <h2 className="font-serif text-2xl font-bold text-[#12161A]">
                                    About The Sanctuary
                                </h2>
                                <p className="text-sm leading-relaxed text-[#706861]">
                                    Thoughtfully crafted for peaceful living, natural ocean breeze, and abundant daylight. 
                                    Features high ceilings, custom hardwood accents, serene private balcony, and state-of-the-art STS utility infrastructure ensuring complete autonomy and peace of mind.
                                </p>
                                <p className="text-sm leading-relaxed text-[#706861]">
                                    Designed for residents and long-stay guests who value quiet privacy, reliable infrastructure, and direct transparent terms with the verified property owner.
                                </p>
                            </div>

                            {/* Key Residence Standards */}
                            <div className="rounded-3xl border border-[#EBE7E1] bg-white p-6 space-y-4 shadow-2xs">
                                <h3 className="text-xs font-bold text-[#12161A] uppercase tracking-wider">
                                    Property Standards & Architecture
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-[#706861]">
                                    <div className="flex items-center gap-2.5">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                        <span>145 m² Total Living Area</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                        <span>High 3.2m Airy Ceilings</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                        <span>Cross-Ventilation Architecture</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                        <span>Direct-from-Landlord Guarantee (0% Dalali)</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* SECTION 2: SUITES & ROOMS */}
                        <section id="section-rooms" className="space-y-6 pt-10 border-t border-[#EBE7E1] scroll-mt-28">
                            <div>
                                <h2 className="font-serif text-2xl font-bold text-[#12161A]">
                                    Accommodations & Available Suites
                                </h2>
                                <p className="text-xs text-[#706861] mt-1">
                                    Each room features its own dedicated STS prepaid electricity meter, private bathroom, and high-speed fiber internet.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="rounded-3xl border border-[#EBE7E1] p-5 sm:p-6 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-2xs hover:border-[#12161A] transition-all">
                                    <div className="flex items-center gap-4">
                                        <img
                                            src="https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=500&auto=format&fit=crop&q=80"
                                            alt="Master Ocean Penthouse Suite"
                                            className="h-24 w-28 rounded-2xl object-cover shrink-0 shadow-xs"
                                        />
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm sm:text-base font-bold text-[#12161A]">
                                                    Master Ocean Penthouse Suite
                                                </h3>
                                                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                                    Available
                                                </span>
                                            </div>
                                            <p className="text-xs text-[#706861]">
                                                King Bed • En-suite Italian Bath • Private Balcony • Dedicated STS Keypad
                                            </p>
                                            <div className="flex items-baseline gap-2 pt-1">
                                                <span className="text-base font-extrabold text-[#12161A]">
                                                    TZS 850,000 / month
                                                </span>
                                                <span className="text-xs text-[#8C827A]">~$320 USD</span>
                                            </div>
                                        </div>
                                    </div>
                                    <a
                                        href={`https://wa.me/255712345678?text=Hello%2C%20I%20am%20interested%20in%20the%20Master%20Ocean%20Penthouse%20Suite%20at%20${encodeURIComponent(home.property_name || 'this property')}.`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-xs font-bold text-white shadow-2xs hover:bg-[#20BE5C] transition-all cursor-pointer"
                                    >
                                        <MessageCircle className="h-4 w-4" />
                                        <span>Inquire Suite</span>
                                    </a>
                                </div>

                                <div className="rounded-3xl border border-[#EBE7E1] p-5 sm:p-6 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-2xs hover:border-[#12161A] transition-all">
                                    <div className="flex items-center gap-4">
                                        <img
                                            src="https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=500&auto=format&fit=crop&q=80"
                                            alt="Deluxe Executive Suite"
                                            className="h-24 w-28 rounded-2xl object-cover shrink-0 shadow-xs"
                                        />
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm sm:text-base font-bold text-[#12161A]">
                                                    Deluxe Executive Suite
                                                </h3>
                                                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                                    Available
                                                </span>
                                            </div>
                                            <p className="text-xs text-[#706861]">
                                                Queen Bed • Modern Shower • Dedicated Study Desk • STS Submeter
                                            </p>
                                            <div className="flex items-baseline gap-2 pt-1">
                                                <span className="text-base font-extrabold text-[#12161A]">
                                                    TZS 650,000 / month
                                                </span>
                                                <span className="text-xs text-[#8C827A]">~$245 USD</span>
                                            </div>
                                        </div>
                                    </div>
                                    <a
                                        href={`https://wa.me/255712345678?text=Hello%2C%20I%20am%20interested%20in%20the%20Deluxe%20Executive%20Suite%20at%20${encodeURIComponent(home.property_name || 'this property')}.`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-xs font-bold text-white shadow-2xs hover:bg-[#20BE5C] transition-all cursor-pointer"
                                    >
                                        <MessageCircle className="h-4 w-4" />
                                        <span>Inquire Suite</span>
                                    </a>
                                </div>

                                <div className="rounded-3xl border border-[#EBE7E1] p-5 sm:p-6 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-2xs hover:border-[#12161A] transition-all">
                                    <div className="flex items-center gap-4">
                                        <img
                                            src="https://images.unsplash.com/photo-1554995207-c18c203602cb?w=500&auto=format&fit=crop&q=80"
                                            alt="Garden Studio Suite"
                                            className="h-24 w-28 rounded-2xl object-cover shrink-0 shadow-xs"
                                        />
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm sm:text-base font-bold text-[#12161A]">
                                                    Garden Studio Suite
                                                </h3>
                                                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
                                                    Quiet Zone
                                                </span>
                                            </div>
                                            <p className="text-xs text-[#706861]">
                                                Double Bed • Private Bath • Garden Access • STS Submeter
                                            </p>
                                            <div className="flex items-baseline gap-2 pt-1">
                                                <span className="text-base font-extrabold text-[#12161A]">
                                                    TZS 500,000 / month
                                                </span>
                                                <span className="text-xs text-[#8C827A]">~$190 USD</span>
                                            </div>
                                        </div>
                                    </div>
                                    <a
                                        href={`https://wa.me/255712345678?text=Hello%2C%20I%20am%20interested%20in%20the%20Garden%20Studio%20Suite%20at%20${encodeURIComponent(home.property_name || 'this property')}.`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-xs font-bold text-white shadow-2xs hover:bg-[#20BE5C] transition-all cursor-pointer"
                                    >
                                        <MessageCircle className="h-4 w-4" />
                                        <span>Inquire Suite</span>
                                    </a>
                                </div>
                            </div>
                        </section>

                        {/* SECTION 3: AMENITIES & UTILITIES */}
                        <section id="section-amenities" className="space-y-6 pt-10 border-t border-[#EBE7E1] scroll-mt-28">
                            <div>
                                <h2 className="font-serif text-2xl font-bold text-[#12161A]">
                                    Curated Amenities & Utility Standards
                                </h2>
                                <p className="text-xs text-[#706861] mt-1">
                                    Engineered for zero billing disputes and uninterrupted residential comfort.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div className="rounded-3xl border border-[#EBE7E1] bg-white p-5 space-y-2 shadow-2xs">
                                    <div className="flex items-center gap-2.5 text-emerald-700 font-bold text-sm">
                                        <Zap className="h-5 w-5" />
                                        <span>STS LUKU Prepaid Keypad</span>
                                    </div>
                                    <p className="text-xs text-[#706861]">
                                        Independent certified electricity submeter in every unit. Recharged directly via M-Pesa or Airtel Money.
                                    </p>
                                </div>

                                <div className="rounded-3xl border border-[#EBE7E1] bg-white p-5 space-y-2 shadow-2xs">
                                    <div className="flex items-center gap-2.5 text-blue-700 font-bold text-sm">
                                        <Droplets className="h-5 w-5" />
                                        <span>Dedicated Water Reserve</span>
                                    </div>
                                    <p className="text-xs text-[#706861]">
                                        5,000L high-capacity storage tank with independent submetering telemetry.
                                    </p>
                                </div>

                                <div className="rounded-3xl border border-[#EBE7E1] bg-white p-5 space-y-2 shadow-2xs">
                                    <div className="flex items-center gap-2.5 text-[#C2704E] font-bold text-sm">
                                        <Wifi className="h-5 w-5" />
                                        <span>100Mbps Fiber Wi-Fi Ready</span>
                                    </div>
                                    <p className="text-xs text-[#706861]">
                                        Dedicated high-speed fiber connection suited for remote work, streaming, and video calls.
                                    </p>
                                </div>

                                <div className="rounded-3xl border border-[#EBE7E1] bg-white p-5 space-y-2 shadow-2xs">
                                    <div className="flex items-center gap-2.5 text-slate-800 font-bold text-sm">
                                        <Lock className="h-5 w-5" />
                                        <span>24/7 Gated Security & CCTV</span>
                                    </div>
                                    <p className="text-xs text-[#706861]">
                                        Perimeter electric fence, professional security personnel, and continuous 24/7 recording.
                                    </p>
                                </div>

                                <div className="rounded-3xl border border-[#EBE7E1] bg-white p-5 space-y-2 shadow-2xs">
                                    <div className="flex items-center gap-2.5 text-slate-800 font-bold text-sm">
                                        <Car className="h-5 w-5" />
                                        <span>Allocated Covered Parking</span>
                                    </div>
                                    <p className="text-xs text-[#706861]">
                                        Secure gated off-street parking bay for each resident and guest parking space.
                                    </p>
                                </div>

                                <div className="rounded-3xl border border-[#EBE7E1] bg-white p-5 space-y-2 shadow-2xs">
                                    <div className="flex items-center gap-2.5 text-emerald-800 font-bold text-sm">
                                        <ShieldCheck className="h-5 w-5" />
                                        <span>Zero Middleman Markup</span>
                                    </div>
                                    <p className="text-xs text-[#706861]">
                                        Direct lease from verified title-deed host without inflated dalali/broker commissions.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* SECTION 4: EXPLORE LOCATION & INTERACTIVE LEAFLET MAP */}
                        <section id="section-location" className="space-y-6 pt-10 border-t border-[#EBE7E1] scroll-mt-28">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h2 className="font-serif text-2xl font-bold text-[#12161A]">
                                        Explore Location & Neighborhood Guide
                                    </h2>
                                    <p className="text-xs text-[#706861] mt-1">
                                        Situated in {locationName} — prestigious security enclave, paved roads, and direct access to essential services.
                                    </p>
                                </div>

                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationName)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-full bg-[#12161A] px-4 py-2 text-xs font-bold text-white hover:bg-[#2C333A] transition-all shadow-xs shrink-0"
                                >
                                    <span>Open in Google Maps</span>
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                            </div>

                            {/* Full-Width Interactive Leaflet Property Map (Real Engine Installed) */}
                            <PropertyMap
                                propertyName={home.property_name || 'Sanctuary Residence'}
                                locationName={locationName}
                                district={home.district}
                                ward={home.ward}
                                rentDisplay={rent(home.monthly_rent)}
                                heightClassName="h-96 sm:h-[480px]"
                            />

                            {/* Neighborhood Distance & Transit Matrix */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-[#12161A] uppercase tracking-wider">
                                    Proximity to Key Landmarks & Services
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                                    <div className="p-4 rounded-2xl bg-white border border-[#EBE7E1] shadow-2xs">
                                        <span className="text-[10px] uppercase font-bold text-[#8C827A] block">Beach & Slipway</span>
                                        <p className="font-bold text-[#12161A] text-sm mt-0.5">~4 mins drive</p>
                                        <span className="text-[11px] text-[#8C827A]">1.2 km away</span>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white border border-[#EBE7E1] shadow-2xs">
                                        <span className="text-[10px] uppercase font-bold text-[#8C827A] block">Shoppers Plaza</span>
                                        <p className="font-bold text-[#12161A] text-sm mt-0.5">~3 mins drive</p>
                                        <span className="text-[11px] text-[#8C827A]">800 m away</span>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white border border-[#EBE7E1] shadow-2xs">
                                        <span className="text-[10px] uppercase font-bold text-[#8C827A] block">International Hospital</span>
                                        <p className="font-bold text-[#12161A] text-sm mt-0.5">~6 mins drive</p>
                                        <span className="text-[11px] text-[#8C827A]">2.1 km away</span>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white border border-[#EBE7E1] shadow-2xs">
                                        <span className="text-[10px] uppercase font-bold text-[#8C827A] block">Fine Dining & Cafes</span>
                                        <p className="font-bold text-[#12161A] text-sm mt-0.5">~5 mins walk</p>
                                        <span className="text-[11px] text-[#8C827A]">1.5 km away</span>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white border border-[#EBE7E1] shadow-2xs">
                                        <span className="text-[10px] uppercase font-bold text-[#8C827A] block">City Centre (CBD)</span>
                                        <p className="font-bold text-[#12161A] text-sm mt-0.5">~12 mins drive</p>
                                        <span className="text-[11px] text-[#8C827A]">6.5 km away</span>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white border border-[#EBE7E1] shadow-2xs">
                                        <span className="text-[10px] uppercase font-bold text-[#8C827A] block">JNIA Airport</span>
                                        <p className="font-bold text-[#12161A] text-sm mt-0.5">~28 mins drive</p>
                                        <span className="text-[11px] text-[#8C827A]">18 km away</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* SECTION 5: POLICIES & GUIDELINES */}
                        <section id="section-policies" className="space-y-6 pt-10 border-t border-[#EBE7E1] scroll-mt-28">
                            <div>
                                <h2 className="font-serif text-2xl font-bold text-[#12161A]">
                                    Tenancy Terms & House Guidelines
                                </h2>
                                <p className="text-xs text-[#706861] mt-1">
                                    Transparent guidelines governed by official digital tenancy agreements.
                                </p>
                            </div>

                            <div className="space-y-4 text-xs">
                                <div className="rounded-3xl border border-[#EBE7E1] bg-white p-5 space-y-1.5 shadow-2xs">
                                    <h3 className="font-bold text-[#12161A] text-sm">Move-in & Onboarding</h3>
                                    <p className="text-[#706861] leading-relaxed">
                                        Digital agreement signed directly between resident and verified landlord. Keys and meter keypad tokens provided immediately upon formal signing.
                                    </p>
                                </div>

                                <div className="rounded-3xl border border-[#EBE7E1] bg-white p-5 space-y-1.5 shadow-2xs">
                                    <h3 className="font-bold text-[#12161A] text-sm">Security Deposit Policy</h3>
                                    <p className="text-[#706861] leading-relaxed">
                                        1 month security deposit held securely. 100% refundable at the end of the tenancy term subject to customary inspection.
                                    </p>
                                </div>

                                <div className="rounded-3xl border border-[#EBE7E1] bg-white p-5 space-y-1.5 shadow-2xs">
                                    <h3 className="font-bold text-[#12161A] text-sm">STS Utility Guarantee</h3>
                                    <p className="text-[#706861] leading-relaxed">
                                        Zero utility disputes. Residents recharge their own independent electricity and water tokens directly via M-Pesa, Airtel, or Tigo Pesa.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* RIGHT COLUMN: STICKY CITYSCAPE DIRECT BOOKING & VIEWING CONSOLE */}
                    <div className="lg:col-span-5 xl:col-span-4 sticky top-24 space-y-5">
                        <div className="rounded-3xl border border-[#EBE7E1] bg-white p-6 sm:p-7 shadow-lg space-y-5">
                            {/* Monthly Rate Headline */}
                            <div>
                                <span className="text-[10px] uppercase font-bold text-[#8C827A] tracking-wider block">
                                    Direct Monthly Rate
                                </span>
                                <div className="font-serif text-3xl font-bold text-[#12161A] mt-1">
                                    {rent(home.monthly_rent)}
                                </div>
                                <span className="text-xs text-[#8C827A]">
                                    {rentUSD(home.monthly_rent)} / month
                                </span>
                            </div>

                            {/* Terms Breakdown */}
                            <div className="space-y-2.5 py-4 border-y border-[#EBE7E1] text-xs">
                                <div className="flex items-center justify-between text-[#706861]">
                                    <span>Security Deposit</span>
                                    <span className="font-semibold text-[#12161A]">1 Month (100% Refundable)</span>
                                </div>
                                <div className="flex items-center justify-between text-[#706861]">
                                    <span>Brokerage / Dalali Fee</span>
                                    <span className="font-bold text-emerald-600">TZS 0 (Direct Host)</span>
                                </div>
                                <div className="flex items-center justify-between text-[#706861]">
                                    <span>Electricity & Water</span>
                                    <span className="font-semibold text-[#12161A]">STS Prepaid Keypad</span>
                                </div>
                            </div>

                            {/* In-Person Viewing Slot Picker */}
                            <div className="space-y-2">
                                <span className="text-[11px] uppercase font-bold text-[#8C827A] tracking-wider block">
                                    Select In-Person Viewing Slot
                                </span>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    {['Tomorrow 10:00 AM', 'Tomorrow 03:00 PM', 'Saturday 11:00 AM', 'Sunday 04:00 PM'].map((slot) => (
                                        <button
                                            key={slot}
                                            type="button"
                                            onClick={() => setViewingDate(slot)}
                                            className={`px-3 py-2 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                                                viewingDate === slot
                                                    ? 'border-[#12161A] bg-[#12161A] text-white shadow-2xs'
                                                    : 'border-[#EBE7E1] bg-[#FAF8F5] text-[#706861] hover:bg-[#EBE7E1]'
                                            }`}
                                        >
                                            {slot}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3 pt-1">
                                <a
                                    href={`https://wa.me/255712345678?text=Hello%2C%20I%20am%20interested%20in%20${encodeURIComponent(
                                        home.property_name || 'this sanctuary'
                                    )}%20(${encodeURIComponent(locationName)})%20listed%20on%20Panga%20Pangisha%20and%20would%20like%20to%20schedule%20a%20viewing%20for%20${encodeURIComponent(viewingDate)}.`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3.5 text-xs font-bold text-white shadow-sm hover:bg-[#20BE5C] transition-all cursor-pointer"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                    <span>Inquire on WhatsApp</span>
                                </a>

                                <button
                                    onClick={() => {
                                        setViewingScheduleSuccess(true);
                                        setTimeout(() => setViewingScheduleSuccess(false), 6000);
                                    }}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-[#12161A] px-5 py-3 text-xs font-bold text-[#12161A] hover:bg-[#FAF8F5] transition-all cursor-pointer"
                                >
                                    <CalendarCheck className="h-4 w-4" />
                                    <span>Confirm Viewing ({viewingDate})</span>
                                </button>

                                {viewingScheduleSuccess && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium text-center"
                                    >
                                        ✓ Viewing request for <strong>{viewingDate}</strong> sent to host! The host will confirm via WhatsApp or SMS.
                                    </motion.div>
                                )}

                                <Link
                                    href="/signup"
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#12161A] px-5 py-3.5 text-xs uppercase font-bold text-white hover:bg-[#2C333A] transition-all cursor-pointer shadow-sm"
                                >
                                    <span>Book / Apply for Tenancy</span>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        </div>

                        {/* Direct Host Verified Card */}
                        <div className="rounded-3xl border border-[#EBE7E1] bg-white p-5 flex items-center gap-3.5 shadow-2xs">
                            <div className="h-12 w-12 rounded-full bg-[#12161A] text-white flex items-center justify-center font-bold text-base shrink-0">
                                {home.property_name?.charAt(0) || 'H'}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-[#12161A] truncate">
                                    {home.advertiser_role === 'representative'
                                        ? 'Authorized Representative'
                                        : 'Direct Verified Owner'}
                                </p>
                                <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                                    <Check className="h-3 w-3" />
                                    Title Deed Confirmed • Replies in &lt;15 mins
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 6. SIMILAR SANCTUARIES YOU MAY LIKE */}
                {similarHomes.length > 0 && (
                    <div className="mt-20 pt-12 border-t border-[#EBE7E1]">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <span className="text-xs uppercase tracking-wider font-bold text-[#C2704E]">
                                    Curated Recommendations
                                </span>
                                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#12161A] mt-1">
                                    Similar Sanctuaries Nearby
                                </h2>
                            </div>
                            <Link
                                href="/"
                                className="inline-flex items-center gap-1 text-xs font-bold text-[#12161A] hover:text-[#C2704E] transition-colors"
                            >
                                <span>View all listings</span>
                                <ArrowUpRight className="h-4 w-4" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {similarHomes.map((sHome) => (
                                <Link
                                    key={sHome.id}
                                    href={`/property/${sHome.id}`}
                                    className="group rounded-3xl bg-white border border-[#EBE7E1] overflow-hidden shadow-2xs hover:shadow-lg transition-all"
                                >
                                    <div className="relative aspect-16/10 overflow-hidden bg-[#EBE7E1]">
                                        <img
                                            src={photo(sHome)}
                                            alt={sHome.property_name || 'Sanctuary'}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute bottom-3 left-3">
                                            <span className="rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                                                {[sHome.ward, sHome.district].filter(Boolean).join(', ') || 'Dar es Salaam'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-5 space-y-2">
                                        <h3 className="font-serif text-lg font-bold text-[#12161A] group-hover:text-[#C2704E] transition-colors line-clamp-1">
                                            {sHome.property_name || 'Bespoke Sanctuary'}
                                        </h3>
                                        <div className="flex items-center justify-between pt-2 border-t border-[#EBE7E1]">
                                            <span className="text-sm font-bold text-[#12161A]">
                                                {rent(sHome.monthly_rent)}
                                            </span>
                                            <span className="text-xs font-bold text-[#C2704E] inline-flex items-center gap-1">
                                                View Suite <ArrowRight className="h-3 w-3" />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* 7. FULL-PAGE FOOTER */}
            <footer className="w-full bg-[#12161A] text-white py-14 border-t border-black/10">
                <div className="w-full max-w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-24">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <Logo size="sm" />
                            <span className="font-serif text-xl font-bold tracking-tight">
                                Panga Pangisha
                            </span>
                        </div>
                        <p className="text-xs text-white/50 text-center md:text-right">
                            The Direct-to-Landlord Residential Living Standard across Tanzania.
                        </p>
                    </div>
                    <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
                        <span>© {new Date().getFullYear()} Panga Pangisha Ltd. All rights reserved.</span>
                        <div className="flex gap-6">
                            <Link href="/" className="hover:text-white transition-colors">Sanctuaries</Link>
                            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
                            <Link href="/landlord/dashboard" className="hover:text-white transition-colors">Landlord Portal</Link>
                        </div>
                    </div>
                </div>
            </footer>

            {/* AI Support Assistant & Guest Inquiries Floating Widget */}
            <SupportAssistant
                currentHouseId={home.id}
                currentHouseName={home.property_name || 'Sanctuary'}
                currentHouseLocation={[home.ward, home.district].filter(Boolean).join(', ')}
            />
        </div>
    );
}

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    BadgeCheck, Bath, BedDouble, Bell, Bookmark, Building2, Calendar,
    CheckCircle2, ChevronLeft, ChevronRight, Compass, Eye, FileSignature,
    Filter, Flame, Globe, Hammer, Heart, Home, Hotel, Key, Layers,
    LogOut, Map as MapIcon, MapPin, Megaphone, Menu, MessageCircle,
    MessageSquare, Moon, PhoneCall, Receipt, Search, Share2, ShieldCheck,
    SlidersHorizontal, Sparkles, Star, Sun, User, Wrench, X, Zap
} from 'lucide-react';
import RealtimeChatView from '@/components/chat/RealtimeChatView';
import { PhoenixSocketClient, resolveBrowserWsUrl } from '@/lib/phoenixSocket';
import TenantDiscoveryMap, { type MapPropertyItem } from '@/components/tenant/TenantDiscoveryMap';
import VeyoraAiDrawer from '@/components/tenant/VeyoraAiDrawer';
import TenantAccountTab from '@/components/tenant/TenantAccountTab';
import TenantAgreementsAndBillingTab from '@/components/tenant/TenantAgreementsAndBillingTab';
import {
    CommentsDrawerModal,
    LikeTargetChooserModal,
    MkatabaAndDocsModal,
    PropertyDetailModal,
    type FeedCommentItem,
} from '@/components/tenant/TenantFeedModals';

type TenantMainTab = 'explore' | 'map' | 'saved' | 'agreements' | 'messages' | 'account';

type FeedCategoryKey =
    | 'all'
    | 'houses'
    | 'apartments'
    | 'hotels'
    | 'works'
    | 'announcements'
    | 'rooms';

interface ExtendedFeedPost extends MapPropertyItem {
    feedCategory: FeedCategoryKey;
    badgeLabelEn: string;
    badgeLabelSw: string;
    priceUnitEn: string;
    priceUnitSw: string;
    roomLikesCount: number;
    houseLikesCount: number;
}

// Curated community, hotel, fundi & studio posts matching Flutter explore.dart _curatedExtraFeedPosts
const CURATED_EXTRA_POSTS: ExtendedFeedPost[] = [
    {
        id: 9001,
        property_name: 'Serena Oceanfront Suites & Executive Lodge',
        property_type: 'Hotel & Suite',
        feedCategory: 'hotels',
        badgeLabelEn: 'Hotel & Short-Stay',
        badgeLabelSw: 'Hoteli & Vyumba',
        priceUnitEn: 'night',
        priceUnitSw: 'usiku',
        description:
            'Furnished ocean-breeze executive suite in Masaki with daily housekeeping, high-speed fiber Wi-Fi, backup generator, and breakfast included.',
        region: 'Dar es Salaam',
        district: 'Kinondoni',
        ward: 'Masaki Peninsula',
        street_address: 'Haile Selassie Rd',
        napa_number: 'NAPA-DSM-HTL-901',
        bedrooms: 1,
        bathrooms: 1,
        monthly_rent: 85000,
        security_deposit: 85000,
        cover_image:
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80',
        photos: [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80',
        ],
        verified_at: '2026-01-10',
        amenities: ['Daily Housekeeping', 'Fiber Wi-Fi', 'Ocean View', 'Backup Generator', 'Breakfast'],
        lat: -6.7518,
        lng: 39.2791,
        owner: { name: 'Serena Hospitality Group', phone: '+255754800901' },
        vacant_units: 4,
        total_units: 12,
        roomLikesCount: 34,
        houseLikesCount: 58,
    },
    {
        id: 9002,
        property_name: 'Fundi Juma — Certified TANESCO LUKU, AC & Plumbing Specialist',
        property_type: 'Vetted Fundi Service',
        feedCategory: 'works',
        badgeLabelEn: 'Vetted Fundi & Works',
        badgeLabelSw: 'Mafundi Walioidhinishwa',
        priceUnitEn: 'service',
        priceUnitSw: 'kazi',
        description:
            'EWURA & TANESCO certified technician for LUKU sub-meter troubleshooting, AC servicing, DAWASA booster pump installation, and move-in electrical inspection.',
        region: 'Dar es Salaam',
        district: 'Kinondoni',
        ward: 'Mikocheni & Sinza',
        street_address: 'Mwai Kibaki Rd Service Hub',
        napa_number: 'FUNDI-VERIFIED-402',
        bedrooms: 1,
        bathrooms: 1,
        monthly_rent: 25000,
        security_deposit: 0,
        cover_image:
            'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1000&q=80',
        photos: [
            'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1000&q=80',
        ],
        verified_at: '2026-01-12',
        amenities: ['LUKU Diagnostics', 'AC Servicing', 'DAWASA Pump Repair', 'Same-Day Arrival'],
        lat: -6.7745,
        lng: 39.2395,
        owner: { name: 'Eng. Juma Bakari (Vetted Fundi)', phone: '+255713550219' },
        vacant_units: 1,
        total_units: 1,
        roomLikesCount: 41,
        houseLikesCount: 76,
    },
    {
        id: 9003,
        property_name: 'Mikocheni B & Regent Estate — DAWASA Water & Street Security Notice',
        property_type: 'Community Alert',
        feedCategory: 'announcements',
        badgeLabelEn: 'Community Alert (Taarifa za Mtaa)',
        badgeLabelSw: 'Taarifa za Mtaa',
        priceUnitEn: 'notice',
        priceUnitSw: 'taarifa',
        description:
            'Official neighborhood update: DAWASA pressure upgrade completed for Mikocheni B. High-pressure water flow is active 24/7. Night patrol gate passes updated for all verified tenants.',
        region: 'Dar es Salaam',
        district: 'Kinondoni',
        ward: 'Mikocheni B',
        street_address: 'Serikali za Mitaa Office',
        napa_number: 'MTAA-ALERT-108',
        bedrooms: 2,
        bathrooms: 2,
        monthly_rent: 0,
        security_deposit: 0,
        cover_image:
            'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80',
        photos: [
            'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80',
        ],
        verified_at: '2026-01-14',
        amenities: ['DAWASA Upgrade', 'Neighborhood Watch', 'NAPA Street Registry'],
        lat: -6.7662,
        lng: 39.2545,
        owner: { name: 'Mikocheni Residents Committee', phone: '+255754112233' },
        vacant_units: 1,
        total_units: 1,
        roomLikesCount: 19,
        houseLikesCount: 92,
    },
    {
        id: 9004,
        property_name: 'Sinza Mori Self-Contained Master Studio (Private LUKU)',
        property_type: 'Studio & Single Room',
        feedCategory: 'rooms',
        badgeLabelEn: 'Master Room & Studio',
        badgeLabelSw: 'Chumba Master & Studio',
        priceUnitEn: 'month',
        priceUnitSw: 'mwezi',
        description:
            'Modern self-contained studio room with private kitchenette, dedicated LUKU sub-meter, gypsum ceiling, tiled floor, and direct owner lease (Zero Dalali Fee).',
        region: 'Dar es Salaam',
        district: 'Ubungo',
        ward: 'Sinza Mori',
        street_address: 'Shekilango Enclave',
        napa_number: 'NAPA-DSM-RM-714',
        bedrooms: 1,
        bathrooms: 1,
        monthly_rent: 220000,
        security_deposit: 220000,
        cover_image:
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80',
        photos: [
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
        ],
        verified_at: '2026-01-15',
        amenities: ['Private LUKU', 'Self-Contained Bath', 'Kitchenette', '0% Broker Fee'],
        lat: -6.7812,
        lng: 39.2238,
        owner: { name: 'Mama Neema Mwakasege', phone: '+255754908112' },
        vacant_units: 2,
        total_units: 6,
        roomLikesCount: 63,
        houseLikesCount: 44,
    },
];

export default function TenantDashboard({
    user,
    currentResidence = null,
    initialAgreements = [],
    initialInvoices = [],
    initialMaintenance = [],
    initialViewings = [],
    availableHouses = [],
}: {
    user: any;
    currentResidence: any;
    initialAgreements: any[];
    initialInvoices: any[];
    initialMaintenance: any[];
    initialViewings: any[];
    availableHouses: MapPropertyItem[];
}) {
    const [activeTab, setActiveTab] = useState<TenantMainTab>('explore');
    const [lang, setLang] = useState<'en' | 'sw'>(() => {
        try {
            return (localStorage.getItem('panga_lang') as 'en' | 'sw') || 'en';
        } catch {
            return 'en';
        }
    });
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
        try {
            return (localStorage.getItem('panga_theme') as 'light' | 'dark' | 'system') || 'light';
        } catch {
            return 'light';
        }
    });

    const t = (en: string, sw: string) => (lang === 'sw' ? sw : en);

    // Apply dark/light mode to <html>
    useEffect(() => {
        const root = document.documentElement;
        const isDark =
            theme === 'dark' ||
            (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        try {
            localStorage.setItem('panga_theme', theme);
        } catch {}
    }, [theme]);

    const handleChangeLang = (l: 'en' | 'sw') => {
        setLang(l);
        try {
            localStorage.setItem('panga_lang', l);
        } catch {}
    };

    // Discovery Feed Filters (matching Flutter explore.dart)
    const [selectedCategory, setSelectedCategory] = useState<FeedCategoryKey>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [maxBudget, setMaxBudget] = useState<number>(3500000);
    const [showFilterDrawer, setShowFilterDrawer] = useState(false);
    const [photoIndexByHouse, setPhotoIndexByHouse] = useState<Record<number, number>>({});

    // Granular Likes & Saved state (Room vs Whole House + Saved Comments)
    const [likedRooms, setLikedRooms] = useState<number[]>([9004]);
    const [likedHouses, setLikedHouses] = useState<number[]>(() =>
        availableHouses.length > 0 ? [availableHouses[0].id] : [9001]
    );
    const [roomLikeCounters, setRoomLikeCounters] = useState<Record<number, number>>({});
    const [houseLikeCounters, setHouseLikeCounters] = useState<Record<number, number>>({});

    // Modals State
    const [veyoraOpen, setVeyoraOpen] = useState(false);
    const [likeChooserHouse, setLikeChooserHouse] = useState<MapPropertyItem | null>(null);
    const [commentsModalHouse, setCommentsModalHouse] = useState<MapPropertyItem | null>(null);
    const [mkatabaModalHouse, setMkatabaModalHouse] = useState<MapPropertyItem | null>(null);
    const [detailModalHouse, setDetailModalHouse] = useState<MapPropertyItem | null>(null);
    const [viewingModalHouse, setViewingModalHouse] = useState<MapPropertyItem | null>(null);
    const [viewingDate, setViewingDate] = useState('2026-11-10T10:00');
    const [viewingNote, setViewingNote] = useState('');

    // Agreements, Invoices, Viewings & Maintenance Lists
    const [agreements, setAgreements] = useState<any[]>(
        initialAgreements.length > 0
            ? initialAgreements
            : [
                  {
                      id: 501,
                      agreement_number: 'MKT-DSM-2026-0501',
                      monthly_rent: currentResidence?.monthly_rent || 650000,
                      lease_start_date: '2026-01-01',
                      lease_end_date: '2026-12-31',
                      landlord_name: currentResidence?.landlord?.name || 'Ibrahim Kimaro',
                      tenant_signed_at: null,
                      house: { property_name: currentResidence?.property_name || 'Kimaro Executive Heights' },
                      unit: { name: currentResidence?.unit_name || 'Suite B4 • 2BHK' },
                  },
              ]
    );
    const [invoices, setInvoices] = useState<any[]>(
        initialInvoices.length > 0
            ? initialInvoices
            : [
                  {
                      id: 701,
                      invoice_number: 'INV-DSM-2026-0701',
                      total_amount: currentResidence?.monthly_rent || 650000,
                      balance_due: currentResidence?.monthly_rent || 650000,
                      due_date: 'Nov 10, 2026',
                      status: 'unpaid',
                      house: { property_name: currentResidence?.property_name || 'Kimaro Executive Heights' },
                  },
              ]
    );
    const [maintenanceList, setMaintenanceList] = useState<any[]>(initialMaintenance);
    const [viewingsList, setViewingsList] = useState<any[]>(initialViewings);

    // Comments Map by House ID
    const [commentsByHouse, setCommentsByHouse] = useState<Record<number, FeedCommentItem[]>>({});

    // Realtime Notifications & Toast
    const [notifications, setNotifications] = useState<
        { id: string; sender: string; body: string; time: string; unread: boolean }[]
    >([
        {
            id: 'init-1',
            sender: 'Ibrahim Kimaro (Landlord)',
            body: 'Welcome! Your digital Mkataba and LUKU meter readings are ready for review.',
            time: '10m ago',
            unread: true,
        },
    ]);
    const [notifOpen, setNotifOpen] = useState(false);
    const [toast, setToast] = useState<{ title: string; body: string } | null>(null);
    const notifRef = useRef<HTMLDivElement>(null);

    const showToast = (title: string, body: string) => {
        setToast({ title, body });
        setTimeout(() => setToast(null), 4500);
    };

    // Connect to Elixir Phoenix user channel for realtime chat notifications
    useEffect(() => {
        let client: PhoenixSocketClient | null = null;
        fetch('/landlord/chat/token', { credentials: 'include' })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (!data?.token || !data?.user?.uuid) return;
                const wsUrl = resolveBrowserWsUrl(data.ws_url);
                client = new PhoenixSocketClient(wsUrl, data.token);
                client.connect();
                const ch = client.channel(`user:${data.user.uuid}`, {});
                ch.on('notification', (payload: any) => {
                    const sender = payload?.sender_name || 'New Message';
                    const body = payload?.body || 'Sent you a message';
                    setNotifications((prev) => [
                        { id: `n-${Date.now()}`, sender, body, time: 'Just now', unread: true },
                        ...prev,
                    ]);
                    showToast(sender, body);
                });
                ch.join().catch(() => {});
            })
            .catch(() => {});
        return () => {
            client?.disconnect();
        };
    }, []);

    // Build unified Discovery Feed combining backend houses + Flutter curated categories
    const unifiedFeed: ExtendedFeedPost[] = useMemo(() => {
        const backendMapped: ExtendedFeedPost[] = (availableHouses || []).map((h, i) => {
            const pType = (h.property_type || 'Apartment').toLowerCase();
            let cat: FeedCategoryKey = 'apartments';
            if (pType.includes('villa') || pType.includes('house') || pType.includes('bungalow')) {
                cat = 'houses';
            } else if (pType.includes('room') || pType.includes('studio') || (h.bedrooms || 2) === 1) {
                cat = 'rooms';
            } else if (pType.includes('hotel') || pType.includes('lodge')) {
                cat = 'hotels';
            }
            return {
                ...h,
                feedCategory: cat,
                badgeLabelEn: h.property_type || 'Verified Residence',
                badgeLabelSw: h.property_type || 'Nyumba Iliyothibitishwa',
                priceUnitEn: 'month',
                priceUnitSw: 'mwezi',
                roomLikesCount: 18 + ((i * 7) % 35),
                houseLikesCount: 32 + ((i * 11) % 60),
            };
        });

        return [...backendMapped, ...CURATED_EXTRA_POSTS];
    }, [availableHouses]);

    const filteredFeed = useMemo(() => {
        return unifiedFeed.filter((post) => {
            if (selectedCategory !== 'all' && post.feedCategory !== selectedCategory) return false;
            if (verifiedOnly && !post.verified_at) return false;
            if (post.monthly_rent > maxBudget) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const hay = `${post.property_name} ${post.district} ${post.ward} ${post.property_type} ${post.description || ''}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [unifiedFeed, selectedCategory, verifiedOnly, maxBudget, searchQuery]);

    // Default comments generator for any card
    const getCommentsForHouse = (house: MapPropertyItem): FeedCommentItem[] => {
        if (commentsByHouse[house.id]) return commentsByHouse[house.id];
        return [
            {
                id: `c-${house.id}-1`,
                author: 'Neema Msuya',
                roleBadge: 'Verified Tenant',
                avatar: 'https://ui-avatars.com/api/?name=Neema+Msuya&background=0d9488&color=fff',
                text: `Is the TANESCO LUKU sub-meter completely independent for this unit at ${house.property_name}, and how is DAWASA water pressure?`,
                timeAgo: '2h ago',
                likes: 8,
                isLiked: false,
                isSaved: false,
                replies: [
                    {
                        id: `r-${house.id}-1`,
                        author: house.owner?.name || 'Verified Landlord',
                        roleBadge: 'Property Owner ✓',
                        text: 'Yes Karibu! Each unit has its own dedicated LUKU token meter and a 5,000L DAWASA reserve tank with automatic booster pump.',
                        timeAgo: '1h ago',
                    },
                ],
            },
            {
                id: `c-${house.id}-2`,
                author: 'Kelvin Massawe',
                roleBadge: 'Verified Tenant',
                avatar: 'https://ui-avatars.com/api/?name=Kelvin+Massawe&background=0284c7&color=fff',
                text: 'Visited this street yesterday — clean tarmac access and zero broker commission when booking directly here.',
                timeAgo: '5h ago',
                likes: 14,
                isLiked: true,
                isSaved: false,
                replies: [],
            },
        ];
    };

    const handleAddComment = (houseId: number, text: string, replyToId?: string) => {
        const houseObj = unifiedFeed.find((h) => h.id === houseId);
        if (!houseObj) return;
        const existing = getCommentsForHouse(houseObj);
        if (replyToId) {
            const updated = existing.map((c) =>
                c.id === replyToId
                    ? {
                          ...c,
                          replies: [
                              ...c.replies,
                              {
                                  id: `rep-${Date.now()}`,
                                  author: user?.name || 'Verified Tenant',
                                  roleBadge: 'Verified Tenant',
                                  text,
                                  timeAgo: 'Just now',
                              },
                          ],
                      }
                    : c
            );
            setCommentsByHouse((prev) => ({ ...prev, [houseId]: updated }));
        } else {
            const newComment: FeedCommentItem = {
                id: `c-${Date.now()}`,
                author: user?.name || 'Verified Tenant',
                roleBadge: 'Verified Tenant',
                avatar: user?.avatar || 'https://ui-avatars.com/api/?name=Tenant&background=059669&color=fff',
                text,
                timeAgo: 'Just now',
                likes: 1,
                isLiked: true,
                isSaved: false,
                replies: [],
            };
            setCommentsByHouse((prev) => ({ ...prev, [houseId]: [newComment, ...existing] }));
        }
    };

    const handleToggleLikeComment = (houseId: number, commentId: string) => {
        const houseObj = unifiedFeed.find((h) => h.id === houseId);
        if (!houseObj) return;
        const existing = getCommentsForHouse(houseObj).map((c) =>
            c.id === commentId
                ? { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 }
                : c
        );
        setCommentsByHouse((prev) => ({ ...prev, [houseId]: existing }));
    };

    const handleToggleSaveComment = (houseId: number, commentId: string) => {
        const houseObj = unifiedFeed.find((h) => h.id === houseId);
        if (!houseObj) return;
        const existing = getCommentsForHouse(houseObj).map((c) =>
            c.id === commentId ? { ...c, isSaved: !c.isSaved } : c
        );
        setCommentsByHouse((prev) => ({ ...prev, [houseId]: existing }));
        showToast(t('Comment Bookmarked', 'Maoni Yamehifadhiwa'), t('Saved to your collection.', 'Yamehifadhiwa kwenye orodha yako.'));
    };

    const toggleRoomLike = (house: MapPropertyItem) => {
        const already = likedRooms.includes(house.id);
        setLikedRooms((prev) => (already ? prev.filter((id) => id !== house.id) : [...prev, house.id]));
        setRoomLikeCounters((prev) => ({
            ...prev,
            [house.id]: (prev[house.id] || 0) + (already ? -1 : 1),
        }));
        showToast(
            already ? t('Removed Room', 'Imeondolewa') : t('Room Saved! (Chumba)', 'Chumba Kimehifadhiwa!'),
            house.property_name
        );
    };

    const toggleHouseLike = (house: MapPropertyItem) => {
        const already = likedHouses.includes(house.id);
        setLikedHouses((prev) => (already ? prev.filter((id) => id !== house.id) : [...prev, house.id]));
        setHouseLikeCounters((prev) => ({
            ...prev,
            [house.id]: (prev[house.id] || 0) + (already ? -1 : 1),
        }));
        showToast(
            already ? t('Removed House', 'Imeondolewa') : t('Whole House Saved! (Nyumba)', 'Nyumba Nzima Imehifadhiwa!'),
            house.property_name
        );
    };

    const handleScheduleViewingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!viewingModalHouse) return;
        try {
            const res = await fetch('/tenant/viewings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    house_id: viewingModalHouse.id,
                    preferred_at: viewingDate,
                    note: viewingNote || 'Interested in viewing this property and reviewing the Mkataba.',
                }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.viewing) setViewingsList((prev) => [data.viewing, ...prev]);
            } else {
                setViewingsList((prev) => [
                    {
                        id: Date.now(),
                        property_name: viewingModalHouse.property_name,
                        district: viewingModalHouse.district,
                        ward: viewingModalHouse.ward,
                        monthly_rent: viewingModalHouse.monthly_rent,
                        owner_name: viewingModalHouse.owner?.name || 'Property Owner',
                        preferred_at: viewingDate,
                        status: 'pending',
                    },
                    ...prev,
                ]);
            }
        } catch {}
        showToast(
            t('Viewing Scheduled! (Miadi Imetumwa)', 'Miadi ya Kuona Nyumba Imetumwa!'),
            `${viewingModalHouse.property_name} • ${viewingDate}`
        );
        setViewingModalHouse(null);
        setViewingNote('');
    };

    const handleSignAgreement = async (id: number, signatureName: string) => {
        try {
            await fetch(`/tenant/agreements/${id}/sign-tenant`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ signature: signatureName }),
            });
        } catch {}
        setAgreements((prev) =>
            prev.map((a) => (a.id === id ? { ...a, tenant_signed_at: new Date().toISOString() } : a))
        );
        showToast(
            t('Mkataba Digitally Signed!', 'Mkataba Umesainiwa Kidijitali!'),
            t('Your digital signature has been stamped on the lease.', 'Saini yako imehifadhiwa rasmi kwenye Mkataba.')
        );
    };

    const handlePayInvoice = async (invoice: any, method: string, reference: string) => {
        try {
            await fetch(`/tenant/invoices/${invoice.id}/pay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    amount: invoice.total_amount || 650000,
                    payment_method: method,
                    payment_reference: reference,
                }),
            });
        } catch {}
        setInvoices((prev) =>
            prev.map((inv) => (inv.id === invoice.id ? { ...inv, status: 'paid', balance_due: 0 } : inv))
        );
        showToast(
            t('Payment Confirmed!', 'Malipo Yamethibitishwa!'),
            `${method} • Ref ${reference}`
        );
    };

    const handleCreateMaintenance = async (title: string, details: string, category: string, priority: string) => {
        try {
            const res = await fetch('/tenant/maintenance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ title, details, category, priority }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.ticket) {
                    setMaintenanceList((prev) => [data.ticket, ...prev]);
                    showToast(t('Ticket Submitted', 'Ombi Limetumwa'), title);
                    return;
                }
            }
        } catch {}
        setMaintenanceList((prev) => [
            {
                id: Date.now(),
                title: `[${category}] ${title}`,
                details,
                status: 'open',
                created_at: 'Just now',
            },
            ...prev,
        ]);
        showToast(t('Maintenance Logged', 'Ombi la Matengenezo Limetumwa'), title);
    };

    const handleLogout = async () => {
        try {
            await fetch('/logout', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
            });
        } catch {}
        window.location.href = '/login';
    };

    const formatTZS = (n: number | string) => `TZS ${Number(n || 0).toLocaleString('en-US')}`;

    const CATEGORY_PILLS: { id: FeedCategoryKey; en: string; sw: string; icon: any }[] = [
        { id: 'all', en: 'All Feeds', sw: 'Zote', icon: Compass },
        { id: 'houses', en: 'Houses & Villas', sw: 'Nyumba & Majengo', icon: Home },
        { id: 'apartments', en: 'Apartments', sw: 'Apatimenti', icon: Building2 },
        { id: 'rooms', en: 'Rooms & Studios', sw: 'Vyumba & Studio', icon: BedDouble },
        { id: 'hotels', en: 'Hotels & Lodges', sw: 'Hoteli & Vyumba', icon: Hotel },
        { id: 'works', en: 'Fundi & Works', sw: 'Mafundi & Kazi', icon: Hammer },
        { id: 'announcements', en: 'Community Alerts', sw: 'Taarifa za Mtaa', icon: Megaphone },
    ];

    const NAV_ITEMS: { id: TenantMainTab; en: string; sw: string; icon: any; badge?: number }[] = [
        { id: 'explore', en: 'Home Feed', sw: 'Mwanzo', icon: Home },
        { id: 'map', en: 'Live Map', sw: 'Ramani', icon: MapIcon },
        { id: 'saved', en: 'Saved', sw: 'Zilizohifadhiwa', icon: Heart, badge: likedHouses.length + likedRooms.length },
        { id: 'agreements', en: 'Mikataba & Bills', sw: 'Mikataba & Ankara', icon: FileSignature, badge: agreements.length },
        { id: 'messages', en: 'Messages', sw: 'Ujumbe', icon: MessageSquare, badge: notifications.filter((n) => n.unread).length },
        { id: 'account', en: 'Account', sw: 'Akaunti', icon: User },
    ];

    return (
        <div className="min-h-screen bg-[#F6F5F2] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row transition-colors duration-200">
            <Head title="Panga Pangisha • Tenant Living & Discovery Suite" />

            {/* ================= DESKTOP LEFT SIDEBAR (Matching Flutter shell.dart + Web Pro Layout) ================= */}
            <aside className="hidden lg:flex flex-col justify-between w-72 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 p-5 sticky top-0 h-screen">
                <div className="space-y-6">
                    {/* Brand Header */}
                    <div className="flex items-center justify-between px-2">
                        <a href="/" className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-emerald-600/25">
                                P
                            </div>
                            <div>
                                <div className="text-base font-black tracking-tight text-slate-900 dark:text-white leading-none">
                                    Panga Pangisha
                                </div>
                                <div className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mt-1">
                                    {t('Tenant Living Suite', 'Mfumo wa Mpangaji')}
                                </div>
                            </div>
                        </a>
                    </div>

                    {/* Veyora AI Quick Launch Card */}
                    <button
                        type="button"
                        onClick={() => setVeyoraOpen(true)}
                        className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 text-white border border-emerald-500/30 shadow-md hover:shadow-emerald-500/15 flex items-center justify-between group transition-all cursor-pointer text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-xs font-black tracking-wide flex items-center gap-1.5">
                                    <span>Veyora AI</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                </div>
                                <div className="text-[10px] text-slate-300 font-medium">
                                    {t('Ask about homes & Mkataba', 'Uliza nyumba na Mkataba')}
                                </div>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-emerald-400" />
                    </button>

                    {/* Primary Navigation Tabs */}
                    <nav className="space-y-1.5">
                        <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            {t('Discovery & Tenancy', 'Ugunduzi na Upangaji')}
                        </div>
                        {NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const active = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full px-3.5 py-3 rounded-2xl text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer ${
                                        active
                                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon className="w-4 h-4" />
                                        <span>{lang === 'sw' ? item.sw : item.en}</span>
                                    </div>
                                    {item.badge !== undefined && item.badge > 0 && (
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                                active
                                                    ? 'bg-white/25 text-white'
                                                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                            }`}
                                        >
                                            {item.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom Verified Tenant Card */}
                <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div
                        onClick={() => setActiveTab('account')}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2.5 cursor-pointer transition-colors"
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <img
                                src={user?.avatar}
                                alt={user?.name}
                                className="w-10 h-10 rounded-xl object-cover shrink-0"
                            />
                            <div className="min-w-0">
                                <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                                    {user?.name || 'Verified Tenant'}
                                </div>
                                <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <BadgeCheck className="w-3 h-3" />
                                    <span>VT-{String(user?.id || 1042).padStart(4, '0')}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleLogout();
                            }}
                            title={t('Sign Out', 'Ondoka')}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ================= MAIN CONTENT COLUMN ================= */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Sticky Glass Top Bar (Matching Flutter explore.dart _buildStickyTopBar) */}
                <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 py-3.5">
                    <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
                        {/* Mobile Brand + Search Input */}
                        <div className="flex items-center gap-3 flex-1 max-w-xl">
                            <div className="lg:hidden w-10 h-10 rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shrink-0">
                                P
                            </div>
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t(
                                        'Search Mikocheni, Masaki, Sinza, 2BHK, Studio, Fundi...',
                                        'Tafuta Mikocheni, Masaki, Sinza, Vyumba, Studio, Fundi...'
                                    )}
                                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Filter Tune Button (Matching Flutter explore.dart) */}
                            <button
                                type="button"
                                onClick={() => setShowFilterDrawer((v) => !v)}
                                title={t('Filter Feed', 'Chuja Nyumba')}
                                className={`p-2.5 rounded-2xl border transition-all cursor-pointer shrink-0 ${
                                    showFilterDrawer || verifiedOnly || maxBudget < 3500000
                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/70 dark:border-slate-700 hover:border-emerald-500'
                                }`}
                            >
                                <SlidersHorizontal className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Right Actions: Veyora AI Pill + Lang + Theme + Notification Bell */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setVeyoraOpen(true)}
                                className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Veyora AI</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleChangeLang(lang === 'en' ? 'sw' : 'en')}
                                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                                {lang === 'en' ? 'SW' : 'EN'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                            </button>

                            {/* Realtime Notification Bell */}
                            <div className="relative" ref={notifRef}>
                                <button
                                    type="button"
                                    onClick={() => setNotifOpen((v) => !v)}
                                    className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                >
                                    <Bell className="w-4 h-4" />
                                    {notifications.some((n) => n.unread) && (
                                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute top-1.5 right-1.5 ring-2 ring-white dark:ring-slate-900" />
                                    )}
                                </button>

                                {notifOpen && (
                                    <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black uppercase text-slate-400">
                                                {t('Realtime Notifications', 'Taarifa za Papo Hapo')}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
                                                    setNotifOpen(false);
                                                    setActiveTab('messages');
                                                }}
                                                className="text-[11px] font-extrabold text-emerald-600 hover:underline cursor-pointer"
                                            >
                                                {t('Open Chat', 'Fungua Ujumbe')}
                                            </button>
                                        </div>
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {notifications.map((n) => (
                                                <div
                                                    key={n.id}
                                                    onClick={() => {
                                                        setNotifOpen(false);
                                                        setActiveTab('messages');
                                                    }}
                                                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-emerald-50/60 dark:hover:bg-slate-800 cursor-pointer"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">{n.sender}</span>
                                                        <span className="text-[10px] text-slate-400">{n.time}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">{n.body}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Collapsible Advanced Filter Bar (Matching Flutter _showFilterSheet) */}
                    {showFilterDrawer && (
                        <div className="max-w-6xl mx-auto mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-4">
                                <label className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-700 dark:text-slate-200 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={verifiedOnly}
                                        onChange={(e) => setVerifiedOnly(e.target.checked)}
                                        className="w-4 h-4 accent-emerald-600 rounded"
                                    />
                                    <span>{t('Verified Owners Only (0% Broker Fee)', 'Wamiliki Waliothibitishwa Pekee (Bila Dalali)')}</span>
                                </label>

                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-500">
                                        {t('Max Monthly Budget:', 'Kiwango cha Juu cha Kodi:')}
                                    </span>
                                    <input
                                        type="range"
                                        min={100000}
                                        max={3500000}
                                        step={50000}
                                        value={maxBudget}
                                        onChange={(e) => setMaxBudget(Number(e.target.value))}
                                        className="w-36 accent-emerald-600"
                                    />
                                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                        {formatTZS(maxBudget)}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setVerifiedOnly(false);
                                    setMaxBudget(3500000);
                                    setSelectedCategory('all');
                                    setSearchQuery('');
                                }}
                                className="text-xs font-extrabold text-rose-600 hover:underline cursor-pointer"
                            >
                                {t('Reset Filters', 'Ondoa Vichujio')}
                            </button>
                        </div>
                    )}
                </header>

                {/* ================= MAIN VIEWPORT BODY ================= */}
                <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 pb-24 lg:pb-10">
                    {/* ----------------------------------------------------------------
                     * TAB 1: HOME DISCOVERY FEED (Matching Flutter explore.dart)
                     * ---------------------------------------------------------------- */}
                    {activeTab === 'explore' && (
                        <div className="space-y-6">
                            {/* 7 Category Filter Pills (Matching Flutter FeedCategory) */}
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                                {CATEGORY_PILLS.map((cat) => {
                                    const Icon = cat.icon;
                                    const active = selectedCategory === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setSelectedCategory(cat.id)}
                                            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                                                active
                                                    ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-md'
                                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500'
                                            }`}
                                        >
                                            <Icon className={`w-3.5 h-3.5 ${active ? 'text-emerald-300' : 'text-emerald-600'}`} />
                                            <span>{lang === 'sw' ? cat.sw : cat.en}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Claymorphic Property & Community Discovery Feed Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredFeed.map((post) => {
                                    const photos = post.photos && post.photos.length > 0 ? post.photos : [post.cover_image];
                                    const currPhotoIdx = photoIndexByHouse[post.id] || 0;
                                    const isRoomLiked = likedRooms.includes(post.id);
                                    const isHouseLiked = likedHouses.includes(post.id);
                                    const roomCount = post.roomLikesCount + (roomLikeCounters[post.id] || 0);
                                    const houseCount = post.houseLikesCount + (houseLikeCounters[post.id] || 0);
                                    const postComments = getCommentsForHouse(post);

                                    return (
                                        <article
                                            key={post.id}
                                            className="group bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
                                        >
                                            <div>
                                                {/* Multi-Photo Carousel Header */}
                                                <div className="relative h-64 sm:h-72 bg-slate-900 overflow-hidden">
                                                    <img
                                                        src={photos[currPhotoIdx % photos.length]}
                                                        alt={post.property_name}
                                                        onClick={() => setDetailModalHouse(post)}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/15 to-transparent pointer-events-none" />

                                                    {/* Top Left: Category + Verified Badge */}
                                                    <div className="absolute top-3.5 left-3.5 flex flex-wrap items-center gap-1.5">
                                                        <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-white text-[11px] font-extrabold flex items-center gap-1.5 border border-white/15">
                                                            <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                                                            {lang === 'sw' ? post.badgeLabelSw : post.badgeLabelEn}
                                                        </span>
                                                        <span className="px-2.5 py-1 rounded-full bg-emerald-600/90 text-white text-[10px] font-extrabold">
                                                            0% Dalali
                                                        </span>
                                                    </div>

                                                    {/* Top Right: Like / Save Options Button (Matches Flutter _showLikeTargetPicker) */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setLikeChooserHouse(post)}
                                                        title={t('Save Room or Whole House', 'Hifadhi Chumba au Nyumba Nzima')}
                                                        className={`absolute top-3.5 right-3.5 w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-md ${
                                                            isRoomLiked || isHouseLiked
                                                                ? 'bg-rose-500 text-white'
                                                                : 'bg-slate-950/70 text-white hover:bg-rose-500'
                                                        }`}
                                                    >
                                                        <Heart className={`w-4 h-4 ${isRoomLiked || isHouseLiked ? 'fill-current' : ''}`} />
                                                    </button>

                                                    {/* Carousel Prev/Next Controls */}
                                                    {photos.length > 1 && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setPhotoIndexByHouse((prev) => ({
                                                                        ...prev,
                                                                        [post.id]: ((prev[post.id] || 0) - 1 + photos.length) % photos.length,
                                                                    }));
                                                                }}
                                                                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/65 text-white flex items-center justify-center hover:bg-slate-950 cursor-pointer"
                                                            >
                                                                <ChevronLeft className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setPhotoIndexByHouse((prev) => ({
                                                                        ...prev,
                                                                        [post.id]: ((prev[post.id] || 0) + 1) % photos.length,
                                                                    }));
                                                                }}
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950/65 text-white flex items-center justify-center hover:bg-slate-950 cursor-pointer"
                                                            >
                                                                <ChevronRight className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Bottom Left Price Pill + Photo Counter */}
                                                    <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-end justify-between text-white">
                                                        <div className="px-3.5 py-1.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-white/15">
                                                            {post.monthly_rent > 0 ? (
                                                                <div className="text-base font-black text-emerald-400">
                                                                    {formatTZS(post.monthly_rent)}
                                                                    <span className="text-[11px] font-semibold text-slate-300">
                                                                        {' '}
                                                                        / {lang === 'sw' ? post.priceUnitSw : post.priceUnitEn}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div className="text-xs font-extrabold text-amber-300 uppercase">
                                                                    {t('Official Community Notice', 'Taarifa Rasmi ya Mtaa')}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <span className="px-2.5 py-1 rounded-xl bg-slate-950/75 text-[11px] font-bold">
                                                            {(currPhotoIdx % photos.length) + 1}/{photos.length}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Card Content Body */}
                                                <div className="p-5 space-y-3.5">
                                                    <div>
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                                <MapPin className="w-3.5 h-3.5" />
                                                                {post.ward}, {post.district}
                                                            </span>
                                                            <span className="text-[10px] font-mono font-bold text-slate-400">
                                                                {post.napa_number}
                                                            </span>
                                                        </div>
                                                        <h3
                                                            onClick={() => setDetailModalHouse(post)}
                                                            className="text-lg font-black text-slate-900 dark:text-white mt-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer line-clamp-1"
                                                        >
                                                            {post.property_name}
                                                        </h3>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                                            {post.description}
                                                        </p>
                                                    </div>

                                                    {/* Specs & Amenities Chips */}
                                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                                        {post.feedCategory !== 'announcements' && post.feedCategory !== 'works' && (
                                                            <>
                                                                <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                                                    <BedDouble className="w-3.5 h-3.5 text-emerald-600" />
                                                                    {post.bedrooms} {t('Bed', 'Chumba')}
                                                                </span>
                                                                <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                                                    <Bath className="w-3.5 h-3.5 text-emerald-600" />
                                                                    {post.bathrooms} {t('Bath', 'Bafu')}
                                                                </span>
                                                            </>
                                                        )}
                                                        {(post.amenities || []).slice(0, 3).map((am, i) => (
                                                            <span
                                                                key={i}
                                                                className="px-2.5 py-1 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300"
                                                            >
                                                                {am}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tactile Engagement Footer Bar (Matching Flutter _ClayPropertyCard bottom bar) */}
                                            <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
                                                {/* Row 1: Room Like Pill + House Like Pill + Comments Pill + Share */}
                                                <div className="flex flex-wrap items-center justify-between gap-1.5">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        {/* Like Specific Room Pill */}
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleRoomLike(post)}
                                                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer border ${
                                                                isRoomLiked
                                                                    ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300'
                                                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-amber-500'
                                                            }`}
                                                        >
                                                            <BedDouble className="w-3.5 h-3.5 text-amber-500" />
                                                            <span>{t('Room', 'Chumba')}</span>
                                                            <span className="font-black">({roomCount})</span>
                                                        </button>

                                                        {/* Like Whole House Pill */}
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleHouseLike(post)}
                                                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer border ${
                                                                isHouseLiked
                                                                    ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-300'
                                                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-rose-500'
                                                            }`}
                                                        >
                                                            <Heart className={`w-3.5 h-3.5 text-rose-500 ${isHouseLiked ? 'fill-current' : ''}`} />
                                                            <span>{t('House', 'Nyumba')}</span>
                                                            <span className="font-black">({houseCount})</span>
                                                        </button>

                                                        {/* Comments & Inquiries Pill */}
                                                        <button
                                                            type="button"
                                                            onClick={() => setCommentsModalHouse(post)}
                                                            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-[11px] font-extrabold text-slate-600 dark:text-slate-300 flex items-center gap-1 transition-all cursor-pointer"
                                                        >
                                                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                                            <span>{postComments.length}</span>
                                                        </button>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            navigator.clipboard?.writeText(
                                                                `${window.location.origin}/property/${post.id}`
                                                            );
                                                            showToast(
                                                                t('Link Copied!', 'Kiungo Kimenakiliwa!'),
                                                                post.property_name
                                                            );
                                                        }}
                                                        className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-emerald-600 cursor-pointer"
                                                    >
                                                        <Share2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                {/* Row 2: Mkataba & Docs Pill + View Details (Tazama) CTA */}
                                                <div className="flex items-center gap-2 pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setMkatabaModalHouse(post)}
                                                        className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/70 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                                    >
                                                        <FileSignature className="w-3.5 h-3.5" />
                                                        <span>{t('Mkataba & Docs', 'Mkataba na Nyaraka')}</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailModalHouse(post)}
                                                        className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span>{t('View Details', 'Tazama Zaidi')}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ----------------------------------------------------------------
                     * TAB 2: INTERACTIVE RENT MAP (Matching Flutter map.dart)
                     * ---------------------------------------------------------------- */}
                    {activeTab === 'map' && (
                        <TenantDiscoveryMap
                            houses={unifiedFeed.filter((h) => h.monthly_rent > 0)}
                            lang={lang}
                            likedHouses={likedHouses}
                            likedRooms={likedRooms}
                            onSelectProperty={(h) => setDetailModalHouse(h)}
                            onOpenMkataba={(h) => setMkatabaModalHouse(h)}
                            onOpenLikeChooser={(h) => setLikeChooserHouse(h)}
                            onScheduleViewing={(h) => setViewingModalHouse(h)}
                            onChatWithOwner={() => setActiveTab('messages')}
                        />
                    )}

                    {/* ----------------------------------------------------------------
                     * TAB 3: SAVED COLLECTION (Matching Flutter SavedTab)
                     * ---------------------------------------------------------------- */}
                    {activeTab === 'saved' && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                                        {t('Saved Homes & Rooms Collection', 'Mkusanyiko wa Nyumba na Vyumba Ulivyohifadhi')}
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        {likedHouses.length} {t('Whole Houses (Nyumba)', 'Nyumba Nzima')} • {likedRooms.length}{' '}
                                        {t('Specific Rooms (Vyumba)', 'Vyumba Maalum')}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('explore')}
                                    className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold cursor-pointer self-start sm:self-center"
                                >
                                    {t('+ Discover More Homes', '+ Gundua Nyumba Zaidi')}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {unifiedFeed
                                    .filter((h) => likedHouses.includes(h.id) || likedRooms.includes(h.id))
                                    .map((h) => (
                                        <div
                                            key={h.id}
                                            className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 flex gap-4 items-center shadow-xs"
                                        >
                                            <img
                                                src={h.cover_image}
                                                alt={h.property_name}
                                                className="w-28 h-28 rounded-2xl object-cover shrink-0"
                                            />
                                            <div className="flex-1 min-w-0 space-y-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    {likedHouses.includes(h.id) && (
                                                        <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-600 text-[10px] font-extrabold">
                                                            {t('Saved Whole House', 'Nyumba Nzima')}
                                                        </span>
                                                    )}
                                                    {likedRooms.includes(h.id) && (
                                                        <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 text-[10px] font-extrabold">
                                                            {t('Saved Specific Room', 'Chumba Maalum')}
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="text-base font-black text-slate-900 dark:text-white truncate">
                                                    {h.property_name}
                                                </h4>
                                                <p className="text-xs text-slate-500 truncate">
                                                    {h.ward}, {h.district} • {formatTZS(h.monthly_rent)}/mo
                                                </p>
                                                <div className="flex items-center gap-2 pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setMkatabaModalHouse(h)}
                                                        className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold cursor-pointer"
                                                    >
                                                        {t('Mkataba', 'Mkataba')}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailModalHouse(h)}
                                                        className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white text-xs font-extrabold cursor-pointer"
                                                    >
                                                        {t('Open', 'Fungua')}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* ----------------------------------------------------------------
                     * TAB 4: RENTAL AGREEMENTS, INVOICES & MAINTENANCE
                     * ---------------------------------------------------------------- */}
                    {activeTab === 'agreements' && (
                        <TenantAgreementsAndBillingTab
                            lang={lang}
                            currentResidence={currentResidence}
                            agreements={agreements}
                            invoices={invoices}
                            maintenanceList={maintenanceList}
                            viewingsList={viewingsList}
                            userName={user?.name || 'Resident Tenant'}
                            userPhone={user?.phone || '+255754000000'}
                            onSignAgreement={handleSignAgreement}
                            onPayInvoice={handlePayInvoice}
                            onCreateMaintenance={handleCreateMaintenance}
                        />
                    )}

                    {/* ----------------------------------------------------------------
                     * TAB 5: REALTIME MESSAGES (Elixir Phoenix WebSocket Chat)
                     * ---------------------------------------------------------------- */}
                    {activeTab === 'messages' && (
                        <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900">
                            <RealtimeChatView lang={lang} />
                        </div>
                    )}

                    {/* ----------------------------------------------------------------
                     * TAB 6: ACCOUNT & PROFILE (Matching Flutter profile.dart)
                     * ---------------------------------------------------------------- */}
                    {activeTab === 'account' && (
                        <TenantAccountTab
                            user={user}
                            lang={lang}
                            theme={theme}
                            savedCount={likedHouses.length + likedRooms.length}
                            viewingsCount={viewingsList.length}
                            agreementsCount={agreements.length}
                            invoicesCount={invoices.length}
                            onChangeLang={handleChangeLang}
                            onChangeTheme={setTheme}
                            onNavigateTab={(tb) => setActiveTab(tb)}
                            onShowToast={showToast}
                            onLogout={handleLogout}
                        />
                    )}
                </main>
            </div>

            {/* ================= MOBILE FLOATING BOTTOM NAV BAR (Matching Flutter shell.dart) ================= */}
            <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-40 bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-xl text-white rounded-3xl px-2 py-2 border border-white/10 shadow-2xl flex items-center justify-around">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveTab(item.id)}
                            className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-2xl transition-all cursor-pointer ${
                                active ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="text-[10px] font-extrabold mt-0.5">
                                {lang === 'sw' ? item.sw.split(' ')[0] : item.en.split(' ')[0]}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {/* ================= GLOBAL MODALS & DRAWERS ================= */}
            <VeyoraAiDrawer
                open={veyoraOpen}
                onClose={() => setVeyoraOpen(false)}
                lang={lang}
                userName={user?.name || 'Tenant'}
            />

            <LikeTargetChooserModal
                house={likeChooserHouse}
                lang={lang}
                isRoomLiked={likeChooserHouse ? likedRooms.includes(likeChooserHouse.id) : false}
                isHouseLiked={likeChooserHouse ? likedHouses.includes(likeChooserHouse.id) : false}
                onToggleRoomLike={toggleRoomLike}
                onToggleHouseLike={toggleHouseLike}
                onClose={() => setLikeChooserHouse(null)}
            />

            <CommentsDrawerModal
                house={commentsModalHouse}
                lang={lang}
                userName={user?.name || 'Verified Tenant'}
                comments={commentsModalHouse ? getCommentsForHouse(commentsModalHouse) : []}
                onAddComment={handleAddComment}
                onToggleLikeComment={handleToggleLikeComment}
                onToggleSaveComment={handleToggleSaveComment}
                onClose={() => setCommentsModalHouse(null)}
            />

            <MkatabaAndDocsModal
                house={mkatabaModalHouse}
                lang={lang}
                onClose={() => setMkatabaModalHouse(null)}
                onRequestAgreementNow={(house) => {
                    const newAgreement = {
                        id: Date.now(),
                        agreement_number: `MKT-DSM-2026-${String(house.id).padStart(4, '0')}`,
                        monthly_rent: house.monthly_rent,
                        lease_start_date: '2026-12-01',
                        lease_end_date: '2027-11-30',
                        landlord_name: house.owner?.name || 'Verified Landlord',
                        tenant_signed_at: null,
                        house: { property_name: house.property_name },
                        unit: { name: `${house.bedrooms}BHK Suite` },
                    };
                    setAgreements((prev) => [newAgreement, ...prev]);
                    setMkatabaModalHouse(null);
                    setActiveTab('agreements');
                    showToast(
                        t('Tenancy Agreement Drafted!', 'Rasimu ya Mkataba Imeandaliwa!'),
                        t('Review clauses and digitally sign your Mkataba now.', 'Soma vifungu na usaini Mkataba wako sasa.')
                    );
                }}
                onOpenSignedAgreements={() => setActiveTab('agreements')}
            />

            <PropertyDetailModal
                house={detailModalHouse}
                lang={lang}
                onClose={() => setDetailModalHouse(null)}
                onScheduleViewing={(h) => setViewingModalHouse(h)}
                onOpenMkataba={(h) => setMkatabaModalHouse(h)}
                onChatWithOwner={() => setActiveTab('messages')}
                onReportListing={(h, reason) =>
                    showToast(t('Report Submitted', 'Ripoti Imetumwa'), `${h.property_name}: ${reason}`)
                }
            />

            {/* Schedule Viewing Modal */}
            {viewingModalHouse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
                    <form
                        onSubmit={handleScheduleViewingSubmit}
                        className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                {t('Schedule Viewing (Miadi)', 'Weka Miadi ya Kuona Nyumba')}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setViewingModalHouse(null)}
                                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <p className="text-xs text-slate-500">
                            {viewingModalHouse.property_name} • {viewingModalHouse.ward}, {viewingModalHouse.district}
                        </p>
                        <div>
                            <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">
                                {t('Preferred Date & Time', 'Tarehe na Muda')}
                            </label>
                            <input
                                type="datetime-local"
                                value={viewingDate}
                                onChange={(e) => setViewingDate(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-extrabold uppercase text-slate-500 mb-1">
                                {t('Note to Property Owner', 'Ujumbe kwa Mmiliki')}
                            </label>
                            <textarea
                                rows={2}
                                value={viewingNote}
                                onChange={(e) => setViewingNote(e.target.value)}
                                placeholder={t('I would like to inspect the unit and LUKU meter...', 'Ningependa kuona nyumba na mita ya LUKU...')}
                                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm cursor-pointer"
                        >
                            {t('Confirm Viewing Appointment', 'Thibitisha Miadi')}
                        </button>
                    </form>
                </div>
            )}

            {/* Floating Toast Notification */}
            {toast && (
                <div className="fixed bottom-20 lg:bottom-6 right-6 z-50 max-w-sm bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-start gap-3 animate-fadeIn">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                        <div className="text-xs font-black">{toast.title}</div>
                        <div className="text-xs text-slate-300 mt-0.5">{toast.body}</div>
                    </div>
                </div>
            )}
        </div>
    );
}

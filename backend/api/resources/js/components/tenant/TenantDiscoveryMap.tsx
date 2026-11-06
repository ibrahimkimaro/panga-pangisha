import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    BadgeCheck, Bath, BedDouble, Compass, Eye, Heart, Layers,
    LocateFixed, MapPin, MessageSquare, Navigation, RotateCcw,
    Sparkles, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, FileSignature
} from 'lucide-react';

export interface MapPropertyItem {
    id: number;
    property_name: string;
    property_type: string;
    description?: string;
    region?: string;
    district: string;
    ward: string;
    street_address?: string;
    napa_number?: string;
    bedrooms: number;
    bathrooms: number;
    square_feet?: number;
    monthly_rent: number;
    security_deposit?: number;
    cover_image: string;
    photos?: string[];
    verified_at?: string | null;
    advertiser_role?: string;
    amenities: string[];
    lat: number;
    lng: number;
    owner?: {
        id?: number;
        uuid?: string;
        name: string;
        phone: string;
    };
    vacant_units: number;
    total_units: number;
}

interface TenantDiscoveryMapProps {
    houses: MapPropertyItem[];
    lang: 'en' | 'sw';
    likedHouses: number[];
    likedRooms: number[];
    onSelectProperty: (house: MapPropertyItem) => void;
    onOpenMkataba: (house: MapPropertyItem) => void;
    onOpenLikeChooser: (house: MapPropertyItem) => void;
    onScheduleViewing: (house: MapPropertyItem) => void;
    onChatWithOwner: (house: MapPropertyItem) => void;
}

const DAR_ENCLAVES = [
    { label: 'All Dar es Salaam', lat: -6.7720, lng: 39.2600, zoom: 13 },
    { label: 'Mikocheni', lat: -6.7685, lng: 39.2520, zoom: 15 },
    { label: 'Masaki Peninsula', lat: -6.7512, lng: 39.2794, zoom: 15 },
    { label: 'Oysterbay', lat: -6.7740, lng: 39.2660, zoom: 15 },
    { label: 'Sinza & Kijitonyama', lat: -6.7815, lng: 39.2245, zoom: 15 },
    { label: 'Mbezi Beach', lat: -6.7320, lng: 39.2180, zoom: 14 },
    { label: 'Upanga', lat: -6.8160, lng: 39.2890, zoom: 15 },
];

export default function TenantDiscoveryMap({
    houses,
    lang,
    likedHouses,
    likedRooms,
    onSelectProperty,
    onOpenMkataba,
    onOpenLikeChooser,
    onScheduleViewing,
    onChatWithOwner,
}: TenantDiscoveryMapProps) {
    const t = (en: string, sw: string) => (lang === 'sw' ? sw : en);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const tileLayerRef = useRef<L.TileLayer | null>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);
    const cardsScrollRef = useRef<HTMLDivElement>(null);

    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [layerType, setLayerType] = useState<'voyager' | 'satellite' | 'osm'>('voyager');
    const [activeEnclave, setActiveEnclave] = useState<string>('All Dar es Salaam');
    const [locating, setLocating] = useState<boolean>(false);

    const formatShortPrice = (amount: number) => {
        if (amount >= 1_000_000) {
            return `TZS ${(amount / 1_000_000).toFixed(1)}M`;
        }
        return `TZS ${Math.round(amount / 1000)}k`;
    };

    const formatTZS = (amount: number) => `TZS ${Number(amount || 0).toLocaleString('en-US')}`;

    // Initialize map once
    useEffect(() => {
        if (!mapContainerRef.current) return;

        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        const initialCenter: [number, number] =
            houses.length > 0 ? [houses[0].lat, houses[0].lng] : [-6.7685, 39.2520];

        const map = L.map(mapContainerRef.current, {
            center: initialCenter,
            zoom: 13.5,
            zoomControl: false,
            attributionControl: false,
        });

        const tileLayer = L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
            {
                maxZoom: 19,
                subdomains: 'abcd',
            }
        ).addTo(map);

        const markersGroup = L.layerGroup().addTo(map);

        tileLayerRef.current = tileLayer;
        markersLayerRef.current = markersGroup;
        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    // Render price pin markers whenever houses or selectedIndex changes
    useEffect(() => {
        const map = mapInstanceRef.current;
        const markersGroup = markersLayerRef.current;
        if (!map || !markersGroup) return;

        markersGroup.clearLayers();

        houses.forEach((house, idx) => {
            const isSelected = idx === selectedIndex;
            const shortPrice = formatShortPrice(house.monthly_rent);
            const isVerified = Boolean(house.verified_at);

            const pinHtml = `
                <div style="
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: ${isSelected ? '7px 13px' : '5px 10px'};
                    border-radius: 9999px;
                    background: ${isSelected ? '#059669' : '#0f172a'};
                    color: #ffffff;
                    font-family: inherit;
                    font-size: ${isSelected ? '12px' : '11px'};
                    font-weight: 800;
                    white-space: nowrap;
                    border: 2px solid ${isSelected ? '#a7f3d0' : '#ffffff'};
                    box-shadow: ${isSelected ? '0 10px 25px -4px rgba(5, 150, 105, 0.65)' : '0 4px 14px rgba(15, 23, 42, 0.35)'};
                    transform: ${isSelected ? 'scale(1.12) translateY(-3px)' : 'scale(1)'};
                    transition: all 0.2s ease;
                    cursor: pointer;
                ">
                    <span style="width: 7px; height: 7px; border-radius: 50%; background: ${isVerified ? '#34d399' : '#fbbf24'}; display: inline-block;"></span>
                    <span>${shortPrice}</span>
                </div>
            `;

            const icon = L.divIcon({
                className: 'tenant-price-pin-marker',
                html: pinHtml,
                iconSize: [110, 36],
                iconAnchor: [55, 18],
            });

            const marker = L.marker([house.lat, house.lng], { icon }).addTo(markersGroup);
            marker.on('click', () => {
                setSelectedIndex(idx);
                map.flyTo([house.lat, house.lng], 15.5, { duration: 0.9 });
                // Scroll carousel to card
                const cardEl = document.getElementById(`map-carousel-card-${house.id}`);
                cardEl?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            });
        });
    }, [houses, selectedIndex]);

    const switchTileLayer = (type: 'voyager' | 'satellite' | 'osm') => {
        const map = mapInstanceRef.current;
        if (!map) return;
        if (tileLayerRef.current) {
            map.removeLayer(tileLayerRef.current);
        }

        let url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        let subdomains = 'abcd';
        if (type === 'satellite') {
            url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
            subdomains = 'abc';
        } else if (type === 'osm') {
            url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
            subdomains = 'abc';
        }

        const nextLayer = L.tileLayer(url, { maxZoom: 19, subdomains }).addTo(map);
        tileLayerRef.current = nextLayer;
        setLayerType(type);
    };

    const handleSelectCard = (idx: number) => {
        setSelectedIndex(idx);
        const house = houses[idx];
        if (house && mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([house.lat, house.lng], 15.5, { duration: 0.9 });
        }
    };

    const handleNearMe = () => {
        setLocating(true);
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLocating(false);
                    mapInstanceRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 15, { duration: 1.1 });
                },
                () => {
                    setLocating(false);
                    // Fallback to Mikocheni / Dar center
                    mapInstanceRef.current?.flyTo([-6.7685, 39.2520], 14.5, { duration: 1.1 });
                },
                { timeout: 5000 }
            );
        } else {
            setLocating(false);
            mapInstanceRef.current?.flyTo([-6.7685, 39.2520], 14.5, { duration: 1.1 });
        }
    };

    const selectedHouse = houses[selectedIndex] || houses[0] || null;

    return (
        <div className="space-y-4">
            {/* Top Enclave Quick-Jump Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold shrink-0">
                        <Compass className="w-3.5 h-3.5" />
                        {t('Explore Enclaves:', 'Mitaa ya Dar:')}
                    </span>
                    {DAR_ENCLAVES.map((enc) => (
                        <button
                            key={enc.label}
                            type="button"
                            onClick={() => {
                                setActiveEnclave(enc.label);
                                mapInstanceRef.current?.flyTo([enc.lat, enc.lng], enc.zoom, { duration: 1.0 });
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                                activeEnclave === enc.label
                                    ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            {enc.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {houses.length} {t('Verified Pins on Map', 'Nyumba kwenye Ramani')}
                    </span>
                </div>
            </div>

            {/* Interactive Map Viewport + Overlay Controls + Synced Bottom Property Carousel */}
            <div className="relative w-full h-[640px] sm:h-[700px] rounded-3xl overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-xl bg-slate-100 dark:bg-slate-900">
                {/* Leaflet Canvas */}
                <div ref={mapContainerRef} className="w-full h-full z-0" />

                {/* Top Left Status Pill */}
                <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 pointer-events-none">
                    <div className="px-4 py-2 rounded-2xl bg-slate-900/90 backdrop-blur-md text-white text-xs font-extrabold flex items-center gap-2 shadow-lg border border-white/15">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{t('Dar es Salaam Live Rent Map', 'Ramani ya Nyumba Dar es Salaam')}</span>
                    </div>
                    {selectedHouse && (
                        <div className="hidden md:flex px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-900 dark:text-white text-xs font-bold items-center gap-1.5 shadow-md border border-slate-200/70 dark:border-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{selectedHouse.property_name} • { formatShortPrice(selectedHouse.monthly_rent) }/mo</span>
                        </div>
                    )}
                </div>

                {/* Top Right Map Layer Switcher */}
                <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
                    {(['voyager', 'satellite', 'osm'] as const).map((mode) => (
                        <button
                            key={mode}
                            type="button"
                            onClick={() => switchTileLayer(mode)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold capitalize transition-all cursor-pointer ${
                                layerType === mode
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            {mode === 'voyager' ? t('Editorial', 'Kisasa') : mode === 'satellite' ? t('Satellite', 'Satelaiti') : 'OSM'}
                        </button>
                    ))}
                </div>

                {/* Right Floating GPS & Zoom Controls */}
                <div className="absolute right-4 top-20 z-10 flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={handleNearMe}
                        title={t('Find Near Me', 'Karibu Nami')}
                        className="w-11 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg flex items-center justify-center transition-all cursor-pointer"
                    >
                        <LocateFixed className={`w-5 h-5 ${locating ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        type="button"
                        onClick={() => mapInstanceRef.current?.zoomIn()}
                        className="w-11 h-11 rounded-2xl bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 hover:bg-white border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center transition-all cursor-pointer"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => mapInstanceRef.current?.zoomOut()}
                        className="w-11 h-11 rounded-2xl bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 hover:bg-white border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center transition-all cursor-pointer"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (selectedHouse) {
                                mapInstanceRef.current?.flyTo([selectedHouse.lat, selectedHouse.lng], 15, { duration: 0.9 });
                            }
                        }}
                        className="w-11 h-11 rounded-2xl bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 hover:bg-white border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center transition-all cursor-pointer"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>

                {/* Bottom Synced Horizontal Carousel of Property Cards (Matches Flutter map.dart PageView) */}
                <div className="absolute bottom-4 left-0 right-0 z-10 px-4">
                    <div
                        ref={cardsScrollRef}
                        className="flex items-stretch gap-4 overflow-x-auto pb-2 snap-x snap-mandatory no-scrollbar"
                    >
                        {houses.map((house, idx) => {
                            const isSelected = idx === selectedIndex;
                            const isSaved = likedHouses.includes(house.id) || likedRooms.includes(house.id);

                            return (
                                <div
                                    id={`map-carousel-card-${house.id}`}
                                    key={house.id}
                                    onClick={() => handleSelectCard(idx)}
                                    className={`snap-center shrink-0 w-[330px] sm:w-[390px] rounded-2xl p-3.5 transition-all cursor-pointer backdrop-blur-xl border ${
                                        isSelected
                                            ? 'bg-white/98 dark:bg-slate-900/98 border-emerald-500 ring-2 ring-emerald-500/30 shadow-2xl -translate-y-1'
                                            : 'bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 shadow-lg hover:bg-white dark:hover:bg-slate-900'
                                    }`}
                                >
                                    <div className="flex gap-3.5">
                                        {/* Thumbnail */}
                                        <div className="relative w-28 h-28 rounded-xl overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-800">
                                            <img
                                                src={house.cover_image}
                                                alt={house.property_name}
                                                className="w-full h-full object-cover"
                                            />
                                            <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-slate-900/85 text-white text-[10px] font-extrabold flex items-center gap-1">
                                                <BadgeCheck className="w-3 h-3 text-emerald-400" />
                                                {house.property_type}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onOpenLikeChooser(house);
                                                }}
                                                className={`absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center shadow-sm transition-colors cursor-pointer ${
                                                    isSaved
                                                        ? 'bg-rose-500 text-white'
                                                        : 'bg-slate-900/75 text-white hover:bg-rose-500'
                                                }`}
                                            >
                                                <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                                            </button>
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-start justify-between gap-1">
                                                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                                                        {house.property_name}
                                                    </h4>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                                                    <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                                                    {house.ward}, {house.district}
                                                </p>
                                                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1">
                                                    {formatTZS(house.monthly_rent)}
                                                    <span className="text-[11px] font-semibold text-slate-400"> /{t('mo', 'mwezi')}</span>
                                                </p>
                                            </div>

                                            {/* Specs & Quick Actions */}
                                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                                    <span className="inline-flex items-center gap-1">
                                                        <BedDouble className="w-3.5 h-3.5 text-emerald-600" />
                                                        {house.bedrooms}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1">
                                                        <Bath className="w-3.5 h-3.5 text-emerald-600" />
                                                        {house.bathrooms}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onOpenMkataba(house);
                                                        }}
                                                        className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold hover:bg-emerald-100 transition-colors cursor-pointer"
                                                    >
                                                        {t('Mkataba', 'Mkataba')}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onSelectProperty(house);
                                                        }}
                                                        className="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-emerald-600 text-white text-[11px] font-extrabold hover:bg-emerald-600 transition-colors cursor-pointer"
                                                    >
                                                        {t('Open', 'Fungua')}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

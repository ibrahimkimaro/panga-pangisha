import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, Navigation, ZoomIn, ZoomOut, RotateCcw, MapPin } from 'lucide-react';

interface PropertyMapProps {
    propertyName: string;
    locationName: string;
    district?: string | null;
    ward?: string | null;
    rentDisplay?: string;
    heightClassName?: string;
}

// Approximate geo coordinates for major Dar es Salaam districts/wards
function resolveCoordinates(district?: string | null, ward?: string | null): [number, number] {
    const text = `${ward || ''} ${district || ''}`.toLowerCase();
    if (text.includes('masaki') || text.includes('peninsula')) return [-6.7533, 39.2783];
    if (text.includes('oysterbay') || text.includes('oyster bay')) return [-6.7725, 39.2750];
    if (text.includes('mikocheni')) return [-6.7686, 39.2458];
    if (text.includes('upanga')) return [-6.8080, 39.2800];
    if (text.includes('kinondoni')) return [-6.7820, 39.2620];
    if (text.includes('sinza')) return [-6.7800, 39.2200];
    if (text.includes('mbezi beach') || text.includes('mbezi')) return [-6.6900, 39.2200];
    if (text.includes('kijitonyama')) return [-6.7750, 39.2420];
    if (text.includes('kawe')) return [-6.7350, 39.2300];
    if (text.includes('kigamboni')) return [-6.8400, 39.3100];
    if (text.includes('ilala')) return [-6.8200, 39.2600];
    if (text.includes('temeke')) return [-6.8600, 39.2600];
    return [-6.7650, 39.2600]; // Default affluent coastal Dar es Salaam
}

export default function PropertyMap({
    propertyName,
    locationName,
    district,
    ward,
    rentDisplay,
    heightClassName = 'h-96 sm:h-[460px]',
}: PropertyMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const tileLayerRef = useRef<L.TileLayer | null>(null);
    const [layerType, setLayerType] = useState<'voyager' | 'satellite' | 'streets'>('voyager');

    const coords = resolveCoordinates(district, ward);

    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Cleanup any existing instance
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        // Initialize Leaflet map
        const map = L.map(mapContainerRef.current, {
            center: coords,
            zoom: 15,
            zoomControl: false,
            attributionControl: false,
            scrollWheelZoom: false,
        });

        // Add CartoDB Voyager tiles (crisp, elegant, boutique architectural style)
        const tileLayer = L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
            {
                maxZoom: 19,
                subdomains: 'abcd',
            }
        ).addTo(map);

        tileLayerRef.current = tileLayer;

        // Custom pulsing marker icon
        const customIcon = L.divIcon({
            className: 'custom-property-pin',
            html: `
                <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
                    <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: rgba(15, 118, 110, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                    <div style="position: relative; width: 34px; height: 34px; border-radius: 50%; background: #12161A; border: 3px solid #FAF8F5; box-shadow: 0 4px 14px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: #F5D485;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                    </div>
                </div>
            `,
            iconSize: [44, 44],
            iconAnchor: [22, 44],
            popupAnchor: [0, -42],
        });

        const marker = L.marker(coords, { icon: customIcon }).addTo(map);

        // Interactive popup
        marker.bindPopup(`
            <div style="font-family: inherit; padding: 6px 2px; min-width: 170px;">
                <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #0F766E; letter-spacing: 0.05em; margin-bottom: 2px;">
                    Verified Residence
                </div>
                <div style="font-size: 13px; font-weight: 700; color: #12161A; line-height: 1.2;">
                    ${propertyName}
                </div>
                <div style="font-size: 11px; color: #706861; margin-top: 2px;">
                    ${locationName}
                </div>
                ${
                    rentDisplay
                        ? `<div style="margin-top: 6px; font-size: 12px; font-weight: 800; color: #C2704E;">${rentDisplay}</div>`
                        : ''
                }
            </div>
        `).openPopup();

        // 1km Walkable Enclave Radius Ring
        L.circle(coords, {
            radius: 700,
            color: '#0F766E',
            fillColor: '#0F766E',
            fillOpacity: 0.06,
            weight: 1.5,
            dashArray: '4, 6',
        }).addTo(map);

        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, [coords[0], coords[1]]);

    // Switch map tile layers
    const switchLayer = (type: 'voyager' | 'satellite' | 'streets') => {
        const map = mapInstanceRef.current;
        if (!map) return;

        if (tileLayerRef.current) {
            map.removeLayer(tileLayerRef.current);
        }

        let newTileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        let subdomains = 'abcd';

        if (type === 'satellite') {
            newTileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
            subdomains = 'abc';
        } else if (type === 'streets') {
            newTileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
            subdomains = 'abc';
        }

        const newLayer = L.tileLayer(newTileUrl, {
            maxZoom: 19,
            subdomains,
        }).addTo(map);

        tileLayerRef.current = newLayer;
        setLayerType(type);
    };

    const handleZoomIn = () => {
        mapInstanceRef.current?.zoomIn();
    };

    const handleZoomOut = () => {
        mapInstanceRef.current?.zoomOut();
    };

    const handleResetCenter = () => {
        mapInstanceRef.current?.flyTo(coords, 15, { duration: 1.2 });
    };

    return (
        <div className={`relative w-full ${heightClassName} rounded-3xl overflow-hidden border border-[#EBE7E1] bg-[#FAF8F5] shadow-lg group`}>
            {/* The Actual Leaflet Map Canvas */}
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Top Left Badge: Exact Location Enclave */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none flex items-center gap-2">
                <span className="rounded-full bg-[#12161A]/85 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-white shadow-md flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-[#F5D485]" />
                    <span>{locationName}</span>
                </span>
                <span className="hidden sm:inline-flex rounded-full bg-emerald-950/80 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-emerald-300 shadow-md items-center gap-1.5">
                    <Navigation className="h-3 w-3" />
                    <span>Walkable 700m Enclave</span>
                </span>
            </div>

            {/* Top Right: Layer Switcher (Voyager, Satellite, Streets) */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1 rounded-2xl border border-[#EBE7E1] shadow-md">
                <button
                    type="button"
                    onClick={() => switchLayer('voyager')}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        layerType === 'voyager'
                            ? 'bg-[#12161A] text-white shadow-xs'
                            : 'text-[#706861] hover:text-[#12161A] hover:bg-black/5'
                    }`}
                >
                    Editorial
                </button>
                <button
                    type="button"
                    onClick={() => switchLayer('satellite')}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        layerType === 'satellite'
                            ? 'bg-[#12161A] text-white shadow-xs'
                            : 'text-[#706861] hover:text-[#12161A] hover:bg-black/5'
                    }`}
                >
                    Satellite
                </button>
                <button
                    type="button"
                    onClick={() => switchLayer('streets')}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        layerType === 'streets'
                            ? 'bg-[#12161A] text-white shadow-xs'
                            : 'text-[#706861] hover:text-[#12161A] hover:bg-black/5'
                    }`}
                >
                    OSM
                </button>
            </div>

            {/* Bottom Right: Interactive Zoom & Center Controls */}
            <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5">
                <button
                    type="button"
                    onClick={handleResetCenter}
                    title="Recenter Map"
                    className="h-9 w-9 rounded-xl bg-white/95 backdrop-blur-md border border-[#EBE7E1] text-[#12161A] hover:bg-white shadow-md flex items-center justify-center transition-all cursor-pointer"
                >
                    <RotateCcw className="h-4 w-4" />
                </button>
                <div className="flex flex-col rounded-xl bg-white/95 backdrop-blur-md border border-[#EBE7E1] shadow-md overflow-hidden">
                    <button
                        type="button"
                        onClick={handleZoomIn}
                        title="Zoom In"
                        className="h-9 w-9 text-[#12161A] hover:bg-black/5 flex items-center justify-center border-b border-[#EBE7E1] transition-all cursor-pointer"
                    >
                        <ZoomIn className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={handleZoomOut}
                        title="Zoom Out"
                        className="h-9 w-9 text-[#12161A] hover:bg-black/5 flex items-center justify-center transition-all cursor-pointer"
                    >
                        <ZoomOut className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Bottom Left: Coordinates Watermark */}
            <div className="absolute bottom-4 left-4 z-10 pointer-events-none hidden sm:block">
                <span className="text-[10px] text-[#706861] font-mono bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-[#EBE7E1]/80">
                    GPS: {coords[0].toFixed(4)}° S, {coords[1].toFixed(4)}° E • Leaflet Engine
                </span>
            </div>
        </div>
    );
}

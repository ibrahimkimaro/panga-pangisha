import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, Plus, Search, MapPin, Bed, Bath, ArrowUpRight, CheckCircle2, ChevronRight,
    Users, Wallet, Eye, MoreHorizontal, FileText, Check, X, Sparkles,
    Zap, Navigation, ExternalLink, ArrowLeft, Edit3, Shield, Droplets,
    Wifi, Car, Home, Layers, Key, CheckCircle, Info, CalendarCheck,
    DoorClosed, Hotel, Compass, AlertCircle, Image as ImageIcon, Trash2, Sliders, ShieldCheck, Tag
} from 'lucide-react';
import { TANZANIA_REGIONS } from '../../../data/tanzaniaLocations';

export interface WizardTemplateItem {
    id: string;
    name: string;
    unit_type: string;
    quantity: number;
    default_rent: number;
    payment_terms: string;
    is_private_bath: boolean;
    kitchen: 'private' | 'shared' | 'none';
    furnishing: 'unfurnished' | 'semi' | 'full';
}

export interface WizardGeneratedUnit {
    id: number | string;
    template_id?: string;
    unit_number: string;
    unit_type: string;
    monthly_rent: number;
    payment_terms: string;
    is_private_bath: boolean;
    floor: string;
    description: string;
    is_customized?: boolean;
}

export interface CompoundUnit {
    id?: number;
    unit_number: string;
    unit_type?: string;
    monthly_rent?: number;
    status?: string;
    description?: string;
    payment_terms?: string;
}

export interface CompoundHouse {
    id: number;
    name: string;
    type: string;
    rental_mode: 'entire' | 'rooms' | 'apartments' | 'commercial';
    specs: string;
    bedrooms?: number;
    bathrooms?: number;
    monthly_rent: number;
    status: string;
    units?: CompoundUnit[];
}

export interface CompoundItem {
    id: number;
    name: string;
    compound_type: string;
    location: string;
    region?: string;
    district?: string;
    ward?: string;
    street?: string;
    house_number?: string;
    napa_number?: string;
    latitude?: number;
    longitude?: number;
    description?: string;
    amenities: string[];
    cover_image: string;
    total_buildings: number;
    total_units: number;
    occupied_units: number;
    vacant_units: number;
    monthly_revenue: number;
    status: string;
    houses: CompoundHouse[];
}

interface CompoundsViewProps {
    compounds: CompoundItem[];
    onOpenAddStandaloneProperty?: () => void;
}

const DEFAULT_COMPOUNDS: CompoundItem[] = [
    {
        id: 1,
        name: 'Goba Executive Compound',
        compound_type: 'Gated Residential Compound',
        location: 'Goba, Kinondoni, Dar es Salaam',
        region: 'Dar es Salaam',
        district: 'Kinondoni',
        ward: 'Goba',
        street: 'Tegeta A Road, Goba Center',
        house_number: 'Plot 418/Block 2',
        napa_number: 'TZ-DAR-KIN-GOB-0418',
        latitude: -6.7320,
        longitude: 39.1820,
        description: 'Secure gated compound in Goba with 3 standalone residential bungalows and 1 shared multi-room home with dedicated STS LUKU submeters and perimeter security.',
        amenities: ['Fenced Perimeter', '24/7 Security Guard', 'Borehole Water & DAWASA', 'Paved Parking (6+ Cars)', 'Electric Sliding Gate', 'Standby Generator'],
        cover_image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
        total_buildings: 4,
        total_units: 6,
        occupied_units: 5,
        vacant_units: 1,
        monthly_revenue: 1850000,
        status: 'Active & Verified',
        houses: [
            {
                id: 101,
                name: 'Bungalow 1 (Main Villa)',
                type: 'Standalone House',
                rental_mode: 'entire',
                specs: '2 Bedrooms • Dining Room • Sitting Room • Modern Kitchen',
                bedrooms: 2,
                bathrooms: 1,
                monthly_rent: 450000,
                status: 'occupied',
                units: [
                    { id: 1001, unit_number: 'Full House', unit_type: 'Standalone House', monthly_rent: 450000, status: 'occupied', description: '2 Bedrooms + Dining Room' }
                ]
            },
            {
                id: 102,
                name: 'Bungalow 2 (Garden View)',
                type: 'Standalone House',
                rental_mode: 'entire',
                specs: '2 Bedrooms • Dining Room • Sitting Room • Modern Kitchen',
                bedrooms: 2,
                bathrooms: 1,
                monthly_rent: 450000,
                status: 'occupied',
                units: [
                    { id: 1002, unit_number: 'Full House', unit_type: 'Standalone House', monthly_rent: 450000, status: 'occupied', description: '2 Bedrooms + Dining Room' }
                ]
            },
            {
                id: 103,
                name: 'Bungalow 3 (Corner House)',
                type: 'Standalone House',
                rental_mode: 'entire',
                specs: '2 Bedrooms • Dining Room • Sitting Room • Modern Kitchen',
                bedrooms: 2,
                bathrooms: 1,
                monthly_rent: 450000,
                status: 'vacant',
                units: [
                    { id: 1003, unit_number: 'Full House', unit_type: 'Standalone House', monthly_rent: 450000, status: 'vacant', description: '2 Bedrooms + Dining Room' }
                ]
            },
            {
                id: 104,
                name: 'House 4 (Room Rental House)',
                type: 'Shared House',
                rental_mode: 'rooms',
                specs: '3 Bedrooms (1 Master + 2 Standard) • Shared Lounge & Kitchen',
                bedrooms: 3,
                bathrooms: 2,
                monthly_rent: 500000,
                status: 'partially_occupied',
                units: [
                    { id: 1004, unit_number: 'Room 1 (Master Bedroom)', unit_type: 'Master Suite', monthly_rent: 200000, status: 'occupied', description: 'En-suite master bedroom with private bath' },
                    { id: 1005, unit_number: 'Room 2 (Standard Bedroom)', unit_type: 'Standard Room', monthly_rent: 150000, status: 'occupied', description: 'Standard room with shared bath' },
                    { id: 1006, unit_number: 'Room 3 (Standard Bedroom)', unit_type: 'Standard Room', monthly_rent: 150000, status: 'vacant', description: 'Standard room with shared bath' }
                ]
            }
        ]
    },
    {
        id: 2,
        name: 'Sinza Prime Compound',
        compound_type: 'Gated Residential Site',
        location: 'Sinza, Kinondoni, Dar es Salaam',
        region: 'Dar es Salaam',
        district: 'Kinondoni',
        ward: 'Sinza',
        street: 'Mori Road, Near Sinza Mori',
        house_number: 'Plot 82/Sinza D',
        napa_number: 'TZ-DAR-KIN-SIN-0082',
        latitude: -6.7812,
        longitude: 39.2291,
        description: 'Prime paved compound in Sinza with 1 modern 2-flat apartment building and 1 standalone family house with dedicated LUKU submeters and reserve water tanks.',
        amenities: ['Perimeter Wall & Razor Wire', 'DAWASA Water & Underground Reserve Tank', 'Paved Driveway (4 Cars)', 'Dedicated LUKU Submeters', 'Night Guard'],
        cover_image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
        total_buildings: 2,
        total_units: 3,
        occupied_units: 3,
        vacant_units: 0,
        monthly_revenue: 1750000,
        status: 'Active & Verified',
        houses: [
            {
                id: 201,
                name: 'Sinza Apartments Block',
                type: 'Apartment',
                rental_mode: 'apartments',
                specs: '2 Executive 2-Bedroom Flats • Balconies • Fitted Kitchens',
                bedrooms: 4,
                bathrooms: 2,
                monthly_rent: 1200000,
                status: 'occupied',
                units: [
                    { id: 2001, unit_number: 'Apartment 1A (Upper Flat)', unit_type: '2-Bedroom Apartment', monthly_rent: 600000, status: 'occupied', description: 'Upper floor apartment with private balcony' },
                    { id: 2002, unit_number: 'Apartment 1B (Ground Flat)', unit_type: '2-Bedroom Apartment', monthly_rent: 600000, status: 'occupied', description: 'Ground floor apartment with garden access' }
                ]
            },
            {
                id: 202,
                name: 'Sinza Family Bungalow',
                type: 'Standalone House',
                rental_mode: 'entire',
                specs: '3 Bedrooms • 2 Bathrooms • Sitting & Dining • Store',
                bedrooms: 3,
                bathrooms: 2,
                monthly_rent: 550000,
                status: 'occupied',
                units: [
                    { id: 2003, unit_number: 'Full House', unit_type: 'Standalone House', monthly_rent: 550000, status: 'occupied', description: '3 Bedrooms, Sitting & Dining Room' }
                ]
            }
        ]
    }
];

export default function CompoundsView({ compounds: initialCompounds, onOpenAddStandaloneProperty }: CompoundsViewProps) {
    const [compoundsList, setCompoundsList] = useState<CompoundItem[]>(
        initialCompounds && initialCompounds.length > 0 ? initialCompounds : DEFAULT_COMPOUNDS
    );
    const [selectedCompound, setSelectedCompound] = useState<CompoundItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Modals
    const [isAddCompoundModalOpen, setIsAddCompoundModalOpen] = useState(false);
    const [isHouseWizardOpen, setIsHouseWizardOpen] = useState(false);

    // Add Compound Form State
    const [newCompoundForm, setNewCompoundForm] = useState({
        name: '',
        compound_type: 'Gated Residential Compound',
        region: 'Dar es Salaam',
        district: 'Kinondoni',
        ward: 'Goba',
        street: '',
        house_number: '',
        description: '',
        amenities: ['Fenced Perimeter', '24/7 Security Guard', 'Borehole Water & DAWASA', 'Paved Parking'],
    });

    // 10-Step House Creation Wizard State
    const [wizardStep, setWizardStep] = useState(0); // 0 to 9 (Steps 1 to 10)
    const [wizardDraft, setWizardDraft] = useState({
        // Step 1: Mode & Category
        rental_mode: 'entire' as 'entire' | 'multi_unit' | 'rooms',
        category: 'Standalone House',

        // Step 2: Details & Amenities
        house_name: '',
        description: '',
        advertiser_role: 'owner', // 'owner' or 'representative'
        shared_amenities: ['Water', 'LUKU', 'Security', 'Fence', 'Parking', 'Tiles'] as string[],

        // Step 3: Location, Address & NAPA Postal Code
        region: 'Dar es Salaam',
        district: 'Kinondoni',
        ward: 'Goba',
        street: 'Tegeta A Road',
        house_number: 'Plot 418',
        napa_number: 'TZ-DAR-KIN-GOB-0418',
        latitude: -6.7320,
        longitude: 39.1820,

        // Step 4: Structure & Templates
        floors: 1,
        templates: [
            {
                id: 'tmpl_1',
                name: 'Master Suite',
                unit_type: 'Master Bedroom',
                quantity: 1,
                default_rent: 200000,
                payment_terms: '4 months advance',
                is_private_bath: true,
                kitchen: 'shared',
                furnishing: 'unfurnished',
            },
            {
                id: 'tmpl_2',
                name: 'Standard Room',
                unit_type: 'Standard Room',
                quantity: 2,
                default_rent: 150000,
                payment_terms: '4 months advance',
                is_private_bath: false,
                kitchen: 'shared',
                furnishing: 'unfurnished',
            },
        ] as WizardTemplateItem[],

        // Step 6 & 7: Generated Units & Overrides
        units: [
            {
                id: 'unit_1',
                template_id: 'tmpl_1',
                unit_number: 'Room 1 (Master Bedroom)',
                unit_type: 'Master Suite',
                monthly_rent: 200000,
                payment_terms: '4 months advance',
                is_private_bath: true,
                floor: 'Ground Floor',
                description: 'Master bedroom with private ensuite bathroom',
                is_customized: false,
            },
            {
                id: 'unit_2',
                template_id: 'tmpl_2',
                unit_number: 'Room 2 (Standard Bedroom)',
                unit_type: 'Standard Room',
                monthly_rent: 150000,
                payment_terms: '4 months advance',
                is_private_bath: false,
                floor: 'Ground Floor',
                description: 'Standard bedroom with shared bathroom',
                is_customized: false,
            },
            {
                id: 'unit_3',
                template_id: 'tmpl_2',
                unit_number: 'Room 3 (Standard Bedroom)',
                unit_type: 'Standard Room',
                monthly_rent: 150000,
                payment_terms: '4 months advance',
                is_private_bath: false,
                floor: 'Ground Floor',
                description: 'Standard bedroom with shared bathroom',
                is_customized: false,
            },
        ] as WizardGeneratedUnit[],
        unit_search: '',
        selected_override_index: 0,

        // Step 8: Photos & Documents
        cover_image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',
        has_title_deed: true,

        // Step 9: Rental Terms & Payment Settings
        overall_rent: 450000,
        security_deposit: 450000,
        lease_duration: '6 months advance',
        viewing_arrangement: 'By Appointment',
        available_date: 'Immediately',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4000);
    };

    const formatTZS = (num: number) => {
        return 'TZS ' + Number(num || 0).toLocaleString();
    };

    const filteredCompounds = compoundsList.filter((c) => {
        const query = searchQuery.toLowerCase();
        return (
            c.name.toLowerCase().includes(query) ||
            c.location.toLowerCase().includes(query) ||
            (c.description || '').toLowerCase().includes(query)
        );
    });

    // Helper: Generate individual units from templates (matches mobile wizard logic)
    const generateUnitsFromDraftTemplates = (
        rentalMode: string,
        templates: WizardTemplateItem[],
        overallRent: number,
        houseName: string,
        category: string,
        advanceTerms: string
    ): WizardGeneratedUnit[] => {
        if (rentalMode === 'entire') {
            return [
                {
                    id: 'entire_1',
                    unit_number: houseName.trim() || 'Main Full House',
                    unit_type: category,
                    monthly_rent: Number(overallRent) || 450000,
                    payment_terms: advanceTerms,
                    is_private_bath: true,
                    floor: 'Ground Floor',
                    description: 'Full self-contained residential house',
                    is_customized: false,
                },
            ];
        }

        const generated: WizardGeneratedUnit[] = [];
        let counter = 1;
        templates.forEach((tmpl) => {
            for (let i = 1; i <= tmpl.quantity; i++) {
                generated.push({
                    id: `unit_${counter}`,
                    template_id: tmpl.id,
                    unit_number: tmpl.quantity > 1 ? `${tmpl.name} ${i}` : tmpl.name,
                    unit_type: tmpl.unit_type,
                    monthly_rent: Number(tmpl.default_rent) || 150000,
                    payment_terms: tmpl.payment_terms || advanceTerms,
                    is_private_bath: tmpl.is_private_bath,
                    floor: 'Ground Floor',
                    description: `${tmpl.is_private_bath ? 'Private ensuite bathroom' : 'Shared bathroom'} • ${tmpl.furnishing}`,
                    is_customized: false,
                });
                counter++;
            }
        });
        return generated;
    };

    // Open House Wizard with Parent Compound's context
    const handleOpenHouseWizard = () => {
        if (!selectedCompound) return;
        setWizardStep(0);
        const initialTemplates: WizardTemplateItem[] = [
            {
                id: 'tmpl_1',
                name: 'Master Suite',
                unit_type: 'Master Bedroom',
                quantity: 1,
                default_rent: 200000,
                payment_terms: '4 months advance',
                is_private_bath: true,
                kitchen: 'shared',
                furnishing: 'unfurnished',
            },
            {
                id: 'tmpl_2',
                name: 'Standard Room',
                unit_type: 'Standard Room',
                quantity: 2,
                default_rent: 150000,
                payment_terms: '4 months advance',
                is_private_bath: false,
                kitchen: 'shared',
                furnishing: 'unfurnished',
            },
        ];

        const initialUnits: WizardGeneratedUnit[] = [
            {
                id: 'unit_1',
                template_id: 'tmpl_1',
                unit_number: 'Room 1 (Master Bedroom)',
                unit_type: 'Master Suite',
                monthly_rent: 200000,
                payment_terms: '4 months advance',
                is_private_bath: true,
                floor: 'Ground Floor',
                description: 'Master bedroom with private ensuite bathroom',
                is_customized: false,
            },
            {
                id: 'unit_2',
                template_id: 'tmpl_2',
                unit_number: 'Room 2 (Standard Bedroom)',
                unit_type: 'Standard Room',
                monthly_rent: 150000,
                payment_terms: '4 months advance',
                is_private_bath: false,
                floor: 'Ground Floor',
                description: 'Standard bedroom with shared bathroom',
                is_customized: false,
            },
            {
                id: 'unit_3',
                template_id: 'tmpl_2',
                unit_number: 'Room 3 (Standard Bedroom)',
                unit_type: 'Standard Room',
                monthly_rent: 150000,
                payment_terms: '4 months advance',
                is_private_bath: false,
                floor: 'Ground Floor',
                description: 'Standard bedroom with shared bathroom',
                is_customized: false,
            },
        ];

        setWizardDraft((prev) => ({
            ...prev,
            house_name: '',
            description: `House inside ${selectedCompound.name}`,
            region: selectedCompound.region || 'Dar es Salaam',
            district: selectedCompound.district || 'Kinondoni',
            ward: selectedCompound.ward || 'Goba',
            street: selectedCompound.street || 'Tegeta A Road',
            house_number: selectedCompound.house_number || 'Plot 418',
            napa_number: selectedCompound.napa_number || 'TZ-DAR-KIN-GOB-0418',
            latitude: selectedCompound.latitude || -6.7320,
            longitude: selectedCompound.longitude || 39.1820,
            shared_amenities: ['Water', 'LUKU', 'Security', 'Fence', 'Parking', 'Tiles'],
            templates: initialTemplates,
            units: initialUnits,
            unit_search: '',
            selected_override_index: 0,
            overall_rent: 450000,
            security_deposit: 450000,
        }));
        setIsHouseWizardOpen(true);
    };

    // Wizard Next Step handler with step validation & units auto-generation
    const handleWizardNext = () => {
        if (wizardStep === 1) {
            if (!wizardDraft.house_name.trim()) {
                showToast('Please enter a property display name.');
                return;
            }
        }

        // When progressing from Structure/Templates (Step 4 & 5) to Review Units (Step 6), regenerate unit roster
        if (wizardStep === 4) {
            const freshUnits = generateUnitsFromDraftTemplates(
                wizardDraft.rental_mode,
                wizardDraft.templates,
                wizardDraft.overall_rent,
                wizardDraft.house_name,
                wizardDraft.category,
                wizardDraft.lease_duration
            );
            setWizardDraft((prev) => ({
                ...prev,
                units: freshUnits,
                selected_override_index: 0,
            }));
        }

        if (wizardStep < 9) {
            setWizardStep((prev) => prev + 1);
        }
    };

    // Handle Creating a New Compound
    const handleCreateCompound = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const newId = Date.now();
        const fullLocation = [newCompoundForm.ward, newCompoundForm.district, newCompoundForm.region].filter(Boolean).join(', ');

        const newCompound: CompoundItem = {
            id: newId,
            name: newCompoundForm.name,
            compound_type: newCompoundForm.compound_type,
            location: fullLocation,
            region: newCompoundForm.region,
            district: newCompoundForm.district,
            ward: newCompoundForm.ward,
            street: newCompoundForm.street,
            house_number: newCompoundForm.house_number,
            description: newCompoundForm.description || `Residential compound in ${fullLocation}`,
            amenities: newCompoundForm.amenities,
            cover_image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
            total_buildings: 0,
            total_units: 0,
            occupied_units: 0,
            vacant_units: 0,
            monthly_revenue: 0,
            status: 'Active & Verified',
            houses: [],
        };

        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            await fetch('/landlord/compounds', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token,
                },
                body: JSON.stringify(newCompoundForm),
            }).catch(() => null);
        } catch (_) { }

        setCompoundsList((prev) => [newCompound, ...prev]);
        setIsSubmitting(false);
        setIsAddCompoundModalOpen(false);
        setSelectedCompound(newCompound);
        showToast(`Compound "${newCompound.name}" created! You can now add houses to it.`);
    };

    // Step 10: Final Publish of House into the Parent Compound
    const handlePublishHouseIntoCompound = async () => {
        if (!selectedCompound) return;
        setIsSubmitting(true);

        const newHouseId = Date.now();
        const isRoomByRoom = wizardDraft.rental_mode === 'rooms';
        const isEntire = wizardDraft.rental_mode === 'entire';

        const unitsList: CompoundUnit[] = [];
        let totalMonthlyRent = wizardDraft.overall_rent;

        if (isEntire) {
            unitsList.push({
                id: newHouseId + 1,
                unit_number: 'Full House',
                unit_type: wizardDraft.category,
                monthly_rent: Number(wizardDraft.overall_rent),
                status: 'available',
                description: 'Complete standalone house',
                payment_terms: wizardDraft.lease_duration,
            });
        } else {
            totalMonthlyRent = 0;
            wizardDraft.units.forEach((u, i) => {
                totalMonthlyRent += Number(u.monthly_rent);
                unitsList.push({
                    id: newHouseId + i + 1,
                    unit_number: u.unit_number,
                    unit_type: u.unit_type,
                    monthly_rent: Number(u.monthly_rent),
                    status: 'available',
                    description: `${u.is_private_bath ? 'Private' : 'Shared'} bathroom • ${u.floor} • ${u.description || ''}`,
                    payment_terms: u.payment_terms || wizardDraft.lease_duration,
                });
            });
        }

        const newHouse: CompoundHouse = {
            id: newHouseId,
            name: wizardDraft.house_name.trim() || `House ${selectedCompound.houses.length + 1}`,
            type: wizardDraft.category,
            rental_mode: isRoomByRoom ? 'rooms' : isEntire ? 'entire' : 'apartments',
            specs: isEntire
                ? `Full House • Dedicated STS Submeter • ${wizardDraft.lease_duration}`
                : `${unitsList.length} Rooms • ${wizardDraft.lease_duration}`,
            bedrooms: isEntire ? 2 : unitsList.length,
            bathrooms: 1,
            monthly_rent: totalMonthlyRent,
            status: 'available',
            units: unitsList,
        };

        const updatedHouses = [...selectedCompound.houses, newHouse];
        const updatedTotalUnits = updatedHouses.reduce((acc, h) => acc + (h.units?.length || 1), 0);
        const updatedRevenue = updatedHouses.reduce((acc, h) => acc + h.monthly_rent, 0);

        const updatedCompound: CompoundItem = {
            ...selectedCompound,
            total_buildings: updatedHouses.length,
            total_units: updatedTotalUnits,
            vacant_units: selectedCompound.vacant_units + unitsList.length,
            monthly_revenue: updatedRevenue,
            houses: updatedHouses,
        };

        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            await fetch(`/landlord/compounds/${selectedCompound.id}/houses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token,
                },
                body: JSON.stringify({
                    property_name: newHouse.name,
                    property_type: newHouse.type,
                    rental_mode: newHouse.rental_mode,
                    monthly_rent: newHouse.monthly_rent,
                    bedrooms: newHouse.bedrooms,
                    bathrooms: newHouse.bathrooms,
                    specs: newHouse.specs,
                    units: unitsList,
                }),
            }).catch(() => null);
        } catch (_) { }

        setSelectedCompound(updatedCompound);
        setCompoundsList((prev) => prev.map((c) => (c.id === selectedCompound.id ? updatedCompound : c)));
        setIsSubmitting(false);
        setIsHouseWizardOpen(false);
        showToast(`"${newHouse.name}" published into ${selectedCompound.name} with ${unitsList.length} rentable spaces!`);
    };

    // Location helpers for form dropdowns
    const selectedRegionObj = TANZANIA_REGIONS.find((r) => r.name.toLowerCase() === newCompoundForm.region.toLowerCase());
    const availableDistricts = selectedRegionObj?.districts || [];
    const selectedDistrictObj = availableDistricts.find((d) => d.name.toLowerCase() === newCompoundForm.district.toLowerCase());
    const availableWards = selectedDistrictObj?.wards || [];

    const totalPortfolioBuildings = compoundsList.reduce((acc, c) => acc + c.total_buildings, 0);
    const totalPortfolioUnits = compoundsList.reduce((acc, c) => acc + c.total_units, 0);
    const totalPortfolioOccupied = compoundsList.reduce((acc, c) => acc + c.occupied_units, 0);
    const totalPortfolioRevenue = compoundsList.reduce((acc, c) => acc + c.monthly_revenue, 0);

    // Step 3 draft location helpers (cascading Tanzania Region -> District -> Ward)
    const draftRegionObj = TANZANIA_REGIONS.find((r) => r.name.toLowerCase() === (wizardDraft.region || '').toLowerCase());
    const draftDistricts = draftRegionObj?.districts || [];
    const draftDistrictObj = draftDistricts.find((d) => d.name.toLowerCase() === (wizardDraft.district || '').toLowerCase());
    const draftWards = draftDistrictObj?.wards || [];

    // Step 4 Template operations
    const handleAddTemplate = () => {
        const newId = `tmpl_${Date.now()}`;
        const newTemplate: WizardTemplateItem = {
            id: newId,
            name: `Category ${wizardDraft.templates.length + 1}`,
            unit_type: 'Standard Room',
            quantity: 1,
            default_rent: 150000,
            payment_terms: '4 months advance',
            is_private_bath: false,
            kitchen: 'shared',
            furnishing: 'unfurnished',
        };
        setWizardDraft((prev) => ({
            ...prev,
            templates: [...prev.templates, newTemplate],
        }));
    };

    const handleRemoveTemplate = (id: string) => {
        if (wizardDraft.templates.length <= 1) {
            showToast('Keep at least one category template.');
            return;
        }
        setWizardDraft((prev) => ({
            ...prev,
            templates: prev.templates.filter((t) => t.id !== id),
        }));
    };

    const stepTitles = [
        '1. Rental Mode & Category',
        '2. Property Details & Amenities',
        '3. Location, Address & NAPA Postal Code',
        '4. Define Property Structure',
        '5. Configure Unit Templates',
        '6. Review Generated Units',
        '7. Unit Overrides & Customization',
        '8. Photos & Verification Documents',
        '9. Rental Terms & Payment Settings',
        '10. Review & Publish',
    ];

    return (
        <div className="space-y-6">
            {/* Global Toast */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-6 right-6 z-[100] flex items-center gap-2 rounded-2xl bg-[#12161A] text-white px-5 py-3 shadow-2xl border border-white/10 text-xs font-semibold"
                    >
                        <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>{toastMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* IF A COMPOUND IS SELECTED: FULL DRILLDOWN SCREEN */}
            {selectedCompound ? (
                <div className="space-y-6">
                    {/* Breadcrumb Navigation & Top Action */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <button
                            onClick={() => setSelectedCompound(null)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Back to Compounds</span>
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleOpenHouseWizard}
                                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
                            >
                                <Plus className="h-4 w-4 text-emerald-400" />
                                <span>+ Add House to this Compound (10-Step Wizard)</span>
                            </button>
                        </div>
                    </div>

                    {/* Compound Summary Card */}
                    <div className="rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
                        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                    <span className="rounded-full bg-slate-900 text-white px-2.5 py-0.5 text-[10px] font-bold">
                                        Parent Site / Compound
                                    </span>
                                    <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
                                        {selectedCompound.status}
                                    </span>
                                    <span className="rounded-full bg-slate-100 text-slate-600 px-2.5 py-0.5 text-[10px] font-semibold">
                                        {selectedCompound.compound_type}
                                    </span>
                                </div>
                                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                                    {selectedCompound.name}
                                </h1>
                                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                                    <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                    <span>{selectedCompound.location} • {selectedCompound.street || 'Gated Main Access'}</span>
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-center shadow-2xs">
                                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Houses / Blocks</span>
                                    <span className="text-base font-extrabold text-slate-900">{selectedCompound.houses.length}</span>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-center shadow-2xs">
                                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Units</span>
                                    <span className="text-base font-extrabold text-slate-900">{selectedCompound.total_units}</span>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-center shadow-2xs">
                                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Occupancy</span>
                                    <span className="text-base font-extrabold text-emerald-600">
                                        {Math.round((selectedCompound.occupied_units / (selectedCompound.total_units || 1)) * 100)}%
                                    </span>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-center shadow-2xs">
                                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Rent</span>
                                    <span className="text-base font-extrabold text-slate-900">{formatTZS(selectedCompound.monthly_revenue)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Shared Facilities Strip */}
                        <div className="px-6 py-3.5 bg-slate-50/50 flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-bold text-slate-500 text-[11px] uppercase mr-2 flex items-center gap-1">
                                <Shield className="h-3.5 w-3.5 text-blue-600" />
                                Shared Facilities:
                            </span>
                            {selectedCompound.amenities.map((amenity, i) => (
                                <span
                                    key={i}
                                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-2xs flex items-center gap-1"
                                >
                                    <Check className="h-3 w-3 text-emerald-500" />
                                    {amenity}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* HOUSES / BUILDINGS INSIDE THIS COMPOUND */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">
                                    Houses & Rentable Spaces in this Compound ({selectedCompound.houses.length})
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Each building is configured as an entire house or room-by-room rental
                                </p>
                            </div>

                            <button
                                onClick={handleOpenHouseWizard}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
                            >
                                <Plus className="h-3.5 w-3.5 text-emerald-600" />
                                <span>+ Add House (Wizard)</span>
                            </button>
                        </div>

                        {selectedCompound.houses.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center space-y-3">
                                <Building2 className="h-10 w-10 text-slate-300 mx-auto" />
                                <h3 className="text-sm font-bold text-slate-700">No houses registered in this compound yet</h3>
                                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                    Click the button below to launch the 10-step wizard and register your first house or room space inside {selectedCompound.name}.
                                </p>
                                <button
                                    onClick={handleOpenHouseWizard}
                                    className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
                                >
                                    Start 10-Step House Wizard
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {selectedCompound.houses.map((house, idx) => {
                                    const isRoomByRoom = house.rental_mode === 'rooms';
                                    const isApartment = house.rental_mode === 'apartments';
                                    const isEntire = house.rental_mode === 'entire';

                                    return (
                                        <div
                                            key={house.id || idx}
                                            className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs space-y-3 hover:border-slate-300 transition-all"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-xl bg-slate-900 text-white p-2.5 shrink-0 shadow-2xs">
                                                        {isRoomByRoom ? (
                                                            <Hotel className="h-4 w-4 text-amber-400" />
                                                        ) : isApartment ? (
                                                            <Building2 className="h-4 w-4 text-purple-400" />
                                                        ) : (
                                                            <Home className="h-4 w-4 text-emerald-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-sm font-extrabold text-slate-900">
                                                                {house.name}
                                                            </h3>
                                                            <span
                                                                className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${isEntire
                                                                    ? 'bg-emerald-100 text-emerald-800'
                                                                    : isRoomByRoom
                                                                        ? 'bg-amber-100 text-amber-900'
                                                                        : 'bg-purple-100 text-purple-900'
                                                                    }`}
                                                            >
                                                                {isEntire
                                                                    ? 'Entire House'
                                                                    : isRoomByRoom
                                                                        ? `Room-by-Room (${house.units?.length || 3} Rooms)`
                                                                        : `Apartment (${house.units?.length || 2} Flats)`}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 font-medium">
                                                            {house.specs || `${house.bedrooms || 2} Bed • ${house.bathrooms || 1} Bath`}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 sm:text-right">
                                                    <div>
                                                        <span className="text-[9px] text-slate-400 font-semibold uppercase block">Rent</span>
                                                        <span className="text-sm font-extrabold text-slate-900">
                                                            {formatTZS(house.monthly_rent)}/mo
                                                        </span>
                                                    </div>
                                                    <span
                                                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${house.status === 'occupied'
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : 'bg-blue-50 text-blue-700'
                                                            }`}
                                                    >
                                                        {house.status === 'occupied' ? 'Occupied' : 'Vacant'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* ROOMS GRID IF ROOM-BY-ROOM */}
                                            {isRoomByRoom && house.units && house.units.length > 0 && (
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                                                    {house.units.map((room, rIdx) => (
                                                        <div
                                                            key={room.id || rIdx}
                                                            className={`rounded-xl border p-2.5 text-xs ${room.status === 'occupied'
                                                                ? 'bg-slate-50/70 border-slate-200'
                                                                : 'bg-emerald-50/50 border-emerald-200'
                                                                }`}
                                                        >
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="font-bold text-slate-900 truncate">
                                                                    {room.unit_number}
                                                                </span>
                                                                <span className={`rounded-full px-1.5 py-0.2 text-[8px] font-bold ${room.status === 'occupied' ? 'bg-slate-200 text-slate-600' : 'bg-emerald-600 text-white'}`}>
                                                                    {room.status === 'occupied' ? 'Occupied' : 'Vacant'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-[11px] text-slate-600">
                                                                <span className="text-slate-400 text-[10px]">Rent</span>
                                                                <strong className="text-slate-900">{formatTZS(room.monthly_rent || 150000)}</strong>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* ENTIRE HOUSE BADGE */}
                                            {isEntire && (
                                                <div className="flex items-center gap-4 text-[11px] text-slate-500 bg-slate-50 rounded-xl px-3 py-1.5">
                                                    <span className="flex items-center gap-1 font-medium text-slate-700">
                                                        <Zap className="h-3 w-3 text-amber-500" />
                                                        Dedicated LUKU Submeter
                                                    </span>
                                                    <span>Single lease contract</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* MAIN SCREEN: COMPACT, SLEEK LUXURY COMPOUND CARDS */
                <div className="space-y-4">
                    {/* Header Strip */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Registered Compounds ({compoundsList.length})
                            </h2>
                            <p className="text-xs text-slate-500">
                                Click any compound to inspect buildings, rooms, tenants, or add a new house
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsAddCompoundModalOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-all cursor-pointer"
                            >
                                <Plus className="h-3.5 w-3.5 text-emerald-400" />
                                <span>+ Add Compound</span>
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter compounds by name or location (e.g. Goba, Sinza)..."
                            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs focus:border-slate-900 focus:outline-none transition-all shadow-2xs"
                        />
                    </div>

                    {/* COMPACT LUXURY CARDS GRID */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {filteredCompounds.map((c) => {
                            const occRate = Math.round((c.occupied_units / (c.total_units || 1)) * 100);

                            return (
                                <motion.div
                                    key={c.id}
                                    whileHover={{ y: -3 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    onClick={() => setSelectedCompound(c)}
                                    className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-neutral-200/80 bg-white p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-neutral-300 hover:shadow-[0_8px_18px_-6px_rgba(0,0,0,0.08)] transition-all cursor-pointer"
                                >
                                    <div>
                                        {/* Compact Full-Width Cover Image */}
                                        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-neutral-100 mb-2">
                                            <img
                                                src={c.cover_image}
                                                alt={c.name}
                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                            <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                                        </div>

                                        {/* Title & Location */}
                                        <div className="mb-2">
                                            <h3 className="text-[11px] font-semibold text-neutral-900 truncate leading-tight group-hover:text-black">
                                                {c.name}
                                            </h3>
                                            <p className="text-[10px] text-neutral-400 flex items-center gap-0.5 truncate mt-0.5">
                                                <MapPin className="h-2.5 w-2.5 shrink-0 text-neutral-400" />
                                                <span className="truncate">{c.location}</span>
                                            </p>
                                        </div>

                                        {/* Micro Stats Row */}
                                        <div className="grid grid-cols-3 rounded-md bg-neutral-50 py-1 px-1 border border-neutral-100 text-center text-[10px] mb-2">
                                            <div>
                                                <span className="text-[8px] uppercase tracking-wider text-neutral-400 block">Units</span>
                                                <strong className="font-semibold text-neutral-800">{c.total_units}</strong>
                                            </div>
                                            <div className="border-x border-neutral-200/60">
                                                <span className="text-[8px] uppercase tracking-wider text-neutral-400 block">Houses</span>
                                                <strong className="font-semibold text-neutral-800">{c.total_buildings}</strong>
                                            </div>
                                            <div>
                                                <span className="text-[8px] uppercase tracking-wider text-neutral-400 block">Occ.</span>
                                                <strong className="font-semibold text-neutral-900">{occRate}%</strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Minimal Footer */}
                                    <div className="pt-1.5 border-t border-neutral-100 flex items-center justify-between">
                                        <div className="leading-none">
                                            <span className="text-[10px] font-bold text-neutral-900">
                                                {formatTZS(c.monthly_revenue)}
                                            </span>
                                            <span className="text-[8px] text-neutral-400">/mo</span>
                                        </div>

                                        <div className="h-5 w-5 rounded bg-neutral-100 flex items-center justify-center text-neutral-500 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                                            <ChevronRight className="h-2.5 w-2.5 group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ADD COMPOUND MODAL */}
            <AnimatePresence>
                {isAddCompoundModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden"
                        >
                            {/* Sticky Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Add New Compound / Site</h3>
                                    <p className="text-xs text-slate-500">
                                        Create a parent site (e.g. Goba Compound, Sinza Compound)
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsAddCompoundModalOpen(false)}
                                    className="rounded-full p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Scrollable Form Body */}
                            <form onSubmit={handleCreateCompound} className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-xs">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Compound Display Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Goba Executive Compound, Sinza Residences"
                                        value={newCompoundForm.name}
                                        onChange={(e) => setNewCompoundForm({ ...newCompoundForm, name: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-slate-900 focus:outline-none shadow-2xs"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">Compound Type</label>
                                        <select
                                            value={newCompoundForm.compound_type}
                                            onChange={(e) => setNewCompoundForm({ ...newCompoundForm, compound_type: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:outline-none"
                                        >
                                            <option value="Gated Residential Compound">Gated Residential Compound</option>
                                            <option value="Apartment Building Block">Apartment Building Block</option>
                                            <option value="Commercial Complex">Commercial Complex</option>
                                            <option value="Mixed Use Site">Mixed Use Site</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">Region (Mkoa) *</label>
                                        <select
                                            value={newCompoundForm.region}
                                            onChange={(e) => setNewCompoundForm({ ...newCompoundForm, region: e.target.value, district: '', ward: '' })}
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:outline-none"
                                        >
                                            {TANZANIA_REGIONS.map((r) => (
                                                <option key={r.name} value={r.name}>{r.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">District (Wilaya) *</label>
                                        <select
                                            value={newCompoundForm.district}
                                            onChange={(e) => setNewCompoundForm({ ...newCompoundForm, district: e.target.value, ward: '' })}
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:outline-none"
                                        >
                                            {availableDistricts.map((d) => (
                                                <option key={d.name} value={d.name}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-bold text-slate-700 mb-1">Ward (Kata)</label>
                                        {availableWards.length > 0 ? (
                                            <select
                                                value={newCompoundForm.ward}
                                                onChange={(e) => setNewCompoundForm({ ...newCompoundForm, ward: e.target.value })}
                                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:outline-none"
                                            >
                                                <option value="">Select Ward...</option>
                                                {availableWards.map((w) => (
                                                    <option key={w} value={w}>{w}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                placeholder="e.g. Goba, Sinza"
                                                value={newCompoundForm.ward}
                                                onChange={(e) => setNewCompoundForm({ ...newCompoundForm, ward: e.target.value })}
                                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:outline-none"
                                            />
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Street / Landmark</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Tegeta A Road, Mori Road"
                                        value={newCompoundForm.street}
                                        onChange={(e) => setNewCompoundForm({ ...newCompoundForm, street: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1.5">Shared Compound Amenities</label>
                                    <p className="text-[11px] text-slate-500 mb-2">Tap to select facilities available across this site:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            'Fenced Perimeter',
                                            '24/7 Security Guard',
                                            'Borehole Water & DAWASA',
                                            'Paved Parking',
                                            'STS LUKU Main/Submeters',
                                            'Standby Generator',
                                            'Electric Sliding Gate',
                                            'CCTV Security',
                                            'Garden & Greenery'
                                        ].map((amenity) => {
                                            const isSelected = newCompoundForm.amenities.includes(amenity);
                                            return (
                                                <button
                                                    key={amenity}
                                                    type="button"
                                                    onClick={() => {
                                                        const exists = newCompoundForm.amenities.includes(amenity);
                                                        setNewCompoundForm({
                                                            ...newCompoundForm,
                                                            amenities: exists
                                                                ? newCompoundForm.amenities.filter((a) => a !== amenity)
                                                                : [...newCompoundForm.amenities, amenity],
                                                        });
                                                    }}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                                                        isSelected
                                                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    {isSelected ? '✓ ' : '+ '}
                                                    {amenity}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Description (Optional)</label>
                                    <textarea
                                        rows={2}
                                        placeholder="General description of the compound site..."
                                        value={newCompoundForm.description}
                                        onChange={(e) => setNewCompoundForm({ ...newCompoundForm, description: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:outline-none"
                                    />
                                </div>

                                {/* Sticky Footer inside Form */}
                                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddCompoundModalOpen(false)}
                                        className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="rounded-xl bg-slate-900 px-5 py-2 font-bold text-white hover:bg-slate-800 cursor-pointer disabled:opacity-50 shadow-xs"
                                    >
                                        {isSubmitting ? 'Creating...' : 'Create Compound Site'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 10-STEP MULTI-STEP HOUSE CREATION WIZARD MODAL */}
            <AnimatePresence>
                {isHouseWizardOpen && selectedCompound && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden text-xs"
                        >
                            {/* Wizard Sticky Header */}
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 text-[9px] font-bold">
                                            Step {wizardStep + 1} of 10
                                        </span>
                                        <span className="text-[11px] font-bold text-slate-500">
                                            Inside {selectedCompound.name}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-extrabold text-slate-900">
                                        {stepTitles[wizardStep]}
                                    </h3>
                                </div>

                                <button
                                    onClick={() => setIsHouseWizardOpen(false)}
                                    className="rounded-full p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Step Progress Bar */}
                            <div className="w-full bg-slate-100 h-1.5 overflow-hidden shrink-0">
                                <div
                                    className="bg-slate-900 h-full transition-all duration-300"
                                    style={{ width: `${((wizardStep + 1) / 10) * 100}%` }}
                                />
                            </div>

                            {/* WIZARD SCROLLABLE STEP BODY */}
                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                                {/* STEP 1: Rental Mode & Category */}
                                {wizardStep === 0 && (
                                    <div className="space-y-4">
                                        <p className="text-slate-600 text-xs font-medium">
                                            Select how spaces inside this building will be rented out:
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {[
                                                { mode: 'entire', label: 'Entire Property', desc: 'Single tenant occupies the full house (e.g. 2 rooms + dining room + kitchen)', icon: Home },
                                                { mode: 'rooms', label: 'Rooms (Shared House)', desc: 'Rented by individual rooms (e.g. 2 standard rooms + 1 master room)', icon: Hotel },
                                                { mode: 'multi_unit', label: 'Multi-Unit / Flats', desc: 'Multiple self-contained flats or apartments within the building', icon: Building2 },
                                            ].map((m) => (
                                                <div
                                                    key={m.mode}
                                                    onClick={() => setWizardDraft({ ...wizardDraft, rental_mode: m.mode as any })}
                                                    className={`rounded-2xl border p-4 cursor-pointer transition-all ${
                                                        wizardDraft.rental_mode === m.mode
                                                            ? 'border-slate-900 bg-slate-50 shadow-xs'
                                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                                    }`}
                                                >
                                                    <m.icon className={`h-5 w-5 mb-2 ${wizardDraft.rental_mode === m.mode ? 'text-slate-900' : 'text-slate-400'}`} />
                                                    <h4 className="font-bold text-xs text-slate-900 mb-1">{m.label}</h4>
                                                    <p className="text-[11px] text-slate-500 leading-snug">{m.desc}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div>
                                            <label className="block font-bold text-slate-700 mb-1">Building Category</label>
                                            <select
                                                value={wizardDraft.category}
                                                onChange={(e) => setWizardDraft({ ...wizardDraft, category: e.target.value })}
                                                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:outline-none"
                                            >
                                                <option value="Standalone House">Standalone House (Nyumba inayojitegemea)</option>
                                                <option value="Shared House">Shared House (Nyumba ya vyumba vya kupanga)</option>
                                                <option value="Apartment">Apartment (Fleti / Apartimenti)</option>
                                                <option value="Multi-Apartment Building">Multi-Apartment Building (Jengo la fleti)</option>
                                                <option value="Hostel">Hostel (Hosteli au bweni)</option>
                                                <option value="Commercial">Commercial (Jengo la biashara)</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: Property Details & Dedicated Amenities ("merties") */}
                                {wizardStep === 1 && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block font-bold text-slate-700 mb-1">House / Building Display Name *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Bungalow 1 (Main Villa), House 4 (Shared)"
                                                value={wizardDraft.house_name}
                                                onChange={(e) => setWizardDraft({ ...wizardDraft, house_name: e.target.value })}
                                                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-slate-900 focus:outline-none"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block font-bold text-slate-700 mb-1">Advertiser Role</label>
                                                <div className="flex gap-2">
                                                    {[
                                                        { id: 'owner', label: 'Property Owner (Mmiliki)' },
                                                        { id: 'representative', label: 'Representative (Wakilishi)' }
                                                    ].map((r) => (
                                                        <button
                                                            key={r.id}
                                                            type="button"
                                                            onClick={() => setWizardDraft({ ...wizardDraft, advertiser_role: r.id })}
                                                            className={`flex-1 py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                                                                wizardDraft.advertiser_role === r.id
                                                                    ? 'bg-slate-900 text-white border-slate-900'
                                                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                                            }`}
                                                        >
                                                            {r.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block font-bold text-slate-700 mb-1">Parent Compound Site</label>
                                                <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 truncate">
                                                    {selectedCompound.name}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block font-bold text-slate-700 mb-1">General Description</label>
                                            <textarea
                                                rows={2}
                                                placeholder="Describe the rooms, dining area, ventilation, ceiling, veranda, and surroundings..."
                                                value={wizardDraft.description}
                                                onChange={(e) => setWizardDraft({ ...wizardDraft, description: e.target.value })}
                                                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="font-bold text-slate-700">Dedicated Building Facilities & Amenities ("Merties")</label>
                                                <span className="text-[10px] text-slate-400 font-semibold">{wizardDraft.shared_amenities.length} selected</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 mb-2">Tap to toggle amenities available for this specific building:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    'Water (DAWASA / Borehole)',
                                                    'STS LUKU Submeter',
                                                    'Security Guard 24/7',
                                                    'Perimeter Fence',
                                                    'Paved Parking',
                                                    'Standby Generator',
                                                    'Tiled Floors & Ceiling',
                                                    'Air Conditioning (AC)',
                                                    'High-Speed WiFi',
                                                    'Private Balcony / Veranda',
                                                    'Fitted Kitchen Cabinets',
                                                    'Garden Greenery',
                                                    'Passenger Lift',
                                                    'Swimming Pool',
                                                    'Shared Kitchen',
                                                    'Electric Sliding Gate'
                                                ].map((a) => {
                                                    const isSelected = wizardDraft.shared_amenities.includes(a);
                                                    return (
                                                        <button
                                                            key={a}
                                                            type="button"
                                                            onClick={() => {
                                                                const exists = wizardDraft.shared_amenities.includes(a);
                                                                setWizardDraft({
                                                                    ...wizardDraft,
                                                                    shared_amenities: exists
                                                                        ? wizardDraft.shared_amenities.filter((item) => item !== a)
                                                                        : [...wizardDraft.shared_amenities, a],
                                                                });
                                                            }}
                                                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                                                                isSelected
                                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                                            }`}
                                                        >
                                                            {isSelected ? '✓ ' : '+ '}
                                                            {a}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: Location, Tanzania Address & NAPA Postal Code */}
                                {wizardStep === 2 && (
                                    <div className="space-y-4">
                                        <div className="rounded-2xl bg-blue-50/70 border border-blue-200 p-3.5 flex items-start gap-3">
                                            <MapPin className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                                            <div>
                                                <span className="font-bold text-blue-900 text-xs block">Tanzania National Addressing System (NAPA)</span>
                                                <p className="text-[11px] text-blue-800 leading-relaxed mt-0.5">
                                                    In Tanzania, every registered property is identified by its official NAPA code, region, district, ward (kata), and street (mtaa) for verified physical navigation.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block font-bold text-slate-700 mb-1">Region (Mkoa) *</label>
                                                <select
                                                    value={wizardDraft.region}
                                                    onChange={(e) => setWizardDraft({ ...wizardDraft, region: e.target.value, district: '', ward: '' })}
                                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none"
                                                >
                                                    {TANZANIA_REGIONS.map((r) => (
                                                        <option key={r.name} value={r.name}>{r.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block font-bold text-slate-700 mb-1">District (Wilaya) *</label>
                                                <select
                                                    value={wizardDraft.district}
                                                    onChange={(e) => setWizardDraft({ ...wizardDraft, district: e.target.value, ward: '' })}
                                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none"
                                                >
                                                    {draftDistricts.map((d) => (
                                                        <option key={d.name} value={d.name}>{d.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block font-bold text-slate-700 mb-1">Ward / Neighborhood (Kata)</label>
                                                {draftWards.length > 0 ? (
                                                    <select
                                                        value={wizardDraft.ward}
                                                        onChange={(e) => setWizardDraft({ ...wizardDraft, ward: e.target.value })}
                                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none"
                                                    >
                                                        <option value="">Select Ward...</option>
                                                        {draftWards.map((w) => (
                                                            <option key={w} value={w}>{w}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Goba, Sinza, Mikocheni"
                                                        value={wizardDraft.ward}
                                                        onChange={(e) => setWizardDraft({ ...wizardDraft, ward: e.target.value })}
                                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none"
                                                    />
                                                )}
                                            </div>

                                            <div>
                                                <label className="block font-bold text-slate-700 mb-1">Street / Road (Barabara / Mtaa)</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Tegeta A Road, Mori Road"
                                                    value={wizardDraft.street}
                                                    onChange={(e) => setWizardDraft({ ...wizardDraft, street: e.target.value })}
                                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block font-bold text-slate-700 mb-1">House / Plot No. (Namba ya Kiwanja)</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Plot 418/Block 2"
                                                    value={wizardDraft.house_number}
                                                    onChange={(e) => setWizardDraft({ ...wizardDraft, house_number: e.target.value })}
                                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none"
                                                />
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="font-bold text-slate-700">NAPA Postal Code *</label>
                                                    <span className="rounded-full bg-amber-100 text-amber-900 border border-amber-200 px-1.5 py-0.2 text-[8px] font-bold">NAPA System</span>
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. TZ-DAR-KIN-GOB-0418"
                                                    value={wizardDraft.napa_number}
                                                    onChange={(e) => setWizardDraft({ ...wizardDraft, napa_number: e.target.value.toUpperCase() })}
                                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none font-bold text-slate-900 uppercase"
                                                />
                                            </div>
                                        </div>

                                        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 space-y-2">
                                            <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                                                <span>Map GPS Pin:</span>
                                                <span className="font-mono text-slate-600">{wizardDraft.latitude.toFixed(6)}, {wizardDraft.longitude.toFixed(6)}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500">
                                                Geographical pin auto-synchronized with parent site ({selectedCompound.location}). Tenants can navigate straight to the entrance gates.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 4: Define Property Structure */}
                                {wizardStep === 3 && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block font-bold text-slate-700 mb-1">Building Floors Count</label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={20}
                                                    value={wizardDraft.floors}
                                                    onChange={(e) => setWizardDraft({ ...wizardDraft, floors: Number(e.target.value) || 1 })}
                                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block font-bold text-slate-700 mb-1">Selected Arrangement</label>
                                                <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 font-bold text-slate-900 capitalize text-xs">
                                                    {wizardDraft.rental_mode === 'entire' ? 'Entire House (Single Lease)' : 'Room-by-Room / Multi-Unit'}
                                                </div>
                                            </div>
                                        </div>

                                        {wizardDraft.rental_mode === 'entire' ? (
                                            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 space-y-1">
                                                <span className="font-bold text-emerald-900 text-xs block">1 Entire Standalone House Structure</span>
                                                <p className="text-[11px] text-emerald-700 leading-relaxed">
                                                    This entire house is leased under a single unified tenancy agreement (including all bedrooms, dining area, sitting lounge, kitchen, and dedicated yard).
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 text-xs">Room / Unit Categories</h4>
                                                        <p className="text-[11px] text-slate-500">Specify categories of rooms or apartments inside this building:</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={handleAddTemplate}
                                                        className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                        <span>Add Category</span>
                                                    </button>
                                                </div>

                                                <div className="space-y-2">
                                                    {wizardDraft.templates.map((tmpl, idx) => (
                                                        <div key={tmpl.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 flex items-center justify-between gap-3">
                                                            <div className="grid grid-cols-2 gap-2 flex-1">
                                                                <div>
                                                                    <label className="text-[10px] text-slate-400 font-semibold block uppercase">Category Name</label>
                                                                    <input
                                                                        type="text"
                                                                        value={tmpl.name}
                                                                        onChange={(e) => {
                                                                            const updated = [...wizardDraft.templates];
                                                                            updated[idx].name = e.target.value;
                                                                            setWizardDraft({ ...wizardDraft, templates: updated });
                                                                        }}
                                                                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-900"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] text-slate-400 font-semibold block uppercase">Type</label>
                                                                    <input
                                                                        type="text"
                                                                        value={tmpl.unit_type}
                                                                        onChange={(e) => {
                                                                            const updated = [...wizardDraft.templates];
                                                                            updated[idx].unit_type = e.target.value;
                                                                            setWizardDraft({ ...wizardDraft, templates: updated });
                                                                        }}
                                                                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <div>
                                                                    <label className="text-[10px] text-slate-400 font-semibold block uppercase text-center">Qty</label>
                                                                    <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                if (tmpl.quantity > 1) {
                                                                                    const updated = [...wizardDraft.templates];
                                                                                    updated[idx].quantity -= 1;
                                                                                    setWizardDraft({ ...wizardDraft, templates: updated });
                                                                                }
                                                                            }}
                                                                            className="px-2 py-0.5 hover:bg-slate-100 text-xs font-bold"
                                                                        >
                                                                            -
                                                                        </button>
                                                                        <span className="px-2 text-xs font-extrabold text-slate-900">{tmpl.quantity}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const updated = [...wizardDraft.templates];
                                                                                updated[idx].quantity += 1;
                                                                                setWizardDraft({ ...wizardDraft, templates: updated });
                                                                            }}
                                                                            className="px-2 py-0.5 hover:bg-slate-100 text-xs font-bold"
                                                                        >
                                                                            +
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveTemplate(tmpl.id)}
                                                                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                                                                    title="Remove category"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* STEP 5: Configure Unit Templates */}
                                {wizardStep === 4 && (
                                    <div className="space-y-4">
                                        <p className="text-slate-600 text-xs">
                                            Define default rent, advance payment terms, and private/shared bathrooms for each category:
                                        </p>

                                        {wizardDraft.rental_mode === 'entire' ? (
                                            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50 space-y-3">
                                                <h4 className="font-bold text-slate-900 text-xs">Full House Default Terms</h4>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Monthly Rent (TZS)</label>
                                                        <input
                                                            type="number"
                                                            value={wizardDraft.overall_rent}
                                                            onChange={(e) => setWizardDraft({ ...wizardDraft, overall_rent: Number(e.target.value) || 0 })}
                                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Advance Payment</label>
                                                        <select
                                                            value={wizardDraft.lease_duration}
                                                            onChange={(e) => setWizardDraft({ ...wizardDraft, lease_duration: e.target.value })}
                                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                                                        >
                                                            <option value="3 months advance">3 months advance</option>
                                                            <option value="4 months advance">4 months advance</option>
                                                            <option value="6 months advance">6 months advance</option>
                                                            <option value="12 months advance">12 months advance</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {wizardDraft.templates.map((tmpl, idx) => (
                                                    <div key={tmpl.id} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
                                                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="rounded-full bg-slate-900 text-white px-2 py-0.5 text-[9px] font-bold">
                                                                    {tmpl.quantity} units
                                                                </span>
                                                                <h4 className="font-bold text-slate-900 text-xs">{tmpl.name}</h4>
                                                            </div>
                                                            <span className="text-[11px] text-slate-500 font-semibold">{tmpl.unit_type}</span>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Default Rent (TZS/mo)</label>
                                                                <input
                                                                    type="number"
                                                                    value={tmpl.default_rent}
                                                                    onChange={(e) => {
                                                                        const updated = [...wizardDraft.templates];
                                                                        updated[idx].default_rent = Number(e.target.value) || 0;
                                                                        setWizardDraft({ ...wizardDraft, templates: updated });
                                                                    }}
                                                                    className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-900"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Advance Payment Terms</label>
                                                                <select
                                                                    value={tmpl.payment_terms}
                                                                    onChange={(e) => {
                                                                        const updated = [...wizardDraft.templates];
                                                                        updated[idx].payment_terms = e.target.value;
                                                                        setWizardDraft({ ...wizardDraft, templates: updated });
                                                                    }}
                                                                    className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs"
                                                                >
                                                                    <option value="3 months advance">3 months advance</option>
                                                                    <option value="4 months advance">4 months advance</option>
                                                                    <option value="6 months advance">6 months advance</option>
                                                                    <option value="12 months advance">12 months advance</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between pt-1">
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={tmpl.is_private_bath}
                                                                    onChange={(e) => {
                                                                        const updated = [...wizardDraft.templates];
                                                                        updated[idx].is_private_bath = e.target.checked;
                                                                        setWizardDraft({ ...wizardDraft, templates: updated });
                                                                    }}
                                                                    className="rounded text-slate-900 focus:ring-0 h-3.5 w-3.5"
                                                                />
                                                                <span className="text-xs font-medium text-slate-700">Private Ensuite Bathroom</span>
                                                            </label>

                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] text-slate-400 font-semibold uppercase">Furnishing:</span>
                                                                <select
                                                                    value={tmpl.furnishing}
                                                                    onChange={(e) => {
                                                                        const updated = [...wizardDraft.templates];
                                                                        updated[idx].furnishing = e.target.value as any;
                                                                        setWizardDraft({ ...wizardDraft, templates: updated });
                                                                    }}
                                                                    className="rounded-lg border border-slate-200 px-2 py-0.5 text-[11px]"
                                                                >
                                                                    <option value="unfurnished">Unfurnished</option>
                                                                    <option value="semi">Semi-furnished</option>
                                                                    <option value="full">Fully furnished</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* STEP 6: Review Generated Units */}
                                {wizardStep === 5 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <div>
                                                <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
                                                    {wizardDraft.units.length} Units Generated
                                                </span>
                                                <p className="text-[11px] text-slate-500 mt-0.5">Review the individually identifiable units created from your templates:</p>
                                            </div>
                                            <div className="relative max-w-xs">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search units..."
                                                    value={wizardDraft.unit_search}
                                                    onChange={(e) => setWizardDraft({ ...wizardDraft, unit_search: e.target.value })}
                                                    className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs focus:outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                                            {wizardDraft.units
                                                .filter((u) => {
                                                    const q = wizardDraft.unit_search.toLowerCase();
                                                    return !q || u.unit_number.toLowerCase().includes(q) || u.unit_type.toLowerCase().includes(q);
                                                })
                                                .map((unit, idx) => (
                                                    <div
                                                        key={unit.id}
                                                        className="rounded-2xl border border-slate-200 bg-white p-3 flex items-center justify-between shadow-2xs hover:border-slate-300 transition-all"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                                                                <DoorClosed className="h-4.5 w-4.5" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="font-extrabold text-slate-900 text-xs">{unit.unit_number}</h4>
                                                                    {unit.is_customized && (
                                                                        <span className="rounded-full bg-blue-100 text-blue-800 px-1.5 py-0.2 text-[8px] font-bold">
                                                                            Customized
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-[11px] text-slate-500">
                                                                    {unit.unit_type} • {unit.is_private_bath ? 'Private Ensuite' : 'Shared Bath'} • {unit.floor}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <div className="text-right">
                                                                <span className="text-xs font-extrabold text-slate-900 block">{formatTZS(unit.monthly_rent)}/mo</span>
                                                                <span className="text-[10px] text-slate-400">{unit.payment_terms}</span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setWizardDraft({ ...wizardDraft, selected_override_index: idx });
                                                                    setWizardStep(6);
                                                                }}
                                                                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                                                            >
                                                                Customize →
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* STEP 7: Unit Overrides & Customization */}
                                {wizardStep === 6 && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Unit to Override & Customize:</label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {wizardDraft.units.map((u, i) => (
                                                    <button
                                                        key={u.id}
                                                        type="button"
                                                        onClick={() => setWizardDraft({ ...wizardDraft, selected_override_index: i })}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                                            wizardDraft.selected_override_index === i
                                                                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        {u.unit_number} {u.is_customized ? '★' : ''}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {wizardDraft.units[wizardDraft.selected_override_index] && (
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                                                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                                                    <h4 className="font-extrabold text-slate-900 text-xs">
                                                        Customizing: {wizardDraft.units[wizardDraft.selected_override_index].unit_number}
                                                    </h4>
                                                    <span className="text-[10px] text-slate-500 font-semibold">Override unit attributes</span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Unit Number / Custom Name</label>
                                                        <input
                                                            type="text"
                                                            value={wizardDraft.units[wizardDraft.selected_override_index].unit_number}
                                                            onChange={(e) => {
                                                                const updated = [...wizardDraft.units];
                                                                updated[wizardDraft.selected_override_index].unit_number = e.target.value;
                                                                updated[wizardDraft.selected_override_index].is_customized = true;
                                                                setWizardDraft({ ...wizardDraft, units: updated });
                                                            }}
                                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-900"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Custom Monthly Rent (TZS)</label>
                                                        <input
                                                            type="number"
                                                            value={wizardDraft.units[wizardDraft.selected_override_index].monthly_rent}
                                                            onChange={(e) => {
                                                                const updated = [...wizardDraft.units];
                                                                updated[wizardDraft.selected_override_index].monthly_rent = Number(e.target.value) || 0;
                                                                updated[wizardDraft.selected_override_index].is_customized = true;
                                                                setWizardDraft({ ...wizardDraft, units: updated });
                                                            }}
                                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-900"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Floor Level</label>
                                                        <select
                                                            value={wizardDraft.units[wizardDraft.selected_override_index].floor}
                                                            onChange={(e) => {
                                                                const updated = [...wizardDraft.units];
                                                                updated[wizardDraft.selected_override_index].floor = e.target.value;
                                                                updated[wizardDraft.selected_override_index].is_customized = true;
                                                                setWizardDraft({ ...wizardDraft, units: updated });
                                                            }}
                                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs"
                                                        >
                                                            <option value="Ground Floor">Ground Floor</option>
                                                            <option value="1st Floor">1st Floor</option>
                                                            <option value="2nd Floor">2nd Floor</option>
                                                            <option value="3rd Floor">3rd Floor</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Bathroom Arrangement</label>
                                                        <div className="flex gap-2">
                                                            {[
                                                                { val: true, label: 'Private Ensuite' },
                                                                { val: false, label: 'Shared Bath' }
                                                            ].map((b) => (
                                                                <button
                                                                    key={b.label}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const updated = [...wizardDraft.units];
                                                                        updated[wizardDraft.selected_override_index].is_private_bath = b.val;
                                                                        updated[wizardDraft.selected_override_index].is_customized = true;
                                                                        setWizardDraft({ ...wizardDraft, units: updated });
                                                                    }}
                                                                    className={`flex-1 py-1.5 px-2 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                                                                        wizardDraft.units[wizardDraft.selected_override_index].is_private_bath === b.val
                                                                            ? 'bg-slate-900 text-white border-slate-900'
                                                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                                    }`}
                                                                >
                                                                    {b.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Custom Description & Distinct Features</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Master suite with private balcony, fitted AC, garden-facing view"
                                                        value={wizardDraft.units[wizardDraft.selected_override_index].description}
                                                        onChange={(e) => {
                                                            const updated = [...wizardDraft.units];
                                                            updated[wizardDraft.selected_override_index].description = e.target.value;
                                                            updated[wizardDraft.selected_override_index].is_customized = true;
                                                            setWizardDraft({ ...wizardDraft, units: updated });
                                                        }}
                                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* STEP 8: Photos & Legal Verification Documents */}
                                {wizardStep === 7 && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block font-bold text-slate-700 mb-1.5">Property Cover Photo *</label>
                                            <div className="rounded-2xl border border-slate-200 p-3 bg-slate-50 flex items-center gap-4">
                                                <img
                                                    src={wizardDraft.cover_image}
                                                    alt="Cover preview"
                                                    className="h-20 w-32 object-cover rounded-xl shrink-0 shadow-2xs"
                                                />
                                                <div>
                                                    <span className="font-bold text-slate-900 block text-xs">Primary Exterior Cover Set</span>
                                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                                        High quality cover photo showcasing the compound facade and entrance.
                                                    </p>
                                                    <span className="inline-block mt-2 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[9px] font-bold">
                                                        ✓ Verified Upload
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block font-bold text-slate-700 mb-1.5">Ownership Verification & Title Deeds</label>
                                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 space-y-2">
                                                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                                                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                                    <span>Linked to Parent Compound Compliance</span>
                                                </div>
                                                <p className="text-[11px] text-emerald-800 leading-relaxed">
                                                    Ownership deeds, title deeds (Hati ya Kiwanja), and local government approval are automatically inherited from {selectedCompound.name} ({selectedCompound.napa_number || 'NAPA-TZ'}).
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 9: Rental Terms & Payment Settings */}
                                {wizardStep === 8 && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block font-bold text-slate-700 mb-1">Base Monthly Rent (TZS) *</label>
                                                <input
                                                    type="number"
                                                    value={wizardDraft.overall_rent}
                                                    onChange={(e) => setWizardDraft({ ...wizardDraft, overall_rent: Number(e.target.value) || 0 })}
                                                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-extrabold text-slate-900 focus:outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="block font-bold text-slate-700 mb-1">Security Deposit (TZS)</label>
                                                <input
                                                    type="number"
                                                    value={wizardDraft.security_deposit}
                                                    onChange={(e) => setWizardDraft({ ...wizardDraft, security_deposit: Number(e.target.value) || 0 })}
                                                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block font-bold text-slate-700 mb-1">Lease Advance Payment Terms *</label>
                                                <select
                                                    value={wizardDraft.lease_duration}
                                                    onChange={(e) => setWizardDraft({ ...wizardDraft, lease_duration: e.target.value })}
                                                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:outline-none"
                                                >
                                                    <option value="3 months advance">3 months advance (Kodi ya miezi 3)</option>
                                                    <option value="4 months advance">4 months advance (Kodi ya miezi 4)</option>
                                                    <option value="6 months advance">6 months advance (Kodi ya miezi 6)</option>
                                                    <option value="12 months advance">12 months advance (Kodi ya mwaka 1)</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block font-bold text-slate-700 mb-1">Viewing Arrangements</label>
                                                <select
                                                    value={wizardDraft.viewing_arrangement}
                                                    onChange={(e) => setWizardDraft({ ...wizardDraft, viewing_arrangement: e.target.value })}
                                                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:outline-none"
                                                >
                                                    <option value="By Appointment">By Appointment (Kwa Miadi)</option>
                                                    <option value="Open House">Open House (Wazi Kila Siku)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 10: Review & Publish */}
                                {wizardStep === 9 && (
                                    <div className="space-y-4">
                                        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 space-y-2.5">
                                            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                                                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                                                <span>Pre-Flight Verification Checklist Complete</span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-emerald-800 pt-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-emerald-600 font-bold">✓</span>
                                                    <span>Property Name: <strong>{wizardDraft.house_name || 'House'}</strong></span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-emerald-600 font-bold">✓</span>
                                                    <span>NAPA Code: <strong>{wizardDraft.napa_number}</strong></span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-emerald-600 font-bold">✓</span>
                                                    <span>Location: <strong>{wizardDraft.ward}, {wizardDraft.district}</strong></span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-emerald-600 font-bold">✓</span>
                                                    <span>Amenities: <strong>{wizardDraft.shared_amenities.length} items configured</strong></span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-emerald-600 font-bold">✓</span>
                                                    <span>Total Units: <strong>{wizardDraft.rental_mode === 'entire' ? 1 : wizardDraft.units.length} spaces</strong></span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-emerald-600 font-bold">✓</span>
                                                    <span>Advance Terms: <strong>{wizardDraft.lease_duration}</strong></span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                                            <span className="text-xs font-bold text-slate-800 block">Summary of Publication:</span>
                                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                                This building will be registered into <strong>{selectedCompound.name}</strong> as a {wizardDraft.category} ({wizardDraft.rental_mode === 'entire' ? 'Entire House' : 'Room-by-room / Multi-unit'}) with GPS coordinates linked to the site.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Wizard Sticky Footer Controls */}
                            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                                {wizardStep > 0 ? (
                                    <button
                                        type="button"
                                        onClick={() => setWizardStep((prev) => prev - 1)}
                                        className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                                    >
                                        ← Previous
                                    </button>
                                ) : (
                                    <div />
                                )}

                                {wizardStep < 9 ? (
                                    <button
                                        type="button"
                                        onClick={handleWizardNext}
                                        className="rounded-xl bg-slate-900 px-5 py-2 font-bold text-white hover:bg-slate-800 cursor-pointer shadow-xs transition-colors"
                                    >
                                        Continue →
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={handlePublishHouseIntoCompound}
                                        className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700 cursor-pointer disabled:opacity-50 shadow-xs transition-colors"
                                    >
                                        {isSubmitting ? 'Publishing...' : 'Publish House into Compound'}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

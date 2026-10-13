export type Paged<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    from: number | null;
    to: number | null;
    total: number;
    last_page: number;
};

export type Shared = {
    auth: { user: { id: number; fullname: string; email: string } | null };
    flash: string | null;
    queue: { identity: number; business: number; unverified: number; reports: number } | null;
    [key: string]: unknown;
};

export type Person = {
    id: number;
    fullname: string;
    email: string | null;
    phone: string | null;
    country: string | null;
    role: string;
    suspended_at: string | null;
    created_at: string;
    houses_count?: number;
};

export type Listing = {
    id: number;
    owner_id: number;
    property_name: string | null;
    property_type: string | null;
    description: string | null;
    region: string | null;
    district: string | null;
    ward: string | null;
    street: string | null;
    house_number: string | null;
    napa_number?: string | null;
    bedrooms: number | null;
    bathrooms: number | null;
    monthly_rent: number | string | null; // decimals arrive as strings
    security_deposit: number | string | null;
    lease_duration: string | null;
    amenities: string[] | null;
    cover_image: string | null;
    status: string;
    advertiser_role: string;
    verified_at: string | null;
    availability_confirmed_at: string | null;
    latitude: string | null;
    longitude: string | null;
    created_at: string;
    open_reports?: number;
    units?: {
        id: number;
        unit_number: string;
        unit_type?: string | null;
        status: string;
        monthly_rent: number | string;
        payment_terms?: string | null;
        bedrooms?: number | null;
        bathrooms?: number | null;
        image_path?: string | null;
        image_url?: string | null;
        description?: string | null;
    }[];
};

export type Report = {
    id: number;
    reason: string;
    details: string | null;
    status: string;
    created_at: string;
    house: Listing | null;
    reporter: Person | null;
};

export type Viewing = {
    id: number;
    preferred_at: string;
    note: string | null;
    status: string;
    created_at: string;
    house: Listing | null;
    user: Person | null;
};

export type IdentityCheck = {
    id: number;
    method: 'nida_number' | 'nida_card';
    nida_number: string | null;
    has_document: boolean;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason: string | null;
    created_at: string;
    reviewed_at: string | null;
    user: Person;
    reviewer: { fullname: string } | null;
};

export type BusinessCheck = {
    id: number;
    entity_name: string;
    business_type: string;
    tin: string;
    brela: string | null;
    vrn: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    website: string | null;
    bio: string | null;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason: string | null;
    submitted_at: string;
    reviewed_at: string | null;
    user: Person;
    reviewer: { fullname: string } | null;
    identity_status: string;
};

export type Action = { id: number; action: string; summary: string; created_at: string; admin: { fullname: string } | null };

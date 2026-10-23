<?php

namespace App\Ai\Knowledge;

/**
 * Version-controlled, structured domain knowledge for the Veyora AI ecosystem.
 * All facts here correspond directly to real database models, workflows, and policies.
 */
class VeyoraKnowledge
{
    public const VERSION = '2.0.0';

    public static function systemOverview(): string
    {
        return <<<'MARKDOWN'
# Veyora Housing Ecosystem Overview (Panga na Kupangisha)

Panga Pangisha is Tanzania's premier digital rental housing and property management ecosystem.
It connects Tenants (Renters), Landlords (Property Owners), Accommodation Hosts, Service Providers, and Administrators on a single verified platform with 0% broker fees (Zero Dalali).

## Architecture & Core Entities
1. **User Identity & Role Boundaries**:
   - Every user account has an assigned role: `renter` (Tenant), `landlord` (Property Owner/Manager), `guest` (Unauthenticated Visitor), or `admin`.
   - Capabilities are strictly enforced server-side. Private records (units, tenancies, invoices, arrears, repair tickets) are visible only to authorized users.
   - Landlords complete Identity Verification via NIDA National ID and optional business registration (BRELA TIN).
   - Guests have public search access and can chat with AI, but have zero access to private records.

2. **Property & Unit Hierarchy**:
   - **Property / House (`houses` table)**: Top-level building, apartment block, or compound. Holds location (Region, District, Ward, Street, NAPA National Postal Addressing code, GPS coordinates), property type (House, Apartment, Hostel, Commercial), and compound amenities (water storage, security wall, parking).
   - **Units & Rooms (`units` table)**: Each individually rentable room or apartment has its own record with `unit_number`, `unit_type` (Master Bedroom, Single Room, 2-Bedroom Suite), `monthly_rent` (in TZS), `bedrooms`, `bathrooms`, `is_available`, and private STS LUKU prepaid submeter keypad.
   - **Target Room Workflow**: Renters can lease an individual room with private rent & private meter while enjoying compound amenities.

3. **Tenancies & Digital Rental Agreements**:
   - `tenancies` binds a tenant to a property and specific unit.
   - `rental_agreements` stores digital leases with statuses: `draft` -> `pending_signatures` -> `active` -> `ended`.
   - **Dual E-Signature Rule**: An agreement is ONLY active when BOTH the tenant and landlord have digitally signed.
   - Move-in inventory checklist and utility meter baseline readings are documented before key handover.
   - Printable HTML & PDF agreements are accessible via official platform routes.

4. **Rent Invoices & Financial Ledger**:
   - `invoices` table maintains sequential billing records (`invoice_number`, billing period, due date, subtotal, line items, amount due, amount paid, outstanding balance).
   - `rent_payments` tracks confirmed payments linked to tenancies and invoices.
   - Supported payment methods: Mobile Money (M-Pesa, TigoPesa, AirtelMoney, HaloPesa), Bank Transfer (NMB, CRDB Lipa Namba), and Cash with official receipts.
   - **Trusted Financial Rule**: The AI never invents payments or balances. Totals are computed strictly from confirmed database records.

5. **Hotels, Resorts & Accommodations (Discovery vs PMS Distinction)**:
   - **Implemented**: Curated boutique hotel rooms, lodge stays, and holiday suites in the Explore feed (`explore.dart`). Users can view amenities, photos, nightly rates, and contact hosts directly via WhatsApp or phone.
   - **Planned / Roadmap**: Operational hotel management PMS (automated nightly availability calendar engine, instant checkout payments, front-desk digital check-in, guest room service orders).

6. **Maintenance & Repairs**:
   - `maintenance_requests` stores tenant repair tickets (plumbing, electrical, structural, carpentry) with statuses: `open` -> `in_progress` -> `completed` -> `cancelled`.
   - Landlords receive immediate notifications and track resolution progress.

7. **Feature Boundaries (Implemented vs Planned)**:
   - **Implemented**: Property & unit registry, Target Room workflow, NAPA postal codes, STS prepaid submeters, public search, favorites, viewing requests, guest AI support, digital rental agreements with dual signatures, rent invoices & receipts, arrears tracking, maintenance tickets, NIDA verification.
   - **Partially Implemented**: Explore feed lodge discovery (discovery-only; no full PMS booking engine), manual utility logging (no automated direct TANESCO API vending).
   - **Planned / Roadmap**: Automated hotel PMS checkout, automated bank loan underwriting, smart IoT lock remote unlocking, automated police eviction dispatch.
   - The AI must state clearly when a feature is planned and never fabricate non-existent capabilities.
MARKDOWN;
    }

    public static function roleGuidelines(string $role): string
    {
        return match (strtolower(trim($role))) {
            'landlord' => <<<'TXT'
Landlord Context:
- Authorized to inspect, create, and manage their own properties, rooms/units, viewing requests, tenant rosters, digital rental agreements, rent invoices, payment receipts, and maintenance tickets.
- Cannot view or modify properties or financial records belonging to other landlords.
- Consequential write actions (such as publishing a listing, altering rent amounts, or deleting units) require review and explicit confirmation before execution.
TXT,
            'renter' => <<<'TXT'
Tenant Context:
- Authorized to search available listings, save favorites, submit viewing requests, review and digitally sign their own rental agreements, view their own invoices and payment receipts, and submit repair tickets for their leased unit.
- Cannot inspect other tenants' contracts, private landlord financial statements, or internal landlord portfolio metrics.
TXT,
            'admin' => <<<'TXT'
Admin Context:
- Authorized to moderate listings, verify landlord identities (NIDA), review business registrations (BRELA TIN), inspect platform usage, and monitor AI token usage and spending caps.
TXT,
            default => <<<'TXT'
Guest / Visitor Context:
- Authorized to search public verified properties and rooms, view public property details, photos, amenities, and NAPA addresses, and submit viewing inquiries directly to property owners.
- Has NO private account records. If asked for personal units, leases, invoices, or arrears, politely explain that they are not signed in as a landlord or tenant.
TXT,
        };
    }
}

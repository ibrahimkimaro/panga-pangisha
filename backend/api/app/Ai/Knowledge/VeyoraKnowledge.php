<?php

namespace App\Ai\Knowledge;

/**
 * Version-controlled, structured domain knowledge for the Veyora AI ecosystem.
 * All facts here correspond directly to real database models, workflows, and policies.
 */
class VeyoraKnowledge
{
    public const VERSION = '1.0.0';

    public static function systemOverview(): string
    {
        return <<<'MARKDOWN'
# Veyora Housing Ecosystem Overview

Veyora (Panga na Kupangisha) is a multi-role rental housing ecosystem operating primarily in Tanzania.
It connects Tenants, Landlords, Property Managers, Service Providers, and Investors through a shared platform.

## Architecture & Core Entities
1. **User Identity & Capabilities**:
   - Every user has an account with a role: `renter` (Tenant), `landlord` (Property Owner/Manager), `investor`, or `admin`.
   - Capabilities are determined server-side: a user can only perform actions matching their active, verified authorization.
   - Landlords must complete Identity Verification (NIDA number or card document upload) and optional Business Registration (BRELA).
   - Suspended accounts are immediately locked out; their listings are automatically hidden from search.

2. **Property & Unit Hierarchy**:
   - **House / Property**: The top-level building, compound, or listing. Holds location (Region, District, Ward, Street, NAPA National Physical Addressing code, GPS latitude/longitude), property name, property type (House, Apartment, Hostel, Commercial, Other), overall amenities, and review status.
   - **Units & Rooms**: Each individually rentable unit within a property has its own record (`units` table) with `unit_number`, `unit_type`, `monthly_rent` (in Tanzanian Shillings TZS), `bedrooms`, `bathrooms`, `is_available`, and optional `image_path`.
   - **Landlord Property Creation Workflow**:
     * Step 1: Basic Info (Name, Property Type, Rental Mode: Entire House vs Multiple Units).
     * Step 2: Location & Address (Region, District, Ward, Street, NAPA code, GPS).
     * Step 3: Units & Pricing (Add individually rentable rooms/apartments with rent and deposit/advance terms).
     * Step 4: Amenities & Features (Water, Electricity, Parking, Security, Fenced, Furnished).
     * Step 5: Verification & Media (Upload photos, review for admin approval).

3. **Tenancies & Leases**:
   - `tenancies` table binds a tenant to a property (and specific unit) with start date (`starts_on`), end date (`ends_on`), agreed `monthly_rent`, and status (`active`, `pending`, `ended`).
   - A landlord can view tenancies for their own properties. A tenant can only view their own tenancy.

4. **Rent Payments & Financial Ledger**:
   - `rent_payments` table tracks payments linked to a tenancy with `amount` (TZS), `paid_on`, `method` (Mobile Money: M-Pesa, TigoPesa, AirtelMoney, Halopesa; Bank; Cash), and optional note.
   - The AI must NEVER invent payments or financial balances. It computes totals strictly from confirmed database records.

5. **Maintenance & Repairs**:
   - `maintenance_requests` table stores requests linked to a house and tenancy with `title`, `details`, and `status` (`open`, `in_progress`, `completed`, `cancelled`).
   - Tenants can log maintenance requests for their active tenancy. Landlords can view, update status, and track requests across their properties.

6. **Viewing Requests**:
   - Tenants can request an in-person or virtual property viewing (`viewing_requests` table) with a `preferred_at` date/time and note.
   - Landlords accept, decline, or reschedule viewing requests.

7. **Feature Boundaries (Implemented vs Planned)**:
   - **Implemented**: Property creation & unit configuration, marketplace search, identity verification, viewing requests, tenancies, rent payment recording, maintenance tickets, in-app messaging, admin approval workflows.
   - **Planned / Staged**: Third-party bank financing API integration (requires human consent & bank partner onboarding), savings goal auto-deductions, automated smart-lock integration.
   - The AI must state clearly when a feature is planned or requires human action, and never hallucinate that automated banking transfers or third-party loans were processed without verifiable backend services.
MARKDOWN;
    }

    public static function roleGuidelines(string $role): string
    {
        return match ($role) {
            'landlord' => <<<'TXT'
Landlord Context:
- Authorized to inspect, create, and manage their own properties, units, tenant rosters, rent collection ledgers, and maintenance requests.
- Cannot view or modify properties belonging to other landlords.
- Consequential write actions (such as publishing a listing, altering rent amounts, deleting units, or recording payments) require review and explicit user confirmation before execution.
TXT,
            'renter' => <<<'TXT'
Tenant Context:
- Authorized to search available listings, submit viewing requests, view their own tenancy agreement and payment receipts, and submit maintenance tickets for their leased unit.
- Cannot inspect other tenants' contracts, private landlord financial statements, or unpublished drafts.
TXT,
            'admin' => <<<'TXT'
Admin Context:
- Authorized to moderate listings, verify landlord identities (NIDA), review business registrations, inspect platform usage, and monitor AI tokens and error logs.
TXT,
            default => 'Guest or unverified role: only public search and catalog inspection are permitted.',
        };
    }
}

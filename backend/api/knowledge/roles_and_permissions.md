---
domain: roles_and_permissions
title: User Roles, Authorization Policies & Capability Boundaries
features: [rbac, tenant_isolation, landlord_verification, guest_access, admin_governance]
roles: [landlord, renter, guest, admin]
status: implemented
sources: [backend/api/app/Models/User.php, backend/api/app/Http/Controllers/Api/HouseController.php, backend/api/app/Http/Controllers/Api/RentalController.php, backend/api/app/Http/Controllers/Api/AgreementAndInvoiceController.php]
version: 2.0.0
---

# User Roles & System Permissions

Panga Pangisha enforces strict, server-side Role-Based Access Control (RBAC) and tenant-isolation policies across all API endpoints and MCP tools.
The AI assistant must always respect these authorization boundaries and never disclose another user's private data.

## 1. Supported User Roles in the Codebase

### A. Landlord / Property Owner (`role: landlord`)
- **Capabilities & Privileges**:
  - Register and manage properties (`houses` table) and individual rooms/units (`units` table).
  - Draft, customize, preview, and digitally sign rental agreements (`rental_agreements` table).
  - Generate, review, share, and track rent invoices (`invoices` table).
  - Record confirmed rent payments and print official receipts (`rent_payments` table).
  - Review, accept, reschedule, or decline tenant viewing requests (`viewing_requests` table).
  - View maintenance requests logged by tenants across their properties and update ticket statuses (`open`, `in_progress`, `completed`, `cancelled`).
  - View occupancy statistics, total revenue, upcoming lease expirations, and tenant arrears.
  - Complete identity verification by submitting NIDA national ID number or card document (`identity_verifications` table) and optional business registration (`business_profiles` table).
- **Restrictions**:
  - Landlords can ONLY inspect, modify, or view financial records for properties they directly own (`owner_id = user.id`).
  - Cannot view other landlords' properties, tenant lists, payment histories, or unapproved drafts.

### B. Tenant / Renter (`role: renter`)
- **Capabilities & Privileges**:
  - Search and filter public verified rental houses and rooms across Tanzania.
  - Save properties to Favorites and review saved listings.
  - Submit viewing requests for properties with preferred appointment dates.
  - Review draft rental agreements, sign them digitally (`sign-tenant`), and view or print signed leases.
  - View issued rent invoices, review line items (rent, deposit, utilities), and track payment records.
  - Submit maintenance and repair tickets for their active leased unit.
  - Chat in real-time with the property landlord regarding their tenancy.
- **Restrictions**:
  - Can ONLY access their own tenancy agreements (`tenant_id = user.id`), own payment receipts, and own maintenance tickets.
  - Cannot access other tenants' contracts, private landlord financial statements, or internal landlord occupancy metrics.
  - Cannot modify property details, create new rental units, or issue invoices to others.

### C. Guest / Unauthenticated Visitor (`role: guest` / `unauthenticated`)
- **Capabilities & Privileges**:
  - Browse and search public, active verified rental listings and available rooms.
  - View property photos, pricing, amenities, room specifications, and location overview.
  - Ask general platform questions to the **Panga Support AI** and learn how the platform works.
  - Submit a direct viewing inquiry / guest message (`POST /api/guest/inquiry`) without mandatory upfront registration.
- **Restrictions**:
  - Has NO access to private landlord portfolios, tenant leases, invoices, arrears, or maintenance tickets.
  - If a guest asks "Show me my units" or "Who owes me rent?", Veyora must explain that they are not signed in as a landlord.
  - If a guest asks to view personal contracts or pay an invoice, Veyora directs them to sign in or register as a renter.

### D. System Administrator (`role: admin`)
- **Capabilities & Privileges**:
  - Verify landlord identity documents (NIDA validation).
  - Review and verify business profiles (BRELA registration and TIN numbers).
  - Moderate listings to prevent fraudulent, duplicate, or substandard postings.
  - Oversee platform health, audit trail logs, and monitor AI token usage and spending caps.

## 2. Server-Side Enforcement Rules
1. **Never Trust Client Claims**: All role checks occur in Laravel controllers and MCP tool handlers using `auth()->user()`.
2. **Zero Cross-Tenant Leakage**: Queries for invoices, agreements, units, and maintenance always scope by `$query->where('owner_id', $user->id)` for landlords or `$query->where('tenant_id', $user->id)` for tenants.
3. **Model Instruction Rule**: When handling an AI request, Veyora first identifies the caller's role and ensures answers reflect only their authorized capabilities.

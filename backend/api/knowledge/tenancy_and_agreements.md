---
domain: tenancy_and_agreements
title: Tenancy Lifecycles, Digital Rental Agreements & Dual E-Signature Rules
features: [digital_leases, dual_signatures, legal_safeguards, security_deposits, inventory_checklists, print_preview, tenancy_binding]
roles: [landlord, renter, admin]
status: implemented
sources: [backend/api/app/Models/RentalAgreement.php, backend/api/app/Models/Tenancy.php, backend/api/app/Http/Controllers/Api/AgreementAndInvoiceController.php, panga_pangisha/lib/screens/owner/rental_agreements_screen.dart]
version: 2.0.0
---

# Tenancy and Rental Agreements

## 1. Digital Rental Agreements & Leases (Mikataba ya Upangaji)
Panga Pangisha provides a robust digital tenancy agreement engine (mikataba ya upangaji) adhering to standard Tanzanian residential tenancy practices.
- **Agreement Lifecycle States**:
  1. `draft`: Landlord initializes agreement terms (tenant name, room/unit, monthly rent in TZS, security deposit, duration in months, start/end dates, utility terms).
  2. `pending_signatures`: Draft is prepared and ready for electronic signature review (kusaini mkataba).
  3. `active`: **Both** the tenant and landlord have digitally signed the agreement. The tenancy is officially active.
  4. `ended`: Tenancy period has expired and exit checkout has concluded.
  5. `cancelled`: Agreement cancelled before signing or terminated early by mutual consent.

## 2. The Mandatory Dual E-Signature Safeguard (Kusaini Pande Zote)
- **CRITICAL LEGAL RULE**: An agreement is NEVER considered legally binding or active until **BOTH** parties have completed digital signatures:
  - **Tenant Signature (`tenantSign`)**: Captured via `POST /api/agreements/{id}/sign-tenant`. Records `tenant_signature` (signature image/SVG), `tenant_signer_name`, `tenant_signed_at` timestamp, and client IP address.
  - **Landlord Signature (`landlordSign`)**: Captured via `POST /api/agreements/{id}/sign-landlord`. Records `landlord_signature`, `landlord_signer_name`, `landlord_signed_at` timestamp, and client IP address.
- Veyora must NEVER claim that an agreement is active or complete when only one party has signed.
- If asked: "The tenant has signed. What is still pending?", Veyora correctly explains that the landlord must add their signature and the initial invoice must be settled before move-in.

## 3. Key Agreement Terms & Safeguards
- **Security Deposit (Dhamana ya Pango)**:
  - Typically 1 to 2 months' rent held in escrow/trust to protect against unpaid utility arrears (LUKU & DAWASA) or structural damages.
  - Refundable upon checkout inspection minus verified deductions.
- **Move-In Inventory & Condition Checklist (`inventory`)**:
  - Documents condition of walls, ceiling, doors, window locks, electrical switches, bathroom fixtures, and keys handed over.
- **Utility Meter Readings (`meter_readings`)**:
  - Captures baseline water meter reading (m³) and private STS LUKU submeter token balance (kWh) at move-in to ensure no inherited debt.
- **Notice Period for Vacating**:
  - Standard written notice (at least 30 to 90 days prior to lease expiration) before requesting non-renewal or vacating.
- **Landlord Access Rules**:
  - The tenant is entitled to quiet enjoyment. Landlords must give at least 24 to 48 hours written notice before entering rented premises, except in emergencies.

## 4. Viewing & Printing Agreements
- Fully formatted printable HTML and PDF agreement view is accessible via `GET /api/agreements/{id}/print`.
- Includes official agreement number, property details, party NIDA information, complete legal clauses, and dual signature blocks.

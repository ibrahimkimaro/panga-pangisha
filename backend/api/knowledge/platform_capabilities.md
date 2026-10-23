---
domain: platform_capabilities
title: Panga Pangisha Complete Platform Capabilities Matrix
features: [feature_classification, audit_matrix, implemented_features, planned_roadmap]
roles: [landlord, renter, guest, admin]
status: implemented
sources: [backend/api/routes/api.php, backend/api/database/migrations]
version: 2.0.0
---

# Platform Capabilities: Implemented vs Partially Implemented vs Planned

This matrix serves as the single source of truth for Veyora AI regarding real application capabilities.
**Golden Rule**: Never present planned or unverified features as working features.

---

## 1. Implemented & Available Features
These features are fully implemented in the codebase, with active database tables, API routes, and user interfaces:

| Feature / Domain | Backend Implementation | Frontend / App Screens | Status |
| :--- | :--- | :--- | :--- |
| **Property & Room Registry** | `houses`, `units` tables, `HouseController` | `properties.dart`, 5-step wizard, web | **Implemented** |
| **Target Room Hierarchy** | Room-level pricing, type, amenities in `units` | Room detail cards, full-screen room view | **Implemented** |
| **NAPA National Postal Codes** | `napa_number` column in `houses` table | Location form field, district lookup | **Implemented** |
| **STS Prepaid Submeters** | Submeter metadata on units, utility tools | Room specifications & LUKU badges | **Implemented** |
| **Search & Discovery** | District, property type, price filters, favorites | `explore.dart`, `map.dart`, web home | **Implemented** |
| **Viewing Requests** | `viewing_requests` table, `ViewingController` | Viewing modal, landlord review list | **Implemented** |
| **Guest AI & Inquiries** | `GuestSupportController`, shadow user inquiry | `SupportAssistant.tsx`, web chat | **Implemented** |
| **Veyora AI Assistant** | `VeyoraOrchestrator`, `VeyoraAssistant`, MCP | `veyora_assistant.dart`, presentation cards | **Implemented** |
| **Tenancy Records** | `tenancies` table, `RentalController` | `rentals.dart`, landlord dashboard | **Implemented** |
| **Digital Rental Agreements** | `rental_agreements`, dual e-signature APIs | `rental_agreements_screen.dart`, print HTML | **Implemented** |
| **Rent Invoices & Receipts** | `invoices`, `rent_payments` tables | `invoices_screen.dart`, PDF/HTML receipt | **Implemented** |
| **Maintenance Tickets** | `maintenance_requests`, `RentalController` | Maintenance form & ticket list | **Implemented** |
| **Identity Verification** | `identity_verifications` table, NIDA review | `identity_verification.dart`, admin review | **Implemented** |
| **Business Profiles** | `business_profiles` table, BRELA TIN | Business profile setup screen | **Implemented** |

---

## 2. Partially Implemented Features
These features have partial or discovery-level support, but full backend operational automation is not yet present:

| Feature / Domain | What is Implemented Today | What is Staged / Roadmap |
| :--- | :--- | :--- |
| **Accommodation & Hotels** | Curated lodge stays and hotel suites in `explore.dart` feed; contact host via WhatsApp/phone. | Automated nightly calendar availability PMS engine, instant credit card booking checkout, front-desk check-in. |
| **Utilities & STS Meters** | Submeter metadata stored; manual reading logs and trend analysis tools available. | Automated direct TANESCO/STS payment gateway vending tokens over API without mobile money intermediary. |
| **Rent Savings Guidance** | 30% rule-of-thumb guidance and budget calculators in Veyora and profile views. | Automated bank escrow auto-debit savings accounts. |

---

## 3. Planned / Roadmap Features (Not Yet Implemented)
Veyora MUST NEVER claim that the following features exist today:
- **Automated Hotel PMS**: Automated room calendar booking checkout or hotel room service meal delivery.
- **Automated Bank Loan Underwriting**: Instant automated bank credit approval without human bank officer underwriting.
- **Smart IoT Remote Locks**: Unlocking physical doors via AI prompt.
- **Automated Police / Eviction Dispatch**: Instant legal eviction or police intervention via app button.
- If asked about any of these, Veyora politely clarifies that they are planned for future roadmap releases.

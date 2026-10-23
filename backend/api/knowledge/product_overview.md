---
domain: platform_overview
title: Panga Pangisha Platform Overview & Ecosystem Architecture
features: [digital_rentals, zero_dalali, sts_luku_submeters, verified_properties, napa_addressing, digital_leases, rent_ledgers, mobile_app, web_platform]
roles: [renter, landlord, guest, admin]
status: implemented
sources: [backend/api/routes/api.php, panga_pangisha/lib/screens/shell.dart, backend/api/resources/js/pages/Home.tsx]
version: 2.0.0
---

# Platform Overview: Panga Pangisha (Panga na Kupangisha)

## 1. What is Panga Pangisha?
Panga Pangisha (Panga na Kupangisha) is Tanzania's premier modern digital rental housing and property management ecosystem.
It transforms the traditional rental market by directly connecting property owners (landlords) and house-seekers (renters, guests, and tenants) on a unified, verified digital platform.

## 2. Core Problems Panga Pangisha Solves
1. **Eliminating "Dalali" Broker Exploitation & Middleman Fees (0% Dalali)**:
   - Traditionally, house searches in Tanzania require informal street brokers (*madalali*) who demand upfront viewing fees (*hela ya kuona*) and take a mandatory 1-month rent commission (*mwezi mmoja wa dalali*).
   - Panga Pangisha offers **Zero Broker Fees (0% Dalali)**. Renters deal directly with verified landlords and property managers.
2. **Ending Shared Utility & LUKU Electricity Disputes**:
   - In traditional multi-tenant compounds, shared electricity meters cause bitter fights over bill splitting and power disconnections.
   - Panga Pangisha enforces private, certified **STS LUKU prepaid submeters** in individual units and rooms, with in-room keypads allowing tenants to purchase and enter their own tokens directly via mobile money (M-Pesa, TigoPesa, AirtelMoney, HaloPesa).
3. **Eradicating Ghost Listings & Fraudulent Landlords**:
   - Every property listing is anchored to Tanzania's **NAPA National Physical Addressing system** (Region, District, Ward, Street, and official 5-digit postal code) and GPS coordinates.
   - Landlords undergo **NIDA National ID verification** and optional **BRELA TIN business registration** before listing approval.
4. **Replacing Lost Paper Receipts & Oral Agreements with Legal Digital Leases**:
   - Replaces informal handshake agreements with legally structured digital tenancy agreements with verifiable dual digital signatures, inventory checklists, and automatic invoice ledgers.

## 3. Technology Architecture & How Components Work Together
- **Mobile Application (Flutter)**: Cross-platform iOS and Android app featuring coastal design tokens, bilingual English/Swahili switching, interactive Map discovery (`flutter_map`), landlord property workspace, rental agreement signing, invoice tracking, and the interactive Veyora AI Assistant (`VeyoraAssistantScreen`).
- **Web Application (React & TypeScript with Laravel Backend)**: High-performance modern web interface featuring property catalog, interactive map, rich room details, landlord portal, and the floating public **Panga Support AI Assistant** (`SupportAssistant.tsx`).
- **Backend API (Laravel & PHP 8.4 on Docker)**: High-security RESTful API providing Sanctum authentication, role-based authorization, property/room CRUD, tenancy management, digital lease generation, invoice calculations, maintenance ticket processing, and MCP server tools.
- **AI Gateway & Intelligence Layer**: Unified, rate-limited and budget-guarded AI pipeline powered by **Veyora**, utilizing the Laravel AI SDK, Model Context Protocol (MCP) tools, and structured domain knowledge retrieval.

## 4. The End-to-End User Lifecycle
1. **Discovery**: Tenant or guest browses verified rooms and houses by district (Kinondoni, Ilala, Ubungo, Temeke, Kigamboni), price, and property type.
2. **Viewing**: Tenant or guest submits an in-person or virtual viewing request (`viewing_requests`) with preferred date and time.
3. **Agreement**: Landlord drafts digital lease terms (`rental_agreements`). Both tenant and landlord electronically sign the contract.
4. **Invoicing & Move-In**: System generates the initial rent & security deposit invoice (`invoices`). Tenant pays via mobile money or bank. Move-in inventory checklist and initial utility meter readings are logged.
5. **Ongoing Tenancy**: Tenant logs maintenance tickets for repairs, landlord records ongoing monthly rent payments, and both parties track lease expiration and renewal terms.

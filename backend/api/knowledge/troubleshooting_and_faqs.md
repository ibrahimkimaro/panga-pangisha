---
domain: troubleshooting_and_faqs
title: Troubleshooting Guide & Verified Frequently Asked Questions
features: [faq, step_by_step_guidance, navigation_links, bilingual_swahili_english, error_resolution]
roles: [renter, landlord, guest, admin]
status: implemented
sources: [panga_pangisha/lib/screens/shell.dart, backend/api/knowledge/product_overview.md]
version: 2.0.0
---

# Troubleshooting & Frequently Asked Questions (FAQs)

This guide provides verified, context-aware answers to frequent user questions, guiding them step-by-step to the exact application screens and actions.

---

## 1. General & Platform Questions

### Q: "What is Panga Pangisha?" / "Hii platform inasaidia nini?"
- **English**: Panga Pangisha is Tanzania's premier digital rental ecosystem connecting tenants and landlords directly with **0% broker fees (Zero Dalali)**. It provides verified listings with NAPA postal addressing, private STS LUKU prepaid meters for every room, digital rental agreements with dual electronic signatures, and transparent rent ledgers.
- **Kiswahili**: Panga Pangisha ni mfumo wa kisasa wa kidijitali wa kupanga na kusimamia nyumba Tanzania. Huunganisha wapangaji na wamiliki wa nyumba moja kwa moja bila madalali (**0% Dalali**). Kila chumba kina mita yake binafsi ya STS LUKU, mikataba ya kisheria ya kidijitali, na kumbukumbu sahihi za malipo ya kodi.

### Q: "What can I do with this app?" / "Naweza kufanya nini hapa?"
- **For Renters**: Search verified rooms/houses, schedule viewings, sign rental agreements, view invoices, pay rent via mobile money, and log maintenance tickets.
- **For Landlords**: Register properties & units, review viewing requests, draft and sign digital leases, generate rent invoices, track rent collections, and monitor repairs.
- **For Guests**: Browse available houses, ask questions to Panga Support AI, and send direct viewing inquiries to owners.

---

## 2. Renter & Tenant FAQs

### Q: "How do I find or rent a room?" / "Ninawezaje kupata chumba?"
- **Step 1**: Open the **Explore (Gundua)** tab or tap the **Map (Ramani)** icon.
- **Step 2**: Use filters to select your target district (e.g. Kinondoni, Ilala, Ubungo), maximum price in TZS, and property type (e.g., Master Bedroom or Single Room).
- **Step 3**: Tap a listing to inspect room photos, amenities, and STS LUKU meter details.
- **Step 4**: Tap **Schedule Viewing** to book an in-person inspection with the owner.

### Q: "How do private STS LUKU submeters work?" / "Mita za LUKU zinafanyaje kazi?"
- Each room is fitted with its own certified STS prepaid submeter and an in-room keypad.
- You purchase electricity tokens through M-Pesa, TigoPesa, AirtelMoney, or HaloPesa and enter them directly into your meter keypad inside your room.
- You have 100% control over your electricity with zero shared bill arguments!

### Q: "How do I sign my rental agreement?" / "Nasainije mkataba wangu?"
- When your landlord prepares your lease, you will receive an in-app notification.
- Navigate to the **Agreements** section, review all terms (rent, deposit, duration, inventory), and tap **Sign Agreement**.
- Draw your digital signature to submit. Once both you and the landlord have signed, the agreement becomes active!

### Q: "How do I report a repair / maintenance issue?" / "Nitaripotije hitilafu ya nyumba?"
- Navigate to your tenancy details and tap **New Maintenance Request**.
- Enter a title (e.g., "Leaking kitchen tap") and a brief description.
- Your landlord is instantly notified and can update you as repairs progress.

---

## 3. Landlord FAQs

### Q: "How do I add a new property or room?" / "Ninawezaje kuongeza nyumba mpya?"
- **Step 1**: Open the **Properties (Nyumba)** tab and tap **+ Add Property**.
- **Step 2**: Complete the 5-step wizard:
  1. Basic info (property name, type).
  2. Location (Region, District, Ward, Street, NAPA code, GPS).
  3. Units & Rooms (define room numbers, rent prices in TZS, deposit).
  4. Amenities (water, electricity, security, parking).
  5. Photos & verification.
- **Step 3**: Submit for listing activation.

### Q: "How do I prepare a rental agreement?" / "Ninaandaaje mkataba wa mpangaji?"
- Go to the **Rental Agreements** screen (`rental_agreements_screen.dart`).
- Tap **Draft New Agreement**, select the property, unit, tenant name, monthly rent, and start date.
- Preview the draft terms and tap **Send for Signature**.
- Both you and the tenant must sign electronically before the lease is activated.

### Q: "The tenant has signed. What is still pending?" / "Mpangaji amesaini, nini kimebaki?"
- If the tenant has signed, the agreement is in `pending_signatures` status.
- Remaining steps:
  1. **Landlord Signature**: You must add your own electronic signature via `POST /api/agreements/{id}/sign-landlord`.
  2. **Initial Invoice Settlement**: Issue and confirm settlement of the initial rent & security deposit invoice before handing over keys.

### Q: "How do I track rent payments & arrears?" / "Naonaje kodi inayodaiwa?"
- Go to the **Invoices** tab (`invoices_screen.dart`) or ask Veyora: *"Who owes rent?"*.
- The system checks overdue invoices and provides a clear breakdown of tenant names, units, days overdue, and outstanding amounts in TZS.

---

## 4. Role & Authorization Restrictions

### Q: "Why can't I see landlord records or units?" (When asked by a guest or tenant)
- Panga Pangisha enforces strict data privacy. Only authenticated landlords can access property management tools, rental unit rosters, and landlord financial ledgers.
- If you are a tenant, you can view your own active lease and receipts.
- If you are a visitor, sign in with a landlord account to access landlord features.

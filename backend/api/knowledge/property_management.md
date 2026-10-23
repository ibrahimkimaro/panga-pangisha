---
domain: property_and_room_management
title: Property and Room Management Architecture, Hierarchy & Workflows
features: [house_registry, unit_management, target_rooms, multi_unit_compounds, sts_submeters, five_step_wizard, napa_integration]
roles: [landlord, renter, guest, admin]
status: implemented
sources: [backend/api/app/Models/House.php, backend/api/app/Models/Unit.php, backend/api/app/Http/Controllers/Api/HouseController.php, panga_pangisha/lib/screens/owner/properties.dart]
version: 2.0.0
---

# Property and Room Management

## 1. Property & Unit Hierarchy
In Panga Pangisha, real estate is organized in a two-tier relational hierarchy:
1. **Property / House (`houses` table)**:
   - Represents the physical building, compound, apartment block, or residential estate.
   - Holds the property name (`property_name`), overall property type (`property_type`: House, Apartment, Hostel, Commercial, Other), geographic location (Region, District, Ward, Street, NAPA 5-digit postal code, GPS latitude/longitude), compound-wide amenities, description, cover photo, and verification status.
2. **Individually Rentable Units / Rooms (`units` table)**:
   - Each rentable space inside a property has its own record linked via `house_id`.
   - Attributes include: `unit_number` (e.g., "Room 101", "Master Wing", "Unit B2"), `unit_type` (Master Bedroom, Single Room, 1-Bedroom, 2-Bedroom Suite), `monthly_rent` (in TZS), `bedrooms`, `bathrooms`, `is_available` boolean, `status` (`available`, `occupied`, `maintenance`, `reserved`), and optional unit photos.

## 2. The "Target Room" Workflow
- In Tanzania, many house-seekers rent an individual room inside a larger shared house or gated compound rather than leasing an entire estate.
- **How Panga Pangisha Handles This Workflow**:
  - A tenant searching for a room sees both the **Target Room** details (dedicated monthly rent, en-suite bathroom vs shared bath, private room photos, and private STS LUKU submeter) AND the **Parent House / Compound Overview** (compound security gate, parking bays, backup water tanks, paving, and neighborhood vibe).
  - This guarantees clear expectations: the tenant knows exactly which room they are leasing while seeing all compound benefits.

## 3. Landlord 5-Step Property Creation Wizard
Landlords can register properties via the Flutter app (`properties.dart`) or web portal using an intuitive 5-step wizard:
- **Step 1: Basic Information**: Property Name, Property Type (House, Apartment, Hostel, Commercial), and Rental Mode (Entire House vs Multiple Units).
- **Step 2: Location & Physical Addressing**: Region (e.g., Dar es Salaam), District (e.g., Kinondoni, Ilala, Ubungo, Temeke, Kigamboni), Ward (e.g., Mikocheni, Sinza, Upanga), Street, NAPA National Postal Addressing code, and GPS pin.
- **Step 3: Units, Rooms & Pricing**: Adding individual rentable rooms or suites with their unit number, room type, monthly rent in TZS, deposit terms, and room photos.
- **Step 4: Amenities & Utilities**: Declaring compound and room amenities:
  - Water infrastructure (DAWASA mains, borehole, backup storage tanks).
  - Electricity & submetering (STS LUKU private prepaid meters with keypads).
  - Security (fenced perimeter wall, security guard, electric fence).
  - Parking, WiFi, Furnishing, Air Conditioning.
- **Step 5: Verification & Media**: Uploading clear photographs (exterior compound, rooms, bathrooms) and submitting for verification.

## 4. Vacancy and Occupancy Management
- Landlords can toggle unit availability in real time.
- When an agreement is signed and activated, the unit automatically switches to `is_available = false` and status `occupied`.
- Landlords can review their occupancy dashboard (`occupancy_screen.dart`):
  - Total registered units.
  - Active leased units vs vacant units available for rent.
  - Occupancy percentage and upcoming lease expiration alerts.

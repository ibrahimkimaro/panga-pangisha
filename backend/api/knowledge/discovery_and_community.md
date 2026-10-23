---
domain: discovery_and_community
title: Discovery, Search, Community Feed & Viewing Request Workflows
features: [property_search, district_filtering, price_filters, favorites, viewing_requests, community_feed, guest_inquiries]
roles: [renter, guest, landlord]
status: implemented
sources: [panga_pangisha/lib/screens/explore.dart, backend/api/app/Http/Controllers/Api/HouseController.php, backend/api/app/Http/Controllers/Api/ViewingController.php, backend/api/app/Http/Controllers/Api/GuestSupportController.php]
version: 2.0.0
---

# Discovery and Community

## 1. Property and Room Discovery
Panga Pangisha offers rich discovery capabilities for both authenticated renters and anonymous visitors:
- **Search Filters**:
  - Location: Filter by Region (Dar es Salaam, Arusha, Dodoma, Zanzibar, Mwanza), District (Kinondoni, Ilala, Ubungo, Temeke, Kigamboni), and Ward.
  - Property Type: Standalone House, Apartment, Hostel, Commercial, Room/Suite.
  - Price Range: Filtering by maximum monthly rent in Tanzanian Shillings (TZS).
  - Furnishing & Amenities: Water storage, air conditioning, parking, gated security.
- **Interactive Map Search**:
  - The Flutter app includes an interactive OpenStreetMap (`flutter_map`) view showing geo-located property pins across Tanzanian neighborhoods.
- **Saved Listings (Favorites)**:
  - Users can bookmark favorite houses and rooms with one tap for quick comparison.
  - Favorites are synced in the database for registered users and accessible from the top navigation bar.

## 2. Viewing Requests (`viewing_requests`)
- **For Authenticated Renters**:
  - From any property details screen, renters can tap **Schedule Viewing** and select their preferred date, time, and optional notes (e.g., "Would like to inspect the master bathroom and compound parking").
  - The request is saved with status `pending` in the database.
  - The landlord is instantly notified in their dashboard and can **Accept**, **Decline**, or **Reschedule** the appointment.
- **For Anonymous Visitors / Guests**:
  - Anonymous visitors on the web landing page or property view can use the **Panga Support AI widget** (`SupportAssistant.tsx`) to submit a guest inquiry (`POST /api/guest/inquiry`).
  - The system records their name, phone number, message, and preferred time, creating a viewing request and immediately notifying the landlord via SMS/in-app alert.

## 3. Explore & Community Feed
The mobile app features a dynamic Explore feed (`panga_pangisha/lib/screens/explore.dart`) with curated content cards organized into distinct categories:
- **Houses & Apartments**: Verified residential listings with instant booking/viewing triggers.
- **Hotels & Lodges**: Curated weekend getaways, coastal resort suites, and boutique lodge stays.
- **Community Updates**: Local neighborhood insights, tenancy tips, DAWASA maintenance notices, and living recommendations.
- **Local Services**: Verified service provider announcements (e.g., electricians, painters, plumbers).

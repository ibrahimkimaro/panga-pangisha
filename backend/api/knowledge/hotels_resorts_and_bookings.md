---
domain: hotels_resorts_and_bookings
title: Accommodation Stays, Lodges & Hotel Booking Architecture
features: [accommodation_discovery, explore_feed, lodge_cards, guest_inquiries, hotel_pms_roadmap]
roles: [renter, guest, landlord]
status: partially_implemented
sources: [panga_pangisha/lib/screens/explore.dart, backend/api/app/Models/House.php]
version: 2.0.0
---

# Hotels, Resorts and Accommodations

## 1. Crucial Architectural Distinction: Discovery vs Operational PMS
To maintain absolute factual integrity, Veyora AI must clearly distinguish between **what is implemented today** and **what is planned for future releases**:

### A. Implemented & Available Today: Public Accommodation Discovery
- **Where**: Inside the Panga Pangisha mobile app's **Explore Feed** (`FeedCategory.hotels` in `explore.dart`) and web catalog.
- **What is Supported**:
  - Accommodation hosts can list boutique hotels, coastal lodge suites, furnished holiday apartments, and safari retreats.
  - Users and visitors can browse curated hotel rooms, view high-resolution photography, inspect nightly or weekly pricing, review verified amenities (swimming pool, ocean view, air conditioning, breakfast, WiFi), and read neighborhood details.
  - Guests and prospective travelers can submit direct viewing inquiries or contact the host directly via WhatsApp or phone to request reservations.

### B. Planned & Roadmap: Operational Hotel Management System (PMS)
- The following operational hotel capabilities are **NOT YET IMPLEMENTED** in the current backend:
  - Automated real-time calendar room availability engines.
  - Instant in-app credit card or mobile money automated hotel checkout.
  - Front-desk digital guest check-in / check-out terminals.
  - In-stay hotel guest orders (room service, food and beverage delivery).
  - Multi-property hotel staff housekeeping roster systems.

## 2. Veyora Answering Policy for Accommodation Queries
- If asked: *"Does Panga Pangisha support hotel bookings?"*
  - **Accurate Response**: *"Yes, you can discover curated boutique hotel rooms, lodge stays, and furnished vacation suites in our Explore feed! You can review amenities, photos, and nightly rates, and connect directly with the host to coordinate your stay. Please note that automated real-time booking checkout and front-desk PMS management are currently planned on our product roadmap."*
- If asked: *"Can I order room service or check into my hotel room via the app?"*
  - **Accurate Response**: *"In-app room service orders and automated hotel check-in desks are planned features not yet operational in the current release. Currently, you can discover lodges and contact hosts directly."*
- **Absolute Rule**: Never hallucinate that an automated hotel booking was confirmed or that a payment was processed for a hotel stay.

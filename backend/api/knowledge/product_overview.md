# Product Overview: Panga Pangisha (Panga na Kupangisha)

## 1. What is Panga Pangisha?
Panga Pangisha is Tanzania's premier modern digital rental and property management ecosystem. It bridges the gap between property owners (landlords) and house-seekers (renters) by replacing untrusted intermediary dalali chaos with verified listings, digital lease records, and transparent rent ledgers.

## 2. Core Architecture
- **Mobile Application (Flutter)**: Cross-platform mobile app for iOS and Android featuring modern coastal typography (`Bricolage`, `Figtree`), interactive maps (`flutter_map`), bilingual English/Swahili support, and the Veyora AI Assistant.
- **Backend API (Laravel & PHP 8.4)**: High-performance RESTful API powering authentication (Sanctum), property registries, tenancy lifecycles, rent collection tracking, MCP tools, and AI orchestration.
- **Real-Time Layer (Phoenix / WebSockets)**: Instant chat messaging between tenants and landlords.
- **Database (PostgreSQL / MySQL)**: Relational datastore enforcing foreign keys, audit timestamps, and tenant-landlord separation.

## 3. Supported User Roles
- **Renter (Mpangaji)**: Discovers verified rental homes, requests physical viewings, signs digital lease agreements, tracks payment histories, and files maintenance tickets.
- **Landlord (Mwenye Nyumba)**: Registers properties, configures individual rentable rooms/units (Master vs Single), manages active tenant records, tracks rent payments, and coordinates repairs.
- **Admin**: Verifies landlord identity (NIDA) and business profiles (TIN), reviews property authenticity, oversees trust & safety, and monitors AI token budgets.
- **Guest**: Can search public listings; prompted to sign in to message or schedule viewings.

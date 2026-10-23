---
domain: maintenance_and_services
title: Maintenance Tickets, Repairs & Local Service Workflows
features: [maintenance_tickets, repair_tracking, ticket_statuses, landlord_coordination, notifications]
roles: [renter, landlord, admin]
status: implemented
sources: [backend/api/app/Models/MaintenanceRequest.php, backend/api/app/Http/Controllers/Api/RentalController.php, backend/api/app/Mcp/Tools/Maintenance/ListMaintenanceTool.php, backend/api/app/Mcp/Tools/Maintenance/CreateMaintenanceTicketTool.php]
version: 2.0.0
---

# Services, Maintenance and Repairs

## 1. Maintenance Requests (`maintenance_requests` table)
Panga Pangisha provides a structured repair tracking workflow to eliminate unresolved property issues and tenant-landlord friction.

### A. Submitting a Ticket (Tenant Workflow)
- An authenticated tenant with an active lease can submit a maintenance request via the mobile app or through Veyora AI (`create_maintenance_ticket`).
- **Required Details**:
  - `title`: Short summary (e.g., "Leaking water tap in master bathroom", "LUKU meter keypad unresponsive").
  - `details`: Thorough description of the problem, urgency, and location inside the unit.
  - Linked to `house_id` and `tenancy_id`.
- Initial status is automatically set to `open`.
- The landlord receives an instant push/in-app notification (`AppNotification`) regarding the repair request.

### B. Managing & Resolving Tickets (Landlord Workflow)
- Landlords can review all open tickets across their portfolio using `ListMaintenanceTool` or the rentals dashboard (`rentals.dart`).
- **Ticket Status Lifecycle**:
  1. `open`: Ticket logged by tenant, awaiting landlord review.
  2. `in_progress`: Landlord has dispatched an artisan (plumber, electrician, mason) or scheduled repairs.
  3. `completed`: Work has been inspected and finished.
  4. `cancelled`: Ticket duplicate or resolved without intervention.
- Landlords update ticket statuses via `PATCH /api/maintenance/{id}`.

## 2. Common Maintenance Categories
- **Plumbing (Maji & Mabomba)**: Water pipe leaks, tap washers, clogged drainage, DAWASA pump issues, toilet cistern repairs.
- **Electrical (Umeme & LUKU)**: Prepaid STS LUKU submeter keypad issues, circuit breaker tripping, lighting fixtures, sockets.
- **Structural & Carpentry (Paa & Milango)**: Roof leaks during rainy season, door locks, window mesh/louvers, gate hinge repairs.
- **Painting & Aesthetics**: Periodic compound repainting and plaster touchups.

## 3. Local Service Providers (Work Opportunities)
- Panga Pangisha's Explore feed and community boards spotlight verified local service artisans (licensed electricians, plumbers, certified air conditioning technicians, moving services).
- **Current Status**: Informational listings and direct contact in the Explore feed are available. Automated in-app escrow payment of service contractors is planned on the roadmap.

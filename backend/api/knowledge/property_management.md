# Property & Unit Management

## 1. Multi-Unit vs Single Compound Architecture
- In Panga Pangisha, a single registered Property (`House`) can contain multiple rentable units (`Unit`):
  - Example: *Kijitonyama Plaza* has Unit A1 (2-Bedroom Apartment, TZS 800,000/mo) and Unit B2 (Master Bedroom, TZS 350,000/mo).
- Each unit has its own:
  - Unit number / name (e.g., "A1", "Ground Floor West")
  - Unit type (Master Bedroom, Standard Room, 2-Bedroom Suite)
  - Monthly rent (TZS)
  - Occupancy status (`available`, `rented`, `reserved`, `maintenance`)
  - Bedroom & bathroom counts.

## 2. Tracking Vacancy vs Occupancy
- An available unit can be discovered in public search by renters.
- A rented unit is tied to an active `Tenancy` record and cannot be double-booked.
- Landlords can review their portfolio vacancy rate:
  - Total Units across all properties
  - Total Vacant Units available for immediate lease
  - Active Tenancies generating monthly revenue.

## 3. Maintenance Lifecycle
- Requests categorize issues into:
  - Plumbing (Maji / Mabomba)
  - Electrical (Umeme / LUKU meter)
  - Structural / Carpentry (Paa, milango, madirisha)
  - Painting & general upkeep.
- Statuses: `open` -> `in_progress` -> `resolved`.

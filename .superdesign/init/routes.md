# Screens (Flutter has no URL routes; screens are pushed with `Navigator`)

| Key | Screen | File | Opens from |
|---|---|---|---|
| `landlord-dashboard` | `LandlordDashboardHomeView` | `panga_pangisha/lib/screens/owner/landlord_dashboard.dart` | Home tab |
| `landlord-properties` | `OwnerHomeTab` | `panga_pangisha/lib/screens/owner/properties.dart` | Properties tab |
| `landlord-properties-map` | `PropertiesMapScreen` | same file | map icon on Properties, Map shortcut |
| `landlord-property-detail` | `PropertyDetailScreen` | same file | a property card |
| `landlord-add-property` | `AddHomeScreen` | `panga_pangisha/lib/screens/owner.dart` | Add property |
| `landlord-tenants` | `TenantsTab` | `panga_pangisha/lib/screens/owner/rentals.dart` | Tenants tab |
| `landlord-tenant` | `_TenantScreen` | same file | a tenant row |
| `landlord-rent-payments` | `RentPaymentsScreen` | same file | dashboard hero, Rent shortcut, Tenants header |
| `landlord-maintenance` | `MaintenanceScreen` | same file | Repairs shortcut, Account > Maintenance |
| `messages` | `MessagesTab`, `ChatScreen` | `panga_pangisha/lib/screens/chat.dart` | Messages tab |
| `account` | `ProfileTab` | `panga_pangisha/lib/screens/profile.dart` | Account button |
| `appearance` | `AppearanceScreen` | `panga_pangisha/lib/screens/appearance.dart` | Account > Appearance |

Shell: `panga_pangisha/lib/screens/shell.dart` (tabs). Entry: `panga_pangisha/lib/main.dart`.

## What the key screens render
- **Dashboard**: greeting by the clock + date + bell; navy hero "Rent collected in <month>" with amount, progress bar and "3 of 4 tenants paid · TSh 520,000 still due"; four shortcuts (Add property, Rent, Repairs, Map); Overview 2x2 tiles (Properties, Tenants, Viewing requests, Open repairs); "Waiting for you" brass to-do cards; bar chart of rent for six months; "Rent by home" bars.
- **Properties**: title + count, map icon, search, filter chips (status, type, sort), property cards (78px photo, name, place, rent, beds/baths, status badge), floating "Add property".
- **Tenants**: title + count, payments and maintenance icons, segmented "Tenants | Viewing requests", search, tenant rows (initials avatar, name, unit · time, property, Active badge, Paid / Rent due), floating "Add tenant".
- **Tenant**: avatar, name, unit · time, badge; segmented Overview / Rent / Maintenance; contact and tenancy rows; "Record payment".
- **Rent payments**: segmented Overview / History; collected this month, six-month bars, recent payments; "Record payment".
- **Maintenance**: filter chips All / Open / In progress / Resolved; request cards with status badge; "New request".

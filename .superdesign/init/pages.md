# Screen dependency trees

## landlord-dashboard
Entry: panga_pangisha/lib/screens/owner/landlord_dashboard.dart (render: `_LandlordDashboardHomeViewState.build`, from `class _LandlordDashboardHomeViewState` to the end of the file)
Dependencies:
- panga_pangisha/lib/ui.dart (C tokens, display/body, Avatar, RoundIcon, GlassBackdrop)
  - panga_pangisha/lib/appearance.dart (Palette)
- panga_pangisha/lib/screens/profile_edit_screens.dart (ClayCard only)
- panga_pangisha/lib/screens/owner/rentals.dart (RentBars only)
- panga_pangisha/lib/l10n.dart (tzs, tzsShort)
- panga_pangisha/lib/screens/shell.dart (bottom navigation around it)

## landlord-properties, landlord-properties-map, landlord-property-detail
Entry: panga_pangisha/lib/screens/owner/properties.dart
Dependencies:
- panga_pangisha/lib/ui.dart
  - panga_pangisha/lib/appearance.dart
- panga_pangisha/lib/screens/owner/rentals.dart (HouseRecords in the detail tabs)
- panga_pangisha/lib/screens/customecontrols/pickers.dart
- panga_pangisha/lib/screens/shell.dart

## landlord-tenants, landlord-tenant, landlord-rent-payments, landlord-maintenance
Entry: panga_pangisha/lib/screens/owner/rentals.dart
Dependencies:
- panga_pangisha/lib/ui.dart
  - panga_pangisha/lib/appearance.dart
- panga_pangisha/lib/screens/customecontrols/pickers.dart
- panga_pangisha/lib/screens/profile.dart (ViewingsList only)
- panga_pangisha/lib/screens/shell.dart

## landlord-add-property
Entry: panga_pangisha/lib/screens/owner.dart
Dependencies:
- panga_pangisha/lib/ui.dart
- panga_pangisha/lib/screens/customecontrols/pickers.dart

## account
Entry: panga_pangisha/lib/screens/profile.dart
Dependencies:
- panga_pangisha/lib/ui.dart
- panga_pangisha/lib/screens/profile_edit_screens.dart

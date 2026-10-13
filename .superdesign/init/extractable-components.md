# Extractable components

## Layout components

## BottomNav
- Source: `panga_pangisha/lib/screens/shell.dart`
- Category: layout
- Description: Floating dark frosted pill with four tabs (Home, Properties, Tenants, Messages) and a separate round Account button
- Extractable props: activeItem (string, default: "home"; one of home, properties, tenants, messages, account)
- Hardcoded: Material icons, tab labels, sizes, colours

## ScreenHeader
- Source: `panga_pangisha/lib/screens/owner/rentals.dart` (`_Page`)
- Category: layout
- Description: Round back button, title and a quiet line under it, round action icons on the right
- Extractable props: none that change the structure (title and subtitle are content)
- Hardcoded: back icon, sizes, colours

## Basic components

## ClayCard
- Source: `panga_pangisha/lib/screens/profile_edit_screens.dart`
- Category: basic
- Description: Raised card with a lit edge and a soft drop shadow
- Extractable props: none
- Hardcoded: border, shadows

## Button, Choice, Tag, Avatar, RoundIcon
- Source: `panga_pangisha/lib/ui.dart`
- Category: basic
- Description: The app's buttons, selectable pills, fact tags, initials avatar and round icon button
- Extractable props: none worth extracting (too simple; inline them)

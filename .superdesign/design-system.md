# Panga na Kupangisha: design system (landlord app)

## Product
A Tanzanian rental app. A landlord lists homes, answers viewing requests, records tenants, rent and repairs. Money is in Tanzanian
shillings written "TSh 850,000". Names, places and copy are Tanzanian (Dar es Salaam: Kinondoni, Ilala, Mikocheni, Upanga).
It is a phone app (Flutter): design at 412 x 892, one column, thumb-reachable actions, a floating bottom navigation.

Key landlord screens: Dashboard, Properties (list, map, detail, add), Tenants, Tenant, Rent payments, Maintenance, Messages, Account.
Jobs: see this month's rent at a glance; know what is waiting; reach the four common actions in one tap.

## Look: restrained claymorphism, professional
- Plain page background `#F5F7F9`. Never gradients, blobs or coloured washes behind content.
- Raised "clay" cards: white, radius 18-24, 2px white lit edge, soft drop shadow `rgba(148,163,184,.28)` offset 5/7 blur 16 and a white
  highlight offset -4/-4 blur 12. Depth is gentle; nothing looks like a toy.
- One accent: navy blue `#173EAB` for text, icons and active states; `#0E266A` behind white text (primary buttons, selected
  segments); pale accent `#E8EBF3` behind icons. Dark hero surface `#0B1B2B` with white text.
- Attention is brass: `#FFF3D1` card with `#7A5200` icon. Good is green `#0B7A45` on `#DCF5E6`. Error `#D8405A` on `#FCE8EC`.
- Text: ink `#0F1B2A`, secondary `#5C6B77`, hint `#94A3B8`.
- Fonts: Bricolage Grotesque for titles and figures (700-800, tight tracking), Figtree for everything else. No other fonts.
- Compact: small text and cards. Section titles 15.5px, row titles 14px, secondary 12.5px, captions 11.5px. Page gutter 20px.
- Icons: Material Icons (outlined / rounded), 17-22px, never emoji.
- Dark mode: page `#121316`, cards `#191B20`, card edge white at 7%, shadows black. Nothing white or glowing.

## Components
- Bottom navigation: floating dark frosted pill (height 52, radius 26) with Home, Properties, Tenants, Messages; a separate 52px
  round Account button to its right; active tab is a lighter rounded pill.
- Screen header: round white back button (44), title 19/800 with a 12.5px line under it, round action icons on the right.
- Segmented control: white pill group, selected segment filled `#0E266A` with white 12.5/700 text.
- Primary button: full width, height 56, radius 18. Floating add button: same style, not full width, bottom right above the nav.
- Status badge: small pill, 11.5/700.
- Money is always "TSh 1,200,000"; short form "1.2M", "850K" on charts.

## Motion
Content rises 18px and fades in on load, staggered 60ms. Taps sink to 96% scale. Bars grow from zero. Nothing bounces.

## Rules
Every figure is real data; no decorative numbers. Use ONLY these fonts, colours and component styles.

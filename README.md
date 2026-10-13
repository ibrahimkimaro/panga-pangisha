# Panga Pangisha

Mobile app (Flutter) for renting houses in Tanzania.

| Part | Folder | Notes |
|---|---|---|
| Mobile app | `panga_pangisha/` | Flutter |
| Backend | `backend/api/` | One Laravel 13 app: mobile API (`/api`, Sanctum), landing page (`/`) and admin panel (`/admin`, Inertia + React TSX), Postgres |
| Realtime chat | `backend/realtime-chat/` | Elixir/Phoenix channels (DMs, presence, typing, calls) |

## Run the backend
```bash
cd backend && docker compose up -d --build   # db + Laravel (:8100: API, website, admin) + Phoenix chat (:4100)
```
- Android emulator reaches the host as `10.0.2.2` (`http://10.0.2.2:8100/api`, `ws://10.0.2.2:4100/socket`).
- Laravel and Phoenix share `CHAT_SECRET_KEY`.
- Demo data: `docker compose exec api php artisan db:seed --force` adds ten Dar es Salaam listings and six
  accounts, all with password `demo1234`: `owner@demo.test`, `agent@demo.test`, `tenant@demo.test`, two more renters, and `newowner@demo.test`
  (a landlord still waiting for identity approval).
- Website: http://localhost:8100, admin panel at http://localhost:8100/admin. Put `ADMIN_EMAIL` and `ADMIN_PASSWORD`
  in `backend/.env` (see `.env.example`); the account is created when the backend starts.
- Email (password-reset codes): copy `backend/.env.example` to `backend/.env`, fill in the SMTP values, then
  `docker compose up -d api`. Without it, emails and SMS codes are only written to `docker compose logs api`.

## Run the app
```bash
cd panga_pangisha && flutter run                                        # emulator
flutter run --dart-define=API_HOST=http://<your-computer-ip>:8100       # real phone on the same Wi-Fi
```
`lib/ui.dart` is the design system (colours, type, shared widgets), `lib/api.dart` the server client,
`lib/l10n.dart` English/Swahili, `lib/screens/` one file per area. `lib/screens/customecontrols/` holds the shared
pickers and their data: `countries.dart` (countries and dial codes for registration) and `RegionsDistrict.dart`
(Tanzania's regions and districts for the add-home wizard). `legacy_ui/` holds the pre-redesign
screens for reference and is not compiled.

## Website and admin panel
They live inside the Laravel backend, so there is one engine and one set of models.
- Pages: `backend/api/resources/js/pages/` (one file per screen), `layouts/AdminLayout.tsx`, `components/ui.tsx`,
  palette in `resources/css/app.css` (same colours and fonts as the app).
- Server side: `routes/web.php`, `app/Http/Controllers/Admin/`, `app/Http/Middleware/EnsureAdmin.php`.
- Saving a file shows up at once: `docker compose up -d` also loads `docker-compose.override.yml`, which runs the
  backend from your working copy and starts a Vite dev server (port 5173) that hot-reloads pages and CSS.
  Check types with `cd backend/api && npm run typecheck`.
- After `composer require` or a new migration, restart with `docker compose up -d --force-recreate api`.
- Production-style run of the baked image, without the dev server: `docker compose -f docker-compose.yml up -d --build`.
- Admins sign in on the website only; the mobile API refuses them and is token-only.
- Admin panel areas: Overview, Identity checks, Business checks, Listings to verify, Reports, Users, Listings, Viewing requests,
  Announcements (a notification to everyone, tenants or landlords), Team (add or remove admins), Activity log.
  Users and Listings download as CSV with the current filters.

## Appearance (theme, accent colour, size)
One setting for the whole app, under Account > Appearance: light, dark or follow the phone; an accent colour
(navy blue by default, other swatches or any hue); a background tone; and a size (small is the default). It is stored on the phone.
- `lib/appearance.dart` holds the choice (`Look`), works every colour out from it (`Palette`) and applies it (`Appearance.set`).
- Screens never hold colours of their own. They use the names in `C` (`lib/ui.dart`): `C.card`, `C.wino` (text),
  `C.muted`, `C.line`, `C.fill`, `C.teal` (accent for text and icons), `C.mkoko` (accent behind white text),
  `C.navy` (dark surface) and so on. A hard-coded `Color(0xFF...)` or `Colors.white` surface will not follow the theme.
- Because colours are read while widgets build, a widget that uses `C` cannot be `const`.
- Size is one scale applied in `MaterialApp.builder` (`fitToSize`), so text, cards and spacing change together.
- Pages sit on the plain page background (`GlassBackdrop` is just `C.chokaa`). `Glass` cards blur only where asked
  (`blur: true`: over the map, photos, messages).
- The landlord dashboard (`owner/landlord_dashboard.dart`) is built from `ClayCard`: this month's rent against what
  is due, four shortcuts, an overview, what is waiting, and two charts. Notifications sit behind the bell only. Its
  greeting follows the phone's clock (`greeting(hour)`: morning 5, afternoon 12, evening 17, night 21).
- Raised "clay" cards take their lit edge from `C.edge` and their drop shadow from `C.shade`, never `Colors.white`
  or a fixed grey: both go quiet in dark mode.

## Landlord properties (storyboard screens 11 to 14)
- `lib/screens/owner/properties.dart`: the property list with search, filters and sort (`OwnerHomeTab`), the map of
  the landlord's own homes (`PropertiesMapScreen`) and one property with its tabs (`PropertyDetailScreen`).
- `lib/screens/owner.dart`: the four-step Add property wizard (`AddHomeScreen`: Details, Location, Media, Review).
- Its Tenants, Payments and Maintenance tabs show that home's own records (see below).

## Tenants, rent payments and maintenance (storyboard screens 15 to 18)
A landlord's own records, kept per home. Panga records rent; it does not move money.
- Server: `RentalController` (`/api/tenants`, `/api/tenants/{id}/payments`, `/api/rent-payments`, `/api/maintenance`),
  tables `tenancies`, `rent_payments`, `maintenance_requests`. Every route is limited to homes the caller owns, and
  `?house=ID` narrows a list to one home. A tenant whose phone matches a Panga account is linked to it, so the
  landlord can message them and they are told when rent is recorded or a repair moves on.
- A home cannot be deleted while a tenancy in it is active (its records would go with it).
- App: `lib/screens/owner/rentals.dart`. The Tenants tab (with viewing requests beside it) opens a tenant, Rent
  payments and Maintenance; Maintenance also opens from Account. Months are counted in Tanzanian time.
- Demo rows for `owner@demo.test`: `php artisan db:seed --class=RentalDemoSeeder` (does nothing if they exist).
- Not built: tenant documents, payment history older than six months in the overall list (each tenant keeps their
  latest 100), and tenants filing repair requests from their own app.

## Landlord identity check
A landlord's dashboard stays shut until an admin approves them.
1. App (`lib/screens/owner/identity_verification.dart`): the landlord sends a 20-digit NIDA number or a photo of the
   NIDA card (`POST /api/identity`), then waits on an animated screen that asks `GET /api/identity` every 3 seconds.
2. Admin panel, **Identity checks**: the queue refreshes by itself; approve, or reject with a reason.
3. App: approved shows a thank-you and welcome, then profile setup, the landlord tour and the dashboard. Rejected shows
   the reason and the form again.

NIDA numbers are encrypted in the database; card photos sit on a private disk and are only served to signed-in admins.
The API refuses to create a listing for a landlord who is not approved. Try it with `newowner@demo.test` after a fresh seed.

## Business verification
Separate from the identity check and optional: a user fills in **Business Information** in the app (name, category, TIN,
BRELA, VAT, contacts, address, website, about) and it goes to the admin panel's **Business checks** queue
(`GET`/`POST /api/business`). An admin verifies it or rejects it with a reason; the app shows the status and the reason.
Editing the details after approval sends them back for review.

## Live notifications
`lib/live.dart` keeps one Phoenix socket open while someone is signed in and joins their own `user:<uuid>` channel.
Anything sent as an `AppNotification` (an admin's message to one person, an announcement, an identity or business
decision) is stored in their notification list and pushed to that channel, where the app shows it as a banner at once.
It also goes into the phone's notification tray through `flutter_local_notifications` (channel "Messages and alerts"),
headed by the app name and the account's name; the payload carries `user_id`, `user_name` and `app`. If the person has
notifications switched off, the app shows its own banner instead.
With the app closed nothing is pushed to the phone yet (that needs Firebase Cloud Messaging); the message waits in the list.

## Chat in the app
`lib/screens/chat.dart`. The inbox lists people from `GET /api/conversations` (with the last message and unread count)
and updates live through `lib/live.dart`: green dot for online, "typing…", new messages and unread badges. A chat room
joins `direct:<a>_<b>` on the Phoenix server and uses its events: `new_msg`, `typing`/`user_typing`, `read_receipt`/
`messages_read` (one tick sent, two bright ticks seen), `older` (earlier messages load as you scroll up) and
`delete_msg`/`msg_deleted`. The list is anchored at the bottom, newest last.
The pencil button in Messages opens `lib/screens/new_chat.dart`: search people (`GET /api/people?q=`, names, roles and
photos only; a full phone number also finds its owner) and start a chat, or pick several and name a group
(`POST /api/chat/groups`). A group is a `room:<slug>` on the chat server, which checks membership on every join;
Laravel writes the group and its members into the chat server's tables. `GET /api/chat/groups/{slug}` lists members.

## How Laravel and Phoenix talk
- App asks Laravel `GET /api/chatApp/token/?peer=<id>` -> signed socket token + `direct:<a>_<b>` topic, then talks to Phoenix directly.
- Laravel -> Phoenix: `App\Services\Phoenix::pushToUser()` live-pushes a `notification` event to the user's `user:<uuid>` channel (used by `AppNotification`, which also stores a DB notification).
- Phoenix -> Laravel: on every stored message Phoenix calls `POST /api/internal/push` (the hook for FCM push).

## Tests
```bash
cd backend && docker compose run --rm --no-deps api php artisan test   # in-memory SQLite, never the dev DB
cd panga_pangisha && flutter analyze && flutter test
```

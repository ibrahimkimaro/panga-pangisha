# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Panga na Kupangisha ("Panga Pangisha"): a Tanzanian house-rental app. The repo's `README.md` is the detailed feature
guide (identity checks, rentals, chat, notifications, appearance); read the relevant section before touching a feature.

## Layout
| Part | Folder | Stack |
|---|---|---|
| Mobile app | `panga_pangisha/` | Flutter |
| Backend | `backend/api/` | One Laravel 13 app: mobile API (`/api`, Sanctum tokens), landing page (`/`), admin panel (`/admin`, Inertia + React TSX), MCP server (`/mcp/veyora`) |
| Realtime chat | `backend/realtime-chat/` | Elixir/Phoenix channels on its own Postgres DB (`realtime_chat_db`), raw SQL via Postgrex |
| Specs / designs | `Project Structure/`, `*.png`, `.superdesign/design-system.md` | PRD, SRS, storyboards, landlord design system |

`panga_pangisha/legacy_ui/` is pre-redesign reference code: not compiled, excluded from analysis, don't edit it.

## Commands
```bash
# Backend (Postgres + Laravel on :8100 + Phoenix on :4100 + Vite dev server on :5173)
cd backend && docker compose up -d --build
docker compose exec api php artisan db:seed --force            # demo data, all passwords demo1234:
#   owner@demo.test, agent@demo.test, tenant@demo.test, newowner@demo.test (landlord awaiting identity approval)
docker compose up -d --force-recreate api                      # after composer require or a new migration
docker compose -f docker-compose.yml up -d --build             # production-style, no override / no Vite

# Backend tests (in-memory SQLite, never the dev DB)
docker compose run --rm --no-deps api php artisan test
docker compose run --rm --no-deps api php artisan test --filter=PangaApiTest              # one class
docker compose run --rm --no-deps api php artisan test --filter=test_method_name          # one test
cd backend/api && npm run typecheck                            # admin/website TSX
docker compose exec api vendor/bin/pint                        # PHP formatting

# Phoenix has no ExUnit suite; end-to-end checks against the running stack (create/delete chattest_* users):
CHAT_URL=ws://localhost:4100/socket CHAT_SECRET=<CHAT_SECRET_KEY> node backend/realtime-chat/bench/chat_check.mjs
#   (call_check.mjs alongside it covers WebRTC call signaling)

# Flutter
cd panga_pangisha && flutter run                               # emulator: http://10.0.2.2:8100/api, ws://10.0.2.2:4100/socket
flutter run --dart-define=API_HOST=http://<lan-ip>:8100         # real phone
flutter analyze && flutter test
flutter test test/logic_test.dart                              # one file
flutter test --plain-name "name of test"                       # one test

# Restore DB dumps into the running db container
./backend/database/backup/restore.sh
```
`docker-compose.override.yml` (loaded automatically) bind-mounts `backend/api` into the container, so PHP edits apply
on the next request and React/CSS hot-reload. Because the mount hides the image's own `vendor/`, a fresh checkout
needs `backend/api/vendor` installed (e.g. `docker compose run --rm --no-deps api composer install`) before the dev stack runs. Dev SMS codes and emails (without SMTP config) appear in `docker compose logs api`.
Admin login comes from `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `backend/.env`.

## Architecture

### Laravel ↔ Phoenix
- Laravel and Phoenix share `CHAT_SECRET_KEY`. The app gets a signed socket token and topic from Laravel
  (`GET /api/chatApp/token/?peer=<id>`), then talks to Phoenix directly.
- Topics: `user:<uuid>` (personal live notifications), `direct:<a>_<b>` (DMs), `room:<slug>` (groups; Laravel writes
  group membership into the chat DB, Phoenix checks it on join), `call:<id>` (WebRTC signaling).
- Laravel → Phoenix: `App\Services\Phoenix::pushToUser()`; `AppNotification` both stores a DB notification and pushes it.
- Phoenix → Laravel: `POST /api/internal/push` on every stored message (hook point for FCM, not yet built).
- Chat DB schema lives in `backend/realtime-chat/init_schema.sql`, applied by `backend/docker/db-init.sh` on first DB init.

### Backend authorization model
- Admins sign in on the website only; the mobile API refuses them and is token-only.
- Landlord routes are scoped to homes the caller owns (`?house=ID` narrows lists). A landlord can't create listings
  until an admin approves their identity check. Business verification is separate and optional.
- NIDA numbers are encrypted at rest; card photos live on the private disk (`storage/app/private`) and are only served
  to signed-in admins. Keep `INERTIA_DEVTOOLS_ENABLED=false` (it would dump admin page data, NIDA included, to disk).
- Panga records rent; it does not move money.

### Veyora AI assistant (`backend/api/app/Ai`, `app/Mcp`)
- Every model call must go through `App\Services\Ai\AiGateway::ask()`: it applies the admin-configured provider/model
  (`AiSetting`), limits, rate limit and timeout, and writes `AiUsageLog`. Failures surface as `AiBlocked`.
- Flow: `VeyoraAssistantController` (`/api/ai/assistant/*`) → `VeyoraOrchestrator::handle()` → `VeyoraAssistant` agent
  (laravel/ai) sent to the model first ("model-first"). The model picks tools itself; `VeyoraAssistant::tools()` exposes
  MCP tools wrapped in `McpServerTool`, chosen by the user's role. On model failure the orchestrator falls back to
  `VeyoraKnowledgeEngine` (curated knowledge) instead of erroring.
- After the model replies, `resolvePresentationFromExecution()` maps tool results to a `VeyoraPresentationContract`
  (`presentation`, `structured_data`, `actions`) that the Flutter screen `lib/screens/veyora_assistant.dart` renders as cards/lists.
- MCP tools live in `app/Mcp/Tools/<Domain>/` and must enforce authorization themselves from `auth()->user()` (the
  orchestrator sets it); model output must never widen access. New tools need registering in both
  `VeyoraMcpServer::$tools` and `VeyoraAssistant::tools()`.
- `knowledge/*.md` is the curated knowledge base injected into prompts (see `knowledge/README.md`); don't describe
  unbuilt features as live there without noting it in `platform_capabilities.md`.
- `docs/veyora_conversation_architecture.md` describes the earlier deterministic "decision ladder"; the current code is
  model-first, so trust the code where they differ.

### Flutter app (`panga_pangisha/lib`)
- `api.dart` server client (host from `--dart-define=API_HOST`), `live.dart` the single Phoenix socket while signed in,
  `l10n.dart` English/Swahili strings, `ui.dart` design system, `appearance.dart` theme, `screens/` one file per area
  (`screens/owner/` for landlord flows, `screens/customecontrols/` for shared pickers and Tanzania region/country data).
- Theming rule: screens never hard-code colours. Use the names on `C` in `ui.dart` (`C.card`, `C.wino`, `C.muted`,
  `C.teal`, `C.mkoko`, …); `Color(0xFF...)` or `Colors.white` surfaces won't follow light/dark/accent. Widgets that
  read `C` cannot be `const`. Clay cards take edge/shadow from `C.edge`/`C.shade`.
- Size scaling is global (`fitToSize` in `MaterialApp.builder`); don't scale individual widgets.
- Months for rent are counted in Tanzanian time; money is shown as "TSh 1,200,000" (short "1.2M"/"850K" on charts).

### Admin panel / website (`backend/api/resources/js`)
Inertia pages in `pages/` (one per screen), `layouts/AdminLayout.tsx`, shared `components/ui.tsx`, palette in
`resources/css/app.css` (same colours/fonts as the app). Server side: `routes/web.php`, `app/Http/Controllers/Admin/`,
`app/Http/Middleware/EnsureAdmin.php`.

## Design rules (landlord UI, from `.superdesign/design-system.md`)
Restrained claymorphism on a plain background (no gradients/blobs), one navy accent, brass for attention. Fonts are
Bricolage Grotesque (titles/figures) and Figtree only. Material icons, never emoji. Every figure shown must be real data.
Tanzanian names, places and copy.

## Notes
- `backend/api/CLAUDE.md` / `AGENTS.md` are an unconfigured Laravel Boost bootstrap stub; they don't describe this app.
- `.github/workflows/dart.yml` runs plain `dart analyze`/`dart test` at the repo root, which doesn't match the Flutter
  project in `panga_pangisha/`; don't rely on it as a signal.

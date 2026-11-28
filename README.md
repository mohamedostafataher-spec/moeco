# MoEco — بيئة مصر

Free Egyptian environmental awareness platform. Arabic-first (Egyptian dialect), RTL, mobile-first.

- **Web app:** https://moeco-eg.vercel.app (React + Vite + Supabase, deployed on Vercel)
- **Flutter app:** `flutter/` — native Android APKs via CI, release tag `flutter-preview`

## Repository structure

| Path | What lives here |
| --- | --- |
| `pages/`, `components/`, `context/`, `services/` | Web app source (React + TypeScript) |
| `server/`, `server.ts` | Optional Express backend (auth routes, models, middleware) |
| `flutter/` | Native Flutter app (see `flutter/README.md`) |
| `supabase/migrations/` | Dated database migrations — the only place new schema changes go |
| `supabase/functions/` | Edge functions (e.g. `sync-news-alerts`) |
| `.github/workflows/` | CI: Flutter analyze + test + APK builds on `flutter/**` pushes |
| `resources/` | App icon sources (SVG) |

### Legacy files (do not add to)

The repository root still carries one-off diagnostic scripts (`check_*.ts`, `run_*.ts`, `seed_*.ts`) and historical repair SQL (`*_FIX.sql`, `FINAL_*.sql`) from earlier incident work. They are kept for audit history only. **New schema changes go in `supabase/migrations/` with a dated filename. New utility scripts go in `scripts/`.** Nothing new gets added to the root.

## Development rules

1. No secrets in the repo. Copy `.env.example` to `.env` locally; the service-role key never gets a `VITE_` prefix.
2. No fake or demo data. Unavailable data gets an honest empty/unavailable state; illustrative content is labeled as such in the UI.
3. No technical or vendor wording in user-facing copy.
4. All user-facing strings are centralized (web i18n + `flutter/lib/strings.dart`), Arabic first.
5. Free tier only: Vercel, Supabase free, GitHub Actions (public repo), Open-Meteo.

## Code review checklist (solo-dev flow)

Every change, before commit:

- [ ] Web: `npm run lint` (`tsc --noEmit`) passes.
- [ ] Flutter: `flutter analyze` and `flutter test` pass (CI enforces both on every `flutter/**` push).
- [ ] Commit does one thing, with a message that says what and why.
- [ ] After pushing: verify the commit landed via the commits API and re-read the changed file from `main`.
- [ ] Deployed behavior re-verified on the live site / rebuilt APK before reporting done.

## Automated checks

- **Flutter CI** (`.github/workflows/flutter-apk.yml`): `flutter analyze`, `flutter test`, release APK builds (universal + per-ABI), rolling `flutter-preview` release.
- **Web CI:** type-check via `npm run lint`; Vercel builds fail on type errors.

## Known technical debt

Tracked here until it graduates to a dated migration or a dedicated fix commit.

1. Root legacy scripts and repair SQL sprawl (see above) — frozen, archived in place; migrate on touch.
2. Web app has no automated test runner yet; Flutter tests exist and run in CI.
3. No error monitoring (crash reporting) on either app.
4. No Terms of Service page; Privacy page exists at `/privacy`.
5. No forgot-password flow; Supabase `resetPasswordForEmail` is the planned free path.
6. Dark-designed pages render poorly on the light theme; theme audit pending.
7. Database backup/retention relies on Supabase free-tier defaults; no export automation.

## License

All rights reserved — Mohamed Salem.

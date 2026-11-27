# MoEco Flutter (Phase 1)

Native Flutter version of MoEco (https://moeco-eg.vercel.app). Arabic-first RTL, Material 3 MoEco theme.

## Status: Phase 1 scaffold (v0.1.0)

- 5 core screens: Home (daily footprint log + streak, local), Carbon Calculator (same factors as the web app: 0.42 kg CO2e/kWh grid, 0.298 kg CO2e/m3 water, 0.192 kg CO2e/km car), My Complaints (local private drafts + verified official channels), Local Projects (honest empty state, verified-source policy), More (about, privacy, language toggle AR/EN).
- Local-only persistence via shared_preferences. Nothing leaves the device. No fake data, no demo content.
- Next: Supabase backend wiring (same project as the web app), remaining web pages, motion polish.

## Build

CI builds a debug-signed preview APK (installable via sideload) on every push under `flutter/**`:
`.github/workflows/flutter-apk.yml` -> release tag `flutter-preview`.

Local: `flutter create --platforms android .` (generates the android folder), then `flutter pub get && flutter run`.

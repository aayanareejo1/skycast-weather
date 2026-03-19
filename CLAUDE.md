# SkyCast — Claude Context

## Project
Cross-platform mobile weather app built with Expo (React Native) + TypeScript.
Notification-first: alerts users before weather changes happen.

## Key facts
- App name: **SkyCast**
- GitHub: https://github.com/aayanareejo1/skycast-weather (private)
- Package name: `skycast-weather`
- Bundle ID: `com.skycast.weather`
- Expo SDK: 55 (managed workflow)
- Entry point: `expo-router/entry` (file-based routing via `app/` folder)

## Tech stack
- **Navigation**: Expo Router (tabs: Home / Search / Alerts / Settings)
- **Weather API**: Open-Meteo — free, no API key, no .env needed
- **Location**: expo-location (Accuracy.Balanced)
- **Notifications**: expo-notifications + expo-task-manager + expo-background-fetch
- **Storage**: @react-native-async-storage/async-storage
- **Icons**: @expo/vector-icons (Ionicons)
- **Fonts**: DM Sans via @expo-google-fonts/dm-sans (300Light, 400Regular, 500Medium)
- **Slider**: @react-native-community/slider
- **Time picker**: @react-native-community/datetimepicker@8.6.0 (pinned — 9.x breaks Expo 55)
- **Haptics**: expo-haptics (buttons, tabs, add/remove city, onboarding)
- **Network**: @react-native-community/netinfo (offline detection)

## Running the app
```bash
npm install
npx expo start        # run in YOUR OWN terminal (needs interactive mode for QR code)
```
- Press `i` → iOS Simulator (Mac only)
- Press `a` → Android Emulator
- Scan QR → Expo Go on phone

## TypeScript check
```bash
npx tsc --noEmit
```

## Feature status (all complete)
- [x] Home screen (temp, hourly strip, rain bars, 7-day, alert banner, city tabs)
- [x] Search screen (debounced geocoding, saved cities, commuter toggle, remove, reorder)
- [x] Alerts screen (24h severity cards, grouped by weather event, pull-to-refresh)
- [x] Settings screen (units, activity profile, rain sensitivity, notification toggles)
- [x] Onboarding flow (welcome → location → notifications, animated dot indicator)
- [x] Commuter mode (per-city toggle, differential weather alert on home screen)
- [x] Daily digest time picker (native DateTimePicker, iOS sheet / Android dialog)
- [x] Background fetch task (15min, DND window, per-city staggered fetches)
- [x] Skeleton loaders, pull-to-refresh, AbortController cleanup, AsyncStorage cache
- [x] Haptic feedback (city tabs, add/remove city, onboarding buttons, pull-to-refresh)
- [x] Network offline banner (home screen, uses netinfo)
- [x] Timezone label on hourly strip (shows city's local time when different from device)
- [x] Stale data warning (shows "Data from Xh ago" when cache > 2 hours old)
- [x] Rain sensitivity consistent across home + alerts screens (both use settings value)

## Known gaps / next up
- [ ] DND hour sliders — `dndStart`/`dndEnd` exist in storage but Settings has no UI to change them
- [ ] Search results use `.map()` not FlatList — should be virtualized
- [ ] Notification permission banner doesn't distinguish "never asked" vs "denied" (denied users need deep link to system Settings)
- [ ] Cache cleanup — old city weather entries never purged from AsyncStorage
- [ ] App icon — still default Expo icon (needs 1024×1024 PNG)

## File structure
```
app/
  _layout.tsx       # Root: fonts, tab bar, notification channel, onboarding redirect
  index.tsx         # Home screen
  search.tsx        # City search + saved cities manager (with reorder)
  alerts.tsx        # 24h alert list (grouped by weather event)
  settings.tsx      # All settings
  onboarding.tsx    # First-launch 3-step flow (animated dots)

components/
  AlertBanner.tsx       # Amber warning banner (also used for offline/error)
  CityTabs.tsx          # Horizontal city switcher (haptic on tap)
  HourlyStrip.tsx       # Horizontal ScrollView (NOT FlatList); shows timezone label when city differs from device
  RainBars.tsx          # Rain probability bar chart
  WeekForecast.tsx      # 7-day FlatList (useCallback on renderItem + keyExtractor)
  SkeletonLoader.tsx    # Animated opacity skeleton
  NotificationToggle.tsx # Labeled switch row
  TimePicker.tsx        # Native time picker (iOS modal / Android dialog)

hooks/
  useWeather.ts         # Fetch + cache + AbortController + stale-while-revalidate
  useLocation.ts        # Permission flow + AppState listener (fixes stale permission bug)
  useCities.ts          # AsyncStorage city management (add/remove/update/reorder)
  useNotifications.ts   # Permission + background task registration
  useCommuterAlert.ts   # Compares home vs commuter city next-4h forecast
  useNetworkStatus.ts   # NetInfo online/offline boolean

services/
  weatherApi.ts     # Open-Meteo fetch, geocoding, WMO code → label/icon/severity
  notifications.ts  # Background task definition, scheduling, DND logic
  storage.ts        # AsyncStorage helpers (cities, settings, cache, onboarding flag)

constants/
  colors.ts         # Dark theme palette
  config.ts         # Cache TTL, max cities, thresholds
```

## Design system (dark theme)
- Background: `#0A0F1E`
- Surface: `#111827`
- Accent blue: `#378ADD`
- Alert amber: `#EF9F27`
- Success green: `#1D9E75`
- Text primary: `#FFFFFF`
- Text secondary: `rgba(255,255,255,0.55)`
- Text muted: `rgba(255,255,255,0.30)`
- Card border: `rgba(255,255,255,0.08)`
- Font sizes: temp=68px/300, section labels=10px/500/uppercase, body=15px/400

## Known bugs to avoid
1. Never use anonymous functions in FlatList `renderItem` / `keyExtractor` — always `useCallback`
2. Always call `BackgroundFetch.finish(taskId)` in every code path including errors
3. Use AppState listener to re-check location permissions on app resume (Expo bug)
4. Every screen needs try/catch with rendered fallback — no unhandled rejections
5. Android 13+: call `Notifications.requestPermissionsAsync()` explicitly during onboarding
6. Android notification channel: created via `setNotificationChannelAsync()` in `_layout.tsx`
7. KeyboardAvoidingView: `padding` on iOS, `height` on Android
8. Background fetch needs a dev build — silently unavailable in Expo Go
9. Stagger multi-city fetches 200ms apart
10. `Config` uses `as const` — literal types inferred; use explicit `useState<number>()` when initializing from Config values
11. `useFocusEffect` (from expo-router) is used on Home to re-sync settings (unit pref + rain sensitivity) whenever the tab is focused
12. Home screen tracks selected city by **ID** (`selectedCityId`), not index — so reordering or deleting cities in Search doesn't break the active tab
13. NetInfo `state.isConnected` can be `null` during initialization — treat `null` as online (not offline) to avoid false offline banner flash

## Git conventions
- `feat:` new feature
- `fix:` bug fix
- `chore:` setup/config
- One commit per feature, push after each commit
- User has git installed — use `git push` directly (no gh CLI needed)

## Deployment — EAS Build
- `eas.json` is configured with `development` (internal), `preview`, and `production` profiles
- `cli.appVersionSource: "remote"` is set (suppresses EAS warning)
- `expo-dev-client` is installed
- EAS CLI is available via `npx eas-cli` (NOT globally installed — `eas` alone won't work)
- User's Expo account: **aareejo** (EAS username) / aayanareejo1 (GitHub)
- iOS build requires Apple Developer account ($99/yr) — user does NOT have one yet
- Android build: `npx eas-cli build --profile development --platform android`
- To start dev server for dev build: `npx expo start --dev-client`
- Login: `npx eas-cli login`
- Add `.claude/` to `.easignore` — EAS can't read settings.local.json (permission error)
- Expo Go limitations: background fetch, task manager, and notifications don't work in Expo Go — requires dev build

## Testing
- User tests on a physical Android device (no Apple Developer account for iOS)
- Port 8081 sometimes stays occupied after Claude runs expo — use `npx expo start --port 8082` or kill the process first
- `npx expo start` must be run in user's own terminal (interactive mode required for QR code)

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
- [x] Search screen (debounced geocoding, saved cities, commuter toggle, remove)
- [x] Alerts screen (24h severity cards, pull-to-refresh)
- [x] Settings screen (units, activity profile, rain sensitivity, notification toggles)
- [x] Onboarding flow (welcome → location → notifications, 3-step with dots)
- [x] Commuter mode (per-city toggle, differential weather alert on home screen)
- [x] Daily digest time picker (native DateTimePicker, iOS sheet / Android dialog)
- [x] Background fetch task (15min, DND window, per-city staggered fetches)
- [x] Skeleton loaders, pull-to-refresh, AbortController cleanup, AsyncStorage cache

## File structure
```
app/
  _layout.tsx       # Root: fonts, tab bar, notification channel, onboarding redirect
  index.tsx         # Home screen
  search.tsx        # City search + saved cities manager
  alerts.tsx        # 24h alert list
  settings.tsx      # All settings
  onboarding.tsx    # First-launch 3-step flow

components/
  AlertBanner.tsx       # Amber warning banner
  CityTabs.tsx          # Horizontal city switcher
  HourlyStrip.tsx       # Horizontal ScrollView (NOT FlatList) for hourly forecast
  RainBars.tsx          # Rain probability bar chart
  WeekForecast.tsx      # 7-day FlatList (useCallback on renderItem + keyExtractor)
  SkeletonLoader.tsx    # Animated opacity skeleton
  NotificationToggle.tsx # Labeled switch row
  TimePicker.tsx        # Native time picker (iOS modal / Android dialog)

hooks/
  useWeather.ts         # Fetch + cache + AbortController + stale-while-revalidate
  useLocation.ts        # Permission flow + AppState listener (fixes stale permission bug)
  useCities.ts          # AsyncStorage city management
  useNotifications.ts   # Permission + background task registration
  useCommuterAlert.ts   # Compares home vs commuter city next-4h forecast

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

## Git conventions
- `feat:` new feature
- `fix:` bug fix
- `chore:` setup/config
- One commit per feature, push after each commit
- User has git installed — use `git push` directly (no gh CLI needed)

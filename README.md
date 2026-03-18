# SkyCast — Weather That Warns You First

A cross-platform mobile weather app built with Expo (React Native) and TypeScript.
SkyCast is **notification-first**: it alerts you about weather changes *before* they happen,
so you're never caught off guard.

---

## Feature Status

- [x] Project setup (Expo SDK 55, TypeScript, Expo Router)
- [x] Design system (colors, typography, dark theme)
- [x] Weather API service (Open-Meteo, no API key required)
- [x] Geocoding / city search service
- [x] WMO weather code mapping (label + icon + severity)
- [x] AsyncStorage helpers (settings, cities, cache)
- [x] `useLocation` hook (permission flow, AppState listener)
- [x] `useWeather` hook (fetch + cache + abort controller)
- [x] `useCities` hook (persistent city management)
- [x] `useNotifications` hook (permission + background task)
- [x] Background fetch task (every 15 min, respects DND)
- [x] Notification scheduling (alerts, daily digest, UV, temp extremes)
- [x] Home screen (temperature, condition, hourly, 7-day, alert banner)
- [x] Search screen (debounced city search, add/saved state)
- [x] Alerts screen (24h alert list, severity badges)
- [x] Settings screen (units, activity profile, notification toggles, rain sensitivity)
- [x] Android notification channel setup on startup
- [x] Pull-to-refresh on all data screens
- [x] Skeleton loading states (no spinners)
- [x] Graceful error handling on all screens
- [x] Onboarding flow (welcome → location explanation → permission)
- [ ] Commuter mode (home vs work city weather diff alert)
- [ ] Daily digest time picker UI

---

## How to Run Locally

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli` (optional — npx works too)
- Expo Go app on your phone **or** an iOS Simulator / Android Emulator

### Install dependencies
```bash
npm install
```

### Start the dev server
```bash
npx expo start
```

Then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan the QR code with Expo Go on your phone

### TypeScript check
```bash
npx tsc --noEmit
```

---

## Weather API

**Open-Meteo** — [https://open-meteo.com](https://open-meteo.com)

- Completely **free**, no API key, no sign-up required
- Provides current conditions, hourly forecasts (up to 7 days), and daily summaries
- Includes a geocoding endpoint for city search
- Used for: current weather, 8-hour hourly strip, rain bar chart, 7-day forecast, alert detection

No `.env` file needed. All API calls are made directly from `services/weatherApi.ts`.

---

## Folder Structure

```
app/
  _layout.tsx       # Root layout: fonts, tab bar, notification channel setup
  index.tsx         # Home screen: current weather, hourly, 7-day, alert banner
  search.tsx        # City search + add to saved cities
  alerts.tsx        # 24-hour weather alerts for all saved cities
  settings.tsx      # Notification toggles, units, activity profile, rain sensitivity

components/
  AlertBanner.tsx       # Amber banner for upcoming weather changes
  HourlyStrip.tsx       # Horizontal scrollable hourly forecast
  RainBars.tsx          # Bar chart showing rain probability by hour
  WeekForecast.tsx      # 7-day forecast list (FlatList with useCallback)
  CityTabs.tsx          # Scrollable city switcher tabs
  SkeletonLoader.tsx    # Animated opacity skeleton (no spinners)
  NotificationToggle.tsx # Labeled switch row for settings

hooks/
  useWeather.ts         # Fetch + cache weather data with AbortController
  useLocation.ts        # Location permission + coords + AppState listener
  useCities.ts          # AsyncStorage city management (add/remove/reorder)
  useNotifications.ts   # Notification permission + background task registration

services/
  weatherApi.ts     # All Open-Meteo API calls + WMO code mapping
  notifications.ts  # Background task definition + scheduling logic
  storage.ts        # AsyncStorage helpers (cities, settings, cache)

constants/
  colors.ts         # Dark theme color palette
  config.ts         # Cache TTL, max cities, fetch intervals, thresholds
```

---

## Known Issues / Limitations

- **Background fetch on iOS**: Minimum interval is ~15 minutes regardless of configured value. Real-time background updates are not possible on iOS — this is an iOS system limitation.
- **Expo Go**: Background fetch and some notification features require a development build (`npx expo run:ios` or `npx expo run:android`) — they are silently unavailable in Expo Go.
- **Slider on Android**: Uses `@react-native-community/slider` which requires a native build for full functionality.
- **Onboarding flow**: Not yet implemented — app goes directly to home screen on first launch.
- **Commuter mode**: Saved cities support `commuterMode` flag but the differential alert logic is not yet wired up.

---

## Last Updated

2026-03-18 (onboarding added)

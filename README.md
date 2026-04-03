# SkyCast — Weather That Warns You First

Built for commuters. One afternoon I got completely soaked walking home because it had been clear all morning — the standard weather app showed no rain, but it started pouring mid-commute. So I built SkyCast: a background alert system that checks the weather at both your home and destination, and notifies you before you leave if conditions are about to change.

Cross-platform mobile app (iOS + Android) built with Expo and TypeScript.

---

## What makes it different

Most weather apps are passive — you open them to check. SkyCast is **notification-first**: it runs a background task every 15 minutes, compares conditions at your saved cities, and pushes an alert if something's changing before it happens.

**Commuter mode** is the core feature. Add your home city and your campus or office, toggle commuter mode on the city, and SkyCast will alert you when the weather is meaningfully different between the two — rain at your destination, temperature drop on the way back, that kind of thing. Built specifically with the daily campus-to-home commute in mind.

Other alerts include:
- Rain probability crossing your custom sensitivity threshold
- UV index warnings
- Temperature extremes
- Daily digest at a time you set

---

## Tech stack

| | |
|---|---|
| Framework | Expo SDK 55 (managed workflow) + TypeScript |
| Navigation | Expo Router (file-based, tab layout) |
| Weather API | Open-Meteo — free, no API key required |
| Location | `expo-location` |
| Background tasks | `expo-background-fetch` + `expo-task-manager` |
| Notifications | `expo-notifications` |
| Storage | `@react-native-async-storage/async-storage` |
| Fonts | DM Sans via `@expo-google-fonts/dm-sans` |

No `.env` file needed. All weather data comes from [Open-Meteo](https://open-meteo.com), which is completely free and requires no sign-up.

---

## How to run locally

### Prerequisites
- Node.js 18+
- Expo Go on your phone, or an iOS Simulator / Android Emulator

> Note: background fetch and notifications require a **dev build** (`npx expo run:android` or `npx expo run:ios`). They are silently unavailable in Expo Go.

```bash
npm install
npx expo start
```

Then press `a` for Android, `i` for iOS (Mac only), or scan the QR with Expo Go.

```bash
npx tsc --noEmit   # TypeScript check
```

---

## Folder structure

```
app/
  _layout.tsx       # Root layout: fonts, tab bar, notification channel setup
  index.tsx         # Home screen: temp, hourly, rain bars, 7-day, alert banner
  search.tsx        # City search + saved cities (commuter toggle, reorder)
  alerts.tsx        # 24h alert list, grouped by weather event + severity
  settings.tsx      # Units, activity profile, rain sensitivity, notification toggles
  onboarding.tsx    # First-launch 3-step flow

components/
  AlertBanner.tsx        # Amber warning banner (weather, offline, stale data)
  CityTabs.tsx           # Horizontal city switcher with haptic feedback
  HourlyStrip.tsx        # Scrollable hourly forecast with timezone label
  RainBars.tsx           # Rain probability bar chart by hour
  WeekForecast.tsx       # 7-day FlatList
  SkeletonLoader.tsx     # Animated opacity skeleton (no spinners)
  NotificationToggle.tsx # Labeled switch row for settings
  TimePicker.tsx         # Native time picker (iOS modal / Android dialog)

hooks/
  useWeather.ts          # Fetch + cache + AbortController + stale-while-revalidate
  useLocation.ts         # Permission flow + AppState listener
  useCities.ts           # AsyncStorage city management (add/remove/update/reorder)
  useNotifications.ts    # Permission + background task registration
  useCommuterAlert.ts    # Compares home vs commuter city next-4h forecast
  useNetworkStatus.ts    # NetInfo online/offline boolean

services/
  weatherApi.ts      # Open-Meteo API calls, geocoding, WMO code → label/icon/severity
  notifications.ts   # Background task, scheduling, DND logic
  storage.ts         # AsyncStorage helpers (cities, settings, cache)
```

---

## Known limitations

- **Background fetch on iOS** — minimum interval is ~15 minutes (iOS system constraint, not a bug)
- **Expo Go** — background fetch and notifications require a dev build to work
- **App icon** — still the default Expo icon; 1024×1024 PNG not yet added
- **DND hour range** — stored in AsyncStorage but Settings UI to change it isn't built yet

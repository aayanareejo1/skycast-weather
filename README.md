<h1 align="center">SkyCast</h1>

<p align="center">
  <strong>Background weather alerts for commuters. Know before you go.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-55-000020?style=flat-square&logo=expo" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Open--Meteo-Free_API-00B4D8?style=flat-square" />
  <img src="https://img.shields.io/badge/Platform-iOS_%7C_Android-lightgrey?style=flat-square" />
</p>

SkyCast runs in the background, checks the weather at your home and destination every 15 minutes, and notifies you before conditions change — before you leave, not after you're already soaked.

Built after I got caught in unexpected rain on the way home from campus. Every app I had showed the weather at one place. None of them warned me about what I was walking into.

## Features

- **Commuter mode** — Add a home city and a destination. SkyCast compares both and alerts you when there's a meaningful difference — rain at your destination, a temperature drop on the way back.
- **Smart alerts** — Rain probability, UV index, temperature extremes. Set your own sensitivity threshold so you only get notified when it actually matters.
- **Hourly and 7-day forecasts** — Scrollable hourly strip with a rain probability bar chart and a full week view.
- **Daily digest** — A morning summary delivered at a time you choose.
- **Multi-city support** — Add, remove, and switch between saved cities. Each city has its own commuter toggle.
- **Offline support** — Cached data with a stale-data warning if you haven't synced in over 2 hours.
- **Dark theme** — Designed to be readable in any lighting.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 55 + TypeScript |
| Navigation | Expo Router (file-based) |
| Weather data | Open-Meteo — free, no API key required |
| Background tasks | `expo-background-fetch` + `expo-task-manager` |
| Notifications | `expo-notifications` |
| Storage | `@react-native-async-storage/async-storage` |

No `.env` file needed. All weather data comes from [Open-Meteo](https://open-meteo.com).

## Getting started

### Prerequisites

- Node.js 18+
- Expo Go on your phone, or an iOS Simulator / Android Emulator

> Background fetch and push notifications require a **dev build**. They are silently unavailable in Expo Go.

### 1. Clone and install

```bash
git clone https://github.com/aayanareejo1/skycast-weather.git
cd skycast-weather
npm install
```

### 2. Run

```bash
npx expo start
```

Press `a` for Android Emulator, `i` for iOS Simulator, or scan the QR code with Expo Go.

```bash
npx tsc --noEmit   # TypeScript check
```

## Project structure

```
app/
  index.tsx         # Home screen — temp, hourly, rain bars, 7-day, alert banner
  search.tsx        # City search + saved cities with commuter toggle
  alerts.tsx        # 24h alert list grouped by weather event and severity
  settings.tsx      # Units, activity profile, rain sensitivity, notification toggles
  onboarding.tsx    # First-launch flow

components/         # AlertBanner, CityTabs, HourlyStrip, RainBars, WeekForecast
hooks/              # useWeather, useLocation, useCities, useNotifications, useCommuterAlert
services/           # weatherApi.ts, notifications.ts, storage.ts
```

## License

MIT

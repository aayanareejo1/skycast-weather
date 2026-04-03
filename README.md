<h1 align="center">SkyCast</h1>

<p align="center">
  <strong>A mobile weather app that warns you before the weather changes</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-55-000020?style=flat-square&logo=expo" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Open--Meteo-Free_API-00B4D8?style=flat-square" />
  <img src="https://img.shields.io/badge/Platform-iOS_%7C_Android-lightgrey?style=flat-square" />
</p>

SkyCast is a cross-platform mobile weather app built with Expo and TypeScript. It is notification-first: it alerts you about weather changes before they happen, so you are never caught off guard.

No API key required. SkyCast uses Open-Meteo, a free and open weather API with no sign-up needed.

## Features

- **Smart alerts** — Background weather checks every 15 minutes. Get notified before rain, UV spikes, or temperature extremes hit.
- **Hourly and 7-day forecasts** — Scrollable hourly strip, rain probability bar chart, and a full week forecast.
- **Multi-city support** — Add, remove, and switch between saved cities with a scrollable tab bar.
- **Commuter mode** — Compare home and work city weather in a single glance.
- **Daily digest** — A morning summary of what to expect for the day, delivered at your chosen time.
- **Customisable settings** — Toggle notification types, switch between metric and imperial units, set an activity profile, and adjust rain sensitivity.
- **Skeleton loading states** — No spinners. Content areas animate in as data loads.
- **Dark theme** — Designed for readability in any lighting condition.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 55 + Expo Router |
| Language | TypeScript |
| Weather data | Open-Meteo (free, no API key) |
| Background tasks | Expo Background Fetch + Task Manager |
| Notifications | Expo Notifications |
| Storage | AsyncStorage |

## Getting started

### Prerequisites

- Node.js 18+
- Expo Go on your phone, or an iOS Simulator / Android Emulator

### Install and run

```bash
git clone https://github.com/aayanareejo1/skycast-weather.git
cd skycast-weather
npm install
npx expo start
```

Then press `i` for iOS Simulator, `a` for Android Emulator, or scan the QR code with Expo Go.

### TypeScript check

```bash
npx tsc --noEmit
```

No `.env` file is needed. All weather API calls go directly to Open-Meteo with no authentication.

## Project structure

```
app/
  _layout.tsx       # Root layout, tab bar, notification channel setup
  index.tsx         # Home screen, current weather, hourly, 7-day, alert banner
  search.tsx        # City search and saved cities
  alerts.tsx        # 24-hour alert list for all saved cities
  settings.tsx      # Notification toggles, units, activity profile

components/         # AlertBanner, HourlyStrip, RainBars, WeekForecast, CityTabs
hooks/              # useWeather, useLocation, useCities, useNotifications
services/           # weatherApi.ts, notifications.ts, storage.ts
constants/          # colors.ts, config.ts
```

## Notes

- Background fetch on iOS has a minimum interval of roughly 15 minutes regardless of the configured value. This is an iOS system limitation.
- Some notification and background fetch features require a development build and are silently unavailable in Expo Go.

## License

MIT

import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { Config } from '../constants/config';
import {
  getSavedCities,
  getSettings,
  getPreviousForecast,
  setPreviousForecast,
} from './storage';
import { fetchWeather, getWeatherCondition, WeatherData } from './weatherApi';

const TASK_NAME = Config.BACKGROUND_TASK_NAME;

export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('weather-alerts', {
      name: 'Weather Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#378ADD',
    });
    await Notifications.setNotificationChannelAsync('daily-digest', {
      name: 'Daily Digest',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function isDuringDND(dndStart: number, dndEnd: number): boolean {
  const now = new Date();
  const hour = now.getHours();
  if (dndStart > dndEnd) {
    // overnight DND: e.g. 22-7
    return hour >= dndStart || hour < dndEnd;
  }
  return hour >= dndStart && hour < dndEnd;
}

interface AlertInfo {
  cityName: string;
  condition: string;
  time: string;
  severity: 'light' | 'moderate' | 'severe';
}

function detectChangesIn24h(
  data: WeatherData,
  rainSensitivity: number
): AlertInfo[] {
  const alerts: AlertInfo[] = [];
  const now = new Date();
  const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const { hourly } = data;
  for (let i = 0; i < hourly.time.length; i++) {
    const t = new Date(hourly.time[i]);
    if (t <= now || t > cutoff) continue;

    const prob = hourly.precipitationProbability[i];
    const code = hourly.weatherCode[i];
    const condition = getWeatherCondition(code);

    if (prob >= rainSensitivity || condition.severity !== 'none') {
      const timeStr = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      alerts.push({
        cityName: '',
        condition: condition.label,
        time: timeStr,
        severity: condition.severity === 'none' ? 'light' : condition.severity,
      });
      break; // first alert per city is enough
    }
  }

  return alerts;
}

export async function scheduleWeatherAlert(alert: AlertInfo): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Weather Alert: ${alert.cityName}`,
      body: `${alert.condition} expected at ${alert.time}`,
      data: { alert },
      ...(Platform.OS === 'android' && { channelId: 'weather-alerts' }),
    },
    trigger: null, // immediate
  });
}

export async function scheduleDailyDigest(
  time: string,
  cities: string[]
): Promise<void> {
  const [hourStr, minStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minStr, 10);

  // Cancel existing daily digests
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.content.data?.type === 'daily-digest') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Your Daily Weather Digest',
      body: `Today's forecast for ${cities.join(', ')}`,
      data: { type: 'daily-digest' },
      ...(Platform.OS === 'android' && { channelId: 'daily-digest' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    },
  });
}

// Define background task
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const cities = await getSavedCities();
    const settings = await getSettings();

    if (isDuringDND(settings.dndStart, settings.dndEnd)) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    let hasNewData = false;

    for (let i = 0; i < cities.length; i++) {
      if (i > 0) {
        await new Promise(r => setTimeout(r, Config.FETCH_STAGGER_MS));
      }

      const city = cities[i];
      const cityKey = `${city.latitude},${city.longitude}`;

      try {
        const data = await fetchWeather(city.latitude, city.longitude);
        const prev = await getPreviousForecast(cityKey) as WeatherData | null;

        const alerts = detectChangesIn24h(data, settings.rainSensitivity);

        for (const alert of alerts) {
          alert.cityName = city.name;

          // Check if this is a new alert vs previous fetch
          if (!prev || data.current.weatherCode !== prev.current?.weatherCode) {
            if (settings.notifications.weatherChange) {
              await scheduleWeatherAlert(alert);
            }
            hasNewData = true;
          }
        }

        // UV warning
        if (
          settings.notifications.uvWarning &&
          data.current.uvIndex >= Config.UV_WARNING_THRESHOLD
        ) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `High UV in ${city.name}`,
              body: `UV index is ${Math.round(data.current.uvIndex)} — wear sunscreen`,
              ...(Platform.OS === 'android' && { channelId: 'weather-alerts' }),
            },
            trigger: null,
          });
        }

        // Temp extremes
        if (settings.notifications.tempExtremes) {
          const temp = data.current.temperature;
          if (temp <= Config.TEMP_LOW_THRESHOLD || temp >= Config.TEMP_HIGH_THRESHOLD) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `Extreme Temperature in ${city.name}`,
                body: `Current temperature is ${Math.round(temp)}°C`,
                ...(Platform.OS === 'android' && { channelId: 'weather-alerts' }),
              },
              trigger: null,
            });
          }
        }

        await setPreviousForecast(cityKey, data);
      } catch {
        // Per-city error — continue with other cities
      }
    }

    return hasNewData
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(TASK_NAME, {
        minimumInterval: Config.FETCH_INTERVAL_MS / 1000,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch {
    // Background fetch not available in Expo Go — ignore
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  SAVED_CITIES: 'skycast:saved_cities',
  WEATHER_CACHE: 'skycast:weather_cache',
  SETTINGS: 'skycast:settings',
  ONBOARDED: 'skycast:onboarded',
  PREVIOUS_FORECAST: 'skycast:prev_forecast',
} as const;

export interface SavedCity {
  id: number;
  name: string;
  country: string;
  countryCode: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  isCurrentLocation?: boolean;
  commuterMode?: boolean;
}

export interface AppSettings {
  useFahrenheit: boolean;
  rainSensitivity: number; // 10-90
  dndStart: number;        // hour 0-23
  dndEnd: number;          // hour 0-23
  activityProfile: 'commuter' | 'cyclist' | 'runner' | 'hiker' | 'general';
  notifications: {
    weatherChange: boolean;
    dailyDigest: boolean;
    dailyDigestTime: string; // "HH:MM"
    oneDayBefore: boolean;
    threeHoursBefore: boolean;
    uvWarning: boolean;
    tempExtremes: boolean;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  useFahrenheit: false,
  rainSensitivity: 40,
  dndStart: 22,
  dndEnd: 7,
  activityProfile: 'general',
  notifications: {
    weatherChange: true,
    dailyDigest: false,
    dailyDigestTime: '07:00',
    oneDayBefore: true,
    threeHoursBefore: true,
    uvWarning: true,
    tempExtremes: true,
  },
};

export async function getSavedCities(): Promise<SavedCity[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SAVED_CITIES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveCities(cities: SavedCity[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.SAVED_CITIES, JSON.stringify(cities));
  } catch {
    // silent fail — data still in memory
  }
}

export async function getWeatherCache(key: string): Promise<unknown | null> {
  try {
    const raw = await AsyncStorage.getItem(`${KEYS.WEATHER_CACHE}:${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setWeatherCache(key: string, data: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(`${KEYS.WEATHER_CACHE}:${key}`, JSON.stringify(data));
  } catch {
    // silent fail
  }
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch {
    // silent fail
  }
}

export async function isOnboarded(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(KEYS.ONBOARDED);
    return val === 'true';
  } catch {
    return false;
  }
}

export async function setOnboarded(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.ONBOARDED, 'true');
  } catch {
    // silent fail
  }
}

export async function getPreviousForecast(cityKey: string): Promise<unknown | null> {
  try {
    const raw = await AsyncStorage.getItem(`${KEYS.PREVIOUS_FORECAST}:${cityKey}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setPreviousForecast(cityKey: string, data: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(`${KEYS.PREVIOUS_FORECAST}:${cityKey}`, JSON.stringify(data));
  } catch {
    // silent fail
  }
}

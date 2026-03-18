export type WMOCode = number;

export interface WeatherCondition {
  label: string;
  icon: string; // Ionicons name
  severity: 'none' | 'light' | 'moderate' | 'severe';
}

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  precipitationProbability: number;
  weatherCode: number;
  windSpeed: number;
  humidity: number;
  uvIndex: number;
}

export interface HourlyWeather {
  time: string[];
  temperature: number[];
  precipitationProbability: number[];
  weatherCode: number[];
}

export interface DailyWeather {
  time: string[];
  weatherCode: number[];
  temperatureMax: number[];
  temperatureMin: number[];
  precipitationProbabilityMax: number[];
  uvIndexMax: number[];
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyWeather;
  daily: DailyWeather;
  timezone: string;
  fetchedAt: number;
}

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  countryCode: string;
  admin1?: string; // state/province
}

const WMO_MAP: Record<number, WeatherCondition> = {
  0:  { label: 'Clear sky',      icon: 'sunny',              severity: 'none'     },
  1:  { label: 'Mostly clear',   icon: 'partly-sunny',       severity: 'none'     },
  2:  { label: 'Partly cloudy',  icon: 'partly-sunny',       severity: 'none'     },
  3:  { label: 'Overcast',       icon: 'cloudy',             severity: 'none'     },
  45: { label: 'Fog',            icon: 'cloud',              severity: 'light'    },
  48: { label: 'Icy fog',        icon: 'cloud',              severity: 'moderate' },
  51: { label: 'Light drizzle',  icon: 'rainy',              severity: 'light'    },
  53: { label: 'Drizzle',        icon: 'rainy',              severity: 'light'    },
  55: { label: 'Heavy drizzle',  icon: 'rainy',              severity: 'moderate' },
  61: { label: 'Light rain',     icon: 'rainy',              severity: 'light'    },
  63: { label: 'Rain',           icon: 'rainy',              severity: 'moderate' },
  65: { label: 'Heavy rain',     icon: 'rainy',              severity: 'severe'   },
  71: { label: 'Light snow',     icon: 'snow',               severity: 'light'    },
  73: { label: 'Snow',           icon: 'snow',               severity: 'moderate' },
  75: { label: 'Heavy snow',     icon: 'snow',               severity: 'severe'   },
  80: { label: 'Rain showers',   icon: 'rainy',              severity: 'light'    },
  81: { label: 'Rain showers',   icon: 'rainy',              severity: 'moderate' },
  82: { label: 'Heavy showers',  icon: 'rainy',              severity: 'severe'   },
  95: { label: 'Thunderstorm',   icon: 'thunderstorm',       severity: 'severe'   },
  96: { label: 'Thunderstorm',   icon: 'thunderstorm',       severity: 'severe'   },
  99: { label: 'Severe storm',   icon: 'thunderstorm',       severity: 'severe'   },
};

export function getWeatherCondition(code: number): WeatherCondition {
  return WMO_MAP[code] ?? { label: 'Unknown', icon: 'help-circle', severity: 'none' };
}

export function isBadWeatherCode(code: number): boolean {
  const condition = getWeatherCondition(code);
  return condition.severity !== 'none';
}

export async function fetchWeather(
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: 'temperature_2m,apparent_temperature,precipitation_probability,weathercode,windspeed_10m,relativehumidity_2m,uv_index',
    hourly: 'temperature_2m,precipitation_probability,weathercode',
    daily: 'weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max',
    timezone: 'auto',
    forecast_days: '7',
  });

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params}`,
    { signal }
  );

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    current: {
      temperature: data.current.temperature_2m,
      apparentTemperature: data.current.apparent_temperature,
      precipitationProbability: data.current.precipitation_probability,
      weatherCode: data.current.weathercode,
      windSpeed: data.current.windspeed_10m,
      humidity: data.current.relativehumidity_2m,
      uvIndex: data.current.uv_index,
    },
    hourly: {
      time: data.hourly.time,
      temperature: data.hourly.temperature_2m,
      precipitationProbability: data.hourly.precipitation_probability,
      weatherCode: data.hourly.weathercode,
    },
    daily: {
      time: data.daily.time,
      weatherCode: data.daily.weathercode,
      temperatureMax: data.daily.temperature_2m_max,
      temperatureMin: data.daily.temperature_2m_min,
      precipitationProbabilityMax: data.daily.precipitation_probability_max,
      uvIndexMax: data.daily.uv_index_max,
    },
    timezone: data.timezone,
    fetchedAt: Date.now(),
  };
}

export async function searchCities(
  query: string,
  signal?: AbortSignal
): Promise<GeocodingResult[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    name: query.trim(),
    count: '5',
    language: 'en',
    format: 'json',
  });

  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?${params}`,
    { signal }
  );

  if (!response.ok) {
    throw new Error(`Geocoding API error: ${response.status}`);
  }

  const data = await response.json();
  return (data.results ?? []) as GeocodingResult[];
}

export function celsiusToFahrenheit(c: number): number {
  return Math.round(c * 9 / 5 + 32);
}

export function formatTemp(celsius: number, useFahrenheit: boolean): string {
  return useFahrenheit ? `${celsiusToFahrenheit(celsius)}°` : `${Math.round(celsius)}°`;
}

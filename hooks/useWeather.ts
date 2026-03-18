import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWeather, WeatherData } from '../services/weatherApi';
import { getWeatherCache, setWeatherCache } from '../services/storage';
import { Config } from '../constants/config';

export interface WeatherState {
  data: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  refresh: () => void;
}

function getCacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(3)},${lon.toFixed(3)}`;
}

export function useWeather(
  latitude: number | null,
  longitude: number | null
): WeatherState {
  const [data, setData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const refreshTrigger = useRef(0);
  const [trigger, setTrigger] = useState(0);

  const refresh = useCallback(() => {
    setTrigger(t => t + 1);
  }, []);

  useEffect(() => {
    if (latitude === null || longitude === null) return;

    const lat = latitude;
    const lon = longitude;
    const controller = new AbortController();
    abortRef.current = controller;

    const cacheKey = getCacheKey(lat, lon);

    async function load() {
      setIsLoading(true);
      setError(null);

      // Try cache first (show stale while loading)
      try {
        const cached = await getWeatherCache(cacheKey) as WeatherData | null;
        if (cached) {
          const age = Date.now() - cached.fetchedAt;
          if (age < Config.CACHE_TTL_MS) {
            setData(cached);
            setLastUpdated(cached.fetchedAt);
            setIsLoading(false);
            return;
          }
          // Show stale data while refreshing
          setData(cached);
          setLastUpdated(cached.fetchedAt);
        }
      } catch {
        // No cache — proceed to fetch
      }

      try {
        const fresh = await fetchWeather(lat, lon, controller.signal);
        if (!controller.signal.aborted) {
          setData(fresh);
          setLastUpdated(fresh.fetchedAt);
          setError(null);
          await setWeatherCache(cacheKey, fresh);
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        const msg = err instanceof Error ? err.message : 'Failed to fetch weather';
        setError(data ? 'Unable to refresh — showing last known data' : msg);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, trigger]);

  return { data, isLoading, error, lastUpdated, refresh };
}

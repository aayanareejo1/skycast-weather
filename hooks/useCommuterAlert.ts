import { useState, useEffect } from 'react';
import { fetchWeather, getWeatherCondition, WeatherData } from '../services/weatherApi';
import { getSavedCities, getSettings } from '../services/storage';
import { Config } from '../constants/config';

export interface CommuterAlert {
  cityName: string;
  message: string;
  severity: 'light' | 'moderate' | 'severe';
}

const SEVERITY_RANK: Record<string, number> = { none: 0, light: 1, moderate: 2, severe: 3 };

function getNextHoursCondition(data: WeatherData, hours: number = 4) {
  const now = new Date();
  const cutoff = new Date(now.getTime() + hours * 60 * 60 * 1000);
  let maxProb = 0;
  let worstCode = data.current.weatherCode;

  for (let i = 0; i < data.hourly.time.length; i++) {
    const t = new Date(data.hourly.time[i]);
    if (t < now || t > cutoff) continue;
    if (data.hourly.precipitationProbability[i] > maxProb) {
      maxProb = data.hourly.precipitationProbability[i];
    }
    const cond = getWeatherCondition(data.hourly.weatherCode[i]);
    const curr = getWeatherCondition(worstCode);
    if (SEVERITY_RANK[cond.severity] > SEVERITY_RANK[curr.severity]) {
      worstCode = data.hourly.weatherCode[i];
    }
  }

  return { maxProb, worstCode, condition: getWeatherCondition(worstCode) };
}

export function useCommuterAlert(
  homeLat: number | null,
  homeLon: number | null
): { alert: CommuterAlert | null; isLoading: boolean } {
  const [alert, setAlert] = useState<CommuterAlert | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (homeLat === null || homeLon === null) return;

    let cancelled = false;

    async function check() {
      setIsLoading(true);
      try {
        const [cities, settings] = await Promise.all([getSavedCities(), getSettings()]);
        const commuterCities = cities.filter(c => c.commuterMode && !c.isCurrentLocation);
        if (commuterCities.length === 0) return;

        const homeData = await fetchWeather(homeLat!, homeLon!);
        const homeCondition = getNextHoursCondition(homeData);

        for (let i = 0; i < commuterCities.length; i++) {
          if (i > 0) await new Promise(r => setTimeout(r, Config.FETCH_STAGGER_MS));
          const city = commuterCities[i];
          try {
            const cityData = await fetchWeather(city.latitude, city.longitude);
            const cityCondition = getNextHoursCondition(cityData);

            if (cancelled) return;

            const homeBad = homeCondition.maxProb >= settings.rainSensitivity ||
              homeCondition.condition.severity !== 'none';
            const cityBad = cityCondition.maxProb >= settings.rainSensitivity ||
              cityCondition.condition.severity !== 'none';

            if (cityBad && !homeBad) {
              // Bad weather at destination, clear at home
              setAlert({
                cityName: city.name,
                message: `${cityCondition.condition.label} expected at ${city.name} — pack accordingly`,
                severity: cityCondition.condition.severity === 'none' ? 'light' : cityCondition.condition.severity,
              });
              return;
            }

            if (homeBad && !cityBad) {
              // Bad weather at home/return, clear at destination
              setAlert({
                cityName: city.name,
                message: `${homeCondition.condition.label} near home while ${city.name} stays clear`,
                severity: homeCondition.condition.severity === 'none' ? 'light' : homeCondition.condition.severity,
              });
              return;
            }

            if (cityBad && homeBad &&
              cityCondition.condition.severity !== homeCondition.condition.severity) {
              setAlert({
                cityName: city.name,
                message: `Different conditions: ${homeCondition.condition.label} here, ${cityCondition.condition.label} in ${city.name}`,
                severity: cityCondition.condition.severity === 'none' ? 'light' : cityCondition.condition.severity,
              });
              return;
            }
          } catch {
            // Skip this city
          }
        }

        if (!cancelled) setAlert(null);
      } catch {
        // silently ignore
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    check();
    return () => { cancelled = true; };
  }, [homeLat, homeLon]);

  return { alert, isLoading };
}

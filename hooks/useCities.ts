import { useState, useEffect, useCallback } from 'react';
import { getSavedCities, saveCities, SavedCity } from '../services/storage';
import { Config } from '../constants/config';

export interface UseCitiesResult {
  cities: SavedCity[];
  isLoading: boolean;
  addCity: (city: SavedCity) => Promise<{ success: boolean; error?: string }>;
  removeCity: (id: number) => Promise<void>;
  updateCity: (id: number, updates: Partial<SavedCity>) => Promise<void>;
  reorderCities: (newOrder: SavedCity[]) => Promise<void>;
}

export function useCities(): UseCitiesResult {
  const [cities, setCities] = useState<SavedCity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getSavedCities().then(loaded => {
      if (mounted) {
        setCities(loaded);
        setIsLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  const addCity = useCallback(async (city: SavedCity): Promise<{ success: boolean; error?: string }> => {
    const current = await getSavedCities();

    // Check duplicate
    if (current.some(c => c.id === city.id)) {
      return { success: false, error: 'City already saved' };
    }

    // Check max cities
    const nonLocation = current.filter(c => !c.isCurrentLocation);
    if (nonLocation.length >= Config.MAX_CITIES) {
      return { success: false, error: `Maximum ${Config.MAX_CITIES} cities allowed` };
    }

    const updated = [...current, city];
    await saveCities(updated);
    setCities(updated);
    return { success: true };
  }, []);

  const removeCity = useCallback(async (id: number) => {
    const current = await getSavedCities();
    const updated = current.filter(c => c.id !== id);
    await saveCities(updated);
    setCities(updated);
  }, []);

  const updateCity = useCallback(async (id: number, updates: Partial<SavedCity>) => {
    const current = await getSavedCities();
    const updated = current.map(c => c.id === id ? { ...c, ...updates } : c);
    await saveCities(updated);
    setCities(updated);
  }, []);

  const reorderCities = useCallback(async (newOrder: SavedCity[]) => {
    await saveCities(newOrder);
    setCities(newOrder);
  }, []);

  return { cities, isLoading, addCity, removeCity, updateCity, reorderCities };
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Location from 'expo-location';

export type LocationPermissionStatus = 'unknown' | 'granted' | 'denied' | 'requesting';

export interface LocationState {
  coords: { latitude: number; longitude: number } | null;
  permissionStatus: LocationPermissionStatus;
  error: string | null;
  isLoading: boolean;
  requestPermission: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useLocation(): LocationState {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus>('unknown');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const appState = useRef(AppState.currentState);

  const checkPermission = useCallback(async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        setPermissionStatus('granted');
        return true;
      } else {
        setPermissionStatus('denied');
        return false;
      }
    } catch {
      setPermissionStatus('denied');
      return false;
    }
  }, []);

  const fetchLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (err) {
      setError('Unable to get current location');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    setPermissionStatus('requesting');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setPermissionStatus('granted');
        await fetchLocation();
      } else {
        setPermissionStatus('denied');
        setError('Location permission denied. Search for a city to get started.');
      }
    } catch {
      setPermissionStatus('denied');
      setError('Location permission request failed.');
    }
  }, [fetchLocation]);

  const refresh = useCallback(async () => {
    const granted = await checkPermission();
    if (granted) {
      await fetchLocation();
    }
  }, [checkPermission, fetchLocation]);

  // AppState listener to re-check permissions when app resumes
  // (fixes Expo bug where permission hooks don't refresh after settings change)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        const granted = await checkPermission();
        if (granted && !coords) {
          await fetchLocation();
        }
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [checkPermission, fetchLocation, coords]);

  useEffect(() => {
    checkPermission().then(granted => {
      if (granted) {
        fetchLocation();
      }
    });
  }, [checkPermission, fetchLocation]);

  return {
    coords,
    permissionStatus,
    error,
    isLoading,
    requestPermission,
    refresh,
  };
}

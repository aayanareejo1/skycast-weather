import { useState, useCallback } from 'react';
import {
  requestNotificationPermission,
  registerBackgroundTask,
} from '../services/notifications';

export interface NotificationState {
  permissionGranted: boolean;
  isRequesting: boolean;
  requestPermission: () => Promise<boolean>;
}

export function useNotifications(): NotificationState {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsRequesting(true);
    try {
      const granted = await requestNotificationPermission();
      setPermissionGranted(granted);
      if (granted) {
        await registerBackgroundTask();
      }
      return granted;
    } finally {
      setIsRequesting(false);
    }
  }, []);

  return { permissionGranted, isRequesting, requestPermission };
}

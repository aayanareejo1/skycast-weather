import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus(): boolean {
  // Start true — avoid flash of offline banner during NetInfo initialization
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      // state.isConnected can be null during init; treat null as online
      setIsOnline(state.isConnected !== false);
    });
    return unsubscribe;
  }, []);

  return isOnline;
}

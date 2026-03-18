import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useCities } from '../hooks/useCities';
import { fetchWeather, getWeatherCondition, WeatherData } from '../services/weatherApi';
import { getSettings } from '../services/storage';
import { Config } from '../constants/config';

interface AlertItem {
  id: string;
  cityName: string;
  condition: string;
  icon: string;
  timeLabel: string;
  probability: number;
  severity: 'light' | 'moderate' | 'severe';
}

function severityColor(severity: AlertItem['severity']): string {
  switch (severity) {
    case 'light':    return Colors.severityLight;
    case 'moderate': return Colors.severityModerate;
    case 'severe':   return Colors.severitySevere;
  }
}

function severityLabel(severity: AlertItem['severity']): string {
  switch (severity) {
    case 'light':    return 'Light';
    case 'moderate': return 'Moderate';
    case 'severe':   return 'Severe';
  }
}

function AlertCard({ item }: { item: AlertItem }) {
  const color = severityColor(item.severity);
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.cardRow}>
        <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={24} color={color} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardCity}>{item.cityName}</Text>
          <Text style={styles.cardCondition}>{item.condition}</Text>
          <Text style={styles.cardTime}>{item.timeLabel} · {item.probability}% chance</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
          <Text style={[styles.badgeText, { color }]}>{severityLabel(item.severity)}</Text>
        </View>
      </View>
    </View>
  );
}

export default function AlertsScreen() {
  const { cities } = useCities();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rainSensitivity, setRainSensitivity] = useState<number>(Config.RAIN_SENSITIVITY_DEFAULT);

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const settings = await getSettings();
      setRainSensitivity(settings.rainSensitivity);

      const allAlerts: AlertItem[] = [];
      for (let i = 0; i < cities.length; i++) {
        if (i > 0) await new Promise(r => setTimeout(r, Config.FETCH_STAGGER_MS));
        const city = cities[i];
        try {
          const data = await fetchWeather(city.latitude, city.longitude);
          const now = new Date();
          const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);

          for (let j = 0; j < data.hourly.time.length; j++) {
            const t = new Date(data.hourly.time[j]);
            if (t <= now || t > cutoff) continue;

            const prob = data.hourly.precipitationProbability[j];
            const code = data.hourly.weatherCode[j];
            const condition = getWeatherCondition(code);

            if (prob >= settings.rainSensitivity || condition.severity !== 'none') {
              const timeStr = t.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              });
              const minsUntil = Math.round((t.getTime() - now.getTime()) / 60000);
              const hoursUntil = Math.floor(minsUntil / 60);
              const timeLabel = hoursUntil > 0
                ? `In ${hoursUntil}h ${minsUntil % 60}m · ${timeStr}`
                : `In ${minsUntil}m · ${timeStr}`;

              allAlerts.push({
                id: `${city.id}-${j}`,
                cityName: city.name,
                condition: condition.label,
                icon: condition.icon,
                timeLabel,
                probability: prob,
                severity: condition.severity === 'none'
                  ? prob < 40 ? 'light' : prob < 70 ? 'moderate' : 'severe'
                  : condition.severity,
              });
              break; // one alert per city
            }
          }
        } catch {
          // Skip this city if fetch fails
        }
      }

      setAlerts(allAlerts);
    } catch {
      // Settings fetch failed — use defaults
    } finally {
      setIsLoading(false);
    }
  }, [cities]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const keyExtractor = useCallback((item: AlertItem) => item.id, []);
  const renderItem = useCallback(({ item }: { item: AlertItem }) => (
    <AlertCard item={item} />
  ), []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Text style={styles.title}>Alerts</Text>
      <FlatList
        data={alerts}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchAlerts}
            tintColor={Colors.accentBlue}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={64} color={Colors.successGreen} />
              <Text style={styles.emptyTitle}>All clear!</Text>
              <Text style={styles.emptyDesc}>
                No weather alerts in the next 24 hours for your saved cities.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontFamily: 'DMSans_500Medium',
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    marginBottom: 10,
    padding: 14,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardCity: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontFamily: 'DMSans_500Medium',
  },
  cardCondition: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    marginTop: 2,
  },
  cardTime: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    marginTop: 4,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontFamily: 'DMSans_500Medium',
  },
  emptyDesc: {
    color: Colors.textMuted,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
});

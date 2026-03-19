import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { getWeatherCondition } from '../services/weatherApi';
import { formatTemp } from '../services/weatherApi';

interface HourlyItem {
  time: string;
  temperature: number;
  weatherCode: number;
  precipitationProbability: number;
}

interface Props {
  items: HourlyItem[];
  useFahrenheit: boolean;
  timezone?: string;
}

function formatTimezone(tz: string): string {
  // "America/New_York" → "New York time", "Europe/London" → "London time"
  const city = tz.split('/').pop()?.replace(/_/g, ' ') ?? tz;
  return `${city} time`;
}

export function HourlyStrip({ items, useFahrenheit, timezone }: Props) {
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const showTZ = timezone && timezone !== localTimezone;

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>HOURLY</Text>
        {showTZ && <Text style={styles.tzLabel}>{formatTimezone(timezone!)}</Text>}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item, index) => {
          const condition = getWeatherCondition(item.weatherCode);
          const date = new Date(item.time);
          const isNow = index === 0;
          const hourLabel = isNow
            ? 'Now'
            : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

          return (
            <View key={item.time} style={styles.item}>
              <Text style={styles.hour}>{hourLabel}</Text>
              <Ionicons
                name={condition.icon as keyof typeof Ionicons.glyphMap}
                size={22}
                color={Colors.accentBlue}
                style={styles.icon}
              />
              <Text style={styles.temp}>{formatTemp(item.temperature, useFahrenheit)}</Text>
              {item.precipitationProbability > 0 && (
                <Text style={styles.rain}>{item.precipitationProbability}%</Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 16,
    marginRight: 16,
    marginBottom: 8,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 10,
    fontFamily: 'DMSans_500Medium',
    letterSpacing: 0.08 * 10,
  },
  tzLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  item: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: 64,
  },
  hour: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    marginBottom: 6,
  },
  icon: {
    marginBottom: 6,
  },
  temp: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
  },
  rain: {
    color: Colors.accentBlue,
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    marginTop: 4,
  },
});

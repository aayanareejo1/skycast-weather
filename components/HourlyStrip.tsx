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
}

export function HourlyStrip({ items, useFahrenheit }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>HOURLY</Text>
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
  label: {
    color: Colors.textMuted,
    fontSize: 10,
    fontFamily: 'DMSans_500Medium',
    letterSpacing: 0.08 * 10,
    marginLeft: 16,
    marginBottom: 8,
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

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { getWeatherCondition, formatTemp } from '../services/weatherApi';

interface DayItem {
  time: string;
  weatherCode: number;
  temperatureMax: number;
  temperatureMin: number;
  precipitationProbabilityMax: number;
}

interface Props {
  days: DayItem[];
  useFahrenheit: boolean;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function DayRow({ item, useFahrenheit }: { item: DayItem; useFahrenheit: boolean }) {
  const condition = getWeatherCondition(item.weatherCode);
  const date = new Date(item.time);
  const isToday = new Date().toDateString() === date.toDateString();
  const dayLabel = isToday ? 'Today' : DAY_NAMES[date.getDay()];

  return (
    <View style={styles.row}>
      <Text style={styles.day}>{dayLabel}</Text>
      <View style={styles.iconWrap}>
        <Ionicons
          name={condition.icon as keyof typeof Ionicons.glyphMap}
          size={20}
          color={Colors.accentBlue}
        />
        {item.precipitationProbabilityMax > 20 && (
          <Text style={styles.rainPct}>{item.precipitationProbabilityMax}%</Text>
        )}
      </View>
      <Text style={styles.hi}>{formatTemp(item.temperatureMax, useFahrenheit)}</Text>
      <Text style={styles.lo}>{formatTemp(item.temperatureMin, useFahrenheit)}</Text>
    </View>
  );
}

export function WeekForecast({ days, useFahrenheit }: Props) {
  const keyExtractor = useCallback((item: DayItem) => item.time, []);
  const renderItem = useCallback(
    ({ item }: { item: DayItem }) => <DayRow item={item} useFahrenheit={useFahrenheit} />,
    [useFahrenheit]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>7-DAY FORECAST</Text>
      <View style={styles.card}>
        <FlatList
          data={days}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 10,
    fontFamily: 'DMSans_500Medium',
    letterSpacing: 0.08 * 10,
    marginBottom: 10,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  day: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
  },
  iconWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 72,
  },
  rainPct: {
    color: Colors.accentBlue,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
  },
  hi: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
    width: 44,
    textAlign: 'right',
  },
  lo: {
    color: Colors.textMuted,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    width: 44,
    textAlign: 'right',
  },
  separator: {
    height: 0.5,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
});

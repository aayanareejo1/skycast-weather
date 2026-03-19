import React, { useCallback } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SavedCity } from '../services/storage';
import { Colors } from '../constants/colors';

interface Props {
  cities: SavedCity[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function CityTabs({ cities, selectedIndex, onSelect }: Props) {
  const handlePress = useCallback(
    (index: number) => () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelect(index);
    },
    [onSelect]
  );

  if (cities.length <= 1) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {cities.map((city, index) => {
        const isSelected = index === selectedIndex;
        return (
          <TouchableOpacity
            key={city.id}
            style={[styles.tab, isSelected && styles.activeTab]}
            onPress={handlePress(index)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, isSelected && styles.activeText]}>
              {city.isCurrentLocation ? '📍 ' : ''}{city.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  activeTab: {
    backgroundColor: Colors.accentBlue,
    borderColor: Colors.accentBlue,
  },
  tabText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
  },
  activeText: {
    color: Colors.textPrimary,
  },
});

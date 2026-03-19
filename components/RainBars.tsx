import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
  items: { time: string; probability: number }[];
}

export function RainBars({ items }: Props) {
  let maxProb = 0;
  for (const item of items) {
    if (item.probability > maxProb) maxProb = item.probability;
  }
  if (maxProb === 0) maxProb = 1; // avoid division by zero when all bars are 0%

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>RAIN CHANCE</Text>
      <View style={styles.chart}>
        {items.map((item) => {
          const date = new Date(item.time);
          const hour = date.getHours();
          const label = hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`;
          const barHeight = Math.max((item.probability / maxProb) * 60, 2);

          return (
            <View key={item.time} style={styles.barCol}>
              <View style={styles.barBackground}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: item.probability > 70
                        ? Colors.alertAmber
                        : item.probability > 40
                          ? Colors.accentBlue
                          : 'rgba(55,138,221,0.45)',
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
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
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    padding: 12,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barBackground: {
    height: 60,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '70%',
    borderRadius: 3,
    minHeight: 2,
  },
  barLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontFamily: 'DMSans_400Regular',
  },
});

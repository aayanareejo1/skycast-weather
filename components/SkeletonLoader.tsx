import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({ width, height, borderRadius = 8, style }: Props) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: Colors.surface,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function HomeScreenSkeleton() {
  return (
    <View style={styles.container}>
      <SkeletonLoader width={120} height={80} borderRadius={12} style={styles.temp} />
      <SkeletonLoader width={200} height={20} borderRadius={8} style={styles.row} />
      <SkeletonLoader width={150} height={16} borderRadius={8} style={styles.row} />
      <View style={styles.hourlyRow}>
        {[...Array(6)].map((_, i) => (
          <SkeletonLoader key={i} width={60} height={80} borderRadius={12} />
        ))}
      </View>
      {[...Array(5)].map((_, i) => (
        <SkeletonLoader key={i} width="100%" height={52} borderRadius={12} style={styles.row} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  temp: {
    marginBottom: 12,
  },
  row: {
    marginBottom: 10,
  },
  hourlyRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 20,
  },
});

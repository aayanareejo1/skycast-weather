import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { useWeather } from '../hooks/useWeather';
import { useLocation } from '../hooks/useLocation';
import { useCities } from '../hooks/useCities';
import { getSettings } from '../services/storage';
import { getWeatherCondition, formatTemp } from '../services/weatherApi';
import { Config } from '../constants/config';
import { AlertBanner } from '../components/AlertBanner';
import { HourlyStrip } from '../components/HourlyStrip';
import { RainBars } from '../components/RainBars';
import { WeekForecast } from '../components/WeekForecast';
import { CityTabs } from '../components/CityTabs';
import { HomeScreenSkeleton } from '../components/SkeletonLoader';

export default function HomeScreen() {
  const { cities, isLoading: citiesLoading } = useCities();
  const [selectedCityIndex, setSelectedCityIndex] = useState(0);
  const [useFahrenheit, setUseFahrenheit] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const { coords, permissionStatus, requestPermission } = useLocation();

  // Determine which lat/lon to use
  const selectedCity = cities[selectedCityIndex];
  const lat = selectedCity?.latitude ?? coords?.latitude ?? null;
  const lon = selectedCity?.longitude ?? coords?.longitude ?? null;

  const { data, isLoading, error, lastUpdated, refresh } = useWeather(lat, lon);

  const handleRefresh = useCallback(() => {
    refresh();
    setAlertDismissed(false);
  }, [refresh]);

  const handleCitySelect = useCallback((index: number) => {
    setSelectedCityIndex(index);
    setAlertDismissed(false);
  }, []);

  // Detect weather alert in next 24h
  const alertMessage = useMemo(() => {
    if (!data || alertDismissed) return null;
    const now = new Date();
    const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    for (let i = 0; i < data.hourly.time.length; i++) {
      const t = new Date(data.hourly.time[i]);
      if (t <= now || t > cutoff) continue;

      const prob = data.hourly.precipitationProbability[i];
      const code = data.hourly.weatherCode[i];
      const condition = getWeatherCondition(code);

      if (prob >= 40 || condition.severity !== 'none') {
        const timeStr = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `${condition.label} expected at ${timeStr} · ${prob}% chance`;
      }
    }
    return null;
  }, [data, alertDismissed]);

  // Next 8 hourly items from now
  const hourlyItems = useMemo(() => {
    if (!data) return [];
    const now = new Date();
    const result = [];
    for (let i = 0; i < data.hourly.time.length && result.length < Config.HOURLY_DISPLAY_COUNT; i++) {
      const t = new Date(data.hourly.time[i]);
      if (t >= now) {
        result.push({
          time: data.hourly.time[i],
          temperature: data.hourly.temperature[i],
          weatherCode: data.hourly.weatherCode[i],
          precipitationProbability: data.hourly.precipitationProbability[i],
        });
      }
    }
    return result;
  }, [data]);

  // Rain bars — next 8 hours
  const rainItems = useMemo(
    () => hourlyItems.map(h => ({ time: h.time, probability: h.precipitationProbability })),
    [hourlyItems]
  );

  // 7-day forecast items
  const dailyItems = useMemo(() => {
    if (!data) return [];
    return data.daily.time.map((time, i) => ({
      time,
      weatherCode: data.daily.weatherCode[i],
      temperatureMax: data.daily.temperatureMax[i],
      temperatureMin: data.daily.temperatureMin[i],
      precipitationProbabilityMax: data.daily.precipitationProbabilityMax[i],
    }));
  }, [data]);

  const lastUpdatedText = useMemo(() => {
    if (!lastUpdated) return null;
    const mins = Math.floor((Date.now() - lastUpdated) / 60000);
    if (mins < 1) return 'Just updated';
    return `Updated ${mins}m ago`;
  }, [lastUpdated]);

  // Location permission denied — no cities saved either
  const noData = !citiesLoading && cities.length === 0 && permissionStatus === 'denied';
  const showLocationPrompt = !citiesLoading && cities.length === 0 && permissionStatus !== 'granted';

  if (citiesLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <HomeScreenSkeleton />
      </SafeAreaView>
    );
  }

  if (showLocationPrompt && permissionStatus !== 'requesting') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.permissionContainer}>
          <Ionicons name="location" size={64} color={Colors.accentBlue} />
          <Text style={styles.permissionTitle}>Know your weather</Text>
          <Text style={styles.permissionDesc}>
            SkyCast uses your location to show local weather and send you timely alerts before conditions change.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={styles.primaryBtnText}>Allow Location Access</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push('/search')}
          >
            <Text style={styles.secondaryBtnText}>Search for a city instead</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading && !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <HomeScreenSkeleton />
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline" size={64} color={Colors.textMuted} />
          <Text style={styles.errorTitle}>Unable to load weather</Text>
          <Text style={styles.errorDesc}>{error}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={refresh}>
            <Text style={styles.primaryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const condition = data ? getWeatherCondition(data.current.weatherCode) : null;
  const cityName = selectedCity?.name ?? 'Current Location';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && !!data}
            onRefresh={handleRefresh}
            tintColor={Colors.accentBlue}
          />
        }
      >
        {/* City tabs */}
        <CityTabs
          cities={cities}
          selectedIndex={selectedCityIndex}
          onSelect={handleCitySelect}
        />

        {/* Alert banner */}
        {alertMessage && (
          <AlertBanner
            message={alertMessage}
            onDismiss={() => setAlertDismissed(true)}
          />
        )}

        {/* Error notice (with stale data) */}
        {error && data && (
          <AlertBanner message={error} />
        )}

        {/* Main weather display */}
        {data && condition && (
          <>
            <View style={styles.heroSection}>
              <Text style={styles.cityName}>
                {selectedCity?.isCurrentLocation ? '📍 ' : ''}{cityName}
              </Text>
              <Text style={styles.temperature}>
                {formatTemp(data.current.temperature, useFahrenheit)}
              </Text>
              <Text style={styles.condition}>{condition.label}</Text>
              <Text style={styles.feelsLike}>
                Feels like {formatTemp(data.current.apparentTemperature, useFahrenheit)}
              </Text>

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Ionicons name="water" size={16} color={Colors.accentBlue} />
                  <Text style={styles.statLabel}>{data.current.humidity}%</Text>
                  <Text style={styles.statUnit}>Humidity</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Ionicons name="speedometer" size={16} color={Colors.accentBlue} />
                  <Text style={styles.statLabel}>{Math.round(data.current.windSpeed)}</Text>
                  <Text style={styles.statUnit}>km/h Wind</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Ionicons name="sunny" size={16} color={Colors.accentBlue} />
                  <Text style={styles.statLabel}>{Math.round(data.current.uvIndex)}</Text>
                  <Text style={styles.statUnit}>UV Index</Text>
                </View>
              </View>

              {lastUpdatedText && (
                <Text style={styles.lastUpdated}>{lastUpdatedText}</Text>
              )}
            </View>

            <HourlyStrip items={hourlyItems} useFahrenheit={useFahrenheit} />
            <RainBars items={rainItems} />
            <WeekForecast days={dailyItems} useFahrenheit={useFahrenheit} />
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  cityName: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontFamily: 'DMSans_400Regular',
    marginBottom: 4,
  },
  temperature: {
    color: Colors.textPrimary,
    fontSize: 68,
    fontFamily: 'DMSans_300Light',
    lineHeight: 80,
  },
  condition: {
    color: Colors.textSecondary,
    fontSize: 18,
    fontFamily: 'DMSans_400Regular',
    marginTop: 4,
  },
  feelsLike: {
    color: Colors.textMuted,
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    marginTop: 4,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 0,
    width: '100%',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
  },
  statUnit: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
  },
  statDivider: {
    width: 0.5,
    height: 36,
    backgroundColor: Colors.border,
  },
  lastUpdated: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    marginTop: 12,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    gap: 16,
  },
  permissionTitle: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontFamily: 'DMSans_500Medium',
    textAlign: 'center',
  },
  permissionDesc: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  primaryBtn: {
    backgroundColor: Colors.accentBlue,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontFamily: 'DMSans_500Medium',
  },
  secondaryBtn: {
    paddingVertical: 12,
  },
  secondaryBtnText: {
    color: Colors.accentBlue,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    gap: 12,
  },
  errorTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontFamily: 'DMSans_500Medium',
  },
  errorDesc: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 20,
  },
});

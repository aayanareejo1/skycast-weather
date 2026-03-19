import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { searchCities, fetchWeather, formatTemp, GeocodingResult } from '../services/weatherApi';
import { useCities } from '../hooks/useCities';
import { getSettings } from '../services/storage';
import { Config } from '../constants/config';

interface CityResult extends GeocodingResult {
  currentTemp?: number;
  isSaved: boolean;
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useFahrenheit, setUseFahrenheit] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { cities, addCity, removeCity, updateCity, reorderCities } = useCities();
  const savedNonLocation = cities.filter(c => !c.isCurrentLocation);

  useEffect(() => {
    getSettings().then(s => setUseFahrenheit(s.useFahrenheit));
  }, []);

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSearching(true);
    setError(null);

    try {
      const geocoded = await searchCities(q, controller.signal);

      const withTemps: CityResult[] = [];
      for (let i = 0; i < geocoded.length; i++) {
        if (i > 0) await new Promise(r => setTimeout(r, Config.FETCH_STAGGER_MS));
        const city = geocoded[i];
        let currentTemp: number | undefined;
        try {
          const weather = await fetchWeather(city.latitude, city.longitude, controller.signal);
          currentTemp = weather.current.temperature;
        } catch {
          // temp unavailable — still show city
        }
        const isSaved = cities.some(c => c.id === city.id);
        withTemps.push({ ...city, currentTemp, isSaved });
      }

      if (!controller.signal.aborted) {
        setResults(withTemps);
      }
    } catch {
      if (controller.signal.aborted) return;
      setError('Search failed. Check your connection and try again.');
    } finally {
      if (!controller.signal.aborted) {
        setIsSearching(false);
      }
    }
  }, [cities]);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => performSearch(text), Config.SEARCH_DEBOUNCE_MS);
  }, [performSearch]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      abortRef.current?.abort();
    };
  }, []);

  const handleAdd = useCallback(async (item: CityResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await addCity({
      id: item.id,
      name: item.name,
      country: item.country,
      countryCode: item.countryCode,
      admin1: item.admin1,
      latitude: item.latitude,
      longitude: item.longitude,
    });

    if (!result.success) {
      Alert.alert('Cannot add city', result.error ?? 'Unknown error');
    } else {
      setResults(prev => prev.map(r => r.id === item.id ? { ...r, isSaved: true } : r));
    }
  }, [addCity]);

  const handleRemove = useCallback((id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Remove city', 'Remove this city from your saved list?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        removeCity(id);
      }},
    ]);
  }, [removeCity]);

  const handleCommuterToggle = useCallback((id: number, value: boolean) => {
    updateCity(id, { commuterMode: value });
  }, [updateCity]);

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const reordered = [...savedNonLocation];
    [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
    reorderCities(reordered);
  }, [savedNonLocation, reorderCities]);

  const handleMoveDown = useCallback((index: number) => {
    if (index === savedNonLocation.length - 1) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const reordered = [...savedNonLocation];
    [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
    reorderCities(reordered);
  }, [savedNonLocation, reorderCities]);

  const keyExtractor = useCallback((item: CityResult) => item.id.toString(), []);

  const renderResult = useCallback(({ item }: { item: CityResult }) => {
    const subtitle = [item.admin1, item.country].filter(Boolean).join(', ');
    const tempStr = item.currentTemp !== undefined
      ? formatTemp(item.currentTemp, useFahrenheit) : '—';

    return (
      <View style={styles.resultItem}>
        <View style={styles.resultInfo}>
          <Text style={styles.cityName}>{item.name}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.temp}>{tempStr}</Text>
        <TouchableOpacity
          style={[styles.addBtn, item.isSaved && styles.savedBtn]}
          onPress={() => !item.isSaved && handleAdd(item)}
          disabled={item.isSaved}
          activeOpacity={0.7}
        >
          <Ionicons
            name={item.isSaved ? 'checkmark' : 'add'}
            size={20}
            color={item.isSaved ? Colors.successGreen : Colors.textPrimary}
          />
        </TouchableOpacity>
      </View>
    );
  }, [useFahrenheit, handleAdd]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.title}>Cities</Text>

          {/* Saved cities section */}
          {savedNonLocation.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SAVED CITIES</Text>
              <View style={styles.card}>
                {savedNonLocation.map((city, i) => (
                  <View key={city.id}>
                    <View style={styles.savedRow}>
                      <View style={styles.savedInfo}>
                        <Text style={styles.savedName}>{city.name}</Text>
                        <Text style={styles.savedSubtitle}>{city.country}</Text>
                      </View>
                      <View style={styles.savedActions}>
                        <View style={styles.reorderBtns}>
                          <TouchableOpacity
                            onPress={() => handleMoveUp(i)}
                            disabled={i === 0}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Ionicons name="chevron-up" size={16} color={i === 0 ? Colors.textMuted + '44' : Colors.textMuted} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleMoveDown(i)}
                            disabled={i === savedNonLocation.length - 1}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Ionicons name="chevron-down" size={16} color={i === savedNonLocation.length - 1 ? Colors.textMuted + '44' : Colors.textMuted} />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.commuterWrap}>
                          <Ionicons name="train" size={13} color={Colors.textMuted} />
                          <Text style={styles.commuterLabel}>Commuter</Text>
                          <Switch
                            value={city.commuterMode ?? false}
                            onValueChange={v => handleCommuterToggle(city.id, v)}
                            trackColor={{ false: Colors.surface, true: Colors.accentBlue }}
                            thumbColor={Colors.textPrimary}
                            style={styles.commuterSwitch}
                          />
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemove(city.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="trash-outline" size={18} color={Colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    {i < savedNonLocation.length - 1 && <View style={styles.separator} />}
                  </View>
                ))}
              </View>
              {savedNonLocation.some(c => c.commuterMode) && (
                <Text style={styles.commuterHint}>
                  Commuter mode alerts you when weather differs between home and that city
                </Text>
              )}
            </View>
          )}

          {/* Search input */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ADD A CITY</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
              <TextInput
                style={styles.input}
                value={query}
                onChangeText={handleQueryChange}
                placeholder="Search city name..."
                placeholderTextColor={Colors.textMuted}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="words"
              />
              {isSearching && (
                <ActivityIndicator size="small" color={Colors.accentBlue} style={styles.spinner} />
              )}
              {query.length > 0 && !isSearching && (
                <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
                  <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.hint}>Up to {Config.MAX_CITIES} cities</Text>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.alertAmber} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Search results */}
          {results.map((item) => (
            <React.Fragment key={item.id}>
              {renderResult({ item })}
            </React.Fragment>
          ))}

          {!isSearching && query.length > 0 && results.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="location-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No cities found</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontFamily: 'DMSans_500Medium',
    marginTop: 16,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontFamily: 'DMSans_500Medium',
    letterSpacing: 0.08 * 10,
    marginBottom: 8,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  savedInfo: {
    flex: 1,
  },
  savedName: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
  },
  savedSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    marginTop: 2,
  },
  savedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reorderBtns: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  commuterWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commuterLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
  },
  commuterSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  commuterHint: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    marginTop: 6,
    lineHeight: 17,
  },
  separator: {
    height: 0.5,
    backgroundColor: Colors.border,
    marginHorizontal: 14,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 16,
    fontFamily: 'DMSans_400Regular',
    height: '100%',
  },
  spinner: {
    marginLeft: 8,
  },
  hint: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    marginTop: 6,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,159,39,0.12)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    color: Colors.alertAmber,
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 8,
  },
  resultInfo: {
    flex: 1,
  },
  cityName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontFamily: 'DMSans_500Medium',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    marginTop: 2,
  },
  temp: {
    color: Colors.textSecondary,
    fontSize: 18,
    fontFamily: 'DMSans_300Light',
    marginHorizontal: 12,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedBtn: {
    backgroundColor: 'rgba(29,158,117,0.2)',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 12,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
  },
});

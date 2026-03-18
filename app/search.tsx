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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const { cities, addCity } = useCities();

  useEffect(() => {
    getSettings().then(s => setUseFahrenheit(s.useFahrenheit));
  }, []);

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    // Cancel previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSearching(true);
    setError(null);

    try {
      const geocoded = await searchCities(q, controller.signal);

      // Fetch current temp for each result (staggered)
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
    } catch (err) {
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
    debounceTimer.current = setTimeout(() => {
      performSearch(text);
    }, Config.SEARCH_DEBOUNCE_MS);
  }, [performSearch]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      abortRef.current?.abort();
    };
  }, []);

  const handleAdd = useCallback(async (item: CityResult) => {
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
      setResults(prev =>
        prev.map(r => r.id === item.id ? { ...r, isSaved: true } : r)
      );
    }
  }, [addCity]);

  const keyExtractor = useCallback((item: CityResult) => item.id.toString(), []);

  const renderItem = useCallback(({ item }: { item: CityResult }) => {
    const subtitle = [item.admin1, item.country].filter(Boolean).join(', ');
    const tempStr = item.currentTemp !== undefined
      ? formatTemp(item.currentTemp, useFahrenheit)
      : '—';

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
        <Text style={styles.title}>Search Cities</Text>

        <View style={styles.inputWrap}>
          <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={handleQueryChange}
            placeholder="City name..."
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

        <Text style={styles.hint}>
          You can save up to {Config.MAX_CITIES} cities
        </Text>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={Colors.alertAmber} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <FlatList
          data={results}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            !isSearching && query.length > 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="location-outline" size={40} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No cities found</Text>
              </View>
            ) : null
          }
        />
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
    paddingHorizontal: 16,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontFamily: 'DMSans_500Medium',
    marginTop: 16,
    marginBottom: 16,
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
    marginBottom: 8,
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
    marginBottom: 16,
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
  listContent: {
    paddingBottom: 40,
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
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
  },
});

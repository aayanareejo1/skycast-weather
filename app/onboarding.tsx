import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors } from '../constants/colors';
import { setOnboarded } from '../services/storage';
import { requestNotificationPermission, registerBackgroundTask } from '../services/notifications';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Step = 'welcome' | 'location' | 'notifications' | 'done';

const STEPS: Step[] = ['welcome', 'location', 'notifications'];

export default function OnboardingScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const [locationGranted, setLocationGranted] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const currentStep = STEPS[stepIndex];

  function animateToNext(nextIndex: number) {
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: -40,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => setStepIndex(nextIndex), 100);
  }

  async function handleLocationAllow() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setLocationGranted(granted);
    } catch {
      setLocationGranted(false);
    }
    animateToNext(stepIndex + 1);
  }

  function handleLocationSkip() {
    setLocationGranted(false);
    animateToNext(stepIndex + 1);
  }

  async function handleNotificationsAllow() {
    try {
      const granted = await requestNotificationPermission();
      if (granted) await registerBackgroundTask();
    } catch {
      // ignore — app works without notifications
    }
    await finish();
  }

  async function handleNotificationsSkip() {
    await finish();
  }

  async function finish() {
    await setOnboarded();
    if (locationGranted) {
      router.replace('/');
    } else {
      router.replace('/search');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Step dots */}
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === stepIndex && styles.dotActive]}
            />
          ))}
        </View>

        {/* Step content */}
        <Animated.View style={[styles.content, { transform: [{ translateY: slideAnim }] }]}>
          {currentStep === 'welcome' && <WelcomeStep />}
          {currentStep === 'location' && <LocationStep />}
          {currentStep === 'notifications' && <NotificationsStep locationGranted={locationGranted} />}
        </Animated.View>

        {/* Actions */}
        <View style={styles.actions}>
          {currentStep === 'welcome' && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => animateToNext(1)}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Get Started</Text>
            </TouchableOpacity>
          )}

          {currentStep === 'location' && (
            <>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleLocationAllow}
                activeOpacity={0.85}
              >
                <Ionicons name="location" size={18} color={Colors.textPrimary} style={styles.btnIcon} />
                <Text style={styles.primaryBtnText}>Allow Location Access</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ghostBtn} onPress={handleLocationSkip}>
                <Text style={styles.ghostBtnText}>Search manually instead</Text>
              </TouchableOpacity>
            </>
          )}

          {currentStep === 'notifications' && (
            <>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleNotificationsAllow}
                activeOpacity={0.85}
              >
                <Ionicons name="notifications" size={18} color={Colors.textPrimary} style={styles.btnIcon} />
                <Text style={styles.primaryBtnText}>Enable Notifications</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ghostBtn} onPress={handleNotificationsSkip}>
                <Text style={styles.ghostBtnText}>Maybe later</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function WelcomeStep() {
  return (
    <View style={styles.step}>
      <View style={styles.iconCircle}>
        <Ionicons name="partly-sunny" size={64} color={Colors.accentBlue} />
      </View>
      <Text style={styles.appName}>SkyCast</Text>
      <Text style={styles.tagline}>Weather that warns you first</Text>
      <Text style={styles.body}>
        Get ahead of the forecast. SkyCast monitors conditions in the background and alerts you
        before the weather changes — so you're never caught off guard.
      </Text>
    </View>
  );
}

function LocationStep() {
  return (
    <View style={styles.step}>
      <View style={styles.iconCircle}>
        <Ionicons name="location" size={64} color={Colors.accentBlue} />
      </View>
      <Text style={styles.heading}>Your local weather</Text>
      <Text style={styles.body}>
        SkyCast uses your location to show accurate, hyper-local forecasts and to detect
        weather changes near you before they happen.
      </Text>
      <View style={styles.infoBox}>
        <Ionicons name="shield-checkmark" size={16} color={Colors.successGreen} />
        <Text style={styles.infoText}>
          Your location is only used for weather data. It is never stored or shared.
        </Text>
      </View>
    </View>
  );
}

function NotificationsStep({ locationGranted }: { locationGranted: boolean }) {
  return (
    <View style={styles.step}>
      <View style={styles.iconCircle}>
        <Ionicons name="notifications" size={64} color={Colors.accentBlue} />
      </View>
      <Text style={styles.heading}>Stay one step ahead</Text>
      <Text style={styles.body}>
        Allow notifications so SkyCast can alert you when rain, storms, or extreme temperatures
        are on the way — before they arrive.
      </Text>
      {!locationGranted && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={16} color={Colors.alertAmber} />
          <Text style={[styles.infoText, { color: Colors.alertAmber }]}>
            You skipped location access. You can still search for cities and get alerts manually.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 16 : 24,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 20,
    backgroundColor: Colors.accentBlue,
  },
  content: {
    flex: 1,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(55,138,221,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  appName: {
    color: Colors.textPrimary,
    fontSize: 38,
    fontFamily: 'DMSans_500Medium',
    letterSpacing: -0.5,
  },
  tagline: {
    color: Colors.accentBlue,
    fontSize: 16,
    fontFamily: 'DMSans_400Regular',
  },
  heading: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontFamily: 'DMSans_500Medium',
    textAlign: 'center',
  },
  body: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
    lineHeight: 23,
    paddingHorizontal: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: 14,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    color: Colors.textMuted,
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    lineHeight: 19,
  },
  actions: {
    gap: 12,
    paddingTop: 24,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentBlue,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  primaryBtnText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontFamily: 'DMSans_500Medium',
  },
  btnIcon: {
    marginRight: 2,
  },
  ghostBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  ghostBtnText: {
    color: Colors.textMuted,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
  },
});

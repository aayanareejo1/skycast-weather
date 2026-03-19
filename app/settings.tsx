import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import {
  getSettings,
  saveSettings,
  AppSettings,
  DEFAULT_SETTINGS,
} from '../services/storage';
import { NotificationToggle } from '../components/NotificationToggle';
import { TimePicker } from '../components/TimePicker';
import { useNotifications } from '../hooks/useNotifications';
import { scheduleDailyDigest } from '../services/notifications';
import { useCities } from '../hooks/useCities';

type ActivityProfile = AppSettings['activityProfile'];

function formatHour(h: number): string {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

const ACTIVITY_PROFILES: { key: ActivityProfile; label: string; icon: string }[] = [
  { key: 'commuter',  label: 'Commuter',  icon: 'train'         },
  { key: 'cyclist',  label: 'Cyclist',   icon: 'bicycle'       },
  { key: 'runner',   label: 'Runner',    icon: 'walk'          },
  { key: 'hiker',    label: 'Hiker',     icon: 'map'           },
  { key: 'general',  label: 'General',   icon: 'person-circle' },
];

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const { requestPermission, permissionGranted } = useNotifications();
  const { cities } = useCities();

  useEffect(() => {
    getSettings().then(s => {
      setSettings(s);
      setIsLoaded(true);
    });
  }, []);

  const update = useCallback((patch: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const updateNotif = useCallback((patch: Partial<AppSettings['notifications']>) => {
    setSettings(prev => {
      const next = {
        ...prev,
        notifications: { ...prev.notifications, ...patch },
      };
      saveSettings(next);

      // Schedule or cancel daily digest
      if (patch.dailyDigest !== undefined || patch.dailyDigestTime !== undefined) {
        if (next.notifications.dailyDigest) {
          scheduleDailyDigest(
            next.notifications.dailyDigestTime,
            cities.map(c => c.name)
          );
        }
      }

      return next;
    });
  }, [cities]);

  if (!isLoaded) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        {/* Units */}
        <SectionHeader title="UNITS" />
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Temperature</Text>
            <View style={styles.unitToggle}>
              <TouchableOpacity
                style={[styles.unitBtn, !settings.useFahrenheit && styles.unitBtnActive]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); update({ useFahrenheit: false }); }}
              >
                <Text style={[styles.unitBtnText, !settings.useFahrenheit && styles.unitBtnTextActive]}>°C</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitBtn, settings.useFahrenheit && styles.unitBtnActive]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); update({ useFahrenheit: true }); }}
              >
                <Text style={[styles.unitBtnText, settings.useFahrenheit && styles.unitBtnTextActive]}>°F</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Activity Profile */}
        <SectionHeader title="ACTIVITY PROFILE" />
        <View style={styles.card}>
          <View style={styles.chipRow}>
            {ACTIVITY_PROFILES.map(profile => {
              const isActive = settings.activityProfile === profile.key;
              return (
                <TouchableOpacity
                  key={profile.key}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); update({ activityProfile: profile.key }); }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={profile.icon as keyof typeof Ionicons.glyphMap}
                    size={14}
                    color={isActive ? Colors.textPrimary : Colors.textMuted}
                  />
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {profile.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Rain Sensitivity */}
        <SectionHeader title="RAIN ALERT SENSITIVITY" />
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Alert when rain chance exceeds</Text>
            <Text style={styles.sensitivityValue}>{settings.rainSensitivity}%</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={10}
            maximumValue={90}
            step={10}
            value={settings.rainSensitivity}
            onValueChange={(v: number) => update({ rainSensitivity: v })}
            minimumTrackTintColor={Colors.accentBlue}
            maximumTrackTintColor={Colors.border}
            thumbTintColor={Colors.accentBlue}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>Sensitive (10%)</Text>
            <Text style={styles.sliderLabel}>Strict (90%)</Text>
          </View>
        </View>

        {/* Notifications */}
        <SectionHeader title="NOTIFICATIONS" />
        <View style={styles.card}>
          <NotificationToggle
            label="Weather change alerts"
            description="Get notified when weather changes in the next 24h"
            value={settings.notifications.weatherChange}
            onValueChange={v => updateNotif({ weatherChange: v })}
          />
          <NotificationToggle
            label="Daily digest"
            value={settings.notifications.dailyDigest}
            onValueChange={v => updateNotif({ dailyDigest: v })}
          />
          {settings.notifications.dailyDigest && (
            <View style={styles.timePickerRow}>
              <Text style={styles.timePickerLabel}>Digest time</Text>
              <TimePicker
                value={settings.notifications.dailyDigestTime}
                onChange={t => updateNotif({ dailyDigestTime: t })}
              />
            </View>
          )}
          <NotificationToggle
            label="1 day before"
            description="Alert the day before severe weather"
            value={settings.notifications.oneDayBefore}
            onValueChange={v => updateNotif({ oneDayBefore: v })}
          />
          <NotificationToggle
            label="3 hours before"
            description="Alert 3 hours before weather changes"
            value={settings.notifications.threeHoursBefore}
            onValueChange={v => updateNotif({ threeHoursBefore: v })}
          />
          <NotificationToggle
            label="UV index warning"
            description="Alert when UV index exceeds 6"
            value={settings.notifications.uvWarning}
            onValueChange={v => updateNotif({ uvWarning: v })}
          />
          <NotificationToggle
            label="Temperature extremes"
            description="Alert below 0°C or above 30°C"
            value={settings.notifications.tempExtremes}
            onValueChange={v => updateNotif({ tempExtremes: v })}
          />
        </View>

        {/* Do Not Disturb */}
        <SectionHeader title="DO NOT DISTURB" />
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>No notifications from</Text>
            <Text style={styles.dndValue}>
              {settings.dndStart}:00 – {settings.dndEnd}:00
            </Text>
          </View>
          <Text style={styles.dndHint}>
            Quiet hours: {formatHour(settings.dndStart)} – {formatHour(settings.dndEnd)}
          </Text>
        </View>

        {/* Request notification permission CTA */}
        {!permissionGranted && (
          <TouchableOpacity style={styles.permissionBanner} onPress={requestPermission}>
            <Ionicons name="notifications-off" size={20} color={Colors.alertAmber} />
            <Text style={styles.permissionBannerText}>
              Tap to enable notifications so alerts can reach you
            </Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.alertAmber} />
          </TouchableOpacity>
        )}

        <Text style={styles.footer}>SkyCast · Powered by Open-Meteo</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontFamily: 'DMSans_500Medium',
    marginBottom: 20,
  },
  sectionHeader: {
    color: Colors.textMuted,
    fontSize: 10,
    fontFamily: 'DMSans_500Medium',
    letterSpacing: 0.08 * 10,
    marginBottom: 8,
    marginTop: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
  },
  unitToggle: {
    flexDirection: 'row',
    gap: 4,
  },
  unitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  unitBtnActive: {
    backgroundColor: Colors.accentBlue,
    borderColor: Colors.accentBlue,
  },
  unitBtnText: {
    color: Colors.textMuted,
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
  },
  unitBtnTextActive: {
    color: Colors.textPrimary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  chipActive: {
    backgroundColor: Colors.accentBlue,
    borderColor: Colors.accentBlue,
  },
  chipText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
  },
  chipTextActive: {
    color: Colors.textPrimary,
  },
  sensitivityValue: {
    color: Colors.accentBlue,
    fontSize: 18,
    fontFamily: 'DMSans_500Medium',
  },
  slider: {
    marginHorizontal: 12,
    marginBottom: 4,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  sliderLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
  },
  dndValue: {
    color: Colors.accentBlue,
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
  },
  dndHint: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(239,159,39,0.12)',
    borderWidth: 0.5,
    borderColor: Colors.alertAmber,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  permissionBannerText: {
    flex: 1,
    color: Colors.alertAmber,
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    lineHeight: 18,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  timePickerLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
  },
  footer: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
    marginTop: 32,
  },
});

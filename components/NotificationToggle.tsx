import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export function NotificationToggle({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.textWrap}>
        <Text style={styles.label}>{label}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: Colors.surface, true: Colors.accentBlue }}
        thumbColor={Colors.textPrimary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  textWrap: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
  },
  description: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    marginTop: 2,
  },
});

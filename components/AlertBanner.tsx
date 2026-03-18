import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface Props {
  message: string;
  onDismiss?: () => void;
}

export function AlertBanner({ message, onDismiss }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name="warning" size={16} color={Colors.alertAmber} />
      <Text style={styles.text} numberOfLines={2}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,159,39,0.15)',
    borderWidth: 0.5,
    borderColor: Colors.alertAmber,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  text: {
    flex: 1,
    color: Colors.alertAmber,
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    lineHeight: 18,
  },
});

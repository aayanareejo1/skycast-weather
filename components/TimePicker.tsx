import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Colors } from '../constants/colors';

interface Props {
  value: string; // "HH:MM"
  onChange: (time: string) => void;
}

function parseTime(t: string): Date {
  const [h, m] = t.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function formatTime(d: Date): string {
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function formatDisplay(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

export function TimePicker({ value, onChange }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [date, setDate] = useState(() => parseTime(value));

  function handleChange(_: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') {
      setShowModal(false);
      if (selected) {
        setDate(selected);
        onChange(formatTime(selected));
      }
    } else {
      if (selected) {
        setDate(selected);
      }
    }
  }

  function handleIOSConfirm() {
    onChange(formatTime(date));
    setShowModal(false);
  }

  return (
    <>
      <TouchableOpacity onPress={() => setShowModal(true)} activeOpacity={0.7}>
        <Text style={styles.timeValue}>{formatDisplay(value)}</Text>
      </TouchableOpacity>

      {Platform.OS === 'android' && showModal && (
        <DateTimePicker
          value={date}
          mode="time"
          is24Hour={false}
          onChange={handleChange}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal
          visible={showModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Digest Time</Text>
                <TouchableOpacity onPress={handleIOSConfirm}>
                  <Text style={styles.doneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={date}
                mode="time"
                display="spinner"
                onChange={handleChange}
                style={styles.iosPicker}
                textColor={Colors.textPrimary}
              />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  timeValue: {
    color: Colors.accentBlue,
    fontSize: 15,
    fontFamily: 'DMSans_500Medium',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontFamily: 'DMSans_500Medium',
  },
  cancelText: {
    color: Colors.textMuted,
    fontSize: 16,
    fontFamily: 'DMSans_400Regular',
  },
  doneText: {
    color: Colors.accentBlue,
    fontSize: 16,
    fontFamily: 'DMSans_500Medium',
  },
  iosPicker: {
    height: 200,
  },
});

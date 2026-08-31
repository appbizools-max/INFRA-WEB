import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomDropdownProps {
  label: string;
  selectedValue: string;
  options: string[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  iconName?: string;
  enabled?: boolean;
}

export default function CustomDropdown({
  label,
  selectedValue,
  options,
  onValueChange,
  placeholder = 'Select option',
  iconName,
  enabled = true,
}: CustomDropdownProps) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={!enabled}
        onPress={() => setModalVisible(true)}
        style={[
          styles.inputContainer,
          !enabled && styles.disabledContainer
        ]}
      >
        <View style={styles.leftContent}>
          {iconName && (
            <Ionicons
              name={iconName as any}
              size={20}
              color={enabled ? '#1E3A8A' : '#94A3B8'}
              style={styles.icon}
            />
          )}
          <Text
            style={[
              styles.selectedText,
              !selectedValue && styles.placeholderText,
              !enabled && styles.disabledText
            ]}
          >
            {selectedValue || placeholder}
          </Text>
        </View>
        <Ionicons
          name="chevron-down"
          size={18}
          color={enabled ? '#64748B' : '#CBD5E1'}
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{placeholder}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = selectedValue === item;
                return (
                  <TouchableOpacity
                    activeOpacity={0.6}
                    onPress={() => {
                      onValueChange(item);
                      setModalVisible(false);
                    }}
                    style={[
                      styles.optionRow,
                      isSelected && styles.selectedOptionRow
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.selectedOptionText
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color="#1E3A8A" />
                    )}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.listContent}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontFamily: 'Geist',
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: '#FFFFFF',
  },
  disabledContainer: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 10,
  },
  selectedText: {
    fontFamily: 'Geist',
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
    flex: 1,
  },
  placeholderText: {
    color: '#94A3B8',
    fontWeight: '500',
  },
  disabledText: {
    color: '#94A3B8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontFamily: 'Geist',
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginVertical: 2,
  },
  selectedOptionRow: {
    backgroundColor: '#EFF6FF',
  },
  optionText: {
    fontFamily: 'Geist',
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  selectedOptionText: {
    color: '#1E3A8A',
    fontWeight: '700',
  },
});

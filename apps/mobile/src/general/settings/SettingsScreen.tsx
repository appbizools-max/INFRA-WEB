import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" backgroundColor="#0a0a0a" translucent={false} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={styles.menuButton}>
          <Feather name="menu" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.settingItem}>
          <Feather name="moon" size={24} color="#10b981" style={{ marginRight: 16 }} />
          <Text style={styles.settingText}>Dark Mode Enabled</Text>
        </View>
        <View style={styles.settingItem}>
          <Feather name="bell" size={24} color="#a3a3a3" style={{ marginRight: 16 }} />
          <Text style={styles.settingText}>Notification Preferences</Text>
        </View>
        <View style={styles.settingItem}>
          <Feather name="shield" size={24} color="#a3a3a3" style={{ marginRight: 16 }} />
          <Text style={styles.settingText}>Security & Privacy</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#171717',
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    padding: 8,
    marginRight: 12,
    marginLeft: -8,
  },
  title: { fontFamily: 'Geist', fontSize: 24, fontWeight: '800', color: '#ffffff' },
  content: { flex: 1, padding: 20 },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171717',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#262626',
  },
  settingText: { fontFamily: 'Geist', fontSize: 16, fontWeight: '500', color: '#ffffff' }
});

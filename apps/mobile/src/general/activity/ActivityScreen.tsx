import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" backgroundColor="#0a0a0a" translucent={false} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={styles.menuButton}>
          <Feather name="menu" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Recent Activity</Text>
      </View>
      <View style={styles.content}>
        <Feather name="bell" size={48} color="#262626" style={{ marginBottom: 16 }} />
        <Text style={styles.emptyTitle}>No new activity</Text>
        <Text style={styles.emptyText}>You're all caught up! Notifications and updates will appear here.</Text>
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
  content: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: 'Geist', fontSize: 18, fontWeight: '700', color: '#a3a3a3', marginBottom: 8 },
  emptyText: { fontFamily: 'Geist', fontSize: 14, color: '#737373', textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 }
});

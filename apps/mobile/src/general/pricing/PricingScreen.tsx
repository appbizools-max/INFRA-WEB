import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';

export default function PricingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" backgroundColor="#0a0a0a" translucent={false} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={styles.menuButton}>
          <Feather name="menu" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Plans & Pricing</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.planCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="star" size={28} color="#10b981" />
          </View>
          <Text style={styles.planTitle}>Pro Plan</Text>
          <Text style={styles.planPrice}>$99 <Text style={styles.planPriceMonth}>/ month</Text></Text>
          <Text style={styles.planDesc}>Full access to Tenant, Client, and Vendor modules with priority support.</Text>
          
          <TouchableOpacity style={styles.subscribeButton}>
            <Text style={styles.subscribeText}>Upgrade Now</Text>
          </TouchableOpacity>
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
  planCard: {
    width: '100%', backgroundColor: '#171717', padding: 28, borderRadius: 20,
    borderWidth: 1, borderColor: '#262626', alignItems: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 5,
  },
  iconCircle: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)'
  },
  planTitle: { fontFamily: 'Geist', fontSize: 22, fontWeight: '700', color: '#ffffff', marginBottom: 4 },
  planPrice: { fontFamily: 'Geist', fontSize: 32, fontWeight: '800', color: '#10b981', marginBottom: 16 },
  planPriceMonth: { fontSize: 16, color: '#a3a3a3', fontWeight: '500' },
  planDesc: { fontFamily: 'Geist', fontSize: 15, color: '#a3a3a3', lineHeight: 22, marginBottom: 24 },
  subscribeButton: {
    width: '100%', backgroundColor: '#10b981', paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  subscribeText: { fontFamily: 'Geist', fontSize: 16, fontWeight: '700', color: '#ffffff' }
});

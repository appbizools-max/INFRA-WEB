import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileData {
  adminName: string;
  designation: string;
}

interface AccountantDashboardViewProps {
  profile: ProfileData;
  navigation: any;
}

export default function AccountantDashboardView({ profile, navigation }: AccountantDashboardViewProps) {
  const kpis = [
    { title: 'Total Invoiced', value: '₹1,24,500', stat: '↑ 12%', icon: 'trending-up-outline', color: '#059669', bg: '#ECFDF5' },
    { title: 'Receivables', value: '₹42,000', stat: '3 pending', icon: 'alert-circle-outline', color: '#D97706', bg: '#FFFBEB' },
    { title: 'Expenses', value: '₹18,300', stat: 'Fuel & Ops', icon: 'wallet-outline', color: '#2563EB', bg: '#EFF6FF' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>Welcome back, {profile?.adminName || 'Accountant'}!</Text>
        <Text style={styles.welcomeSubtitle}>{profile?.designation || 'Finance'} · Accounts Control Portal</Text>
      </View>

      <Text style={styles.sectionLabel}>Financial Highlights</Text>
      <View style={styles.kpiContainer}>
        {kpis.map((k, i) => (
          <View key={i} style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: k.bg }]}>
              <Ionicons name={k.icon as any} size={20} color={k.color} />
            </View>
            <Text style={styles.metricValue}>{k.value}</Text>
            <Text style={styles.metricTitle}>{k.title}</Text>
            <Text style={[styles.metricStatText, { color: k.color }]}>{k.stat}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#64748B',
    marginBottom: 10,
  },
  kpiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    alignItems: 'center',
  },
  metricIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  metricTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 2,
  },
  metricStatText: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
  },
  quickActionContainer: {
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
});

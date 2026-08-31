import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileData {
  adminName: string;
  designation: string;
}

interface OperationsDashboardViewProps {
  profile: ProfileData;
  navigation: any;
}

export default function OperationsDashboardView({ profile, navigation }: OperationsDashboardViewProps) {
  const kpis = [
    { title: 'Projects', value: '7', stat: '3 delayed', icon: 'briefcase-outline', color: '#2563EB', bg: '#EFF6FF' },
    { title: 'Work Sites', value: '12', stat: '5 districts', icon: 'map-outline', color: '#059669', bg: '#ECFDF5' },
    { title: 'Fleet Duty', value: '24', stat: 'Vehicles active', icon: 'bus-outline', color: '#D97706', bg: '#FFFBEB' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>Welcome back, {profile?.adminName || 'Operations Head'}!</Text>
        <Text style={styles.welcomeSubtitle}>{profile?.designation || 'Operations'} · Control Room</Text>
      </View>

      <Text style={styles.sectionLabel}>Operations Overview</Text>
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

      <Text style={styles.sectionLabel}>Quick Access</Text>
      <View style={styles.quickActionContainer}>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Projects')}>
          <View style={[styles.actionIcon, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="folder-open-outline" size={24} color="#2563EB" />
          </View>
          <Text style={styles.actionText}>Project Management</Text>
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('WorkSites')}>
          <View style={[styles.actionIcon, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="map-outline" size={24} color="#059669" />
          </View>
          <Text style={styles.actionText}>Field Work Sites</Text>
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
        </TouchableOpacity>
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

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileData {
  adminName: string;
  designation: string;
  memberId?: string;
  department?: string;
  email?: string;
  mobile?: string;
}

interface EmployeeDashboardViewProps {
  profile: ProfileData;
  status: 'Active' | 'Away' | 'On Duty' | 'Offline';
  handleUpdateStatus: (newStatus: 'Active' | 'Away' | 'On Duty' | 'Offline') => void;
}

export default function EmployeeDashboardView({ profile, status, handleUpdateStatus }: EmployeeDashboardViewProps) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>Welcome, {profile.adminName}!</Text>
        <Text style={styles.welcomeSubtitle}>{profile.designation} · {profile.memberId}</Text>
      </View>

      <Text style={styles.sectionLabel}>Shift Status</Text>
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTextLabel}>Current Status:</Text>
          <View style={[styles.badge, {
            backgroundColor: status === 'On Duty' ? '#ECFDF5' :
              status === 'Away' ? '#FFFBEB' : '#F1F5F9'
          }]}>
            <Text style={[styles.badgeText, {
              color: status === 'On Duty' ? '#059669' :
                status === 'Away' ? '#D97706' : '#64748B'
            }]}>{status}</Text>
          </View>
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity 
            style={[styles.btn, status === 'On Duty' && styles.btnActiveOnDuty]} 
            onPress={() => handleUpdateStatus('On Duty')}
          >
            <Ionicons name="time-outline" size={16} color={status === 'On Duty' ? '#FFFFFF' : '#64748B'} />
            <Text style={[styles.btnText, status === 'On Duty' && styles.btnTextActive]}>On Duty</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.btn, status === 'Away' && styles.btnActiveAway]} 
            onPress={() => handleUpdateStatus('Away')}
          >
            <Ionicons name="walk-outline" size={16} color={status === 'Away' ? '#FFFFFF' : '#64748B'} />
            <Text style={[styles.btnText, status === 'Away' && styles.btnTextActive]}>Away</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.btn, status === 'Offline' && styles.btnActiveOffline]} 
            onPress={() => handleUpdateStatus('Offline')}
          >
            <Ionicons name="power-outline" size={16} color={status === 'Offline' ? '#FFFFFF' : '#64748B'} />
            <Text style={[styles.btnText, status === 'Offline' && styles.btnTextActive]}>Clock Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionLabel}>My Profile details</Text>
      <View style={styles.profileCard}>
        <View style={styles.row}>
          <Ionicons name="briefcase-outline" size={18} color="#64748B" style={styles.icon} />
          <View>
            <Text style={styles.label}>Department</Text>
            <Text style={styles.val}>{profile.department || '—'}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Ionicons name="mail-outline" size={18} color="#64748B" style={styles.icon} />
          <View>
            <Text style={styles.label}>Corporate Email</Text>
            <Text style={styles.val}>{profile.email || '—'}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Ionicons name="phone-portrait-outline" size={18} color="#64748B" style={styles.icon} />
          <View>
            <Text style={styles.label}>Mobile Number</Text>
            <Text style={styles.val}>{profile.mobile || '—'}</Text>
          </View>
        </View>
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
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  statusTextLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
  },
  controlsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 6,
  },
  btnActiveOnDuty: {
    backgroundColor: '#00695C',
    borderColor: '#00695C',
  },
  btnActiveAway: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  btnActiveOffline: {
    backgroundColor: '#475569',
    borderColor: '#475569',
  },
  btnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  btnTextActive: {
    color: '#FFFFFF',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  icon: {
    marginRight: 14,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: '#94A3B8',
  },
  val: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2,
  },
});

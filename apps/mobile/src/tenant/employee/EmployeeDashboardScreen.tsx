import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth } from '@react-native-firebase/auth';
import { BASE_URL } from '../../services/api';

export default function EmployeeDashboardScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [status, setStatus] = useState<'Active' | 'Away' | 'On Duty' | 'Offline'>('Offline');

  const fetchProfile = async () => {
    const user = getAuth().currentUser;
    if (!user) return;
    try {
      const mobile = user.phoneNumber || '';
      const email = user.email || '';
      const baseUrl = BASE_URL;
      const res = await fetch(`${baseUrl}/api/tenant/profile/${user.uid}?mobile=${encodeURIComponent(mobile)}&email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        if (data.status) {
          setStatus(data.status);
        }
      }
    } catch (err) {
      console.error('Error fetching employee profile:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile();
  }, []);

  const updateStatus = async (newStatus: 'Active' | 'Away' | 'On Duty' | 'Offline') => {
    const user = getAuth().currentUser;
    if (!user) return;
    const baseUrl = BASE_URL;
    try {
      const res = await fetch(`${baseUrl}/api/tenant/employee/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user.uid,
          status: newStatus,
        }),
      });
      if (res.ok) {
        setStatus(newStatus);
        Alert.alert('Status Updated', `Your status is now ${newStatus}`);
      } else {
        Alert.alert('Error', 'Failed to update shift status');
      }
    } catch (err: any) {
      Alert.alert('Connection Error', err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0F172A" />
      </View>
    );
  }

  const initials = profile?.name
    ? profile.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'E';

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar style="dark" translucent={true} backgroundColor="transparent" />

      {/* HEADER BAR */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuBtn}>
          <Ionicons name="menu-outline" size={26} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Dashboard</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileBtn}>
          <View style={styles.avatarMini}>
            <Text style={styles.avatarMiniText}>{initials}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0F172A" />
        }
      >
        {/* WELCOME CARD */}
        <LinearGradient
          colors={['#0F172A', '#1E293B']}
          style={styles.welcomeCard}
        >
          <View style={styles.welcomeInfo}>
            <Text style={styles.welcomeGreeting}>Welcome Back,</Text>
            <Text style={styles.welcomeName}>{profile?.name || 'Employee'}</Text>
            <Text style={styles.welcomeRole}>
              {profile?.role || 'Staff Member'} • {profile?.member_id || '#TNT'}
            </Text>
          </View>
          <View style={styles.deptContainer}>
            <Text style={styles.deptText}>{profile?.department || 'Operations'}</Text>
          </View>
        </LinearGradient>

        {/* SHIFT STATUS TRACKER */}
        <Text style={styles.sectionHeader}>SHIFT MANAGER</Text>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusLabel}>Current Shift Status:</Text>
            <View
              style={[
                styles.statusIndicator,
                status === 'On Duty' && styles.indicatorOnDuty,
                status === 'Away' && styles.indicatorAway,
                status === 'Active' && styles.indicatorActive,
                status === 'Offline' && styles.indicatorOffline,
              ]}
            >
              <Text
                style={[
                  styles.statusIndicatorText,
                  status === 'On Duty' && styles.textOnDuty,
                  status === 'Away' && styles.textAway,
                  status === 'Active' && styles.textActive,
                  status === 'Offline' && styles.textOffline,
                ]}
              >
                {status}
              </Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            {/* On Duty */}
            <TouchableOpacity
              style={[styles.actionBtn, status === 'On Duty' && styles.btnActiveDuty]}
              onPress={() => updateStatus('On Duty')}
            >
              <Ionicons name="time" size={18} color={status === 'On Duty' ? '#FFFFFF' : '#64748B'} />
              <Text style={[styles.actionBtnText, status === 'On Duty' && styles.textWhite]}>On Duty</Text>
            </TouchableOpacity>

            {/* Away */}
            <TouchableOpacity
              style={[styles.actionBtn, status === 'Away' && styles.btnActiveAway]}
              onPress={() => updateStatus('Away')}
            >
              <Ionicons name="walk" size={18} color={status === 'Away' ? '#FFFFFF' : '#64748B'} />
              <Text style={[styles.actionBtnText, status === 'Away' && styles.textWhite]}>Away</Text>
            </TouchableOpacity>

            {/* Offline */}
            <TouchableOpacity
              style={[styles.actionBtn, status === 'Offline' && styles.btnActiveOffline]}
              onPress={() => updateStatus('Offline')}
            >
              <Ionicons name="power" size={18} color={status === 'Offline' ? '#FFFFFF' : '#64748B'} />
              <Text style={[styles.actionBtnText, status === 'Offline' && styles.textWhite]}>Offline</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* WORK SCHEDULE */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionHeader}>TODAY'S SCHEDULE</Text>
          <Text style={styles.sectionLink}>View All</Text>
        </View>

        <View style={styles.taskCard}>
          {/* Task 1 */}
          <View style={styles.taskItem}>
            <View style={styles.taskIconBox}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
            </View>
            <View style={styles.taskDetails}>
              <Text style={styles.taskTitle}>Safety Inspection Checklist</Text>
              <Text style={styles.taskTime}>Site Ops • 09:30 AM</Text>
            </View>
            <View style={[styles.taskTag, styles.tagComplete]}>
              <Text style={styles.tagCompleteText}>Completed</Text>
            </View>
          </View>

          {/* Task 2 */}
          <View style={styles.taskItem}>
            <View style={[styles.taskIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="ellipse-outline" size={20} color="#3B82F6" />
            </View>
            <View style={styles.taskDetails}>
              <Text style={styles.taskTitle}>Verify Site 4 Deliveries</Text>
              <Text style={styles.taskTime}>Logistics • 02:00 PM</Text>
            </View>
            <View style={[styles.taskTag, styles.tagProgress]}>
              <Text style={styles.tagProgressText}>In Progress</Text>
            </View>
          </View>

          {/* Task 3 */}
          <View style={styles.taskItem}>
            <View style={[styles.taskIconBox, { backgroundColor: '#F8FAFC' }]}>
              <Ionicons name="ellipse-outline" size={20} color="#94A3B8" />
            </View>
            <View style={styles.taskDetails}>
              <Text style={styles.taskTitle}>Submit Weekly Logs</Text>
              <Text style={styles.taskTime}>Operations • 04:30 PM</Text>
            </View>
            <View style={[styles.taskTag, styles.tagPending]}>
              <Text style={styles.tagPendingText}>Pending</Text>
            </View>
          </View>
        </View>

        {/* ORGANIZATIONAL DETAILS */}
        <Text style={styles.sectionHeader}>COMPANY PORTAL</Text>
        <View style={styles.companyInfoCard}>
          <View style={styles.infoRow}>
            <Feather name="briefcase" size={16} color="#64748B" style={styles.infoRowIcon} />
            <View>
              <Text style={styles.infoLabel}>Organization</Text>
              <Text style={styles.infoValue}>{profile?.companyName || 'Registered Tenant'}</Text>
            </View>
          </View>

          <View style={styles.infoRowDivider} />

          <View style={styles.infoRow}>
            <Feather name="mail" size={16} color="#64748B" style={styles.infoRowIcon} />
            <View>
              <Text style={styles.infoLabel}>Corporate Email</Text>
              <Text style={styles.infoValue}>{profile?.email || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoRowDivider} />

          <View style={styles.infoRow}>
            <Feather name="phone" size={16} color="#64748B" style={styles.infoRowIcon} />
            <View>
              <Text style={styles.infoLabel}>Mobile Number</Text>
              <Text style={styles.infoValue}>{profile?.mobile || 'N/A'}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 12 : 36,
    paddingBottom: 12,
    backgroundColor: '#FAFAFA',
  },
  menuBtn: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: 'Geist',
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileBtn: {
    padding: 2,
  },
  avatarMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniText: {
    fontFamily: 'Geist',
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  welcomeCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  welcomeInfo: {
    flex: 1,
  },
  welcomeGreeting: {
    fontFamily: 'Geist',
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  welcomeName: {
    fontFamily: 'Geist',
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  welcomeRole: {
    fontFamily: 'Geist',
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 4,
  },
  deptContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  deptText: {
    fontFamily: 'Geist',
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionHeader: {
    fontFamily: 'Geist',
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  sectionLink: {
    fontFamily: 'Geist',
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusLabel: {
    fontFamily: 'Geist',
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  statusIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusIndicatorText: {
    fontFamily: 'Geist',
    fontSize: 11,
    fontWeight: '800',
  },
  indicatorOnDuty: {
    backgroundColor: '#E0F2F1',
  },
  textOnDuty: {
    color: '#00695C',
  },
  indicatorAway: {
    backgroundColor: '#FFFBEB',
  },
  textAway: {
    color: '#D97706',
  },
  indicatorActive: {
    backgroundColor: '#E8F5E9',
  },
  textActive: {
    color: '#2E7D32',
  },
  indicatorOffline: {
    backgroundColor: '#F1F5F9',
  },
  textOffline: {
    color: '#64748B',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  actionBtnText: {
    fontFamily: 'Geist',
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  btnActiveDuty: {
    backgroundColor: '#00695C',
    borderColor: '#00695C',
  },
  btnActiveAway: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  btnActiveOffline: {
    backgroundColor: '#64748B',
    borderColor: '#64748B',
  },
  textWhite: {
    color: '#FFFFFF',
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  taskIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskDetails: {
    flex: 1,
  },
  taskTitle: {
    fontFamily: 'Geist',
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  taskTime: {
    fontFamily: 'Geist',
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  taskTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagComplete: {
    backgroundColor: '#E8F5E9',
  },
  tagCompleteText: {
    fontFamily: 'Geist',
    fontSize: 10,
    fontWeight: '700',
    color: '#2E7D32',
  },
  tagProgress: {
    backgroundColor: '#EFF6FF',
  },
  tagProgressText: {
    fontFamily: 'Geist',
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  tagPending: {
    backgroundColor: '#F1F5F9',
  },
  tagPendingText: {
    fontFamily: 'Geist',
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  companyInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoRowIcon: {
    marginRight: 14,
  },
  infoLabel: {
    fontFamily: 'Geist',
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontFamily: 'Geist',
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 2,
  },
  infoRowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
});

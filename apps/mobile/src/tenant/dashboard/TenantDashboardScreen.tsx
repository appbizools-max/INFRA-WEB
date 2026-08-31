// Force Metro cache reload
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth } from '@react-native-firebase/auth';
import { BASE_URL, mobileApiFetch } from '../../services/api';
import AdminDashboardView from './admin/AdminDashboardView';
import AccountantDashboardView from './accountant/AccountantDashboardView';
import HRDashboardView from './hr/HRDashboardView';
import OperationsDashboardView from './operations/OperationsDashboardView';
import EmployeeDashboardView from './employee/EmployeeDashboardView';
export default function TenantDashboardScreen({ navigation }: any) {
  // Mock dynamic registration state (0 to 100)
  const [registrationProgress, setRegistrationProgress] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [adminInitials, setAdminInitials] = useState('U');
  const [profile, setProfile] = useState<any>(null);
  const [pinnedProjects, setPinnedProjects] = useState<any[]>([]);
  const [status, setStatus] = useState<'Active' | 'Away' | 'On Duty' | 'Offline'>('Offline');

  const handleUpdateStatus = (newStatus: 'Active' | 'Away' | 'On Duty' | 'Offline') => {
    const user = getAuth().currentUser;
    if (!user) return;
    setStatus(newStatus);
    mobileApiFetch('/api/tenant/employee/status', {
      method: 'PATCH',
      body: JSON.stringify({ firebaseUid: user.uid, status: newStatus }),
    }).catch(() => {});
  };

  const fetchPinnedProjects = async (uid: string) => {
    try {
      const res = await mobileApiFetch(`/api/tenant/projects/${uid}`);
      if (res.ok) {
        const data = await res.json();
        setPinnedProjects(data.filter((p: any) => p.is_pinned));
      }
    } catch (err) {
      console.error('Failed to fetch pinned projects:', err);
    }
  };

  const fetchStatus = async () => {
    const user = getAuth().currentUser;
    if (user) {
      try {
        const mobile = user.phoneNumber || '';
        const email = user.email || '';
        const res = await mobileApiFetch(`/api/tenant/status/${user.uid}?mobile=${encodeURIComponent(mobile)}&email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data && data.percentage !== undefined) {
          setRegistrationProgress(data.percentage);
        }
        if (data && (data.status === 'complete' || data.status === 'completed')) {
          const profileRes = await mobileApiFetch(`/api/tenant/profile/${user.uid}?mobile=${encodeURIComponent(mobile)}&email=${encodeURIComponent(email)}`);
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            setProfile(profileData);
            if (profileData && profileData.status) {
              setStatus(profileData.status);
            }
            if (profileData && profileData.adminName) {
              const initials = profileData.adminName
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
              setAdminInitials(initials);
            }
            fetchPinnedProjects(user.uid);
          }
        } else {
          setProfile(null);
          setAdminInitials('U');
          setPinnedProjects([]);
        }
      } catch (err) {
        console.error('Failed to fetch registration status:', err);
      }
    }
  };
  useFocusEffect(
    useCallback(() => {
      fetchStatus();
    }, [])
  );
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Fire and forget the network request
    fetchStatus();
    // Dismiss the spinner almost immediately for a snappy UX feel
    setTimeout(() => {
      setRefreshing(false);
    }, 400);
  }, []);
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.headerMenuBtn}>
          <Ionicons name="reorder-three-outline" size={32} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitleMain}>InfraOps360</Text>
          <Text style={styles.headerTitleSub}>Operations. Connected. Efficient.</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="search-outline" size={24} color="#0F172A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>3</Text>
            </View>
            <Ionicons name="notifications-outline" size={24} color="#0F172A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.avatarText}>{adminInitials}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E3A8A" colors={["#1E3A8A"]} />
        }
      >
        {/* REGISTRATION BANNER */}
        {registrationProgress < 100 && (
          <View style={styles.registrationCard}>
            <View style={styles.regCardTop}>
              <View style={styles.regIconContainer}>
                <Ionicons name="business-outline" size={32} color="#1E3A8A" />
                <View style={styles.regIconCheck}>
                  <Ionicons name="checkmark-circle" size={16} color="#1E3A8A" />
                </View>
              </View>
              <View style={styles.regTextContainer}>
                <Text style={styles.regTitle}>Complete Company Registration</Text>
                <Text style={styles.regSubtitle}>Register your organization and activate your <Text style={{ fontWeight: '700', color: '#1E3A8A' }}>14-Day Free Trial</Text>.</Text>
              </View>

              {/* Circular Progress Mock */}
              <View style={[styles.progressCircle, {
                borderColor: registrationProgress > 0 ? '#1E3A8A' : '#E2E8F0',
                borderLeftColor: '#E2E8F0' // mock chunk
              }]}>
                <Text style={styles.progressPercent}>{registrationProgress}%</Text>
                <Text style={styles.progressLabel}>Complete</Text>
              </View>
            </View>

            <View style={styles.regCardBottom}>
              {registrationProgress > 0 ? (
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${registrationProgress}%` }]} />
                </View>
              ) : null}
              <TouchableOpacity
                style={styles.continueBtn}
                onPress={() => navigation.navigate('RegistrationWizard')}
              >
                <Text style={styles.continueText}>
                  {registrationProgress === 0 ? "Start Registration" : "Complete Registration"}
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#1E3A8A" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* REAL PROFILE OVERVIEW */}
        {registrationProgress === 100 && profile ? (
          (() => {
            const isHR = 
              String(profile.department).toUpperCase().includes('HR') || 
              String(profile.department).toUpperCase().includes('HUMAN RES') || 
              String(profile.designation).toUpperCase().includes('HR') || 
              String(profile.designation).toUpperCase().includes('HUMAN RES');

            const isAccountant =
              String(profile.department).toUpperCase().includes('ACCOUNT') ||
              String(profile.department).toUpperCase().includes('FINANCE') ||
              String(profile.designation).toUpperCase().includes('ACCOUNT') ||
              String(profile.designation).toUpperCase().includes('FINANCE');

            const isOperations =
              String(profile.department).toUpperCase().includes('OPERAT') ||
              String(profile.department).toUpperCase().includes('LOGISTICS') ||
              String(profile.department).toUpperCase().includes('SITE') ||
              String(profile.designation).toUpperCase().includes('OPERAT') ||
              String(profile.designation).toUpperCase().includes('OPERATION') ||
              String(profile.designation).toUpperCase().includes('LOGISTICS') ||
              String(profile.designation).toUpperCase().includes('SITE MANAGER') ||
              String(profile.designation).toUpperCase().includes('SUPERVISOR') ||
              String(profile.designation).toUpperCase().includes('COORDINATOR');

            if (profile.userType === 'team_member') {
              if (isHR) {
                return <HRDashboardView navigation={navigation} />;
              }
              if (isAccountant) {
                return <AccountantDashboardView profile={profile} navigation={navigation} />;
              }
              if (isOperations) {
                return <OperationsDashboardView profile={profile} navigation={navigation} />;
              }
              return (
                <EmployeeDashboardView 
                  profile={profile} 
                  status={status} 
                  handleUpdateStatus={handleUpdateStatus} 
                />
              );
            }

            return (
              <AdminDashboardView 
                profile={profile} 
                pinnedProjects={pinnedProjects} 
                navigation={navigation} 
              />
            );
          })()
        ) : null}

        {/* TRIAL BANNER */}
        <LinearGradient colors={['#001538', '#000A1C']} style={styles.trialBanner}>
          <View style={styles.trialContent}>
            <View style={styles.shieldIcon}>
              <Ionicons name="shield-checkmark-outline" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.trialTexts}>
              <Text style={styles.trialTitle}>14-Day Free Trial</Text>
              <Text style={styles.trialSubtitle}>7 Days Remaining</Text>
            </View>
            <TouchableOpacity style={styles.upgradeBtn}>
              <Text style={styles.upgradeBtnText}>Upgrade Plan</Text>
              <Ionicons name="arrow-forward" size={16} color="#001538" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------- COMPONENTS ---------------- //

const MetricCard = ({ title, value, stat, icon, color, bg }: any) => (
  <View style={styles.metricCard}>
    <View style={[styles.metricIconBox, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricTitle}>{title}</Text>
    <View style={styles.metricStatRow}>
      <Ionicons name="arrow-up" size={12} color="#10B981" />
      <Text style={styles.metricStatText}><Text style={{ color: '#10B981' }}>{stat}</Text> this month</Text>
    </View>
  </View>
);

const QuickAction = ({ icon, label }: any) => (
  <TouchableOpacity style={styles.quickActionCard}>
    <Ionicons name={icon} size={24} color="#0F172A" style={{ marginBottom: 8 }} />
    <Text style={styles.quickActionLabel}>{label.replace('\\n', '\n')}</Text>
  </TouchableOpacity>
);

const TaskItem = ({ icon, iconColor, iconBg, title, subtitle, badgeText, badgeColor, badgeTextColor }: any) => (
  <TouchableOpacity style={styles.taskItem}>
    <View style={[styles.taskIconBox, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
    <View style={styles.taskTextContent}>
      <Text style={styles.taskTitle}>{title}</Text>
      <Text style={styles.taskSubtitle}>{subtitle}</Text>
    </View>
    <View style={styles.taskRight}>
      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
        <Text style={[styles.badgeTextSmall, { color: badgeTextColor }]}>{badgeText}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#94A3B8" style={{ marginLeft: 8 }} />
    </View>
  </TouchableOpacity>
);



// ---------------- STYLES ---------------- //

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  headerMenuBtn: {
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitleMain: {
    fontFamily: 'Geist',
    fontSize: 18,
    fontWeight: '800',
    color: '#001A4A',
  },
  headerTitleSub: {
    fontFamily: 'Geist',
    fontSize: 10,
    color: '#64748B',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    marginRight: 16,
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  avatarBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#001A4A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Geist',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Registration Banner
  registrationCard: {
    backgroundColor: '#F8FAFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  regCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  regIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  regIconCheck: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#FFF',
    borderRadius: 8,
  },
  regTextContainer: {
    flex: 1,
  },
  regTitle: {
    fontFamily: 'Geist',
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  regSubtitle: {
    fontFamily: 'Geist',
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  progressCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  progressPercent: {
    fontFamily: 'Geist',
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  progressLabel: {
    fontFamily: 'Geist',
    fontSize: 10,
    color: '#64748B',
  },
  progressRing: {
    // Intentionally empty, border handles the visual mock
  },
  regCardBottom: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginRight: 16,
  },
  progressBarFill: {
    width: '40%',
    height: '100%',
    backgroundColor: '#1E3A8A',
    borderRadius: 3,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  continueText: {
    fontFamily: 'Geist',
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A',
    marginRight: 4,
  },

  // Metrics Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  metricIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontFamily: 'Geist',
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  metricTitle: {
    fontFamily: 'Geist',
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  metricStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricStatText: {
    fontFamily: 'Geist',
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 4,
  },

  // Headers for Sections
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Geist',
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  viewAllBtn: {
    fontFamily: 'Geist',
    fontSize: 13,
    fontWeight: '600',
    color: '#1E3A8A',
  },

  // Quick Actions
  quickActionsScroll: {
    marginBottom: 24,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  quickActionCard: {
    width: 80,
    height: 90,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickActionLabel: {
    fontFamily: 'Geist',
    fontSize: 11,
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 14,
  },

  // Pending Tasks
  tasksContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 24,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  taskIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskTextContent: {
    flex: 1,
    marginRight: 8,
  },
  taskTitle: {
    fontFamily: 'Geist',
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  taskSubtitle: {
    fontFamily: 'Geist',
    fontSize: 11,
    color: '#64748B',
  },
  taskRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeTextSmall: {
    fontFamily: 'Geist',
    fontSize: 10,
    fontWeight: '700',
  },

  // Trial Banner
  trialBanner: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  trialContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  shieldIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  trialTexts: {
    flex: 1,
  },
  trialTitle: {
    fontFamily: 'Geist',
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  trialSubtitle: {
    fontFamily: 'Geist',
    fontSize: 13,
    color: '#94A3B8',
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  upgradeBtnText: {
    fontFamily: 'Geist',
    fontSize: 13,
    fontWeight: '800',
    color: '#001538',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginLeft: 64,
  },
  dot: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 6,
  },
  activeDot: {
    backgroundColor: '#3B82F6',
  },
  profileOverviewContainer: {
    marginBottom: 20,
  },
  welcomeCard: {
    backgroundColor: '#F8FAFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontFamily: 'Geist',
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontFamily: 'Geist',
    fontSize: 12,
    color: '#64748B',
  },
  sectionLabel: {
    fontFamily: 'Geist',
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  dashboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  dashboardRowIcon: {
    marginRight: 16,
  },
  dashboardRowContent: {
    flex: 1,
  },
  dashboardRowLabel: {
    fontFamily: 'Geist',
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dashboardRowValue: {
    fontFamily: 'Geist',
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Pinned Projects Styles
  viewAllText: {
    fontFamily: 'Geist',
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    padding: 4,
  },
  pinnedProjectsContainer: {
    gap: 12,
  },
  pinnedProjectCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  pinnedProjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pinnedProjectIdBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pinnedProjectIdText: {
    fontFamily: 'Geist',
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  pinnedProjectStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pinnedProjectStatusText: {
    fontFamily: 'Geist',
    fontSize: 10,
    fontWeight: '800',
  },
  pinnedProjectName: {
    fontFamily: 'Geist',
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  pinnedProjectFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinnedProjectLocation: {
    fontFamily: 'Geist',
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 6,
    flex: 1,
  },
  emptyPinnedState: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPinnedIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  emptyPinnedTitle: {
    fontFamily: 'Geist',
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptyPinnedSub: {
    fontFamily: 'Geist',
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  emptyPinnedBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  emptyPinnedBtnText: {
    fontFamily: 'Geist',
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

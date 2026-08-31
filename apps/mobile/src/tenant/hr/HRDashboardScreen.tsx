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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth } from '@react-native-firebase/auth';
import { BASE_URL } from '../../services/api';

export default function HRDashboardScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [status, setStatus] = useState<'Active' | 'Away' | 'On Duty' | 'Offline'>('Offline');
  
  // HR states
  const [pendingLeaves, setPendingLeaves] = useState([
    { id: '1', name: 'Ramesh Kumar', type: 'Sick Leave', duration: '2 Days', date: 'Jul 16 - Jul 17' },
    { id: '2', name: 'Srinivas Rao', type: 'Casual Leave', duration: '1 Day', date: 'Jul 20' }
  ]);
  const [reportLogs, setReportLogs] = useState<any[]>([]);
  const [companyEmployees, setCompanyEmployees] = useState<any[]>([]);
  const [activeProjects, setActiveProjects] = useState<any[]>([]);
  const [selectedReportEmployee, setSelectedReportEmployee] = useState<any>(null);

  const fetchHRDashboardData = async (tId: string, userUid: string) => {
    if (!tId) return;
    try {
      const baseUrl = BASE_URL;
      
      // 1. Fetch shift logs
      const resLogs = await fetch(`${baseUrl}/api/tenant/attendance/report?tenantId=${tId}`);
      if (resLogs.ok) {
        const data = await resLogs.json();
        setReportLogs(data);
      }

      // 2. Fetch team members
      const resTeam = await fetch(`${baseUrl}/api/tenant/team/${userUid}`);
      if (resTeam.ok) {
        const data = await resTeam.json();
        setCompanyEmployees(data);
      }

      // 3. Fetch projects
      const resProj = await fetch(`${baseUrl}/api/tenant/projects/${userUid}`);
      if (resProj.ok) {
        const data = await resProj.json();
        setActiveProjects(data);
      }
    } catch (err) {
      console.error('Error fetching mobile HR data:', err);
    }
  };

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
        if (data.tenantId) {
          fetchHRDashboardData(data.tenantId, user.uid);
        }
      }
    } catch (err) {
      console.error('Error fetching HR profile:', err);
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
        Alert.alert('Status Updated', `Your shift status is now ${newStatus}`);
      } else {
        Alert.alert('Error', 'Failed to update shift status');
      }
    } catch (err: any) {
      Alert.alert('Connection Error', err.message);
    }
  };

  const handleLeaveAction = (id: string, action: 'Approve' | 'Reject') => {
    setPendingLeaves(pendingLeaves.filter(item => item.id !== id));
    Alert.alert('Success', `Leave request from staff member has been ${action}d!`);
  };

  const getTodayLog = (empId: string) => {
    const todayStr = new Date().toISOString().substring(0, 10);
    return reportLogs.find(log => log.memberId === empId && log.checkInTime.substring(0, 10) === todayStr);
  };

  const getMonthlyHours = (empId: string) => {
    const empLogs = reportLogs.filter(log => log.memberId === empId);
    const total = empLogs.reduce((acc: number, log: any) => acc + (Number(log.workHours) || 0), 0);
    return total.toFixed(1);
  };

  const getLeavesCount = (empId: string) => {
    if (!empId) return 0;
    const idNum = empId.replace(/\D/g, '');
    const parsed = parseInt(idNum) || 5;
    return (parsed % 4) + 1;
  };

  const getHalfDaysCount = (empId: string) => {
    if (!empId) return 0;
    const idNum = empId.replace(/\D/g, '');
    const parsed = parseInt(idNum) || 5;
    return (parsed % 3);
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
    : 'HR';

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar style="dark" translucent={true} backgroundColor="transparent" />

      {/* HEADER BAR */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuBtn}>
          <Ionicons name="menu-outline" size={26} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HR Dashboard</Text>
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
        {/* HR WELCOME CARD */}
        <LinearGradient
          colors={['#1E293B', '#0F172A']}
          style={styles.welcomeCard}
        >
          <View style={styles.welcomeInfo}>
            <Text style={styles.welcomeGreeting}>Human Resources Portal</Text>
            <Text style={styles.welcomeName}>{profile?.name || 'HR Manager'}</Text>
            <Text style={styles.welcomeRole}>
              {profile?.role || 'HR'} • {profile?.member_id || '#TNT'}
            </Text>
          </View>
          <View style={styles.deptContainer}>
            <Text style={styles.deptText}>HR & People Ops</Text>
          </View>
        </LinearGradient>

        {/* HR QUICK METRICS */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricVal}>{companyEmployees.length}</Text>
            <Text style={styles.metricLbl}>Employees</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricVal, { color: '#0F766E' }]}>
              {reportLogs.filter(l => !l.checkOutTime).length}
            </Text>
            <Text style={styles.metricLbl}>Active Now</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricVal, { color: '#D97706' }]}>{pendingLeaves.length}</Text>
            <Text style={styles.metricLbl}>Leaves Pending</Text>
          </View>
        </View>

        {/* SHIFT STATUS TRACKER */}
        <Text style={styles.sectionHeader}>MY SHIFT STATUS</Text>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusLabel}>My Duty Status:</Text>
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

        {/* PENDING LEAVE REQUESTS */}
        <Text style={[styles.sectionHeader, { marginTop: 24 }]}>PENDING LEAVE APPROVALS</Text>
        {pendingLeaves.length > 0 ? (
          <View style={styles.leavesContainer}>
            {pendingLeaves.map(leave => (
              <View key={leave.id} style={styles.leaveCard}>
                <View style={styles.leaveHeader}>
                  <View>
                    <Text style={styles.leaveName}>{leave.name}</Text>
                    <Text style={styles.leaveDetails}>{leave.type} • {leave.duration} ({leave.date})</Text>
                  </View>
                </View>
                <View style={styles.leaveActions}>
                  <TouchableOpacity
                    style={[styles.leaveBtn, styles.btnReject]}
                    onPress={() => handleLeaveAction(leave.id, 'Reject')}
                  >
                    <Text style={styles.rejectText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.leaveBtn, styles.btnApprove]}
                    onPress={() => handleLeaveAction(leave.id, 'Approve')}
                  >
                    <Text style={styles.approveText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={32} color="#94A3B8" />
            <Text style={styles.emptyText}>All leave requests processed</Text>
          </View>
        )}

        {/* EMPLOYEE SHIFT LOGS */}
        <Text style={[styles.sectionHeader, { marginTop: 24 }]}>EMPLOYEE SHIFT LOGS</Text>
        {reportLogs.length > 0 ? (
          <View style={styles.logsContainer}>
            {reportLogs.map(log => {
              const checkInDate = new Date(log.checkInTime).toLocaleDateString([], { day: '2-digit', month: 'short' });
              const checkInTime = new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
              const checkOutTime = log.checkOutTime 
                ? new Date(log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                : 'Active';

              return (
                <View key={log.id} style={styles.logCard}>
                  <View style={styles.logCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.logName}>{log.employeeName}</Text>
                      <Text style={styles.logMeta}>{log.role} • {log.memberId}</Text>
                    </View>
                    <View style={[styles.logStatusBadge, log.checkOutTime ? styles.badgeCompleted : styles.badgeActive]}>
                      <Text style={log.checkOutTime ? styles.badgeCompletedText : styles.badgeActiveText}>
                        {log.checkOutTime ? 'Completed' : 'On Duty'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.logDivider} />

                  <View style={styles.logTimeRow}>
                    <View style={styles.timeBlock}>
                      <Text style={styles.timeLabel}>DATE</Text>
                      <Text style={styles.timeValue}>{checkInDate}</Text>
                    </View>
                    <View style={styles.timeBlock}>
                      <Text style={styles.timeLabel}>CHECK IN</Text>
                      <Text style={styles.timeValue}>{checkInTime}</Text>
                    </View>
                    <View style={styles.timeBlock}>
                      <Text style={styles.timeLabel}>CHECK OUT</Text>
                      <Text style={styles.timeValue}>{checkOutTime}</Text>
                    </View>
                    {log.workHours !== null && (
                      <View style={styles.timeBlock}>
                        <Text style={styles.timeLabel}>HOURS</Text>
                        <Text style={styles.timeValue}>{log.workHours}h</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={32} color="#94A3B8" />
            <Text style={styles.emptyText}>No shift logs recorded today</Text>
          </View>
        )}

        {/* COMPANY EMPLOYEES */}
        <Text style={[styles.sectionHeader, { marginTop: 24 }]}>EMPLOYEE ATTENDANCE & LEAVE TRACKER</Text>
        {companyEmployees.length > 0 ? (
          <View style={styles.logsContainer}>
            {companyEmployees.map(emp => {
              const todayLog = getTodayLog(emp.member_id);
              const leaves = getLeavesCount(emp.member_id);
              const halfDays = getHalfDaysCount(emp.member_id);
              const totalHours = getMonthlyHours(emp.member_id);

              return (
                <View key={emp.id} style={styles.logCard}>
                  <View style={styles.logCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.logName}>{emp.name}</Text>
                      <Text style={styles.logMeta}>{emp.member_id || 'PENDING'} • {emp.role}</Text>
                    </View>
                    <View style={[styles.logStatusBadge, { backgroundColor: emp.status === 'Active' ? '#ECFDF5' : '#F1F5F9' }]}>
                      <Text style={[styles.badgeCompletedText, { color: emp.status === 'Active' ? '#047857' : '#475569' }]}>
                        {emp.status}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.logDivider} />

                  {/* Punch Stats */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={[styles.logMeta, { marginTop: 0 }]}>
                      Today: {todayLog ? `In: ${new Date(todayLog.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}` : 'No Check-In'}
                    </Text>
                    <Text style={[styles.logMeta, { marginTop: 0 }]}>
                      Leaves: <Text style={{ color: '#D97706', fontWeight: 'bold' }}>{leaves}d</Text> | Half Days: <Text style={{ color: '#64748B', fontWeight: 'bold' }}>{halfDays}d</Text>
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.logMeta}>Monthly Worktime: {totalHours} hrs</Text>
                    <TouchableOpacity
                      onPress={() => setSelectedReportEmployee(emp)}
                      style={{ backgroundColor: '#0F172A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>View Report</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={32} color="#94A3B8" />
            <Text style={styles.emptyText}>No registered employees found</Text>
          </View>
        )}

        {/* COMPANY PROJECTS */}
        <Text style={[styles.sectionHeader, { marginTop: 24 }]}>ACTIVE PROJECTS</Text>
        {activeProjects.length > 0 ? (
          <View style={styles.logsContainer}>
            {activeProjects.map(proj => (
              <View key={proj.id} style={styles.logCard}>
                <View style={styles.logCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logName}>{proj.name}</Text>
                    <Text style={styles.logMeta}>ID: {proj.id} {proj.customer ? `• Client: ${proj.customer}` : ''}</Text>
                  </View>
                </View>
                <View style={styles.logDivider} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="map-pin" size={12} color="#94A3B8" />
                  <Text style={[styles.logMeta, { marginTop: 0 }]}>{proj.location} {proj.locationBlock ? `(${proj.locationBlock})` : ''}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={32} color="#94A3B8" />
            <Text style={styles.emptyText}>No active projects registered</Text>
          </View>
        )}

        {/* CORPORATE IDENTITY CARD */}
        <Text style={[styles.sectionHeader, { marginTop: 24 }]}>COMPANY DETAILS</Text>
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

      {/* Attendance Report Modal */}
      <Modal
        visible={selectedReportEmployee !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedReportEmployee(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Attendance Report</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedReportEmployee?.name} • {selectedReportEmployee?.role}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedReportEmployee(null)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Stats Row */}
            <View style={styles.modalStatsRow}>
              <View style={styles.modalStatBlock}>
                <Text style={styles.statLabel}>MONTHLY WORK</Text>
                <Text style={styles.statVal}>{selectedReportEmployee ? getMonthlyHours(selectedReportEmployee.member_id) : '0'}h</Text>
              </View>
              <View style={styles.modalStatBlock}>
                <Text style={styles.statLabel}>LEAVES</Text>
                <Text style={[styles.statVal, { color: '#D97706' }]}>
                  {selectedReportEmployee ? getLeavesCount(selectedReportEmployee.member_id) : '0'}d
                </Text>
              </View>
              <View style={styles.modalStatBlock}>
                <Text style={styles.statLabel}>HALF DAYS</Text>
                <Text style={[styles.statVal, { color: '#64748B' }]}>
                  {selectedReportEmployee ? getHalfDaysCount(selectedReportEmployee.member_id) : '0'}d
                </Text>
              </View>
            </View>

            {/* Logs Timeline List */}
            <Text style={styles.modalSectionTitle}>SHIFT LOGS HISTORY</Text>
            <ScrollView style={styles.modalLogsScroll} showsVerticalScrollIndicator={false}>
              {selectedReportEmployee && reportLogs.filter(log => log.memberId === selectedReportEmployee.member_id).length > 0 ? (
                reportLogs.filter(log => log.memberId === selectedReportEmployee.member_id).map((log, index) => {
                  const checkInTime = new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                  const checkOutTime = log.checkOutTime 
                    ? new Date(log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                    : 'Active';
                  return (
                    <View key={log.id} style={styles.modalLogItem}>
                      <View style={styles.modalLogDotContainer}>
                        <View style={styles.modalLogDot} />
                        {index < reportLogs.filter(l => l.memberId === selectedReportEmployee.member_id).length - 1 && (
                          <View style={styles.modalLogLine} />
                        )}
                      </View>
                      <View style={{ flex: 1, paddingBottom: 16 }}>
                        <Text style={styles.modalLogDate}>
                          {new Date(log.checkInTime).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                          <Text style={styles.modalLogTimeText}>In: {checkInTime}</Text>
                          <Text style={[styles.modalLogTimeText, log.checkOutTime ? null : { color: '#0F766E', fontWeight: 'bold' }]}>
                            Out: {checkOutTime}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Text style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic' }}>No shift logs found for this employee</Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity onPress={() => setSelectedReportEmployee(null)} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseBtnText}>Close Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#1E293B',
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
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  metricVal: {
    fontFamily: 'Geist',
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  metricLbl: {
    fontFamily: 'Geist',
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  sectionHeader: {
    fontFamily: 'Geist',
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.2,
    marginBottom: 8,
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
  leavesContainer: {
    gap: 10,
  },
  leaveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  leaveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leaveName: {
    fontFamily: 'Geist',
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  leaveDetails: {
    fontFamily: 'Geist',
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  leaveActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    justifyContent: 'flex-end',
  },
  leaveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnReject: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FEE2E2',
  },
  btnApprove: {
    backgroundColor: '#ECFDF5',
    borderColor: '#D1FAE5',
  },
  rejectText: {
    fontFamily: 'Geist',
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  approveText: {
    fontFamily: 'Geist',
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'Geist',
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 4,
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
  logsContainer: {
    gap: 12,
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logName: {
    fontFamily: 'Geist',
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  logMeta: {
    fontFamily: 'Geist',
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  logStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  badgeCompleted: {
    backgroundColor: '#F1F5F9',
  },
  badgeActive: {
    backgroundColor: '#10B981',
  },
  badgeCompletedText: {
    fontFamily: 'Geist',
    fontSize: 8,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
  },
  badgeActiveText: {
    fontFamily: 'Geist',
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  logDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  logTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeBlock: {
    alignItems: 'center',
    flex: 1,
  },
  timeLabel: {
    fontFamily: 'Geist',
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  timeValue: {
    fontFamily: 'Geist',
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Geist',
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontFamily: 'Geist',
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  modalStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  modalStatBlock: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statLabel: {
    fontFamily: 'Geist',
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  statVal: {
    fontFamily: 'Geist',
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  modalSectionTitle: {
    fontFamily: 'Geist',
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  modalLogsScroll: {
    maxHeight: 250,
    marginBottom: 20,
  },
  modalLogItem: {
    flexDirection: 'row',
    gap: 12,
  },
  modalLogDotContainer: {
    alignItems: 'center',
    width: 16,
  },
  modalLogDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E293B',
    marginTop: 6,
  },
  modalLogLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  modalLogDate: {
    fontFamily: 'Geist',
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  modalLogTimeText: {
    fontFamily: 'Geist',
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  modalCloseBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontFamily: 'Geist',
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

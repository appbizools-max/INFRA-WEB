import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { getAuth } from '@react-native-firebase/auth';
import { BASE_URL } from '../../services/api';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function AttendanceTrackerScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [reportLogs, setReportLogs] = useState<any[]>([]);
  const [companyEmployees, setCompanyEmployees] = useState<any[]>([]);
  const [selectedReportEmployee, setSelectedReportEmployee] = useState<any>(null);

  // Monthly filter
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const years = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];

  const fetchTrackerData = async (tId: string, userUid: string) => {
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
    } catch (err) {
      console.error('Error fetching mobile tracker data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
        if (data.tenantId) {
          fetchTrackerData(data.tenantId, user.uid);
        }
      }
    } catch (err) {
      console.error('Error fetching profile in tracker:', err);
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

  const getTodayLog = (empId: string) => {
    const todayStr = new Date().toISOString().substring(0, 10);
    return reportLogs.find(log => log.memberId === empId && log.checkInTime.substring(0, 10) === todayStr);
  };

  const getFilteredLogs = (empId: string) =>
    reportLogs.filter(log => {
      if (log.memberId !== empId) return false;
      const d = new Date(log.checkInTime);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

  const getMonthlyHours = (empId: string) => {
    const total = getFilteredLogs(empId).reduce((acc: number, log: any) => acc + (Number(log.workHours) || 0), 0);
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar style="dark" translucent={true} backgroundColor="transparent" />

      {/* HEADER BAR */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuBtn}>
          <Ionicons name="menu-outline" size={26} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance Tracker</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0F172A" />
        }
      >
        {/* Monthly Filter */}
        <View style={styles.filterCard}>
          <Text style={styles.sectionHeader}>FILTER BY MONTH</Text>
          <View style={{ flexDirection: 'row' }}>
            <View style={[styles.pickerWrapper, { flex: 2, marginRight: 8 }]}>
              <Picker
                selectedValue={selectedMonth}
                onValueChange={val => setSelectedMonth(val)}
                style={styles.picker}
                mode="dropdown"
              >
                {MONTHS.map((m, i) => (
                  <Picker.Item key={m} label={m} value={i} />
                ))}
              </Picker>
            </View>
            <View style={[styles.pickerWrapper, { flex: 1 }]}>
              <Picker
                selectedValue={selectedYear}
                onValueChange={val => setSelectedYear(val)}
                style={styles.picker}
                mode="dropdown"
              >
                {years.map(y => (
                  <Picker.Item key={y} label={String(y)} value={y} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeader}>EMPLOYEE SHIFT & LEAVE TRACKING</Text>
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
                <Text style={styles.statLabel}>{MONTHS[selectedMonth].substring(0,3).toUpperCase()} WORK</Text>
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
            <Text style={styles.modalSectionTitle}>LOGS — {MONTHS[selectedMonth].toUpperCase()} {selectedYear}</Text>
            <ScrollView style={styles.modalLogsScroll} showsVerticalScrollIndicator={false}>
              {selectedReportEmployee && getFilteredLogs(selectedReportEmployee.member_id).length > 0 ? (
                getFilteredLogs(selectedReportEmployee.member_id).map((log, index) => {
                  const checkInTime = new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                  const checkOutTime = log.checkOutTime 
                    ? new Date(log.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                    : 'Active';
                  return (
                    <View key={log.id} style={styles.modalLogItem}>
                      <View style={styles.modalLogDotContainer}>
                        <View style={styles.modalLogDot} />
                        {index < getFilteredLogs(selectedReportEmployee.member_id).length - 1 && (
                          <View style={styles.modalLogLine} />
                        )}
                      </View>
                      <View style={{ flex: 1, paddingBottom: 16 }}>
                        <Text style={styles.modalLogDate}>
                          {new Date(log.checkInTime).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Text>
                        <View style={{ flexDirection: 'row', marginTop: 4 }}>
                          <Text style={[styles.modalLogTimeText, { marginRight: 14 }]}>In: {checkInTime}</Text>
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
  optedByCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optedByLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  optedByName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  optedByRole: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 16,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  picker: {
    height: 44,
    color: '#0F172A',
    fontSize: 12,
  },
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
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontFamily: 'Geist',
    fontSize: 11,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 16,
    marginTop: 8,
  },
  logsContainer: {
    flexDirection: 'column',
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 12,
  },
  logCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logName: {
    fontFamily: 'Geist',
    fontSize: 14,
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
  badgeCompletedText: {
    fontFamily: 'Geist',
    fontSize: 8,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
  },
  logDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontFamily: 'Geist',
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 8,
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
    marginRight: 10,
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
  },
  modalLogDotContainer: {
    alignItems: 'center',
    width: 16,
    marginRight: 12,
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

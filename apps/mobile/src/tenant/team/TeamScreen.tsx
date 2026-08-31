import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getAuth } from '@react-native-firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { BASE_URL } from '../../services/api';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  mobile: string;
  status: 'Active' | 'Away' | 'On Duty' | 'Offline';
  initials: string;
  member_id: string;
  division_id?: string;
  division_name?: string;
  bank_name?: string;
  bank_account_number?: string;
  ifsc_code?: string;
  account_holder_name?: string;
  sub_role?: string;
  employee_type?: string;
  joining_date?: string;
  alternate_mobile?: string;
  aadhar_number?: string;
  residing_address?: string;
  permanent_address?: string;
  emergency_contact_name?: string;
  emergency_contact_mobile?: string;
  blood_group?: string;
  salary?: string | number;
}

const DEPARTMENTS = ['All', 'Operations', 'Logistics', 'Site Ops', 'HR', 'Accountant'];

const getStatusColor = (status: string) => {
  if (status === 'Active') return '#10B981';
  if (status === 'On Duty') return '#0D9488';
  if (status === 'Away') return '#F59E0B';
  return '#94A3B8';
};

export default function TeamScreen({ navigation }: any) {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [splashVisible, setSplashVisible] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;

  // Fade out splash overlay smoothly when loading finishes
  useEffect(() => {
    if (!loading) {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        setSplashVisible(false);
      });
    }
  }, [loading]);
  const [searchQuery, setSearchQuery] = useState('');
  // Dropdown picker modal state
  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [showSubRolePicker, setShowSubRolePicker] = useState(false);
  const [selectedDept, setSelectedDept] = useState('All');
  const [divisions, setDivisions] = useState<any[]>([]);
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [isEditingDivision, setIsEditingDivision] = useState(false);
  console.log('[DEBUG] Rendering TeamScreen. detailsModalVisible:', detailsModalVisible, 'hasSelectedMember:', !!selectedMember);

  const handleUpdateDivision = async (memberId: string, divId: string) => {
    if (!selectedMember) return;
    try {
      const res = await fetch(`${BASE_URL}/api/tenant/team/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: selectedMember.name,
          role: selectedMember.role,
          department: selectedMember.department,
          email: selectedMember.email,
          mobile: selectedMember.mobile,
          divisionId: divId || null,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        const divObj = divisions.find(d => d.id === updated.division_id);
        const formatted = {
          ...selectedMember,
          division_id: updated.division_id,
          division_name: divObj ? divObj.name : undefined
        };
        setSelectedMember(formatted);
        setTeam(team.map(m => m.id === memberId ? formatted : m));
        setIsEditingDivision(false);
      } else {
        Alert.alert('Error', 'Failed to update division');
      }
    } catch (err) {
      Alert.alert('Network Error', 'Could not connect to server');
    }
  };
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  // New Member Form State
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newDept, setNewDept] = useState('Operations');
  const [newEmail, setNewEmail] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newDivisionId, setNewDivisionId] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [newBankAccountNumber, setNewBankAccountNumber] = useState('');
  const [newIfscCode, setNewIfscCode] = useState('');
  const [newAccountHolderName, setNewAccountHolderName] = useState('');
  const [newSubRole, setNewSubRole] = useState('');
  const [newEmployeeType, setNewEmployeeType] = useState('Permanent');
  const [newJoiningDate, setNewJoiningDate] = useState('');

  const fetchTeamMembers = async () => {
    const user = getAuth().currentUser;
    if (!user) {
      setLoading(false);
      return;
    }
    const baseUrl = BASE_URL;
    try {
      const res = await fetch(`${baseUrl}/api/tenant/team/${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        // Calculate initials dynamically for each member
        const formattedData = data.map((member: any) => {
          const nameParts = member.name.trim().split(' ');
          const initials = nameParts.map((p: string) => p[0]).join('').toUpperCase().substring(0, 2);
          return {
            ...member,
            initials: initials || 'U',
          };
        });
        setTeam(formattedData);
      } else {
        const text = await res.text();
        console.error(`Failed to fetch team members. Status: ${res.status}, Body: ${text}`);
      }
    } catch (err) {
      console.error('Connection error fetching team:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDivisions = async () => {
    const user = getAuth().currentUser;
    if (!user) return;
    try {
      const res = await fetch(`${BASE_URL}/api/tenant/divisions/${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        setDivisions(data);
      }
    } catch (err) {
      console.error('Error fetching divisions on mobile team page:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchTeamMembers();
      fetchDivisions();
    }, [])
  );

  const handleAddMember = async () => {
    if (!newName.trim() || !newRole.trim() || !newEmail.trim() || !newMobile.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    const user = getAuth().currentUser;
    if (!user) {
      Alert.alert('Error', 'User is not authenticated.');
      return;
    }

    const baseUrl = BASE_URL;
    try {
      const response = await fetch(`${baseUrl}/api/tenant/team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminUid: user.uid,
          name: newName.trim(),
          role: newRole.trim(),
          department: newDept,
          email: newEmail.trim(),
          mobile: newMobile.trim(),
          divisionId: newDivisionId || null,
          bankName: newBankName.trim() || null,
          bankAccountNumber: newBankAccountNumber.trim() || null,
          ifscCode: newIfscCode.trim() || null,
          accountHolderName: newAccountHolderName.trim() || null,
          subRole: newSubRole.trim() || null,
          employeeType: newEmployeeType,
          joiningDate: newJoiningDate || null,
        }),
      });

      if (response.ok) {
        const savedMember = await response.json();
        const nameParts = savedMember.name.trim().split(' ');
        const initials = nameParts.map((p: string) => p[0]).join('').toUpperCase().substring(0, 2);
        const divObj = divisions.find(d => d.id === savedMember.division_id);
        const formattedMember = {
          ...savedMember,
          initials: initials || 'U',
          division_name: divObj ? divObj.name : undefined
        };

        setTeam([formattedMember, ...team]);

        // Reset Form
        setNewName('');
        setNewRole('');
        setNewDept('Operations');
        setNewEmail('');
        setNewMobile('');
        setNewDivisionId('');
        setNewBankName('');
        setNewBankAccountNumber('');
        setNewIfscCode('');
        setNewAccountHolderName('');
        setNewSubRole('');
        setNewEmployeeType('Permanent');
        setNewJoiningDate('');
        setModalVisible(false);

        Alert.alert('Success', `${formattedMember.name} has been added to the team!`);
      } else {
        const errData = await response.json();
        Alert.alert('Error', errData.error || 'Failed to add member');
      }
    } catch (err: any) {
      Alert.alert('Error', 'Connection failed: ' + err.message);
    }
  };

  const triggerDeleteConfirm = (member: TeamMember) => {
    setSelectedMember(member);
    setDeleteConfirmVisible(true);
  };

  const confirmDeleteMember = async () => {
    if (!selectedMember) return;
    const baseUrl = BASE_URL;
    try {
      const res = await fetch(`${baseUrl}/api/tenant/team/${selectedMember.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setTeam(team.filter(m => m.id !== selectedMember.id));
        setDeleteConfirmVisible(false);
        setDetailsModalVisible(false);
        Alert.alert('Success', 'Team member removed successfully.');
      } else {
        Alert.alert('Error', 'Failed to delete team member');
      }
    } catch (err: any) {
      Alert.alert('Error', 'Connection failed: ' + err.message);
    }
  };

  const handleContact = (type: 'call' | 'message' | 'email', member: TeamMember) => {
    Alert.alert(
      `${type.toUpperCase()} Direct`,
      `Connecting to ${member.name} via ${type === 'call' || type === 'message' ? member.mobile : member.email}`
    );
  };

  // Filter Team Members
  const filteredTeam = team.filter(member => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesDept = true;
    if (selectedDept !== 'All') {
      if (selectedDept === 'HR') {
        matchesDept = 
          String(member.department).toUpperCase().includes('HR') || 
          String(member.department).toUpperCase().includes('HUMAN RES');
      } else {
        matchesDept = member.department === selectedDept;
      }
    }

    const matchesDivision = selectedDivisionFilter === 'All' || member.division_id === selectedDivisionFilter;

    return matchesSearch && matchesDept && matchesDivision;
  });

  // Calculate Metrics
  const activeCount = team.filter(m => m.status === 'Active' || m.status === 'On Duty').length;
  const uniqueDepts = new Set(team.map(m => m.department === 'Human Resources' ? 'HR' : m.department)).size;

  const renderStatus = (status: string) => {
    let bgColor = '#F8FAFC';
    let textColor = '#64748B';

    if (status === 'Active') {
      bgColor = '#E8F5E9';
      textColor = '#2E7D32';
      return (
        <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
          <View style={[styles.statusDot, { backgroundColor: textColor }]} />
          <Text style={[styles.statusText, { color: textColor }]}>Active</Text>
        </View>
      );
    } else if (status === 'On Duty') {
      bgColor = '#E0F2F1';
      textColor = '#00695C';
      return (
        <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
          <Ionicons name="time-outline" size={10} color={textColor} style={{ marginRight: 3 }} />
          <Text style={[styles.statusText, { color: textColor }]}>On Duty</Text>
        </View>
      );
    } else if (status === 'Away') {
      bgColor = '#FFFBEB';
      textColor = '#F57F17';
      return (
        <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
          <View style={[styles.statusDot, { backgroundColor: textColor }]} />
          <Text style={[styles.statusText, { color: textColor }]}>Away</Text>
        </View>
      );
    } else {
      bgColor = '#F5F5F5';
      textColor = '#616161';
      return (
        <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
          <View style={[styles.statusDot, { backgroundColor: textColor }]} />
          <Text style={[styles.statusText, { color: textColor }]}>Offline</Text>
        </View>
      );
    }
  };

  const renderDeptBadge = (dept: string) => {
    let iconName: any = 'briefcase-outline';
    if (String(dept).toUpperCase().includes('HR') || String(dept).toUpperCase().includes('HUMAN RES')) {
      iconName = 'person-outline';
    } else if (dept === 'Site Ops') {
      iconName = 'location-outline';
    } else if (dept === 'Finance' || dept === 'Accountant') {
      iconName = 'trending-up-outline';
    }

    return (
      <View style={styles.deptBadge}>
        <Ionicons name={iconName} size={10} color="#64748B" style={{ marginRight: 4 }} />
        <Text style={styles.deptBadgeText}>{dept}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" translucent={true} backgroundColor="transparent" />

      {/* FULL-SCREEN LOADING SPLASH OVERLAY */}
      {splashVisible && (
        <Animated.View style={[styles.splashOverlay, { opacity: splashOpacity }]} pointerEvents={loading ? 'auto' : 'none'}>
          <View style={styles.splashContent}>
            <View style={styles.splashLogoBox}>
              <Ionicons name="people" size={44} color="#FFFFFF" />
            </View>
            <Text style={styles.splashTitle}>Team Directory</Text>
            <Text style={styles.splashSubtitle}>Loading your team members…</Text>
            <ActivityIndicator size="large" color="#FFFFFF" style={{ marginTop: 28 }} />
          </View>
        </Animated.View>
      )}

      {/* MAIN SCROLLABLE VIEW (Header, stats, search, and list scroll together) */}
      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER BANNER (Clean Light Theme) */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuBtn}>
              <Ionicons name="menu-outline" size={26} color="#0F172A" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Team Directory</Text>
              <Text style={styles.headerSubtitle}>Manage and view your team members</Text>
            </View>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
              <Ionicons name="add" size={15} color="#0F172A" style={{ marginRight: 3 }} />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SEARCH AND FILTERS CONTAINER */}
        <View style={styles.searchFilterContainer}>
          {/* Search Input with Filter Icon */}
          <View style={styles.searchBox}>
            <Feather name="search" size={16} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, role, department..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.filterBtn}>
              <Ionicons name="options-outline" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* HORIZONTAL CHIPS */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.deptScroll}
            contentContainerStyle={styles.deptScrollContent}
          >
            {DEPARTMENTS.map(dept => {
              const isActive = selectedDept === dept;
              return (
                <TouchableOpacity
                  key={dept}
                  style={[styles.deptChip, isActive && styles.activeDeptChip]}
                  onPress={() => setSelectedDept(dept)}
                >
                  <Text style={[styles.deptChipText, isActive && styles.activeDeptChipText]}>
                    {dept}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* HORIZONTAL DIVISION FILTER CHIPS */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.deptScroll, { marginTop: 6 }]}
            contentContainerStyle={styles.deptScrollContent}
          >
            <TouchableOpacity
              style={[styles.deptChip, selectedDivisionFilter === 'All' && styles.activeDeptChip]}
              onPress={() => setSelectedDivisionFilter('All')}
            >
              <Text style={[styles.deptChipText, selectedDivisionFilter === 'All' && styles.activeDeptChipText]}>
                All Divisions
              </Text>
            </TouchableOpacity>
            {divisions.map(div => {
              const isActive = selectedDivisionFilter === div.id;
              return (
                <TouchableOpacity
                  key={div.id}
                  style={[styles.deptChip, isActive && styles.activeDeptChip]}
                  onPress={() => setSelectedDivisionFilter(div.id)}
                >
                  <Text style={[styles.deptChipText, isActive && styles.activeDeptChipText]}>
                    {div.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* DIRECTORY LIST */}
        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.loaderContainer}>
              {/* Spacer — actual loader is shown in splash overlay */}
            </View>
          ) : filteredTeam.length > 0 ? (
            filteredTeam.map(member => (
              <TouchableOpacity
                key={member.id}
                style={styles.memberCard}
                onPress={() => {
                  console.log('Team Member Card Clicked:', member.name, member.id);
                  setSelectedMember(member);
                  setDetailsModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  {/* Avatar with status dot */}
                  <View style={{ position: 'relative' }}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{member.initials}</Text>
                    </View>
                    <View style={[styles.avatarStatusDot, { backgroundColor: getStatusColor(member.status) }]} />
                  </View>

                  {/* Member Info */}
                  <View style={styles.memberDetails}>
                    <View style={styles.nameRow}>
                      <Text style={styles.memberName} numberOfLines={1}>
                        {member.name}
                      </Text>
                      <TouchableOpacity
                        onPress={() => triggerDeleteConfirm(member)}
                        style={styles.cardMenuBtn}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <Feather name="more-vertical" size={16} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.memberIdText}>ID: {member.member_id || 'Generating...'}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <Text style={styles.memberRole}>{member.role}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        {renderDeptBadge(member.department)}
                        {member.division_name && (
                          <View style={[styles.deptBadge, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }]}>
                            <Feather name="map-pin" size={8} color="#2563EB" style={{ marginRight: 2 }} />
                            <Text style={[styles.deptBadgeText, { color: '#2563EB' }]}>{member.division_name}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={44} color="#CBD5E1" style={{ marginBottom: 10 }} />
              <Text style={styles.emptyText}>No team members found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search filters or add a new member.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ADD MEMBER MODAL */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}
        >
          <View style={styles.fullScreenOverlay}>
            <View style={styles.fullScreenContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Team Member</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeModalBtn}>
                  <Ionicons name="close" size={22} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.modalForm} 
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Full Name</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. John Doe"
                      placeholderTextColor="#94A3B8"
                      value={newName}
                      onChangeText={setNewName}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Role / Designation</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="briefcase-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. Site Supervisor"
                      placeholderTextColor="#94A3B8"
                      value={newRole}
                      onChangeText={setNewRole}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Employee Type</Text>
                  <View style={styles.pickerContainer}>
                    {['Permanent', 'Contract', 'Temporary', 'Daily Wager', 'Apprentice'].map(type => {
                      const isSelected = newEmployeeType === type;
                      return (
                        <TouchableOpacity
                          key={type}
                          style={[styles.deptSelectorChip, isSelected && styles.deptSelectorChipActive]}
                          onPress={() => setNewEmployeeType(type)}
                        >
                          <Text style={[styles.deptSelectorText, isSelected && styles.deptSelectorTextActive]}>
                            {type}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* ── Department Dropdown ── */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Department *</Text>
                  <TouchableOpacity
                    style={styles.dropdownRow}
                    onPress={() => setShowDeptPicker(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="business-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <Text style={[styles.dropdownValue, !newDept && { color: '#94A3B8' }]}>
                      {newDept || 'Select department…'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                {/* ── Operational Sub-Role Dropdown (conditional) ── */}
                {(newDept === 'Operations' || newDept === 'Site Ops') && (
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Operational Sub-Role</Text>
                    <TouchableOpacity
                      style={styles.dropdownRow}
                      onPress={() => setShowSubRolePicker(true)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="briefcase-outline" size={18} color="#64748B" style={styles.inputIcon} />
                      <Text style={[styles.dropdownValue, !newSubRole && { color: '#94A3B8' }]}>
                        {newSubRole || 'Select sub-role…'}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Email Address</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. john.doe@infraops360.com"
                      placeholderTextColor="#94A3B8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={newEmail}
                      onChangeText={setNewEmail}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Mobile Number</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="call-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. +91 98765 43210"
                      placeholderTextColor="#94A3B8"
                      keyboardType="phone-pad"
                      value={newMobile}
                      onChangeText={setNewMobile}
                    />
                  </View>
                </View>

                {/* Bank Account Details Form Section */}
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: '#0F172A', fontWeight: 'bold', fontSize: 13, marginTop: 10 }]}>Bank Account Details</Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Account Holder Name</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. John Doe"
                      placeholderTextColor="#94A3B8"
                      value={newAccountHolderName}
                      onChangeText={setNewAccountHolderName}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Bank Name</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="business-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. State Bank of India"
                      placeholderTextColor="#94A3B8"
                      value={newBankName}
                      onChangeText={setNewBankName}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Account Number</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="card-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. 1234567890"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={newBankAccountNumber}
                      onChangeText={setNewBankAccountNumber}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>IFSC Code</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="shield-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. SBIN0001234"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="characters"
                      value={newIfscCode}
                      onChangeText={setNewIfscCode}
                    />
                  </View>
                </View>

                {/* Division Selector */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Division Assignment</Text>
                  <View style={styles.pickerContainer}>
                    <TouchableOpacity
                      style={[styles.deptSelectorChip, newDivisionId === '' && styles.deptSelectorChipActive]}
                      onPress={() => setNewDivisionId('')}
                    >
                      <Text style={[styles.deptSelectorText, newDivisionId === '' && styles.deptSelectorTextActive]}>
                        Unassigned
                      </Text>
                    </TouchableOpacity>
                    {divisions.map(div => {
                      const isSelected = newDivisionId === div.id;
                      return (
                        <TouchableOpacity
                          key={div.id}
                          style={[styles.deptSelectorChip, isSelected && styles.deptSelectorChipActive]}
                          onPress={() => setNewDivisionId(div.id)}
                        >
                          <Text style={[styles.deptSelectorText, isSelected && styles.deptSelectorTextActive]}>
                            {div.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Joining Date *</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="calendar-outline" size={18} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.formInput}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94A3B8"
                      value={newJoiningDate}
                      onChangeText={setNewJoiningDate}
                    />
                  </View>
                </View>

                <TouchableOpacity style={styles.submitButton} onPress={handleAddMember}>
                  <Text style={styles.submitButtonText}>Add Member</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── DEPARTMENT PICKER MODAL ── */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDeptPicker}
        onRequestClose={() => setShowDeptPicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerModalOverlay}
          activeOpacity={1}
          onPress={() => setShowDeptPicker(false)}
        >
          <View style={styles.pickerModalSheet}>
            <View style={styles.pickerModalHandle} />
            <Text style={styles.pickerModalTitle}>Select Department</Text>
            {['Operations', 'Logistics', 'Site Ops', 'Human Resources', 'Accountant'].map(dept => (
              <TouchableOpacity
                key={dept}
                style={[styles.pickerOption, newDept === dept && styles.pickerOptionActive]}
                onPress={() => { setNewDept(dept); setNewSubRole(''); setShowDeptPicker(false); }}
              >
                <Text style={[styles.pickerOptionText, newDept === dept && styles.pickerOptionTextActive]}>
                  {dept}
                </Text>
                {newDept === dept && <Ionicons name="checkmark-circle" size={20} color="#001538" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── OPERATIONAL SUB-ROLE PICKER MODAL ── */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showSubRolePicker}
        onRequestClose={() => setShowSubRolePicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerModalOverlay}
          activeOpacity={1}
          onPress={() => setShowSubRolePicker(false)}
        >
          <View style={styles.pickerModalSheet}>
            <View style={styles.pickerModalHandle} />
            <Text style={styles.pickerModalTitle}>Select Sub-Role</Text>
            {[
              'Operational Manager',
              'Site Incharge',
              'Site Supervisor',
              'Driver',
              'Helper',
              'Crane Operator',
              'Dozer Operator',
            ].map(sub => (
              <TouchableOpacity
                key={sub}
                style={[styles.pickerOption, newSubRole === sub && styles.pickerOptionActive]}
                onPress={() => { setNewSubRole(sub); setShowSubRolePicker(false); }}
              >
                <Text style={[styles.pickerOptionText, newSubRole === sub && styles.pickerOptionTextActive]}>
                  {sub}
                </Text>
                {newSubRole === sub && <Ionicons name="checkmark-circle" size={20} color="#001538" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* EMPLOYEE DETAILS MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <SafeAreaView style={styles.corpOverlay}>
          {selectedMember && (
            <View style={{ flex: 1 }}>
              {/* Corporate Title Bar */}
              <View style={styles.corpHeaderBar}>
                <TouchableOpacity onPress={() => setDetailsModalVisible(false)} style={styles.corpBackBtn}>
                  <Ionicons name="arrow-back" size={22} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.corpHeaderTitle}>Employee Registry Profile</Text>
                <View style={{ width: 22 }} />
              </View>

              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* ── Corporate Page Header ── */}
                <View style={styles.corpProfileHeader}>
                  <View style={styles.corpAvatarContainer}>
                    <View style={styles.corpAvatar}>
                      <Text style={styles.corpAvatarText}>{selectedMember.initials || 'U'}</Text>
                    </View>
                    <View style={[styles.corpStatusDot, { backgroundColor: getStatusColor(selectedMember.status) }]} />
                  </View>
                  <View style={styles.corpMeta}>
                    <Text style={styles.corpName}>{selectedMember.name || 'N/A'}</Text>
                    <Text style={styles.corpRole}>{selectedMember.role || 'N/A'}</Text>
                    <Text style={styles.corpIdText}>Employee Code: {selectedMember.member_id || 'N/A'}</Text>
                  </View>
                </View>

                {/* ── Profile Sections ── */}
                <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
                  
                  {/* SECTION 1: IDENTITY & ASSIGNMENT */}
                  <View style={styles.corpSectionCard}>
                    <Text style={styles.corpSectionTitle}>Identity & Assignment</Text>
                    
                    <View style={styles.corpRow}>
                      <Text style={styles.corpLabel}>Employee ID</Text>
                      <Text style={styles.corpValue}>{selectedMember.member_id || 'N/A'}</Text>
                    </View>

                    <View style={styles.corpRow}>
                      <Text style={styles.corpLabel}>Department</Text>
                      <Text style={styles.corpValue}>{selectedMember.department}</Text>
                    </View>

                    {selectedMember.sub_role ? (
                      <View style={styles.corpRow}>
                        <Text style={styles.corpLabel}>Sub-Role</Text>
                        <Text style={styles.corpValue}>{selectedMember.sub_role}</Text>
                      </View>
                    ) : null}

                    <View style={[styles.corpRow, { borderBottomWidth: 0 }]}>
                      <Text style={styles.corpLabel}>Division Boundary</Text>
                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        {isEditingDivision ? (
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                            <TouchableOpacity
                              style={[styles.deptSelectorChip, !selectedMember.division_id && styles.deptSelectorChipActive, { paddingVertical: 4, paddingHorizontal: 8 }]}
                              onPress={() => handleUpdateDivision(selectedMember.id, '')}
                            >
                              <Text style={[styles.deptSelectorText, !selectedMember.division_id && styles.deptSelectorTextActive, { fontSize: 10 }]}>Unassigned</Text>
                            </TouchableOpacity>
                            {divisions.map(div => {
                              const isSelected = selectedMember.division_id === div.id;
                              return (
                                <TouchableOpacity
                                  key={div.id}
                                  style={[styles.deptSelectorChip, isSelected && styles.deptSelectorChipActive, { paddingVertical: 4, paddingHorizontal: 8 }]}
                                  onPress={() => handleUpdateDivision(selectedMember.id, div.id)}
                                >
                                  <Text style={[styles.deptSelectorText, isSelected && styles.deptSelectorTextActive, { fontSize: 10 }]}>{div.name}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        ) : (
                          <Text style={[styles.corpValue, { color: selectedMember.division_name ? '#2563EB' : '#475569' }]}>
                            {selectedMember.division_name || 'Unassigned'}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity onPress={() => setIsEditingDivision(!isEditingDivision)} style={styles.corpEditLink}>
                        <Text style={styles.corpEditLinkText}>{isEditingDivision ? 'Cancel' : 'Edit'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* SECTION 2: EMPLOYMENT INFORMATION */}
                  <View style={styles.corpSectionCard}>
                    <Text style={styles.corpSectionTitle}>Employment Details</Text>

                    <View style={styles.corpRow}>
                      <Text style={styles.corpLabel}>Employment Type</Text>
                      <Text style={styles.corpValue}>{selectedMember.employee_type || 'Permanent'}</Text>
                    </View>

                    <View style={styles.corpRow}>
                      <Text style={styles.corpLabel}>Joining Date</Text>
                      <Text style={styles.corpValue}>{selectedMember.joining_date || 'N/A'}</Text>
                    </View>

                    <View style={styles.corpRow}>
                      <Text style={styles.corpLabel}>Current Status</Text>
                      <Text style={[styles.corpValue, { color: getStatusColor(selectedMember.status) }]}>
                        {selectedMember.status || 'Active'}
                      </Text>
                    </View>

                    <View style={[styles.corpRow, { borderBottomWidth: 0 }]}>
                      <Text style={styles.corpLabel}>Base Salary</Text>
                      <Text style={styles.corpValue}>
                        {selectedMember.salary ? `INR ${selectedMember.salary}` : 'N/A'}
                      </Text>
                    </View>
                  </View>

                  {/* SECTION 2.5: PERSONAL IDENTITY */}
                  <View style={styles.corpSectionCard}>
                    <Text style={styles.corpSectionTitle}>Personal Identity</Text>

                    <View style={styles.corpRow}>
                      <Text style={styles.corpLabel}>Aadhar Card UID</Text>
                      <Text style={styles.corpValue}>{selectedMember.aadhar_number || 'N/A'}</Text>
                    </View>

                    <View style={[styles.corpRow, { borderBottomWidth: 0 }]}>
                      <Text style={styles.corpLabel}>Blood Group</Text>
                      <Text style={styles.corpValue}>{selectedMember.blood_group || 'N/A'}</Text>
                    </View>
                  </View>

                  {/* SECTION 3: CONTACT DETAILS */}
                  <View style={styles.corpSectionCard}>
                    <Text style={styles.corpSectionTitle}>Contact Details</Text>

                    <View style={styles.corpRow}>
                      <Text style={styles.corpLabel}>Email Address</Text>
                      <Text style={styles.corpValue}>{selectedMember.email}</Text>
                    </View>

                    <View style={styles.corpRow}>
                      <Text style={styles.corpLabel}>Mobile Number</Text>
                      <Text style={styles.corpValue}>{selectedMember.mobile}</Text>
                    </View>

                    <View style={styles.corpRow}>
                      <Text style={styles.corpLabel}>Alternate Contact</Text>
                      <Text style={styles.corpValue}>{selectedMember.alternate_mobile || 'N/A'}</Text>
                    </View>

                    <View style={styles.corpRow}>
                      <Text style={styles.corpLabel}>Residing Address</Text>
                      <Text style={[styles.corpValue, { flex: 1, marginLeft: 12 }]}>{selectedMember.residing_address || 'N/A'}</Text>
                    </View>

                    <View style={[styles.corpRow, { borderBottomWidth: 0 }]}>
                      <Text style={styles.corpLabel}>Permanent Address</Text>
                      <Text style={[styles.corpValue, { flex: 1, marginLeft: 12 }]}>{selectedMember.permanent_address || 'N/A'}</Text>
                    </View>
                  </View>

                  {/* SECTION 3.5: EMERGENCY CONTACTS */}
                  <View style={styles.corpSectionCard}>
                    <Text style={styles.corpSectionTitle}>Emergency Contacts</Text>

                    <View style={styles.corpRow}>
                      <Text style={styles.corpLabel}>Emergency Contact Name</Text>
                      <Text style={styles.corpValue}>{selectedMember.emergency_contact_name || 'N/A'}</Text>
                    </View>

                    <View style={[styles.corpRow, { borderBottomWidth: 0 }]}>
                      <Text style={styles.corpLabel}>Emergency Contact Mobile</Text>
                      <Text style={styles.corpValue}>{selectedMember.emergency_contact_mobile || 'N/A'}</Text>
                    </View>
                  </View>

                  {/* SECTION 4: FINANCIAL & BANK DETAILS */}
                  {selectedMember.bank_name || selectedMember.bank_account_number || selectedMember.ifsc_code || selectedMember.account_holder_name ? (
                    <View style={styles.corpSectionCard}>
                      <Text style={styles.corpSectionTitle}>Bank & Financial Details</Text>

                      <View style={styles.corpRow}>
                        <Text style={styles.corpLabel}>Account Holder</Text>
                        <Text style={styles.corpValue}>{selectedMember.account_holder_name || 'N/A'}</Text>
                      </View>

                      <View style={styles.corpRow}>
                        <Text style={styles.corpLabel}>Bank Name</Text>
                        <Text style={styles.corpValue}>{selectedMember.bank_name || 'N/A'}</Text>
                      </View>

                      <View style={styles.corpRow}>
                        <Text style={styles.corpLabel}>Account Number</Text>
                        <Text style={styles.corpValue}>{selectedMember.bank_account_number || 'N/A'}</Text>
                      </View>

                      <View style={[styles.corpRow, { borderBottomWidth: 0 }]}>
                        <Text style={styles.corpLabel}>IFSC Code</Text>
                        <Text style={styles.corpValue}>{selectedMember.ifsc_code || 'N/A'}</Text>
                      </View>
                    </View>
                  ) : null}

                  {/* ── Danger Zone / Removal Actions ── */}
                  <View style={styles.corpDangerCard}>
                    <Text style={styles.corpDangerTitle}>Administrative Actions</Text>
                    <Text style={styles.corpDangerText}>
                      Removing this user will immediately revoke their authorization and restrict systems access.
                    </Text>
                    <TouchableOpacity
                      style={styles.corpDangerBtn}
                      onPress={() => triggerDeleteConfirm(selectedMember)}
                    >
                      <Text style={styles.corpDangerBtnText}>Remove from Team Directory</Text>
                    </TouchableOpacity>
                  </View>

                  {/* ── Close Button ── */}
                  <TouchableOpacity
                    style={styles.corpCloseBtn}
                    onPress={() => setDetailsModalVisible(false)}
                  >
                    <Text style={styles.corpCloseBtnText}>Go Back</Text>
                  </TouchableOpacity>

                </View>
              </ScrollView>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteConfirmVisible}
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View style={[styles.modalOverlay, { justifyContent: 'center', paddingHorizontal: 24, backgroundColor: 'rgba(15, 23, 42, 0.6)' }]}>
          <View style={[styles.modalContainer, { maxHeight: 'auto', borderRadius: 20, padding: 24, width: '100%' }]}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Ionicons name="warning" size={32} color="#EF4444" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 8 }}>Remove Team Member</Text>
              <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 18 }}>
                Are you sure you want to remove {selectedMember?.name} from the team? This action is permanent and cannot be undone.
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <TouchableOpacity
                style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}
                onPress={() => setDeleteConfirmVisible(false)}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#475569' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' }}
                onPress={confirmDeleteMember}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Yes, Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* BOTTOM TAB BAR */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Dashboard')}>
          <Ionicons name="grid-outline" size={18} color="#94A3B8" />
          <Text style={styles.tabLabel}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="people" size={20} color="#00112c" />
          <Text style={[styles.tabLabel, styles.activeTabLabel]}>Team</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Client Portal')}>
          <Ionicons name="business-outline" size={18} color="#94A3B8" />
          <Text style={styles.tabLabel}>Departments</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={18} color="#94A3B8" />
          <Text style={styles.tabLabel}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  mainScrollView: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  mainScrollContent: {
    paddingBottom: 24,
  },
  headerBanner: {
    backgroundColor: '#FAFAFA',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  menuBtn: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 14,
  },
  headerTitle: {
    fontFamily: 'Geist',
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontFamily: 'Geist',
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  addButtonText: {
    fontFamily: 'Geist',
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  metricVal: {
    fontFamily: 'Geist',
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  metricLbl: {
    fontFamily: 'Geist',
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  searchFilterContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Geist',
    fontSize: 13,
    color: '#0F172A',
    height: '100%',
  },
  filterBtn: {
    padding: 4,
    marginLeft: 6,
  },
  deptScroll: {
    marginTop: 12,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  deptScrollContent: {
    paddingRight: 32,
    paddingBottom: 4,
  },
  deptChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  activeDeptChip: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  deptChipText: {
    fontFamily: 'Geist',
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  activeDeptChipText: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 16,
    marginTop: 14,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2E3A4E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontFamily: 'Geist',
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  avatarStatusDot: {
    position: 'absolute',
    bottom: 1,
    right: 13,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  memberDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberName: {
    fontFamily: 'Geist',
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusAndActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
    marginRight: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  statusText: {
    fontFamily: 'Geist',
    fontSize: 9,
    fontWeight: '700',
  },
  cardMenuBtn: {
    padding: 2,
  },
  memberRole: {
    fontFamily: 'Geist',
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  deptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  deptBadgeText: {
    fontFamily: 'Geist',
    fontSize: 9,
    fontWeight: '600',
    color: '#475569',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  actionText: {
    fontFamily: 'Geist',
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontFamily: 'Geist',
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  emptySubtext: {
    fontFamily: 'Geist',
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 32,
  },
  loaderContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontFamily: 'Geist',
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeModalBtn: {
    padding: 4,
  },
  modalForm: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontFamily: 'Geist',
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
  },
  inputIcon: {
    marginRight: 8,
  },
  formInput: {
    flex: 1,
    fontFamily: 'Geist',
    fontSize: 13,
    color: '#0F172A',
    height: '100%',
    padding: 0,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  deptSelectorChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    margin: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  deptSelectorChipActive: {
    backgroundColor: '#E2E8F0',
    borderColor: '#0F172A',
  },
  deptSelectorText: {
    fontFamily: 'Geist',
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  deptSelectorTextActive: {
    color: '#0F172A',
  },
  submitButton: {
    backgroundColor: '#00112c',
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  submitButtonText: {
    fontFamily: 'Geist',
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    height: 58,
    paddingBottom: 4,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },
  tabLabel: {
    fontFamily: 'Geist',
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 4,
  },
  activeTabLabel: {
    color: '#00112c',
    fontWeight: '800',
  },
  activeIndicatorLine: {
    position: 'absolute',
    bottom: 2,
    width: 24,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#0D1E3D',
  },
  memberIdText: {
    fontFamily: 'Geist',
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  detailCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  detailIcon: {
    marginRight: 14,
  },
  detailLabel: {
    fontFamily: 'Geist',
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontFamily: 'Geist',
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  detailsStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 8,
  },
  detailsStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  detailsStatusText: {
    fontSize: 10,
    fontFamily: 'Geist',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  detailsList: {
    marginTop: 16,
  },
  detailsGroupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailsIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailsItemLabel: {
    fontSize: 10,
    fontFamily: 'Geist',
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsItemValue: {
    fontSize: 14,
    fontFamily: 'Geist',
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },

  // ─── Splash / Loading Overlay ─────────────────────────────────────
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#001538',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  splashLogoBox: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  splashTitle: {
    fontFamily: 'Geist',
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  splashSubtitle: {
    fontFamily: 'Geist',
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
  },

  // ─── Dropdown Row ─────────────────────────────────────────────────
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
  },
  dropdownValue: {
    flex: 1,
    fontFamily: 'Geist',
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },

  // ─── Picker Bottom-Sheet Modal ─────────────────────────────────────
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  pickerModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
  },
  pickerModalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginBottom: 16,
  },
  pickerModalTitle: {
    fontFamily: 'Geist',
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerOptionActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#001538',
  },
  pickerOptionText: {
    fontFamily: 'Geist',
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  pickerOptionTextActive: {
    color: '#001538',
    fontWeight: '800',
  },

  // ─── Premium Employee Details View Styles ──────────────────────────
  premiumHeaderCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    marginTop: 10,
    shadowColor: '#001538',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  premiumHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  premiumAvatarText: {
    fontFamily: 'Geist',
    fontSize: 22,
    color: '#001538',
    fontWeight: '900',
  },
  premiumHeaderMeta: {
    flex: 1,
    marginLeft: 16,
  },
  premiumName: {
    fontFamily: 'Geist',
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  premiumRole: {
    fontFamily: 'Geist',
    fontSize: 12,
    fontWeight: '600',
    color: '#93C5FD',
    marginTop: 2,
  },
  premiumIdBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginRight: 8,
  },
  premiumIdText: {
    fontFamily: 'Geist',
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionBtn: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionLabel: {
    fontFamily: 'Geist',
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    marginTop: 4,
  },
  premiumSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  premiumSectionTitle: {
    fontFamily: 'Geist',
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6,
  },
  premiumDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  premiumDetailIcon: {
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  premiumDetailLabel: {
    fontFamily: 'Geist',
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  premiumDetailValue: {
    fontFamily: 'Geist',
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2,
  },
  inlineEditBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  inlineEditBtnText: {
    fontFamily: 'Geist',
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  premiumRemoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 12,
    height: 46,
  },
  premiumRemoveBtnText: {
    fontFamily: 'Geist',
    fontSize: 13,
    fontWeight: '800',
    color: '#EF4444',
  },
  premiumCloseBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#001538',
    borderRadius: 12,
    height: 48,
  },
  premiumCloseBtnText: {
    fontFamily: 'Geist',
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ─── Professional Corporate Details View Styles ─────────────────────
  corpOverlay: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  corpHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    height: 56,
    paddingHorizontal: 16,
  },
  corpBackBtn: {
    padding: 4,
  },
  corpHeaderTitle: {
    fontFamily: 'Geist',
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  corpProfileHeader: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  corpAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  corpAvatar: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corpAvatarText: {
    fontFamily: 'Geist',
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  corpStatusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  corpMeta: {
    flex: 1,
  },
  corpName: {
    fontFamily: 'Geist',
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  corpRole: {
    fontFamily: 'Geist',
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  corpIdText: {
    fontFamily: 'Geist',
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  corpSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  corpSectionTitle: {
    fontFamily: 'Geist',
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  corpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  corpLabel: {
    fontFamily: 'Geist',
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  corpValue: {
    fontFamily: 'Geist',
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
  },
  corpEditLink: {
    paddingLeft: 8,
  },
  corpEditLinkText: {
    fontFamily: 'Geist',
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  corpDangerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    padding: 16,
    marginBottom: 16,
  },
  corpDangerTitle: {
    fontFamily: 'Geist',
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  corpDangerText: {
    fontFamily: 'Geist',
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
    marginBottom: 12,
  },
  corpDangerBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corpDangerBtnText: {
    fontFamily: 'Geist',
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  corpCloseBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  corpCloseBtnText: {
    fontFamily: 'Geist',
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

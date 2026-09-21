import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { getAuth } from '@react-native-firebase/auth';
import { BASE_URL } from '../../services/api';

interface RoleItem {
  id: string;
  name: string;
  access_level: string;
}

interface TeamMemberItem {
  id: number | string;
  name: string;
  role: string;
  email: string;
  mobile: string;
  status: string;
  member_id: string;
}

interface Department {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  head_of_department: string | null;
  status: 'Active' | 'Inactive';
  created_at: string;
  member_count?: number;
  role_count?: number;
  roles?: RoleItem[];
}

export default function DepartmentsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DrawerNavigationProp<any>>();

  const [profile, setProfile] = useState<any>(null);
  const [hasWriteAccess, setHasWriteAccess] = useState(false);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Department Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editDepartment, setEditDepartment] = useState<Department | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [hod, setHod] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [saving, setSaving] = useState(false);

  // Detail Sheet State
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [activeTab, setActiveTab] = useState<'roles' | 'members'>('roles');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [deptRoles, setDeptRoles] = useState<RoleItem[]>([]);
  const [deptMembers, setDeptMembers] = useState<TeamMemberItem[]>([]);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newRoleTier, setNewRoleTier] = useState('Operational');
  const [savingRole, setSavingRole] = useState(false);

  const fetchProfileAndRole = async () => {
    const user = getAuth().currentUser;
    if (!user) return;
    try {
      const mobile = user.phoneNumber || '';
      const email = user.email || '';
      const res = await fetch(`${BASE_URL}/api/tenant/profile/${user.uid}?mobile=${encodeURIComponent(mobile)}&email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        const isHR = 
          data.userType === 'team_member' && (
            String(data.department).toUpperCase().includes('HR') || 
            String(data.department).toUpperCase().includes('HUMAN RES') || 
            String(data.designation).toUpperCase().includes('HR') || 
            String(data.designation).toUpperCase().includes('HUMAN RES')
          );
        const isAdmin = data.userType === 'admin';
        setHasWriteAccess(isAdmin || isHR);
      }
    } catch (err) {
      console.error('[DepartmentsScreen] Profile fetch error:', err);
    }
  };

  const fetchDepartments = async () => {
    const user = getAuth().currentUser;
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/api/tenant/departments/${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      await fetchProfileAndRole();
      await fetchDepartments();
    };
    loadInitial();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfileAndRole();
    await fetchDepartments();
  };

  const openFormModal = (dept: Department | null = null) => {
    if (dept) {
      setEditDepartment(dept);
      setName(dept.name);
      setCode(dept.code || '');
      setHod(dept.head_of_department || '');
      setDescription(dept.description || '');
      setStatus(dept.status || 'Active');
    } else {
      setEditDepartment(null);
      setName('');
      setCode('');
      setHod('');
      setDescription('');
      setStatus('Active');
    }
    setIsModalOpen(true);
  };

  const handleOpenDetails = async (dept: Department) => {
    setSelectedDept(dept);
    setActiveTab('roles');
    setIsAddingRole(false);
    setNewRoleTitle('');
    setDeptRoles(dept.roles || []);
    setDeptMembers([]);
    setLoadingDetails(true);

    try {
      const user = getAuth().currentUser;
      const res = await fetch(`${BASE_URL}/api/tenant/departments/${dept.id}/details?userUid=${user?.uid}`);
      if (res.ok) {
        const data = await res.json();
        setDeptRoles(data.roles || []);
        setDeptMembers(data.members || []);
      }
    } catch (err) {
      console.error('Details fetch error:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Department Name is required.');
      return;
    }
    const user = getAuth().currentUser;
    if (!user) return;

    setSaving(true);
    try {
      const payload = {
        userUid: user.uid,
        name: name.trim(),
        code: code.trim().toUpperCase() || null,
        head_of_department: hod.trim() || null,
        description: description.trim() || null,
        status
      };

      let res;
      if (editDepartment) {
        res = await fetch(`${BASE_URL}/api/tenant/departments/${editDepartment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${BASE_URL}/api/tenant/departments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Error', data.error || 'Failed to save department.');
      } else {
        setIsModalOpen(false);
        fetchDepartments();
      }
    } catch (err: any) {
      Alert.alert('Network Error', err.message || 'Connection failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRole = async () => {
    if (!selectedDept || !newRoleTitle.trim()) {
      Alert.alert('Validation Error', 'Role title is required.');
      return;
    }
    const user = getAuth().currentUser;
    if (!user) return;

    setSavingRole(true);
    try {
      const res = await fetch(`${BASE_URL}/api/tenant/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userUid: user.uid,
          name: newRoleTitle.trim(),
          department: selectedDept.name,
          access_level: newRoleTier,
          status: 'Active'
        })
      });

      if (res.ok) {
        const created = await res.json();
        setDeptRoles(prev => [...prev, created]);
        setNewRoleTitle('');
        setIsAddingRole(false);
        fetchDepartments();
      } else {
        const err = await res.json();
        Alert.alert('Error', err.error || 'Failed to add role.');
      }
    } catch (err) {
      Alert.alert('Network Error', 'Connection failed.');
    } finally {
      setSavingRole(false);
    }
  };

  const handleDelete = (id: string, deptName: string) => {
    const user = getAuth().currentUser;
    if (!user) return;

    Alert.alert(
      'Delete Department',
      `Are you sure you want to delete "${deptName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${BASE_URL}/api/tenant/departments/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userUid: user.uid })
              });
              const data = await res.json();
              if (res.ok) {
                setDepartments(departments.filter(d => d.id !== id));
                if (selectedDept?.id === id) setSelectedDept(null);
                Alert.alert('Deleted', 'Department deleted successfully.');
              }
            } catch (err) {
              Alert.alert('Network Error', 'Connection failed.');
            }
          }
        }
      ]
    );
  };

  const getDeptIconName = (deptName: string): any => {
    const n = deptName.toLowerCase();
    if (n.includes('operat')) return 'tool';
    if (n.includes('fms') || n.includes('fleet')) return 'truck';
    if (n.includes('acc') || n.includes('finan')) return 'credit-card';
    if (n.includes('hr') || n.includes('human')) return 'user-check';
    if (n.includes('staff')) return 'users';
    return 'grid';
  };

  const filteredDepartments = departments.filter(d => {
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      (d.code && d.code.toLowerCase().includes(q)) ||
      (d.head_of_department && d.head_of_department.toLowerCase().includes(q)) ||
      (d.roles && d.roles.some(r => r.name.toLowerCase().includes(q)))
    );
  });

  const totalRoles = departments.reduce((acc, curr) => acc + (curr.roles?.length || curr.role_count || 0), 0);
  const totalStaff = departments.reduce((acc, curr) => acc + (curr.member_count || 0), 0);

  const renderDepartmentRow = ({ item }: { item: Department }) => {
    const rCount = item.roles?.length || item.role_count || 0;
    return (
      <TouchableOpacity
        style={styles.listRow}
        activeOpacity={0.7}
        onPress={() => handleOpenDetails(item)}
      >
        <View style={styles.listRowLeft}>
          <View style={styles.iconAvatar}>
            <Feather name={getDeptIconName(item.name)} size={18} color="#0F172A" />
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.rowTitle}>{item.name}</Text>
              {item.code ? (
                <View style={styles.codeTag}>
                  <Text style={styles.codeTagText}>{item.code}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{rCount} Roles</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>{item.member_count || 0} Staff</Text>
              {item.head_of_department ? (
                <>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={[styles.metaText, { color: '#334155' }]}>Head: {item.head_of_department}</Text>
                </>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.listRowRight}>
          <View style={[styles.statusDot, { backgroundColor: item.status === 'Active' ? '#10B981' : '#CBD5E1' }]} />
          <Feather name="chevron-right" size={16} color="#94A3B8" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Sleek Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={() => navigation.openDrawer()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="menu" size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Departments</Text>
          <Text style={styles.headerSub}>Organizational Structure</Text>
        </View>

        {hasWriteAccess ? (
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => openFormModal(null)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="plus" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {/* Modern High-Density KPI Bar */}
      <View style={styles.kpiBar}>
        <View style={styles.kpiItem}>
          <Text style={styles.kpiVal}>{departments.length}</Text>
          <Text style={styles.kpiLbl}>UNITS</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiItem}>
          <Text style={[styles.kpiVal, { color: '#4F46E5' }]}>{totalRoles}</Text>
          <Text style={styles.kpiLbl}>ROLES</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiItem}>
          <Text style={[styles.kpiVal, { color: '#059669' }]}>{totalStaff}</Text>
          <Text style={styles.kpiLbl}>STAFF</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <Feather name="search" size={15} color="#94A3B8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search department or designation..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x" size={15} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* List Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0F172A" />
          <Text style={styles.loadingText}>Loading directory...</Text>
        </View>
      ) : filteredDepartments.length === 0 ? (
        <View style={styles.centerContainer}>
          <Feather name="grid" size={36} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No matching departments</Text>
          <Text style={styles.emptySub}>Tap + above to create a department</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDepartments}
          keyExtractor={(item) => item.id}
          renderItem={renderDepartmentRow}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0F172A']} />
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Department Details Bottom Sheet / Modal */}
      <Modal visible={!!selectedDept} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '88%' }]}>
            {/* Sheet Header */}
            <View style={styles.sheetHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={styles.sheetIconBox}>
                  <Feather name={getDeptIconName(selectedDept?.name || '')} size={20} color="#0F172A" />
                </View>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.sheetTitle}>{selectedDept?.name}</Text>
                    {selectedDept?.code ? (
                      <View style={styles.codeTag}>
                        <Text style={styles.codeTagText}>{selectedDept.code}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.sheetSub}>
                    {selectedDept?.head_of_department ? `Head: ${selectedDept.head_of_department}` : 'Department Workspace'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                onPress={() => setSelectedDept(null)}
                style={styles.closeBtn}
              >
                <Feather name="x" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Tab Selector */}
            <View style={styles.tabSelectorRow}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'roles' && styles.tabBtnActive]}
                onPress={() => setActiveTab('roles')}
              >
                <Text style={[styles.tabText, activeTab === 'roles' && styles.tabTextActive]}>
                  Roles ({deptRoles.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'members' && styles.tabBtnActive]}
                onPress={() => setActiveTab('members')}
              >
                <Text style={[styles.tabText, activeTab === 'members' && styles.tabTextActive]}>
                  Staff ({deptMembers.length})
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
              {/* TAB 1: ROLES */}
              {activeTab === 'roles' && (
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Text style={styles.sectionHeaderTitle}>AUTHORIZED DESIGNATIONS</Text>
                    {hasWriteAccess && (
                      <TouchableOpacity 
                        onPress={() => setIsAddingRole(!isAddingRole)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                      >
                        <Feather name={isAddingRole ? 'x' : 'plus'} size={13} color="#0F172A" />
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#0F172A' }}>
                          {isAddingRole ? 'Cancel' : 'Add Role'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Inline Add Role */}
                  {isAddingRole && (
                    <View style={styles.inlineAddCard}>
                      <Text style={styles.inputMiniLabel}>ROLE TITLE *</Text>
                      <TextInput
                        style={styles.miniInput}
                        placeholder="e.g. Operations Manager"
                        placeholderTextColor="#94A3B8"
                        value={newRoleTitle}
                        onChangeText={setNewRoleTitle}
                      />
                      <TouchableOpacity 
                        style={styles.miniSaveBtn}
                        onPress={handleSaveRole}
                        disabled={savingRole}
                      >
                        {savingRole ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.miniSaveText}>Save Role</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {deptRoles.length === 0 ? (
                    <Text style={styles.emptyNote}>No preset roles defined for this department.</Text>
                  ) : (
                    deptRoles.map((r) => (
                      <View key={r.id} style={styles.sheetRowItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.sheetRowItemTitle}>{r.name}</Text>
                          <Text style={styles.sheetRowItemSub}>Authorized designation</Text>
                        </View>
                        <View style={styles.tierPill}>
                          <Text style={styles.tierPillText}>{r.access_level}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* TAB 2: MEMBERS */}
              {activeTab === 'members' && (
                <View style={{ gap: 8 }}>
                  <Text style={styles.sectionHeaderTitle}>ASSIGNED PERSONNEL</Text>
                  {loadingDetails ? (
                    <ActivityIndicator size="small" color="#0F172A" style={{ marginVertical: 12 }} />
                  ) : deptMembers.length === 0 ? (
                    <Text style={styles.emptyNote}>No staff currently assigned to this department.</Text>
                  ) : (
                    deptMembers.map((m) => (
                      <View key={m.id} style={styles.sheetRowItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.sheetRowItemTitle}>{m.name}</Text>
                          <Text style={styles.sheetRowItemSub}>{m.role || 'Member'} • {m.mobile}</Text>
                        </View>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#10B981' }}>{m.status}</Text>
                      </View>
                    ))
                  )}
                </View>
              )}
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add / Edit Department Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editDepartment ? 'Edit Department' : 'New Department'}
                </Text>
                <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                  <Feather name="x" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>DEPARTMENT NAME *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Operations, Operational Staff, Accounts, HR, FMS"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                />

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>CODE / ABBR.</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. OPS"
                      placeholderTextColor="#94A3B8"
                      value={code}
                      onChangeText={setCode}
                      autoCapitalize="characters"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>STATUS</Text>
                    <View style={styles.statusToggleRow}>
                      <TouchableOpacity 
                        style={[styles.statusToggleBtn, status === 'Active' && styles.statusToggleBtnActive]}
                        onPress={() => setStatus('Active')}
                      >
                        <Text style={[styles.statusToggleText, status === 'Active' && styles.statusToggleTextActive]}>Active</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.statusToggleBtn, status === 'Inactive' && styles.statusToggleBtnActive]}
                        onPress={() => setStatus('Inactive')}
                      >
                        <Text style={[styles.statusToggleText, status === 'Inactive' && styles.statusToggleTextActive]}>Inactive</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>HEAD OF DEPARTMENT (HOD)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Rajesh Kumar (VP Operations)"
                  placeholderTextColor="#94A3B8"
                  value={hod}
                  onChangeText={setHod}
                />

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>OPERATIONAL SCOPE</Text>
                <TextInput
                  style={[styles.textInput, { height: 75, textAlignVertical: 'top' }]}
                  placeholder="Briefly describe department responsibilities..."
                  placeholderTextColor="#94A3B8"
                  value={description}
                  onChangeText={setDescription}
                  multiline={true}
                />

                <TouchableOpacity 
                  style={styles.saveButton} 
                  onPress={handleSave} 
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {editDepartment ? 'Save Changes' : 'Create Department'}
                    </Text>
                  )}
                </TouchableOpacity>
                <View style={{ height: 24 }} />
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  menuButton: {
    padding: 6,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#0F172A',
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    height: '70%',
    alignSelf: 'center',
  },
  kpiVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  kpiLbl: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  separator: {
    height: 8,
  },
  listRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconAvatar: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  codeTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  codeTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#475569',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  metaDot: {
    fontSize: 9,
    color: '#CBD5E1',
  },
  listRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sheetIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sheetSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  tabSelectorRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 16,
  },
  tabBtn: {
    paddingBottom: 10,
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#0F172A',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  sheetBody: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  sectionHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  inlineAddCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
  },
  inputMiniLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 4,
  },
  miniInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    color: '#0F172A',
  },
  miniSaveBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 6,
    paddingVertical: 7,
    alignItems: 'center',
    marginTop: 6,
  },
  miniSaveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sheetRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sheetRowItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  sheetRowItemSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  tierPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tierPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#6D28D9',
    textTransform: 'uppercase',
  },
  emptyNote: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  statusToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 2,
  },
  statusToggleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusToggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  statusToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  statusToggleTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  saveButton: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

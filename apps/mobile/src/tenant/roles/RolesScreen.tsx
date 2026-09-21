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

interface Role {
  id: string;
  name: string;
  department: string | null;
  description: string | null;
  access_level: string;
  status: 'Active' | 'Inactive';
  permissions?: Record<string, any>;
  allowed_modules?: string[];
  landing_module?: string;
  created_at: string;
  member_count?: number;
}

interface Department {
  id: string;
  name: string;
}

export default function RolesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DrawerNavigationProp<any>>();

  // Profile data & user role
  const [profile, setProfile] = useState<any>(null);
  const [hasWriteAccess, setHasWriteAccess] = useState(false);

  // Roles Data States
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');
  const [accessLevel, setAccessLevel] = useState('Standard');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [saving, setSaving] = useState(false);

  // Permission / Access Control Modal States
  const [permissionsModalRole, setPermissionsModalRole] = useState<Role | null>(null);
  const [permAllowedModules, setPermAllowedModules] = useState<string[]>([]);
  const [permLandingModule, setPermLandingModule] = useState<string>('dashboard');
  const [permSiteEntry, setPermSiteEntry] = useState<boolean>(true);
  const [savingPerms, setSavingPerms] = useState(false);

  const MOBILE_MODULES = [
    { id: 'projects', name: 'Projects & Work Orders', icon: 'briefcase' as const },
    { id: 'worksites', name: 'Worksites & Site Entry', icon: 'map-pin' as const },
    { id: 'fms', name: 'Fleet & Heavy Machinery', icon: 'truck' as const },
    { id: 'fms_driver', name: 'Driver Transit Console', icon: 'navigation' as const },
    { id: 'fms_machinery', name: 'Machinery & Cranes', icon: 'tool' as const },
    { id: 'fuel_logs', name: 'Fuel Slips & Receipts', icon: 'droplet' as const },
    { id: 'workforce', name: 'Workforce & Attendance', icon: 'users' as const },
    { id: 'reports', name: 'DPR & Operational Reports', icon: 'file-text' as const }
  ];

  const handleOpenPermissions = (role: Role) => {
    setPermissionsModalRole(role);
    setPermAllowedModules(role.allowed_modules || []);
    setPermLandingModule(role.landing_module || 'dashboard');
    const p = role.permissions || {};
    setPermSiteEntry(p.worksites?.enter_site !== false);
  };

  const handleSavePermissions = async () => {
    const user = getAuth().currentUser;
    if (!user || !permissionsModalRole) return;
    try {
      setSavingPerms(true);
      const res = await fetch(`${BASE_URL}/api/tenant/roles/${permissionsModalRole.id}/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userUid: user.uid,
          allowed_modules: permAllowedModules,
          permissions: {
            ...(permissionsModalRole.permissions || {}),
            worksites: {
              ...(permissionsModalRole.permissions?.worksites || {}),
              enter_site: permSiteEntry
            }
          },
          landing_module: permLandingModule
        })
      });

      if (res.ok) {
        const data = await res.json();
        setRoles(prev => prev.map(r => r.id === permissionsModalRole.id ? { ...r, ...data.role } : r));
        setPermissionsModalRole(null);
        Alert.alert('Success', 'Access control and module visibility updated!');
      } else {
        const err = await res.json();
        Alert.alert('Error', err.error || 'Failed to save permissions');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Connection error');
    } finally {
      setSavingPerms(false);
    }
  };

  const toggleModule = (id: string) => {
    setPermAllowedModules(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  // 1. Fetch Profile & Check Access Role
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
      console.error('[RolesScreen] Profile fetch error:', err);
    }
  };

  // 2. Fetch Roles & Departments
  const fetchData = async () => {
    const user = getAuth().currentUser;
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const [rolesRes, deptsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/tenant/roles/${user.uid}`),
        fetch(`${BASE_URL}/api/tenant/departments/${user.uid}`)
      ]);

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(rolesData);
      }
      if (deptsRes.ok) {
        const deptsData = await deptsRes.json();
        setDepartments(deptsData);
      }
    } catch (err) {
      console.error('[RolesScreen] fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await fetchProfileAndRole();
      await fetchData();
    };
    loadInitialData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfileAndRole();
    await fetchData();
  };

  // 3. Open Form Modal
  const openFormModal = (role: Role | null = null) => {
    if (role) {
      setEditRole(role);
      setName(role.name);
      setDepartment(role.department || '');
      setDescription(role.description || '');
      setAccessLevel(role.access_level || 'Standard');
      setStatus(role.status || 'Active');
    } else {
      setEditRole(null);
      setName('');
      setDepartment(departments.length > 0 ? departments[0].name : '');
      setDescription('');
      setAccessLevel('Standard');
      setStatus('Active');
    }
    setIsModalOpen(true);
  };

  // 4. Save Role
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Role Title is required.');
      return;
    }

    const user = getAuth().currentUser;
    if (!user) return;

    setSaving(true);
    try {
      const payload = {
        userUid: user.uid,
        name: name.trim(),
        department: department.trim() || null,
        description: description.trim() || null,
        access_level: accessLevel,
        status
      };

      let res;
      if (editRole) {
        res = await fetch(`${BASE_URL}/api/tenant/roles/${editRole.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${BASE_URL}/api/tenant/roles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Error', data.error || 'Failed to save role.');
      } else {
        setIsModalOpen(false);
        fetchData();
        Alert.alert('Success', editRole ? 'Role updated successfully.' : 'Role created successfully.');
      }
    } catch (err: any) {
      Alert.alert('Network Error', err.message || 'Connection failed.');
    } finally {
      setSaving(false);
    }
  };

  // 5. Delete Role
  const handleDelete = (id: string, roleName: string) => {
    const user = getAuth().currentUser;
    if (!user) return;

    Alert.alert(
      'Delete Role',
      `Are you sure you want to delete "${roleName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${BASE_URL}/api/tenant/roles/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userUid: user.uid })
              });
              const data = await res.json();
              if (res.ok) {
                setRoles(roles.filter(r => r.id !== id));
                Alert.alert('Deleted', 'Role deleted successfully.');
              } else {
                Alert.alert('Error', data.error || 'Failed to delete role.');
              }
            } catch (err) {
              Alert.alert('Network Error', 'Connection failed.');
            }
          }
        }
      ]
    );
  };

  const filteredRoles = roles.filter(role => {
    const query = searchQuery.toLowerCase();
    return (
      role.name.toLowerCase().includes(query) ||
      (role.department && role.department.toLowerCase().includes(query)) ||
      (role.description && role.description.toLowerCase().includes(query))
    );
  });

  const totalMembers = roles.reduce((acc, curr) => acc + (curr.member_count || 0), 0);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Executive': return { bg: '#F3E8FF', text: '#7E22CE' };
      case 'Managerial': return { bg: '#DBEAFE', text: '#1D4ED8' };
      case 'Financial': return { bg: '#FEF3C7', text: '#B45309' };
      case 'Technical': return { bg: '#CFFAFE', text: '#0E7490' };
      case 'Specialist': return { bg: '#E0E7FF', text: '#4338CA' };
      case 'Operational': return { bg: '#DCFCE7', text: '#15803D' };
      default: return { bg: '#F1F5F9', text: '#475569' };
    }
  };

  const renderRoleCard = ({ item }: { item: Role }) => {
    const tier = getTierColor(item.access_level);
    const allowed = item.allowed_modules || [];
    const isSiteEntry = item.permissions?.worksites?.enter_site !== false;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIconContainer}>
            <Feather name="award" size={18} color="#1E3A5F" />
          </View>
          <View style={styles.cardTitleBlock}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
            {item.department ? (
              <View style={styles.deptRow}>
                <Feather name="grid" size={11} color="#64748B" />
                <Text style={styles.deptText} numberOfLines={1}>{item.department}</Text>
              </View>
            ) : null}
          </View>

          <View style={[styles.tierBadge, { backgroundColor: tier.bg }]}>
            <Text style={[styles.tierText, { color: tier.text }]}>{item.access_level}</Text>
          </View>
        </View>

        {item.description ? (
          <Text style={styles.descriptionText} numberOfLines={2}>{item.description}</Text>
        ) : null}

        {/* Access Badges Strip */}
        <View style={styles.accessStrip}>
          <View style={[styles.gatePill, { backgroundColor: isSiteEntry ? '#DCFCE7' : '#FEE2E2' }]}>
            <Feather name="map-pin" size={10} color={isSiteEntry ? '#15803D' : '#B91C1C'} />
            <Text style={[styles.gatePillText, { color: isSiteEntry ? '#15803D' : '#B91C1C' }]}>
              {isSiteEntry ? 'Gate Pass: Active' : 'No Site Access'}
            </Text>
          </View>

          {item.landing_module ? (
            <View style={styles.landingPill}>
              <Text style={styles.landingPillText}>Landing: {item.landing_module}</Text>
            </View>
          ) : null}
        </View>

        {/* Module Tags */}
        {allowed.length > 0 && (
          <View style={styles.modTagsRow}>
            {allowed.slice(0, 3).map((mId) => (
              <View key={mId} style={styles.modTag}>
                <Text style={styles.modTagText}>{mId}</Text>
              </View>
            ))}
            {allowed.length > 3 && (
              <View style={styles.modTagMore}>
                <Text style={styles.modTagMoreText}>+{allowed.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.memberTag}>
            <Feather name="users" size={13} color="#10B981" />
            <Text style={styles.memberCountText}>{item.member_count || 0} Staff</Text>
          </View>

          {hasWriteAccess && (
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity 
                style={styles.permButton} 
                onPress={() => handleOpenPermissions(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="shield" size={12} color="#FFFFFF" />
                <Text style={styles.permButtonText}>Access</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.editButton} 
                onPress={() => openFormModal(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="edit-2" size={14} color="#1E3A5F" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={() => handleDelete(item.id, item.name)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="trash-2" size={14} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const accessLevels = ['Executive', 'Managerial', 'Technical', 'Specialist', 'Financial', 'Operational', 'Standard'];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={() => navigation.openDrawer()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="menu" size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Roles & Titles</Text>
          <Text style={styles.headerSub}>Designations & Access Tiers</Text>
        </View>

        {hasWriteAccess ? (
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => openFormModal(null)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="plus" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{roles.length}</Text>
          <Text style={styles.statLabel}>Total Roles</Text>
        </View>
        <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#E2E8F0' }]}>
          <Text style={[styles.statNumber, { color: '#6366F1' }]}>{totalMembers}</Text>
          <Text style={styles.statLabel}>Assigned Staff</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#10B981' }]}>{departments.length}</Text>
          <Text style={styles.statLabel}>Departments</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <Feather name="search" size={16} color="#94A3B8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search role title, department, or duties..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x" size={16} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* List Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1E3A5F" />
          <Text style={styles.loadingText}>Loading roles & designations...</Text>
        </View>
      ) : filteredRoles.length === 0 ? (
        <View style={styles.centerContainer}>
          <Feather name="award" size={40} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No roles found</Text>
          <Text style={styles.emptySub}>
            {searchQuery ? 'Try matching another keyword' : 'Tap + to add your first organizational role'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRoles}
          keyExtractor={(item) => item.id}
          renderItem={renderRoleCard}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E3A5F']} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add / Edit Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editRole ? 'Edit Role / Title' : 'New Designation'}
                </Text>
                <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                  <Feather name="x" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>ROLE TITLE / DESIGNATION *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Site Supervisor, Mining Engineer"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                />

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>ASSIGNED DEPARTMENT</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Operations & Fleet, Mining, HSE"
                  placeholderTextColor="#94A3B8"
                  value={department}
                  onChangeText={setDepartment}
                />

                {departments.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {departments.map((d) => (
                        <TouchableOpacity
                          key={d.id}
                          onPress={() => setDepartment(d.name)}
                          style={[
                            styles.chipBtn,
                            department === d.name && styles.chipBtnActive
                          ]}
                        >
                          <Text style={[styles.chipText, department === d.name && styles.chipTextActive]}>
                            {d.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                )}

                {/* Standard Role Suggestions based on department */}
                {department === 'Operational Staff' && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#10B981', marginBottom: 4 }}>
                      STANDARD OPERATIONAL STAFF ROLES
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {['Operations Manager', 'Operations Supervisor', 'Site Incharge'].map((rTitle) => (
                          <TouchableOpacity
                            key={rTitle}
                            onPress={() => {
                              setName(rTitle);
                              if (rTitle === 'Operations Manager') setAccessLevel('Executive');
                              else if (rTitle === 'Site Incharge') setAccessLevel('Managerial');
                              else setAccessLevel('Operational');
                            }}
                            style={[
                              styles.chipBtn,
                              name === rTitle && styles.chipBtnActive
                            ]}
                          >
                            <Text style={[styles.chipText, name === rTitle && styles.chipTextActive]}>
                              {rTitle}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}

                {department === 'FMS' && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#10B981', marginBottom: 4 }}>
                      STANDARD FMS ROLES
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {['Driver', 'Site Supervisor', 'Dozer Operator', 'Crane Operator'].map((rTitle) => (
                          <TouchableOpacity
                            key={rTitle}
                            onPress={() => {
                              setName(rTitle);
                              setAccessLevel('Operational');
                            }}
                            style={[
                              styles.chipBtn,
                              name === rTitle && styles.chipBtnActive
                            ]}
                          >
                            <Text style={[styles.chipText, name === rTitle && styles.chipTextActive]}>
                              {rTitle}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>ROLE LEVEL</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {accessLevels.map((lvl) => (
                      <TouchableOpacity
                        key={lvl}
                        onPress={() => setAccessLevel(lvl)}
                        style={[
                          styles.chipBtn,
                          accessLevel === lvl && styles.chipBtnActive
                        ]}
                      >
                        <Text style={[styles.chipText, accessLevel === lvl && styles.chipTextActive]}>
                          {lvl}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>STATUS</Text>
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



                <TouchableOpacity 
                  style={styles.saveButton} 
                  onPress={handleSave} 
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {editRole ? 'Save Changes' : 'Create Role'}
                    </Text>
                  )}
                </TouchableOpacity>
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Access Control & Permissions Modal */}
      <Modal visible={!!permissionsModalRole} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Access & Gates Control</Text>
                <Text style={styles.modalSubTitle}>{permissionsModalRole?.name} ({permissionsModalRole?.department || 'General'})</Text>
              </View>
              <TouchableOpacity onPress={() => setPermissionsModalRole(null)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Site Gate Pass Policy */}
              <Text style={styles.inputLabel}>PHYSICAL WORKSITE GATE PASS</Text>
              <TouchableOpacity 
                style={[styles.toggleCard, permSiteEntry ? styles.toggleCardActive : styles.toggleCardInactive]}
                onPress={() => setPermSiteEntry(!permSiteEntry)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleCardTitle}>
                    {permSiteEntry ? '✅ Authorized Site Gate Pass' : '❌ Gate Pass Blocked'}
                  </Text>
                  <Text style={styles.toggleCardSub}>
                    {permSiteEntry ? 'Staff holding this title can pass physical security gates' : 'Staff cannot check-in at site gates'}
                  </Text>
                </View>
                <Feather name={permSiteEntry ? 'check-circle' : 'circle'} size={20} color={permSiteEntry ? '#10B981' : '#94A3B8'} />
              </TouchableOpacity>

              {/* Login Landing Module */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>DEFAULT LOGIN DESTINATION</Text>
              <View style={styles.landingRow}>
                {[
                  { id: 'dashboard', label: 'Dashboard' },
                  { id: 'projects', label: 'Projects' },
                  { id: 'worksites', label: 'Worksites' },
                  { id: 'fms_driver', label: 'Driver Trips' },
                  { id: 'fms_machinery', label: 'Machinery' }
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.chipBtn, permLandingModule === opt.id && styles.chipBtnActive]}
                    onPress={() => setPermLandingModule(opt.id)}
                  >
                    <Text style={[styles.chipText, permLandingModule === opt.id && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Module Visibility Switches */}
              <Text style={[styles.inputLabel, { marginTop: 16 }]}>ALLOWED MODULES VISIBLE ON LOGIN</Text>
              <View style={{ gap: 8, marginTop: 4 }}>
                {MOBILE_MODULES.map((mod) => {
                  const active = permAllowedModules.includes(mod.id);
                  return (
                    <TouchableOpacity
                      key={mod.id}
                      style={[styles.modSwitchRow, active && styles.modSwitchRowActive]}
                      onPress={() => toggleModule(mod.id)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Feather name={mod.icon} size={16} color={active ? '#0F172A' : '#94A3B8'} />
                        <Text style={[styles.modSwitchText, active && styles.modSwitchTextActive]}>
                          {mod.name}
                        </Text>
                      </View>
                      <Feather 
                        name={active ? 'check-square' : 'square'} 
                        size={18} 
                        color={active ? '#10B981' : '#CBD5E1'} 
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity 
                style={[styles.saveButton, { marginTop: 20 }]} 
                onPress={handleSavePermissions} 
                disabled={savingPerms}
              >
                {savingPerms ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Access Policy</Text>
                )}
              </TouchableOpacity>
              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
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
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#1E3A5F',
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardTitleBlock: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  deptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  deptText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  tierBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  descriptionText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    lineHeight: 17,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  memberTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  memberCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  deleteButton: {
    padding: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
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
  chipBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipBtnActive: {
    backgroundColor: '#1E3A5F',
    borderColor: '#1E3A5F',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
    color: '#1E3A5F',
    fontWeight: '800',
  },
  saveButton: {
    backgroundColor: '#1E3A5F',
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
  accessStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  gatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gatePillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  landingPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  landingPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  modTagsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  modTag: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  modTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#334155',
  },
  modTagMore: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  modTagMoreText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  permButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  permButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalSubTitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  toggleCardActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  toggleCardInactive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  toggleCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  toggleCardSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  landingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  modSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 11,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modSwitchRowActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
  },
  modSwitchText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  modSwitchTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
});

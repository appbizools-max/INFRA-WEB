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

interface Division {
  id: string;
  name: string;
  state: string;
  city: string;
  pincodes: string;
  description: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  member_count?: number;
}

export default function DivisionsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DrawerNavigationProp<any>>();

  // Profile data & user role
  const [profile, setProfile] = useState<any>(null);
  const [hasWriteAccess, setHasWriteAccess] = useState(false);

  // Divisions Data States
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editDivision, setEditDivision] = useState<Division | null>(null);
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [pincodes, setPincodes] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Detail Modal State
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null);
  const [divisionTeam, setDivisionTeam] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

  const handleOpenDetails = (div: Division) => {
    setSelectedDivision(div);
    setLoadingTeam(true);
    fetch(`${BASE_URL}/api/tenant/divisions/${div.id}/team`)
      .then(res => res.json())
      .then(data => {
        setDivisionTeam(data);
        setLoadingTeam(false);
      })
      .catch(err => {
        console.error('Error fetching division team on mobile:', err);
        setLoadingTeam(false);
      });
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
      console.error('[DivisionsScreen] Profile fetch error:', err);
    }
  };

  // 2. Fetch Divisions
  const fetchDivisions = async () => {
    const user = getAuth().currentUser;
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/api/tenant/divisions/${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        setDivisions(data);
      } else {
        console.error('Failed to fetch divisions');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await fetchProfileAndRole();
      await fetchDivisions();
    };
    loadInitialData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfileAndRole();
    await fetchDivisions();
  };

  // Pincode Lookup Handler
  const handlePincodeChange = (val: string) => {
    setPincodes(val);
    const match = val.match(/\b\d{6}\b/);
    if (match) {
      const pin = match[0];
      setDetectingLocation(true);
      fetch(`https://api.postalpincode.in/pincode/${pin}`)
        .then(res => res.json())
        .then(data => {
          setDetectingLocation(false);
          if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice[0]) {
            const po = data[0].PostOffice[0];
            if (po.State) setState(po.State);
            if (po.District) setCity(po.District);
          }
        })
        .catch(err => {
          console.error('[DivisionsScreen] Pincode lookup error:', err);
          setDetectingLocation(false);
        });
    }
  };

  // 3. Open Form Modal
  const openFormModal = (div: Division | null = null) => {
    if (div) {
      setEditDivision(div);
      setName(div.name);
      setState(div.state);
      setCity(div.city);
      setPincodes(div.pincodes);
      setDescription(div.description);
    } else {
      setEditDivision(null);
      setName('');
      setState('');
      setCity('');
      setPincodes('');
      setDescription('');
    }
    setIsModalOpen(true);
  };

  // 4. Save (Insert / Update) Division
  const handleSave = async () => {
    if (!name.trim() || !state.trim() || !city.trim()) {
      Alert.alert('Validation Error', 'Division Name, State, and City are required fields.');
      return;
    }

    const user = getAuth().currentUser;
    if (!user) return;

    setSaving(true);
    const body = {
      userUid: user.uid,
      name: name.trim(),
      state: state.trim(),
      city: city.trim(),
      pincodes: pincodes.trim(),
      description: description.trim(),
      status: 'Active'
    };

    const url = editDivision 
      ? `${BASE_URL}/api/tenant/divisions/${editDivision.id}` 
      : `${BASE_URL}/api/tenant/divisions`;
    const method = editDivision ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        Alert.alert('Success', `Division ${editDivision ? 'updated' : 'created'} successfully.`);
        fetchDivisions();
        setIsModalOpen(false);
      } else {
        Alert.alert('Error', data.error || 'Failed to save division.');
      }
    } catch (err) {
      Alert.alert('Network Error', 'Connection failed.');
    } finally {
      setSaving(false);
    }
  };

  // 5. Delete Division
  const handleDelete = (id: string) => {
    const user = getAuth().currentUser;
    if (!user) return;

    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this division?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${BASE_URL}/api/tenant/divisions/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userUid: user.uid })
              });
              const data = await res.json();
              if (res.ok) {
                setDivisions(divisions.filter(d => d.id !== id));
                Alert.alert('Deleted', 'Division deleted successfully.');
              } else {
                Alert.alert('Error', data.error || 'Failed to delete division.');
              }
            } catch (err) {
              Alert.alert('Network Error', 'Connection failed.');
            }
          }
        }
      ]
    );
  };

  // Filter & Search logic
  const filteredDivisions = divisions.filter(div => {
    const query = searchQuery.toLowerCase();
    return (
      div.name.toLowerCase().includes(query) ||
      div.state.toLowerCase().includes(query) ||
      div.city.toLowerCase().includes(query) ||
      div.pincodes.toLowerCase().includes(query)
    );
  });

  const totalDivisions = divisions.length;
  const uniqueCities = new Set(divisions.map(d => d.city.trim().toLowerCase())).size;
  const uniqueStates = new Set(divisions.map(d => d.state.trim().toLowerCase())).size;

  const renderDivisionCard = ({ item }: { item: Division }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleOpenDetails(item)}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          {/* Logo badge */}
          <View style={styles.cardIconContainer}>
            <Feather name="home" size={18} color="#2563EB" />
          </View>
          
          <View style={styles.cardTitleBlock}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
            <View style={styles.locationBadgeRow}>
              <Feather name="map-pin" size={11} color="#64748B" />
              <Text style={styles.locationBadgeText} numberOfLines={1}>
                {item.city}, {item.state}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Structured Card Middle Section */}
      <View style={styles.cardBody}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          {item.pincodes ? (
            <View style={[styles.pincodeRow, { marginBottom: 0 }]}>
              <View style={styles.pinTag}>
                <Text style={styles.pinTagText}>{item.pincodes.split(',')[0].trim()}</Text>
              </View>
              {item.pincodes.split(',').length > 1 ? (
                <Text style={styles.pincodesCountText}>
                  +{item.pincodes.split(',').length - 1} more
                </Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.noPincodesText}>No pincodes registered</Text>
          )}

          <View style={[styles.pinTag, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center' }]}>
            <Feather name="users" size={10} color="#64748B" style={{ marginRight: 4 }} />
            <Text style={[styles.pinTagText, { color: '#64748B' }]}>{item.member_count || 0} Staff</Text>
          </View>
        </View>
        
        {item.description ? (
          <Text style={styles.descriptionText} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>

      {/* Structured Card Bottom Section */}
      <View style={styles.cardFooter}>
        <Text style={styles.addedDateText}>
          Added: {new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </Text>

        {hasWriteAccess ? (
          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={() => openFormModal(item)} style={styles.actionButton}>
              <Feather name="edit-2" size={12} color="#475569" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.actionButton, { marginLeft: 8, borderColor: '#FCA5A5' }]}>
              <Feather name="trash-2" size={12} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
          <Feather name="menu" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Divisions Directory</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Structured Summary Header (Collapsible layout replacement) */}
      <View style={styles.statsSummaryContainer}>
        <View style={styles.statColumn}>
          <View style={[styles.statIconWrapper, { backgroundColor: '#EFF6FF' }]}>
            <Feather name="grid" size={14} color="#2563EB" />
          </View>
          <Text style={styles.statLabel}>Divisions</Text>
          <Text style={styles.statValue}>{totalDivisions}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statColumn}>
          <View style={[styles.statIconWrapper, { backgroundColor: '#ECFDF5' }]}>
            <Feather name="map-pin" size={14} color="#059669" />
          </View>
          <Text style={styles.statLabel}>Cities</Text>
          <Text style={styles.statValue}>{uniqueCities}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statColumn}>
          <View style={[styles.statIconWrapper, { backgroundColor: '#FFF7ED' }]}>
            <Feather name="map" size={14} color="#EA580C" />
          </View>
          <Text style={styles.statLabel}>States</Text>
          <Text style={styles.statValue}>{uniqueStates}</Text>
        </View>
      </View>

      {/* Structured Search Section */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBarContainer}>
          <Feather name="search" size={18} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, state, city..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94A3B8"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* List count row */}
      <View style={styles.listHeaderRow}>
        <Text style={styles.listHeaderTitle}>Active Boundaries</Text>
        <View style={styles.listCountPill}>
          <Text style={styles.listCountPillText}>{filteredDivisions.length}</Text>
        </View>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={filteredDivisions}
          renderItem={renderDivisionCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Feather name="map" size={28} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No Divisions Configured</Text>
              <Text style={styles.emptySubtitle}>
                Operational classifications will appear here once added.
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button in Blue */}
      {hasWriteAccess ? (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 20 }]}
          onPress={() => openFormModal()}
        >
          <Feather name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      ) : null}

      {/* CREATE/EDIT MODAL */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent={Platform.OS === 'ios'}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ flex: 1, justifyContent: 'flex-end', width: '100%' }}
            >
              <View style={[styles.modalContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                {/* Grab handle bar */}
                <View style={styles.grabBar} />

                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>{editDivision ? 'Modify Division Settings' : 'Create New Division'}</Text>
                    <Text style={styles.modalSubTitle}>Fill details to register operational boundary</Text>
                  </View>
                  <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.closeBtn}>
                    <Feather name="x" size={18} color="#0F172A" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                  {/* Name */}
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Division Name *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. Telangana Division"
                      value={name}
                      onChangeText={setName}
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  {/* Pincodes (Position 2) */}
                  <View style={styles.formGroup}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={[styles.formLabel, { marginBottom: 0 }]}>Pincode(s) (comma-separated)</Text>
                      {detectingLocation && (
                        <Text style={styles.detectingLabel}>Detecting location...</Text>
                      )}
                    </View>
                    <TextInput
                      style={[styles.formInput, { backgroundColor: '#EFF6FF30', borderColor: '#BFDBFE' }]}
                      placeholder="e.g. 500001, 500002"
                      value={pincodes}
                      onChangeText={handlePincodeChange}
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  {/* State */}
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>State *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. Telangana"
                      value={state}
                      onChangeText={setState}
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  {/* City */}
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>City / District *</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="e.g. Hyderabad"
                      value={city}
                      onChangeText={setCity}
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  {/* Description */}
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Description</Text>
                    <TextInput
                      style={[styles.formInput, { height: 75, textAlignVertical: 'top', paddingTop: 8 }]}
                      placeholder="Operational bounds description..."
                      value={description}
                      onChangeText={setDescription}
                      multiline={true}
                      numberOfLines={3}
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  {/* Footer Buttons */}
                  <View style={styles.formFooter}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalOpen(false)}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#2563EB' }]} onPress={handleSave} disabled={saving}>
                      {saving ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.submitBtnText}>Save</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* DETAIL MODAL */}
      <Modal
        visible={!!selectedDivision}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedDivision(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailContainer}>
            <View style={styles.grabBar} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Division Details</Text>
              <TouchableOpacity onPress={() => setSelectedDivision(null)} style={styles.closeBtn}>
                <Feather name="x" size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {selectedDivision ? (
              <ScrollView style={{ paddingHorizontal: 24, paddingTop: 16 }} contentContainerStyle={{ paddingBottom: 50 }}>
                <Text style={styles.detailName}>{selectedDivision.name}</Text>
                
                <View style={styles.detailBadge}>
                  <Text style={styles.detailBadgeText}>Geographic Classification</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>State & City</Text>
                  <Text style={styles.detailValue}>{selectedDivision.city}, {selectedDivision.state}</Text>
                </View>

                {selectedDivision.pincodes ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Pincodes Covered</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                      {selectedDivision.pincodes.split(',').map((p, index) => (
                        <View key={index} style={[styles.pinTag, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }]}>
                          <Text style={[styles.pinTagText, { color: '#2563EB' }]}>{p.trim()}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {selectedDivision.description ? (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={[styles.detailValue, { fontWeight: '400', color: '#64748B' }]}>{selectedDivision.description}</Text>
                  </View>
                ) : null}

                <View style={[styles.detailSection, { borderBottomWidth: 0 }]}>
                  <Text style={styles.detailLabel}>Created Date</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedDivision.created_at).toLocaleString()}
                  </Text>
                </View>

                {/* Assigned Workforce */}
                <View style={[styles.detailSection, { borderBottomWidth: 0, paddingTop: 6 }]}>
                  <Text style={styles.detailLabel}>Assigned Workforce ({loadingTeam ? '...' : divisionTeam.length})</Text>
                  
                  {loadingTeam ? (
                    <ActivityIndicator size="small" color="#2563EB" style={{ marginTop: 10, alignSelf: 'flex-start' }} />
                  ) : divisionTeam.length > 0 ? (
                    <View style={{ gap: 8, marginTop: 8 }}>
                      {divisionTeam.map(member => {
                        const nameParts = member.name.trim().split(' ');
                        const initials = nameParts.map((p: string) => p[0]).join('').toUpperCase().substring(0, 2);
                        return (
                          <View key={member.id} style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', padding: 12, borderRadius: 14, gap: 8 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                                <Text style={{ fontSize: 11, fontWeight: '800', color: '#2563EB' }}>{initials || 'U'}</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 13, fontWeight: '800', color: '#1E293B' }}>{member.name}</Text>
                                <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B' }}>{member.role}</Text>
                              </View>
                            </View>

                            <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 2 }} />

                            <View style={{ gap: 4 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Feather name="briefcase" size={12} color="#94A3B8" />
                                <Text style={{ fontSize: 11, color: '#475569', fontWeight: '500' }}>{member.department}</Text>
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Feather name="mail" size={12} color="#94A3B8" />
                                <Text style={{ fontSize: 11, color: '#475569', fontWeight: '500' }}>{member.email}</Text>
                              </View>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Feather name="phone" size={12} color="#94A3B8" />
                                <Text style={{ fontSize: 11, color: '#475569', fontWeight: '500' }}>{member.mobile}</Text>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 18, backgroundColor: '#F8FAFC', borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, marginTop: 8 }}>
                      <Feather name="users" size={18} color="#94A3B8" />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginTop: 4 }}>No staff assigned</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity 
                  style={[styles.cancelBtn, { width: '100%', marginTop: 24, height: 48 }]} 
                  onPress={() => setSelectedDivision(null)}
                >
                  <Text style={styles.cancelBtnText}>Close View</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  menuButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  statsSummaryContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 0,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  statColumn: {
    alignItems: 'center',
    flex: 1,
  },
  statIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
  },
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
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
    padding: 0,
    fontWeight: '600',
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  listHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listCountPill: {
    marginLeft: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
  },
  listCountPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIconContainer: {
    backgroundColor: '#EFF6FF',
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  cardTitleBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    lineHeight: 18,
  },
  locationBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 4,
  },
  cardBody: {
    marginTop: 12,
    marginBottom: 12,
  },
  pincodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  pincodesCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginLeft: 8,
  },
  descriptionText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  pinTag: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pinTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
  },
  noPincodesText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  addedDateText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fab: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#2563EB',
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  grabBar: {
    width: 36,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
  detailContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubTitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 1,
  },
  closeBtn: {
    padding: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  modalForm: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  formGroup: {
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  detectingLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
  },
  formFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    marginBottom: 15,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  submitBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  detailBadge: {
    backgroundColor: '#EFF6FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  detailBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563EB',
    textTransform: 'uppercase',
  },
  detailSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { getAuth } from '@react-native-firebase/auth';
import { BASE_URL } from '../../services/api';

interface WorkSite {
  id: string;
  worksiteId: string;
  name: string;
  location: string;
  type: string;
  supervisor: string;
  contact: string;
  workersCount: number;
  geofenceStatus: 'Enabled' | 'Disabled';
  operationalStatus: 'Active' | 'Suspended' | 'Under Maintenance';
  safetyRating: string;
  customFields?: Record<string, any>;
}

const PRESET_TYPES = ['Port', 'Stockyard', 'Warehouse', 'Railway Siding', 'Factory', 'Mine', 'Add New'];

export default function WorkSitesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DrawerNavigationProp<any>>();

  const [sites, setSites] = useState<WorkSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'oldest'>('latest');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('Port');
  const [customType, setCustomType] = useState('');
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [supervisor, setSupervisor] = useState('');
  const [contact, setContact] = useState('');

  // Dynamic Fields Config States
  const [formConfig, setFormConfig] = useState<any[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  const isFieldVisible = (key: string) => {
    const cfg = formConfig.find(f => f.fieldKey === key);
    return cfg ? !cfg.isHidden : true;
  };

  const isFieldRequired = (key: string) => {
    const cfg = formConfig.find(f => f.fieldKey === key);
    return cfg ? cfg.isRequired : false;
  };

  const fetchWorksites = async () => {
    const user = getAuth().currentUser;
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/api/tenant/worksites/${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        setSites(data);
      } else {
        console.error('Failed to fetch worksites');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchFormConfig = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/form-config/worksite`);
      if (res.ok) {
        const data = await res.json();
        setFormConfig(data);
      }
    } catch (err) {
      console.error('Error fetching form config:', err);
    }
  };

  useEffect(() => {
    fetchWorksites();
    fetchFormConfig();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWorksites();
    await fetchFormConfig();
    setRefreshing(false);
  };

  const handleSave = async () => {
    Keyboard.dismiss();
    const user = getAuth().currentUser;
    if (!user) return;

    // Validate Default Fields dynamically
    const fieldsToValidate = [
      { key: 'name', val: name, label: 'Site Name' },
      { key: 'location', val: location, label: 'Site Location' },
      { key: 'type', val: type === 'Add New' ? customType : type, label: 'Site Type' },
      { key: 'supervisor', val: supervisor, label: 'Supervisor Name' },
      { key: 'contact', val: contact, label: 'Contact Number' },
    ];
    for (const f of fieldsToValidate) {
      if (isFieldVisible(f.key) && isFieldRequired(f.key) && !String(f.val || '').trim()) {
        Alert.alert('Validation Error', `${f.label} is required.`);
        return;
      }
    }

    // Validate Custom Fields
    const customFields = formConfig.filter(f => !f.isDefault && !f.isHidden);
    const resolvedCustomFields: Record<string, string> = {};
    for (const cf of customFields) {
      const val = customFieldValues[cf.fieldKey];
      if (cf.isRequired && (!val || !val.trim())) {
        Alert.alert('Validation Error', `${cf.fieldLabel} is required.`);
        return;
      }
      if (val) {
        resolvedCustomFields[cf.fieldLabel] = val;
      }
    }

    const finalType = type === 'Add New' ? customType : type;

    try {
      const res = await fetch(`${BASE_URL}/api/tenant/worksites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: user.uid,
          name: isFieldVisible('name') ? name : '',
          location: isFieldVisible('location') ? location : '',
          type: isFieldVisible('type') ? finalType : '',
          supervisor: isFieldVisible('supervisor') ? supervisor : '',
          contact: isFieldVisible('contact') ? contact : '',
          customFields: resolvedCustomFields
        })
      });
      if (res.ok) {
        Alert.alert('Success', 'Work Site created successfully!');
        setIsModalOpen(false);
        // Reset Form
        setName('');
        setLocation('');
        setType('Port');
        setCustomType('');
        setSupervisor('');
        setContact('');
        setCustomFieldValues({});
        fetchWorksites();
      } else {
        Alert.alert('Error', 'Failed to create work site.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'An error occurred while creating work site.');
    }
  };

  const confirmDeleteSite = (id: string) => {
    setOpenMenuId(null);
    Alert.alert('Delete Work Site', 'Are you sure you want to delete this work site?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${BASE_URL}/api/tenant/worksites/${id}`, { method: 'DELETE' });
            if (res.ok) {
              Alert.alert('Success', 'Work Site deleted successfully!');
              fetchWorksites();
            } else {
              Alert.alert('Error', 'Failed to delete work site.');
            }
          } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Error deleting work site.');
          }
        }
      }
    ]);
  };

  const toggleGeofence = async (id: string, currentStatus: string) => {
    setOpenMenuId(null);
    const nextStatus = currentStatus === 'Enabled' ? 'Disabled' : 'Enabled';
    try {
      const res = await fetch(`${BASE_URL}/api/tenant/worksites/${id}/geofence`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geofenceStatus: nextStatus })
      });
      if (res.ok) {
        Alert.alert('Success', `Geofence ${nextStatus === 'Enabled' ? 'Enabled' : 'Disabled'}!`);
        fetchWorksites();
      } else {
        Alert.alert('Error', 'Failed to update geofence status.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Error updating geofence.');
    }
  };

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const getStatusColor = (status: WorkSite['operationalStatus']) => {
    switch (status) {
      case 'Active': return '#10B981';
      case 'Suspended': return '#EF4444';
      case 'Under Maintenance': return '#F59E0B';
      default: return '#64748B';
    }
  };

  const filteredSites = sites
    .filter(site => {
      const matchesSearch = site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.supervisor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (site.customFields && JSON.stringify(site.customFields).toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'All' || site.operationalStatus === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'latest') {
        return b.worksiteId.localeCompare(a.worksiteId);
      } else {
        return a.worksiteId.localeCompare(b.worksiteId);
      }
    });

  const renderSiteItem = ({ item }: { item: WorkSite }) => (
    <View style={[styles.card, { zIndex: openMenuId === item.worksiteId ? 10 : 1 }]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {item.type && (
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{item.type}</Text>
              </View>
            )}
          </View>
          <Text style={styles.siteName}>{item.name}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', zIndex: 10 }}>
          <View style={[styles.statusBadge, { borderColor: getStatusColor(item.operationalStatus) }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.operationalStatus) }]}>{item.operationalStatus}</Text>
          </View>
          <View style={{ position: 'relative' }}>
            <TouchableOpacity onPress={() => toggleMenu(item.worksiteId)} style={{ marginLeft: 8, padding: 4 }}>
              <Feather name="more-vertical" size={20} color="#64748B" />
            </TouchableOpacity>

            {openMenuId === item.worksiteId && (
              <View style={styles.dropdownMenuBox}>
                <TouchableOpacity style={styles.dropdownMenuItem} onPress={() => toggleGeofence(item.worksiteId, item.geofenceStatus)}>
                  <Feather name="shield" size={14} color="#0284C7" />
                  <Text style={styles.dropdownMenuItemText}>{item.geofenceStatus === 'Enabled' ? 'Disable Geofence' : 'Enable Geofence'}</Text>
                </TouchableOpacity>
                <View style={styles.dropdownMenuDivider} />
                <TouchableOpacity style={styles.dropdownMenuItem} onPress={() => confirmDeleteSite(item.worksiteId)}>
                  <Feather name="trash-2" size={14} color="#DC2626" />
                  <Text style={[styles.dropdownMenuItemText, { color: '#DC2626' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.detailRow}>
          <Feather name="map-pin" size={14} color="#64748B" />
          <Text style={styles.detailText} numberOfLines={1}>{item.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <Feather name="user" size={14} color="#64748B" />
          <Text style={styles.detailText} numberOfLines={1}>Supervisor: {item.supervisor}</Text>
        </View>
        <View style={styles.detailRow}>
          <Feather name="phone" size={14} color="#64748B" />
          <Text style={styles.detailText} numberOfLines={1}>Contact: {item.contact}</Text>
        </View>
        <View style={styles.detailRow}>
          <Feather name="users" size={14} color="#64748B" />
          <Text style={styles.detailText} numberOfLines={1}>{item.workersCount || 0} Members</Text>
        </View>
      </View>

      {item.customFields && Object.keys(item.customFields).length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, paddingHorizontal: 12 }}>
          {Object.entries(item.customFields).map(([k, v]: [string, any]) => (
            <View key={k} style={{ backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 4, paddingVertical: 2, paddingHorizontal: 6, marginRight: 6, marginBottom: 6 }}>
              <Text style={{ fontSize: 10, color: '#475569', fontWeight: '600' }}>{k}: {v}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.cardFooter}>
        <View style={styles.footerLabels}>
          <View>
            <Text style={styles.footerLabel}>Geofence Status</Text>
            <Text style={[styles.footerValue, { color: item.geofenceStatus === 'Enabled' ? '#10B981' : '#64748B' }]}>
              {item.geofenceStatus}
            </Text>
          </View>
          <TouchableOpacity style={styles.footerButton} onPress={() => Alert.alert('Map boundaries', `Showing boundaries for ${item.name}`)}>
            <Text style={styles.footerButtonText}>View Boundaries</Text>
            <Feather name="arrow-right" size={14} color="#1E3A8A" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrapper}>
        <Feather name="layers" size={32} color="#94A3B8" />
      </View>
      <Text style={styles.emptyTitle}>No Work Sites Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'No match found for your search query.' : 'Get started by creating your first construction worksite.'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? insets.top : 0 }]}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 10 : 16 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={styles.menuButton}>
            <Feather name="menu" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.title}>Work Sites</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setIsModalOpen(true)}>
          <Feather name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBarWrapper}>
          <Feather name="search" size={16} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search name, location, supervisor, or type..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={16} color="#64748B" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filters & Sort Row */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity style={styles.filterButton} onPress={() => Alert.alert('Filters', 'Filter options coming soon!')}>
          <Feather name="sliders" size={14} color="#64748B" style={{ marginRight: 6 }} />
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.sortButton} 
          onPress={() => {
            const nextSort = sortBy === 'latest' ? 'oldest' : 'latest';
            setSortBy(nextSort);
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Feather name={sortBy === 'latest' ? 'arrow-down' : 'arrow-up'} size={14} color="#64748B" style={{ marginRight: 6 }} />
            <Text style={styles.filterButtonText}>Sort: {sortBy === 'latest' ? 'Latest' : 'Oldest'}</Text>
          </View>
          <Feather name="chevron-down" size={14} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Loading or List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1E3A8A" />
        </View>
      ) : (
        <FlatList
          data={filteredSites}
          renderItem={renderSiteItem}
          keyExtractor={(item) => item.worksiteId}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#1E3A8A']}
              tintColor="#1E3A8A"
            />
          }
        />
      )}

      <Modal visible={isModalOpen} animationType="slide" transparent={Platform.OS === 'ios'}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ flex: 1, justifyContent: 'flex-end', width: '100%' }}
            >
              <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>Create New Work Site</Text>
                    <Text style={styles.modalSubtitle}>Fill details to register a work site</Text>
                  </View>
                  <TouchableOpacity onPress={() => { Keyboard.dismiss(); setIsModalOpen(false); }} style={styles.closeModalButton}>
                    <Feather name="x" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={styles.formContainer}
                  contentContainerStyle={{ paddingBottom: 40 }}
                >
                  {isFieldVisible('name') && (
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Site Name {isFieldRequired('name') && '*'}</Text>
                      <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. Sector 5 Metro Junction"
                        placeholderTextColor="#94A3B8"
                        style={styles.input}
                      />
                    </View>
                  )}

                  {isFieldVisible('location') && (
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Site Location {isFieldRequired('location') && '*'}</Text>
                      <TextInput
                        value={location}
                        onChangeText={setLocation}
                        placeholder="e.g. North Corridor, Main Crossroad"
                        placeholderTextColor="#94A3B8"
                        style={styles.input}
                      />
                    </View>
                  )}

                  {isFieldVisible('type') && (
                    <>
                      <View style={[styles.formGroup, { zIndex: showTypeSelector ? 100 : 1 }]}>
                        <Text style={styles.label}>Type *</Text>
                        <TouchableOpacity
                          style={styles.dropdownTrigger}
                          onPress={() => { Keyboard.dismiss(); setShowTypeSelector(!showTypeSelector); }}
                        >
                          <Text style={styles.dropdownTriggerText}>{type}</Text>
                          <Feather name={showTypeSelector ? 'chevron-up' : 'chevron-down'} size={16} color="#64748B" />
                        </TouchableOpacity>

                        {showTypeSelector && (
                          <View style={styles.dropdownMenu}>
                            {PRESET_TYPES.map((item) => (
                              <TouchableOpacity
                                key={item}
                                style={styles.dropdownOption}
                                onPress={() => {
                                  setType(item);
                                  setShowTypeSelector(false);
                                }}
                              >
                                <Text style={[styles.dropdownOptionText, type === item && styles.selectedOptionText]}>{item}</Text>
                                {type === item && <Feather name="check" size={14} color="#10B981" />}
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>

                      {type === 'Add New' && (
                        <View style={styles.formGroup}>
                          <Text style={styles.label}>Specify Custom Type *</Text>
                          <TextInput
                            value={customType}
                            onChangeText={setCustomType}
                            placeholder="e.g. Tunnel"
                            placeholderTextColor="#94A3B8"
                            style={styles.input}
                          />
                        </View>
                      )}
                    </>
                  )}

                  {isFieldVisible('supervisor') && (
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Supervisor {isFieldRequired('supervisor') && '*'}</Text>
                      <TextInput
                        value={supervisor}
                        onChangeText={setSupervisor}
                        placeholder="e.g. Sarah Jenkins"
                        placeholderTextColor="#94A3B8"
                        style={styles.input}
                      />
                    </View>
                  )}

                  {isFieldVisible('contact') && (
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Contact Number {isFieldRequired('contact') && '*'}</Text>
                      <TextInput
                        value={contact}
                        onChangeText={setContact}
                        placeholder="e.g. +91 98765 43210"
                        placeholderTextColor="#94A3B8"
                        style={styles.input}
                        keyboardType="phone-pad"
                      />
                    </View>
                  )}

                  {/* Render Custom Fields dynamically */}
                  {formConfig.filter(f => !f.isDefault && !f.isHidden).map(cf => (
                    <View key={cf.fieldKey} style={styles.formGroup}>
                      <Text style={styles.label}>
                        {cf.fieldLabel} {cf.isRequired && '*'}
                      </Text>
                      {cf.fieldType === 'dropdown' ? (
                        <View style={{ position: 'relative', zIndex: 50 }}>
                          <TouchableOpacity
                            style={styles.dropdownTrigger}
                            onPress={() => {
                              Keyboard.dismiss();
                              const options = (cf.dropdownOptions || '').split(',').map((o: string) => o.trim());
                              Alert.alert(
                                `Select ${cf.fieldLabel}`,
                                '',
                                [
                                  ...options.map((opt: string) => ({
                                    text: opt,
                                    onPress: () => setCustomFieldValues(prev => ({ ...prev, [cf.fieldKey]: opt }))
                                  })),
                                  { text: 'Cancel', style: 'cancel' }
                                ]
                              );
                            }}
                          >
                            <Text style={styles.dropdownTriggerText}>
                              {customFieldValues[cf.fieldKey] || 'Select option'}
                            </Text>
                            <Feather name="chevron-down" size={16} color="#64748B" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TextInput
                          value={customFieldValues[cf.fieldKey] || ''}
                          onChangeText={(val) => setCustomFieldValues(prev => ({ ...prev, [cf.fieldKey]: val }))}
                          placeholder={`Enter ${cf.fieldLabel}`}
                          placeholderTextColor="#94A3B8"
                          style={styles.input}
                        />
                      )}
                    </View>
                  ))}

                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => { Keyboard.dismiss(); setIsModalOpen(false); }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={handleSave}
                    >
                      <Text style={styles.saveButtonText}>Create Work Site</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    marginRight: 16,
  },
  title: {
    fontFamily: 'Geist',
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  addButton: {
    backgroundColor: '#1E3A8A',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Geist',
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 12,
  },
  siteCode: {
    fontFamily: 'Geist',
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  typeBadgeText: {
    fontFamily: 'Geist',
    fontSize: 10,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  siteName: {
    fontFamily: 'Geist',
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontFamily: 'Geist',
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 4,
    maxWidth: 240,
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  statusText: {
    fontFamily: 'Geist',
    fontSize: 10,
    fontWeight: '700',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  detailRow: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailText: {
    fontFamily: 'Geist',
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 6,
    flex: 1,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  footerLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontFamily: 'Geist',
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  footerValue: {
    fontFamily: 'Geist',
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerButtonText: {
    fontFamily: 'Geist',
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A',
    marginRight: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'Geist',
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontFamily: 'Geist',
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 240,
    marginTop: 6,
    lineHeight: 18,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 40,
    marginRight: 6,
  },
  sortButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 40,
    paddingHorizontal: 12,
    marginLeft: 6,
  },
  filterButtonText: {
    fontFamily: 'Geist',
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 16,
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
  closeModalButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    marginTop: 16,
    flexShrink: 1,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Geist',
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'Geist',
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownTriggerText: {
    fontFamily: 'Geist',
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 65,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dropdownOptionText: {
    fontFamily: 'Geist',
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  selectedOptionText: {
    color: '#1E3A8A',
    fontWeight: '800',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontFamily: 'Geist',
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonText: {
    fontFamily: 'Geist',
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  // Dropdown Menu Box Styles (Card 3-dot vertical dropdown)
  dropdownMenuBox: {
    position: 'absolute',
    top: 30,
    right: 0,
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 100,
    padding: 4,
  },
  dropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dropdownMenuItemText: {
    fontFamily: 'Geist',
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginLeft: 8,
  },
  dropdownMenuDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
});

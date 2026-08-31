import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform, Modal, TextInput, ScrollView, KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { getAuth } from '@react-native-firebase/auth';
import { BASE_URL } from '../../services/api';

interface Project {
  id: string;
  name: string;
  location: string;
  locationBlock: string;
  customer: string;
  commodity: string;
  contractQuantity: string;
  contractQuantityUnit: string;
  contractStartDate: string;
  contractEndDate: string;
  otherData?: string;
  status: 'Active' | 'Completed' | 'Planning' | 'On Hold';
  is_pinned?: boolean;
}

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'oldest'>('latest');
 
  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [locationBlock, setLocationBlock] = useState('North Block');
  const [customLocationBlock, setCustomLocationBlock] = useState('');
  const [customer, setCustomer] = useState('');
  const [commodity, setCommodity] = useState('Coal');
  const [customCommodity, setCustomCommodity] = useState('');
  const [contractQuantity, setContractQuantity] = useState('');
  const [contractQuantityUnit, setContractQuantityUnit] = useState('Tons');
  const [customQuantityUnit, setCustomQuantityUnit] = useState('');
  const [contractStartDate, setContractStartDate] = useState('');
  const [contractEndDate, setContractEndDate] = useState('');
  const [otherData, setOtherData] = useState('');
 
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

  // Dropdown Menu State
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
 
  const [showCommoditySelector, setShowCommoditySelector] = useState(false);
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [showUnitSelector, setShowUnitSelector] = useState(false);
 
  const fetchProjects = async () => {
    const user = getAuth().currentUser;
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/api/tenant/projects/${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };
 
  const fetchFormConfig = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/form-config/project`);
      if (res.ok) {
        const data = await res.json();
        setFormConfig(data);
      }
    } catch (err) {
      console.error('Error fetching form config:', err);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchProjects();
      fetchFormConfig();
    }, [])
  );
 
  const filteredProjects = projects
    .filter(prj => {
      const matchesSearch = prj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prj.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prj.locationBlock.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prj.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prj.commodity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prj.contractQuantityUnit && prj.contractQuantityUnit.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (prj.customFields && JSON.stringify(prj.customFields).toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'latest') {
        return b.id.localeCompare(a.id);
      } else {
        return a.id.localeCompare(b.id);
      }
    });
 
  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'Active': return '#10B981';
      case 'Completed': return '#3B82F6';
      case 'Planning': return '#F59E0B';
      case 'On Hold': return '#EF4444';
    }
  };
 
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProjects();
    await fetchFormConfig();
    setRefreshing(false);
  };
 
  const handleSave = async () => {
    Keyboard.dismiss();
    const user = getAuth().currentUser;
    if (!user) {
      alert('You must be logged in to create a project.');
      return;
    }

    // Validate Default Fields dynamically
    const fieldsToValidate = [
      { key: 'name', val: name, label: 'Project Name' },
      { key: 'location', val: location, label: 'Project Location' },
      { key: 'locationBlock', val: locationBlock === 'Add New' ? customLocationBlock : locationBlock, label: 'Location Block / Phase' },
      { key: 'customer', val: customer, label: 'Client / Customer' },
      { key: 'commodity', val: commodity === 'Add New' ? customCommodity : commodity, label: 'Cargo / Commodity' },
      { key: 'contractQuantity', val: contractQuantity, label: 'Quantity' },
      { key: 'contractQuantityUnit', val: contractQuantityUnit === 'Add New' ? customQuantityUnit : contractQuantityUnit, label: 'Quantity Unit' },
      { key: 'contractStartDate', val: contractStartDate, label: 'Start Date' },
      { key: 'contractEndDate', val: contractEndDate, label: 'End Date' },
      { key: 'otherData', val: otherData, label: 'Remarks / Other Data' },
    ];
    for (const f of fieldsToValidate) {
      if (isFieldVisible(f.key) && isFieldRequired(f.key) && !String(f.val || '').trim()) {
        alert(`${f.label} is required.`);
        return;
      }
    }

    // Validate Custom Fields
    const customFields = formConfig.filter(f => !f.isDefault && !f.isHidden);
    const resolvedCustomFields: Record<string, string> = {};
    for (const cf of customFields) {
      const val = customFieldValues[cf.fieldKey];
      if (cf.isRequired && (!val || !val.trim())) {
        alert(`${cf.fieldLabel} is required.`);
        return;
      }
      if (val) {
        resolvedCustomFields[cf.fieldLabel] = val;
      }
    }
 
    const finalCommodity = commodity === 'Add New' ? customCommodity : commodity;
    const finalBlock = locationBlock === 'Add New' ? customLocationBlock : locationBlock;
    const finalUnit = contractQuantityUnit === 'Add New' ? customQuantityUnit : contractQuantityUnit;
 
    try {
      const res = await fetch(`${BASE_URL}/api/tenant/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUid: user.uid,
          name: isFieldVisible('name') ? name : '',
          location: isFieldVisible('location') ? location : '',
          locationBlock: isFieldVisible('locationBlock') ? finalBlock : '',
          customer: isFieldVisible('customer') ? customer : '',
          commodity: isFieldVisible('commodity') ? finalCommodity : '',
          contractQuantity: isFieldVisible('contractQuantity') ? contractQuantity : '',
          contractQuantityUnit: isFieldVisible('contractQuantityUnit') ? finalUnit : '',
          contractStartDate: isFieldVisible('contractStartDate') ? contractStartDate : '',
          contractEndDate: isFieldVisible('contractEndDate') ? contractEndDate : '',
          otherData: isFieldVisible('otherData') ? otherData : '',
          customFields: resolvedCustomFields
        })
      });
 
      if (res.ok) {
        await fetchProjects();
        setIsModalOpen(false);
        // Reset Form
        setName('');
        setLocation('');
        setLocationBlock('North Block');
        setCustomLocationBlock('');
        setCustomer('');
        setCommodity('Coal');
        setCustomCommodity('');
        setContractQuantity('');
        setContractQuantityUnit('Tons');
        setCustomQuantityUnit('');
        setContractStartDate('');
        setContractEndDate('');
        setOtherData('');
        setCustomFieldValues({});
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to create project.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend server.');
    }
  };

  const handleDeleteProject = (id: string) => {
    Alert.alert('Delete Project', 'Are you sure you want to delete this project?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${BASE_URL}/api/tenant/projects/${id}`, { method: 'DELETE' });
            if (res.ok) await fetchProjects();
            else alert('Failed to delete project');
          } catch (err) {
            console.error(err);
            alert('Error deleting project');
          }
        }
      }
    ]);
  };

  const handleTogglePin = async (id: string, currentPinStatus: boolean = false) => {
    try {
      const res = await fetch(`${BASE_URL}/api/tenant/projects/${id}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !currentPinStatus })
      });
      if (res.ok) await fetchProjects();
      else alert('Failed to pin project');
    } catch (err) {
      console.error(err);
      alert('Error pinning project');
    }
  };

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const confirmDeleteProject = (id: string) => {
    setOpenMenuId(null);
    Alert.alert('Delete Project', 'Are you sure you want to delete this project?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${BASE_URL}/api/tenant/projects/${id}`, { method: 'DELETE' });
            if (res.ok) await fetchProjects();
            else alert('Failed to delete project');
          } catch (err) {
            console.error(err);
            alert('Error deleting project');
          }
        }
      }
    ]);
  };

  const executeTogglePin = async (id: string, currentPinStatus: boolean = false) => {
    setOpenMenuId(null);
    try {
      const res = await fetch(`${BASE_URL}/api/tenant/projects/${id}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !currentPinStatus })
      });
      if (res.ok) {
        await fetchProjects();
        Alert.alert('Success', currentPinStatus ? 'Project Unpinned from Dashboard!' : 'Project Pinned to Dashboard!');
      } else {
        Alert.alert('Error', 'Failed to update pin status');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Error pinning project');
    }
  };

  const renderProjectItem = ({ item }: { item: Project }) => (
    <View style={[styles.card, { zIndex: openMenuId === item.id ? 10 : 1 }]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.projectCode}>{item.id}</Text>
            {item.is_pinned && (
              <View style={styles.pinnedBadge}>
                <Feather name="paperclip" size={8} color="#D97706" style={{ marginRight: 2 }} />
                <Text style={styles.pinnedText}>PINNED</Text>
              </View>
            )}
          </View>
          <Text style={styles.projectName}>{item.name}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', zIndex: 10 }}>
          <View style={[styles.statusBadge, { borderColor: getStatusColor(item.status) }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
          </View>
          <View style={{ position: 'relative' }}>
            <TouchableOpacity onPress={() => toggleMenu(item.id)} style={{ marginLeft: 8, padding: 4 }}>
              <Feather name="more-vertical" size={20} color="#64748B" />
            </TouchableOpacity>

            {openMenuId === item.id && (
              <View style={styles.dropdownMenuBox}>
                <TouchableOpacity style={styles.dropdownMenuItem} onPress={() => executeTogglePin(item.id, item.is_pinned)}>
                  <Feather name="paperclip" size={14} color="#0284C7" />
                  <Text style={styles.dropdownMenuItemText}>{item.is_pinned ? 'Unpin' : 'Pin'}</Text>
                </TouchableOpacity>
                <View style={styles.dropdownMenuDivider} />
                <TouchableOpacity style={styles.dropdownMenuItem} onPress={() => confirmDeleteProject(item.id)}>
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
          <Text style={styles.detailText} numberOfLines={1}>{item.location} {item.locationBlock ? `(${item.locationBlock})` : ''}</Text>
        </View>
        <View style={styles.detailRow}>
          <Feather name="user" size={14} color="#64748B" />
          <Text style={styles.detailText} numberOfLines={1}>Client: {item.customer || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Feather name="layers" size={14} color="#64748B" />
          <Text style={styles.detailText} numberOfLines={1}>Cargo: {item.commodity}</Text>
        </View>
        <View style={styles.detailRow}>
          <Feather name="briefcase" size={14} color="#64748B" />
          <Text style={styles.detailText} numberOfLines={1}>Qty: {item.contractQuantity ? `${item.contractQuantity} ${item.contractQuantityUnit || ''}` : 'N/A'}</Text>
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
          <Text style={styles.footerLabel}>Contract Period</Text>
          <Text style={styles.footerValue}>
            {item.contractStartDate ? `${item.contractStartDate} to ${item.contractEndDate}` : 'N/A'}
          </Text>
        </View>
        {item.otherData ? (
          <View style={styles.remarksBox}>
            <Text style={styles.remarksText}>{item.otherData}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrapper}>
        <Feather name="briefcase" size={32} color="#94A3B8" />
      </View>
      <Text style={styles.emptyTitle}>No Projects Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'No match found for your search query.' : 'Get started by creating your first construction project tracker.'}
      </Text>
    </View>
  );

  const commodities = ['Coal', 'Iron Ore', 'Sand', 'Aggregates', 'Add New'];
  const blocks = ['North Block', 'South Block', 'Phase 1', 'Phase 2', 'Add New'];
  const units = ['Tons', 'Metric Tons', 'KL (Kilo Liters)', 'CUM (Cubic Meters)', 'Bags', 'Nos', 'Add New'];

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? insets.top : 0 }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 10 : 16 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={styles.menuButton}>
            <Feather name="menu" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.title}>Projects</Text>
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
            placeholder="Search by name, location, blocks, unit, cargo..."
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
          data={filteredProjects}
          renderItem={renderProjectItem}
          keyExtractor={(item) => item.id}
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
                    <Text style={styles.modalTitle}>Create New Project</Text>
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
                      <Text style={styles.label}>Project Name {isFieldRequired('name') && '*'}</Text>
                      <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. Metro Bypass Paving"
                        placeholderTextColor="#94A3B8"
                        style={styles.input}
                      />
                    </View>
                  )}

                  {isFieldVisible('location') && (
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Project Location {isFieldRequired('location') && '*'}</Text>
                      <TextInput
                        value={location}
                        onChangeText={setLocation}
                        placeholder="e.g. North Expressway Sector 4"
                        placeholderTextColor="#94A3B8"
                        style={styles.input}
                      />
                    </View>
                  )}

                  {isFieldVisible('locationBlock') && (
                    <>
                      <View style={[styles.formGroup, { zIndex: showBlockSelector ? 100 : 1 }]}>
                        <Text style={styles.label}>Location Block / Phase</Text>
                        <TouchableOpacity
                          style={styles.dropdownTrigger}
                          onPress={() => { Keyboard.dismiss(); setShowBlockSelector(!showBlockSelector); }}
                        >
                          <Text style={styles.dropdownTriggerText}>{locationBlock}</Text>
                          <Feather name={showBlockSelector ? 'chevron-up' : 'chevron-down'} size={16} color="#64748B" />
                        </TouchableOpacity>

                        {showBlockSelector && (
                          <View style={styles.dropdownMenu}>
                            {blocks.map((item) => (
                              <TouchableOpacity
                                key={item}
                                style={styles.dropdownOption}
                                onPress={() => {
                                  setLocationBlock(item);
                                  setShowBlockSelector(false);
                                }}
                              >
                                <Text style={[styles.dropdownOptionText, locationBlock === item && styles.selectedOptionText]}>{item}</Text>
                                {locationBlock === item && <Feather name="check" size={14} color="#10B981" />}
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>

                      {locationBlock === 'Add New' && (
                        <View style={styles.formGroup}>
                          <Text style={styles.label}>Specify Block / Phase *</Text>
                          <TextInput
                            value={customLocationBlock}
                            onChangeText={setCustomLocationBlock}
                            placeholder="e.g. West Block Section B"
                            placeholderTextColor="#94A3B8"
                            style={styles.input}
                          />
                        </View>
                      )}
                    </>
                  )}

                  {isFieldVisible('customer') && (
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Customer Name {isFieldRequired('customer') && '*'}</Text>
                      <TextInput
                        value={customer}
                        onChangeText={setCustomer}
                        placeholder="e.g. Metro Rail Authority"
                        placeholderTextColor="#94A3B8"
                        style={styles.input}
                      />
                    </View>
                  )}

                  {isFieldVisible('commodity') && (
                    <>
                      <View style={[styles.formGroup, { zIndex: showCommoditySelector ? 100 : 1 }]}>
                        <Text style={styles.label}>Commodity</Text>
                        <TouchableOpacity
                          style={styles.dropdownTrigger}
                          onPress={() => { Keyboard.dismiss(); setShowCommoditySelector(!showCommoditySelector); }}
                        >
                          <Text style={styles.dropdownTriggerText}>{commodity}</Text>
                          <Feather name={showCommoditySelector ? 'chevron-up' : 'chevron-down'} size={16} color="#64748B" />
                        </TouchableOpacity>

                        {showCommoditySelector && (
                          <View style={styles.dropdownMenu}>
                            {commodities.map((item) => (
                              <TouchableOpacity
                                key={item}
                                style={styles.dropdownOption}
                                onPress={() => {
                                  setCommodity(item);
                                  setShowCommoditySelector(false);
                                }}
                              >
                                <Text style={[styles.dropdownOptionText, commodity === item && styles.selectedOptionText]}>{item}</Text>
                                {commodity === item && <Feather name="check" size={14} color="#10B981" />}
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>

                      {commodity === 'Add New' && (
                        <View style={styles.formGroup}>
                          <Text style={styles.label}>Specify Commodity *</Text>
                          <TextInput
                            value={customCommodity}
                            onChangeText={setCustomCommodity}
                            placeholder="e.g. Limestone"
                            placeholderTextColor="#94A3B8"
                            style={styles.input}
                          />
                        </View>
                      )}
                    </>
                  )}

                  {(isFieldVisible('contractQuantity') || isFieldVisible('contractQuantityUnit')) && (
                    <>
                      <View style={styles.row}>
                        {isFieldVisible('contractQuantity') && (
                          <View style={[styles.formGroup, { flex: 1, marginRight: isFieldVisible('contractQuantityUnit') ? 8 : 0 }]}>
                            <Text style={styles.label}>Contract Qty {isFieldRequired('contractQuantity') && '*'}</Text>
                            <TextInput
                              value={contractQuantity}
                              onChangeText={setContractQuantity}
                              placeholder="e.g. 50,000"
                              placeholderTextColor="#94A3B8"
                              keyboardType="numeric"
                              style={styles.input}
                            />
                          </View>
                        )}
                        {isFieldVisible('contractQuantityUnit') && (
                          <View style={[styles.formGroup, { flex: 1, marginLeft: isFieldVisible('contractQuantity') ? 8 : 0, zIndex: showUnitSelector ? 100 : 1 }]}>
                            <Text style={styles.label}>Unit</Text>
                            <TouchableOpacity
                              style={styles.dropdownTrigger}
                              onPress={() => { Keyboard.dismiss(); setShowUnitSelector(!showUnitSelector); }}
                            >
                              <Text style={styles.dropdownTriggerText}>{contractQuantityUnit}</Text>
                              <Feather name={showUnitSelector ? 'chevron-up' : 'chevron-down'} size={16} color="#64748B" />
                            </TouchableOpacity>

                            {showUnitSelector && (
                              <View style={styles.dropdownMenu}>
                                {units.map((item) => (
                                  <TouchableOpacity
                                    key={item}
                                    style={styles.dropdownOption}
                                    onPress={() => {
                                      setContractQuantityUnit(item);
                                      setShowUnitSelector(false);
                                    }}
                                  >
                                    <Text style={[styles.dropdownOptionText, contractQuantityUnit === item && styles.selectedOptionText]}>{item}</Text>
                                    {contractQuantityUnit === item && <Feather name="check" size={14} color="#10B981" />}
                                  </TouchableOpacity>
                                ))}
                              </View>
                            )}
                          </View>
                        )}
                      </View>

                      {contractQuantityUnit === 'Add New' && isFieldVisible('contractQuantityUnit') && (
                        <View style={styles.formGroup}>
                          <Text style={styles.label}>Specify Unit *</Text>
                          <TextInput
                            value={customQuantityUnit}
                            onChangeText={setCustomQuantityUnit}
                            placeholder="e.g. Barrels"
                            placeholderTextColor="#94A3B8"
                            style={styles.input}
                          />
                        </View>
                      )}
                    </>
                  )}

                  {(isFieldVisible('contractStartDate') || isFieldVisible('contractEndDate')) && (
                    <View style={styles.row}>
                      {isFieldVisible('contractStartDate') && (
                        <View style={[styles.formGroup, { flex: 1, marginRight: isFieldVisible('contractEndDate') ? 8 : 0 }]}>
                          <Text style={styles.label}>Contract From {isFieldRequired('contractStartDate') && '*'}</Text>
                          <TextInput
                            value={contractStartDate}
                            onChangeText={setContractStartDate}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#94A3B8"
                            style={styles.input}
                          />
                        </View>
                      )}
                      {isFieldVisible('contractEndDate') && (
                        <View style={[styles.formGroup, { flex: 1, marginLeft: isFieldVisible('contractStartDate') ? 8 : 0 }]}>
                          <Text style={styles.label}>Contract To {isFieldRequired('contractEndDate') && '*'}</Text>
                          <TextInput
                            value={contractEndDate}
                            onChangeText={setContractEndDate}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor="#94A3B8"
                            style={styles.input}
                          />
                        </View>
                      )}
                    </View>
                  )}

                  {isFieldVisible('otherData') && (
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Other Data / Remarks {isFieldRequired('otherData') && '*'}</Text>
                      <TextInput
                        value={otherData}
                        onChangeText={setOtherData}
                        placeholder="Enter other remarks or data..."
                        placeholderTextColor="#94A3B8"
                        multiline={true}
                        numberOfLines={3}
                        style={[styles.input, styles.textArea]}
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
                      <Text style={styles.saveButtonText}>Create Project</Text>
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
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
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
  projectCode: {
    fontFamily: 'Geist',
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  projectName: {
    fontFamily: 'Geist',
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
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
    fontSize: 11,
    fontWeight: '700',
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  pinnedText: {
    fontFamily: 'Geist',
    fontSize: 8,
    fontWeight: '800',
    color: '#D97706',
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
  remarksBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
  },
  remarksText: {
    fontFamily: 'Geist',
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F8FAFC',
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
    marginBottom: 4,
  },
  emptySubtitle: {
    fontFamily: 'Geist',
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 240,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  // Inline Dropdown Menu Box Styles
  dropdownMenuBox: {
    position: 'absolute',
    top: 30,
    right: 0,
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 999,
  },
  dropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownMenuItemText: {
    fontFamily: 'Geist',
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginLeft: 10,
  },
  dropdownMenuDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 8,
  },
});

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getAuth } from '@react-native-firebase/auth';
import { BASE_URL, mobileApiFetch } from '../../services/api';
import { Picker } from '@react-native-picker/picker';
import CustomDropdown from '../components/CustomDropdown';

const INDUSTRIES = [
  'Logistics',
  'Mining',
  'Port Operations',
  'Rail Logistics',
  'EPC / Infrastructure',
  'Construction',
  'Manufacturing',
];
interface ProfileData {
  adminName: string;
  designation: string;
  mobile: string;
  email: string;
  companyName: string;
  industryType: string;
  country: string;
  state: string;
  pincode: string;
  city: string;
  companyWebsite?: string;
  companySize?: string;
  gstNumber?: string;
  panNumber?: string;
  msmeNumber?: string;
  memberId?: string;
  userType?: string;
  department?: string;
  alternateMobile?: string;
  aadharNumber?: string;
  residingAddress?: string;
  permanentAddress?: string;
  emergencyContactName?: string;
  emergencyContactMobile?: string;
  bloodGroup?: string;
  profilePhoto?: string;
  salary?: number | string;
  bankName?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  subRole?: string;
  employeeType?: string;
  joiningDate?: string;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editForm, setEditForm] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchProfile = async () => {
    const user = getAuth().currentUser;
    if (!user) {
      setLoading(false);
      setError('User not authenticated');
      return;
    }

    try {
      const mobile = user.phoneNumber || '';
      const email = user.email || '';
      const res = await mobileApiFetch(`/api/tenant/profile/${user.uid}?mobile=${encodeURIComponent(mobile)}&email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        if (res.status === 404) {
          setProfile(null);
        } else {
          throw new Error('Failed to fetch profile');
        }
      } else {
        const data = await res.json();
        setProfile(data);
        setEditForm(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setIsEditing(false);
      fetchProfile();
    }, [])
  );

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    if (editForm) {
      setEditForm({ ...editForm, [field]: value });
    }
  };

  const handleSave = async () => {
    const user = getAuth().currentUser;
    if (!user || !editForm) return;

    // Basic Validation
    if (!editForm.adminName.trim() || !editForm.designation.trim() || !editForm.email.trim() || !editForm.mobile.trim() || !editForm.companyName.trim() || !editForm.city.trim() || !editForm.state.trim() || !editForm.country.trim() || !editForm.pincode.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setSaving(true);
    try {
      const res = await mobileApiFetch(`/api/tenant/profile/${user.uid}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setProfile(editForm);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? insets.top : 0 }]}>
      <StatusBar style="dark" translucent={true} backgroundColor="transparent" />

      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 10 : 16 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={styles.menuButton}>
            <Ionicons name="reorder-three-outline" size={32} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.title}>Your Profile</Text>
        </View>

        {profile && !isEditing && profile.userType !== 'team_member' && (
          <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButton}>
            <Ionicons name="create-outline" size={24} color="#1E3A8A" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E3A8A" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Error Loading Profile</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : !profile ? (
        <View style={styles.errorContainer}>
          <Ionicons name="business-outline" size={64} color="#1E3A8A" />
          <Text style={styles.errorTitle}>Registration Incomplete</Text>
          <Text style={styles.errorSubtitle}>
            Please complete your company registration to view your full organization profile.
          </Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('RegistrationWizard')}
          >
            <Text style={styles.actionButtonText}>Start Registration</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {!isEditing && (
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(profile.adminName)}</Text>
              </View>
              <Text style={styles.name}>{profile.adminName}</Text>
              <Text style={styles.designation}>{profile.designation}</Text>
              <Text style={styles.companyBadge}>{profile.companyName}</Text>
            </View>
          )}

          {isEditing ? (
            <View style={styles.editForm}>
              <Text style={styles.sectionLabel}>Administrator Details</Text>
              <View style={styles.infoCard}>
                <InfoRow icon="person-outline" label="Admin ID" value={editForm?.memberId || 'Loading...'} />
                <ProfileInputField icon="person-outline" label="Full Name" value={editForm?.adminName} onChangeText={(val: string) => handleInputChange('adminName', val)} />
                <ProfileInputField icon="briefcase-outline" label="Designation" value={editForm?.designation} onChangeText={(val: string) => handleInputChange('designation', val)} />
                <ProfileInputField icon="mail-outline" label="Email Address" value={editForm?.email} onChangeText={(val: string) => handleInputChange('email', val)} keyboardType="email-address" />
                <ProfileInputField icon="call-outline" label="Mobile Number" value={editForm?.mobile} onChangeText={(val: string) => handleInputChange('mobile', val)} keyboardType="phone-pad" />
              </View>

              <Text style={styles.sectionLabel}>Company Details</Text>
              <View style={styles.infoCard}>
                <ProfileInputField icon="business-outline" label="Company Name" value={editForm?.companyName} onChangeText={(val: string) => handleInputChange('companyName', val)} />
                <CustomDropdown
                  label="Industry Type"
                  selectedValue={INDUSTRIES.includes(editForm?.industryType || '') ? editForm?.industryType : (editForm?.industryType ? 'Other' : '')}
                  options={[...INDUSTRIES, 'Other']}
                  onValueChange={(val) => handleInputChange('industryType', val)}
                  placeholder="Select Industry"
                  iconName="pricetag-outline"
                />

                {editForm?.industryType !== undefined && !INDUSTRIES.includes(editForm.industryType) && (
                  <View style={styles.infoRow}>
                    <Ionicons name="pricetag-outline" size={20} color="#94A3B8" style={styles.rowIcon} />
                    <View style={styles.rowTextContainer}>
                      <Text style={styles.rowLabel}>Specify Industry</Text>
                      <View style={styles.textInputWrapper}>
                        <TextInput
                          value={editForm.industryType === 'Other' ? '' : editForm.industryType}
                          onChangeText={(val) => handleInputChange('industryType', val)}
                          style={styles.pickerTextInput}
                          placeholder="Specify your industry"
                          placeholderTextColor="#94A3B8"
                        />
                      </View>
                    </View>
                  </View>
                )}
                <ProfileInputField icon="globe-outline" label="Website URL" value={editForm?.companyWebsite} onChangeText={(val: string) => handleInputChange('companyWebsite', val)} keyboardType="url" />
                <ProfileInputField icon="people-outline" label="Company Size" value={editForm?.companySize} onChangeText={(val: string) => handleInputChange('companySize', val)} />
                <ProfileInputField icon="document-text-outline" label="GST Number" value={editForm?.gstNumber} onChangeText={(val: string) => handleInputChange('gstNumber', val)} />
                <ProfileInputField icon="card-outline" label="PAN Number" value={editForm?.panNumber} onChangeText={(val: string) => handleInputChange('panNumber', val.toUpperCase())} maxLength={10} />
                <ProfileInputField icon="ribbon-outline" label="MSME Registration No" value={editForm?.msmeNumber} onChangeText={(val: string) => handleInputChange('msmeNumber', val)} />
              </View>

              <Text style={styles.sectionLabel}>Location details</Text>
              <View style={styles.infoCard}>
                <ProfileInputField icon="map-outline" label="City" value={editForm?.city} onChangeText={(val: string) => handleInputChange('city', val)} />
                <ProfileInputField icon="location-outline" label="State" value={editForm?.state} onChangeText={(val: string) => handleInputChange('state', val)} />
                <ProfileInputField icon="globe-outline" label="Country" value={editForm?.country} onChangeText={(val: string) => handleInputChange('country', val)} />
                <ProfileInputField icon="pin-outline" label="Pincode" value={editForm?.pincode} onChangeText={(val: string) => handleInputChange('pincode', val)} keyboardType="number-pad" />
              </View>

              {/* Form Action Buttons */}
              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.formButton, styles.cancelButton]}
                  onPress={() => {
                    setIsEditing(false);
                    setEditForm(profile);
                  }}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formButton, styles.saveButton]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              {profile.userType === 'team_member' ? (
                <>
                  {/* PERSONAL DETAILS SECTION */}
                  <Text style={styles.sectionLabel}>Personal Details</Text>
                  <View style={styles.infoCard}>
                    <InfoRow icon="person-outline" label="Member ID" value={profile.memberId || 'N/A'} />
                    <InfoRow icon="person-outline" label="Full Name" value={profile.adminName} />
                    <InfoRow icon="briefcase-outline" label="Designation / Role" value={profile.designation} />
                    <InfoRow icon="people-outline" label="Department" value={profile.department || 'Operations'} />
                    <InfoRow icon="mail-outline" label="Email Address" value={profile.email} />
                    <InfoRow icon="call-outline" label="Mobile Number" value={profile.mobile} />
                    <InfoRow icon="call-outline" label="Alternate Mobile" value={profile.alternateMobile || 'Not Provided'} />
                    <InfoRow icon="heart-outline" label="Blood Group" value={profile.bloodGroup || 'Not Provided'} />
                    <InfoRow icon="document-text-outline" label="Aadhar Card Number" value={profile.aadharNumber || 'Not Provided'} />
                  </View>

                  {/* ADDRESS & EMERGENCY DETAILS */}
                  <Text style={styles.sectionLabel}>Addresses & Emergency Info</Text>
                  <View style={styles.infoCard}>
                    <InfoRow icon="home-outline" label="Residing Address" value={profile.residingAddress || 'Not Provided'} />
                    <InfoRow icon="home-outline" label="Permanent Address" value={profile.permanentAddress || 'Not Provided'} />
                    <InfoRow icon="person-outline" label="Emergency Contact Person" value={profile.emergencyContactName || 'Not Provided'} />
                    <InfoRow icon="call-outline" label="Emergency Contact Number" value={profile.emergencyContactMobile || 'Not Provided'} />
                  </View>

                  {/* EMPLOYMENT & BANK DETAILS */}
                  <Text style={styles.sectionLabel}>Employment & Bank Details</Text>
                  <View style={styles.infoCard}>
                    <InfoRow icon="briefcase-outline" label="Employee Type" value={profile.employeeType || 'Permanent'} />
                    <InfoRow icon="calendar-outline" label="Joining Date" value={profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString('en-IN') : 'Not Provided'} />
                    <InfoRow icon="cash-outline" label="Monthly Salary" value={profile.salary ? `₹${Number(profile.salary).toLocaleString('en-IN')}` : 'Not Provided'} />
                    <InfoRow icon="business-outline" label="Bank Name" value={profile.bankName || 'Not Provided'} />
                    <InfoRow icon="card-outline" label="Bank Account Number" value={profile.bankAccountNumber || 'Not Provided'} />
                    <InfoRow icon="ribbon-outline" label="IFSC Code" value={profile.ifscCode || 'Not Provided'} />
                    <InfoRow icon="person-outline" label="Account Holder Name" value={profile.accountHolderName || 'Not Provided'} />
                  </View>

                  {/* COMPANY DETAILS SECTION */}
                  <Text style={styles.sectionLabel}>Company Details</Text>
                  <View style={styles.infoCard}>
                    <InfoRow icon="business-outline" label="Company Name" value={profile.companyName} />
                    <InfoRow icon="pricetag-outline" label="Industry Type" value={profile.industryType} />
                    <InfoRow icon="map-outline" label="City" value={profile.city} />
                    <InfoRow icon="location-outline" label="State" value={profile.state} />
                    <InfoRow icon="globe-outline" label="Country" value={profile.country} />
                    <InfoRow icon="pin-outline" label="Pincode" value={profile.pincode} />
                  </View>
                </>
              ) : (
                <>
                  {/* ADMIN DETAILS SECTION */}
                  <Text style={styles.sectionLabel}>Administrator Info</Text>
                  <View style={styles.infoCard}>
                    <InfoRow icon="person-outline" label="Admin ID" value={profile.memberId || 'Loading...'} />
                    <InfoRow icon="mail-outline" label="Email" value={profile.email} />
                    <InfoRow icon="call-outline" label="Phone" value={profile.mobile} />
                    <InfoRow icon="briefcase-outline" label="Designation" value={profile.designation} />
                  </View>

                  {/* COMPANY DETAILS SECTION */}
                  <Text style={styles.sectionLabel}>Company Details</Text>
                  <View style={styles.infoCard}>
                    <InfoRow icon="business-outline" label="Company Name" value={profile.companyName} />
                    <InfoRow icon="pricetag-outline" label="Industry Type" value={profile.industryType} />
                    <InfoRow icon="globe-outline" label="Website" value={profile.companyWebsite || 'Not Provided'} />
                    <InfoRow icon="people-outline" label="Company Size" value={profile.companySize || 'Not Provided'} />
                    <InfoRow icon="document-text-outline" label="GST Number" value={profile.gstNumber || 'Not Provided'} />
                    <InfoRow icon="card-outline" label="PAN Number" value={profile.panNumber || 'Not Provided'} />
                    <InfoRow icon="ribbon-outline" label="MSME Registration No" value={profile.msmeNumber || 'Not Provided'} />
                  </View>

                  {/* LOCATION DETAILS SECTION */}
                  <Text style={styles.sectionLabel}>Location</Text>
                  <View style={styles.infoCard}>
                    <InfoRow icon="map-outline" label="City" value={profile.city} />
                    <InfoRow icon="location-outline" label="State" value={profile.state} />
                    <InfoRow icon="globe-outline" label="Country" value={profile.country} />
                    <InfoRow icon="pin-outline" label="Pincode" value={profile.pincode} />
                  </View>
                </>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon as any} size={20} color="#64748B" style={styles.rowIcon} />
    <View style={styles.rowTextContainer}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  </View>
);

const ProfileInputField = ({ icon, label, value, onChangeText, keyboardType = 'default', maxLength }: any) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={20} color="#94A3B8" style={styles.rowIcon} />
    <View style={styles.rowTextContainer}>
      <Text style={styles.rowLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        style={styles.textInput}
        placeholder={`Enter ${label}`}
        maxLength={maxLength}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
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
    marginRight: 12,
    marginLeft: -4,
  },
  editButton: {
    padding: 6,
  },
  title: { fontFamily: 'Geist', fontSize: 18, fontWeight: '800', color: '#0F172A' },
  content: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#FAFAFA' },
  errorTitle: { fontFamily: 'Geist', fontSize: 20, fontWeight: '800', color: '#0F172A', marginTop: 16, marginBottom: 8 },
  errorSubtitle: { fontFamily: 'Geist', fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24 },
  retryButton: { backgroundColor: '#1E3A8A', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryText: { fontFamily: 'Geist', fontSize: 15, fontWeight: '700', color: '#ffffff' },
  actionButton: { backgroundColor: '#1E3A8A', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  actionButtonText: { fontFamily: 'Geist', fontSize: 15, fontWeight: '700', color: '#ffffff' },

  profileHeader: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#DBEAFE',
  },
  avatarText: { fontFamily: 'Geist', fontSize: 32, fontWeight: '800', color: '#1E3A8A' },
  name: { fontFamily: 'Geist', fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  designation: { fontFamily: 'Geist', fontSize: 15, color: '#64748B', marginBottom: 8 },
  companyBadge: {
    fontFamily: 'Geist',
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A8A',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  sectionLabel: { fontFamily: 'Geist', fontSize: 12, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  infoCard: {
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
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  rowIcon: { marginRight: 16 },
  rowTextContainer: { flex: 1 },
  rowLabel: { fontFamily: 'Geist', fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 2 },
  rowValue: { fontFamily: 'Geist', fontSize: 14, color: '#334155', fontWeight: '600' },

  // Edit form specific styles
  editForm: {
    marginTop: 8,
  },
  textInput: {
    fontFamily: 'Geist',
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
    marginTop: 4,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    width: '100%',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 24,
  },
  formButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  cancelButtonText: {
    fontFamily: 'Geist',
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  saveButton: {
    backgroundColor: '#1E3A8A',
    marginLeft: 8,
  },
  saveButtonText: {
    fontFamily: 'Geist',
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginTop: 6,
    height: 50,
    justifyContent: 'center',
    paddingLeft: 4,
    width: '100%',
  },
  pickerComponent: {
    color: '#0F172A',
    width: '100%',
    height: 50,
  },
  textInputWrapper: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginTop: 6,
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 12,
    width: '100%',
  },
  pickerTextInput: {
    fontFamily: 'Geist',
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
    width: '100%',
    height: 48,
  },
});

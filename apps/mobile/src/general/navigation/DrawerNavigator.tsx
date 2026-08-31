import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { createDrawerNavigator, DrawerContentComponentProps } from '@react-navigation/drawer';
import { Ionicons, Feather } from '@expo/vector-icons';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Picker } from '@react-native-picker/picker';
import TabNavigator from './TabNavigator';
import ProfileScreen from '../profile/ProfileScreen';
import SettingsScreen from '../settings/SettingsScreen';
import ModuleComingSoonScreen from '../../tenant/modules/ModuleComingSoonScreen';
import TeamScreen from '../../tenant/team/TeamScreen';
import EmployeeDashboardScreen from '../../tenant/employee/EmployeeDashboardScreen';
import HRDashboardScreen from '../../tenant/hr/HRDashboardScreen';
import ProjectsScreen from '../../tenant/project/ProjectsScreen';
import WorkSitesScreen from '../../tenant/worksite/WorkSitesScreen';
import AccessControlsScreen from '../../tenant/access-controls/AccessControlsScreen';
import HRScreen from '../../tenant/hr/HRScreen';
import DivisionsScreen from '../../tenant/divisions/DivisionsScreen';
import AttendanceTrackerScreen from '../../tenant/hr/AttendanceTrackerScreen';
import { BASE_URL, mobileApiFetch } from '../../services/api';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const currentRoute = props.state.routes[props.state.index]?.name;
  const [profileData, setProfileData] = useState<any>(null);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);

  const isHR = 
    profileData?.userType === 'team_member' && (
      String(profileData?.department).toUpperCase().includes('HR') || 
      String(profileData?.department).toUpperCase().includes('HUMAN RES') || 
      String(profileData?.designation).toUpperCase().includes('HR') || 
      String(profileData?.designation).toUpperCase().includes('HUMAN RES')
    );
  const isAdmin = profileData?.userType !== 'team_member';
  const canAccessDivisions = profileData && (isAdmin || isHR);

  useEffect(() => {
    const fetchProfile = async () => {
      const user = getAuth().currentUser;
      if (!user) {
        setProfileData(null);
        return;
      }
      try {
        const mobile = user.phoneNumber || '';
        const email = user.email || '';
        const res = await mobileApiFetch(`/api/tenant/profile/${user.uid}?mobile=${encodeURIComponent(mobile)}&email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          setProfileData(data);
        } else {
          setProfileData(null);
        }
      } catch (err) {
        setProfileData(null);
      }
    };
    fetchProfile();
  }, [currentRoute]);

  const handleLogout = () => {
    signOut(getAuth());
  };
  const DrawerItem = ({ label, iconName, routeName, iconColor = '#64748B' }: any) => {
    const isActive = currentRoute === routeName;
    return (
      <TouchableOpacity
        style={[styles.drawerItem, isActive && styles.activeDrawerItem]}
        onPress={() => props.navigation.navigate(routeName)}
      >
        <Feather name={iconName} size={20} color={isActive ? '#10B981' : iconColor} style={styles.drawerIcon} />
        <Text style={[styles.drawerLabel, isActive && styles.activeDrawerLabel]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar style="dark" translucent={true} backgroundColor="transparent" />

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* Premium Minimalist White Profile Header */}
        <View
          style={[styles.profileHeader, { paddingTop: insets.top + 24 }]}
        >
          <View style={styles.profileInfo}>
            {!!profileData?.companyName && (
              <Text style={styles.companyNameText} numberOfLines={1}>{profileData.companyName}</Text>
            )}
            <Text style={styles.userName} numberOfLines={1}>{profileData ? profileData.adminName : 'Registered Tenant'}</Text>
            <Text style={styles.userRole} numberOfLines={1}>
              {profileData ? (
                profileData.userType === 'team_member' ? profileData.designation : 'System Administrator'
              ) : 'Premium Member'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.idBadge}>
                <Text style={styles.idBadgeText}>
                  ID: {profileData ? (profileData.memberId || '#TNT' + String(profileData.tenantId || '').padStart(4, '0')) : 'PENDING'}
                </Text>
              </View>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Active</Text>
            </View>
          </View>
        </View>

        {/* ALWAYS VISIBLE MAIN MENU */}
        <Text style={styles.sectionHeader}>MAIN MENU</Text>
        <DrawerItem label="Dashboard" iconName="home" routeName="Dashboard" />
        
        {/* Projects & Work Sites Collapsible Menu */}
        <TouchableOpacity 
          style={[styles.drawerItem, (currentRoute === 'Project Management' || currentRoute === 'Work Sites') && styles.activeDrawerItem]}
          onPress={() => setIsProjectsOpen(!isProjectsOpen)}
        >
          <Feather 
            name="briefcase" 
            size={20} 
            color={(currentRoute === 'Project Management' || currentRoute === 'Work Sites') ? '#10B981' : '#64748B'} 
            style={styles.drawerIcon} 
          />
          <Text style={[styles.drawerLabel, (currentRoute === 'Project Management' || currentRoute === 'Work Sites') && styles.activeDrawerLabel, { flex: 1 }]}>
            Projects & Work sites
          </Text>
          <Feather 
            name={isProjectsOpen ? 'chevron-down' : 'chevron-right'} 
            size={16} 
            color="#64748B" 
          />
        </TouchableOpacity>

        {isProjectsOpen && (
          <View style={{ paddingLeft: 32, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 4 }}>
            <TouchableOpacity 
              style={styles.subDrawerItem} 
              onPress={() => props.navigation.navigate('Project Management')}
            >
              <Feather name="briefcase" size={16} color={currentRoute === 'Project Management' ? '#10B981' : '#64748B'} style={{ marginRight: 12 }} />
              <Text style={[styles.subDrawerLabel, currentRoute === 'Project Management' && styles.activeDrawerLabel]}>Projects</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.subDrawerItem} 
              onPress={() => props.navigation.navigate('Work Sites')}
            >
              <Feather name="map-pin" size={16} color={currentRoute === 'Work Sites' ? '#10B981' : '#64748B'} style={{ marginRight: 12 }} />
              <Text style={[styles.subDrawerLabel, currentRoute === 'Work Sites' && styles.activeDrawerLabel]}>Work Sites</Text>
            </TouchableOpacity>
          </View>
        )}

        <DrawerItem label="Access & Controls" iconName="shield" routeName="Access Controls" />
        <DrawerItem label="HR" iconName="users" routeName="HR" />
        {(isAdmin || isHR) && (
          <DrawerItem label="Attendance Tracker" iconName="clock" routeName="Attendance Tracker" />
        )}
        {canAccessDivisions && (
          <DrawerItem label="Divisions" iconName="map" routeName="Divisions" />
        )}
        {(isAdmin || isHR) && (
          <DrawerItem label="Team" iconName="users" routeName="Team" />
        )}

        {/* ADMIN ONLY RESTRICTED MENU */}
        <View style={styles.divider} />

        <Text style={styles.sectionHeader}>PREFERENCES</Text>
        <DrawerItem label="Profile" iconName="user" routeName="Profile" />
        <DrawerItem label="Settings" iconName="settings" routeName="Settings" />
        {/* Log Out Item inside side navigation ScrollView */}
        <View style={{ marginTop: 8, marginBottom: Math.max(insets.bottom, 20) }}>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Feather name="log-out" size={20} color="#EF4444" style={styles.drawerIcon} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function DashboardWrapper(props: any) {
  const [userType, setUserType] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [dept, setDept] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety unblock fallback: Force loading to complete after 2 seconds max
    const fallbackTimer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    const checkRole = async () => {
      const user = getAuth().currentUser;
      if (!user) {
        setLoading(false);
        clearTimeout(fallbackTimer);
        return;
      }
      try {
        const mobile = user.phoneNumber || '';
        const email = user.email || '';
        const res = await mobileApiFetch(`/api/tenant/profile/${user.uid}?mobile=${encodeURIComponent(mobile)}&email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          setUserType(data.userType);
          setRole(data.designation);
          setDept(data.department);
        }
      } catch (err) {
        console.error('Error fetching role in wrapper:', err);
      } finally {
        setLoading(false);
        clearTimeout(fallbackTimer);
      }
    };
    checkRole();
    return () => clearTimeout(fallbackTimer);
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFA' }}>
        <ActivityIndicator size="large" color="#0F172A" />
      </View>
    );
  }

  if (userType === 'team_member') {
    const isHR =
      String(dept).toUpperCase().includes('HR') ||
      String(dept).toUpperCase().includes('HUMAN RES') ||
      String(role).toUpperCase().includes('HR') ||
      String(role).toUpperCase().includes('HUMAN RES');

    if (isHR) {
      return <HRDashboardScreen {...props} />;
    }
    return <EmployeeDashboardScreen {...props} />;
  }

  return <TabNavigator {...props} />;
}

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: 280, // Reduced width
          backgroundColor: '#ffffff',
        },
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardWrapper} />
      <Drawer.Screen name="Team" component={TeamScreen} />

      {/* 7 Core Modules -> Pointing to Coming Soon for now */}
      <Drawer.Screen name="Client Portal" component={ModuleComingSoonScreen} />
      <Drawer.Screen name="Vendor Operations" component={ModuleComingSoonScreen} />
      <Drawer.Screen name="Material Management" component={ModuleComingSoonScreen} />
      <Drawer.Screen name="Labor Management" component={ModuleComingSoonScreen} />
      <Drawer.Screen name="Project Management" component={ProjectsScreen} />
      <Drawer.Screen name="Work Sites" component={WorkSitesScreen} />
      <Drawer.Screen name="Access Controls" component={AccessControlsScreen} />
      <Drawer.Screen name="HR" component={HRScreen} />
      <Drawer.Screen name="Attendance Tracker" component={AttendanceTrackerScreen} />
      <Drawer.Screen name="Divisions" component={DivisionsScreen} />
      <Drawer.Screen name="Sub-Contractors" component={ModuleComingSoonScreen} />

      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    backgroundColor: '#F8FAFC', // Premium off-white satin tint
    paddingHorizontal: 24,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0', // Sleek border
  },
  avatarContainer: {
    backgroundColor: '#FFFFFF',
    width: 60,
    height: 60,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  companyLogo: {
    width: 38,
    height: 38,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: 'Geist',
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  userRole: {
    fontFamily: 'Geist',
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  companyNameText: {
    fontFamily: 'Geist',
    fontSize: 10,
    fontWeight: '900',
    color: '#10B981', // Emerald green brand color
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  idBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  idBadgeText: {
    fontFamily: 'Geist',
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginLeft: 10,
    marginRight: 4,
  },
  activeText: {
    fontFamily: 'Geist',
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  projectSelectorContainer: {
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
  },
  projectSelectorLabel: {
    fontFamily: 'Geist',
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  projectPickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  projectIcon: {
    marginRight: 4,
  },
  projectPicker: {
    flex: 1,
    height: 44,
    color: '#1E293B',
    fontFamily: 'Geist',
  },
  scrollArea: {
    flex: 1,
  },
  sectionHeader: {
    fontFamily: 'Geist',
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.2,
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 12,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  activeDrawerItem: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderLeftColor: '#10B981',
  },
  drawerIcon: {
    marginRight: 16,
  },
  drawerLabel: {
    fontFamily: 'Geist',
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  activeDrawerLabel: {
    color: '#10B981',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 24,
    marginTop: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  logoutText: {
    fontFamily: 'Geist',
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 16,
  },
  subDrawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 12,
  },
  subDrawerLabel: {
    fontFamily: 'Geist',
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
});

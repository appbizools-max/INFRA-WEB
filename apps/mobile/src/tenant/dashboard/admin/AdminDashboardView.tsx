import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Project {
  id: string;
  name: string;
  location: string;
  locationBlock?: string;
  status: string;
}

interface ProfileData {
  adminName: string;
  companyName: string;
  industryType: string;
  companySize?: string;
  companyWebsite?: string;
  gstNumber?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  designation: string;
  email: string;
}

interface AdminDashboardViewProps {
  profile: ProfileData;
  pinnedProjects: Project[];
  navigation: any;
}

export default function AdminDashboardView({ profile, pinnedProjects, navigation }: AdminDashboardViewProps) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>Welcome back, {profile.adminName}!</Text>
        <Text style={styles.welcomeSubtitle}>Managing operations for {profile.companyName}</Text>
      </View>

      <Text style={styles.sectionLabel}>Company Information</Text>
      <View style={styles.card}>
        <DashboardRow icon="business-outline" label="Company Name" value={profile.companyName} />
        <DashboardRow icon="pricetag-outline" label="Industry Type" value={profile.industryType} />
        <DashboardRow icon="people-outline" label="Company Size" value={profile.companySize || 'Not Provided'} />
        <DashboardRow icon="globe-outline" label="Website" value={profile.companyWebsite || 'Not Provided'} />
        <DashboardRow icon="document-text-outline" label="GST Number" value={profile.gstNumber || 'Not Provided'} />
      </View>

      <Text style={styles.sectionLabel}>Location &amp; Plan</Text>
      <View style={styles.card}>
        <DashboardRow icon="map-outline" label="City &amp; State" value={`${profile.city}, ${profile.state}`} />
        <DashboardRow icon="globe-outline" label="Country" value={profile.country} />
        <DashboardRow icon="pin-outline" label="Pincode" value={profile.pincode} />
        <DashboardRow icon="card-outline" label="Subscription Plan" value="14-Day Free Trial" />
      </View>

      {/* PINNED PROJECTS SECTION */}
      <View style={[styles.sectionHeader, { marginTop: 12 }]}>
        <Text style={styles.sectionLabel}>Pinned Projects</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Projects')}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {pinnedProjects.length > 0 ? (
        <View style={styles.pinnedProjectsContainer}>
          {pinnedProjects.map(project => (
            <TouchableOpacity
              key={project.id}
              style={styles.pinnedProjectCard}
              onPress={() => navigation.navigate('Projects')}
            >
              <View style={styles.pinnedProjectHeader}>
                <View style={styles.pinnedProjectIdBadge}>
                  <Text style={styles.pinnedProjectIdText}>{project.id}</Text>
                </View>
                <View style={[styles.pinnedProjectStatusBadge, {
                  backgroundColor: project.status === 'Active' ? '#ECFDF5' :
                    project.status === 'Completed' ? '#EFF6FF' :
                      project.status === 'Planning' ? '#FFFBEB' : '#FEF2F2'
                }]}>
                  <Text style={[styles.pinnedProjectStatusText, {
                    color: project.status === 'Active' ? '#059669' :
                      project.status === 'Completed' ? '#2563EB' :
                        project.status === 'Planning' ? '#D97706' : '#DC2626'
                  }]}>{project.status}</Text>
                </View>
              </View>
              <Text style={styles.pinnedProjectName} numberOfLines={1}>{project.name}</Text>
              <View style={styles.pinnedProjectFooter}>
                <Feather name="map-pin" size={12} color="#64748B" />
                <Text style={styles.pinnedProjectLocation} numberOfLines={1}>
                  {project.location} {project.locationBlock ? `(${project.locationBlock})` : ''}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyPinnedState}>
          <View style={styles.emptyPinnedIcon}>
            <Feather name="paperclip" size={24} color="#94A3B8" />
          </View>
          <Text style={styles.emptyPinnedTitle}>No pinned projects</Text>
          <Text style={styles.emptyPinnedSub}>Pin your most important projects from the Projects tab to see them here.</Text>
          <TouchableOpacity
            style={styles.emptyPinnedBtn}
            onPress={() => navigation.navigate('Projects')}
          >
            <Text style={styles.emptyPinnedBtnText}>Go to Projects</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* TRIAL BANNER */}
      <LinearGradient colors={['#001538', '#000A1C']} style={styles.trialBanner}>
        <View style={styles.trialContent}>
          <View style={styles.shieldIcon}>
            <Ionicons name="shield-checkmark-outline" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.trialTexts}>
            <Text style={styles.trialTitle}>14-Day Free Trial</Text>
            <Text style={styles.trialSubtitle}>7 Days Remaining</Text>
          </View>
          <TouchableOpacity style={styles.upgradeBtn}>
            <Text style={styles.upgradeBtnText}>Upgrade</Text>
            <Ionicons name="arrow-forward" size={16} color="#001538" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </ScrollView>
  );
}

const DashboardRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <View style={styles.dashboardRow}>
    <Ionicons name={icon as any} size={18} color="#1E3A8A" style={styles.dashboardRowIcon} />
    <View style={styles.dashboardRowText}>
      <Text style={styles.dashboardRowLabel}>{label}</Text>
      <Text style={styles.dashboardRowValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#64748B',
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  dashboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dashboardRowIcon: {
    marginRight: 14,
  },
  dashboardRowText: {
    flex: 1,
  },
  dashboardRowLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  dashboardRowValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2,
  },
  pinnedProjectsContainer: {
    marginBottom: 20,
  },
  pinnedProjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 12,
  },
  pinnedProjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pinnedProjectIdBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pinnedProjectIdText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
  },
  pinnedProjectStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pinnedProjectStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  pinnedProjectName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1E293B',
    marginTop: 12,
  },
  pinnedProjectFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  pinnedProjectLocation: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyPinnedState: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyPinnedIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  emptyPinnedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 4,
  },
  emptyPinnedSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  emptyPinnedBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyPinnedBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  trialBanner: {
    borderRadius: 16,
    padding: 16,
  },
  trialContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shieldIcon: {
    marginRight: 12,
  },
  trialTexts: {
    flex: 1,
  },
  trialTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  trialSubtitle: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 2,
    fontWeight: '600',
  },
  upgradeBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#001538',
  },
});

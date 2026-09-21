import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiFetch } from '../../../lib/api';
import {
  ShieldCheck, Plus, Search, Edit3, Trash2, Users, CheckCircle2,
  AlertCircle, X, ChevronRight, Briefcase, Building2, Layers, ArrowUpDown, Filter, Sparkles,
  Lock, Unlock, Key, Eye, EyeOff, MapPin, Truck, HardHat, FileText, Check,
  Settings, Sliders, Shield, Navigation, Compass, LayoutDashboard, Database,
  CheckSquare, Square, ArrowRight, RefreshCw, Zap, ShieldAlert, Cpu,
  LayoutGrid, Table, User, UserCog, UserCheck, SlidersHorizontal
} from 'lucide-react';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  mobile: string;
  status: string;
  member_id: string;
  firebase_uid?: string;
  permissions?: Record<string, any>;
  allowed_modules?: string[];
  landing_module?: string;
}

export interface Role {
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

export interface ModuleDef {
  id: string;
  name: string;
  category: 'Core Operations' | 'Field & Logistics' | 'Administration';
  badge: string;
  description: string;
  icon: any;
  accent: string;
  features: { key: string; label: string }[];
}

const SYSTEM_MODULES: ModuleDef[] = [
  {
    id: 'projects',
    name: 'Projects & Contracts',
    category: 'Core Operations',
    badge: 'OPS-CORE',
    description: 'Project scopes, work packages, milestones and client contract execution.',
    icon: Briefcase,
    accent: 'text-blue-500 bg-blue-50 border-blue-200',
    features: [
      { key: 'view', label: 'View Project Details & Scope' },
      { key: 'create', label: 'Create New Projects' },
      { key: 'edit', label: 'Update Milestones & Scope' },
      { key: 'site_orders', label: 'Manage Site Work Packages' }
    ]
  },
  {
    id: 'worksites',
    name: 'Worksites & Site Entry',
    category: 'Core Operations',
    badge: 'SITE-GATE',
    description: 'Physical construction sites, geofenced boundaries, gate check-in & muster.',
    icon: MapPin,
    accent: 'text-amber-500 bg-amber-50 border-amber-200',
    features: [
      { key: 'view', label: 'View Worksites & Geofences' },
      { key: 'enter_site', label: 'Physical Site Entry Gate Pass' },
      { key: 'geofence_verify', label: 'Enforce GPS Geofence Verification' },
      { key: 'daily_log', label: 'Submit Daily Shift Log' }
    ]
  },
  {
    id: 'fms',
    name: 'Fleet & Machinery (FMS)',
    category: 'Field & Logistics',
    badge: 'FMS-FLEET',
    description: 'Heavy equipment fleet, machine tracking, allocation and maintenance.',
    icon: Truck,
    accent: 'text-indigo-500 bg-indigo-50 border-indigo-200',
    features: [
      { key: 'view', label: 'View Machinery & Vehicles' },
      { key: 'dispatch', label: 'Dispatch Assets to Site' },
      { key: 'machinery', label: 'Manage Maintenance Schedules' },
      { key: 'fuel_approval', label: 'Approve Fuel Slips' }
    ]
  },
  {
    id: 'fms_driver',
    name: 'Driver & Transit Console',
    category: 'Field & Logistics',
    badge: 'DRIVER-APP',
    description: 'Driver vehicle dashboard, start/stop trips, odometer readings and trip sheets.',
    icon: Compass,
    accent: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    features: [
      { key: 'vehicle_sheet', label: 'Assigned Vehicle Daily Sheet' },
      { key: 'start_trip', label: 'Start / Complete Site Trips' },
      { key: 'log_odometer', label: 'Record Odometer Readings' }
    ]
  },
  {
    id: 'fms_machinery',
    name: 'Heavy Equipment & Cranes',
    category: 'Field & Logistics',
    badge: 'EQUIP-OPS',
    description: 'Operator shift logs, hour meter check-ins, lift safety and breakdown reports.',
    icon: HardHat,
    accent: 'text-orange-500 bg-orange-50 border-orange-200',
    features: [
      { key: 'machine_sheet', label: 'Machine Shift Checklist' },
      { key: 'record_hours', label: 'Log Hour Meter Readings' },
      { key: 'log_breakdown', label: 'Report Machine Breakdowns' },
      { key: 'lift_permits', label: 'Lifting Safety Checklist' }
    ]
  },
  {
    id: 'fuel_logs',
    name: 'Fuel Slips & Expenses',
    category: 'Field & Logistics',
    badge: 'FUEL-EXP',
    description: 'Fuel vouchers, petrol pump receipts, liters pumped & site fuel accounts.',
    icon: Sliders,
    accent: 'text-emerald-500 bg-emerald-50 border-emerald-200',
    features: [
      { key: 'view', label: 'View Fuel Consumption' },
      { key: 'submit_receipt', label: 'Submit Fuel Receipts' }
    ]
  },
  {
    id: 'workforce',
    name: 'Workforce & Attendance',
    category: 'Core Operations',
    badge: 'HR-FIELD',
    description: 'Site staff directory, QR check-in, muster rolls & operator crew assignments.',
    icon: Users,
    accent: 'text-purple-500 bg-purple-50 border-purple-200',
    features: [
      { key: 'view', label: 'View Site Team Directory' },
      { key: 'muster_roll', label: 'Daily Shift Muster Roll' },
      { key: 'punch_in', label: 'Self Attendance / QR Punch' },
      { key: 'allocate_site', label: 'Assign Operators to Site' }
    ]
  },
  {
    id: 'accounts',
    name: 'Finance & Invoicing',
    category: 'Administration',
    badge: 'FIN-AUDIT',
    description: 'Client invoices, milestone billings, expense vouchers and vendor ledgers.',
    icon: Database,
    accent: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    features: [
      { key: 'view', label: 'View Invoices & Billing' },
      { key: 'create_invoice', label: 'Generate Client Invoices' },
      { key: 'approve_payments', label: 'Approve Payment Requests' }
    ]
  },
  {
    id: 'hr',
    name: 'HR & People Operations',
    category: 'Administration',
    badge: 'HR-ADMIN',
    description: 'Personnel recruitment, KYC compliance, onboarding and policy records.',
    icon: ShieldCheck,
    accent: 'text-pink-500 bg-pink-50 border-pink-200',
    features: [
      { key: 'view', label: 'View Staff Records' },
      { key: 'onboarding', label: 'Process Onboarding & KYC' },
      { key: 'leave_approval', label: 'Approve Leave Requests' }
    ]
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    category: 'Administration',
    badge: 'EXEC-DPR',
    description: 'Daily Progress Reports (DPR), machine utilization, trip logs & audit exports.',
    icon: FileText,
    accent: 'text-slate-600 bg-slate-50 border-slate-200',
    features: [
      { key: 'view', label: 'View Reports & Dashboards' },
      { key: 'export', label: 'Export to Excel / PDF' }
    ]
  }
];

const LANDING_OPTIONS = [
  { value: 'dashboard', label: 'General Dashboard' },
  { value: 'projects', label: 'Projects Space' },
  { value: 'worksites', label: 'Worksite Console' },
  { value: 'fms_driver', label: 'Driver Console' },
  { value: 'fms_machinery', label: 'Equipment Console' },
  { value: 'workforce', label: 'Attendance Roll' },
  { value: 'reports', label: 'Reports & DPR' }
];

const getCompactLandingLabel = (val?: string) => {
  switch (val) {
    case 'fms_driver': return 'Driver Console';
    case 'fms_machinery': return 'Equipment Console';
    case 'worksites': return 'Worksite Console';
    case 'projects': return 'Projects Space';
    case 'workforce': return 'Attendance';
    case 'reports': return 'Reports';
    default: return 'Dashboard';
  }
};

const getModuleShortName = (id: string) => {
  switch (id) {
    case 'projects': return 'Projects';
    case 'worksites': return 'Worksites';
    case 'fms': return 'Fleet';
    case 'fms_driver': return 'Driver';
    case 'fms_machinery': return 'Equipment';
    case 'fuel_logs': return 'Fuel';
    case 'workforce': return 'Workforce';
    case 'accounts': return 'Finance';
    case 'hr': return 'HR';
    case 'reports': return 'Reports';
    case 'hour_meter': return 'Hours';
    case 'lift_permits': return 'Permits';
    case 'trips': return 'Trips';
    case 'attendance': return 'Muster';
    default: return id.replace(/_/g, ' ');
  }
};

const DEPARTMENT_STANDARD_ROLES: Record<string, Array<{
  name: string;
  description: string;
  access_level: string;
  landing_module: string;
  allowed_modules: string[];
}>> = {
  'Operational Staff': [
    {
      name: 'Operations Manager',
      description: 'Head of site operations, project timelines, and execution',
      access_level: 'Executive',
      landing_module: 'projects',
      allowed_modules: ['projects', 'worksites', 'fms', 'workforce', 'reports']
    },
    {
      name: 'Operations Supervisor',
      description: 'Direct operations supervision, worker oversight, and daily shift coordination',
      access_level: 'Operational',
      landing_module: 'worksites',
      allowed_modules: ['worksites', 'fms', 'workforce']
    },
    {
      name: 'Site Incharge',
      description: 'Site-level leadership, resource allocation, and progress reporting',
      access_level: 'Managerial',
      landing_module: 'worksites',
      allowed_modules: ['projects', 'worksites', 'fms', 'workforce', 'reports']
    }
  ],
  'FMS': [
    {
      name: 'Driver',
      description: 'Tipper, dumper, and commercial transit vehicle operation',
      access_level: 'Operational',
      landing_module: 'fms_driver',
      allowed_modules: ['fms_driver', 'fuel_logs']
    },
    {
      name: 'Site Supervisor',
      description: 'Site equipment supervisor, machine allocation, and fleet oversight',
      access_level: 'Operational',
      landing_module: 'worksites',
      allowed_modules: ['worksites', 'fms', 'fuel_logs']
    },
    {
      name: 'Dozer Operator',
      description: 'Heavy bulldozer, grader, loader, and earthmoving machine operations',
      access_level: 'Operational',
      landing_module: 'fms_machinery',
      allowed_modules: ['fms_machinery', 'hour_meter', 'fuel_logs']
    },
    {
      name: 'Crane Operator',
      description: 'Heavy mobile crane and boom lift lifting operations',
      access_level: 'Operational',
      landing_module: 'fms_machinery',
      allowed_modules: ['fms_machinery', 'hour_meter', 'lift_permits']
    }
  ]
};

export default function RolesPage() {
  const { currentUser } = useAuth();

  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [accessMode, setAccessMode] = useState<'roles' | 'employees'>('roles');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [permissionsModalMember, setPermissionsModalMember] = useState<TeamMember | null>(null);

  const [deptFilter, setDeptFilter] = useState('All');
  const [accessFilter, setAccessFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'members' | 'newest'>('name');
  const [viewMode, setViewMode] = useState<'cards' | 'matrix'>('cards');

  // Add / Edit Role Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [isNewDeptMode, setIsNewDeptMode] = useState(false);
  const [customDeptName, setCustomDeptName] = useState('');
  const [selectedRolePreset, setSelectedRolePreset] = useState<string>('custom');
  const [description, setDescription] = useState('');
  const [accessLevel, setAccessLevel] = useState('Standard');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Access Control & Permissions Drawer / Modal
  const [permissionsModalRole, setPermissionsModalRole] = useState<Role | null>(null);
  const [permAllowedModules, setPermAllowedModules] = useState<string[]>([]);
  const [permFeatureObj, setPermFeatureObj] = useState<Record<string, any>>({});
  const [permLandingModule, setPermLandingModule] = useState<string>('dashboard');
  const [permSiteEntry, setPermSiteEntry] = useState<boolean>(true);
  const [permGeofenceEnforced, setPermGeofenceEnforced] = useState<boolean>(true);
  const [savingPerms, setSavingPerms] = useState(false);
  const [permSuccessMsg, setPermSuccessMsg] = useState<string | null>(null);

  // Delete State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const [rolesRes, deptsRes, teamRes] = await Promise.all([
        apiFetch(`/api/tenant/roles/${currentUser.uid}`),
        apiFetch(`/api/tenant/departments/${currentUser.uid}`),
        apiFetch(`/api/tenant/team/${currentUser.uid}`)
      ]);

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(Array.isArray(rolesData) ? rolesData : (rolesData.roles || []));
      }
      if (deptsRes.ok) {
        const deptsData = await deptsRes.json();
        setDepartments(Array.isArray(deptsData) ? deptsData : (deptsData.departments || []));
      }
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setTeamMembers(Array.isArray(teamData) ? teamData : (teamData.team || []));
      }
    } catch (err) {
      console.error('Failed to load roles, departments or team:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const handleOpenAddModal = () => {
    setEditingRole(null);
    const defaultDept = 'Operational Staff';
    setDepartment(defaultDept);
    const stdRoles = DEPARTMENT_STANDARD_ROLES[defaultDept];
    if (stdRoles && stdRoles.length > 0) {
      setSelectedRolePreset(stdRoles[0].name);
      setName(stdRoles[0].name);
      setDescription(stdRoles[0].description);
      setAccessLevel(stdRoles[0].access_level);
    } else {
      setSelectedRolePreset('custom');
      setName('');
      setDescription('');
      setAccessLevel('Operational');
    }
    setIsNewDeptMode(false);
    setCustomDeptName('');
    setStatus('Active');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (role: Role) => {
    setEditingRole(role);
    setName(role.name);
    const dept = role.department || '';
    setDepartment(dept);
    setDescription(role.description || '');
    setAccessLevel(role.access_level || 'Operational');
    setStatus(role.status || 'Active');

    setIsNewDeptMode(false);
    setCustomDeptName('');
    const stdList = DEPARTMENT_STANDARD_ROLES[dept] || [];
    const isStandard = stdList.some(r => r.name.toLowerCase() === role.name.toLowerCase());
    setSelectedRolePreset(isStandard ? role.name : 'custom');

    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenPermissions = (role: Role) => {
    setPermissionsModalMember(null);
    setPermissionsModalRole(role);
    setPermAllowedModules(role.allowed_modules || []);
    setPermFeatureObj(role.permissions || {});
    setPermLandingModule(role.landing_module || 'dashboard');

    const p = role.permissions || {};
    const siteSettings = p.worksites || {};
    setPermSiteEntry(siteSettings.enter_site !== false);
    setPermGeofenceEnforced(siteSettings.geofence_verify !== false);
    setPermSuccessMsg(null);
  };

  const handleOpenMemberPermissions = (member: TeamMember) => {
    const roleObj = roles.find(r => r.name.toLowerCase() === (member.role || '').toLowerCase());
    setPermissionsModalRole(null);
    setPermissionsModalMember(member);

    const effectiveAllowed = (member.allowed_modules && member.allowed_modules.length > 0)
      ? member.allowed_modules
      : (roleObj?.allowed_modules || []);
    const effectivePerms = member.permissions && Object.keys(member.permissions).length > 0
      ? member.permissions
      : (roleObj?.permissions || {});
    const effectiveLanding = member.landing_module || roleObj?.landing_module || 'dashboard';

    setPermAllowedModules(effectiveAllowed);
    setPermFeatureObj(effectivePerms);
    setPermLandingModule(effectiveLanding);

    const siteSettings = effectivePerms.worksites || {};
    setPermSiteEntry(siteSettings.enter_site !== false);
    setPermGeofenceEnforced(siteSettings.geofence_verify !== false);
    setPermSuccessMsg(null);
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    const matchingRole = roles.find(r => r.name.toLowerCase() === newRole.toLowerCase());
    const newDept = matchingRole?.department || undefined;

    try {
      setUpdatingMemberId(memberId);
      const res = await apiFetch(`/api/tenant/team/${memberId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({
          role: newRole,
          department: newDept
        })
      });
      if (res.ok) {
        setTeamMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole, department: newDept || m.department } : m));
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update role');
      }
    } catch (e: any) {
      alert(e.message || 'Error updating role');
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !name.trim()) {
      setFormError('Role title is required');
      return;
    }

    const finalDept = isNewDeptMode ? customDeptName.trim() : department.trim();
    if (!finalDept) {
      setFormError('Department is required');
      return;
    }

    try {
      setSaving(true);
      setFormError(null);

      // If user created a new department on the fly, ensure it is recorded in tenant_departments
      if (isNewDeptMode && customDeptName.trim()) {
        await apiFetch('/api/tenant/departments', {
          method: 'POST',
          body: JSON.stringify({
            userUid: currentUser.uid,
            name: finalDept,
            code: finalDept.substring(0, 5).toUpperCase(),
            description: 'Department created via Roles Management'
          })
        }).catch(err => console.warn('Dept creation fallback:', err));
      }

      const payload = {
        userUid: currentUser.uid,
        name: name.trim(),
        department: finalDept,
        description: description.trim() || null,
        access_level: accessLevel,
        status
      };

      let res: Response;
      if (editingRole) {
        res = await apiFetch(`/api/tenant/roles/${editingRole.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiFetch(`/api/tenant/roles`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save role');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!currentUser || (!permissionsModalRole && !permissionsModalMember)) return;
    try {
      setSavingPerms(true);
      setPermSuccessMsg(null);

      const updatedPermissions = {
        ...permFeatureObj,
        worksites: {
          ...(permFeatureObj.worksites || {}),
          enter_site: permSiteEntry,
          geofence_verify: permGeofenceEnforced
        }
      };

      if (permissionsModalMember) {
        const res = await apiFetch(`/api/tenant/team/${permissionsModalMember.id}/permissions`, {
          method: 'PATCH',
          body: JSON.stringify({
            allowed_modules: permAllowedModules,
            permissions: updatedPermissions,
            landing_module: permLandingModule
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to save individual permissions');
        }

        const data = await res.json();
        setPermSuccessMsg('Personal access policy & gates saved!');
        setTeamMembers(prev => prev.map(m => m.id === permissionsModalMember.id ? { ...m, ...data.member } : m));
        setTimeout(() => {
          setPermissionsModalMember(null);
          setPermSuccessMsg(null);
        }, 900);
      } else if (permissionsModalRole) {
        const res = await apiFetch(`/api/tenant/roles/${permissionsModalRole.id}/permissions`, {
          method: 'PATCH',
          body: JSON.stringify({
            userUid: currentUser.uid,
            allowed_modules: permAllowedModules,
            permissions: updatedPermissions,
            landing_module: permLandingModule
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to save permissions');
        }

        const data = await res.json();
        setPermSuccessMsg('Access control and module policy saved!');
        setRoles(prev => prev.map(r => r.id === permissionsModalRole.id ? { ...r, ...data.role } : r));
        setTimeout(() => {
          setPermissionsModalRole(null);
          setPermSuccessMsg(null);
        }, 900);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save permissions');
    } finally {
      setSavingPerms(false);
    }
  };

  const handleApplyPreset = (presetType: 'driver' | 'incharge' | 'executive' | 'operator' | 'helper') => {
    if (presetType === 'driver') {
      setPermAllowedModules(['fms_driver', 'fuel_logs']);
      setPermLandingModule('fms_driver');
      setPermSiteEntry(true);
      setPermGeofenceEnforced(true);
      setPermFeatureObj({
        fms_driver: { vehicle_sheet: true, start_trip: true, log_odometer: true },
        fuel_logs: { submit_receipt: true }
      });
    } else if (presetType === 'operator') {
      setPermAllowedModules(['fms_machinery', 'fuel_logs']);
      setPermLandingModule('fms_machinery');
      setPermSiteEntry(true);
      setPermGeofenceEnforced(true);
      setPermFeatureObj({
        fms_machinery: { machine_sheet: true, record_hours: true, log_breakdown: true, lift_permits: true },
        fuel_logs: { submit_receipt: true }
      });
    } else if (presetType === 'incharge') {
      setPermAllowedModules(['projects', 'worksites', 'fms', 'workforce', 'reports']);
      setPermLandingModule('worksites');
      setPermSiteEntry(true);
      setPermGeofenceEnforced(true);
      setPermFeatureObj({
        projects: { view: true, site_orders: true },
        worksites: { view: true, enter_site: true, geofence_verify: true, daily_log: true },
        fms: { view: true, machinery: true },
        workforce: { view: true, muster_roll: true, allocate_site: true },
        reports: { view: true, export: true }
      });
    } else if (presetType === 'executive') {
      setPermAllowedModules(['projects', 'worksites', 'fms', 'workforce', 'accounts', 'reports']);
      setPermLandingModule('projects');
      setPermSiteEntry(true);
      setPermGeofenceEnforced(false);
      setPermFeatureObj({
        projects: { view: true, create: true, edit: true, site_orders: true },
        worksites: { view: true, enter_site: true, daily_log: true },
        fms: { view: true, dispatch: true, machinery: true, fuel_approval: true },
        workforce: { view: true, muster_roll: true, allocate_site: true },
        accounts: { view: true, create_invoice: true },
        reports: { view: true, export: true }
      });
    } else if (presetType === 'helper') {
      setPermAllowedModules(['worksites', 'workforce']);
      setPermLandingModule('worksites');
      setPermSiteEntry(true);
      setPermGeofenceEnforced(true);
      setPermFeatureObj({
        worksites: { enter_site: true },
        workforce: { punch_in: true }
      });
    }
  };

  const toggleModuleAccess = (modId: string) => {
    setPermAllowedModules(prev => {
      if (prev.includes(modId)) {
        return prev.filter(m => m !== modId);
      } else {
        return [...prev, modId];
      }
    });
  };

  const toggleFeaturePermission = (modId: string, featKey: string) => {
    setPermFeatureObj(prev => {
      const currentMod = prev[modId] || {};
      const updatedMod = {
        ...currentMod,
        [featKey]: !currentMod[featKey]
      };
      return {
        ...prev,
        [modId]: updatedMod
      };
    });
  };

  const handleDelete = async (id: string) => {
    if (!currentUser) return;
    try {
      setDeleting(true);
      const res = await apiFetch(`/api/tenant/roles/${id}?userUid=${currentUser.uid}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setDeleteConfirmId(null);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete role');
      }
    } catch (err) {
      console.error('Delete role error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const allDeptNames = Array.from(new Set([
    'Operational Staff',
    'FMS',
    ...departments.map(d => d.name),
    ...roles.map(r => r.department).filter(Boolean) as string[]
  ])).sort();

  const allRoleTitles = Array.from(new Set(roles.map(r => r.name))).sort();

  const getMemberEffectivePermissions = (member: TeamMember) => {
    const roleObj = roles.find(r => r.name.toLowerCase() === (member.role || '').toLowerCase());
    const allowed = (member.allowed_modules && member.allowed_modules.length > 0)
      ? member.allowed_modules
      : (roleObj?.allowed_modules || []);
    const permissions = (member.permissions && Object.keys(member.permissions).length > 0)
      ? member.permissions
      : (roleObj?.permissions || {});
    const landing = member.landing_module || roleObj?.landing_module || 'dashboard';
    const isSiteEntry = permissions?.worksites?.enter_site !== false;
    const hasCustomOverride = Boolean(
      (member.allowed_modules && member.allowed_modules.length > 0) ||
      (member.permissions && Object.keys(member.permissions).length > 0) ||
      member.landing_module
    );

    return { allowed, permissions, landing, isSiteEntry, hasCustomOverride, roleObj };
  };

  const filteredRoles = roles
    .filter(r => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.department && r.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDept = deptFilter === 'All' || r.department === deptFilter;
      return matchesSearch && matchesDept;
    })
    .sort((a, b) => {
      if (sortBy === 'members') return (b.member_count || 0) - (a.member_count || 0);
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return a.name.localeCompare(b.name);
    });

  const filteredEmployees = teamMembers
    .filter(m => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        m.name.toLowerCase().includes(q) ||
        (m.member_id && m.member_id.toLowerCase().includes(q)) ||
        (m.role && m.role.toLowerCase().includes(q)) ||
        (m.department && m.department.toLowerCase().includes(q)) ||
        (m.mobile && m.mobile.toLowerCase().includes(q));
      const matchesDept = deptFilter === 'All' || m.department === deptFilter;
      return matchesSearch && matchesDept;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return (b.member_id || '').localeCompare(a.member_id || '');
      return a.name.localeCompare(b.name);
    });

  const totalMembers = roles.reduce((acc, curr) => acc + (curr.member_count || 0), 0);
  const totalConfiguredPerms = roles.filter(r => (r.allowed_modules && r.allowed_modules.length > 0)).length;
  const totalAssignedStaff = teamMembers.filter(m => m.role && m.role.trim() !== '').length;
  const totalCustomStaffPerms = teamMembers.filter(m => (m.allowed_modules && m.allowed_modules.length > 0) || (m.permissions && Object.keys(m.permissions).length > 0) || m.landing_module).length;

  const getAccessBadgeClass = (level: string) => {
    switch (level) {
      case 'Executive':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Managerial':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Financial':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Technical':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Specialist':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Operational':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* ── Compact Executive Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0B132B] p-4 md:p-5 text-white shadow-md border border-slate-800">
        <div className="absolute -top-16 -right-16 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
              <ShieldCheck size={14} />
              <span>RBAC & Access Control Governance</span>
            </div>
            <h1 className="text-lg md:text-xl font-black tracking-tight text-white flex items-center gap-2">
              {accessMode === 'roles' ? 'Operational Roles & Access Control' : 'Staff Directory & Person-to-Person Access'}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              {accessMode === 'roles' 
                ? 'Manage corporate designations, login destinations, worksite gate passes, and module visibility.'
                : 'Directly reassign employee roles via live dropdowns and configure individual person-to-person gate passes.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Mode Switcher Buttons */}
            <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setAccessMode('roles');
                  setAccessFilter('All');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  accessMode === 'roles'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Shield size={13} />
                <span>By Roles (RBAC)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccessMode('employees');
                  setAccessFilter('All');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  accessMode === 'employees'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Users size={13} />
                <span>By Employee (Personal)</span>
              </button>
            </div>

            {accessMode === 'roles' && (
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-md transition-all hover:scale-102"
              >
                <Plus size={14} />
                <span>Define New Role</span>
              </button>
            )}
          </div>
        </div>

        {/* Compact KPI Strip */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-3.5 border-t border-slate-800/80">
          {accessMode === 'roles' ? (
            <>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Defined Roles</p>
                <p className="text-lg font-black text-white">{roles.length}</p>
                <p className="text-[10px] text-emerald-400 font-medium">Active titles</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Active Staff</p>
                <p className="text-lg font-black text-cyan-400">{totalMembers}</p>
                <p className="text-[10px] text-slate-400 font-medium">Assigned users</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Departments</p>
                <p className="text-lg font-black text-amber-400">{allDeptNames.length}</p>
                <p className="text-[10px] text-slate-400 font-medium">Covered units</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Access Governed</p>
                <p className="text-lg font-black text-emerald-400">{totalConfiguredPerms}</p>
                <p className="text-[10px] text-slate-400 font-medium">Custom gates</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total Personnel</p>
                <p className="text-lg font-black text-white">{teamMembers.length}</p>
                <p className="text-[10px] text-emerald-400 font-medium">Company workforce</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Roles Assigned</p>
                <p className="text-lg font-black text-cyan-400">{totalAssignedStaff}</p>
                <p className="text-[10px] text-slate-400 font-medium">With active title</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Departments</p>
                <p className="text-lg font-black text-amber-400">{allDeptNames.length}</p>
                <p className="text-[10px] text-slate-400 font-medium">Covered units</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Personal Overrides</p>
                <p className="text-lg font-black text-emerald-400">{totalCustomStaffPerms}</p>
                <p className="text-[10px] text-slate-400 font-medium">Custom gates/modules</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Compact Filter & Search Bar ── */}
      <div className="bg-white p-2.5 md:p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-2.5 justify-between items-center">
        {/* Compact Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder={accessMode === 'roles' ? "Search role, dept, duty..." : "Search staff name, ID, phone, role..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F172A] font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Access Mode Dropdown */}
          <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-800">
            <SlidersHorizontal size={12} className="text-slate-500" />
            <select
              value={accessMode}
              onChange={(e: any) => {
                setAccessMode(e.target.value);
                setAccessFilter('All');
              }}
              className="bg-transparent border-none focus:outline-none cursor-pointer text-slate-900 font-bold text-[11px]"
            >
              <option value="roles">Mode: By Role (RBAC)</option>
              <option value="employees">Mode: By Employee (Person-to-Person)</option>
            </select>
          </div>

          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-2.5 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-700 font-semibold"
          >
            <option value="All">All Departments</option>
            {allDeptNames.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Sort By */}
          <div className="flex items-center space-x-1 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-600">
            <ArrowUpDown size={12} className="text-slate-500" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent border-none focus:outline-none cursor-pointer text-slate-800 font-bold text-[11px]"
            >
              <option value="name">Name (A-Z)</option>
              {accessMode === 'roles' && <option value="members">Staff Count</option>}
              <option value="newest">Recent</option>
            </select>
          </div>

          {/* View Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 ${viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              <LayoutGrid size={12} />
              <span>Grid View</span>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 ${viewMode === 'matrix'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              <Table size={12} />
              <span>Table View</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="h-56 flex flex-col items-center justify-center space-y-2 bg-white rounded-xl border border-slate-200">
          <RefreshCw size={24} className="animate-spin text-emerald-600" />
          <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">Loading roles & permissions...</p>
        </div>
      ) : accessMode === 'roles' ? (
        /* ═════════════════════════════════════════════ */
        /* MODE 1: ROLE-BASED ACCESS CONTROL (RBAC)      */
        /* ═════════════════════════════════════════════ */
        filteredRoles.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <ShieldCheck size={36} className="text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">No roles match your criteria</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm mx-auto">
              Try adjusting your search query or filters
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          /* ── Roles Grid View ── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredRoles.map((role) => {
              const allowed = role.allowed_modules || [];
              const isSiteEntry = (role.permissions?.worksites?.enter_site !== false);

              return (
                <div
                  key={role.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between overflow-hidden group hover:border-slate-300"
                >
                  <div className="p-3.5 space-y-2.5">
                    {/* Title & Level */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-xs leading-snug group-hover:text-emerald-700 transition-colors">
                          {role.name}
                        </h3>
                        {role.department && (
                          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-500 font-semibold">
                            <Building2 size={11} className="text-emerald-600" />
                            <span>{role.department}</span>
                          </div>
                        )}
                      </div>

                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getAccessBadgeClass(
                          role.access_level
                        )}`}
                      >
                        {role.access_level}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {role.description || 'Standard corporate operational designation.'}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="bg-slate-50/70 px-3.5 py-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-[11px] text-slate-600 font-bold">
                      <Users size={12} className="text-emerald-600" />
                      <span>{role.member_count || 0} Staff</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleOpenPermissions(role)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold bg-[#0F172A] hover:bg-slate-800 text-white rounded-md shadow-2xs transition-colors"
                        title="Manage Access & Module Control"
                      >
                        <Lock size={10} className="text-emerald-400" />
                        <span>Access & Gates</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(role)}
                        className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 rounded-md transition-colors"
                        title="Edit"
                      >
                        <Edit3 size={13} />
                      </button>

                      <button
                        onClick={() => setDeleteConfirmId(role.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Roles Table View ── */
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs animate-fadeIn">
            <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-xs">System Access & Module Control Matrix</h3>
                <p className="text-[10px] text-slate-500">Live authorizations across all {SYSTEM_MODULES.length} modules</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider font-bold text-[9px] border-b border-slate-200">
                    <th className="py-2.5 px-3 sticky left-0 bg-slate-100 z-10">Role & Dept</th>
                    {SYSTEM_MODULES.map((m) => (
                      <th key={m.id} className="py-2.5 px-2 text-center whitespace-nowrap">
                        {m.name.split(' ')[0]}
                      </th>
                    ))}
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredRoles.map((role) => {
                    const allowed = role.allowed_modules || [];

                    return (
                      <tr key={role.id} className="hover:bg-slate-50/70 transition-colors text-[11px]">
                        <td className="py-2 px-3 sticky left-0 bg-white z-10 shadow-2xs">
                          <div className="font-bold text-slate-900 text-xs">{role.name}</div>
                          <div className="text-[9px] text-slate-400">{role.department || 'General'} • {role.access_level}</div>
                        </td>

                        {SYSTEM_MODULES.map((m) => {
                          const hasAccess = allowed.includes(m.id);
                          return (
                            <td key={m.id} className="py-2 px-2 text-center">
                              {hasAccess ? (
                                <div className="w-4 h-4 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                  <Check size={10} />
                                </div>
                              ) : (
                                <span className="text-slate-300 text-[10px]">•</span>
                              )}
                            </td>
                          );
                        })}

                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => handleOpenPermissions(role)}
                            className="px-2 py-0.5 text-[10px] font-bold bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors"
                          >
                            Configure
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* ═════════════════════════════════════════════ */
        /* MODE 2: EMPLOYEE-WISE ACCESS & PERSON OVERRIDE */
        /* ═════════════════════════════════════════════ */
        filteredEmployees.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <Users size={36} className="text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">No staff members found</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm mx-auto">
              Try adjusting your search query or department filter
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          /* ── Employee Grid View ── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredEmployees.map((m) => {
              const { allowed, landing, isSiteEntry, hasCustomOverride } = getMemberEffectivePermissions(m);
              const initials = m.name ? m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

              return (
                <div
                  key={m.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between overflow-hidden group hover:border-slate-300"
                >
                  <div className="p-3.5 space-y-3">
                    {/* Employee Header */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0 border border-slate-700">
                          {initials}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-xs leading-snug group-hover:text-emerald-700 transition-colors">
                            {m.name}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500 font-semibold">
                            <span className="font-mono text-slate-400 font-bold">{m.member_id || '#ID'}</span>
                            {m.department && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-700">{m.department}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {hasCustomOverride ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Personal Access
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                          Role Default
                        </span>
                      )}
                    </div>

                    {/* Fixed Assigned Role Display */}
                    <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Designation / Role
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-200 inline-flex items-center gap-1.5 shadow-2xs">
                            <Shield size={12} className="text-emerald-600" />
                            <span>{m.role || 'Unassigned Role'}</span>
                          </span>
                          {m.department && (
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {m.department}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="bg-slate-50/70 px-3.5 py-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium truncate max-w-[140px]">
                      {m.mobile || m.email || 'No contact'}
                    </span>

                    <button
                      onClick={() => handleOpenMemberPermissions(m)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-[#0F172A] hover:bg-slate-800 text-white rounded-md shadow-2xs transition-colors"
                    >
                      <Lock size={10} className="text-emerald-400" />
                      <span>Access & Gates</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Employee Table View ── */
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs animate-fadeIn">
            <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-xs">Employee Access & Personal Governance Directory</h3>
                <p className="text-[10px] text-slate-500">Corporate designations with individual gate authorizations and module access overrides</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 uppercase tracking-wider font-bold text-[9px] border-b border-slate-200">
                    <th className="py-2.5 px-3 sticky left-0 bg-slate-100 z-10">Staff Member</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Assigned Role</th>
                    <th className="py-2.5 px-2 text-center">Gate Pass</th>
                    <th className="py-2.5 px-2">Landing Screen</th>
                    <th className="py-2.5 px-3">Accessible Modules</th>
                    <th className="py-2.5 px-3 text-right">Personal Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredEmployees.map((m) => {
                    const { allowed, landing, isSiteEntry, hasCustomOverride } = getMemberEffectivePermissions(m);
                    const initials = m.name ? m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/70 transition-colors text-[11px]">
                        <td className="py-2 px-3 sticky left-0 bg-white z-10 shadow-2xs">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs">{m.name}</div>
                              <div className="text-[9px] text-slate-400 font-mono">{m.member_id || '#ID'} • {m.mobile || m.email || 'N/A'}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-2 px-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            <Building2 size={10} className="text-emerald-600" />
                            <span>{m.department || 'Unassigned'}</span>
                          </span>
                        </td>

                        <td className="py-2 px-3">
                          <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 text-xs bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200">
                            <Shield size={11} className="text-emerald-600" />
                            <span>{m.role || 'Unassigned Role'}</span>
                          </span>
                        </td>

                        <td className="py-2 px-2 text-center">
                          {isSiteEntry ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Pass
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Blocked
                            </span>
                          )}
                        </td>

                        <td className="py-2 px-2 text-[10px] font-bold text-slate-600 whitespace-nowrap">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[9px]">
                            {getCompactLandingLabel(landing)}
                          </span>
                        </td>

                        <td className="py-2 px-3">
                          <div className="flex flex-wrap items-center gap-1 max-w-xs">
                            {allowed.length > 0 ? (
                              <>
                                {allowed.slice(0, 3).map((modId) => (
                                  <span
                                    key={modId}
                                    className="text-[9px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded"
                                  >
                                    {getModuleShortName(modId)}
                                  </span>
                                ))}
                                {allowed.length > 3 && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded">
                                    +{allowed.length - 3}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-[9px] text-slate-400 italic">None</span>
                            )}
                          </div>
                        </td>

                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => handleOpenMemberPermissions(m)}
                            className="px-2.5 py-1 text-[10px] font-bold bg-[#0F172A] text-white rounded-md hover:bg-slate-800 transition-colors inline-flex items-center gap-1 shadow-2xs"
                          >
                            <Lock size={10} className="text-emerald-400" />
                            <span>Configure</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ── ACCESS CONTROL & PERMISSIONS DRAWER / MODAL ── */}
      {(permissionsModalRole || permissionsModalMember) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#0F172A] text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">
                      Access Control: {permissionsModalMember ? permissionsModalMember.name : permissionsModalRole?.name}
                    </h3>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {permissionsModalMember ? (permissionsModalMember.department || 'Staff') : (permissionsModalRole?.department || 'Operational')}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Configure login landing, site gate pass, and module visibility
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setPermissionsModalRole(null);
                  setPermissionsModalMember(null);
                  setPermSuccessMsg(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 md:p-5 overflow-y-auto space-y-4 flex-1">
              {permSuccessMsg && (
                <div className="bg-emerald-50 text-emerald-800 text-xs p-2.5 rounded-lg border border-emerald-200 flex items-center gap-1.5 font-bold animate-fadeIn">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                  <span>{permSuccessMsg}</span>
                </div>
              )}

              {/* 1-Click Role Presets */}
              <div>
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                  <Zap size={12} className="text-amber-500" />
                  <span>Quick Presets</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {[
                    { id: 'driver', label: 'Driver Console', icon: Truck, color: 'text-blue-600' },
                    { id: 'operator', label: 'Equipment & Crane', icon: HardHat, color: 'text-orange-600' },
                    { id: 'incharge', label: 'Site Incharge', icon: MapPin, color: 'text-amber-600' },
                    { id: 'executive', label: 'Operations Head', icon: Briefcase, color: 'text-purple-600' },
                    { id: 'helper', label: 'Site Helper', icon: Users, color: 'text-emerald-600' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleApplyPreset(p.id as any)}
                      className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-all"
                    >
                      <p className="font-bold text-[11px] text-slate-800">{p.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Landing & Gate Pass */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-3">
                <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <Navigation size={12} className="text-blue-600" />
                  <span>Login Screen & Site Gate Entry Pass</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Login Landing Screen
                    </label>
                    <select
                      value={permLandingModule}
                      onChange={(e) => setPermLandingModule(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none font-bold text-slate-800"
                    >
                      {LANDING_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Physical Site Gate</p>
                      <p className="text-[9px] text-slate-400">
                        {permSiteEntry ? 'Gate pass authorized' : 'Entry blocked'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPermSiteEntry(!permSiteEntry)}
                      className={`w-9 h-5 rounded-full transition-colors relative ${permSiteEntry ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${permSiteEntry ? 'translate-x-4' : 'translate-x-0.5'
                        }`} />
                    </button>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">GPS Geofence</p>
                      <p className="text-[9px] text-slate-400">
                        {permGeofenceEnforced ? 'Inside site polygon' : 'Remote enabled'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPermGeofenceEnforced(!permGeofenceEnforced)}
                      className={`w-9 h-5 rounded-full transition-colors relative ${permGeofenceEnforced ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${permGeofenceEnforced ? 'translate-x-4' : 'translate-x-0.5'
                        }`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Module Visibility Switches */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Layers size={12} className="text-emerald-600" />
                    <span>Module Permissions ({permAllowedModules.length}/{SYSTEM_MODULES.length})</span>
                  </h4>
                </div>

                <div className="space-y-2">
                  {SYSTEM_MODULES.map((mod) => {
                    const isModActive = permAllowedModules.includes(mod.id);
                    const modFeatConfig = permFeatureObj[mod.id] || {};
                    const IconComp = mod.icon;

                    return (
                      <div
                        key={mod.id}
                        className={`rounded-xl border transition-all ${isModActive
                            ? 'border-slate-300 bg-white shadow-2xs'
                            : 'border-slate-200 bg-slate-50/60 opacity-75'
                          }`}
                      >
                        <div className="p-3 flex items-center justify-between gap-2 border-b border-slate-100">
                          <div className="flex items-center space-x-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${mod.accent}`}>
                              <IconComp size={15} />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h5 className="font-bold text-slate-900 text-xs">{mod.name}</h5>
                                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-600">
                                  {mod.badge}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500">{mod.description}</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleModuleAccess(mod.id)}
                            className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${isModActive ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isModActive ? 'translate-x-4' : 'translate-x-0.5'
                              }`} />
                          </button>
                        </div>

                        {isModActive && (
                          <div className="p-2.5 bg-slate-50/50 rounded-b-xl">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {mod.features.map((feat) => {
                                const isChecked = modFeatConfig[feat.key] !== false;
                                return (
                                  <label
                                    key={feat.key}
                                    className="flex items-center space-x-2 text-[11px] text-slate-700 font-medium cursor-pointer p-1 rounded hover:bg-slate-100"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleFeaturePermission(mod.id, feat.key)}
                                      className="rounded text-emerald-600 w-3.5 h-3.5 cursor-pointer"
                                    />
                                    <span>{feat.label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 md:px-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500">Applies on staff next login.</span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setPermissionsModalRole(null);
                    setPermissionsModalMember(null);
                    setPermSuccessMsg(null);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  disabled={savingPerms}
                  className="px-4 py-1.5 text-xs font-bold bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg shadow-sm flex items-center gap-1"
                >
                  {savingPerms ? (
                    <RefreshCw size={13} className="animate-spin text-emerald-400" />
                  ) : (
                    <Check size={13} className="text-emerald-400" />
                  )}
                  <span>Save Policy</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Role Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#0F172A] text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ShieldCheck size={18} className="text-emerald-400" />
                <h3 className="font-bold text-sm text-white">
                  {editingRole ? 'Edit Designation' : 'New Designation'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="p-4 space-y-3">
              {formError && (
                <div className="bg-rose-50 text-rose-700 text-xs p-2 rounded-lg border border-rose-200 flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase">
                      Department *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewDeptMode(!isNewDeptMode);
                        if (!isNewDeptMode) setCustomDeptName('');
                      }}
                      className="text-[9px] font-bold text-emerald-600 hover:text-emerald-800"
                    >
                      {isNewDeptMode ? '← Select Standard' : '+ New Department'}
                    </button>
                  </div>

                  {isNewDeptMode ? (
                    <input
                      type="text"
                      required
                      placeholder="Enter new department name..."
                      value={customDeptName}
                      onChange={(e) => {
                        setCustomDeptName(e.target.value);
                        setSelectedRolePreset('custom');
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none font-semibold text-slate-800"
                    />
                  ) : (
                    <select
                      value={department}
                      onChange={(e) => {
                        const newDept = e.target.value;
                        if (newDept === '__new_dept__') {
                          setIsNewDeptMode(true);
                          setCustomDeptName('');
                          setSelectedRolePreset('custom');
                          return;
                        }
                        setDepartment(newDept);
                        const stdList = DEPARTMENT_STANDARD_ROLES[newDept] || [];
                        const existingInDept = roles.filter(r => (r.department || '').toLowerCase() === newDept.toLowerCase());
                        if (stdList.length > 0) {
                          const first = stdList[0];
                          setSelectedRolePreset(first.name);
                          setName(first.name);
                          setDescription(first.description);
                          setAccessLevel(first.access_level);
                        } else if (existingInDept.length > 0) {
                          const first = existingInDept[0];
                          setSelectedRolePreset(first.name);
                          setName(first.name);
                          setDescription(first.description || '');
                          setAccessLevel(first.access_level || 'Operational');
                        } else {
                          setSelectedRolePreset('custom');
                        }
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-semibold text-slate-800"
                    >
                      <option value="">Select Department...</option>
                      {allDeptNames.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                      <option value="__new_dept__">+ Create New Department...</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                    <span>Role *</span>
                    {selectedRolePreset !== 'custom' && (
                      <span className="text-[9px] text-emerald-600 font-bold">Standard</span>
                    )}
                  </label>
                  {(() => {
                    const activeDeptName = isNewDeptMode ? customDeptName : department;
                    const stdList = DEPARTMENT_STANDARD_ROLES[activeDeptName] || [];
                    const existingList = roles.filter(r => (r.department || '').toLowerCase() === activeDeptName.toLowerCase());
                    const combinedPresets = Array.from(new Set([
                      ...stdList.map(r => r.name),
                      ...existingList.map(r => r.name)
                    ]));

                    return (
                      <select
                        value={selectedRolePreset}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedRolePreset(val);
                          if (val !== 'custom') {
                            const foundStd = stdList.find(r => r.name === val);
                            const foundExt = existingList.find(r => r.name === val);
                            const found = foundStd || foundExt;
                            if (found) {
                              setName(found.name);
                              setDescription(found.description || '');
                              setAccessLevel(found.access_level || 'Operational');
                            } else {
                              setName(val);
                            }
                          }
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-semibold text-slate-800"
                      >
                        {combinedPresets.length > 0 ? (
                          <>
                            <option value="" disabled>-- Select Preset Role --</option>
                            {combinedPresets.map((rName) => (
                              <option key={rName} value={rName}>{rName}</option>
                            ))}
                            <option value="custom">+ Custom Role...</option>
                          </>
                        ) : (
                          <>
                            <option value="custom">Custom Role</option>
                          </>
                        )}
                      </select>
                    );
                  })()}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                  <span>Role Designation Title *</span>
                  {selectedRolePreset === 'custom' && (
                    <span className="text-[9px] text-blue-600 font-medium">Custom Name</span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operations Manager, Site Supervisor, Driver"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (selectedRolePreset !== 'custom' && e.target.value !== selectedRolePreset) {
                      setSelectedRolePreset('custom');
                    }
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F172A] font-semibold text-slate-800"
                />
              </div>

              <div className="pt-1 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs font-bold bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg shadow-sm flex items-center gap-1"
                >
                  {saving ? (
                    <RefreshCw size={13} className="animate-spin text-emerald-400" />
                  ) : (
                    <Check size={13} className="text-emerald-400" />
                  )}
                  <span>{editingRole ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl max-w-xs w-full p-4 shadow-2xl border border-slate-200 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Delete Designation?</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Are you sure you want to remove this role?
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 pt-1">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleting}
                className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

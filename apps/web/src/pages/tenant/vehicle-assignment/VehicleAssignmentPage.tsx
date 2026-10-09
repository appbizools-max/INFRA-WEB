import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiFetch } from '../../../lib/api';
import {
  Truck,
  HardHat,
  Search,
  Filter,
  Plus,
  Trash2,
  Info,
  X,
  Check,
  AlertTriangle,
  RefreshCw,
  Calendar,
  MapPin,
  User,
  Phone,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  Briefcase,
  Compass,
  Sparkles,
  ArrowRightCircle,
  Users,
  Shield,
  UserPlus
} from 'lucide-react';

interface WorkSite {
  id: string;
  worksiteId: string;
  name: string;
  location: string;
  type?: string;
  projectId?: string;
  projectName?: string;
}

interface VehicleAssignment {
  id: number | string;
  tenantId?: string;
  assetType: 'vehicle' | 'equipment';
  memberId?: string;
  assetId: string;
  assetNumber: string;
  assetTitle?: string;
  projectId?: string;
  projectName?: string;
  worksiteId?: string;
  worksiteName?: string;
  assignedToType: 'driver' | 'operator' | 'subcontractor' | string;
  assignedToName?: string;
  assignedToPhone?: string;
  helperId?: string;
  helperName?: string;
  helperRole?: string;
  helperPhone?: string;
  startDate?: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  status: 'Active' | 'Scheduled' | 'Released' | string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface FleetAsset {
  id: number | string;
  type: 'vehicle' | 'equipment';
  number: string;
  title: string;
  category: string;
  status: string;
  currentLocation?: string;
}

interface TeamMemberOption {
  id: string;
  name: string;
  role: string;
  department?: string;
  mobile?: string;
  status?: string;
  sub_role?: string;
  allowed_modules?: string[];
  landing_module?: string;
  permissions?: any;
}

interface AssignmentRow {
  rowId: string;
  assetId: string;
  assetNumber: string;
  assetTitle: string;
  assetType: 'vehicle' | 'equipment';
  memberId?: string;
  assignedToType: string;
  assignedToName: string;
  assignedToPhone: string;
  helperId?: string;
  helperName?: string;
  helperRole?: string;
  helperPhone?: string;
  showPerson2?: boolean;
}

const createNewRow = (): AssignmentRow => ({
  rowId: Math.random().toString(36).substring(2, 9),
  assetId: '',
  assetNumber: '',
  assetTitle: '',
  assetType: 'vehicle',
  memberId: '',
  assignedToType: '',
  assignedToName: '',
  assignedToPhone: '',
  helperId: '',
  helperName: '',
  helperRole: '',
  helperPhone: '',
  showPerson2: false
});

export default function VehicleAssignmentPage() {
  const { currentUser } = useAuth();

  // Data states
  const [assignments, setAssignments] = useState<VehicleAssignment[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [worksitesList, setWorksitesList] = useState<WorkSite[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberOption[]>([]);
  const [isCustomWorksite, setIsCustomWorksite] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState<'All' | 'vehicle' | 'equipment'>('All');
  const [worksiteFilter, setWorksiteFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingAssignment, setViewingAssignment] = useState<VehicleAssignment | null>(null);
  const [releasingAssignment, setReleasingAssignment] = useState<VehicleAssignment | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Form State for Common Assignment Info
  const [siteForm, setSiteForm] = useState({
    worksiteId: '',
    worksiteName: '',
    projectId: '',
    projectName: '',
    startDate: new Date().toISOString().split('T')[0],
    expectedEndDate: '',
    notes: '',
    status: 'Active'
  });

  // Multiple Vehicle-Driver Rows
  const [assignmentRows, setAssignmentRows] = useState<AssignmentRow[]>([createNewRow()]);

  // Release Form State
  const [releaseForm, setReleaseForm] = useState({
    actualEndDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch all assignments and available fleet assets
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Assignments
      const aRes = await apiFetch('/api/tenant/vehicle-assignments');
      if (aRes.ok) {
        const aData = await aRes.json();
        setAssignments(Array.isArray(aData) ? aData : []);
      }

      // 2. Fetch Vehicles
      const vRes = await apiFetch('/api/tenant/vehicles');
      if (vRes.ok) {
        const vData = await vRes.json();
        setAvailableVehicles(Array.isArray(vData) ? vData : []);
      }

      // 3. Fetch Heavy Equipment
      const eqRes = await apiFetch('/api/tenant/heavy-equipment');
      if (eqRes.ok) {
        const eqData = await eqRes.json();
        setAvailableEquipment(Array.isArray(eqData) ? eqData : []);
      }

      // 4. Fetch Projects
      const pUrl = currentUser?.uid ? `/api/tenant/projects/${currentUser.uid}` : '/api/tenant/projects';
      const pRes = await apiFetch(pUrl);
      if (pRes.ok) {
        const pData = await pRes.json();
        setProjectsList(Array.isArray(pData) ? pData : []);
      }

      // 5. Fetch Worksites
      const wsUrl = currentUser?.uid ? `/api/tenant/worksites/${currentUser.uid}` : '/api/tenant/worksites';
      const wsRes = await apiFetch(wsUrl);
      if (wsRes.ok) {
        const wsData = await wsRes.json();
        setWorksitesList(Array.isArray(wsData) ? wsData : []);
      }

      // 6. Fetch Team Members (Company Drivers & Staff)
      try {
        const teamUrl = currentUser?.uid ? `/api/tenant/team/${currentUser.uid}` : '/api/tenant/team';
        const tRes = await apiFetch(teamUrl);
        if (tRes.ok) {
          const tData = await tRes.json();
          setTeamMembers(Array.isArray(tData) ? tData : []);
        } else {
          const fbRes = await apiFetch('/api/tenant/team');
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            setTeamMembers(Array.isArray(fbData) ? fbData : []);
          }
        }
      } catch (e) {
        console.warn('Failed to load team members:', e);
      }
    } catch (err: any) {
      console.error('[VehicleAssignment] Failed to load data:', err);
      showToast('Could not load assignment records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  // Combined fleet assets list for dropdown selection
  const fleetOptions: FleetAsset[] = useMemo(() => {
    const vList: FleetAsset[] = availableVehicles.map(v => ({
      id: v.id,
      type: 'vehicle',
      number: v.vehicleNumber,
      title: `${v.vehicleType} • ${v.make || ''} ${v.model || ''}`.trim(),
      category: 'Vehicle',
      status: v.status || 'Active',
      currentLocation: v.currentLocation || ''
    }));

    const eqList: FleetAsset[] = availableEquipment.map(eq => ({
      id: eq.id,
      type: 'equipment',
      number: eq.equipmentId || eq.equipmentNumber,
      title: `${eq.equipmentType} • ${eq.make || ''} ${eq.model || ''}`.trim(),
      category: 'Heavy Equipment',
      status: eq.status || 'Active',
      currentLocation: eq.currentLocation || ''
    }));

    return [...vList, ...eqList];
  }, [availableVehicles, availableEquipment]);

  // Filtered Assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter(item => {
      // Search
      const search = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !search ||
        item.assetNumber?.toLowerCase().includes(search) ||
        item.assetTitle?.toLowerCase().includes(search) ||
        item.assignedToName?.toLowerCase().includes(search) ||
        item.projectName?.toLowerCase().includes(search) ||
        item.worksiteName?.toLowerCase().includes(search);

      // Asset Type
      const matchesType = assetTypeFilter === 'All' || item.assetType === assetTypeFilter;

      // Status
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

      // Worksite Filter
      const matchesWorksite =
        worksiteFilter === 'All' ||
        item.worksiteName === worksiteFilter ||
        (item.worksiteName && item.worksiteName.toLowerCase().includes(worksiteFilter.toLowerCase()));

      return matchesSearch && matchesType && matchesStatus && matchesWorksite;
    });
  }, [assignments, searchQuery, assetTypeFilter, statusFilter, worksiteFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = assignments.length;
    const active = assignments.filter(a => a.status === 'Active').length;
    const scheduled = assignments.filter(a => a.status === 'Scheduled').length;
    const released = assignments.filter(a => a.status === 'Released').length;
    return { total, active, scheduled, released };
  }, [assignments]);

  // Automated Worksite Location selection -> Auto-links Project!
  const handleSelectWorksite = (selectedWsId: string) => {
    if (selectedWsId === '__custom__') {
      setIsCustomWorksite(true);
      setSiteForm(prev => ({ ...prev, worksiteId: 'CUSTOM', worksiteName: '' }));
      return;
    }

    setIsCustomWorksite(false);
    const ws = worksitesList.find(w => String(w.worksiteId || w.id) === selectedWsId);
    if (!ws) {
      setSiteForm(prev => ({ ...prev, worksiteId: '', worksiteName: '' }));
      return;
    }

    const wsFullLoc = `${ws.name}${ws.location ? ` - ${ws.location}` : ''}`;

    // Automation: Auto-detect Project associated with this worksite!
    let matchingProject = null;
    if (ws.projectId) {
      matchingProject = projectsList.find(p => String(p.id) === String(ws.projectId) || p.name === ws.projectName);
    }
    if (!matchingProject && ws.location) {
      const wsLocLower = ws.location.toLowerCase();
      matchingProject = projectsList.find(p => {
        if (!p.location) return false;
        const pLocLower = p.location.toLowerCase();
        return pLocLower.includes(wsLocLower) || wsLocLower.includes(pLocLower);
      });
    }

    setSiteForm(prev => ({
      ...prev,
      worksiteId: String(ws.worksiteId || ws.id),
      worksiteName: wsFullLoc,
      projectId: matchingProject ? String(matchingProject.id) : prev.projectId,
      projectName: matchingProject ? matchingProject.name : prev.projectName
    }));

    if (matchingProject) {
      showToast(`✨ Project Auto-Selected: ${matchingProject.name}`, 'info');
    }
  };

  // Automated Project selection -> Auto-suggests Worksite
  const handleSelectProject = (pName: string) => {
    const pObj = projectsList.find(p => p.name === pName);
    setSiteForm(prev => ({
      ...prev,
      projectName: pName,
      projectId: pObj ? String(pObj.id) : ''
    }));

    if (pObj && !siteForm.worksiteId) {
      const matchingWs = worksitesList.find(w => {
        if (w.projectId && String(w.projectId) === String(pObj.id)) return true;
        if (w.location && pObj.location) {
          return w.location.toLowerCase().includes(pObj.location.toLowerCase()) ||
                 pObj.location.toLowerCase().includes(w.location.toLowerCase());
        }
        return false;
      });

      if (matchingWs) {
        setSiteForm(prev => ({
          ...prev,
          worksiteId: String(matchingWs.worksiteId || matchingWs.id),
          worksiteName: `${matchingWs.name}${matchingWs.location ? ` - ${matchingWs.location}` : ''}`
        }));
        showToast(`✨ Worksite Auto-Selected: ${matchingWs.name}`, 'info');
      }
    }
  };

  // Row update handlers
  const handleUpdateRow = (rowId: string, updates: Partial<AssignmentRow>) => {
    setAssignmentRows(prev =>
      prev.map(row => (row.rowId === rowId ? { ...row, ...updates } : row))
    );
  };

  // Strictly filter only drivers, machinery operators, and employees granted Driver access in Staff Directory (Person-to-Person)
  const driverList = useMemo(() => {
    return teamMembers.filter(m => {
      const r = (m.role || '').toLowerCase();
      const d = (m.department || '').toLowerCase();
      const sub = (m.sub_role || '').toLowerCase();

      // 1. Check if designated as driver or machinery operator
      const isDesignatedDriver =
        r.includes('driver') ||
        r.includes('operator') ||
        r.includes('chauffeur') ||
        r.includes('pilot') ||
        r.includes('crane') ||
        r.includes('dozer') ||
        r.includes('dumper') ||
        r.includes('jcb') ||
        r.includes('tipper') ||
        r.includes('loader') ||
        r.includes('excavator') ||
        r.includes('machinery') ||
        r.includes('transporter') ||
        sub.includes('driver') ||
        sub.includes('operator') ||
        d.includes('fleet') ||
        d.includes('transport') ||
        d.includes('machinery');

      // 2. Check if granted Driver / Machinery access via Staff Directory & Person-to-Person Access
      const hasPersonToPersonDriverAccess =
        (Array.isArray(m.allowed_modules) &&
          m.allowed_modules.some(mod =>
            ['fms_driver', 'fms_machinery', 'fms', 'fuel_logs'].includes(mod)
          )) ||
        ['fms_driver', 'fms_machinery'].includes(m.landing_module || '') ||
        Boolean(
          m.permissions &&
          (m.permissions.fms_driver ||
           m.permissions.fms_machinery ||
           m.permissions.driver ||
           m.permissions.operator)
        );

      return isDesignatedDriver || hasPersonToPersonDriverAccess;
    });
  }, [teamMembers]);

  const handleSelectHelperForRow = (rowId: string, helperId: string) => {
    if (!helperId) {
      handleUpdateRow(rowId, {
        helperId: '',
        helperName: '',
        helperRole: '',
        helperPhone: ''
      });
      return;
    }

    const member = teamMembers.find(m => String(m.id) === String(helperId));
    if (member) {
      handleUpdateRow(rowId, {
        helperId: String(member.id),
        helperName: member.name,
        helperRole: member.role || 'Staff',
        helperPhone: member.mobile || ''
      });
    }
  };

  const handleSelectDriverForRow = (rowId: string, memberId: string) => {
    if (!memberId) {
      handleUpdateRow(rowId, {
        memberId: '',
        assignedToName: '',
        assignedToPhone: '',
        assignedToType: ''
      });
      return;
    }

    const member = teamMembers.find(m => String(m.id) === String(memberId));
    if (member) {
      // Use the exact role defined when adding to the team
      const teamRole = member.role || 'Driver';

      handleUpdateRow(rowId, {
        memberId: String(member.id),
        assignedToName: member.name,
        assignedToPhone: member.mobile || '',
        assignedToType: teamRole
      });
    }
  };

  const handleSelectAssetForRow = (rowId: string, assetId: string) => {
    const asset = fleetOptions.find(f => String(f.id) === String(assetId));
    const currentRow = assignmentRows.find(r => r.rowId === rowId);
    if (asset) {
      handleUpdateRow(rowId, {
        assetId: String(asset.id),
        assetNumber: asset.number,
        assetTitle: asset.title,
        assetType: asset.type,
        // Keep the role from the selected team member if already selected; otherwise set placeholder
        assignedToType: currentRow?.assignedToType || (asset.type === 'equipment' ? 'Heavy Operator' : 'Driver')
      });
    } else {
      handleUpdateRow(rowId, {
        assetId: '',
        assetNumber: '',
        assetTitle: '',
        assetType: 'vehicle'
      });
    }
  };

  const handleAddRow = () => {
    setAssignmentRows(prev => [...prev, createNewRow()]);
  };

  const handleRemoveRow = (rowId: string) => {
    if (assignmentRows.length <= 1) return;
    setAssignmentRows(prev => prev.filter(r => r.rowId !== rowId));
  };

  // Submit Multiple Assignments
  const handleCreateAssignments = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!siteForm.worksiteName) {
      showToast('Please select or specify a Worksite Location', 'error');
      return;
    }

    // Validate rows
    const validRows = assignmentRows.filter(r => r.assetId && r.assetNumber);
    if (validRows.length === 0) {
      showToast('Please select at least one vehicle or equipment to dispatch', 'error');
      return;
    }

    const missingDriver = validRows.find(r => !r.assignedToName);
    if (missingDriver) {
      showToast('Please select a driver / operator from the dropdown for each asset', 'error');
      return;
    }

    setSaving(true);
    try {
      const items = validRows.map(row => ({
        assetType: row.assetType,
        assetId: row.assetId,
        assetNumber: row.assetNumber,
        assetTitle: row.assetTitle,
        projectId: siteForm.projectId || null,
        projectName: siteForm.projectName || null,
        worksiteId: siteForm.worksiteId || null,
        worksiteName: siteForm.worksiteName || null,
        assignedToType: row.assignedToType || 'driver',
        assignedToName: row.assignedToName?.trim() || null,
        assignedToPhone: row.assignedToPhone?.trim() || null,
        startDate: siteForm.startDate,
        expectedEndDate: siteForm.expectedEndDate || null,
        notes: siteForm.notes?.trim() || null,
        status: siteForm.status || 'Active'
      }));

      const res = await apiFetch('/api/tenant/vehicle-assignments', {
        method: 'POST',
        body: JSON.stringify({ items })
      });

      if (res.ok) {
        showToast(`Successfully deployed ${validRows.length} asset${validRows.length > 1 ? 's' : ''} to ${siteForm.worksiteName}!`, 'success');
        setIsCreateModalOpen(false);
        setSiteForm({
          worksiteId: '',
          worksiteName: '',
          projectId: '',
          projectName: '',
          startDate: new Date().toISOString().split('T')[0],
          expectedEndDate: '',
          notes: '',
          status: 'Active'
        });
        setAssignmentRows([createNewRow()]);
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to dispatch assets', 'error');
      }
    } catch (err: any) {
      console.error('[VehicleAssignment] Dispatch error:', err);
      showToast('Failed to dispatch assets', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Release Asset
  const handleReleaseAssignment = async () => {
    if (!releasingAssignment) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/api/tenant/vehicle-assignments/${releasingAssignment.id}/release`, {
        method: 'PATCH',
        body: JSON.stringify({
          actualEndDate: releaseForm.actualEndDate,
          notes: releaseForm.notes
        })
      });

      if (res.ok) {
        showToast(`${releasingAssignment.assetNumber} released and returned to idle inventory!`, 'success');
        setReleasingAssignment(null);
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to release asset', 'error');
      }
    } catch (err: any) {
      console.error('[VehicleAssignment] Release error:', err);
      showToast('Error releasing asset', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete Assignment
  const handleDeleteAssignment = async (id: number | string) => {
    if (!window.confirm('Are you sure you want to delete this assignment log?')) return;
    try {
      const res = await apiFetch(`/api/tenant/vehicle-assignments/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setAssignments(prev => prev.filter(a => a.id !== id));
        showToast('Assignment record deleted', 'success');
      }
    } catch (err) {
      showToast('Failed to delete assignment', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        );
      case 'Scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock size={10} />
            Scheduled
          </span>
        );
      case 'Released':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <CheckCircle2 size={10} />
            Released
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-3 sm:p-5 lg:p-6 space-y-4">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 transition-all transform animate-in slide-in-from-bottom-2 ${
            toast.type === 'success'
              ? 'bg-emerald-900/90 text-white border-emerald-700'
              : toast.type === 'error'
              ? 'bg-rose-900/90 text-white border-rose-700'
              : 'bg-slate-900/90 text-white border-slate-700'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 size={14} className="text-emerald-400" />}
          {toast.type === 'error' && <AlertCircle size={14} className="text-rose-400" />}
          {toast.type === 'info' && <Info size={14} className="text-blue-400" />}
          {toast.message}
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs w-full">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br from-[#46B351] to-[#369540] flex items-center justify-center text-white shadow-xs shrink-0">
            <Truck size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Vehicle & Equipment Assignment
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-[#46B351] border border-emerald-200">
                Driver Dispatch
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Assign drivers and machinery operators to vehicles and deploy them to worksites
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
            title="Refresh records"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => {
              setSiteForm({
                worksiteId: '',
                worksiteName: '',
                projectId: '',
                projectName: '',
                startDate: new Date().toISOString().split('T')[0],
                expectedEndDate: '',
                notes: '',
                status: 'Active'
              });
              setAssignmentRows([createNewRow()]);
              setIsCustomWorksite(false);
              setIsCreateModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#46B351] hover:bg-[#3ca046] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={15} />
            <span>Assign Vehicle & Driver</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Total Deployments</span>
            <Layers size={14} className="text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">{stats.total}</span>
            <span className="text-[10px] text-slate-400">Total logs</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1.5">
            <span className="text-[11px] font-semibold text-slate-700">Active Deployed</span>
            <Truck size={14} className="text-[#46B351]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-700">{stats.active}</span>
            <span className="text-[10px] text-slate-400">On worksites</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-600 mb-1.5">
            <span className="text-[11px] font-semibold text-slate-700">Scheduled Shifts</span>
            <Clock size={14} className="text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-blue-700">{stats.scheduled}</span>
            <span className="text-[10px] text-slate-400">Upcoming</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-semibold text-slate-700">Released / Idle</span>
            <CheckCircle2 size={14} className="text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-700">{stats.released}</span>
            <span className="text-[10px] text-slate-400">Completed</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-2.5 w-full">
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by vehicle, driver, project, worksite..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#46B351]/20 focus:border-[#46B351]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter size={13} />
            <span>Type:</span>
          </div>
          <select
            value={assetTypeFilter}
            onChange={e => setAssetTypeFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#46B351]"
          >
            <option value="All">All Assets</option>
            <option value="vehicle">Vehicles Only</option>
            <option value="equipment">Heavy Machinery Only</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-1 sm:ml-2">
            <MapPin size={12} />
            <span>Site:</span>
          </div>
          <select
            value={worksiteFilter}
            onChange={e => setWorksiteFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#46B351]"
          >
            <option value="All">All Worksites</option>
            {worksitesList.map(ws => (
              <option key={ws.worksiteId || ws.id} value={ws.name}>
                {ws.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-1 sm:ml-2">
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#46B351]"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Released">Released</option>
          </select>
        </div>
      </div>

      {/* Assignment Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden w-full">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw size={14} className="animate-spin text-slate-500" />
            Loading assignments...
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Truck size={24} />
            </div>
            <h4 className="font-bold text-sm text-slate-800">No Assignments Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'All' || assetTypeFilter !== 'All' || worksiteFilter !== 'All'
                ? 'No matching assignments found for current filters.'
                : 'Get started by dispatching your first vehicle or equipment.'}
            </p>
            <button
              onClick={() => {
                setSiteForm({
                  worksiteId: '',
                  worksiteName: '',
                  projectId: '',
                  projectName: '',
                  startDate: new Date().toISOString().split('T')[0],
                  expectedEndDate: '',
                  notes: '',
                  status: 'Active'
                });
                setAssignmentRows([createNewRow()]);
                setIsCustomWorksite(false);
                setIsCreateModalOpen(true);
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-[#46B351] text-white text-xs font-bold hover:bg-[#3ca046] transition-colors cursor-pointer"
            >
              + Assign Vehicle & Driver
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  <th className="py-2.5 px-3">Asset & Identifier</th>
                  <th className="py-2.5 px-3">Project & Worksite</th>
                  <th className="py-2.5 px-3">Assigned Personnel</th>
                  <th className="py-2.5 px-3">Deployment Timeline</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {filteredAssignments.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Asset Number */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                            a.assetType === 'equipment'
                              ? 'bg-amber-50 text-amber-600 border border-amber-200/60'
                              : 'bg-emerald-50 text-[#46B351] border border-emerald-200/60'
                          }`}
                        >
                          {a.assetType === 'equipment' ? <HardHat size={14} /> : <Truck size={14} />}
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-900 font-mono block">
                            {a.assetNumber}
                          </span>
                          <span className="text-[10px] text-slate-500 capitalize block truncate max-w-[160px]">
                            {a.assetTitle || a.assetType}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Project & Worksite */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <Briefcase size={11} className="text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-800 truncate max-w-[180px]">
                          {a.projectName || 'General Deployment'}
                        </span>
                      </div>
                      {a.worksiteName && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                          <MapPin size={10} className="text-[#46B351] shrink-0" />
                          <span className="truncate max-w-[200px] font-medium">{a.worksiteName}</span>
                        </div>
                      )}
                    </td>

                    {/* Personnel */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200/60 shrink-0">
                          P1
                        </span>
                        <span className="font-bold text-slate-800">{a.assignedToName || 'Unassigned'}</span>
                        {a.assignedToType && (
                          <span className="text-[9px] font-semibold text-slate-600 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                            {a.assignedToType}
                          </span>
                        )}
                      </div>
                      {a.assignedToPhone && (
                        <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400 ml-6">
                          <Phone size={9} />
                          {a.assignedToPhone}
                        </div>
                      )}
                      {a.helperName && (
                        <div className="mt-1 pt-1 border-t border-slate-100 flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200/60 shrink-0">
                              P2
                            </span>
                            <span className="font-semibold text-slate-700">{a.helperName}</span>
                            {a.helperRole && (
                              <span className="text-[9px] font-semibold text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200/60">
                                {a.helperRole}
                              </span>
                            )}
                          </div>
                          {a.helperPhone && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 ml-6">
                              <Phone size={9} />
                              {a.helperPhone}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Timeline */}
                    <td className="py-2.5 px-3 text-[10.5px]">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-slate-700">
                          <Calendar size={10} className="text-slate-400" />
                          <span>From: <strong>{a.startDate || '—'}</strong></span>
                        </div>
                        {a.expectedEndDate ? (
                          <div className="text-[10px] text-slate-400">
                            Due: {a.expectedEndDate}
                          </div>
                        ) : null}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3">{getStatusBadge(a.status)}</td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-90 group-hover:opacity-100">
                        {/* View Info */}
                        <button
                          onClick={() => setViewingAssignment(a)}
                          title="View Assignment Info"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Info size={13} />
                        </button>

                        {/* Release / Complete */}
                        {a.status === 'Active' && (
                          <button
                            onClick={() => {
                              setReleasingAssignment(a);
                              setReleaseForm({
                                actualEndDate: new Date().toISOString().split('T')[0],
                                notes: ''
                              });
                            }}
                            title="Release / Unassign Asset"
                            className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
                          >
                            <ArrowRightCircle size={13} />
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteAssignment(a.id)}
                          title="Delete Record"
                          className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          MODAL 1: BATCH DISPATCH & ASSIGN (MULTIPLE VEHICLES & DRIVERS)
          ────────────────────────────────────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-3.5 px-5 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-[#46B351] text-white flex items-center justify-center font-bold">
                  <Users size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-tight">
                    Dispatch & Assign Vehicles to Site
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    Assign drivers to vehicles & deploy multiple assets to project worksite
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleCreateAssignments} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Section 1: Worksite Location & Project Automation */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Compass size={13} className="text-[#46B351]" />
                    <span>Deployment Destination (Worksite & Project)</span>
                  </div>
                  <span className="text-[9.5px] text-slate-400 font-medium">
                    Selecting site auto-links project
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Worksite Location Dropdown */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10.5px] font-semibold text-slate-700 flex items-center gap-1">
                        <MapPin size={11} className="text-[#46B351]" />
                        <span>Worksite Location Dropdown</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      {siteForm.worksiteName && (
                        <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Selected
                        </span>
                      )}
                    </div>
                    <select
                      required
                      value={isCustomWorksite ? '__custom__' : (siteForm.worksiteId || '')}
                      onChange={e => handleSelectWorksite(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#46B351]"
                    >
                      <option value="">-- Select Worksite Location --</option>
                      {worksitesList.map(ws => (
                        <option key={ws.worksiteId || ws.id} value={String(ws.worksiteId || ws.id)}>
                          {ws.name} {ws.location ? `— ${ws.location}` : ''}
                        </option>
                      ))}
                      <option value="__custom__">+ Other / Enter Custom Site Location</option>
                    </select>

                    {isCustomWorksite && (
                      <input
                        type="text"
                        autoFocus
                        placeholder="Type custom worksite location..."
                        value={siteForm.worksiteName}
                        onChange={e => setSiteForm(prev => ({ ...prev, worksiteName: e.target.value }))}
                        className="mt-1.5 w-full bg-white border border-[#46B351] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#46B351]"
                      />
                    )}
                  </div>

                  {/* Target Project Dropdown (Automated) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10.5px] font-semibold text-slate-700 flex items-center gap-1">
                        <Briefcase size={11} className="text-slate-500" />
                        <span>Target Project</span>
                      </label>
                      {siteForm.projectName && (
                        <span className="text-[9px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          Linked
                        </span>
                      )}
                    </div>
                    <select
                      value={siteForm.projectName}
                      onChange={e => handleSelectProject(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#46B351]"
                    >
                      <option value="">-- Select Project (Or auto-linked) --</option>
                      {projectsList.map(p => (
                        <option key={p.id} value={p.name}>
                          {p.name} {p.location ? `(${p.location})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">
                      Deployment Start Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={siteForm.startDate}
                      onChange={e => setSiteForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#46B351]"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">
                      Expected End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={siteForm.expectedEndDate}
                      onChange={e => setSiteForm(prev => ({ ...prev, expectedEndDate: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#46B351]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Multiple Vehicle-Driver Assignment Rows */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Truck size={13} className="text-[#46B351]" />
                    <span>Assign Vehicles & Drivers ({assignmentRows.length})</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    You can dispatch multiple vehicles together
                  </span>
                </div>

                <div className="space-y-2">
                  {assignmentRows.map((row, index) => (
                    <div
                      key={row.rowId}
                      className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all text-xs space-y-3"
                    >
                      {/* Row Header */}
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-slate-100 text-[10.5px] font-bold text-slate-700">
                            Vehicle #{index + 1}
                          </span>
                          {row.assetNumber && (
                            <span className="text-[10.5px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 font-mono">
                              {row.assetNumber} {row.assetTitle ? `• ${row.assetTitle}` : ''}
                            </span>
                          )}
                        </div>
                        {assignmentRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(row.rowId)}
                            className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove this vehicle"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      {/* Select Vehicle / Equipment Asset */}
                      <div>
                        <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">
                          Select Vehicle / Equipment <span className="text-rose-500">*</span>
                        </label>
                        <select
                          required
                          value={row.assetId}
                          onChange={e => handleSelectAssetForRow(row.rowId, e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#46B351]"
                        >
                          <option value="">-- Choose Asset --</option>
                          <optgroup label="🚚 Vehicles">
                            {fleetOptions.filter(f => f.type === 'vehicle').map(f => (
                              <option key={f.id} value={String(f.id)}>
                                {f.number} • {f.title}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="🚜 Heavy Equipment">
                            {fleetOptions.filter(f => f.type === 'equipment').map(f => (
                              <option key={f.id} value={String(f.id)}>
                                {f.number} • {f.title}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>

                      {/* Section 1: Person 1 */}
                      <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-200/70 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1.5">
                            <User size={13} className="text-[#46B351]" />
                            <span>Person 1 <span className="text-rose-500">*</span></span>
                          </span>
                          {row.assignedToName && (
                            <span className="text-[9.5px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                              ✓ Person 1 Assigned
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                          {/* Person 1 Select */}
                          <div className="sm:col-span-5">
                            <label className="text-[10px] font-medium text-slate-500 block mb-0.5">
                              Select Person 1
                            </label>
                            <select
                              required
                              value={row.memberId || ''}
                              onChange={e => handleSelectDriverForRow(row.rowId, e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#46B351]"
                            >
                              <option value="">-- Select Person 1 --</option>
                              {driverList.map(m => {
                                const isP2P =
                                  (Array.isArray(m.allowed_modules) &&
                                    m.allowed_modules.some(mod =>
                                      ['fms_driver', 'fms_machinery', 'fms', 'fuel_logs'].includes(mod)
                                    )) ||
                                  ['fms_driver', 'fms_machinery'].includes(m.landing_module || '') ||
                                  Boolean(m.permissions?.fms_driver || m.permissions?.fms_machinery);

                                const isNonStandardRole =
                                  !m.role?.toLowerCase().includes('driver') &&
                                  !m.role?.toLowerCase().includes('operator');

                                return (
                                  <option key={m.id} value={String(m.id)}>
                                    {m.name} • {m.role || 'Driver'}{isP2P && isNonStandardRole ? ' (Person-to-Person Access)' : ''}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          {/* Person 1 Role Type */}
                          <div className="sm:col-span-3">
                            <label className="text-[10px] font-medium text-slate-500 block mb-0.5">
                              Role Type
                            </label>
                            <input
                              type="text"
                              readOnly
                              value={row.assignedToType || ''}
                              placeholder="Auto-filled"
                              className="w-full bg-slate-100/80 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 cursor-default"
                            />
                          </div>

                          {/* Person 1 Phone */}
                          <div className="sm:col-span-4">
                            <label className="text-[10px] font-medium text-slate-500 block mb-0.5">
                              Contact Phone
                            </label>
                            <input
                              type="text"
                              readOnly
                              value={row.assignedToPhone || ''}
                              placeholder="Auto-filled"
                              className="w-full bg-slate-100/80 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-700 cursor-default"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Person 2 (Addable / Optional) */}
                      {row.showPerson2 || row.helperId ? (
                        <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-200/70 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1.5">
                              <User size={13} className="text-blue-600" />
                              <span>Person 2 <span className="text-[10px] font-normal text-slate-400">(Optional)</span></span>
                            </span>
                            <div className="flex items-center gap-2">
                              {row.helperName && (
                                <span className="text-[9.5px] font-semibold text-blue-700 bg-blue-100/70 px-1.5 py-0.2 rounded">
                                  ✓ Person 2 Assigned
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateRow(row.rowId, {
                                    helperId: '',
                                    helperName: '',
                                    helperRole: '',
                                    helperPhone: '',
                                    showPerson2: false
                                  });
                                }}
                                className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                              >
                                <Trash2 size={10} />
                                Remove Person 2
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                            {/* Person 2 Select */}
                            <div className="sm:col-span-5">
                              <label className="text-[10px] font-medium text-slate-500 block mb-0.5">
                                Select Person 2
                              </label>
                              <select
                                value={row.helperId || ''}
                                onChange={e => handleSelectHelperForRow(row.rowId, e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="">-- Choose Person 2 --</option>
                                {teamMembers
                                  .filter(m => String(m.id) !== String(row.memberId))
                                  .map(m => (
                                    <option key={m.id} value={String(m.id)}>
                                      {m.name} • {m.role || 'Staff'} {m.mobile ? `(${m.mobile})` : ''}
                                    </option>
                                  ))}
                              </select>
                            </div>

                            {/* Person 2 Role */}
                            <div className="sm:col-span-3">
                              <label className="text-[10px] font-medium text-slate-500 block mb-0.5">
                                Role Type
                              </label>
                              <input
                                type="text"
                                readOnly
                                value={row.helperRole || ''}
                                placeholder="Auto-filled"
                                className="w-full bg-slate-100/80 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 cursor-default"
                              />
                            </div>

                            {/* Person 2 Phone */}
                            <div className="sm:col-span-4">
                              <label className="text-[10px] font-medium text-slate-500 block mb-0.5">
                                Contact Phone
                              </label>
                              <input
                                type="text"
                                readOnly
                                value={row.helperPhone || ''}
                                placeholder="Auto-filled"
                                className="w-full bg-slate-100/80 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-700 cursor-default"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-start pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateRow(row.rowId, { showPerson2: true })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/80 rounded-lg transition-colors cursor-pointer"
                          >
                            <UserPlus size={13} className="text-blue-600" />
                            <span>+ Add Person 2</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Another Row Button */}
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="w-full py-2 border-2 border-dashed border-slate-200 hover:border-[#46B351] rounded-xl text-xs font-bold text-slate-600 hover:text-[#46B351] hover:bg-emerald-50/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>+ Add Another Vehicle & Driver</span>
                </button>
              </div>

              {/* Shared Notes */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                  Deployment Directives / Shared Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Shift notes, special instructions, or safety directives for the dispatched fleet..."
                  value={siteForm.notes}
                  onChange={e => setSiteForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#46B351]"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg bg-[#46B351] hover:bg-[#3ca046] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>
                    {saving
                      ? 'Deploying...'
                      : `Deploy ${assignmentRows.filter(r => r.assetId).length || 1} Asset${assignmentRows.filter(r => r.assetId).length > 1 ? 's' : ''}`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          MODAL 2: VIEW DETAILS ("ℹ")
          ────────────────────────────────────────────────────────────────────────── */}
      {viewingAssignment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-3 px-4.5 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div
                  className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                    viewingAssignment.assetType === 'equipment'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-emerald-50 text-[#46B351]'
                  }`}
                >
                  {viewingAssignment.assetType === 'equipment' ? <HardHat size={16} /> : <Truck size={16} />}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-tight">
                    {viewingAssignment.assetNumber}
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    {viewingAssignment.assetTitle || 'Fleet Deployment'} • Assignment #{viewingAssignment.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingAssignment(null)}
                className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-4 space-y-3 flex-1 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[9px] text-slate-400 font-semibold block">Asset Type</span>
                  <span className="font-bold text-slate-800 text-[11px] capitalize mt-0.5 block">
                    {viewingAssignment.assetType}
                  </span>
                </div>

                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[9px] text-slate-400 font-semibold block">Target Project</span>
                  <span className="font-bold text-slate-800 text-[11px] truncate mt-0.5 block">
                    {viewingAssignment.projectName || '—'}
                  </span>
                </div>

                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[9px] text-slate-400 font-semibold block">Worksite Location</span>
                  <span className="font-bold text-slate-800 text-[11px] truncate mt-0.5 block">
                    {viewingAssignment.worksiteName || '—'}
                  </span>
                </div>

                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[9px] text-slate-400 font-semibold block">Status</span>
                  <div className="mt-0.5">{getStatusBadge(viewingAssignment.status)}</div>
                </div>

                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[9px] text-slate-400 font-semibold block">Person 1</span>
                  <span className="font-bold text-slate-800 text-[11px] truncate mt-0.5 block">
                    {viewingAssignment.assignedToName || 'Unassigned'} ({viewingAssignment.assignedToType || 'Driver'})
                  </span>
                </div>

                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[9px] text-slate-400 font-semibold block">Person 1 Contact Phone</span>
                  <span className="font-bold text-slate-800 text-[11px] truncate mt-0.5 block">
                    {viewingAssignment.assignedToPhone || '—'}
                  </span>
                </div>

                {viewingAssignment.helperName && (
                  <>
                    <div className="p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                      <span className="text-[9px] text-blue-600 font-semibold block">Person 2</span>
                      <span className="font-bold text-slate-800 text-[11px] truncate mt-0.5 block">
                        {viewingAssignment.helperName} ({viewingAssignment.helperRole || 'Staff'})
                      </span>
                    </div>

                    <div className="p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                      <span className="text-[9px] text-blue-600 font-semibold block">Person 2 Contact Phone</span>
                      <span className="font-bold text-slate-800 text-[11px] truncate mt-0.5 block">
                        {viewingAssignment.helperPhone || '—'}
                      </span>
                    </div>
                  </>
                )}

                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[9px] text-slate-400 font-semibold block">Start Date</span>
                  <span className="font-bold text-slate-800 text-[11px] mt-0.5 block">
                    {viewingAssignment.startDate || '—'}
                  </span>
                </div>

                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[9px] text-slate-400 font-semibold block">Expected End Date</span>
                  <span className="font-bold text-slate-800 text-[11px] mt-0.5 block">
                    {viewingAssignment.expectedEndDate || 'Ongoing'}
                  </span>
                </div>
              </div>

              {viewingAssignment.notes && (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="text-[9.5px] text-slate-400 font-semibold block mb-0.5">Directives / Notes:</span>
                  <p className="text-slate-700">{viewingAssignment.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end p-2.5 px-4.5 border-t border-slate-100 bg-slate-50/50 shrink-0">
              <button
                onClick={() => setViewingAssignment(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          MODAL 3: RELEASE ASSIGNMENT / RETURN ASSET TO IDLE
          ────────────────────────────────────────────────────────────────────────── */}
      {releasingAssignment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightCircle size={18} className="text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Release Asset Assignment
                </h3>
              </div>
              <button
                onClick={() => setReleasingAssignment(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Release <strong className="text-slate-900 font-mono">{releasingAssignment.assetNumber}</strong> ({releasingAssignment.assetType}) from worksite deployment and return to idle inventory.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                  Actual Release Date
                </label>
                <input
                  type="date"
                  value={releaseForm.actualEndDate}
                  onChange={e => setReleaseForm(prev => ({ ...prev, actualEndDate: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                  Return Condition & Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="Asset condition, fuel level on return, handover notes..."
                  value={releaseForm.notes}
                  onChange={e => setReleaseForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReleasingAssignment(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleReleaseAssignment}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Releasing...' : 'Confirm Release'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

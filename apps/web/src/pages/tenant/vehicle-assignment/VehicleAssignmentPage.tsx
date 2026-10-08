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
  Gauge,
  Calendar,
  MapPin,
  User,
  Phone,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  Briefcase,
  SlidersHorizontal,
  ChevronDown,
  ArrowRightCircle,
  Activity,
  Fuel,
  Weight,
  Compass,
  Sparkles
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
  startDate?: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  meterReadingAtAssign?: number;
  meterReadingAtRelease?: number;
  operations?: string;
  tripsCompleted?: number;
  quantityTransported?: string;
  quantityHandled?: string;
  distanceTravelled?: number;
  workingHours?: number;
  odometerOpeningKm?: number;
  odometerClosingKm?: number;
  hourMeterOpeningHours?: number;
  hourMeterClosingHours?: number;
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

const VEHICLE_OPERATION_PRESETS = [
  'Material Hauling (M-Sand, Aggregate, Soil)',
  'Earthmoving & Debris Shifting',
  'Quarry Transport & Stone Supply',
  'Asphalt & Bitumen Laying Transport',
  'Water Tanker & Dust Suppression',
  'Inter-Site Mobilization & Logistics'
];

const EQUIPMENT_OPERATION_PRESETS = [
  'Excavation & Trenching',
  'Site Grading & Land Leveling',
  'Loading & Stockpile Management',
  'Rock Breaking & Hammer Operation',
  'Compaction & Sub-base Consolidation',
  'Heavy Demolition & Clearing'
];

export default function VehicleAssignmentPage() {
  const { currentUser } = useAuth();

  // Data states
  const [assignments, setAssignments] = useState<VehicleAssignment[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [worksitesList, setWorksitesList] = useState<WorkSite[]>([]);
  const [isCustomWorksite, setIsCustomWorksite] = useState(false);
  const [isCustomOperation, setIsCustomOperation] = useState(false);
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

  // Form State for New Assignment
  const initialFormState = {
    date: new Date().toISOString().split('T')[0],
    assetType: 'vehicle' as 'vehicle' | 'equipment',
    assetId: '',
    assetNumber: '',
    assetTitle: '',
    projectId: '',
    projectName: '',
    worksiteId: '',
    worksiteName: '',
    operations: '',
    // Vehicle specific
    tripsCompleted: '',
    quantityTransported: '',
    odometerOpeningKm: '',
    odometerClosingKm: '',
    distanceTravelled: '',
    // Heavy Equipment specific
    hourMeterOpeningHours: '',
    hourMeterClosingHours: '',
    quantityHandled: '',
    // Shared
    workingHours: '',
    assignedToType: 'driver',
    assignedToName: '',
    assignedToPhone: '',
    startDate: new Date().toISOString().split('T')[0],
    expectedEndDate: '',
    meterReadingAtAssign: '',
    notes: '',
    status: 'Active'
  };

  const [formData, setFormData] = useState(initialFormState);

  // Release Form State
  const [releaseForm, setReleaseForm] = useState({
    actualEndDate: new Date().toISOString().split('T')[0],
    meterReadingAtRelease: '',
    odometerClosingKm: '',
    hourMeterClosingHours: '',
    distanceTravelled: '',
    workingHours: '',
    tripsCompleted: '',
    quantityTransported: '',
    quantityHandled: '',
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
        item.worksiteName?.toLowerCase().includes(search) ||
        item.operations?.toLowerCase().includes(search);

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

    // Total distance recorded (km)
    const totalDistance = assignments.reduce((acc, curr) => {
      const dist = curr.distanceTravelled || (
        curr.odometerClosingKm && curr.odometerOpeningKm
          ? Math.max(0, Number(curr.odometerClosingKm) - Number(curr.odometerOpeningKm))
          : (curr.meterReadingAtRelease && curr.meterReadingAtAssign
              ? Math.max(0, Number(curr.meterReadingAtRelease) - Number(curr.meterReadingAtAssign))
              : 0)
      );
      return acc + Number(dist || 0);
    }, 0);

    // Total working hours recorded (hrs)
    const totalHours = assignments.reduce((acc, curr) => {
      const hrs = curr.workingHours || (
        curr.hourMeterClosingHours && curr.hourMeterOpeningHours
          ? Math.max(0, Number(curr.hourMeterClosingHours) - Number(curr.hourMeterOpeningHours))
          : 0
      );
      return acc + Number(hrs || 0);
    }, 0);

    return { total, active, scheduled, released, totalDistance, totalHours };
  }, [assignments]);

  // Calculate last recorded odometer / hour meter reading for the selected vehicle / equipment
  const lastRecordedReading = useMemo(() => {
    if (!formData.assetId && !formData.assetNumber) return null;
    const history = assignments.filter(
      a => String(a.assetId) === String(formData.assetId) || a.assetNumber === formData.assetNumber
    );
    if (history.length === 0) return null;
    for (const item of history) {
      if (item.meterReadingAtRelease !== undefined && item.meterReadingAtRelease !== null && Number(item.meterReadingAtRelease) > 0) {
        return Number(item.meterReadingAtRelease);
      }
      if (item.meterReadingAtAssign !== undefined && item.meterReadingAtAssign !== null && Number(item.meterReadingAtAssign) > 0) {
        return Number(item.meterReadingAtAssign);
      }
      if (item.odometerClosingKm && Number(item.odometerClosingKm) > 0) {
        return Number(item.odometerClosingKm);
      }
      if (item.hourMeterClosingHours && Number(item.hourMeterClosingHours) > 0) {
        return Number(item.hourMeterClosingHours);
      }
    }
    return null;
  }, [formData.assetId, formData.assetNumber, assignments]);

  // Handle Asset selection in modal
  const handleSelectAsset = (assetId: string) => {
    const selected = fleetOptions.find(f => String(f.id) === String(assetId));
    if (selected) {
      // Find previous odometer or hour meter
      const history = assignments.filter(
        a => String(a.assetId) === String(selected.id) || a.assetNumber === selected.number
      );
      let prevReading = '';
      for (const item of history) {
        if (item.meterReadingAtRelease !== undefined && item.meterReadingAtRelease !== null && Number(item.meterReadingAtRelease) > 0) {
          prevReading = String(item.meterReadingAtRelease);
          break;
        }
        if (item.meterReadingAtAssign !== undefined && item.meterReadingAtAssign !== null && Number(item.meterReadingAtAssign) > 0) {
          prevReading = String(item.meterReadingAtAssign);
          break;
        }
      }

      setFormData(prev => ({
        ...prev,
        assetId: String(selected.id),
        assetType: selected.type,
        assetNumber: selected.number,
        assetTitle: selected.title,
        assignedToType: selected.type === 'equipment' ? 'operator' : 'driver',
        odometerOpeningKm: selected.type === 'vehicle' ? (prevReading || prev.odometerOpeningKm) : '',
        hourMeterOpeningHours: selected.type === 'equipment' ? (prevReading || prev.hourMeterOpeningHours) : '',
        meterReadingAtAssign: prevReading || prev.meterReadingAtAssign
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        assetId: '',
        assetNumber: '',
        assetTitle: '',
        odometerOpeningKm: '',
        hourMeterOpeningHours: '',
        meterReadingAtAssign: ''
      }));
    }
  };

  // Automated Worksite Location selection -> Auto-links Project!
  const handleSelectWorksite = (selectedWsId: string) => {
    if (selectedWsId === '__custom__') {
      setIsCustomWorksite(true);
      setFormData(prev => ({ ...prev, worksiteId: 'CUSTOM', worksiteName: '' }));
      return;
    }

    setIsCustomWorksite(false);
    const ws = worksitesList.find(w => String(w.worksiteId || w.id) === selectedWsId);
    if (!ws) {
      setFormData(prev => ({ ...prev, worksiteId: '', worksiteName: '' }));
      return;
    }

    const wsFullLoc = `${ws.name}${ws.location ? ` - ${ws.location}` : ''}`;

    // Automation: Auto-detect Project associated with this worksite!
    let matchingProject = null;
    // 1. Direct project_id linked
    if (ws.projectId) {
      matchingProject = projectsList.find(p => String(p.id) === String(ws.projectId) || p.name === ws.projectName);
    }
    // 2. Correlation by location name
    if (!matchingProject && ws.location) {
      const wsLocLower = ws.location.toLowerCase();
      matchingProject = projectsList.find(p => {
        if (!p.location) return false;
        const pLocLower = p.location.toLowerCase();
        return pLocLower.includes(wsLocLower) || wsLocLower.includes(pLocLower);
      });
    }

    setFormData(prev => ({
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

  // Automated Project selection -> Can auto-suggest matching Worksite!
  const handleSelectProject = (pName: string) => {
    const pObj = projectsList.find(p => p.name === pName);
    setFormData(prev => ({
      ...prev,
      projectName: pName,
      projectId: pObj ? String(pObj.id) : ''
    }));

    if (pObj && !formData.worksiteId) {
      // Find matching worksite by project_id or location
      const matchingWs = worksitesList.find(w => {
        if (w.projectId && String(w.projectId) === String(pObj.id)) return true;
        if (w.location && pObj.location) {
          return w.location.toLowerCase().includes(pObj.location.toLowerCase()) ||
                 pObj.location.toLowerCase().includes(w.location.toLowerCase());
        }
        return false;
      });

      if (matchingWs) {
        setFormData(prev => ({
          ...prev,
          worksiteId: String(matchingWs.worksiteId || matchingWs.id),
          worksiteName: `${matchingWs.name}${matchingWs.location ? ` - ${matchingWs.location}` : ''}`
        }));
        showToast(`✨ Worksite Auto-Selected: ${matchingWs.name}`, 'info');
      }
    }
  };

  // Vehicle Distance Live Calculation: Closing KM - Opening KM
  const handleOdoChange = (field: 'odometerOpeningKm' | 'odometerClosingKm', val: string) => {
    setFormData(prev => {
      const next = { ...prev, [field]: val };
      const open = parseFloat(field === 'odometerOpeningKm' ? val : next.odometerOpeningKm);
      const close = parseFloat(field === 'odometerClosingKm' ? val : next.odometerClosingKm);
      if (!isNaN(open) && !isNaN(close) && close >= open) {
        next.distanceTravelled = String((close - open).toFixed(1));
      }
      next.meterReadingAtAssign = next.odometerOpeningKm;
      return next;
    });
  };

  // Heavy Equipment Working Hours Live Calculation: Closing Hours - Opening Hours
  const handleHourMeterChange = (field: 'hourMeterOpeningHours' | 'hourMeterClosingHours', val: string) => {
    setFormData(prev => {
      const next = { ...prev, [field]: val };
      const open = parseFloat(field === 'hourMeterOpeningHours' ? val : next.hourMeterOpeningHours);
      const close = parseFloat(field === 'hourMeterClosingHours' ? val : next.hourMeterClosingHours);
      if (!isNaN(open) && !isNaN(close) && close >= open) {
        next.workingHours = String((close - open).toFixed(1));
      }
      next.meterReadingAtAssign = next.hourMeterOpeningHours;
      return next;
    });
  };

  // Submit New Assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assetId || !formData.assetNumber) {
      showToast('Please select a vehicle or equipment', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        startDate: formData.date || formData.startDate,
        meterReadingAtAssign: formData.assetType === 'equipment'
          ? (formData.hourMeterOpeningHours || formData.meterReadingAtAssign || 0)
          : (formData.odometerOpeningKm || formData.meterReadingAtAssign || 0)
      };

      const res = await apiFetch('/api/tenant/vehicle-assignments', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const saved = await res.json();
        setAssignments(prev => [saved, ...prev]);
        setIsCreateModalOpen(false);
        setFormData(initialFormState);
        setIsCustomWorksite(false);
        setIsCustomOperation(false);
        showToast(`${formData.assetNumber} deployed successfully!`, 'success');
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to create assignment', 'error');
      }
    } catch (err: any) {
      console.error('[VehicleAssignment] Create error:', err);
      showToast('Failed to deploy asset', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Release Asset
  const handleReleaseAssignment = async () => {
    if (!releasingAssignment) return;
    setSaving(true);
    try {
      const payload: any = {
        actualEndDate: releaseForm.actualEndDate,
        notes: releaseForm.notes
      };

      if (releasingAssignment.assetType === 'vehicle') {
        payload.meterReadingAtRelease = releaseForm.odometerClosingKm || releaseForm.meterReadingAtRelease;
        payload.odometerClosingKm = releaseForm.odometerClosingKm || releaseForm.meterReadingAtRelease;
        payload.distanceTravelled = releaseForm.distanceTravelled;
        payload.tripsCompleted = releaseForm.tripsCompleted;
        payload.quantityTransported = releaseForm.quantityTransported;
        payload.workingHours = releaseForm.workingHours;
      } else {
        payload.meterReadingAtRelease = releaseForm.hourMeterClosingHours || releaseForm.meterReadingAtRelease;
        payload.hourMeterClosingHours = releaseForm.hourMeterClosingHours || releaseForm.meterReadingAtRelease;
        payload.workingHours = releaseForm.workingHours;
        payload.quantityHandled = releaseForm.quantityHandled;
      }

      const res = await apiFetch(`/api/tenant/vehicle-assignments/${releasingAssignment.id}/release`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(`${releasingAssignment.assetNumber} marked as released!`, 'success');
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
                Site Operations & Dispatch
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated worksite location, project selection, trip monitoring & hour meter tracking
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
              setFormData(initialFormState);
              setIsCustomWorksite(false);
              setIsCustomOperation(false);
              setIsCreateModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#46B351] hover:bg-[#3ca046] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={15} />
            <span>New Assignment Log</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Total Deployments</span>
            <Layers size={14} className="text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">{stats.total}</span>
            <span className="text-[10px] text-slate-400">Total assignments</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1.5">
            <span className="text-[11px] font-semibold text-slate-700">Active On-Site</span>
            <Activity size={14} className="text-[#46B351]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-700">{stats.active}</span>
            <span className="text-[10px] text-slate-400">Operating now</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-600 mb-1.5">
            <span className="text-[11px] font-semibold text-slate-700">Total Distance Logged</span>
            <Gauge size={14} className="text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-blue-700">
              {stats.totalDistance.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">KM traveled</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 mb-1.5">
            <span className="text-[11px] font-semibold text-slate-700">Equipment Working Hours</span>
            <Clock size={14} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-amber-700">
              {stats.totalHours.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">Hours run</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-2.5 w-full">
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by asset, driver, project, worksite, or operation..."
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
                : 'Get started by creating your first vehicle or equipment deployment.'}
            </p>
            <button
              onClick={() => {
                setFormData(initialFormState);
                setIsCustomWorksite(false);
                setIsCustomOperation(false);
                setIsCreateModalOpen(true);
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-[#46B351] text-white text-xs font-bold hover:bg-[#3ca046] transition-colors cursor-pointer"
            >
              + Create First Assignment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  <th className="py-2.5 px-3">Asset & Identifier</th>
                  <th className="py-2.5 px-3">Project & Worksite</th>
                  <th className="py-2.5 px-3">Site Operations & Volume</th>
                  <th className="py-2.5 px-3">Odometer / Hour Meter & Run</th>
                  <th className="py-2.5 px-3">Personnel</th>
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
                          <span className="text-[10px] text-slate-500 capitalize block truncate max-w-[140px]">
                            {a.assetTitle || a.assetType}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Project & Worksite */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <Briefcase size={11} className="text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-800 truncate max-w-[170px]">
                          {a.projectName || 'General Deployment'}
                        </span>
                      </div>
                      {a.worksiteName && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                          <MapPin size={10} className="text-[#46B351] shrink-0" />
                          <span className="truncate max-w-[180px] font-medium">{a.worksiteName}</span>
                        </div>
                      )}
                    </td>

                    {/* Site Operations & Volume */}
                    <td className="py-2.5 px-3">
                      <div className="space-y-0.5">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-slate-100 text-slate-700 max-w-[180px] truncate">
                          {a.operations || 'General Site Duty'}
                        </span>
                        {a.assetType === 'vehicle' ? (
                          <div className="text-[10px] text-slate-500 flex items-center gap-2">
                            {a.tripsCompleted !== undefined && a.tripsCompleted > 0 && (
                              <span>Trips: <strong className="text-slate-800">{a.tripsCompleted}</strong></span>
                            )}
                            {a.quantityTransported && (
                              <span>Qty: <strong className="text-slate-800">{a.quantityTransported}</strong></span>
                            )}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500">
                            {a.quantityHandled ? (
                              <span>Handled: <strong className="text-slate-800">{a.quantityHandled}</strong></span>
                            ) : (
                              <span>Machinery Service</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Odometer / Hour Meter & Output */}
                    <td className="py-2.5 px-3 font-mono text-[10.5px]">
                      {a.assetType === 'vehicle' ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-slate-700">
                            <Gauge size={10} className="text-[#46B351]" />
                            <span className="text-[10px] text-slate-400">Open:</span>
                            <strong>{Number(a.odometerOpeningKm || a.meterReadingAtAssign || 0).toLocaleString()} km</strong>
                          </div>
                          {(a.odometerClosingKm || a.meterReadingAtRelease) ? (
                            <div className="text-[9.5px] text-emerald-700 font-semibold">
                              Close: {Number(a.odometerClosingKm || a.meterReadingAtRelease).toLocaleString()} km
                              {a.distanceTravelled ? (
                                <span className="ml-1 text-[#46B351] font-bold">(+{a.distanceTravelled} km)</span>
                              ) : null}
                            </div>
                          ) : null}
                          {a.workingHours ? (
                            <span className="text-[9.5px] text-slate-400 block font-sans">
                              Shift: {a.workingHours} hrs
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-slate-700">
                            <Clock size={10} className="text-amber-500" />
                            <span className="text-[10px] text-slate-400">Open:</span>
                            <strong>{Number(a.hourMeterOpeningHours || a.meterReadingAtAssign || 0).toLocaleString()} hrs</strong>
                          </div>
                          {(a.hourMeterClosingHours || a.meterReadingAtRelease) ? (
                            <div className="text-[9.5px] text-amber-700 font-semibold">
                              Close: {Number(a.hourMeterClosingHours || a.meterReadingAtRelease).toLocaleString()} hrs
                              {a.workingHours ? (
                                <span className="ml-1 text-amber-600 font-bold">(+{a.workingHours} hrs)</span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </td>

                    {/* Personnel */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <User size={11} className="text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-800">{a.assignedToName || 'Unassigned'}</span>
                      </div>
                      <span className="text-[9.5px] text-slate-400 capitalize block">
                        {a.assignedToType || 'Personnel'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3">{getStatusBadge(a.status)}</td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-90 group-hover:opacity-100">
                        {/* View Info */}
                        <button
                          onClick={() => setViewingAssignment(a)}
                          title="View Operational Log"
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
                                meterReadingAtRelease: String(a.odometerClosingKm || a.hourMeterClosingHours || a.meterReadingAtAssign || ''),
                                odometerClosingKm: String(a.odometerClosingKm || a.meterReadingAtAssign || ''),
                                hourMeterClosingHours: String(a.hourMeterClosingHours || a.meterReadingAtAssign || ''),
                                distanceTravelled: String(a.distanceTravelled || ''),
                                workingHours: String(a.workingHours || ''),
                                tripsCompleted: String(a.tripsCompleted || ''),
                                quantityTransported: a.quantityTransported || '',
                                quantityHandled: a.quantityHandled || '',
                                notes: ''
                              });
                            }}
                            title="Complete Shift / Release Asset"
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
          MODAL 1: CREATE NEW ASSIGNMENT / SITE OPERATION LOG
          ────────────────────────────────────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-3.5 px-5 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-[#46B351] text-white flex items-center justify-center font-bold">
                  {formData.assetType === 'equipment' ? <HardHat size={16} /> : <Truck size={16} />}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-tight">
                    {formData.assetType === 'equipment' ? 'Heavy Equipment Shift & Site Log' : 'Vehicle Dispatch & Operations Log'}
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    Auto-links worksite location with project & tracks operational metrics
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
            <form onSubmit={handleCreateAssignment} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* 1. Date & Asset Selection */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Calendar size={13} className="text-slate-500" />
                    <span>Deployment Date & Target Asset</span>
                  </div>
                  {lastRecordedReading !== null && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles size={10} />
                      Last Recorded: {lastRecordedReading.toLocaleString()} {formData.assetType === 'equipment' ? 'hrs' : 'km'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                      Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={e => setFormData(prev => ({ ...prev, date: e.target.value, startDate: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#46B351]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                      {formData.assetType === 'equipment' ? 'Equipment Selector' : 'Vehicle Selector'} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.assetId}
                      onChange={e => handleSelectAsset(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#46B351]"
                    >
                      <option value="">-- Choose Fleet Asset --</option>
                      <optgroup label="🚚 Vehicles & Haulers">
                        {fleetOptions.filter(f => f.type === 'vehicle').map(f => (
                          <option key={f.id} value={String(f.id)}>
                            {f.number} • {f.title} ({f.status})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="🚜 Heavy Machinery & Equipment">
                        {fleetOptions.filter(f => f.type === 'equipment').map(f => (
                          <option key={f.id} value={String(f.id)}>
                            {f.number} • {f.title} ({f.status})
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. Automated Worksite Location Dropdown & Project Selection */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Compass size={13} className="text-[#46B351]" />
                    <span>Worksite Location & Project Automation</span>
                  </div>
                  <span className="text-[9.5px] text-slate-400 font-medium">
                    Select worksite &rarr; project auto-populates
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
                      {formData.worksiteName && (
                        <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Active
                        </span>
                      )}
                    </div>
                    <select
                      required
                      value={isCustomWorksite ? '__custom__' : (formData.worksiteId || '')}
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
                        value={formData.worksiteName}
                        onChange={e => setFormData(prev => ({ ...prev, worksiteName: e.target.value }))}
                        className="mt-1.5 w-full bg-white border border-[#46B351] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#46B351]"
                      />
                    )}
                  </div>

                  {/* Target Project Dropdown (Automated) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10.5px] font-semibold text-slate-700 flex items-center gap-1">
                        <Briefcase size={11} className="text-slate-500" />
                        <span>Project Selection</span>
                      </label>
                      {formData.projectName && (
                        <span className="text-[9px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          Linked
                        </span>
                      )}
                    </div>
                    <select
                      value={formData.projectName}
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
              </div>

              {/* 3. Operational Fields (Dynamic based on Vehicle vs Heavy Equipment) */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Activity size={13} className="text-[#46B351]" />
                    <span>
                      {formData.assetType === 'equipment' ? 'Heavy Equipment Operations & Hour Meter' : 'Vehicle Site Operations, Trips & Odometer'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 capitalize">
                    {formData.assetType} Mode
                  </span>
                </div>

                {/* Operations Dropdown with quick presets */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-semibold text-slate-500">
                      Site Operations / Task Type <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomOperation(!isCustomOperation)}
                      className="text-[9.5px] text-[#46B351] hover:underline font-bold"
                    >
                      {isCustomOperation ? 'Use Presets' : '+ Custom Operation'}
                    </button>
                  </div>

                  {isCustomOperation ? (
                    <input
                      type="text"
                      placeholder="e.g. Concrete Hauling, Road Bed Preparation"
                      value={formData.operations}
                      onChange={e => setFormData(prev => ({ ...prev, operations: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  ) : (
                    <select
                      value={formData.operations}
                      onChange={e => setFormData(prev => ({ ...prev, operations: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#46B351]"
                    >
                      <option value="">-- Select Operation Type --</option>
                      {(formData.assetType === 'equipment' ? EQUIPMENT_OPERATION_PRESETS : VEHICLE_OPERATION_PRESETS).map(op => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* DYNAMIC ROW: VEHICLE SPECIFIC (Trips, Transported, Odo Opening/Closing, Distance) */}
                {formData.assetType === 'vehicle' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                          Trips Completed
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 8"
                          value={formData.tripsCompleted}
                          onChange={e => setFormData(prev => ({ ...prev, tripsCompleted: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                          Quantity Transported
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 150 MT / 80 m³"
                          value={formData.quantityTransported}
                          onChange={e => setFormData(prev => ({ ...prev, quantityTransported: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                          Working Hours
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 8.5"
                          value={formData.workingHours}
                          onChange={e => setFormData(prev => ({ ...prev, workingHours: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                          Distance Travelled (KM)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Auto calc"
                          value={formData.distanceTravelled}
                          onChange={e => setFormData(prev => ({ ...prev, distanceTravelled: e.target.value }))}
                          className="w-full bg-emerald-50/50 border border-emerald-200/80 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-emerald-800"
                        />
                      </div>
                    </div>

                    {/* Odometer Readings */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-semibold text-slate-600 flex items-center gap-1">
                            <Gauge size={11} className="text-[#46B351]" />
                            <span>Odometer Opening KM</span>
                          </label>
                        </div>
                        <input
                          type="number"
                          placeholder="e.g. 45200"
                          value={formData.odometerOpeningKm}
                          onChange={e => handleOdoChange('odometerOpeningKm', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-semibold text-slate-600 flex items-center gap-1">
                            <Gauge size={11} className="text-blue-500" />
                            <span>Odometer Closing KM</span>
                          </label>
                        </div>
                        <input
                          type="number"
                          placeholder="e.g. 45350"
                          value={formData.odometerClosingKm}
                          onChange={e => handleOdoChange('odometerClosingKm', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* DYNAMIC ROW: HEAVY EQUIPMENT SPECIFIC (Quantity Handled, Working Hours, Hour Meter) */}
                {formData.assetType === 'equipment' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                          Quantity Handled (m³ / Tons)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 450 m³ Excavated"
                          value={formData.quantityHandled}
                          onChange={e => setFormData(prev => ({ ...prev, quantityHandled: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                          Working Hours (hrs)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Auto calc from hour meter"
                          value={formData.workingHours}
                          onChange={e => setFormData(prev => ({ ...prev, workingHours: e.target.value }))}
                          className="w-full bg-amber-50/50 border border-amber-200/80 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-amber-800"
                        />
                      </div>
                    </div>

                    {/* Hour Meter Readings */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-semibold text-slate-600 flex items-center gap-1">
                            <Clock size={11} className="text-amber-500" />
                            <span>Hour Meter Opening Hours</span>
                          </label>
                        </div>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 1420.5"
                          value={formData.hourMeterOpeningHours}
                          onChange={e => handleHourMeterChange('hourMeterOpeningHours', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-semibold text-slate-600 flex items-center gap-1">
                            <Clock size={11} className="text-amber-600" />
                            <span>Hour Meter Closing Hours</span>
                          </label>
                        </div>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 1428.5"
                          value={formData.hourMeterClosingHours}
                          onChange={e => handleHourMeterChange('hourMeterClosingHours', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Personnel Details */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <User size={13} className="text-slate-500" />
                  <span>
                    {formData.assetType === 'equipment' ? 'Equipment Operator Assignment' : 'Vehicle Driver Assignment'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold mb-0.5">Role Type</span>
                    <select
                      value={formData.assignedToType}
                      onChange={e => setFormData(prev => ({ ...prev, assignedToType: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700"
                    >
                      <option value="driver">Driver</option>
                      <option value="operator">Machinery Operator</option>
                      <option value="subcontractor">Subcontractor Staff</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold mb-0.5">Personnel Name</span>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={formData.assignedToName}
                      onChange={e => setFormData(prev => ({ ...prev, assignedToName: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold mb-0.5">Contact Phone</span>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={formData.assignedToPhone}
                      onChange={e => setFormData(prev => ({ ...prev, assignedToPhone: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="pt-1">
                  <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                    Operational Notes / Remarks
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Weather, shift supervisor remarks, route notes, or safety checks..."
                    value={formData.notes}
                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#46B351]"
                  />
                </div>
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
                  className="px-4 py-1.5 rounded-lg bg-[#46B351] hover:bg-[#3ca046] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Deploy & Record Shift'}
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
                    {viewingAssignment.assetTitle || 'Fleet Deployment'} • Log #{viewingAssignment.id}
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[9px] text-slate-400 font-semibold block">Asset Type</span>
                  <span className="font-bold text-slate-800 text-[11px] capitalize mt-0.5 block">
                    {viewingAssignment.assetType}
                  </span>
                </div>

                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[9px] text-slate-400 font-semibold block">Project</span>
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
                  <span className="text-[9px] text-slate-400 font-semibold block">Site Operations</span>
                  <span className="font-bold text-slate-800 text-[11px] truncate mt-0.5 block">
                    {viewingAssignment.operations || 'General'}
                  </span>
                </div>

                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[9px] text-slate-400 font-semibold block">Personnel</span>
                  <span className="font-bold text-slate-800 text-[11px] truncate mt-0.5 block">
                    {viewingAssignment.assignedToName || 'Unassigned'}
                  </span>
                </div>

                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[9px] text-slate-400 font-semibold block">Contact Phone</span>
                  <span className="font-bold text-slate-800 text-[11px] truncate mt-0.5 block">
                    {viewingAssignment.assignedToPhone || '—'}
                  </span>
                </div>
              </div>

              {/* Operational Metrics */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-bold text-slate-600 block uppercase tracking-wider">
                  Operational Output & Readings
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {viewingAssignment.assetType === 'vehicle' ? (
                    <>
                      <div className="p-2 bg-white rounded-lg border border-slate-200/60">
                        <span className="text-[9px] text-slate-400 font-semibold block">Trips Completed</span>
                        <span className="font-bold text-slate-800 text-[11px]">
                          {viewingAssignment.tripsCompleted || 0}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200/60">
                        <span className="text-[9px] text-slate-400 font-semibold block">Transported</span>
                        <span className="font-bold text-slate-800 text-[11px]">
                          {viewingAssignment.quantityTransported || '—'}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200/60">
                        <span className="text-[9px] text-slate-400 font-semibold block">Distance Travelled</span>
                        <span className="font-bold text-emerald-700 text-[11px]">
                          {viewingAssignment.distanceTravelled ? `${viewingAssignment.distanceTravelled} km` : '—'}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200/60">
                        <span className="text-[9px] text-slate-400 font-semibold block">Odometer Opening</span>
                        <span className="font-bold text-slate-800 text-[11px]">
                          {Number(viewingAssignment.odometerOpeningKm || viewingAssignment.meterReadingAtAssign || 0).toLocaleString()} km
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200/60">
                        <span className="text-[9px] text-slate-400 font-semibold block">Odometer Closing</span>
                        <span className="font-bold text-slate-800 text-[11px]">
                          {viewingAssignment.odometerClosingKm || viewingAssignment.meterReadingAtRelease
                            ? `${Number(viewingAssignment.odometerClosingKm || viewingAssignment.meterReadingAtRelease).toLocaleString()} km`
                            : 'Ongoing'}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200/60">
                        <span className="text-[9px] text-slate-400 font-semibold block">Working Hours</span>
                        <span className="font-bold text-slate-800 text-[11px]">
                          {viewingAssignment.workingHours ? `${viewingAssignment.workingHours} hrs` : '—'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-2 bg-white rounded-lg border border-slate-200/60">
                        <span className="text-[9px] text-slate-400 font-semibold block">Quantity Handled</span>
                        <span className="font-bold text-slate-800 text-[11px]">
                          {viewingAssignment.quantityHandled || '—'}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200/60">
                        <span className="text-[9px] text-slate-400 font-semibold block">Hour Meter Opening</span>
                        <span className="font-bold text-slate-800 text-[11px]">
                          {Number(viewingAssignment.hourMeterOpeningHours || viewingAssignment.meterReadingAtAssign || 0).toLocaleString()} hrs
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200/60">
                        <span className="text-[9px] text-slate-400 font-semibold block">Hour Meter Closing</span>
                        <span className="font-bold text-slate-800 text-[11px]">
                          {viewingAssignment.hourMeterClosingHours || viewingAssignment.meterReadingAtRelease
                            ? `${Number(viewingAssignment.hourMeterClosingHours || viewingAssignment.meterReadingAtRelease).toLocaleString()} hrs`
                            : 'Ongoing'}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200/60">
                        <span className="text-[9px] text-slate-400 font-semibold block">Working Hours</span>
                        <span className="font-bold text-amber-700 text-[11px]">
                          {viewingAssignment.workingHours ? `${viewingAssignment.workingHours} hrs` : '—'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {viewingAssignment.notes && (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="text-[9.5px] text-slate-400 font-semibold block mb-0.5">Notes & Directives:</span>
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
          MODAL 3: RELEASE ASSIGNMENT / COMPLETE SHIFT
          ────────────────────────────────────────────────────────────────────────── */}
      {releasingAssignment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightCircle size={18} className="text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Complete Shift & Release Asset
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
              Log closing metrics for <strong className="text-slate-900 font-mono">{releasingAssignment.assetNumber}</strong> ({releasingAssignment.assetType}) to return the asset to idle inventory.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                  Actual End Date
                </label>
                <input
                  type="date"
                  value={releaseForm.actualEndDate}
                  onChange={e => setReleaseForm(prev => ({ ...prev, actualEndDate: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                />
              </div>

              {releasingAssignment.assetType === 'vehicle' ? (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                        <Gauge size={11} className="text-[#46B351]" />
                        <span>Odometer Closing KM</span>
                      </label>
                      <span className="text-[10px] text-slate-400">
                        Opening: <strong className="text-slate-700 font-mono">{Number(releasingAssignment.odometerOpeningKm || releasingAssignment.meterReadingAtAssign || 0).toLocaleString()} km</strong>
                      </span>
                    </div>
                    <input
                      type="number"
                      placeholder="e.g. 45350"
                      value={releaseForm.odometerClosingKm}
                      onChange={e => {
                        const close = parseFloat(e.target.value);
                        const open = parseFloat(String(releasingAssignment.odometerOpeningKm || releasingAssignment.meterReadingAtAssign || 0));
                        setReleaseForm(prev => ({
                          ...prev,
                          odometerClosingKm: e.target.value,
                          meterReadingAtRelease: e.target.value,
                          distanceTravelled: (!isNaN(open) && !isNaN(close) && close >= open) ? String((close - open).toFixed(1)) : prev.distanceTravelled
                        }));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                    />
                    {releaseForm.distanceTravelled && (
                      <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                        Distance Travelled: +{releaseForm.distanceTravelled} KM
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-1">Trips Completed</label>
                      <input
                        type="number"
                        placeholder="e.g. 8"
                        value={releaseForm.tripsCompleted}
                        onChange={e => setReleaseForm(prev => ({ ...prev, tripsCompleted: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-1">Quantity Transported</label>
                      <input
                        type="text"
                        placeholder="e.g. 150 MT"
                        value={releaseForm.quantityTransported}
                        onChange={e => setReleaseForm(prev => ({ ...prev, quantityTransported: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                        <Clock size={11} className="text-amber-500" />
                        <span>Hour Meter Closing Hours</span>
                      </label>
                      <span className="text-[10px] text-slate-400">
                        Opening: <strong className="text-slate-700 font-mono">{Number(releasingAssignment.hourMeterOpeningHours || releasingAssignment.meterReadingAtAssign || 0).toLocaleString()} hrs</strong>
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 1428.5"
                      value={releaseForm.hourMeterClosingHours}
                      onChange={e => {
                        const close = parseFloat(e.target.value);
                        const open = parseFloat(String(releasingAssignment.hourMeterOpeningHours || releasingAssignment.meterReadingAtAssign || 0));
                        setReleaseForm(prev => ({
                          ...prev,
                          hourMeterClosingHours: e.target.value,
                          meterReadingAtRelease: e.target.value,
                          workingHours: (!isNaN(open) && !isNaN(close) && close >= open) ? String((close - open).toFixed(1)) : prev.workingHours
                        }));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                    />
                    {releaseForm.workingHours && (
                      <span className="text-[10px] text-amber-600 font-bold block mt-1">
                        Working Hours: +{releaseForm.workingHours} Hours
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">Quantity Handled</label>
                    <input
                      type="text"
                      placeholder="e.g. 450 m³"
                      value={releaseForm.quantityHandled}
                      onChange={e => setReleaseForm(prev => ({ ...prev, quantityHandled: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-[10px] text-slate-500 font-semibold block mb-1">Closing Notes</label>
                <textarea
                  rows={2}
                  placeholder="Asset condition, fuel level on return, etc."
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
                {saving ? 'Releasing...' : 'Confirm Shift Release'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

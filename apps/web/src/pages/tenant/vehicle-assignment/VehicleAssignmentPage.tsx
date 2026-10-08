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
  ArrowRightCircle
} from 'lucide-react';

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
}

export default function VehicleAssignmentPage() {
  const { currentUser } = useAuth();

  // Data states
  const [assignments, setAssignments] = useState<VehicleAssignment[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState<'All' | 'vehicle' | 'equipment'>('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingAssignment, setViewingAssignment] = useState<VehicleAssignment | null>(null);
  const [releasingAssignment, setReleasingAssignment] = useState<VehicleAssignment | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Form State for New Assignment
  const [formData, setFormData] = useState({
    assetType: 'vehicle' as 'vehicle' | 'equipment',
    assetId: '',
    assetNumber: '',
    assetTitle: '',
    projectId: '',
    projectName: '',
    worksiteName: '',
    assignedToType: 'driver',
    assignedToName: '',
    assignedToPhone: '',
    startDate: new Date().toISOString().split('T')[0],
    expectedEndDate: '',
    meterReadingAtAssign: '',
    notes: '',
    status: 'Active'
  });

  // Release Form State
  const [releaseForm, setReleaseForm] = useState({
    actualEndDate: new Date().toISOString().split('T')[0],
    meterReadingAtRelease: '',
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
      const pRes = await apiFetch('/api/tenant/projects');
      if (pRes.ok) {
        const pData = await pRes.json();
        setProjectsList(Array.isArray(pData) ? pData : []);
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
      status: v.status || 'Active'
    }));

    const eqList: FleetAsset[] = availableEquipment.map(eq => ({
      id: eq.id,
      type: 'equipment',
      number: eq.equipmentId || eq.equipmentNumber,
      title: `${eq.equipmentType} • ${eq.make || ''} ${eq.model || ''}`.trim(),
      category: 'Heavy Equipment',
      status: eq.status || 'Active'
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

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [assignments, searchQuery, assetTypeFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = assignments.length;
    const active = assignments.filter(a => a.status === 'Active').length;
    const scheduled = assignments.filter(a => a.status === 'Scheduled').length;
    const released = assignments.filter(a => a.status === 'Released').length;
    return { total, active, scheduled, released };
  }, [assignments]);

  // Handle Asset selection in modal
  const handleSelectAsset = (assetId: string) => {
    const selected = fleetOptions.find(f => String(f.id) === String(assetId));
    if (selected) {
      setFormData(prev => ({
        ...prev,
        assetId: String(selected.id),
        assetType: selected.type,
        assetNumber: selected.number,
        assetTitle: selected.title
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        assetId: '',
        assetNumber: '',
        assetTitle: ''
      }));
    }
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
      const res = await apiFetch('/api/tenant/vehicle-assignments', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Failed to create assignment');

      showToast('Asset assignment successfully created!', 'success');
      setIsCreateModalOpen(false);
      setFormData({
        assetType: 'vehicle',
        assetId: '',
        assetNumber: '',
        assetTitle: '',
        projectId: '',
        projectName: '',
        worksiteName: '',
        assignedToType: 'driver',
        assignedToName: '',
        assignedToPhone: '',
        startDate: new Date().toISOString().split('T')[0],
        expectedEndDate: '',
        meterReadingAtAssign: '',
        notes: '',
        status: 'Active'
      });
      fetchData();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error saving assignment', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Release Asset Assignment
  const handleReleaseAssignment = async () => {
    if (!releasingAssignment) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/api/tenant/vehicle-assignments/${releasingAssignment.id}/release`, {
        method: 'PATCH',
        body: JSON.stringify(releaseForm)
      });

      if (!res.ok) throw new Error('Failed to release assignment');

      showToast('Asset assignment completed and asset released!', 'success');
      setReleasingAssignment(null);
      setReleaseForm({
        actualEndDate: new Date().toISOString().split('T')[0],
        meterReadingAtRelease: '',
        notes: ''
      });
      fetchData();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error releasing asset', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete Assignment Record
  const handleDeleteAssignment = async (id: number | string) => {
    if (!window.confirm('Are you sure you want to delete this assignment record?')) return;
    try {
      const res = await apiFetch(`/api/tenant/vehicle-assignments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete assignment');
      showToast('Assignment record deleted', 'success');
      fetchData();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error deleting record', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        );
      case 'Scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock size={9} className="text-blue-600" />
            Scheduled
          </span>
        );
      case 'Released':
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <Check size={9} className="text-slate-500" />
            Released
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
              : toast.type === 'error'
              ? 'bg-rose-900 text-rose-100 border-rose-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-400" />
          ) : (
            <AlertCircle size={16} className="text-rose-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-[#46B351] text-white flex items-center justify-center shadow-xs">
              <Truck size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Vehicle & Equipment Assignment</h1>
              <p className="text-xs text-slate-500">
                Allocate and track fleet vehicles and heavy machinery assigned to projects and operators
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#46B351] hover:bg-[#3ca046] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus size={16} />
            New Assignment
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Assignments</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Layers size={14} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.total}</p>
          <p className="text-[11px] text-slate-400 mt-1">Total assignment dispatches recorded</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Deployments</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Truck size={14} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600">{stats.active}</p>
          <p className="text-[11px] text-slate-400 mt-1">Currently operating on project sites</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Scheduled</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Clock size={14} />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-600">{stats.scheduled}</p>
          <p className="text-[11px] text-slate-400 mt-1">Planned for upcoming dates</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Completed / Released</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-700">{stats.released}</p>
          <p className="text-[11px] text-slate-400 mt-1">Returned to idle status</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by asset, driver, project, or worksite..."
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
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#46B351]"
          >
            <option value="All">All Assets</option>
            <option value="vehicle">Vehicles Only</option>
            <option value="equipment">Heavy Machinery Only</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-2">
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#46B351]"
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
              {searchQuery || statusFilter !== 'All' || assetTypeFilter !== 'All'
                ? 'No matching assignments found for current filters.'
                : 'Get started by creating your first vehicle or equipment deployment.'}
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
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
                  <th className="py-2 px-2.5">Asset & Identifier</th>
                  <th className="py-2 px-2.5">Type & Title</th>
                  <th className="py-2 px-2.5">Assigned To</th>
                  <th className="py-2 px-2.5">Project & Worksite</th>
                  <th className="py-2 px-2.5">Timeline</th>
                  <th className="py-2 px-2.5">Meter Reading</th>
                  <th className="py-2 px-2.5">Status</th>
                  <th className="py-2 px-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {filteredAssignments.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Asset Number */}
                    <td className="py-2 px-2.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                            a.assetType === 'equipment'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {a.assetType === 'equipment' ? <HardHat size={13} /> : <Truck size={13} />}
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-900 font-mono">
                            {a.assetNumber}
                          </span>
                          <span className="block text-[10px] text-slate-400 capitalize font-medium">
                            {a.assetType}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Type & Title */}
                    <td className="py-2 px-2.5">
                      <span className="font-bold text-[11px] text-slate-800 block truncate max-w-[180px]">
                        {a.assetTitle || 'Standard Asset'}
                      </span>
                    </td>

                    {/* Assigned Person */}
                    <td className="py-2 px-2.5">
                      <div className="flex items-center gap-1.5">
                        <User size={11} className="text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-800">{a.assignedToName || 'Unassigned'}</span>
                      </div>
                      {a.assignedToPhone && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                          <Phone size={9} className="text-slate-400" />
                          <span>{a.assignedToPhone}</span>
                        </div>
                      )}
                    </td>

                    {/* Project & Worksite */}
                    <td className="py-2 px-2.5">
                      <div className="flex items-center gap-1.5">
                        <Briefcase size={11} className="text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800 truncate max-w-[160px]">
                          {a.projectName || 'General Deployment'}
                        </span>
                      </div>
                      {a.worksiteName && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                          <MapPin size={9} className="text-slate-400" />
                          <span className="truncate max-w-[160px]">{a.worksiteName}</span>
                        </div>
                      )}
                    </td>

                    {/* Timeline */}
                    <td className="py-2 px-2.5 text-[10.5px]">
                      <span className="font-medium text-slate-700">From: {a.startDate || '—'}</span>
                      {a.expectedEndDate && (
                        <span className="block text-[10px] text-slate-400">
                          Due: {a.expectedEndDate}
                        </span>
                      )}
                    </td>

                    {/* Meter Reading */}
                    <td className="py-2 px-2.5 font-mono text-[10.5px]">
                      <span className="font-bold text-slate-800">
                        {Number(a.meterReadingAtAssign || 0).toLocaleString()}
                      </span>
                      <span className="text-[9.5px] text-slate-400 ml-1">
                        {a.assetType === 'equipment' ? 'hrs' : 'km'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-2 px-2.5">{getStatusBadge(a.status)}</td>

                    {/* Actions */}
                    <td className="py-2 px-2.5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-90 group-hover:opacity-100">
                        {/* View Info */}
                        <button
                          onClick={() => setViewingAssignment(a)}
                          title="View Assignment Info"
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
                                meterReadingAtRelease: String(a.meterReadingAtAssign || ''),
                                notes: ''
                              });
                            }}
                            title="Release / Unassign Asset"
                            className="p-1 rounded-md text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
                          >
                            <ArrowRightCircle size={13} />
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteAssignment(a.id)}
                          title="Delete Assignment"
                          className="p-1 rounded-md text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
          MODAL 1: CREATE NEW ASSIGNMENT
          ────────────────────────────────────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-3.5 px-5 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-[#46B351] text-white flex items-center justify-center shrink-0">
                  <Plus size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-tight">Create Asset Assignment</h3>
                  <span className="text-[10px] text-slate-500">Deploy vehicle or equipment to a project site</span>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleCreateAssignment} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto p-4 px-5 space-y-3.5 flex-1">
                {/* 1. Select Asset */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Select Vehicle or Machinery <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.assetId}
                    onChange={e => handleSelectAsset(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#46B351]/20 focus:border-[#46B351]"
                  >
                    <option value="">-- Choose Asset from Fleet --</option>
                    <optgroup label="🚛 Vehicles">
                      {fleetOptions
                        .filter(f => f.type === 'vehicle')
                        .map(v => (
                          <option key={v.id} value={v.id}>
                            {v.number} — {v.title} ({v.status})
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="🚜 Heavy Machinery">
                      {fleetOptions
                        .filter(f => f.type === 'equipment')
                        .map(eq => (
                          <option key={eq.id} value={eq.id}>
                            {eq.number} — {eq.title} ({eq.status})
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>

                {/* 2. Project & Worksite */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Target Project
                    </label>
                    <select
                      value={formData.projectName}
                      onChange={e => {
                        const pName = e.target.value;
                        const pObj = projectsList.find(p => p.name === pName);
                        setFormData(prev => ({
                          ...prev,
                          projectName: pName,
                          projectId: pObj ? String(pObj.id) : ''
                        }));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#46B351]"
                    >
                      <option value="">-- Select Project (Optional) --</option>
                      {projectsList.map(p => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Worksite Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. North Zone Quarry, Bridge Site"
                      value={formData.worksiteName}
                      onChange={e => setFormData(prev => ({ ...prev, worksiteName: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#46B351]"
                    />
                  </div>
                </div>

                {/* 3. Driver / Operator Assignment */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <User size={13} className="text-slate-500" />
                    <span>Designated Personnel</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">Role Type</span>
                      <select
                        value={formData.assignedToType}
                        onChange={e => setFormData(prev => ({ ...prev, assignedToType: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700"
                      >
                        <option value="driver">Driver</option>
                        <option value="operator">Machinery Operator</option>
                        <option value="subcontractor">Subcontractor</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">Person Name</span>
                      <input
                        type="text"
                        placeholder="e.g. Rajesh Kumar"
                        value={formData.assignedToName}
                        onChange={e => setFormData(prev => ({ ...prev, assignedToName: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">Phone Contact</span>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={formData.assignedToPhone}
                      onChange={e => setFormData(prev => ({ ...prev, assignedToPhone: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700"
                    />
                  </div>
                </div>

                {/* 4. Timeline & Meter Reading */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                      Start Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                      Expected End Date
                    </label>
                    <input
                      type="date"
                      value={formData.expectedEndDate}
                      onChange={e => setFormData(prev => ({ ...prev, expectedEndDate: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                      Meter at Dispatch
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={formData.meterReadingAtAssign}
                      onChange={e => setFormData(prev => ({ ...prev, meterReadingAtAssign: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                    Assignment Notes / Instructions
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Work orders reference, shift details, or safety instructions..."
                    value={formData.notes}
                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#46B351]"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-3 px-5 border-t border-slate-100 bg-slate-50/50 shrink-0">
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
                  {saving ? 'Creating...' : 'Deploy Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          MODAL 2: VIEW ASSIGNMENT DETAILS ("ℹ")
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
                    {viewingAssignment.assetTitle || 'Asset Deployment'} • Assignment #{viewingAssignment.id}
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
            <div className="overflow-y-auto p-3.5 px-4.5 space-y-3 flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-slate-50/80 rounded-lg border border-slate-100">
                  <span className="text-[9px] text-slate-400 block font-semibold leading-tight">Asset Type</span>
                  <span className="font-bold text-slate-800 text-[11px] truncate block mt-0.5 capitalize">
                    {viewingAssignment.assetType}
                  </span>
                </div>
                <div className="p-2 bg-slate-50/80 rounded-lg border border-slate-100">
                  <span className="text-[9px] text-slate-400 block font-semibold leading-tight">Assigned To</span>
                  <span className="font-bold text-slate-800 text-[11px] truncate block mt-0.5">
                    {viewingAssignment.assignedToName || 'Unassigned'}
                  </span>
                </div>
                <div className="p-2 bg-slate-50/80 rounded-lg border border-slate-100">
                  <span className="text-[9px] text-slate-400 block font-semibold leading-tight">Phone Contact</span>
                  <span className="font-bold text-slate-800 text-[11px] truncate block mt-0.5">
                    {viewingAssignment.assignedToPhone || '—'}
                  </span>
                </div>
                <div className="p-2 bg-slate-50/80 rounded-lg border border-slate-100">
                  <span className="text-[9px] text-slate-400 block font-semibold leading-tight">Project</span>
                  <span className="font-bold text-slate-800 text-[11px] truncate block mt-0.5">
                    {viewingAssignment.projectName || '—'}
                  </span>
                </div>
                <div className="p-2 bg-slate-50/80 rounded-lg border border-slate-100">
                  <span className="text-[9px] text-slate-400 block font-semibold leading-tight">Worksite</span>
                  <span className="font-bold text-slate-800 text-[11px] truncate block mt-0.5">
                    {viewingAssignment.worksiteName || '—'}
                  </span>
                </div>
                <div className="p-2 bg-slate-50/80 rounded-lg border border-slate-100">
                  <span className="text-[9px] text-slate-400 block font-semibold leading-tight">Status</span>
                  <div className="mt-0.5">{getStatusBadge(viewingAssignment.status)}</div>
                </div>
                <div className="p-2 bg-slate-50/80 rounded-lg border border-slate-100">
                  <span className="text-[9px] text-slate-400 block font-semibold leading-tight">Start Date</span>
                  <span className="font-bold text-slate-800 text-[11px] truncate block mt-0.5">
                    {viewingAssignment.startDate || '—'}
                  </span>
                </div>
                <div className="p-2 bg-slate-50/80 rounded-lg border border-slate-100">
                  <span className="text-[9px] text-slate-400 block font-semibold leading-tight">Expected End</span>
                  <span className="font-bold text-slate-800 text-[11px] truncate block mt-0.5">
                    {viewingAssignment.expectedEndDate || 'Ongoing'}
                  </span>
                </div>
                <div className="p-2 bg-slate-50/80 rounded-lg border border-slate-100">
                  <span className="text-[9px] text-slate-400 block font-semibold leading-tight">Dispatch Meter</span>
                  <span className="font-bold text-slate-800 text-[11px] truncate block mt-0.5">
                    {Number(viewingAssignment.meterReadingAtAssign || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {viewingAssignment.actualEndDate && (
                <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-[9.5px] text-slate-500 block font-semibold">Released Date:</span>
                    <span className="font-bold text-slate-800">{viewingAssignment.actualEndDate}</span>
                  </div>
                  <div>
                    <span className="text-[9.5px] text-slate-500 block font-semibold">Meter at Release:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {Number(viewingAssignment.meterReadingAtRelease || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {viewingAssignment.notes && (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="text-[9.5px] text-slate-400 font-semibold block mb-0.5">Directives / Notes:</span>
                  <p className="text-slate-700 text-[11px]">{viewingAssignment.notes}</p>
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
          MODAL 3: RELEASE ASSIGNMENT
          ────────────────────────────────────────────────────────────────────────── */}
      {releasingAssignment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightCircle size={18} className="text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Release Asset Assignment</h3>
              </div>
              <button
                onClick={() => setReleasingAssignment(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Complete deployment for <span className="font-bold text-slate-900">{releasingAssignment.assetNumber}</span> and return the asset to idle inventory.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10.5px] text-slate-500 font-semibold block mb-1">
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
                <label className="text-[10.5px] text-slate-500 font-semibold block mb-1">
                  Final Meter Reading ({releasingAssignment.assetType === 'equipment' ? 'hrs' : 'km'})
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1540.5"
                  value={releaseForm.meterReadingAtRelease}
                  onChange={e => setReleaseForm(prev => ({ ...prev, meterReadingAtRelease: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="text-[10.5px] text-slate-500 font-semibold block mb-1">
                  Closing Notes
                </label>
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
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleReleaseAssignment}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
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

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
  Fuel,
  IndianRupee,
  Calendar,
  MapPin,
  User,
  Phone,
  Layers,
  FileText,
  CheckCircle2,
  Clock,
  Briefcase,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  Car,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Eye,
  Maximize2,
  Minimize2,
  ExternalLink
} from 'lucide-react';

interface FleetDailyLog {
  id: number;
  tenantId?: string;
  assetId?: string;
  assetType: 'vehicle' | 'equipment';
  assetNumber: string;
  assetTitle?: string;
  assignmentId?: number;
  projectId?: string;
  projectName?: string;
  worksiteId?: string;
  worksiteName?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  helperId?: string;
  helperName?: string;
  helperRole?: string;
  helperPhone?: string;
  logDate: string;
  shift: 'Day' | 'Night' | string;
  stage: 'Working at Site' | 'On Trip / In Transit' | 'Idle / Standby' | 'Refueling' | 'Breakdown / Maintenance' | string;
  startOdometer: number | string;
  endOdometer: number | string;
  distanceRun: number | string;
  engineHoursStart?: number | string;
  engineHoursEnd?: number | string;
  engineHoursTotal?: number | string;
  fuelFilledLiters: number | string;
  fuelRatePerLiter: number | string;
  fuelTotalCost: number | string;
  fuelStation?: string;
  fuelBillNumber?: string;
  fuelEfficiency: number | string;
  tollAmount: number | string;
  fastagDeduction: number | string;
  otherExpenses: number | string;
  tripsCount: number;
  remarks?: string;
  createdAt?: string;
}

interface OperationalStats {
  summary: {
    activeAssetsCount: string | number;
    totalKmRun: string | number;
    totalFuelLiters: string | number;
    totalFuelCost: string | number;
    totalTollExpenses: string | number;
    totalTripsCount: string | number;
    avgMileageKmPerLiter: string | number;
  };
  projectRollup: Array<{
    projectName: string;
    logsCount: string | number;
    totalKm: string | number;
    totalFuelLiters: string | number;
    totalFuelCost: string | number;
    totalToll: string | number;
  }>;
}

export default function FleetOperationsPage() {
  const { currentUser } = useAuth();

  // Data states
  const [logs, setLogs] = useState<FleetDailyLog[]>([]);
  const [stats, setStats] = useState<OperationalStats | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('All');
  const [stageFilter, setStageFilter] = useState('All');
  const [assetTypeFilter, setAssetTypeFilter] = useState('All');

  // Modals
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [viewingLog, setViewingLog] = useState<FleetDailyLog | null>(null);
  const [isDetailFullScreen, setIsDetailFullScreen] = useState(false);
  const [vehicleHistoryAsset, setVehicleHistoryAsset] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Form State for Log Entry
  const initialLogForm = {
    assignmentId: '',
    assetNumber: '',
    assetTitle: '',
    assetType: 'vehicle' as 'vehicle' | 'equipment',
    projectId: '',
    projectName: '',
    worksiteId: '',
    worksiteName: '',
    driverName: '',
    driverPhone: '',
    helperName: '',
    helperRole: '',
    helperPhone: '',
    logDate: new Date().toISOString().split('T')[0],
    shift: 'Day',
    stage: 'Working at Site',
    startOdometer: '',
    endOdometer: '',
    distanceRun: '',
    engineHoursStart: '',
    engineHoursEnd: '',
    fuelFilledLiters: '',
    fuelRatePerLiter: '94.50',
    fuelTotalCost: '',
    fuelStation: '',
    fuelBillNumber: '',
    tollAmount: '',
    fastagDeduction: '',
    otherExpenses: '',
    tripsCount: '1',
    remarks: ''
  };
  const [logForm, setLogForm] = useState(initialLogForm);

  // Load Data
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Fleet Logs
      const logsRes = await apiFetch('/api/tenant/fleet-logs');
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(Array.isArray(logsData) ? logsData : []);
      }

      // 2. Fetch Operational Stats
      const statsRes = await apiFetch('/api/tenant/fleet-logs/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 3. Fetch Active Assignments to select from
      const aRes = await apiFetch('/api/tenant/vehicle-assignments');
      if (aRes.ok) {
        const aData = await aRes.json();
        setAssignments(Array.isArray(aData) ? aData : []);
      }

      // 4. Fetch Projects
      const pUrl = currentUser?.uid ? `/api/tenant/projects/${currentUser.uid}` : '/api/tenant/projects';
      const pRes = await apiFetch(pUrl);
      if (pRes.ok) {
        const pData = await pRes.json();
        setProjectsList(Array.isArray(pData) ? pData : []);
      }
    } catch (err: any) {
      console.error('[FleetOperations] Fetch error:', err);
      showToast('Could not load fleet logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  // Handle Assignment Selection in Form
  const handleSelectAssignmentInForm = (assignId: string) => {
    const selected = assignments.find(a => String(a.id) === String(assignId));
    if (selected) {
      const lastEnd = selected.odometerClosingKm || selected.meterReadingAtAssign || 0;
      setLogForm(prev => ({
        ...prev,
        assignmentId: String(selected.id),
        assetNumber: selected.assetNumber,
        assetTitle: selected.assetTitle || selected.assetType,
        assetType: selected.assetType || 'vehicle',
        projectId: selected.projectId || '',
        projectName: selected.projectName || '',
        worksiteId: selected.worksiteId || '',
        worksiteName: selected.worksiteName || '',
        driverName: selected.assignedToName || '',
        driverPhone: selected.assignedToPhone || '',
        helperName: selected.helperName || '',
        helperRole: selected.helperRole || '',
        helperPhone: selected.helperPhone || '',
        startOdometer: lastEnd > 0 ? String(lastEnd) : prev.startOdometer
      }));
    } else {
      setLogForm(prev => ({
        ...prev,
        assignmentId: '',
        assetNumber: '',
        assetTitle: '',
        projectName: '',
        worksiteName: '',
        driverName: '',
        driverPhone: '',
        helperName: '',
        helperRole: '',
        helperPhone: ''
      }));
    }
  };

  // Auto-calculate distance run
  const calculatedDistance = useMemo(() => {
    const start = parseFloat(logForm.startOdometer) || 0;
    const end = parseFloat(logForm.endOdometer) || 0;
    if (end > start) {
      return (end - start).toFixed(1);
    }
    return '';
  }, [logForm.startOdometer, logForm.endOdometer]);

  // Auto-calculate fuel total cost
  const calculatedFuelCost = useMemo(() => {
    const liters = parseFloat(logForm.fuelFilledLiters) || 0;
    const rate = parseFloat(logForm.fuelRatePerLiter) || 0;
    if (liters > 0 && rate > 0) {
      return (liters * rate).toFixed(2);
    }
    return '';
  }, [logForm.fuelFilledLiters, logForm.fuelRatePerLiter]);

  // Live estimated mileage
  const calculatedMileage = useMemo(() => {
    const dist = parseFloat(calculatedDistance || logForm.distanceRun) || 0;
    const fuel = parseFloat(logForm.fuelFilledLiters) || 0;
    if (dist > 0 && fuel > 0) {
      return (dist / fuel).toFixed(2);
    }
    return null;
  }, [calculatedDistance, logForm.distanceRun, logForm.fuelFilledLiters]);

  // Submit New Daily Log
  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logForm.assetNumber) {
      showToast('Please select a vehicle / equipment', 'error');
      return;
    }

    setSaving(true);
    try {
      const dist = calculatedDistance ? parseFloat(calculatedDistance) : (parseFloat(logForm.distanceRun) || 0);
      const fuelCost = calculatedFuelCost ? parseFloat(calculatedFuelCost) : (parseFloat(logForm.fuelTotalCost) || 0);

      const payload = {
        ...logForm,
        distanceRun: dist,
        fuelTotalCost: fuelCost,
        tenantId: currentUser?.uid || 'demo-tenant'
      };

      const res = await apiFetch('/api/tenant/fleet-logs', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to create operational log');
      }

      showToast(`Daily log recorded for ${logForm.assetNumber}!`, 'success');
      setIsLogModalOpen(false);
      setLogForm(initialLogForm);
      fetchData();
    } catch (err: any) {
      console.error('[CreateLog] Error:', err);
      showToast(err.message || 'Failed to save log', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete Log
  const handleDeleteLog = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this trip log?')) return;
    try {
      const res = await apiFetch(`/api/tenant/fleet-logs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Log entry removed', 'info');
        fetchData();
      }
    } catch (err) {
      showToast('Could not delete log', 'error');
    }
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        l.assetNumber.toLowerCase().includes(q) ||
        (l.assetTitle || '').toLowerCase().includes(q) ||
        (l.driverName || '').toLowerCase().includes(q) ||
        (l.projectName || '').toLowerCase().includes(q) ||
        (l.worksiteName || '').toLowerCase().includes(q) ||
        (l.fuelBillNumber || '').toLowerCase().includes(q);

      const matchesProject = selectedProject === 'All' || l.projectName === selectedProject;
      const matchesStage = stageFilter === 'All' || l.stage === stageFilter;
      const matchesType = assetTypeFilter === 'All' || l.assetType === assetTypeFilter;

      return matchesSearch && matchesProject && matchesStage && matchesType;
    });
  }, [logs, searchQuery, selectedProject, stageFilter, assetTypeFilter]);

  // Stage Badge Helper
  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'Working at Site':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Working at Site
          </span>
        );
      case 'On Trip / In Transit':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            On Trip / Transit
          </span>
        );
      case 'Idle / Standby':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Idle / Standby
          </span>
        );
      case 'Refueling':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Fuel size={10} className="text-purple-600" />
            Refueling
          </span>
        );
      case 'Breakdown / Maintenance':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle size={10} className="text-rose-600" />
            Maintenance
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
            {stage}
          </span>
        );
    }
  };

  // Selected Project Rollup Data
  const currentProjectStats = useMemo(() => {
    if (!stats || selectedProject === 'All') return null;
    return stats.projectRollup.find(p => p.projectName === selectedProject) || null;
  }, [stats, selectedProject]);

  // Vehicle History Filter
  const vehicleHistoryLogs = useMemo(() => {
    if (!vehicleHistoryAsset) return [];
    return logs.filter(l => l.assetNumber === vehicleHistoryAsset);
  }, [logs, vehicleHistoryAsset]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold animate-in slide-in-from-bottom-5 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-900/95 text-white border-emerald-500/30'
              : toast.type === 'error'
              ? 'bg-rose-900/95 text-white border-rose-500/30'
              : 'bg-slate-900/95 text-white border-slate-700'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-slate-900 text-[#46B351] flex items-center justify-center font-bold shadow-xs">
              <Gauge size={19} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                Fleet Operations, Fuel & Running Logs
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  Industrial Telemetry
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Live running stages, shift odometer distance, diesel consumption, Fastag tolls, and project cost rollups
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchData}
            title="Refresh logs"
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => {
              setLogForm(initialLogForm);
              setIsLogModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#46B351] hover:bg-[#3ca046] text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>+ Log Daily Trip & Fuel</span>
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          INDUSTRIAL KPI METRIC RIBBON (5 KEY TELEMETRY METRICS)
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Metric 1: Active Fleet */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Active Fleet</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Truck size={14} />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {stats?.summary?.activeAssetsCount || logs.length}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">Assets Operating</span>
          </div>
          <div className="mt-1 text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
            <CheckCircle2 size={10} />
            <span>Deployed to Worksites</span>
          </div>
        </div>

        {/* Metric 2: Total KM Run */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Total KM Run</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Gauge size={14} />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-900 font-mono tracking-tight">
              {Number(stats?.summary?.totalKmRun || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] font-bold text-slate-500">KM</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            Across {stats?.summary?.totalTripsCount || logs.length} Shift Runs
          </div>
        </div>

        {/* Metric 3: Fuel Consumed */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Fuel Burned</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Fuel size={14} />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-900 font-mono tracking-tight">
              {Number(stats?.summary?.totalFuelLiters || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] font-bold text-slate-500">Liters</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500 font-semibold">
            ₹{Number(stats?.summary?.totalFuelCost || 0).toLocaleString('en-IN')} Diesel Cost
          </div>
        </div>

        {/* Metric 4: Fleet Avg Mileage */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Fleet Efficiency</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Activity size={14} />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-900 font-mono tracking-tight">
              {stats?.summary?.avgMileageKmPerLiter || '3.45'}
            </span>
            <span className="text-[11px] font-bold text-slate-500">KM / L</span>
          </div>
          <div className="mt-1 text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
            <TrendingUp size={10} />
            <span>Average Heavy Fleet Burn</span>
          </div>
        </div>

        {/* Metric 5: Toll & Fastag */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Tolls & Fastag</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <Receipt size={14} />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-900 font-mono tracking-tight">
              ₹{Number(stats?.summary?.totalTollExpenses || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            Highway Fastag & Transit Tolls
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          PROJECT COST ROLLUP BANNER (WHEN A PROJECT IS SELECTED OR HIGHLIGHTED)
          ────────────────────────────────────────────────────────────────────────── */}
      {selectedProject !== 'All' && currentProjectStats && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 rounded-2xl border border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Briefcase size={14} className="text-[#46B351]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#46B351]">Project Cost Rollup</span>
            </div>
            <h3 className="text-base font-bold text-white leading-tight">
              {currentProjectStats.projectName}
            </h3>
            <p className="text-xs text-slate-400">
              Total aggregated operational telemetry logged for this project
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 p-3 rounded-xl border border-white/10 shrink-0">
            <div>
              <span className="text-[9.5px] text-slate-400 block font-semibold">Total Distance</span>
              <span className="text-sm font-bold font-mono text-white block mt-0.5">
                {Number(currentProjectStats.totalKm).toLocaleString('en-IN')} KM
              </span>
            </div>
            <div>
              <span className="text-[9.5px] text-slate-400 block font-semibold">Fuel Burned</span>
              <span className="text-sm font-bold font-mono text-white block mt-0.5">
                {Number(currentProjectStats.totalFuelLiters).toLocaleString('en-IN')} L
              </span>
            </div>
            <div>
              <span className="text-[9.5px] text-slate-400 block font-semibold">Fuel Expense</span>
              <span className="text-sm font-bold font-mono text-emerald-400 block mt-0.5">
                ₹{Number(currentProjectStats.totalFuelCost).toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-[9.5px] text-slate-400 block font-semibold">Tolls & En-Route</span>
              <span className="text-sm font-bold font-mono text-amber-300 block mt-0.5">
                ₹{Number(currentProjectStats.totalToll).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          FILTERS & STAGE TABS
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-3 space-y-3">
        {/* Top Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by vehicle, driver, project, or fuel bill no..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#46B351]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {/* Project Filter */}
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#46B351]"
            >
              <option value="All">All Projects</option>
              {projectsList.map(p => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Asset Type Filter */}
            <select
              value={assetTypeFilter}
              onChange={e => setAssetTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#46B351]"
            >
              <option value="All">All Assets</option>
              <option value="vehicle">Trucks & Tippers</option>
              <option value="equipment">Heavy Machinery</option>
            </select>

            {/* Stage Filter */}
            <select
              value={stageFilter}
              onChange={e => setStageFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#46B351]"
            >
              <option value="All">All Stages</option>
              <option value="Working at Site">Working at Site</option>
              <option value="On Trip / In Transit">On Trip / In Transit</option>
              <option value="Idle / Standby">Idle / Standby</option>
              <option value="Refueling">Refueling</option>
              <option value="Breakdown / Maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        {/* Stage Pill Quick Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold pt-1 border-t border-slate-100">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">Stage:</span>
          {['All', 'Working at Site', 'On Trip / In Transit', 'Idle / Standby', 'Refueling', 'Breakdown / Maintenance'].map(st => {
            const count = st === 'All' ? logs.length : logs.filter(l => l.stage === st).length;
            const isSel = stageFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStageFilter(st)}
                className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isSel
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                <span>{st}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${isSel ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          MAIN LOGS DATA TABLE
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden w-full">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw size={14} className="animate-spin text-slate-500" />
            Loading fleet operations & fuel logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Gauge size={24} />
            </div>
            <h4 className="font-bold text-sm text-slate-800">No Operations Logs Recorded</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || stageFilter !== 'All' || selectedProject !== 'All'
                ? 'No logs matched the selected filters. Try resetting search.'
                : 'Start logging daily odometer shifts, diesel refuels, and toll receipts.'}
            </p>
            <button
              onClick={() => {
                setLogForm(initialLogForm);
                setIsLogModalOpen(true);
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-[#46B351] text-white text-xs font-bold hover:bg-[#3ca046] transition-colors cursor-pointer"
            >
              + Log Daily Trip & Fuel
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  <th className="py-2.5 px-3.5">Asset / Vehicle</th>
                  <th className="py-2.5 px-3">Date & Shift</th>
                  <th className="py-2.5 px-3">Project & Location</th>
                  <th className="py-2.5 px-3">Assigned Crew</th>
                  <th className="py-2.5 px-3">Running Stage</th>
                  <th className="py-2.5 px-3">Shift Output & Fuel</th>
                  <th className="py-2.5 px-3.5 text-right">Trip Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {filteredLogs.map(l => (
                  <tr
                    key={l.id}
                    onClick={() => setViewingLog(l)}
                    className="hover:bg-slate-50/90 transition-all cursor-pointer group"
                  >
                    {/* Asset & Vehicle */}
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold shrink-0 shadow-2xs ${
                            l.assetType === 'equipment'
                              ? 'bg-amber-50 text-amber-600 border border-amber-200/60'
                              : 'bg-emerald-50 text-[#46B351] border border-emerald-200/60'
                          }`}
                        >
                          {l.assetType === 'equipment' ? <HardHat size={14} /> : <Truck size={14} />}
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-900 font-mono block group-hover:text-[#46B351] transition-colors">
                            {l.assetNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[150px] block font-medium">
                            {l.assetTitle || (l.assetType === 'equipment' ? 'Heavy Machinery' : 'Commercial Truck')}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Date & Shift */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Calendar size={11} className="text-slate-400 shrink-0" />
                        <span>{l.logDate}</span>
                      </div>
                      <span className="inline-block mt-0.5 text-[9.5px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                        {l.shift} Shift
                      </span>
                    </td>

                    {/* Project & Location */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <Briefcase size={11} className="text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-800 truncate max-w-[160px]">
                          {l.projectName || 'General Deployment'}
                        </span>
                      </div>
                      {l.worksiteName && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                          <MapPin size={10} className="text-[#46B351] shrink-0" />
                          <span className="truncate max-w-[180px] font-medium">{l.worksiteName}</span>
                        </div>
                      )}
                    </td>

                    {/* Assigned Crew */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200/60 shrink-0">
                          P1
                        </span>
                        <span className="font-bold text-slate-800">{l.driverName || 'Unassigned'}</span>
                      </div>
                      {l.helperName && (
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
                          <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200/60 shrink-0">
                            P2
                          </span>
                          <span className="font-medium text-slate-600 truncate max-w-[120px]">{l.helperName}</span>
                        </div>
                      )}
                    </td>

                    {/* Running Stage */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {getStageBadge(l.stage)}
                    </td>

                    {/* Shift Output & Fuel */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="space-y-1">
                        {Number(l.distanceRun) > 0 ? (
                          <div className="font-black text-slate-900 font-mono text-xs text-emerald-700 flex items-center gap-1">
                            +{Number(l.distanceRun).toFixed(0)} KM
                          </div>
                        ) : Number(l.engineHoursTotal) > 0 ? (
                          <div className="font-black text-slate-900 font-mono text-xs text-amber-700">
                            {Number(l.engineHoursTotal).toFixed(1)} Hrs
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">—</span>
                        )}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {Number(l.fuelFilledLiters) > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                              <Fuel size={9} />
                              {l.fuelFilledLiters}L
                            </span>
                          )}
                          {(Number(l.tollAmount) > 0 || Number(l.fastagDeduction) > 0) && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                              <Receipt size={9} />
                              ₹{(Number(l.tollAmount) + Number(l.fastagDeduction)).toFixed(0)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Actions / View Full Screen */}
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingLog(l);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer group-hover:bg-[#46B351] group-hover:text-white"
                          title="View full screen trip details"
                        >
                          <Eye size={12} />
                          <span>View Details</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLog(l.id);
                          }}
                          title="Delete Log"
                          className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
          MODAL 1: LOG DAILY TRIP, ODOMETER & FUEL ENTRY
          ────────────────────────────────────────────────────────────────────────── */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-3.5 px-5 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-slate-900 text-[#46B351] flex items-center justify-center font-bold">
                  <Gauge size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-tight">
                    Log Shift Run, Fuel & Toll Expense
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    Record odometer progression, diesel refuel, and toll expenses for deployed asset
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreateLog} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              {/* Section 1: Vehicle & Shift Assignment */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                  1. Vehicle & Deployment Assignment
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">
                      Choose Active Asset / Deployment <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={logForm.assignmentId}
                      onChange={e => handleSelectAssignmentInForm(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#46B351]"
                    >
                      <option value="">-- Choose Assigned Vehicle / Equipment --</option>
                      {assignments.map(a => (
                        <option key={a.id} value={String(a.id)}>
                          {a.assetNumber} • {a.assetTitle || a.assetType} ({a.projectName || 'General'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">
                      Current Operational Stage <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={logForm.stage}
                      onChange={e => setLogForm(prev => ({ ...prev, stage: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#46B351]"
                    >
                      <option value="Working at Site">Working at Site</option>
                      <option value="On Trip / In Transit">On Trip / In Transit</option>
                      <option value="Idle / Standby">Idle / Standby</option>
                      <option value="Refueling">Refueling</option>
                      <option value="Breakdown / Maintenance">Breakdown / Maintenance</option>
                    </select>
                  </div>
                </div>

                {logForm.driverName && (
                  <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] text-slate-600">
                    <div>
                      <span className="text-slate-400 block font-semibold">Driver (P1):</span>
                      <strong className="text-slate-800 font-medium">{logForm.driverName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Target Project:</span>
                      <strong className="text-slate-800 font-medium truncate block">{logForm.projectName || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Worksite:</span>
                      <strong className="text-slate-800 font-medium truncate block">{logForm.worksiteName || '—'}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Shift Date & Odometer Readings */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    2. Date, Shift & Odometer Mileage
                  </span>
                  {calculatedDistance && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      +{calculatedDistance} KM Run
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">Log Date</label>
                    <input
                      type="date"
                      required
                      value={logForm.logDate}
                      onChange={e => setLogForm(prev => ({ ...prev, logDate: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">Shift</label>
                    <select
                      value={logForm.shift}
                      onChange={e => setLogForm(prev => ({ ...prev, shift: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800"
                    >
                      <option value="Day">Day Shift</option>
                      <option value="Night">Night Shift</option>
                      <option value="Full Day">Full Day (24h)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">Start Odometer (KM)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 45120"
                      value={logForm.startOdometer}
                      onChange={e => setLogForm(prev => ({ ...prev, startOdometer: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">End Odometer (KM)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 45365"
                      value={logForm.endOdometer}
                      onChange={e => setLogForm(prev => ({ ...prev, endOdometer: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-semibold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Fuel Fill-up (Optional/When refueled) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    3. Fuel Refill (Diesel / Petrol)
                  </span>
                  {calculatedMileage && (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                      ⚡ Efficiency: {calculatedMileage} KM / L
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">Quantity (Liters)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 70"
                      value={logForm.fuelFilledLiters}
                      onChange={e => setLogForm(prev => ({ ...prev, fuelFilledLiters: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">Rate per Liter (₹)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 94.50"
                      value={logForm.fuelRatePerLiter}
                      onChange={e => setLogForm(prev => ({ ...prev, fuelRatePerLiter: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">Total Fuel Cost (₹)</label>
                    <input
                      type="number"
                      step="any"
                      readOnly
                      placeholder="Auto"
                      value={calculatedFuelCost || logForm.fuelTotalCost}
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-emerald-700 cursor-default"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">Fuel Bill / Receipt No</label>
                    <input
                      type="text"
                      placeholder="e.g. IOCL-8912"
                      value={logForm.fuelBillNumber}
                      onChange={e => setLogForm(prev => ({ ...prev, fuelBillNumber: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">Fuel Station / Tanker Bowser Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Indian Oil NH-53 Pump or Site Fuel Bowser #2"
                    value={logForm.fuelStation}
                    onChange={e => setLogForm(prev => ({ ...prev, fuelStation: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Section 4: Toll & En-Route Expenses */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                  4. Toll, FASTag & Other Road Expenses
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">Cash Toll Paid (₹)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={logForm.tollAmount}
                      onChange={e => setLogForm(prev => ({ ...prev, tollAmount: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">FASTag Deduction (₹)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={logForm.fastagDeduction}
                      onChange={e => setLogForm(prev => ({ ...prev, fastagDeduction: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">Trips Completed</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="1"
                      value={logForm.tripsCount}
                      onChange={e => setLogForm(prev => ({ ...prev, tripsCount: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">Operational Remarks / Shift Handover Notes</label>
                <textarea
                  rows={2}
                  placeholder="Material delivered, road condition, breakdown delays, driver handover note..."
                  value={logForm.remarks}
                  onChange={e => setLogForm(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg bg-[#46B351] hover:bg-[#3ca046] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Shift Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          MODAL 2: FULL-SCREEN EXECUTIVE LOG TELEMETRY COMMAND VIEW
          ────────────────────────────────────────────────────────────────────────── */}
      {viewingLog && (
        <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center ${
          isDetailFullScreen ? 'p-0' : 'p-3 sm:p-6'
        }`}>
          <div className={`bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
            isDetailFullScreen
              ? 'w-full h-full rounded-none'
              : 'max-w-5xl w-full max-h-[94vh] rounded-3xl'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4 px-6 bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-2xl flex items-center justify-center font-bold shrink-0 shadow-2xs ${
                    viewingLog.assetType === 'equipment'
                      ? 'bg-amber-50 text-amber-600 border border-amber-200/60'
                      : 'bg-emerald-50 text-[#46B351] border border-emerald-200/60'
                  }`}
                >
                  {viewingLog.assetType === 'equipment' ? <HardHat size={20} /> : <Truck size={20} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 font-mono tracking-tight">
                      {viewingLog.assetNumber}
                    </h2>
                    <span className="text-xs text-slate-400 font-medium hidden sm:inline">•</span>
                    <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                      {viewingLog.assetTitle || (viewingLog.assetType === 'equipment' ? 'Heavy Machinery' : 'Commercial Vehicle')}
                    </span>
                    {getStageBadge(viewingLog.stage)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>Shift Log #{viewingLog.id}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">{viewingLog.logDate}</span>
                    <span>•</span>
                    <span className="bg-slate-200/70 text-slate-700 px-1.5 py-0.2 rounded font-medium text-[10px]">
                      {viewingLog.shift} Shift
                    </span>
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDetailFullScreen(!isDetailFullScreen)}
                  title={isDetailFullScreen ? 'Exit Full Screen' : 'Expand to Full Screen'}
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer hidden sm:flex items-center gap-1.5 text-xs font-semibold"
                >
                  {isDetailFullScreen ? (
                    <>
                      <Minimize2 size={14} />
                      <span>Minimize</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 size={14} />
                      <span>Full Screen</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewingLog(null);
                    setIsDetailFullScreen(false);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* Telemetry High-Impact Ribbon */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* 1. Distance Run */}
                <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200/80 p-4 rounded-2xl">
                  <div className="flex items-center justify-between text-emerald-800">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider">Distance Run</span>
                    <Gauge size={16} />
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-black text-slate-900 font-mono tracking-tight text-emerald-700">
                      +{Number(viewingLog.distanceRun).toFixed(0)} KM
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      {Number(viewingLog.startOdometer).toLocaleString()} → {Number(viewingLog.endOdometer).toLocaleString()} KM
                    </p>
                  </div>
                </div>

                {/* 2. Fuel Refill */}
                <div className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-200/80 p-4 rounded-2xl">
                  <div className="flex items-center justify-between text-purple-800">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider">Diesel Refill</span>
                    <Fuel size={16} />
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-black text-slate-900 font-mono tracking-tight text-purple-700">
                      {Number(viewingLog.fuelFilledLiters) > 0 ? `${viewingLog.fuelFilledLiters} L` : '0 L'}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {Number(viewingLog.fuelTotalCost) > 0
                        ? `₹${Number(viewingLog.fuelTotalCost).toLocaleString('en-IN')} @ ₹${viewingLog.fuelRatePerLiter}/L`
                        : 'No fuel logged this shift'}
                    </p>
                  </div>
                </div>

                {/* 3. Fuel Efficiency */}
                <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-200/80 p-4 rounded-2xl">
                  <div className="flex items-center justify-between text-blue-800">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider">Fuel Efficiency</span>
                    <TrendingUp size={16} />
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-black text-slate-900 font-mono tracking-tight text-blue-700">
                      {Number(viewingLog.fuelEfficiency) > 0 ? `${viewingLog.fuelEfficiency} km/l` : '—'}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {Number(viewingLog.fuelEfficiency) > 0
                        ? 'Operational consumption mileage'
                        : 'Telemetry pending refill ratio'}
                    </p>
                  </div>
                </div>

                {/* 4. Toll & FASTag */}
                <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border border-rose-200/80 p-4 rounded-2xl">
                  <div className="flex items-center justify-between text-rose-800">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider">Tolls & FASTag</span>
                    <Receipt size={16} />
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-black text-slate-900 font-mono tracking-tight text-rose-700">
                      ₹{(Number(viewingLog.tollAmount) + Number(viewingLog.fastagDeduction)).toFixed(0)}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      FASTag: ₹{Number(viewingLog.fastagDeduction).toFixed(0)} • Cash: ₹{Number(viewingLog.tollAmount).toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Operational Panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Panel 1: Deployment & Project Context */}
                <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-slate-700 font-bold text-xs pb-2 border-b border-slate-200/70">
                    <Briefcase size={14} className="text-[#46B351]" />
                    <span>Project & Site Deployment</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Active Project</span>
                      <span className="font-bold text-slate-900 block mt-0.5">
                        {viewingLog.projectName || 'General Fleet Pool'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Worksite / Station</span>
                      <div className="flex items-center gap-1.5 mt-0.5 text-slate-800 font-medium">
                        <MapPin size={12} className="text-[#46B351] shrink-0" />
                        <span>{viewingLog.worksiteName || 'No specific worksite'}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Asset Category</span>
                        <span className="font-semibold text-slate-700 capitalize mt-0.5 block">
                          {viewingLog.assetType === 'equipment' ? 'Heavy Machinery' : 'Commercial Vehicle'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Assignment ID</span>
                        <span className="font-mono font-semibold text-slate-700 mt-0.5 block">
                          #{viewingLog.assignmentId || viewingLog.id}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Panel 2: Crew & Operating Personnel */}
                <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-slate-700 font-bold text-xs pb-2 border-b border-slate-200/70">
                    <User size={14} className="text-blue-600" />
                    <span>Assigned Operating Crew</span>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Person 1 (Primary Operator)
                        </span>
                        {viewingLog.driverPhone && (
                          <a
                            href={`tel:${viewingLog.driverPhone}`}
                            className="text-[10px] font-bold text-[#46B351] hover:underline flex items-center gap-1"
                          >
                            <Phone size={10} /> Call
                          </a>
                        )}
                      </div>
                      <span className="font-bold text-slate-900 block mt-1">
                        {viewingLog.driverName || 'Unassigned'}
                      </span>
                      {viewingLog.driverPhone && (
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                          {viewingLog.driverPhone}
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                      <span className="text-[9.5px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                        Person 2 (Co-Driver / Helper)
                      </span>
                      <span className="font-bold text-slate-900 block mt-1">
                        {viewingLog.helperName || 'No helper assigned'}
                      </span>
                      {viewingLog.helperRole && (
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Role: {viewingLog.helperRole}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Panel 3: Fuel Invoice & Pump Details */}
                <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-slate-700 font-bold text-xs pb-2 border-b border-slate-200/70">
                    <Fuel size={14} className="text-purple-600" />
                    <span>Diesel Fuel & Pump Station</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Quantity Filled</span>
                        <span className="font-bold font-mono text-slate-900 block mt-0.5">
                          {viewingLog.fuelFilledLiters ? `${viewingLog.fuelFilledLiters} Liters` : '0 Liters'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Rate / Liter</span>
                        <span className="font-bold font-mono text-slate-900 block mt-0.5">
                          ₹{viewingLog.fuelRatePerLiter || 0}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Total Fuel Cost</span>
                      <span className="font-black font-mono text-emerald-600 text-sm block mt-0.5">
                        ₹{Number(viewingLog.fuelTotalCost || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Fuel Station / Vendor</span>
                      <span className="font-semibold text-slate-800 block mt-0.5">
                        {viewingLog.fuelStation || 'Not specified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Bill / Slip Receipt No</span>
                      <span className="font-mono font-bold text-slate-800 block mt-0.5">
                        {viewingLog.fuelBillNumber || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Panel 4: Odometer & Run Telemetry */}
                <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-slate-700 font-bold text-xs pb-2 border-b border-slate-200/70">
                    <Gauge size={14} className="text-emerald-600" />
                    <span>Odometer & Engine Hours</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Opening Odometer</span>
                        <span className="font-bold font-mono text-slate-900 block mt-0.5">
                          {Number(viewingLog.startOdometer).toLocaleString()} KM
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">Closing Odometer</span>
                        <span className="font-bold font-mono text-slate-900 block mt-0.5">
                          {Number(viewingLog.endOdometer).toLocaleString()} KM
                        </span>
                      </div>
                    </div>
                    {Number(viewingLog.engineHoursTotal) > 0 && (
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block">Engine Hours Start</span>
                          <span className="font-mono text-slate-700 block mt-0.5">
                            {viewingLog.engineHoursStart || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block">Engine Hours End</span>
                          <span className="font-mono text-slate-700 block mt-0.5">
                            {viewingLog.engineHoursEnd || '—'}
                          </span>
                        </div>
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Total Trips Completed</span>
                      <span className="font-semibold text-slate-800 block mt-0.5">
                        {viewingLog.tripsCount || 1} Trip(s)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Panel 5: Road Tolls & Incidental Expenses */}
                <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-slate-700 font-bold text-xs pb-2 border-b border-slate-200/70">
                    <Receipt size={14} className="text-rose-600" />
                    <span>En-Route Tolls & Expenses</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">FASTag Automated Toll:</span>
                      <span className="font-bold font-mono text-slate-900">
                        ₹{Number(viewingLog.fastagDeduction || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Manual Cash Toll:</span>
                      <span className="font-bold font-mono text-slate-900">
                        ₹{Number(viewingLog.tollAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    {Number(viewingLog.otherExpenses) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Incidental Expenses:</span>
                        <span className="font-bold font-mono text-slate-900">
                          ₹{Number(viewingLog.otherExpenses).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span className="font-bold text-slate-800">Total Transit Expense:</span>
                      <span className="font-black font-mono text-rose-600 text-sm">
                        ₹{(Number(viewingLog.tollAmount || 0) + Number(viewingLog.fastagDeduction || 0) + Number(viewingLog.otherExpenses || 0)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Panel 6: Remarks & Shift Directives */}
                <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-slate-700 font-bold text-xs pb-2 border-b border-slate-200/70">
                    <FileText size={14} className="text-amber-600" />
                    <span>Shift Notes & Handover Directives</span>
                  </div>
                  <div className="text-xs">
                    {viewingLog.remarks ? (
                      <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/80 whitespace-pre-line">
                        {viewingLog.remarks}
                      </p>
                    ) : (
                      <p className="text-slate-400 italic">No field handover remarks logged for this shift.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 px-6 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    const asset = viewingLog.assetNumber;
                    setViewingLog(null);
                    setIsDetailFullScreen(false);
                    setVehicleHistoryAsset(asset);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer w-full sm:w-auto justify-center"
                >
                  <FileText size={14} />
                  <span>View Lifetime History for {viewingLog.assetNumber}</span>
                </button>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const id = viewingLog.id;
                    setViewingLog(null);
                    setIsDetailFullScreen(false);
                    handleDeleteLog(id);
                  }}
                  className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 size={13} />
                  <span>Delete Log</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setViewingLog(null);
                    setIsDetailFullScreen(false);
                  }}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          MODAL 3: VEHICLE LIFETIME OPERATIONAL HISTORY TIMELINE
          ────────────────────────────────────────────────────────────────────────── */}
      {vehicleHistoryAsset && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 p-3.5 px-5 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-[#46B351]" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-tight">
                    Operational History Timeline • {vehicleHistoryAsset}
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    Chronological shift runs, diesel consumption, and toll receipts for this vehicle
                  </span>
                </div>
              </div>
              <button onClick={() => setVehicleHistoryAsset(null)} className="p-1 rounded text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
              {vehicleHistoryLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">No logs recorded for this asset yet.</div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {vehicleHistoryLogs.map((h, idx) => (
                    <div key={h.id} className="relative bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                      <div className="absolute -left-6 top-3 h-2.5 w-2.5 rounded-full bg-[#46B351] ring-4 ring-white" />
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">
                          {h.logDate} • {h.shift} Shift
                        </span>
                        {getStageBadge(h.stage)}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200/60 text-[10.5px]">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-semibold">Distance</span>
                          <span className="font-bold font-mono text-emerald-700">+{h.distanceRun} KM</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-semibold">Fuel Filled</span>
                          <span className="font-bold font-mono text-slate-800">{h.fuelFilledLiters} L</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-semibold">Fuel Cost</span>
                          <span className="font-bold font-mono text-slate-800">₹{h.fuelTotalCost}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-semibold">Toll</span>
                          <span className="font-bold font-mono text-slate-800">₹{(Number(h.tollAmount) + Number(h.fastagDeduction)).toFixed(0)}</span>
                        </div>
                      </div>

                      {h.remarks && (
                        <p className="text-[10px] text-slate-600 bg-white p-1.5 rounded border border-slate-100">
                          {h.remarks}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setVehicleHistoryAsset(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

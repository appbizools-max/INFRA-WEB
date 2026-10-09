import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, HardHat, Gauge, Fuel, Receipt, Calendar, MapPin, 
  User, CheckCircle2, AlertTriangle, Clock, RefreshCw, X, 
  ArrowRight, Phone, FileText, ChevronRight, Check, Sparkles, Navigation
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { apiFetch } from '../../../lib/api';

interface VehicleAssignment {
  id: number;
  tenantId: string;
  assetType: 'vehicle' | 'equipment';
  assetId: string;
  assetNumber: string;
  assetTitle?: string;
  projectId?: string;
  projectName?: string;
  worksiteId?: string;
  worksiteName?: string;
  assignedToType?: string;
  assignedToName?: string;
  assignedToPhone?: string;
  helperName?: string;
  helperPhone?: string;
  helperRole?: string;
  startDate?: string;
  meterReadingAtAssign?: number;
  odometerClosingKm?: number;
  distanceTravelled?: number;
  status: string;
  notes?: string;
}

interface DriverFleetLog {
  id: number;
  assetNumber: string;
  assetTitle?: string;
  assetType: 'vehicle' | 'equipment';
  assignmentId?: number;
  projectName?: string;
  worksiteName?: string;
  driverName?: string;
  driverPhone?: string;
  logDate: string;
  shift: string;
  stage: string;
  startOdometer?: number;
  endOdometer?: number;
  distanceRun?: number;
  engineHoursStart?: number;
  engineHoursEnd?: number;
  engineHoursTotal?: number;
  fuelFilledLiters?: number;
  fuelRatePerLiter?: number;
  fuelTotalCost?: number;
  fuelStation?: string;
  fuelBillNumber?: string;
  fuelEfficiency?: number;
  tollAmount?: number;
  fastagDeduction?: number;
  otherExpenses?: number;
  tripsCount?: number;
  remarks?: string;
  createdAt?: string;
}

export default function FmsEmployeePortalPage() {
  const { currentUser } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [driversList, setDriversList] = useState<any[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('self');
  const [assignments, setAssignments] = useState<VehicleAssignment[]>([]);
  const [myLogs, setMyLogs] = useState<DriverFleetLog[]>([]);
  const [saving, setSaving] = useState(false);

  // Shift Logging Modal
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [activeAssetForLog, setActiveAssetForLog] = useState<VehicleAssignment | null>(null);
  const [viewingDetailLog, setViewingDetailLog] = useState<DriverFleetLog | null>(null);

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

  // Form State for Driver Shift Entry
  const initialFormState = {
    logDate: new Date().toISOString().split('T')[0],
    shift: 'Day',
    stage: 'Working',
    fromLocation: '',
    toLocation: '',
    tripsCount: '1',
    startOdometer: '',
    endOdometer: '',
    engineHoursStart: '',
    engineHoursEnd: '',
    tollApplicable: false,
    fuelFilledLiters: '',
    fuelRatePerLiter: '94.50',
    fuelTotalCost: '',
    fuelStation: '',
    fuelBillNumber: '',
    tollAmount: '',
    fastagDeduction: '',
    otherExpenses: '',
    otherExpenseNotes: '',
    remarks: ''
  };
  const [shiftForm, setShiftForm] = useState(initialFormState);

  // Fetch driver portal data
  const fetchPortalData = async () => {
    setLoading(true);
    try {
      const uid = currentUser?.uid || '';
      let url = `/api/tenant/fms-employee/driver-portal/${uid}`;
      
      if (selectedDriverId !== 'self' && selectedDriverId !== 'all') {
        const found = driversList.find(d => String(d.id) === String(selectedDriverId));
        if (found) {
          url += `?driverPhone=${encodeURIComponent(found.mobile || '')}&driverName=${encodeURIComponent(found.name || '')}`;
        }
      }

      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile || null);
        setDriversList(data.driversList || []);
        setAssignments(data.myAssignments || []);
        setMyLogs(data.myLogs || []);
      }
    } catch (err) {
      console.error('[FMS Portal] Fetch Error:', err);
      showToast('Could not load assigned vehicle data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchPortalData();
    }
  }, [currentUser, selectedDriverId]);

  // Calculations for Shift Form
  const calculatedDistance = useMemo(() => {
    const start = parseFloat(shiftForm.startOdometer) || 0;
    const end = parseFloat(shiftForm.endOdometer) || 0;
    if (end > start) return (end - start).toFixed(1);
    return '';
  }, [shiftForm.startOdometer, shiftForm.endOdometer]);

  const calculatedEngineHours = useMemo(() => {
    const start = parseFloat(shiftForm.engineHoursStart) || 0;
    const end = parseFloat(shiftForm.engineHoursEnd) || 0;
    if (end > start) return (end - start).toFixed(1);
    return '';
  }, [shiftForm.engineHoursStart, shiftForm.engineHoursEnd]);

  const calculatedFuelCost = useMemo(() => {
    const liters = parseFloat(shiftForm.fuelFilledLiters) || 0;
    const rate = parseFloat(shiftForm.fuelRatePerLiter) || 0;
    if (liters > 0 && rate > 0) return (liters * rate).toFixed(2);
    return '';
  }, [shiftForm.fuelFilledLiters, shiftForm.fuelRatePerLiter]);

  const calculatedMileage = useMemo(() => {
    const dist = parseFloat(calculatedDistance) || 0;
    const fuel = parseFloat(shiftForm.fuelFilledLiters) || 0;
    if (dist > 0 && fuel > 0) return (dist / fuel).toFixed(2);
    return null;
  }, [calculatedDistance, shiftForm.fuelFilledLiters]);

  const calculatedHourlyBurn = useMemo(() => {
    const hours = parseFloat(calculatedEngineHours) || 0;
    const fuel = parseFloat(shiftForm.fuelFilledLiters) || 0;
    if (hours > 0 && fuel > 0) return (fuel / hours).toFixed(2);
    return null;
  }, [calculatedEngineHours, shiftForm.fuelFilledLiters]);

  const calculatedHourlyCost = useMemo(() => {
    const hours = parseFloat(calculatedEngineHours) || 0;
    const cost = parseFloat(calculatedFuelCost || shiftForm.fuelTotalCost) || 0;
    if (hours > 0 && cost > 0) return (cost / hours).toFixed(2);
    return null;
  }, [calculatedEngineHours, calculatedFuelCost, shiftForm.fuelTotalCost]);

  // Open Log Modal Pre-filled for Asset
  const handleOpenLogForAsset = (asset: VehicleAssignment) => {
    setActiveAssetForLog(asset);
    const lastReading = asset.odometerClosingKm || asset.meterReadingAtAssign || 0;
    const isEq = asset.assetType === 'equipment';

    setShiftForm({
      ...initialFormState,
      startOdometer: !isEq && lastReading > 0 ? String(lastReading) : '',
      engineHoursStart: isEq && lastReading > 0 ? String(lastReading) : '',
      tollApplicable: !isEq,
      fromLocation: asset.worksiteName || '',
    });
    setIsLogModalOpen(true);
  };

  // Submit Shift Log
  const handleSubmitShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssetForLog) return;

    setSaving(true);
    try {
      const isEq = activeAssetForLog.assetType === 'equipment';
      const dist = isEq ? 0 : (calculatedDistance ? parseFloat(calculatedDistance) : 0);
      const hours = isEq ? (calculatedEngineHours ? parseFloat(calculatedEngineHours) : 0) : 0;
      const fuelCost = calculatedFuelCost ? parseFloat(calculatedFuelCost) : (parseFloat(shiftForm.fuelTotalCost) || 0);
      const efficiency = isEq 
        ? (calculatedHourlyBurn ? parseFloat(calculatedHourlyBurn) : 0)
        : (calculatedMileage ? parseFloat(calculatedMileage) : 0);

      const tollPaid = (isEq && !shiftForm.tollApplicable) ? 0 : (parseFloat(shiftForm.tollAmount) || 0);
      const fastagPaid = (isEq && !shiftForm.tollApplicable) ? 0 : (parseFloat(shiftForm.fastagDeduction) || 0);
      const otherExp = parseFloat(shiftForm.otherExpenses) || 0;

      // Combine route & other notes into remarks
      let routeNote = '';
      if (shiftForm.fromLocation || shiftForm.toLocation) {
        routeNote = `[Route: ${shiftForm.fromLocation || 'Origin'} ➔ ${shiftForm.toLocation || 'Destination'}]`;
      }
      if (shiftForm.otherExpenseNotes && otherExp > 0) {
        routeNote += ` [Expense: ₹${otherExp} for ${shiftForm.otherExpenseNotes}]`;
      }
      const fullRemarks = [routeNote, shiftForm.remarks].filter(Boolean).join(' | ');

      const payload = {
        tenantId: activeAssetForLog.tenantId || currentUser?.uid || 'demo-tenant',
        assignmentId: activeAssetForLog.id,
        assetId: activeAssetForLog.assetId,
        assetType: activeAssetForLog.assetType,
        assetNumber: activeAssetForLog.assetNumber,
        assetTitle: activeAssetForLog.assetTitle,
        projectId: activeAssetForLog.projectId,
        projectName: activeAssetForLog.projectName,
        worksiteId: activeAssetForLog.worksiteId,
        worksiteName: shiftForm.toLocation || activeAssetForLog.worksiteName,
        driverName: activeAssetForLog.assignedToName || profile?.name || 'Assigned Driver',
        driverPhone: activeAssetForLog.assignedToPhone || profile?.mobile || '',
        helperName: activeAssetForLog.helperName,
        helperPhone: activeAssetForLog.helperPhone,
        helperRole: activeAssetForLog.helperRole,
        logDate: shiftForm.logDate,
        shift: shiftForm.shift,
        stage: shiftForm.stage,
        startOdometer: shiftForm.startOdometer,
        endOdometer: shiftForm.endOdometer,
        distanceRun: dist,
        engineHoursStart: shiftForm.engineHoursStart,
        engineHoursEnd: shiftForm.engineHoursEnd,
        engineHoursTotal: hours,
        fuelFilledLiters: shiftForm.fuelFilledLiters,
        fuelRatePerLiter: shiftForm.fuelRatePerLiter,
        fuelTotalCost: fuelCost,
        fuelStation: shiftForm.fuelStation,
        fuelBillNumber: shiftForm.fuelBillNumber,
        fuelEfficiency: efficiency,
        tollAmount: tollPaid,
        fastagDeduction: fastagPaid,
        otherExpenses: otherExp,
        tripsCount: parseInt(shiftForm.tripsCount, 10) || 1,
        remarks: fullRemarks
      };

      const res = await apiFetch('/api/tenant/fleet-logs', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to record shift log');
      }

      showToast(`Daily shift log saved for ${activeAssetForLog.assetNumber}!`, 'success');
      setIsLogModalOpen(false);
      setActiveAssetForLog(null);
      fetchPortalData();
    } catch (err: any) {
      console.error('[SubmitShift] Error:', err);
      showToast(err.message || 'Could not save shift log', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Helper for Stage Badges
  const renderStageBadge = (stage: string) => {
    switch (stage) {
      case 'Working':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Working
          </span>
        );
      case 'Transit':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            Transit
          </span>
        );
      case 'Idle':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Idle
          </span>
        );
      case 'Maintenance':
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

  // Totals for this driver
  const totalStats = useMemo(() => {
    let km = 0;
    let hours = 0;
    let fuelLiters = 0;
    let fuelCost = 0;
    let tollCost = 0;

    myLogs.forEach(l => {
      km += Number(l.distanceRun) || 0;
      hours += Number(l.engineHoursTotal) || 0;
      fuelLiters += Number(l.fuelFilledLiters) || 0;
      fuelCost += Number(l.fuelTotalCost) || 0;
      tollCost += (Number(l.tollAmount) || 0) + (Number(l.fastagDeduction) || 0) + (Number(l.otherExpenses) || 0);
    });

    return { km, hours, fuelLiters, fuelCost, tollCost, trips: myLogs.length };
  }, [myLogs]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold text-white transition-all ${
            toast.type === 'error' ? 'bg-rose-600' : toast.type === 'info' ? 'bg-blue-600' : 'bg-emerald-600'
          }`}
        >
          {toast.type === 'error' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          HERO BANNER & DRIVER PROFILE HEADER
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 sm:p-7 text-white shadow-sm relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left Title & Driver Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#46B351] text-white uppercase tracking-wider">
                FMS Driver Portal
              </span>
              <span className="text-xs text-slate-400 font-medium">Fleet Management System</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              My Vehicle Assignment & Daily Shift Desk
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Track your assigned vehicles, update opening & closing meter readings, log diesel refuel bills, toll expenses, and shift handover reports.
            </p>

            {/* Active Operator Card */}
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                <User size={13} className="text-[#46B351]" />
                <span className="font-semibold text-white">
                  {profile?.name || currentUser?.displayName || 'Driver / Operator'}
                </span>
                <span className="text-[10px] text-slate-400">
                  ({profile?.role || 'FMS Staff'})
                </span>
              </div>

              {(profile?.mobile || currentUser?.phoneNumber) && (
                <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/10 text-[11px]">
                  <Phone size={12} className="text-slate-400" />
                  <span>{profile?.mobile || currentUser?.phoneNumber}</span>
                </div>
              )}

              {profile?.memberId && (
                <span className="text-[10px] bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700 font-mono text-slate-300">
                  ID: {profile.memberId}
                </span>
              )}
            </div>
          </div>

          {/* Right: Admin Switcher Dropdown (If viewing as Admin or testing) */}
          {profile?.isAdmin && driversList.length > 0 && (
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/15 space-y-1.5 min-w-[240px]">
              <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
                Driver Switcher (Admin Mode)
              </label>
              <select
                value={selectedDriverId}
                onChange={e => setSelectedDriverId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#46B351]"
              >
                <option value="self">-- Show My Driver Assignment --</option>
                <option value="all">-- Show All Drivers in Fleet --</option>
                {driversList.map(d => (
                  <option key={d.id} value={String(d.id)}>
                    {d.name} ({d.role || 'Driver'}) • {d.mobile || 'No Phone'}
                  </option>
                ))}
              </select>
              <span className="text-[9.5px] text-slate-400 block">
                Select an FMS driver to view their assigned vehicle and log on their behalf.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          DRIVER LIFETIME PERFORMANCE SUMMARY METRICS
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Active Assignments */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10.5px] font-bold uppercase tracking-wider">Active Assets</span>
            <div className="h-7 w-7 rounded-lg bg-emerald-50 text-[#46B351] flex items-center justify-center">
              <Truck size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {assignments.filter(a => a.status === 'Active').length}
          </div>
          <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
            Vehicles & machinery deployed
          </span>
        </div>

        {/* Metric 2: Distance / Hours Run */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10.5px] font-bold uppercase tracking-wider">Total Run Output</span>
            <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Gauge size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totalStats.km > 0 ? `${totalStats.km.toFixed(0)} KM` : `${totalStats.hours.toFixed(1)} Hrs`}
          </div>
          <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
            Logged across {totalStats.trips} shift logs
          </span>
        </div>

        {/* Metric 3: Fuel Consumed */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10.5px] font-bold uppercase tracking-wider">Diesel Refilled</span>
            <div className="h-7 w-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Fuel size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totalStats.fuelLiters.toFixed(0)} L
          </div>
          <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
            ₹{totalStats.fuelCost.toLocaleString('en-IN')} total cost
          </span>
        </div>

        {/* Metric 4: Tolls & Expenses */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10.5px] font-bold uppercase tracking-wider">Tolls & Expenses</span>
            <div className="h-7 w-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Receipt size={14} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{totalStats.tollCost.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
            FASTag, cash tolls & en-route
          </span>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          SECTION 1: MY ASSIGNED VEHICLES & MACHINERY
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Truck size={18} className="text-[#46B351]" />
              <span>My Assigned Vehicle & Equipment</span>
            </h2>
            <p className="text-xs text-slate-500">
              Only vehicles assigned to you by the project supervisor are shown here. Click below to log your shift runs.
            </p>
          </div>
          
          <button
            onClick={fetchPortalData}
            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200">
            <RefreshCw size={14} className="animate-spin text-slate-500" />
            Loading assigned vehicle telemetry...
          </div>
        ) : assignments.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={22} />
            </div>
            <h4 className="font-bold text-sm text-slate-800">No Vehicle Currently Assigned</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              There is currently no commercial truck or heavy equipment assigned to your phone or name. Please check with your Project Supervisor or Fleet Operations Manager.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {assignments.map(asset => {
              const isEquipment = asset.assetType === 'equipment';
              const lastMeter = asset.odometerClosingKm || asset.meterReadingAtAssign || 0;

              return (
                <div 
                  key={asset.id} 
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 transition-all shadow-2xs overflow-hidden flex flex-col justify-between"
                >
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-gradient-to-r from-slate-50/80 to-white">
                    <div className="flex items-center gap-3">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold shrink-0 shadow-2xs ${
                        isEquipment 
                          ? 'bg-amber-50 text-amber-600 border border-amber-200/60' 
                          : 'bg-emerald-50 text-[#46B351] border border-emerald-200/60'
                      }`}>
                        {isEquipment ? <HardHat size={20} /> : <Truck size={20} />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-base text-slate-900 tracking-tight">
                            {asset.assetNumber}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                            asset.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {asset.status}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-medium block mt-0.5">
                          {asset.assetTitle || (isEquipment ? 'Heavy Machinery' : 'Commercial Vehicle')}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      #{asset.id}
                    </span>
                  </div>

                  {/* Card Body Details */}
                  <div className="p-4 sm:p-5 space-y-3.5 text-xs">
                    {/* Project & Location */}
                    <div className="grid grid-cols-2 gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Target Project</span>
                        <span className="font-bold text-slate-800 mt-0.5 block truncate">
                          {asset.projectName || 'General Deployment'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Assigned Worksite</span>
                        <div className="flex items-center gap-1 text-slate-700 font-semibold mt-0.5">
                          <MapPin size={12} className="text-[#46B351] shrink-0" />
                          <span className="truncate">{asset.worksiteName || 'Site Location #1'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Telemetry Reading & Crew */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[9.5px] text-slate-400 font-semibold block">
                          {isEquipment ? 'Start Hours' : 'Opening Odo'}
                        </span>
                        <span className="font-black text-slate-900 text-sm mt-0.5 block">
                          {Number(asset.meterReadingAtAssign || 0).toLocaleString()} {isEquipment ? 'Hrs' : 'KM'}
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[9.5px] text-slate-400 font-semibold block">
                          {isEquipment ? 'Current Hours' : 'Last Closing'}
                        </span>
                        <span className={`font-black text-sm mt-0.5 block ${isEquipment ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {Number(lastMeter).toLocaleString()} {isEquipment ? 'Hrs' : 'KM'}
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[9.5px] text-slate-400 font-semibold block">Assignment Date</span>
                        <span className="font-bold text-slate-800 text-xs mt-0.5 block truncate">
                          {asset.startDate || 'Recent'}
                        </span>
                      </div>
                    </div>

                    {/* Assigned Crew Info */}
                    <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Driver
                        </span>
                        <span className="font-bold text-slate-800">{asset.assignedToName || 'Primary Driver'}</span>
                      </div>

                      {asset.helperName && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9.5px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            Helper
                          </span>
                          <span className="font-medium text-slate-700">{asset.helperName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="p-4 sm:p-5 pt-0">
                    <button
                      type="button"
                      onClick={() => handleOpenLogForAsset(asset)}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#46B351] hover:bg-[#3ca046] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <Sparkles size={14} />
                      <span>Log Daily Shift Run, Fuel & Expenses</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          SECTION 2: MY LOGGED SHIFTS HISTORY
          ────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-3">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileText size={16} className="text-slate-500" />
              <span>My Shift Telemetry & Fuel Log History</span>
            </h3>
            <span className="text-[10px] text-slate-400">
              Complete chronological audit of your submitted odometer progress, diesel bills, and toll payments.
            </span>
          </div>

          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {myLogs.length} Logged Shifts
          </span>
        </div>

        {myLogs.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            No shift runs or fuel logs recorded yet for your assigned vehicle.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  <th className="py-2.5 px-3.5">Asset / Vehicle</th>
                  <th className="py-2.5 px-3">Date & Shift</th>
                  <th className="py-2.5 px-3">Stage</th>
                  <th className="py-2.5 px-3">Shift Run (KM / Hrs)</th>
                  <th className="py-2.5 px-3">Fuel Refill</th>
                  <th className="py-2.5 px-3">Tolls & Expenses</th>
                  <th className="py-2.5 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {myLogs.map(l => (
                  <tr 
                    key={l.id}
                    onClick={() => setViewingDetailLog(l)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900 group-hover:text-[#46B351] transition-colors">
                        {l.assetNumber}
                      </div>
                      <span className="text-[9.5px] text-slate-400 block">
                        {l.projectName || 'General'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 flex items-center gap-1">
                        <Calendar size={11} className="text-slate-400" />
                        <span>{l.logDate}</span>
                      </div>
                      <span className="text-[9px] text-slate-500 bg-slate-100 px-1 py-0.2 rounded mt-0.5 inline-block">
                        {l.shift} Shift
                      </span>
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {renderStageBadge(l.stage)}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {Number(l.distanceRun) > 0 ? (
                        <span className="font-black text-emerald-700">
                          +{Number(l.distanceRun).toFixed(0)} KM
                        </span>
                      ) : Number(l.engineHoursTotal) > 0 ? (
                        <span className="font-black text-amber-700">
                          +{Number(l.engineHoursTotal).toFixed(1)} Hrs
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">0 Run</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {Number(l.fuelFilledLiters) > 0 ? (
                        <div>
                          <span className="font-bold text-purple-700">
                            {l.fuelFilledLiters} L (₹{Number(l.fuelTotalCost).toLocaleString('en-IN')})
                          </span>
                          <span className="text-[9.5px] text-slate-400 block">
                            {l.fuelStation || 'Refueled'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">No fuel</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {(Number(l.tollAmount || 0) + Number(l.fastagDeduction || 0) + Number(l.otherExpenses || 0)) > 0 ? (
                        <span className="font-bold text-rose-700">
                          ₹{(Number(l.tollAmount || 0) + Number(l.fastagDeduction || 0) + Number(l.otherExpenses || 0)).toFixed(0)}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">₹0</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <span className="text-slate-400 group-hover:text-slate-600 inline-flex items-center text-[10.5px] font-semibold">
                        View <ChevronRight size={12} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          MODAL 1: DRIVER DAILY SHIFT & EXPENSE LOGGER
          ────────────────────────────────────────────────────────────────────────── */}
      {isLogModalOpen && activeAssetForLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold ${
                  activeAssetForLog.assetType === 'equipment' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-[#46B351]'
                }`}>
                  {activeAssetForLog.assetType === 'equipment' ? <HardHat size={18} /> : <Truck size={18} />}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-tight">
                    Log Shift Run: {activeAssetForLog.assetNumber}
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    {activeAssetForLog.assetTitle || activeAssetForLog.assetType} • {activeAssetForLog.projectName || 'General'}
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
            <form onSubmit={handleSubmitShift} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              {/* 1. Shift & Stage */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                  1. Shift & Operational Status
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">Shift Date</label>
                    <input
                      type="date"
                      required
                      value={shiftForm.logDate}
                      onChange={e => setShiftForm(prev => ({ ...prev, logDate: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">Shift Timing</label>
                    <select
                      value={shiftForm.shift}
                      onChange={e => setShiftForm(prev => ({ ...prev, shift: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    >
                      <option value="Day">Day Shift</option>
                      <option value="Night">Night Shift</option>
                      <option value="Full Day">Full Day (24h)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">Current Stage</label>
                    <select
                      value={shiftForm.stage}
                      onChange={e => setShiftForm(prev => ({ ...prev, stage: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#46B351]"
                    >
                      <option value="Working">Working</option>
                      <option value="Transit">Transit</option>
                      <option value="Idle">Idle</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. Location & Route (From Where to Where) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                  2. Route / Site Travel (From Where ➔ To Where)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">From Location / Base</label>
                    <input
                      type="text"
                      placeholder="e.g. Batching Plant #1"
                      value={shiftForm.fromLocation}
                      onChange={e => setShiftForm(prev => ({ ...prev, fromLocation: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">To Destination / Site</label>
                    <input
                      type="text"
                      placeholder="e.g. NH-53 Flyover Pillar 14"
                      value={shiftForm.toLocation}
                      onChange={e => setShiftForm(prev => ({ ...prev, toLocation: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">Trips Completed</label>
                    <input
                      type="number"
                      min="1"
                      value={shiftForm.tripsCount}
                      onChange={e => setShiftForm(prev => ({ ...prev, tripsCount: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Meter Readings (KM vs Engine Hours) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    {activeAssetForLog.assetType === 'equipment' ? '3. Engine Operating Hours Meter' : '3. Odometer Mileage (KM)'}
                  </span>
                  {activeAssetForLog.assetType === 'equipment' && calculatedEngineHours ? (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      +{calculatedEngineHours} Operating Hours
                    </span>
                  ) : calculatedDistance ? (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      +{calculatedDistance} KM Run
                    </span>
                  ) : null}
                </div>

                {activeAssetForLog.assetType === 'equipment' ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">Start Engine Hours (Hrs)</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 1240.5"
                        value={shiftForm.engineHoursStart}
                        onChange={e => setShiftForm(prev => ({ ...prev, engineHoursStart: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">End Engine Hours (Hrs)</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 1248.5"
                        value={shiftForm.engineHoursEnd}
                        onChange={e => setShiftForm(prev => ({ ...prev, engineHoursEnd: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">Opening Odometer (KM)</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 45120"
                        value={shiftForm.startOdometer}
                        onChange={e => setShiftForm(prev => ({ ...prev, startOdometer: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">Closing Odometer (KM)</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 45365"
                        value={shiftForm.endOdometer}
                        onChange={e => setShiftForm(prev => ({ ...prev, endOdometer: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Fuel Refill */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                    4. Fuel Refill (Diesel / Petrol)
                  </span>
                  {activeAssetForLog.assetType === 'equipment' && calculatedHourlyBurn ? (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      ⚡ Burn: {calculatedHourlyBurn} L/Hr {calculatedHourlyCost ? `(₹${calculatedHourlyCost}/Hr)` : ''}
                    </span>
                  ) : calculatedMileage ? (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                      ⚡ Mileage: {calculatedMileage} KM / L
                    </span>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">Quantity (Liters)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 60"
                      value={shiftForm.fuelFilledLiters}
                      onChange={e => setShiftForm(prev => ({ ...prev, fuelFilledLiters: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">Rate / Liter (₹)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="94.50"
                      value={shiftForm.fuelRatePerLiter}
                      onChange={e => setShiftForm(prev => ({ ...prev, fuelRatePerLiter: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">Total Fuel Amount (₹)</label>
                    <input
                      type="number"
                      step="any"
                      readOnly
                      placeholder="Auto"
                      value={calculatedFuelCost || shiftForm.fuelTotalCost}
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-emerald-700 cursor-default"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">Bill / Slip No</label>
                    <input
                      type="text"
                      placeholder="e.g. IOCL-998"
                      value={shiftForm.fuelBillNumber}
                      onChange={e => setShiftForm(prev => ({ ...prev, fuelBillNumber: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">Fuel Pump / Site Bowser Name</label>
                  <input
                    type="text"
                    placeholder="e.g. IOCL NH-53 Pump or Site Bowser #1"
                    value={shiftForm.fuelStation}
                    onChange={e => setShiftForm(prev => ({ ...prev, fuelStation: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* 5. Tolls & En-Route Expenses */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                  5. Tolls, FASTag & Other Out-of-Pocket Expenses
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">Cash Toll Paid (₹)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={shiftForm.tollAmount}
                      onChange={e => setShiftForm(prev => ({ ...prev, tollAmount: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">FASTag Deduction (₹)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={shiftForm.fastagDeduction}
                      onChange={e => setShiftForm(prev => ({ ...prev, fastagDeduction: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">Other En-Route (₹)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={shiftForm.otherExpenses}
                      onChange={e => setShiftForm(prev => ({ ...prev, otherExpenses: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                </div>

                {parseFloat(shiftForm.otherExpenses) > 0 && (
                  <div>
                    <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">What was the other expense for?</label>
                    <input
                      type="text"
                      placeholder="e.g. Tyre puncture repair, parking slip, air pressure check..."
                      value={shiftForm.otherExpenseNotes}
                      onChange={e => setShiftForm(prev => ({ ...prev, otherExpenseNotes: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                )}
              </div>

              {/* 6. Handover / Shift Remarks */}
              <div>
                <label className="text-[10.5px] font-semibold text-slate-600 block mb-1">
                  Driver Handover Notes / Vehicle Health Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="Material delivered, road delays, engine/tyre condition, handover note for night shift..."
                  value={shiftForm.remarks}
                  onChange={e => setShiftForm(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>

              {/* Modal Footer */}
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
                  className="px-5 py-2 rounded-xl bg-[#46B351] hover:bg-[#3ca046] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      <span>Saving Log...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Submit Shift Log</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          MODAL 2: VIEW SHIFT RECEIPT & LOG DETAILS
          ────────────────────────────────────────────────────────────────────────── */}
      {viewingDetailLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-[#46B351] flex items-center justify-center font-bold">
                  <FileText size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Shift #{viewingDetailLog.id} • {viewingDetailLog.assetNumber}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {viewingDetailLog.logDate} • {viewingDetailLog.shift} Shift
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingDetailLog(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Running Stage</span>
                  <div className="mt-1">{renderStageBadge(viewingDetailLog.stage)}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Shift Run Output</span>
                  <strong className="text-slate-900 mt-1 block">
                    {Number(viewingDetailLog.distanceRun) > 0 
                      ? `+${Number(viewingDetailLog.distanceRun).toFixed(0)} KM` 
                      : Number(viewingDetailLog.engineHoursTotal) > 0 
                      ? `+${Number(viewingDetailLog.engineHoursTotal).toFixed(1)} Operating Hours`
                      : '0 Run'}
                  </strong>
                </div>
              </div>

              {Number(viewingDetailLog.fuelFilledLiters) > 0 && (
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 space-y-1">
                  <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block">
                    Diesel Refill Details
                  </span>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <span className="text-[10px] text-purple-600 block">Quantity Filled:</span>
                      <strong className="text-purple-950">{viewingDetailLog.fuelFilledLiters} Liters</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-purple-600 block">Total Fuel Bill:</span>
                      <strong className="text-purple-950">₹{Number(viewingDetailLog.fuelTotalCost).toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                  {viewingDetailLog.fuelStation && (
                    <div className="text-[10.5px] text-purple-700 pt-1">
                      Pump Station: {viewingDetailLog.fuelStation} {viewingDetailLog.fuelBillNumber ? `(Slip #${viewingDetailLog.fuelBillNumber})` : ''}
                    </div>
                  )}
                </div>
              )}

              {((Number(viewingDetailLog.tollAmount) || 0) + (Number(viewingDetailLog.fastagDeduction) || 0) + (Number(viewingDetailLog.otherExpenses) || 0)) > 0 && (
                <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 space-y-1">
                  <span className="text-[10px] font-bold text-rose-900 uppercase tracking-wider block">
                    Tolls & En-Route Expenses
                  </span>
                  <div className="grid grid-cols-3 gap-2 mt-1 text-[11px]">
                    <div>
                      <span className="text-[10px] text-rose-600 block">FASTag:</span>
                      <strong className="text-rose-950">₹{Number(viewingDetailLog.fastagDeduction || 0)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-600 block">Cash Toll:</span>
                      <strong className="text-rose-950">₹{Number(viewingDetailLog.tollAmount || 0)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-600 block">Other:</span>
                      <strong className="text-rose-950">₹{Number(viewingDetailLog.otherExpenses || 0)}</strong>
                    </div>
                  </div>
                </div>
              )}

              {viewingDetailLog.remarks && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">Driver Remarks / Notes:</span>
                  <p className="text-slate-700 leading-relaxed">{viewingDetailLog.remarks}</p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingDetailLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

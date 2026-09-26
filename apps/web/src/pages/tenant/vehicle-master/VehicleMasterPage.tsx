import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  Truck,
  HardHat,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  Check,
  AlertTriangle,
  ArrowLeft,
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
  AlertCircle,
  Clock,
  Wrench,
  Shield,
  SlidersHorizontal,
  ChevronDown,
  Building2,
  Briefcase,
  Zap,
  Tag
} from 'lucide-react';

interface Vehicle {
  id: number | string;
  tenantId?: string;
  vehicleNumber: string;
  fleetCode?: string;
  vehicleType: string;
  make?: string;
  model?: string;
  year?: number;
  registrationNumber?: string;
  chassisNumber?: string;
  engineNumber?: string;
  tonCapacity?: number;
  volumeCapacity?: number;
  volumeUnit?: string;
  fuelPowerType?: string;
  fuelConsumption?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  vendor?: string;
  insuranceValue?: number;
  insuranceExpiryDate?: string;
  fitnessExpiryDate?: string;
  assignedDriverName?: string;
  assignedDriverPhone?: string;
  assignedProjectId?: string;
  assignedProjectName?: string;
  currentLocation?: string;
  status: 'Active' | 'Under Maintenance' | 'Breakdown' | 'Idle' | 'Decommissioned' | string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface HeavyEquipment {
  id: number | string;
  tenantId?: string;
  equipmentId: string;
  equipmentNumber: string;
  equipmentType: string;
  make?: string;
  model?: string;
  serialNumber?: string;
  manufacturingYear?: number;
  excavatorBucketCapacity?: number;
  boomLength?: number;
  loaderBucketCapacity?: number;
  craneLiftingCapacity?: number;
  forkliftForkCapacity?: number;
  dumperPayloadCapacity?: number;
  operatingWeight?: number;
  fuelType?: string;
  fuelPowerType?: string;
  fuelConsumption?: string;
  hourMeterReading?: number;
  purchaseDate?: string;
  purchaseCost?: number;
  vendor?: string;
  insuranceValue?: number;
  assignedOperatorName?: string;
  assignedOperatorPhone?: string;
  assignedProjectId?: string;
  assignedProjectName?: string;
  assignedWorksiteName?: string;
  status: 'Active' | 'In Operation' | 'Under Maintenance' | 'Breakdown' | 'Idle' | 'Decommissioned' | string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

const DEFAULT_VEHICLE_TYPES = [
  'Tipper',
  'Heavy Trailer',
  'Flatbed Trailer',
  'Tanker',
  'Dumper Truck',
  'Transit Mixer',
  'Bulker',
  'Light Commercial Vehicle (LCV)',
  'Pickup Truck',
  'Water Tanker',
  'Tractor'
];

const DEFAULT_EQUIPMENT_TYPES = [
  'Excavator',
  'Wheel Loader',
  'Mobile Crane',
  'Tower Crane',
  'Forklift',
  'Heavy Dumper',
  'Backhoe Loader',
  'Bulldozer',
  'Motor Grader',
  'Compactor / Road Roller',
  'Concrete Boom Pump',
  'Asphalt Paver'
];

const FUEL_POWER_TYPES = [
  'Diesel',
  'Petrol',
  'Electric (EV / Battery)',
  'CNG',
  'Hybrid',
  'Hydraulic / Pneumatic',
  'Bio-Diesel',
  'Other'
];

export default function VehicleMasterPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'vehicles' | 'equipment'>('vehicles');

  // Data states
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [equipmentList, setEquipmentList] = useState<HeavyEquipment[]>([]);
  const [loading, setLoading] = useState(true);

  // Custom Types dynamic states
  const [customVehicleTypes, setCustomVehicleTypes] = useState<string[]>([]);
  const [customEquipmentTypes, setCustomEquipmentTypes] = useState<string[]>([]);
  const [isAddingVehicleType, setIsAddingVehicleType] = useState(false);
  const [newVehicleTypeInput, setNewVehicleTypeInput] = useState('');
  const [isAddingEquipmentType, setIsAddingEquipmentType] = useState(false);
  const [newEquipmentTypeInput, setNewEquipmentTypeInput] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Creation / Editing Full-Screen Mode
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | string | null>(null);

  // Detail Modal States
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null);
  const [viewingEquipment, setViewingEquipment] = useState<HeavyEquipment | null>(null);

  // Toast Acknowledgment
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Form States for Vehicle
  const initialVehicleForm: Omit<Vehicle, 'id'> = {
    vehicleNumber: '',
    fleetCode: '',
    vehicleType: 'Tipper',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    registrationNumber: '',
    chassisNumber: '',
    engineNumber: '',
    tonCapacity: 25,
    volumeCapacity: 16,
    volumeUnit: 'CUM',
    fuelPowerType: 'Diesel',
    fuelConsumption: '',
    purchaseDate: '',
    purchaseCost: 0,
    vendor: '',
    insuranceValue: 0,
    insuranceExpiryDate: '',
    fitnessExpiryDate: '',
    assignedDriverName: '',
    assignedDriverPhone: '',
    assignedProjectId: '',
    assignedProjectName: '',
    currentLocation: '',
    status: 'Active',
    notes: ''
  };
  const [vehicleForm, setVehicleForm] = useState(initialVehicleForm);

  // Form States for Heavy Equipment
  const initialEquipmentForm: Omit<HeavyEquipment, 'id'> = {
    equipmentId: '',
    equipmentNumber: '',
    equipmentType: 'Excavator',
    make: '',
    model: '',
    serialNumber: '',
    manufacturingYear: new Date().getFullYear(),
    excavatorBucketCapacity: 0,
    boomLength: 0,
    loaderBucketCapacity: 0,
    craneLiftingCapacity: 0,
    forkliftForkCapacity: 0,
    dumperPayloadCapacity: 0,
    operatingWeight: 0,
    fuelType: 'Diesel',
    fuelPowerType: 'Diesel',
    fuelConsumption: '',
    hourMeterReading: 0,
    purchaseDate: '',
    purchaseCost: 0,
    vendor: '',
    insuranceValue: 0,
    assignedOperatorName: '',
    assignedOperatorPhone: '',
    assignedProjectId: '',
    assignedProjectName: '',
    assignedWorksiteName: '',
    status: 'Active',
    notes: ''
  };
  const [equipmentForm, setEquipmentForm] = useState(initialEquipmentForm);
  const [saving, setSaving] = useState(false);

  // Combined Dynamic Type Options
  const allVehicleTypes = useMemo(() => {
    const fromData = vehicles.map(v => v.vehicleType).filter(Boolean);
    return Array.from(new Set([...DEFAULT_VEHICLE_TYPES, ...customVehicleTypes, ...fromData]));
  }, [vehicles, customVehicleTypes]);

  const allEquipmentTypes = useMemo(() => {
    const fromData = equipmentList.map(e => e.equipmentType).filter(Boolean);
    return Array.from(new Set([...DEFAULT_EQUIPMENT_TYPES, ...customEquipmentTypes, ...fromData]));
  }, [equipmentList, customEquipmentTypes]);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const vRes = await fetch('/api/tenant/vehicles');
      if (vRes.ok) {
        const vData = await vRes.json();
        setVehicles(Array.isArray(vData) ? vData : []);
      }

      const eqRes = await fetch('/api/tenant/heavy-equipment');
      if (eqRes.ok) {
        const eqData = await eqRes.json();
        setEquipmentList(Array.isArray(eqData) ? eqData : []);
      }
    } catch (err) {
      console.error('Failed to load fleet data:', err);
      showToast('Error loading fleet assets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered lists
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        v.vehicleNumber?.toLowerCase().includes(q) ||
        v.fleetCode?.toLowerCase().includes(q) ||
        v.make?.toLowerCase().includes(q) ||
        v.model?.toLowerCase().includes(q) ||
        v.vehicleType?.toLowerCase().includes(q) ||
        v.fuelPowerType?.toLowerCase().includes(q) ||
        v.registrationNumber?.toLowerCase().includes(q);

      const matchesType = typeFilter === 'All' || v.vehicleType === typeFilter;
      const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [vehicles, searchQuery, typeFilter, statusFilter]);

  const filteredEquipment = useMemo(() => {
    return equipmentList.filter(eq => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        eq.equipmentId?.toLowerCase().includes(q) ||
        eq.equipmentNumber?.toLowerCase().includes(q) ||
        eq.make?.toLowerCase().includes(q) ||
        eq.model?.toLowerCase().includes(q) ||
        eq.equipmentType?.toLowerCase().includes(q) ||
        eq.fuelPowerType?.toLowerCase().includes(q) ||
        eq.serialNumber?.toLowerCase().includes(q);

      const matchesType = typeFilter === 'All' || eq.equipmentType === typeFilter;
      const matchesStatus = statusFilter === 'All' || eq.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [equipmentList, searchQuery, typeFilter, statusFilter]);

  // KPI Calculations
  const totalFleetCount = vehicles.length + equipmentList.length;
  const totalActiveVehicles = vehicles.filter(v => v.status === 'Active').length;
  const totalActiveEquipment = equipmentList.filter(eq => eq.status === 'Active' || eq.status === 'In Operation').length;
  const totalMaintenance =
    vehicles.filter(v => v.status === 'Under Maintenance' || v.status === 'Breakdown').length +
    equipmentList.filter(eq => eq.status === 'Under Maintenance' || eq.status === 'Breakdown').length;

  const totalAssetValuation =
    vehicles.reduce((sum, v) => sum + (Number(v.purchaseCost) || 0), 0) +
    equipmentList.reduce((sum, eq) => sum + (Number(eq.purchaseCost) || 0), 0);

  const totalPayloadTonnage = vehicles.reduce((sum, v) => sum + (Number(v.tonCapacity) || 0), 0);
  const totalRunningHours = equipmentList.reduce((sum, eq) => sum + (Number(eq.hourMeterReading) || 0), 0);

  // Open Create Form
  const handleOpenCreate = () => {
    if (activeTab === 'vehicles') {
      setVehicleForm(initialVehicleForm);
    } else {
      setEquipmentForm(initialEquipmentForm);
    }
    setFormMode('create');
    setEditingId(null);
    setIsAddingVehicleType(false);
    setIsAddingEquipmentType(false);
    setIsFormOpen(true);
  };

  // Open Edit Form
  const handleOpenEditVehicle = (v: Vehicle) => {
    setVehicleForm({
      vehicleNumber: v.vehicleNumber || '',
      fleetCode: v.fleetCode || '',
      vehicleType: v.vehicleType || 'Tipper',
      make: v.make || '',
      model: v.model || '',
      year: v.year || new Date().getFullYear(),
      registrationNumber: v.registrationNumber || '',
      chassisNumber: v.chassisNumber || '',
      engineNumber: v.engineNumber || '',
      tonCapacity: v.tonCapacity || 0,
      volumeCapacity: v.volumeCapacity || 0,
      volumeUnit: v.volumeUnit || 'CUM',
      fuelPowerType: v.fuelPowerType || 'Diesel',
      fuelConsumption: v.fuelConsumption || '',
      purchaseDate: v.purchaseDate ? v.purchaseDate.split('T')[0] : '',
      purchaseCost: v.purchaseCost || 0,
      vendor: v.vendor || '',
      insuranceValue: v.insuranceValue || 0,
      insuranceExpiryDate: v.insuranceExpiryDate ? v.insuranceExpiryDate.split('T')[0] : '',
      fitnessExpiryDate: v.fitnessExpiryDate ? v.fitnessExpiryDate.split('T')[0] : '',
      assignedDriverName: v.assignedDriverName || '',
      assignedDriverPhone: v.assignedDriverPhone || '',
      assignedProjectId: v.assignedProjectId || '',
      assignedProjectName: v.assignedProjectName || '',
      currentLocation: v.currentLocation || '',
      status: v.status || 'Active',
      notes: v.notes || ''
    });
    setEditingId(v.id);
    setFormMode('edit');
    setIsAddingVehicleType(false);
    setIsFormOpen(true);
  };

  const handleOpenEditEquipment = (eq: HeavyEquipment) => {
    setEquipmentForm({
      equipmentId: eq.equipmentId || '',
      equipmentNumber: eq.equipmentNumber || '',
      equipmentType: eq.equipmentType || 'Excavator',
      make: eq.make || '',
      model: eq.model || '',
      serialNumber: eq.serialNumber || '',
      manufacturingYear: eq.manufacturingYear || new Date().getFullYear(),
      excavatorBucketCapacity: eq.excavatorBucketCapacity || 0,
      boomLength: eq.boomLength || 0,
      loaderBucketCapacity: eq.loaderBucketCapacity || 0,
      craneLiftingCapacity: eq.craneLiftingCapacity || 0,
      forkliftForkCapacity: eq.forkliftForkCapacity || 0,
      dumperPayloadCapacity: eq.dumperPayloadCapacity || 0,
      operatingWeight: eq.operatingWeight || 0,
      fuelType: eq.fuelType || eq.fuelPowerType || 'Diesel',
      fuelPowerType: eq.fuelPowerType || eq.fuelType || 'Diesel',
      fuelConsumption: eq.fuelConsumption || '',
      hourMeterReading: eq.hourMeterReading || 0,
      purchaseDate: eq.purchaseDate ? eq.purchaseDate.split('T')[0] : '',
      purchaseCost: eq.purchaseCost || 0,
      vendor: eq.vendor || '',
      insuranceValue: eq.insuranceValue || 0,
      assignedOperatorName: eq.assignedOperatorName || '',
      assignedOperatorPhone: eq.assignedOperatorPhone || '',
      assignedProjectId: eq.assignedProjectId || '',
      assignedProjectName: eq.assignedProjectName || '',
      assignedWorksiteName: eq.assignedWorksiteName || '',
      status: eq.status || 'Active',
      notes: eq.notes || ''
    });
    setEditingId(eq.id);
    setFormMode('edit');
    setIsAddingEquipmentType(false);
    setIsFormOpen(true);
  };

  // Add Custom Vehicle Type Handler
  const handleAddCustomVehicleType = () => {
    const trimmed = newVehicleTypeInput.trim();
    if (!trimmed) return;
    if (!allVehicleTypes.includes(trimmed)) {
      setCustomVehicleTypes(prev => [...prev, trimmed]);
    }
    setVehicleForm(prev => ({ ...prev, vehicleType: trimmed }));
    setNewVehicleTypeInput('');
    setIsAddingVehicleType(false);
    showToast(`Added vehicle type: "${trimmed}"`, 'success');
  };

  // Add Custom Equipment Type Handler
  const handleAddCustomEquipmentType = () => {
    const trimmed = newEquipmentTypeInput.trim();
    if (!trimmed) return;
    if (!allEquipmentTypes.includes(trimmed)) {
      setCustomEquipmentTypes(prev => [...prev, trimmed]);
    }
    setEquipmentForm(prev => ({ ...prev, equipmentType: trimmed }));
    setNewEquipmentTypeInput('');
    setIsAddingEquipmentType(false);
    showToast(`Added equipment type: "${trimmed}"`, 'success');
  };

  // Submit Handler
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (activeTab === 'vehicles') {
        if (!vehicleForm.vehicleNumber.trim()) {
          showToast('Vehicle Number is required', 'error');
          setSaving(false);
          return;
        }

        const url = formMode === 'create' ? '/api/tenant/vehicles' : `/api/tenant/vehicles/${editingId}`;
        const method = formMode === 'create' ? 'POST' : 'PUT';
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...vehicleForm,
            firebaseUid: currentUser?.uid
          })
        });

        if (!res.ok) throw new Error('Failed to save vehicle');
        showToast(
          formMode === 'create' ? 'Vehicle registered successfully' : 'Vehicle details updated',
          'success'
        );
      } else {
        if (!equipmentForm.equipmentId.trim() || !equipmentForm.equipmentNumber.trim()) {
          showToast('Equipment ID and Equipment Number are required', 'error');
          setSaving(false);
          return;
        }

        const url = formMode === 'create' ? '/api/tenant/heavy-equipment' : `/api/tenant/heavy-equipment/${editingId}`;
        const method = formMode === 'create' ? 'POST' : 'PUT';
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...equipmentForm,
            fuelType: equipmentForm.fuelPowerType || equipmentForm.fuelType,
            firebaseUid: currentUser?.uid
          })
        });

        if (!res.ok) throw new Error('Failed to save heavy equipment');
        showToast(
          formMode === 'create' ? 'Heavy Equipment registered successfully' : 'Equipment details updated',
          'success'
        );
      }

      setIsFormOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Submit error:', err);
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete Handlers
  const handleDeleteVehicle = async (id: number | string) => {
    if (!window.confirm('Are you sure you want to permanently delete this vehicle?')) return;
    try {
      const res = await fetch(`/api/tenant/vehicles/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete vehicle');
      showToast('Vehicle deleted successfully');
      setVehicles(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Error deleting vehicle', 'error');
    }
  };

  const handleDeleteEquipment = async (id: number | string) => {
    if (!window.confirm('Are you sure you want to delete this heavy equipment asset?')) return;
    try {
      const res = await fetch(`/api/tenant/heavy-equipment/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete equipment');
      showToast('Equipment deleted successfully');
      setEquipmentList(prev => prev.filter(eq => eq.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Error deleting heavy equipment', 'error');
    }
  };

  // Status Badge Component
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
      case 'In Operation':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {status}
          </span>
        );
      case 'Under Maintenance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Wrench size={10} className="text-amber-600" />
            Under Maintenance
          </span>
        );
      case 'Breakdown':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle size={10} className="text-rose-600" />
            Breakdown
          </span>
        );
      case 'Idle':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock size={10} className="text-slate-500" />
            Idle
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // FULL-SCREEN FULL-WIDTH CREATE / EDIT FORM VIEW (NOT BOXED)
  // ══════════════════════════════════════════════════════════════════════════════
  if (isFormOpen) {
    const isVehicle = activeTab === 'vehicles';
    return (
      <div className="flex-1 overflow-y-auto bg-slate-50/70 p-4 sm:p-6 lg:p-8 space-y-6 w-full">
        {/* Top Header Bar - Full Width */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs px-5 py-3.5 flex items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {formMode === 'create'
                  ? isVehicle ? 'Register New Fleet Vehicle' : 'Register New Heavy Equipment'
                  : isVehicle ? `Edit Vehicle: ${vehicleForm.vehicleNumber}` : `Edit Equipment: ${equipmentForm.equipmentId}`}
              </h2>
              <p className="text-xs text-slate-500 hidden sm:block">
                {isVehicle ? 'Fill in logistics, fuel specs, capacity specifications and financial data' : 'Enter machinery specifications, power type, consumption ratings and maintenance status'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="master-fleet-form"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-[#46B351] hover:bg-[#3ca046] text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Check size={14} />
              {saving ? 'Saving...' : formMode === 'create' ? 'Save & Register Asset' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Full-Width Form Layout */}
        <form
          id="master-fleet-form"
          onSubmit={handleSubmitForm}
          className="space-y-6 w-full pb-16"
        >
          {isVehicle ? (
            /* ─────────────────────────────────────────────────────────────
               MODULE 1: VEHICLE MASTER FORM (Full Width Grid)
               ───────────────────────────────────────────────────────────── */
            <>
              {/* Section 1: Vehicle & Identification Information */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5 w-full">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 text-[#46B351] flex items-center justify-center font-bold">
                    <Truck size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">1. Vehicle & Identification Information</h3>
                    <p className="text-[11px] text-slate-400">Registration, vehicle classification, make, model and engine identifiers</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {/* Vehicle Number */}
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1.5">
                      Vehicle Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={vehicleForm.vehicleNumber}
                      onChange={e => setVehicleForm(prev => ({ ...prev, vehicleNumber: e.target.value.toUpperCase() }))}
                      placeholder="e.g. OD-05-BB-8921"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#46B351]/20 focus:border-[#46B351] font-bold text-xs text-slate-800 uppercase"
                    />
                  </div>

                  {/* Fleet Code */}
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1.5">Fleet Code</label>
                    <input
                      type="text"
                      value={vehicleForm.fleetCode}
                      onChange={e => setVehicleForm(prev => ({ ...prev, fleetCode: e.target.value.toUpperCase() }))}
                      placeholder="e.g. FL-TRK-101"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-medium text-xs text-slate-800 uppercase"
                    />
                  </div>

                  {/* Vehicle Type with Add Custom Type Option */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-bold text-slate-700 text-xs">Vehicle Type</label>
                      <button
                        type="button"
                        onClick={() => setIsAddingVehicleType(!isAddingVehicleType)}
                        className="text-[11px] font-bold text-[#46B351] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        {isAddingVehicleType ? 'Close' : '+ Add Custom'}
                      </button>
                    </div>

                    {isAddingVehicleType ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={newVehicleTypeInput}
                          onChange={e => setNewVehicleTypeInput(e.target.value)}
                          placeholder="Enter new vehicle type..."
                          className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 border border-[#46B351] focus:outline-none font-semibold text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomVehicleType}
                          className="px-2.5 py-2 rounded-xl bg-[#46B351] text-white text-xs font-bold hover:bg-[#3ca046] cursor-pointer"
                          title="Save Type"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <select
                        value={vehicleForm.vehicleType}
                        onChange={e => {
                          if (e.target.value === '__ADD_NEW__') {
                            setIsAddingVehicleType(true);
                          } else {
                            setVehicleForm(prev => ({ ...prev, vehicleType: e.target.value }));
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-semibold text-xs text-slate-800"
                      >
                        {allVehicleTypes.map(vt => (
                          <option key={vt} value={vt}>{vt}</option>
                        ))}
                        <option value="__ADD_NEW__" className="font-bold text-[#46B351]">
                          + Add New Custom Type...
                        </option>
                      </select>
                    )}
                  </div>

                  {/* Make / Manufacturer */}
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1.5">Make / Manufacturer</label>
                    <input
                      type="text"
                      value={vehicleForm.make}
                      onChange={e => setVehicleForm(prev => ({ ...prev, make: e.target.value }))}
                      placeholder="e.g. Tata Motors, BharatBenz, Ashok Leyland"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-medium text-xs text-slate-800"
                    />
                  </div>

                  {/* Model */}
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1.5">Model</label>
                    <input
                      type="text"
                      value={vehicleForm.model}
                      onChange={e => setVehicleForm(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="e.g. Signa 2823.K / 4028T"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-medium text-xs text-slate-800"
                    />
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1.5">Year of Manufacture</label>
                    <input
                      type="number"
                      min="1990"
                      max={new Date().getFullYear() + 1}
                      value={vehicleForm.year || ''}
                      onChange={e => setVehicleForm(prev => ({ ...prev, year: parseInt(e.target.value, 10) || 0 }))}
                      placeholder="e.g. 2023"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-medium text-xs text-slate-800"
                    />
                  </div>

                  {/* Registration Number */}
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1.5">Registration Number (RC)</label>
                    <input
                      type="text"
                      value={vehicleForm.registrationNumber}
                      onChange={e => setVehicleForm(prev => ({ ...prev, registrationNumber: e.target.value.toUpperCase() }))}
                      placeholder="e.g. OD05BB8921"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-medium text-xs text-slate-800 uppercase"
                    />
                  </div>

                  {/* Chassis Number */}
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1.5">Chassis Number</label>
                    <input
                      type="text"
                      value={vehicleForm.chassisNumber}
                      onChange={e => setVehicleForm(prev => ({ ...prev, chassisNumber: e.target.value.toUpperCase() }))}
                      placeholder="e.g. MAT624128N1A09823"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-medium text-xs text-slate-800 uppercase font-mono"
                    />
                  </div>

                  {/* Engine Number */}
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1.5">Engine Number</label>
                    <input
                      type="text"
                      value={vehicleForm.engineNumber}
                      onChange={e => setVehicleForm(prev => ({ ...prev, engineNumber: e.target.value.toUpperCase() }))}
                      placeholder="e.g. 497TCIC98412"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-medium text-xs text-slate-800 uppercase font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Capacity, Power & Fuel Specifications */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5 w-full">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Fuel size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">2. Fuel, Power & Capacity Specifications</h3>
                    <p className="text-[11px] text-slate-400">Fuel consumption rates, powertrain type, payload tonnage and volumetric limits</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {/* Fuel / Power Type */}
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1.5">
                      Fuel / Power Type
                    </label>
                    <select
                      value={vehicleForm.fuelPowerType || 'Diesel'}
                      onChange={e => setVehicleForm(prev => ({ ...prev, fuelPowerType: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-semibold text-xs text-slate-800"
                    >
                      {FUEL_POWER_TYPES.map(ft => (
                        <option key={ft} value={ft}>{ft}</option>
                      ))}
                    </select>
                  </div>

                  {/* Fuel Consumption */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-bold text-slate-700 text-xs">Fuel Consumption</label>
                      <span className="text-[10px] text-slate-400">km/L or L/100km</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={vehicleForm.fuelConsumption || ''}
                        onChange={e => setVehicleForm(prev => ({ ...prev, fuelConsumption: e.target.value }))}
                        placeholder="e.g. 3.8 km/L"
                        className="w-full px-4 py-2.5 pr-8 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-semibold text-xs text-slate-800"
                      />
                      <Fuel size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Ton Capacity */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-bold text-slate-700 text-xs">Ton Capacity (Payload)</label>
                      <span className="text-[10px] text-slate-400">Metric Tons</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={vehicleForm.tonCapacity || ''}
                        onChange={e => setVehicleForm(prev => ({ ...prev, tonCapacity: parseFloat(e.target.value) || 0 }))}
                        placeholder="e.g. 28.5"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-bold text-xs text-slate-800"
                      />
                      <span className="absolute right-3.5 top-3 text-[11px] font-bold text-slate-400 pointer-events-none">
                        MT
                      </span>
                    </div>
                  </div>

                  {/* Volume Capacity & Unit */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-bold text-slate-700 text-xs">Volume Capacity</label>
                      <span className="text-[10px] text-slate-400">Cubic Meters / Liters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={vehicleForm.volumeCapacity || ''}
                        onChange={e => setVehicleForm(prev => ({ ...prev, volumeCapacity: parseFloat(e.target.value) || 0 }))}
                        placeholder="e.g. 16.0"
                        className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-bold text-xs text-slate-800"
                      />
                      <select
                        value={vehicleForm.volumeUnit}
                        onChange={e => setVehicleForm(prev => ({ ...prev, volumeUnit: e.target.value }))}
                        className="w-24 px-2 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs text-slate-700"
                      >
                        <option value="CUM">CUM</option>
                        <option value="KL">KL</option>
                        <option value="Liters">Liters</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Financial & Procurement Information */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5 w-full">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <IndianRupee size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">3. Financial & Vendor Information</h3>
                    <p className="text-[11px] text-slate-400">Asset acquisition cost, supplier vendor, and insurance valuation</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {/* Purchase Date */}
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1.5">Purchase Date</label>
                    <input
                      type="date"
                      value={vehicleForm.purchaseDate}
                      onChange={e => setVehicleForm(prev => ({ ...prev, purchaseDate: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-medium text-xs text-slate-800"
                    />
                  </div>

                  {/* Purchase Cost */}
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1.5">Purchase Cost (₹)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={vehicleForm.purchaseCost || ''}
                        onChange={e => setVehicleForm(prev => ({ ...prev, purchaseCost: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                        className="w-full px-4 py-2.5 pl-8 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-black text-xs text-slate-900"
                      />
                      <IndianRupee size={13} className="absolute left-2.5 top-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Vendor */}
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1.5">Vendor / Dealer</label>
                    <input
                      type="text"
                      value={vehicleForm.vendor}
                      onChange={e => setVehicleForm(prev => ({ ...prev, vendor: e.target.value }))}
                      placeholder="e.g. Tata Commercial Sales / Gainwell"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-medium text-xs text-slate-800"
                    />
                  </div>

                  {/* Insurance Value */}
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1.5">Insurance Value (IDV in ₹)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={vehicleForm.insuranceValue || ''}
                        onChange={e => setVehicleForm(prev => ({ ...prev, insuranceValue: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                        className="w-full px-4 py-2.5 pl-8 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-bold text-xs text-slate-900"
                      />
                      <IndianRupee size={13} className="absolute left-2.5 top-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1.5">Status</label>
                    <select
                      value={vehicleForm.status}
                      onChange={e => setVehicleForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-bold text-xs text-slate-800"
                    >
                      <option value="Active">Active</option>
                      <option value="Under Maintenance">Under Maintenance</option>
                      <option value="Breakdown">Breakdown</option>
                      <option value="Idle">Idle</option>
                      <option value="Decommissioned">Decommissioned</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ─────────────────────────────────────────────────────────────
               MODULE 2: HEAVY EQUIPMENT MASTER FORM (Full Width Grid)
               ───────────────────────────────────────────────────────────── */
            <>
              {/* Section 1: Equipment Identification & Power Specs */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5 w-full">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                  <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <HardHat size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">1. Heavy Equipment Identification & Power Specs</h3>
                    <p className="text-[11px] text-slate-400">Equipment code, classification, make, model, power type and consumption rates</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {/* Equipment ID */}
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1.5">
                      Equipment ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={equipmentForm.equipmentId}
                      onChange={e => setEquipmentForm(prev => ({ ...prev, equipmentId: e.target.value.toUpperCase() }))}
                      placeholder="e.g. EQ-EXC-01"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#46B351]/20 focus:border-[#46B351] font-bold text-xs text-slate-800 uppercase"
                    />
                  </div>

                  {/* Equipment Number */}
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1.5">
                      Equipment Number (Asset Tag / Reg) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={equipmentForm.equipmentNumber}
                      onChange={e => setEquipmentForm(prev => ({ ...prev, equipmentNumber: e.target.value.toUpperCase() }))}
                      placeholder="e.g. EXC-CAT-2101"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#46B351]/20 focus:border-[#46B351] font-bold text-xs text-slate-800 uppercase"
                    />
                  </div>

                  {/* Equipment Type with Dynamic Custom Type Option */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-bold text-slate-700 text-xs">Equipment Type</label>
                      <button
                        type="button"
                        onClick={() => setIsAddingEquipmentType(!isAddingEquipmentType)}
                        className="text-[11px] font-bold text-[#46B351] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        {isAddingEquipmentType ? 'Close' : '+ Add Custom'}
                      </button>
                    </div>

                    {isAddingEquipmentType ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={newEquipmentTypeInput}
                          onChange={e => setNewEquipmentTypeInput(e.target.value)}
                          placeholder="Enter equipment type..."
                          className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 border border-[#46B351] focus:outline-none font-semibold text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomEquipmentType}
                          className="px-2.5 py-2 rounded-xl bg-[#46B351] text-white text-xs font-bold hover:bg-[#3ca046] cursor-pointer"
                          title="Save Type"
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <select
                        value={equipmentForm.equipmentType}
                        onChange={e => {
                          if (e.target.value === '__ADD_NEW__') {
                            setIsAddingEquipmentType(true);
                          } else {
                            setEquipmentForm(prev => ({ ...prev, equipmentType: e.target.value }));
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-semibold text-xs text-slate-800"
                      >
                        {allEquipmentTypes.map(eqt => (
                          <option key={eqt} value={eqt}>{eqt}</option>
                        ))}
                        <option value="__ADD_NEW__" className="font-bold text-[#46B351]">
                          + Add New Custom Type...
                        </option>
                      </select>
                    )}
                  </div>

                  {/* Make */}
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1.5">Make / OEM Brand</label>
                    <input
                      type="text"
                      value={equipmentForm.make}
                      onChange={e => setEquipmentForm(prev => ({ ...prev, make: e.target.value }))}
                      placeholder="e.g. Caterpillar, Komatsu, JCB, Sany"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-medium text-xs text-slate-800"
                    />
                  </div>

                  {/* Model */}
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1.5">Model</label>
                    <input
                      type="text"
                      value={equipmentForm.model}
                      onChange={e => setEquipmentForm(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="e.g. CAT 320D3 / WA380 / 3DX"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-medium text-xs text-slate-800"
                    />
                  </div>

                  {/* Serial Number */}
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1.5">Serial Number</label>
                    <input
                      type="text"
                      value={equipmentForm.serialNumber}
                      onChange={e => setEquipmentForm(prev => ({ ...prev, serialNumber: e.target.value.toUpperCase() }))}
                      placeholder="e.g. CAT0320DPR823412"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-medium text-xs text-slate-800 uppercase font-mono"
                    />
                  </div>

                  {/* Manufacturing Year */}
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1.5">Manufacturing Year</label>
                    <input
                      type="number"
                      min="1990"
                      max={new Date().getFullYear() + 1}
                      value={equipmentForm.manufacturingYear || ''}
                      onChange={e => setEquipmentForm(prev => ({ ...prev, manufacturingYear: parseInt(e.target.value, 10) || 0 }))}
                      placeholder="e.g. 2022"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-medium text-xs text-slate-800"
                    />
                  </div>

                  {/* Fuel / Power Type */}
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1.5">Fuel / Power Type</label>
                    <select
                      value={equipmentForm.fuelPowerType || equipmentForm.fuelType || 'Diesel'}
                      onChange={e => setEquipmentForm(prev => ({ ...prev, fuelPowerType: e.target.value, fuelType: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-semibold text-xs text-slate-800"
                    >
                      {FUEL_POWER_TYPES.map(ft => (
                        <option key={ft} value={ft}>{ft}</option>
                      ))}
                    </select>
                  </div>

                  {/* Fuel Consumption */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-bold text-slate-700 text-xs">Fuel Consumption</label>
                      <span className="text-[10px] text-slate-400">Liters/Hour or L/hr</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={equipmentForm.fuelConsumption || ''}
                        onChange={e => setEquipmentForm(prev => ({ ...prev, fuelConsumption: e.target.value }))}
                        placeholder="e.g. 18.5 L/hr"
                        className="w-full px-4 py-2.5 pr-8 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-semibold text-xs text-slate-800"
                      />
                      <Fuel size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Operating Weight */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-bold text-slate-700 text-xs">Operating Weight</label>
                      <span className="text-[10px] text-slate-400">Metric Tons</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={equipmentForm.operatingWeight || ''}
                        onChange={e => setEquipmentForm(prev => ({ ...prev, operatingWeight: parseFloat(e.target.value) || 0 }))}
                        placeholder="e.g. 21.5"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-bold text-xs text-slate-800"
                      />
                      <span className="absolute right-3.5 top-3 text-[11px] font-bold text-slate-400 pointer-events-none">
                        MT
                      </span>
                    </div>
                  </div>

                  {/* Hour Meter Reading */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-bold text-slate-700 text-xs">Hour Meter Reading</label>
                      <span className="text-[10px] text-slate-400">Total Run Hours</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={equipmentForm.hourMeterReading || ''}
                        onChange={e => setEquipmentForm(prev => ({ ...prev, hourMeterReading: parseFloat(e.target.value) || 0 }))}
                        placeholder="e.g. 3420.5"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-black text-xs text-slate-900"
                      />
                      <span className="absolute right-3.5 top-3 text-[11px] font-bold text-amber-600 pointer-events-none">
                        HRS
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Technical Specifications */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5 w-full">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <SlidersHorizontal size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">2. Technical Specifications</h3>
                    <p className="text-[11px] text-slate-400">Excavator, Loader, Crane, Forklift and Dumper mechanical ratings</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {/* Excavator Bucket Capacity */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-bold text-slate-700 text-xs">Excavator Bucket Capacity</label>
                      <span className="text-[10px] text-slate-400">CUM</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        value={equipmentForm.excavatorBucketCapacity || ''}
                        onChange={e => setEquipmentForm(prev => ({ ...prev, excavatorBucketCapacity: parseFloat(e.target.value) || 0 }))}
                        placeholder="e.g. 1.20"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-bold text-xs text-slate-800"
                      />
                      <span className="absolute right-3.5 top-3 text-[11px] font-bold text-slate-400 pointer-events-none">
                        CUM
                      </span>
                    </div>
                  </div>

                  {/* Boom Length */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-bold text-slate-700 text-xs">Boom Length</label>
                      <span className="text-[10px] text-slate-400">Meters</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={equipmentForm.boomLength || ''}
                        onChange={e => setEquipmentForm(prev => ({ ...prev, boomLength: parseFloat(e.target.value) || 0 }))}
                        placeholder="e.g. 5.7"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-bold text-xs text-slate-800"
                      />
                      <span className="absolute right-3.5 top-3 text-[11px] font-bold text-slate-400 pointer-events-none">
                        Meters
                      </span>
                    </div>
                  </div>

                  {/* Loader Bucket Capacity */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-bold text-slate-700 text-xs">Loader Bucket Capacity</label>
                      <span className="text-[10px] text-slate-400">CUM</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        value={equipmentForm.loaderBucketCapacity || ''}
                        onChange={e => setEquipmentForm(prev => ({ ...prev, loaderBucketCapacity: parseFloat(e.target.value) || 0 }))}
                        placeholder="e.g. 3.50"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-bold text-xs text-slate-800"
                      />
                      <span className="absolute right-3.5 top-3 text-[11px] font-bold text-slate-400 pointer-events-none">
                        CUM
                      </span>
                    </div>
                  </div>

                  {/* Crane Lifting Capacity */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-bold text-slate-700 text-xs">Crane Lifting Capacity</label>
                      <span className="text-[10px] text-slate-400">Metric Tons</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={equipmentForm.craneLiftingCapacity || ''}
                        onChange={e => setEquipmentForm(prev => ({ ...prev, craneLiftingCapacity: parseFloat(e.target.value) || 0 }))}
                        placeholder="e.g. 25.0"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-bold text-xs text-slate-800"
                      />
                      <span className="absolute right-3.5 top-3 text-[11px] font-bold text-slate-400 pointer-events-none">
                        Tons
                      </span>
                    </div>
                  </div>

                  {/* Forklift Fork Capacity */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-bold text-slate-700 text-xs">Forklift Fork Capacity</label>
                      <span className="text-[10px] text-slate-400">Metric Tons</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={equipmentForm.forkliftForkCapacity || ''}
                        onChange={e => setEquipmentForm(prev => ({ ...prev, forkliftForkCapacity: parseFloat(e.target.value) || 0 }))}
                        placeholder="e.g. 3.5"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-bold text-xs text-slate-800"
                      />
                      <span className="absolute right-3.5 top-3 text-[11px] font-bold text-slate-400 pointer-events-none">
                        Tons
                      </span>
                    </div>
                  </div>

                  {/* Dumper Payload Capacity */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-bold text-slate-700 text-xs">Dumper Payload Capacity</label>
                      <span className="text-[10px] text-slate-400">Metric Tons</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={equipmentForm.dumperPayloadCapacity || ''}
                        onChange={e => setEquipmentForm(prev => ({ ...prev, dumperPayloadCapacity: parseFloat(e.target.value) || 0 }))}
                        placeholder="e.g. 40.0"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-bold text-xs text-slate-800"
                      />
                      <span className="absolute right-3.5 top-3 text-[11px] font-bold text-slate-400 pointer-events-none">
                        Tons
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Financial Information & Status */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5 w-full">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <IndianRupee size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">3. Financial Information & Status</h3>
                    <p className="text-[11px] text-slate-400">Capital purchase cost, equipment supplier, and operational status</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {/* Purchase Date */}
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1.5">Purchase Date</label>
                    <input
                      type="date"
                      value={equipmentForm.purchaseDate}
                      onChange={e => setEquipmentForm(prev => ({ ...prev, purchaseDate: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-medium text-xs text-slate-800"
                    />
                  </div>

                  {/* Purchase Cost */}
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1.5">Purchase Cost (₹)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={equipmentForm.purchaseCost || ''}
                        onChange={e => setEquipmentForm(prev => ({ ...prev, purchaseCost: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                        className="w-full px-4 py-2.5 pl-8 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-black text-xs text-slate-900"
                      />
                      <IndianRupee size={13} className="absolute left-2.5 top-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Vendor */}
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1.5">Vendor / Supplier</label>
                    <input
                      type="text"
                      value={equipmentForm.vendor}
                      onChange={e => setEquipmentForm(prev => ({ ...prev, vendor: e.target.value }))}
                      placeholder="e.g. L&T Construction Equipment / Gainwell"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-medium text-xs text-slate-800"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block font-bold text-slate-700 text-xs mb-1.5">Status</label>
                    <select
                      value={equipmentForm.status}
                      onChange={e => setEquipmentForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-bold text-xs text-slate-800"
                    >
                      <option value="Active">Active</option>
                      <option value="In Operation">In Operation</option>
                      <option value="Under Maintenance">Under Maintenance</option>
                      <option value="Breakdown">Breakdown</option>
                      <option value="Idle">Idle</option>
                      <option value="Decommissioned">Decommissioned</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}
        </form>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // MAIN REGISTRY & DASHBOARD VIEW
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/60 p-4 sm:p-6 lg:p-8 space-y-6 w-full">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold transition-all ${toast.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
              : toast.type === 'error'
                ? 'bg-rose-900 text-rose-100 border-rose-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertCircle size={16} className="text-rose-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-[#46B351] text-white flex items-center justify-center shadow-sm">
              <Truck size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Fleet & Equipment Master</h1>
              <p className="text-xs text-slate-500">Centralized asset registry for logistics transport fleet and heavy earthmoving machinery</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            title="Refresh assets"
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-[#46B351] hover:bg-[#3ca046] text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus size={16} />
            {activeTab === 'vehicles' ? 'Add Vehicle' : 'Add Heavy Equipment'}
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Fleet Assets</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Layers size={14} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{totalFleetCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {vehicles.length} Vehicles • {equipmentList.length} Heavy Machinery
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Fleet</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Truck size={14} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600">{totalActiveVehicles + totalActiveEquipment}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {totalPayloadTonnage.toLocaleString()} MT Total Capacity
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Machinery Run Hours</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Gauge size={14} />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600">
            {Math.round(totalRunningHours).toLocaleString()}
            <span className="text-xs font-normal text-slate-400 ml-1">hrs</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {equipmentList.filter(eq => eq.status === 'In Operation').length} Assets actively deployed
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Asset Valuation</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <IndianRupee size={14} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            ₹{(totalAssetValuation / 10000000).toFixed(2)}
            <span className="text-xs font-bold text-slate-400 ml-1">Cr</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {totalMaintenance} Units in Maintenance / Breakdown
          </p>
        </div>
      </div>

      {/* Segmented Tab Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 shadow-2xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('vehicles');
              setTypeFilter('All');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'vehicles'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
          >
            <Truck size={14} className={activeTab === 'vehicles' ? 'text-[#46B351]' : 'text-slate-400'} />
            <span>MODULE 1: Vehicle Master</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'vehicles' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
              {vehicles.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('equipment');
              setTypeFilter('All');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'equipment'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
          >
            <HardHat size={14} className={activeTab === 'equipment' ? 'text-amber-400' : 'text-slate-400'} />
            <span>MODULE 2: Heavy Equipment Master</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'equipment' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
              {equipmentList.length}
            </span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1 pr-2">
          <button
            onClick={() => setViewMode('table')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold ${viewMode === 'table' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            Grid
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'vehicles'
                ? 'Search vehicle number, fleet code, make...'
                : 'Search equipment ID, number, model, type...'
            }
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-[#46B351] font-medium"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Classification Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="All">All Types</option>
            {activeTab === 'vehicles'
              ? allVehicleTypes.map(t => <option key={t} value={t}>{t}</option>)
              : allEquipmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            {activeTab === 'equipment' && <option value="In Operation">In Operation</option>}
            <option value="Under Maintenance">Under Maintenance</option>
            <option value="Breakdown">Breakdown</option>
            <option value="Idle">Idle</option>
            <option value="Decommissioned">Decommissioned</option>
          </select>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          MODULE 1: VEHICLE MASTER TABLE / GRID
          ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'vehicles' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredVehicles.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Truck size={24} />
              </div>
              <h4 className="font-bold text-sm text-slate-800">No Vehicles Registered</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Get started by adding your first logistics truck, tipper, flatbed or transport tanker.
              </p>
              <button
                onClick={handleOpenCreate}
                className="mt-2 px-4 py-2 rounded-xl bg-[#46B351] text-white text-xs font-bold hover:bg-[#3ca046] transition-colors"
              >
                + Register First Vehicle
              </button>
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Vehicle & Fleet Code</th>
                    <th className="py-3 px-4">Type & Make</th>
                    <th className="py-3 px-4">Capacity Specs</th>
                    <th className="py-3 px-4">Fuel & Powertrain</th>
                    <th className="py-3 px-4">Registration & Chassis</th>
                    <th className="py-3 px-4">Financial & Valuation</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredVehicles.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Vehicle Number & Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold shrink-0">
                            <Truck size={16} />
                          </div>
                          <div>
                            <span className="font-black text-slate-900 hover:text-[#46B351] transition-colors">
                              {v.vehicleNumber}
                            </span>
                            {v.fleetCode && (
                              <span className="block text-[11px] font-semibold text-slate-400 font-mono">
                                {v.fleetCode}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type & Make */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800">{v.vehicleType}</span>
                        <span className="block text-[11px] text-slate-400">
                          {v.make || '—'} {v.model ? `• ${v.model}` : ''} {v.year ? `(${v.year})` : ''}
                        </span>
                      </td>

                      {/* Capacity Specs */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {v.tonCapacity ? (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 font-bold text-[10px]">
                              {v.tonCapacity} MT
                            </span>
                          ) : null}
                          {v.volumeCapacity ? (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium text-[10px]">
                              {v.volumeCapacity} {v.volumeUnit || 'CUM'}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Fuel & Powertrain */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px]">
                            <Fuel size={10} className="text-emerald-600" />
                            {v.fuelPowerType || 'Diesel'}
                          </span>
                        </div>
                        {v.fuelConsumption && (
                          <span className="block text-[11px] text-slate-500 font-medium mt-0.5">
                            {v.fuelConsumption}
                          </span>
                        )}
                      </td>

                      {/* Registration & Chassis */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <span className="text-slate-700 font-bold">{v.registrationNumber || '—'}</span>
                        {v.chassisNumber && (
                          <span className="block text-[10px] text-slate-400 truncate max-w-[140px]" title={v.chassisNumber}>
                            Chassis: {v.chassisNumber}
                          </span>
                        )}
                      </td>

                      {/* Financial Info */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-emerald-700">₹{Number(v.purchaseCost || 0).toLocaleString()}</span>
                        {v.vendor && (
                          <span className="block text-[11px] text-slate-400 truncate max-w-[140px]" title={v.vendor}>
                            {v.vendor}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(v.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                          <button
                            onClick={() => setViewingVehicle(v)}
                            title="View Vehicle Details"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handleOpenEditVehicle(v)}
                            title="Edit Vehicle"
                            className="p-1.5 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteVehicle(v.id)}
                            title="Delete Vehicle"
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Grid View */
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredVehicles.map(v => (
                <div key={v.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 text-[#46B351] flex items-center justify-center font-bold">
                        <Truck size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{v.vehicleNumber}</h4>
                        <span className="text-[11px] font-semibold text-slate-400">{v.vehicleType}</span>
                      </div>
                    </div>
                    {getStatusBadge(v.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Fleet Code</span>
                      <span className="font-mono font-bold text-slate-700">{v.fleetCode || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Make & Model</span>
                      <span className="font-bold text-slate-700 truncate block">{v.make || '—'} {v.model || ''}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Payload</span>
                      <span className="font-bold text-emerald-600">{v.tonCapacity || 0} MT</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Fuel / Power</span>
                      <span className="font-bold text-slate-700">{v.fuelPowerType || 'Diesel'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-bold text-emerald-700 truncate max-w-[180px]">
                      ₹{Number(v.purchaseCost || 0).toLocaleString()}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditVehicle(v)}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteVehicle(v.id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────
          MODULE 2: HEAVY EQUIPMENT MASTER TABLE / GRID
          ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'equipment' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredEquipment.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                <HardHat size={24} />
              </div>
              <h4 className="font-bold text-sm text-slate-800">No Heavy Equipment Registered</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Register construction machinery, excavators, cranes, wheel loaders, forklifts and dumpers.
              </p>
              <button
                onClick={handleOpenCreate}
                className="mt-2 px-4 py-2 rounded-xl bg-[#46B351] text-white text-xs font-bold hover:bg-[#3ca046] transition-colors"
              >
                + Register First Equipment
              </button>
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Equipment ID & Number</th>
                    <th className="py-3 px-4">Equipment Type & Make</th>
                    <th className="py-3 px-4">Technical Ratings & Specs</th>
                    <th className="py-3 px-4">Fuel & Powertrain</th>
                    <th className="py-3 px-4">Hour Meter</th>
                    <th className="py-3 px-4">Purchase Info</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredEquipment.map(eq => (
                    <tr key={eq.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* ID & Number */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                            <HardHat size={16} />
                          </div>
                          <div>
                            <span className="font-black text-slate-900 font-mono hover:text-[#46B351] transition-colors">
                              {eq.equipmentId}
                            </span>
                            <span className="block text-[11px] font-bold text-slate-500">
                              {eq.equipmentNumber}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Type & Make */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800">{eq.equipmentType}</span>
                        <span className="block text-[11px] text-slate-400">
                          {eq.make || '—'} {eq.model ? `• ${eq.model}` : ''} {eq.manufacturingYear ? `(${eq.manufacturingYear})` : ''}
                        </span>
                      </td>

                      {/* Technical Specs */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {Number(eq.excavatorBucketCapacity) > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[10px]">
                              Bucket: {eq.excavatorBucketCapacity} CUM
                            </span>
                          )}
                          {Number(eq.loaderBucketCapacity) > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[10px]">
                              Loader: {eq.loaderBucketCapacity} CUM
                            </span>
                          )}
                          {Number(eq.craneLiftingCapacity) > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 font-bold text-[10px]">
                              Crane: {eq.craneLiftingCapacity} Tons
                            </span>
                          )}
                          {Number(eq.forkliftForkCapacity) > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-700 font-bold text-[10px]">
                              Forklift: {eq.forkliftForkCapacity} Tons
                            </span>
                          )}
                          {Number(eq.dumperPayloadCapacity) > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[10px]">
                              Dumper: {eq.dumperPayloadCapacity} Tons
                            </span>
                          )}
                          {Number(eq.boomLength) > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium text-[10px]">
                              Boom: {eq.boomLength}m
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Fuel & Powertrain */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px]">
                            <Fuel size={10} className="text-amber-600" />
                            {eq.fuelPowerType || eq.fuelType || 'Diesel'}
                          </span>
                        </div>
                        {eq.fuelConsumption && (
                          <span className="block text-[11px] text-slate-500 font-medium mt-0.5">
                            {eq.fuelConsumption}
                          </span>
                        )}
                      </td>

                      {/* Hour Meter */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-bold text-slate-800">
                          {Number(eq.hourMeterReading || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">hrs</span>
                      </td>

                      {/* Purchase Info */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-emerald-700">₹{Number(eq.purchaseCost || 0).toLocaleString()}</span>
                        {eq.purchaseDate && (
                          <span className="block text-[11px] text-slate-400">
                            {new Date(eq.purchaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(eq.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                          <button
                            onClick={() => setViewingEquipment(eq)}
                            title="View Equipment Details"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handleOpenEditEquipment(eq)}
                            title="Edit Heavy Equipment"
                            className="p-1.5 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteEquipment(eq.id)}
                            title="Delete Heavy Equipment"
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Grid View */
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredEquipment.map(eq => (
                <div key={eq.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        <HardHat size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{eq.equipmentId}</h4>
                        <span className="text-[11px] font-semibold text-slate-400">{eq.equipmentType}</span>
                      </div>
                    </div>
                    {getStatusBadge(eq.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Asset Tag</span>
                      <span className="font-mono font-bold text-slate-700">{eq.equipmentNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Make & Model</span>
                      <span className="font-bold text-slate-700 truncate block">{eq.make || '—'} {eq.model || ''}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Hour Meter</span>
                      <span className="font-bold text-amber-600">{Number(eq.hourMeterReading || 0).toLocaleString()} hrs</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Fuel / Power</span>
                      <span className="font-bold text-slate-700 truncate block">{eq.fuelPowerType || eq.fuelType || 'Diesel'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-bold text-emerald-700 truncate max-w-[180px]">
                      ₹{Number(eq.purchaseCost || 0).toLocaleString()}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditEquipment(eq)}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteEquipment(eq.id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          DETAIL POPUP MODALS FOR VEHICLE AND EQUIPMENT
          ────────────────────────────────────────────────────────────────────────── */}
      {viewingVehicle && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-[#46B351] flex items-center justify-center">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">{viewingVehicle.vehicleNumber}</h3>
                  <span className="text-xs text-slate-500">{viewingVehicle.vehicleType} • {viewingVehicle.fleetCode || 'No Fleet Code'}</span>
                </div>
              </div>
              <button
                onClick={() => setViewingVehicle(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Make & Model</span>
                <span className="font-bold text-slate-800">{viewingVehicle.make || '—'} {viewingVehicle.model || ''} ({viewingVehicle.year || '—'})</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Payload & Volume</span>
                <span className="font-bold text-slate-800">{viewingVehicle.tonCapacity || 0} MT • {viewingVehicle.volumeCapacity || 0} {viewingVehicle.volumeUnit || 'CUM'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Fuel / Power Type</span>
                <span className="font-bold text-emerald-700">{viewingVehicle.fuelPowerType || 'Diesel'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Fuel Consumption</span>
                <span className="font-bold text-slate-800">{viewingVehicle.fuelConsumption || 'Not specified'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Registration Number</span>
                <span className="font-mono font-bold text-slate-800">{viewingVehicle.registrationNumber || '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Chassis Number</span>
                <span className="font-mono text-[11px] font-bold text-slate-800">{viewingVehicle.chassisNumber || '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Engine Number</span>
                <span className="font-mono text-[11px] font-bold text-slate-800">{viewingVehicle.engineNumber || '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Purchase Cost / Valuation</span>
                <span className="font-bold text-emerald-700">₹{Number(viewingVehicle.purchaseCost || 0).toLocaleString()}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Vendor / Dealer</span>
                <span className="font-bold text-slate-800">{viewingVehicle.vendor || '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Insurance Value</span>
                <span className="font-bold text-slate-800">₹{Number(viewingVehicle.insuranceValue || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingVehicle(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingEquipment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <HardHat size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">{viewingEquipment.equipmentId}</h3>
                  <span className="text-xs text-slate-500">{viewingEquipment.equipmentType} • {viewingEquipment.equipmentNumber}</span>
                </div>
              </div>
              <button
                onClick={() => setViewingEquipment(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Make & Model</span>
                <span className="font-bold text-slate-800">{viewingEquipment.make || '—'} {viewingEquipment.model || ''}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Serial Number</span>
                <span className="font-mono text-[11px] font-bold text-slate-800">{viewingEquipment.serialNumber || '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Fuel / Power Type</span>
                <span className="font-bold text-amber-700">{viewingEquipment.fuelPowerType || viewingEquipment.fuelType || 'Diesel'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Fuel Consumption</span>
                <span className="font-bold text-slate-800">{viewingEquipment.fuelConsumption || 'Not specified'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Hour Meter Reading</span>
                <span className="font-bold text-amber-700">{Number(viewingEquipment.hourMeterReading || 0).toLocaleString()} hrs</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Operating Weight</span>
                <span className="font-bold text-slate-800">{viewingEquipment.operatingWeight ? `${viewingEquipment.operatingWeight} MT` : '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Purchase Date</span>
                <span className="font-bold text-slate-800">{viewingEquipment.purchaseDate || '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Purchase Cost</span>
                <span className="font-bold text-emerald-700">₹{Number(viewingEquipment.purchaseCost || 0).toLocaleString()}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Vendor / Supplier</span>
                <span className="font-bold text-slate-800">{viewingEquipment.vendor || '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-semibold">Status</span>
                {getStatusBadge(viewingEquipment.status)}
              </div>
            </div>

            {viewingEquipment.notes && (
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/50 text-[11px] text-amber-950">
                <span className="font-bold block mb-0.5">Directives:</span>
                {viewingEquipment.notes}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingEquipment(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

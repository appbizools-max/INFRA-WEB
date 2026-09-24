import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { 
  ClipboardList, Plus, Search, AlertCircle, Clock, CheckCircle2, 
  PauseCircle, XCircle, Eye, Edit2, Trash2, 
  Calendar, MapPin, Briefcase, X, AlertTriangle, Network, FolderPlus, Package, UserCheck, Shield, Building2, Check, ChevronDown,
  Truck, Train, Ship, Plane, Percent, IndianRupee, ArrowRight, ArrowLeft, Scale, Calculator, FileText
} from 'lucide-react';

interface WorkOrder {
  id: number | string;
  orderNumber: string;
  title: string;
  description?: string;
  projectId?: string;
  projectName?: string;
  clientId?: string;
  clientName?: string;
  clientCode?: string;
  worksiteId?: string;
  worksiteName?: string;
  projectLocationAddress?: string;
  loadingLocation?: string;
  unloadingLocation?: string;
  transportModes?: string;
  isLossApplicable?: boolean;
  allowedLossPercent?: number;
  rateType?: string;
  ratePerUnit?: number;
  paymentTerms?: string;
  commodity?: string;
  contractQuantity?: string;
  contractQuantityUnit?: string;
  divisionName?: string;
  assignedStaffName?: string;
  priority?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled';
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  estimatedCost?: number;
  actualCost?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function WorkOrdersPage() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // External Reference Data for Dropdowns
  const [worksites, setWorksites] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<WorkOrder | null>(null);
  const [saving, setSaving] = useState(false);

  // Convert to Project Popup Modal States
  const [convertingOrder, setConvertingOrder] = useState<WorkOrder | null>(null);
  const [selectedProjectHead, setSelectedProjectHead] = useState<string>('');
  const [customProjectHead, setCustomProjectHead] = useState<string>('');
  const [projectHeadRole, setProjectHeadRole] = useState<string>('Project Head');
  const [modalDivisionName, setModalDivisionName] = useState<string>('');
  const [convertingLoading, setConvertingLoading] = useState(false);

  // 2-3 second in-app acknowledgment toast (No Chrome popup)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 2500); // 2.5 seconds auto-dismiss
    return () => clearTimeout(timer);
  }, [toast]);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clientId: '',
    clientName: '',
    clientCode: '',
    customClientName: '',
    worksiteId: '',
    worksiteName: '',
    selectedWorksiteIds: [] as string[],
    projectLocationAddress: '',
    loadingLocation: '',
    unloadingLocation: '',
    selectedTransportModes: ['Road'] as string[],
    isLossApplicable: false,
    allowedLossPercent: 0,
    rateType: 'Per Ton',
    customRateType: '',
    ratePerUnit: 0,
    paymentTerms: 'Net 30 Days',
    customPaymentTerms: '',
    commodity: 'Coal',
    customCommodity: '',
    contractQuantity: '',
    contractQuantityUnit: 'Tons',
    customQuantityUnit: '',
    divisionName: '',
    selectedDivisions: [] as string[],
    status: 'Pending' as 'Pending' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled',
    startDate: '',
    endDate: '',
    estimatedCost: 0,
    notes: ''
  });

  // Multi-select dropdown states & refs
  const [isWorksiteDropdownOpen, setIsWorksiteDropdownOpen] = useState(false);
  const [isDivisionDropdownOpen, setIsDivisionDropdownOpen] = useState(false);
  const worksiteDropdownRef = useRef<HTMLDivElement>(null);
  const divisionDropdownRef = useRef<HTMLDivElement>(null);

  const handleToggleTransportMode = (mode: string) => {
    setFormData(prev => {
      const exists = prev.selectedTransportModes.includes(mode);
      const nextModes = exists 
        ? prev.selectedTransportModes.filter(m => m !== mode)
        : [...prev.selectedTransportModes, mode];
      return {
        ...prev,
        selectedTransportModes: nextModes.length > 0 ? nextModes : [mode]
      };
    });
  };

  const handleContractQuantityChange = (val: string) => {
    setFormData(prev => {
      const cleanNum = parseFloat(val.replace(/,/g, '')) || 0;
      const rate = Number(prev.ratePerUnit) || 0;
      const newEstimated = (cleanNum > 0 && rate > 0) ? Math.round(cleanNum * rate) : prev.estimatedCost;
      return {
        ...prev,
        contractQuantity: val,
        estimatedCost: newEstimated
      };
    });
  };

  const handleRatePerUnitChange = (val: number) => {
    setFormData(prev => {
      const cleanNum = parseFloat(String(prev.contractQuantity).replace(/,/g, '')) || 0;
      const newEstimated = (cleanNum > 0 && val > 0) ? Math.round(cleanNum * val) : prev.estimatedCost;
      return {
        ...prev,
        ratePerUnit: val,
        estimatedCost: newEstimated
      };
    });
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (worksiteDropdownRef.current && !worksiteDropdownRef.current.contains(event.target as Node)) {
        setIsWorksiteDropdownOpen(false);
      }
      if (divisionDropdownRef.current && !divisionDropdownRef.current.contains(event.target as Node)) {
        setIsDivisionDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleWorksite = (siteId: string) => {
    setFormData(prev => {
      const exists = prev.selectedWorksiteIds.includes(siteId);
      const nextIds = exists 
        ? prev.selectedWorksiteIds.filter(id => id !== siteId)
        : [...prev.selectedWorksiteIds, siteId];

      const selectedSites = worksites.filter(s => nextIds.includes(String(s.worksiteId || s.id)));
      const nextNames = selectedSites.map(s => s.name).join(', ');
      
      let newLocation = prev.projectLocationAddress;
      if (!prev.projectLocationAddress && selectedSites.length > 0) {
        newLocation = selectedSites.map(s => s.location).filter(Boolean).join('; ');
      }

      return {
        ...prev,
        selectedWorksiteIds: nextIds,
        worksiteId: nextIds.join(', '),
        worksiteName: nextNames,
        projectLocationAddress: newLocation
      };
    });
  };

  const handleToggleDivision = (divName: string) => {
    setFormData(prev => {
      const exists = prev.selectedDivisions.includes(divName);
      const nextDivs = exists
        ? prev.selectedDivisions.filter(d => d !== divName)
        : [...prev.selectedDivisions, divName];

      return {
        ...prev,
        selectedDivisions: nextDivs,
        divisionName: nextDivs.join(', ')
      };
    });
  };

  const getBaseUrl = () => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;
  };

  // Fetch Work Orders
  const fetchWorkOrders = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${getBaseUrl()}/api/tenant/work-orders/${currentUser.uid}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch work orders', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Reference Data
  useEffect(() => {
    if (!currentUser) return;
    const host = getBaseUrl();

    fetchWorkOrders();

    // Worksites
    fetch(`${host}/api/tenant/worksites/${currentUser.uid}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setWorksites(Array.isArray(data) ? data : []))
      .catch(() => {});

    // Divisions
    fetch(`${host}/api/tenant/divisions/${currentUser.uid}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setDivisions(Array.isArray(data) ? data : []))
      .catch(() => {});

    // Team Members (for Project Head assignment popup)
    fetch(`${host}/api/tenant/team/${currentUser.uid}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setTeamMembers(Array.isArray(data) ? data : []))
      .catch(() => {});

    // Clients
    fetch(`${host}/api/tenant/accounts/clients/${currentUser.uid}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setClients(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [currentUser]);

  // Active division in the conversion modal
  const activeConversionDivision = modalDivisionName || convertingOrder?.divisionName || '';

  // Project Heads in the selected order's division
  const divisionProjectHeads = useMemo(() => {
    if (!convertingOrder) return teamMembers;
    const divName = activeConversionDivision.trim().toLowerCase();
    if (!divName) return teamMembers;

    const matchedDiv = divisions.find(d => (d.name || '').trim().toLowerCase() === divName);
    const divId = matchedDiv ? String(matchedDiv.id) : '';

    return teamMembers.filter(member => {
      const memberDivIds = Array.isArray(member.division_ids)
        ? member.division_ids.map(String)
        : (member.division_id ? [String(member.division_id)] : []);
      const memberDivName = (member.division_name || '').trim().toLowerCase();
      const inDivList = Array.isArray(member.divisions_list) && member.divisions_list.some((dl: any) => 
        (divId && String(dl.id) === divId) || (dl.name && dl.name.trim().toLowerCase() === divName)
      );

      return (divId && memberDivIds.includes(divId)) || memberDivName === divName || inDivList;
    });
  }, [teamMembers, convertingOrder, activeConversionDivision, divisions]);

  // Sort division project heads: prioritize members with 'head', 'manager', 'lead', or 'director' in role
  const sortedDivisionProjectHeads = useMemo(() => {
    return [...divisionProjectHeads].sort((a, b) => {
      const roleA = (a.role || '').toLowerCase();
      const roleB = (b.role || '').toLowerCase();
      const isHeadA = roleA.includes('head') || roleA.includes('manager') || roleA.includes('director') || roleA.includes('lead');
      const isHeadB = roleB.includes('head') || roleB.includes('manager') || roleB.includes('director') || roleB.includes('lead');
      if (isHeadA && !isHeadB) return -1;
      if (!isHeadA && isHeadB) return 1;
      return (a.name || a.full_name || '').localeCompare(b.name || b.full_name || '');
    });
  }, [divisionProjectHeads]);

  // Reset Form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      clientId: '',
      clientName: '',
      clientCode: '',
      customClientName: '',
      worksiteId: '',
      worksiteName: '',
      selectedWorksiteIds: [],
      projectLocationAddress: '',
      loadingLocation: '',
      unloadingLocation: '',
      selectedTransportModes: ['Road'],
      isLossApplicable: false,
      allowedLossPercent: 0,
      rateType: 'Per Ton',
      customRateType: '',
      ratePerUnit: 0,
      paymentTerms: 'Net 30 Days',
      customPaymentTerms: '',
      commodity: 'Coal',
      customCommodity: '',
      contractQuantity: '',
      contractQuantityUnit: 'Tons',
      customQuantityUnit: '',
      divisionName: '',
      selectedDivisions: [],
      status: 'Pending',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      estimatedCost: 0,
      notes: ''
    });
    setEditingOrder(null);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (order: WorkOrder) => {
    setEditingOrder(order);
    const standardCommodities = ['Coal', 'Iron Ore', 'Sand', 'Aggregates', 'Limestone', 'Steel', 'Cement', 'General Cargo', 'Civil Materials'];
    const isCustomCommodity = order.commodity && !standardCommodities.includes(order.commodity);

    const standardUnits = ['Tons', 'Metric Tons', 'KL (Kilo Liters)', 'CUM (Cubic Meters)', 'Pieces', 'Units', 'Hours', 'Nos'];
    const isCustomUnit = order.contractQuantityUnit && !standardUnits.includes(order.contractQuantityUnit);

    const transportModesList = order.transportModes 
      ? order.transportModes.split(',').map(m => m.trim()).filter(Boolean)
      : ['Road'];

    const standardRateTypes = ['Per Ton', 'Per Metric Ton', 'Per Trip', 'Per KM', 'Per CUM', 'Fixed / Lump Sum', 'Hourly'];
    const isCustomRateType = order.rateType && !standardRateTypes.includes(order.rateType);

    const standardPaymentTerms = ['Net 15 Days', 'Net 30 Days', 'Net 45 Days', 'Net 60 Days', '100% on Billing', '20% Advance, 80% on Delivery', '30% Advance, 70% on Completion'];
    const isCustomPaymentTerms = order.paymentTerms && !standardPaymentTerms.includes(order.paymentTerms);

    const existingWorksiteIds = order.worksiteId
      ? order.worksiteId.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    if (existingWorksiteIds.length === 0 && order.worksiteName) {
      const names = order.worksiteName.split(',').map(n => n.trim().toLowerCase());
      worksites.forEach(ws => {
        if (names.includes((ws.name || '').toLowerCase())) {
          existingWorksiteIds.push(String(ws.worksiteId || ws.id));
        }
      });
    }

    const existingDivisions = order.divisionName
      ? order.divisionName.split(',').map(d => d.trim()).filter(Boolean)
      : [];

    setFormData({
      title: order.title || '',
      description: order.description || '',
      clientId: order.clientId || '',
      clientName: order.clientName || '',
      clientCode: order.clientCode || '',
      customClientName: '',
      worksiteId: order.worksiteId || '',
      worksiteName: order.worksiteName || '',
      selectedWorksiteIds: existingWorksiteIds,
      projectLocationAddress: order.projectLocationAddress || '',
      loadingLocation: order.loadingLocation || '',
      unloadingLocation: order.unloadingLocation || '',
      selectedTransportModes: transportModesList.length > 0 ? transportModesList : ['Road'],
      isLossApplicable: Boolean(order.isLossApplicable),
      allowedLossPercent: order.allowedLossPercent !== undefined && order.allowedLossPercent !== null ? Number(order.allowedLossPercent) : 0,
      rateType: isCustomRateType ? 'Add Custom' : (order.rateType || 'Per Ton'),
      customRateType: isCustomRateType ? (order.rateType || '') : '',
      ratePerUnit: order.ratePerUnit !== undefined && order.ratePerUnit !== null ? Number(order.ratePerUnit) : 0,
      paymentTerms: isCustomPaymentTerms ? 'Custom' : (order.paymentTerms || 'Net 30 Days'),
      customPaymentTerms: isCustomPaymentTerms ? (order.paymentTerms || '') : '',
      commodity: isCustomCommodity ? 'Add New' : (order.commodity || 'Coal'),
      customCommodity: isCustomCommodity ? (order.commodity || '') : '',
      contractQuantity: order.contractQuantity || '',
      contractQuantityUnit: isCustomUnit ? 'Add New' : (order.contractQuantityUnit || 'Tons'),
      customQuantityUnit: isCustomUnit ? (order.contractQuantityUnit || '') : '',
      divisionName: order.divisionName || '',
      selectedDivisions: existingDivisions,
      status: order.status || 'Pending',
      startDate: order.startDate || '',
      endDate: order.endDate || order.dueDate || '',
      estimatedCost: order.estimatedCost || 0,
      notes: order.notes || ''
    });
    setIsCreateModalOpen(true);
  };

  // Submit Create or Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Please enter a work order title', 'error');
      return;
    }
    if (!formData.projectLocationAddress.trim()) {
      showToast('Please enter the Project Location Address', 'error');
      return;
    }
    if (!currentUser) return;

    setSaving(true);
    const host = getBaseUrl();

    const finalCommodity = formData.commodity === 'Add New' ? formData.customCommodity : formData.commodity;
    const finalUnit = formData.contractQuantityUnit === 'Add New' ? formData.customQuantityUnit : formData.contractQuantityUnit;

    const finalClientName = formData.clientName?.trim() || null;
    const finalClientCode = formData.clientCode?.trim() || null;

    const finalRateType = formData.rateType === 'Add Custom' ? formData.customRateType : formData.rateType;
    const finalPaymentTerms = formData.paymentTerms === 'Custom' ? formData.customPaymentTerms : formData.paymentTerms;

    const payload = {
      title: formData.title,
      description: formData.description,
      clientId: formData.clientId === 'Add New' ? null : (formData.clientId || null),
      clientName: finalClientName || null,
      clientCode: finalClientCode || null,
      worksiteId: formData.worksiteId,
      worksiteName: formData.worksiteName,
      projectLocationAddress: formData.projectLocationAddress,
      loadingLocation: formData.loadingLocation?.trim() || null,
      unloadingLocation: formData.unloadingLocation?.trim() || null,
      transportModes: formData.selectedTransportModes.join(', ') || 'Road',
      isLossApplicable: Boolean(formData.isLossApplicable),
      allowedLossPercent: formData.isLossApplicable ? (Number(formData.allowedLossPercent) || 0) : 0,
      rateType: finalRateType || 'Per Ton',
      ratePerUnit: Number(formData.ratePerUnit) || 0,
      paymentTerms: finalPaymentTerms || 'Net 30 Days',
      commodity: finalCommodity,
      contractQuantity: formData.contractQuantity,
      contractQuantityUnit: finalUnit,
      divisionName: formData.divisionName,
      status: formData.status,
      startDate: formData.startDate,
      endDate: formData.endDate,
      dueDate: formData.endDate,
      estimatedCost: Number(formData.estimatedCost) || 0,
      notes: formData.notes,
      firebaseUid: currentUser.uid
    };

    try {
      if (editingOrder) {
        const res = await fetch(`${host}/api/tenant/work-orders/${editingOrder.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to update work order');
        const updated = await res.json();
        setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
        showToast('Work order updated successfully', 'success');
      } else {
        const res = await fetch(`${host}/api/tenant/work-orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to create work order');
        const created = await res.json();
        setOrders(prev => [created, ...prev]);
        showToast('Work order created successfully', 'success');
      }

      setIsCreateModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error saving work order', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Quick Status Change
  const handleStatusChange = async (orderId: number | string, newStatus: string) => {
    const host = getBaseUrl();
    try {
      const res = await fetch(`${host}/api/tenant/work-orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
        if (viewingOrder && viewingOrder.id === orderId) {
          setViewingOrder(updated);
        }
      }
    } catch (err) {
      console.error('Failed to change status', err);
    }
  };

  // Open the "Convert to Project" Popup Modal
  const handleOpenProjectConversionModal = (order: WorkOrder) => {
    if (order.projectId) {
      showToast(`This work order is already converted to Project: ${order.projectId}`, 'info');
      return;
    }

    setConvertingOrder(order);
    const divName = (order.divisionName || '').trim();
    setModalDivisionName(divName);

    const matchedDiv = divisions.find(d => (d.name || '').trim().toLowerCase() === divName.toLowerCase());
    const divId = matchedDiv ? String(matchedDiv.id) : '';

    const matching = teamMembers.filter(m => {
      if (!divName) return true;
      const memberDivIds = Array.isArray(m.division_ids) ? m.division_ids.map(String) : (m.division_id ? [String(m.division_id)] : []);
      const memberDivName = (m.division_name || '').trim().toLowerCase();
      const inDivList = Array.isArray(m.divisions_list) && m.divisions_list.some((dl: any) => 
        (divId && String(dl.id) === divId) || (dl.name && dl.name.trim().toLowerCase() === divName.toLowerCase())
      );
      return (divId && memberDivIds.includes(divId)) || memberDivName === divName.toLowerCase() || inDivList;
    });

    const defaultHead = matching[0]?.name || matching[0]?.full_name || teamMembers[0]?.name || teamMembers[0]?.full_name || '';
    setSelectedProjectHead(defaultHead);
    setCustomProjectHead('');
    setProjectHeadRole('Project Head');
  };

  // Submit Project Conversion with assigned Project Head
  const handleConfirmProjectConversion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingOrder || !currentUser) return;

    const finalHead = selectedProjectHead === 'Add New' ? customProjectHead : selectedProjectHead;
    if (!finalHead.trim()) {
      showToast('Please select or specify a Project Head to assign this project.', 'error');
      return;
    }

    setConvertingLoading(true);
    const host = getBaseUrl();

    try {
      const res = await fetch(`${host}/api/tenant/work-orders/${convertingOrder.id}/convert-to-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: currentUser.uid,
          projectHeadName: finalHead,
          projectHeadRole: projectHeadRole,
          divisionName: modalDivisionName || convertingOrder.divisionName
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to convert work order to project');

      setOrders(prev => prev.map(o => o.id === data.workOrder.id ? data.workOrder : o));
      if (viewingOrder?.id === convertingOrder.id) {
        setViewingOrder(data.workOrder);
      }

      setConvertingOrder(null);
      showToast(`🎉 Project ${data.project.project_id} created & assigned to ${finalHead}!`, 'success');
    } catch (err: any) {
      console.error('Error converting work order to project:', err);
      showToast(err.message || 'Failed to convert work order to project', 'error');
    } finally {
      setConvertingLoading(false);
    }
  };

  // Trigger Delete Confirmation Modal
  const handleDelete = (orderId: number | string) => {
    setDeleteConfirmId(orderId);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    const host = getBaseUrl();
    try {
      const res = await fetch(`${host}/api/tenant/work-orders/${deleteConfirmId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setOrders(prev => prev.filter(o => o.id !== deleteConfirmId));
        if (viewingOrder?.id === deleteConfirmId) setViewingOrder(null);
        showToast('Work order deleted successfully', 'success');
      } else {
        showToast('Failed to delete work order', 'error');
      }
    } catch (err) {
      console.error('Failed to delete work order', err);
      showToast('Failed to delete work order', 'error');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery = 
          order.orderNumber.toLowerCase().includes(q) ||
          order.title.toLowerCase().includes(q) ||
          (order.clientName && order.clientName.toLowerCase().includes(q)) ||
          (order.clientCode && order.clientCode.toLowerCase().includes(q)) ||
          (order.worksiteName && order.worksiteName.toLowerCase().includes(q)) ||
          (order.projectLocationAddress && order.projectLocationAddress.toLowerCase().includes(q)) ||
          (order.commodity && order.commodity.toLowerCase().includes(q)) ||
          (order.projectId && order.projectId.toLowerCase().includes(q)) ||
          (order.assignedStaffName && order.assignedStaffName.toLowerCase().includes(q)) ||
          (order.divisionName && order.divisionName.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      if (statusFilter !== 'All') {
        const isCreated = Boolean(order.projectId) || (order.status as string) === 'Created';
        if (statusFilter === 'Created' && !isCreated) return false;
        if (statusFilter === 'Pending' && isCreated) return false;
      }

      return true;
    });
  }, [orders, searchQuery, statusFilter]);

  // Status Badge Styling: Only Created (when project exists) or Pending
  const getStatusBadge = (orderOrStatus: any) => {
    const isCreated = typeof orderOrStatus === 'object' && orderOrStatus !== null
      ? Boolean(orderOrStatus.projectId || orderOrStatus.status === 'Created')
      : orderOrStatus === 'Created';

    if (isCreated) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          <CheckCircle2 size={12} className="text-emerald-600" /> Created
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
        <Clock size={12} className="text-amber-600" /> Pending
      </span>
    );
  };

  // ── View 1: Full-Screen Create / Edit Work Order Form ────────────────────
  if (isCreateModalOpen) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200 pb-10">
        {/* Toast */}
        {toast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in duration-200">
            <div className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold text-white ${
              toast.type === 'error'
                ? 'bg-rose-600 border-rose-500 shadow-rose-600/25'
                : toast.type === 'info'
                ? 'bg-slate-900 border-slate-700 shadow-slate-900/25'
                : 'bg-[#0F172A] border-emerald-500/50 shadow-emerald-500/15'
            }`}>
              {toast.type === 'error' ? (
                <AlertCircle size={16} className="text-white shrink-0" />
              ) : toast.type === 'info' ? (
                <AlertTriangle size={16} className="text-amber-400 shrink-0" />
              ) : (
                <CheckCircle2 size={16} className="text-[#46B351] shrink-0" />
              )}
              <span className="leading-snug">{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="ml-2 text-slate-400 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Top Header Bar (Slim, Compact & Static) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs px-4 py-3 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                {editingOrder ? `Edit Work Order (${editingOrder.orderNumber})` : 'Create New Work Order'}
              </h1>
              {editingOrder && (
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {editingOrder.status}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              {saving && <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <Check size={13} className="text-[#46B351]" />
              <span>{editingOrder ? 'Update' : 'Save & Create'}</span>
            </button>
          </div>
        </div>

        {/* Full-Screen Form (Side-by-Side Compact Text Fields Inside Sections) */}
        <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto w-full">

          {/* Section 1: Basic Information */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
              <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
                <ClipboardList size={16} className="text-[#46B351]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">1. Basic Order Information</h3>
                <p className="text-[11px] text-slate-400">Order title, client assignment, and operational division</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1.5">
                  Work Order Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Coal Transport & Stacking Operations Phase 1"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#46B351]/20 focus:border-[#46B351] font-medium text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1.5">
                  Client Name or ID
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={e => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="e.g., Tata Steel / CLI-1002"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#46B351]/20 focus:border-[#46B351] font-medium text-xs text-slate-800"
                />
              </div>

              {/* Division Multi-Select */}
              <div className="relative md:col-span-2" ref={divisionDropdownRef}>
                <label className="block font-bold text-slate-700 text-xs mb-1.5 flex items-center justify-between">
                  <span>Division(s)</span>
                  {formData.selectedDivisions.length > 0 && (
                    <span className="text-[10px] text-blue-600 font-bold">
                      {formData.selectedDivisions.length} selected
                    </span>
                  )}
                </label>
                <div
                  onClick={() => setIsDivisionDropdownOpen(prev => !prev)}
                  className="min-h-[42px] w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer flex flex-wrap items-center gap-1.5 focus-within:ring-2 focus-within:ring-[#46B351]/20 focus-within:border-[#46B351]"
                >
                  {formData.selectedDivisions.length === 0 ? (
                    <span className="text-slate-400 text-xs py-1">Select Division(s)...</span>
                  ) : (
                    formData.selectedDivisions.map(divName => (
                      <span
                        key={divName}
                        className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-800 text-[11px] font-semibold px-2 py-0.5 rounded-lg shadow-2xs"
                      >
                        <Network size={10} className="text-blue-500 shrink-0" />
                        <span className="truncate max-w-[120px]">{divName}</span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleDivision(divName);
                          }}
                          className="text-slate-400 hover:text-rose-500 rounded-full cursor-pointer ml-0.5"
                        >
                          <X size={12} />
                        </span>
                      </span>
                    ))
                  )}
                  <ChevronDown size={14} className="ml-auto text-slate-400 shrink-0" />
                </div>

                {isDivisionDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-2 max-h-56 overflow-y-auto space-y-1">
                    {divisions.length === 0 ? (
                      <div className="text-xs text-slate-400 p-2 text-center">No divisions available</div>
                    ) : (
                      divisions.map(d => {
                        const isSelected = formData.selectedDivisions.includes(d.name);
                        return (
                          <div
                            key={d.id}
                            onClick={() => handleToggleDivision(d.name)}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                              isSelected ? 'bg-blue-50 text-blue-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                              }`}>
                                {isSelected && <Check size={11} />}
                              </div>
                              <span className="truncate">{d.name}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Origin, Destination & Multi-Modal Transit */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-[#46B351] flex items-center justify-center font-bold">
                  <MapPin size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">2. Origin, Destination & Transit Logistics</h3>
                  <p className="text-[11px] text-slate-400">Work sites, loading & unloading points, site address, and multi-modal transport</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                Logistics & Route
              </span>
            </div>

            <div className="space-y-4">
              {/* Origin & Destination Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1.5 flex items-center gap-1.5">
                    <MapPin size={13} className="text-blue-500" />
                    Loading Location (Origin / Start Point)
                  </label>
                  <input
                    type="text"
                    value={formData.loadingLocation}
                    onChange={e => setFormData(prev => ({ ...prev, loadingLocation: e.target.value }))}
                    placeholder="e.g. Talcher Coal Mines Siding #3, Angul, Odisha"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#46B351]/20 focus:border-[#46B351] font-medium text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1.5 flex items-center gap-1.5">
                    <MapPin size={13} className="text-rose-500" />
                    Unloading Location (Destination / End Point)
                  </label>
                  <input
                    type="text"
                    value={formData.unloadingLocation}
                    onChange={e => setFormData(prev => ({ ...prev, unloadingLocation: e.target.value }))}
                    placeholder="e.g. NTPC Thermal Power Plant Bunker #2, Ramagundam"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#46B351]/20 focus:border-[#46B351] font-medium text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Work Site Multi-Select & Project Location Address Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Work Site Multi-Select */}
                <div className="relative" ref={worksiteDropdownRef}>
                <label className="block font-bold text-slate-700 text-xs mb-1.5 flex items-center justify-between">
                  <span>Work Site(s)</span>
                  {formData.selectedWorksiteIds.length > 0 && (
                    <span className="text-[10px] text-[#46B351] font-bold">
                      {formData.selectedWorksiteIds.length} selected
                    </span>
                  )}
                </label>
                <div
                  onClick={() => setIsWorksiteDropdownOpen(prev => !prev)}
                  className="min-h-[42px] w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer flex flex-wrap items-center gap-1.5 focus-within:ring-2 focus-within:ring-[#46B351]/20 focus-within:border-[#46B351]"
                >
                  {formData.selectedWorksiteIds.length === 0 ? (
                    <span className="text-slate-400 text-xs py-1">Select Work Site(s)...</span>
                  ) : (
                    formData.selectedWorksiteIds.map(siteId => {
                      const s = worksites.find(ws => String(ws.id) === siteId || ws.worksiteId === siteId);
                      const label = s?.name || siteId;
                      return (
                        <span
                          key={siteId}
                          className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-800 text-[11px] font-semibold px-2 py-0.5 rounded-lg shadow-2xs"
                        >
                          <MapPin size={10} className="text-[#46B351] shrink-0" />
                          <span className="truncate max-w-[140px]">{label}</span>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleWorksite(siteId);
                            }}
                            className="text-slate-400 hover:text-rose-500 rounded-full cursor-pointer ml-0.5"
                          >
                            <X size={12} />
                          </span>
                        </span>
                      );
                    })
                  )}
                  <ChevronDown size={14} className="ml-auto text-slate-400 shrink-0" />
                </div>

                {isWorksiteDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-2 max-h-56 overflow-y-auto space-y-1">
                    {worksites.length === 0 ? (
                      <div className="text-xs text-slate-400 p-2 text-center">No worksites available</div>
                    ) : (
                      worksites.map(site => {
                        const siteId = String(site.worksiteId || site.id);
                        const isSelected = formData.selectedWorksiteIds.includes(siteId);
                        return (
                          <div
                            key={site.id}
                            onClick={() => handleToggleWorksite(siteId)}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                              isSelected ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-[#46B351] border-[#46B351] text-white' : 'border-slate-300 bg-white'
                              }`}>
                                {isSelected && <Check size={11} />}
                              </div>
                              <span className="truncate">{site.name}</span>
                              {site.location && (
                                <span className="text-[10px] text-slate-400 truncate">({site.location})</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1.5">
                  Project Location Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.projectLocationAddress}
                  onChange={e => setFormData(prev => ({ ...prev, projectLocationAddress: e.target.value }))}
                  placeholder="e.g., North Expressway Sector 4, Terminal Dock A"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-medium text-xs text-slate-800"
                />
              </div>
              </div>

              {/* Mode(s) of Transport */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-bold text-slate-700 text-xs">
                    Mode(s) of Transport <span className="text-slate-400 font-normal">(Select all that apply for multi-modal transit)</span>
                  </label>
                  <span className="text-xs text-emerald-600 font-bold">
                    {formData.selectedTransportModes.join(', ') || 'Select mode'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'Road', label: 'Road Transit', sub: 'Trucks / Trailers', icon: Truck },
                    { id: 'Rail', label: 'Rail Transit', sub: 'Rakes / Freight Trains', icon: Train },
                    { id: 'Ship', label: 'Ship / Water', sub: 'Barges / Coastal Vessel', icon: Ship },
                    { id: 'Air', label: 'Air Cargo', sub: 'Airfreight Charter', icon: Plane }
                  ].map(({ id, label, sub, icon: ModeIcon }) => {
                    const isSelected = formData.selectedTransportModes.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleToggleTransportMode(id)}
                        className={`p-3 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'bg-emerald-50/80 border-[#46B351] text-emerald-950 font-bold shadow-xs ring-2 ring-[#46B351]/20'
                            : 'bg-slate-50 border-slate-200 text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-800'
                        }`}
                      >
                        <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-[#46B351] text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-500'}`}>
                          <ModeIcon size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{label}</p>
                          <p className="text-[10px] text-slate-400 truncate">{sub}</p>
                        </div>
                        {isSelected && <Check size={14} className="ml-auto text-[#46B351] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Commercial Terms & Valuation */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <IndianRupee size={16} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">3. Commercial Terms & Valuation</h3>
                <p className="text-[11px] text-slate-400">Rate / Unit, contract quantity, estimated budget, and payment terms</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Rate Type */}
              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1.5">Rate Type</label>
                <select
                  value={formData.rateType}
                  onChange={e => setFormData(prev => ({ ...prev, rateType: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-semibold text-xs text-slate-800"
                >
                  <option>Per Ton</option>
                  <option>Per Metric Ton</option>
                  <option>Per Trip</option>
                  <option>Per KM</option>
                  <option>Per CUM</option>
                  <option>Fixed / Lump Sum</option>
                  <option>Hourly</option>
                  <option value="Add Custom">Custom Rate Type...</option>
                </select>
              </div>

              {/* Rate / Unit (₹) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-slate-700 text-xs">Rate / Unit (₹)</label>
                  <span className="text-[10px] text-slate-400">Base billing rate</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.ratePerUnit || ''}
                    onChange={e => handleRatePerUnitChange(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 pl-8 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-black text-sm text-slate-900"
                  />
                  <IndianRupee size={13} className="absolute left-2.5 top-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {formData.rateType === 'Add Custom' && (
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 text-xs mb-1.5">Specify Custom Rate Type</label>
                  <input
                    type="text"
                    value={formData.customRateType}
                    onChange={e => setFormData(prev => ({ ...prev, customRateType: e.target.value }))}
                    placeholder="e.g. Per Container / Per Bag"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs font-medium"
                  />
                </div>
              )}

              {/* Commodity */}
              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1.5">Commodity</label>
                <select
                  value={formData.commodity}
                  onChange={e => setFormData(prev => ({ ...prev, commodity: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-medium text-xs text-slate-800"
                >
                  <option>Coal</option>
                  <option>Iron Ore</option>
                  <option>Sand</option>
                  <option>Aggregates</option>
                  <option>Limestone</option>
                  <option>Steel</option>
                  <option>Cement</option>
                  <option>General Cargo</option>
                  <option>Civil Materials</option>
                  <option value="Add New">Add Custom...</option>
                </select>
              </div>

              {/* Quantity Unit of Measurement */}
              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1.5">Quantity Unit of Measurement</label>
                <select
                  value={formData.contractQuantityUnit}
                  onChange={e => setFormData(prev => ({ ...prev, contractQuantityUnit: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-medium text-xs text-slate-800"
                >
                  <option>Tons</option>
                  <option>Metric Tons</option>
                  <option>KL (Kilo Liters)</option>
                  <option>CUM (Cubic Meters)</option>
                  <option>Pieces</option>
                  <option>Units</option>
                  <option>Hours</option>
                  <option>Nos</option>
                  <option value="Add New">Add Custom...</option>
                </select>
              </div>

              {/* Custom Commodity / Unit if selected */}
              {formData.commodity === 'Add New' && (
                <div>
                  <label className="block font-bold text-amber-900 text-xs mb-1.5">Custom Commodity Name</label>
                  <input
                    type="text"
                    required
                    value={formData.customCommodity}
                    onChange={e => setFormData(prev => ({ ...prev, customCommodity: e.target.value }))}
                    placeholder="e.g. Bauxite"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-amber-50/50 border border-amber-300 text-xs font-medium"
                  />
                </div>
              )}

              {formData.contractQuantityUnit === 'Add New' && (
                <div>
                  <label className="block font-bold text-amber-900 text-xs mb-1.5">Custom Unit</label>
                  <input
                    type="text"
                    required
                    value={formData.customQuantityUnit}
                    onChange={e => setFormData(prev => ({ ...prev, customQuantityUnit: e.target.value }))}
                    placeholder="e.g. Truckloads"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-amber-50/50 border border-amber-300 text-xs font-medium"
                  />
                </div>
              )}

              {/* Contract Quantity */}
              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1.5">Contract Quantity</label>
                <input
                  type="text"
                  value={formData.contractQuantity}
                  onChange={e => handleContractQuantityChange(e.target.value)}
                  placeholder="e.g. 50,000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-semibold text-xs text-slate-800"
                />
              </div>

              {/* Estimated Budget with auto-calculation */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-slate-700 text-xs">Estimated Budget (₹)</label>
                  {Number(formData.ratePerUnit) > 0 && parseFloat(formData.contractQuantity.replace(/,/g, '')) > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const qty = parseFloat(formData.contractQuantity.replace(/,/g, '')) || 0;
                        const rate = Number(formData.ratePerUnit) || 0;
                        setFormData(prev => ({ ...prev, estimatedCost: Math.round(qty * rate) }));
                      }}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Calculator size={11} />
                      Auto: ₹{(parseFloat(formData.contractQuantity.replace(/,/g, '')) * Number(formData.ratePerUnit)).toLocaleString()}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.estimatedCost || ''}
                    onChange={e => setFormData(prev => ({ ...prev, estimatedCost: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 pl-8 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-black text-sm text-slate-900"
                  />
                  <IndianRupee size={13} className="absolute left-2.5 top-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Payment Terms */}
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 text-xs mb-1.5">Payment Terms</label>
                <select
                  value={formData.paymentTerms}
                  onChange={e => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-semibold text-xs text-slate-800"
                >
                  <option>Net 15 Days</option>
                  <option>Net 30 Days</option>
                  <option>Net 45 Days</option>
                  <option>Net 60 Days</option>
                  <option>100% on Billing</option>
                  <option>20% Advance, 80% on Delivery</option>
                  <option>30% Advance, 70% on Completion</option>
                  <option value="Custom">Custom Terms...</option>
                </select>
              </div>

              {formData.paymentTerms === 'Custom' && (
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 text-xs mb-1.5">Custom Terms Details</label>
                  <input
                    type="text"
                    value={formData.customPaymentTerms}
                    onChange={e => setFormData(prev => ({ ...prev, customPaymentTerms: e.target.value }))}
                    placeholder="e.g. 50% mobilization advance, balance weekly RA bills"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs font-medium"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Permitted Loss & Variance */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
              <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Scale size={16} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">4. Loss & Variance Allowance</h3>
                <p className="text-[11px] text-slate-400">Acceptable transit shrinkage or material loss tolerance</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Circular Radio Buttons: Yes or No */}
              <div>
                <label className="block font-bold text-slate-700 text-xs mb-2.5">
                  Loss Applicable?
                </label>
                <div className="flex items-center gap-6 pt-1">
                  {/* Yes Option with Circular Button */}
                  <label
                    onClick={() => setFormData(prev => ({ ...prev, isLossApplicable: true, allowedLossPercent: prev.allowedLossPercent || 0.5 }))}
                    className="flex items-center gap-2.5 cursor-pointer select-none group"
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      formData.isLossApplicable 
                        ? 'border-[#46B351] bg-[#46B351]' 
                        : 'border-slate-300 bg-white group-hover:border-slate-400'
                    }`}>
                      {formData.isLossApplicable && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <span className={`text-xs font-bold ${formData.isLossApplicable ? 'text-slate-900' : 'text-slate-600'}`}>
                      Yes
                    </span>
                  </label>

                  {/* No Option with Circular Button */}
                  <label
                    onClick={() => setFormData(prev => ({ ...prev, isLossApplicable: false, allowedLossPercent: 0 }))}
                    className="flex items-center gap-2.5 cursor-pointer select-none group"
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      !formData.isLossApplicable 
                        ? 'border-[#46B351] bg-[#46B351]' 
                        : 'border-slate-300 bg-white group-hover:border-slate-400'
                    }`}>
                      {!formData.isLossApplicable && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <span className={`text-xs font-bold ${!formData.isLossApplicable ? 'text-slate-900' : 'text-slate-600'}`}>
                      No
                    </span>
                  </label>
                </div>
              </div>

              {/* Allowed Loss % Side by Side */}
              {formData.isLossApplicable ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700 text-xs">Allowed Loss %</label>
                    <span className="text-[10px] text-amber-700 font-semibold">Shrinkage threshold</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.05"
                      value={formData.allowedLossPercent || ''}
                      onChange={e => setFormData(prev => ({ ...prev, allowedLossPercent: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.50"
                      className="w-full px-3.5 py-2.5 pr-8 rounded-xl bg-amber-50/50 border border-amber-300 focus:outline-none font-bold text-xs text-amber-900"
                    />
                    <Percent size={13} className="absolute right-3 top-3 text-amber-500 pointer-events-none" />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {[0.25, 0.50, 1.0, 1.5, 2.0].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, allowedLossPercent: pct }))}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                          formData.allowedLossPercent === pct
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-amber-50'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500">
                  Zero loss tolerance: 100% of material must be delivered without shrinkage allowance.
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Scope of Work & Guidelines */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <FileText size={16} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">5. Scope of Work & Safety Guidelines</h3>
                <p className="text-[11px] text-slate-400">Detailed operational instructions, deliverables, and compliance directives</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1.5">Scope of Work & Objectives</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Outline operational procedures, deliverables, loading handling protocols, machinery and manpower deployed..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-medium text-xs text-slate-800 leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1.5 flex items-center gap-1.5 text-amber-900">
                  <AlertTriangle size={13} className="text-amber-600" />
                  Safety & Compliance Protocol Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="e.g. Mandatory PPE at siding, tare weight calibration every 10 trips, lock-out tag-out on plant delivery point..."
                  className="w-full px-4 py-2.5 rounded-xl bg-amber-50/40 border border-amber-200 focus:outline-none focus:border-amber-400 font-medium text-xs text-amber-950 leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Project Timeline */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
              <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <Calendar size={16} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">6. Project Timeline</h3>
                <p className="text-[11px] text-slate-400">Target start and completion dates</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-medium text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1.5">End Date / Due Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-medium text-xs text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Form Actions (Directly in-page, completely non-floating) */}
          <div className="pt-2 pb-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer active:scale-98"
            >
              {saving && <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <Check size={14} className="text-[#46B351]" />
              <span>{editingOrder ? 'Update Work Order' : 'Save & Create Work Order'}</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── View 2: Full-Screen Work Order Dossier View ───────────────────────────
  if (viewingOrder) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200 pb-20">
        {/* Toast */}
        {toast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in duration-200">
            <div className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold text-white ${
              toast.type === 'error'
                ? 'bg-rose-600 border-rose-500 shadow-rose-600/25'
                : toast.type === 'info'
                ? 'bg-slate-900 border-slate-700 shadow-slate-900/25'
                : 'bg-[#0F172A] border-emerald-500/50 shadow-emerald-500/15'
            }`}>
              {toast.type === 'error' ? (
                <AlertCircle size={16} className="text-white shrink-0" />
              ) : toast.type === 'info' ? (
                <AlertTriangle size={16} className="text-amber-400 shrink-0" />
              ) : (
                <CheckCircle2 size={16} className="text-[#46B351] shrink-0" />
              )}
              <span className="leading-snug">{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="ml-2 text-slate-400 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Top Header Bar (Slim & Compact) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs px-4 py-3 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setViewingOrder(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                {viewingOrder.orderNumber}
              </span>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate max-w-sm sm:max-w-md">
                {viewingOrder.title}
              </h1>
              {getStatusBadge(viewingOrder)}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {viewingOrder.projectId ? (
              <Link
                to={`/tenant/project-management/${viewingOrder.projectId}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Briefcase size={13} /> Project ({viewingOrder.projectId})
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const toConvert = viewingOrder;
                  handleOpenProjectConversionModal(toConvert);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#0F172A] hover:bg-slate-800 px-3.5 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer"
              >
                <FolderPlus size={13} className="text-[#46B351]" /> Create Project
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                const toEdit = viewingOrder;
                setViewingOrder(null);
                handleOpenEdit(toEdit);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Edit2 size={12} className="text-[#46B351]" /> Edit
            </button>
          </div>
        </div>

        {/* Dossier Body Layout (One by One Below - Balanced Width) */}
        <div className="space-y-6 max-w-5xl mx-auto w-full">
          
          {/* Section 1: Transit Route & Logistics Banner */}
          {(viewingOrder.loadingLocation || viewingOrder.unloadingLocation || viewingOrder.transportModes) && (
            <div className="bg-gradient-to-r from-blue-50/80 via-white to-slate-50 p-6 rounded-3xl border border-blue-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-black tracking-wider text-blue-900 flex items-center gap-2">
                  <MapPin size={16} className="text-blue-600" />
                  Multi-Modal Transit Route & Logistics
                </span>
                {viewingOrder.transportModes && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {viewingOrder.transportModes.split(',').map(m => m.trim()).filter(Boolean).map(mode => (
                      <span key={mode} className="inline-flex items-center gap-1 text-xs font-bold bg-white text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        {mode.toLowerCase().includes('rail') ? <Train size={13} className="text-amber-600" /> :
                         mode.toLowerCase().includes('ship') ? <Ship size={13} className="text-blue-600" /> :
                         mode.toLowerCase().includes('air') ? <Plane size={13} className="text-indigo-600" /> :
                         <Truck size={13} className="text-emerald-600" />}
                        {mode}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Origin & Destination stacked one by one below */}
              <div className="space-y-3 pt-2">
                <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-2xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1.5">
                    <MapPin size={12} className="text-blue-500" /> Origin (Loading Location)
                  </span>
                  <p className="font-bold text-slate-800 text-sm">{viewingOrder.loadingLocation || 'Standard Depot / Siding'}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-2xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1.5">
                    <MapPin size={12} className="text-rose-500" /> Destination (Unloading Location)
                  </span>
                  <p className="font-bold text-slate-800 text-sm">{viewingOrder.unloadingLocation || 'Client Worksite'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Commercial Terms & Valuation */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <IndianRupee size={16} className="text-blue-600" /> Commercial & Billing Terms
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-slate-500 font-medium">Rate / Unit</span>
                <span className="font-bold text-slate-800">
                  {Number(viewingOrder.ratePerUnit) > 0 ? `₹${Number(viewingOrder.ratePerUnit).toLocaleString()}` : '—'}
                  <span className="text-slate-400 font-normal ml-1">({viewingOrder.rateType || 'Per Ton'})</span>
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-slate-500 font-medium">Estimated Budget</span>
                <span className="font-black text-slate-900 text-sm">
                  ₹{Number(viewingOrder.estimatedCost || 0).toLocaleString()}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-slate-500 font-medium">Commodity & Quantity</span>
                <span className="font-bold text-slate-800">
                  {viewingOrder.commodity || 'General Cargo'} — {Number(viewingOrder.contractQuantity || 0).toLocaleString()} {viewingOrder.contractQuantityUnit || 'Units'}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-slate-500 font-medium">Payment Terms</span>
                <span className="font-bold text-slate-800">{viewingOrder.paymentTerms || 'Net 30 Days'}</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl flex items-center justify-between">
                <span className="text-slate-500 font-medium">Permitted Loss</span>
                <span className={`font-bold ${viewingOrder.isLossApplicable ? 'text-amber-700' : 'text-slate-700'}`}>
                  {viewingOrder.isLossApplicable ? `${viewingOrder.allowedLossPercent || 0}% Allowed` : 'Zero Loss Allowed'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Project Assignment & Site */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Building2 size={16} className="text-indigo-600" /> Project Assignment & Site
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Client Name / Code</span>
                <span className="font-bold text-slate-800">{viewingOrder.clientName || 'Unassigned'} {viewingOrder.clientCode ? `(${viewingOrder.clientCode})` : ''}</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Work Site & Address</span>
                <span className="font-bold text-slate-800 block">{viewingOrder.worksiteName || 'Unassigned Worksite'}</span>
                {viewingOrder.projectLocationAddress && (
                  <span className="text-slate-500 text-[11px] block mt-0.5">{viewingOrder.projectLocationAddress}</span>
                )}
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Operational Division</span>
                <span className="font-bold text-slate-800">{viewingOrder.divisionName || 'None'}</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Timeline</span>
                <span className="font-bold text-slate-800">
                  {viewingOrder.startDate ? new Date(viewingOrder.startDate).toLocaleDateString() : 'Start'}
                  {' → '}
                  {(viewingOrder.endDate || viewingOrder.dueDate) ? new Date(viewingOrder.endDate || viewingOrder.dueDate).toLocaleDateString() : 'End'}
                </span>
              </div>

              {/* Quick Status Updater */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block font-bold text-slate-700 mb-1 text-[11px] uppercase tracking-wider">
                  Update Execution Status
                </label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {['In Progress', 'Completed', 'On Hold'].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(viewingOrder.id, st)}
                      className={`py-1.5 px-2 rounded-xl font-bold text-xs transition-all border cursor-pointer ${
                        viewingOrder.status === st
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Scope of Work */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-3">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Scope of Work & Objectives</h3>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-medium text-slate-700 leading-relaxed">
              {viewingOrder.description || 'No detailed scope description provided.'}
            </div>
          </div>

          {/* Section 5: Safety & Compliance Directives */}
          {viewingOrder.notes && (
            <div className="bg-white rounded-3xl border border-amber-200/80 shadow-sm p-6 sm:p-7 space-y-3">
              <h3 className="font-bold text-sm text-amber-950 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600" /> Safety & Compliance Protocol
              </h3>
              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 text-xs font-semibold text-amber-950 leading-relaxed">
                {viewingOrder.notes}
              </div>
            </div>
          )}
        </div>

        {/* Modal for project conversion from Dossier */}
        {convertingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-[#46B351] text-white flex items-center justify-center font-bold">
                    <FolderPlus size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Assign Project Head & Create Project</h3>
                    <p className="text-[11px] text-slate-400">
                      Order: <span className="text-emerald-400 font-mono font-bold">{convertingOrder.orderNumber}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setConvertingOrder(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleConfirmProjectConversion} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[80vh]">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 space-y-2">
                  <div className="font-bold text-slate-800 text-sm">{convertingOrder.title}</div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
                    <div>
                      <span className="text-slate-400">Work Site:</span>{' '}
                      <span className="font-semibold text-slate-700">{convertingOrder.worksiteName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Commodity:</span>{' '}
                      <span className="font-semibold text-slate-700">{convertingOrder.commodity || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Contract Qty:</span>{' '}
                      <span className="font-semibold text-slate-700">
                        {convertingOrder.contractQuantity ? `${Number(convertingOrder.contractQuantity).toLocaleString()} ${convertingOrder.contractQuantityUnit || 'Units'}` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Estimated Budget:</span>{' '}
                      <span className="font-semibold text-slate-700">₹{Number(convertingOrder.estimatedCost || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Assigned Division
                  </label>
                  <select
                    value={modalDivisionName}
                    onChange={e => setModalDivisionName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 text-xs"
                  >
                    <option value="">Select Division (Optional)</option>
                    {divisions.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Project Head <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedProjectHead}
                    onChange={e => setSelectedProjectHead(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 text-xs"
                  >
                    <option value="">-- Select Project Head / Manager --</option>
                    {sortedDivisionProjectHeads.map((m: any) => {
                      const name = m.name || m.full_name;
                      return (
                        <option key={m.id} value={name}>
                          {name} — ({m.role || m.sub_role || 'Staff'})
                        </option>
                      );
                    })}
                    <option value="Add New">Add New / Custom Lead Name...</option>
                  </select>
                </div>

                {selectedProjectHead === 'Add New' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Enter Project Head Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customProjectHead}
                      onChange={e => setCustomProjectHead(e.target.value)}
                      placeholder="e.g., Rajesh Sharma"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Project Head Role / Title</label>
                  <select
                    value={projectHeadRole}
                    onChange={e => setProjectHeadRole(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-700"
                  >
                    <option value="Project Head">Project Head</option>
                    <option value="Project Director">Project Director</option>
                    <option value="Site Project Manager">Site Project Manager</option>
                    <option value="Operations Lead">Operations Lead</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setConvertingOrder(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={convertingLoading}
                    className="px-5 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold tracking-wide shadow-sm transition-all flex items-center gap-2"
                  >
                    {convertingLoading ? (
                      <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FolderPlus size={14} className="text-[#46B351]" />
                    )}
                    Confirm &amp; Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── View 3: Work Orders Management & Table List View ─────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
              <ClipboardList size={22} className="text-[#46B351]" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Work Orders</h1>
              <p className="text-xs text-slate-500 font-medium">Create work orders, assign division & worksites, and convert to projects with division project heads</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-sm transition-all hover:shadow-md active:scale-98"
        >
          <Plus size={16} className="text-[#46B351]" />
          Create Work Order
        </button>
      </div>


      {/* ── Toolbar & Filters ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search order #, title, site, commodity..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#46B351]/20 focus:border-[#46B351] transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 text-xs font-semibold">
            {['All', 'Pending', 'Created'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Table / List Section ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#46B351]" />
            <p className="mt-3 text-xs text-slate-500 font-semibold">Loading work orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="h-14 w-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <ClipboardList size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800">No work orders found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {searchQuery || statusFilter !== 'All'
                ? 'Try adjusting your filters or search keywords.'
                : 'Click "Create Work Order" to schedule your first operational order.'}
            </p>
            {!searchQuery && statusFilter === 'All' && (
              <button
                onClick={handleOpenCreate}
                className="mt-4 inline-flex items-center gap-2 bg-[#0F172A] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:bg-slate-800 transition-colors"
              >
                <Plus size={14} className="text-[#46B351]" /> Create First Order
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Title & Scope</th>
                  <th className="py-3 px-4">Client Name / ID</th>
                  <th className="py-3 px-4">Work Site / Location</th>
                  <th className="py-3 px-4">Division</th>
                  <th className="py-3 px-4">Commodity & Quantity</th>
                  <th className="py-3 px-4">Estimated Budget (₹)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Duration (Start → End)</th>
                  <th className="py-3 px-4 text-center">Project Action</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Order # */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => setViewingOrder(order)}
                        className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                      >
                        {order.orderNumber}
                      </button>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
                      </div>
                    </td>

                    {/* Title & Scope */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-800 truncate text-[13px]">{order.title}</div>
                      {order.description && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{order.description}</p>
                      )}
                    </td>

                    {/* Client Name / ID */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {order.clientName ? (
                        <div>
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Building2 size={12} className="text-[#46B351] shrink-0" />
                            <span className="truncate max-w-[140px]">{order.clientName}</span>
                          </div>
                          {order.clientCode && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {order.clientCode}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Worksite & Location / Route */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <MapPin size={12} className="text-[#46B351] shrink-0" />
                        <span className="truncate max-w-[200px]" title={order.worksiteName || undefined}>
                          {order.worksiteName || 'Unassigned Site'}
                        </span>
                      </div>
                      {(order.loadingLocation || order.unloadingLocation) ? (
                        <div className="flex items-center gap-1 text-[10px] text-blue-700 font-semibold bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 mt-1 max-w-[210px] truncate" title={`${order.loadingLocation || 'Origin'} ➔ ${order.unloadingLocation || 'Destination'}`}>
                          <span className="truncate max-w-[90px]">{order.loadingLocation || 'Origin'}</span>
                          <ArrowRight size={10} className="shrink-0 text-blue-500" />
                          <span className="truncate max-w-[90px]">{order.unloadingLocation || 'Destination'}</span>
                        </div>
                      ) : order.projectLocationAddress ? (
                        <div className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5" title={order.projectLocationAddress}>
                          {order.projectLocationAddress}
                        </div>
                      ) : null}
                      {order.transportModes && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {order.transportModes.split(',').map(m => m.trim()).filter(Boolean).map(m => (
                            <span key={m} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium border border-slate-200/60">
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Division */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {order.divisionName ? (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {order.divisionName.split(',').map(d => d.trim()).filter(Boolean).map(d => (
                            <span key={d} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              <Network size={10} className="text-slate-500 shrink-0" />
                              <span className="truncate max-w-[120px]">{d}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No division</span>
                      )}
                    </td>

                    {/* Commodity & Quantity */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-800 flex items-center gap-1">
                        <Package size={12} className="text-amber-500 shrink-0" />
                        <span>{order.commodity || 'N/A'}</span>
                      </div>
                      {order.contractQuantity && (
                        <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                          {Number(order.contractQuantity).toLocaleString()} {order.contractQuantityUnit || 'Units'}
                        </div>
                      )}
                    </td>

                    {/* Estimated Budget & Commercial */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-800">
                        ₹{Number(order.estimatedCost || 0).toLocaleString()}
                      </span>
                      {Number(order.ratePerUnit) > 0 && (
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                          ₹{Number(order.ratePerUnit).toLocaleString()} / {order.rateType || 'Ton'}
                        </div>
                      )}
                      {order.isLossApplicable && (
                        <div className="text-[9px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.2 rounded w-fit mt-0.5 border border-amber-200/60">
                          Loss: {order.allowedLossPercent || 0}%
                        </div>
                      )}
                    </td>

                    {/* Status Badge: Created if project exists, else Pending */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(order)}
                    </td>

                    {/* Duration: Start -> End */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Calendar size={12} className="text-slate-400 shrink-0" />
                        <span>
                          {order.startDate ? new Date(order.startDate).toLocaleDateString() : 'Start'}
                          {' → '}
                          {(order.endDate || order.dueDate) ? new Date(order.endDate || order.dueDate!).toLocaleDateString() : 'End'}
                        </span>
                      </div>
                    </td>

                    {/* Project Action: Direct Create Project Button or Converted Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
                      {order.projectId ? (
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <Link
                            to={`/tenant/project-management/${order.projectId}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80 hover:bg-blue-100 transition-colors"
                            title="View project details"
                          >
                            <Briefcase size={12} className="text-blue-600" />
                            <span>{order.projectId}</span>
                          </Link>
                          {order.assignedStaffName && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              Head: {order.assignedStaffName}
                            </span>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenProjectConversionModal(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0F172A] text-white hover:bg-slate-800 shadow-sm active:scale-95 transition-all"
                          title="Open popup to assign Project Head in division and create project"
                        >
                          <FolderPlus size={13} className="text-[#46B351]" />
                          Create Project
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setViewingOrder(order)}
                          title="View Details"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(order)}
                          title="Edit Order"
                          className="p-1.5 text-slate-400 hover:text-[#46B351] hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          title="Delete Order"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
        )}
      </div>

      {/* ── Convert to Project Popup Modal (Assign to Person in Division) ──── */}
      {convertingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#46B351] text-white flex items-center justify-center font-bold">
                  <FolderPlus size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Assign Project Head & Create Project</h3>
                  <p className="text-[11px] text-slate-400">
                    Order: <span className="text-emerald-400 font-mono font-bold">{convertingOrder.orderNumber}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConvertingOrder(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmProjectConversion} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[80vh]">
              {/* Context Information Box */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 space-y-2">
                <div className="font-bold text-slate-800 text-sm">{convertingOrder.title}</div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
                  <div>
                    <span className="text-slate-400">Work Site:</span>{' '}
                    <span className="font-semibold text-slate-700">{convertingOrder.worksiteName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Commodity:</span>{' '}
                    <span className="font-semibold text-slate-700">{convertingOrder.commodity || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Contract Qty:</span>{' '}
                    <span className="font-semibold text-slate-700">
                      {convertingOrder.contractQuantity ? `${Number(convertingOrder.contractQuantity).toLocaleString()} ${convertingOrder.contractQuantityUnit || 'Units'}` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Estimated Budget:</span>{' '}
                    <span className="font-semibold text-slate-700">₹{Number(convertingOrder.estimatedCost || 0).toLocaleString()}</span>
                  </div>
                  {convertingOrder.clientName && (
                    <div className="col-span-2 pt-1 border-t border-slate-200/60 mt-0.5">
                      <span className="text-slate-400">Client Name / ID:</span>{' '}
                      <span className="font-semibold text-slate-700">
                        {convertingOrder.clientName} {convertingOrder.clientCode ? `(${convertingOrder.clientCode})` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Division Selector / Confirmation */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Assigned Division <span className="text-[#46B351] font-normal">(Staff will be filtered for this division)</span>
                </label>
                <select
                  value={modalDivisionName}
                  onChange={e => {
                    const newDiv = e.target.value;
                    setModalDivisionName(newDiv);
                    const matchedDiv = divisions.find(d => (d.name || '').trim().toLowerCase() === newDiv.trim().toLowerCase());
                    const divId = matchedDiv ? String(matchedDiv.id) : '';
                    const matching = teamMembers.filter(m => {
                      if (!newDiv) return true;
                      const memberDivIds = Array.isArray(m.division_ids) ? m.division_ids.map(String) : (m.division_id ? [String(m.division_id)] : []);
                      const memberDivName = (m.division_name || '').trim().toLowerCase();
                      const inDivList = Array.isArray(m.divisions_list) && m.divisions_list.some((dl: any) => 
                        (divId && String(dl.id) === divId) || (dl.name && dl.name.trim().toLowerCase() === newDiv.trim().toLowerCase())
                      );
                      return (divId && memberDivIds.includes(divId)) || memberDivName === newDiv.trim().toLowerCase() || inDivList;
                    });
                    if (matching.length > 0) {
                      setSelectedProjectHead(matching[0].name || matching[0].full_name);
                    }
                  }}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#46B351]/20 focus:border-[#46B351] font-semibold text-slate-800 text-xs"
                >
                  <option value="">Select Division (Optional)</option>
                  {divisions.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Project Head Assignment Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700">
                    Project Head {activeConversionDivision ? (
                      <span>(Division: <span className="text-[#46B351]">{activeConversionDivision}</span>)</span>
                    ) : (
                      <span>(All Divisions)</span>
                    )} <span className="text-rose-500">*</span>
                  </label>
                  {sortedDivisionProjectHeads.length > 0 && (
                    <span className="text-[10px] font-semibold text-slate-400">
                      {sortedDivisionProjectHeads.length} member{sortedDivisionProjectHeads.length > 1 ? 's' : ''} in division
                    </span>
                  )}
                </div>

                {/* Quick Selection Cards for Project Heads in Division */}
                {sortedDivisionProjectHeads.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Division Project Heads &amp; Staff:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {sortedDivisionProjectHeads.map((m: any) => {
                        const name = m.name || m.full_name;
                        const isSelected = selectedProjectHead === name;
                        const role = m.role || m.sub_role || 'Staff';
                        const isHeadRole = role.toLowerCase().includes('head') || role.toLowerCase().includes('manager') || role.toLowerCase().includes('lead') || role.toLowerCase().includes('director');

                        return (
                          <div
                            key={m.id}
                            onClick={() => {
                              setSelectedProjectHead(name);
                              if (role.toLowerCase().includes('director')) setProjectHeadRole('Project Director');
                              else if (role.toLowerCase().includes('manager')) setProjectHeadRole('Site Project Manager');
                              else if (role.toLowerCase().includes('operations')) setProjectHeadRole('Operations Lead');
                              else setProjectHeadRole('Project Head');
                            }}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-emerald-50/70 border-[#46B351] ring-2 ring-[#46B351]/20 shadow-xs'
                                : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                isSelected ? 'bg-[#46B351] text-white' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 text-xs truncate">{name}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold truncate ${
                                    isHeadRole ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                                  }`}>
                                    {role}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="h-4 w-4 rounded-full bg-[#46B351] text-white flex items-center justify-center shrink-0">
                                <CheckCircle2 size={12} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : activeConversionDivision ? (
                  <div className="p-3 bg-amber-50 border border-amber-200/70 rounded-xl text-amber-800 flex items-start gap-2 text-[11px]">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-600" />
                    <div>
                      <p className="font-bold">No staff assigned to division "{activeConversionDivision}"</p>
                      <p className="text-amber-700 text-[10px] mt-0.5">
                        You can select from other team members below or enter a custom Project Head name.
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* Dropdown Selector for All Options (Division heads, other members, Add New) */}
                <div className="pt-1">
                  <select
                    value={selectedProjectHead}
                    onChange={e => setSelectedProjectHead(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#46B351]/20 focus:border-[#46B351] font-bold text-slate-800 text-xs"
                  >
                    <option value="">-- Select Project Head / Manager --</option>

                    {/* Division-specific members */}
                    {sortedDivisionProjectHeads.length > 0 && (
                      <optgroup label={`Division: ${activeConversionDivision || 'Active Division'}`}>
                        {sortedDivisionProjectHeads.map((m: any) => {
                          const name = m.name || m.full_name;
                          return (
                            <option key={m.id} value={name}>
                              {name} — ({m.role || m.sub_role || 'Staff'})
                            </option>
                          );
                        })}
                      </optgroup>
                    )}

                    {/* Other company members */}
                    {teamMembers.filter(m => !sortedDivisionProjectHeads.some(d => d.id === m.id)).length > 0 && (
                      <optgroup label="Other Organization Staff">
                        {teamMembers.filter(m => !sortedDivisionProjectHeads.some(d => d.id === m.id)).map((m: any) => {
                          const name = m.name || m.full_name;
                          return (
                            <option key={m.id} value={name}>
                              {name} — ({m.role || m.department || 'Staff'})
                            </option>
                          );
                        })}
                      </optgroup>
                    )}

                    <option value="Add New">Add New / Custom Lead Name...</option>
                  </select>
                </div>
              </div>

              {/* Custom Project Head Input if "Add New" */}
              {selectedProjectHead === 'Add New' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Enter Project Head Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customProjectHead}
                    onChange={e => setCustomProjectHead(e.target.value)}
                    placeholder="e.g., Rajesh Sharma"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-semibold text-slate-800"
                  />
                </div>
              )}

              {/* Project Head Designation/Role */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Project Head Role / Title</label>
                <select
                  value={projectHeadRole}
                  onChange={e => setProjectHeadRole(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#46B351] font-semibold text-slate-700"
                >
                  <option value="Project Head">Project Head</option>
                  <option value="Project Director">Project Director</option>
                  <option value="Site Project Manager">Site Project Manager</option>
                  <option value="Operations Lead">Operations Lead</option>
                  <option value="Senior Engineering Lead">Senior Engineering Lead</option>
                </select>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setConvertingOrder(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={convertingLoading}
                  className="px-5 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold tracking-wide shadow-sm transition-all flex items-center gap-2"
                >
                  {convertingLoading ? (
                    <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FolderPlus size={14} className="text-[#46B351]" />
                  )}
                  Confirm &amp; Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200">
            <div className="h-12 w-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={22} />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Delete Work Order?</h4>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to delete this work order? This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2.5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-sm transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2-3 Second In-App Acknowledgment Toast (No Chrome Popup) ── */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in duration-200">
          <div className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold text-white ${
            toast.type === 'error'
              ? 'bg-rose-600 border-rose-500 shadow-rose-600/25'
              : toast.type === 'info'
              ? 'bg-slate-900 border-slate-700 shadow-slate-900/25'
              : 'bg-[#0F172A] border-emerald-500/50 shadow-emerald-500/15'
          }`}>
            {toast.type === 'error' ? (
              <AlertCircle size={16} className="text-white shrink-0" />
            ) : toast.type === 'info' ? (
              <AlertTriangle size={16} className="text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 size={16} className="text-[#46B351] shrink-0" />
            )}
            <span className="leading-snug">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-slate-400 hover:text-white p-0.5 rounded transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

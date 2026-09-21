import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { 
  ArrowLeft, CheckCircle2, Loader2, FileText, Check, X, Search, 
  Layers, MapPin, Building2, Calendar, HardHat, Wallet, AlertCircle, Lock, Plus
} from 'lucide-react';

const INPUT = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1E3A8A] text-sm font-semibold text-slate-800 placeholder-slate-400 transition-all';
const LABEL = 'block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5';

export default function CreateProjectPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [locationBlock, setLocationBlock] = useState('North Block');
  const [customLocationBlock, setCustomLocationBlock] = useState('');
  const [customer, setCustomer] = useState('');
  const [commodity, setCommodity] = useState('Coal');
  const [customCommodity, setCustomCommodity] = useState('');
  const [contractQuantity, setContractQuantity] = useState('');
  const [contractQuantityUnit, setContractQuantityUnit] = useState('Tons');
  const [customQuantityUnit, setCustomQuantityUnit] = useState('');
  const [contractStartDate, setContractStartDate] = useState('');
  const [contractEndDate, setContractEndDate] = useState('');
  const [otherData, setOtherData] = useState('');
  const [formConfig, setFormConfig] = useState<any[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  // Work Orders List & Attachment State
  const [workOrdersList, setWorkOrdersList] = useState<any[]>([]);
  const [attachedWorkOrder, setAttachedWorkOrder] = useState<any | null>(null);
  const [isWoModalOpen, setIsWoModalOpen] = useState(false);
  const [woSearchQuery, setWoSearchQuery] = useState('');
  const [tempSelectedWo, setTempSelectedWo] = useState<any | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Worksite Dropdown State
  const [worksitesList, setWorksitesList] = useState<string[]>([
    'Head Office Main Site',
    'Hitec City Phase-1 Site',
    'Highway Overpass Site',
    'North Block Yard',
    'South Storage Batching Yard'
  ]);
  const [selectedWorksite, setSelectedWorksite] = useState('');
  const [customWorksite, setCustomWorksite] = useState('');

  // Assigned Staff State
  const defaultStaff = [
    { id: 'usr-admin', name: currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Project Administrator'), role: 'Project Director' },
    { id: 'def-1', name: 'Senior Site Manager', role: 'Engineering Lead' },
    { id: 'def-2', name: 'Operations Lead', role: 'Project Manager' },
    { id: 'def-3', name: 'Accounts & Billing Lead', role: 'Finance Officer' }
  ];

  const [staffList, setStaffList] = useState<any[]>(defaultStaff);
  const [assignedStaff, setAssignedStaff] = useState('');
  const [staffRole, setStaffRole] = useState('Project Manager');
  const [customStaff, setCustomStaff] = useState('');

  const host = (() => {
    const b = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return b.startsWith('http://localhost:3001') ? 'http://localhost:5000' : b;
  })();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const formatINR = (val: number | string | undefined | null) => {
    const num = typeof val === 'number' ? val : parseFloat(String(val || '0')) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  };

  useEffect(() => {
    fetch(`${host}/api/admin/form-config/project`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setFormConfig(d); })
      .catch(() => {});

    // Fetch Work Orders
    const fetchWorkOrders = async () => {
      try {
        let url = `${host}/api/tenant/work-orders`;
        if (currentUser?.uid) url += `/${currentUser.uid}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setWorkOrdersList(data);
        } else if (currentUser?.uid) {
          // Fallback to all work orders
          const fallbackRes = await fetch(`${host}/api/tenant/work-orders`);
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            if (Array.isArray(data)) setWorkOrdersList(data);
          }
        }
      } catch (err) {
        console.warn('Could not fetch work orders:', err);
      }
    };

    fetchWorkOrders();

    if (currentUser) {
      // Fetch Worksites
      fetch(`${host}/api/tenant/worksites/${currentUser.uid}`)
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            const names = data.map((w: any) => w.name || w.location).filter(Boolean);
            if (names.length > 0) {
              setWorksitesList(prev => Array.from(new Set([...names, ...prev])));
            }
          }
        })
        .catch(() => {});

      // Fetch Company Employees & Team Members
      fetch(`${host}/api/tenant/team/${currentUser.uid}`)
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setStaffList(prev => {
              const combined = [...data, ...prev];
              return Array.from(new Map(combined.map((item: any) => [item.id || item.name || item.email, item])).values());
            });
          }
        })
        .catch(() => {});
    }
  }, [currentUser]);

  // Apply selected work order and auto-fill all form fields
  const handleApplyWorkOrder = (wo: any) => {
    if (!wo) return;
    
    // Auto-fill project title
    if (wo.title) setName(wo.title);
    else if (wo.projectName) setName(wo.projectName);
    else if (wo.orderNumber) setName(`Project #${wo.orderNumber}`);

    // Auto-fill customer / client
    if (wo.clientName) {
      setCustomer(wo.clientCode ? `${wo.clientName} (${wo.clientCode})` : wo.clientName);
    }

    // Auto-fill location & worksite
    if (wo.projectLocationAddress) {
      setLocation(wo.projectLocationAddress);
    } else if (wo.worksiteName) {
      setLocation(wo.worksiteName);
    }

    if (wo.worksiteName) {
      setSelectedWorksite(wo.worksiteName);
      if (!worksitesList.includes(wo.worksiteName)) {
        setWorksitesList(prev => [wo.worksiteName, ...prev]);
      }
    }

    // Auto-fill block / division
    if (wo.divisionName) {
      setLocationBlock(wo.divisionName);
    }

    // Auto-fill commodity & cargo
    if (wo.commodity) {
      setCommodity(wo.commodity);
    }

    // Auto-fill quantity & unit
    if (wo.contractQuantity) {
      setContractQuantity(String(wo.contractQuantity));
    }
    if (wo.contractQuantityUnit) {
      setContractQuantityUnit(wo.contractQuantityUnit);
    }

    // Auto-fill dates
    if (wo.startDate) {
      setContractStartDate(wo.startDate.split('T')[0]);
    }
    const end = wo.endDate || wo.dueDate;
    if (end) {
      setContractEndDate(end.split('T')[0]);
    }

    // Auto-fill assigned staff
    if (wo.assignedStaffName) {
      setAssignedStaff(wo.assignedStaffName);
      setStaffRole('Project Head');
    }

    // Auto-fill notes / remarks
    const notesArr = [];
    if (wo.notes && wo.notes.trim()) notesArr.push(`[WO Notes]: ${wo.notes.trim()}`);
    if (wo.description && wo.description.trim()) notesArr.push(`[WO Scope]: ${wo.description.trim()}`);
    if (notesArr.length > 0) {
      setOtherData(notesArr.join('\n\n'));
    }

    setAttachedWorkOrder(wo);
    setIsWoModalOpen(false);
    showToast(`Work Order #${wo.orderNumber} attached! All details auto-filled.`);
  };

  // Detach / Clear work order
  const handleDetachWorkOrder = () => {
    setAttachedWorkOrder(null);
    setTempSelectedWo(null);
    showToast('Work order detached. You can enter details manually.');
  };

  const isVisible = (key: string) => {
    const c = formConfig.find(f => f.fieldKey === key);
    return c ? !c.isHidden : true;
  };
  const isReq = (key: string) => {
    const c = formConfig.find(f => f.fieldKey === key);
    return c ? c.isRequired : false;
  };

  const finalBlock = locationBlock === 'Add New' ? customLocationBlock : locationBlock;
  const finalComm = commodity === 'Add New' ? customCommodity : commodity;
  const finalUnit = contractQuantityUnit === 'Add New' ? customQuantityUnit : contractQuantityUnit;

  // Filtered work orders in modal
  const filteredWorkOrders = useMemo(() => {
    if (!workOrdersList) return [];
    if (!woSearchQuery.trim()) return workOrdersList;
    const q = woSearchQuery.toLowerCase();
    return workOrdersList.filter(wo => {
      const num = (wo.orderNumber || '').toLowerCase();
      const title = (wo.title || '').toLowerCase();
      const client = (wo.clientName || '').toLowerCase();
      const comm = (wo.commodity || '').toLowerCase();
      return num.includes(q) || title.includes(q) || client.includes(q) || comm.includes(q);
    });
  }, [workOrdersList, woSearchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const customFields: Record<string, string> = {};
    for (const cf of formConfig.filter(f => !f.isDefault && !f.isHidden)) {
      const val = customFieldValues[cf.fieldKey];
      if (cf.isRequired && (!val || !val.trim())) {
        alert(`${cf.fieldLabel} is required.`);
        return;
      }
      if (val) customFields[cf.fieldLabel] = val;
    }

    const finalStaff = assignedStaff === 'Add New' ? customStaff : assignedStaff;
    if (finalStaff) customFields['Assigned Staff Lead'] = finalStaff;
    if (staffRole) customFields['Staff Role'] = staffRole;

    if (attachedWorkOrder) {
      customFields['Origin Work Order'] = attachedWorkOrder.orderNumber;
      if (attachedWorkOrder.clientName) {
        customFields['Client Name / ID'] = attachedWorkOrder.clientName + (attachedWorkOrder.clientCode ? ` (${attachedWorkOrder.clientCode})` : '');
      }
      if (attachedWorkOrder.estimatedCost) {
        customFields['Estimated Budget'] = String(attachedWorkOrder.estimatedCost);
      }
    }

    // Prepare otherData JSON with work order metadata
    const metadataObj = attachedWorkOrder ? {
      originWorkOrder: attachedWorkOrder.orderNumber,
      originWorkOrderId: attachedWorkOrder.id,
      estimatedCost: attachedWorkOrder.estimatedCost ? String(attachedWorkOrder.estimatedCost) : '0.00',
      clientName: attachedWorkOrder.clientName || '',
      clientCode: attachedWorkOrder.clientCode || '',
      division: attachedWorkOrder.divisionName || finalBlock || '',
      projectHeadName: finalStaff || attachedWorkOrder.assignedStaffName || '',
      projectHeadRole: staffRole || 'Project Head',
      notes: attachedWorkOrder.notes || '',
      description: attachedWorkOrder.description || '',
      userRemarks: otherData
    } : {
      notes: otherData,
      projectHeadName: finalStaff || '',
      projectHeadRole: staffRole || 'Project Manager'
    };

    setSubmitting(true);
    try {
      const res = await fetch(`${host}/api/tenant/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUid: currentUser.uid,
          name, 
          location,
          locationBlock: finalBlock,
          customer: customer || (attachedWorkOrder?.clientName || ''),
          commodity: finalComm,
          contractQuantity,
          contractQuantityUnit: finalUnit,
          contractStartDate,
          contractEndDate,
          otherData: JSON.stringify(metadataObj),
          customFields,
        }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
      setTimeout(() => navigate('/tenant/project-management'), 1400);
    } catch {
      alert('Failed to create project. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-emerald-50 border-2 border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={36} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Project Created Successfully!</h2>
          <p className="text-sm text-slate-500 font-semibold">Redirecting to Projects Directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-200 pb-16 space-y-6">

      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-2xl shadow-xl border border-slate-700 animate-in slide-in-from-top-2">
          <CheckCircle2 size={15} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/tenant/project-management')}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Create New Project</h1>
            <p className="text-sm text-slate-400 font-semibold mt-0.5">Register a project manually or attach an approved work order</p>
          </div>
        </div>
      </div>

      {/* ─── ATTACH WORK ORDER CARD ─── */}
      <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 border border-blue-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1E3A8A] text-white flex items-center justify-center font-black shrink-0 shadow-sm">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Attach Approved Work Order</h3>
              <p className="text-xs text-slate-500 font-medium">Select an existing work order to auto-fill contract terms, client, location, and budget</p>
            </div>
          </div>

          {!attachedWorkOrder ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/tenant/work-orders')}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 shrink-0"
              >
                <Plus size={13} />
                Create Work Order
              </button>
              <button
                type="button"
                onClick={() => {
                  const firstPending = workOrdersList.find(wo => !wo.projectId && !wo.projectName && wo.status !== 'Completed');
                  setTempSelectedWo(firstPending || null);
                  setIsWoModalOpen(true);
                }}
                className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#152a63] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
              >
                <FileText size={13} />
                Select Work Order
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleDetachWorkOrder}
              className="px-3 py-1.5 bg-white text-slate-700 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1 shrink-0 self-start sm:self-auto"
            >
              <X size={13} />
              Detach / Reset
            </button>
          )}
        </div>

        {/* Note Banner when Work Order is NOT Attached */}
        {!attachedWorkOrder && (
          <div className="p-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 mt-0.5 sm:mt-0 shadow-sm">
                <AlertCircle size={16} />
              </div>
              <div>
                <span className="text-xs font-black text-amber-900 block">Note: No Work Order Attached</span>
                <p className="text-xs text-amber-800 font-medium mt-0.5">
                  Please create a work order first and attach it here to auto-populate customer details, deliverables, site location, and budget.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/tenant/work-orders')}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
            >
              <Plus size={13} />
              Create Work Order
            </button>
          </div>
        )}

        {/* If Work Order is Attached, display active status pill */}
        {attachedWorkOrder ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0 mt-0.5 sm:mt-0">
                <Check size={16} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">Work Order Linked</span>
                <span className="text-xs font-black text-slate-900">
                  {attachedWorkOrder.orderNumber}: {attachedWorkOrder.title}
                </span>
                <span className="block text-[11px] text-slate-600 font-medium mt-0.5">
                  Client: <strong>{attachedWorkOrder.clientName || 'Standard'}</strong> · Budget: <strong>{formatINR(attachedWorkOrder.estimatedCost)}</strong> · Division: <strong>{attachedWorkOrder.divisionName || 'Operations'}</strong>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setTempSelectedWo(attachedWorkOrder);
                setIsWoModalOpen(true);
              }}
              className="text-xs font-bold text-[#1E3A8A] hover:underline self-end sm:self-auto"
            >
              Change Work Order →
            </button>
          </div>
        ) : (
          /* Quick Dropdown Alternative */
          <div className="pt-2 border-t border-blue-100/80">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                Quick Select Pending Work Order
              </label>
              <span className="text-[10px] font-bold text-slate-500">
                {workOrdersList.filter(w => !w.projectId && !w.projectName && w.status !== 'Completed').length} Pending / Available
              </span>
            </div>
            <select
              value={attachedWorkOrder?.id || ''}
              onChange={e => {
                const found = workOrdersList.find(w => String(w.id) === e.target.value || w.orderNumber === e.target.value);
                const isAssigned = found && Boolean((found.projectId && String(found.projectId).trim()) || found.projectName || found.status === 'Completed');
                if (found && !isAssigned) {
                  handleApplyWorkOrder(found);
                }
              }}
              className="w-full px-3.5 py-2 bg-white border border-blue-200 rounded-xl text-xs font-semibold text-slate-800 cursor-pointer focus:ring-2 focus:ring-blue-100 focus:outline-none"
            >
              <option value="">-- Choose a pending work order to auto-fill --</option>
              {workOrdersList.map(wo => {
                const isAssigned = Boolean((wo.projectId && String(wo.projectId).trim()) || wo.projectName || wo.status === 'Completed');
                return (
                  <option 
                    key={wo.id || wo.orderNumber} 
                    value={wo.id || wo.orderNumber}
                    disabled={isAssigned}
                    className={isAssigned ? 'text-slate-400 bg-slate-100' : 'text-slate-800 font-semibold'}
                  >
                    {isAssigned ? `🔒 [Project Already Created: ${wo.projectId || 'Assigned'}] ` : '✓ [Available Pending] '}
                    {wo.orderNumber}: {wo.title} — {wo.clientName || 'Internal'} ({wo.commodity || 'Cargo'}, {formatINR(wo.estimatedCost)})
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 space-y-6">

          {/* Row 1: Project Name */}
          {isVisible('name') && (
            <div>
              <label className={LABEL}>Project Name {isReq('name') && <span className="text-red-500">*</span>}</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required={isReq('name')}
                placeholder="e.g. Metro Bypass Paving"
                className={INPUT}
              />
            </div>
          )}

          {/* Worksite Location Select Dropdown */}
          <div className="space-y-1.5 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
            <label className={LABEL}>Worksite Location Select <span className="text-red-500">*</span></label>
            <select
              value={selectedWorksite}
              onChange={e => {
                const val = e.target.value;
                setSelectedWorksite(val);
                if (val && val !== 'Add New') setLocation(val);
              }}
              className={INPUT + ' cursor-pointer bg-white'}
            >
              <option value="">-- Select Worksite Location --</option>
              {worksitesList.map((ws, idx) => (
                <option key={idx} value={ws}>{ws}</option>
              ))}
              <option value="Add New">+ Add New Worksite...</option>
            </select>
          </div>

          {selectedWorksite === 'Add New' && (
            <div>
              <label className={LABEL}>Specify New Worksite Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={customWorksite}
                onChange={e => {
                  setCustomWorksite(e.target.value);
                  setLocation(e.target.value);
                }}
                required
                placeholder="e.g. West Coast Metro Hub Site"
                className={INPUT}
              />
            </div>
          )}

          {/* Row 2: Location Address */}
          {isVisible('location') && (
            <div>
              <label className={LABEL}>Project Location Address {isReq('location') && <span className="text-red-500">*</span>}</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                required={isReq('location')}
                placeholder="e.g. North Expressway Sector 4"
                className={INPUT}
              />
            </div>
          )}

          {/* Row 3: Customer + Commodity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {isVisible('customer') && (
              <div>
                <label className={LABEL}>Customer / Client {isReq('customer') && <span className="text-red-500">*</span>}</label>
                <input
                  type="text"
                  value={customer}
                  onChange={e => setCustomer(e.target.value)}
                  required={isReq('customer')}
                  placeholder="e.g. Tata Steel Ltd or Metro Authority"
                  className={INPUT}
                />
              </div>
            )}
            {isVisible('commodity') && (
              <div>
                <label className={LABEL}>Commodity / Cargo</label>
                <select value={commodity} onChange={e => setCommodity(e.target.value)} className={INPUT + ' cursor-pointer'}>
                  <option>Coal</option>
                  <option>Iron Ore</option>
                  <option>Sand</option>
                  <option>Aggregates</option>
                  <option value="Add New">Add New...</option>
                </select>
              </div>
            )}
          </div>
          {commodity === 'Add New' && (
            <div>
              <label className={LABEL}>Specify Commodity <span className="text-red-500">*</span></label>
              <input type="text" value={customCommodity} onChange={e => setCustomCommodity(e.target.value)}
                required placeholder="e.g. Limestone" className={INPUT} />
            </div>
          )}

          {/* Assigned Staff Lead */}
          <div className="space-y-1.5 bg-indigo-50/50 p-4.5 rounded-2xl border border-indigo-100/80">
            <label className={LABEL}>Assigned Project Manager / Staff Lead (Name &amp; Role) <span className="text-red-500">*</span></label>
            <select
              value={assignedStaff}
              onChange={e => setAssignedStaff(e.target.value)}
              className={INPUT + ' cursor-pointer bg-white font-bold'}
            >
              <option value="">-- Select Assigned Staff Member &amp; Role --</option>
              {staffList.map((st: any, idx: number) => {
                const staffName = st.name || st.full_name || st.username || st.employee_name || st.displayName || (st.email ? st.email.split('@')[0] : `Employee #${idx + 1}`);
                const staffRoleName = st.role || st.designation || st.job_title || st.defaultRole || st.department || 'Project Lead';
                const label = `${staffName} (${staffRoleName})`;
                return (
                  <option key={st.id || idx} value={label}>
                    {label}
                  </option>
                );
              })}
              <option value="Add New">+ Add New Staff Member...</option>
            </select>
          </div>

          {assignedStaff === 'Add New' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Staff Member Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={customStaff}
                  onChange={e => setCustomStaff(e.target.value)}
                  required
                  placeholder="e.g. Vikramaditya Rao"
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Staff Role / Designation <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={staffRole}
                  onChange={e => setStaffRole(e.target.value)}
                  required
                  placeholder="e.g. Senior Site Engineer"
                  className={INPUT}
                />
              </div>
            </div>
          )}

          {/* Row 4: Quantity + Unit */}
          <div className="grid grid-cols-3 gap-5">
            {isVisible('contractQuantity') && (
              <div className="col-span-2">
                <label className={LABEL}>Contract Quantity {isReq('contractQuantity') && <span className="text-red-500">*</span>}</label>
                <input
                  type="text"
                  value={contractQuantity}
                  onChange={e => setContractQuantity(e.target.value)}
                  required={isReq('contractQuantity')}
                  placeholder="e.g. 50,000"
                  className={INPUT}
                />
              </div>
            )}
            {isVisible('contractQuantityUnit') && (
              <div>
                <label className={LABEL}>Unit</label>
                <select value={contractQuantityUnit} onChange={e => setContractQuantityUnit(e.target.value)} className={INPUT + ' cursor-pointer'}>
                  <option>Tons</option>
                  <option>Metric Tons</option>
                  <option>KL (Kilo Liters)</option>
                  <option>CUM (Cubic Meters)</option>
                  <option>Bags</option>
                  <option>Nos</option>
                  <option value="Add New">Add New...</option>
                </select>
              </div>
            )}
          </div>

          {/* Row 5: Start + End Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {isVisible('contractStartDate') && (
              <div>
                <label className={LABEL}>Contract Start Date {isReq('contractStartDate') && <span className="text-red-500">*</span>}</label>
                <input type="date" value={contractStartDate} onChange={e => setContractStartDate(e.target.value)}
                  required={isReq('contractStartDate')} className={INPUT} />
              </div>
            )}
            {isVisible('contractEndDate') && (
              <div>
                <label className={LABEL}>Contract End Date {isReq('contractEndDate') && <span className="text-red-500">*</span>}</label>
                <input type="date" value={contractEndDate} onChange={e => setContractEndDate(e.target.value)}
                  required={isReq('contractEndDate')} className={INPUT} />
              </div>
            )}
          </div>

          {/* Remarks / Other Data field removed as requested */}

          {/* Dynamic Custom Fields */}
          {formConfig.filter(f => !f.isDefault && !f.isHidden).length > 0 && (
            <div className="border-t border-slate-100 pt-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-4">Custom Configuration</p>
              <div className="grid grid-cols-2 gap-5">
                {formConfig.filter(f => !f.isDefault && !f.isHidden).map(cf => (
                  <div key={cf.fieldKey}>
                    <label className={LABEL}>{cf.fieldLabel} {cf.isRequired && <span className="text-red-500">*</span>}</label>
                    {cf.fieldType === 'dropdown' ? (
                      <select
                        value={customFieldValues[cf.fieldKey] || ''}
                        onChange={e => setCustomFieldValues(p => ({ ...p, [cf.fieldKey]: e.target.value }))}
                        className={INPUT + ' cursor-pointer'}
                      >
                        <option value="">Select option</option>
                        {(cf.dropdownOptions || '').split(',').map((o: string) => {
                          const t = o.trim();
                          return <option key={t} value={t}>{t}</option>;
                        })}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={customFieldValues[cf.fieldKey] || ''}
                        onChange={e => setCustomFieldValues(p => ({ ...p, [cf.fieldKey]: e.target.value }))}
                        placeholder={`Enter ${cf.fieldLabel}`}
                        className={INPUT}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Form Footer */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={() => navigate('/tenant/project-management')}
            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-[#1E3A8A] hover:bg-[#152a63] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm rounded-xl transition-all flex items-center gap-2 shadow-sm"
          >
            {submitting
              ? <><Loader2 size={14} className="animate-spin" /> Creating Project...</>
              : <><CheckCircle2 size={14} /> Create Project</>
            }
          </button>
        </div>
      </form>

      {/* ─── MODAL: SELECT WORK ORDER & CLICK DONE ─── */}
      {isWoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 max-h-[85vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900">Select Approved Work Order</h3>
                <p className="text-xs text-slate-400 font-medium">Select a work order and click "Done" to auto-fill all project details</p>
              </div>
              <button
                onClick={() => setIsWoModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by work order #, title, client, commodity..."
                  value={woSearchQuery}
                  onChange={e => setWoSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>
            </div>

            {/* Modal Work Order Cards List */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {filteredWorkOrders.length > 0 ? (
                filteredWorkOrders.map(wo => {
                  const isAlreadyLinked = Boolean((wo.projectId && String(wo.projectId).trim()) || wo.projectName || wo.status === 'Completed');
                  const isSelected = !isAlreadyLinked && tempSelectedWo && (tempSelectedWo.id === wo.id || tempSelectedWo.orderNumber === wo.orderNumber);

                  return (
                    <div
                      key={wo.id || wo.orderNumber}
                      onClick={() => {
                        if (!isAlreadyLinked) {
                          setTempSelectedWo(wo);
                        }
                      }}
                      className={`p-4 rounded-2xl border transition-all text-left ${
                        isAlreadyLinked
                          ? 'bg-slate-100/90 border-slate-200 opacity-60 cursor-not-allowed select-none'
                          : isSelected
                            ? 'bg-blue-50/60 border-[#1E3A8A] ring-2 ring-blue-100 shadow-sm cursor-pointer'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-slate-900 text-white">
                              {wo.orderNumber}
                            </span>
                            <span className={`font-black text-sm ${isAlreadyLinked ? 'text-slate-600' : 'text-slate-900'}`}>
                              {wo.title}
                            </span>
                            {isAlreadyLinked ? (
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700 flex items-center gap-1 border border-slate-300">
                                <Lock size={10} />
                                Project Already Created {wo.projectId ? `(${wo.projectId})` : ''}
                              </span>
                            ) : (
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-300">
                                <Check size={10} />
                                Pending Project Creation
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium pt-1">
                            <div className="flex items-center gap-1 text-slate-700">
                              <Building2 size={12} className="text-slate-400" />
                              <span>Client: <strong>{wo.clientName || 'Internal'}</strong></span>
                            </div>

                            <div className="flex items-center gap-1 text-slate-700">
                              <Layers size={12} className="text-slate-400" />
                              <span>Cargo: <strong>{wo.commodity || 'General'}</strong></span>
                              {wo.contractQuantity && (
                                <span>({wo.contractQuantity} {wo.contractQuantityUnit || ''})</span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 text-emerald-700 font-bold">
                              <Wallet size={12} />
                              <span>Budget: {formatINR(wo.estimatedCost)}</span>
                            </div>
                          </div>

                          {wo.projectLocationAddress && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold pt-0.5">
                              <MapPin size={11} className="text-rose-500 shrink-0" />
                              <span>{wo.projectLocationAddress}</span>
                            </div>
                          )}

                          {isAlreadyLinked && (
                            <p className="text-[11px] font-bold text-rose-600 pt-1 flex items-center gap-1">
                              <Lock size={11} /> Project already created. Not selectable.
                            </p>
                          )}
                        </div>

                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                          isAlreadyLinked
                            ? 'bg-slate-200 border-slate-300 text-slate-500 cursor-not-allowed'
                            : isSelected
                              ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                              : 'border-slate-300'
                        }`}>
                          {isAlreadyLinked ? (
                            <Lock size={11} />
                          ) : isSelected ? (
                            <Check size={13} className="stroke-[3]" />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-400 font-semibold space-y-3">
                  <FileText size={32} className="mx-auto text-slate-300" />
                  <p className="text-xs">No matching work orders found.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsWoModalOpen(false);
                      navigate('/tenant/work-orders');
                    }}
                    className="px-4 py-2 bg-[#1E3A8A] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#152a63]"
                  >
                    + Create a Work Order
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer with "Done" Button */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
              <span className="text-xs font-semibold text-slate-500">
                {tempSelectedWo ? (
                  <>Selected: <strong className="text-slate-900">{tempSelectedWo.orderNumber}</strong></>
                ) : (
                  'Please select an available pending work order above'
                )}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsWoModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!tempSelectedWo || Boolean((tempSelectedWo.projectId && String(tempSelectedWo.projectId).trim()) || tempSelectedWo.projectName || tempSelectedWo.status === 'Completed')}
                  onClick={() => handleApplyWorkOrder(tempSelectedWo)}
                  className="px-5 py-2 bg-[#1E3A8A] hover:bg-[#152a63] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Check size={14} />
                  Done (Attach &amp; Fill)
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

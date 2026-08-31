import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';

const INPUT = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1E3A8A] text-sm font-semibold text-slate-800 placeholder-slate-400 transition-all';
const LABEL = 'block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5';

export default function CreateProjectPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

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

  // Assigned Staff State (Populated with Current User, Company Roles & Team API)
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

  useEffect(() => {
    fetch(`${host}/api/admin/form-config/project`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setFormConfig(d); })
      .catch(() => {});

    if (currentUser) {
      // Fetch Real Worksites
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

      // Fetch Real Company Employees & Team Members
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

      fetch(`${host}/api/tenant/team`)
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

    setSubmitting(true);
    try {
      const res = await fetch(`${host}/api/tenant/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUid: currentUser.uid,
          name, location,
          locationBlock: finalBlock,
          customer: finalStaff ? `${customer ? customer + ' | Lead: ' + finalStaff : 'Lead: ' + finalStaff}` : customer,
          commodity: finalComm,
          contractQuantity,
          contractQuantityUnit: finalUnit,
          contractStartDate,
          contractEndDate,
          otherData,
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
          <h2 className="text-2xl font-black text-slate-900 mb-2">Project Created!</h2>
          <p className="text-sm text-slate-500 font-semibold">Redirecting to Projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-200 pb-12">

      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/tenant/project-management')}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Create New Project</h1>
            <p className="text-sm text-slate-400 font-semibold mt-0.5">Fill in the details below to register a new project</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm">
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

          {/* Row 2: Location Address + Block */}
          <div className="grid grid-cols-2 gap-5">
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
            {isVisible('locationBlock') && (
              <div>
                <label className={LABEL}>Block / Phase</label>
                <select value={locationBlock} onChange={e => setLocationBlock(e.target.value)} className={INPUT + ' cursor-pointer'}>
                  <option>North Block</option>
                  <option>South Block</option>
                  <option>Phase 1</option>
                  <option>Phase 2</option>
                  <option value="Add New">Add New...</option>
                </select>
              </div>
            )}
          </div>
          {locationBlock === 'Add New' && (
            <div>
              <label className={LABEL}>Specify Block / Phase <span className="text-red-500">*</span></label>
              <input type="text" value={customLocationBlock} onChange={e => setCustomLocationBlock(e.target.value)}
                required placeholder="e.g. West Block Section B" className={INPUT} />
            </div>
          )}

          {/* Row 3: Customer + Commodity */}
          <div className="grid grid-cols-2 gap-5">
            {isVisible('customer') && (
              <div>
                <label className={LABEL}>Customer / Client {isReq('customer') && <span className="text-red-500">*</span>}</label>
                <input
                  type="text"
                  value={customer}
                  onChange={e => setCustomer(e.target.value)}
                  required={isReq('customer')}
                  placeholder="e.g. Metro Rail Authority"
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

          {/* Unified Single Dropdown: Assigned Staff Lead (Role) */}
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
          <div className="grid grid-cols-2 gap-5">
            {isVisible('contractQuantity') && (
              <div>
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
          {contractQuantityUnit === 'Add New' && (
            <div>
              <label className={LABEL}>Specify Unit <span className="text-red-500">*</span></label>
              <input type="text" value={customQuantityUnit} onChange={e => setCustomQuantityUnit(e.target.value)}
                required placeholder="e.g. Barrels" className={INPUT} />
            </div>
          )}

          {/* Row 5: Start + End Dates */}
          <div className="grid grid-cols-2 gap-5">
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

          {/* Row 6: Other Data */}
          {isVisible('otherData') && (
            <div>
              <label className={LABEL}>Remarks / Other Data {isReq('otherData') && <span className="text-red-500">*</span>}</label>
              <textarea
                value={otherData}
                onChange={e => setOtherData(e.target.value)}
                required={isReq('otherData')}
                placeholder="Any special instructions, notes, or additional information..."
                rows={3}
                className={INPUT + ' resize-none'}
              />
            </div>
          )}

          {/* Dynamic Custom Fields */}
          {formConfig.filter(f => !f.isDefault && !f.isHidden).length > 0 && (
            <>
              <div className="border-t border-slate-100 pt-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-5">Custom Fields</p>
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
            </>
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
              ? <><Loader2 size={14} className="animate-spin" /> Creating...</>
              : <><CheckCircle2 size={14} /> Create Project</>
            }
          </button>
        </div>
      </form>
    </div>
  );
}

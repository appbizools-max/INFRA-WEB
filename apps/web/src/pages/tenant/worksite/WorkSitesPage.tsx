import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { MapPin, Plus, Search, Filter, Shield, Activity, Users, User, Phone, CheckCircle, X, Trash2, Layers } from 'lucide-react';

interface WorkSite {
  id: string;
  worksiteId: string;
  name: string;
  location: string;
  type: string;
  supervisor: string;
  contact: string;
  workersCount: number;
  geofenceStatus: 'Enabled' | 'Disabled';
  operationalStatus: 'Active' | 'Suspended' | 'Under Maintenance';
  safetyRating: string;
  customFields?: Record<string, any>;
}

export default function WorkSitesPage() {
  const { currentUser } = useAuth();
  const [sites, setSites] = useState<WorkSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('Port');
  const [customType, setCustomType] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [contact, setContact] = useState('');

  // Dynamic Fields Config States
  const [formConfig, setFormConfig] = useState<any[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  const isFieldVisible = (key: string) => {
    const cfg = formConfig.find(f => f.fieldKey === key);
    return cfg ? !cfg.isHidden : true;
  };

  const isFieldRequired = (key: string) => {
    const cfg = formConfig.find(f => f.fieldKey === key);
    return cfg ? cfg.isRequired : false;
  };

  const fetchWorksites = () => {
    if (currentUser) {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;

      fetch(`${host}/api/tenant/worksites/${currentUser.uid}`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Failed to fetch worksites');
        })
        .then(data => {
          setSites(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    fetchWorksites();

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;
    fetch(`${host}/api/admin/form-config/worksite`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setFormConfig(data);
      })
      .catch(err => console.error('Failed to fetch worksite form config', err));
  }, [currentUser]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Validate Default Fields dynamically
    const fieldsToValidate = [
      { key: 'name', val: name, label: 'Site Name' },
      { key: 'location', val: location, label: 'Site Location' },
      { key: 'type', val: type === 'Add New' ? customType : type, label: 'Site Type' },
      { key: 'supervisor', val: supervisor, label: 'Supervisor Name' },
      { key: 'contact', val: contact, label: 'Contact Number' },
    ];
    for (const f of fieldsToValidate) {
      if (isFieldVisible(f.key) && isFieldRequired(f.key) && !String(f.val || '').trim()) {
        alert(`${f.label} is required.`);
        return;
      }
    }

    // Validate Custom Fields
    const customFields = formConfig.filter(f => !f.isDefault && !f.isHidden);
    const resolvedCustomFields: Record<string, string> = {};
    for (const cf of customFields) {
      const val = customFieldValues[cf.fieldKey];
      if (cf.isRequired && (!val || !val.trim())) {
        alert(`${cf.fieldLabel} is required.`);
        return;
      }
      if (val) {
        resolvedCustomFields[cf.fieldLabel] = val;
      }
    }

    const finalType = type === 'Add New' ? customType : type;

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;

    fetch(`${host}/api/tenant/worksites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firebaseUid: currentUser.uid,
        name: isFieldVisible('name') ? name : '',
        location: isFieldVisible('location') ? location : '',
        type: isFieldVisible('type') ? finalType : '',
        supervisor: isFieldVisible('supervisor') ? supervisor : '',
        contact: isFieldVisible('contact') ? contact : '',
        customFields: resolvedCustomFields
      })
    })
      .then(res => {
        if (res.ok) {
          fetchWorksites();
          setIsModalOpen(false);
          // Reset Form
          setName('');
          setLocation('');
          setType('Port');
          setCustomType('');
          setSupervisor('');
          setContact('');
          setCustomFieldValues({});
        } else {
          alert('Failed to create worksite');
        }
      })
      .catch(err => console.error(err));
  };

  const handleDeleteSite = (worksiteId: string) => {
    if (!window.confirm('Are you sure you want to delete this worksite?')) return;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;

    fetch(`${host}/api/tenant/worksites/${worksiteId}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) fetchWorksites();
        else alert('Failed to delete worksite');
      })
      .catch(err => console.error(err));
  };

  const handleToggleGeofence = (worksiteId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Enabled' ? 'Disabled' : 'Enabled';
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;

    fetch(`${host}/api/tenant/worksites/${worksiteId}/geofence`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ geofenceStatus: nextStatus })
    })
      .then(res => {
        if (res.ok) fetchWorksites();
        else alert('Failed to update geofence status');
      })
      .catch(err => console.error(err));
  };

  const filteredSites = sites.filter(site => {
    const matchesSearch = site.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          site.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          site.supervisor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          site.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (site.customFields && JSON.stringify(site.customFields).toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || site.operationalStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: WorkSite['operationalStatus']) => {
    switch (status) {
      case 'Active': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Suspended': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Under Maintenance': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Work Sites Directory</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Manage geographic work boundaries, safety status, and supervisor lists.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center px-4 py-2.5 bg-[#1E3A8A] hover:bg-[#152a63] text-white font-bold rounded-xl text-sm transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus size={16} className="mr-2" />
          New Work Site
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={MapPin} label="Total Sites" value={sites.length} subtext="Configured geofences" color="text-blue-600 bg-blue-50 border-blue-100" />
        <MetricCard icon={Activity} label="Operational" value={sites.filter(s => s.operationalStatus === 'Active').length} subtext="Active workspaces" color="text-emerald-600 bg-emerald-50 border-emerald-100" />
        <MetricCard icon={Shield} label="Safety Rated" value={sites.length} subtext="100% compliance checked" color="text-indigo-600 bg-indigo-50 border-indigo-100" />
        <MetricCard icon={Users} label="Total Workers Active" value={sites.reduce((acc, curr) => acc + (curr.operationalStatus === 'Active' ? Number(curr.workersCount || 0) : 0), 0)} subtext="On-site count" color="text-violet-600 bg-violet-50 border-violet-100" />
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by site name, location, supervisor, or type..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1E3A8A] text-sm font-medium text-slate-800 placeholder-slate-400"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-slate-400 shrink-0" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="All">All Sites</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Under Maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Work Sites List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Loading worksites...</p>
        </div>
      ) : filteredSites.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Layers size={24} className="text-slate-400" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Work Sites Found</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 font-medium">Get started by creating your first construction worksite.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 text-center w-12">S.No</th>
                  <th className="py-3 px-4">Site Type</th>
                  <th className="py-3 px-4 min-w-[150px]">Site Name</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Supervisor</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-right">Workers</th>
                  <th className="py-3 px-4">Geofence</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredSites.map((site, idx) => (
                  <tr key={site.id || site.worksiteId || `ws-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 bg-blue-50 text-[#1E3A8A] font-extrabold text-[9px] rounded border border-blue-100 tracking-wider">
                        {site.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{site.name}</span>
                      {site.customFields && Object.keys(site.customFields).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(site.customFields).map(([k, v]: [string, any]) => (
                            <span key={k} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium border border-slate-200">
                              <strong>{k}:</strong> {v}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        <MapPin size={12} className="text-slate-400" />
                        <span>{site.location}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        <User size={12} className="text-slate-400" />
                        <span>{site.supervisor}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        <Phone size={12} className="text-slate-400" />
                        <span>{site.contact}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <Users size={12} className="text-slate-400" />
                        <span>{site.workersCount || 0} Members</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleGeofence(site.worksiteId, site.geofenceStatus)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-black transition-all border ${
                          site.geofenceStatus === 'Enabled' 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {site.geofenceStatus}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${getStatusColor(site.operationalStatus)}`}>
                        {site.operationalStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-3">
                        <button 
                          onClick={() => alert(`Showing Site Boundaries for ${site.name}`)}
                          className="text-[#1E3A8A] hover:text-[#152a63] font-bold text-xs"
                        >
                          Boundaries
                        </button>
                        <button
                          onClick={() => handleDeleteSite(site.worksiteId)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 transition-colors"
                          title="Delete Worksite"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-over / Modal for Create Work Site */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">Create New Work Site</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              {isFieldVisible('name') && (
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">Site Name {isFieldRequired('name') && '*'}</label>
                  <input
                    type="text"
                    required={isFieldRequired('name')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sector 5 Metro Junction"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1E3A8A] text-sm font-semibold"
                  />
                </div>
              )}

              {isFieldVisible('location') && (
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">Site Location {isFieldRequired('location') && '*'}</label>
                  <input
                    type="text"
                    required={isFieldRequired('location')}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. North Corridor, Main Crossroad"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1E3A8A] text-sm font-semibold"
                  />
                </div>
              )}

              {isFieldVisible('type') && (
                <>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">Type *</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1E3A8A] text-sm font-semibold"
                    >
                      <option value="Port">Port</option>
                      <option value="Stockyard">Stockyard</option>
                      <option value="Warehouse">Warehouse</option>
                      <option value="Railway Siding">Railway Siding</option>
                      <option value="Factory">Factory</option>
                      <option value="Mine">Mine</option>
                      <option value="Add New">Add New Type...</option>
                    </select>
                  </div>

                  {type === 'Add New' && (
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">Specify Custom Type *</label>
                      <input
                        type="text"
                        required
                        value={customType}
                        onChange={(e) => setCustomType(e.target.value)}
                        placeholder="e.g. Tunnel"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1E3A8A] text-sm font-semibold animate-fadeIn"
                      />
                    </div>
                  )}
                </>
              )}

              {isFieldVisible('supervisor') && (
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">Supervisor {isFieldRequired('supervisor') && '*'}</label>
                  <input
                    type="text"
                    required={isFieldRequired('supervisor')}
                    value={supervisor}
                    onChange={(e) => setSupervisor(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1E3A8A] text-sm font-semibold"
                  />
                </div>
              )}

              {isFieldVisible('contact') && (
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">Contact Number {isFieldRequired('contact') && '*'}</label>
                  <input
                    type="text"
                    required={isFieldRequired('contact')}
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1E3A8A] text-sm font-semibold"
                  />
                </div>
              )}

              {/* Render Custom Fields dynamically */}
              {formConfig.filter(f => !f.isDefault && !f.isHidden).map(cf => (
                <div key={cf.fieldKey}>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    {cf.fieldLabel} {cf.isRequired && '*'}
                  </label>
                  {cf.fieldType === 'dropdown' ? (
                    <select
                      value={customFieldValues[cf.fieldKey] || ''}
                      onChange={(e) => setCustomFieldValues(prev => ({ ...prev, [cf.fieldKey]: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1E3A8A] text-sm font-semibold"
                    >
                      <option value="">Select option</option>
                      {(cf.dropdownOptions || '').split(',').map((opt: string) => {
                        const trimmed = opt.trim();
                        return <option key={trimmed} value={trimmed}>{trimmed}</option>;
                      })}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={customFieldValues[cf.fieldKey] || ''}
                      onChange={(e) => setCustomFieldValues(prev => ({ ...prev, [cf.fieldKey]: e.target.value }))}
                      placeholder={`Enter ${cf.fieldLabel}`}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1E3A8A] text-sm font-semibold"
                    />
                  )}
                </div>
              ))}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#152a63] text-white font-bold rounded-xl text-sm transition-colors"
                >
                  Save Work Site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, subtext, color }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
      <div className={`p-3 rounded-xl border ${color} shrink-0`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-slate-900 mt-0.5 leading-none">{value}</p>
        <p className="text-xs text-slate-400 font-medium mt-1">{subtext}</p>
      </div>
    </div>
  );
}

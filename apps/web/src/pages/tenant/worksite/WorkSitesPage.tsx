import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { MapPin, Plus, Search, Filter, Shield, Activity, Users, User, Phone, CheckCircle, X, Trash2, Layers, Briefcase, Building2, Eye, Edit2 } from 'lucide-react';

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
  const [typeFilter, setTypeFilter] = useState<string>('All');

  // View & Edit Modal States
  const [viewingSite, setViewingSite] = useState<WorkSite | null>(null);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('Port');
  const [customType, setCustomType] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [contact, setContact] = useState('');

  // Staff Assignment & Filtering States
  const [divisions, setDivisions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [assignedStaffId, setAssignedStaffId] = useState<string>('');

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

    if (currentUser) {
      // Fetch Divisions
      fetch(`${host}/api/tenant/divisions/${currentUser.uid}`)
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          if (Array.isArray(data)) setDivisions(data);
        })
        .catch(err => console.error('Failed to fetch divisions', err));

      // Fetch Departments
      fetch(`${host}/api/tenant/departments/${currentUser.uid}`)
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          const list = Array.isArray(data) ? data : (data.departments || []);
          setDepartments(list);
        })
        .catch(err => console.error('Failed to fetch departments', err));

      // Fetch Team Members for Staff Assignment
      fetch(`${host}/api/tenant/team/${currentUser.uid}`)
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          if (Array.isArray(data)) setTeamMembers(data);
        })
        .catch(err => console.error('Failed to fetch team members', err));
    }
  }, [currentUser]);

  // Unique list of department options from both configured departments and actual team members
  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    departments.forEach(d => {
      const dName = typeof d === 'string' ? d : (d.name || d.department_name);
      if (dName && dName.trim()) set.add(dName.trim());
    });
    teamMembers.forEach(m => {
      if (m.department && m.department.trim()) set.add(m.department.trim());
    });
    return Array.from(set).sort();
  }, [departments, teamMembers]);

  // Interconnected Staff filtering based on selected Division and Department
  const filteredStaffMembers = useMemo(() => {
    return teamMembers.filter(member => {
      // 1. Division filter
      if (selectedDivision && selectedDivision !== 'All') {
        const divIds: string[] = Array.isArray(member.division_ids)
          ? member.division_ids.map(String)
          : (member.division_id ? [String(member.division_id)] : []);

        const matchedDivObj = divisions.find(d => String(d.id) === String(selectedDivision));
        const selDivName = matchedDivObj ? matchedDivObj.name.trim().toLowerCase() : '';

        const matchesDiv =
          divIds.includes(String(selectedDivision)) ||
          (member.division_name && member.division_name.trim().toLowerCase() === String(selectedDivision).trim().toLowerCase()) ||
          (selDivName && member.division_name && member.division_name.trim().toLowerCase() === selDivName) ||
          (member.divisions_list && member.divisions_list.some((d: any) => String(d.id) === String(selectedDivision) || (selDivName && d.name?.trim().toLowerCase() === selDivName)));

        if (!matchesDiv) return false;
      }

      // 2. Department filter
      if (selectedDepartment && selectedDepartment !== 'All') {
        const selNorm = selectedDepartment.trim().toLowerCase();
        const memDept = (member.department || '').trim().toLowerCase();
        const matchesDept =
          memDept === selNorm ||
          (selNorm === 'hr' && (memDept === 'human resources' || memDept === 'hr')) ||
          (selNorm === 'human resources' && (memDept === 'hr' || memDept === 'human resources')) ||
          (selNorm === 'accounts' && (memDept === 'accountant' || memDept === 'accounts')) ||
          (selNorm === 'accountant' && (memDept === 'accounts' || memDept === 'accountant'));

        if (!matchesDept) return false;
      }

      return true;
    });
  }, [teamMembers, selectedDivision, selectedDepartment, divisions]);

  const handleSelectStaff = (memberId: string) => {
    setAssignedStaffId(memberId);
    if (!memberId) {
      setSupervisor('');
      return;
    }
    const member = teamMembers.find(m => String(m.id) === String(memberId));
    if (member) {
      setSupervisor(member.name);
      if (member.mobile) {
        setContact(member.mobile);
      }
    }
  };

  const handleDivisionChange = (divId: string) => {
    setSelectedDivision(divId);
    if (assignedStaffId) {
      const member = teamMembers.find(m => String(m.id) === String(assignedStaffId));
      if (member && divId && divId !== 'All') {
        const divIds = Array.isArray(member.division_ids)
          ? member.division_ids.map(String)
          : (member.division_id ? [String(member.division_id)] : []);
        const matchedDivObj = divisions.find(d => String(d.id) === String(divId));
        const selDivName = matchedDivObj ? matchedDivObj.name.trim().toLowerCase() : '';
        const matches = divIds.includes(String(divId)) ||
          (member.division_name && member.division_name.trim().toLowerCase() === String(divId).trim().toLowerCase()) ||
          (selDivName && member.division_name && member.division_name.trim().toLowerCase() === selDivName);
        if (!matches) {
          setAssignedStaffId('');
          setSupervisor('');
        }
      }
    }
  };

  const handleDepartmentChange = (deptName: string) => {
    setSelectedDepartment(deptName);
    if (assignedStaffId) {
      const member = teamMembers.find(m => String(m.id) === String(assignedStaffId));
      if (member && deptName && deptName !== 'All') {
        const selNorm = deptName.trim().toLowerCase();
        const memDept = (member.department || '').trim().toLowerCase();
        const matchesDept =
          memDept === selNorm ||
          (selNorm === 'hr' && (memDept === 'human resources' || memDept === 'hr')) ||
          (selNorm === 'human resources' && (memDept === 'hr' || memDept === 'human resources')) ||
          (selNorm === 'accounts' && (memDept === 'accountant' || memDept === 'accounts')) ||
          (selNorm === 'accountant' && (memDept === 'accounts' || memDept === 'accountant'));
        if (!matchesDept) {
          setAssignedStaffId('');
          setSupervisor('');
        }
      }
    }
  };

  const resetForm = () => {
    setIsModalOpen(false);
    setEditingSiteId(null);
    setName('');
    setLocation('');
    setType('Port');
    setCustomType('');
    setSupervisor('');
    setContact('');
    setCustomFieldValues({});
    setSelectedDivision('');
    setSelectedDepartment('');
    setAssignedStaffId('');
  };

  const handleOpenEditModal = (site: WorkSite) => {
    setEditingSiteId(site.worksiteId || site.id);
    setName(site.name || '');
    setLocation(site.location || '');
    
    const standardTypes = ['Port', 'Stockyard', 'Warehouse', 'Railway Siding', 'Factory', 'Mine'];
    if (standardTypes.includes(site.type)) {
      setType(site.type);
      setCustomType('');
    } else if (site.type) {
      setType('Add New');
      setCustomType(site.type);
    } else {
      setType('Port');
      setCustomType('');
    }

    setSupervisor(site.supervisor || '');
    setContact(site.contact || '');

    const cFields = site.customFields || {};
    let divId = '';
    if (cFields.Division) {
      const matchDiv = divisions.find(d => d.name.toLowerCase() === String(cFields.Division).toLowerCase() || String(d.id) === String(cFields.Division));
      divId = matchDiv ? matchDiv.id : '';
    }
    setSelectedDivision(divId);
    setSelectedDepartment(cFields.Department || '');

    if (site.supervisor) {
      const staffMember = teamMembers.find(m => m.name.toLowerCase() === site.supervisor.toLowerCase());
      if (staffMember) {
        setAssignedStaffId(staffMember.id);
        if (!divId && staffMember.division_ids?.length) {
          setSelectedDivision(staffMember.division_ids[0]);
        }
        if (!cFields.Department && staffMember.department) {
          setSelectedDepartment(staffMember.department);
        }
      } else {
        setAssignedStaffId('');
      }
    } else {
      setAssignedStaffId('');
    }

    const cfVals: Record<string, string> = {};
    formConfig.forEach(cfg => {
      if (!cfg.isDefault && cFields[cfg.fieldLabel]) {
        cfVals[cfg.fieldKey] = cFields[cfg.fieldLabel];
      }
    });
    setCustomFieldValues(cfVals);

    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Validate Default Fields dynamically
    const fieldsToValidate = [
      { key: 'name', val: name, label: 'Site Name' },
      { key: 'location', val: location, label: 'Site Location' },
      { key: 'supervisor', val: supervisor, label: 'Assigned Staff / Supervisor' },
    ];
    for (const f of fieldsToValidate) {
      if (isFieldVisible(f.key) && isFieldRequired(f.key) && !String(f.val || '').trim()) {
        alert(`${f.label} is required.`);
        return;
      }
    }

    // Validate Custom Fields (strictly exclude any Mac / custom_mac fields)
    const customFields = formConfig.filter(
      f => !f.isDefault && !f.isHidden && f.fieldKey !== 'custom_mac' && f.fieldLabel?.toLowerCase() !== 'mac'
    );
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

    // Include division and department in customFields for display badges
    if (selectedDivision && selectedDivision !== 'All') {
      const dObj = divisions.find(d => String(d.id) === String(selectedDivision));
      resolvedCustomFields['Division'] = dObj ? dObj.name : selectedDivision;
    }
    if (selectedDepartment && selectedDepartment !== 'All') {
      resolvedCustomFields['Department'] = selectedDepartment;
    }
    if (assignedStaffId) {
      const sObj = teamMembers.find(m => String(m.id) === String(assignedStaffId));
      if (sObj && sObj.role) {
        resolvedCustomFields['Role'] = sObj.role;
      }
    }

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;

    const endpoint = editingSiteId 
      ? `${host}/api/tenant/worksites/${editingSiteId}`
      : `${host}/api/tenant/worksites`;
    const method = editingSiteId ? 'PUT' : 'POST';

    fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firebaseUid: currentUser.uid,
        name: isFieldVisible('name') ? name : '',
        location: isFieldVisible('location') ? location : '',
        supervisor: isFieldVisible('supervisor') ? supervisor : '',
        contact: contact || '',
        customFields: resolvedCustomFields
      })
    })
      .then(res => {
        if (res.ok) {
          fetchWorksites();
          resetForm();
        } else {
          alert(`Failed to ${editingSiteId ? 'update' : 'create'} worksite`);
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

  const filteredSites = sites.filter(site => {
    return site.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           site.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
           site.supervisor.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (site.customFields && JSON.stringify(site.customFields).toLowerCase().includes(searchQuery.toLowerCase()));
  });

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard icon={MapPin} label="Total Sites" value={sites.length} subtext="Configured worksites" color="text-blue-600 bg-blue-50 border-blue-100" />
        <MetricCard icon={Users} label="Total Workers" value={sites.reduce((acc, curr) => acc + Number(curr.workersCount || 0), 0)} subtext="Active personnel" color="text-violet-600 bg-violet-50 border-violet-100" />
        <MetricCard 
          icon={User} 
          label="Assigned Staff" 
          value={sites.filter(s => s.supervisor && s.supervisor.trim() !== '' && s.supervisor.toLowerCase() !== 'n/a').length} 
          subtext="Site supervisors assigned" 
          color="text-indigo-600 bg-indigo-50 border-indigo-100" 
        />
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search worksites by name, location, supervisor, division..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1E3A8A] text-sm font-medium text-slate-800 placeholder-slate-400"
          />
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
                  <th className="py-3 px-4 min-w-[180px]">Site Name</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Supervisor</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-right">Workers</th>
                  <th className="py-3 px-4 text-center w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredSites.map((site, idx) => (
                  <tr key={site.id || site.worksiteId || `ws-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
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
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          onClick={() => setViewingSite(site)}
                          className="inline-flex items-center space-x-1 text-[#1E3A8A] hover:text-[#152a63] font-bold text-xs px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                          title="View Worksite Details"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                        <button 
                          onClick={() => handleOpenEditModal(site)}
                          className="inline-flex items-center space-x-1 text-slate-600 hover:text-slate-900 font-bold text-xs px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Edit Worksite"
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSite(site.worksiteId)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
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
              <h2 className="text-lg font-black text-slate-900">{editingSiteId ? 'Edit Work Site' : 'Create New Work Site'}</h2>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 transition-colors">
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

              {/* Division Dropdown (Separate field box) */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">Division</label>
                <select
                  value={selectedDivision}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1E3A8A] text-sm font-semibold"
                >
                  <option value="">All Divisions</option>
                  {divisions.map((div) => (
                    <option key={div.id} value={div.id}>
                      {div.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Dropdown (Separate field box) */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">Department</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1E3A8A] text-sm font-semibold"
                >
                  <option value="">All Departments</option>
                  {departmentOptions.map((dName, idx) => (
                    <option key={idx} value={dName}>
                      {dName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assign Staff Dropdown (Separate field box) */}
              {isFieldVisible('supervisor') && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">
                      Assign Staff {isFieldRequired('supervisor') && '*'}
                    </label>
                    <span className="text-[10px] font-bold text-slate-400">
                      {filteredStaffMembers.length} available
                    </span>
                  </div>
                  <select
                    value={assignedStaffId}
                    required={isFieldRequired('supervisor')}
                    onChange={(e) => handleSelectStaff(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1E3A8A] text-sm font-semibold"
                  >
                    <option value="">-- Select Staff Member --</option>
                    {filteredStaffMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} {member.role ? `(${member.role})` : ''} {member.member_id ? `— ${member.member_id}` : ''}
                      </option>
                    ))}
                  </select>
                  {filteredStaffMembers.length === 0 && (
                    <p className="text-xs text-amber-600 font-semibold mt-1">
                      No staff members found for the selected division and department.
                    </p>
                  )}
                </div>
              )}

              {/* Render Custom Fields dynamically (excluding any Mac / custom_mac) */}
              {formConfig.filter(f => !f.isDefault && !f.isHidden && f.fieldKey !== 'custom_mac' && f.fieldLabel?.toLowerCase() !== 'mac').map(cf => (
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
                  onClick={resetForm}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#152a63] text-white font-bold rounded-xl text-sm transition-colors"
                >
                  {editingSiteId ? 'Save Changes' : 'Save Work Site'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Worksite Details Modal */}
      {viewingSite && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black tracking-wider uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {viewingSite.worksiteId || 'Worksite'}
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-1">{viewingSite.name}</h2>
              </div>
              <button 
                onClick={() => setViewingSite(null)} 
                className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Workers Count</span>
                <span className="text-sm font-bold text-slate-800 mt-0.5 block">{viewingSite.workersCount || 0} Members</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Location Address</span>
                <div className="flex items-center space-x-1.5 mt-1">
                  <MapPin size={14} className="text-slate-400 shrink-0" />
                  <span className="text-sm font-bold text-slate-800">{viewingSite.location || 'N/A'}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Assigned Staff / Supervisor</span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User size={15} className="text-[#1E3A8A]" />
                    <span className="text-sm font-extrabold text-slate-900">{viewingSite.supervisor || 'Not Assigned'}</span>
                  </div>
                  {viewingSite.contact && (
                    <div className="flex items-center space-x-1 text-xs font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      <Phone size={12} className="text-slate-400" />
                      <span>{viewingSite.contact}</span>
                    </div>
                  )}
                </div>

                {viewingSite.customFields && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/60">
                    {viewingSite.customFields.Division && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-bold border border-blue-100">
                        Division: {viewingSite.customFields.Division}
                      </span>
                    )}
                    {viewingSite.customFields.Department && (
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-bold border border-purple-100">
                        Dept: {viewingSite.customFields.Department}
                      </span>
                    )}
                    {viewingSite.customFields.Role && (
                      <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold border border-emerald-100">
                        Role: {viewingSite.customFields.Role}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {viewingSite.customFields && Object.keys(viewingSite.customFields).filter(k => !['Division', 'Department', 'Role'].includes(k)).length > 0 && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Additional Details</span>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(viewingSite.customFields)
                      .filter(([k]) => !['Division', 'Department', 'Role'].includes(k))
                      .map(([k, v]) => (
                        <div key={k} className="text-xs">
                          <span className="font-bold text-slate-500">{k}: </span>
                          <span className="text-slate-800 font-semibold">{String(v)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end space-x-3 bg-slate-50/50">
              <button
                type="button"
                onClick={() => {
                  const target = viewingSite;
                  setViewingSite(null);
                  handleOpenEditModal(target);
                }}
                className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#152a63] text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-colors"
              >
                <Edit2 size={13} />
                <span>Edit Worksite</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingSite(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
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

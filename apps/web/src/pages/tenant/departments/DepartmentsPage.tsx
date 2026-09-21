import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiFetch } from '../../../lib/api';
import {
  Building2, Plus, Search, Edit3, Users, CheckCircle2,
  AlertCircle, X, Shield, ChevronRight, Activity, ArrowUpDown, Filter, Sparkles,
  Truck, HardHat, Wallet, UserCheck, Briefcase, Award, ArrowRight, Eye, Phone, Mail,
  Layers, ChevronDown, Check, MoreVertical, SlidersHorizontal, UserPlus, FileText,
  Network, GitBranch, ArrowUpRight, Copy, RefreshCw
} from 'lucide-react';
interface RoleItem {
  id: string;
  name: string;
  department?: string;
  access_level: string;
  status?: string;
  description?: string;
}

interface Department {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  head_of_department: string | null;
  status: 'Active' | 'Inactive';
  created_at: string;
  member_count?: number;
  role_count?: number;
  roles?: RoleItem[];
}

export default function DepartmentsPage() {
  const { currentUser } = useAuth();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Add / Edit Department Modal
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptHod, setDeptHod] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptStatus, setDeptStatus] = useState<'Active' | 'Inactive'>('Active');
  const [initialRoleName, setInitialRoleName] = useState('');
  const [initialRoleAccess, setInitialRoleAccess] = useState('Operational');
  const [savingDept, setSavingDept] = useState(false);
  const [deptFormError, setDeptFormError] = useState<string | null>(null);

  // Add Role to Department Modal
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleModalDept, setRoleModalDept] = useState<Department | null>(null);
  const [roleModalName, setRoleModalName] = useState('');
  const [roleModalAccess, setRoleModalAccess] = useState('Operational');
  const [roleModalDesc, setRoleModalDesc] = useState('');
  const [savingRoleModal, setSavingRoleModal] = useState(false);
  const [roleModalError, setRoleModalError] = useState<string | null>(null);

  const fetchDepartments = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const res = await apiFetch(`/api/tenant/departments/${currentUser.uid}`);
      if (res.ok) {
        const data: Department[] = await res.json();
        setDepartments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [currentUser]);

  const handleOpenAddDept = () => {
    setEditingDept(null);
    setDeptName('');
    setDeptCode('');
    setDeptHod('');
    setDeptDesc('');
    setDeptStatus('Active');
    setInitialRoleName('');
    setInitialRoleAccess('Operational');
    setDeptFormError(null);
    setIsDeptModalOpen(true);
  };

  const handleOpenEditDept = (dept: Department, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingDept(dept);
    setDeptName(dept.name);
    setDeptCode(dept.code || '');
    setDeptHod(dept.head_of_department || '');
    setDeptDesc(dept.description || '');
    setDeptStatus(dept.status || 'Active');
    setDeptFormError(null);
    setIsDeptModalOpen(true);
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !deptName.trim()) {
      setDeptFormError('Department Name is required');
      return;
    }

    try {
      setSavingDept(true);
      setDeptFormError(null);

      const payload = {
        userUid: currentUser.uid,
        name: deptName.trim(),
        code: deptCode.trim().toUpperCase() || null,
        head_of_department: deptHod.trim() || null,
        description: deptDesc.trim() || null,
        status: deptStatus
      };

      let res: Response;
      if (editingDept) {
        res = await apiFetch(`/api/tenant/departments/${editingDept.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiFetch(`/api/tenant/departments`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save department');
      }

      const savedDept = await res.json();

      // If creating new department and an initial role was specified, auto-create it
      if (!editingDept && initialRoleName.trim()) {
        await apiFetch('/api/tenant/roles', {
          method: 'POST',
          body: JSON.stringify({
            userUid: currentUser.uid,
            name: initialRoleName.trim(),
            department: savedDept.name,
            access_level: initialRoleAccess || 'Operational',
            description: `Primary designation for ${savedDept.name}`,
            status: 'Active'
          })
        }).catch(err => console.warn('Failed to auto-create initial role:', err));
      }

      setIsDeptModalOpen(false);
      fetchDepartments();
    } catch (err: any) {
      setDeptFormError(err.message || 'An error occurred');
    } finally {
      setSavingDept(false);
    }
  };

  const handleOpenAddRoleModal = (dept: Department, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRoleModalDept(dept);
    setRoleModalName('');
    setRoleModalAccess('Operational');
    setRoleModalDesc('');
    setRoleModalError(null);
    setIsRoleModalOpen(true);
  };

  const handleSaveRoleModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !roleModalDept || !roleModalName.trim()) {
      setRoleModalError('Role title is required');
      return;
    }

    try {
      setSavingRoleModal(true);
      setRoleModalError(null);
      const res = await apiFetch(`/api/tenant/roles`, {
        method: 'POST',
        body: JSON.stringify({
          userUid: currentUser.uid,
          name: roleModalName.trim(),
          department: roleModalDept.name,
          access_level: roleModalAccess,
          description: roleModalDesc.trim() || null,
          status: 'Active'
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create role');
      }

      setIsRoleModalOpen(false);
      fetchDepartments();
    } catch (err: any) {
      setRoleModalError(err.message || 'Error creating role');
    } finally {
      setSavingRoleModal(false);
    }
  };

  const getDeptColorTheme = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('staff') || n.includes('operat')) {
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-700',
        border: 'border-emerald-500/20',
        badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        accent: '#10B981',
        icon: <HardHat size={16} className="text-emerald-700" />
      };
    }
    if (n.includes('fms') || n.includes('fleet')) {
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-700',
        border: 'border-blue-500/20',
        badge: 'bg-blue-50 text-blue-800 border-blue-200',
        accent: '#2563EB',
        icon: <Truck size={16} className="text-blue-700" />
      };
    }
    if (n.includes('acc') || n.includes('finan')) {
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-700',
        border: 'border-amber-500/20',
        badge: 'bg-amber-50 text-amber-800 border-amber-200',
        accent: '#D97706',
        icon: <Wallet size={16} className="text-amber-700" />
      };
    }
    if (n.includes('hr') || n.includes('human')) {
      return {
        bg: 'bg-pink-500/10',
        text: 'text-pink-700',
        border: 'border-pink-500/20',
        badge: 'bg-pink-50 text-pink-800 border-pink-200',
        accent: '#EC4899',
        icon: <UserCheck size={16} className="text-pink-700" />
      };
    }
    return {
      bg: 'bg-slate-500/10',
      text: 'text-slate-700',
      border: 'border-slate-500/20',
      badge: 'bg-slate-100 text-slate-800 border-slate-200',
      accent: '#475569',
      icon: <Building2 size={16} className="text-slate-700" />
    };
  };

  const getTierPill = (tier: string) => {
    switch (tier) {
      case 'Executive':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Managerial':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Technical':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Specialist':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Financial':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Operational':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const filteredDepartments = departments.filter(d => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      d.name.toLowerCase().includes(q) ||
      (d.code && d.code.toLowerCase().includes(q)) ||
      (d.head_of_department && d.head_of_department.toLowerCase().includes(q)) ||
      (d.roles && d.roles.some(r => r.name.toLowerCase().includes(q)));
    const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRolesCount = departments.reduce((acc, curr) => acc + (curr.roles?.length || curr.role_count || 0), 0);
  const totalMembersCount = departments.reduce((acc, curr) => acc + (curr.member_count || 0), 0);

  return (
    <div className="w-full space-y-4">
      {/* ── Compact Executive Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0B132B] p-4 md:p-5 text-white shadow-md border border-slate-800">
        <div className="absolute -top-16 -right-16 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
              <Sparkles size={13} />
              <span>Corporate Hierarchy & Governance</span>
            </div>
            <h1 className="text-lg md:text-xl font-black tracking-tight text-white flex items-center gap-2">
              Corporate Departments & Hierarchy
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Standardized corporate units bridging central operations, heavy fleet management (FMS), and site workforce designations.
            </p>
          </div>

          <div className="flex items-center shrink-0">
            <button
              onClick={handleOpenAddDept}
              className="inline-flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-md transition-all hover:scale-102"
            >
              <Plus size={14} />
              <span>New Department</span>
            </button>
          </div>
        </div>

        {/* Compact KPI Strip */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-3.5 border-t border-slate-800/80">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Functional Units</p>
            <p className="text-lg font-black text-white">{departments.length}</p>
            <p className="text-[10px] text-emerald-400 font-medium">Active departments</p>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Designations</p>
            <p className="text-lg font-black text-cyan-400">{totalRolesCount}</p>
            <p className="text-[10px] text-slate-400 font-medium">Total roles linked</p>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Active Staff</p>
            <p className="text-lg font-black text-amber-400">{totalMembersCount}</p>
            <p className="text-[10px] text-slate-400 font-medium">Deployed personnel</p>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Leadership</p>
            <p className="text-lg font-black text-emerald-400">
              {departments.filter(d => !!d.head_of_department).length} / {departments.length}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">Assigned HODs</p>
          </div>
        </div>
      </div>

      {/* ── Filter & Search Bar ── */}
      <div className="bg-white p-2.5 md:p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-2.5 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search department, role, or HOD..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F172A] font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-700 font-semibold"
          >
            <option value="All">All Status</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* ── MAIN CONTENT (CLEAN CORPORATE TABLE) ── */}
      {loading ? (
        <div className="py-20 text-center space-y-3 bg-white rounded-xl border border-slate-200">
          <RefreshCw size={24} className="animate-spin text-emerald-600 mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading departmental hierarchy...</p>
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-2">
          <Building2 size={36} className="text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No departments match your filter</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query, or click below to create a new department.
          </p>
          <button
            onClick={handleOpenAddDept}
            className="mt-2 inline-flex items-center space-x-1.5 bg-[#0F172A] hover:bg-slate-800 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs"
          >
            <Plus size={13} />
            <span>Create New Department</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold text-[10px] border-b border-slate-200">
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-3">Head of Dept</th>
                <th className="py-3 px-3">Roles & Designations</th>
                <th className="py-3 px-3 text-center">Staff Count</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredDepartments.map((dept) => {
                const theme = getDeptColorTheme(dept.name);
                const rolesList = dept.roles || [];

                return (
                  <tr key={dept.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Department Title & Details */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${theme.bg} ${theme.border}`}>
                          {theme.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs">{dept.name}</span>
                            {dept.code && (
                              <span className="text-[9px] font-mono font-bold uppercase px-1 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {dept.code}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1 max-w-xs mt-0.5">
                            {dept.description || 'Standard corporate operational department.'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Head of Department */}
                    <td className="py-3 px-3">
                      {dept.head_of_department ? (
                        <span className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                          <Shield size={12} className="text-slate-400" />
                          <span>{dept.head_of_department}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                      )}
                    </td>

                    {/* Linked Designations */}
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                        {rolesList.length > 0 ? (
                          rolesList.map((r) => (
                            <span
                              key={r.id}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200"
                            >
                              <span>{r.name}</span>
                              <span className={`text-[8px] font-bold uppercase px-1 py-0.2 rounded border ${getTierPill(r.access_level)}`}>
                                {r.access_level}
                              </span>
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No roles yet</span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleOpenAddRoleModal(dept, e)}
                          className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 transition-colors"
                        >
                          <Plus size={10} />
                          <span>Add Role</span>
                        </button>
                      </div>
                    </td>

                    {/* Staff Count */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                        <Users size={11} className="text-blue-600" />
                        <span>{dept.member_count || 0}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${dept.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dept.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {dept.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleOpenAddRoleModal(dept, e)}
                          className="px-2.5 py-1 text-[11px] font-bold bg-[#0F172A] hover:bg-slate-800 text-white rounded-md flex items-center gap-1 shadow-2xs"
                        >
                          <Plus size={11} />
                          <span>Role</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditDept(dept, e)}
                          className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 flex items-center gap-1 text-[11px] font-semibold"
                          title="Edit Department"
                        >
                          <Edit3 size={12} />
                          <span>Edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add / Edit Department Modal ── */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#0F172A] text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Building2 size={18} className="text-emerald-400" />
                <h3 className="font-bold text-sm text-white">
                  {editingDept ? 'Edit Department' : 'New Department'}
                </h3>
              </div>
              <button
                onClick={() => setIsDeptModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDepartment} className="p-4 space-y-3">
              {deptFormError && (
                <div className="bg-rose-50 text-rose-700 text-xs p-2 rounded-lg border border-rose-200 flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{deptFormError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operational Staff, Accounts, HR, FMS"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F172A] font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Code / Abbr.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. OPS, FMS"
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F172A] font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={deptStatus}
                    onChange={(e: any) => setDeptStatus(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F172A] font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Head of Department (HOD)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Kumar"
                  value={deptHod}
                  onChange={(e) => setDeptHod(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F172A] font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Operational Responsibilities
                </label>
                <textarea
                  rows={2}
                  placeholder="Briefly outline department scope..."
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F172A] resize-none"
                />
              </div>

              {/* Initial Role (when creating department) */}
              {!editingDept && (
                <div className="pt-2 border-t border-slate-100 bg-slate-50/60 -mx-4 px-4 py-2.5 space-y-2">
                  <div className="flex items-center space-x-1.5 text-emerald-700">
                    <Award size={13} />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Initial Designation (Optional)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Site Supervisor"
                      value={initialRoleName}
                      onChange={(e) => setInitialRoleName(e.target.value)}
                      className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-medium"
                    />
                    <select
                      value={initialRoleAccess}
                      onChange={(e) => setInitialRoleAccess(e.target.value)}
                      className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-medium"
                    >
                      <option value="Operational">Operational Tier</option>
                      <option value="Managerial">Managerial Tier</option>
                      <option value="Executive">Executive Tier</option>
                      <option value="Specialist">Specialist Tier</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="pt-1 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDept}
                  className="px-4 py-1.5 text-xs font-bold bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg shadow-sm flex items-center gap-1"
                >
                  {savingDept ? (
                    <RefreshCw size={13} className="animate-spin text-emerald-400" />
                  ) : (
                    <Check size={13} className="text-emerald-400" />
                  )}
                  <span>{editingDept ? 'Update Department' : 'Create Department'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Role to Department Modal ── */}
      {isRoleModalOpen && roleModalDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#0F172A] text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Award size={18} className="text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm text-white">Add Designation</h3>
                  <p className="text-[10px] text-slate-300">Adding to <strong className="text-emerald-400">{roleModalDept.name}</strong></p>
                </div>
              </div>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRoleModal} className="p-4 space-y-3">
              {roleModalError && (
                <div className="bg-rose-50 text-rose-700 text-xs p-2 rounded-lg border border-rose-200 flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{roleModalError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Designation / Role Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Heavy Crane Operator, QC Engineer"
                  value={roleModalName}
                  onChange={(e) => setRoleModalName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F172A] font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    disabled
                    value={roleModalDept.name}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Role Tier
                  </label>
                  <select
                    value={roleModalAccess}
                    onChange={(e) => setRoleModalAccess(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F172A] font-bold"
                  >
                    <option value="Operational">Operational</option>
                    <option value="Managerial">Managerial</option>
                    <option value="Executive">Executive</option>
                    <option value="Specialist">Specialist</option>
                    <option value="Financial">Financial</option>
                    <option value="Technical">Technical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  Operational Remit / Scope
                </label>
                <textarea
                  rows={2}
                  placeholder="Briefly describe what this role does..."
                  value={roleModalDesc}
                  onChange={(e) => setRoleModalDesc(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0F172A] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRoleModal}
                  className="px-4 py-1.5 text-xs font-bold bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg shadow-sm flex items-center gap-1"
                >
                  {savingRoleModal ? (
                    <RefreshCw size={13} className="animate-spin text-emerald-400" />
                  ) : (
                    <Check size={13} className="text-emerald-400" />
                  )}
                  <span>Create Designation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

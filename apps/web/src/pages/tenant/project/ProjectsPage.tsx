import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Plus, Search, Filter, Play, CheckCircle2, Clock, DollarSign, Users, MapPin, X, Calendar, Layers, MoreVertical, Trash2, Pin } from 'lucide-react';
interface Project {
  id: string;
  name: string;
  location: string;
  locationBlock: string;
  customer: string;
  commodity: string;
  contractQuantity: string;
  contractQuantityUnit: string;
  contractStartDate: string;
  contractEndDate: string;
  otherData?: string;
  status: 'Active' | 'Completed' | 'Planning' | 'On Hold';
  is_pinned?: boolean;
  customFields?: Record<string, any>;
}

export default function ProjectsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [worksiteFilter, setWorksiteFilter] = useState<string>('All');
  const [worksitesList, setWorksitesList] = useState<string[]>([
    'Head Office Main Site',
    'Hitec City Phase-1 Site',
    'Highway Overpass Site',
    'North Block Yard',
    'South Storage Batching Yard'
  ]);
  const [isAddWorksiteModalOpen, setIsAddWorksiteModalOpen] = useState(false);
  const [newWorksiteName, setNewWorksiteName] = useState('');
  const [newWorksiteProject, setNewWorksiteProject] = useState('');
  const [newWorksiteSupervisor, setNewWorksiteSupervisor] = useState('');





  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const fetchProjects = () => {
    if (currentUser) {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;
      
      fetch(`${host}/api/tenant/projects/${currentUser.uid}`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Failed to fetch projects');
        })
        .then(data => {
          setProjects(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [currentUser]);

  const filteredProjects = projects.filter(prj => {
    const matchesSearch = prj.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prj.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prj.locationBlock.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prj.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prj.commodity.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (prj.contractQuantityUnit && prj.contractQuantityUnit.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (prj.customFields && JSON.stringify(prj.customFields).toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || prj.status === statusFilter;
    const matchesWorksite = worksiteFilter === 'All' || 
                            prj.location === worksiteFilter || 
                            prj.locationBlock === worksiteFilter || 
                            String(prj.customFields?.worksite || '').includes(worksiteFilter);
    return matchesSearch && matchesStatus && matchesWorksite;
  });

  const handleDeleteProject = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;
    fetch(`${host}/api/tenant/projects/${id}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) fetchProjects();
        else alert('Failed to delete project');
      })
      .catch(err => console.error(err));
  };

  const handleTogglePin = (id: string, currentPinStatus: boolean = false) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;
    fetch(`${host}/api/tenant/projects/${id}/pin`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPinned: !currentPinStatus })
    })
      .then(res => {
        if (res.ok) {
          fetchProjects();
          setOpenMenuId(null);
          alert(currentPinStatus ? 'Project Unpinned from Dashboard!' : 'Project Pinned to Dashboard!');
        } else alert('Failed to update pin status');
      })
      .catch(err => console.error(err));
  };



  return (
    <div className="space-y-6 relative">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Projects Management</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Define, schedule, and track construction worksites.</p>
        </div>
        <button
          onClick={() => navigate('/tenant/project-management/new')}
          className="flex items-center justify-center px-4 py-2.5 bg-[#1E3A8A] hover:bg-[#152a63] text-white font-bold rounded-xl text-sm transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus size={16} className="mr-2" />
          Create Project
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Briefcase} label="Total Projects" value={projects.length} subtext="System workspace" color="text-blue-600 bg-blue-50 border-blue-100" />
        <MetricCard icon={Play} label="Active" value={projects.filter(p => p.status === 'Active').length} subtext="In execution" color="text-emerald-600 bg-emerald-50 border-emerald-100" />
        <MetricCard icon={Clock} label="Planning & Hold" value={projects.filter(p => p.status === 'Planning' || p.status === 'On Hold').length} subtext="Awaiting sync" color="text-amber-600 bg-amber-50 border-amber-100" />
        <MetricCard icon={CheckCircle2} label="Completed" value={projects.filter(p => p.status === 'Completed').length} subtext="Successfully delivered" color="text-indigo-600 bg-indigo-50 border-indigo-100" />
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, location, block, customer, cargo or unit..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1E3A8A] text-sm font-medium text-slate-800 placeholder-slate-400"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Worksite Dropdown */}
          <div className="flex items-center space-x-2">
            <MapPin size={16} className="text-slate-400 shrink-0" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Worksite:</span>
            <select
              value={worksiteFilter}
              onChange={(e) => setWorksiteFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">All Worksites</option>
              {worksitesList.map((ws, idx) => (
                <option key={idx} value={ws}>{ws}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-slate-400 shrink-0" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">All Projects</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Planning">Planning</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase size={24} className="text-slate-400" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Projects Found</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 font-medium">Get started by creating your first construction project tracker.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[9px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-1.5 px-2 text-center w-8">#</th>
                  <th className="py-1.5 px-2 w-20">ID</th>
                  <th className="py-1.5 px-2 min-w-[120px]">Project Name</th>
                  <th className="py-1.5 px-2">Location</th>
                  <th className="py-1.5 px-2">Client</th>
                  <th className="py-1.5 px-2">Cargo</th>
                  <th className="py-1.5 px-2 text-right">Qty</th>
                  <th className="py-1.5 px-2">Contract Period</th>
                  <th className="py-1.5 px-2">Status</th>
                  <th className="py-1.5 px-2 text-center w-10">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px] font-medium text-slate-700">
                {filteredProjects.map((prj, idx) => (
                  <tr key={prj.id} className="bg-white hover:bg-slate-50/80 transition-colors">
                    <td className="py-1.5 px-2 text-center text-slate-400 font-bold text-[10px]">{idx + 1}</td>
                    <td className="py-1.5 px-2">
                      <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-700 font-bold text-[9px] rounded border border-slate-200 tracking-wider">
                        {prj.id}
                      </span>
                    </td>
                    <td className="py-1.5 px-2">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => navigate(`/tenant/project-management/${prj.id}`)}
                          className="font-bold text-[#1E3A8A] hover:underline text-left focus:outline-none"
                        >
                          {prj.name}
                        </button>
                        {prj.is_pinned && (
                          <span className="text-[8px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                            PINNED
                          </span>
                        )}
                      </div>
                      {prj.customFields && Object.keys(prj.customFields).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {Object.entries(prj.customFields).map(([k, v]: [string, any]) => (
                            <span key={k} className="text-[8px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-medium border border-slate-200">
                              <strong>{k}:</strong> {v}
                            </span>
                          ))}
                        </div>
                      )}
                      {prj.otherData && <p className="text-[9px] text-slate-400 font-medium">{prj.otherData}</p>}
                    </td>
                    <td className="py-1.5 px-2">
                      <div className="flex items-center space-x-1">
                        <MapPin size={11} className="text-slate-400 shrink-0" />
                        <span>{prj.location} {prj.locationBlock ? `(${prj.locationBlock})` : ''}</span>
                      </div>
                    </td>
                    <td className="py-1.5 px-2">
                      <div className="flex items-center space-x-1">
                        <Users size={11} className="text-slate-400 shrink-0" />
                        <span>{prj.customer || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-1.5 px-2">
                      <div className="flex items-center space-x-1">
                        <Layers size={11} className="text-slate-400 shrink-0" />
                        <span>{prj.commodity}</span>
                      </div>
                    </td>
                    <td className="py-1.5 px-2 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Briefcase size={11} className="text-slate-400 shrink-0" />
                        <span>{prj.contractQuantity ? `${prj.contractQuantity} ${prj.contractQuantityUnit || ''}` : 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-1.5 px-2 text-slate-500 font-medium">
                      {prj.contractStartDate ? `${prj.contractStartDate} to ${prj.contractEndDate}` : 'N/A'}
                    </td>
                    <td className="py-1.5 px-2">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                        {prj.status}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-center relative">
                      <button 
                        onClick={() => setOpenMenuId(openMenuId === prj.id ? null : prj.id)}
                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                      >
                        <MoreVertical size={14} />
                      </button>
                      {openMenuId === prj.id && (
                        <div className="absolute right-4 top-10 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1">
                          <button 
                            onClick={() => {
                              setOpenMenuId(null);
                              handleTogglePin(prj.id, prj.is_pinned);
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center"
                          >
                            <Pin size={12} className="mr-2 text-slate-400" />
                            {prj.is_pinned ? 'Unpin from Dashboard' : 'Pin to Dashboard'}
                          </button>
                          <button 
                            onClick={() => {
                              setOpenMenuId(null);
                              handleDeleteProject(prj.id);
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center"
                          >
                            <Trash2 size={12} className="mr-2 text-red-400" />
                            Delete Project
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

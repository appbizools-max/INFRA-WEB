import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { 
  ArrowLeft, Calendar, MapPin, Users, Layers, Briefcase, 
  BarChart3, CheckSquare, Plus, Clock, MessageSquare, 
  Trash2, UserPlus, FileText, CheckCircle2, AlertCircle, Edit, Save, Trash
} from 'lucide-react';

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

interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

interface ActivityLog {
  id: string;
  user: string;
  action: string;
  timestamp: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
}

export default function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'team' | 'feed' | 'edit'>('overview');

  // Interactive Widgets State (persisted in LocalStorage for sandbox mockup or direct editing)
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');

  const [team, setTeam] = useState<TeamMember[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');

  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [newPost, setNewPost] = useState('');

  // Editing Project States
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editLocationBlock, setEditLocationBlock] = useState('');
  const [editCustomer, setEditCustomer] = useState('');
  const [editCommodity, setEditCommodity] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editStatus, setEditStatus] = useState<Project['status']>('Planning');
  const [editOther, setEditOther] = useState('');
  const [savingProject, setSavingProject] = useState(false);

  const host = (() => {
    const b = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return b.startsWith('http://localhost:3001') ? 'http://localhost:5000' : b;
  })();

  const fetchProjectData = async () => {
    try {
      const res = await fetch(`${host}/api/tenant/project/${id}`);
      if (res.ok) {
        const data: Project = await res.json();
        setProject(data);
        
        // Initialize editing states
        setEditName(data.name || '');
        setEditLocation(data.location || '');
        setEditLocationBlock(data.locationBlock || '');
        setEditCustomer(data.customer || '');
        setEditCommodity(data.commodity || '');
        setEditQuantity(data.contractQuantity || '');
        setEditUnit(data.contractQuantityUnit || '');
        setEditStart(data.contractStartDate || '');
        setEditEnd(data.contractEndDate || '');
        setEditStatus(data.status || 'Planning');
        setEditOther(data.otherData || '');
      } else {
        console.error('Failed to fetch project details');
      }
    } catch (err) {
      console.error('Error fetching project:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    if (!currentUser) return;
    try {
      const teamRes = await fetch(`${host}/api/tenant/team/${currentUser.uid}`);
      if (teamRes.ok) {
        const data = await teamRes.json();
        setAvailableEmployees(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProjectData();
      fetchTeamMembers();
      
      // Load milestones, team, activities from LocalStorage specific to this project
      const storedMilestones = localStorage.getItem(`project_milestones_${id}`);
      if (storedMilestones) setMilestones(JSON.parse(storedMilestones));
      else {
        const defaultMilestones = [
          { id: '1', title: 'Site Inspection & Geofencing Setup', dueDate: '2026-08-20', completed: true },
          { id: '2', title: 'Arrival of First Material Shipment', dueDate: '2026-09-05', completed: false },
          { id: '3', title: 'Phase 1 Construction Completion', dueDate: '2026-11-15', completed: false }
        ];
        setMilestones(defaultMilestones);
        localStorage.setItem(`project_milestones_${id}`, JSON.stringify(defaultMilestones));
      }

      const storedTeam = localStorage.getItem(`project_team_${id}`);
      if (storedTeam) setTeam(JSON.parse(storedTeam));
      else {
        const defaultTeam = [
          { id: 't1', name: 'Rakesh Kumar', role: 'Project Manager' },
          { id: 't2', name: 'Srinivas Rao', role: 'Site Supervisor' }
        ];
        setTeam(defaultTeam);
        localStorage.setItem(`project_team_${id}`, JSON.stringify(defaultTeam));
      }

      const storedActivities = localStorage.getItem(`project_activities_${id}`);
      if (storedActivities) setActivities(JSON.parse(storedActivities));
      else {
        const defaultActivities = [
          { id: 'a1', user: 'Rakesh Kumar', action: 'initialized the project scope and set contract boundaries.', timestamp: 'Aug 10, 2026, 10:30 AM' },
          { id: 'a2', user: 'System', action: 'added geofencing parameters for the worksite location.', timestamp: 'Aug 11, 2026, 09:15 AM' }
        ];
        setActivities(defaultActivities);
        localStorage.setItem(`project_activities_${id}`, JSON.stringify(defaultActivities));
      }
    }
  }, [id, currentUser]);

  const saveMilestones = (updated: Milestone[]) => {
    setMilestones(updated);
    localStorage.setItem(`project_milestones_${id}`, JSON.stringify(updated));
  };

  const saveTeam = (updated: TeamMember[]) => {
    setTeam(updated);
    localStorage.setItem(`project_team_${id}`, JSON.stringify(updated));
  };

  const saveActivities = (updated: ActivityLog[]) => {
    setActivities(updated);
    localStorage.setItem(`project_activities_${id}`, JSON.stringify(updated));
  };

  // Add Milestone
  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;
    const newM: Milestone = {
      id: Date.now().toString(),
      title: newMilestoneTitle,
      dueDate: newMilestoneDate || new Date().toISOString().split('T')[0],
      completed: false
    };
    const updated = [...milestones, newM];
    saveMilestones(updated);
    setNewMilestoneTitle('');
    setNewMilestoneDate('');
  };

  // Toggle Milestone Completion
  const toggleMilestone = (milestoneId: string) => {
    const updated = milestones.map(m => m.id === milestoneId ? { ...m, completed: !m.completed } : m);
    saveMilestones(updated);
  };

  // Delete Milestone
  const deleteMilestone = (milestoneId: string) => {
    const updated = milestones.filter(m => m.id !== milestoneId);
    saveMilestones(updated);
  };

  // Add Team Member
  const handleAddTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) return;
    const emp = availableEmployees.find(e => e.id === selectedEmpId);
    if (!emp) return;
    if (team.some(t => t.id === emp.id)) {
      alert('Employee already assigned to this project.');
      return;
    }
    const newMember: TeamMember = {
      id: emp.id,
      name: emp.name,
      role: emp.role || 'Team Member'
    };
    const updated = [...team, newMember];
    saveTeam(updated);
    setSelectedEmpId('');
  };

  // Remove Team Member
  const handleRemoveTeamMember = (memberId: string) => {
    const updated = team.filter(t => t.id !== memberId);
    saveTeam(updated);
  };

  // Add Activity Log
  const handleAddPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    const log: ActivityLog = {
      id: Date.now().toString(),
      user: currentUser?.email?.split('@')[0] || 'Manager',
      action: `added update note: "${newPost}"`,
      timestamp: new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
    };
    const updated = [log, ...activities];
    saveActivities(updated);
    setNewPost('');
  };

  // Save Project Changes
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setSavingProject(true);
    try {
      const res = await fetch(`${host}/api/tenant/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          location: editLocation,
          locationBlock: editLocationBlock,
          customer: editCustomer,
          commodity: editCommodity,
          contractQuantity: editQuantity,
          contractQuantityUnit: editUnit,
          contractStartDate: editStart,
          contractEndDate: editEnd,
          status: editStatus,
          otherData: editOther
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setProject(updated);
        // Add action feed log
        const log: ActivityLog = {
          id: Date.now().toString(),
          user: currentUser?.email?.split('@')[0] || 'Manager',
          action: 'updated project configuration settings.',
          timestamp: new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
        };
        saveActivities([log, ...activities]);
        alert('Project updated successfully.');
        setActiveTab('overview');
      } else {
        alert('Failed to save project updates.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating project details.');
    } finally {
      setSavingProject(false);
    }
  };

  // Delete Project Entirely
  const handleDeleteProject = async () => {
    if (!project) return;
    if (!window.confirm('Are you sure you want to delete this project permanently? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${host}/api/tenant/projects/${project.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('Project deleted successfully.');
        navigate('/tenant/project-management');
      } else {
        alert('Failed to delete project.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
        <AlertCircle size={36} className="text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-black text-slate-800">Project Not Found</h2>
        <p className="text-xs text-slate-500 font-medium mt-1">This project does not exist or has been deleted.</p>
        <button onClick={() => navigate('/tenant/project-management')} className="mt-5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800">
          Back to Projects
        </button>
      </div>
    );
  }

  const durationDays = project.contractStartDate && project.contractEndDate
    ? Math.max(0, Math.ceil((new Date(project.contractEndDate).getTime() - new Date(project.contractStartDate).getTime()) / 86400000))
    : 0;

  const progressPercentage = milestones.length > 0 
    ? Math.round((milestones.filter(m => m.completed).length / milestones.length) * 100) 
    : 0;

  return (
    <div className="animate-in fade-in duration-200 pb-12">
      {/* Back Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/tenant/project-management')}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
              {project.name}
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                project.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                project.status === 'Completed' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                project.status === 'On Hold' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {project.status}
              </span>
            </h1>
            <p className="text-sm text-slate-400 font-semibold mt-0.5">ID: {project.id} · Created at {project.locationBlock || 'General Block'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-1 mb-6">
        {[
          { id: 'overview', label: 'Overview', icon: Briefcase },
          { id: 'milestones', label: `Milestones (${milestones.filter(m => m.completed).length}/${milestones.length})`, icon: CheckSquare },
          { id: 'team', label: `Assigned Team (${team.length})`, icon: Users },
          { id: 'feed', label: 'Activity Feed', icon: MessageSquare },
          { id: 'edit', label: 'Edit Settings', icon: Edit }
        ].map(t => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-black uppercase tracking-wider transition-all ${
                active ? 'border-[#1E3A8A] text-[#1E3A8A]' : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="grid grid-cols-3 gap-6">
        
        {/* Main Column */}
        <div className="col-span-2 space-y-6">
          
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Basic Details Grid */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Location</h3>
                  <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <MapPin size={16} className="text-slate-400" />
                    <span>{project.location} {project.locationBlock ? `(${project.locationBlock})` : ''}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Client / Customer</h3>
                  <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <Users size={16} className="text-slate-400" />
                    <span>{project.customer || 'No Client Assigned'}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Commodity / Cargo</h3>
                  <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <Layers size={16} className="text-slate-400" />
                    <span>{project.commodity || 'None'}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Quantity Target</h3>
                  <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <BarChart3 size={16} className="text-slate-400" />
                    <span>{project.contractQuantity ? `${project.contractQuantity} ${project.contractQuantityUnit}` : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Timeline Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Contract Timeline</h3>
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Start Date</span>
                    <span className="text-sm font-black text-slate-800 mt-1 block">{project.contractStartDate || '—'}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">End Date</span>
                    <span className="text-sm font-black text-slate-800 mt-1 block">{project.contractEndDate || '—'}</span>
                  </div>
                  <div className="bg-blue-50/50 border border-blue-100/70 rounded-xl p-3.5 text-center">
                    <span className="text-[10px] text-[#1E3A8A] font-bold uppercase tracking-wider block">Duration</span>
                    <span className="text-sm font-black text-[#1E3A8A] mt-1 block">{durationDays} Days</span>
                  </div>
                </div>
              </div>

              {/* Custom fields (if exist) */}
              {project.customFields && Object.keys(project.customFields).length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Custom Configuration Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(project.customFields).map(([k, v]) => (
                      <div key={k} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">{k}</span>
                        <span className="text-xs font-black text-slate-700 mt-0.5 block">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Remarks/Remarks */}
              {project.otherData && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Remarks & Remarks</h3>
                  <p className="text-xs font-bold text-slate-600 leading-relaxed bg-slate-50 p-4 border border-slate-100 rounded-xl">{project.otherData}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'milestones' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Project Milestones</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Track deliverables and stages of completion.</p>
                </div>
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {progressPercentage}% Complete
                </span>
              </div>

              {/* Milestone progress bar */}
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
              </div>

              {/* Milestone list */}
              <div className="space-y-3">
                {milestones.length > 0 ? (
                  milestones.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={m.completed}
                          onChange={() => toggleMilestone(m.id)}
                          className="w-4 h-4 text-[#1E3A8A] rounded border-slate-350 focus:ring-[#1E3A8A] cursor-pointer"
                        />
                        <div>
                          <span className={`text-xs font-bold ${m.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                            {m.title}
                          </span>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Target: {m.dueDate}</p>
                        </div>
                      </div>
                      <button onClick={() => deleteMilestone(m.id)} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 font-semibold text-center py-6">No milestones defined yet.</p>
                )}
              </div>

              {/* Add Milestone Form */}
              <form onSubmit={handleAddMilestone} className="border-t border-slate-100 pt-5 flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">New Milestone Deliverable</label>
                  <input
                    type="text" value={newMilestoneTitle} onChange={e => setNewMilestoneTitle(e.target.value)}
                    placeholder="e.g. Electrical integration complete"
                    className="w-full px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Due Date</label>
                  <input
                    type="date" value={newMilestoneDate} onChange={e => setNewMilestoneDate(e.target.value)}
                    className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                  />
                </div>
                <button type="submit" className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 flex items-center justify-center">
                  <Plus size={16} />
                </button>
              </form>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div>
                <h3 className="text-sm font-black text-slate-900">Project Staff Allocations</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Assign managers, operators, and staff to this worksite.</p>
              </div>

              {/* Assigned list */}
              <div className="grid grid-cols-2 gap-4">
                {team.length > 0 ? (
                  team.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <div>
                        <span className="text-xs font-black text-slate-800">{m.name}</span>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{m.role}</p>
                      </div>
                      <button onClick={() => handleRemoveTeamMember(m.id)} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 font-semibold col-span-2 text-center py-6">No staff assigned to this project.</p>
                )}
              </div>

              {/* Add member form */}
              <form onSubmit={handleAddTeamMember} className="border-t border-slate-100 pt-5 flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Select Employee</label>
                  <select
                    value={selectedEmpId}
                    onChange={e => setSelectedEmpId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    <option value="">Select an employee...</option>
                    {availableEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.role || 'No designation'})</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 flex items-center gap-1.5">
                  <UserPlus size={13} />
                  Assign
                </button>
              </form>
            </div>
          )}

          {activeTab === 'feed' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div>
                <h3 className="text-sm font-black text-slate-900">Project Feed & Logs</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Post work reports, updates, or comments relating to this project.</p>
              </div>

              {/* Post box */}
              <form onSubmit={handleAddPost} className="flex gap-2">
                <input
                  type="text" value={newPost} onChange={e => setNewPost(e.target.value)}
                  placeholder="Post a status update or log entry..."
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800">
                  Post
                </button>
              </form>

              {/* Feed List */}
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {activities.length > 0 ? (
                  activities.map(act => (
                    <div key={act.id} className="flex gap-3 text-xs bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[#1E3A8A] shrink-0 mt-0.5 text-[10px]">
                        {act.user.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-slate-800 font-bold">
                          {act.user} <span className="text-slate-500 font-semibold">{act.action}</span>
                        </p>
                        <p className="text-[9px] text-slate-400 font-semibold mt-1 flex items-center gap-1">
                          <Clock size={9} /> {act.timestamp}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 font-semibold text-center py-6">No activity records found.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'edit' && (
            <form onSubmit={handleSaveProject} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div>
                <h3 className="text-sm font-black text-slate-900">Project Configuration</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Modify original contract boundaries or identity parameters.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Project Name</label>
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs font-semibold bg-slate-50" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Location</label>
                    <input type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs font-semibold bg-slate-50" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Location Block</label>
                    <input type="text" value={editLocationBlock} onChange={e => setEditLocationBlock(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs font-semibold bg-slate-50" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Client / Customer</label>
                    <input type="text" value={editCustomer} onChange={e => setEditCustomer(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs font-semibold bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Commodity</label>
                    <input type="text" value={editCommodity} onChange={e => setEditCommodity(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs font-semibold bg-slate-50" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Contract Quantity</label>
                    <input type="text" value={editQuantity} onChange={e => setEditQuantity(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs font-semibold bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Unit</label>
                    <input type="text" value={editUnit} onChange={e => setEditUnit(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs font-semibold bg-slate-50" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Start Date</label>
                    <input type="date" value={editStart} onChange={e => setEditStart(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs font-semibold bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">End Date</label>
                    <input type="date" value={editEnd} onChange={e => setEditEnd(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs font-semibold bg-slate-50" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Remarks & Details</label>
                  <textarea value={editOther} onChange={e => setEditOther(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-xs font-semibold bg-slate-50 resize-none" rows={3} />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Status</label>
                    <select value={editStatus} onChange={e => setEditStatus(e.target.value as any)} className="w-full px-3 py-2 border rounded-xl text-xs font-semibold bg-slate-50 cursor-pointer">
                      <option value="Planning">Planning</option>
                      <option value="Active">Active</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div className="pt-5 shrink-0">
                    <button type="button" onClick={handleDeleteProject} className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5">
                      <Trash size={13} />
                      Delete Project
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button type="button" onClick={() => setActiveTab('overview')} className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200">
                  Cancel
                </button>
                <button type="submit" disabled={savingProject} className="px-4 py-2 bg-slate-900 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-slate-800 flex items-center gap-1.5">
                  <Save size={13} />
                  {savingProject ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Sidebar Info Card Widget */}
        <div className="space-y-6">
          {/* Status and Action Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-[#1E3A8A] mx-auto">
              <Briefcase size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Project Tracking Target</p>
              <h2 className="text-xl font-black text-slate-800 mt-1">
                {project.contractQuantity ? `${project.contractQuantity} ${project.contractQuantityUnit}` : 'Unlimited Scope'}
              </h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Commodity: {project.commodity}</p>
            </div>
            
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Client Account</span>
              <span className="text-xs font-black text-slate-700 mt-0.5 block truncate">{project.customer || 'Internal System'}</span>
            </div>

            <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] font-bold">
              <Calendar size={11} />
              <span>{project.contractStartDate || 'No start date'} to {project.contractEndDate || 'No end date'}</span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Project Health</h3>
            
            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                  <span>Milestone Completion</span>
                  <span>{progressPercentage}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${progressPercentage}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                  <span>Staff Allocated</span>
                  <span>{team.length} Active</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, team.length * 20)}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

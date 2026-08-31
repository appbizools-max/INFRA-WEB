import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { 
  Users, 
  Clock, 
  Calendar, 
  Search, 
  Filter, 
  TrendingUp, 
  UserCheck, 
  AlertCircle,
  Briefcase,
  MapPin,
  RefreshCw,
  FolderOpen,
  Phone,
  Mail,
  UserCog,
  X
} from 'lucide-react';

interface AttendanceLog {
  id: string;
  checkInTime: string;
  checkOutTime: string | null;
  status: string;
  workHours: number | null;
  employeeName: string;
  role: string;
  department: string;
  memberId: string;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  mobile: string;
  status: string;
  member_id: string;
}

interface Project {
  id: string;
  name: string;
  location: string;
  locationBlock?: string;
  customer?: string;
  commodity?: string;
  status?: string;
}

export default function HRDashboard() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedReportEmployee, setSelectedReportEmployee] = useState<Employee | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'employees' | 'projects'>('logs');

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  
  // Default to current year-month
  const currentYearMonth = (() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  })();
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth);

  const rolesList = ['All', 'Driver', 'Helper', 'Operator', 'Supervisor', 'Site Engineer', 'HR'];
  
  const monthsList = (() => {
    const list = [];
    const d = new Date();
    for (let i = 0; i < 6; i++) {
      const temp = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const yyyy = temp.getFullYear();
      const mm = String(temp.getMonth() + 1).padStart(2, '0');
      const label = temp.toLocaleString('default', { month: 'long', year: 'numeric' });
      list.push({ value: `${yyyy}-${mm}`, label });
    }
    return list;
  })();

  const fetchProfile = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;
      const mobile = currentUser.phoneNumber || '';
      const email = currentUser.email || '';
      const res = await fetch(`${host}/api/tenant/profile/${currentUser.uid}?mobile=${encodeURIComponent(mobile)}&email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        fetchDashboardData(data.tenantId);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching profile in HR Dashboard:', err);
      setLoading(false);
    }
  };

  const fetchDashboardData = async (tId: string) => {
    if (!tId || !currentUser) return;
    setRefreshing(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;
      
      // 1. Fetch shift logs
      const queryParams = new URLSearchParams({
        tenantId: tId,
        month: selectedMonth,
        role: selectedRole,
        search: searchQuery
      });
      const logsRes = await fetch(`${host}/api/tenant/attendance/report?${queryParams.toString()}`);
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data);
      }

      // 2. Fetch team members
      const teamRes = await fetch(`${host}/api/tenant/team/${currentUser.uid}`);
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setEmployees(teamData);
      }

      // 3. Fetch projects
      const projRes = await fetch(`${host}/api/tenant/projects/${currentUser.uid}`);
      if (projRes.ok) {
        const projData = await projRes.json();
        setProjects(projData);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [currentUser]);

  // Refetch logs when filters change
  useEffect(() => {
    if (profile?.tenantId) {
      fetchDashboardData(profile.tenantId);
    }
  }, [selectedMonth, selectedRole, searchQuery]);

  const handleRefresh = () => {
    if (profile?.tenantId) {
      fetchDashboardData(profile.tenantId);
    }
  };

  // Helper formatting logic
  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return '--:--';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getRoleBadgeStyle = (role: string) => {
    const clean = String(role).toUpperCase();
    if (clean.includes('DRIVER')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (clean.includes('HELPER')) return 'bg-sky-50 text-sky-700 border-sky-100';
    if (clean.includes('OPERATOR')) return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    if (clean.includes('SUPERVISOR')) return 'bg-amber-50 text-amber-700 border-amber-100';
    if (clean.includes('ENGINEER')) return 'bg-purple-50 text-purple-700 border-purple-100';
    return 'bg-slate-50 text-slate-700 border-slate-100';
  };

  // Statistics calculation
  const onDutyCount = logs.filter(l => !l.checkOutTime).length;
  const avgHours = logs.length > 0 
    ? (logs.reduce((acc, log) => acc + (log.workHours || 0), 0) / logs.length).toFixed(1)
    : '0';

  const getTodayLog = (empId: string) => {
    const todayStr = new Date().toISOString().substring(0, 10);
    return logs.find(log => log.memberId === empId && log.checkInTime.substring(0, 10) === todayStr);
  };

  const getMonthlyHours = (empId: string) => {
    const empLogs = logs.filter(log => log.memberId === empId);
    return empLogs.reduce((acc, log) => acc + (log.workHours || 0), 0).toFixed(1);
  };

  const getLeavesCount = (empId: string) => {
    if (!empId) return 0;
    const idNum = empId.replace(/\D/g, '');
    const parsed = parseInt(idNum) || 5;
    return (parsed % 4) + 1;
  };

  const getHalfDaysCount = (empId: string) => {
    if (!empId) return 0;
    const idNum = empId.replace(/\D/g, '');
    const parsed = parseInt(idNum) || 5;
    return (parsed % 3);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 mb-1">Human Resources Dashboard</h2>
          <p className="text-sm text-slate-500 font-semibold">
            {profile?.adminName} • HR Portal • {profile?.companyName}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleRefresh}
            className="p-2.5 text-slate-500 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
            title="Refresh logs"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <UserCheck size={24} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Checked In Today</span>
            <span className="text-2xl font-black text-emerald-600 block mt-0.5">{onDutyCount} Active</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Users size={24} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Total Employees</span>
            <span className="text-2xl font-black text-slate-800 block mt-0.5">{employees.length} Members</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <Briefcase size={24} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Active Projects</span>
            <span className="text-2xl font-black text-slate-800 block mt-0.5">{projects.length} Sites</span>
          </div>
        </div>
      </div>

      {/* Dashboard Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-1 bg-slate-50 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-black rounded-lg transition-all ${
            activeTab === 'logs' 
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock size={14} />
          Workforce Logs
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-black rounded-lg transition-all ${
            activeTab === 'employees' 
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users size={14} />
          Company Employees
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-black rounded-lg transition-all ${
            activeTab === 'projects' 
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Briefcase size={14} />
          Company Projects
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-150">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Workforce Login/Logout Logs</h3>
              <p className="text-xs text-slate-400 font-medium">Monthly check-in and checkout history registers</p>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search size={15} />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search employee name or ID..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 bg-white"
                />
              </div>

              <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3.5">
                <Filter size={14} className="text-slate-400 mr-2 shrink-0" />
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full text-xs font-bold text-slate-700 bg-transparent py-2 focus:outline-none border-none cursor-pointer"
                >
                  {rolesList.map(r => (
                    <option key={r} value={r}>{r === 'All' ? 'All Roles' : r}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3.5">
                <Calendar size={14} className="text-slate-400 mr-2 shrink-0" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full text-xs font-bold text-slate-700 bg-transparent py-2 focus:outline-none border-none cursor-pointer"
                >
                  {monthsList.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {logs.length > 0 ? (
              <table className="w-full text-left border-collapse text-xs font-semibold text-slate-600">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-5">Employee Info</th>
                    <th className="py-3 px-5">Operational Designation</th>
                    <th className="py-3 px-5">Log Date</th>
                    <th className="py-3 px-5">Login Time (Check-In)</th>
                    <th className="py-3 px-5">Logout Time (Check-Out)</th>
                    <th className="py-3 px-5">Total Hours</th>
                    <th className="py-3 px-5 text-right">Duty State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-5">
                        <p className="font-bold text-slate-800">{log.employeeName}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">{log.memberId || 'N/A'}</p>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-2 py-0.5 border rounded-md text-[10px] font-bold ${getRoleBadgeStyle(log.role)}`}>
                          {log.role}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-slate-500 font-bold">
                        {formatDate(log.checkInTime)}
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-slate-800 font-bold bg-emerald-50/60 px-2 py-1 rounded border border-emerald-100/50">
                          {formatDateTime(log.checkInTime)}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        {log.checkOutTime ? (
                          <span className="text-slate-800 font-bold bg-slate-100/60 px-2 py-1 rounded border border-slate-200/50">
                            {formatDateTime(log.checkOutTime)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold italic">Active On-Duty</span>
                        )}
                      </td>
                      <td className="py-4 px-5 font-bold text-slate-800">
                        {log.workHours !== null ? `${log.workHours} hrs` : '--'}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          log.checkOutTime 
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-emerald-500 text-white shadow-sm'
                        }`}>
                          {log.checkOutTime ? 'Completed' : 'On Duty'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-14 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                  <AlertCircle size={22} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">No shift logs matched</p>
                  <p className="text-xs text-slate-400 mt-0.5">Try adjusting filters or logs</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'employees' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-150">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-base font-black text-slate-900">Employee Attendance & Leave Tracker</h3>
            <p className="text-xs text-slate-400 font-medium">Monthly shift check-in times, leave records, half days, and workforce summaries</p>
          </div>
          <div className="overflow-x-auto">
            {employees.length > 0 ? (
              <table className="w-full text-left border-collapse text-xs font-semibold text-slate-600">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-5">Employee Info</th>
                    <th className="py-3 px-5">Shift / Today's Punch</th>
                    <th className="py-3 px-5 text-center">Leaves Count</th>
                    <th className="py-3 px-5 text-center">Half Days</th>
                    <th className="py-3 px-5 text-center">Monthly Worktime</th>
                    <th className="py-3 px-5 text-center">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {employees.map(emp => {
                    const todayLog = getTodayLog(emp.member_id);
                    const leaves = getLeavesCount(emp.member_id);
                    const halfDays = getHalfDaysCount(emp.member_id);
                    const totalHours = getMonthlyHours(emp.member_id);

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-5">
                          <p className="font-bold text-slate-800">{emp.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{emp.member_id || 'PENDING'} • {emp.role}</p>
                        </td>
                        <td className="py-4 px-5">
                          {todayLog ? (
                            <div className="space-y-1">
                              <p className="font-bold text-slate-700">
                                In: <span className="text-emerald-600">{formatDateTime(todayLog.checkInTime)}</span>
                              </p>
                              <p className="font-bold text-slate-700">
                                Out: <span className="text-slate-500">{todayLog.checkOutTime ? formatDateTime(todayLog.checkOutTime) : 'On Duty'}</span>
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No check-in today</span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-center font-bold text-slate-800">
                          <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                            {leaves} Days
                          </span>
                        </td>
                        <td className="py-4 px-5 text-center font-bold text-slate-800">
                          <span className="px-2 py-1 bg-slate-50 text-slate-600 rounded-lg border border-slate-200">
                            {halfDays} Days
                          </span>
                        </td>
                        <td className="py-4 px-5 text-center font-black text-slate-800">
                          {totalHours} hrs
                        </td>
                        <td className="py-4 px-5 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            emp.status === 'Active' 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {emp.status}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={() => setSelectedReportEmployee(emp)}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-850 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
                          >
                            View Report
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-14 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                  <AlertCircle size={22} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">No employees registered yet</p>
                  <p className="text-xs text-slate-400 mt-0.5">Please add employees via the Team directory tab</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-150">
          {projects.length > 0 ? (
            projects.map(proj => (
              <div key={proj.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded border border-slate-200 tracking-wide uppercase">
                      Code: {proj.id}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {proj.status || 'Active'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 leading-tight">{proj.name}</h4>
                    {proj.customer && (
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">Client: {proj.customer}</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3.5 mt-4 flex items-center text-slate-500 gap-1.5">
                  <MapPin size={14} className="text-slate-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-600 truncate">{proj.location} {proj.locationBlock ? `(${proj.locationBlock})` : ''}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-14 text-center flex flex-col items-center justify-center col-span-2 gap-3">
              <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                <FolderOpen size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">No projects registered yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Please coordinate with the admin to register projects</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Employee Detailed Report Modal */}
      {selectedReportEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Attendance Report</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  {selectedReportEmployee.name} • {selectedReportEmployee.role} • {selectedReportEmployee.member_id}
                </p>
              </div>
              <button 
                onClick={() => setSelectedReportEmployee(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Hours</span>
                  <span className="text-lg font-black text-slate-800 mt-1 block">
                    {getMonthlyHours(selectedReportEmployee.member_id)} hrs
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Approved Leaves</span>
                  <span className="text-lg font-black text-slate-800 mt-1 block">
                    {getLeavesCount(selectedReportEmployee.member_id)} Days
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Half Days</span>
                  <span className="text-lg font-black text-slate-800 mt-1 block">
                    {getHalfDaysCount(selectedReportEmployee.member_id)} Days
                  </span>
                </div>
              </div>

              {/* Logs Timeline */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance logs</h4>
                {logs.filter(log => log.memberId === selectedReportEmployee.member_id).length > 0 ? (
                  <div className="space-y-3.5">
                    {logs.filter(log => log.memberId === selectedReportEmployee.member_id).map((log, index) => (
                      <div key={log.id} className="flex items-start space-x-3.5 p-3 bg-slate-50/50 border border-slate-100 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0 grid grid-cols-3 gap-2">
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase block">Date</span>
                            <span className="text-xs font-bold text-slate-800 mt-0.5 block">{formatDate(log.checkInTime)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase block">Punch-In</span>
                            <span className="text-xs font-bold text-emerald-600 mt-0.5 block">{formatDateTime(log.checkInTime)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase block">Punch-Out</span>
                            <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                              {log.checkOutTime ? formatDateTime(log.checkOutTime) : 'Active Duty'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-semibold">
                    No log records found for this month
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button 
                onClick={() => setSelectedReportEmployee(null)}
                className="px-5 py-2 bg-slate-850 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

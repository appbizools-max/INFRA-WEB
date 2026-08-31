import React from 'react';
import { Clock, User, Power, Briefcase, Mail, Phone, CheckCircle2 } from 'lucide-react';

interface ProfileData {
  adminName: string;
  designation: string;
  memberId?: string;
  department?: string;
  email?: string;
  mobile?: string;
  companyName?: string;
}

interface EmployeeDashboardProps {
  profile: ProfileData;
  status: 'Active' | 'Away' | 'On Duty' | 'Offline';
  handleUpdateStatus: (newStatus: 'Active' | 'Away' | 'On Duty' | 'Offline') => void;
}

export default function EmployeeDashboard({ profile, status, handleUpdateStatus }: EmployeeDashboardProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Welcome & Shift Status */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between min-h-[220px]">
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-1">Welcome back, {profile.adminName}!</h2>
            <p className="text-sm text-slate-500 font-semibold">{profile.designation} • {profile.memberId}</p>
          </div>
          
          {/* Shift Status Tracker */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">Shift Status:</span>
              <span className={`px-3 py-1 text-xs font-black rounded-lg ${
                status === 'On Duty' ? 'bg-teal-50 text-teal-600' :
                status === 'Away' ? 'bg-amber-50 text-amber-600' :
                status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                'bg-slate-100 text-slate-600'
              }`}>
                {status}
              </span>
            </div>
            
            {/* Shift Controls */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleUpdateStatus('On Duty')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  status === 'On Duty'
                    ? 'bg-[#00695C] text-white border-[#00695C] shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Clock size={14} />
                Go On Duty
              </button>
              <button
                onClick={() => handleUpdateStatus('Away')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  status === 'Away'
                    ? 'bg-[#D97706] text-white border-[#D97706] shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <User size={14} />
                Go Away
              </button>
              <button
                onClick={() => handleUpdateStatus('Offline')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  status === 'Offline'
                    ? 'bg-slate-600 text-white border-slate-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Power size={14} />
                Go Offline
              </button>
            </div>
          </div>
        </div>

        {/* Company Details Column */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between min-h-[220px]">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Corporate Identity</span>
            <div className="space-y-4 pt-1">
              <div className="flex items-center space-x-3.5">
                <Briefcase size={16} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Department</p>
                  <p className="text-sm font-bold text-slate-800">{profile.department}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3.5">
                <Mail size={16} className="text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Corporate Email</p>
                  <p className="text-sm font-bold text-slate-800 truncate max-w-[170px]">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3.5">
                <Phone size={16} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mobile Number</p>
                  <p className="text-sm font-bold text-slate-800">{profile.mobile}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-black text-slate-900 mb-4">Today's Assigned Tasks</h3>
        <div className="divide-y divide-slate-100">
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-slate-800">Safety Inspection Checklist</p>
                <p className="text-xs text-slate-400">Site Ops • 09:30 AM</p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-50 text-emerald-600">Completed</span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock size={18} className="text-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-slate-800">Verify Site 4 Deliveries</p>
                <p className="text-xs text-slate-400">Logistics • 02:00 PM</p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-blue-50 text-blue-600">In Progress</span>
          </div>
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock size={18} className="text-slate-300 shrink-0" />
              <div>
                <p className="text-sm font-bold text-slate-800">Submit Weekly Logs</p>
                <p className="text-xs text-slate-400">Operations • 04:30 PM</p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-50 text-slate-500">Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}

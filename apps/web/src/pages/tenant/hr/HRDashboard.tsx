import React, { useState, useEffect } from 'react';
import { Building2, CheckCircle2, ShieldCheck, User, Clock, Power, Mail, Phone, Briefcase, Users, Calendar, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

interface ProfileData {
  adminName: string;
  designation: string;
  mobile: string;
  email: string;
  companyName: string;
  industryType: string;
  country: string;
  state: string;
  pincode: string;
  city: string;
  companySize?: string;
  companyWebsite?: string;
  gstNumber?: string;
  userType?: string;
  department?: string;
  memberId?: string;
  status?: 'Active' | 'Away' | 'On Duty' | 'Offline';
}
export default function HRDashboard() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'Active' | 'Away' | 'On Duty' | 'Offline'>('Offline');
  // HR states
  const [pendingLeaves, setPendingLeaves] = useState([
    { id: '1', name: 'Ramesh Kumar', type: 'Sick Leave', duration: '2 Days', date: 'Jul 16 - Jul 17', department: 'Site Ops' },
    { id: '2', name: 'Srinivas Rao', type: 'Casual Leave', duration: '1 Day', date: 'Jul 20', department: 'Logistics' }
  ]);
  const fetchProfile = () => {
    if (currentUser) {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;
      
      const mobile = currentUser.phoneNumber || '';
      const email = currentUser.email || '';
      fetch(`${host}/api/tenant/profile/${currentUser.uid}?mobile=${encodeURIComponent(mobile)}&email=${encodeURIComponent(email)}`)
        .then(res => res.json())
        .then(data => {
          setProfile(data);
          if (data && data.status) {
            setStatus(data.status);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [currentUser]);

  const handleUpdateStatus = (newStatus: 'Active' | 'Away' | 'On Duty' | 'Offline') => {
    if (currentUser) {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;
      
      fetch(`${host}/api/tenant/employee/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: currentUser.uid,
          status: newStatus,
        }),
      })
        .then(res => {
          if (res.ok) {
            setStatus(newStatus);
          } else {
            alert('Failed to update shift status');
          }
        })
        .catch(err => {
          console.error(err);
          alert('Connection error updating status');
        });
    }
  };

  const handleLeaveAction = (id: string, action: 'Approve' | 'Reject') => {
    setPendingLeaves(pendingLeaves.filter(item => item.id !== id));
    alert(`Leave request has been ${action}d successfully.`);
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
      
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 mb-1">Human Resources Dashboard</h2>
          <p className="text-sm text-slate-500 font-semibold">{profile?.adminName} • HR Administrator ({profile?.memberId})</p>
        </div>
        <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Department</span>
          <span className="text-sm font-black text-slate-800">HR & People Operations</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Users size={24} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Total Employees</span>
            <span className="text-2xl font-black text-slate-800 block mt-0.5">12</span>
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">On Duty Now</span>
            <span className="text-2xl font-black text-teal-600 block mt-0.5">8</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <Calendar size={24} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Leave Requests Pending</span>
            <span className="text-2xl font-black text-amber-600 block mt-0.5">{pendingLeaves.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shift Manager Status */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900 mb-1">My Duty Status</h3>
            <p className="text-xs text-slate-400">Toggle your active check-in/out status below</p>
          </div>
          
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">Duty State:</span>
              <span className={`px-3 py-1 text-xs font-black rounded-lg ${
                status === 'On Duty' ? 'bg-teal-50 text-teal-600' :
                status === 'Away' ? 'bg-amber-50 text-amber-600' :
                status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                'bg-slate-100 text-slate-600'
              }`}>
                {status}
              </span>
            </div>
            
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

        {/* Corporate Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Corporate Identity</span>
            <div className="space-y-4 pt-1">
              <div className="flex items-center space-x-3.5">
                <Briefcase size={16} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Designation</p>
                  <p className="text-sm font-bold text-slate-800">{profile?.designation}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3.5">
                <Mail size={16} className="text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Corporate Email</p>
                  <p className="text-sm font-bold text-slate-800 truncate max-w-[170px]">{profile?.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3.5">
                <Phone size={16} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mobile Number</p>
                  <p className="text-sm font-bold text-slate-800">{profile?.mobile}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Approval Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-slate-500" />
          Pending Leave Requests
        </h3>
        
        {pendingLeaves.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-semibold text-slate-600">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingLeaves.map(leave => (
                  <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800">{leave.name}</td>
                    <td className="py-3.5 px-4">{leave.department}</td>
                    <td className="py-3.5 px-4">{leave.type}</td>
                    <td className="py-3.5 px-4">{leave.duration}</td>
                    <td className="py-3.5 px-4 text-slate-500">{leave.date}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleLeaveAction(leave.id, 'Reject')}
                        className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleLeaveAction(leave.id, 'Approve')}
                        className="px-3 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100"
                      >
                        Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2">
            <CheckCircle2 size={32} className="text-slate-300" />
            <p className="text-sm font-bold text-slate-400">All leave requests processed!</p>
          </div>
        )}
      </div>

    </div>
  );
}

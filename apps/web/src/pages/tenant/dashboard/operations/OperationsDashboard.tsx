import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, Truck, Users, ChevronRight, BarChart2, Activity } from 'lucide-react';

interface ProfileData {
  adminName: string;
  designation: string;
}

interface OperationsDashboardProps {
  profile: ProfileData;
}

export default function OperationsDashboard({ profile }: OperationsDashboardProps) {
  const navigate = useNavigate();

  const opsKpis = [
    { label: 'Active Projects', value: '7',  sub: '3 on track · 4 delayed',  color: 'bg-blue-50 text-blue-700',     Icon: Briefcase },
    { label: 'Work Sites',      value: '12', sub: 'Across 5 districts',      color: 'bg-emerald-50 text-emerald-700', Icon: MapPin },
    { label: 'Fleet On Duty',   value: '24', sub: 'Vehicles active today',   color: 'bg-orange-50 text-orange-700', Icon: Truck },
    { label: 'Staff On Site',   value: '86', sub: 'Field operations',         color: 'bg-purple-50 text-purple-700', Icon: Users },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 mb-1">Welcome back, {profile?.adminName || 'Operations Head'}!</h1>
          <p className="text-sm text-slate-500 font-semibold">{profile?.designation || 'Operations'} · Operations Control Panel</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <button 
            onClick={() => navigate('/tenant/project-management')} 
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2"
          >
            Projects <ChevronRight size={15} />
          </button>
          <button 
            onClick={() => navigate('/tenant/work-sites')} 
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2"
          >
            Work Sites <ChevronRight size={15} />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {opsKpis.map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${k.color}`}><k.Icon size={18} /></div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{k.label}</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{k.value}</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-4">
            <BarChart2 size={16} /> Project Status
          </h2>
          {[{ name: 'Ramco Site – Vizag', status: 'On Track', pct: 72 }, { name: 'JSW Logistics Hub', status: 'Delayed', pct: 38 }, { name: 'Ultratech Plant', status: 'On Track', pct: 91 }, { name: 'ACC Terminal', status: 'On Track', pct: 55 }].map(p => (
            <div key={p.name} className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold text-slate-800">{p.name}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${p.status === 'On Track' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>{p.status}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full">
                <div className={`h-full rounded-full ${p.status === 'On Track' ? 'bg-emerald-500' : 'bg-red-400'}`} style={{ width: `${p.pct}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-4">
            <Activity size={16} /> Field Activity Today
          </h2>
          {[{ time: '08:15 AM', event: 'Shift started – Ramco Site (12 staff)' }, { time: '09:30 AM', event: 'Vehicle TN-01-AB-1234 dispatched to Vizag' }, { time: '11:00 AM', event: 'Material delivery confirmed – JSW Hub' }, { time: '01:45 PM', event: 'Safety inspection – ACC Terminal' }].map((a, i) => (
            <div key={i} className="flex gap-3 mb-3 last:mb-0">
              <span className="text-xs text-slate-400 font-medium w-20 shrink-0">{a.time}</span>
              <span className="text-sm text-slate-700">{a.event}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, AlertTriangle, IndianRupee, Check, X, Building2 } from 'lucide-react';
export default function Dashboard() {
  const [statsData, setStatsData] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, tenantsRes] = await Promise.all([
          fetch('http://localhost:5000/api/admin/stats'),
          fetch('http://localhost:5000/api/admin/tenants')
        ]);
        const stats = await statsRes.json();
        const tnts = await tenantsRes.json();
        if (stats.error || tnts.error) {
          setErrorMsg(stats.error || tnts.error || 'Failed to fetch data');
          setStatsData({ totalTenants: 0, monthlyRevenue: 0, activeTrials: 0, expiringSoon: 0 });
        } else {
          setStatsData(stats);
          setTenants(tnts);
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
        setErrorMsg('Network error connecting to backend.');
        setStatsData({ totalTenants: 0, monthlyRevenue: 0, activeTrials: 0, expiringSoon: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    { label: 'Total Tenants', value: statsData ? statsData.totalTenants?.toString() : '...', icon: Users, color: 'text-infra-green', bg: 'bg-green-100' },
    { label: 'Monthly Revenue', value: statsData ? `₹${(statsData.monthlyRevenue || 0).toLocaleString()}` : '...', icon: IndianRupee, color: 'text-infra-green', bg: 'bg-green-100' },
    { label: 'Active Trials', value: statsData ? statsData.activeTrials?.toString() : '...', icon: TrendingUp, color: 'text-slate-700', bg: 'bg-slate-200' },
    { label: 'Expiring Soon', value: statsData ? statsData.expiringSoon?.toString() : '...', icon: AlertTriangle, color: 'text-infra-orange', bg: 'bg-orange-100' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold font-sans text-slate-900">Platform Overview</h2>
        <p className="text-slate-500 mt-1 font-sans">Welcome back! Here's what's happening on InfraOps360 today.</p>
        {errorMsg && (
          <p className="text-red-500 mt-2 font-bold bg-red-50 p-2 rounded-md border border-red-200">
            ⚠️ Database Error: {errorMsg}. (Make sure backend is running and db:init was run!)
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white hover:border-infra-green/30 flex items-center space-x-5 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(70,179,81,0.12)] transition-all duration-300 group cursor-default relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-100 to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>

              <div className={`p-4 rounded-xl ${stat.bg} shadow-inner group-hover:scale-110 transition-transform duration-300 relative`}>
                <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Icon size={28} className={`${stat.color} relative z-10`} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter group-hover:text-infra-green transition-colors">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Placeholder for Revenue Chart & Recent Tenants */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white p-8 min-h-[400px] flex flex-col relative overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-infra-green/5 rounded-full blur-3xl pointer-events-none"></div>
          <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center space-x-2">
            <TrendingUp size={20} className="text-infra-green" />
            <span>Revenue Growth</span>
          </h3>
          <div className="flex-1 flex items-center justify-center h-[300px] border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 group hover:bg-slate-50 hover:border-infra-green/30 transition-all cursor-pointer">
            <p className="text-slate-400 font-bold uppercase tracking-wider text-xs group-hover:text-infra-green transition-colors">Chart Area (Integration coming soon)</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white p-8 flex flex-col h-[400px] relative overflow-hidden">
          <h3 className="text-xl font-black text-slate-900 mb-6 shrink-0 flex items-center justify-between">
            <span>Recent Activity</span>
            <span className="text-[10px] bg-infra-green/10 text-infra-green px-2 py-1 rounded-full uppercase tracking-wider">Live</span>
          </h3>

          <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="h-8 w-8 border-4 border-slate-200 border-t-infra-green rounded-full animate-spin"></div>
                <div className="text-slate-400 font-bold text-xs uppercase tracking-wider animate-pulse">Syncing Database...</div>
              </div>
            ) : tenants.length === 0 ? (
              <div className="text-center py-10 text-slate-400 font-medium">No tenants registered yet.</div>
            ) : (
              tenants.map((tenant) => (
                <div key={tenant.id} className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all hover:shadow-md group">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-200/50 flex items-center justify-center group-hover:bg-infra-green/10 group-hover:text-infra-green transition-colors">
                      <Building2 size={18} className="text-slate-500 group-hover:text-infra-green transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{tenant.company_name}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{tenant.plan_name || 'No Plan'} <span className="text-infra-green ml-1">• ₹{tenant.price_monthly || 0}</span></p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="h-8 w-8 rounded-full bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-infra-green hover:border-infra-green hover:text-white transition-all shadow-sm" title="Manage">
                      <Check size={14} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

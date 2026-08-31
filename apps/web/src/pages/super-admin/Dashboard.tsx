import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, AlertTriangle, IndianRupee, Check, X, Building2 } from 'lucide-react';

export default function Dashboard() {
  const [statsData, setStatsData] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, tenantsRes] = await Promise.all([
          fetch('http://localhost:5000/api/admin/stats'),
          fetch('http://localhost:5000/api/admin/tenants')
        ]);
        
        const stats = await statsRes.json();
        const tnts = await tenantsRes.json();
        
        setStatsData(stats);
        setTenants(tnts);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    { label: 'Total Tenants', value: statsData ? statsData.totalTenants.toString() : '...', icon: Users, color: 'text-infra-green', bg: 'bg-green-100' },
    { label: 'Monthly Revenue', value: statsData ? `₹${statsData.monthlyRevenue.toLocaleString()}` : '...', icon: IndianRupee, color: 'text-infra-green', bg: 'bg-green-100' },
    { label: 'Active Trials', value: statsData ? statsData.activeTrials.toString() : '...', icon: TrendingUp, color: 'text-slate-700', bg: 'bg-slate-200' },
    { label: 'Expiring Soon', value: statsData ? statsData.expiringSoon.toString() : '...', icon: AlertTriangle, color: 'text-infra-orange', bg: 'bg-orange-100' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold font-sans text-slate-900">Platform Overview</h2>
        <p className="text-slate-500 mt-1 font-sans">Welcome back! Here's what's happening on InfraOps360 today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center space-x-4 hover:shadow-md transition-shadow">
              <div className={`p-4 rounded-full ${stat.bg}`}>
                <Icon size={28} className={stat.color} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Placeholder for Revenue Chart & Recent Tenants */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[400px]">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Revenue Growth</h3>
          <div className="flex-1 flex items-center justify-center h-[300px] border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
            <p className="text-slate-400 font-medium">Chart Area (Recharts Integration coming soon)</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[400px]">
          <h3 className="text-lg font-bold text-slate-900 mb-4 shrink-0">Recent Registrations</h3>
          
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            {loading ? (
              <div className="text-center py-10 text-slate-400 font-medium">Loading tenants...</div>
            ) : tenants.length === 0 ? (
              <div className="text-center py-10 text-slate-400 font-medium">No tenants registered yet.</div>
            ) : (
              tenants.map((tenant) => (
                <div key={tenant.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <Building2 size={18} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{tenant.company_name}</p>
                      <p className="text-xs text-infra-green font-medium">{tenant.plan_name || 'No Plan'} • ₹{tenant.price_monthly || 0}/mo</p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <button className="h-8 w-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-infra-green hover:text-white transition-colors" title="Manage">
                      <Check size={16} strokeWidth={3} />
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

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, PieChart } from 'lucide-react';

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/admin/reports/overview')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const planColors: Record<string, string> = {
    Basic: '#94A3B8', Professional: '#46B351', Enterprise: '#4F46E5', null: '#CBD5E1'
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Platform Reports</h2>
        <p className="text-slate-500 mt-1">Tenant growth, plan distribution, and revenue overview.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[#46B351] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Monthly Growth */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <TrendingUp size={18} className="text-[#46B351]" />
              <h3 className="font-bold text-slate-800">Tenant Growth (Last 6 Months)</h3>
            </div>
            {data?.monthlyGrowth?.length > 0 ? (
              <div className="space-y-3">
                {data.monthlyGrowth.map((row: any) => (
                  <div key={row.month} className="flex items-center space-x-3">
                    <span className="text-xs font-bold text-slate-500 w-14 shrink-0">{row.month}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-3 bg-gradient-to-r from-[#46B351] to-emerald-400 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (parseInt(row.new_tenants) / 10) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-slate-900 w-6 text-right">{row.new_tenants}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm text-center py-8">No growth data yet</p>
            )}
          </div>

          {/* Plan Distribution */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <PieChart size={18} className="text-[#4F46E5]" />
              <h3 className="font-bold text-slate-800">Plan Distribution</h3>
            </div>
            {data?.planDistribution?.length > 0 ? (
              <div className="space-y-3">
                {data.planDistribution.map((row: any) => {
                  const total = data.planDistribution.reduce((s: number, r: any) => s + parseInt(r.count), 0);
                  const pct = total > 0 ? Math.round((parseInt(row.count) / total) * 100) : 0;
                  return (
                    <div key={row.plan || 'none'} className="flex items-center space-x-3">
                      <span className="text-xs font-bold text-slate-500 w-24 shrink-0 truncate">{row.plan || 'No Plan'}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div className="h-3 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: planColors[row.plan] || '#CBD5E1' }} />
                      </div>
                      <span className="text-xs font-black text-slate-900 w-10 text-right">{row.count} <span className="font-normal text-slate-400">({pct}%)</span></span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-400 text-sm text-center py-8">No plan data yet</p>
            )}
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <Users size={18} className="text-indigo-500" />
              <h3 className="font-bold text-slate-800">Payment Status Breakdown</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {data?.statusDistribution?.map((row: any) => {
                const colorMap: Record<string, { bg: string, text: string, border: string }> = {
                  trial: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
                  paid: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
                  active: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
                  suspended: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
                  unknown: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100' },
                };
                const c = colorMap[row.status] || colorMap.unknown;
                return (
                  <div key={row.status} className={`rounded-xl p-4 border ${c.bg} ${c.border}`}>
                    <p className={`text-2xl font-black ${c.text}`}>{row.count}</p>
                    <p className="text-xs font-bold text-slate-500 capitalize mt-1">{row.status}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, AlertCircle, Wallet, DollarSign, FileText, Info } from 'lucide-react';
import { apiFetch } from '../../../../lib/api';

interface ProfileData {
  adminName: string;
  designation: string;
}

interface AccountantDashboardProps {
  profile: ProfileData;
}

export default function AccountantDashboard({ profile }: AccountantDashboardProps) {
  const navigate = useNavigate();

  const [dashboardMetrics, setDashboardMetrics] = useState({
    bankTotal: 0,
    pettyTotal: 0,
    clientTotal: 0,
    vendorTotal: 0,
    employeeTotal: 0,
    netPosition: 0
  });
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await apiFetch('/api/tenant/ledger/dashboard-summary');
        if (res.ok) {
          const data = await res.json();
          setDashboardMetrics(data);
        }
      } catch (err) {
        console.error('Error loading dashboard summary:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const kpis = [
    {
      label: 'Bank & Cash Balance',
      value: `₹${Number(dashboardMetrics.bankTotal || 0).toLocaleString('en-IN')}`,
      sub: 'Liquid bank/cash funds',
      color: 'bg-emerald-50 text-emerald-700',
      Icon: TrendingUp
    },
    {
      label: 'Pending Receivables (Clients)',
      value: `₹${Number(dashboardMetrics.clientTotal || 0).toLocaleString('en-IN')}`,
      sub: 'Total client outstanding',
      color: 'bg-amber-50 text-amber-700',
      Icon: AlertCircle
    },
    {
      label: 'Vendor Payables',
      value: `₹${Number(dashboardMetrics.vendorTotal || 0).toLocaleString('en-IN')}`,
      sub: 'Outstanding vendor bills',
      color: 'bg-blue-50 text-blue-700',
      Icon: Wallet
    },
    {
      label: 'Net Financial Position',
      value: `₹${Number((dashboardMetrics.bankTotal || 0) + (dashboardMetrics.clientTotal || 0) - (dashboardMetrics.vendorTotal || 0)).toLocaleString('en-IN')}`,
      sub: 'Calculated net position',
      color: 'bg-purple-50 text-purple-700',
      Icon: DollarSign
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 mb-1">Welcome back, {profile?.adminName || 'Accountant'}!</h1>
          <p className="text-sm text-slate-500 font-semibold">{profile?.designation || 'Finance'} · Accounts &amp; Finance Portal</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${k.color}`}><k.Icon size={18} /></div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{k.label}</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{k.value}</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <FileText size={16} /> Recent Invoices &amp; Ledger Activity
          </h2>
        </div>
        {recentInvoices.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentInvoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-900">{inv.id} · {inv.client}</p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">{inv.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-slate-900">{inv.amount}</span>
                  <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg ${
                    inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 
                    inv.status === 'Overdue' ? 'bg-red-50 text-red-600' : 
                    'bg-amber-50 text-amber-700'
                  }`}>{inv.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center space-y-3">
            <div className="p-3 bg-slate-100 text-slate-500 rounded-full w-fit mx-auto">
              <Info size={20} />
            </div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">No Recent Invoices Found</p>
            <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto">
              No recent client invoices or ledger activities have been posted yet.
            </p>
            <button
              onClick={() => navigate('/tenant/accounts/ledger')}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-sm"
            >
              Open Ledger Portal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

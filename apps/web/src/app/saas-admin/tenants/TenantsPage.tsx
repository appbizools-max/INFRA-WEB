import React, { useState, useEffect } from 'react';
import { Building2, Search, MoreVertical, Mail, Phone } from 'lucide-react';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/admin/tenants');
        const data = await res.json();
        setTenants(data);
      } catch (err) {
        console.error('Failed to fetch tenants:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTenants();
  }, []);

  const filteredTenants = tenants.filter(t => 
    t.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.admin_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-sans text-slate-900">Registered Tenants</h2>
          <p className="text-slate-500 mt-1 font-sans">Manage all companies using the InfraOps360 platform.</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search tenants..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-infra-green focus:border-transparent text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden relative">
        {/* Subtle Ambient Glow */}
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-infra-green/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/60 text-slate-400 text-[10px] uppercase tracking-[0.15em] font-black">
                <th className="px-8 py-5">Company</th>
                <th className="px-8 py-5">Admin Contact</th>
                <th className="px-8 py-5">Plan Details</th>
                <th className="px-8 py-5">Joined Date</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="h-8 w-8 border-4 border-slate-200 border-t-infra-green rounded-full animate-spin"></div>
                      <span className="text-slate-400 font-bold text-xs uppercase tracking-wider animate-pulse">Fetching Tenants...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center text-slate-400 font-medium">
                    No tenants found matching your search.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-infra-green/10 group-hover:text-infra-green transition-colors border border-transparent group-hover:border-infra-green/20">
                          <Building2 size={20} className="text-slate-400 group-hover:text-infra-green transition-colors" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{tenant.company_name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">ID: {tenant.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold text-slate-800">{tenant.admin_name || 'N/A'}</p>
                      <div className="flex flex-col space-y-1 mt-1.5">
                        <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <Mail size={10} className="text-infra-green" />
                          <span>{tenant.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <Phone size={10} className="text-infra-green" />
                          <span>{tenant.mobile || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        tenant.plan_name === 'Corporate' ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200' :
                        tenant.plan_name === 'Enterprise' ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-200' :
                        tenant.plan_name === 'Professional' ? 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200' :
                        tenant.plan_name === 'Starter' ? 'bg-slate-100 text-slate-700 ring-1 ring-slate-200' :
                        'bg-blue-100 text-blue-700 ring-1 ring-blue-200'
                      }`}>
                        {tenant.plan_name || 'No Plan'}
                      </span>
                      <p className="text-xs font-black text-slate-600 mt-2">
                        ₹{(tenant.price_monthly || 0).toLocaleString()}<span className="text-[10px] text-slate-400 ml-0.5">/mo</span>
                      </p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold text-slate-600">
                        {new Date(tenant.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="text-slate-400 hover:text-infra-green transition-all p-2 rounded-lg hover:bg-infra-green/10 opacity-0 group-hover:opacity-100 border border-transparent hover:border-infra-green/20">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

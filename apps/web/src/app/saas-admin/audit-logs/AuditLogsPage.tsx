import React, { useState, useEffect } from 'react';
import { Activity, Filter } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/admin/audit-logs')
      .then(r => r.ok ? r.json() : [])
      .then(d => { setLogs(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const actionColors: Record<string, string> = {
    EXTEND_TRIAL: 'bg-blue-100 text-blue-700',
    UPDATE_TENANT_STATUS: 'bg-amber-100 text-amber-700',
    CREATE_VENDOR: 'bg-green-100 text-green-700',
    DELETE_VENDOR: 'bg-red-100 text-red-700',
  };

  const filtered = logs.filter(l =>
    !filter || l.action?.toLowerCase().includes(filter.toLowerCase()) || l.description?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Audit Logs</h2>
          <p className="text-slate-500 mt-1">All administrative actions recorded on the platform.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter logs..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#46B351] focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-[#46B351] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <Activity size={36} className="mb-2 opacity-30" />
            <p className="text-sm font-semibold">No audit logs yet</p>
            <p className="text-xs mt-1">Actions will appear here as you manage the platform</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Entity</th>
                  <th className="px-6 py-4">Performed By</th>
                  <th className="px-6 py-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${actionColors[log.action] || 'bg-slate-100 text-slate-600'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">{log.description || '—'}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-mono">{log.entity_type}/{log.entity_id}</td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-medium">{log.performed_by}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

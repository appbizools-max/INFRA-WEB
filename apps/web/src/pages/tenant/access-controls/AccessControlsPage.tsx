import React from 'react';
import { Shield } from 'lucide-react';

export default function AccessControlsPage() {
  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">Access & Controls</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Manage permissions, roles, and security policies.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Coming Soon</h3>
        <p className="text-slate-500 max-w-sm">
          The Access & Controls module is currently under development. Soon you will be able to manage granular role-based access for your team.
        </p>
      </div>
    </div>
  );
}

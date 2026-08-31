import React from 'react';
import { Construction, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
interface ComingSoonProps {
  moduleName: string;
}
export default function ComingSoon({ moduleName }: ComingSoonProps) {
  const navigate = useNavigate();
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 mb-6 animate-pulse">
        <Construction size={32} />
      </div>

      <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
        {moduleName} Module
      </h2>
      <p className="text-slate-500 text-sm max-w-sm mb-8 leading-relaxed">
        This module is currently being configured for your tenant account. We are connecting database synchronization services and will launch it soon.
      </p>
      <button
        onClick={() => navigate('/tenant/dashboard')}
        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all flex items-center gap-2"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>
    </div>
  );
}

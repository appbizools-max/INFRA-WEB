import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Settings, LogOut, CreditCard, Menu, X } from 'lucide-react';

export default function SuperAdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/super-admin/dashboard', icon: LayoutDashboard },
    { name: 'Tenants', path: '/super-admin/tenants', icon: Users },
    { name: 'Billing', path: '/super-admin/billing', icon: CreditCard },
    { name: 'Config', path: '/super-admin/config', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-52 bg-slate-950 text-white shadow-xl flex flex-col transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src="/favicon.svg" alt="Logo" className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold font-sans tracking-tight text-white">InfraOps<span className="text-infra-green">360</span></h1>
              <p className="text-[10px] text-slate-300 mt-1 uppercase tracking-wider font-semibold">Super Admin</p>
            </div>
          </div>
          <button className="lg:hidden text-white/70 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium font-sans">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={() => navigate('/login')}
            className="flex w-full items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium font-sans">Log Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center px-4 lg:px-8 justify-between lg:justify-end shadow-sm">
          <button 
            className="lg:hidden text-slate-500 hover:text-slate-900"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900">System Owner</p>
              <p className="text-xs text-slate-500">Super Administrator</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-infra-green text-white flex items-center justify-center font-bold text-lg shadow-inner">
              SO
            </div>
          </div>
        </header>
        
        <main className="p-4 lg:p-8 flex-1 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

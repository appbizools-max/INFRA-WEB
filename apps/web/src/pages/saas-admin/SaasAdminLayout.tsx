import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Settings, Menu, X, LogOut, Package, FileText, Activity, Layers, ChevronRight, Bell, ChevronLeft } from 'lucide-react';
import sideIconImg from '../../assets/Side Icon.png';

export default function SaasAdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleAdminLogout = () => {
    sessionStorage.removeItem('saas_admin_jwt');
    localStorage.removeItem('saas_admin_jwt');
    navigate('/admin');
  };

  const navItems = [
    { name: 'Dashboard', path: '/saas-admin/dashboard', icon: LayoutDashboard },
    { name: 'Tenants', path: '/saas-admin/tenants', icon: Users },
    { name: 'Vendors', path: '/saas-admin/vendors', icon: Package },
    { name: 'Plans', path: '/saas-admin/plans', icon: CreditCard },
    { name: 'Modules', path: '/saas-admin/modules', icon: Layers },
    { name: 'Reports', path: '/saas-admin/reports', icon: FileText },
    { name: 'Audit Logs', path: '/saas-admin/audit-logs', icon: Activity },
    { name: 'Settings', path: '/saas-admin/config', icon: Settings },
  ];

  const NavItem = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    const Icon = item.icon;
    return (
      <Link
        to={item.path}
        onClick={() => setIsMobileMenuOpen(false)}
        className={`group flex items-center justify-between py-2.5 rounded-lg transition-all duration-150 relative ${
          isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
        } ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}
        title={isCollapsed ? item.name : undefined}
      >
        {isActive && <span className="absolute left-0 inset-y-2 w-0.5 bg-[#46B351] rounded-r-full" />}
        <div className={`flex items-center min-w-0 ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
          <Icon size={isCollapsed ? 20 : 16} className={isActive ? 'text-[#46B351] shrink-0' : 'text-slate-500 group-hover:text-slate-300 shrink-0 transition-colors'} />
          {!isCollapsed && (
            <span className={`text-[13px] truncate ${isActive ? 'font-semibold text-white' : 'font-medium'}`}>
              {item.name}
            </span>
          )}
        </div>
        {!isCollapsed && isActive && <ChevronRight size={12} className="text-[#46B351] shrink-0" />}
      </Link>
    );
  };

  return (
    <div className="h-screen bg-[#F1F5F9] flex flex-col lg:flex-row overflow-hidden">
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className={`
        absolute lg:static inset-y-0 left-0 z-50 flex flex-col h-full lg:h-screen
        bg-[#0F172A] transform transition-all duration-300 ease-in-out relative
        ${isCollapsed ? 'w-[80px]' : 'w-[200px]'}
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-7 bg-[#1E293B] border border-slate-700 text-slate-400 rounded-full p-1 hover:text-white hidden lg:flex items-center justify-center z-50 shadow-md transition-colors"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Brand — inside sidebar only */}
        <div className={`flex items-center justify-between pt-6 pb-5 shrink-0 ${isCollapsed ? 'justify-center px-0' : 'px-5'}`}>
          {!isCollapsed ? (
            <div>
              <p className="text-[17px] font-black text-white tracking-tight leading-none">
                InfraOps <span className="text-[#46B351]">360</span>
              </p>
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-slate-500 mt-1">Platform Control</p>
            </div>
          ) : (
            <div className="mt-1 flex justify-center w-full">
              <img src={sideIconImg} alt="InfraOps 360" className="w-8 h-8 object-contain" />
            </div>
          )}
          {!isCollapsed && (
            <button className="lg:hidden text-slate-500 hover:text-white transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={20} />
            </button>
          )}
        </div>

        <div className={`border-t border-slate-800/70 mb-3 ${isCollapsed ? 'mx-2' : 'mx-4'}`} />

        {!isCollapsed && <p className="px-5 pb-1.5 text-[9px] font-black uppercase tracking-[0.25em] text-slate-600 shrink-0">Navigation</p>}

        <nav className={`flex-1 space-y-0.5 overflow-y-auto pb-4 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          {navItems.map(item => <NavItem key={item.name} item={item} />)}
        </nav>

        {/* Admin Profile Footer */}
        <div className="shrink-0 border-t border-slate-800/60">
          <div className={`flex items-center py-3.5 ${isCollapsed ? 'justify-center px-0' : 'space-x-3 px-4'}`} title={isCollapsed ? "Super Admin" : undefined}>
            <div className="h-8 w-8 rounded-lg bg-[#46B351] text-white flex items-center justify-center font-black text-xs shrink-0">
              SA
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-white truncate leading-tight">Super Admin</p>
                <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">infraops@easyapps360.com</p>
              </div>
            )}
          </div>
          <button
            onClick={handleAdminLogout}
            className={`w-full flex items-center py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors group border-t border-slate-800/60 ${isCollapsed ? 'justify-center px-0' : 'space-x-3 px-4'}`}
            title={isCollapsed ? "Log Out" : undefined}
          >
            <LogOut size={15} className="shrink-0 group-hover:text-red-400" />
            {!isCollapsed && <span className="text-[13px] font-semibold">Log Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Right Side ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* White Top Header — NO brand text */}
        <header className="bg-white border-b border-slate-100 h-14 flex items-center px-4 lg:px-6 justify-between shadow-[0_1px_3px_rgba(0,0,0,0.04)] z-30 shrink-0">
          <button className="lg:hidden text-slate-500 hover:text-slate-900" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={22} />
          </button>
          {/* Empty left on desktop */}
          <div className="hidden lg:block" />

          {/* Right actions */}
          <div className="flex items-center space-x-4">
            <button className="text-slate-400 hover:text-slate-700 transition-colors relative">
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#46B351] border-2 border-white" />
            </button>
            <div className="h-8 w-8 rounded-lg bg-[#0F172A] text-white flex items-center justify-center font-bold text-xs">
              SA
            </div>
            <button
              onClick={handleAdminLogout}
              className="hidden sm:flex items-center space-x-1.5 text-sm font-semibold text-slate-400 hover:text-red-500 transition-colors"
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import appLogo from '../../assets/App Logo.png';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../lib/firebase';

// SVG Icons for the sidebar
const icons = {
  dashboard: <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  tenants: <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  vendors: <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  plans: <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  modules: <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  reports: <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  auditLogs: <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  settings: <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
};

const navItems = [
  { name: "Dashboard", href: "/super-admin/dashboard", icon: icons.dashboard },
  { name: "Tenants", href: "/super-admin/tenants", icon: icons.tenants },
  { name: "Vendors", href: "/super-admin/vendors", icon: icons.vendors },
  { name: "Plans", href: "/super-admin/plans", icon: icons.plans },
  { name: "Modules", href: "/super-admin/modules", icon: icons.modules },
  { name: "Reports", href: "/super-admin/reports", icon: icons.reports },
  { name: "Audit Logs", href: "/super-admin/audit-logs", icon: icons.auditLogs },
  { name: "Settings", href: "/super-admin/settings", icon: icons.settings },
];

export function SuperAdminSidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };
  return (
    <aside className={`${isCollapsed ? 'w-[80px]' : 'w-[260px]'} bg-[#111827] h-full flex flex-col hidden md:flex shrink-0 transition-all duration-300 ease-in-out relative z-50`}>
      {/* Logo Area */}
      <div className={`h-[72px] bg-white flex items-center shrink-0 border-b border-slate-100 shadow-sm transition-all duration-300 ${isCollapsed ? 'px-0 justify-center' : 'px-5'}`}>
        <div className="flex items-center space-x-3.5">
          {/* Custom App Logo matching the image */}
          <div className="w-10 h-10 relative flex items-center justify-center shrink-0">
            <img src={appLogo} alt="InfraOps 360" className="w-full h-full object-contain drop-shadow-sm" />
          </div>
          {/* Hide Text when collapsed */}
          {!isCollapsed && (
            <div className="flex flex-col whitespace-nowrap overflow-hidden transition-opacity duration-300">
              <span className="text-slate-800 font-extrabold text-[15px] tracking-tight leading-none mb-1">InfraOps 360</span>
              <span className="text-slate-400 text-[9px] uppercase tracking-[0.2em] font-bold leading-none">Work Simplified</span>
            </div>
          )}
        </div>
      </div>
      {/* Navigation */}
      <nav className={`flex-1 py-6 space-y-1 overflow-y-auto overflow-x-hidden transition-all duration-300 ${isCollapsed ? 'px-3' : 'px-3'}`}>

        {/* Nav Title */}
        <div className={`mb-4 overflow-hidden whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'h-0 opacity-0 px-0 mb-0' : 'h-4 opacity-100 px-3'}`}>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Navigation
          </p>
        </div>

        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              title={isCollapsed ? item.name : ""}
              className={`flex items-center py-2.5 text-[14px] font-medium rounded-lg transition-colors group ${isCollapsed ? 'justify-center px-0' : 'px-3'
                } ${isActive
                  ? "bg-[#1f2937] text-[#10b981]"
                  : "text-gray-300 hover:bg-[#1f2937]/50 hover:text-white"
                }`}
            >
              <div className={`shrink-0 transition-colors ${isActive ? 'text-[#10b981]' : 'text-gray-400 group-hover:text-white'}`}>
                {item.icon}
              </div>

              {!isCollapsed && (
                <span className="ml-3 whitespace-nowrap overflow-hidden transition-opacity duration-300">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className={`p-4 shrink-0 transition-all duration-300`}>
        <div
          onClick={handleLogout}
          className={`flex items-center bg-[#1f2937] rounded-xl border border-white/5 cursor-pointer hover:bg-[#ef4444] hover:border-[#ef4444] transition-all duration-300 group ${isCollapsed ? 'p-2 justify-center' : 'p-3 justify-between'}`}
          title="Click to logout"
        >
          <div className="flex items-center overflow-hidden">
            <div className="h-9 w-9 bg-[#10b981] rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
              SA
            </div>

            {!isCollapsed && (
              <div className="ml-3 truncate whitespace-nowrap">
                <p className="text-sm font-semibold text-white leading-tight">Super Admin</p>
                <p className="text-[10px] text-gray-400 truncate">superadmin@infraops360.com</p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <svg className="w-4 h-4 text-gray-400 shrink-0 ml-2 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          )}
        </div>

        {/* Collapse Button */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors focus:outline-none"
          >
            {isCollapsed ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}

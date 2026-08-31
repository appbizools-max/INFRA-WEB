import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import appLogo from '../../assets/App Logo.png';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

// SVG Icons for the sidebar
const icons = {
  dashboard: <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  transport: <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l3 4v5a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h3v12m10-10v12m-6-12v12" /></svg>,
  equipment: <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  drivers: <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  finance: <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  settings: <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>,
};

const navItems = [
  { name: "Dashboard", href: "/tenant/dashboard", icon: icons.dashboard },
  { name: "Transport", href: "/tenant/transport", icon: icons.transport },
  { name: "Equipment", href: "/tenant/equipment", icon: icons.equipment },
  { name: "Drivers", href: "/tenant/drivers", icon: icons.drivers },
  { name: "Finance", href: "/tenant/finance", icon: icons.finance },
  { name: "Settings", href: "/tenant/settings", icon: icons.settings },
];

export function TenantOpsSidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMastersOpen, setIsMastersOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <aside className={`${isCollapsed ? 'w-[80px]' : 'w-[260px]'} bg-[#1a202c] h-full flex flex-col hidden md:flex shrink-0 transition-all duration-300 ease-in-out relative z-50 border-r border-slate-800`}>

      {/* Logo Area */}
      <div className={`h-[72px] bg-white flex items-center shrink-0 border-b border-slate-100 shadow-sm transition-all duration-300 ${isCollapsed ? 'px-0 justify-center' : 'px-5'}`}>
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 relative flex items-center justify-center shrink-0">
            <img src={appLogo} alt="InfraOps 360" className="w-full h-full object-contain drop-shadow-sm" />
          </div>

          {!isCollapsed && (
            <div className="flex flex-col whitespace-nowrap overflow-hidden transition-opacity duration-300">
              <span className="text-slate-800 font-extrabold text-[15px] tracking-tight leading-none mb-1">InfraOps Tenant</span>
              <span className="text-slate-400 text-[9px] uppercase tracking-[0.2em] font-bold leading-none">Operations Center</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 py-6 space-y-1 overflow-y-auto overflow-x-hidden transition-all duration-300 ${isCollapsed ? 'px-3' : 'px-3'}`}>

        <div className={`mb-4 overflow-hidden whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'h-0 opacity-0 px-0 mb-0' : 'h-4 opacity-100 px-3'}`}>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Workspace
          </p>
        </div>

        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              title={isCollapsed ? item.name : ""}
              className={`flex items-center py-2.5 text-[14px] font-medium rounded-lg transition-colors group relative ${isCollapsed ? 'justify-center px-0' : 'px-3'
                } ${isActive
                  ? "bg-[#2d3748]/50 text-white border border-[#4a5568]/50"
                  : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
                }`}
            >
              {isActive && (
                <div className="absolute left-0 inset-y-0 w-1 bg-infra-green rounded-r-full"></div>
              )}
              <div className={`shrink-0 transition-colors ${isActive ? 'text-infra-green' : 'text-slate-400 group-hover:text-slate-300'}`}>
                {item.icon}
              </div>

              {!isCollapsed && (
                <span className={`ml-3 whitespace-nowrap overflow-hidden transition-opacity duration-300 ${isActive ? 'font-semibold text-infra-green' : 'font-medium'}`}>
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}

        <div className={`mb-4 mt-6 overflow-hidden whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'h-0 opacity-0 px-0 mb-0' : 'h-4 opacity-100 px-3'}`}>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            System Config
          </p>
        </div>

        {/* Collapsible Masters Tab */}
        <div>
          <button
            onClick={() => setIsMastersOpen(!isMastersOpen)}
            className={`w-full flex items-center justify-between py-2.5 text-[14px] font-medium rounded-lg border border-transparent text-slate-400 hover:bg-white/5 hover:text-white transition-colors group ${isCollapsed ? 'px-0 justify-center' : 'px-3'
              }`}
          >
            <div className="flex items-center">
              <div className="shrink-0 text-slate-400 group-hover:text-white">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              {!isCollapsed && <span className="ml-3">Masters (1-6)</span>}
            </div>
            {!isCollapsed && (
              <svg className={`w-4 h-4 text-slate-400 transition-transform ${isMastersOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>

          {isMastersOpen && !isCollapsed && (
            <div className="pl-8 pr-2 mt-1 space-y-1">
              {[
                { name: "Org Structure", href: "/tenant/masters/organization" },
                { name: "User Master", href: "/tenant/masters/users" },
                { name: "Roles & Perms", href: "/tenant/masters/roles" },
                { name: "Client Master", href: "/tenant/masters/clients" },
                { name: "Vendor Master", href: "/tenant/masters/vendors" },
              ].map((subItem) => {
                const isSubActive = pathname === subItem.href;
                return (
                  <Link
                    key={subItem.name}
                    to={subItem.href}
                    className={`block py-2 px-3 text-[13px] font-medium rounded-lg transition-colors relative ${isSubActive
                        ? "bg-[#2d3748]/50 text-infra-green border border-[#4a5568]/50"
                        : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                      }`}
                  >
                    {isSubActive && (
                      <div className="absolute left-0 inset-y-0 w-1 bg-infra-green rounded-r-full"></div>
                    )}
                    {subItem.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* User Profile Footer */}
      <div className={`p-4 shrink-0 transition-all duration-300`}>
        <div
          onClick={handleLogout}
          className={`flex items-center bg-[#1e293b] rounded-xl border border-white/5 cursor-pointer hover:bg-[#ef4444] hover:border-[#ef4444] transition-all duration-300 group ${isCollapsed ? 'p-2 justify-center' : 'p-3 justify-between'}`}
          title="Click to logout"
        >
          <div className="flex items-center overflow-hidden">
            <div className="h-9 w-9 bg-[#3b82f6] rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
              AC
            </div>

            {!isCollapsed && (
              <div className="ml-3 truncate whitespace-nowrap">
                <p className="text-sm font-semibold text-white leading-tight">Acme Corp</p>
                <p className="text-[10px] text-slate-400 truncate">admin@acme.com</p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <svg className="w-4 h-4 text-slate-400 shrink-0 ml-2 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          )}
        </div>

        {/* Collapse Button */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
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

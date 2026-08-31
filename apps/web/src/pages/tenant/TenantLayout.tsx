import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Building2, Box, Wrench, UserCheck, Briefcase, Network, Wallet, User, Settings, Search, Bell, Menu, X, LogOut, ChevronRight, ChevronLeft, MapPin, Shield, UserCog, Layers, DollarSign, ShoppingCart, Clipboard, TrendingUp, Clock, Plus } from 'lucide-react';
import sideIconImg from '../../assets/Side Icon.png';
import { useAuth } from '../../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { apiFetch, getRoleDashboardPath } from '../../lib/api';

export default function TenantLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, loading, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [initials, setInitials] = useState('U');
  const [profileName, setProfileName] = useState('Loading...');
  const [profileSubtext, setProfileSubtext] = useState('Premium Tenant');
  const [userType, setUserType] = useState<string | null>(null);
  const [userDepartment, setUserDepartment] = useState<string | null>(null);
  const [userDesignation, setUserDesignation] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState('project-1');
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});

  const toggleMenu = (name: string) => {
    setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const isPathActive = (subPath: string) => {
    if (subPath.includes('?')) {
      const [path, search] = subPath.split('?');
      if (location.pathname !== path) return false;
      const subParams = new URLSearchParams(search);
      const currentParams = new URLSearchParams(location.search);
      return subParams.get('tab') === currentParams.get('tab');
    }
    return location.pathname === subPath;
  };
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [showRegModal, setShowRegModal] = useState(false);
  useEffect(() => {
    if (!loading && !currentUser) navigate('/login');
  }, [currentUser, loading, navigate]);
  useEffect(() => {
    if (currentUser) {
      const mobile = currentUser.phoneNumber || '';
      const email = currentUser.email || '';

      // Check tenant registration status with apiFetch
      apiFetch(`/api/tenant/status/${currentUser.uid}?mobile=${encodeURIComponent(mobile)}&email=${encodeURIComponent(email)}`)
        .then(res => res.json())
        .then(statusData => {
          if (statusData.status === 'complete') {
            setIsRegistered(true);
            setShowRegModal(false);
            return apiFetch(`/api/tenant/profile/${currentUser.uid}?mobile=${encodeURIComponent(mobile)}&email=${encodeURIComponent(email)}`);
          } else {
            setIsRegistered(false);
            if (location.pathname !== '/tenant/registration' && location.pathname !== '/tenant/dashboard') {
              setShowRegModal(true);
            } else {
              setShowRegModal(false);
            }
            throw new Error('Registration incomplete');
          }
        })
        .then(res => { if (res && res.ok) return res.json(); throw new Error('Not registered'); })
        .then(data => {
          if (data?.adminName) {
            const userInitials = data.adminName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
            setInitials(userInitials);
            setProfileName(data.adminName);
            setUserType(data.userType);
            setUserDepartment(data.department || null);
            setUserDesignation(data.designation || null);
            if (data.userType === 'team_member') {
              setProfileSubtext(`${data.designation || 'Member'} · ${data.memberId || ''}`);
              // Redirect team members from generic /dashboard to their role URL
              if (location.pathname === '/tenant/dashboard') {
                const rolePath = getRoleDashboardPath(data.userType, data.department || null, data.designation || null);
                navigate(rolePath, { replace: true });
              }
            } else {
              setProfileSubtext(`Tenant Admin · ${data.memberId || ''}`);
            }
          }
        })
        .catch(() => {
          setInitials('U');
          setProfileName('Registered Tenant');
          setProfileSubtext('System Administrator');
          setUserType(null);
          setUserDepartment(null);
          setUserDesignation(null);
        });
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (isRegistered === false) {
      if (location.pathname === '/tenant/dashboard' || location.pathname === '/tenant/registration') {
        setShowRegModal(false);
      } else {
        setShowRegModal(true);
      }
    }
  }, [location.pathname, isRegistered]);
  const isAdmin = userType === 'admin' || userType === null;
  const isHR = 
    userType === 'team_member' && (
      String(userDepartment).toUpperCase().includes('HR') || 
      String(userDepartment).toUpperCase().includes('HUMAN RES') || 
      String(userDesignation).toUpperCase().includes('HR') || 
      String(userDesignation).toUpperCase().includes('HUMAN RES')
    );
  const isAccountant =
    userType === 'team_member' && (
      String(userDepartment).toUpperCase().includes('ACCOUNT') ||
      String(userDepartment).toUpperCase().includes('FINANCE') ||
      String(userDesignation).toUpperCase().includes('ACCOUNT') ||
      String(userDesignation).toUpperCase().includes('FINANCE')
    );

  const mainNavItems = [
    { name: 'Dashboard', path: '/tenant/dashboard', icon: Home },
    { 
      name: 'Projects & Work sites', 
      icon: Briefcase,
      isCollapsible: true,
      subItems: [
        { name: 'Projects', path: '/tenant/project-management', icon: Briefcase },
        { name: 'Work Sites', path: '/tenant/work-sites', icon: MapPin }
      ]
    },
    ...(isAdmin ? [
      { name: 'Access & Controls', path: '/tenant/access-controls', icon: Shield }
    ] : []),
    ...(isAdmin || isHR ? [
      { name: 'HR Management', path: '/tenant/hr', icon: UserCog },
      { name: 'Attendance Tracker', path: '/tenant/attendance-tracker', icon: UserCheck },
      { name: 'Team', path: '/tenant/team', icon: Users },
      { name: 'Divisions', path: '/tenant/divisions', icon: Network }
    ] : []),
    ...(isAdmin || isAccountant ? [
      { 
        name: 'Accounts & Ledgers', 
        icon: Wallet,
        isCollapsible: true,
        subItems: [
          { name: 'Ledger', path: '/tenant/accounts-ledgers?tab=ledger', icon: Wallet },
          { name: 'Project Costing & Details', path: '/tenant/accounts-ledgers?tab=project-costing', icon: TrendingUp },
          { name: 'Company Expenses', path: '/tenant/accounts-ledgers?tab=company-expenses', icon: DollarSign },
          { name: 'Assets & Liabilities', path: '/tenant/accounts-ledgers?tab=assets-liabilities', icon: Layers },
          { name: 'Create Ledger', path: '/tenant/accounts-ledgers?tab=create-ledger', icon: Plus }
        ]
      }
    ] : []),
  ];
  const preferenceNavItems = [
    { name: 'Profile', path: '/tenant/profile', icon: User },
    { name: 'Settings', path: '/tenant/settings', icon: Settings },
  ];
  const CollapsibleNavItem = ({ item }: { item: any }) => {
    const isSubActive = item.subItems.some((sub: any) => isPathActive(sub.path));
    const Icon = item.icon;
    const isOpen = openMenus[item.name] ?? isSubActive;
    return (
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => toggleMenu(item.name)}
          className={`w-full group flex items-center justify-between py-2.5 rounded-lg transition-all duration-150 relative ${
            isSubActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
          } ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}
          title={isCollapsed ? item.name : undefined}
        >
          {isSubActive && <span className="absolute left-0 inset-y-2 w-0.5 bg-[#46B351] rounded-r-full" />}
          <div className={`flex items-center min-w-0 ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
            <Icon size={isCollapsed ? 20 : 16} className={isSubActive ? 'text-[#46B351] shrink-0' : 'text-slate-500 group-hover:text-slate-300 shrink-0 transition-colors'} />
            {!isCollapsed && (
              <span className={`text-[13px] truncate ${isSubActive ? 'font-semibold text-white' : 'font-medium'}`}>
                {item.name}
              </span>
            )}
          </div>
          {!isCollapsed && (
            <ChevronRight 
              size={12} 
              className={`text-slate-500 transition-transform duration-150 ${isOpen ? 'rotate-90 text-[#46B351]' : ''}`} 
            />
          )}
        </button>
        
        {isOpen && !isCollapsed && (
          <div className="pl-6 space-y-0.5 transition-all duration-150">
            {item.subItems.map((sub: any) => {
              const isSubItemActive = isPathActive(sub.path);
              const SubIcon = sub.icon;
              return (
                <Link
                  key={sub.name}
                  to={sub.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`group flex items-center py-2 px-3 rounded-md transition-all duration-150 ${
                    isSubItemActive ? 'text-white bg-white/5 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <SubIcon size={12} className={`mr-2.5 ${isSubItemActive ? 'text-[#46B351]' : 'text-slate-600 group-hover:text-slate-400'}`} />
                  <span className="text-xs">{sub.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const NavLink = ({ item }: { item: any }) => {
    if (item.isCollapsible) {
      return <CollapsibleNavItem item={item} />;
    }
    const isActive = location.pathname === item.path || (item.path === '/tenant/dashboard' && location.pathname === '/tenant');
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
    <div className="h-screen bg-[#F1F5F9] flex flex-col md:flex-row overflow-hidden">
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className={`
        absolute md:static inset-y-0 left-0 z-50 flex flex-col h-full md:h-screen
        bg-[#0F172A] transform transition-all duration-300 ease-in-out relative
        ${isCollapsed ? 'w-[80px]' : 'w-[240px]'}
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>

        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-7 bg-[#1E293B] border border-slate-700 text-slate-400 rounded-full p-1 hover:text-white hidden md:flex items-center justify-center z-50 shadow-md transition-colors"
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
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-slate-500 mt-1">Work Simplified</p>
            </div>
          ) : (
            <div className="mt-1 flex justify-center w-full">
              <img src={sideIconImg} alt="InfraOps 360" className="w-8 h-8 object-contain" />
            </div>
          )}
          {!isCollapsed && (
            <button className="md:hidden text-slate-500 hover:text-white transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={20} />
            </button>
          )}
        </div>



        <div className={`border-t border-slate-800/70 mb-3 ${isCollapsed ? 'mx-2' : 'mx-4'}`} />

        {/* Scrollable Nav */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-5 pb-2">
          <div>
            {!isCollapsed && <p className="px-5 pb-1.5 text-[9px] font-black uppercase tracking-[0.25em] text-slate-600">Main Menu</p>}
            <nav className={`space-y-0.5 ${isCollapsed ? 'px-2' : 'px-3'}`}>
              {mainNavItems.map(item => <NavLink key={item.name} item={item} />)}
            </nav>
          </div>
          <div>
            <div className={`border-t border-slate-800/60 mb-4 ${isCollapsed ? 'mx-2 mb-2 mt-2' : 'mx-4'}`} />
            {!isCollapsed && <p className="px-5 pb-1.5 text-[9px] font-black uppercase tracking-[0.25em] text-slate-600">Preferences</p>}
            <nav className={`space-y-0.5 ${isCollapsed ? 'px-2' : 'px-3'}`}>
              {preferenceNavItems.map(item => <NavLink key={item.name} item={item} />)}
            </nav>
          </div>
        </div>

        {/* Profile + Logout */}
        <div className="shrink-0 border-t border-slate-800/60">
          <div
            className={`flex items-center py-3.5 cursor-pointer hover:bg-white/5 transition-colors ${isCollapsed ? 'justify-center px-0' : 'space-x-3 px-4'}`}
            onClick={() => navigate('/tenant/profile')}
            title={isCollapsed ? profileName : undefined}
          >
            <div className="h-8 w-8 rounded-lg bg-[#46B351] text-white flex items-center justify-center font-black text-xs shrink-0">
              {initials}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-white truncate leading-tight">{profileName}</p>
                <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{profileSubtext}</p>
              </div>
            )}
          </div>
          <button
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
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

        {/* White Top Header — NO brand text here */}
        <header className="bg-white border-b border-slate-100 h-14 flex items-center px-4 md:px-6 justify-between shadow-[0_1px_3px_rgba(0,0,0,0.04)] z-30 shrink-0">
          {/* Left: hamburger on mobile */}
          <button className="md:hidden text-slate-500 hover:text-slate-900" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={22} />
          </button>
          {/* Empty left on desktop — brand is in sidebar */}
          <div className="hidden md:block" />

          {/* Right: actions */}
          <div className="flex items-center space-x-4">
            <button className="text-slate-400 hover:text-slate-700 transition-colors">
              <Search size={18} />
            </button>
            <button className="text-slate-400 hover:text-slate-700 transition-colors relative">
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[8px] font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center">3</span>
            </button>
            <div
              onClick={() => navigate('/tenant/profile')}
              className="h-8 w-8 rounded-lg bg-[#0F172A] text-white flex items-center justify-center font-bold text-xs cursor-pointer"
            >
              {initials}
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white p-4 md:p-8">
          <div className="w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* REGISTRATION REQUIRED MODAL POPUP */}
      {showRegModal && isRegistered === false && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mb-2">
              Complete Company Registration
            </h3>

            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
              You are currently viewing the platform in preview mode. Please finish your 3-step company registration to create projects, manage work sites, and invite your team.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowRegModal(false);
                  navigate('/tenant/registration');
                }}
                className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                Complete Registration Now
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

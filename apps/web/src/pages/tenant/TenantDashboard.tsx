import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Building2, ArrowRight, CheckCircle2, ShieldCheck, User, MapPin, Globe, CreditCard, Users, FileText, Clock, Power, Mail, Phone, Briefcase, Paperclip, ChevronRight, Truck, DollarSign, TrendingUp, AlertCircle, Wallet, BarChart2, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRoleDashboardPath } from '../../lib/api';
import AdminDashboard from './dashboard/admin/AdminDashboard';
import AccountantDashboard from './dashboard/accountant/AccountantDashboard';
import HRDashboard from './dashboard/hr/HRDashboard';
import OperationsDashboard from './dashboard/operations/OperationsDashboard';
import EmployeeDashboard from './dashboard/employee/EmployeeDashboard';

interface Project {
  id: string;
  name: string;
  location: string;
  locationBlock: string;
  customer: string;
  commodity: string;
  status: string;
  is_pinned?: boolean;
}

interface ProfileData {
  adminName: string;
  designation: string;
  mobile: string;
  email: string;
  companyName: string;
  industryType: string;
  country: string;
  state: string;
  pincode: string;
  city: string;
  companySize?: string;
  companyWebsite?: string;
  gstNumber?: string;
  userType?: string;
  department?: string;
  memberId?: string;
  status?: 'Active' | 'Away' | 'On Duty' | 'Offline';
}

export default function TenantDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  const [registrationProgress, setRegistrationProgress] = useState(0);
  const [registrationStatus, setRegistrationStatus] = useState<string>('new');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [pinnedProjects, setPinnedProjects] = useState<Project[]>([]);
  const [status, setStatus] = useState<'Active' | 'Away' | 'On Duty' | 'Offline'>('Offline');
  const [loading, setLoading] = useState(true);

  const fetchPinnedProjects = async (uid: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;
      const res = await fetch(`${host}/api/tenant/projects/${uid}`);
      if (res.ok) {
        const data = await res.json();
        setPinnedProjects(data.filter((p: Project) => p.is_pinned));
      }
    } catch (err) {
      console.error('Failed to fetch pinned projects:', err);
    }
  };

  const fetchStatus = () => {
    if (currentUser) {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;
      
      const mobile = currentUser.phoneNumber || '';
      const email = currentUser.email || '';
      fetch(`${host}/api/tenant/status/${currentUser.uid}?mobile=${encodeURIComponent(mobile)}&email=${encodeURIComponent(email)}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.percentage !== undefined) {
            setRegistrationProgress(data.percentage);
          }
          if (data && data.status) {
            setRegistrationStatus(data.status);
          }
          if (data && (data.status === 'complete' || data.status === 'completed')) {
            fetch(`${host}/api/tenant/profile/${currentUser.uid}?mobile=${encodeURIComponent(mobile)}&email=${encodeURIComponent(email)}`)
              .then(res => res.json())
              .then(profileData => {
                setProfile(profileData);
                if (profileData && profileData.status) {
                  setStatus(profileData.status);
                }
                setLoading(false);
                fetchPinnedProjects(currentUser.uid);
              })
              .catch(err => {
                console.error(err);
                setLoading(false);
              });
          } else {
            setLoading(false);
          }
        })
        .catch(err => {
          console.error('Failed to fetch registration status:', err);
          setLoading(false);
        });
    }
  };
  useEffect(() => {
    fetchStatus();

    // Set up polling interval if status is not complete to catch late database commits
    let intervalId: any;
    if (currentUser && registrationStatus !== 'complete' && registrationStatus !== 'completed') {
      intervalId = setInterval(() => {
        fetchStatus();
      }, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [currentUser, registrationStatus]);

  const handleUpdateStatus = (newStatus: 'Active' | 'Away' | 'On Duty' | 'Offline') => {
    if (currentUser) {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const host = baseUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : baseUrl;
      
      fetch(`${host}/api/tenant/employee/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: currentUser.uid,
          status: newStatus,
        }),
      })
        .then(res => {
          if (res.ok) {
            setStatus(newStatus);
          } else {
            alert('Failed to update shift status');
          }
        })
        .catch(err => {
          console.error(err);
          alert('Connection error updating status');
        });
    }
  };

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (registrationProgress / 100) * circumference;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isFullyRegistered = registrationStatus === 'complete' || registrationStatus === 'completed';
  const currentPath = location.pathname;

  // Render based on current specific path (direct routing)
  if (currentPath === '/tenant/accountant-dashboard' && profile) {
    return <AccountantDashboard profile={profile} />;
  }

  if (currentPath === '/tenant/hr-dashboard') {
    return <HRDashboard />;
  }

  if (currentPath === '/tenant/operations-dashboard' && profile) {
    return <OperationsDashboard profile={profile} />;
  }

  if (currentPath === '/tenant/employee-dashboard' && profile) {
    return (
      <EmployeeDashboard 
        profile={profile} 
        status={status} 
        handleUpdateStatus={handleUpdateStatus} 
      />
    );
  }

  // Generic /tenant/dashboard path fallback/gates
  return (
    <div className="space-y-6">
      {/* REGISTRATION BANNER */}
      {!isFullyRegistered && (
        <div className="bg-[#F8FAFF] rounded-2xl p-6 border border-slate-200 flex flex-col md:flex-row items-center justify-between shadow-sm">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mr-4 relative shrink-0">
              <Building2 size={28} className="text-[#1E3A8A]" />
              <div className="absolute bottom-0 right-0 bg-white rounded-full">
                <CheckCircle2 size={16} className="text-[#1E3A8A]" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-black text-[#1E3A8A] mb-1">Complete Company Registration</h2>
              <p className="text-sm text-slate-600">
                Register your organization and activate your <span className="font-bold text-[#1E3A8A]">14-Day Free Trial</span>.
              </p>
              
              <div className="mt-4 flex items-center max-w-sm">
                {registrationProgress > 0 && (
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full mr-4">
                    <div className="h-full bg-[#1E3A8A] rounded-full" style={{ width: `${registrationProgress}%` }}></div>
                  </div>
                )}
                <button 
                  onClick={() => navigate('/tenant/registration')}
                  className="flex items-center text-sm font-bold text-[#1E3A8A] hover:underline group mr-4"
                >
                  {registrationProgress === 0 ? "Start Registration" : "Complete Registration"}
                  <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={fetchStatus}
                  className="flex items-center text-sm font-medium text-slate-500 hover:text-[#1E3A8A] transition-colors"
                  title="Sync with mobile"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
          
          <div className="shrink-0 ml-0 md:ml-8 relative">
            <div className="w-20 h-20 relative">
              <svg width="80" height="80" className="transform -rotate-90">
                <circle cx="40" cy="40" r={radius} stroke="#E2E8F0" strokeWidth="4" fill="none" />
                <circle 
                  cx="40" cy="40" r={radius} 
                  stroke="#1E3A8A" strokeWidth="4" fill="none" 
                  strokeDasharray={circumference} 
                  strokeDashoffset={strokeDashoffset} 
                  strokeLinecap="round" 
                  className="transition-all duration-1000 ease-in-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-slate-900 leading-none">{registrationProgress}%</span>
                <span className="text-[10px] text-slate-500 font-medium mt-1">Complete</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REAL REGISTERED USER PROFILE DASHBOARD OVERVIEW */}
      {isFullyRegistered && profile && (
        profile.userType === 'team_member' ? (
          (() => {
            const isHR = 
              String(profile.department).toUpperCase().includes('HR') || 
              String(profile.department).toUpperCase().includes('HUMAN RES') || 
              String(profile.designation).toUpperCase().includes('HR') || 
              String(profile.designation).toUpperCase().includes('HUMAN RES');

            const isAccountant =
              String(profile.department).toUpperCase().includes('ACCOUNT') ||
              String(profile.department).toUpperCase().includes('FINANCE') ||
              String(profile.designation).toUpperCase().includes('ACCOUNT') ||
              String(profile.designation).toUpperCase().includes('FINANCE');
              
            if (isHR) {
              return <HRDashboard />;
            }

            if (isAccountant) {
              return <AccountantDashboard profile={profile} />;
            }

            return (
              <EmployeeDashboard 
                profile={profile} 
                status={status} 
                handleUpdateStatus={handleUpdateStatus} 
              />
            );
          })()
        ) : (
          <AdminDashboard 
            profile={profile} 
            pinnedProjects={pinnedProjects} 
            isFullyRegistered={isFullyRegistered} 
          />
        )
      )}
    </div>
  );
}

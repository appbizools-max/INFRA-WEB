import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // e.g. ['admin', 'hr', 'accountant']
  allowedDepartments?: string[]; // e.g. ['HR', 'Finance', 'Accounts']
}

export default function RoleGuard({ children, allowedRoles, allowedDepartments }: RoleGuardProps) {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!currentUser) {
      setLoadingProfile(false);
      return;
    }

    const mobile = currentUser.phoneNumber || '';
    const email = currentUser.email || '';

    apiFetch(`/api/tenant/profile/${currentUser.uid}?mobile=${encodeURIComponent(mobile)}&email=${encodeURIComponent(email)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted) {
          setUserProfile(data);
          setLoadingProfile(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUserProfile(null);
          setLoadingProfile(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 font-medium">
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Verifying permissions...</span>
        </div>
      </div>
    );
  }

  // If no profile found or network error, permit Tenant Admins by default
  const userType = userProfile?.userType || 'admin';
  const designation = (userProfile?.designation || '').toUpperCase();
  const department = (userProfile?.department || '').toUpperCase();

  // Tenant Admin always has full access to all tenant modules
  if (userType === 'admin') {
    return <>{children}</>;
  }

  let hasAccess = false;

  // Check userType/role authorization
  if (allowedRoles && allowedRoles.length > 0) {
    const matchedRole = allowedRoles.some((r) => {
      const target = r.toUpperCase();
      return (
        userType.toUpperCase() === target ||
        designation.includes(target) ||
        department.includes(target)
      );
    });
    if (matchedRole) hasAccess = true;
  }

  // Check department authorization
  if (allowedDepartments && allowedDepartments.length > 0) {
    const matchedDept = allowedDepartments.some((d) => department.includes(d.toUpperCase()));
    if (matchedDept) hasAccess = true;
  }

  // Default access if no specific role restrictions are specified
  if (!allowedRoles && !allowedDepartments) {
    hasAccess = true;
  }

  if (!hasAccess) {
    console.warn(`[RoleGuard] Access denied for path "${location.pathname}". User: ${userType}, Dept: ${department}`);
    return <Navigate to="/tenant/dashboard" replace />;
  }

  return <>{children}</>;
}

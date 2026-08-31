import { auth } from './firebase';

const getBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return envUrl.startsWith('http://localhost:3001') ? 'http://localhost:5000' : envUrl;
};

export const API_BASE_URL = getBaseUrl();

/**
 * Helper for making authenticated fetch requests to tenant endpoints.
 * Automatically attaches the Firebase ID token in the Authorization header.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  let user = auth.currentUser;
  let token: string | null = null;

  if (user) {
    try {
      token = await user.getIdToken(/* forceRefresh */ false);
    } catch (e) {
      console.warn('Failed to get Firebase ID token, attempting refresh:', e);
      try {
        token = await user.getIdToken(/* forceRefresh */ true);
      } catch (retryErr) {
        console.error('Firebase token refresh failed:', retryErr);
      }
    }
  }

  if (!token) {
    try {
      const savedDevUser = localStorage.getItem('infraops360_dev_user');
      if (savedDevUser) {
        const parsed = JSON.parse(savedDevUser);
        token = parsed.uid || parsed.firebaseUid || 'MOCK_TOKEN_DEV';
      }
    } catch (e) {
      console.warn('Failed to parse dev user mock from localStorage:', e);
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  try {
    return await fetch(url, { ...options, headers });
  } catch (err) {
    console.warn(`[API] Connection refused or offline at ${url}:`, err);
    return new Response(JSON.stringify({ error: 'Backend server unavailable. Please set VITE_API_URL or start backend.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Helper for making authenticated fetch requests to SaaS Super-Admin endpoints.
 * Automatically attaches the SaaS Admin JWT token from sessionStorage/localStorage.
 */
export async function adminApiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = sessionStorage.getItem('saas_admin_jwt') || localStorage.getItem('saas_admin_jwt');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  try {
    return await fetch(url, { ...options, headers });
  } catch (err) {
    console.warn(`[Admin API] Connection refused or offline at ${url}:`, err);
    return new Response(JSON.stringify({ error: 'Backend server unavailable. Please set VITE_API_URL or start backend.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Returns the role-specific dashboard URL for a logged-in user.
 * Admin               → /tenant/dashboard
 * HR                  → /tenant/hr-dashboard
 * Accountant/Finance  → /tenant/accountant-dashboard
 * Operations/Logistics→ /tenant/operations-dashboard
 * Employee (default)  → /tenant/employee-dashboard
 */
export function getRoleDashboardPath(
  userType: string | null,
  department: string | null,
  designation: string | null
): string {
  if (!userType || userType === 'admin') return '/tenant/dashboard';

  const dept = (department || '').toUpperCase();
  const desig = (designation || '').toUpperCase();

  const isHR =
    dept.includes('HR') || dept.includes('HUMAN RES') ||
    desig.includes('HR') || desig.includes('HUMAN RES');

  const isAccountant =
    dept.includes('ACCOUNT') || dept.includes('FINANCE') ||
    desig.includes('ACCOUNT') || desig.includes('FINANCE') ||
    desig.includes('CFO') || desig.includes('TREASURER');

  const isOperations =
    dept.includes('OPERAT') || dept.includes('LOGISTICS') || dept.includes('SITE') ||
    desig.includes('OPERAT') || desig.includes('OPERATION') ||
    desig.includes('LOGISTICS') || desig.includes('SITE MANAGER') ||
    desig.includes('SUPERVISOR') || desig.includes('COORDINATOR');

  if (isHR) return '/tenant/hr-dashboard';
  if (isAccountant) return '/tenant/accountant-dashboard';
  if (isOperations) return '/tenant/operations-dashboard';

  return '/tenant/employee-dashboard';
}

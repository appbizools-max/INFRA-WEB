import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (import.meta.env.DEV) {
      const savedDevUser = localStorage.getItem('infraops360_dev_user');
      if (savedDevUser) {
        try {
          const parsed = JSON.parse(savedDevUser);
          setCurrentUser(parsed);
          setLoading(false);
          return;
        } catch (e) {}
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const logout = async () => {
    localStorage.removeItem('infraops360_dev_user');
    localStorage.removeItem('infraops360_dev_token');
    sessionStorage.removeItem('saas_admin_jwt');
    localStorage.removeItem('saas_admin_jwt');
    document.cookie = 'infraops_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0';
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Sign out error:", e);
    }
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};


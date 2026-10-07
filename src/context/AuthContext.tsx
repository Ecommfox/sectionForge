import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types/auth';

export const TEST_PROFILES: UserProfile[] = [
  {
    id: 'user_dev_01',
    name: 'Joaquim Chango',
    email: 'joaquim@agencyforge.dev',
    role: 'agency_dev',
    roleTitle: 'Shopify Tech Lead & Theme Architect',
    avatarColor: '#153123',
    initials: 'JC',
    spaceName: 'TrailGear Production Space'
  },
  {
    id: 'user_des_02',
    name: 'Elena Rostova',
    email: 'elena@designatelier.studio',
    role: 'builder_designer',
    roleTitle: 'Senior Design Systems Lead',
    avatarColor: '#bd593c',
    initials: 'ER',
    spaceName: 'Nordic Living Catalog'
  },
  {
    id: 'user_merch_03',
    name: 'Marcus Vance',
    email: 'marcus@peakoutdoors.shop',
    role: 'store_merchant',
    roleTitle: 'Ecommerce Director @ Peak Gear',
    avatarColor: '#2b503e',
    initials: 'MV',
    spaceName: 'Peak Gear Staging'
  }
];

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  storageTarget: 'localStorage' | 'sessionStorage';
  loginAs: (profile: UserProfile) => void;
  loginCustom: (name: string, email: string, role?: UserRole) => void;
  logout: () => void;
  setStorageTarget: (target: 'localStorage' | 'sessionStorage') => void;
  clearSession: () => void;
}

const STORAGE_KEY = 'sectionforge_auth_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [storageTarget, setStorageTargetState] = useState<'localStorage' | 'sessionStorage'>('localStorage');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      // fallback
    }
    // Default to the first test profile so the app is immediately ready for testing
    return TEST_PROFILES[0];
  });

  const persistUser = (user: UserProfile | null, target: 'localStorage' | 'sessionStorage') => {
    try {
      if (user) {
        const serialized = JSON.stringify(user);
        if (target === 'localStorage') {
          localStorage.setItem(STORAGE_KEY, serialized);
          sessionStorage.removeItem(STORAGE_KEY);
        } else {
          sessionStorage.setItem(STORAGE_KEY, serialized);
          localStorage.removeItem(STORAGE_KEY);
        }
      } else {
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Storage persistence failed', e);
    }
  };

  const loginAs = (profile: UserProfile) => {
    setCurrentUser(profile);
    persistUser(profile, storageTarget);
  };

  const loginCustom = (name: string, email: string, role: UserRole = 'custom') => {
    const initials = name
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

    const profile: UserProfile = {
      id: 'custom_' + Date.now(),
      name,
      email,
      role,
      roleTitle: role === 'agency_dev' ? 'Shopify Theme Developer' : 'Builder.io Creator',
      avatarColor: '#153123',
      initials,
      spaceName: 'Custom Space'
    };
    setCurrentUser(profile);
    persistUser(profile, storageTarget);
  };

  const logout = () => {
    setCurrentUser(null);
    persistUser(null, storageTarget);
  };

  const clearSession = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  };

  const setStorageTarget = (target: 'localStorage' | 'sessionStorage') => {
    setStorageTargetState(target);
    if (currentUser) {
      persistUser(currentUser, target);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        storageTarget,
        loginAs,
        loginCustom,
        logout,
        setStorageTarget,
        clearSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

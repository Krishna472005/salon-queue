import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { StaffRole } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: StaffRole | null;
  isStaff: boolean;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithDemoPin: (pin: string) => Promise<{ success: boolean; error?: string; redirectPath?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<StaffRole | null>(null);
  const [isStaff, setIsStaff] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch staff record for an authenticated email
  const checkStaffRole = async (email: string | undefined): Promise<{ role: StaffRole | null; isStaff: boolean }> => {
    if (!email) {
      return { role: null, isStaff: false };
    }

    try {
      const { data, error } = await supabase
        .from('staff')
        .select('role')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (error || !data) {
        return { role: null, isStaff: false };
      }

      return { role: data.role as StaffRole, isStaff: true };
    } catch {
      return { role: null, isStaff: false };
    }
  };

  useEffect(() => {
    // 1. Initial session load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user?.email) {
        const staffData = await checkStaffRole(session.user.email);
        setRole(staffData.role);
        setIsStaff(staffData.isStaff);
      } else {
        setRole(null);
        setIsStaff(false);
      }
      setLoading(false);
    });

    // 2. Auth state subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user?.email) {
        const staffData = await checkStaffRole(session.user.email);
        setRole(staffData.role);
        setIsStaff(staffData.isStaff);
      } else {
        setRole(null);
        setIsStaff(false);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      throw error;
    }
  };

  const loginWithDemoPin = async (pin: string): Promise<{ success: boolean; error?: string; redirectPath?: string }> => {
    const isPinEnabled = import.meta.env.VITE_DEMO_PIN_ENABLED !== 'false';
    if (!isPinEnabled) {
      return { success: false, error: 'Demo PIN login is disabled.' };
    }

    let email = '';
    let password = '';
    let expectedRedirect = '/reception';

    if (pin === '2468') {
      // Receptionist
      email = import.meta.env.VITE_DEMO_RECEPTION_EMAIL || 'reception@all1salon.com';
      password = import.meta.env.VITE_DEMO_RECEPTION_PASSWORD || 'All1Reception2468!';
      expectedRedirect = '/reception';
    } else if (pin === '1357') {
      // Owner
      email = import.meta.env.VITE_DEMO_OWNER_EMAIL || 'owner@all1salon.com';
      password = import.meta.env.VITE_DEMO_OWNER_PASSWORD || 'All1Owner1357!';
      expectedRedirect = '/owner';
    } else if (pin === '1122') {
      // Barber
      email = import.meta.env.VITE_DEMO_BARBER_EMAIL || 'barber@all1salon.com';
      password = import.meta.env.VITE_DEMO_BARBER_PASSWORD || 'All1Barber1122!';
      expectedRedirect = '/barber/mahesh';
    } else {
      return { success: false, error: 'Invalid PIN. Try 2468 (Reception), 1357 (Owner), or 1122 (Barber).' };
    }

    if (!isSupabaseConfigured) {
      // Offline / Pre-Supabase mock demo session for local UI testing
      const mockRole = pin === '2468' ? 'receptionist' : pin === '1357' ? 'owner' : 'barber';
      setRole(mockRole as StaffRole);
      setIsStaff(true);
      return { success: true, redirectPath: expectedRedirect };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: `Supabase Auth error (${error.message}). Ensure demo user '${email}' is created in Supabase Auth.`,
      };
    }

    if (data.user) {
      setUser(data.user);
      setSession(data.session);
      const staffData = await checkStaffRole(data.user.email);
      setRole(staffData.role);
      setIsStaff(staffData.isStaff);
    }

    return { success: true, redirectPath: expectedRedirect };
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setRole(null);
    setIsStaff(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        isStaff,
        loading,
        loginWithGoogle,
        loginWithDemoPin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

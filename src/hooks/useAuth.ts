import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { clearSensitiveData } from '@/utils/localDataManager';

export type AppRole = 'owner' | 'admin' | 'user';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: AppRole | null;
  roleLoading: boolean;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  // Fetch user role from database
  const fetchUserRole = useCallback(async (userId: string) => {
    setRoleLoading(true);
    try {
      // Use the security definer function to get role
      const { data, error } = await supabase
        .rpc('get_user_role', { _user_id: userId });
      
      if (error) {
        console.error('Error fetching user role:', error);
        // Fallback: try direct query
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (!roleError && roleData) {
          setRole(roleData.role as AppRole);
        } else {
          setRole(null);
        }
      } else {
        setRole(data as AppRole);
      }
    } catch (err) {
      console.error('Exception fetching role:', err);
      setRole(null);
    } finally {
      setRoleLoading(false);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Fetch role after auth state change (deferred to avoid deadlock)
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setRole(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Fetch role for existing session
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserRole]);

  const signUp = async (email: string, password: string, fullName?: string) => {
    // توجيه Magic Link إلى صفحة callback غير المحمية
    const redirectUrl = `${window.location.origin}/app/auth/callback`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName
        }
      }
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  };

  const signOut = async () => {
    // Clear sensitive PII data from localStorage on logout
    clearSensitiveData();
    
    const { error } = await supabase.auth.signOut();
    setRole(null);
    return { error };
  };

  // Helper functions to check roles
  const isOwner = role === 'owner';
  const isAdmin = role === 'admin' || role === 'owner';
  const isUser = role === 'user' || role === 'admin' || role === 'owner';

  const hasRole = (requiredRoles: AppRole[]): boolean => {
    if (!role) return false;
    return requiredRoles.includes(role);
  };

  // التحقق من توثيق البريد - مصدر الحقيقة: email_confirmed_at
  const isEmailVerified = !!user?.email_confirmed_at;

  return {
    user,
    session,
    loading,
    role,
    roleLoading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!session,
    isEmailVerified,
    isOwner,
    isAdmin,
    isUser,
    hasRole,
  };
}

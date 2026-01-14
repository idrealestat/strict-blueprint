import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { clearSensitiveData } from '@/utils/localDataManager';

// الأدوار المعتمدة:
// owner = مالك النظام (شخص واحد)
// admin = مدير مكتب/شركة (صلاحيات داخل حسابه فقط)
// member = عضو فريق (صلاحيات محدودة)
export type AppRole = 'owner' | 'admin' | 'member';

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
        console.log('[Auth] Event:', event, 'Session:', !!session);
        
        // إذا انتهت الجلسة، حاول تجديدها
        if (event === 'TOKEN_REFRESHED') {
          console.log('[Auth] Token refreshed successfully');
        }
        
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

    // THEN check for existing session and refresh if needed
    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] getSession error:', error);
          // محاولة تجديد الجلسة
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error('[Auth] refreshSession error:', refreshError);
            setSession(null);
            setUser(null);
            setLoading(false);
            return;
          }
          if (refreshData.session) {
            setSession(refreshData.session);
            setUser(refreshData.session.user);
            setLoading(false);
            fetchUserRole(refreshData.session.user.id);
            return;
          }
        }
        
        // إذا كانت الجلسة موجودة ولكن التوكن قريب من الانتهاء، جدّده
        if (session) {
          const expiresAt = session.expires_at;
          const now = Math.floor(Date.now() / 1000);
          const timeUntilExpiry = expiresAt ? expiresAt - now : 0;
          
          // إذا بقي أقل من 5 دقائق، جدّد الجلسة
          if (timeUntilExpiry < 300) {
            console.log('[Auth] Token expiring soon, refreshing...');
            const { data: refreshData } = await supabase.auth.refreshSession();
            if (refreshData.session) {
              setSession(refreshData.session);
              setUser(refreshData.session.user);
              setLoading(false);
              fetchUserRole(refreshData.session.user.id);
              return;
            }
          }
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Fetch role for existing session
        if (session?.user) {
          fetchUserRole(session.user.id);
        }
      } catch (err) {
        console.error('[Auth] Init session error:', err);
        setLoading(false);
      }
    };

    initSession();

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
  // owner = مالك النظام الوحيد (صلاحيات كاملة)
  const isOwner = role === 'owner';
  // admin = مدير مكتب (صلاحيات داخل حسابه فقط) - لا يشمل Owner
  const isAdmin = role === 'admin';
  // isMember = عضو فريق
  const isMember = role === 'member';
  // hasAnyRole = أي دور معتمد (للتحقق من أن المستخدم له دور)
  const hasAnyRole = role === 'owner' || role === 'admin' || role === 'member';

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
    isMember,
    hasAnyRole,
    hasRole,
  };
}

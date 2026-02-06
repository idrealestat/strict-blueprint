/**
 * useFacebookAuth Hook
 * Manages Facebook/Instagram OAuth authentication and token lifecycle
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FacebookUser {
  id: string;
  name: string;
  email?: string;
}

interface FacebookPage {
  id: string;
  name: string;
  accessToken: string;
  instagram?: {
    id: string;
    username: string;
    profile_picture_url?: string;
  } | null;
}

interface FacebookAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: FacebookUser | null;
  pages: FacebookPage[];
  accessToken: string | null;
  expiresAt: number | null;
}

const STORAGE_KEY = 'facebook_auth_state';

export function useFacebookAuth() {
  const [state, setState] = useState<FacebookAuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    pages: [],
    accessToken: null,
    expiresAt: null
  });

  // Load saved state on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const now = Date.now();
        
        // Check if token is still valid (with 1 hour buffer)
        if (parsed.expiresAt && parsed.expiresAt > now + 3600000) {
          setState({
            ...parsed,
            isLoading: false
          });
        } else {
          // Token expired, clear state
          localStorage.removeItem(STORAGE_KEY);
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Save state changes
  useEffect(() => {
    if (state.isAuthenticated && state.accessToken) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        pages: state.pages,
        accessToken: state.accessToken,
        expiresAt: state.expiresAt
      }));
    }
  }, [state]);

  // Get OAuth URL and start auth flow
  const startAuth = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const redirectUri = `${window.location.origin}/facebook-callback`;
      
      // Use query params for this action
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-auth?action=get_auth_url&redirect_uri=${encodeURIComponent(redirectUri)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          }
        }
      );

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      // Save state for callback verification
      localStorage.setItem('facebook_oauth_state', result.state);
      
      // Open Facebook OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.innerWidth - width) / 2;
      const top = window.screenY + (window.innerHeight - height) / 2;
      
      const popup = window.open(
        result.authUrl,
        'facebook_oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for callback
      const handleMessage = async (event: MessageEvent) => {
        if (event.data?.type === 'facebook_oauth_callback') {
          window.removeEventListener('message', handleMessage);
          popup?.close();

          if (event.data.code) {
            await exchangeToken(event.data.code, redirectUri);
          } else if (event.data.error) {
            toast.error('فشل في تسجيل الدخول: ' + event.data.error);
            setState(prev => ({ ...prev, isLoading: false }));
          }
        }
      };

      window.addEventListener('message', handleMessage);

    } catch (error) {
      console.error('Facebook auth error:', error);
      toast.error('حدث خطأ أثناء بدء المصادقة');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Exchange authorization code for tokens
  const exchangeToken = useCallback(async (code: string, redirectUri: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-auth?action=exchange_token`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code, redirectUri })
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      // Calculate expiry time
      const expiresAt = Date.now() + (result.expiresIn * 1000);

      setState({
        isAuthenticated: true,
        isLoading: false,
        user: result.user,
        pages: result.pages,
        accessToken: result.accessToken,
        expiresAt
      });

      toast.success('تم ربط حساب Facebook بنجاح!');
    } catch (error) {
      console.error('Token exchange error:', error);
      toast.error('فشل في تبادل الرمز');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Refresh token before expiry
  const refreshToken = useCallback(async () => {
    if (!state.accessToken) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-auth?action=refresh_token`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ accessToken: state.accessToken })
        }
      );

      const result = await response.json();

      if (result.success) {
        const expiresAt = Date.now() + (result.expiresIn * 1000);
        setState(prev => ({
          ...prev,
          accessToken: result.accessToken,
          expiresAt
        }));
      }
    } catch (error) {
      console.error('Token refresh error:', error);
    }
  }, [state.accessToken]);

  // Get connected accounts
  const getAccounts = useCallback(async () => {
    if (!state.accessToken) return null;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-auth?action=get_accounts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ accessToken: state.accessToken })
        }
      );

      const result = await response.json();

      if (result.success) {
        setState(prev => ({ ...prev, pages: result.accounts }));
        return result.accounts;
      }
      return null;
    } catch (error) {
      console.error('Get accounts error:', error);
      return null;
    }
  }, [state.accessToken]);

  // Disconnect
  const disconnect = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('facebook_oauth_state');
    setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      pages: [],
      accessToken: null,
      expiresAt: null
    });
    toast.success('تم فك ربط حساب Facebook');
  }, []);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (state.expiresAt && state.accessToken) {
      const timeUntilExpiry = state.expiresAt - Date.now();
      // Refresh 1 day before expiry
      const refreshTime = timeUntilExpiry - (24 * 60 * 60 * 1000);

      if (refreshTime > 0) {
        const timeout = setTimeout(refreshToken, refreshTime);
        return () => clearTimeout(timeout);
      } else if (timeUntilExpiry > 0) {
        // Token about to expire, refresh now
        refreshToken();
      }
    }
  }, [state.expiresAt, state.accessToken, refreshToken]);

  return {
    ...state,
    startAuth,
    disconnect,
    refreshToken,
    getAccounts
  };
}

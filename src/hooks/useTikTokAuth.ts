/**
 * useTikTokAuth.ts
 * Hook لإدارة مصادقة TikTok Login Kit
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TikTokUser {
  open_id: string;
  display_name: string;
  avatar_url: string;
  bio_description?: string;
  profile_deep_link?: string;
  is_verified?: boolean;
  follower_count?: number;
  following_count?: number;
  likes_count?: number;
}

export interface TikTokAuthState {
  isConnected: boolean;
  isLoading: boolean;
  user: TikTokUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

const TIKTOK_STORAGE_KEY = 'tiktok_auth_state';

// TikTok OAuth scopes
const TIKTOK_SCOPES = [
  'user.info.basic',
  'video.upload',
  'video.publish'
].join(',');

// Callback URL
const CALLBACK_URL = 'https://icfizajxhgkxuwunhvtp.supabase.co/functions/v1/tiktok-callback';

export function useTikTokAuth() {
  const [authState, setAuthState] = useState<TikTokAuthState>({
    isConnected: false,
    isLoading: true,
    user: null,
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
  });

  // Load stored auth state
  useEffect(() => {
    const stored = localStorage.getItem(TIKTOK_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Check if token is still valid
        if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
          setAuthState({
            ...parsed,
            isLoading: false,
          });
        } else {
          // Token expired, clear storage
          localStorage.removeItem(TIKTOK_STORAGE_KEY);
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch {
        localStorage.removeItem(TIKTOK_STORAGE_KEY);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Save auth state to localStorage
  const saveAuthState = useCallback((state: Partial<TikTokAuthState>) => {
    const newState = { ...authState, ...state };
    setAuthState(newState);
    localStorage.setItem(TIKTOK_STORAGE_KEY, JSON.stringify(newState));
  }, [authState]);

  // Initialize OAuth flow
  const initiateLogin = useCallback(async () => {
    try {
      // Get client key from edge function
      const { data, error } = await supabase.functions.invoke('tiktok-auth', {
        body: { action: 'get_auth_url' }
      });

      if (error) throw error;

      if (data?.authUrl) {
        // Store state for verification
        localStorage.setItem('tiktok_auth_state_param', data.state);
        // Redirect to TikTok
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('TikTok login error:', error);
      toast.error('فشل في بدء تسجيل الدخول');
    }
  }, []);

  // Exchange code for tokens
  const handleCallback = useCallback(async (code: string, state: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // Verify state
      const storedState = localStorage.getItem('tiktok_auth_state_param');
      if (storedState && storedState !== state) {
        throw new Error('Invalid state parameter');
      }

      // Exchange code for tokens
      const { data, error } = await supabase.functions.invoke('tiktok-auth', {
        body: { action: 'exchange_code', code }
      });

      if (error) throw error;

      if (data?.access_token) {
        // Fetch user info
        const userInfo = await fetchUserInfo(data.access_token);

        saveAuthState({
          isConnected: true,
          isLoading: false,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: Date.now() + (data.expires_in * 1000),
          user: userInfo,
        });

        localStorage.removeItem('tiktok_auth_state_param');
        localStorage.removeItem('tiktok_auth_code');
        toast.success('تم ربط تيك توك بنجاح');
        return true;
      }
    } catch (error) {
      console.error('TikTok callback error:', error);
      toast.error('فشل في إتمام التفويض');
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
    return false;
  }, [saveAuthState]);

  // Fetch user info from TikTok
  const fetchUserInfo = async (accessToken: string): Promise<TikTokUser | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('tiktok-auth', {
        body: { action: 'get_user_info', accessToken }
      });

      if (error) throw error;
      return data?.user || null;
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  };

  // Refresh access token
  const refreshAccessToken = useCallback(async () => {
    if (!authState.refreshToken) return false;

    try {
      const { data, error } = await supabase.functions.invoke('tiktok-auth', {
        body: { 
          action: 'refresh_token', 
          refreshToken: authState.refreshToken 
        }
      });

      if (error) throw error;

      if (data?.access_token) {
        saveAuthState({
          accessToken: data.access_token,
          refreshToken: data.refresh_token || authState.refreshToken,
          expiresAt: Date.now() + (data.expires_in * 1000),
        });
        return true;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      // Token refresh failed, disconnect
      disconnect();
    }
    return false;
  }, [authState.refreshToken, saveAuthState]);

  // Disconnect TikTok
  const disconnect = useCallback(() => {
    localStorage.removeItem(TIKTOK_STORAGE_KEY);
    localStorage.removeItem('tiktok_auth_state_param');
    localStorage.removeItem('tiktok_auth_code');
    setAuthState({
      isConnected: false,
      isLoading: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
    });
    toast.success('تم فك ربط تيك توك');
  }, []);

  // Check if token needs refresh
  const ensureValidToken = useCallback(async () => {
    if (!authState.accessToken || !authState.expiresAt) return false;
    
    // Refresh if expiring in next 5 minutes
    if (Date.now() > authState.expiresAt - 300000) {
      return await refreshAccessToken();
    }
    return true;
  }, [authState.accessToken, authState.expiresAt, refreshAccessToken]);

  return {
    ...authState,
    initiateLogin,
    handleCallback,
    disconnect,
    refreshAccessToken,
    ensureValidToken,
  };
}

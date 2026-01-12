/**
 * useBehavioralTracking.ts
 * Hook for tracking user behavioral signals without being intrusive
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

type SignalType = 'freeze' | 'exit' | 'hesitation' | 'rapid_navigation' | 'repeated_errors' | 'typing_hesitation';

interface BehavioralSignal {
  signal_type: SignalType;
  page_path: string;
  page_name?: string;
  duration_seconds?: number;
  metadata?: Record<string, any>;
}

interface TrackingConfig {
  freezeThreshold: number; // seconds before considering "frozen"
  rapidNavThreshold: number; // max seconds between navigations to be "rapid"
  rapidNavCount: number; // number of rapid navigations to trigger signal
  typingHesitationThreshold: number; // seconds of inactivity while typing
}

const DEFAULT_CONFIG: TrackingConfig = {
  freezeThreshold: 45,
  rapidNavThreshold: 3,
  rapidNavCount: 4,
  typingHesitationThreshold: 10,
};

// Page names mapping
const PAGE_NAMES: Record<string, string> = {
  '/app/dashboard': 'لوحة التحكم',
  '/app/crm': 'إدارة العملاء',
  '/app/platform': 'منصتي',
  '/app/analytics': 'التحليلات',
  '/app/calendar': 'التقويم',
  '/app/settings': 'الإعدادات',
  '/app/business-card': 'البطاقة الرقمية',
  '/app/smart-opportunities': 'الفرص الذكية',
};

export function useBehavioralTracking(config: Partial<TrackingConfig> = {}) {
  const location = useLocation();
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Session management
  const sessionIdRef = useRef<string>(getOrCreateSessionId());
  const userIdRef = useRef<string | null>(null);
  
  // Tracking state
  const pageEntryTimeRef = useRef<number>(Date.now());
  const lastActivityRef = useRef<number>(Date.now());
  const navigationTimesRef = useRef<number[]>([]);
  const errorsRef = useRef<string[]>([]);
  const signalsOnPageRef = useRef<Set<SignalType>>(new Set());
  const isTypingRef = useRef<boolean>(false);
  const typingStartRef = useRef<number | null>(null);
  
  // Silent mode
  const [silentMode, setSilentMode] = useState(() => {
    return localStorage.getItem('assistant_silent_mode') === 'true';
  });

  // Get or create session ID
  function getOrCreateSessionId(): string {
    const stored = sessionStorage.getItem('behavioral_session_id');
    if (stored) return stored;
    
    const newId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('behavioral_session_id', newId);
    return newId;
  }

  // Initialize user and session
  useEffect(() => {
    const initSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userIdRef.current = user.id;
        
        // Create or update session record
        await supabase.from('behavioral_sessions').upsert({
          session_id: sessionIdRef.current,
          user_id: user.id,
          pages_visited: [location.pathname],
        }, { onConflict: 'session_id' });
      }
    };
    
    initSession();
  }, []);

  // Record a behavioral signal
  const recordSignal = useCallback(async (signal: BehavioralSignal): Promise<string | null> => {
    if (!userIdRef.current) return null;
    
    // Don't record same signal type twice on same page
    if (signalsOnPageRef.current.has(signal.signal_type)) return null;
    signalsOnPageRef.current.add(signal.signal_type);
    
    try {
      const { data, error } = await supabase.from('behavioral_signals').insert({
        user_id: userIdRef.current,
        session_id: sessionIdRef.current,
        signal_type: signal.signal_type,
        page_path: signal.page_path,
        page_name: signal.page_name || PAGE_NAMES[signal.page_path] || signal.page_path,
        duration_seconds: signal.duration_seconds,
        metadata: signal.metadata || {},
      }).select('id').single();

      if (error) throw error;
      
      // Update session signal count
      await supabase.from('behavioral_sessions')
        .update({ 
          total_signals: supabase.rpc ? undefined : 1, // Will be incremented
          was_stuck: true,
        })
        .eq('session_id', sessionIdRef.current);
      
      return data?.id || null;
    } catch (err) {
      console.error('Failed to record signal:', err);
      return null;
    }
  }, []);

  // Track page freeze (user stops interacting)
  useEffect(() => {
    const checkFreeze = setInterval(() => {
      const inactiveSeconds = (Date.now() - lastActivityRef.current) / 1000;
      
      if (inactiveSeconds >= fullConfig.freezeThreshold) {
        recordSignal({
          signal_type: 'freeze',
          page_path: location.pathname,
          duration_seconds: Math.floor(inactiveSeconds),
          metadata: { 
            timeOnPage: Math.floor((Date.now() - pageEntryTimeRef.current) / 1000) 
          },
        });
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkFreeze);
  }, [location.pathname, fullConfig.freezeThreshold, recordSignal]);

  // Track page navigation
  useEffect(() => {
    const now = Date.now();
    
    // Reset signals for new page
    signalsOnPageRef.current.clear();
    pageEntryTimeRef.current = now;
    lastActivityRef.current = now;
    
    // Track rapid navigation
    navigationTimesRef.current.push(now);
    
    // Keep only recent navigations
    const recentNavs = navigationTimesRef.current.filter(
      t => (now - t) < fullConfig.rapidNavThreshold * 1000 * fullConfig.rapidNavCount
    );
    navigationTimesRef.current = recentNavs;
    
    // Check for rapid navigation pattern
    if (recentNavs.length >= fullConfig.rapidNavCount) {
      const avgInterval = (recentNavs[recentNavs.length - 1] - recentNavs[0]) / (recentNavs.length - 1);
      if (avgInterval < fullConfig.rapidNavThreshold * 1000) {
        recordSignal({
          signal_type: 'rapid_navigation',
          page_path: location.pathname,
          metadata: { 
            pagesInSequence: recentNavs.length,
            avgIntervalMs: Math.floor(avgInterval),
          },
        });
      }
    }
    
  }, [location.pathname]);

  // Track user activity
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const handleKeyDown = () => {
      updateActivity();
      
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        typingStartRef.current = Date.now();
      }
    };

    const handleKeyUp = () => {
      // Delay to detect hesitation
      setTimeout(() => {
        if (isTypingRef.current && typingStartRef.current) {
          const typingDuration = (Date.now() - typingStartRef.current) / 1000;
          if (typingDuration > fullConfig.typingHesitationThreshold) {
            recordSignal({
              signal_type: 'typing_hesitation',
              page_path: location.pathname,
              duration_seconds: Math.floor(typingDuration),
            });
          }
        }
        isTypingRef.current = false;
        typingStartRef.current = null;
      }, fullConfig.typingHesitationThreshold * 1000);
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [location.pathname, fullConfig.typingHesitationThreshold, recordSignal]);

  // Track errors
  const trackError = useCallback((errorMessage: string) => {
    errorsRef.current.push(errorMessage);
    
    // Check for repeated errors
    const recentErrors = errorsRef.current.slice(-5);
    const uniqueErrors = new Set(recentErrors);
    
    if (recentErrors.length >= 3 && uniqueErrors.size <= 2) {
      recordSignal({
        signal_type: 'repeated_errors',
        page_path: location.pathname,
        metadata: { 
          errors: recentErrors,
          uniqueCount: uniqueErrors.size,
        },
      });
    }
  }, [location.pathname, recordSignal]);

  // Track exit intent
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (userIdRef.current) {
        // Use sendBeacon for reliable exit tracking
        const data = JSON.stringify({
          session_id: sessionIdRef.current,
          exit_type: 'silent',
          ended_at: new Date().toISOString(),
        });
        
        navigator.sendBeacon(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/behavioral_sessions?session_id=eq.${sessionIdRef.current}`,
          data
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Toggle silent mode
  const toggleSilentMode = useCallback((enabled: boolean) => {
    setSilentMode(enabled);
    localStorage.setItem('assistant_silent_mode', enabled.toString());
  }, []);

  return {
    sessionId: sessionIdRef.current,
    recordSignal,
    trackError,
    silentMode,
    toggleSilentMode,
    getTimeOnPage: () => Math.floor((Date.now() - pageEntryTimeRef.current) / 1000),
    getInactiveTime: () => Math.floor((Date.now() - lastActivityRef.current) / 1000),
  };
}

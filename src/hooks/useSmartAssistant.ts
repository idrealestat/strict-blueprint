/**
 * useSmartAssistant.ts
 * Hook for managing the smart contextual assistant
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useBehavioralTracking } from './useBehavioralTracking';

interface AssistantMessage {
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
}

interface AssistantState {
  isVisible: boolean;
  triggerReason: string;
  signalId: string | null;
  messages: AssistantMessage[];
  conversationId: string | null;
}

// Contextual messages based on trigger reason
const TRIGGER_MESSAGES: Record<string, string[]> = {
  freeze: [
    'لاحظت إنك متوقف هنا.. هل تحتاج مساعدة؟',
    'هل كل شي واضح؟ أقدر أساعدك إذا تحتاج',
    'إذا عندك س؅ال، أنا موجود 👋',
  ],
  rapid_navigation: [
    'يبدو إنك تبحث عن شي معين.. أقدر أساعدك؟',
    'وش الي تدور عليه؟ خلني أوجهك للمكان الصحيح',
  ],
  repeated_errors: [
    'لاحظت إن في مشكلة متكررة.. خلني أساعدك',
    'هل تواجه صعوبة؟ أقدر أشرح لك الخطوات',
  ],
  typing_hesitation: [
    'تحتاج مساعدة في تعبئة البيانات؟',
    'إذا مو متأكد من المطلوب، أقدر أوضح لك',
  ],
  hesitation: [
    'هل في شي غير واضح؟ اسألني وأنا أساعدك',
  ],
};

// Follow-up questions based on user response
const FOLLOW_UP_PROMPTS: Record<string, string[]> = {
  confusion: [
    'وش الجزء الي مو واضح بالضبط؟',
    'أقدر أشرح لك خطوة بخطوة إذا تبي',
  ],
  technical: [
    'هل المشكلة في التطبيق نفسه أو في البيانات؟',
    'جرب تحدث الصفحة، وإذا استمرت المشكلة أخبرني',
  ],
  feature: [
    'هل تبي أوضح لك كيف تستخدم هذي الميزة؟',
  ],
};

export function useSmartAssistant() {
  const location = useLocation();
  const { sessionId, silentMode, recordSignal, getInactiveTime } = useBehavioralTracking();
  
  const [state, setState] = useState<AssistantState>({
    isVisible: false,
    triggerReason: '',
    signalId: null,
    messages: [],
    conversationId: null,
  });
  
  const shownOnPagesRef = useRef<Set<string>>(new Set());
  const lastTriggerTimeRef = useRef<number>(0);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const userIdRef = useRef<string | null>(null);

  // Initialize user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) userIdRef.current = user.id;
    });
  }, []);

  // Get random message for trigger type
  const getRandomMessage = (triggerType: string): string => {
    const messages = TRIGGER_MESSAGES[triggerType] || TRIGGER_MESSAGES.freeze;
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Show assistant with context
  const showAssistant = useCallback(async (triggerReason: string, signalId?: string) => {
    if (silentMode) return;
    if (shownOnPagesRef.current.has(location.pathname)) return;
    if (Date.now() - lastTriggerTimeRef.current < 60000) return; // Min 1 min between triggers
    
    shownOnPagesRef.current.add(location.pathname);
    lastTriggerTimeRef.current = Date.now();
    
    const initialMessage: AssistantMessage = {
      role: 'assistant',
      content: getRandomMessage(triggerReason),
      timestamp: new Date().toISOString(),
    };

    // Create conversation record
    let conversationId: string | null = null;
    if (userIdRef.current) {
      const { data } = await supabase.from('assistant_conversations').insert({
        user_id: userIdRef.current,
        session_id: sessionId,
        signal_id: signalId || null,
        page_path: location.pathname,
        trigger_reason: triggerReason,
        messages: [initialMessage] as any,
      }).select('id').single();
      
      conversationId = data?.id || null;
      
      // Mark signal as intervened
      if (signalId) {
        await supabase.from('behavioral_signals')
          .update({ assistant_intervened: true })
          .eq('id', signalId);
      }
    }

    setState({
      isVisible: true,
      triggerReason,
      signalId: signalId || null,
      messages: [initialMessage],
      conversationId,
    });
  }, [silentMode, location.pathname, sessionId]);

  // Monitor for triggers
  useEffect(() => {
    if (silentMode) return;
    
    const checkForTriggers = async () => {
      const inactiveTime = getInactiveTime();
      
      // Check for freeze (45+ seconds inactive)
      if (inactiveTime >= 45 && !shownOnPagesRef.current.has(location.pathname)) {
        const signalId = await recordSignal({
          signal_type: 'freeze',
          page_path: location.pathname,
          duration_seconds: inactiveTime,
        });
        showAssistant('freeze', signalId || undefined);
      }
    };

    checkIntervalRef.current = setInterval(checkForTriggers, 15000);
    
    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [silentMode, location.pathname, getInactiveTime, recordSignal, showAssistant]);

  // Reset shown pages on location change
  useEffect(() => {
    // Don't reset - we want to track per-page
  }, [location.pathname]);

  // Send user message
  const sendMessage = useCallback(async (content: string) => {
    const userMessage: AssistantMessage = {
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    // Simple analysis of user message
    let analysis = {
      intent: 'unknown',
      problem_type: 'general',
      confidence_level: 0.5,
    };

    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('مو فاهم') || lowerContent.includes('غير واضح') || lowerContent.includes('كيف')) {
      analysis = { intent: 'confusion', problem_type: 'ux', confidence_level: 0.8 };
    } else if (lowerContent.includes('خطأ') || lowerContent.includes('مشكلة') || lowerContent.includes('ما يشتغل')) {
      analysis = { intent: 'technical_issue', problem_type: 'technical', confidence_level: 0.8 };
    } else if (lowerContent.includes('وين') || lowerContent.includes('أين') || lowerContent.includes('كيف أوصل')) {
      analysis = { intent: 'navigation', problem_type: 'ux', confidence_level: 0.7 };
    }

    // Generate contextual response
    let responseContent = 'شكراً لإخباري! سأحاول مساعدتك.';
    
    if (analysis.intent === 'confusion') {
      responseContent = 'تمام، خلني أوضح لك. وش الجزء الي تحتاج توضيح فيه بالضبط؟';
    } else if (analysis.intent === 'technical_issue') {
      responseContent = 'أفهم، في مشكلة تقنية. جرب تحدث الصفحة، وإذا استمرت المشكلة راسل الدعم الفني.';
    } else if (analysis.intent === 'navigation') {
      responseContent = 'تقدر توصل لأي قسم من القائمة الجانبية. وش الي تبي توصل له؟';
    }

    const assistantResponse: AssistantMessage = {
      role: 'assistant',
      content: responseContent,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...state.messages, userMessage, assistantResponse];

    setState(prev => ({
      ...prev,
      messages: newMessages,
    }));

    // Update conversation in database
    if (state.conversationId && userIdRef.current) {
      await supabase.from('assistant_conversations')
        .update({
          messages: newMessages as any,
          analysis,
        })
        .eq('id', state.conversationId);
    }
  }, [state.messages, state.conversationId]);

  // Dismiss assistant
  const dismiss = useCallback(async (outcome: 'helped' | 'dismissed' | 'ignored' = 'dismissed') => {
    if (state.conversationId && userIdRef.current) {
      await supabase.from('assistant_conversations')
        .update({
          outcome,
          ended_at: new Date().toISOString(),
        })
        .eq('id', state.conversationId);

      // Update signal intervention result
      if (state.signalId) {
        const result = outcome === 'helped' ? 'completed' : 'exited';
        await supabase.from('behavioral_signals')
          .update({ intervention_result: result })
          .eq('id', state.signalId);
      }

      // Update session rescue status
      if (outcome === 'helped') {
        await supabase.from('behavioral_sessions')
          .update({ 
            was_rescued: true,
            assistant_interventions: 1, // Will be incremented
          })
          .eq('session_id', sessionId);
      }
    }

    setState({
      isVisible: false,
      triggerReason: '',
      signalId: null,
      messages: [],
      conversationId: null,
    });
  }, [state.conversationId, state.signalId, sessionId]);

  // Enable silent mode
  const enableSilentMode = useCallback(async () => {
    localStorage.setItem('assistant_silent_mode', 'true');
    
    if (state.conversationId) {
      await supabase.from('assistant_conversations')
        .update({ outcome: 'silent_mode', ended_at: new Date().toISOString() })
        .eq('id', state.conversationId);
    }

    setState({
      isVisible: false,
      triggerReason: '',
      signalId: null,
      messages: [],
      conversationId: null,
    });
  }, [state.conversationId]);

  return {
    isVisible: state.isVisible,
    messages: state.messages,
    triggerReason: state.triggerReason,
    silentMode,
    sendMessage,
    dismiss,
    enableSilentMode,
    showAssistant, // For manual triggers if needed
  };
}

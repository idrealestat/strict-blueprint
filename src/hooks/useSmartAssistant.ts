/**
 * Enhanced useSmartAssistant.ts
 * Hook for managing the context-aware smart assistant
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useBehavioralTracking } from './useBehavioralTracking';
import { usePageContextTracker, PageContext } from './usePageContextTracker';

export interface AssistantMessage {
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
  options?: QuickOptionResponse[];
  contextInfo?: {
    pageName: string;
    formProgress: number;
    currentField?: string;
  };
}

export interface QuickOptionResponse {
  id: string;
  label: string;
  selected?: boolean;
  inputValue?: string;
}

interface AssistantState {
  isVisible: boolean;
  triggerReason: string;
  signalId: string | null;
  messages: AssistantMessage[];
  conversationId: string | null;
  pageContext: PageContext | null;
  showQuickOptions: boolean;
}

// Contextual messages based on trigger reason and page context
const getContextualMessage = (
  triggerReason: string, 
  context: PageContext
): string => {
  const { pageName, formProgress, currentField, fields, timeOnPage } = context;

  // Page-specific messages
  if (context.pagePath.includes('publish-ad')) {
    if (formProgress < 30 && timeOnPage > 30) {
      return `لاحظت إنك في صفحة ${pageName}. هل تحتاج مساعدة في ملء بيانات العقار؟`;
    }
    if (formProgress >= 30 && formProgress < 70) {
      const emptyFields = fields.filter(f => f.isRequired && !f.isFilled);
      if (emptyFields.length > 0) {
        return `أنت في منتصف الطريق! باقي ${emptyFields.length} حقول لإكمال الإعلان. هل تحتاج مساعدة؟`;
      }
    }
    if (formProgress >= 70) {
      return 'رائع! أوشكت على الانتهاء. هل كل شيء واضح؟';
    }
  }

  if (context.pagePath.includes('crm')) {
    return 'هل تحتاج مساعدة في إدارة العملاء؟ أقدر أساعدك في إضافة عميل جديد أو متابعة العملاء الحاليين.';
  }

  if (context.pagePath.includes('platform')) {
    return 'هل تبحث عن عروض معينة أو تريد إضافة عرض جديد؟';
  }

  // Trigger-based messages
  switch (triggerReason) {
    case 'freeze':
      if (currentField) {
        return `لاحظت إنك متوقف عند حقل "${currentField.label || currentField.name}". هل تحتاج مساعدة في تعبئته؟`;
      }
      return `يبدو إنك متوقف في صفحة ${pageName}. كيف أقدر أساعدك؟`;
    
    case 'rapid_navigation':
      return 'يبدو إنك تبحث عن شي معين. وش الي تدور عليه؟ خلني أوجهك للمكان الصحيح.';
    
    case 'repeated_errors':
      return 'لاحظت إن في مشكلة متكررة. خلني أساعدك في حلها.';
    
    case 'typing_hesitation':
      if (currentField) {
        return `هل تحتاج مساعدة في تعبئة "${currentField.label || currentField.name}"؟`;
      }
      return 'هل تحتاج مساعدة في تعبئة البيانات؟';
    
    case 'incomplete_form':
      return `لاحظت إنك أكملت ${formProgress}% من النموذج. هل تحتاج مساعدة لإكماله؟`;
    
    case 'exit_intent':
      return 'هل أنت متأكد من الخروج؟ لم يتم حفظ البيانات بعد.';
    
    default:
      return `مرحباً! أنا هنا لمساعدتك في صفحة ${pageName}. كيف أقدر أخدمك؟`;
  }
};

// Follow-up messages based on user response
const getFollowUpMessage = (
  userMessage: string,
  context: PageContext
): string => {
  const lowerMessage = userMessage.toLowerCase();

  // Analyze user intent
  if (lowerMessage.includes('مشكلة') || lowerMessage.includes('خطأ') || lowerMessage.includes('ما يشتغل')) {
    return 'أفهم. هل تقدر تصف لي المشكلة بالتفصيل؟ أو اختر من الخيارات أدناه لنساعدك بشكل أسرع.';
  }

  if (lowerMessage.includes('كيف') || lowerMessage.includes('وين') || lowerMessage.includes('أين')) {
    if (context.pagePath.includes('publish-ad')) {
      return 'لنشر إعلان، ابدأ بتعبئة البيانات الأساسية: العنوان، نوع العقار، السعر، والموقع. ثم أضف الصور والتفاصيل.';
    }
    return 'أقدر أوجهك! وش بالضبط تبي توصل له؟';
  }

  if (lowerMessage.includes('سعر') || lowerMessage.includes('تسعير')) {
    return 'للمساعدة في التسعير، يمكنك استخدام الحاسبة الذكية أو الاطلاع على أسعار العقارات المشابهة في المنطقة.';
  }

  if (lowerMessage.includes('شكر') || lowerMessage.includes('تمام') || lowerMessage.includes('اوكي')) {
    return 'العفو! إذا احتجت أي مساعدة ثانية، أنا موجود 👋';
  }

  // Default response with options
  return 'تمام! كيف أقدر أساعدك أكثر؟ اختر من الخيارات أو اكتب لي.';
};

export function useSmartAssistant() {
  const location = useLocation();
  const { sessionId, silentMode, recordSignal, getInactiveTime } = useBehavioralTracking();
  const { context: pageContext, updateContext } = usePageContextTracker();
  
  const [state, setState] = useState<AssistantState>({
    isVisible: false,
    triggerReason: '',
    signalId: null,
    messages: [],
    conversationId: null,
    pageContext: null,
    showQuickOptions: true,
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

  // Update page context in state
  useEffect(() => {
    setState(prev => ({
      ...prev,
      pageContext,
    }));
  }, [pageContext]);

  // Show assistant with context
  const showAssistant = useCallback(async (triggerReason: string, signalId?: string) => {
    if (silentMode) return;
    if (shownOnPagesRef.current.has(location.pathname)) return;
    if (Date.now() - lastTriggerTimeRef.current < 60000) return;
    
    shownOnPagesRef.current.add(location.pathname);
    lastTriggerTimeRef.current = Date.now();

    updateContext();
    
    const initialMessage: AssistantMessage = {
      role: 'assistant',
      content: getContextualMessage(triggerReason, pageContext),
      timestamp: new Date().toISOString(),
      contextInfo: {
        pageName: pageContext.pageName,
        formProgress: pageContext.formProgress,
        currentField: pageContext.currentField?.label || pageContext.currentField?.name,
      },
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
      pageContext,
      showQuickOptions: true,
    });
  }, [silentMode, location.pathname, sessionId, pageContext, updateContext]);

  // Listen for manual test trigger
  useEffect(() => {
    const handleManualTrigger = (event: CustomEvent) => {
      const { reason, message } = event.detail || {};
      
      updateContext();
      
      const testMessage: AssistantMessage = {
        role: 'assistant',
        content: message || getContextualMessage(reason || 'manual_test', pageContext),
        timestamp: new Date().toISOString(),
        contextInfo: {
          pageName: pageContext.pageName,
          formProgress: pageContext.formProgress,
        },
      };

      setState({
        isVisible: true,
        triggerReason: reason || 'manual_test',
        signalId: null,
        messages: [testMessage],
        conversationId: null,
        pageContext,
        showQuickOptions: true,
      });
    };

    window.addEventListener('trigger-smart-assistant', handleManualTrigger as EventListener);
    return () => {
      window.removeEventListener('trigger-smart-assistant', handleManualTrigger as EventListener);
    };
  }, [pageContext, updateContext]);

  // Monitor for triggers
  useEffect(() => {
    if (silentMode) return;
    
    const checkForTriggers = async () => {
      const inactiveTime = getInactiveTime();
      
      // Check for freeze
      if (inactiveTime >= 45 && !shownOnPagesRef.current.has(location.pathname)) {
        const signalId = await recordSignal({
          signal_type: 'freeze',
          page_path: location.pathname,
          duration_seconds: inactiveTime,
          metadata: {
            formProgress: pageContext.formProgress,
            currentField: pageContext.currentField?.name,
            timeOnPage: pageContext.timeOnPage,
          },
        });
        showAssistant('freeze', signalId || undefined);
      }

      // Check for incomplete form
      if (pageContext.formProgress > 0 && pageContext.formProgress < 100 && pageContext.timeOnPage > 120) {
        if (!shownOnPagesRef.current.has(location.pathname)) {
          showAssistant('incomplete_form');
        }
      }
    };

    checkIntervalRef.current = setInterval(checkForTriggers, 15000);
    
    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [silentMode, location.pathname, getInactiveTime, recordSignal, showAssistant, pageContext]);

  // Handle quick option selection
  const handleQuickOption = useCallback(async (optionId: string, inputValue?: string) => {
    const optionMessages: Record<string, string> = {
      problem: 'واجهت مشكلة' + (inputValue ? `: ${inputValue}` : ''),
      help: 'أحتاج مساعدة',
      call: 'أريد أن يتم الاتصال بي',
      pricing: 'لدي استفسار عن التسعير',
      other: inputValue || 'لدي استفسار آخر',
    };

    const userMessage: AssistantMessage = {
      role: 'user',
      content: optionMessages[optionId] || optionId,
      timestamp: new Date().toISOString(),
      options: [{ id: optionId, label: optionMessages[optionId], selected: true, inputValue }],
    };

    // Generate appropriate response
    let responseContent = '';
    switch (optionId) {
      case 'problem':
        responseContent = 'شكراً لإخبارنا! سنقوم بمراجعة المشكلة والتواصل معك. هل تريد مساعدة إضافية الآن؟';
        break;
      case 'help':
        responseContent = `أنا هنا لمساعدتك في صفحة ${pageContext.pageName}. وش تحتاج بالضبط؟`;
        break;
      case 'call':
        responseContent = 'تم تسجيل طلبك! سيتم التواصل معك في أقرب وقت ممكن.';
        break;
      case 'pricing':
        responseContent = 'للمساعدة في التسعير، يمكنك استخدام الحاسبة الذكية أو مراجعة الأسعار المشابهة في المنطقة.';
        break;
      default:
        responseContent = 'شكراً لتواصلك! كيف أقدر أساعدك أكثر؟';
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
      showQuickOptions: optionId === 'help', // Show options again only for help
    }));

    // Save to database
    if (state.conversationId && userIdRef.current) {
      await supabase.from('assistant_conversations')
        .update({
          messages: newMessages as any,
          analysis: {
            selectedOption: optionId,
            inputValue,
            pageContext: {
              pagePath: pageContext.pagePath,
              pageName: pageContext.pageName,
              formProgress: pageContext.formProgress,
            },
          },
        })
        .eq('id', state.conversationId);
    }

    // Log user feedback for owner dashboard
    if (userIdRef.current) {
      await supabase.from('behavioral_signals').insert({
        user_id: userIdRef.current,
        session_id: sessionId,
        signal_type: 'user_feedback',
        page_path: location.pathname,
        metadata: {
          feedbackType: optionId,
          feedbackText: inputValue,
          pageContext: {
            pageName: pageContext.pageName,
            formProgress: pageContext.formProgress,
            timeOnPage: pageContext.timeOnPage,
          },
        },
      });
    }
  }, [state.messages, state.conversationId, pageContext, sessionId, location.pathname]);

  // Send user message
  const sendMessage = useCallback(async (content: string) => {
    const userMessage: AssistantMessage = {
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    const responseContent = getFollowUpMessage(content, pageContext);

    const assistantResponse: AssistantMessage = {
      role: 'assistant',
      content: responseContent,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...state.messages, userMessage, assistantResponse];

    setState(prev => ({
      ...prev,
      messages: newMessages,
      showQuickOptions: true,
    }));

    // Update conversation in database
    if (state.conversationId && userIdRef.current) {
      await supabase.from('assistant_conversations')
        .update({
          messages: newMessages as any,
        })
        .eq('id', state.conversationId);
    }
  }, [state.messages, state.conversationId, pageContext]);

  // Dismiss assistant
  const dismiss = useCallback(async (outcome: 'helped' | 'dismissed' | 'ignored' = 'dismissed') => {
    if (state.conversationId && userIdRef.current) {
      await supabase.from('assistant_conversations')
        .update({
          outcome,
          ended_at: new Date().toISOString(),
        })
        .eq('id', state.conversationId);

      if (state.signalId) {
        const result = outcome === 'helped' ? 'completed' : 'exited';
        await supabase.from('behavioral_signals')
          .update({ intervention_result: result })
          .eq('id', state.signalId);
      }

      if (outcome === 'helped') {
        await supabase.from('behavioral_sessions')
          .update({ 
            was_rescued: true,
            assistant_interventions: 1,
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
      pageContext: null,
      showQuickOptions: true,
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
      pageContext: null,
      showQuickOptions: true,
    });
  }, [state.conversationId]);

  return {
    isVisible: state.isVisible,
    messages: state.messages,
    triggerReason: state.triggerReason,
    silentMode,
    pageContext: state.pageContext,
    showQuickOptions: state.showQuickOptions,
    sendMessage,
    handleQuickOption,
    dismiss,
    enableSilentMode,
    showAssistant,
  };
}

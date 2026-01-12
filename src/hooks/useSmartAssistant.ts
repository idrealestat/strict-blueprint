/**
 * Enhanced useSmartAssistant.ts
 * Hook for managing the context-aware smart assistant with full knowledge base
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useBehavioralTracking } from './useBehavioralTracking';
import { usePageContextTracker, PageContext } from './usePageContextTracker';
import { 
  getPageKnowledge, 
  generateContextualHelp, 
  findAnswer, 
  getPageTips,
  generatePageWelcome,
  getShortDescription,
  getDetailedDescription,
  getKeyBenefits,
  WELCOME_PAGES
} from '@/data/assistantKnowledge';

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
  showPageDescriptionOptions: boolean;
  currentPagePath: string;
}

// Contextual messages based on trigger reason and page context with knowledge base
const getContextualMessage = (
  triggerReason: string, 
  context: PageContext
): string => {
  const { pageName, formProgress, currentField, fields, timeOnPage, pagePath } = context;
  const knowledge = getPageKnowledge(pagePath);

  // Use knowledge base for contextual help
  if (knowledge) {
    return generateContextualHelp(pagePath, {
      formProgress,
      currentField: currentField?.label || currentField?.name,
      timeOnPage,
      triggerReason
    });
  }

  // Page-specific messages with knowledge
  if (pagePath.includes('publish-ad')) {
    if (formProgress < 30 && timeOnPage > 30) {
      return `مرحباً! أنت في صفحة نشر إعلان. ابدأ بتعبئة البيانات الأساسية: العنوان، نوع العقار، السعر. هل تحتاج مساعدة؟`;
    }
    if (formProgress >= 30 && formProgress < 70) {
      const emptyFields = fields.filter(f => f.isRequired && !f.isFilled);
      if (emptyFields.length > 0) {
        return `ممتاز! أنت في منتصف الطريق. باقي ${emptyFields.length} حقول لإكمال الإعلان. نصيحة: الصور الواضحة تزيد من فرص البيع بنسبة 40%!`;
      }
    }
    if (formProgress >= 70) {
      return 'رائع! أوشكت على الانتهاء. راجع البيانات ثم اضغط "نشر الإعلان". تأكد من إضافة رقم الترخيص الإعلاني.';
    }
  }

  if (pagePath.includes('crm')) {
    return 'أهلاً! أنت في إدارة العملاء (CRM). يمكنك سحب البطاقات بين الأعمدة لتحديث حالة العميل. الألوان العلوية تدل على نوع العميل (أزرق=مالك، أخضر=باحث).';
  }

  if (pagePath.includes('platform')) {
    return 'هذه منصتك العامة التي يراها العملاء. يمكنك مشاركة رابطها: wasata.com/اسمك. العروض المثبتة تظهر أولاً!';
  }

  if (pagePath.includes('business-card')) {
    return 'بطاقة أعمالك الرقمية تظهر في هيدر منصتك. أكمل التحقق من رخصة فال لزيادة ثقة العملاء!';
  }

  // Trigger-based messages with helpful tips
  switch (triggerReason) {
    case 'freeze':
      if (currentField) {
        const tips = getPageTips(pagePath);
        const tip = tips.length > 0 ? ` نصيحة: ${tips[0]}` : '';
        return `لاحظت إنك متوقف عند "${currentField.label || currentField.name}". كيف أقدر أساعدك؟${tip}`;
      }
      return `يبدو إنك متوقف في ${pageName}. هل تحتاج توضيح لأي شي؟`;
    
    case 'rapid_navigation':
      return 'يبدو إنك تبحث عن شي معين. أخبرني وش تدور عليه وأوجهك للمكان الصحيح!';
    
    case 'incomplete_form':
      return `لاحظت إنك أكملت ${formProgress}% من النموذج. إذا واجهت صعوبة في أي حقل، اسألني!`;
    
    case 'exit_intent':
      return 'هل أنت متأكد من الخروج؟ لم يتم حفظ البيانات بعد. يمكنك "حفظ كمسودة" للإكمال لاحقاً.';
    
    default:
      return knowledge?.mainPurpose 
        ? `مرحباً! ${knowledge.mainPurpose}. كيف أقدر أخدمك؟`
        : `مرحباً! أنا مساعدك الذكي في ${pageName}. اسألني أي سؤال!`;
  }
};

// Follow-up messages based on user response with knowledge base
const getFollowUpMessage = (
  userMessage: string,
  context: PageContext
): string => {
  const lowerMessage = userMessage.toLowerCase();
  const knowledge = getPageKnowledge(context.pagePath);

  // Try to find answer from knowledge base first
  const knowledgeAnswer = findAnswer(userMessage);
  if (knowledgeAnswer) {
    return knowledgeAnswer;
  }

  // Analyze user intent
  if (lowerMessage.includes('مشكلة') || lowerMessage.includes('خطأ') || lowerMessage.includes('ما يشتغل')) {
    return 'أفهم. صف لي المشكلة بالتفصيل أو اختر من الخيارات أدناه. سنسجلها ونتواصل معك.';
  }

  if (lowerMessage.includes('كيف') || lowerMessage.includes('وين') || lowerMessage.includes('أين')) {
    if (knowledge?.howToUse?.length) {
      return knowledge.howToUse.slice(0, 2).join(' ثم ');
    }
    return 'أقدر أوجهك! وش بالضبط تبي توصل له؟';
  }

  if (lowerMessage.includes('سعر') || lowerMessage.includes('تسعير')) {
    return 'للمساعدة في التسعير، استخدم الحاسبة الذكية أو راجع أسعار العقارات المشابهة. السعر التنافسي يجذب المزيد من المشاهدات!';
  }

  if (lowerMessage.includes('ترخيص') || lowerMessage.includes('فال')) {
    return 'رقم الترخيص الإعلاني يصدر من الهيئة العامة للعقار (فال) وهو ضروري لجميع الإعلانات العقارية.';
  }

  if (lowerMessage.includes('crm') || lowerMessage.includes('عملاء')) {
    return 'في إدارة العملاء (CRM): اسحب البطاقات بين الأعمدة لتحديث الحالة. الألوان تدل على نوع العميل ودرجة الاهتمام.';
  }

  if (lowerMessage.includes('شكر') || lowerMessage.includes('تمام') || lowerMessage.includes('اوكي')) {
    return 'العفو! إذا احتجت أي مساعدة ثانية، أنا موجود 👋';
  }

  // Default with page tips
  const tips = knowledge?.tips || [];
  if (tips.length > 0) {
    return `تمام! نصيحة: ${tips[0]}. كيف أقدر أساعدك أكثر؟`;
  }

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
    showPageDescriptionOptions: false,
    currentPagePath: '',
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

    // Check if this is a welcome page to show description options
    const isWelcomePage = WELCOME_PAGES.some(p => location.pathname.includes(p));

    setState({
      isVisible: true,
      triggerReason,
      signalId: signalId || null,
      messages: [initialMessage],
      conversationId,
      pageContext,
      showQuickOptions: !isWelcomePage,
      showPageDescriptionOptions: isWelcomePage && triggerReason === 'page_visit',
      currentPagePath: location.pathname,
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
        showPageDescriptionOptions: false,
        currentPagePath: location.pathname,
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

  // Auto-show welcome message on key pages
  useEffect(() => {
    const isWelcomePage = WELCOME_PAGES.some(p => location.pathname.includes(p));
    
    if (isWelcomePage && !shownOnPagesRef.current.has(location.pathname) && !silentMode) {
      // Small delay to let the page load
      const timer = setTimeout(() => {
        const welcome = generatePageWelcome(location.pathname);
        
        shownOnPagesRef.current.add(location.pathname);
        lastTriggerTimeRef.current = Date.now();
        
        const welcomeMessage: AssistantMessage = {
          role: 'assistant',
          content: welcome.message,
          timestamp: new Date().toISOString(),
          contextInfo: {
            pageName: welcome.pageName,
            formProgress: 0,
          },
        };

        setState({
          isVisible: true,
          triggerReason: 'page_visit',
          signalId: null,
          messages: [welcomeMessage],
          conversationId: null,
          pageContext,
          showQuickOptions: false,
          showPageDescriptionOptions: welcome.showDescriptionChoice,
          currentPagePath: location.pathname,
        });
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [location.pathname, silentMode, pageContext]);

  // Handle page description option selection
  const handlePageDescriptionOption = useCallback((optionId: string) => {
    const optionLabels: Record<string, string> = {
      short_description: 'أريد وصف مختصر',
      detailed_description: 'أريد شرح مفصل',
      key_benefits: 'ما الفائدة لي كوسيط؟',
      skip_intro: 'لا شكراً، أعرف هذه الصفحة',
    };

    const userMessage: AssistantMessage = {
      role: 'user',
      content: optionLabels[optionId] || optionId,
      timestamp: new Date().toISOString(),
    };

    let responseContent = '';
    
    switch (optionId) {
      case 'short_description':
        responseContent = getShortDescription(state.currentPagePath);
        break;
      case 'detailed_description':
        responseContent = getDetailedDescription(state.currentPagePath);
        break;
      case 'key_benefits':
        const benefits = getKeyBenefits(state.currentPagePath);
        responseContent = `🎯 كيف تستفيد من هذه الصفحة كوسيط:\n\n${benefits.map((b, i) => `${i + 1}. ${b}`).join('\n')}\n\nهل تريد شرح أي ميزة بالتفصيل؟`;
        break;
      case 'skip_intro':
        responseContent = 'ممتاز! إذا احتجت أي مساعدة أثناء استخدام الصفحة، أنا موجود 👋';
        break;
      default:
        responseContent = 'كيف أقدر أساعدك؟';
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
      showPageDescriptionOptions: false,
      showQuickOptions: optionId !== 'skip_intro',
    }));
  }, [state.messages, state.currentPagePath]);

  // Handle quick option selection
  const handleQuickOption = useCallback(async (optionId: string, inputValue?: string) => {
    // Handle page description options
    if (['short_description', 'detailed_description', 'key_benefits', 'skip_intro'].includes(optionId)) {
      return handlePageDescriptionOption(optionId);
    }

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
      showQuickOptions: optionId === 'help',
      showPageDescriptionOptions: false,
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
      showPageDescriptionOptions: false,
      currentPagePath: '',
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
      showPageDescriptionOptions: false,
      currentPagePath: '',
    });
  }, [state.conversationId]);

  return {
    isVisible: state.isVisible,
    messages: state.messages,
    triggerReason: state.triggerReason,
    silentMode,
    pageContext: state.pageContext,
    showQuickOptions: state.showQuickOptions,
    showPageDescriptionOptions: state.showPageDescriptionOptions,
    currentPagePath: state.currentPagePath,
    sendMessage,
    handleQuickOption,
    dismiss,
    enableSilentMode,
    showAssistant,
  };
}

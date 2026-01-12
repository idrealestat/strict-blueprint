/**
 * usePageContextTracker.ts
 * Hook for tracking page context including fields, buttons, and user interactions
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';

export interface PageContext {
  pagePath: string;
  pageName: string;
  fields: FieldInfo[];
  buttons: ButtonInfo[];
  currentField: FieldInfo | null;
  lastClickedButton: ButtonInfo | null;
  formProgress: number;
  inputHistory: InputRecord[];
  uploadedFiles: UploadInfo[];
  scrollPosition: number;
  timeOnPage: number;
  visitedSections: string[];
}

export interface FieldInfo {
  id: string;
  name: string;
  label: string;
  type: string;
  value: string;
  isFilled: boolean;
  isRequired: boolean;
  isActive: boolean;
  lastInteraction: number;
}

export interface ButtonInfo {
  id: string;
  text: string;
  type: 'submit' | 'navigation' | 'action' | 'cancel';
  clickCount: number;
  lastClicked: number;
}

export interface InputRecord {
  fieldName: string;
  value: string;
  timestamp: number;
  duration: number;
}

export interface UploadInfo {
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadTime: number;
  fieldName: string;
}

// Page names and descriptions
const PAGE_CONFIG: Record<string, { name: string; description: string; fields?: string[] }> = {
  '/app/dashboard': { 
    name: 'لوحة التحكم', 
    description: 'الصفحة الرئيسية لإدارة الحساب' 
  },
  '/app/publish-ad': { 
    name: 'نشر إعلان', 
    description: 'صفحة نشر إعلان عقاري جديد',
    fields: ['العنوان', 'الوصف', 'السعر', 'المدينة', 'الحي', 'نوع العقار', 'الصور']
  },
  '/app/crm': { 
    name: 'إدارة العملاء', 
    description: 'صفحة إدارة العملاء والتواصل معهم' 
  },
  '/app/platform': { 
    name: 'منصتي', 
    description: 'صفحة إدارة العروض العقارية' 
  },
  '/app/analytics': { 
    name: 'التحليلات', 
    description: 'صفحة الإحصائيات والتقارير' 
  },
  '/app/calendar': { 
    name: 'التقويم', 
    description: 'صفحة إدارة المواعيد' 
  },
  '/app/settings': { 
    name: 'الإعدادات', 
    description: 'صفحة إعدادات الحساب' 
  },
  '/app/business-card': { 
    name: 'البطاقة الرقمية', 
    description: 'صفحة البطاقة الرقمية' 
  },
  '/app/smart-opportunities': { 
    name: 'الفرص الذكية', 
    description: 'صفحة الفرص المطابقة' 
  },
};

export function usePageContextTracker() {
  const location = useLocation();
  
  const [context, setContext] = useState<PageContext>({
    pagePath: '',
    pageName: '',
    fields: [],
    buttons: [],
    currentField: null,
    lastClickedButton: null,
    formProgress: 0,
    inputHistory: [],
    uploadedFiles: [],
    scrollPosition: 0,
    timeOnPage: 0,
    visitedSections: [],
  });

  const pageEntryTimeRef = useRef<number>(Date.now());
  const inputStartTimeRef = useRef<number | null>(null);
  const lastInputFieldRef = useRef<string | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);

  // Get page config
  const getPageConfig = useCallback((path: string) => {
    const config = PAGE_CONFIG[path] || { 
      name: path.split('/').pop() || 'صفحة', 
      description: 'صفحة في التطبيق' 
    };
    return config;
  }, []);

  // Scan for form fields
  const scanFields = useCallback((): FieldInfo[] => {
    const fields: FieldInfo[] = [];
    
    // Find all inputs, textareas, and selects
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach((input, index) => {
      const el = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      
      // Skip hidden inputs
      if (el.type === 'hidden') return;
      
      // Find label
      let label = '';
      const labelEl = document.querySelector(`label[for="${el.id}"]`);
      if (labelEl) {
        label = labelEl.textContent?.trim() || '';
      } else if ('placeholder' in el && el.placeholder) {
        label = el.placeholder;
      } else if (el.getAttribute('aria-label')) {
        label = el.getAttribute('aria-label') || '';
      }

      fields.push({
        id: el.id || `field-${index}`,
        name: el.name || el.id || `field-${index}`,
        label,
        type: el.type || (el.tagName === 'SELECT' ? 'select' : 'textarea'),
        value: el.value,
        isFilled: el.value.trim().length > 0,
        isRequired: el.required || el.hasAttribute('aria-required'),
        isActive: document.activeElement === el,
        lastInteraction: 0,
      });
    });

    return fields;
  }, []);

  // Scan for buttons
  const scanButtons = useCallback((): ButtonInfo[] => {
    const buttons: ButtonInfo[] = [];
    
    const buttonEls = document.querySelectorAll('button, [role="button"], a[href]');
    buttonEls.forEach((btn, index) => {
      const el = btn as HTMLElement;
      const text = el.textContent?.trim() || el.getAttribute('aria-label') || '';
      
      // Skip empty buttons
      if (!text) return;
      
      // Determine button type
      let type: ButtonInfo['type'] = 'action';
      if (el.getAttribute('type') === 'submit' || text.includes('نشر') || text.includes('حفظ')) {
        type = 'submit';
      } else if (el.tagName === 'A' || text.includes('رجوع') || text.includes('التالي')) {
        type = 'navigation';
      } else if (text.includes('إلغاء') || text.includes('إغلاق')) {
        type = 'cancel';
      }

      buttons.push({
        id: el.id || `button-${index}`,
        text,
        type,
        clickCount: 0,
        lastClicked: 0,
      });
    });

    return buttons;
  }, []);

  // Calculate form progress
  const calculateFormProgress = useCallback((fields: FieldInfo[]): number => {
    if (fields.length === 0) return 0;
    const requiredFields = fields.filter(f => f.isRequired);
    if (requiredFields.length === 0) {
      const filledCount = fields.filter(f => f.isFilled).length;
      return Math.round((filledCount / fields.length) * 100);
    }
    const filledRequired = requiredFields.filter(f => f.isFilled).length;
    return Math.round((filledRequired / requiredFields.length) * 100);
  }, []);

  // Update context
  const updateContext = useCallback(() => {
    const config = getPageConfig(location.pathname);
    const fields = scanFields();
    const buttons = scanButtons();
    const formProgress = calculateFormProgress(fields);
    const timeOnPage = Math.floor((Date.now() - pageEntryTimeRef.current) / 1000);

    setContext(prev => ({
      ...prev,
      pagePath: location.pathname,
      pageName: config.name,
      fields,
      buttons,
      formProgress,
      timeOnPage,
      currentField: fields.find(f => f.isActive) || prev.currentField,
    }));
  }, [location.pathname, getPageConfig, scanFields, scanButtons, calculateFormProgress]);

  // Track input changes
  const handleInput = useCallback((e: Event) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    if (!target || !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

    const fieldName = target.name || target.id || 'unknown';
    const value = target.value;

    // Track typing duration
    if (lastInputFieldRef.current !== fieldName) {
      if (lastInputFieldRef.current && inputStartTimeRef.current) {
        setContext(prev => ({
          ...prev,
          inputHistory: [...prev.inputHistory, {
            fieldName: lastInputFieldRef.current!,
            value: '',
            timestamp: Date.now(),
            duration: Date.now() - inputStartTimeRef.current!,
          }],
        }));
      }
      inputStartTimeRef.current = Date.now();
      lastInputFieldRef.current = fieldName;
    }

    updateContext();
  }, [updateContext]);

  // Track button clicks
  const handleClick = useCallback((e: Event) => {
    const target = e.target as HTMLElement;
    const button = target.closest('button, [role="button"], a');
    
    if (button) {
      const text = button.textContent?.trim() || '';
      setContext(prev => ({
        ...prev,
        lastClickedButton: {
          id: button.id || 'unknown',
          text,
          type: 'action',
          clickCount: 1,
          lastClicked: Date.now(),
        },
      }));
    }

    updateContext();
  }, [updateContext]);

  // Track file uploads
  const handleFileChange = useCallback((e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.type !== 'file' || !target.files) return;

    const files = Array.from(target.files);
    const uploads: UploadInfo[] = files.map(file => ({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadTime: Date.now(),
      fieldName: target.name || target.id || 'file',
    }));

    setContext(prev => ({
      ...prev,
      uploadedFiles: [...prev.uploadedFiles, ...uploads],
    }));
  }, []);

  // Track scroll position
  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercentage = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;

    setContext(prev => ({
      ...prev,
      scrollPosition: scrollPercentage,
    }));
  }, []);

  // Track focus
  const handleFocus = useCallback((e: Event) => {
    const target = e.target as HTMLElement;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
      updateContext();
    }
  }, [updateContext]);

  // Initialize and cleanup
  useEffect(() => {
    pageEntryTimeRef.current = Date.now();
    updateContext();

    // Set up event listeners
    document.addEventListener('input', handleInput);
    document.addEventListener('click', handleClick);
    document.addEventListener('change', handleFileChange);
    document.addEventListener('scroll', handleScroll);
    document.addEventListener('focusin', handleFocus);

    // Set up mutation observer for dynamic content
    mutationObserverRef.current = new MutationObserver(() => {
      updateContext();
    });

    mutationObserverRef.current.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Update time on page periodically
    const timeInterval = setInterval(() => {
      setContext(prev => ({
        ...prev,
        timeOnPage: Math.floor((Date.now() - pageEntryTimeRef.current) / 1000),
      }));
    }, 5000);

    return () => {
      document.removeEventListener('input', handleInput);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('change', handleFileChange);
      document.removeEventListener('scroll', handleScroll);
      document.removeEventListener('focusin', handleFocus);
      mutationObserverRef.current?.disconnect();
      clearInterval(timeInterval);
    };
  }, [location.pathname, handleInput, handleClick, handleFileChange, handleScroll, handleFocus, updateContext]);

  // Reset on page change
  useEffect(() => {
    pageEntryTimeRef.current = Date.now();
    setContext(prev => ({
      ...prev,
      pagePath: location.pathname,
      pageName: getPageConfig(location.pathname).name,
      inputHistory: [],
      uploadedFiles: [],
      visitedSections: [...prev.visitedSections, location.pathname],
      scrollPosition: 0,
      timeOnPage: 0,
    }));
    updateContext();
  }, [location.pathname, getPageConfig, updateContext]);

  return {
    context,
    updateContext,
    getPageConfig,
  };
}

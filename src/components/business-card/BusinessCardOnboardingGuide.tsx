import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HandMetal, ChevronLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingStep {
  id: string;
  fieldId: string; // DOM element id to point to
  tabId: string; // which tab to switch to
  message: string;
  checkFilled: () => boolean;
}

interface BusinessCardOnboardingGuideProps {
  formData: {
    userName: string;
    userTitle: string;
    primaryPhone: string;
    email: string;
    falLicense: string;
  };
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSaveSuccess: boolean;
  onSaveError: boolean;
  isVisible: boolean;
  onDismiss: () => void;
}

const BusinessCardOnboardingGuide: React.FC<BusinessCardOnboardingGuideProps> = ({
  formData,
  activeTab,
  onTabChange,
  onSaveSuccess,
  onSaveError,
  isVisible,
  onDismiss,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1); // -1 = greeting
  const [dismissed, setDismissed] = useState(false);
  const [pointingPosition, setPointingPosition] = useState<{ top: number; left: number } | null>(null);

  // Define steps based on empty required fields
  const getSteps = useCallback((): OnboardingStep[] => {
    const steps: OnboardingStep[] = [];

    // النطاق الخاص (slug)
    if (!formData.userTitle?.trim()) {
      steps.push({
        id: 'slug',
        fieldId: 'onboarding-slug-field',
        tabId: 'basic',
        message: 'اختر نطاقك الخاص ليكون رابط صفحتك العامة 🌐',
        checkFilled: () => !!formData.userTitle?.trim(),
      });
    }

    // الاسم
    if (!formData.userName?.trim()) {
      steps.push({
        id: 'name',
        fieldId: 'onboarding-name-field',
        tabId: 'basic',
        message: 'اكتب اسمك الكامل هنا ✍️',
        checkFilled: () => !!formData.userName?.trim(),
      });
    }

    // رقم الجوال
    if (!formData.primaryPhone?.trim()) {
      steps.push({
        id: 'phone',
        fieldId: 'onboarding-phone-field',
        tabId: 'contact',
        message: 'اكتب رقم الجوال هنا 📱',
        checkFilled: () => !!formData.primaryPhone?.trim(),
      });
    }

    // البريد الالكتروني
    if (!formData.email?.trim()) {
      steps.push({
        id: 'email',
        fieldId: 'onboarding-email-field',
        tabId: 'contact',
        message: 'اكتب بريدك الإلكتروني هنا 📧',
        checkFilled: () => !!formData.email?.trim(),
      });
    }

    // رخصة فال
    if (!formData.falLicense?.trim()) {
      steps.push({
        id: 'fal',
        fieldId: 'onboarding-fal-field',
        tabId: 'basic',
        message: 'أدخل رقم رخصة فال الخاصة بك 📜',
        checkFilled: () => !!formData.falLicense?.trim(),
      });
    }

    // الحفظ (دائماً آخر خطوة)
    steps.push({
      id: 'save',
      fieldId: 'onboarding-save-btn',
      tabId: activeTab, // stay on current tab
      message: 'المس على حفظ لحفظ بياناتك ✅',
      checkFilled: () => false,
    });

    return steps;
  }, [formData.userTitle, formData.userName, formData.primaryPhone, formData.email, formData.falLicense, activeTab]);

  const [steps, setSteps] = useState<OnboardingStep[]>([]);

  // Recalculate steps when formData changes
  useEffect(() => {
    setSteps(getSteps());
  }, [getSteps]);

  // Hide after save success
  useEffect(() => {
    if (onSaveSuccess) {
      setDismissed(true);
      onDismiss();
    }
  }, [onSaveSuccess, onDismiss]);

  // On save error, recalculate steps and go to first missing field
  useEffect(() => {
    if (onSaveError) {
      const newSteps = getSteps();
      setSteps(newSteps);
      if (newSteps.length > 0) {
        setCurrentStepIndex(0);
      }
    }
  }, [onSaveError, getSteps]);

  // Point to current field
  useEffect(() => {
    if (currentStepIndex < 0 || currentStepIndex >= steps.length) {
      setPointingPosition(null);
      return;
    }

    const step = steps[currentStepIndex];
    
    // Switch tab if needed
    if (step.tabId !== activeTab && step.id !== 'save') {
      onTabChange(step.tabId);
    }

    // Wait for tab switch then find element
    const timer = setTimeout(() => {
      const el = document.getElementById(step.fieldId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const rect = el.getBoundingClientRect();
        setPointingPosition({
          top: rect.top + window.scrollY - 10,
          left: rect.right + window.scrollX + 8,
        });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [currentStepIndex, steps, activeTab, onTabChange]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleStart = () => {
    setCurrentStepIndex(0);
  };

  if (dismissed || !isVisible) return null;

  const currentStep = currentStepIndex >= 0 && currentStepIndex < steps.length ? steps[currentStepIndex] : null;
  const isGreeting = currentStepIndex === -1;
  const brokerName = formData.userName?.split(' ')[0] || 'الوسيط';

  return (
    <>
      {/* Pointing hand indicator */}
      <AnimatePresence>
        {pointingPosition && currentStep && currentStep.id !== 'save' && (
          <motion.div
            key={`hand-${currentStep.id}`}
            initial={{ opacity: 0, scale: 0.5, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: [20, 0, 5, 0] }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.5, x: { repeat: Infinity, duration: 1.5 } }}
            className="fixed z-[9999] pointer-events-none"
            style={{
              top: pointingPosition.top,
              left: pointingPosition.left > window.innerWidth - 60 
                ? pointingPosition.left - 100 
                : pointingPosition.left,
            }}
          >
            <div className="text-3xl transform -scale-x-100">👆</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating assistant + speech bubble */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-20 right-4 z-[9998] flex flex-col items-end gap-2"
        style={{ maxWidth: 'calc(100vw - 32px)' }}
      >
        {/* Speech bubble */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isGreeting ? 'greeting' : currentStep?.id || 'done'}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="relative bg-white rounded-2xl shadow-2xl border-2 border-[#01411C]/20 p-4 max-w-[280px]"
          >
            {/* Bubble arrow */}
            <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white border-b-2 border-r-2 border-[#01411C]/20 transform rotate-45" />
            
            {isGreeting ? (
              <div className="space-y-3">
                <p className="text-sm font-bold text-[#01411C]">
                  أهلاً وسهلاً {brokerName}! 👋
                </p>
                <p className="text-xs text-gray-600">
                  أنا مساعدك الذكي، سأرشدك لتعبئة البيانات الأساسية لبطاقة أعمالك الرقمية
                </p>
                {steps.length > 1 && (
                  <p className="text-xs text-amber-600 font-medium">
                    📋 لديك {steps.length - 1} {steps.length - 1 === 1 ? 'حقل' : 'حقول'} أساسية تحتاج تعبئة
                  </p>
                )}
                <Button
                  size="sm"
                  onClick={handleStart}
                  className="w-full bg-[#01411C] hover:bg-[#065f41] text-white text-xs"
                >
                  يلّا نبدأ! 🚀
                </Button>
              </div>
            ) : currentStep ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-800 font-medium leading-relaxed">
                  {currentStep.message}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {currentStepIndex + 1} / {steps.length}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleNext}
                    className="text-xs border-[#01411C] text-[#01411C] hover:bg-[#01411C] hover:text-white h-7"
                  >
                    التالي
                    <ChevronLeft className="w-3 h-3 mr-1" />
                  </Button>
                </div>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>

        {/* Assistant avatar */}
        <motion.div
          animate={{ 
            y: [0, -5, 0],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-[#01411C] to-[#065f41] border-3 border-[#D4AF37] shadow-xl flex items-center justify-center cursor-pointer"
          onClick={() => {
            if (isGreeting) handleStart();
            else setDismissed(true);
          }}
        >
          <span className="text-2xl">🤵</span>
        </motion.div>
      </motion.div>
    </>
  );
};

export default BusinessCardOnboardingGuide;

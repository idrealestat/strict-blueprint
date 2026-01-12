/**
 * PageRatingForm.tsx
 * Rating form shown after user experiences a page
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  Send, 
  X, 
  ThumbsUp,
  AlertCircle,
  Lightbulb,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

interface PageRatingFormProps {
  pageName: string;
  pagePath: string;
  onClose: () => void;
  onSubmit: (rating: PageRating) => void;
  autoCloseTimeout?: number; // in seconds
}

export interface PageRating {
  easeOfUse: number;
  easeOfUnderstanding: number;
  feedback?: string;
  feedbackType?: 'problem' | 'suggestion' | 'other';
}

export function PageRatingForm({ 
  pageName, 
  pagePath, 
  onClose, 
  onSubmit,
  autoCloseTimeout = 50 
}: PageRatingFormProps) {
  const [easeOfUse, setEaseOfUse] = useState<number>(0);
  const [easeOfUnderstanding, setEaseOfUnderstanding] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<'problem' | 'suggestion' | 'other' | null>(null);
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [remainingTime, setRemainingTime] = useState(autoCloseTimeout);
  const [isPaused, setIsPaused] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastInteractionRef = useRef<number>(Date.now());

  // Auto-close timer
  useEffect(() => {
    if (isPaused || isSubmitted) return;

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastInteractionRef.current) / 1000);
      const remaining = autoCloseTimeout - elapsed;
      
      if (remaining <= 0) {
        onClose();
      } else {
        setRemainingTime(remaining);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoCloseTimeout, onClose, isPaused, isSubmitted]);

  // Reset timer on interaction
  const handleInteraction = () => {
    lastInteractionRef.current = Date.now();
    setRemainingTime(autoCloseTimeout);
  };

  // Pause timer when user is typing
  const handleFocus = () => {
    setIsPaused(true);
    handleInteraction();
  };

  const handleBlur = () => {
    setIsPaused(false);
    handleInteraction();
  };

  const handleRatingClick = (type: 'use' | 'understand', value: number) => {
    handleInteraction();
    if (type === 'use') {
      setEaseOfUse(value);
    } else {
      setEaseOfUnderstanding(value);
    }
  };

  const handleSubmit = async () => {
    if (easeOfUse === 0 || easeOfUnderstanding === 0) return;

    const rating: PageRating = {
      easeOfUse,
      easeOfUnderstanding,
      feedback: feedback.trim() || undefined,
      feedbackType: feedbackType || undefined,
    };

    // Save to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('behavioral_signals').insert({
          user_id: user.id,
          session_id: `rating_${Date.now()}`,
          signal_type: 'page_rating',
          page_path: pagePath,
          metadata: {
            pageName,
            ...rating,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error('Error saving rating:', error);
    }

    setIsSubmitted(true);
    onSubmit(rating);
    
    // Close after showing thank you
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const renderStars = (
    currentValue: number, 
    onChange: (value: number) => void,
    label: string
  ) => (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <div className="flex gap-1 justify-center" dir="ltr">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
          <button
            key={value}
            onClick={() => onChange(value)}
            onMouseEnter={handleInteraction}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
              value <= currentValue
                ? 'bg-amber-400 text-white scale-110'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {value}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-400 px-1" dir="ltr">
        <span>صعب</span>
        <span>ممتاز</span>
      </div>
    </div>
  );

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 text-center"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <ThumbsUp className="w-8 h-8 text-green-600" />
        </div>
        <h4 className="text-lg font-semibold text-gray-800 mb-2">شكراً لتقييمك! 🙏</h4>
        <p className="text-sm text-gray-600">
          تقييمك يساعدنا على تحسين التطبيق
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-4"
      onMouseMove={handleInteraction}
      onClick={handleInteraction}
    >
      {/* Header with timer */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-gray-800">قيّم تجربتك 📊</h4>
          <p className="text-xs text-gray-500">صفحة: {pageName}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{remainingTime}ث</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Ease of Use Rating */}
      {renderStars(
        easeOfUse, 
        (v) => handleRatingClick('use', v),
        '⚡ قيّم سهولة استخدام الصفحة:'
      )}

      {/* Ease of Understanding Rating */}
      {renderStars(
        easeOfUnderstanding, 
        (v) => handleRatingClick('understand', v),
        '🧠 قيّم سهولة فهمك للتعامل مع الصفحة:'
      )}

      {/* Feedback Type Selection */}
      {!showFeedbackInput && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">هل لديك ملاحظات إضافية؟</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => { setFeedbackType('problem'); setShowFeedbackInput(true); handleInteraction(); }}
              className="flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors"
            >
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-gray-600">مشكلة</span>
            </button>
            <button
              onClick={() => { setFeedbackType('suggestion'); setShowFeedbackInput(true); handleInteraction(); }}
              className="flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-colors"
            >
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-gray-600">اقتراح</span>
            </button>
            <button
              onClick={() => { setFeedbackType('other'); setShowFeedbackInput(true); handleInteraction(); }}
              className="flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <Star className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-600">ملاحظة</span>
            </button>
          </div>
        </div>
      )}

      {/* Feedback Input */}
      <AnimatePresence>
        {showFeedbackInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              {feedbackType === 'problem' && <AlertCircle className="w-4 h-4 text-red-500" />}
              {feedbackType === 'suggestion' && <Lightbulb className="w-4 h-4 text-amber-500" />}
              {feedbackType === 'other' && <Star className="w-4 h-4 text-blue-500" />}
              <span className="text-sm font-medium">
                {feedbackType === 'problem' && 'صف المشكلة:'}
                {feedbackType === 'suggestion' && 'ما اقتراحك؟'}
                {feedbackType === 'other' && 'ملاحظتك:'}
              </span>
              <button
                onClick={() => { setShowFeedbackInput(false); setFeedback(''); handleInteraction(); }}
                className="mr-auto text-xs text-gray-400 hover:text-gray-600"
              >
                إلغاء
              </button>
            </div>
            <Textarea
              value={feedback}
              onChange={(e) => { setFeedback(e.target.value); handleInteraction(); }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="اكتب هنا..."
              className="min-h-[60px] text-sm resize-none"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={easeOfUse === 0 || easeOfUnderstanding === 0}
        className="w-full bg-[#01411C] hover:bg-[#065f41] gap-2"
      >
        <Send className="w-4 h-4" />
        إرسال التقييم
      </Button>

      {/* Progress indicator */}
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-amber-400"
          initial={{ width: '100%' }}
          animate={{ width: `${(remainingTime / autoCloseTimeout) * 100}%` }}
          transition={{ duration: 1 }}
        />
      </div>
    </motion.div>
  );
}

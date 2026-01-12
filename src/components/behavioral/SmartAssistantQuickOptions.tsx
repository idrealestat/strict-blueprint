/**
 * SmartAssistantQuickOptions.tsx
 * Quick response options for the smart assistant
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  AlertCircle, 
  Phone, 
  MoreHorizontal,
  MessageSquare,
  CheckCircle,
  ChevronRight,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export interface QuickOption {
  id: string;
  label: string;
  icon: React.ElementType;
  description?: string;
  hasInput?: boolean;
  inputPlaceholder?: string;
  color?: string;
  action?: () => void;
}

interface SmartAssistantQuickOptionsProps {
  options: QuickOption[];
  onSelect: (optionId: string, inputValue?: string) => void;
  contextMessage?: string;
}

const DEFAULT_OPTIONS: QuickOption[] = [
  {
    id: 'problem',
    label: 'واجهت مشكلة',
    icon: AlertCircle,
    description: 'أخبرنا عن المشكلة التي واجهتك',
    hasInput: true,
    inputPlaceholder: 'صف المشكلة التي واجهتها...',
    color: 'text-red-500',
  },
  {
    id: 'help',
    label: 'أحتاج مساعدة',
    icon: HelpCircle,
    description: 'نحن هنا لمساعدتك',
    color: 'text-blue-500',
  },
  {
    id: 'call',
    label: 'وصلني اتصال',
    icon: Phone,
    description: 'سنتصل بك في أقرب وقت',
    color: 'text-green-500',
  },
  {
    id: 'other',
    label: 'أخرى',
    icon: MoreHorizontal,
    description: 'شاركنا ملاحظاتك',
    hasInput: true,
    inputPlaceholder: 'اكتب ملاحظاتك هنا...',
    color: 'text-gray-500',
  },
];

export function SmartAssistantQuickOptions({ 
  options = DEFAULT_OPTIONS, 
  onSelect,
  contextMessage 
}: SmartAssistantQuickOptionsProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleOptionClick = (option: QuickOption) => {
    if (option.hasInput) {
      setSelectedOption(option.id);
    } else {
      onSelect(option.id);
      setIsSubmitted(true);
    }
  };

  const handleSubmit = () => {
    if (selectedOption) {
      onSelect(selectedOption, inputValue);
      setIsSubmitted(true);
      setInputValue('');
      setSelectedOption(null);
    }
  };

  const handleBack = () => {
    setSelectedOption(null);
    setInputValue('');
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-4 bg-green-50 rounded-xl border border-green-200"
      >
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">شكراً لك! تم استلام ردك</span>
        </div>
        <p className="text-green-600 text-sm mt-1">
          سنتواصل معك قريباً إن لزم الأمر
        </p>
      </motion.div>
    );
  }

  const currentOption = options.find(o => o.id === selectedOption);

  return (
    <div className="space-y-3">
      {contextMessage && (
        <p className="text-sm text-gray-600 mb-3">{contextMessage}</p>
      )}

      <AnimatePresence mode="wait">
        {selectedOption && currentOption ? (
          // Input view
          <motion.div
            key="input"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={handleBack}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
              <div className="flex items-center gap-2">
                {React.createElement(currentOption.icon, { 
                  className: `w-4 h-4 ${currentOption.color}` 
                })}
                <span className="font-medium text-sm">{currentOption.label}</span>
              </div>
            </div>
            
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={currentOption.inputPlaceholder}
              className="min-h-[80px] text-sm resize-none"
              autoFocus
            />
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="flex-1"
              >
                رجوع
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!inputValue.trim()}
                className="flex-1 bg-[#01411C] hover:bg-[#065f41]"
              >
                إرسال
              </Button>
            </div>
          </motion.div>
        ) : (
          // Options grid
          <motion.div
            key="options"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 gap-2"
          >
            {options.map((option, index) => (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleOptionClick(option)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-200 hover:border-[#01411C] hover:bg-[#01411C]/5 transition-all text-center group"
              >
                {React.createElement(option.icon, { 
                  className: `w-5 h-5 ${option.color || 'text-gray-600'} group-hover:scale-110 transition-transform` 
                })}
                <span className="text-xs font-medium text-gray-700">
                  {option.label}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Contextual options based on page
export function getContextualOptions(pagePath: string): QuickOption[] {
  const baseOptions: QuickOption[] = [
    {
      id: 'problem',
      label: 'واجهت مشكلة',
      icon: AlertCircle,
      hasInput: true,
      inputPlaceholder: 'صف المشكلة...',
      color: 'text-red-500',
    },
    {
      id: 'help',
      label: 'أحتاج مساعدة',
      icon: HelpCircle,
      color: 'text-blue-500',
    },
  ];

  // Add page-specific options
  if (pagePath.includes('publish-ad')) {
    return [
      ...baseOptions,
      {
        id: 'pricing',
        label: 'استفسار عن السعر',
        icon: MessageSquare,
        color: 'text-amber-500',
      },
      {
        id: 'other',
        label: 'أخرى',
        icon: MoreHorizontal,
        hasInput: true,
        inputPlaceholder: 'اكتب استفسارك...',
        color: 'text-gray-500',
      },
    ];
  }

  if (pagePath.includes('crm')) {
    return [
      ...baseOptions,
      {
        id: 'call',
        label: 'تواصل مع العميل',
        icon: Phone,
        color: 'text-green-500',
      },
      {
        id: 'other',
        label: 'أخرى',
        icon: MoreHorizontal,
        hasInput: true,
        inputPlaceholder: 'اكتب استفسارك...',
        color: 'text-gray-500',
      },
    ];
  }

  return [
    ...baseOptions,
    {
      id: 'call',
      label: 'وصلني اتصال',
      icon: Phone,
      color: 'text-green-500',
    },
    {
      id: 'other',
      label: 'أخرى',
      icon: MoreHorizontal,
      hasInput: true,
      inputPlaceholder: 'اكتب ملاحظاتك...',
      color: 'text-gray-500',
    },
  ];
}

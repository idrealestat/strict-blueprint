/**
 * SmartAssistantBubble.tsx
 * Context-aware smart assistant with quick options
 */

import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  X, 
  Send, 
  VolumeX, 
  ThumbsUp, 
  ThumbsDown, 
  Minimize2,
  FileText,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSmartAssistant } from '@/hooks/useSmartAssistant';
import { SmartAssistantQuickOptions, getContextualOptions, PAGE_DESCRIPTION_OPTIONS } from './SmartAssistantQuickOptions';

// Pages where the assistant should NOT appear
const EXCLUDED_PAGES = [
  '/app/settings',
  '/app/business-card/edit',
  '/app/platform/edit',
  '/app/owner-dashboard',
  '/edit',
];

export function SmartAssistantBubble() {
  const location = useLocation();
  const {
    isVisible,
    messages,
    silentMode,
    pageContext,
    showQuickOptions,
    showPageDescriptionOptions,
    sendMessage,
    handleQuickOption,
    dismiss,
    enableSilentMode,
  } = useSmartAssistant();

  const [inputValue, setInputValue] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'context'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check if current page is excluded
  const isExcludedPage = EXCLUDED_PAGES.some(page => 
    location.pathname.includes(page) || location.pathname.endsWith('/edit')
  );

  const handleSend = () => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleOptionSelect = (optionId: string, inputValue?: string) => {
    handleQuickOption(optionId, inputValue);
  };

  // Don't show on excluded pages
  if (silentMode || !isVisible || isExcludedPage) return null;

  const contextOptions = getContextualOptions(location.pathname);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed bottom-24 left-4 z-50"
        dir="rtl"
      >
        {isMinimized ? (
          // Minimized state
          <motion.button
            onClick={() => setIsMinimized(false)}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-[#01411C] to-[#065f41] shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MessageCircle className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full animate-pulse" />
          </motion.button>
        ) : (
          // Full chat bubble
          <motion.div
            className="w-[340px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
            layout
          >
            {/* Header */}
            <div className="bg-gradient-to-l from-[#01411C] to-[#065f41] px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm">المساعد الذكي</h4>
                    {pageContext && (
                      <p className="text-white/70 text-xs flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {pageContext.pageName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
                    onClick={() => setIsMinimized(true)}
                  >
                    <Minimize2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
                    onClick={() => dismiss('dismissed')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Context info bar */}
              {pageContext && pageContext.formProgress > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-amber-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${pageContext.formProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="text-white/80 text-xs">{pageContext.formProgress}%</span>
                </div>
              )}
            </div>

            {/* Tab switcher (optional) */}
            {pageContext && (
              <div className="flex border-b bg-gray-50">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${
                    activeTab === 'chat' 
                      ? 'text-[#01411C] border-b-2 border-[#01411C]' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  المحادثة
                </button>
                <button
                  onClick={() => setActiveTab('context')}
                  className={`flex-1 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                    activeTab === 'context' 
                      ? 'text-[#01411C] border-b-2 border-[#01411C]' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  السياق
                </button>
              </div>
            )}

            {activeTab === 'chat' ? (
              <>
                {/* Messages */}
                <div className="h-52 overflow-y-auto p-3 space-y-3 bg-gray-50">
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                          msg.role === 'user'
                            ? 'bg-gray-200 text-gray-800 rounded-tr-sm'
                            : 'bg-[#01411C] text-white rounded-tl-sm'
                        }`}
                      >
                        {msg.content}
                        {msg.contextInfo && (
                          <div className="mt-1 pt-1 border-t border-white/20 text-xs opacity-70">
                            📍 {msg.contextInfo.pageName}
                            {msg.contextInfo.formProgress > 0 && (
                              <span className="mr-2">| {msg.contextInfo.formProgress}% مكتمل</span>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Page Description Options (shown first on key pages) */}
                  {showPageDescriptionOptions && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="pt-2"
                    >
                      <SmartAssistantQuickOptions
                        options={PAGE_DESCRIPTION_OPTIONS}
                        onSelect={handleOptionSelect}
                        contextMessage="هل تريد معرفة المزيد عن هذه الصفحة؟"
                      />
                    </motion.div>
                  )}
                  
                  {/* Regular Quick Options */}
                  {showQuickOptions && !showPageDescriptionOptions && messages.length <= 2 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="pt-2"
                    >
                      <SmartAssistantQuickOptions
                        options={contextOptions}
                        onSelect={handleOptionSelect}
                        contextMessage="اختر أحد الخيارات أو اكتب لنا:"
                      />
                    </motion.div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t bg-white">
                  <div className="flex gap-2">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="اكتب رسالتك..."
                      className="flex-1 text-sm"
                    />
                    <Button
                      size="icon"
                      onClick={handleSend}
                      disabled={!inputValue.trim()}
                      className="bg-[#01411C] hover:bg-[#065f41]"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              // Context tab
              <div className="h-64 overflow-y-auto p-3 bg-gray-50">
                {pageContext && (
                  <div className="space-y-3">
                    {/* Page info */}
                    <div className="bg-white rounded-lg p-3 border">
                      <h5 className="font-medium text-sm text-gray-700 mb-2">معلومات الصفحة</h5>
                      <div className="space-y-1 text-xs text-gray-600">
                        <p>📄 {pageContext.pageName}</p>
                        <p>⏱️ الوقت: {pageContext.timeOnPage} ثانية</p>
                        {pageContext.scrollPosition > 0 && (
                          <p>📜 التمرير: {pageContext.scrollPosition}%</p>
                        )}
                      </div>
                    </div>

                    {/* Form progress */}
                    {pageContext.fields.length > 0 && (
                      <div className="bg-white rounded-lg p-3 border">
                        <h5 className="font-medium text-sm text-gray-700 mb-2">
                          تقدم النموذج ({pageContext.formProgress}%)
                        </h5>
                        <div className="space-y-1">
                          {pageContext.fields.slice(0, 5).map((field, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">{field.label || field.name}</span>
                              <span className={field.isFilled ? 'text-green-500' : 'text-gray-400'}>
                                {field.isFilled ? '✓' : '○'}
                              </span>
                            </div>
                          ))}
                          {pageContext.fields.length > 5 && (
                            <p className="text-xs text-gray-400">
                              +{pageContext.fields.length - 5} حقول أخرى
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Uploaded files */}
                    {pageContext.uploadedFiles.length > 0 && (
                      <div className="bg-white rounded-lg p-3 border">
                        <h5 className="font-medium text-sm text-gray-700 mb-2">الملفات المرفوعة</h5>
                        <div className="space-y-1">
                          {pageContext.uploadedFiles.map((file, i) => (
                            <div key={i} className="text-xs text-gray-600">
                              📎 {file.fileName}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Quick actions */}
            <div className="px-3 pb-3 flex items-center justify-between text-xs bg-white">
              <div className="flex gap-2">
                <button
                  onClick={() => dismiss('helped')}
                  className="flex items-center gap-1 text-green-600 hover:text-green-700"
                >
                  <ThumbsUp className="w-3 h-3" />
                  ساعدني
                </button>
                <button
                  onClick={() => dismiss('dismissed')}
                  className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
                >
                  <ThumbsDown className="w-3 h-3" />
                  ما ساعدني
                </button>
              </div>
              <button
                onClick={enableSilentMode}
                className="flex items-center gap-1 text-gray-400 hover:text-gray-600"
              >
                <VolumeX className="w-3 h-3" />
                إيقاف
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

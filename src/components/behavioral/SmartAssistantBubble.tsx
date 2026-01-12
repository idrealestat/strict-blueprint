/**
 * SmartAssistantBubble.tsx
 * Non-intrusive smart assistant that appears based on user behavior
 */

import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, VolumeX, ThumbsUp, ThumbsDown, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSmartAssistant } from '@/hooks/useSmartAssistant';

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
    sendMessage,
    dismiss,
    enableSilentMode,
  } = useSmartAssistant();

  const [inputValue, setInputValue] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
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

  // Don't show on excluded pages
  if (silentMode || !isVisible || isExcludedPage) return null;

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
          // Minimized state - just a bubble
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
            className="w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
            layout
          >
            {/* Header */}
            <div className="bg-gradient-to-l from-[#01411C] to-[#065f41] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-medium text-sm">المساعد الذكي</h4>
                  <p className="text-white/70 text-xs">هنا للمساعدة</p>
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

            {/* Messages */}
            <div className="h-48 overflow-y-auto p-3 space-y-3 bg-gray-50">
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
                  </div>
                </motion.div>
              ))}
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

            {/* Quick actions */}
            <div className="px-3 pb-3 flex items-center justify-between text-xs">
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

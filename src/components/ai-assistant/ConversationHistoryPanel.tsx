import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, MessageCircle, Trash2, Plus, X, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuthContext } from '@/context/AuthContext';

interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  preview?: string;
  messageCount?: number;
}

interface ConversationHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  currentConversationId: string | null;
}

export function ConversationHistoryPanel({
  isOpen,
  onClose,
  onSelectConversation,
  onNewConversation,
  currentConversationId
}: ConversationHistoryPanelProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthContext();

  // تحميل المحادثات السابقة
  useEffect(() => {
    if (isOpen && user) {
      loadConversations();
    }
  }, [isOpen, user]);

  const loadConversations = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // جلب المحادثات
      const { data: convData, error: convError } = await supabase
        .from('wasata_ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (convError) {
        console.error('Error loading conversations:', convError);
        return;
      }

      // جلب أول رسالة من كل محادثة كـ preview
      const conversationsWithPreviews = await Promise.all(
        (convData || []).map(async (conv) => {
          const { data: msgData, count } = await supabase
            .from('wasata_ai_messages')
            .select('content', { count: 'exact' })
            .eq('conversation_id', conv.id)
            .eq('role', 'user')
            .order('created_at', { ascending: true })
            .limit(1);

          return {
            ...conv,
            preview: msgData?.[0]?.content?.substring(0, 50) || 'محادثة جديدة',
            messageCount: count || 0
          };
        })
      );

      setConversations(conversationsWithPreviews);
    } catch (e) {
      console.error('Error loading conversations:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // حذف الرسائل أولاً
      await supabase
        .from('wasata_ai_messages')
        .delete()
        .eq('conversation_id', conversationId);

      // حذف المحادثة
      await supabase
        .from('wasata_ai_conversations')
        .delete()
        .eq('id', conversationId);

      setConversations(prev => prev.filter(c => c.id !== conversationId));
      toast.success('تم حذف المحادثة');

      // إذا كانت المحادثة المحذوفة هي الحالية، ابدأ محادثة جديدة
      if (conversationId === currentConversationId) {
        onNewConversation();
      }
    } catch (e) {
      console.error('Error deleting conversation:', e);
      toast.error('فشل في حذف المحادثة');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `اليوم ${date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return 'أمس';
    } else if (diffDays < 7) {
      return `منذ ${diffDays} أيام`;
    } else {
      return date.toLocaleDateString('ar-SA');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="absolute inset-y-0 left-0 w-full sm:w-80 bg-white/95 backdrop-blur-sm shadow-xl z-30 border-r border-[#01411C]/20 flex flex-col"
        >
          {/* الرأس */}
          <div className="p-4 bg-gradient-to-r from-[#01411C] to-[#065f41] border-b border-[#D4AF37]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <History className="w-5 h-5" />
                <h3 className="font-bold">المحادثات السابقة</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* زر محادثة جديدة */}
          <div className="p-3 border-b border-[#01411C]/10">
            <button
              onClick={() => {
                onNewConversation();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#B8941F] text-[#01411C] rounded-xl font-bold hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              محادثة جديدة
            </button>
          </div>

          {/* قائمة المحادثات */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#01411C] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-[#01411C]/60">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>لا توجد محادثات سابقة</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`group relative p-3 rounded-xl cursor-pointer transition-all ${
                    conv.id === currentConversationId
                      ? 'bg-[#01411C] text-white'
                      : 'bg-[#01411C]/5 hover:bg-[#01411C]/10 text-[#01411C]'
                  }`}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    onClose();
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      conv.id === currentConversationId ? 'bg-[#D4AF37]' : 'bg-[#01411C]/10'
                    }`}>
                      <MessageCircle className={`w-4 h-4 ${
                        conv.id === currentConversationId ? 'text-[#01411C]' : 'text-[#01411C]/60'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {conv.preview}...
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 opacity-60" />
                        <span className="text-xs opacity-60">{formatDate(conv.updated_at)}</span>
                        <span className="text-xs opacity-60">• {conv.messageCount} رسالة</span>
                      </div>
                    </div>
                  </div>

                  {/* زر الحذف */}
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className={`absolute top-2 left-2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all ${
                      conv.id === currentConversationId
                        ? 'hover:bg-white/20 text-white'
                        : 'hover:bg-red-100 text-red-500'
                    }`}
                    title="حذف المحادثة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))
            )}
          </div>

          {/* التذييل */}
          <div className="p-3 border-t border-[#01411C]/10 text-center">
            <p className="text-xs text-[#01411C]/50">
              {conversations.length} محادثة محفوظة
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ConversationHistoryPanel;

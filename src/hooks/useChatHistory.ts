import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: any[];
  created_at?: string;
}

interface Conversation {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface UseChatHistoryReturn {
  conversationId: string | null;
  messages: Message[];
  isLoading: boolean;
  createConversation: (userId: string) => Promise<string | null>;
  loadConversation: (conversationId: string) => Promise<void>;
  loadUserConversations: (userId: string) => Promise<Conversation[]>;
  saveMessage: (role: 'user' | 'assistant', content: string, actions?: any[]) => Promise<void>;
  clearHistory: () => void;
}

export function useChatHistory(): UseChatHistoryReturn {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // تحميل المحادثة من localStorage عند البداية
  useEffect(() => {
    const savedConversationId = localStorage.getItem('wasata_ai_conversation_id');
    if (savedConversationId) {
      setConversationId(savedConversationId);
      loadConversation(savedConversationId);
    }
  }, []);

  // إنشاء محادثة جديدة
  const createConversation = useCallback(async (_userName: string): Promise<string | null> => {
    try {
      // الحصول على user_id الحقيقي من auth
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      
      if (!userId) {
        console.warn('No authenticated user, skipping conversation creation');
        return null;
      }

      const { data, error } = await supabase
        .from('wasata_ai_conversations')
        .insert({ user_id: userId }) // استخدام auth.uid() الحقيقي
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        return null;
      }

      const newConversationId = data.id;
      setConversationId(newConversationId);
      localStorage.setItem('wasata_ai_conversation_id', newConversationId);
      setMessages([]);
      
      console.log('Created new conversation:', newConversationId);
      return newConversationId;
    } catch (e) {
      console.error('Error creating conversation:', e);
      return null;
    }
  }, []);

  // تحميل محادثة موجودة
  const loadConversation = useCallback(async (convId: string): Promise<void> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('wasata_ai_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      const loadedMessages: Message[] = data.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        actions: Array.isArray(msg.actions) ? msg.actions : [],
        created_at: msg.created_at
      }));

      setMessages(loadedMessages);
      setConversationId(convId);
      localStorage.setItem('wasata_ai_conversation_id', convId);
      
      console.log('Loaded', loadedMessages.length, 'messages for conversation:', convId);
    } catch (e) {
      console.error('Error loading conversation:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // تحميل جميع محادثات المستخدم
  const loadUserConversations = useCallback(async (_userName: string): Promise<Conversation[]> => {
    try {
      // الحصول على user_id الحقيقي من auth
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      
      if (!userId) {
        console.warn('No authenticated user');
        return [];
      }

      const { data, error } = await supabase
        .from('wasata_ai_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading user conversations:', error);
        return [];
      }

      return data as Conversation[];
    } catch (e) {
      console.error('Error loading user conversations:', e);
      return [];
    }
  }, []);

  // حفظ رسالة جديدة
  const saveMessage = useCallback(async (
    role: 'user' | 'assistant', 
    content: string, 
    actions: any[] = []
  ): Promise<void> => {
    if (!conversationId) {
      console.warn('No conversation ID, skipping save');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('wasata_ai_messages')
        .insert({
          conversation_id: conversationId,
          role,
          content,
          actions
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving message:', error);
        return;
      }

      // إضافة الرسالة للقائمة المحلية
      const newMessage: Message = {
        id: data.id,
        role,
        content,
        actions,
        created_at: data.created_at
      };

      setMessages(prev => [...prev, newMessage]);
      console.log('Saved message:', role, content.substring(0, 50));
    } catch (e) {
      console.error('Error saving message:', e);
    }
  }, [conversationId]);

  // مسح التاريخ وبدء محادثة جديدة
  const clearHistory = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    localStorage.removeItem('wasata_ai_conversation_id');
  }, []);

  return {
    conversationId,
    messages,
    isLoading,
    createConversation,
    loadConversation,
    loadUserConversations,
    saveMessage,
    clearHistory
  };
}

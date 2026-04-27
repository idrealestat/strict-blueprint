import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "../ui/button";
import { X, Send, User, Sparkles, ChevronLeft, Calendar, Users, Building2, FileText, LayoutGrid, Tag, DollarSign, Phone, MessageCircle, MapPin, Clock, Plus, Mic, MicOff, Volume2, VolumeX, Loader2, Trash2, History, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useWasataAI } from "@/hooks/useWasataAI";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useChatHistory } from "@/hooks/useChatHistory";
import { processLocalCommand } from "@/utils/wasataLocalCommands";
import { triggerNotification } from "@/hooks/useNotificationSystem";
import { AudioProcessingOverlay } from "./AudioProcessingOverlay";
import { ConversationHistoryPanel } from "./ConversationHistoryPanel";
interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  actions?: ActionButton[];
}

interface ActionButton {
  icon: string;
  text: string;
  action: string;
  type: 'navigate' | 'action' | 'call' | 'whatsapp' | 'appointment';
  data?: Record<string, unknown>;
}

interface QuickAction {
  icon: string;
  text: string;
  action: string;
  category: 'crm' | 'platform' | 'calendar' | 'analytics' | 'offers';
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  type: string;
  status: string;
  tags?: string[];
}

interface Offer {
  id: string;
  title: string;
  city: string;
  price: number;
  property_type: string;
  status: string;
  area: number;
}

interface AIChatPanelProps {
  onClose: () => void;
}

// مراجع عقارية سعودية رسمية
const realEstateReferences = {
  rega: { name: 'الهيئة العامة للعقار', url: 'https://rega.gov.sa' },
  sakani: { name: 'سكني', url: 'https://sakani.sa' },
  ejar: { name: 'منصة إيجار', url: 'https://ejar.sa' },
  aqar: { name: 'موقع عقار', url: 'https://sa.aqar.fm' },
  aqarsas: { name: 'عقار ساس', url: 'https://aqarsas.sa' },
  indicators: { name: 'المؤشرات العقارية', url: 'https://rega.gov.sa/indicators' }
};

// أسعار الفوائد التقريبية للبنوك السعودية
const bankRates = {
  rajhi: { name: 'مصرف الراجحي', rate: '5.25%', type: 'ثابت' },
  ahli: { name: 'البنك الأهلي', rate: '5.15%', type: 'متغير' },
  riyad: { name: 'بنك الرياض', rate: '5.35%', type: 'ثابت' },
  samba: { name: 'سامبا', rate: '5.20%', type: 'متغير' },
  bilad: { name: 'بنك البلاد', rate: '5.30%', type: 'ثابت' },
  inma: { name: 'مصرف الإنماء', rate: '5.10%', type: 'ثابت' }
};

// الحصول على اسم المستخدم - سيتم تحميله من قاعدة البيانات
const getDefaultUserName = (): string => {
  return 'صديقي';
};

export function AIChatPanel({ onClose }: AIChatPanelProps) {
  const userName = getDefaultUserName();
  const { isLoading: aiLoading, error: aiError, sendMessage } = useWasataAI();
  const { isRecording, recordingDuration, startRecording, stopRecording, cancelRecording, audioLevel } = useVoiceRecorder({
    silenceTimeout: 2000, // 2 ثانية صمت قبل الإيقاف التلقائي
    silenceThreshold: 0.02,
    maxDuration: 30,
    autoStopOnSilence: true,
  });
  const { isTranscribing, transcribe } = useSpeechToText();
  const { isSpeaking, isLoading: ttsLoading, speak, stop: stopSpeaking } = useTextToSpeech();
  const { conversationId, createConversation, loadConversation, saveMessage, clearHistory } = useChatHistory();
  
  // إعدادات الصوت - تحميل من localStorage
  // إعدادات الصوت - تحميل من localStorage (الإعدادات الجديدة)
  const [voiceFeaturesEnabled, setVoiceFeaturesEnabled] = useState(() => {
    return localStorage.getItem('voice_features_enabled') !== 'false';
  });
  
  const [autoSpeak, setAutoSpeak] = useState(() => {
    const saved = localStorage.getItem('wasata_ai_auto_speak');
    return saved !== null ? saved === 'true' : true;
  });
  
  // اختيار نوع الصوت (رجل/امرأة) - تحميل من localStorage
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>(() => {
    // أولاً نتحقق من الإعدادات الجديدة
    const newSetting = localStorage.getItem('voice_type');
    if (newSetting) return newSetting as 'male' | 'female';
    // ثم من الإعدادات القديمة
    const saved = localStorage.getItem('wasata_ai_voice_gender');
    return (saved as 'male' | 'female') || 'male';
  });
  
  // الاستماع لتغييرات الإعدادات
  useEffect(() => {
    const handleVoiceSettingsChange = () => {
      setVoiceFeaturesEnabled(localStorage.getItem('voice_features_enabled') !== 'false');
      const newVoiceType = localStorage.getItem('voice_type');
      if (newVoiceType) setVoiceGender(newVoiceType as 'male' | 'female');
    };
    window.addEventListener('voiceSettingsChanged', handleVoiceSettingsChange);
    return () => window.removeEventListener('voiceSettingsChanged', handleVoiceSettingsChange);
  }, []);
  
  // لوحة سجل المحادثات
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // رسالة الترحيب المحدثة - اسم المساعد: Wasata AI
  const welcomeMessage: Message = {
    id: 1,
    role: "assistant",
    content: `حياك الله يا ${userName}! 🏠\n\nأنا **Wasata AI**، مساعدك العقاري المتخصص.\n\n🏛️ معلوماتي من مصادر رسمية:\n• الهيئة العامة للعقار\n• منصة سكني وإيجار\n• المؤشرات العقارية السعودية\n\n🏠 **العقارات المؤجرة:**\n• إحصائيات الإيجارات\n• عقود تنتهي قريباً\n• معلومات الملاك\n\n🧮 أقدر أحسب لك:\n• سعر المتر المربع\n• القسط الشهري للتمويل\n• الضريبة والعمولة\n\n✨ سم طال عمرك.. كيف أقدر أخدمك اليوم؟`,
    timestamp: new Date(),
    actions: [
      { icon: '👥', text: 'عرض العملاء', action: 'navigate:crm', type: 'navigate' },
      { icon: '🏠', text: 'منصتي', action: 'navigate:platform', type: 'navigate' },
      { icon: '📊', text: 'تقرير الإيجارات', action: 'navigate:rental-report', type: 'navigate' },
      { icon: '📅', text: 'التقويم', action: 'navigate:calendar', type: 'navigate' },
      { icon: '🧮', text: 'الحاسبة', action: 'navigate:calculator', type: 'navigate' }
    ]
  };

  // دالة إنشاء موعد من المساعد الذكي
  const createAppointmentFromAI = useCallback((title: string, customerName: string, date?: Date, time?: string) => {
    const appointmentData = {
      id: `apt_${Date.now()}`,
      title,
      customerName,
      customerPhone: '',
      date: date || new Date(),
      time: time || '10:00',
      duration: 60,
      type: 'meeting',
      status: 'scheduled',
      reminder: true,
      reminderTime: 30,
    };
    
    // حفظ في localStorage
    const existingAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    existingAppointments.push(appointmentData);
    localStorage.setItem('appointments', JSON.stringify(existingAppointments));
    
    // إرسال حدث لتحديث التقويم
    window.dispatchEvent(new CustomEvent('appointmentCreated', { detail: appointmentData }));
    
    // إشعار
    triggerNotification({
      title: '📅 موعد جديد من وساطه AI',
      message: `تم إنشاء موعد "${title}" مع ${customerName}`,
      type: 'success',
      category: 'appointment',
    });
    
    toast.success(`تم إنشاء موعد "${title}" بنجاح`);
    return appointmentData;
  }, []);

  // ربط عناوين العروض المنشورة
  const getPublishedOffersContext = useCallback(() => {
    try {
      const publishedAds = JSON.parse(localStorage.getItem('published_ads_list') || '[]');
      const customers = JSON.parse(localStorage.getItem('crm_customers') || '[]');
      
      if (publishedAds.length === 0) return '';
      
      let context = '\n\n[العروض المنشورة في النظام:]';
      publishedAds.forEach((ad: any, index: number) => {
        const owner = customers.find((c: any) => c.id === ad.linkedCustomerId);
        context += `\n${index + 1}. ${ad.title || ad.propertyType} - ${ad.price} ريال`;
        context += ` - المالك: ${ad.ownerName}`;
        if (owner) context += ` (معرف البطاقة: ${owner.id})`;
      });
      
      return context;
    } catch {
      return '';
    }
  }, []);
  
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // إنشاء محادثة جديدة عند البداية إذا لم تكن موجودة
  useEffect(() => {
    if (!conversationId) {
      createConversation(userName || 'guest');
    }
  }, [conversationId, userName, createConversation]);

  // Mock CRM data
  const customers: Customer[] = [
    { id: '1', name: 'أحمد محمد الرشيد', phone: '0551234567', type: 'buyer', status: 'active', tags: ['VIP', 'مستثمر'] },
    { id: '2', name: 'سارة العلي', phone: '0559876543', type: 'seller', status: 'new', tags: ['جديد'] },
    { id: '3', name: 'خالد الخالدي', phone: '0556789012', type: 'buyer', status: 'active', tags: ['مهتم', 'فلل'] },
    { id: '4', name: 'نورة السالم', phone: '0553456789', type: 'buyer', status: 'potential', tags: ['شقق', 'الرياض'] },
    { id: '5', name: 'فهد العتيبي', phone: '0552345678', type: 'seller', status: 'active', tags: ['أراضي'] }
  ];

  const offers: Offer[] = [
    { id: '1', title: 'فيلا فاخرة في حي النرجس', city: 'الرياض', price: 2500000, property_type: 'villa', status: 'available', area: 500 },
    { id: '2', title: 'شقة عصرية في حي الياسمين', city: 'الرياض', price: 850000, property_type: 'apartment', status: 'available', area: 180 },
    { id: '3', title: 'أرض استثمارية في حي العارض', city: 'الرياض', price: 1200000, property_type: 'land', status: 'available', area: 600 },
    { id: '4', title: 'فيلا دوبلكس في حي الملقا', city: 'الرياض', price: 3200000, property_type: 'villa', status: 'reserved', area: 450 },
    { id: '5', title: 'شقة مفروشة في حي السليمانية', city: 'الرياض', price: 950000, property_type: 'apartment', status: 'available', area: 200 }
  ];

  const deals = [
    { id: '1', customer: 'أحمد محمد', offer: 'فيلا في النرجس', status: 'negotiation', value: 2400000, commission: 60000 },
    { id: '2', customer: 'سارة العلي', offer: 'شقة في الياسمين', status: 'documentation', value: 820000, commission: 20500 },
    { id: '3', customer: 'خالد الخالدي', offer: 'أرض في العارض', status: 'completed', value: 1150000, commission: 28750 }
  ];

  const requests = [
    { id: '1', customer: 'نورة السالم', type: 'villa', city: 'الرياض', budget: '2-3 مليون', status: 'new' },
    { id: '2', customer: 'فهد العتيبي', type: 'apartment', city: 'جدة', budget: '800K-1.2M', status: 'active' }
  ];

  const kanbanColumns = [
    { id: 'new', name: 'جديد', count: 5, color: '#3B82F6' },
    { id: 'contacted', name: 'تم التواصل', count: 8, color: '#8B5CF6' },
    { id: 'interested', name: 'مهتم', count: 12, color: '#F59E0B' },
    { id: 'negotiation', name: 'مفاوضة', count: 4, color: '#EF4444' },
    { id: 'deal', name: 'صفقة', count: 3, color: '#10B981' },
    { id: 'completed', name: 'مكتمل', count: 15, color: '#6B7280' }
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Show error toast
  useEffect(() => {
    if (aiError) {
      toast.error(aiError);
    }
  }, [aiError]);

  const handleActionClick = (action: ActionButton) => {
    const actionParts = action.action.split(':');
    const type = actionParts[0];
    const target = actionParts[1];
    const extra = actionParts[2]; // للتبويب المحدد
    
    switch (type) {
      case 'navigate':
        navigateToPage(target);
        break;
      case 'call':
        const callPhone = target || action.data?.phone;
        window.open(`tel:${callPhone}`, '_self');
        toast.success(`جاري الاتصال...`);
        break;
      case 'whatsapp':
        const waPhone = target || action.data?.phone;
        window.open(`https://wa.me/966${String(waPhone)?.slice(1)}`, '_blank');
        toast.success(`جاري فتح واتساب...`);
        break;
      case 'appointment':
        createAppointment(action.data as any);
        break;
      case 'customer':
        openCustomerDetails(action.data?.id as string);
        break;
      case 'offer':
        openOfferDetails(action.data?.id as string);
        break;
      case 'owner_details':
        // فتح بطاقة المالك مع التبويب المحدد (rented = عقار مؤجر)
        openOwnerDetails(target, extra);
        break;
      case 'all_rented':
        // عرض كل العقارات المؤجرة
        handleQuickAction('اعرض لي كل العقارات المؤجرة');
        break;
      case 'expiring_contracts':
        // العقود التي تنتهي قريباً
        handleQuickAction('اعرض لي العقود التي تنتهي خلال شهرين');
        break;
      case 'send_rental_notifications':
        // إرسال تنبيهات للملاك
        sendRentalNotifications();
        break;
      case 'view_property':
        // الانتقال لعرض العقار
        viewPropertyDetails(target, action.data?.title as string);
        break;
      case 'compare_properties':
        // مقارنة العقارات
        compareProperties(action.data?.ids as string[]);
        break;
    }
  };

  // عرض تفاصيل العقار
  const viewPropertyDetails = (propertyId: string, propertyTitle: string) => {
    window.dispatchEvent(new CustomEvent('navigateToProperty', { 
      detail: { propertyId, propertyTitle } 
    }));
    // الانتقال للمنصة مع فتح العقار
    window.dispatchEvent(new CustomEvent('navigateFromAssistant', { 
      detail: { page: 'dashboard-main-252', propertyId } 
    }));
    toast.success(`جاري فتح: ${propertyTitle}`);
    onClose();
  };

  // مقارنة العقارات
  const compareProperties = (propertyIds: string[]) => {
    window.dispatchEvent(new CustomEvent('compareProperties', { 
      detail: { propertyIds } 
    }));
    window.dispatchEvent(new CustomEvent('navigateFromAssistant', { 
      detail: { page: 'dashboard-main-252', compareIds: propertyIds } 
    }));
    toast.success('جاري فتح المقارنة...');
    onClose();
  };

  const openOwnerDetails = (ownerId: string, activeTab?: string) => {
    // إرسال حدث لفتح تفاصيل العميل (المالك) مع التبويب المحدد
    window.dispatchEvent(new CustomEvent('openCustomerDetails', { 
      detail: { 
        customerId: ownerId,
        activeTab: activeTab || 'rented' // افتراضياً نفتح تبويب العقارات المؤجرة
      } 
    }));
    toast.success('جاري فتح بطاقة المالك - تبويب العقارات المؤجرة');
    onClose();
  };

  const sendRentalNotifications = async () => {
    toast.info('جاري إرسال تنبيهات لجميع الملاك بالعقود التي تنتهي قريباً...');
    // TODO: تنفيذ إرسال الإشعارات عبر Edge Function
    setTimeout(() => {
      toast.success('تم إرسال التنبيهات بنجاح لجميع الملاك');
    }, 2000);
  };

  const navigateToPage = (page: string) => {
    const pageMap: Record<string, string> = {
      'crm': 'customer-management-72',
      'platform': 'dashboard-main-252',
      'calendar': 'calendar',
      'reports': 'reports-analytics',
      'tasks': 'tasks',
      'digital-card': 'digital-card',
      'calculator': 'quick-calculator',
      'rental-report': 'rental-report',
      'map-system': 'map-system'
    };

    const targetPage = pageMap[page] || page;
    window.dispatchEvent(new CustomEvent('navigateFromAssistant', { detail: { page: targetPage } }));
    toast.success(`جاري الانتقال إلى ${getPageName(page)}`);
    onClose();
  };

  const getPageName = (page: string) => {
    const names: Record<string, string> = {
      'crm': 'إدارة العملاء',
      'platform': 'منصتي',
      'calendar': 'التقويم والمواعيد',
      'reports': 'التقارير والتحليلات',
      'tasks': 'المهام',
      'digital-card': 'البطاقة الرقمية',
      'calculator': 'الحاسبة السريعة',
      'rental-report': 'تقرير العقارات المؤجرة',
      'map-system': 'نظام الخرائط'
    };
    return names[page] || page;
  };

  const createAppointment = (data: { customerName: string; customerPhone: string; customerId: string }) => {
    window.dispatchEvent(new CustomEvent('createAppointmentFromCRM', {
      detail: {
        customerId: data.customerId,
        customerName: data.customerName,
        customerPhone: data.customerPhone
      }
    }));
    toast.success(`جاري إنشاء موعد مع ${data.customerName}`);
    onClose();
  };

  const openCustomerDetails = (customerId: string) => {
    window.dispatchEvent(new CustomEvent('openCustomerDetails', { detail: { customerId } }));
    toast.success('جاري فتح بيانات العميل');
  };

  const openOfferDetails = (offerId: string) => {
    window.dispatchEvent(new CustomEvent('openOfferDetails', { detail: { offerId } }));
    toast.success('جاري فتح بيانات العرض');
  };

  const handleQuickAction = async (actionText: string) => {
    setInputValue(actionText);
    setTimeout(() => handleSend(actionText), 100);
  };

  // إزالة رموز [ACTION:...] من النص الظاهر للمستخدم
  const stripActionTokens = (text: string): string => {
    return text
      .replace(/\[ACTION:[A-Z_]+:[^\]]+\]/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  // Extract context-aware actions from AI response
  const extractActions = (content: string, userInput: string): ActionButton[] => {
    const actions: ActionButton[] = [];
    const userInputLower = userInput.toLowerCase();

    // استخراج أزرار العقارات من رد AI
    const propertyActionRegex = /\[ACTION:VIEW_PROPERTY:([^:]+):([^\]]+)\]/g;
    let match;
    while ((match = propertyActionRegex.exec(content)) !== null) {
      const [, propertyId, propertyTitle] = match;
      actions.push({
        icon: '🏠',
        text: `عرض: ${propertyTitle}`,
        action: `view_property:${propertyId}`,
        type: 'navigate',
        data: { id: propertyId, title: propertyTitle }
      });
    }

    // استخراج أزرار العملاء [ACTION:VIEW_CUSTOMER:id:name]
    const customerActionRegex = /\[ACTION:VIEW_CUSTOMER:([^:]+):([^\]]+)\]/g;
    while ((match = customerActionRegex.exec(content)) !== null) {
      const [, customerId, customerName] = match;
      actions.push({
        icon: '👤',
        text: `بطاقة: ${customerName}`,
        action: `customer:${customerId}`,
        type: 'action',
        data: { id: customerId, name: customerName }
      });
    }

    // استخراج أزرار الاتصال [ACTION:CALL:phone:name]
    const callActionRegex = /\[ACTION:CALL:([^:]+):([^\]]+)\]/g;
    while ((match = callActionRegex.exec(content)) !== null) {
      const [, phone, name] = match;
      actions.push({
        icon: '📞',
        text: `اتصال بـ ${name}`,
        action: `call:${phone}`,
        type: 'call',
        data: { phone, name }
      });
    }

    // استخراج أزرار المقارنة
    const compareActionRegex = /\[ACTION:COMPARE_PROPERTIES:([^:]+):([^\]]+)\]/g;
    while ((match = compareActionRegex.exec(content)) !== null) {
      const [, propertyIds, title] = match;
      actions.push({
        icon: '⚖️',
        text: title,
        action: `compare_properties:${propertyIds}`,
        type: 'navigate',
        data: { ids: propertyIds.split(',') }
      });
    }

    return actions;
  };

  // Build context for AI - مع ربط العروض المنشورة
  const buildContextMessage = (userInput: string): string => {
    const inputLower = userInput.toLowerCase();
    let context = userInput;

    // Add relevant context based on keywords
    if (inputLower.includes('عملاء') || inputLower.includes('كانبان')) {
      context += `\n\n[سياق: لدي ${customers.length} عملاء في النظام. حالة الكانبان: ${kanbanColumns.map(c => `${c.name}: ${c.count}`).join(', ')}. آخر العملاء: ${customers.slice(0, 3).map(c => c.name).join(', ')}]`;
    }

    if (inputLower.includes('عروض') || inputLower.includes('عقارات')) {
      const availableOffers = offers.filter(o => o.status === 'available');
      context += `\n\n[سياق: لدي ${availableOffers.length} عروض متاحة. العروض: ${availableOffers.map(o => `${o.title} - ${o.price.toLocaleString()} ريال`).join(', ')}]`;
      // إضافة العروض المنشورة
      context += getPublishedOffersContext();
    }

    if (inputLower.includes('صفقات') || inputLower.includes('عمولة')) {
      const totalCommission = deals.reduce((sum, d) => sum + d.commission, 0);
      context += `\n\n[سياق: لدي ${deals.length} صفقات. إجمالي العمولات: ${totalCommission.toLocaleString()} ريال. الصفقات: ${deals.map(d => `${d.customer} - ${d.offer} - ${d.status}`).join(', ')}]`;
    }

    if (inputLower.includes('طلبات')) {
      context += `\n\n[سياق: لدي ${requests.length} طلبات. الطلبات: ${requests.map(r => `${r.customer} يريد ${r.type} في ${r.city} بميزانية ${r.budget}`).join(', ')}]`;
    }

    // إذا كان طلب موعد، أضف سياق المواعيد
    if (inputLower.includes('موعد') || inputLower.includes('اجتماع') || inputLower.includes('مقابلة')) {
      context += `\n\n[سياق: المستخدم يريد إنشاء موعد. يمكنك استخراج: عنوان الموعد، اسم العميل، التاريخ والوقت إن وجدوا. عند إنشاء موعد، أكد للمستخدم أنه تم إنشاؤه وسيظهر في التقويم.]`;
    }

    // إذا ذكر مالك أو بطاقة اسم
    if (inputLower.includes('مالك') || inputLower.includes('بطاقة') || inputLower.includes('عميل')) {
      context += getPublishedOffersContext();
    }

    return context;
  };

  // تشغيل الرد الصوتي
  const speakResponse = async (text: string) => {
    // التحقق من تفعيل ميزات الصوت من إعدادات المالك + الإعداد المحلي
    if (!voiceFeaturesEnabled || !autoSpeak) return;
    
    // تنظيف النص من الإيموجي والرموز
    const cleanText = text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      .replace(/[•\-\*]/g, '')
      .replace(/\n+/g, '. ')
      .trim();
    
    if (cleanText.length > 10) {
      try {
        // استخدام الصوت المختار (male/female)
        await speak(cleanText, voiceGender as any, 1.0);
      } catch (error) {
        console.error('TTS error:', error);
      }
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || inputValue;
    if (!textToSend.trim()) return;

    // إيقاف أي صوت يعمل
    if (isSpeaking) {
      stopSpeaking();
    }

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // حفظ رسالة المستخدم
    saveMessage('user', textToSend);

    try {
      // 1️⃣ أولاً: محاولة معالجة الأمر محلياً (للحسابات)
      const localResult = processLocalCommand(textToSend);
      
      if (localResult && localResult.handled) {
        // الرد المحلي - لا نحتاج AI
        const assistantMessageId = Date.now() + 1;
        const localActions: ActionButton[] = localResult.buttons?.map(btn => ({
          icon: btn.icon || '🔗',
          text: btn.label,
          action: btn.action,
          type: 'navigate' as const
        })) || [];

        const assistantMessage: Message = {
          id: assistantMessageId,
          role: "assistant",
          content: localResult.text,
          timestamp: new Date(),
          actions: localActions
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // حفظ رد المساعد
        saveMessage('assistant', localResult.text, localActions);
        
        // تشغيل الرد الصوتي
        await speakResponse(localResult.text);
        
        setIsTyping(false);
        return;
      }

      // 2️⃣ إذا لم يُعالج محلياً، نرسل للـ AI
      const conversationHistory = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }));

      // Add context to user message
      const contextualMessage = buildContextMessage(textToSend);
      conversationHistory.push({ role: 'user', content: contextualMessage });

      let assistantContent = "";
      const assistantMessageId = Date.now() + 1;

      // Create initial assistant message
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date()
      }]);

      // Stream the response
      await sendMessage(conversationHistory, userName, (delta) => {
        assistantContent += delta;
        setMessages(prev => prev.map(m => 
          m.id === assistantMessageId 
            ? { ...m, content: assistantContent }
            : m
        ));
      });

      // Add actions to the final message
      const actions = extractActions(assistantContent, textToSend);
      setMessages(prev => prev.map(m => 
        m.id === assistantMessageId 
          ? { ...m, actions }
          : m
      ));

      // حفظ رد المساعد
      saveMessage('assistant', assistantContent, actions);

      // 3️⃣ التحقق من طلب إنشاء موعد وتنفيذه
      const inputLower = textToSend.toLowerCase();
      if (inputLower.includes('موعد') || inputLower.includes('اجتماع') || inputLower.includes('مقابلة')) {
        // استخراج المعلومات من الرد أو الطلب
        const appointmentMatch = textToSend.match(/موعد\s+(مع\s+)?([^،,]+)/);
        const customerName = appointmentMatch?.[2]?.trim() || 'عميل';
        
        // إنشاء الموعد تلقائياً
        if (assistantContent.includes('تم إنشاء') || assistantContent.includes('موعد') || inputLower.includes('أنشئ') || inputLower.includes('اعمل')) {
          createAppointmentFromAI(
            `موعد من وساطه AI`,
            customerName,
            new Date(),
            '10:00'
          );
        }
      }

      // تشغيل الرد الصوتي
      await speakResponse(assistantContent);

    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: "عذراً طال عمرك، حدث خطأ. يرجى المحاولة مرة أخرى.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error("حدث خطأ في معالجة الطلب");
    } finally {
      setIsTyping(false);
    }
  };

  // مسح المحادثة وبدء جديدة
  const handleClearChat = () => {
    clearHistory();
    setMessages([welcomeMessage]);
    createConversation(userName || 'guest');
    toast.success("تم مسح المحادثة وبدء محادثة جديدة");
  };

  // حالة لتتبع ما إذا كنا ننتظر معالجة الصوت
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  
  // حالة لإظهار زر الووكي توكي الكبير
  const [showWalkieTalkie, setShowWalkieTalkie] = useState(false);
  
  // ref لمنع الإفلات المزدوج
  const isStoppingRef = useRef(false);

  // اهتزاز للموبايل
  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  // Walkie-Talkie: اضغط للتسجيل، افلت للإرسال
  const handleVoiceStart = useCallback(async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // منع السلوك الافتراضي
    e.stopPropagation();
    
    if (isProcessingVoice || isTranscribing || ttsLoading || isRecording || isStoppingRef.current) return;
    
    // اهتزاز قصير عند بدء التسجيل
    vibrate(50);
    
    try {
      console.log('🎤 Starting recording...');
      await startRecording();
      console.log('🎤 Recording started via walkie-talkie');
    } catch (error) {
      vibrate([100, 50, 100]); // اهتزاز مزدوج للخطأ
      toast.error("لم نتمكن من الوصول للميكروفون");
    }
  }, [isProcessingVoice, isTranscribing, ttsLoading, isRecording, startRecording]);

  const handleVoiceEnd = useCallback(async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // منع الاستدعاء المتكرر
    if (!isRecording || isStoppingRef.current) {
      console.log('⚠️ handleVoiceEnd skipped - not recording or already stopping');
      return;
    }
    
    isStoppingRef.current = true;
    console.log('🛑 Stopping recording via walkie-talkie');
    
    // اهتزاز عند الإفلات
    vibrate(30);
    
    setIsProcessingVoice(true);
    setShowWalkieTalkie(false); // إخفاء الووكي توكي
    
    try {
      const audioResult = await stopRecording();
      
      if (audioResult) {
        const { base64, mimeType } = audioResult;
        console.log('📤 Audio captured, transcribing...');
        
        // تحويل الصوت إلى نص
        const transcribedText = await transcribe(base64, mimeType);
        
        if (transcribedText && transcribedText.length > 0) {
          setInputValue(transcribedText);
          vibrate(20); // اهتزاز خفيف للنجاح
          console.log('✅ Transcribed:', transcribedText);
          
          // إرسال تلقائي فوري
          handleSend(transcribedText);
        } else {
          vibrate([100, 50, 100]); // اهتزاز مزدوج للفشل
          toast.error("لم نستطع فهم الصوت");
        }
      }
    } finally {
      setIsProcessingVoice(false);
      isStoppingRef.current = false;
    }
  }, [isRecording, stopRecording, transcribe, handleSend]);

  // تبديل الرد الصوتي التلقائي - حفظ في localStorage
  const toggleAutoSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    const newValue = !autoSpeak;
    setAutoSpeak(newValue);
    localStorage.setItem('wasata_ai_auto_speak', String(newValue));
    toast.info(newValue ? "تم تفعيل الرد الصوتي 🔊" : "تم إيقاف الرد الصوتي 🔇");
  };

  // معالجة اختيار محادثة من السجل
  const handleSelectConversation = async (convId: string) => {
    await loadConversation(convId);
    toast.success("تم تحميل المحادثة السابقة");
  };

  // بدء محادثة جديدة
  const handleNewConversation = async () => {
    clearHistory();
    setMessages([welcomeMessage]);
    await createConversation(userName || 'guest');
    toast.success("تم بدء محادثة جديدة");
  };

  // تشغيل رسالة معينة
  const speakMessage = async (content: string) => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      await speakResponse(content);
    }
  };

  const quickActions: QuickAction[] = [
    { icon: '👥', text: 'عرض الكانبان', action: 'أعرض لي حالة العملاء في الكانبان مع الأسماء والتاقات', category: 'crm' },
    { icon: '🏠', text: 'العروض المنشورة', action: 'أعرض لي العروض المنشورة في المنصة مع عناوينها وأسعارها', category: 'platform' },
    { icon: '📋', text: 'طلبات العملاء', action: 'أعرض لي طلبات العملاء الجديدة والنشطة', category: 'crm' },
    { icon: '💼', text: 'حالة الصفقات', action: 'أعرض لي الصفقات الحالية وقيمة العمولات', category: 'analytics' },
    { icon: '📅', text: 'إنشاء موعد', action: 'أريد إنشاء موعد جديد في التقويم', category: 'calendar' },
    { icon: '📞', text: 'اتصال سريع', action: 'أعرض لي قائمة الاتصال السريع للعملاء', category: 'crm' },
    { icon: '💬', text: 'واتساب', action: 'أريد التواصل مع عميل عبر واتساب', category: 'crm' },
    { icon: '🏷️', text: 'التاقات', action: 'أعرض لي التاقات والتصنيفات للعملاء', category: 'crm' },
    { icon: '🧮', text: 'الحاسبة', action: 'أريد استخدام الحاسبة السريعة', category: 'analytics' },
    { icon: '📊', text: 'التقارير', action: 'أعطني ملخص التقارير والإحصائيات', category: 'analytics' }
  ];

  const filteredActions = activeCategory === 'all' 
    ? quickActions 
    : quickActions.filter(a => a.category === activeCategory);

  const categories = [
    { id: 'all', name: 'الكل', icon: '📋' },
    { id: 'crm', name: 'العملاء', icon: '👥' },
    { id: 'platform', name: 'المنصة', icon: '🏠' },
    { id: 'calendar', name: 'التقويم', icon: '📅' },
    { id: 'analytics', name: 'التحليلات', icon: '📊' }
  ];

  // تنسيق مدة التسجيل
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9] rounded-2xl shadow-2xl overflow-hidden h-full flex flex-col border-2 border-[#D4AF37] relative">
      {/* شاشة معالجة الصوت / زر الووكي توكي - يظهر فقط إذا كانت ميزات الصوت مفعلة */}
      {voiceFeaturesEnabled && (
        <AnimatePresence>
          <AudioProcessingOverlay
            isTranscribing={isTranscribing}
            isTTSLoading={ttsLoading}
            isRecording={isRecording}
            recordingDuration={recordingDuration}
            audioLevel={audioLevel}
            onVoiceStart={handleVoiceStart}
            onVoiceEnd={handleVoiceEnd}
            isProcessingVoice={isProcessingVoice}
            showWalkieTalkie={showWalkieTalkie}
          />
        </AnimatePresence>
      )}

      {/* لوحة سجل المحادثات */}
      <ConversationHistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        currentConversationId={conversationId}
      />

      {/* رأس Wasata AI */}
      <div className="p-4 bg-gradient-to-r from-[#01411C] to-[#065f41] border-b border-[#D4AF37]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-[#D4AF37] to-[#B8941F] rounded-full flex items-center justify-center text-xl">
                🏠
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#01411C] animate-pulse"></div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Wasata AI</h3>
            <p className="text-[#D4AF37] text-xs flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                مساعدك العقاري الذكي - {userName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* زر سجل المحادثات */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all"
              title="المحادثات السابقة"
            >
              <History className="w-4 h-4" />
            </button>
            {/* زر اختيار الصوت (رجل/امرأة) - يظهر فقط إذا كانت ميزات الصوت مفعلة */}
            {voiceFeaturesEnabled && (
              <button
                onClick={() => {
                  const newGender = voiceGender === 'male' ? 'female' : 'male';
                  setVoiceGender(newGender);
                  localStorage.setItem('wasata_ai_voice_gender', newGender);
                  localStorage.setItem('voice_type', newGender);
                  toast.info(newGender === 'male' ? '🧔 صوت رجل' : '👩 صوت امرأة');
                }}
                className="p-2 rounded-full transition-all bg-white/20 text-white hover:bg-white/30 flex items-center gap-1"
                title={voiceGender === 'male' ? 'تغيير إلى صوت امرأة' : 'تغيير إلى صوت رجل'}
              >
                <span className="text-sm">{voiceGender === 'male' ? '🧔' : '👩'}</span>
              </button>
            )}
            {/* زر الرد الصوتي التلقائي - يظهر فقط إذا كانت ميزات الصوت مفعلة */}
            {voiceFeaturesEnabled && (
              <button
                onClick={toggleAutoSpeak}
                className={`p-2 rounded-full transition-all ${
                  autoSpeak 
                    ? 'bg-[#D4AF37] text-[#01411C]' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                title={autoSpeak ? "إيقاف الرد الصوتي التلقائي" : "تفعيل الرد الصوتي التلقائي"}
              >
                {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full h-8 w-8"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* الإجراءات السريعة - الجانب */}
        <div className="w-1/3 border-l border-[#01411C]/20 p-3 overflow-y-auto scrollbar-hide bg-[#01411C]/10">
          {/* فلترة الفئات */}
          <div className="flex flex-wrap gap-1 mb-3">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2 py-1 rounded-lg text-xs transition-colors ${
                  activeCategory === cat.id 
                    ? 'bg-[#01411C] text-white' 
                    : 'bg-white/60 text-[#01411C] hover:bg-white'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            {filteredActions.map((item, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(item.action)}
                className="w-full flex items-center gap-2 p-2 rounded-lg bg-white/60 hover:bg-[#01411C] hover:text-white transition-colors group text-right text-[#01411C]"
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-xs flex-1 leading-tight">{item.text}</span>
                <ChevronLeft className="w-3 h-3 text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>

          {/* إحصائيات سريعة */}
          <div className="mt-4 pt-3 border-t border-[#01411C]/20">
            <h5 className="text-[#01411C] text-xs font-bold mb-2">ملخص سريع</h5>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/70 rounded-lg p-2 text-center shadow-sm">
                <div className="text-lg font-bold text-[#D4AF37]">{customers.length}</div>
                <div className="text-[10px] text-[#01411C]">عميل</div>
              </div>
              <div className="bg-white/70 rounded-lg p-2 text-center shadow-sm">
                <div className="text-lg font-bold text-green-600">{offers.filter(o => o.status === 'available').length}</div>
                <div className="text-[10px] text-[#01411C]">عرض</div>
              </div>
              <div className="bg-white/70 rounded-lg p-2 text-center shadow-sm">
                <div className="text-lg font-bold text-blue-600">{deals.length}</div>
                <div className="text-[10px] text-[#01411C]">صفقة</div>
              </div>
              <div className="bg-white/70 rounded-lg p-2 text-center shadow-sm">
                <div className="text-lg font-bold text-purple-600">{requests.length}</div>
                <div className="text-[10px] text-[#01411C]">طلب</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* المحادثة */}
        <div className="flex-1 p-3 flex flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-3 scrollbar-hide">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex gap-2 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === "user"
                        ? "bg-[#01411C]"
                        : "bg-gradient-to-br from-[#D4AF37] to-[#B8941F]"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-[#01411C]" />
                    )}
                  </div>
                  <div className={`flex-1 max-w-[85%] ${message.role === "user" ? "text-right" : "text-right"}`}>
                    <div
                      className={`rounded-xl px-3 py-2 relative group ${
                        message.role === "user"
                          ? "bg-[#01411C] text-white"
                          : "bg-white text-[#01411C] shadow-sm"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                      
                      {/* زر تشغيل الصوت لرسائل المساعد - يظهر فقط إذا كانت ميزات الصوت مفعلة */}
                      {voiceFeaturesEnabled && message.role === "assistant" && message.content.length > 10 && (
                        <button
                          onClick={() => speakMessage(message.content)}
                          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-[#01411C]/10 hover:bg-[#01411C]/20"
                          title="تشغيل الرسالة صوتياً"
                        >
                          {isSpeaking ? (
                            <VolumeX className="w-3 h-3 text-[#01411C]" />
                          ) : (
                            <Volume2 className="w-3 h-3 text-[#01411C]" />
                          )}
                        </button>
                      )}
                    </div>
                    
                    {/* أزرار التفاعل */}
                    {message.actions && message.actions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {message.actions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleActionClick(action)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#01411C] hover:bg-[#01411C]/80 text-white text-xs transition-colors border border-[#D4AF37]/50"
                          >
                            <span>{action.icon}</span>
                            <span>{action.text}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="text-[10px] text-[#01411C]/60 mt-1 px-1">
                      {message.timestamp.toLocaleTimeString("ar-SA", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {(isTyping || aiLoading || isTranscribing) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8941F] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#01411C]" />
                </div>
                <div className="bg-white rounded-xl px-3 py-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-[#01411C] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[#01411C] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      <div className="w-2 h-2 bg-[#01411C] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                    </div>
                    {isTranscribing && (
                      <span className="text-xs text-[#01411C]/60">جاري تحويل الصوت...</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* إدخال الرسالة */}
          <div className="relative">
            {/* شريط التسجيل - Walkie Talkie */}
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute -top-16 left-0 right-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl px-4 py-3 flex items-center justify-center gap-3 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  {/* مؤشر مستوى الصوت */}
                  <div className="flex items-center gap-0.5 h-6">
                    {[...Array(7)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-white rounded-full"
                        animate={{ 
                          height: audioLevel > i * 0.14 ? 8 + audioLevel * 16 : 6,
                        }}
                        transition={{ duration: 0.05 }}
                      />
                    ))}
                  </div>
                  <span className="text-white font-bold text-lg">🎤 تحدث...</span>
                  <span className="text-white/80 font-mono bg-white/20 px-2 py-1 rounded">
                    {formatDuration(recordingDuration)}
                  </span>
                </div>
              </motion.div>
            )}

            {/* شريط معالجة الصوت */}
            {isProcessingVoice && !isRecording && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -top-12 left-0 right-0 bg-gradient-to-r from-blue-500/10 to-green-500/10 border border-blue-500/30 rounded-xl px-4 py-2 flex items-center justify-center gap-3"
              >
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                <span className="text-sm text-blue-600 font-medium">🔄 جاري التحليل...</span>
              </motion.div>
            )}

            <div className="flex gap-2 items-stretch">
              {/* Voice Button - يفتح الووكي توكي الكبير - يظهر فقط إذا كانت ميزات الصوت مفعلة */}
              {voiceFeaturesEnabled && (
                <button
                  onClick={() => setShowWalkieTalkie(true)}
                  disabled={isTranscribing || ttsLoading || isProcessingVoice || isRecording}
                  className={`px-4 py-3 rounded-xl transition-all duration-150 border flex items-center justify-center flex-shrink-0 select-none cursor-pointer ${
                    isTranscribing || ttsLoading || isProcessingVoice
                      ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#01411C] to-[#065f41] text-white border-[#D4AF37] hover:scale-105 active:scale-110'
                  }`}
                  title="افتح الووكي توكي للتحدث 🎤"
                >
                  {isTranscribing || ttsLoading || isProcessingVoice ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>
              )}

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="سم طال عمرك.. كيف أخدمك؟"
                className="flex-1 min-w-0 bg-white text-[#01411C] placeholder-[#01411C]/50 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] border border-[#01411C]/30 shadow-sm"
                disabled={isTyping || aiLoading || isRecording || isProcessingVoice}
                dir="rtl"
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isTyping || aiLoading || isRecording || isProcessingVoice}
                className="px-4 py-2 bg-gradient-to-r from-[#01411C] to-[#065f41] text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 border border-[#D4AF37] flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2 text-[10px] text-[#01411C]/60">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>وساطه AI - متصل</span>
                {voiceFeaturesEnabled && isSpeaking && (
                  <span className="flex items-center gap-1 text-[#D4AF37]">
                    <Volume2 className="w-3 h-3" />
                    جاري التحدث...
                  </span>
                )}
              </div>
              {voiceFeaturesEnabled && (
                <div className="text-[10px] text-[#01411C]/40">
                  {autoSpeak ? '🔊 الرد الصوتي مفعّل' : '🔇 الرد الصوتي متوقف'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

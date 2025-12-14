import React, { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { X, Send, User, Sparkles, ChevronLeft, Calendar, Users, Building2, FileText, LayoutGrid, Tag, DollarSign, Phone, MessageCircle, MapPin, Clock, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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

export function AIChatPanel({ onClose }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: "مرحباً! أنا مساعدك الذكي في وساطة AI 🤖✨\n\nيمكنني مساعدتك في:\n• إدارة العملاء والكانبان\n• متابعة العروض والطلبات\n• جدولة المواعيد\n• تحليل الصفقات\n• التنقل السريع\n\nما الذي تحتاجه اليوم؟",
      timestamp: new Date(),
      actions: [
        { icon: '👥', text: 'عرض العملاء', action: 'navigate:crm', type: 'navigate' },
        { icon: '🏠', text: 'منصتي', action: 'navigate:platform', type: 'navigate' },
        { icon: '📅', text: 'التقويم', action: 'navigate:calendar', type: 'navigate' },
        { icon: '📊', text: 'التقارير', action: 'navigate:reports', type: 'navigate' }
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Handle action button clicks
  const handleActionClick = (action: ActionButton) => {
    const [type, target] = action.action.split(':');
    
    switch (type) {
      case 'navigate':
        navigateToPage(target);
        break;
      case 'call':
        window.open(`tel:${action.data?.phone}`, '_self');
        toast.success(`جاري الاتصال بـ ${action.data?.name}`);
        break;
      case 'whatsapp':
        window.open(`https://wa.me/966${(action.data?.phone as string)?.slice(1)}`, '_blank');
        toast.success(`جاري فتح واتساب للتواصل مع ${action.data?.name}`);
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
    }
  };

  const navigateToPage = (page: string) => {
    const pageMap: Record<string, string> = {
      'crm': 'customer-management-72',
      'platform': 'dashboard-main-252',
      'calendar': 'calendar',
      'reports': 'reports-analytics',
      'tasks': 'tasks',
      'digital-card': 'digital-card',
      'calculator': 'quick-calculator'
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
      'calculator': 'الحاسبة السريعة'
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

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || inputValue;
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = textToSend.toLowerCase();
    setInputValue("");
    setIsTyping(true);

    try {
      let aiResponse = "";
      let actions: ActionButton[] = [];

      // تحليل نوع الطلب والاستجابة بأزرار التفاعل
      if (userInput.includes('عملاء') || userInput.includes('كانبان') || userInput.includes('crm')) {
        aiResponse = `📊 **حالة العملاء في الكانبان:**\n\n`;
        kanbanColumns.forEach(col => {
          aiResponse += `• ${col.name}: ${col.count} عميل\n`;
        });
        aiResponse += `\n**آخر العملاء:**\n`;
        customers.slice(0, 3).forEach(c => {
          const tags = c.tags?.join(', ') || '';
          aiResponse += `• ${c.name} (${c.type === 'buyer' ? 'مشتري' : 'بائع'}) ${tags ? `[${tags}]` : ''}\n`;
        });

        actions = [
          { icon: '👥', text: 'فتح الكانبان', action: 'navigate:crm', type: 'navigate' },
          { icon: '📞', text: `اتصال بـ ${customers[0].name}`, action: 'call:customer', type: 'call', data: { phone: customers[0].phone, name: customers[0].name } },
          { icon: '💬', text: `واتساب ${customers[0].name}`, action: 'whatsapp:customer', type: 'whatsapp', data: { phone: customers[0].phone, name: customers[0].name } },
          { icon: '📅', text: 'حجز موعد', action: 'appointment:create', type: 'appointment', data: { customerId: customers[0].id, customerName: customers[0].name, customerPhone: customers[0].phone } }
        ];

      } else if (userInput.includes('عروض') || userInput.includes('عقارات') || userInput.includes('منصة')) {
        aiResponse = `🏠 **العروض المتاحة في المنصة:**\n\n`;
        offers.filter(o => o.status === 'available').forEach(o => {
          aiResponse += `• ${o.title}\n  💰 ${o.price.toLocaleString()} ريال | 📐 ${o.area} م²\n\n`;
        });

        actions = [
          { icon: '🏠', text: 'فتح منصتي', action: 'navigate:platform', type: 'navigate' },
          { icon: '📝', text: `تفاصيل ${offers[0].title.slice(0, 15)}...`, action: 'offer:details', type: 'action', data: { id: offers[0].id, title: offers[0].title } },
          { icon: '📤', text: 'مشاركة عرض', action: 'share:offer', type: 'action', data: { id: offers[0].id } },
          { icon: '➕', text: 'إضافة عرض جديد', action: 'navigate:platform', type: 'navigate' }
        ];

      } else if (userInput.includes('صفقات') || userInput.includes('صفقة') || userInput.includes('عمولة')) {
        aiResponse = `💼 **الصفقات الحالية:**\n\n`;
        deals.forEach(d => {
          const statusText = d.status === 'completed' ? '✅ مكتمل' : d.status === 'negotiation' ? '🔄 مفاوضة' : '📄 توثيق';
          aiResponse += `• ${d.customer} ← ${d.offer}\n  ${statusText} | 💰 ${d.value.toLocaleString()} ريال\n  💵 العمولة: ${d.commission.toLocaleString()} ريال\n\n`;
        });

        const totalCommission = deals.reduce((sum, d) => sum + d.commission, 0);
        aiResponse += `\n📈 **إجمالي العمولات:** ${totalCommission.toLocaleString()} ريال`;

        actions = [
          { icon: '📊', text: 'تقرير الصفقات', action: 'navigate:reports', type: 'navigate' },
          { icon: '👥', text: 'عرض العملاء', action: 'navigate:crm', type: 'navigate' }
        ];

      } else if (userInput.includes('طلبات') || userInput.includes('طلب')) {
        aiResponse = `📋 **طلبات العملاء:**\n\n`;
        requests.forEach(r => {
          const statusText = r.status === 'new' ? '🆕 جديد' : '🔄 نشط';
          const typeText = r.type === 'villa' ? 'فيلا' : r.type === 'apartment' ? 'شقة' : 'أرض';
          aiResponse += `• ${r.customer}\n  🏠 ${typeText} في ${r.city}\n  💰 الميزانية: ${r.budget}\n  ${statusText}\n\n`;
        });

        actions = [
          { icon: '📋', text: 'فتح الطلبات', action: 'navigate:platform', type: 'navigate' },
          { icon: '🔍', text: 'بحث عقارات مطابقة', action: 'search:matching', type: 'action' }
        ];

      } else if (userInput.includes('موعد') || userInput.includes('تقويم') || userInput.includes('مواعيد')) {
        aiResponse = `📅 **التقويم والمواعيد:**\n\n`;
        aiResponse += `• مواعيد اليوم: 3\n`;
        aiResponse += `• مواعيد الأسبوع: 12\n`;
        aiResponse += `• مواعيد معلقة: 2\n\n`;
        aiResponse += `**إنشاء موعد جديد:**\nاختر عميل من القائمة أو اكتب اسم العميل`;

        actions = [
          { icon: '📅', text: 'فتح التقويم', action: 'navigate:calendar', type: 'navigate' },
          { icon: '➕', text: `موعد مع ${customers[0].name}`, action: 'appointment:create', type: 'appointment', data: { customerId: customers[0].id, customerName: customers[0].name, customerPhone: customers[0].phone } },
          { icon: '➕', text: `موعد مع ${customers[1].name}`, action: 'appointment:create', type: 'appointment', data: { customerId: customers[1].id, customerName: customers[1].name, customerPhone: customers[1].phone } },
          { icon: '➕', text: `موعد مع ${customers[2].name}`, action: 'appointment:create', type: 'appointment', data: { customerId: customers[2].id, customerName: customers[2].name, customerPhone: customers[2].phone } }
        ];

      } else if (userInput.includes('تاقات') || userInput.includes('تاج') || userInput.includes('تصنيف')) {
        aiResponse = `🏷️ **التاقات والتصنيفات:**\n\n`;
        const allTags = customers.flatMap(c => c.tags || []);
        const uniqueTags = [...new Set(allTags)];
        uniqueTags.forEach(tag => {
          const count = customers.filter(c => c.tags?.includes(tag)).length;
          aiResponse += `• ${tag}: ${count} عميل\n`;
        });

        actions = [
          { icon: '👥', text: 'إدارة التاقات', action: 'navigate:crm', type: 'navigate' }
        ];

      } else if (userInput.includes('اتصال') || userInput.includes('اتصل') || userInput.includes('هاتف')) {
        aiResponse = `📞 **قائمة الاتصال السريع:**\n\n`;
        customers.slice(0, 5).forEach(c => {
          aiResponse += `• ${c.name}: ${c.phone}\n`;
        });

        actions = customers.slice(0, 4).map(c => ({
          icon: '📞',
          text: `اتصال ${c.name.split(' ')[0]}`,
          action: 'call:customer',
          type: 'call' as const,
          data: { phone: c.phone, name: c.name }
        }));

      } else if (userInput.includes('واتساب') || userInput.includes('واتس')) {
        aiResponse = `💬 **التواصل عبر واتساب:**\n\n`;
        customers.slice(0, 5).forEach(c => {
          aiResponse += `• ${c.name}\n`;
        });

        actions = customers.slice(0, 4).map(c => ({
          icon: '💬',
          text: `واتساب ${c.name.split(' ')[0]}`,
          action: 'whatsapp:customer',
          type: 'whatsapp' as const,
          data: { phone: c.phone, name: c.name }
        }));

      } else if (userInput.includes('حاسبة') || userInput.includes('حساب') || userInput.includes('تمويل')) {
        aiResponse = `🧮 **الحاسبة السريعة:**\n\nيمكنك استخدام الحاسبة لحساب:\n• الأقساط الشهرية\n• نسبة العمولة\n• تكاليف النقل\n• ضريبة القيمة المضافة`;

        actions = [
          { icon: '🧮', text: 'فتح الحاسبة', action: 'navigate:calculator', type: 'navigate' }
        ];

      } else if (userInput.includes('تقارير') || userInput.includes('تحليل') || userInput.includes('إحصائيات')) {
        aiResponse = `📊 **التقارير والتحليلات:**\n\n`;
        aiResponse += `• إجمالي العملاء: ${customers.length}\n`;
        aiResponse += `• العروض النشطة: ${offers.filter(o => o.status === 'available').length}\n`;
        aiResponse += `• الصفقات المكتملة: ${deals.filter(d => d.status === 'completed').length}\n`;
        aiResponse += `• إجمالي العمولات: ${deals.reduce((sum, d) => sum + d.commission, 0).toLocaleString()} ريال`;

        actions = [
          { icon: '📊', text: 'التقارير الكاملة', action: 'navigate:reports', type: 'navigate' },
          { icon: '📈', text: 'تحليل الأداء', action: 'navigate:reports', type: 'navigate' }
        ];

      } else {
        // رد عام مع أزرار التنقل
        aiResponse = `شكراً لسؤالك! 🤖\n\nأنا هنا لمساعدتك في:\n• إدارة العملاء والكانبان\n• متابعة العروض والطلبات\n• جدولة المواعيد\n• تحليل الصفقات\n\nاختر من الأزرار أدناه أو اكتب ما تحتاجه:`;

        actions = [
          { icon: '👥', text: 'العملاء', action: 'navigate:crm', type: 'navigate' },
          { icon: '🏠', text: 'منصتي', action: 'navigate:platform', type: 'navigate' },
          { icon: '📅', text: 'التقويم', action: 'navigate:calendar', type: 'navigate' },
          { icon: '📊', text: 'التقارير', action: 'navigate:reports', type: 'navigate' }
        ];
      }

      // Simulate typing delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const aiMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
        actions: actions.length > 0 ? actions : undefined
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: "عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error("حدث خطأ في معالجة الطلب");
    } finally {
      setIsTyping(false);
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

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl overflow-hidden h-full flex flex-col border-2 border-[#D4AF37]">
      {/* رأس المساعد */}
      <div className="p-4 bg-gradient-to-r from-[#01411C] to-[#065f41] border-b border-[#D4AF37]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-[#D4AF37] to-[#B8941F] rounded-full flex items-center justify-center text-xl">
                🤖
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse"></div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">المساعد الذكي</h3>
              <p className="text-[#D4AF37] text-xs flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                متصل - جاهز للمساعدة
              </p>
            </div>
          </div>
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
      
      <div className="flex flex-1 overflow-hidden">
        {/* الإجراءات السريعة - الجانب */}
        <div className="w-1/3 border-l border-white/10 p-3 overflow-y-auto bg-black/30">
          {/* فلترة الفئات */}
          <div className="flex flex-wrap gap-1 mb-3">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2 py-1 rounded-lg text-xs transition-colors ${
                  activeCategory === cat.id 
                    ? 'bg-[#01411C] text-white' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
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
                className="w-full flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-[#01411C]/50 transition-colors group text-right"
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-white text-xs flex-1 leading-tight">{item.text}</span>
                <ChevronLeft className="w-3 h-3 text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>

          {/* إحصائيات سريعة */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <h5 className="text-white text-xs font-bold mb-2">ملخص سريع</h5>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-[#D4AF37]">{customers.length}</div>
                <div className="text-[10px] text-gray-400">عميل</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-green-400">{offers.filter(o => o.status === 'available').length}</div>
                <div className="text-[10px] text-gray-400">عرض</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-blue-400">{deals.length}</div>
                <div className="text-[10px] text-gray-400">صفقة</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-purple-400">{requests.length}</div>
                <div className="text-[10px] text-gray-400">طلب</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* المحادثة */}
        <div className="flex-1 p-3 flex flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-3 scrollbar-thin scrollbar-thumb-gray-700">
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
                      className={`rounded-xl px-3 py-2 ${
                        message.role === "user"
                          ? "bg-[#01411C] text-white"
                          : "bg-gray-800 text-gray-100"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                    
                    {/* أزرار التفاعل */}
                    {message.actions && message.actions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {message.actions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleActionClick(action)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#01411C]/80 hover:bg-[#01411C] text-white text-xs transition-colors border border-[#D4AF37]/50"
                          >
                            <span>{action.icon}</span>
                            <span>{action.text}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="text-[10px] text-gray-500 mt-1 px-1">
                      {message.timestamp.toLocaleTimeString("ar-SA", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8941F] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#01411C]" />
                </div>
                <div className="bg-gray-800 rounded-xl px-3 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-2 h-2 bg-[#D4AF37] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* إدخال الرسالة */}
          <div className="relative">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="اكتب رسالتك..."
                className="flex-1 bg-gray-800 text-white placeholder-gray-400 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] border border-gray-700"
                disabled={isTyping}
                dir="rtl"
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isTyping}
                className="px-4 bg-gradient-to-r from-[#01411C] to-[#065f41] text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 border border-[#D4AF37]"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <button className="hover:text-[#D4AF37] transition-colors">🎤</button>
                <button className="hover:text-[#D4AF37] transition-colors">📎</button>
                <button className="hover:text-[#D4AF37] transition-colors">📷</button>
              </div>
              <div className="text-[10px] text-gray-500">
                Enter للإرسال
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIChatPanel;

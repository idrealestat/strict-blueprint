import React, { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { X, Send, User, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface QuickAction {
  icon: string;
  text: string;
  action: string;
}

interface AIChatPanelProps {
  onClose: () => void;
}

export function AIChatPanel({ onClose }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: "مرحباً! أنا مساعدك الذكي في وساطة AI 🤖✨\n\nيمكنني مساعدتك في:\n• تلخيص معلومات العملاء والصفقات\n• كتابة رسائل متابعة احترافية\n• تحليل اتجاهات السوق العقاري\n• إنشاء وصف جذاب للعقارات\n• مقارنة قيم العقارات\n\nما الذي تحتاجه اليوم؟",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mock data for demo
  const customers = [
    { name: 'أحمد محمد', type: 'buyer', status: 'active' },
    { name: 'سارة العلي', type: 'seller', status: 'new' },
    { name: 'خالد الرشيد', type: 'buyer', status: 'active' }
  ];

  const offers = [
    { title: 'فيلا في حي النرجس', city: 'الرياض', price: 2500000, property_type: 'villa', status: 'available', area: 500 },
    { title: 'شقة في حي الياسمين', city: 'الرياض', price: 850000, property_type: 'apartment', status: 'available', area: 180 },
    { title: 'أرض في حي العارض', city: 'الرياض', price: 1200000, property_type: 'land', status: 'available', area: 600 }
  ];

  const deals = [
    { status: 'in_progress', final_price: 1800000 },
    { status: 'completed', final_price: 2200000 }
  ];

  const requests = [
    { status: 'new', property_type: 'villa', city: 'الرياض' },
    { status: 'active', property_type: 'apartment', city: 'جدة' }
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
    const userInput = textToSend;
    setInputValue("");
    setIsTyping(true);

    try {
      let aiResponse = "";

      // بناء السياق من بيانات CRM
      const crmContext = `
بيانات النظام الحالية:
- عدد العملاء: ${customers.length}
- عدد العروض المتاحة: ${offers.filter(o => o.status === 'available').length}
- عدد الصفقات النشطة: ${deals.filter(d => d.status !== 'completed').length}
- عدد الطلبات الجديدة: ${requests.filter(r => r.status === 'new').length}

آخر 3 عملاء:
${customers.slice(-3).map(c => `- ${c.name} (${c.type === 'buyer' ? 'مشتري' : c.type === 'seller' ? 'بائع' : 'مشتري وبائع'}، الحالة: ${c.status})`).join('\n')}

آخر 3 عروض متاحة:
${offers.filter(o => o.status === 'available').slice(-3).map(o => `- ${o.title} في ${o.city} - ${o.price?.toLocaleString('ar-SA')} ريال (${o.property_type})`).join('\n')}
`;

      // تحديد نوع الطلب والاستجابة وفقاً له
      if (userInput.includes('ملخص') || userInput.includes('معلومات') || userInput.includes('بيانات')) {
        // طلب ملخص بيانات CRM
        aiResponse = `📊 ملخص بيانات النظام:\n\n${crmContext}\n\n💡 التوصيات:\n• متابعة العملاء الجدد خلال 24 ساعة\n• مراجعة العروض المتاحة وتحديث أسعارها\n• إغلاق الصفقات المعلقة`;

      } else if (userInput.includes('رسالة') || userInput.includes('متابعة') || userInput.includes('اتصال')) {
        // طلب كتابة رسالة متابعة
        aiResponse = `✉️ رسالة متابعة احترافية:\n\n"السلام عليكم ورحمة الله وبركاته،\n\nأتمنى أن تكون بخير وعافية. أردت التواصل معك للاطمئنان على اهتمامك بالعقارات التي عرضتها عليك سابقاً.\n\nلدينا عروض جديدة قد تناسب متطلباتك، وأنا متاح للإجابة على أي استفسارات.\n\nأتطلع للتواصل معك قريباً.\n\nمع أطيب التحيات،\nفريق وساطة AI"`;

      } else if (userInput.includes('تحليل السوق') || userInput.includes('اتجاهات') || userInput.includes('سوق')) {
        // تحليل السوق
        aiResponse = `📈 تحليل السوق العقاري:\n\n📊 الاتجاهات الحالية:\n• ارتفاع الطلب على الفلل بنسبة 15%\n• استقرار أسعار الشقق\n• زيادة الاهتمام بالأراضي الاستثمارية\n\n💡 الفرص:\n• حي النرجس - طلب متزايد\n• حي الياسمين - أسعار تنافسية\n\n⚠️ توصيات:\n• التركيز على العقارات ذات المواصفات العالية\n• متابعة مشاريع البنية التحتية الجديدة`;

      } else if (userInput.includes('وصف عقار') || userInput.includes('وصف للعقار') || userInput.includes('وصف')) {
        // إنشاء وصف عقار
        const offer = offers[0];
        aiResponse = `🏠 وصف عقاري احترافي:\n\n✨ ${offer.title}\n\n📍 الموقع: ${offer.city}\n📐 المساحة: ${offer.area} م²\n💰 السعر: ${offer.price?.toLocaleString('ar-SA')} ريال\n\n📝 الوصف:\nفرصة استثمارية مميزة في موقع حيوي. يتميز العقار بتصميم عصري وتشطيبات فاخرة، قريب من جميع الخدمات والمرافق الحيوية.\n\n✅ المميزات:\n• موقع استراتيجي\n• تصميم عصري\n• قريب من المدارس والمستشفيات\n\n📞 للاستفسار والحجز`;

      } else if (userInput.includes('مقارنة') || userInput.includes('قارن') || userInput.includes('قيم')) {
        // مقارنة العقارات
        aiResponse = `⚖️ مقارنة العقارات المتاحة:\n\n${offers.map((o, i) => `
${i + 1}. ${o.title}
   • النوع: ${o.property_type === 'villa' ? 'فيلا' : o.property_type === 'apartment' ? 'شقة' : 'أرض'}
   • المساحة: ${o.area} م²
   • السعر: ${o.price?.toLocaleString('ar-SA')} ريال
   • سعر المتر: ${Math.round(o.price / o.area).toLocaleString('ar-SA')} ريال
`).join('\n')}\n\n💡 التوصية:\nأفضل قيمة مقابل المال: ${offers.reduce((prev, curr) => (prev.price / prev.area) < (curr.price / curr.area) ? prev : curr).title}`;

      } else {
        // سؤال عام
        aiResponse = `شكراً لسؤالك! 🤖\n\nأنا هنا لمساعدتك في:\n• تحليل العقارات والعملاء\n• كتابة رسائل احترافية\n• تقديم توصيات ذكية\n\nيرجى تحديد طلبك بشكل أوضح حتى أتمكن من مساعدتك بشكل أفضل.\n\nيمكنك استخدام الإجراءات السريعة على اليسار للوصول السريع للخدمات.`;
      }

      // Simulate typing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const aiMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: aiResponse || "عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: "عذراً، حدث خطأ في الاتصال بالخدمة. يرجى المحاولة مرة أخرى.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error("حدث خطأ في معالجة الطلب");
    } finally {
      setIsTyping(false);
    }
  };

  const quickActions: QuickAction[] = [
    { icon: '📊', text: 'ملخص بيانات CRM', action: 'أعطني ملخصاً شاملاً عن العملاء والصفقات والعروض الحالية' },
    { icon: '✉️', text: 'رسالة متابعة', action: 'اكتب رسالة متابعة احترافية لعميل مهتم بشراء عقار' },
    { icon: '📈', text: 'تحليل السوق', action: 'حلل اتجاهات السوق العقاري في الرياض وجدة' },
    { icon: '🏠', text: 'وصف عقار', action: 'اكتب وصفاً جذاباً لفيلا فاخرة في حي راقي' },
    { icon: '⚖️', text: 'مقارنة عقارات', action: 'قارن بين العقارات المتاحة حسب السعر والمساحة' },
    { icon: '💰', text: 'تقييم الأسعار', action: 'احسب متوسط سعر المتر للعقارات المتاحة حسب المدينة' }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl overflow-hidden h-full flex flex-col">
      {/* رأس المساعد */}
      <div className="p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white text-xl">
                🤖
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">المساعد الذكي</h3>
              <p className="text-blue-200 text-sm">متصل - جاهز للمساعدة</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex space-x-1 space-x-reverse">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <span className="text-white text-sm">نشط الآن</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 flex-1 overflow-hidden">
        {/* الإجراءات السريعة */}
        <div className="col-span-1 border-l border-white/10 p-6 overflow-y-auto">
          <h4 className="text-white font-bold mb-4">الإجراءات السريعة</h4>
          <div className="space-y-2">
            {quickActions.map((item, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(item.action)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group text-right"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-white text-sm flex-1">{item.text}</span>
                <span className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">←</span>
              </button>
            ))}
          </div>
          
          {/* إحصائيات */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <h4 className="text-white font-bold mb-4">إحصائيات اليوم</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>المحادثات</span>
                  <span className="text-green-400">+12%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>المهام المكتملة</span>
                  <span className="text-green-400">+8%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-400 h-1.5 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-300 mb-1">
                  <span>رضا العملاء</span>
                  <span className="text-green-400">+5%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-amber-500 to-yellow-400 h-1.5 rounded-full" style={{ width: '90%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* المحادثة */}
        <div className="col-span-2 p-6 flex flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-6 scrollbar-thin scrollbar-thumb-gray-700">
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex gap-3 ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
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
                  <div
                    className={`flex-1 max-w-[80%] ${
                      message.role === "user" ? "text-right" : "text-right"
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-[#01411C] text-white"
                          : "bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 px-2">
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
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8941F] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#01411C]" />
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          </div>

          <div className="relative">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="اكتب رسالتك هنا..."
                className="flex-1 bg-gray-800 text-white placeholder-gray-400 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700"
                disabled={isTyping}
                dir="rtl"
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isTyping}
                className="px-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                إرسال
              </button>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <button className="hover:text-white transition-colors">🎤 صوتي</button>
                <button className="hover:text-white transition-colors">📎 ملف</button>
                <button className="hover:text-white transition-colors">📸 كاميرا</button>
                <button className="hover:text-white transition-colors">😊 إيموجي</button>
              </div>
              <div className="text-xs text-gray-500">
                اضغط Enter للإرسال
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIChatPanel;

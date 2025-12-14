/**
 * SmartAssistant.tsx
 * المساعد الذكي - محادثة ذكية مع إجراءات سريعة
 */

import { useState } from 'react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'assistant';
  time: string;
}

interface QuickAction {
  icon: string;
  text: string;
}

const SmartAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'مرحباً! أنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟', sender: 'assistant', time: '10:00' },
    { id: 2, text: 'أريد معرفة كيفية إضافة عميل جديد', sender: 'user', time: '10:01' },
    { id: 3, text: 'يمكنك إضافة عميل جديد من خلال الضغط على زر "إضافة عميل" في صفحة إدارة العملاء', sender: 'assistant', time: '10:01' },
  ]);
  const [input, setInput] = useState('');
  
  const quickActions: QuickAction[] = [
    { icon: '📊', text: 'تقرير الأداء' },
    { icon: '👥', text: 'إضافة عميل' },
    { icon: '💰', text: 'حاسبة الأرباح' },
    { icon: '📅', text: 'جدولة موعد' },
    { icon: '📈', text: 'تحليل السوق' },
    { icon: '🔄', text: 'مزامنة البيانات' }
  ];
  
  const sendMessage = () => {
    if (!input.trim()) return;
    
    const newMessage: Message = {
      id: messages.length + 1,
      text: input,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, newMessage]);
    setInput('');
    
    // رد المساعد بعد ثانية
    setTimeout(() => {
      const responses = [
        'تم فهم طلبك جيداً. هل تريد مزيداً من التفاصيل؟',
        'يمكنني مساعدتك في ذلك. هل تريد خطوات مفصلة؟',
        'هذا سؤال ممتاز! لدي الإجابة المناسبة لك.',
        'لقد قمت بمعالجة طلبك. هل هناك شيء آخر؟',
        'أعتقد أن هذا هو الحل الأمثل لمشكلتك.'
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const assistantMessage: Message = {
        id: messages.length + 2,
        text: randomResponse,
        sender: 'assistant',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    }, 1000);
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl overflow-hidden">
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
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <span className="text-white text-sm">نشط الآن</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3">
        {/* الإجراءات السريعة */}
        <div className="col-span-1 border-l border-white/10 p-6">
          <h4 className="text-white font-bold mb-4">الإجراءات السريعة</h4>
          <div className="space-y-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group text-right"
              >
                <span className="text-xl">{action.icon}</span>
                <span className="text-white text-sm flex-1">{action.text}</span>
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
        <div className="col-span-1 md:col-span-2 p-6">
          <div className="h-80 overflow-y-auto space-y-4 mb-6 scrollbar-thin scrollbar-thumb-gray-700">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md rounded-2xl p-4 ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-bl-none'
                      : 'bg-gray-800 text-gray-100 rounded-br-none'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <div className={`text-xs mt-2 ${message.sender === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                    {message.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* إدخال الرسالة */}
          <div className="relative">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="اكتب رسالتك هنا..."
                className="flex-1 bg-gray-800 text-white placeholder-gray-400 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700"
                dir="rtl"
              />
              <button
                onClick={sendMessage}
                className="px-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105"
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
};

export default SmartAssistant;

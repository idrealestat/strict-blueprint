/**
 * CalendarTabs.tsx
 * التقويم - 9 تبويبات زمنية
 */

import { useState } from 'react';

interface Tab {
  id: string;
  title: string;
  count: number;
}

interface Event {
  id: number;
  time: string;
  title: string;
  type: 'meeting' | 'presentation' | 'deadline' | 'call' | 'training' | 'interview' | 'lunch' | 'review';
}

const CalendarTabs = () => {
  const [activeTab, setActiveTab] = useState('today');
  
  const tabs: Tab[] = [
    { id: 'today', title: 'اليوم', count: 5 },
    { id: 'tomorrow', title: 'غداً', count: 3 },
    { id: 'week', title: 'هذا الأسبوع', count: 12 },
    { id: 'month', title: 'هذا الشهر', count: 28 },
    { id: 'quarter', title: 'هذا الربع', count: 45 },
    { id: 'year', title: 'هذه السنة', count: 120 },
    { id: 'upcoming', title: 'القادم', count: 18 },
    { id: 'overdue', title: 'متأخر', count: 3 },
    { id: 'completed', title: 'مكتمل', count: 67 }
  ];
  
  const events: Record<string, Event[]> = {
    today: [
      { id: 1, time: '09:00', title: 'اجتماع فريق المبيعات', type: 'meeting' },
      { id: 2, time: '11:30', title: 'عرض تقديمي للعميل', type: 'presentation' },
      { id: 3, time: '14:00', title: 'تسليم تقرير الربع', type: 'deadline' },
      { id: 4, time: '16:45', title: 'مكالمة مع الشريك', type: 'call' },
      { id: 5, time: '18:00', title: 'تدريب الموظفين', type: 'training' }
    ],
    tomorrow: [
      { id: 1, time: '10:00', title: 'مقابلة توظيف', type: 'interview' },
      { id: 2, time: '13:00', title: 'غداء عمل', type: 'lunch' },
      { id: 3, time: '15:30', title: 'مراجعة العقود', type: 'review' }
    ]
  };

  const getEventTypeStyle = (type: string) => {
    const styles: Record<string, string> = {
      meeting: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      presentation: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      deadline: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      call: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      training: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      interview: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      lunch: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      review: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400'
    };
    return styles[type] || 'bg-gray-100 text-gray-800';
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      meeting: 'اجتماع',
      presentation: 'عرض',
      deadline: 'موعد نهائي',
      call: 'مكالمة',
      training: 'تدريب',
      interview: 'مقابلة',
      lunch: 'غداء',
      review: 'مراجعة'
    };
    return labels[type] || type;
  };

  const currentDate = new Date();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const eventDays = [5, 8, 12, 15, 20, 25, 28];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* رأس التقويم */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">التقويم</h3>
            <p className="text-gray-600 dark:text-gray-300">إدارة مواعيدك وأحداثك</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-medium hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors">
              + حدث جديد
            </button>
            <button className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <span className="text-xl">⋮</span>
            </button>
          </div>
        </div>
        
        {/* التبويبات */}
        <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-lg transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{tab.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === tab.id
                    ? 'bg-white/20'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}>
                  {tab.count}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* محتوى التبويب */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* قائمة الأحداث */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 dark:text-white mb-4">أحداث {tabs.find(t => t.id === activeTab)?.title}</h4>
            {(events[activeTab] || []).map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-14 flex-shrink-0">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-800 dark:text-white">{event.time}</div>
                    <div className="text-xs text-gray-500">ص/م</div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800 dark:text-white">{event.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getEventTypeStyle(event.type)}`}>
                      {getEventTypeLabel(event.type)}
                    </span>
                    <span className="text-xs text-gray-500">مدة: ساعتان</span>
                  </div>
                </div>
                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                  <span className="text-lg">⋮</span>
                </button>
              </div>
            ))}
            {(!events[activeTab] || events[activeTab].length === 0) && (
              <div className="text-center py-8 text-gray-500">
                لا توجد أحداث في هذا القسم
              </div>
            )}
          </div>
          
          {/* التقويم المصغر */}
          <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                ‹
              </button>
              <h5 className="font-bold text-gray-800 dark:text-white">ديسمبر 2024</h5>
              <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                ›
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['أح', 'إث', 'ث', 'أر', 'خ', 'ج', 'س'].map((day) => (
                <div key={day} className="text-center text-sm text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const isToday = day === currentDate.getDate();
                const hasEvent = eventDays.includes(day);
                
                return (
                  <button
                    key={day}
                    className={`relative h-10 rounded-lg flex items-center justify-center text-sm ${
                      isToday
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                        : hasEvent
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {day}
                    {hasEvent && !isToday && (
                      <span className="absolute w-1 h-1 bg-blue-500 rounded-full bottom-1"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarTabs;

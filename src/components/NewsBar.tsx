/**
 * NewsBar.tsx
 * شريط الأخبار العاجلة - أخبار حقيقية من مصادر متعددة
 * تحديث تلقائي كل 5 دقائق
 */

import { useState, useEffect } from 'react';
import { useRealTimeNews } from '@/hooks/useRealTimeNews';
import { RefreshCw, Newspaper, ExternalLink } from 'lucide-react';

const NewsBar = () => {
  const { news, isLoading, lastUpdate, refresh } = useRealTimeNews(5 * 60 * 1000);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // تنسيق وقت آخر تحديث
  const formatLastUpdate = () => {
    return lastUpdate.toLocaleTimeString('ar-SA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white p-3 rounded-lg shadow-lg border-2 border-amber-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded"></div>
          <Newspaper className="w-5 h-5 text-white" />
          <h3 className="font-bold text-lg text-white">الأخبار العاجلة</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/80">
            آخر تحديث: {formatLastUpdate()}
          </span>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            title="تحديث الأخبار"
          >
            <RefreshCw className={`w-4 h-4 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-white/70">مباشر</span>
            <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse shadow-lg shadow-amber-500/50"></div>
          </div>
        </div>
      </div>

      {/* News Ticker */}
      <div className="overflow-hidden h-8 relative">
        {/* Gradient overlays for smooth fade effect */}
        <div className="absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-emerald-900 to-transparent z-10"></div>
        <div className="absolute left-0 top-0 h-full w-12 bg-gradient-to-r from-emerald-900 to-transparent z-10"></div>
        
        <div className="flex animate-marquee whitespace-nowrap hover:[animation-play-state:paused]">
          {news.map((item) => (
            <span 
              key={item.id} 
              className="inline-flex items-center mx-6 cursor-pointer group"
              onClick={() => item.url && window.open(item.url, '_blank')}
            >
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                item.trending 
                  ? 'bg-gradient-to-r from-amber-500/30 to-amber-600/30 text-white border border-amber-500/50' 
                  : 'bg-emerald-700/50 text-white border border-emerald-600/50'
              }`}>
                {item.category}
              </span>
              <span className="mx-3 text-white group-hover:text-amber-300 transition-colors">
                {item.title}
              </span>
              <span className="text-amber-400 text-sm">• {item.time}</span>
              {item.url && (
                <ExternalLink className="w-3 h-3 text-amber-400 mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </span>
          ))}
          {/* Duplicate for seamless loop */}
          {news.map((item) => (
            <span 
              key={`dup-${item.id}`} 
              className="inline-flex items-center mx-6 cursor-pointer group"
              onClick={() => item.url && window.open(item.url, '_blank')}
            >
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                item.trending 
                  ? 'bg-gradient-to-r from-amber-500/30 to-amber-600/30 text-white border border-amber-500/50' 
                  : 'bg-emerald-700/50 text-white border border-emerald-600/50'
              }`}>
                {item.category}
              </span>
              <span className="mx-3 text-white group-hover:text-amber-300 transition-colors">
                {item.title}
              </span>
              <span className="text-amber-400 text-sm">• {item.time}</span>
              {item.url && (
                <ExternalLink className="w-3 h-3 text-amber-400 mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-emerald-900/80 flex items-center justify-center rounded-lg">
          <div className="flex items-center gap-2 text-white">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>جاري تحميل الأخبار...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsBar;

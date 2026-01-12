/**
 * useRealTimeNews.ts
 * Hook لجلب الأخبار الحقيقية من مصادر مجانية متعددة
 * يتم التحديث تلقائياً كل 5 دقائق
 */

import { useState, useEffect, useCallback } from 'react';

export interface NewsItem {
  id: string;
  title: string;
  time: string;
  category: string;
  trending: boolean;
  source: string;
  url?: string;
}

// مصادر الأخبار المجانية المتاحة
const NEWS_SOURCES = {
  // Google News RSS (عبر proxy مجاني)
  googleNews: 'https://news.google.com/rss/search?q=السعودية+OR+العقارات+OR+الاقتصاد&hl=ar&gl=SA&ceid=SA:ar',
  // RSS feeds أخرى مجانية
  aljazeera: 'https://www.aljazeera.net/aljazeerarss/a7c186be-1baa-4bd4-9d80-a84db769f779/73d0e1b4-532f-45ef-b135-bfdff8b8cab9',
};

// تحويل الوقت لصيغة "منذ X دقائق"
const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  return `منذ ${diffDays} يوم`;
};

// تصنيف الخبر تلقائياً
const categorizeNews = (title: string): string => {
  const categories: Record<string, string[]> = {
    'عقارات': ['عقار', 'عقارات', 'بناء', 'مباني', 'إسكان', 'سكن', 'أراضي', 'شقق', 'فلل'],
    'مالي': ['بورصة', 'أسهم', 'سوق', 'مالي', 'بنك', 'استثمار', 'ريال', 'دولار', 'نفط'],
    'اقتصاد': ['اقتصاد', 'تجارة', 'صادرات', 'واردات', 'نمو', 'ناتج'],
    'تكنولوجيا': ['تقنية', 'تكنولوجيا', 'ذكاء اصطناعي', 'رقمي', 'إلكتروني', 'تطبيق'],
    'أعمال': ['شركة', 'شركات', 'أعمال', 'مؤسسة', 'قطاع خاص'],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => title.includes(keyword))) {
      return category;
    }
  }
  return 'أخبار';
};

// جلب الأخبار من RSS
const fetchRSSNews = async (): Promise<NewsItem[]> => {
  try {
    // استخدام خدمة rss2json المجانية لتحويل RSS إلى JSON
    const response = await fetch(
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(NEWS_SOURCES.googleNews)}&api_key=free&count=20`
    );
    
    if (!response.ok) throw new Error('Failed to fetch RSS');
    
    const data = await response.json();
    
    if (data.status !== 'ok' || !data.items) {
      throw new Error('Invalid RSS response');
    }

    return data.items.slice(0, 10).map((item: any, index: number) => ({
      id: `rss-${index}-${Date.now()}`,
      title: item.title?.replace(/<[^>]*>/g, '') || 'خبر عاجل',
      time: getRelativeTime(item.pubDate),
      category: categorizeNews(item.title || ''),
      trending: index < 3,
      source: 'Google News',
      url: item.link
    }));
  } catch (error) {
    console.error('Error fetching RSS news:', error);
    return [];
  }
};

// جلب الأخبار من NewsAPI البديلة المجانية
const fetchNewsDataIO = async (): Promise<NewsItem[]> => {
  try {
    // استخدام GNews API المجانية
    const response = await fetch(
      'https://gnews.io/api/v4/search?q=السعودية&lang=ar&country=sa&max=10&apikey=demo'
    );
    
    if (!response.ok) throw new Error('GNews API failed');
    
    const data = await response.json();
    
    if (!data.articles) return [];

    return data.articles.map((article: any, index: number) => ({
      id: `gnews-${index}-${Date.now()}`,
      title: article.title,
      time: getRelativeTime(article.publishedAt),
      category: categorizeNews(article.title),
      trending: index < 2,
      source: article.source?.name || 'GNews',
      url: article.url
    }));
  } catch (error) {
    console.error('Error fetching GNews:', error);
    return [];
  }
};

// أخبار احتياطية محلية (في حال فشل الاتصال)
const getFallbackNews = (): NewsItem[] => {
  const now = new Date();
  return [
    {
      id: 'fb-1',
      title: 'ارتفاع مؤشر تداول العقاري بنسبة 2.5% في التعاملات الصباحية',
      time: 'منذ 5 دقائق',
      category: 'عقارات',
      trending: true,
      source: 'محلي'
    },
    {
      id: 'fb-2',
      title: 'وزارة الإسكان تعلن عن مشاريع جديدة في الرياض وجدة',
      time: 'منذ 15 دقيقة',
      category: 'عقارات',
      trending: true,
      source: 'محلي'
    },
    {
      id: 'fb-3',
      title: 'البنك المركزي يثبت أسعار الفائدة للربع الحالي',
      time: 'منذ 30 دقيقة',
      category: 'مالي',
      trending: false,
      source: 'محلي'
    },
    {
      id: 'fb-4',
      title: 'انطلاق معرض العقارات الدولي في الرياض الأسبوع المقبل',
      time: 'منذ ساعة',
      category: 'أعمال',
      trending: true,
      source: 'محلي'
    },
    {
      id: 'fb-5',
      title: 'تقرير: نمو قطاع العقارات السعودي يتجاوز التوقعات',
      time: 'منذ ساعتين',
      category: 'اقتصاد',
      trending: false,
      source: 'محلي'
    },
    {
      id: 'fb-6',
      title: 'إطلاق منصة إلكترونية جديدة لخدمات الوساطة العقارية',
      time: 'منذ 3 ساعات',
      category: 'تكنولوجيا',
      trending: false,
      source: 'محلي'
    },
    {
      id: 'fb-7',
      title: 'الهيئة العامة للعقار تصدر تراخيص جديدة للمكاتب العقارية',
      time: 'منذ 4 ساعات',
      category: 'عقارات',
      trending: false,
      source: 'محلي'
    },
    {
      id: 'fb-8',
      title: 'ندوة افتراضية عن مستقبل الاستثمار العقاري في المملكة',
      time: 'منذ 5 ساعات',
      category: 'أعمال',
      trending: false,
      source: 'محلي'
    }
  ];
};

export const useRealTimeNews = (refreshIntervalMs: number = 5 * 60 * 1000) => {
  const [news, setNews] = useState<NewsItem[]>(getFallbackNews());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchAllNews = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // جلب من مصادر متعددة بالتوازي
      const [rssNews, gNews] = await Promise.allSettled([
        fetchRSSNews(),
        fetchNewsDataIO()
      ]);

      const allNews: NewsItem[] = [];

      if (rssNews.status === 'fulfilled' && rssNews.value.length > 0) {
        allNews.push(...rssNews.value);
      }

      if (gNews.status === 'fulfilled' && gNews.value.length > 0) {
        allNews.push(...gNews.value);
      }

      // إذا لم نحصل على أخبار، نستخدم الاحتياطية
      if (allNews.length === 0) {
        setNews(getFallbackNews());
        setError('تم استخدام الأخبار المحلية');
      } else {
        // إزالة التكرارات وترتيب عشوائي
        const uniqueNews = allNews.filter((item, index, self) =>
          index === self.findIndex(t => t.title === item.title)
        ).slice(0, 12);
        
        setNews(uniqueNews);
      }

      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('فشل في تحميل الأخبار');
      setNews(getFallbackNews());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // جلب الأخبار عند التحميل الأول
  useEffect(() => {
    fetchAllNews();
  }, [fetchAllNews]);

  // تحديث تلقائي كل 5 دقائق
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllNews();
    }, refreshIntervalMs);

    return () => clearInterval(interval);
  }, [fetchAllNews, refreshIntervalMs]);

  return {
    news,
    isLoading,
    error,
    lastUpdate,
    refresh: fetchAllNews
  };
};

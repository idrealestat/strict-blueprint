/**
 * PlatformPublishingSystem.tsx
 * نظام النشر على المنصات الكامل - 3 تبويبات
 */

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowRight, Link, FileText, BarChart3 } from 'lucide-react';
import PlatformConnectionsTab from './PlatformConnectionsTab';
import PlatformPublishForm from './PlatformPublishForm';
import PublishingAnalyticsTab from './PublishingAnalyticsTab';
import { ExternalPlatform, AVAILABLE_PLATFORMS, PublishingAnalytics, PlatformPublishedOffer } from './types';

interface PlatformPublishingSystemProps {
  onClose: () => void;
}

export default function PlatformPublishingSystem({ onClose }: PlatformPublishingSystemProps) {
  const [activeTab, setActiveTab] = useState<'connections' | 'publish' | 'analytics'>('publish');
  const [platforms, setPlatforms] = useState<ExternalPlatform[]>(AVAILABLE_PLATFORMS);
  const [analytics, setAnalytics] = useState<PublishingAnalytics>({
    totalPublished: 0,
    activeListings: 0,
    totalViews: 0,
    totalClicks: 0,
    totalLeads: 0,
    platformStats: [],
    topPerformingOffers: [],
    publishingTrend: [],
  });

  // Load saved platform connections
  useEffect(() => {
    const saved = localStorage.getItem('platform_connections');
    if (saved) {
      try {
        const connections = JSON.parse(saved);
        setPlatforms(prev => prev.map(p => ({
          ...p,
          status: connections[p.id] || 'disconnected'
        })));
      } catch {}
    }

    // Load analytics
    const offers = JSON.parse(localStorage.getItem('platform_published_offers') || '[]');
    if (offers.length > 0) {
      setAnalytics({
        totalPublished: offers.length,
        activeListings: offers.length,
        totalViews: Math.floor(Math.random() * 5000),
        totalClicks: Math.floor(Math.random() * 500),
        totalLeads: Math.floor(Math.random() * 50),
        platformStats: [],
        topPerformingOffers: offers.slice(0, 3).map((o: any) => ({
          offerId: o.id,
          title: o.title,
          views: Math.floor(Math.random() * 500),
          clicks: Math.floor(Math.random() * 50),
          leads: Math.floor(Math.random() * 10),
        })),
        publishingTrend: [],
      });
    }
  }, []);

  const handlePlatformConnect = async (platformId: string, credentials?: any): Promise<boolean> => {
    // Simulate connection
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setPlatforms(prev => prev.map(p => 
      p.id === platformId ? { ...p, status: 'connected' as const } : p
    ));

    // Save to localStorage
    const connections = JSON.parse(localStorage.getItem('platform_connections') || '{}');
    connections[platformId] = 'connected';
    localStorage.setItem('platform_connections', JSON.stringify(connections));

    return true;
  };

  const handlePlatformDisconnect = async (platformId: string): Promise<boolean> => {
    setPlatforms(prev => prev.map(p => 
      p.id === platformId ? { ...p, status: 'disconnected' as const } : p
    ));

    const connections = JSON.parse(localStorage.getItem('platform_connections') || '{}');
    delete connections[platformId];
    localStorage.setItem('platform_connections', JSON.stringify(connections));

    return true;
  };

  const handlePublishComplete = (offer: PlatformPublishedOffer) => {
    setAnalytics(prev => ({
      ...prev,
      totalPublished: prev.totalPublished + 1,
      activeListings: prev.activeListings + 1,
    }));
  };

  return (
    // شاشة كاملة على الجوال + منع أي تجاوز أفقي/عمودي خارج الحاوية
    <div
      className="fixed inset-0 z-50 w-full h-[100dvh] flex flex-col bg-[hsl(var(--background))] overflow-hidden"
      dir="rtl"
    >
      {/* Header */}
      <div className="p-3 border-b flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-[hsl(var(--foreground))] truncate">النشر على المنصات</h1>
          <p className="text-xs text-muted-foreground truncate">انشر إعلاناتك على منصات متعددة</p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as any)}
        className="flex-1 min-h-0 flex flex-col overflow-hidden"
      >
        {/* TabsList في shadcn افتراضياً inline-flex، لذلك نجبره ليصبح Grid بعرض كامل على الجوال */}
        <TabsList className="!grid w-full grid-cols-3 mt-3 mx-2 sm:mx-3 shrink-0 max-w-[calc(100%-16px)] sm:max-w-[calc(100%-24px)] overflow-x-hidden">
          <TabsTrigger value="publish" className="gap-1 text-xs px-2">
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">نشر إعلان</span>
            <span className="sm:hidden">نشر</span>
          </TabsTrigger>
          <TabsTrigger value="connections" className="gap-1 text-xs px-2">
            <Link className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ربط المنصات</span>
            <span className="sm:hidden">ربط</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1 text-xs px-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">التحليلات</span>
            <span className="sm:hidden">إحصائيات</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 min-h-0 overflow-hidden">
          <TabsContent value="connections" className="h-full m-0 overflow-hidden">
            <PlatformConnectionsTab 
              platforms={platforms}
              onPlatformConnect={handlePlatformConnect}
              onPlatformDisconnect={handlePlatformDisconnect}
            />
          </TabsContent>

          <TabsContent value="publish" className="h-full m-0 overflow-hidden">
            <PlatformPublishForm 
              connectedPlatforms={platforms}
              onPublishComplete={handlePublishComplete}
              onCancel={() => setActiveTab('connections')}
            />
          </TabsContent>

          <TabsContent value="analytics" className="h-full m-0 overflow-hidden">
            <PublishingAnalyticsTab analytics={analytics} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export { PlatformPublishingSystem };

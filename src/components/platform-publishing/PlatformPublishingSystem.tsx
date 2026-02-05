/**
 * PlatformPublishingSystem.tsx
 * نظام النشر على المنصات الكامل - 3 تبويبات
 */

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
 import { ArrowRight, Link, FileText, BarChart3, Megaphone, MessageCircle, Video } from 'lucide-react';
import PlatformConnectionsTab from './PlatformConnectionsTab';
import PlatformPublishForm from './PlatformPublishForm';
import PublishingAnalyticsTab from './PublishingAnalyticsTab';
 import PaidCampaignsTab from './PaidCampaignsTab';
 import MessagingCampaignsTab from './MessagingCampaignsTab';
 import ContentEditorTab from './ContentEditorTab';
 import AdvancedAnalyticsTab from './AdvancedAnalyticsTab';
import { ExternalPlatform, AVAILABLE_PLATFORMS, PublishingAnalytics, PlatformPublishedOffer } from './types';

interface PlatformPublishingSystemProps {
  onClose: () => void;
}

export default function PlatformPublishingSystem({ onClose }: PlatformPublishingSystemProps) {
   const [activeTab, setActiveTab] = useState<'publish' | 'connections' | 'content' | 'campaigns' | 'messaging' | 'analytics'>('publish');
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
    // منع التمرير/التجاوز الأفقي على الجوال داخل شاشة النشر على المنصات فقط
    // (بعض المتصفحات تُظهر انزياح/عكس في RTL عند وجود overflow أفقي)
    const prevHtmlOverflowX = document.documentElement.style.overflowX;
    const prevBodyOverflowX = document.body.style.overflowX;
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';

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

    return () => {
      document.documentElement.style.overflowX = prevHtmlOverflowX;
      document.body.style.overflowX = prevBodyOverflowX;
    };
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
      className="fixed inset-0 z-50 h-[100dvh] w-[100dvw] max-w-[100dvw] flex flex-col bg-[hsl(var(--background))] overflow-hidden overflow-x-clip [contain:layout_paint]"
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
        className="flex-1 min-h-0 flex flex-col overflow-hidden overflow-x-clip w-full max-w-full"
      >
         {/* التبويبات - 6 تبويبات */}
         <div className="shrink-0 mt-3 px-2 overflow-x-auto">
           <TabsList className="inline-flex w-auto min-w-full gap-1">
             <TabsTrigger value="publish" className="gap-1 text-xs px-2 whitespace-nowrap">
               <FileText className="w-3.5 h-3.5" />
               نشر إعلان
             </TabsTrigger>
             <TabsTrigger value="connections" className="gap-1 text-xs px-2 whitespace-nowrap">
               <Link className="w-3.5 h-3.5" />
               ربط المنصات
             </TabsTrigger>
             <TabsTrigger value="content" className="gap-1 text-xs px-2 whitespace-nowrap">
               <Video className="w-3.5 h-3.5" />
               المحتوى
             </TabsTrigger>
             <TabsTrigger value="campaigns" className="gap-1 text-xs px-2 whitespace-nowrap">
               <Megaphone className="w-3.5 h-3.5" />
               الحملات
             </TabsTrigger>
             <TabsTrigger value="messaging" className="gap-1 text-xs px-2 whitespace-nowrap">
               <MessageCircle className="w-3.5 h-3.5" />
               المراسلة
             </TabsTrigger>
             <TabsTrigger value="analytics" className="gap-1 text-xs px-2 whitespace-nowrap">
               <BarChart3 className="w-3.5 h-3.5" />
               التحليلات
             </TabsTrigger>
           </TabsList>
         </div>

        <div className="flex-1 min-h-0 overflow-hidden overflow-x-clip w-full max-w-full">
          <TabsContent value="publish" className="h-full m-0 overflow-hidden overflow-x-clip w-full max-w-full">
            <PlatformPublishForm 
              connectedPlatforms={platforms}
              onPublishComplete={handlePublishComplete}
              onCancel={() => setActiveTab('connections')}
            />
          </TabsContent>

           <TabsContent value="connections" className="h-full m-0 overflow-hidden overflow-x-clip w-full max-w-full">
             <PlatformConnectionsTab 
               platforms={platforms}
               onPlatformConnect={handlePlatformConnect}
               onPlatformDisconnect={handlePlatformDisconnect}
             />
           </TabsContent>
 
           <TabsContent value="content" className="h-full m-0 overflow-hidden overflow-x-clip w-full max-w-full">
             <ContentEditorTab />
           </TabsContent>
 
           <TabsContent value="campaigns" className="h-full m-0 overflow-hidden overflow-x-clip w-full max-w-full">
             <PaidCampaignsTab />
           </TabsContent>
 
           <TabsContent value="messaging" className="h-full m-0 overflow-hidden overflow-x-clip w-full max-w-full">
             <MessagingCampaignsTab />
           </TabsContent>
 
          <TabsContent value="analytics" className="h-full m-0 overflow-hidden overflow-x-clip w-full max-w-full">
             <AdvancedAnalyticsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export { PlatformPublishingSystem };

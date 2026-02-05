 /**
  * SocialMediaPublishingSystem.tsx
  * نظام النشر على التواصل الاجتماعي - 6 تبويبات
  * 
  * التبويبات:
  * 1. ربط المنصات (7 منصات اجتماعية)
  * 2. محرر المحتوى (فيديو + نص + هاشتاقات)
  * 3. الحملات الإعلانية (5 منصات مدفوعة)
  * 4. الحملات المباشرة (واتساب + تيليجرام)
  * 5. التحليلات (للعرض فقط)
  */
 
 import { useState, useEffect } from 'react';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Button } from '@/components/ui/button';
 import { ArrowRight, Link2, Video, Megaphone, MessageCircle, BarChart3 } from 'lucide-react';
 import { SocialPlatform, SOCIAL_PLATFORMS } from './types';
 import SocialPlatformConnectionsTab from './SocialPlatformConnectionsTab';
 import SocialContentEditorTab from './SocialContentEditorTab';
 import SocialPaidCampaignsTab from './SocialPaidCampaignsTab';
 import SocialMessagingCampaignsTab from './SocialMessagingCampaignsTab';
 import SocialAnalyticsTab from './SocialAnalyticsTab';
 
 interface SocialMediaPublishingSystemProps {
   onClose: () => void;
 }
 
 export default function SocialMediaPublishingSystem({ onClose }: SocialMediaPublishingSystemProps) {
   const [activeTab, setActiveTab] = useState<'connections' | 'content' | 'campaigns' | 'messaging' | 'analytics'>('connections');
   const [platforms, setPlatforms] = useState<SocialPlatform[]>(SOCIAL_PLATFORMS);
 
   // تحميل حالة الربط المحفوظة
   useEffect(() => {
     // منع التمرير الأفقي
     const prevHtmlOverflowX = document.documentElement.style.overflowX;
     const prevBodyOverflowX = document.body.style.overflowX;
     document.documentElement.style.overflowX = 'hidden';
     document.body.style.overflowX = 'hidden';
 
     const saved = localStorage.getItem('social_platform_connections');
     if (saved) {
       try {
         const connections = JSON.parse(saved);
         setPlatforms(prev => prev.map(p => ({
           ...p,
           status: connections[p.id] || 'disconnected'
         })));
       } catch {}
     }
 
     return () => {
       document.documentElement.style.overflowX = prevHtmlOverflowX;
       document.body.style.overflowX = prevBodyOverflowX;
     };
   }, []);
 
   // ربط منصة
   const handlePlatformConnect = async (platformId: string): Promise<boolean> => {
     await new Promise(resolve => setTimeout(resolve, 1500));
     
     setPlatforms(prev => prev.map(p => 
       p.id === platformId ? { ...p, status: 'connected' as const } : p
     ));
 
     // حفظ في localStorage
     const connections = JSON.parse(localStorage.getItem('social_platform_connections') || '{}');
     connections[platformId] = 'connected';
     localStorage.setItem('social_platform_connections', JSON.stringify(connections));
 
     return true;
   };
 
   // فك ربط منصة
   const handlePlatformDisconnect = async (platformId: string): Promise<boolean> => {
     setPlatforms(prev => prev.map(p => 
       p.id === platformId ? { ...p, status: 'disconnected' as const } : p
     ));
 
     const connections = JSON.parse(localStorage.getItem('social_platform_connections') || '{}');
     delete connections[platformId];
     localStorage.setItem('social_platform_connections', JSON.stringify(connections));
 
     return true;
   };
 
   return (
     <div
       className="fixed inset-0 z-50 h-[100dvh] w-[100dvw] max-w-[100dvw] flex flex-col bg-[hsl(var(--background))] overflow-hidden overflow-x-clip [contain:layout_paint]"
       dir="rtl"
     >
       {/* Header */}
       <div className="p-3 border-b flex items-center gap-2 shrink-0 bg-gradient-to-r from-[#01411C] to-[#065f41]">
         <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 text-white hover:bg-white/20">
           <ArrowRight className="w-5 h-5" />
         </Button>
         <div className="min-w-0">
           <h1 className="text-lg font-bold text-white truncate">النشر على التواصل الاجتماعي</h1>
           <p className="text-xs text-white/70 truncate">انشر محتواك على منصات التواصل</p>
         </div>
       </div>
 
       {/* Main Tabs - 5 تبويبات */}
       <Tabs
         value={activeTab}
         onValueChange={(v) => setActiveTab(v as any)}
         className="flex-1 min-h-0 flex flex-col overflow-hidden overflow-x-clip w-full max-w-full"
       >
         <div className="shrink-0 mt-3 px-2 overflow-x-auto">
           <TabsList className="inline-flex w-auto min-w-full gap-1">
             <TabsTrigger value="connections" className="gap-1 text-xs px-2 whitespace-nowrap">
               <Link2 className="w-3.5 h-3.5" />
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
           <TabsContent value="connections" className="h-full m-0 overflow-hidden overflow-x-clip w-full max-w-full">
             <SocialPlatformConnectionsTab 
               platforms={platforms}
               onConnect={handlePlatformConnect}
               onDisconnect={handlePlatformDisconnect}
             />
           </TabsContent>
 
           <TabsContent value="content" className="h-full m-0 overflow-hidden overflow-x-clip w-full max-w-full">
             <SocialContentEditorTab />
           </TabsContent>
 
           <TabsContent value="campaigns" className="h-full m-0 overflow-hidden overflow-x-clip w-full max-w-full">
             <SocialPaidCampaignsTab />
           </TabsContent>
 
           <TabsContent value="messaging" className="h-full m-0 overflow-hidden overflow-x-clip w-full max-w-full">
             <SocialMessagingCampaignsTab />
           </TabsContent>
 
           <TabsContent value="analytics" className="h-full m-0 overflow-hidden overflow-x-clip w-full max-w-full">
             <SocialAnalyticsTab />
           </TabsContent>
         </div>
       </Tabs>
     </div>
   );
 }
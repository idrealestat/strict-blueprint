 /**
  * SocialPaidCampaignsTab.tsx
  * تبويب الحملات الإعلانية المدفوعة
  * Google Ads, Instagram Ads, Facebook Ads, TikTok Ads, LinkedIn Ads
  */
 
 import { useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { toast } from 'sonner';
 import { 
   Megaphone, Link2, Unlink, Eye, DollarSign, 
   TrendingUp, AlertCircle, ExternalLink, Check, Clock
 } from 'lucide-react';
 import { PaidAdPlatform, PAID_AD_PLATFORMS } from './types';
 
 export default function SocialPaidCampaignsTab() {
   const [platforms, setPlatforms] = useState<PaidAdPlatform[]>(PAID_AD_PLATFORMS);
   const [connecting, setConnecting] = useState<string | null>(null);
 
   // ربط حساب إعلاني
   const handleConnect = async (platformId: string) => {
     setConnecting(platformId);
     // محاكاة الربط
     await new Promise(resolve => setTimeout(resolve, 1500));
     
     setPlatforms(prev => prev.map(p => 
       p.id === platformId ? { ...p, status: 'connected' as const } : p
     ));
     setConnecting(null);
     toast.success('تم ربط الحساب الإعلاني بنجاح');
   };
 
   // فك ربط حساب
   const handleDisconnect = (platformId: string) => {
     setPlatforms(prev => prev.map(p => 
       p.id === platformId ? { ...p, status: 'disconnected' as const } : p
     ));
     toast.success('تم فك ربط الحساب');
   };
 
   const connectedCount = platforms.filter(p => p.status === 'connected').length;
 
   return (
     <ScrollArea className="h-full">
       <div className="p-4 space-y-4">
         {/* العنوان */}
         <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 text-white">
           <div className="flex items-center gap-3">
             <Megaphone className="w-8 h-8" />
             <div>
               <h2 className="text-xl font-bold">الحملات الإعلانية</h2>
               <p className="text-orange-100 text-sm">إدارة حملاتك المدفوعة على المنصات</p>
             </div>
           </div>
         </div>
 
         {/* تنبيه مهم */}
         <Card className="border-amber-300 bg-amber-50">
           <CardContent className="p-4">
             <div className="flex items-start gap-3">
               <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
               <div>
                 <h4 className="font-bold text-amber-800">ملاحظة مهمة</h4>
                 <p className="text-sm text-amber-700">
                   Wasata AI يعمل كواجهة لإعداد ومراقبة الحملات فقط. 
                   جميع عمليات الدفع والميزانية تتم مباشرة من حسابك الإعلاني على كل منصة.
                 </p>
               </div>
             </div>
           </CardContent>
         </Card>
 
         {/* ملخص */}
         <div className="grid grid-cols-2 gap-3">
           <Card className="border-2 border-green-200 bg-green-50">
             <CardContent className="p-4 text-center">
               <div className="text-2xl font-bold text-green-700">{connectedCount}</div>
               <div className="text-sm text-green-600">حسابات مرتبطة</div>
             </CardContent>
           </Card>
           <Card className="border-2 border-blue-200 bg-blue-50">
             <CardContent className="p-4 text-center">
               <div className="text-2xl font-bold text-blue-700">{platforms.length}</div>
               <div className="text-sm text-blue-600">منصات متاحة</div>
             </CardContent>
           </Card>
         </div>
 
         {/* قائمة المنصات الإعلانية */}
         <div className="space-y-3">
           <h3 className="font-bold text-gray-800">المنصات الإعلانية</h3>
           
           {platforms.map((platform) => (
             <Card 
               key={platform.id}
               className={`transition-all ${
                 platform.status === 'connected' 
                   ? 'border-green-300 bg-green-50/50' 
                   : 'border-gray-200'
               }`}
             >
               <CardContent className="p-4">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div 
                       className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                       style={{ backgroundColor: `${platform.color}20` }}
                     >
                       {platform.icon}
                     </div>
                     <div>
                       <h4 className="font-bold text-gray-900">{platform.name}</h4>
                       <p className="text-sm text-gray-500">{platform.nameEn}</p>
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-2">
                     {platform.status === 'connected' ? (
                       <>
                         <Badge className="bg-green-500">
                           <Check className="w-3 h-3 ml-1" />
                           مرتبط
                         </Badge>
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={() => handleDisconnect(platform.id)}
                           className="text-red-600 border-red-300"
                         >
                           <Unlink className="w-4 h-4" />
                         </Button>
                       </>
                     ) : (
                       <Button
                         size="sm"
                         onClick={() => handleConnect(platform.id)}
                         disabled={connecting === platform.id}
                         className="bg-[#01411C] hover:bg-[#016630]"
                       >
                         {connecting === platform.id ? (
                           <Clock className="w-4 h-4 ml-1 animate-spin" />
                         ) : (
                           <Link2 className="w-4 h-4 ml-1" />
                         )}
                         ربط الحساب
                       </Button>
                     )}
                   </div>
                 </div>
                 
                 {/* إحصائيات للحسابات المرتبطة */}
                 {platform.status === 'connected' && (
                   <div className="mt-4 pt-4 border-t border-gray-200">
                     <div className="grid grid-cols-3 gap-3 text-center">
                       <div>
                         <div className="text-lg font-bold text-gray-700">0</div>
                         <div className="text-xs text-gray-500">حملات نشطة</div>
                       </div>
                       <div>
                         <div className="text-lg font-bold text-gray-700">0 ر.س</div>
                         <div className="text-xs text-gray-500">الإنفاق</div>
                       </div>
                       <div>
                         <div className="text-lg font-bold text-gray-700">0</div>
                         <div className="text-xs text-gray-500">النقرات</div>
                       </div>
                     </div>
                     <Button
                       variant="outline"
                       size="sm"
                       className="w-full mt-3"
                     >
                       <Eye className="w-4 h-4 ml-2" />
                       عرض الحملات
                     </Button>
                   </div>
                 )}
               </CardContent>
             </Card>
           ))}
         </div>
 
         {/* ملاحظة: لا يوجد نشر عضوي هنا */}
         <Card className="border-gray-300 bg-gray-50">
           <CardContent className="p-4 text-center">
             <p className="text-sm text-gray-600">
               ⚠️ هذا التبويب مخصص للحملات المدفوعة فقط. 
               للنشر العضوي، استخدم تبويب "ربط المنصات".
             </p>
           </CardContent>
         </Card>
       </div>
     </ScrollArea>
   );
 }
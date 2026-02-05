 /**
  * PaidCampaignsTab.tsx
  * تبويب الحملات الإعلانية المدفوعة
  * المنصات: Google Ads, Instagram Ads, Facebook Ads, TikTok Ads, LinkedIn Ads
  */
 
 import { useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Separator } from '@/components/ui/separator';
 import {
   Megaphone,
   Link,
   ExternalLink,
   Settings,
   Check,
   X,
   Loader2,
   AlertCircle,
   Info,
   Eye,
   MousePointer,
   DollarSign,
   Target,
   Clock,
   RefreshCw,
 } from 'lucide-react';
 import { toast } from 'sonner';
 import { motion, AnimatePresence } from 'framer-motion';
 
 // منصات الإعلانات المدفوعة
 interface AdPlatform {
   id: string;
   name: string;
   nameAr: string;
   logo: string;
   color: string;
   status: 'connected' | 'disconnected';
   accountId?: string;
 }
 
 const AD_PLATFORMS: AdPlatform[] = [
   { id: 'google', name: 'Google Ads', nameAr: 'إعلانات جوجل', logo: '🔍', color: '#4285F4', status: 'disconnected' },
   { id: 'instagram', name: 'Instagram Ads', nameAr: 'إعلانات انستجرام', logo: '📸', color: '#E1306C', status: 'disconnected' },
   { id: 'facebook', name: 'Facebook Ads', nameAr: 'إعلانات فيسبوك', logo: '📘', color: '#1877F2', status: 'disconnected' },
   { id: 'tiktok', name: 'TikTok Ads', nameAr: 'إعلانات تيك توك', logo: '🎵', color: '#000000', status: 'disconnected' },
   { id: 'linkedin', name: 'LinkedIn Ads', nameAr: 'إعلانات لينكد إن', logo: '💼', color: '#0A66C2', status: 'disconnected' },
 ];
 
 // حملة إعلانية
 interface AdCampaign {
   id: string;
   name: string;
   platform: string;
   status: 'active' | 'paused' | 'draft' | 'ended';
   budget?: string;
   startDate?: string;
   endDate?: string;
   impressions?: number;
   clicks?: number;
   leads?: number;
   createdAt: string;
 }
 
 export default function PaidCampaignsTab() {
   const [platforms, setPlatforms] = useState<AdPlatform[]>(AD_PLATFORMS);
   const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
   const [showCreateForm, setShowCreateForm] = useState(false);
   const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
   const [selectedPlatform, setSelectedPlatform] = useState<string>('');
   const [campaignName, setCampaignName] = useState('');
   const [isCreating, setIsCreating] = useState(false);
 
   // ربط حساب إعلاني (يوجه للمنصة الخارجية)
   const handleConnectPlatform = async (platformId: string) => {
     setConnectingPlatform(platformId);
     
     // محاكاة عملية الربط - في الواقع سيتم التوجيه لـ OAuth
     await new Promise(resolve => setTimeout(resolve, 2000));
     
     setPlatforms(prev => prev.map(p => 
       p.id === platformId ? { ...p, status: 'connected', accountId: `${platformId}_acc_${Date.now()}` } : p
     ));
     
     toast.success('تم ربط الحساب الإعلاني بنجاح!');
     setConnectingPlatform(null);
   };
 
   // فصل حساب
   const handleDisconnectPlatform = (platformId: string) => {
     setPlatforms(prev => prev.map(p => 
       p.id === platformId ? { ...p, status: 'disconnected', accountId: undefined } : p
     ));
     toast.success('تم فصل الحساب');
   };
 
   // إنشاء حملة جديدة
   const handleCreateCampaign = async () => {
     if (!selectedPlatform || !campaignName.trim()) {
       toast.error('الرجاء تعبئة جميع الحقول المطلوبة');
       return;
     }
 
     const platform = platforms.find(p => p.id === selectedPlatform);
     if (!platform || platform.status !== 'connected') {
       toast.error('الرجاء ربط حساب المنصة أولاً');
       return;
     }
 
     setIsCreating(true);
     await new Promise(resolve => setTimeout(resolve, 1500));
 
     const newCampaign: AdCampaign = {
       id: `campaign_${Date.now()}`,
       name: campaignName,
       platform: selectedPlatform,
       status: 'draft',
       createdAt: new Date().toISOString(),
     };
 
     setCampaigns(prev => [newCampaign, ...prev]);
     setCampaignName('');
     setSelectedPlatform('');
     setShowCreateForm(false);
     setIsCreating(false);
 
     toast.success('تم إنشاء الحملة بنجاح! أكمل الإعدادات من لوحة تحكم المنصة');
   };
 
   const connectedPlatforms = platforms.filter(p => p.status === 'connected');
 
   const getCampaignStatusBadge = (status: AdCampaign['status']) => {
     switch (status) {
       case 'active':
         return <Badge className="bg-green-100 text-green-700">نشطة</Badge>;
       case 'paused':
         return <Badge className="bg-yellow-100 text-yellow-700">متوقفة</Badge>;
       case 'draft':
         return <Badge className="bg-gray-100 text-gray-700">مسودة</Badge>;
       case 'ended':
         return <Badge className="bg-red-100 text-red-700">منتهية</Badge>;
     }
   };
 
   return (
     <ScrollArea className="h-full">
       <div className="p-4 space-y-4" dir="rtl">
         {/* Header */}
         <div className="flex items-center justify-between">
           <div>
             <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">الحملات الإعلانية</h2>
             <p className="text-sm text-muted-foreground">إدارة حملاتك على منصات الإعلانات المدفوعة</p>
           </div>
           <Badge variant="outline" className="border-[hsl(var(--gold))] text-[hsl(var(--gold))]">
             <Megaphone className="w-3 h-3 ml-1" />
             Paid Ads
           </Badge>
         </div>
 
         {/* تنبيه مهم */}
         <Alert className="bg-amber-50 border-amber-200">
           <AlertCircle className="w-4 h-4 text-amber-600" />
           <AlertTitle className="text-amber-800">ملاحظة مهمة</AlertTitle>
           <AlertDescription className="text-amber-700 text-sm">
             Wasata AI يعمل كواجهة إعداد ومراقبة فقط. الدفع والميزانية تتم من حسابك الشخصي على كل منصة.
           </AlertDescription>
         </Alert>
 
         {/* ربط المنصات الإعلانية */}
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-base flex items-center gap-2">
               <Link className="w-5 h-5 text-[hsl(var(--gold))]" />
               ربط الحسابات الإعلانية
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-3">
             {platforms.map((platform) => (
               <motion.div
                 key={platform.id}
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="flex items-center justify-between p-3 rounded-lg border"
                 style={{ borderColor: platform.status === 'connected' ? platform.color : undefined }}
               >
                 <div className="flex items-center gap-3">
                   <div 
                     className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                     style={{ backgroundColor: `${platform.color}15` }}
                   >
                     {platform.logo}
                   </div>
                   <div>
                     <p className="font-medium">{platform.nameAr}</p>
                     <p className="text-xs text-muted-foreground">{platform.name}</p>
                   </div>
                 </div>
                 
                 {platform.status === 'connected' ? (
                   <div className="flex items-center gap-2">
                     <Badge className="bg-green-100 text-green-700">
                       <Check className="w-3 h-3 ml-1" />
                       متصل
                     </Badge>
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => handleDisconnectPlatform(platform.id)}
                     >
                       <X className="w-4 h-4" />
                     </Button>
                   </div>
                 ) : (
                   <Button
                     size="sm"
                     style={{ backgroundColor: platform.color }}
                     className="text-white"
                     onClick={() => handleConnectPlatform(platform.id)}
                     disabled={connectingPlatform === platform.id}
                   >
                     {connectingPlatform === platform.id ? (
                       <Loader2 className="w-4 h-4 animate-spin" />
                     ) : (
                       <>
                         <Link className="w-4 h-4 ml-1" />
                         ربط
                       </>
                     )}
                   </Button>
                 )}
               </motion.div>
             ))}
           </CardContent>
         </Card>
 
         {/* إنشاء حملة جديدة */}
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-base flex items-center gap-2">
               <Megaphone className="w-5 h-5 text-[hsl(var(--gold))]" />
               إنشاء حملة جديدة
             </CardTitle>
           </CardHeader>
           <CardContent>
             {connectedPlatforms.length === 0 ? (
               <div className="text-center py-6 text-muted-foreground">
                 <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                 <p>يجب ربط حساب إعلاني واحد على الأقل</p>
               </div>
             ) : showCreateForm ? (
               <div className="space-y-4">
                 <div>
                   <Label>اختر المنصة</Label>
                   <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                     <SelectTrigger>
                       <SelectValue placeholder="اختر منصة الإعلان" />
                     </SelectTrigger>
                     <SelectContent>
                       {connectedPlatforms.map(p => (
                         <SelectItem key={p.id} value={p.id}>
                           {p.logo} {p.nameAr}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
 
                 <div>
                   <Label>اسم الحملة</Label>
                   <Input
                     placeholder="مثال: حملة شقق الرياض"
                     value={campaignName}
                     onChange={e => setCampaignName(e.target.value)}
                   />
                 </div>
 
                 <Alert className="bg-blue-50 border-blue-200">
                   <Info className="w-4 h-4 text-blue-600" />
                   <AlertDescription className="text-blue-700 text-sm">
                     بعد إنشاء الحملة، ستحتاج لتعيين الميزانية والاستهداف من لوحة تحكم المنصة الإعلانية
                   </AlertDescription>
                 </Alert>
 
                 <div className="flex gap-2 justify-end">
                   <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                     إلغاء
                   </Button>
                   <Button
                     onClick={handleCreateCampaign}
                     disabled={isCreating || !selectedPlatform || !campaignName.trim()}
                     className="bg-[hsl(var(--gold))] text-[hsl(var(--primary))]"
                   >
                     {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إنشاء الحملة'}
                   </Button>
                 </div>
               </div>
             ) : (
               <Button
                 className="w-full"
                 variant="outline"
                 onClick={() => setShowCreateForm(true)}
               >
                 <Megaphone className="w-4 h-4 ml-2" />
                 إنشاء حملة جديدة
               </Button>
             )}
           </CardContent>
         </Card>
 
         {/* الحملات الحالية */}
         {campaigns.length > 0 && (
           <Card>
             <CardHeader className="pb-2">
               <CardTitle className="text-base flex items-center gap-2">
                 <Target className="w-5 h-5 text-[hsl(var(--gold))]" />
                 حملاتي ({campaigns.length})
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-3">
               {campaigns.map(campaign => {
                 const platform = platforms.find(p => p.id === campaign.platform);
                 return (
                   <motion.div
                     key={campaign.id}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="p-3 rounded-lg border bg-gray-50"
                   >
                     <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-2">
                         <span className="text-lg">{platform?.logo}</span>
                         <span className="font-medium">{campaign.name}</span>
                       </div>
                       {getCampaignStatusBadge(campaign.status)}
                     </div>
                     
                     {campaign.impressions !== undefined && (
                       <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-center">
                         <div className="bg-white p-2 rounded">
                           <Eye className="w-3 h-3 mx-auto text-blue-500" />
                           <p className="font-bold">{campaign.impressions}</p>
                           <p className="text-muted-foreground">مشاهدة</p>
                         </div>
                         <div className="bg-white p-2 rounded">
                           <MousePointer className="w-3 h-3 mx-auto text-green-500" />
                           <p className="font-bold">{campaign.clicks}</p>
                           <p className="text-muted-foreground">نقرة</p>
                         </div>
                         <div className="bg-white p-2 rounded">
                           <DollarSign className="w-3 h-3 mx-auto text-amber-500" />
                           <p className="font-bold">{campaign.leads}</p>
                           <p className="text-muted-foreground">تحويل</p>
                         </div>
                       </div>
                     )}
 
                     <Button
                       variant="outline"
                       size="sm"
                       className="w-full mt-2"
                       onClick={() => toast.info('سيتم فتح لوحة تحكم المنصة')}
                     >
                       <ExternalLink className="w-3 h-3 ml-1" />
                       إدارة من {platform?.nameAr}
                     </Button>
                   </motion.div>
                 );
               })}
             </CardContent>
           </Card>
         )}
 
         {/* ممنوعات */}
         <Alert className="bg-red-50 border-red-200">
           <X className="w-4 h-4 text-red-600" />
           <AlertTitle className="text-red-800">ممنوع في هذا التبويب</AlertTitle>
           <AlertDescription className="text-red-700 text-sm">
             <ul className="list-disc list-inside mt-1 space-y-1">
               <li>أي نشر عضوي (مجاني)</li>
               <li>تعيين ميزانية افتراضية</li>
               <li>أي خصم أو رصيد إعلاني</li>
             </ul>
           </AlertDescription>
         </Alert>
       </div>
     </ScrollArea>
   );
 }
 /**
  * MessagingCampaignsTab.tsx
  * تبويب الحملات المباشرة - واتساب وتيليجرام
  */
 
 import { useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Checkbox } from '@/components/ui/checkbox';
 import {
   MessageCircle,
   Send,
   Link,
   Image,
   Users,
   Clock,
   Loader2,
   Check,
   AlertCircle,
   ExternalLink,
   Copy,
   Phone,
   Plus,
 } from 'lucide-react';
 import { toast } from 'sonner';
 import { motion } from 'framer-motion';
 
 // أنواع الحملات
 type CampaignType = 'manual_link' | 'cloud_api';
 
 interface MessagingCampaign {
   id: string;
   type: 'whatsapp' | 'telegram';
   name: string;
   message: string;
   link?: string;
   imageUrl?: string;
   targetAudience?: string;
   status: 'draft' | 'sent' | 'scheduled';
   sentCount?: number;
   createdAt: string;
 }
 
 export default function MessagingCampaignsTab() {
   const [activeTab, setActiveTab] = useState<'whatsapp' | 'telegram'>('whatsapp');
   const [campaigns, setCampaigns] = useState<MessagingCampaign[]>([]);
   const [showCreateForm, setShowCreateForm] = useState(false);
   
   // حقول النموذج
   const [campaignType, setCampaignType] = useState<CampaignType>('manual_link');
   const [campaignName, setCampaignName] = useState('');
   const [message, setMessage] = useState('');
   const [link, setLink] = useState('');
   const [imageUrl, setImageUrl] = useState('');
   const [isCreating, setIsCreating] = useState(false);
 
   // إنشاء رابط واتساب
   const generateWhatsAppLink = (phone: string, text: string) => {
     const encodedText = encodeURIComponent(text);
     return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodedText}`;
   };
 
   // إنشاء حملة
   const handleCreateCampaign = async () => {
     if (!campaignName.trim() || !message.trim()) {
       toast.error('الرجاء تعبئة اسم الحملة والرسالة');
       return;
     }
 
     setIsCreating(true);
     await new Promise(resolve => setTimeout(resolve, 1000));
 
     const newCampaign: MessagingCampaign = {
       id: `msg_${Date.now()}`,
       type: activeTab,
       name: campaignName,
       message,
       link,
       imageUrl,
       status: 'draft',
       createdAt: new Date().toISOString(),
     };
 
     setCampaigns(prev => [newCampaign, ...prev]);
     resetForm();
     setIsCreating(false);
     toast.success('تم إنشاء الحملة بنجاح!');
   };
 
   const resetForm = () => {
     setCampaignName('');
     setMessage('');
     setLink('');
     setImageUrl('');
     setShowCreateForm(false);
   };
 
   // نسخ رابط الحملة
   const copyLink = (text: string) => {
     navigator.clipboard.writeText(text);
     toast.success('تم نسخ الرابط!');
   };
 
   const whatsappCampaigns = campaigns.filter(c => c.type === 'whatsapp');
   const telegramCampaigns = campaigns.filter(c => c.type === 'telegram');
 
   return (
     <ScrollArea className="h-full">
       <div className="p-4 space-y-4" dir="rtl">
         {/* Header */}
         <div className="flex items-center justify-between">
           <div>
             <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">الحملات المباشرة</h2>
             <p className="text-sm text-muted-foreground">واتساب وتيليجرام</p>
           </div>
           <Badge variant="outline" className="border-green-500 text-green-600">
             <MessageCircle className="w-3 h-3 ml-1" />
             Messaging
           </Badge>
         </div>
 
         {/* التبويبات الفرعية */}
         <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
           <TabsList className="grid w-full grid-cols-2">
             <TabsTrigger value="whatsapp" className="gap-1">
               <MessageCircle className="w-4 h-4 text-green-500" />
               واتساب
             </TabsTrigger>
             <TabsTrigger value="telegram" className="gap-1">
               <Send className="w-4 h-4 text-blue-500" />
               تيليجرام
             </TabsTrigger>
           </TabsList>
 
           {/* واتساب */}
           <TabsContent value="whatsapp" className="space-y-4 mt-4">
             {/* خيارات الحملة */}
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-base flex items-center gap-2 text-green-600">
                   <MessageCircle className="w-5 h-5" />
                   حملات واتساب
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-3">
                 {/* نوع الحملة */}
                 <div className="grid grid-cols-2 gap-2">
                   <Button
                     variant={campaignType === 'manual_link' ? 'default' : 'outline'}
                     className={campaignType === 'manual_link' ? 'bg-green-600' : ''}
                     onClick={() => setCampaignType('manual_link')}
                   >
                     <Link className="w-4 h-4 ml-1" />
                     روابط يدوية
                   </Button>
                   <Button
                     variant={campaignType === 'cloud_api' ? 'default' : 'outline'}
                     className={campaignType === 'cloud_api' ? 'bg-green-600' : ''}
                     onClick={() => setCampaignType('cloud_api')}
                   >
                     <Phone className="w-4 h-4 ml-1" />
                     Cloud API
                   </Button>
                 </div>
 
                 {campaignType === 'cloud_api' && (
                   <Alert className="bg-amber-50 border-amber-200">
                     <AlertCircle className="w-4 h-4 text-amber-600" />
                     <AlertDescription className="text-amber-700 text-sm">
                       يتطلب WhatsApp Cloud API ربط حساب أعمال. 
                       <a href="https://business.whatsapp.com" target="_blank" className="underline mr-1">
                         تعلم المزيد
                       </a>
                     </AlertDescription>
                   </Alert>
                 )}
               </CardContent>
             </Card>
 
             {/* إنشاء حملة */}
             {showCreateForm ? (
               <Card className="border-green-200">
                 <CardHeader className="pb-2">
                   <CardTitle className="text-base">حملة واتساب جديدة</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-3">
                   <div>
                     <Label>اسم الحملة *</Label>
                     <Input
                       placeholder="مثال: عروض شقق الرياض"
                       value={campaignName}
                       onChange={e => setCampaignName(e.target.value)}
                     />
                   </div>
 
                   <div>
                     <Label>نص الرسالة *</Label>
                     <Textarea
                       placeholder="اكتب رسالتك هنا..."
                       value={message}
                       onChange={e => setMessage(e.target.value)}
                       rows={4}
                     />
                   </div>
 
                   <div>
                     <Label>رابط العرض (اختياري)</Label>
                     <Input
                       placeholder="https://..."
                       value={link}
                       onChange={e => setLink(e.target.value)}
                       dir="ltr"
                     />
                   </div>
 
                   <div>
                     <Label>رابط الصورة (اختياري)</Label>
                     <Input
                       placeholder="https://..."
                       value={imageUrl}
                       onChange={e => setImageUrl(e.target.value)}
                       dir="ltr"
                     />
                   </div>
 
                   <div className="flex gap-2 justify-end pt-2">
                     <Button variant="outline" onClick={resetForm}>إلغاء</Button>
                     <Button
                       onClick={handleCreateCampaign}
                       disabled={isCreating}
                       className="bg-green-600 hover:bg-green-700"
                     >
                       {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إنشاء الحملة'}
                     </Button>
                   </div>
                 </CardContent>
               </Card>
             ) : (
               <Button
                 className="w-full bg-green-600 hover:bg-green-700"
                 onClick={() => setShowCreateForm(true)}
               >
                 <Plus className="w-4 h-4 ml-1" />
                 إنشاء حملة واتساب
               </Button>
             )}
 
             {/* الحملات الحالية */}
             {whatsappCampaigns.length > 0 && (
               <Card>
                 <CardHeader className="pb-2">
                   <CardTitle className="text-base">حملاتي ({whatsappCampaigns.length})</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-2">
                   {whatsappCampaigns.map(campaign => (
                     <motion.div
                       key={campaign.id}
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       className="p-3 rounded-lg border bg-green-50 border-green-200"
                     >
                       <div className="flex items-center justify-between">
                         <span className="font-medium">{campaign.name}</span>
                         <Badge className="bg-green-100 text-green-700">{campaign.status}</Badge>
                       </div>
                       <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{campaign.message}</p>
                       {campaign.link && (
                         <Button
                           variant="ghost"
                           size="sm"
                           className="mt-2"
                           onClick={() => copyLink(generateWhatsAppLink('966500000000', campaign.message + '\n' + campaign.link))}
                         >
                           <Copy className="w-3 h-3 ml-1" />
                           نسخ رابط wa.me
                         </Button>
                       )}
                     </motion.div>
                   ))}
                 </CardContent>
               </Card>
             )}
           </TabsContent>
 
           {/* تيليجرام */}
           <TabsContent value="telegram" className="space-y-4 mt-4">
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-base flex items-center gap-2 text-blue-600">
                   <Send className="w-5 h-5" />
                   حملات تيليجرام
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-3">
                 <div className="grid grid-cols-2 gap-2">
                   <Button variant="outline">
                     <Link className="w-4 h-4 ml-1" />
                     روابط
                   </Button>
                   <Button variant="outline">
                     <Send className="w-4 h-4 ml-1" />
                     نشر العروض
                   </Button>
                 </div>
 
                 <Alert className="bg-blue-50 border-blue-200">
                   <AlertCircle className="w-4 h-4 text-blue-600" />
                   <AlertDescription className="text-blue-700 text-sm">
                     لا يتم تفعيل بوتات تلقائية بدون موافقة المستخدم الصريحة
                   </AlertDescription>
                 </Alert>
               </CardContent>
             </Card>
 
             {/* إنشاء حملة تيليجرام */}
             <Button
               className="w-full bg-blue-600 hover:bg-blue-700"
               onClick={() => {
                 setActiveTab('telegram');
                 setShowCreateForm(true);
               }}
             >
               <Plus className="w-4 h-4 ml-1" />
               إنشاء حملة تيليجرام
             </Button>
 
             {/* الحملات */}
             {telegramCampaigns.length > 0 && (
               <Card>
                 <CardHeader className="pb-2">
                   <CardTitle className="text-base">حملاتي ({telegramCampaigns.length})</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-2">
                   {telegramCampaigns.map(campaign => (
                     <motion.div
                       key={campaign.id}
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       className="p-3 rounded-lg border bg-blue-50 border-blue-200"
                     >
                       <div className="flex items-center justify-between">
                         <span className="font-medium">{campaign.name}</span>
                         <Badge className="bg-blue-100 text-blue-700">{campaign.status}</Badge>
                       </div>
                       <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{campaign.message}</p>
                     </motion.div>
                   ))}
                 </CardContent>
               </Card>
             )}
           </TabsContent>
         </Tabs>
       </div>
     </ScrollArea>
   );
 }
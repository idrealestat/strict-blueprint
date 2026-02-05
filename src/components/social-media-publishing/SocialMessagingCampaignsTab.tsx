 /**
  * SocialMessagingCampaignsTab.tsx
  * تبويب الحملات المباشرة (واتساب + تيليجرام)
  */
 
 import { useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Textarea } from '@/components/ui/textarea';
 import { Label } from '@/components/ui/label';
 import { Badge } from '@/components/ui/badge';
 import { Switch } from '@/components/ui/switch';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { toast } from 'sonner';
 import { 
   MessageCircle, Send, Users, Link2, Image,
   AlertCircle, Check, Phone, ExternalLink
 } from 'lucide-react';
 
 export default function SocialMessagingCampaignsTab() {
   // حالة واتساب
   const [whatsappMode, setWhatsappMode] = useState<'manual' | 'api'>('manual');
   const [whatsappPhone, setWhatsappPhone] = useState('');
   const [whatsappMessage, setWhatsappMessage] = useState('');
   const [whatsappLink, setWhatsappLink] = useState('');
   const [whatsappApiConnected, setWhatsappApiConnected] = useState(false);
   
   // حالة تيليجرام
   const [telegramChannel, setTelegramChannel] = useState('');
   const [telegramMessage, setTelegramMessage] = useState('');
   const [telegramConnected, setTelegramConnected] = useState(false);
 
   // إنشاء رابط واتساب
   const generateWhatsappLink = () => {
     if (!whatsappPhone) {
       toast.error('يرجى إدخال رقم الهاتف');
       return;
     }
     
     const phone = whatsappPhone.replace(/\D/g, '');
     const message = encodeURIComponent(whatsappMessage);
     const link = `https://wa.me/${phone}?text=${message}`;
     setWhatsappLink(link);
     toast.success('تم إنشاء الرابط');
   };
 
   // نسخ الرابط
   const copyLink = (link: string) => {
     navigator.clipboard.writeText(link);
     toast.success('تم نسخ الرابط');
   };
 
   // ربط WhatsApp Cloud API
   const connectWhatsappApi = async () => {
     // محاكاة الربط
     await new Promise(resolve => setTimeout(resolve, 1500));
     setWhatsappApiConnected(true);
     toast.success('تم ربط WhatsApp Cloud API');
   };
 
   // ربط تيليجرام
   const connectTelegram = async () => {
     if (!telegramChannel) {
       toast.error('يرجى إدخال معرف القناة');
       return;
     }
     await new Promise(resolve => setTimeout(resolve, 1500));
     setTelegramConnected(true);
     toast.success('تم ربط قناة تيليجرام');
   };
 
   return (
     <ScrollArea className="h-full">
       <div className="p-4 space-y-4">
         {/* العنوان */}
         <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-4 text-white">
           <div className="flex items-center gap-3">
             <MessageCircle className="w-8 h-8" />
             <div>
               <h2 className="text-xl font-bold">الحملات المباشرة</h2>
               <p className="text-green-100 text-sm">واتساب وتيليجرام</p>
             </div>
           </div>
         </div>
 
         {/* تنبيه */}
         <Card className="border-blue-300 bg-blue-50">
           <CardContent className="p-4">
             <div className="flex items-start gap-3">
               <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
               <p className="text-sm text-blue-700">
                 لا يتم استخدام بوتات تلقائية بدون موافقة المستخدم الصريحة.
               </p>
             </div>
           </CardContent>
         </Card>
 
         <Tabs defaultValue="whatsapp" className="w-full">
           <TabsList className="w-full grid grid-cols-2 mb-4">
             <TabsTrigger value="whatsapp" className="gap-1">
               <Phone className="w-4 h-4" />
               واتساب
             </TabsTrigger>
             <TabsTrigger value="telegram" className="gap-1">
               <Send className="w-4 h-4" />
               تيليجرام
             </TabsTrigger>
           </TabsList>
 
           {/* واتساب */}
           <TabsContent value="whatsapp" className="space-y-4">
             {/* اختيار الوضع */}
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-base">نوع الحملة</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-2 gap-3">
                   <button
                     onClick={() => setWhatsappMode('manual')}
                     className={`p-4 rounded-xl border-2 text-center ${
                       whatsappMode === 'manual'
                         ? 'border-green-500 bg-green-50'
                         : 'border-gray-200'
                     }`}
                   >
                     <Link2 className="w-6 h-6 mx-auto mb-2 text-green-600" />
                     <div className="font-bold text-sm">روابط يدوية</div>
                     <div className="text-xs text-gray-500">wa.me links</div>
                   </button>
                   <button
                     onClick={() => setWhatsappMode('api')}
                     className={`p-4 rounded-xl border-2 text-center ${
                       whatsappMode === 'api'
                         ? 'border-green-500 bg-green-50'
                         : 'border-gray-200'
                     }`}
                   >
                     <MessageCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
                     <div className="font-bold text-sm">Cloud API</div>
                     <div className="text-xs text-gray-500">WhatsApp Business</div>
                   </button>
                 </div>
               </CardContent>
             </Card>
 
             {whatsappMode === 'manual' ? (
               /* حملات يدوية */
               <Card>
                 <CardHeader className="pb-2">
                   <CardTitle className="text-base">إنشاء رابط واتساب</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <div>
                     <Label>رقم الهاتف (مع رمز الدولة)</Label>
                     <Input
                       placeholder="966501234567"
                       value={whatsappPhone}
                       onChange={(e) => setWhatsappPhone(e.target.value)}
                       className="mt-1"
                     />
                   </div>
                   
                   <div>
                     <Label>نص الرسالة</Label>
                     <Textarea
                       placeholder="مرحباً، أود الاستفسار عن..."
                       value={whatsappMessage}
                       onChange={(e) => setWhatsappMessage(e.target.value)}
                       className="mt-1 min-h-[100px]"
                     />
                   </div>
                   
                   <Button
                     onClick={generateWhatsappLink}
                     className="w-full bg-green-600 hover:bg-green-700"
                   >
                     <Link2 className="w-4 h-4 ml-2" />
                     إنشاء الرابط
                   </Button>
                   
                   {whatsappLink && (
                     <div className="p-3 bg-gray-100 rounded-lg">
                       <div className="flex items-center justify-between gap-2">
                         <p className="text-sm text-gray-600 truncate flex-1">
                           {whatsappLink}
                         </p>
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={() => copyLink(whatsappLink)}
                         >
                           نسخ
                         </Button>
                       </div>
                     </div>
                   )}
                 </CardContent>
               </Card>
             ) : (
               /* WhatsApp Cloud API */
               <Card>
                 <CardHeader className="pb-2">
                   <CardTitle className="text-base">WhatsApp Cloud API</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   {whatsappApiConnected ? (
                     <div className="text-center py-6">
                       <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                         <Check className="w-8 h-8 text-green-600" />
                       </div>
                       <h4 className="font-bold text-green-700">متصل</h4>
                       <p className="text-sm text-gray-500">WhatsApp Business API مفعّل</p>
                       
                       <div className="mt-4 space-y-3">
                         <div>
                           <Label>نص الرسالة</Label>
                           <Textarea
                             placeholder="نص الحملة..."
                             className="mt-1"
                           />
                         </div>
                         <Button className="w-full bg-green-600 hover:bg-green-700">
                           <Send className="w-4 h-4 ml-2" />
                           إرسال الحملة
                         </Button>
                       </div>
                     </div>
                   ) : (
                     <div className="text-center py-6">
                       <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                       <h4 className="font-bold text-gray-700">ربط WhatsApp Business</h4>
                       <p className="text-sm text-gray-500 mb-4">
                         اربط حسابك لإرسال حملات واتساب
                       </p>
                       <Button
                         onClick={connectWhatsappApi}
                         className="bg-green-600 hover:bg-green-700"
                       >
                         <Link2 className="w-4 h-4 ml-2" />
                         ربط الحساب
                       </Button>
                     </div>
                   )}
                 </CardContent>
               </Card>
             )}
           </TabsContent>
 
           {/* تيليجرام */}
           <TabsContent value="telegram" className="space-y-4">
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-base">حملات تيليجرام</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 {telegramConnected ? (
                   <>
                     <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                       <Check className="w-5 h-5 text-green-600" />
                       <span className="font-medium text-green-700">
                         متصل بـ @{telegramChannel}
                       </span>
                     </div>
                     
                     <div>
                       <Label>نص المنشور</Label>
                       <Textarea
                         placeholder="محتوى المنشور..."
                         value={telegramMessage}
                         onChange={(e) => setTelegramMessage(e.target.value)}
                         className="mt-1 min-h-[120px]"
                       />
                     </div>
                     
                     <Button className="w-full bg-[#0088CC] hover:bg-[#0077B5]">
                       <Send className="w-4 h-4 ml-2" />
                       نشر على القناة
                     </Button>
                   </>
                 ) : (
                   <>
                     <div>
                       <Label>معرف القناة</Label>
                       <Input
                         placeholder="@your_channel"
                         value={telegramChannel}
                         onChange={(e) => setTelegramChannel(e.target.value)}
                         className="mt-1"
                       />
                     </div>
                     
                     <Button
                       onClick={connectTelegram}
                       className="w-full bg-[#0088CC] hover:bg-[#0077B5]"
                     >
                       <Link2 className="w-4 h-4 ml-2" />
                       ربط القناة
                     </Button>
                   </>
                 )}
               </CardContent>
             </Card>
 
             {/* تنبيه */}
             <Card className="border-amber-200 bg-amber-50">
               <CardContent className="p-4">
                 <p className="text-sm text-amber-700">
                   ⚠️ لا يتم استخدام بوتات تلقائية بدون موافقة صريحة من المستخدم.
                 </p>
               </CardContent>
             </Card>
           </TabsContent>
         </Tabs>
       </div>
     </ScrollArea>
   );
 }
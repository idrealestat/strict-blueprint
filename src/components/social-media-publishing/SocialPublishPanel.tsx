 /**
  * SocialPublishPanel.tsx
  * لوحة النشر على التواصل الاجتماعي مع الوصف والهاشتاقات وتتبع التقدم
  */
 
 import { useState, useCallback, useEffect } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Textarea } from '@/components/ui/textarea';
 import { Badge } from '@/components/ui/badge';
 import { Checkbox } from '@/components/ui/checkbox';
 import { Progress } from '@/components/ui/progress';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { toast } from 'sonner';
 import { 
   Send, 
   Hash, 
   Sparkles, 
   Check, 
   X, 
   Loader2, 
   AlertCircle,
   RefreshCw,
   Copy,
   Wand2
 } from 'lucide-react';
 import { 
   SocialPlatform, 
   SocialPlatformId, 
   SOCIAL_PLATFORMS,
   PlatformPublishProgress,
   REAL_ESTATE_HASHTAGS
 } from './types';
 
 interface SocialPublishPanelProps {
   connectedPlatforms: SocialPlatform[];
   hasContent: boolean; // هل يوجد فيديو ومحتوى
   onPublish: (data: {
     description: string;
     hashtags: string[];
     selectedPlatforms: SocialPlatformId[];
   }) => Promise<void>;
 }
 
 export default function SocialPublishPanel({
   connectedPlatforms,
   hasContent,
   onPublish
 }: SocialPublishPanelProps) {
   // الوصف والهاشتاقات
   const [description, setDescription] = useState('');
   const [hashtags, setHashtags] = useState<string[]>([]);
   const [customHashtag, setCustomHashtag] = useState('');
   
   // المنصات المحددة
   const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatformId[]>([]);
   
   // حالة النشر
   const [isPublishing, setIsPublishing] = useState(false);
   const [publishProgress, setPublishProgress] = useState<PlatformPublishProgress[]>([]);
   const [overallProgress, setOverallProgress] = useState(0);
   const [publishComplete, setPublishComplete] = useState(false);
   
   // توليد الهاشتاقات التلقائية
   const [isGeneratingHashtags, setIsGeneratingHashtags] = useState(false);
   
   // المنصات المرتبطة فقط
   const connected = connectedPlatforms.filter(p => p.status === 'connected');
   
   // تحديد/إلغاء تحديد منصة
   const togglePlatform = (platformId: SocialPlatformId) => {
     setSelectedPlatforms(prev => 
       prev.includes(platformId)
         ? prev.filter(id => id !== platformId)
         : [...prev, platformId]
     );
   };
   
   // تحديد كل المنصات
   const selectAllPlatforms = () => {
     setSelectedPlatforms(connected.map(p => p.id));
   };
   
   // إلغاء تحديد الكل
   const deselectAllPlatforms = () => {
     setSelectedPlatforms([]);
   };
   
   // إضافة هاشتاق
   const addHashtag = (tag: string) => {
     const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
     if (!hashtags.includes(normalizedTag)) {
       setHashtags(prev => [...prev, normalizedTag]);
     }
   };
   
   // حذف هاشتاق
   const removeHashtag = (tag: string) => {
     setHashtags(prev => prev.filter(t => t !== tag));
   };
   
   // إضافة هاشتاق مخصص
   const handleAddCustomHashtag = () => {
     if (customHashtag.trim()) {
       addHashtag(customHashtag.trim());
       setCustomHashtag('');
     }
   };
   
   // توليد الهاشتاقات بالذكاء الاصطناعي
   const generateHashtags = async () => {
     setIsGeneratingHashtags(true);
     try {
       // محاكاة توليد ذكي بناءً على الوصف
       await new Promise(resolve => setTimeout(resolve, 1500));
       
       // اختيار هاشتاقات عشوائية من القائمة
       const shuffled = [...REAL_ESTATE_HASHTAGS].sort(() => 0.5 - Math.random());
       const selected = shuffled.slice(0, 8);
       
       // إضافة هاشتاقات من الوصف
       if (description) {
         const words = description.split(' ').filter(w => w.length > 3);
         const customTags = words.slice(0, 3).map(w => `#${w.replace(/[^\u0600-\u06FFa-zA-Z0-9]/g, '')}`);
         selected.push(...customTags.filter(t => t.length > 2));
       }
       
       setHashtags(selected);
       toast.success('تم توليد الهاشتاقات بنجاح');
     } catch (error) {
       toast.error('فشل في توليد الهاشتاقات');
     } finally {
       setIsGeneratingHashtags(false);
     }
   };
   
   // نسخ الهاشتاقات
   const copyHashtags = () => {
     const text = hashtags.join(' ');
     navigator.clipboard.writeText(text);
     toast.success('تم نسخ الهاشتاقات');
   };
   
   // محاكاة النشر على المنصات
   const handlePublish = async () => {
     if (!hasContent) {
       toast.error('يرجى إضافة فيديو ومحتوى أولاً');
       return;
     }
     
     if (selectedPlatforms.length === 0) {
       toast.error('يرجى اختيار منصة واحدة على الأقل');
       return;
     }
     
     if (!description.trim()) {
       toast.error('يرجى كتابة وصف للمنشور');
       return;
     }
     
     setIsPublishing(true);
     setPublishComplete(false);
     setOverallProgress(0);
     
     // إعداد حالة التقدم لكل منصة
     const initialProgress: PlatformPublishProgress[] = selectedPlatforms.map(platformId => {
       const platform = SOCIAL_PLATFORMS.find(p => p.id === platformId)!;
       return {
         platformId,
         platformName: platform.name,
         icon: platform.icon,
         status: 'pending',
         progress: 0
       };
     });
     
     setPublishProgress(initialProgress);
     
     // محاكاة النشر على كل منصة
     for (let i = 0; i < selectedPlatforms.length; i++) {
       const platformId = selectedPlatforms[i];
       
       // تحديث الحالة لـ uploading
       setPublishProgress(prev => prev.map(p => 
         p.platformId === platformId 
           ? { ...p, status: 'uploading', progress: 0 }
           : p
       ));
       
       // محاكاة تقدم الرفع
       for (let progress = 0; progress <= 100; progress += 20) {
         await new Promise(resolve => setTimeout(resolve, 300));
         setPublishProgress(prev => prev.map(p => 
           p.platformId === platformId 
             ? { ...p, progress }
             : p
         ));
       }
       
       // محاكاة نجاح أو فشل (90% نجاح)
       const isSuccess = Math.random() > 0.1;
       
       setPublishProgress(prev => prev.map(p => 
         p.platformId === platformId 
           ? { 
               ...p, 
               status: isSuccess ? 'success' : 'failed',
               progress: 100,
               errorMessage: isSuccess ? undefined : 'فشل الاتصال بالمنصة - يرجى المحاولة لاحقاً'
             }
           : p
       ));
       
       // تحديث التقدم الكلي
       setOverallProgress(Math.round(((i + 1) / selectedPlatforms.length) * 100));
     }
     
     setIsPublishing(false);
     setPublishComplete(true);
     
     // إحصائيات النشر
     const successCount = publishProgress.filter(p => p.status === 'success').length;
     const failCount = publishProgress.filter(p => p.status === 'failed').length;
     
     if (failCount === 0) {
       toast.success(`تم النشر بنجاح على ${successCount} منصات`);
     } else if (successCount > 0) {
       toast.warning(`تم النشر على ${successCount} منصات، وفشل ${failCount}`);
     } else {
       toast.error('فشل النشر على جميع المنصات');
     }
   };
   
   // إعادة المحاولة للمنصات الفاشلة
   const retryFailed = async () => {
     const failedPlatforms = publishProgress
       .filter(p => p.status === 'failed')
       .map(p => p.platformId);
     
     if (failedPlatforms.length === 0) return;
     
     setIsPublishing(true);
     
     for (const platformId of failedPlatforms) {
       // تحديث الحالة
       setPublishProgress(prev => prev.map(p => 
         p.platformId === platformId 
           ? { ...p, status: 'uploading', progress: 0, errorMessage: undefined }
           : p
       ));
       
       // محاكاة إعادة المحاولة
       for (let progress = 0; progress <= 100; progress += 25) {
         await new Promise(resolve => setTimeout(resolve, 200));
         setPublishProgress(prev => prev.map(p => 
           p.platformId === platformId 
             ? { ...p, progress }
             : p
         ));
       }
       
       // نجاح إعادة المحاولة (80%)
       const isSuccess = Math.random() > 0.2;
       
       setPublishProgress(prev => prev.map(p => 
         p.platformId === platformId 
           ? { 
               ...p, 
               status: isSuccess ? 'success' : 'failed',
               progress: 100,
               errorMessage: isSuccess ? undefined : 'استمرار المشكلة - تحقق من اتصال المنصة'
             }
           : p
       ));
     }
     
     setIsPublishing(false);
     toast.info('تم إعادة المحاولة');
   };
   
   // إعادة تعيين النشر
   const resetPublish = () => {
     setPublishProgress([]);
     setPublishComplete(false);
     setOverallProgress(0);
   };
   
   return (
     <div className="space-y-4" dir="rtl">
       {/* قسم الوصف */}
       <Card>
         <CardHeader className="pb-2">
           <CardTitle className="text-base flex items-center gap-2">
             <Sparkles className="w-4 h-4 text-primary" />
             وصف المنشور
           </CardTitle>
         </CardHeader>
         <CardContent>
           <Textarea
             placeholder="اكتب وصف جذاب للفيديو... سيظهر مع المنشور على جميع المنصات"
             value={description}
             onChange={(e) => setDescription(e.target.value)}
             rows={4}
             className="resize-none"
           />
           <p className="text-xs text-muted-foreground mt-1">
             {description.length} حرف
           </p>
         </CardContent>
       </Card>
       
       {/* قسم الهاشتاقات */}
       <Card>
         <CardHeader className="pb-2">
           <CardTitle className="text-base flex items-center justify-between">
             <span className="flex items-center gap-2">
               <Hash className="w-4 h-4 text-primary" />
               الهاشتاقات
             </span>
             <div className="flex gap-2">
               <Button
                 size="sm"
                 variant="outline"
                 onClick={generateHashtags}
                 disabled={isGeneratingHashtags}
               >
                 {isGeneratingHashtags ? (
                   <Loader2 className="w-4 h-4 animate-spin" />
                 ) : (
                   <Wand2 className="w-4 h-4" />
                 )}
                 <span className="mr-1">توليد تلقائي</span>
               </Button>
               {hashtags.length > 0 && (
                 <Button size="sm" variant="ghost" onClick={copyHashtags}>
                   <Copy className="w-4 h-4" />
                 </Button>
               )}
             </div>
           </CardTitle>
         </CardHeader>
         <CardContent className="space-y-3">
           {/* إضافة هاشتاق مخصص */}
           <div className="flex gap-2">
             <input
               type="text"
               placeholder="أضف هاشتاق..."
               value={customHashtag}
               onChange={(e) => setCustomHashtag(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleAddCustomHashtag()}
               className="flex-1 px-3 py-2 text-sm border rounded-md"
             />
             <Button size="sm" onClick={handleAddCustomHashtag}>
               إضافة
             </Button>
           </div>
           
           {/* الهاشتاقات المحددة */}
           {hashtags.length > 0 && (
             <div className="flex flex-wrap gap-2">
               {hashtags.map((tag, index) => (
                 <Badge 
                   key={index} 
                   variant="secondary"
                   className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                   onClick={() => removeHashtag(tag)}
                 >
                   {tag}
                   <X className="w-3 h-3 mr-1" />
                 </Badge>
               ))}
             </div>
           )}
           
           {/* هاشتاقات مقترحة */}
           <div>
             <p className="text-xs text-muted-foreground mb-2">هاشتاقات مقترحة:</p>
             <div className="flex flex-wrap gap-1">
               {REAL_ESTATE_HASHTAGS.slice(0, 12).map((tag) => (
                 <Badge 
                   key={tag}
                   variant="outline"
                   className={`cursor-pointer text-xs ${
                     hashtags.includes(tag) 
                       ? 'bg-primary text-primary-foreground' 
                       : 'hover:bg-primary/10'
                   }`}
                   onClick={() => 
                     hashtags.includes(tag) ? removeHashtag(tag) : addHashtag(tag)
                   }
                 >
                   {tag}
                 </Badge>
               ))}
             </div>
           </div>
         </CardContent>
       </Card>
       
       {/* اختيار المنصات */}
       <Card>
         <CardHeader className="pb-2">
           <CardTitle className="text-base flex items-center justify-between">
             <span className="flex items-center gap-2">
               <Send className="w-4 h-4 text-primary" />
               اختر المنصات للنشر
             </span>
             <div className="flex gap-2">
               <Button size="sm" variant="ghost" onClick={selectAllPlatforms}>
                 تحديد الكل
               </Button>
               <Button size="sm" variant="ghost" onClick={deselectAllPlatforms}>
                 إلغاء الكل
               </Button>
             </div>
           </CardTitle>
         </CardHeader>
         <CardContent>
           {connected.length === 0 ? (
             <div className="text-center py-4 text-muted-foreground">
               <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
               <p>لا توجد منصات مرتبطة</p>
               <p className="text-xs">اذهب إلى تبويب "الربط" لربط منصاتك</p>
             </div>
           ) : (
             <div className="grid grid-cols-2 gap-2">
               {connected.map((platform) => (
                 <div
                   key={platform.id}
                   className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                     selectedPlatforms.includes(platform.id)
                       ? 'border-primary bg-primary/5'
                       : 'border-border hover:border-primary/50'
                   }`}
                   onClick={() => togglePlatform(platform.id)}
                 >
                   <Checkbox
                     checked={selectedPlatforms.includes(platform.id)}
                     onCheckedChange={() => togglePlatform(platform.id)}
                   />
                   <span className="text-lg">{platform.icon}</span>
                   <span className="text-sm">{platform.name}</span>
                 </div>
               ))}
             </div>
           )}
         </CardContent>
       </Card>
       
       {/* تقدم النشر */}
       {publishProgress.length > 0 && (
         <Card className="border-2 border-primary/30">
           <CardHeader className="pb-2">
             <CardTitle className="text-base flex items-center justify-between">
               <span>حالة النشر</span>
               {publishComplete && (
                 <Button size="sm" variant="ghost" onClick={resetPublish}>
                   <RefreshCw className="w-4 h-4 ml-1" />
                   إعادة
                 </Button>
               )}
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-3">
             {/* التقدم الكلي */}
             <div>
               <div className="flex justify-between text-sm mb-1">
                 <span>التقدم الكلي</span>
                 <span>{overallProgress}%</span>
               </div>
               <Progress value={overallProgress} className="h-2" />
             </div>
             
             {/* تفاصيل كل منصة */}
             <ScrollArea className="max-h-48">
               <div className="space-y-2">
                 {publishProgress.map((item) => (
                   <div 
                     key={item.platformId}
                     className={`flex items-center gap-3 p-2 rounded-lg border ${
                       item.status === 'success' ? 'border-green-300 bg-green-50' :
                       item.status === 'failed' ? 'border-red-300 bg-red-50' :
                       item.status === 'uploading' ? 'border-blue-300 bg-blue-50' :
                       'border-gray-200'
                     }`}
                   >
                     <span className="text-lg">{item.icon}</span>
                     <div className="flex-1">
                       <div className="flex items-center justify-between">
                         <span className="text-sm font-medium">{item.platformName}</span>
                         {item.status === 'pending' && (
                           <Badge variant="outline">في الانتظار</Badge>
                         )}
                         {item.status === 'uploading' && (
                           <Badge className="bg-blue-500">
                             <Loader2 className="w-3 h-3 ml-1 animate-spin" />
                             جاري الرفع {item.progress}%
                           </Badge>
                         )}
                         {item.status === 'success' && (
                           <Badge className="bg-green-500">
                             <Check className="w-3 h-3 ml-1" />
                             تم النشر
                           </Badge>
                         )}
                         {item.status === 'failed' && (
                           <Badge variant="destructive">
                             <X className="w-3 h-3 ml-1" />
                             فشل
                           </Badge>
                         )}
                       </div>
                       {item.status === 'uploading' && (
                         <Progress value={item.progress} className="h-1 mt-1" />
                       )}
                       {item.errorMessage && (
                         <p className="text-xs text-red-600 mt-1">{item.errorMessage}</p>
                       )}
                     </div>
                   </div>
                 ))}
               </div>
             </ScrollArea>
             
             {/* زر إعادة المحاولة للفاشلة */}
             {publishComplete && publishProgress.some(p => p.status === 'failed') && (
               <Button 
                 variant="outline" 
                 className="w-full"
                 onClick={retryFailed}
                 disabled={isPublishing}
               >
                 <RefreshCw className="w-4 h-4 ml-2" />
                 إعادة المحاولة للمنصات الفاشلة
               </Button>
             )}
           </CardContent>
         </Card>
       )}
       
       {/* زر النشر */}
       <Button
         className="w-full h-12 text-lg bg-gradient-to-r from-[#01411C] to-[#065f41] hover:from-[#016630] hover:to-[#01411C]"
         onClick={handlePublish}
         disabled={isPublishing || !hasContent || selectedPlatforms.length === 0}
       >
         {isPublishing ? (
           <>
             <Loader2 className="w-5 h-5 ml-2 animate-spin" />
             جاري النشر...
           </>
         ) : (
           <>
             <Send className="w-5 h-5 ml-2" />
             نشر على {selectedPlatforms.length || 0} منصات
           </>
         )}
       </Button>
       
       {/* تنبيه عدم وجود محتوى */}
       {!hasContent && (
         <p className="text-center text-sm text-amber-600">
           ⚠️ يرجى رفع فيديو وإضافة محتوى أولاً
         </p>
       )}
     </div>
   );
 }
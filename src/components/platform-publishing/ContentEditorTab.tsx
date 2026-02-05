 /**
  * ContentEditorTab.tsx
  * نظام تعديل الفيديو والمحتوى
  * يتضمن: Speech-to-Text، ترجمة الفيديو، الشعار، الخطوط، الهاشتاقات
  */
 
 import { useState, useRef } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
 import { Slider } from '@/components/ui/slider';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Separator } from '@/components/ui/separator';
 import {
   Video,
   Mic,
   Type,
   Hash,
   Image,
   Palette,
   Clock,
   Play,
   Pause,
   Upload,
   Loader2,
   Check,
   X,
   Plus,
   Trash2,
   Sparkles,
   Building,
 } from 'lucide-react';
 import { toast } from 'sonner';
 import { motion, AnimatePresence } from 'framer-motion';
 
 // الخطوط المتاحة
 const AVAILABLE_FONTS = [
   { id: 'cairo', name: 'Cairo', nameAr: 'القاهرة' },
   { id: 'tajawal', name: 'Tajawal', nameAr: 'تجوال' },
   { id: 'almarai', name: 'Almarai', nameAr: 'المراعي' },
   { id: 'noto-sans-arabic', name: 'Noto Sans Arabic', nameAr: 'نوتو سانس' },
   { id: 'ibm-plex-arabic', name: 'IBM Plex Arabic', nameAr: 'آي بي إم بلكس' },
 ];
 
 // ألوان النص
 const TEXT_COLORS = [
   { id: 'gold', name: 'ذهبي', color: '#D4AF37' },
   { id: 'silver', name: 'فضي', color: '#C0C0C0' },
   { id: 'white', name: 'أبيض', color: '#FFFFFF' },
   { id: 'black', name: 'أسود', color: '#000000' },
   { id: 'dark-green', name: 'أخضر داكن', color: '#01411C' },
   { id: 'dark-blue', name: 'أزرق داكن', color: '#1E3A5F' },
 ];
 
 // مواقع الشعار
 const LOGO_POSITIONS = [
   { id: 'top-right', label: 'أعلى يمين' },
   { id: 'top-center', label: 'أعلى منتصف' },
   { id: 'top-left', label: 'أعلى يسار' },
 ];
 
 export default function ContentEditorTab() {
   // حالة الفيديو
   const [videoFile, setVideoFile] = useState<File | null>(null);
   const [videoUrl, setVideoUrl] = useState<string>('');
   const [isProcessing, setIsProcessing] = useState(false);
 
   // حالة Speech-to-Text
   const [transcribedText, setTranscribedText] = useState('');
   const [isTranscribing, setIsTranscribing] = useState(false);
   const [showSubtitles, setShowSubtitles] = useState(true);
 
   // حالة التنسيق
   const [selectedFont, setSelectedFont] = useState('cairo');
   const [fontSize, setFontSize] = useState([24]);
   const [textColor, setTextColor] = useState('gold');
 
   // حالة الشعار
   const [logoUrl, setLogoUrl] = useState('');
   const [logoPosition, setLogoPosition] = useState('top-right');
 
   // اسم الشركة
   const [companyName, setCompanyName] = useState('');
 
   // الهاشتاقات
   const [hashtags, setHashtags] = useState<string[]>([]);
   const [newHashtag, setNewHashtag] = useState('');
   const [autoHashtags, setAutoHashtags] = useState<string[]>([]);
 
   const videoInputRef = useRef<HTMLInputElement>(null);
   const logoInputRef = useRef<HTMLInputElement>(null);
 
   // رفع الفيديو
   const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
       setVideoFile(file);
       setVideoUrl(URL.createObjectURL(file));
       toast.success('تم رفع الفيديو بنجاح!');
     }
   };
 
   // تحويل الصوت إلى نص
   const handleTranscribe = async () => {
     if (!videoFile) {
       toast.error('الرجاء رفع فيديو أولاً');
       return;
     }
 
     setIsTranscribing(true);
     
     // محاكاة عملية التحويل
     await new Promise(resolve => setTimeout(resolve, 3000));
     
     const sampleText = `
 مرحباً بكم في جولة عقارية مميزة
 اليوم نعرض لكم فيلا فاخرة في حي الملقا
 تتميز بتصميم عصري ومساحات واسعة
 للتواصل والاستفسار تواصلوا معنا
     `.trim();
     
     setTranscribedText(sampleText);
     
     // استخراج الهاشتاقات التلقائية
     const extracted = ['#عقارات', '#فيلا', '#الملقا', '#الرياض', '#عقار_فاخر'];
     setAutoHashtags(extracted);
     
     setIsTranscribing(false);
     toast.success('تم تحويل الصوت إلى نص بنجاح!');
   };
 
   // إضافة هاشتاق
   const addHashtag = () => {
     if (!newHashtag.trim()) return;
     
     let tag = newHashtag.trim();
     if (!tag.startsWith('#')) tag = '#' + tag;
     
     if (!hashtags.includes(tag)) {
       setHashtags([...hashtags, tag]);
     }
     setNewHashtag('');
   };
 
   // حذف هاشتاق
   const removeHashtag = (tag: string) => {
     setHashtags(hashtags.filter(h => h !== tag));
   };
 
   // تطبيق الهاشتاقات التلقائية
   const applyAutoHashtags = () => {
     const merged = [...new Set([...hashtags, ...autoHashtags])];
     setHashtags(merged);
     toast.success('تم إضافة الهاشتاقات');
   };
 
   const selectedColor = TEXT_COLORS.find(c => c.id === textColor);
 
   return (
     <ScrollArea className="h-full">
       <div className="p-4 space-y-4" dir="rtl">
         {/* Header */}
         <div className="flex items-center justify-between">
           <div>
             <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">محرر المحتوى</h2>
             <p className="text-sm text-muted-foreground">أدوات تعديل الفيديو والنصوص</p>
           </div>
           <Badge variant="outline" className="border-purple-500 text-purple-600">
             <Video className="w-3 h-3 ml-1" />
             Editor
           </Badge>
         </div>
 
         {/* رفع الفيديو */}
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-base flex items-center gap-2">
               <Video className="w-5 h-5 text-purple-600" />
               الفيديو
             </CardTitle>
           </CardHeader>
           <CardContent>
             <input
               ref={videoInputRef}
               type="file"
               accept="video/*"
               onChange={handleVideoUpload}
               className="hidden"
             />
 
             {videoUrl ? (
               <div className="space-y-3">
                 <video
                   src={videoUrl}
                   controls
                   className="w-full rounded-lg max-h-48 object-cover"
                 />
                 <div className="flex gap-2">
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => {
                       setVideoFile(null);
                       setVideoUrl('');
                     }}
                   >
                     <Trash2 className="w-4 h-4 ml-1" />
                     حذف
                   </Button>
                   <Button
                     size="sm"
                     onClick={() => videoInputRef.current?.click()}
                   >
                     <Upload className="w-4 h-4 ml-1" />
                     استبدال
                   </Button>
                 </div>
               </div>
             ) : (
               <Button
                 className="w-full h-24 border-2 border-dashed"
                 variant="outline"
                 onClick={() => videoInputRef.current?.click()}
               >
                 <div className="text-center">
                   <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                   <p>اضغط لرفع الفيديو</p>
                 </div>
               </Button>
             )}
           </CardContent>
         </Card>
 
         {/* تحويل الصوت إلى نص */}
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-base flex items-center gap-2">
               <Mic className="w-5 h-5 text-red-500" />
               تحويل الصوت إلى نص (Speech-to-Text)
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-3">
             <Button
               className="w-full"
               onClick={handleTranscribe}
               disabled={!videoFile || isTranscribing}
             >
               {isTranscribing ? (
                 <>
                   <Loader2 className="w-4 h-4 animate-spin ml-2" />
                   جاري التحويل...
                 </>
               ) : (
                 <>
                   <Mic className="w-4 h-4 ml-2" />
                   تحويل الصوت إلى نص
                 </>
               )}
             </Button>
 
             {transcribedText && (
               <div className="space-y-2">
                 <Label>النص المستخرج (قابل للتعديل)</Label>
                 <Textarea
                   value={transcribedText}
                   onChange={e => setTranscribedText(e.target.value)}
                   rows={5}
                   className="font-medium"
                 />
                 <div className="flex items-center gap-2">
                   <input
                     type="checkbox"
                     checked={showSubtitles}
                     onChange={e => setShowSubtitles(e.target.checked)}
                     className="rounded"
                   />
                   <Label>عرض كترجمة على الفيديو</Label>
                 </div>
               </div>
             )}
           </CardContent>
         </Card>
 
         {/* تنسيق النص */}
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-base flex items-center gap-2">
               <Type className="w-5 h-5 text-blue-600" />
               تنسيق النص
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             {/* الخط */}
             <div>
               <Label>نوع الخط</Label>
               <Select value={selectedFont} onValueChange={setSelectedFont}>
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   {AVAILABLE_FONTS.map(font => (
                     <SelectItem key={font.id} value={font.id}>
                       {font.nameAr} ({font.name})
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
 
             {/* حجم الخط */}
             <div>
               <Label>حجم الخط: {fontSize[0]}px</Label>
               <Slider
                 value={fontSize}
                 onValueChange={setFontSize}
                 min={12}
                 max={48}
                 step={2}
                 className="mt-2"
               />
             </div>
 
             {/* لون النص */}
             <div>
               <Label>لون النص</Label>
               <div className="flex flex-wrap gap-2 mt-2">
                 {TEXT_COLORS.map(color => (
                   <button
                     key={color.id}
                     onClick={() => setTextColor(color.id)}
                     className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                       textColor === color.id ? 'border-[hsl(var(--gold))] scale-110' : 'border-gray-200'
                     }`}
                     style={{ backgroundColor: color.color }}
                     title={color.name}
                   >
                     {textColor === color.id && (
                       <Check className={`w-4 h-4 ${color.id === 'white' || color.id === 'silver' ? 'text-black' : 'text-white'}`} />
                     )}
                   </button>
                 ))}
               </div>
               <p className="text-xs text-muted-foreground mt-1">
                 اللون المختار: {selectedColor?.name}
               </p>
             </div>
           </CardContent>
         </Card>
 
         {/* الشعار */}
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-base flex items-center gap-2">
               <Image className="w-5 h-5 text-amber-600" />
               الشعار
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-3">
             <input
               ref={logoInputRef}
               type="file"
               accept="image/*"
               onChange={e => {
                 const file = e.target.files?.[0];
                 if (file) setLogoUrl(URL.createObjectURL(file));
               }}
               className="hidden"
             />
 
             {logoUrl ? (
               <div className="flex items-center gap-3">
                 <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain rounded border" />
                 <Button variant="outline" size="sm" onClick={() => setLogoUrl('')}>
                   <Trash2 className="w-4 h-4" />
                 </Button>
               </div>
             ) : (
               <Button variant="outline" onClick={() => logoInputRef.current?.click()}>
                 <Upload className="w-4 h-4 ml-1" />
                 رفع الشعار
               </Button>
             )}
 
             {/* مكان الشعار */}
             <div>
               <Label>مكان الشعار</Label>
               <div className="grid grid-cols-3 gap-2 mt-2">
                 {LOGO_POSITIONS.map(pos => (
                   <Button
                     key={pos.id}
                     variant={logoPosition === pos.id ? 'default' : 'outline'}
                     size="sm"
                     onClick={() => setLogoPosition(pos.id)}
                     className={logoPosition === pos.id ? 'bg-[hsl(var(--gold))] text-[hsl(var(--primary))]' : ''}
                   >
                     {pos.label}
                   </Button>
                 ))}
               </div>
             </div>
           </CardContent>
         </Card>
 
         {/* اسم الشركة */}
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-base flex items-center gap-2">
               <Building className="w-5 h-5 text-green-600" />
               اسم الشركة / المكتب (اختياري)
             </CardTitle>
           </CardHeader>
           <CardContent>
             <Input
               placeholder="مثال: مكتب الوساطة العقارية"
               value={companyName}
               onChange={e => setCompanyName(e.target.value)}
             />
             <p className="text-xs text-muted-foreground mt-1">
               سيظهر أعلى المحتوى بنفس الخط واللون المختار
             </p>
           </CardContent>
         </Card>
 
         {/* الهاشتاقات */}
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-base flex items-center gap-2">
               <Hash className="w-5 h-5 text-blue-500" />
               الهاشتاقات الذكية
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-3">
             {/* الهاشتاقات التلقائية */}
             {autoHashtags.length > 0 && (
               <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                 <div className="flex items-center justify-between mb-2">
                   <Label className="text-blue-700 flex items-center gap-1">
                     <Sparkles className="w-4 h-4" />
                     هاشتاقات مستخرجة تلقائياً
                   </Label>
                   <Button size="sm" variant="ghost" onClick={applyAutoHashtags}>
                     <Plus className="w-3 h-3 ml-1" />
                     إضافة الكل
                   </Button>
                 </div>
                 <div className="flex flex-wrap gap-1">
                   {autoHashtags.map(tag => (
                     <Badge key={tag} variant="secondary" className="bg-blue-100 text-blue-700">
                       {tag}
                     </Badge>
                   ))}
                 </div>
               </div>
             )}
 
             {/* إضافة هاشتاق يدوي */}
             <div className="flex gap-2">
               <Input
                 placeholder="أضف هاشتاق..."
                 value={newHashtag}
                 onChange={e => setNewHashtag(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && addHashtag()}
               />
               <Button onClick={addHashtag} size="icon">
                 <Plus className="w-4 h-4" />
               </Button>
             </div>
 
             {/* الهاشتاقات المختارة */}
             {hashtags.length > 0 && (
               <div className="p-3 bg-gray-50 rounded-lg border">
                 <Label className="mb-2 block">الهاشتاقات المختارة ({hashtags.length})</Label>
                 <div className="flex flex-wrap gap-1">
                   {hashtags.map(tag => (
                     <Badge
                       key={tag}
                       variant="outline"
                       className="cursor-pointer hover:bg-red-50 hover:border-red-300"
                       onClick={() => removeHashtag(tag)}
                     >
                       {tag}
                       <X className="w-3 h-3 mr-1" />
                     </Badge>
                   ))}
                 </div>
               </div>
             )}
 
             <p className="text-xs text-muted-foreground">
               ⚠️ لا يتم النشر بدون تأكيد المستخدم
             </p>
           </CardContent>
         </Card>
 
         {/* زر المعاينة/التصدير */}
         <Button
           className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white"
           disabled={!videoFile}
         >
           <Play className="w-4 h-4 ml-2" />
           معاينة المحتوى النهائي
         </Button>
       </div>
     </ScrollArea>
   );
 }
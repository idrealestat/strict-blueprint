  /**
  * SocialContentEditorTab.tsx
  * محرر المحتوى والفيديو للتواصل الاجتماعي
  */
 
import { useState, useMemo } from 'react';
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
   Video, Type, Palette, Image, Hash, Mic, 
   AlignRight, AlignCenter, AlignLeft, Upload,
  Play, Pause, Volume2, Check, X, Sparkles, Eye
 } from 'lucide-react';
 import { 
   VideoSettings, 
   APPROVED_FONTS, 
   SUBTITLE_COLORS 
 } from './types';
 
// مكون المعاينة التفاعلية
function ContentPreview({
  contentText,
  hashtags,
  videoUrl,
  extractedText,
  videoSettings,
}: {
  contentText: string;
  hashtags: string[];
  videoUrl: string;
  extractedText: string;
  videoSettings: VideoSettings;
}) {
  const selectedFont = APPROVED_FONTS.find(f => f.id === videoSettings.subtitleFont);
  const selectedColor = SUBTITLE_COLORS.find(c => c.id === videoSettings.subtitleColor);

  const logoPositionClass = useMemo(() => {
    switch (videoSettings.logoPosition) {
      case 'top-right': return 'top-2 right-2';
      case 'top-center': return 'top-2 left-1/2 -translate-x-1/2';
      case 'top-left': return 'top-2 left-2';
      default: return 'top-2 right-2';
    }
  }, [videoSettings.logoPosition]);

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-[#D4AF37]/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-white">
          <Eye className="w-4 h-4 text-[#D4AF37]" />
          معاينة المحتوى
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* إطار المعاينة - يحاكي شكل المنشور */}
        <div className="bg-white rounded-xl overflow-hidden shadow-lg">
          {/* رأس المنشور */}
          <div className="p-3 border-b flex items-center gap-3" dir="rtl">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#01411C] to-[#D4AF37] flex items-center justify-center">
              <span className="text-white text-xs font-bold">و</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">
                {videoSettings.showCompanyName && videoSettings.companyName 
                  ? videoSettings.companyName 
                  : 'اسم الحساب'}
              </p>
              <p className="text-xs text-gray-500">الآن</p>
            </div>
          </div>

          {/* منطقة الفيديو أو الصورة */}
          <div className="relative bg-gray-100" style={{ aspectRatio: '9/16' }}>
            {videoUrl ? (
              <video 
                src={videoUrl} 
                className="w-full h-full object-cover"
                muted
                loop
                playsInline
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                <Video className="w-16 h-16 text-gray-400" />
              </div>
            )}

            {/* الشعار */}
            <div className={`absolute ${logoPositionClass} z-10`}>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#01411C] to-[#016630] flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">W</span>
              </div>
            </div>

            {/* الترجمة / النص المستخرج */}
            {videoSettings.subtitlesEnabled && extractedText && (
              <div className="absolute bottom-4 left-4 right-4 z-10">
                <p 
                  className="text-center py-2 px-4 rounded-lg"
                  style={{
                    fontFamily: selectedFont?.id || 'Cairo',
                    fontSize: `${videoSettings.subtitleFontSize}px`,
                    color: selectedColor?.color || '#FFD700',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                  }}
                >
                  {extractedText.slice(0, 50)}...
                </p>
              </div>
            )}
          </div>

          {/* المحتوى النصي */}
          <div className="p-3 space-y-2" dir="rtl">
            {contentText ? (
              <p className="text-sm text-gray-800 leading-relaxed">
                {contentText.slice(0, 150)}
                {contentText.length > 150 && '...'}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">
                اكتب محتوى المنشور...
              </p>
            )}

            {/* الهاشتاقات */}
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {hashtags.slice(0, 5).map((tag) => (
                  <span 
                    key={tag} 
                    className="text-xs text-[#01411C] font-medium"
                  >
                    #{tag}
                  </span>
                ))}
                {hashtags.length > 5 && (
                  <span className="text-xs text-gray-400">
                    +{hashtags.length - 5}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* أزرار التفاعل */}
          <div className="px-3 py-2 border-t flex justify-around text-gray-500">
            <button className="flex items-center gap-1 text-xs hover:text-[#01411C]">
              ❤️ إعجاب
            </button>
            <button className="flex items-center gap-1 text-xs hover:text-[#01411C]">
              💬 تعليق
            </button>
            <button className="flex items-center gap-1 text-xs hover:text-[#01411C]">
              🔄 مشاركة
            </button>
          </div>
        </div>

        {/* ملخص الإعدادات الحالية */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-800/50 rounded-lg p-2">
            <p className="text-[10px] text-gray-400">الخط</p>
            <p className="text-xs text-[#D4AF37] font-medium">
              {selectedFont?.nameAr || 'Cairo'}
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-2">
            <p className="text-[10px] text-gray-400">اللون</p>
            <div 
              className="w-4 h-4 rounded-full mx-auto mt-1"
              style={{ backgroundColor: selectedColor?.color || '#FFD700' }}
            />
          </div>
          <div className="bg-gray-800/50 rounded-lg p-2">
            <p className="text-[10px] text-gray-400">الشعار</p>
            <p className="text-xs text-[#D4AF37] font-medium">
              {videoSettings.logoPosition === 'top-right' && 'يمين'}
              {videoSettings.logoPosition === 'top-center' && 'وسط'}
              {videoSettings.logoPosition === 'top-left' && 'يسار'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

 export default function SocialContentEditorTab() {
   // حالة المحتوى النصي
   const [contentText, setContentText] = useState('');
   const [hashtags, setHashtags] = useState<string[]>([]);
   const [newHashtag, setNewHashtag] = useState('');
   
   // حالة الفيديو
   const [videoFile, setVideoFile] = useState<File | null>(null);
   const [videoUrl, setVideoUrl] = useState('');
   const [isProcessingAudio, setIsProcessingAudio] = useState(false);
   const [extractedText, setExtractedText] = useState('');
   
   // إعدادات الفيديو
   const [videoSettings, setVideoSettings] = useState<VideoSettings>({
     subtitlesEnabled: true,
     subtitleColor: 'gold',
     subtitleFont: 'cairo',
     subtitleFontSize: 24,
     logoPosition: 'top-right',
     companyName: '',
     showCompanyName: false,
   });
 
   // استخراج الهاشتاقات من النص
   const extractHashtags = () => {
     const words = contentText.split(/\s+/);
     const extracted = words
       .filter(word => word.length > 3)
       .map(word => word.replace(/[^\u0621-\u064A\w]/g, ''))
       .filter(word => word.length > 2)
       .slice(0, 10);
     
     setHashtags(prev => [...new Set([...prev, ...extracted])]);
     toast.success(`تم استخراج ${extracted.length} هاشتاق`);
   };
 
   // إضافة هاشتاق يدوي
   const addHashtag = () => {
     if (newHashtag.trim()) {
       const tag = newHashtag.replace(/^#/, '').trim();
       if (!hashtags.includes(tag)) {
         setHashtags(prev => [...prev, tag]);
       }
       setNewHashtag('');
     }
   };
 
   // حذف هاشتاق
   const removeHashtag = (tag: string) => {
     setHashtags(prev => prev.filter(t => t !== tag));
   };
 
   // محاكاة تحويل الصوت إلى نص
   const processAudioToText = async () => {
     if (!videoFile) {
       toast.error('يرجى رفع فيديو أولاً');
       return;
     }
     
     setIsProcessingAudio(true);
     // محاكاة المعالجة
     await new Promise(resolve => setTimeout(resolve, 2000));
     
     setExtractedText('هذا نص تجريبي تم استخراجه من الفيديو. يمكنك تعديله وإضافته كترجمة.');
     setIsProcessingAudio(false);
     toast.success('تم استخراج النص من الفيديو بنجاح');
   };
 
   // رفع الفيديو
   const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
       setVideoFile(file);
       setVideoUrl(URL.createObjectURL(file));
       toast.success('تم رفع الفيديو');
     }
   };
 
   return (
     <ScrollArea className="h-full">
       <div className="p-4 space-y-4">
         {/* العنوان */}
         <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl p-4 text-white">
           <h2 className="text-xl font-bold">محرر المحتوى</h2>
           <p className="text-purple-100 text-sm">أنشئ محتوى احترافي للتواصل الاجتماعي</p>
         </div>
 
        {/* منطقة المعاينة - أعلى التبويبات */}
        <ContentPreview
          contentText={contentText}
          hashtags={hashtags}
          videoUrl={videoUrl}
          extractedText={extractedText}
          videoSettings={videoSettings}
        />

         <Tabs defaultValue="text" className="w-full">
           <TabsList className="w-full grid grid-cols-3 mb-4">
             <TabsTrigger value="text" className="gap-1">
               <Type className="w-4 h-4" />
               النص
             </TabsTrigger>
             <TabsTrigger value="video" className="gap-1">
               <Video className="w-4 h-4" />
               الفيديو
             </TabsTrigger>
             <TabsTrigger value="branding" className="gap-1">
               <Palette className="w-4 h-4" />
               الهوية
             </TabsTrigger>
           </TabsList>
 
           {/* تبويب النص */}
           <TabsContent value="text" className="space-y-4">
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-base flex items-center gap-2">
                   <Type className="w-4 h-4" />
                   المحتوى النصي
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <Textarea
                   placeholder="اكتب محتوى المنشور هنا..."
                   value={contentText}
                   onChange={(e) => setContentText(e.target.value)}
                   className="min-h-[150px]"
                 />
                 
                 <Button
                   onClick={extractHashtags}
                   variant="outline"
                   className="w-full"
                 >
                   <Sparkles className="w-4 h-4 ml-2" />
                   استخراج الهاشتاقات تلقائياً
                 </Button>
               </CardContent>
             </Card>
 
             {/* الهاشتاقات */}
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-base flex items-center gap-2">
                   <Hash className="w-4 h-4" />
                   الهاشتاقات
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-3">
                 <div className="flex gap-2">
                   <Input
                     placeholder="أضف هاشتاق..."
                     value={newHashtag}
                     onChange={(e) => setNewHashtag(e.target.value)}
                     onKeyPress={(e) => e.key === 'Enter' && addHashtag()}
                   />
                   <Button onClick={addHashtag} size="icon">
                     <Check className="w-4 h-4" />
                   </Button>
                 </div>
                 
                 <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg min-h-[60px]">
                   {hashtags.length === 0 ? (
                     <p className="text-sm text-gray-400">لا توجد هاشتاقات</p>
                   ) : (
                     hashtags.map((tag) => (
                       <Badge 
                         key={tag} 
                         variant="secondary"
                         className="cursor-pointer hover:bg-red-100"
                         onClick={() => removeHashtag(tag)}
                       >
                         #{tag}
                         <X className="w-3 h-3 mr-1" />
                       </Badge>
                     ))
                   )}
                 </div>
               </CardContent>
             </Card>
           </TabsContent>
 
           {/* تبويب الفيديو */}
           <TabsContent value="video" className="space-y-4">
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-base flex items-center gap-2">
                   <Video className="w-4 h-4" />
                   رفع الفيديو
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                   <input
                     type="file"
                     accept="video/*"
                     onChange={handleVideoUpload}
                     className="hidden"
                     id="video-upload"
                   />
                   <label 
                     htmlFor="video-upload"
                     className="cursor-pointer flex flex-col items-center gap-2"
                   >
                     <Upload className="w-10 h-10 text-gray-400" />
                     <span className="text-gray-600">اضغط لرفع فيديو</span>
                     <span className="text-xs text-gray-400">MP4, MOV, AVI</span>
                   </label>
                 </div>
                 
                 {videoUrl && (
                   <video 
                     src={videoUrl} 
                     controls 
                     className="w-full rounded-lg"
                   />
                 )}
               </CardContent>
             </Card>
 
             {/* تحويل الصوت إلى نص */}
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-base flex items-center gap-2">
                   <Mic className="w-4 h-4" />
                   تحويل الصوت إلى نص
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <Button
                   onClick={processAudioToText}
                   disabled={!videoFile || isProcessingAudio}
                   className="w-full bg-[#01411C] hover:bg-[#016630]"
                 >
                   {isProcessingAudio ? (
                     <>جاري المعالجة...</>
                   ) : (
                     <>
                       <Mic className="w-4 h-4 ml-2" />
                       استخراج النص من الفيديو
                     </>
                   )}
                 </Button>
                 
                 {extractedText && (
                   <Textarea
                     value={extractedText}
                     onChange={(e) => setExtractedText(e.target.value)}
                     placeholder="النص المستخرج..."
                     className="min-h-[100px]"
                   />
                 )}
               </CardContent>
             </Card>
 
             {/* إعدادات الترجمة */}
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-base">إعدادات الترجمة</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex items-center justify-between">
                   <Label>إظهار الترجمة</Label>
                   <Switch
                     checked={videoSettings.subtitlesEnabled}
                     onCheckedChange={(checked) => 
                       setVideoSettings(prev => ({ ...prev, subtitlesEnabled: checked }))
                     }
                   />
                 </div>
                 
                 {videoSettings.subtitlesEnabled && (
                   <>
                     <div>
                       <Label className="mb-2 block">لون النص</Label>
                       <div className="flex gap-2">
                         {SUBTITLE_COLORS.map((color) => (
                           <button
                             key={color.id}
                             onClick={() => 
                               setVideoSettings(prev => ({ 
                                 ...prev, 
                                 subtitleColor: color.id as any 
                               }))
                             }
                             className={`w-10 h-10 rounded-full border-2 ${
                               videoSettings.subtitleColor === color.id 
                                 ? 'border-[#01411C] ring-2 ring-[#D4AF37]' 
                                 : 'border-gray-300'
                             }`}
                             style={{ backgroundColor: color.color }}
                             title={color.name}
                           />
                         ))}
                       </div>
                     </div>
                     
                     <div>
                       <Label className="mb-2 block">نوع الخط</Label>
                       <div className="grid grid-cols-2 gap-2">
                         {APPROVED_FONTS.map((font) => (
                           <button
                             key={font.id}
                             onClick={() => 
                               setVideoSettings(prev => ({ ...prev, subtitleFont: font.id }))
                             }
                             className={`p-2 rounded-lg border text-sm ${
                               videoSettings.subtitleFont === font.id
                                 ? 'border-[#01411C] bg-green-50'
                                 : 'border-gray-200'
                             }`}
                           >
                             {font.nameAr}
                           </button>
                         ))}
                       </div>
                     </div>
                   </>
                 )}
               </CardContent>
             </Card>
           </TabsContent>
 
           {/* تبويب الهوية */}
           <TabsContent value="branding" className="space-y-4">
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-base flex items-center gap-2">
                   <Image className="w-4 h-4" />
                   موقع الشعار
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-3 gap-3">
                   <button
                     onClick={() => 
                       setVideoSettings(prev => ({ ...prev, logoPosition: 'top-right' }))
                     }
                     className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 ${
                       videoSettings.logoPosition === 'top-right'
                         ? 'border-[#01411C] bg-green-50'
                         : 'border-gray-200'
                     }`}
                   >
                     <AlignRight className="w-5 h-5" />
                     <span className="text-xs">أعلى يمين</span>
                   </button>
                   <button
                     onClick={() => 
                       setVideoSettings(prev => ({ ...prev, logoPosition: 'top-center' }))
                     }
                     className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 ${
                       videoSettings.logoPosition === 'top-center'
                         ? 'border-[#01411C] bg-green-50'
                         : 'border-gray-200'
                     }`}
                   >
                     <AlignCenter className="w-5 h-5" />
                     <span className="text-xs">أعلى منتصف</span>
                   </button>
                   <button
                     onClick={() => 
                       setVideoSettings(prev => ({ ...prev, logoPosition: 'top-left' }))
                     }
                     className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 ${
                       videoSettings.logoPosition === 'top-left'
                         ? 'border-[#01411C] bg-green-50'
                         : 'border-gray-200'
                     }`}
                   >
                     <AlignLeft className="w-5 h-5" />
                     <span className="text-xs">أعلى يسار</span>
                   </button>
                 </div>
               </CardContent>
             </Card>
 
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-base">اسم الشركة / المكتب</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex items-center justify-between">
                   <Label>إظهار اسم الشركة</Label>
                   <Switch
                     checked={videoSettings.showCompanyName}
                     onCheckedChange={(checked) => 
                       setVideoSettings(prev => ({ ...prev, showCompanyName: checked }))
                     }
                   />
                 </div>
                 
                 {videoSettings.showCompanyName && (
                   <Input
                     placeholder="اسم الشركة أو المكتب..."
                     value={videoSettings.companyName}
                     onChange={(e) => 
                       setVideoSettings(prev => ({ ...prev, companyName: e.target.value }))
                     }
                   />
                 )}
               </CardContent>
             </Card>
           </TabsContent>
         </Tabs>
       </div>
     </ScrollArea>
   );
 }
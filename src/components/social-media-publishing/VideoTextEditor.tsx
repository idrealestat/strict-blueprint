 /**
  * VideoTextEditor.tsx
  * محرر فيديو تفاعلي مثل سناب شات وتيكتوك
  * - إضافة نصوص وسحبها على الفيديو
  * - تحديد وقت ظهور واختفاء كل نص
  * - إضافة الشعار وسحبه
  * - اختيار الخطوط والألوان
  */
 
import { useState, useRef, useEffect, useCallback } from 'react';
 import { Card, CardContent } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Slider } from '@/components/ui/slider';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Badge } from '@/components/ui/badge';
 import { toast } from 'sonner';
 import {
   Play, Pause, Plus, Trash2, Type, Image, Move,
   Palette, AlignCenter, AlignRight, AlignLeft,
   Bold, Italic, Upload, Eye, EyeOff, GripVertical,
   Clock, ChevronUp, ChevronDown, Copy
 } from 'lucide-react';
 
 // الخطوط المتاحة
 const AVAILABLE_FONTS = [
   { id: 'cairo', name: 'Cairo', nameAr: 'القاهرة', family: 'Cairo, sans-serif' },
   { id: 'tajawal', name: 'Tajawal', nameAr: 'تجوال', family: 'Tajawal, sans-serif' },
   { id: 'almarai', name: 'Almarai', nameAr: 'المراعي', family: 'Almarai, sans-serif' },
   { id: 'noto-arabic', name: 'Noto Arabic', nameAr: 'نوتو عربي', family: '"Noto Sans Arabic", sans-serif' },
   { id: 'arial', name: 'Arial', nameAr: 'أريال', family: 'Arial, sans-serif' },
 ];
 
 // الألوان المتاحة
 const AVAILABLE_COLORS = [
   { id: 'white', name: 'أبيض', color: '#FFFFFF' },
   { id: 'black', name: 'أسود', color: '#000000' },
   { id: 'gold', name: 'ذهبي', color: '#FFD700' },
   { id: 'red', name: 'أحمر', color: '#FF0000' },
   { id: 'green', name: 'أخضر', color: '#00FF00' },
   { id: 'blue', name: 'أزرق', color: '#0066FF' },
   { id: 'yellow', name: 'أصفر', color: '#FFFF00' },
   { id: 'pink', name: 'وردي', color: '#FF69B4' },
   { id: 'purple', name: 'بنفسجي', color: '#9B59B6' },
   { id: 'orange', name: 'برتقالي', color: '#FF6600' },
 ];
 
 // ألوان الخلفية
 const BACKGROUND_STYLES = [
   { id: 'none', name: 'بدون', style: 'transparent' },
   { id: 'solid-black', name: 'أسود', style: 'rgba(0,0,0,0.8)' },
   { id: 'solid-white', name: 'أبيض', style: 'rgba(255,255,255,0.8)' },
   { id: 'gradient-dark', name: 'تدرج داكن', style: 'linear-gradient(135deg, rgba(0,0,0,0.9), rgba(50,50,50,0.7))' },
   { id: 'blur', name: 'ضبابي', style: 'rgba(0,0,0,0.5)' },
 ];
 
 // نوع عنصر النص
 interface TextOverlay {
   id: string;
   text: string;
   x: number; // نسبة مئوية من العرض
   y: number; // نسبة مئوية من الارتفاع
   fontSize: number;
   fontFamily: string;
   color: string;
   backgroundColor: string;
   alignment: 'left' | 'center' | 'right';
   bold: boolean;
   italic: boolean;
   startTime: number; // ثانية
   endTime: number; // ثانية
   visible: boolean;
 }
 
 // نوع الشعار
 interface LogoOverlay {
   url: string;
   x: number;
   y: number;
   width: number;
   height: number;
   startTime: number;
   endTime: number;
   visible: boolean;
 }
 
 interface VideoTextEditorProps {
   onExport?: (data: { textOverlays: TextOverlay[]; logo: LogoOverlay | null }) => void;
 }
 
export default function VideoTextEditor({ onExport }: VideoTextEditorProps) {
   // حالة الفيديو
   const [videoFile, setVideoFile] = useState<File | null>(null);
   const [videoUrl, setVideoUrl] = useState('');
   const [videoDuration, setVideoDuration] = useState(0);
   const [currentTime, setCurrentTime] = useState(0);
   const [isPlaying, setIsPlaying] = useState(false);
   
   // حالة النصوص
   const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
   const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
   
   // حالة الشعار
   const [logo, setLogo] = useState<LogoOverlay | null>(null);
   const [isLogoSelected, setIsLogoSelected] = useState(false);
   
   // حالة السحب
   const [isDragging, setIsDragging] = useState(false);
   const [dragTarget, setDragTarget] = useState<'text' | 'logo' | null>(null);
  const dragPositionRef = useRef<{ x: number; y: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
   
   // المراجع
   const videoRef = useRef<HTMLVideoElement>(null);
   const canvasRef = useRef<HTMLDivElement>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);
   const logoInputRef = useRef<HTMLInputElement>(null);
   
   // النص المحدد حاليًا
   const selectedText = textOverlays.find(t => t.id === selectedTextId);
   
   // رفع الفيديو
   const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
       if (videoUrl) URL.revokeObjectURL(videoUrl);
       setVideoFile(file);
       setVideoUrl(URL.createObjectURL(file));
       setTextOverlays([]);
       setLogo(null);
       setCurrentTime(0);
       toast.success('تم رفع الفيديو');
     }
   };
   
   // رفع الشعار
   const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
       if (!file.type.startsWith('image/')) {
         toast.error('يرجى رفع صورة');
         return;
       }
       const url = URL.createObjectURL(file);
       setLogo({
         url,
         x: 80,
         y: 5,
         width: 60,
         height: 60,
         startTime: 0,
         endTime: videoDuration || 10,
         visible: true,
       });
       toast.success('تم رفع الشعار - اسحبه لتحديد موقعه');
     }
   };
   
   // تحديث مدة الفيديو
   const handleVideoLoaded = () => {
     if (videoRef.current) {
       setVideoDuration(videoRef.current.duration);
       // تحديث endTime للشعار
       if (logo) {
         setLogo(prev => prev ? { ...prev, endTime: videoRef.current!.duration } : null);
       }
     }
   };
   
   // تحديث الوقت الحالي
   const handleTimeUpdate = () => {
     if (videoRef.current) {
       setCurrentTime(videoRef.current.currentTime);
     }
   };
   
   // تشغيل/إيقاف الفيديو
   const togglePlay = () => {
     if (videoRef.current) {
       if (isPlaying) {
         videoRef.current.pause();
       } else {
         videoRef.current.play();
       }
       setIsPlaying(!isPlaying);
     }
   };
   
   // الانتقال لوقت معين
   const seekTo = (time: number) => {
     if (videoRef.current) {
       videoRef.current.currentTime = time;
       setCurrentTime(time);
     }
   };
   
   // إضافة نص جديد
   const addNewText = () => {
     const newText: TextOverlay = {
       id: `text-${Date.now()}`,
       text: 'اكتب هنا',
       x: 50,
       y: 50,
       fontSize: 24,
       fontFamily: 'Cairo, sans-serif',
       color: '#FFFFFF',
       backgroundColor: 'rgba(0,0,0,0.5)',
       alignment: 'center',
       bold: false,
       italic: false,
       startTime: currentTime,
       endTime: Math.min(currentTime + 3, videoDuration || 10),
       visible: true,
     };
     setTextOverlays(prev => [...prev, newText]);
     setSelectedTextId(newText.id);
     toast.success('تم إضافة نص - اضغط عليه للتعديل');
   };
   
   // تحديث نص
   const updateText = (id: string, updates: Partial<TextOverlay>) => {
     setTextOverlays(prev => prev.map(t => 
       t.id === id ? { ...t, ...updates } : t
     ));
   };
   
   // حذف نص
   const deleteText = (id: string) => {
     setTextOverlays(prev => prev.filter(t => t.id !== id));
     if (selectedTextId === id) setSelectedTextId(null);
     toast.success('تم حذف النص');
   };
   
   // نسخ نص
   const duplicateText = (id: string) => {
     const original = textOverlays.find(t => t.id === id);
     if (original) {
       const newText: TextOverlay = {
         ...original,
         id: `text-${Date.now()}`,
         y: Math.min(original.y + 10, 90),
       };
       setTextOverlays(prev => [...prev, newText]);
       setSelectedTextId(newText.id);
       toast.success('تم نسخ النص');
     }
   };
   
   // بدء السحب
   const handleDragStart = (e: React.MouseEvent | React.TouchEvent, target: 'text' | 'logo', id?: string) => {
     e.preventDefault();
     e.stopPropagation();
    
    // منع التمرير أثناء السحب
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    
     setIsDragging(true);
     setDragTarget(target);
     if (target === 'text' && id) {
       setSelectedTextId(id);
       setIsLogoSelected(false);
     } else if (target === 'logo') {
       setIsLogoSelected(true);
       setSelectedTextId(null);
     }
   };
   
   // أثناء السحب
   const handleDrag = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !canvasRef.current || !dragTarget) return;
    
    e.preventDefault();
     
     const rect = canvasRef.current.getBoundingClientRect();
     let clientX: number, clientY: number;
     
     if ('touches' in e) {
       clientX = e.touches[0].clientX;
       clientY = e.touches[0].clientY;
     } else {
       clientX = e.clientX;
       clientY = e.clientY;
     }
     
     const x = ((clientX - rect.left) / rect.width) * 100;
     const y = ((clientY - rect.top) / rect.height) * 100;
     
     // تقييد الموقع ضمن الحدود
     const clampedX = Math.max(5, Math.min(95, x));
     const clampedY = Math.max(5, Math.min(95, y));
     
    // تخزين الموقع الجديد
    dragPositionRef.current = { x: clampedX, y: clampedY };
    
    // استخدام requestAnimationFrame للتحديث المرئي السلس
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      if (dragPositionRef.current) {
        const { x: newX, y: newY } = dragPositionRef.current;
        
        if (dragTarget === 'text' && selectedTextId) {
          setTextOverlays(prev => prev.map(t => 
            t.id === selectedTextId ? { ...t, x: newX, y: newY } : t
          ));
        } else if (dragTarget === 'logo') {
          setLogo(prev => prev ? { ...prev, x: newX, y: newY } : null);
        }
      }
    });
  }, [isDragging, dragTarget, selectedTextId]);
   
   // انتهاء السحب
   const handleDragEnd = useCallback(() => {
    // إعادة تفعيل التمرير
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
    
    // إلغاء أي animation frame معلق
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    dragPositionRef.current = null;
     setIsDragging(false);
     setDragTarget(null);
   }, []);
   
   // إضافة وإزالة مستمعي الأحداث
   useEffect(() => {
     if (isDragging) {
      window.addEventListener('mousemove', handleDrag, { passive: false });
       window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDrag, { passive: false });
       window.addEventListener('touchend', handleDragEnd);
     }
     return () => {
       window.removeEventListener('mousemove', handleDrag);
       window.removeEventListener('mouseup', handleDragEnd);
       window.removeEventListener('touchmove', handleDrag);
       window.removeEventListener('touchend', handleDragEnd);
      // تنظيف عند الخروج
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
     };
   }, [isDragging, handleDrag, handleDragEnd]);
  
  // تنظيف عند إلغاء تحميل المكون
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, []);
   
   // هل النص مرئي في الوقت الحالي؟
   const isTextVisible = (text: TextOverlay) => {
     return text.visible && currentTime >= text.startTime && currentTime <= text.endTime;
   };
   
   // هل الشعار مرئي؟
   const isLogoVisible = () => {
     return logo && logo.visible && currentTime >= logo.startTime && currentTime <= logo.endTime;
   };
   
   // تنسيق الوقت
   const formatTime = (seconds: number) => {
     const mins = Math.floor(seconds / 60);
     const secs = Math.floor(seconds % 60);
     return `${mins}:${secs.toString().padStart(2, '0')}`;
   };
 
   return (
    <div className="space-y-4" dir="rtl">
       {/* منطقة رفع الفيديو */}
       {!videoUrl && (
         <Card className="border-2 border-dashed border-primary/30 hover:border-primary/50 transition-colors">
           <CardContent className="p-8">
             <input
               ref={fileInputRef}
               type="file"
               accept="video/*"
               onChange={handleVideoUpload}
               className="hidden"
             />
             <div 
               className="flex flex-col items-center gap-4 cursor-pointer"
               onClick={() => fileInputRef.current?.click()}
             >
               <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                 <Upload className="w-10 h-10 text-primary" />
               </div>
               <div className="text-center">
                 <p className="text-lg font-semibold">اضغط لرفع فيديو</p>
                 <p className="text-sm text-muted-foreground">MP4, MOV, WebM</p>
               </div>
             </div>
           </CardContent>
         </Card>
       )}
 
       {/* محرر الفيديو */}
       {videoUrl && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
           {/* منطقة الفيديو والتحرير */}
           <div className="lg:col-span-2 space-y-3">
             {/* الفيديو مع العناصر */}
             <Card className="overflow-hidden bg-black">
               <div 
                 ref={canvasRef}
                  className="relative mx-auto touch-none"
                 style={{ aspectRatio: '9/16', maxHeight: '500px' }}
               >
                 <video
                   ref={videoRef}
                   src={videoUrl}
                   className="w-full h-full object-contain"
                   onLoadedMetadata={handleVideoLoaded}
                   onTimeUpdate={handleTimeUpdate}
                   onPlay={() => setIsPlaying(true)}
                   onPause={() => setIsPlaying(false)}
                   playsInline
                 />
                 
                 {/* طبقة النصوص */}
                 {textOverlays.map(text => (
                   isTextVisible(text) && (
                     <div
                       key={text.id}
                       className={`absolute cursor-move select-none transition-all ${
                         selectedTextId === text.id ? 'ring-2 ring-primary ring-offset-2' : ''
                       }`}
                       style={{
                         left: `${text.x}%`,
                         top: `${text.y}%`,
                         transform: 'translate(-50%, -50%)',
                         fontSize: `${text.fontSize}px`,
                         fontFamily: text.fontFamily,
                         color: text.color,
                         background: text.backgroundColor,
                         padding: '8px 16px',
                         borderRadius: '8px',
                         textAlign: text.alignment,
                         fontWeight: text.bold ? 'bold' : 'normal',
                         fontStyle: text.italic ? 'italic' : 'normal',
                         maxWidth: '80%',
                         wordBreak: 'break-word',
                         zIndex: selectedTextId === text.id ? 20 : 10,
                       }}
                       onMouseDown={(e) => handleDragStart(e, 'text', text.id)}
                       onTouchStart={(e) => handleDragStart(e, 'text', text.id)}
                       onClick={() => {
                         setSelectedTextId(text.id);
                         setIsLogoSelected(false);
                       }}
                     >
                       {text.text}
                       {selectedTextId === text.id && (
                         <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                           <Move className="w-3 h-3" />
                         </div>
                       )}
                     </div>
                   )
                 ))}
                 
                 {/* الشعار */}
                 {isLogoVisible() && logo && (
                   <div
                     className={`absolute cursor-move select-none ${
                       isLogoSelected ? 'ring-2 ring-primary ring-offset-2' : ''
                     }`}
                     style={{
                       left: `${logo.x}%`,
                       top: `${logo.y}%`,
                       transform: 'translate(-50%, -50%)',
                       width: `${logo.width}px`,
                       height: `${logo.height}px`,
                       zIndex: isLogoSelected ? 20 : 10,
                     }}
                     onMouseDown={(e) => handleDragStart(e, 'logo')}
                     onTouchStart={(e) => handleDragStart(e, 'logo')}
                     onClick={() => {
                       setIsLogoSelected(true);
                       setSelectedTextId(null);
                     }}
                   >
                     <img 
                       src={logo.url} 
                       alt="الشعار" 
                       className="w-full h-full object-contain rounded-lg shadow-lg"
                       draggable={false}
                     />
                     {isLogoSelected && (
                       <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                         <Move className="w-3 h-3" />
                       </div>
                     )}
                   </div>
                 )}
               </div>
             </Card>
             
             {/* شريط التحكم */}
             <Card className="p-3">
               <div className="flex items-center gap-3">
                 <Button size="icon" variant="outline" onClick={togglePlay}>
                   {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                 </Button>
                 
                 <span className="text-sm font-mono min-w-[50px]">
                   {formatTime(currentTime)}
                 </span>
                 
                 <Slider
                   value={[currentTime]}
                   min={0}
                   max={videoDuration || 1}
                   step={0.1}
                   onValueChange={([val]) => seekTo(val)}
                   className="flex-1"
                 />
                 
                 <span className="text-sm font-mono min-w-[50px] text-muted-foreground">
                   {formatTime(videoDuration)}
                 </span>
               </div>
             </Card>
             
             {/* أزرار الإضافة */}
             <div className="flex gap-2">
               <Button onClick={addNewText} className="flex-1 gap-2">
                 <Type className="w-4 h-4" />
                 إضافة نص
               </Button>
               
               <input
                 ref={logoInputRef}
                 type="file"
                 accept="image/*"
                 onChange={handleLogoUpload}
                 className="hidden"
               />
               <Button 
                 variant="outline" 
                 onClick={() => logoInputRef.current?.click()}
                 className="flex-1 gap-2"
               >
                 <Image className="w-4 h-4" />
                 {logo ? 'تغيير الشعار' : 'إضافة شعار'}
               </Button>
               
               <Button 
                 variant="outline"
                 onClick={() => fileInputRef.current?.click()}
                 className="gap-2"
               >
                 <Upload className="w-4 h-4" />
                 فيديو جديد
               </Button>
             </div>
           </div>
           
           {/* لوحة التحكم */}
           <div className="space-y-3">
             <ScrollArea className="h-[600px]">
               <div className="space-y-3 pl-3">
                 {/* تحرير النص المحدد */}
                 {selectedText && (
                   <Card className="p-4 space-y-4 border-primary">
                     <div className="flex items-center justify-between">
                       <h3 className="font-semibold flex items-center gap-2">
                         <Type className="w-4 h-4" />
                         تحرير النص
                       </h3>
                       <div className="flex gap-1">
                         <Button size="icon" variant="ghost" onClick={() => duplicateText(selectedText.id)}>
                           <Copy className="w-4 h-4" />
                         </Button>
                         <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteText(selectedText.id)}>
                           <Trash2 className="w-4 h-4" />
                         </Button>
                       </div>
                     </div>
                     
                     {/* محتوى النص */}
                     <div>
                       <Label className="text-xs">النص</Label>
                       <Input
                         value={selectedText.text}
                         onChange={(e) => updateText(selectedText.id, { text: e.target.value })}
                         className="mt-1"
                         dir="rtl"
                       />
                     </div>
                     
                     {/* حجم الخط */}
                     <div>
                       <Label className="text-xs">حجم الخط: {selectedText.fontSize}px</Label>
                       <Slider
                         value={[selectedText.fontSize]}
                         min={12}
                         max={72}
                         step={1}
                         onValueChange={([val]) => updateText(selectedText.id, { fontSize: val })}
                         className="mt-2"
                       />
                     </div>
                     
                     {/* الخط */}
                     <div>
                       <Label className="text-xs">الخط</Label>
                       <div className="grid grid-cols-2 gap-1 mt-1">
                         {AVAILABLE_FONTS.map(font => (
                           <Button
                             key={font.id}
                             size="sm"
                             variant={selectedText.fontFamily === font.family ? 'default' : 'outline'}
                             onClick={() => updateText(selectedText.id, { fontFamily: font.family })}
                             className="text-xs"
                             style={{ fontFamily: font.family }}
                           >
                             {font.nameAr}
                           </Button>
                         ))}
                       </div>
                     </div>
                     
                     {/* لون النص */}
                     <div>
                       <Label className="text-xs">لون النص</Label>
                       <div className="flex flex-wrap gap-1 mt-1">
                         {AVAILABLE_COLORS.map(c => (
                           <button
                             key={c.id}
                             className={`w-7 h-7 rounded-full border-2 ${
                               selectedText.color === c.color ? 'border-primary ring-2 ring-primary/50' : 'border-border'
                             }`}
                             style={{ backgroundColor: c.color }}
                             onClick={() => updateText(selectedText.id, { color: c.color })}
                             title={c.name}
                           />
                         ))}
                       </div>
                     </div>
                     
                     {/* خلفية النص */}
                     <div>
                       <Label className="text-xs">خلفية النص</Label>
                       <div className="grid grid-cols-3 gap-1 mt-1">
                         {BACKGROUND_STYLES.map(bg => (
                           <Button
                             key={bg.id}
                             size="sm"
                             variant={selectedText.backgroundColor === bg.style ? 'default' : 'outline'}
                             onClick={() => updateText(selectedText.id, { backgroundColor: bg.style })}
                             className="text-xs"
                           >
                             {bg.name}
                           </Button>
                         ))}
                       </div>
                     </div>
                     
                     {/* التنسيق */}
                     <div className="flex gap-2">
                       <Button
                         size="icon"
                         variant={selectedText.bold ? 'default' : 'outline'}
                         onClick={() => updateText(selectedText.id, { bold: !selectedText.bold })}
                       >
                         <Bold className="w-4 h-4" />
                       </Button>
                       <Button
                         size="icon"
                         variant={selectedText.italic ? 'default' : 'outline'}
                         onClick={() => updateText(selectedText.id, { italic: !selectedText.italic })}
                       >
                         <Italic className="w-4 h-4" />
                       </Button>
                       <div className="flex-1" />
                       <Button
                         size="icon"
                         variant={selectedText.alignment === 'right' ? 'default' : 'outline'}
                         onClick={() => updateText(selectedText.id, { alignment: 'right' })}
                       >
                         <AlignRight className="w-4 h-4" />
                       </Button>
                       <Button
                         size="icon"
                         variant={selectedText.alignment === 'center' ? 'default' : 'outline'}
                         onClick={() => updateText(selectedText.id, { alignment: 'center' })}
                       >
                         <AlignCenter className="w-4 h-4" />
                       </Button>
                       <Button
                         size="icon"
                         variant={selectedText.alignment === 'left' ? 'default' : 'outline'}
                         onClick={() => updateText(selectedText.id, { alignment: 'left' })}
                       >
                         <AlignLeft className="w-4 h-4" />
                       </Button>
                     </div>
                     
                     {/* التوقيت */}
                     <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                       <Label className="text-xs flex items-center gap-1">
                         <Clock className="w-3 h-3" />
                         توقيت الظهور
                       </Label>
                       <div className="grid grid-cols-2 gap-2">
                         <div>
                           <Label className="text-[10px] text-muted-foreground">يبدأ</Label>
                           <div className="flex items-center gap-1">
                             <Input
                               type="number"
                               value={selectedText.startTime.toFixed(1)}
                               onChange={(e) => updateText(selectedText.id, { startTime: parseFloat(e.target.value) || 0 })}
                               className="h-8 text-xs"
                               min={0}
                               max={videoDuration}
                               step={0.1}
                             />
                             <span className="text-xs">ث</span>
                           </div>
                         </div>
                         <div>
                           <Label className="text-[10px] text-muted-foreground">ينتهي</Label>
                           <div className="flex items-center gap-1">
                             <Input
                               type="number"
                               value={selectedText.endTime.toFixed(1)}
                               onChange={(e) => updateText(selectedText.id, { endTime: parseFloat(e.target.value) || videoDuration })}
                               className="h-8 text-xs"
                               min={selectedText.startTime}
                               max={videoDuration}
                               step={0.1}
                             />
                             <span className="text-xs">ث</span>
                           </div>
                         </div>
                       </div>
                       <Button 
                         size="sm" 
                         variant="outline" 
                         className="w-full text-xs"
                         onClick={() => updateText(selectedText.id, { startTime: currentTime })}
                       >
                         تعيين البداية للوقت الحالي
                       </Button>
                     </div>
                     
                     {/* إظهار/إخفاء */}
                     <Button
                       variant="outline"
                       className="w-full gap-2"
                       onClick={() => updateText(selectedText.id, { visible: !selectedText.visible })}
                     >
                       {selectedText.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                       {selectedText.visible ? 'مرئي' : 'مخفي'}
                     </Button>
                   </Card>
                 )}
                 
                 {/* تحرير الشعار */}
                 {isLogoSelected && logo && (
                   <Card className="p-4 space-y-4 border-primary">
                     <div className="flex items-center justify-between">
                       <h3 className="font-semibold flex items-center gap-2">
                         <Image className="w-4 h-4" />
                         إعدادات الشعار
                       </h3>
                       <Button 
                         size="icon" 
                         variant="ghost" 
                         className="text-destructive"
                         onClick={() => {
                           setLogo(null);
                           setIsLogoSelected(false);
                         }}
                       >
                         <Trash2 className="w-4 h-4" />
                       </Button>
                     </div>
                     
                     {/* حجم الشعار */}
                     <div>
                       <Label className="text-xs">الحجم: {logo.width}px</Label>
                       <Slider
                         value={[logo.width]}
                         min={30}
                         max={150}
                         step={5}
                         onValueChange={([val]) => setLogo(prev => prev ? { ...prev, width: val, height: val } : null)}
                         className="mt-2"
                       />
                     </div>
                     
                     {/* توقيت الشعار */}
                     <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                       <Label className="text-xs flex items-center gap-1">
                         <Clock className="w-3 h-3" />
                         توقيت الظهور
                       </Label>
                       <div className="grid grid-cols-2 gap-2">
                         <div>
                           <Label className="text-[10px] text-muted-foreground">يبدأ</Label>
                           <div className="flex items-center gap-1">
                             <Input
                               type="number"
                               value={logo.startTime.toFixed(1)}
                               onChange={(e) => setLogo(prev => prev ? { ...prev, startTime: parseFloat(e.target.value) || 0 } : null)}
                               className="h-8 text-xs"
                               min={0}
                               max={videoDuration}
                               step={0.1}
                             />
                             <span className="text-xs">ث</span>
                           </div>
                         </div>
                         <div>
                           <Label className="text-[10px] text-muted-foreground">ينتهي</Label>
                           <div className="flex items-center gap-1">
                             <Input
                               type="number"
                               value={logo.endTime.toFixed(1)}
                               onChange={(e) => setLogo(prev => prev ? { ...prev, endTime: parseFloat(e.target.value) || videoDuration } : null)}
                               className="h-8 text-xs"
                               min={logo.startTime}
                               max={videoDuration}
                               step={0.1}
                             />
                             <span className="text-xs">ث</span>
                           </div>
                         </div>
                       </div>
                     </div>
                     
                     {/* إظهار/إخفاء */}
                     <Button
                       variant="outline"
                       className="w-full gap-2"
                       onClick={() => setLogo(prev => prev ? { ...prev, visible: !prev.visible } : null)}
                     >
                       {logo.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                       {logo.visible ? 'مرئي' : 'مخفي'}
                     </Button>
                   </Card>
                 )}
                 
                 {/* قائمة النصوص */}
                 <Card className="p-4">
                   <h3 className="font-semibold mb-3 flex items-center gap-2">
                     <GripVertical className="w-4 h-4" />
                     العناصر ({textOverlays.length})
                   </h3>
                   
                   {textOverlays.length === 0 && !logo ? (
                     <p className="text-sm text-muted-foreground text-center py-4">
                       اضغط "إضافة نص" للبدء
                     </p>
                   ) : (
                     <div className="space-y-2">
                       {textOverlays.map((text, index) => (
                         <div
                           key={text.id}
                           className={`p-2 rounded-lg border cursor-pointer transition-all ${
                             selectedTextId === text.id 
                               ? 'border-primary bg-primary/5' 
                               : 'border-border hover:border-primary/50'
                           }`}
                           onClick={() => {
                             setSelectedTextId(text.id);
                             setIsLogoSelected(false);
                             seekTo(text.startTime);
                           }}
                         >
                           <div className="flex items-center gap-2">
                             <Badge variant="outline" className="text-[10px]">
                               {index + 1}
                             </Badge>
                             <span className="text-sm truncate flex-1">{text.text}</span>
                             <span className="text-[10px] text-muted-foreground">
                               {formatTime(text.startTime)} - {formatTime(text.endTime)}
                             </span>
                           </div>
                         </div>
                       ))}
                       
                       {logo && (
                         <div
                           className={`p-2 rounded-lg border cursor-pointer transition-all ${
                             isLogoSelected 
                               ? 'border-primary bg-primary/5' 
                               : 'border-border hover:border-primary/50'
                           }`}
                           onClick={() => {
                             setIsLogoSelected(true);
                             setSelectedTextId(null);
                           }}
                         >
                           <div className="flex items-center gap-2">
                             <Image className="w-4 h-4 text-muted-foreground" />
                             <span className="text-sm flex-1">الشعار</span>
                             <span className="text-[10px] text-muted-foreground">
                               {formatTime(logo.startTime)} - {formatTime(logo.endTime)}
                             </span>
                           </div>
                         </div>
                       )}
                     </div>
                   )}
                 </Card>
                 
                 {/* نصائح */}
                 <Card className="p-4 bg-muted/30">
                   <h4 className="text-sm font-semibold mb-2">💡 نصائح</h4>
                   <ul className="text-xs text-muted-foreground space-y-1">
                     <li>• اسحب النص أو الشعار لتحريكه</li>
                     <li>• اضغط على عنصر لتحديده وتعديله</li>
                     <li>• حدد وقت الظهور والاختفاء لكل عنصر</li>
                     <li>• استخدم الخطوط والألوان المختلفة</li>
                   </ul>
                 </Card>
               </div>
             </ScrollArea>
           </div>
         </div>
       )}
     </div>
   );
}
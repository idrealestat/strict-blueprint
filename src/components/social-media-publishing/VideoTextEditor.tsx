 /**
  * VideoTextEditor.tsx
  * محرر فيديو تفاعلي بأسلوب سناب شات وتيك توك
  * - كل الأدوات كـ overlay شفاف على الفيديو
  * - شريط الألوان أسفل الفيديو مباشرة
  * - النصوص قابلة للسحب
  */
 
 import { useState, useRef, useEffect, useCallback } from 'react';
 import { Button } from '@/components/ui/button';
 import { Slider } from '@/components/ui/slider';
 import { toast } from 'sonner';
 import {
   Play, Pause, Trash2, Type, Image, 
   Bold, Italic, Upload, X, Check,
   Clock, Minus, Plus, Undo2, Move
 } from 'lucide-react';
 
 // الخطوط المتاحة
 const AVAILABLE_FONTS = [
   { id: 'cairo', name: 'القاهرة', family: 'Cairo, sans-serif' },
   { id: 'tajawal', name: 'تجوال', family: 'Tajawal, sans-serif' },
   { id: 'almarai', name: 'المراعي', family: 'Almarai, sans-serif' },
   { id: 'arial', name: 'أريال', family: 'Arial, sans-serif' },
 ];
 
 // الألوان المتاحة
 const AVAILABLE_COLORS = [
   '#FFFFFF', '#000000', '#FFD700', '#FF0000', 
   '#00FF00', '#0066FF', '#FF69B4', '#9B59B6', 
   '#FF6600', '#00CED1', '#01411C'
 ];
 
 // نوع عنصر النص
 interface TextOverlay {
   id: string;
   text: string;
   x: number;
   y: number;
   fontSize: number;
   fontFamily: string;
   color: string;
   backgroundColor: string;
   bold: boolean;
   italic: boolean;
   startTime: number;
   endTime: number;
   visible: boolean;
 }
 
 // نوع الشعار
 interface LogoOverlay {
   url: string;
   x: number;
   y: number;
   size: number;
   startTime: number;
   endTime: number;
   visible: boolean;
 }
 
 interface VideoTextEditorProps {
   onExport?: (data: { textOverlays: TextOverlay[]; logo: LogoOverlay | null; videoSrc: string | null }) => void;
 }
 
 export default function VideoTextEditor({ onExport }: VideoTextEditorProps) {
   // حالة الفيديو
   const [videoUrl, setVideoUrl] = useState('');
   const [videoDuration, setVideoDuration] = useState(0);
   const [currentTime, setCurrentTime] = useState(0);
   const [isPlaying, setIsPlaying] = useState(false);
   
   // حالة النصوص
   const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
   const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
   const [isEditingText, setIsEditingText] = useState(false);
   const [editingValue, setEditingValue] = useState('');
   
   // حالة الشعار
   const [logo, setLogo] = useState<LogoOverlay | null>(null);
   const [isLogoSelected, setIsLogoSelected] = useState(false);
   
   // أدوات التحكم المعروضة
   const [showColorPicker, setShowColorPicker] = useState(false);
   const [showFontPicker, setShowFontPicker] = useState(false);
   const [showTimingPanel, setShowTimingPanel] = useState(false);
   
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
   const textInputRef = useRef<HTMLInputElement>(null);
   
   const STORAGE_KEY = 'video-editor-autosave';
   const selectedText = textOverlays.find(t => t.id === selectedTextId);
   
   // استعادة البيانات المحفوظة
   useEffect(() => {
     try {
       const saved = localStorage.getItem(STORAGE_KEY);
       if (saved) {
         const data = JSON.parse(saved);
         if (data.textOverlays) setTextOverlays(data.textOverlays);
         if (data.logo) setLogo(data.logo);
         toast.success('تم استعادة المحتوى المحفوظ');
       }
     } catch (e) {}
   }, []);
   
   // حفظ تلقائي
   useEffect(() => {
     if (textOverlays.length > 0 || logo) {
       localStorage.setItem(STORAGE_KEY, JSON.stringify({ textOverlays, logo, savedAt: new Date().toISOString() }));
     }
     onExport?.({ textOverlays, logo, videoSrc: videoUrl || null });
   }, [textOverlays, logo, videoUrl, onExport]);
   
   // رفع الفيديو
   const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
       if (videoUrl) URL.revokeObjectURL(videoUrl);
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
     if (file && file.type.startsWith('image/')) {
       setLogo({
         url: URL.createObjectURL(file),
         x: 85, y: 10, size: 50,
         startTime: 0, endTime: videoDuration || 10,
         visible: true,
       });
       toast.success('تم رفع الشعار');
     }
   };
   
   const handleVideoLoaded = () => {
     if (videoRef.current) {
       setVideoDuration(videoRef.current.duration);
       if (logo) setLogo(prev => prev ? { ...prev, endTime: videoRef.current!.duration } : null);
     }
   };
   
   const handleTimeUpdate = () => {
     if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
   };
   
   const togglePlay = () => {
     if (videoRef.current) {
       if (isPlaying) videoRef.current.pause();
       else videoRef.current.play();
       setIsPlaying(!isPlaying);
     }
   };
   
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
       text: 'اضغط للكتابة',
       x: 50, y: 50,
       fontSize: 28,
       fontFamily: 'Cairo, sans-serif',
       color: '#FFFFFF',
       backgroundColor: 'rgba(0,0,0,0.6)',
       bold: false, italic: false,
       startTime: currentTime,
       endTime: Math.min(currentTime + 5, videoDuration || 10),
       visible: true,
     };
     setTextOverlays(prev => [...prev, newText]);
     setSelectedTextId(newText.id);
     setIsLogoSelected(false);
   };
   
   const updateText = (id: string, updates: Partial<TextOverlay>) => {
     setTextOverlays(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
   };
   
   const deleteSelected = () => {
     if (selectedTextId) {
       setTextOverlays(prev => prev.filter(t => t.id !== selectedTextId));
       setSelectedTextId(null);
       toast.success('تم الحذف');
     } else if (isLogoSelected) {
       setLogo(null);
       setIsLogoSelected(false);
       toast.success('تم حذف الشعار');
     }
   };
   
   // بدء تحرير النص
   const startEditingText = (text: TextOverlay) => {
     setEditingValue(text.text);
     setIsEditingText(true);
     setTimeout(() => textInputRef.current?.focus(), 100);
   };
   
   const confirmTextEdit = () => {
     if (selectedTextId && editingValue.trim()) {
       updateText(selectedTextId, { text: editingValue });
     }
     setIsEditingText(false);
   };
   
   // بدء السحب
   const handleDragStart = (e: React.MouseEvent | React.TouchEvent, target: 'text' | 'logo', id?: string) => {
     e.preventDefault();
     e.stopPropagation();
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
     setShowColorPicker(false);
     setShowFontPicker(false);
     setShowTimingPanel(false);
   };
   
   const handleDrag = useCallback((e: MouseEvent | TouchEvent) => {
     if (!isDragging || !canvasRef.current || !dragTarget) return;
     e.preventDefault();
     
     const rect = canvasRef.current.getBoundingClientRect();
     const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
     const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
     
     const x = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
     const y = Math.max(5, Math.min(95, ((clientY - rect.top) / rect.height) * 100));
     
     dragPositionRef.current = { x, y };
     
     if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
     animationFrameRef.current = requestAnimationFrame(() => {
       if (!dragPositionRef.current) return;
       const { x: newX, y: newY } = dragPositionRef.current;
       if (dragTarget === 'text' && selectedTextId) {
         setTextOverlays(prev => prev.map(t => t.id === selectedTextId ? { ...t, x: newX, y: newY } : t));
       } else if (dragTarget === 'logo') {
         setLogo(prev => prev ? { ...prev, x: newX, y: newY } : null);
       }
     });
   }, [isDragging, dragTarget, selectedTextId]);
   
   const handleDragEnd = useCallback(() => {
     document.body.style.overflow = '';
     document.body.style.touchAction = '';
     if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
     dragPositionRef.current = null;
     setIsDragging(false);
     setDragTarget(null);
   }, []);
   
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
       document.body.style.overflow = '';
       document.body.style.touchAction = '';
     };
   }, [isDragging, handleDrag, handleDragEnd]);
   
   const isTextVisible = (text: TextOverlay) => text.visible && currentTime >= text.startTime && currentTime <= text.endTime;
   const isLogoVisible = () => logo && logo.visible && currentTime >= logo.startTime && currentTime <= logo.endTime;
   const formatTime = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
   
   const clearSelection = () => {
     setSelectedTextId(null);
     setIsLogoSelected(false);
     setShowColorPicker(false);
     setShowFontPicker(false);
     setShowTimingPanel(false);
   };
 
   return (
     <div className="relative w-full" dir="rtl">
       {/* منطقة رفع الفيديو */}
       {!videoUrl && (
         <div 
           className="aspect-[9/16] max-h-[70vh] bg-gradient-to-b from-muted to-muted/50 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer border-2 border-dashed border-primary/30 hover:border-primary/60 transition-all"
           onClick={() => fileInputRef.current?.click()}
         >
           <input ref={fileInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
           <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
             <Upload className="w-10 h-10 text-primary" />
           </div>
           <p className="text-lg font-bold">اضغط لرفع فيديو</p>
           <p className="text-sm text-muted-foreground">MP4, MOV, WebM</p>
         </div>
       )}
 
       {/* محرر الفيديو بأسلوب سناب/تيك توك */}
       {videoUrl && (
         <div className="relative">
           {/* منطقة الفيديو */}
           <div 
             ref={canvasRef}
             className="relative aspect-[9/16] max-h-[70vh] bg-black rounded-2xl overflow-hidden touch-none"
             onClick={(e) => {
               if (e.target === e.currentTarget || e.target === videoRef.current) {
                 clearSelection();
               }
             }}
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
                   className={`absolute cursor-move select-none transition-shadow ${
                     selectedTextId === text.id ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent' : ''
                   }`}
                   style={{
                     left: `${text.x}%`, top: `${text.y}%`,
                     transform: 'translate(-50%, -50%)',
                     fontSize: `${text.fontSize}px`,
                     fontFamily: text.fontFamily,
                     color: text.color,
                     background: text.backgroundColor,
                     padding: '8px 16px',
                     borderRadius: '8px',
                     fontWeight: text.bold ? 'bold' : 'normal',
                     fontStyle: text.italic ? 'italic' : 'normal',
                     maxWidth: '85%',
                     textAlign: 'center',
                     zIndex: selectedTextId === text.id ? 20 : 10,
                   }}
                   onMouseDown={(e) => handleDragStart(e, 'text', text.id)}
                   onTouchStart={(e) => handleDragStart(e, 'text', text.id)}
                   onDoubleClick={() => startEditingText(text)}
                 >
                   {text.text}
                 </div>
               )
             ))}
             
             {/* الشعار */}
             {isLogoVisible() && logo && (
               <div
                 className={`absolute cursor-move select-none ${
                   isLogoSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent' : ''
                 }`}
                 style={{
                   left: `${logo.x}%`, top: `${logo.y}%`,
                   transform: 'translate(-50%, -50%)',
                   width: `${logo.size}px`, height: `${logo.size}px`,
                   zIndex: isLogoSelected ? 20 : 10,
                 }}
                 onMouseDown={(e) => handleDragStart(e, 'logo')}
                 onTouchStart={(e) => handleDragStart(e, 'logo')}
               >
                 <img src={logo.url} alt="الشعار" className="w-full h-full object-contain rounded-lg" draggable={false} />
               </div>
             )}
             
             {/* شريط الأدوات العلوي - شفاف */}
             <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-30 pointer-events-none">
               {/* أزرار الإضافة */}
               <div className="flex gap-2 pointer-events-auto">
                 <Button size="icon" variant="secondary" className="bg-black/50 hover:bg-black/70 text-white border-0 backdrop-blur-sm" onClick={addNewText}>
                   <Type className="w-5 h-5" />
                 </Button>
                 <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                 <Button size="icon" variant="secondary" className="bg-black/50 hover:bg-black/70 text-white border-0 backdrop-blur-sm" onClick={() => logoInputRef.current?.click()}>
                   <Image className="w-5 h-5" />
                 </Button>
               </div>
               
               {/* زر تغيير الفيديو */}
               <Button size="icon" variant="secondary" className="bg-black/50 hover:bg-black/70 text-white border-0 backdrop-blur-sm pointer-events-auto" onClick={() => fileInputRef.current?.click()}>
                 <Undo2 className="w-5 h-5" />
               </Button>
               <input ref={fileInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
             </div>
             
             {/* شريط التشغيل السفلي */}
             <div className="absolute bottom-3 left-3 right-3 z-30">
               <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-2">
                 <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20" onClick={togglePlay}>
                   {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                 </Button>
                 <span className="text-xs text-white/80 min-w-[35px]">{formatTime(currentTime)}</span>
                 <Slider
                   value={[currentTime]}
                   min={0}
                   max={videoDuration || 1}
                   step={0.1}
                   onValueChange={([val]) => seekTo(val)}
                   className="flex-1"
                 />
                 <span className="text-xs text-white/60 min-w-[35px]">{formatTime(videoDuration)}</span>
               </div>
             </div>
             
             {/* حقل تحرير النص - overlay */}
             {isEditingText && (
               <div className="absolute inset-0 bg-black/70 z-40 flex items-center justify-center p-4">
                 <div className="w-full max-w-sm space-y-3">
                   <input
                     ref={textInputRef}
                     value={editingValue}
                     onChange={(e) => setEditingValue(e.target.value)}
                     className="w-full bg-white/10 border border-white/30 text-white text-center text-xl p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50"
                     placeholder="اكتب النص هنا..."
                     dir="rtl"
                   />
                   <div className="flex gap-2 justify-center">
                     <Button size="icon" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white" onClick={() => setIsEditingText(false)}>
                       <X className="w-5 h-5" />
                     </Button>
                     <Button size="icon" className="bg-primary hover:bg-primary/80" onClick={confirmTextEdit}>
                       <Check className="w-5 h-5" />
                     </Button>
                   </div>
                 </div>
               </div>
             )}
           </div>
           
           {/* شريط الأدوات للعنصر المحدد - أسفل الفيديو */}
           {(selectedTextId || isLogoSelected) && !isEditingText && (
             <div className="mt-3 bg-card rounded-xl p-3 space-y-3 border animate-fade-in">
               {/* صف الأزرار الرئيسية */}
               <div className="flex items-center gap-2 flex-wrap">
                 {selectedText && (
                   <>
                     <Button size="sm" variant={showColorPicker ? 'default' : 'outline'} className="gap-1" onClick={() => { setShowColorPicker(!showColorPicker); setShowFontPicker(false); setShowTimingPanel(false); }}>
                       <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: selectedText.color }} />
                       اللون
                     </Button>
                     <Button size="sm" variant={showFontPicker ? 'default' : 'outline'} onClick={() => { setShowFontPicker(!showFontPicker); setShowColorPicker(false); setShowTimingPanel(false); }}>
                       الخط
                     </Button>
                     <Button size="sm" variant={selectedText.bold ? 'default' : 'outline'} onClick={() => updateText(selectedText.id, { bold: !selectedText.bold })}>
                       <Bold className="w-4 h-4" />
                     </Button>
                     <Button size="sm" variant={selectedText.italic ? 'default' : 'outline'} onClick={() => updateText(selectedText.id, { italic: !selectedText.italic })}>
                       <Italic className="w-4 h-4" />
                     </Button>
                     <Button size="sm" variant="outline" className="gap-1" onClick={() => startEditingText(selectedText)}>
                       تعديل النص
                     </Button>
                   </>
                 )}
                 
                 <Button size="sm" variant={showTimingPanel ? 'default' : 'outline'} className="gap-1" onClick={() => { setShowTimingPanel(!showTimingPanel); setShowColorPicker(false); setShowFontPicker(false); }}>
                   <Clock className="w-4 h-4" />
                   التوقيت
                 </Button>
                 
                 <div className="flex-1" />
                 
                 <Button size="sm" variant="destructive" onClick={deleteSelected}>
                   <Trash2 className="w-4 h-4" />
                 </Button>
               </div>
               
               {/* شريط الألوان */}
               {showColorPicker && selectedText && (
                 <div className="flex gap-2 flex-wrap p-2 bg-muted/50 rounded-lg animate-scale-in">
                   {AVAILABLE_COLORS.map(color => (
                     <button
                       key={color}
                       className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${selectedText.color === color ? 'border-primary ring-2 ring-primary/50 scale-110' : 'border-white/30'}`}
                       style={{ backgroundColor: color }}
                       onClick={() => updateText(selectedText.id, { color })}
                     />
                   ))}
                 </div>
               )}
               
               {/* اختيار الخط */}
               {showFontPicker && selectedText && (
                 <div className="flex gap-2 flex-wrap p-2 bg-muted/50 rounded-lg animate-scale-in">
                   {AVAILABLE_FONTS.map(font => (
                     <Button
                       key={font.id}
                       size="sm"
                       variant={selectedText.fontFamily === font.family ? 'default' : 'outline'}
                       style={{ fontFamily: font.family }}
                       onClick={() => updateText(selectedText.id, { fontFamily: font.family })}
                     >
                       {font.name}
                     </Button>
                   ))}
                 </div>
               )}
               
               {/* لوحة التوقيت */}
               {showTimingPanel && (
                 <div className="p-3 bg-muted/50 rounded-lg space-y-3 animate-scale-in">
                   {selectedText && (
                     <>
                       <div className="flex items-center gap-3">
                         <span className="text-sm min-w-[50px]">البداية:</span>
                         <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateText(selectedText.id, { startTime: Math.max(0, selectedText.startTime - 0.5) })}>
                           <Minus className="w-3 h-3" />
                         </Button>
                         <span className="text-sm font-mono min-w-[50px] text-center">{formatTime(selectedText.startTime)}</span>
                         <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateText(selectedText.id, { startTime: Math.min(selectedText.endTime - 0.5, selectedText.startTime + 0.5) })}>
                           <Plus className="w-3 h-3" />
                         </Button>
                         <Button size="sm" variant="secondary" onClick={() => updateText(selectedText.id, { startTime: currentTime })}>
                           الآن
                         </Button>
                       </div>
                       <div className="flex items-center gap-3">
                         <span className="text-sm min-w-[50px]">النهاية:</span>
                         <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateText(selectedText.id, { endTime: Math.max(selectedText.startTime + 0.5, selectedText.endTime - 0.5) })}>
                           <Minus className="w-3 h-3" />
                         </Button>
                         <span className="text-sm font-mono min-w-[50px] text-center">{formatTime(selectedText.endTime)}</span>
                         <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateText(selectedText.id, { endTime: Math.min(videoDuration, selectedText.endTime + 0.5) })}>
                           <Plus className="w-3 h-3" />
                         </Button>
                         <Button size="sm" variant="secondary" onClick={() => updateText(selectedText.id, { endTime: currentTime })}>
                           الآن
                         </Button>
                       </div>
                     </>
                   )}
                   
                   {isLogoSelected && logo && (
                     <>
                       <div className="flex items-center gap-3">
                         <span className="text-sm min-w-[50px]">الحجم:</span>
                         <Slider
                           value={[logo.size]}
                           min={30}
                           max={120}
                           step={5}
                           onValueChange={([val]) => setLogo(prev => prev ? { ...prev, size: val } : null)}
                           className="flex-1"
                         />
                         <span className="text-sm font-mono min-w-[40px]">{logo.size}px</span>
                       </div>
                       <div className="flex items-center gap-3">
                         <span className="text-sm min-w-[50px]">البداية:</span>
                         <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setLogo(prev => prev ? { ...prev, startTime: Math.max(0, prev.startTime - 0.5) } : null)}>
                           <Minus className="w-3 h-3" />
                         </Button>
                         <span className="text-sm font-mono min-w-[50px] text-center">{formatTime(logo.startTime)}</span>
                         <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setLogo(prev => prev ? { ...prev, startTime: Math.min(prev.endTime - 0.5, prev.startTime + 0.5) } : null)}>
                           <Plus className="w-3 h-3" />
                         </Button>
                       </div>
                     </>
                   )}
                 </div>
               )}
               
               {/* حجم الخط للنص */}
               {selectedText && !showTimingPanel && (
                 <div className="flex items-center gap-3">
                   <span className="text-sm">حجم الخط:</span>
                   <Slider
                     value={[selectedText.fontSize]}
                     min={16}
                     max={56}
                     step={2}
                     onValueChange={([val]) => updateText(selectedText.id, { fontSize: val })}
                     className="flex-1"
                   />
                   <span className="text-sm font-mono min-w-[40px]">{selectedText.fontSize}px</span>
                 </div>
               )}
             </div>
           )}
           
           {/* ملاحظة الاستخدام */}
           {!selectedTextId && !isLogoSelected && (
             <div className="mt-3 text-center text-sm text-muted-foreground">
               👆 اضغط على نص أو شعار لتعديله، أو اضغط مرتين لتحرير النص
             </div>
           )}
         </div>
       )}
     </div>
   );
 }
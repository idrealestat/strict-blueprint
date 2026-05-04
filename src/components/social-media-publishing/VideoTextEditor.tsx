 /**
  * VideoTextEditor.tsx
  * محرر فيديو احترافي بأسلوب TikTok/Snapchat
  * - شريط أدوات جانبي صغير على اليسار
  * - شريط تقدم الفيديو
  * - أزرار تحكم على كل عنصر
  */
 
 import { useState, useRef, useEffect, useCallback, TouchEvent as ReactTouchEvent } from 'react';
 import { Button } from '@/components/ui/button';
 import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
 import { toast } from 'sonner';
 import { cn } from '@/lib/utils';
 import {
   Play, Pause, Type, Image, Upload, X, Trash2,
   Minus, Plus, RotateCcw, Volume2, VolumeX,
   Sticker, Clock, Download, Palette,
   AlignRight, AlignCenter, AlignLeft
 } from 'lucide-react';
 
 // الخطوط
 const FONTS = [
   { name: 'القاهرة', value: 'Cairo, sans-serif' },
   { name: 'تجوال', value: 'Tajawal, sans-serif' },
   { name: 'المراعي', value: 'Almarai, sans-serif' },
   { name: 'أريال', value: 'Arial, sans-serif' },
   { name: 'جورجيا', value: 'Georgia, serif' },
 ];
 
 // الألوان
 const COLORS = [
   '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0066FF',
   '#FFD700', '#FF69B4', '#9B59B6', '#FF6600', '#00CED1'
 ];
 
 // الملصقات
 const STICKERS = ['🔥', '❤️', '😂', '👍', '🎉', '⭐', '💯', '🚀', '💪', '👏', '🎯', '💎', '✨', '🏠', '🏢'];
 
 // الأنواع
 interface TextOverlay {
   id: string;
   text: string;
   x: number;
   y: number;
   fontSize: number;
   fontFamily: string;
   color: string;
   textAlign: 'right' | 'center' | 'left';
   startTime: number;
   endTime: number;
 }
 
 interface LogoOverlay {
   url: string;
   x: number;
   y: number;
   scale: number;
   startTime: number;
   endTime: number;
 }
 
 interface StickerOverlay {
   id: string;
   emoji: string;
   x: number;
   y: number;
   scale: number;
   startTime: number;
   endTime: number;
 }
 
 interface VideoTextEditorProps {
   onExport?: (data: { textOverlays: TextOverlay[]; logo: LogoOverlay | null; stickers: StickerOverlay[]; videoSrc: string | null }) => void;
  initialVideoUrl?: string;
 }
 
export default function VideoTextEditor({ onExport, initialVideoUrl }: VideoTextEditorProps) {
   const [videoUrl, setVideoUrl] = useState('');
   const [isPlaying, setIsPlaying] = useState(false);
   const [isMuted, setIsMuted] = useState(false);
   const [currentTime, setCurrentTime] = useState(0);
   const [duration, setDuration] = useState(0);
   const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
   const [logo, setLogo] = useState<LogoOverlay | null>(null);
   const [stickers, setStickers] = useState<StickerOverlay[]>([]);
   const [selectedElement, setSelectedElement] = useState<string | null>(null);
   const [editingTextId, setEditingTextId] = useState<string | null>(null);
   const [showStickers, setShowStickers] = useState(false);
   const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
   const [showTimingPanel, setShowTimingPanel] = useState<string | null>(null);
   const [showFontPanel, setShowFontPanel] = useState(false);
 
   const videoRef = useRef<HTMLVideoElement>(null);
   const containerRef = useRef<HTMLDivElement>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);
   const logoInputRef = useRef<HTMLInputElement>(null);
   const dragRef = useRef<{ startX: number; startY: number; elementX: number; elementY: number } | null>(null);
 
   const STORAGE_KEY = 'video-editor-autosave';
 
   // استعادة البيانات
   useEffect(() => {
     try {
       const saved = localStorage.getItem(STORAGE_KEY);
       if (saved) {
         const data = JSON.parse(saved);
         if (data.textOverlays) setTextOverlays(data.textOverlays);
         if (data.logo) setLogo(data.logo);
         if (data.stickers) setStickers(data.stickers);
       }
     } catch { /* ignore */ }
   }, []);
 
   useEffect(() => {
     if (textOverlays.length > 0 || logo || stickers.length > 0) {
       localStorage.setItem(STORAGE_KEY, JSON.stringify({ textOverlays, logo, stickers }));
     }
     onExport?.({ textOverlays, logo, stickers, videoSrc: videoUrl || null });
   }, [textOverlays, logo, stickers, videoUrl, onExport]);
 
   const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
       if (videoUrl) URL.revokeObjectURL(videoUrl);
       setVideoUrl(URL.createObjectURL(file));
       toast.success('تم رفع الفيديو');
     }
   };
 
   const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
       const reader = new FileReader();
       reader.onload = (event) => {
         setLogo({ 
           url: event.target?.result as string, 
           x: 15, y: 10, scale: 1,
           startTime: 0, endTime: duration || 60
         });
         setSelectedElement('logo');
       };
       reader.readAsDataURL(file);
       toast.success('تم رفع الشعار');
     }
   };
 
   const addText = () => {
     const newText: TextOverlay = {
       id: `text-${Date.now()}`,
       text: 'اكتب هنا...',
       x: 50, y: 50,
       fontSize: 24,
       fontFamily: FONTS[0].value,
       color: '#FFFFFF',
       textAlign: 'center',
       startTime: currentTime,
       endTime: duration || 60
     };
     setTextOverlays(prev => [...prev, newText]);
     setSelectedElement(newText.id);
   };
 
   const addSticker = (emoji: string) => {
     const newSticker: StickerOverlay = {
       id: `sticker-${Date.now()}`,
       emoji, x: 50, y: 50, scale: 1,
       startTime: currentTime,
       endTime: duration || 60
     };
     setStickers(prev => [...prev, newSticker]);
     setSelectedElement(newSticker.id);
     setShowStickers(false);
   };
 
   const deleteElement = (id: string) => {
     if (id.startsWith('text-')) {
       setTextOverlays(prev => prev.filter(t => t.id !== id));
     } else if (id === 'logo') {
       setLogo(null);
     } else if (id.startsWith('sticker-')) {
       setStickers(prev => prev.filter(s => s.id !== id));
     }
     setSelectedElement(null);
   };
 
   const deleteVideo = () => {
     if (videoUrl) URL.revokeObjectURL(videoUrl);
     setVideoUrl('');
     setTextOverlays([]);
     setLogo(null);
     setStickers([]);
     localStorage.removeItem(STORAGE_KEY);
     toast.success('تم حذف الفيديو');
   };
 
   const downloadVideo = () => {
     if (!videoUrl) return;
     const a = document.createElement('a');
     a.href = videoUrl;
     a.download = `video-${Date.now()}.mp4`;
     a.click();
     toast.success('جاري تحميل الفيديو');
   };
 
   // Drag handlers
   const handleDragStart = (clientX: number, clientY: number, elementId: string, elementX: number, elementY: number) => {
     dragRef.current = { startX: clientX, startY: clientY, elementX, elementY };
     setSelectedElement(elementId);
   };
 
   const handleDragMove = useCallback((clientX: number, clientY: number) => {
     if (!dragRef.current || !containerRef.current || !selectedElement) return;
     const container = containerRef.current.getBoundingClientRect();
     const deltaX = ((clientX - dragRef.current.startX) / container.width) * 100;
     const deltaY = ((clientY - dragRef.current.startY) / container.height) * 100;
     const newX = Math.max(5, Math.min(95, dragRef.current.elementX + deltaX));
     const newY = Math.max(5, Math.min(95, dragRef.current.elementY + deltaY));
 
     if (selectedElement.startsWith('text-')) {
       setTextOverlays(prev => prev.map(t => t.id === selectedElement ? { ...t, x: newX, y: newY } : t));
     } else if (selectedElement === 'logo' && logo) {
       setLogo({ ...logo, x: newX, y: newY });
     } else if (selectedElement.startsWith('sticker-')) {
       setStickers(prev => prev.map(s => s.id === selectedElement ? { ...s, x: newX, y: newY } : s));
     }
   }, [selectedElement, logo]);
 
   const handleDragEnd = () => { dragRef.current = null; };
 
   const handleMouseDown = (e: React.MouseEvent, id: string, x: number, y: number) => {
     e.preventDefault();
     handleDragStart(e.clientX, e.clientY, id, x, y);
   };
 
   const handleMouseMove = useCallback((e: React.MouseEvent) => {
     if (dragRef.current) handleDragMove(e.clientX, e.clientY);
   }, [handleDragMove]);
 
   const handleTouchStart = (e: ReactTouchEvent, id: string, x: number, y: number) => {
     const touch = e.touches[0];
     handleDragStart(touch.clientX, touch.clientY, id, x, y);
   };
 
   const handleTouchMove = useCallback((e: ReactTouchEvent) => {
     if (dragRef.current) {
       const touch = e.touches[0];
       handleDragMove(touch.clientX, touch.clientY);
     }
   }, [handleDragMove]);
 
   const updateScale = (id: string, delta: number) => {
     if (id === 'logo' && logo) {
       setLogo({ ...logo, scale: Math.max(0.3, Math.min(3, logo.scale + delta)) });
     } else if (id.startsWith('sticker-')) {
       setStickers(prev => prev.map(s => 
         s.id === id ? { ...s, scale: Math.max(0.3, Math.min(3, s.scale + delta)) } : s
       ));
     } else if (id.startsWith('text-')) {
       setTextOverlays(prev => prev.map(t => 
         t.id === id ? { ...t, fontSize: Math.max(14, Math.min(60, t.fontSize + (delta * 20))) } : t
       ));
     }
   };
 
   const updateTiming = (id: string, start: number, end: number) => {
     if (id === 'logo' && logo) {
       setLogo({ ...logo, startTime: start, endTime: end });
     } else if (id.startsWith('sticker-')) {
       setStickers(prev => prev.map(s => s.id === id ? { ...s, startTime: start, endTime: end } : s));
     } else if (id.startsWith('text-')) {
       setTextOverlays(prev => prev.map(t => t.id === id ? { ...t, startTime: start, endTime: end } : t));
     }
     setShowTimingPanel(null);
   };
 
   const updateTextProp = (id: string, prop: keyof TextOverlay, value: string | number) => {
     setTextOverlays(prev => prev.map(t => t.id === id ? { ...t, [prop]: value } : t));
   };
 
   const togglePlay = () => {
     if (videoRef.current) {
       if (isPlaying) videoRef.current.pause();
       else videoRef.current.play();
       setIsPlaying(!isPlaying);
     }
   };
 
   const toggleMute = () => {
     if (videoRef.current) {
       videoRef.current.muted = !isMuted;
       setIsMuted(!isMuted);
     }
   };
 
   const handleTimeUpdate = () => {
     if (videoRef.current) {
       setCurrentTime(videoRef.current.currentTime);
     }
   };
 
   const handleLoadedMetadata = () => {
     if (videoRef.current) {
       setDuration(videoRef.current.duration);
     }
   };
 
   const handleSeek = (value: number[]) => {
     if (videoRef.current) {
       videoRef.current.currentTime = value[0];
       setCurrentTime(value[0]);
     }
   };
 
   const isElementVisible = (startTime: number, endTime: number) => {
     return currentTime >= startTime && currentTime <= endTime;
   };
 
   const formatTime = (time: number) => {
     const mins = Math.floor(time / 60);
     const secs = Math.floor(time % 60);
     return `${mins}:${secs.toString().padStart(2, '0')}`;
   };
 
   const getElementTiming = (id: string) => {
     if (id === 'logo' && logo) return { start: logo.startTime, end: logo.endTime };
     const text = textOverlays.find(t => t.id === id);
     if (text) return { start: text.startTime, end: text.endTime };
     const sticker = stickers.find(s => s.id === id);
     if (sticker) return { start: sticker.startTime, end: sticker.endTime };
     return { start: 0, end: duration };
   };
 
   // الأدوات
   const tools = [
     { id: 'text', icon: Type, label: 'نص', action: addText },
     { id: 'sticker', icon: Sticker, label: 'ملصق', action: () => setShowStickers(!showStickers) },
     { id: 'logo', icon: Image, label: 'شعار', action: () => logoInputRef.current?.click() },
     { id: 'font', icon: Type, label: 'خط', action: () => setShowFontPanel(!showFontPanel) },
   ];
 
   // عناصر التحكم على العنصر
   const ElementControls = ({ id, x, y }: { id: string; x: number; y: number }) => {
     const text = textOverlays.find(t => t.id === id);
     
     return (
       <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1 z-50">
         {/* تصغير */}
         <button
           className="w-7 h-7 bg-black/80 rounded-full flex items-center justify-center text-white hover:bg-black"
           onClick={(e) => { e.stopPropagation(); updateScale(id, -0.1); }}
         >
           <Minus className="w-3 h-3" />
         </button>
         {/* تكبير */}
         <button
           className="w-7 h-7 bg-black/80 rounded-full flex items-center justify-center text-white hover:bg-black"
           onClick={(e) => { e.stopPropagation(); updateScale(id, 0.1); }}
         >
           <Plus className="w-3 h-3" />
         </button>
         {/* توقيت */}
         <button
           className="w-7 h-7 bg-black/80 rounded-full flex items-center justify-center text-white hover:bg-primary"
           onClick={(e) => { e.stopPropagation(); setShowTimingPanel(showTimingPanel === id ? null : id); }}
         >
           <Clock className="w-3 h-3" />
         </button>
         {/* لون النص */}
         {text && (
           <button
             className="w-7 h-7 bg-black/80 rounded-full flex items-center justify-center hover:bg-black"
             style={{ color: text.color }}
             onClick={(e) => { e.stopPropagation(); setShowColorPicker(showColorPicker === id ? null : id); }}
           >
             <Palette className="w-3 h-3" />
           </button>
         )}
         {/* حذف */}
         <button
           className="w-7 h-7 bg-red-500/80 rounded-full flex items-center justify-center text-white hover:bg-red-600"
           onClick={(e) => { e.stopPropagation(); deleteElement(id); }}
         >
           <X className="w-3 h-3" />
         </button>
       </div>
     );
   };
 
   // لوحة التوقيت
   const TimingPanel = ({ id }: { id: string }) => {
     const timing = getElementTiming(id);
     const [start, setStart] = useState(timing.start);
     const [end, setEnd] = useState(timing.end);
 
     return (
       <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black/95 rounded-xl p-3 min-w-[200px] z-50 border border-white/20">
         <p className="text-white text-xs text-center mb-2">مدة الظهور (ثواني)</p>
         <div className="flex items-center gap-2 text-white text-sm">
           <span>من</span>
           <input
             type="number"
             value={Math.round(start)}
             onChange={(e) => setStart(Number(e.target.value))}
             className="w-14 bg-white/10 rounded px-2 py-1 text-center"
             min={0}
             max={duration}
           />
           <span>إلى</span>
           <input
             type="number"
             value={Math.round(end)}
             onChange={(e) => setEnd(Number(e.target.value))}
             className="w-14 bg-white/10 rounded px-2 py-1 text-center"
             min={0}
             max={duration}
           />
         </div>
         <Button size="sm" className="w-full mt-2" onClick={() => updateTiming(id, start, end)}>
           تأكيد
         </Button>
       </div>
     );
   };
 
   return (
     <div className="flex flex-col h-[calc(100vh-140px)] min-h-[550px] bg-black/95 rounded-2xl overflow-hidden" dir="rtl">
        {/* Hidden file inputs */}
       <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
       <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
 
       <div className="flex-1 flex">
         {/* شريط الأدوات الجانبي - على اليسار وأصغر */}
         {videoUrl && (
           <div className="w-14 bg-black/70 backdrop-blur-sm border-l border-white/10 flex flex-col items-center py-3 gap-1">
             {tools.map(tool => (
               <button
                 key={tool.id}
                 className="w-11 h-12 flex flex-col items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-all"
                 onClick={tool.action}
               >
                 <tool.icon className="w-5 h-5" />
                 <span className="text-[9px] mt-1">{tool.label}</span>
               </button>
             ))}
             
             <div className="flex-1" />
             
             {/* تحميل الفيديو */}
             <button
               className="w-11 h-12 flex flex-col items-center justify-center rounded-lg text-green-400 hover:bg-green-500/20 transition-all"
               onClick={downloadVideo}
             >
               <Download className="w-5 h-5" />
               <span className="text-[9px] mt-1">تحميل</span>
             </button>
             
             {/* حذف الفيديو */}
             <button
               className="w-11 h-12 flex flex-col items-center justify-center rounded-lg text-red-400 hover:bg-red-500/20 transition-all"
               onClick={deleteVideo}
             >
               <Trash2 className="w-5 h-5" />
               <span className="text-[9px] mt-1">حذف</span>
             </button>
           </div>
         )}
 
         {/* منطقة الفيديو */}
         <div
           className="flex-1 flex items-center justify-center p-3 relative"
           onMouseMove={handleMouseMove}
           onMouseUp={handleDragEnd}
           onMouseLeave={handleDragEnd}
           onClick={() => { setSelectedElement(null); setShowColorPicker(null); setShowTimingPanel(null); }}
         >
           {!videoUrl ? (
             <div
                className="w-full max-w-[450px] aspect-[9/16] bg-gradient-to-b from-gray-900 to-black rounded-3xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all"
               onClick={() => fileInputRef.current?.click()}
             >
               <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-4">
                 <Upload className="w-10 h-10 text-white/60" />
               </div>
               <p className="text-white/80 text-lg font-medium">اضغط لرفع فيديو</p>
               <p className="text-white/40 text-sm mt-1">MP4, MOV, WebM</p>
             </div>
           ) : (
              <div className="flex flex-col items-center w-full max-w-[450px]">
               <div
                 ref={containerRef}
                 className="relative w-full aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
                 onTouchMove={handleTouchMove}
                 onTouchEnd={handleDragEnd}
               >
                 <video
                   ref={videoRef}
                   src={videoUrl}
                   className="w-full h-full object-cover"
                   loop
                   muted={isMuted}
                   playsInline
                   onPlay={() => setIsPlaying(true)}
                   onPause={() => setIsPlaying(false)}
                   onTimeUpdate={handleTimeUpdate}
                   onLoadedMetadata={handleLoadedMetadata}
                 />
 
                 {/* النصوص */}
                 {textOverlays.map(overlay => (
                   isElementVisible(overlay.startTime, overlay.endTime) && (
                     <div
                       key={overlay.id}
                       className={cn(
                         "absolute cursor-move select-none touch-none transition-all",
                         selectedElement === overlay.id && "ring-2 ring-primary rounded-lg"
                       )}
                       style={{
                         left: `${overlay.x}%`,
                         top: `${overlay.y}%`,
                         transform: 'translate(-50%, -50%)',
                         color: overlay.color,
                         fontSize: `${overlay.fontSize}px`,
                         fontFamily: overlay.fontFamily,
                         textAlign: overlay.textAlign,
                         textShadow: '2px 2px 8px rgba(0,0,0,0.9)',
                         background: 'rgba(0,0,0,0.5)',
                         padding: '6px 12px',
                         borderRadius: '8px',
                       }}
                       onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, overlay.id, overlay.x, overlay.y); }}
                       onTouchStart={(e) => handleTouchStart(e, overlay.id, overlay.x, overlay.y)}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setSelectedElement(overlay.id);
                          // Single click to edit for better UX
                          if (selectedElement === overlay.id) {
                            setEditingTextId(overlay.id);
                          }
                        }}
                     >
                       {selectedElement === overlay.id && <ElementControls id={overlay.id} x={overlay.x} y={overlay.y} />}
                       {showColorPicker === overlay.id && (
                         <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black/95 rounded-xl p-2 z-50 border border-white/20">
                           <div className="flex gap-1 flex-wrap max-w-[160px]">
                             {COLORS.map(color => (
                               <button
                                 key={color}
                                 className={cn("w-6 h-6 rounded-full border-2", overlay.color === color ? "border-white" : "border-transparent")}
                                 style={{ backgroundColor: color }}
                                 onClick={(e) => { e.stopPropagation(); updateTextProp(overlay.id, 'color', color); }}
                               />
                             ))}
                           </div>
                         </div>
                       )}
                       {showTimingPanel === overlay.id && <TimingPanel id={overlay.id} />}
                       
                       {editingTextId === overlay.id ? (
                          <Input
                           value={overlay.text}
                           onChange={(e) => updateTextProp(overlay.id, 'text', e.target.value)}
                            className="bg-white/20 border-white/30 text-center min-w-[150px] h-auto py-2 px-3"
                            style={{ 
                              fontSize: `${Math.max(16, overlay.fontSize * 0.7)}px`, 
                              fontFamily: overlay.fontFamily, 
                              color: overlay.color,
                            }}
                            placeholder="اكتب النص هنا..."
                           autoFocus
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              if (e.key === 'Enter') setEditingTextId(null);
                            }}
                           onBlur={() => setEditingTextId(null)}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                         />
                       ) : (
                          <span className="cursor-text">{overlay.text === 'اكتب هنا...' ? 'اضغط للكتابة' : overlay.text}</span>
                       )}
                     </div>
                   )
                 ))}
 
                 {/* الشعار */}
                 {logo && isElementVisible(logo.startTime, logo.endTime) && (
                   <div
                     className={cn(
                       "absolute cursor-move touch-none",
                       selectedElement === 'logo' && "ring-2 ring-primary rounded"
                     )}
                     style={{
                       left: `${logo.x}%`,
                       top: `${logo.y}%`,
                       transform: `translate(-50%, -50%) scale(${logo.scale})`,
                     }}
                     onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'logo', logo.x, logo.y); }}
                     onTouchStart={(e) => handleTouchStart(e, 'logo', logo.x, logo.y)}
                      onClick={(e) => { e.stopPropagation(); setSelectedElement('logo'); }}
                   >
                     {selectedElement === 'logo' && <ElementControls id="logo" x={logo.x} y={logo.y} />}
                     {showTimingPanel === 'logo' && <TimingPanel id="logo" />}
                      <img 
                        src={logo.url} 
                        alt="Logo" 
                        className="w-16 h-16 object-contain drop-shadow-lg pointer-events-none" 
                      />
                   </div>
                 )}
 
                 {/* الملصقات */}
                 {stickers.map(sticker => (
                   isElementVisible(sticker.startTime, sticker.endTime) && (
                     <div
                       key={sticker.id}
                       className={cn(
                         "absolute cursor-move touch-none text-3xl",
                         selectedElement === sticker.id && "ring-2 ring-primary rounded-full"
                       )}
                       style={{
                         left: `${sticker.x}%`,
                         top: `${sticker.y}%`,
                         transform: `translate(-50%, -50%) scale(${sticker.scale})`,
                       }}
                       onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, sticker.id, sticker.x, sticker.y); }}
                       onTouchStart={(e) => handleTouchStart(e, sticker.id, sticker.x, sticker.y)}
                       onClick={(e) => e.stopPropagation()}
                     >
                       {selectedElement === sticker.id && <ElementControls id={sticker.id} x={sticker.x} y={sticker.y} />}
                       {showTimingPanel === sticker.id && <TimingPanel id={sticker.id} />}
                       {sticker.emoji}
                     </div>
                   )
                 ))}
 
                 {/* أزرار التشغيل */}
                 <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                   <Button size="icon" variant="ghost" className="bg-black/50 text-white h-10 w-10 rounded-full" onClick={togglePlay}>
                     {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                   </Button>
                   <Button size="icon" variant="ghost" className="bg-black/50 text-white h-10 w-10 rounded-full" onClick={toggleMute}>
                     {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                   </Button>
                 </div>
               </div>
 
               {/* شريط التقدم */}
               <div className="w-full mt-3 px-2">
                 <Slider
                   value={[currentTime]}
                   onValueChange={handleSeek}
                   max={duration || 100}
                   step={0.1}
                   className="w-full"
                 />
                 <div className="flex justify-between text-white/60 text-xs mt-1">
                   <span>{formatTime(currentTime)}</span>
                   <span>{formatTime(duration)}</span>
                 </div>
               </div>
             </div>
           )}
 
           {/* لوحة الملصقات */}
           {showStickers && (
             <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/95 backdrop-blur-lg rounded-xl p-4 z-50 border border-white/10">
               <div className="grid grid-cols-5 gap-2">
                 {STICKERS.map(emoji => (
                   <button key={emoji} className="text-2xl hover:scale-125 transition-transform p-1" onClick={() => addSticker(emoji)}>
                     {emoji}
                   </button>
                 ))}
               </div>
               <Button size="sm" variant="ghost" className="w-full mt-2 text-white/60" onClick={() => setShowStickers(false)}>
                 <X className="w-3 h-3 ml-1" /> إغلاق
               </Button>
             </div>
           )}
 
           {/* لوحة الخطوط */}
            {showFontPanel && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/95 backdrop-blur-lg rounded-xl p-4 z-50 border border-white/10 min-w-[220px]">
                {!selectedElement?.startsWith('text-') ? (
                  <div className="text-center">
                    <p className="text-white/60 text-sm mb-3">اختر نصاً أولاً لتغيير الخط</p>
                    <Button size="sm" variant="ghost" className="text-white/60" onClick={() => setShowFontPanel(false)}>
                      <X className="w-3 h-3 ml-1" /> إغلاق
                    </Button>
                  </div>
                ) : (
                  <>
               <p className="text-white/60 text-xs mb-2 text-center">نوع الخط</p>
               <div className="flex flex-col gap-1">
                 {FONTS.map(font => {
                   const text = textOverlays.find(t => t.id === selectedElement);
                   return (
                     <button
                       key={font.value}
                       className={cn(
                         "px-3 py-2 rounded-lg text-sm text-white transition-all text-right",
                         text?.fontFamily === font.value ? "bg-primary" : "bg-white/10 hover:bg-white/20"
                       )}
                       style={{ fontFamily: font.value }}
                       onClick={() => { updateTextProp(selectedElement, 'fontFamily', font.value); }}
                     >
                       {font.name}
                     </button>
                   );
                 })}
               </div>
               
               <p className="text-white/60 text-xs mt-3 mb-2 text-center">محاذاة النص</p>
               <div className="flex gap-1 justify-center">
                 {(['right', 'center', 'left'] as const).map(align => {
                   const text = textOverlays.find(t => t.id === selectedElement);
                   const Icon = align === 'right' ? AlignRight : align === 'center' ? AlignCenter : AlignLeft;
                   return (
                     <button
                       key={align}
                       className={cn(
                         "w-10 h-10 rounded-lg flex items-center justify-center text-white transition-all",
                         text?.textAlign === align ? "bg-primary" : "bg-white/10 hover:bg-white/20"
                       )}
                       onClick={() => updateTextProp(selectedElement, 'textAlign', align)}
                     >
                       <Icon className="w-4 h-4" />
                     </button>
                   );
                 })}
               </div>
               
               <Button size="sm" variant="ghost" className="w-full mt-3 text-white/60" onClick={() => setShowFontPanel(false)}>
                 <X className="w-3 h-3 ml-1" /> إغلاق
               </Button>
                  </>
                )}
             </div>
           )}
         </div>
       </div>
     </div>
   );
 }
 
 export { VideoTextEditor };
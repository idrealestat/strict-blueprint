/**
 * VideoTextEditor.tsx
 * محرر فيديو احترافي بأسلوب TikTok/Snapchat
 * - قائمة أدوات جانبية عمودية
 * - حجم كبير يناسب الجوالات
 * - ملصقات وفلاتر وتأثيرات
 */

import { useState, useRef, useEffect, useCallback, TouchEvent as ReactTouchEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Play, Pause, Type, Image, Upload, X, Check, Trash2,
  Minus, Plus, RotateCcw, Volume2, VolumeX, Move,
  Sticker, Sparkles, Music, Filter, Layers
} from 'lucide-react';

// الخطوط
const FONTS = [
  { name: 'القاهرة', value: 'Cairo, sans-serif' },
  { name: 'تجوال', value: 'Tajawal, sans-serif' },
  { name: 'المراعي', value: 'Almarai, sans-serif' },
  { name: 'أريال', value: 'Arial, sans-serif' },
];

// الألوان
const COLORS = [
  '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0066FF',
  '#FFD700', '#FF69B4', '#9B59B6', '#FF6600', '#00CED1'
];

// الملصقات
const STICKERS = ['🔥', '❤️', '😂', '👍', '🎉', '⭐', '💯', '🚀', '💪', '👏', '🎯', '💎', '✨', '🏠', '🏢'];

// الفلاتر
const FILTERS = [
  { name: 'عادي', value: 'none' },
  { name: 'دافئ', value: 'sepia(0.3) saturate(1.2)' },
  { name: 'بارد', value: 'saturate(0.8) hue-rotate(20deg)' },
  { name: 'حاد', value: 'contrast(1.2) saturate(1.1)' },
  { name: 'ناعم', value: 'brightness(1.1) contrast(0.9)' },
  { name: 'أبيض وأسود', value: 'grayscale(1)' },
];

// الأنواع
interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
}

interface LogoOverlay {
  url: string;
  x: number;
  y: number;
  scale: number;
}

interface StickerOverlay {
  id: string;
  emoji: string;
  x: number;
  y: number;
  scale: number;
}

interface VideoTextEditorProps {
  onExport?: (data: { textOverlays: TextOverlay[]; logo: LogoOverlay | null; stickers: StickerOverlay[]; videoSrc: string | null }) => void;
}

export default function VideoTextEditor({ onExport }: VideoTextEditorProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [logo, setLogo] = useState<LogoOverlay | null>(null);
  const [stickers, setStickers] = useState<StickerOverlay[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('none');
  const [showStickers, setShowStickers] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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
        if (data.activeFilter) setActiveFilter(data.activeFilter);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (textOverlays.length > 0 || logo || stickers.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ textOverlays, logo, stickers, activeFilter }));
    }
    onExport?.({ textOverlays, logo, stickers, videoSrc: videoUrl || null });
  }, [textOverlays, logo, stickers, activeFilter, videoUrl, onExport]);

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
        setLogo({ url: event.target?.result as string, x: 15, y: 10, scale: 1 });
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
      x: 50,
      y: 50,
      fontSize: 26,
      fontFamily: FONTS[0].value,
      color: '#FFFFFF'
    };
    setTextOverlays(prev => [...prev, newText]);
    setSelectedElement(newText.id);
  };

  const addSticker = (emoji: string) => {
    const newSticker: StickerOverlay = {
      id: `sticker-${Date.now()}`,
      emoji,
      x: 50,
      y: 50,
      scale: 1
    };
    setStickers(prev => [...prev, newSticker]);
    setSelectedElement(newSticker.id);
    setShowStickers(false);
  };

  const deleteSelected = () => {
    if (!selectedElement) return;
    if (selectedElement.startsWith('text-')) {
      setTextOverlays(prev => prev.filter(t => t.id !== selectedElement));
    } else if (selectedElement === 'logo') {
      setLogo(null);
    } else if (selectedElement.startsWith('sticker-')) {
      setStickers(prev => prev.filter(s => s.id !== selectedElement));
    }
    setSelectedElement(null);
  };

  const resetEditor = () => {
    setTextOverlays([]);
    setLogo(null);
    setStickers([]);
    setActiveFilter('none');
    setSelectedElement(null);
    localStorage.removeItem(STORAGE_KEY);
    toast.success('تم إعادة تعيين المحرر');
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

  const updateTextProp = (prop: keyof TextOverlay, value: string | number) => {
    if (!selectedElement?.startsWith('text-')) return;
    setTextOverlays(prev => prev.map(t => t.id === selectedElement ? { ...t, [prop]: value } : t));
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

  const selectedText = textOverlays.find(t => t.id === selectedElement);

  // الأدوات الجانبية
  const tools = [
    { id: 'text', icon: Type, label: 'نص', action: addText },
    { id: 'sticker', icon: Sticker, label: 'ملصق', action: () => setShowStickers(!showStickers) },
    { id: 'logo', icon: Image, label: 'شعار', action: () => logoInputRef.current?.click() },
    { id: 'filter', icon: Filter, label: 'فلتر', action: () => setShowFilters(!showFilters) },
    { id: 'music', icon: Music, label: 'صوت', action: () => toast.info('قريباً') },
    { id: 'effects', icon: Sparkles, label: 'تأثير', action: () => toast.info('قريباً') },
    { id: 'layers', icon: Layers, label: 'طبقات', action: () => toast.info('قريباً') },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px] bg-black/95 rounded-2xl overflow-hidden" dir="rtl">
      {/* Inputs مخفية */}
      <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
      <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />

      <div className="flex-1 flex">
        {/* منطقة الفيديو الرئيسية */}
        <div
          className="flex-1 flex items-center justify-center p-3 relative"
          onMouseMove={handleMouseMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
        >
          {!videoUrl ? (
            <div
              className="w-full max-w-[380px] aspect-[9/16] bg-gradient-to-b from-gray-900 to-black rounded-3xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-5">
                <Upload className="w-12 h-12 text-white/60" />
              </div>
              <p className="text-white/80 text-xl font-medium">اضغط لرفع فيديو</p>
              <p className="text-white/40 text-base mt-2">MP4, MOV, WebM</p>
            </div>
          ) : (
            <div
              ref={containerRef}
              className="relative w-full max-w-[380px] aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10"
              onTouchMove={handleTouchMove}
              onTouchEnd={handleDragEnd}
            >
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-cover"
                style={{ filter: activeFilter }}
                loop
                autoPlay
                muted={isMuted}
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />

              {/* النصوص */}
              {textOverlays.map(overlay => (
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
                    textShadow: '2px 2px 8px rgba(0,0,0,0.9)',
                    background: 'rgba(0,0,0,0.5)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                  }}
                  onMouseDown={(e) => handleMouseDown(e, overlay.id, overlay.x, overlay.y)}
                  onTouchStart={(e) => handleTouchStart(e, overlay.id, overlay.x, overlay.y)}
                  onDoubleClick={() => setEditingTextId(overlay.id)}
                >
                  {editingTextId === overlay.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={overlay.text}
                        onChange={(e) => setTextOverlays(prev => prev.map(t => t.id === overlay.id ? { ...t, text: e.target.value } : t))}
                        className="bg-transparent border-0 text-white text-center min-w-[120px] outline-none"
                        style={{ fontSize: `${overlay.fontSize * 0.8}px`, fontFamily: overlay.fontFamily }}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && setEditingTextId(null)}
                      />
                      <Button size="icon" variant="ghost" onClick={() => setEditingTextId(null)} className="h-7 w-7">
                        <Check className="w-4 h-4 text-green-400" />
                      </Button>
                    </div>
                  ) : (
                    <span>{overlay.text}</span>
                  )}
                </div>
              ))}

              {/* الشعار */}
              {logo && (
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
                  onMouseDown={(e) => handleMouseDown(e, 'logo', logo.x, logo.y)}
                  onTouchStart={(e) => handleTouchStart(e, 'logo', logo.x, logo.y)}
                >
                  <img src={logo.url} alt="Logo" className="w-16 h-16 object-contain drop-shadow-lg" />
                </div>
              )}

              {/* الملصقات */}
              {stickers.map(sticker => (
                <div
                  key={sticker.id}
                  className={cn(
                    "absolute cursor-move touch-none text-4xl",
                    selectedElement === sticker.id && "ring-2 ring-primary rounded-full"
                  )}
                  style={{
                    left: `${sticker.x}%`,
                    top: `${sticker.y}%`,
                    transform: `translate(-50%, -50%) scale(${sticker.scale})`,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, sticker.id, sticker.x, sticker.y)}
                  onTouchStart={(e) => handleTouchStart(e, sticker.id, sticker.x, sticker.y)}
                >
                  {sticker.emoji}
                </div>
              ))}

              {/* أزرار التحكم السفلية */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                <Button size="icon" variant="ghost" className="bg-black/50 text-white h-11 w-11 rounded-full" onClick={togglePlay}>
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" className="bg-black/50 text-white h-11 w-11 rounded-full" onClick={toggleMute}>
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="bg-black/50 text-white h-11 w-11 rounded-full" onClick={resetEditor}>
                    <RotateCcw className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* ملاحظة السحب */}
              <div className="absolute top-4 left-0 right-0 text-center pointer-events-none">
                <span className="text-white/60 text-sm bg-black/40 px-4 py-1.5 rounded-full">
                  <Move className="w-4 h-4 inline ml-1" /> اسحب لتحريك العناصر
                </span>
              </div>
            </div>
          )}

          {/* لوحة الملصقات */}
          {showStickers && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/95 backdrop-blur-lg rounded-2xl p-5 z-50 border border-white/10">
              <div className="grid grid-cols-5 gap-3">
                {STICKERS.map(emoji => (
                  <button key={emoji} className="text-3xl hover:scale-125 transition-transform p-2" onClick={() => addSticker(emoji)}>
                    {emoji}
                  </button>
                ))}
              </div>
              <Button size="sm" variant="ghost" className="w-full mt-3 text-white/60" onClick={() => setShowStickers(false)}>
                <X className="w-4 h-4 ml-1" /> إغلاق
              </Button>
            </div>
          )}

          {/* لوحة الفلاتر */}
          {showFilters && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/95 backdrop-blur-lg rounded-2xl p-5 z-50 border border-white/10">
              <div className="flex gap-2 flex-wrap justify-center">
                {FILTERS.map(f => (
                  <button
                    key={f.value}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm text-white transition-all",
                      activeFilter === f.value ? "bg-primary" : "bg-white/10 hover:bg-white/20"
                    )}
                    onClick={() => { setActiveFilter(f.value); setShowFilters(false); }}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* شريط الأدوات الجانبي */}
        {videoUrl && (
          <div className="w-20 bg-black/70 backdrop-blur-sm border-r border-white/10 flex flex-col items-center py-5 gap-2">
            {tools.map(tool => (
              <button
                key={tool.id}
                className="w-14 h-16 flex flex-col items-center justify-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all"
                onClick={tool.action}
              >
                <tool.icon className="w-6 h-6" />
                <span className="text-[11px] mt-1.5">{tool.label}</span>
              </button>
            ))}

            <div className="flex-1" />

            {selectedElement && (
              <button className="w-14 h-16 flex flex-col items-center justify-center rounded-xl text-red-400 hover:bg-red-500/20 transition-all" onClick={deleteSelected}>
                <Trash2 className="w-6 h-6" />
                <span className="text-[11px] mt-1.5">حذف</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* لوحة التحكم السفلية */}
      {selectedElement && (
        <div className="bg-black/90 backdrop-blur-lg border-t border-white/10 p-4 space-y-3">
          {/* أدوات النص */}
          {selectedText && (
            <>
              {/* الألوان */}
              <div className="flex items-center gap-3">
                <span className="text-white/60 text-sm w-14">اللون</span>
                <div className="flex gap-2 flex-wrap flex-1">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                        selectedText.color === color ? "border-white scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => updateTextProp('color', color)}
                    />
                  ))}
                </div>
              </div>

              {/* الخطوط */}
              <div className="flex items-center gap-3">
                <span className="text-white/60 text-sm w-14">الخط</span>
                <div className="flex gap-2 flex-1 overflow-x-auto">
                  {FONTS.map(font => (
                    <button
                      key={font.value}
                      className={cn(
                        "flex-shrink-0 px-4 py-2 rounded-lg text-sm text-white transition-all",
                        selectedText.fontFamily === font.value ? "bg-primary" : "bg-white/10 hover:bg-white/20"
                      )}
                      style={{ fontFamily: font.value }}
                      onClick={() => updateTextProp('fontFamily', font.value)}
                    >
                      {font.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* الحجم */}
              <div className="flex items-center gap-3">
                <span className="text-white/60 text-sm w-14">الحجم</span>
                <Button size="icon" variant="ghost" className="text-white h-9 w-9" onClick={() => updateTextProp('fontSize', Math.max(14, selectedText.fontSize - 2))}>
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-white min-w-[50px] text-center">{selectedText.fontSize}px</span>
                <Button size="icon" variant="ghost" className="text-white h-9 w-9" onClick={() => updateTextProp('fontSize', Math.min(60, selectedText.fontSize + 2))}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}

          {/* أدوات الشعار */}
          {selectedElement === 'logo' && logo && (
            <div className="flex items-center gap-4">
              <span className="text-white/60 text-sm">حجم الشعار</span>
              <Slider
                value={[logo.scale]}
                onValueChange={([val]) => setLogo({ ...logo, scale: val })}
                min={0.3}
                max={3}
                step={0.1}
                className="flex-1 max-w-[200px]"
              />
              <span className="text-white text-sm min-w-[50px]">{Math.round(logo.scale * 100)}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// للتوافق مع الاستيراد الحالي
export { VideoTextEditor };
/**
 * SocialContentEditorTab.tsx
 * محرر المحتوى والفيديو للتواصل الاجتماعي
 */

import { useState, useMemo, useRef } from 'react';
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
  Play, Pause, Volume2, Check, X, Sparkles, Eye, Clock, Edit3, Loader2, Music
} from 'lucide-react';
 import { 
   VideoSettings, 
   APPROVED_FONTS, 
   SUBTITLE_COLORS 
 } from './types';
import { supabase } from '@/integrations/supabase/client';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Progress } from '@/components/ui/progress';

// استخراج الصوت من الفيديو باستخدام FFmpeg
async function extractAudioFromVideo(
  file: File,
  ffmpegRef: React.MutableRefObject<FFmpeg | null>,
  ffmpegLoadedRef: React.MutableRefObject<boolean>,
  onProgress: (progress: number, message: string) => void
): Promise<Blob> {
  onProgress(0, 'جاري تحميل معالج الفيديو...');
  
  if (!ffmpegRef.current) {
    ffmpegRef.current = new FFmpeg();
  }
  
  if (!ffmpegLoadedRef.current) {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpegRef.current.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    ffmpegLoadedRef.current = true;
  }
  
  onProgress(20, 'جاري كتابة ملف الفيديو...');
  await ffmpegRef.current.writeFile('input.mp4', await fetchFile(file));
  
  onProgress(40, 'جاري استخراج الصوت...');
  await ffmpegRef.current.exec(['-i', 'input.mp4', '-vn', '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1', 'audio.wav']);
  
  onProgress(80, 'جاري قراءة ملف الصوت...');
  const audioData = await ffmpegRef.current.readFile('audio.wav');
  
  let audioBytes: Uint8Array;
  if (audioData instanceof Uint8Array) {
    audioBytes = audioData;
  } else if (typeof audioData === 'string') {
    const binaryString = atob(audioData);
    audioBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      audioBytes[i] = binaryString.charCodeAt(i);
    }
  } else {
    audioBytes = new Uint8Array(audioData as unknown as ArrayBuffer);
  }
  
  const buffer = new ArrayBuffer(audioBytes.length);
  const view = new Uint8Array(buffer);
  view.set(audioBytes);
  
  onProgress(100, 'تم استخراج الصوت بنجاح!');
  return new Blob([buffer], { type: 'audio/wav' });
}

// تحويل الصوت إلى نص باستخدام Web Speech API
async function transcribeAudioWithWebSpeech(
  audioBlob: Blob,
  language: string,
  onProgress: (progress: number, message: string) => void
): Promise<string> {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) {
    throw new Error('المتصفح لا يدعم التعرف على الكلام. جرّب Google Chrome.');
  }
  
  onProgress(0, 'جاري تحضير الصوت للتحويل...');
  const audioUrl = URL.createObjectURL(audioBlob);
  
  try {
    return await new Promise<string>((resolve, reject) => {
      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.continuous = true;
      recognition.interimResults = false;
      let finalText = '';
      let resolved = false;
      let userStopped = false;
      let recognitionStarted = false;
      
      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript + ' ';
          }
        }
      };
      
      const safeResolve = (text: string) => {
        if (resolved) return;
        resolved = true;
        resolve(text);
      };

      const safeReject = (err: Error) => {
        if (resolved) return;
        resolved = true;
        reject(err);
      };

      const tryStartRecognition = () => {
        if (userStopped || resolved) return;
        try {
          recognition.start();
          recognitionStarted = true;
        } catch {
          // غالباً start تم استدعاؤه بالفعل أو المتصفح منع إعادة البدء فوراً
        }
      };

      recognition.onerror = (e: any) => {
        const code = e?.error as string | undefined;
        // لا نوقف العملية في "no-speech" و"aborted" لأن المتصفح قد يقطعها بسبب صمت
        if (code === 'no-speech' || code === 'aborted') {
          return;
        }
        safeReject(new Error(code ? `خطأ في التعرف على الكلام: ${code}` : 'خطأ في التعرف على الكلام'));
      };

      recognition.onend = () => {
        // إذا انتهى الصوت أو المستخدم أوقف، ننهي. وإلا نعيد البدء تلقائياً.
        if (userStopped || resolved) return;
        // سياسات المتصفح قد توقف الاستماع بعد صمت؛ نعيد التشغيل أثناء تشغيل الصوت
        setTimeout(() => {
          tryStartRecognition();
        }, 250);
      };
      
      const audio = new Audio(audioUrl);
      const cleanup = () => { audio.pause(); audio.src = ''; };
      
      audio.onended = () => {
        onProgress(100, 'اكتمل التحويل!');
        userStopped = true;
        try {
          recognition.stop();
        } catch {}
        cleanup();
        const text = finalText.trim();
        if (!text) {
          safeReject(new Error('لم يتم التقاط نص. جرّب رفع الصوت أو التحدث قرب المايك.'));
          return;
        }
        safeResolve(text);
      };
      
      audio.onerror = () => {
        cleanup();
        safeReject(new Error('فشل تشغيل الصوت'));
      };
      
      audio.ontimeupdate = () => {
        if (audio.duration) {
          const progressValue = Math.floor((audio.currentTime / audio.duration) * 100);
          onProgress(progressValue, `جاري التحويل... ${progressValue}%`);
        }
      };
      
      // مهم: start لازم يكون داخل gesture (نحن ما زلنا داخل Promise التي استدعيت من onClick)
      // لذلك نبدأ التعرف فوراً ثم نشغّل الصوت.
      onProgress(5, 'جاري بدء التحويل...');
      tryStartRecognition();
      
      audio.onloadedmetadata = () => {
        // لا نضع await هنا حتى لا نفقد gesture
        audio.play().catch((err) => {
          cleanup();
          safeReject(err instanceof Error ? err : new Error('تعذر بدء تشغيل الصوت'));
        });
      };

      // في بعض الأجهزة قد لا يحدث onloadedmetadata بسرعة، فابدأ التحميل فوراً
      audio.load();

      // حماية: إذا لم يبدأ recognition بسبب قيود gesture، نعطي رسالة واضحة
      setTimeout(() => {
        if (!recognitionStarted && !resolved) {
          safeReject(new Error('لم يبدأ التعرف على الكلام. اضغط زر التحويل مرة أخرى واسمح بالمايك.'));
        }
      }, 1500);
    });
  } finally {
    URL.revokeObjectURL(audioUrl);
  }
}

// نوع الكلمة مع التوقيت
interface TimedWord {
  text: string;
  start: number;
  end: number;
}
 
// مكون المعاينة التفاعلية
function ContentPreview({
  contentText,
  hashtags,
  videoUrl,
  extractedText,
  videoSettings,
  logoUrl,
}: {
  contentText: string;
  hashtags: string[];
  videoUrl: string;
  extractedText: string;
  videoSettings: VideoSettings;
  logoUrl: string;
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
          <div className="relative bg-gray-100 mx-auto rounded-lg overflow-hidden" style={{ aspectRatio: '9/16', width: '180px', maxHeight: '320px' }}>
            {videoUrl ? (
              <video 
                src={videoUrl} 
                className="w-full h-full object-cover cursor-pointer"
                controls
                playsInline
                loop
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                <Video className="w-10 h-10 text-gray-400" />
              </div>
            )}

            {/* الشعار */}
            <div className={`absolute ${logoPositionClass} z-10`}>
              {logoUrl ? (
                <div className="w-12 h-12 rounded-lg overflow-hidden shadow-lg bg-white">
                  <img src={logoUrl} alt="الشعار" className="w-full h-full object-contain p-1" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#01411C] to-[#016630] flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">W</span>
                </div>
              )}
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
   const [audioExtractionProgress, setAudioExtractionProgress] = useState(0);
   const [audioExtractionMessage, setAudioExtractionMessage] = useState('');
   const [transcriptionProgress, setTranscriptionProgress] = useState(0);
   const [transcriptionMessage, setTranscriptionMessage] = useState('');
   const [processingStep, setProcessingStep] = useState<'idle' | 'extracting' | 'transcribing'>('idle');
   const [extractedText, setExtractedText] = useState('');
   const [timedWords, setTimedWords] = useState<TimedWord[]>([]);
   const [editingWordIndex, setEditingWordIndex] = useState<number | null>(null);
   const [logoFile, setLogoFile] = useState<File | null>(null);
   const [logoUrl, setLogoUrl] = useState('');
   
   // FFmpeg refs
   const ffmpegRef = useRef<FFmpeg | null>(null);
   const ffmpegLoadedRef = useRef(false);
   
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
 
     // تحويل الصوت إلى نص (داخل المتصفح عبر Web Speech API) بدل ElevenLabs
    const processAudioToText = async () => {
     if (!videoFile) {
       toast.error('يرجى رفع فيديو أولاً');
       return;
     }
     
     setIsProcessingAudio(true);
      setTimedWords([]);
      setExtractedText('');
      setProcessingStep('extracting');
      setAudioExtractionProgress(0);

       try {
         const language = 'ar-SA';
         
         // الخطوة 1: استخراج الصوت من الفيديو
         const audioBlob = await extractAudioFromVideo(
           videoFile,
           ffmpegRef,
           ffmpegLoadedRef,
           (progress, message) => {
             setAudioExtractionProgress(progress);
             setAudioExtractionMessage(message);
           }
         );
         
         // الخطوة 2: تحويل الصوت إلى نص
         setProcessingStep('transcribing');
         setTranscriptionProgress(0);
         
         const text = await transcribeAudioWithWebSpeech(
           audioBlob,
           language,
           (progress, message) => {
             setTranscriptionProgress(progress);
             setTranscriptionMessage(message);
           }
         );

         if (!text) {
           throw new Error('لم يتم التقاط نص. تأكد من وجود صوت واضح في الفيديو.');
         }

         setExtractedText(text);

         // لا يوجد توقيت كلمات حقيقي عبر Web Speech API، لذا ننشئ توقيتاً تقديرياً بسيطاً
         // حتى لا تتعطل واجهة التحرير الحالية.
         const words = text.split(/\s+/).filter(Boolean);
         const approxWordDuration = 0.35; // تقدير بسيط
         setTimedWords(
           words.map((w, idx) => ({
             text: w,
             start: idx * approxWordDuration,
             end: (idx + 1) * approxWordDuration,
           }))
         );

         toast.success('تم تحويل الصوت إلى نص (عبر المتصفح)');
      } catch (error) {
        console.error('Speech-to-text error:', error);
         toast.error(error instanceof Error ? error.message : 'فشل تحويل الصوت إلى نص');
      } finally {
        setIsProcessingAudio(false);
        setProcessingStep('idle');
      }
   };

    // تحديث كلمة معينة
    const updateWord = (index: number, newText: string) => {
      setTimedWords(prev => prev.map((w, i) => 
        i === index ? { ...w, text: newText } : w
      ));
      // تحديث النص الكامل
      const newFullText = timedWords.map((w, i) => 
        i === index ? newText : w.text
      ).join(' ');
      setExtractedText(newFullText);
    };

    // تحديث توقيت كلمة
    const updateWordTiming = (index: number, field: 'start' | 'end', value: number) => {
      setTimedWords(prev => prev.map((w, i) => 
        i === index ? { ...w, [field]: value } : w
      ));
    };

    // تنسيق الوقت
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 100);
      return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
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

    // رفع الشعار
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        // التحقق من نوع الملف
        if (!file.type.startsWith('image/')) {
          toast.error('يرجى رفع صورة فقط');
          return;
        }
        // التحقق من حجم الملف (أقصى 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
          return;
        }
        setLogoFile(file);
        setLogoUrl(URL.createObjectURL(file));
        toast.success('تم رفع الشعار');
      }
    };

    // حذف الشعار
    const removeLogo = () => {
      if (logoUrl) {
        URL.revokeObjectURL(logoUrl);
      }
      setLogoFile(null);
      setLogoUrl('');
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
          logoUrl={logoUrl}
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
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        جاري تحويل الصوت...
                      </>
                   ) : (
                     <>
                       <Mic className="w-4 h-4 ml-2" />
                       استخراج النص من الفيديو
                     </>
                   )}
                 </Button>
                 
                  {/* شريط التقدم */}
                  {isProcessingAudio && (
                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                      {processingStep === 'extracting' && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Music className="w-4 h-4 text-primary animate-pulse" />
                            <span className="text-sm font-medium">الخطوة 1: استخراج الصوت</span>
                          </div>
                          <Progress value={audioExtractionProgress} className="h-3" />
                          <p className="text-xs text-muted-foreground text-center">
                            {audioExtractionMessage || 'جاري الانتظار...'}
                          </p>
                        </div>
                      )}
                      
                      {processingStep === 'transcribing' && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-muted-foreground line-through">استخراج الصوت</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Type className="w-4 h-4 text-primary animate-pulse" />
                            <span className="text-sm font-medium">الخطوة 2: تحويل الصوت إلى نص</span>
                          </div>
                          <Progress value={transcriptionProgress} className="h-3" />
                          <p className="text-xs text-muted-foreground text-center">
                            {transcriptionMessage || 'جاري التحويل...'}
                          </p>
                          <p className="text-xs text-amber-600 text-center mt-2">
                            ⚠️ يجب أن يكون صوت الفيديو مسموعاً للمايك
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* النص الكامل */}
                  {extractedText && timedWords.length === 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">النص المستخرج</Label>
                      <Textarea
                        value={extractedText}
                        onChange={(e) => setExtractedText(e.target.value)}
                        placeholder="النص المستخرج..."
                        className="min-h-[100px]"
                      />
                    </div>
                  )}

                  {/* الكلمات مع التوقيت */}
                  {timedWords.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          النص مع التوقيت ({timedWords.length} كلمة)
                        </Label>
                        <Badge variant="outline" className="text-xs">
                          قابل للتعديل
                        </Badge>
                      </div>
                      
                      <ScrollArea className="h-[200px] border rounded-lg p-2 bg-gray-50">
                        <div className="space-y-1" dir="rtl">
                          {timedWords.map((word, index) => (
                            <div 
                              key={index}
                              className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                                editingWordIndex === index 
                                  ? 'bg-[#01411C]/10 border border-[#01411C]' 
                                  : 'hover:bg-gray-100'
                              }`}
                            >
                              {/* رقم الكلمة */}
                              <span className="text-xs text-gray-400 w-6 text-center">
                                {index + 1}
                              </span>
                              
                              {/* الكلمة */}
                              {editingWordIndex === index ? (
                                <Input
                                  value={word.text}
                                  onChange={(e) => updateWord(index, e.target.value)}
                                  className="flex-1 h-8 text-sm"
                                  autoFocus
                                  onBlur={() => setEditingWordIndex(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') setEditingWordIndex(null);
                                  }}
                                />
                              ) : (
                                <span 
                                  className="flex-1 text-sm cursor-pointer hover:text-[#01411C]"
                                  onClick={() => setEditingWordIndex(index)}
                                >
                                  {word.text}
                                </span>
                              )}
                              
                              {/* التوقيت */}
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                  {formatTime(word.start)}
                                </span>
                                <span>→</span>
                                <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                                  {formatTime(word.end)}
                                </span>
                              </div>
                              
                              {/* زر التعديل */}
                              <button
                                onClick={() => setEditingWordIndex(editingWordIndex === index ? null : index)}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                <Edit3 className="w-3 h-3 text-gray-400" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      
                      {/* النص الكامل للمراجعة */}
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <Label className="text-xs text-gray-500 mb-1 block">النص الكامل</Label>
                        <p className="text-sm leading-relaxed" dir="rtl">
                          {timedWords.map(w => w.text).join(' ')}
                        </p>
                      </div>
                    </div>
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
              {/* رفع الشعار */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    رفع الشعار
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {logoUrl ? (
                    <div className="space-y-3">
                      {/* معاينة الشعار */}
                      <div className="relative w-32 h-32 mx-auto rounded-xl overflow-hidden border-2 border-[#D4AF37] bg-gray-50">
                        <img 
                          src={logoUrl} 
                          alt="الشعار"
                          className="w-full h-full object-contain p-2"
                        />
                        <button
                          onClick={removeLogo}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      
                      {/* زر تغيير الشعار */}
                      <div className="text-center">
                        <label htmlFor="logo-upload" className="cursor-pointer">
                          <span className="text-sm text-[#01411C] hover:underline">
                            تغيير الشعار
                          </span>
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          id="logo-upload"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#01411C] transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label 
                        htmlFor="logo-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <Image className="w-8 h-8 text-gray-400" />
                        </div>
                        <span className="text-gray-600">اضغط لرفع الشعار</span>
                        <span className="text-xs text-gray-400">PNG, JPG, SVG (أقصى 5MB)</span>
                      </label>
                    </div>
                  )}
                </CardContent>
              </Card>

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
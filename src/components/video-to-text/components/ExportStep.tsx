 import { useRef, useState, useEffect } from 'react';
 import { Download, FileText, Video, Share2, Copy, Save } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { TranscriptionSegment } from '../types';
 import { 
   generateSRTContent, 
   generateVTTContent, 
   generateCapcutContent,
   downloadFile,
   saveProject 
 } from '../utils/exportUtils';
 import { toast } from 'sonner';
 
 interface ExportStepProps {
   transcriptions: TranscriptionSegment[];
   videoFile: File | null;
   videoDuration: number;
 }
 
 const ExportStep = ({ transcriptions, videoFile, videoDuration }: ExportStepProps) => {
   const videoRef = useRef<HTMLVideoElement>(null);
   const [showSubtitles, setShowSubtitles] = useState(true);
   const [currentSubtitle, setCurrentSubtitle] = useState('');
   const [subtitleColor, setSubtitleColor] = useState('#ffffff');
   const [subtitleSize, setSubtitleSize] = useState(24);
 
   useEffect(() => {
     const video = videoRef.current;
     if (!video) return;
 
     const handleTimeUpdate = () => {
       const currentTime = video.currentTime;
       const currentSegment = transcriptions.find(segment => 
         currentTime >= segment.startSeconds && currentTime <= segment.endSeconds
       );
       
       setCurrentSubtitle(currentSegment?.translation || currentSegment?.text || '');
     };
 
     video.addEventListener('timeupdate', handleTimeUpdate);
     return () => video.removeEventListener('timeupdate', handleTimeUpdate);
   }, [transcriptions]);
 
   const handleExportSRT = () => {
     const content = generateSRTContent(transcriptions);
     downloadFile(content, 'transcript.srt', 'text/plain');
     toast.success('تم تصدير ملف SRT');
   };
 
   const handleExportVTT = () => {
     const content = generateVTTContent(transcriptions);
     downloadFile(content, 'transcript.vtt', 'text/vtt');
     toast.success('تم تصدير ملف WebVTT');
   };
 
   const handleExportText = () => {
     const content = transcriptions.map(s => s.text).join('\n\n');
     downloadFile(content, 'transcript.txt', 'text/plain');
     toast.success('تم تصدير الملف النصي');
   };
 
   const handleExportCapcut = () => {
     const content = generateCapcutContent(transcriptions);
     downloadFile(content, 'capcut_transcript.txt', 'text/plain');
     toast.success('تم التصدير لـ CapCut');
   };
 
   const handleCopyText = async () => {
     const text = transcriptions.map(s => s.text).join('\n');
     await navigator.clipboard.writeText(text);
     toast.success('تم نسخ النص');
   };
 
   const handleSaveProject = () => {
     saveProject(transcriptions, videoDuration, videoFile?.name);
     toast.success('تم حفظ المشروع');
   };
 
   return (
     <div className="p-6 space-y-6">
       <div className="bg-muted/30 rounded-lg p-6">
         <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
           <Download className="w-5 h-5" />
           تصدير النتائج
         </h3>
         
         {/* Export Options */}
         <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
           <div className="border rounded-lg p-4 text-center hover:border-primary transition-colors">
             <FileText className="w-10 h-10 mx-auto mb-2 text-primary" />
             <h4 className="font-medium">ملف SRT</h4>
             <p className="text-xs text-muted-foreground mb-3">ترجمة بتنسيق SubRip</p>
             <Button size="sm" className="w-full" onClick={handleExportSRT}>
               <Download className="w-4 h-4 ml-1" />
               تحميل
             </Button>
           </div>
           
           <div className="border rounded-lg p-4 text-center hover:border-primary transition-colors">
             <FileText className="w-10 h-10 mx-auto mb-2 text-primary" />
             <h4 className="font-medium">ملف WebVTT</h4>
             <p className="text-xs text-muted-foreground mb-3">ترجمة للويب</p>
             <Button size="sm" className="w-full" onClick={handleExportVTT}>
               <Download className="w-4 h-4 ml-1" />
               تحميل
             </Button>
           </div>
           
           <div className="border rounded-lg p-4 text-center hover:border-primary transition-colors">
             <FileText className="w-10 h-10 mx-auto mb-2 text-primary" />
             <h4 className="font-medium">ملف نصي</h4>
             <p className="text-xs text-muted-foreground mb-3">النص فقط</p>
             <Button size="sm" className="w-full" onClick={handleExportText}>
               <Download className="w-4 h-4 ml-1" />
               تحميل
             </Button>
           </div>
           
           <div className="border rounded-lg p-4 text-center hover:border-primary transition-colors">
             <Video className="w-10 h-10 mx-auto mb-2 text-primary" />
             <h4 className="font-medium">CapCut</h4>
             <p className="text-xs text-muted-foreground mb-3">تنسيق متوافق</p>
             <Button size="sm" className="w-full" onClick={handleExportCapcut}>
               <Download className="w-4 h-4 ml-1" />
               تحميل
             </Button>
           </div>
         </div>
         
         {/* Video Preview with Subtitles */}
         {videoFile && (
           <div className="mb-6">
             <h4 className="font-medium mb-3 flex items-center gap-2">
               <Video className="w-4 h-4" />
               معاينة الترجمة
             </h4>
             <div className="relative bg-black rounded-lg overflow-hidden">
               <video
                 ref={videoRef}
                 src={URL.createObjectURL(videoFile)}
                 controls
                 className="w-full max-h-[400px]"
               />
               {showSubtitles && currentSubtitle && (
                 <div 
                   className="absolute bottom-16 left-0 right-0 text-center px-4"
                   style={{ 
                     color: subtitleColor,
                     fontSize: `${subtitleSize}px`,
                     textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                   }}
                 >
                   <span className="bg-black/50 px-3 py-1 rounded">
                     {currentSubtitle}
                   </span>
                 </div>
               )}
             </div>
             
             {/* Subtitle Controls */}
             <div className="flex flex-wrap gap-4 mt-3 items-center">
               <Button 
                 variant="outline" 
                 size="sm"
                 onClick={() => setShowSubtitles(!showSubtitles)}
               >
                 {showSubtitles ? 'إخفاء' : 'إظهار'} الترجمة
               </Button>
               <div className="flex items-center gap-2">
                 <span className="text-sm">اللون:</span>
                 <Input
                   type="color"
                   value={subtitleColor}
                   onChange={(e) => setSubtitleColor(e.target.value)}
                   className="w-10 h-8 p-1"
                 />
               </div>
               <div className="flex items-center gap-2">
                 <span className="text-sm">الحجم:</span>
                 <Input
                   type="range"
                   min="16"
                   max="48"
                   value={subtitleSize}
                   onChange={(e) => setSubtitleSize(parseInt(e.target.value))}
                   className="w-24"
                 />
               </div>
             </div>
           </div>
         )}
         
         {/* Share Options */}
         <div>
           <h4 className="font-medium mb-3 flex items-center gap-2">
             <Share2 className="w-4 h-4" />
             مشاركة
           </h4>
           <div className="flex flex-wrap gap-2">
             <Button variant="outline" onClick={handleCopyText}>
               <Copy className="w-4 h-4 ml-1" />
               نسخ النص
             </Button>
             <Button variant="outline" onClick={handleSaveProject}>
               <Save className="w-4 h-4 ml-1" />
               حفظ المشروع
             </Button>
           </div>
         </div>
       </div>
     </div>
   );
 };
 
 export default ExportStep;
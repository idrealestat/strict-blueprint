 import { useState, useRef, useCallback } from 'react';
 import { Upload, Video, Clock, HardDrive } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { formatTime } from '../utils/timeUtils';
 
 interface UploadStepProps {
   videoFile: File | null;
   videoDuration: number;
   onFileSelect: (file: File) => void;
   onStartExtract: () => void;
 }
 
 const UploadStep = ({ videoFile, videoDuration, onFileSelect, onStartExtract }: UploadStepProps) => {
   const [audioLanguage, setAudioLanguage] = useState('ar-SA');
   const [isDragging, setIsDragging] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);
   const videoRef = useRef<HTMLVideoElement>(null);
 
   const handleDragOver = useCallback((e: React.DragEvent) => {
     e.preventDefault();
     e.stopPropagation();
     setIsDragging(true);
   }, []);
 
   const handleDragLeave = useCallback((e: React.DragEvent) => {
     e.preventDefault();
     e.stopPropagation();
     setIsDragging(false);
   }, []);
 
   const handleDrop = useCallback((e: React.DragEvent) => {
     e.preventDefault();
     e.stopPropagation();
     setIsDragging(false);
     
     const files = e.dataTransfer.files;
     if (files.length > 0 && files[0].type.startsWith('video/')) {
       onFileSelect(files[0]);
     }
   }, [onFileSelect]);
 
   const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
       onFileSelect(file);
     }
   }, [onFileSelect]);
 
   return (
     <div className="p-6 space-y-6">
       {/* Upload Area */}
       <div
         className={`border-3 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
           isDragging ? 'border-primary bg-primary/10' : 'border-primary/50 hover:border-primary hover:bg-muted/50'
         }`}
         onDragOver={handleDragOver}
         onDragLeave={handleDragLeave}
         onDrop={handleDrop}
         onClick={() => fileInputRef.current?.click()}
       >
         <Upload className="w-16 h-16 mx-auto mb-4 text-primary" />
         <p className="text-xl font-medium mb-2">اسحب وأفلت ملف الفيديو هنا</p>
         <p className="text-muted-foreground mb-4">أو</p>
         <Button variant="outline" className="mb-2">
           اختر ملف فيديو
         </Button>
         <input
           ref={fileInputRef}
           type="file"
           accept="video/*"
           className="hidden"
           onChange={handleFileChange}
         />
       </div>
 
       {/* Video Preview */}
       {videoFile && (
         <div className="bg-muted/30 rounded-lg p-6 space-y-4">
           <h3 className="text-lg font-semibold flex items-center gap-2">
             <Video className="w-5 h-5" />
             معاينة الفيديو
           </h3>
           
           <video
             ref={videoRef}
             src={URL.createObjectURL(videoFile)}
             controls
             className="w-full max-h-[400px] rounded-lg bg-black"
           />
           
           <div className="flex flex-wrap gap-6 text-sm">
             <div className="flex items-center gap-2">
               <Clock className="w-4 h-4 text-primary" />
               <span>المدة: {formatTime(videoDuration)}</span>
             </div>
             <div className="flex items-center gap-2">
               <HardDrive className="w-4 h-4 text-primary" />
               <span>الحجم: {(videoFile.size / (1024 * 1024)).toFixed(2)} MB</span>
             </div>
             <div className="flex items-center gap-2">
               <span>لغة الصوت:</span>
               <Select value={audioLanguage} onValueChange={setAudioLanguage}>
                 <SelectTrigger className="w-32">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="ar-SA">العربية</SelectItem>
                   <SelectItem value="en-US">الإنجليزية</SelectItem>
                   <SelectItem value="auto">تلقائي</SelectItem>
                 </SelectContent>
               </Select>
             </div>
           </div>
           
           <Button onClick={onStartExtract} className="w-full">
             <Upload className="w-4 h-4 ml-2" />
             بدء استخراج الصوت
           </Button>
         </div>
       )}
     </div>
   );
 };
 
 export default UploadStep;
 import { FileText, ArrowLeft } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Progress } from '@/components/ui/progress';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { TranscriptionSegment } from '../types';
 import { useState } from 'react';
 
 interface TranscribeStepProps {
   transcriptions: TranscriptionSegment[];
   processing: boolean;
   progress: number;
   statusMessage: string;
   onStartTranscription: (language: string) => void;
   onGoToEdit: () => void;
 }
 
 const TranscribeStep = ({ 
   transcriptions, 
   processing, 
   progress, 
   statusMessage,
   onStartTranscription,
   onGoToEdit
 }: TranscribeStepProps) => {
   const [language, setLanguage] = useState('ar-SA');
   const [accuracy, setAccuracy] = useState('normal');
 
   return (
     <div className="p-6 space-y-6">
       <div className="bg-muted/30 rounded-lg p-6">
         <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
           <FileText className="w-5 h-5" />
           تحويل الصوت إلى نص
         </h3>
         
         {/* Settings */}
         <div className="flex flex-wrap gap-4 mb-6">
           <div className="flex items-center gap-2">
             <span className="text-sm">لغة الصوت:</span>
             <Select value={language} onValueChange={setLanguage}>
               <SelectTrigger className="w-32">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="ar-SA">العربية</SelectItem>
                 <SelectItem value="en-US">الإنجليزية</SelectItem>
               </SelectContent>
             </Select>
           </div>
           
           <div className="flex items-center gap-2">
             <span className="text-sm">دقة التعرف:</span>
             <Select value={accuracy} onValueChange={setAccuracy}>
               <SelectTrigger className="w-36">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="fast">سريع (دقة أقل)</SelectItem>
                 <SelectItem value="normal">عادي</SelectItem>
                 <SelectItem value="high">عالي الدقة</SelectItem>
               </SelectContent>
             </Select>
           </div>
         </div>
         
         {/* Progress */}
         <div className="space-y-2 mb-4">
           <Progress value={progress} className="h-5" />
           <p className="text-center font-bold">{progress}%</p>
         </div>
         
         <p className="text-center text-muted-foreground mb-6">
           {statusMessage}
         </p>
         
         {/* Start button */}
         {transcriptions.length === 0 && !processing && (
           <Button 
             onClick={() => onStartTranscription(language)} 
             className="w-full"
           >
             بدء التحويل
           </Button>
         )}
         
         {/* Results Preview */}
         {transcriptions.length > 0 && (
           <div className="space-y-4">
             <div className="bg-background rounded-lg p-4 max-h-64 overflow-y-auto space-y-3">
               {transcriptions.slice(0, 5).map((segment) => (
                 <div key={segment.id} className="border rounded-lg p-3">
                   <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                     {segment.startTime} → {segment.endTime}
                   </span>
                   <p className="mt-2 text-sm">{segment.text}</p>
                 </div>
               ))}
               {transcriptions.length > 5 && (
                 <p className="text-center text-muted-foreground">
                   و {transcriptions.length - 5} مقطع إضافي...
                 </p>
               )}
             </div>
             
             <Button onClick={onGoToEdit} className="w-full">
               <ArrowLeft className="w-4 h-4 ml-2" />
               الانتقال إلى التحرير
             </Button>
           </div>
         )}
       </div>
     </div>
   );
 };
 
 export default TranscribeStep;
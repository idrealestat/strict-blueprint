 import { Music, ArrowLeft } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Progress } from '@/components/ui/progress';
 
 interface ExtractStepProps {
   audioBlob: Blob | null;
   processing: boolean;
   progress: number;
   statusMessage: string;
   onStartTranscribe: () => void;
 }
 
 const ExtractStep = ({ audioBlob, processing, progress, statusMessage, onStartTranscribe }: ExtractStepProps) => {
   return (
     <div className="p-6 space-y-6">
       <div className="bg-muted/30 rounded-lg p-6">
         <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
           <Music className="w-5 h-5" />
           استخراج الصوت من الفيديو
         </h3>
         
         {/* Progress */}
         <div className="space-y-2 mb-4">
           <Progress value={progress} className="h-5" />
           <p className="text-center font-bold">{progress}%</p>
         </div>
         
         <p className="text-center text-muted-foreground mb-6">
           {statusMessage || 'جاري الانتظار...'}
         </p>
         
         {/* Audio Preview */}
         {audioBlob && (
           <div className="space-y-4">
             <h4 className="font-medium">معاينة الصوت المستخرج</h4>
             <audio
               src={URL.createObjectURL(audioBlob)}
               controls
               className="w-full"
             />
             <Button 
               onClick={onStartTranscribe} 
               className="w-full"
               disabled={processing}
             >
               <ArrowLeft className="w-4 h-4 ml-2" />
               تحويل الصوت إلى نص
             </Button>
           </div>
         )}
       </div>
     </div>
   );
 };
 
 export default ExtractStep;
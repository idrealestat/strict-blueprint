 import { useState, useCallback } from 'react';
 import { ChevronLeft, ChevronRight, Video } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { useVideoToText } from './hooks/useVideoToText';
 import StepsHeader from './components/StepsHeader';
 import UploadStep from './components/UploadStep';
 import ExtractStep from './components/ExtractStep';
 import TranscribeStep from './components/TranscribeStep';
 import EditStep from './components/EditStep';
 import ExportStep from './components/ExportStep';
 
 const VideoToTextSystem = () => {
   const {
     currentStep,
     setCurrentStep,
     videoFile,
     audioBlob,
     transcriptions,
     setTranscriptions,
     videoDuration,
     processing,
     progress,
     statusMessage,
     handleVideoFile,
     extractAudio,
     startTranscription,
     translateAll,
     adjustTiming,
     mergeSegments,
     splitSegment
   } = useVideoToText();
 
   const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('ar-SA'));
 
   // Update time every second
   useState(() => {
     const interval = setInterval(() => {
       setCurrentTime(new Date().toLocaleTimeString('ar-SA'));
     }, 1000);
     return () => clearInterval(interval);
   });
 
   const handleUpdateTranscription = useCallback((index: number, text: string, isTranslation: boolean) => {
     setTranscriptions(prev => {
       const updated = [...prev];
       if (isTranslation) {
         updated[index] = { ...updated[index], translation: text };
       } else {
         updated[index] = { ...updated[index], text, edited: true };
       }
       return updated;
     });
   }, [setTranscriptions]);
 
   const handleStartExtract = useCallback(async () => {
     await extractAudio();
     setCurrentStep(2);
   }, [extractAudio, setCurrentStep]);
 
   const handleStartTranscribe = useCallback(() => {
     setCurrentStep(3);
   }, [setCurrentStep]);
 
   const handleGoToEdit = useCallback(() => {
     setCurrentStep(4);
   }, [setCurrentStep]);
 
   const prevStep = useCallback(() => {
     if (currentStep > 1) {
       setCurrentStep(currentStep - 1);
     }
   }, [currentStep, setCurrentStep]);
 
   const nextStep = useCallback(() => {
     if (currentStep < 5) {
       setCurrentStep(currentStep + 1);
     }
   }, [currentStep, setCurrentStep]);
 
   return (
     <div className="max-w-6xl mx-auto bg-background rounded-lg shadow-xl overflow-hidden min-h-screen">
       {/* Header */}
       <div className="bg-gradient-to-l from-primary to-secondary text-primary-foreground p-6 text-center">
         <h1 className="text-2xl font-bold flex items-center justify-center gap-3">
           <Video className="w-8 h-8" />
           نظام تحويل الفيديو إلى نص وترجمة
         </h1>
         <p className="mt-2 opacity-90">
           استخراج الصوت → تحويل إلى نص → تحرير → تصدير
         </p>
       </div>
 
       {/* Steps Header */}
       <StepsHeader currentStep={currentStep} />
 
       {/* Step Content */}
       <div className="min-h-[500px]">
         {currentStep === 1 && (
           <UploadStep
             videoFile={videoFile}
             videoDuration={videoDuration}
             onFileSelect={handleVideoFile}
             onStartExtract={handleStartExtract}
           />
         )}
         
         {currentStep === 2 && (
           <ExtractStep
             audioBlob={audioBlob}
             processing={processing}
             progress={progress}
             statusMessage={statusMessage}
             onStartTranscribe={handleStartTranscribe}
           />
         )}
         
         {currentStep === 3 && (
           <TranscribeStep
             transcriptions={transcriptions}
             processing={processing}
             progress={progress}
             statusMessage={statusMessage}
             onStartTranscription={startTranscription}
             onGoToEdit={handleGoToEdit}
           />
         )}
         
         {currentStep === 4 && (
           <EditStep
             transcriptions={transcriptions}
             videoDuration={videoDuration}
             processing={processing}
             onUpdateTranscription={handleUpdateTranscription}
             onTranslateAll={translateAll}
             onAdjustTiming={adjustTiming}
             onMergeSegments={mergeSegments}
             onSplitSegment={splitSegment}
           />
         )}
         
         {currentStep === 5 && (
           <ExportStep
             transcriptions={transcriptions}
             videoFile={videoFile}
             videoDuration={videoDuration}
           />
         )}
       </div>
 
       {/* Footer Navigation */}
       <div className="bg-muted p-4">
         <div className="flex justify-between items-center">
           <Button 
             variant="outline" 
             onClick={prevStep}
             disabled={currentStep === 1}
           >
             <ChevronRight className="w-4 h-4 ml-1" />
             السابق
           </Button>
           
           <span className="text-sm text-muted-foreground">
             © 2024 نظام تحويل الفيديو إلى نص | {currentTime}
           </span>
           
           <Button 
             onClick={nextStep}
             disabled={currentStep === 5}
           >
             التالي
             <ChevronLeft className="w-4 h-4 mr-1" />
           </Button>
         </div>
       </div>
     </div>
   );
 };
 
 export default VideoToTextSystem;
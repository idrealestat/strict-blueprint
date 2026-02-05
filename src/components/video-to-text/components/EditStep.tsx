 import { useState, useCallback } from 'react';
 import { Edit, Languages, Clock, Merge, Split, Search } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Textarea } from '@/components/ui/textarea';
 import { TranscriptionSegment } from '../types';
 import { cn } from '@/lib/utils';
 
 interface EditStepProps {
   transcriptions: TranscriptionSegment[];
   videoDuration: number;
   processing: boolean;
   onUpdateTranscription: (index: number, text: string, isTranslation: boolean) => void;
   onTranslateAll: () => void;
   onAdjustTiming: () => void;
   onMergeSegments: (indices: number[]) => void;
   onSplitSegment: (index: number) => void;
 }
 
 const EditStep = ({
   transcriptions,
   videoDuration,
   processing,
   onUpdateTranscription,
   onTranslateAll,
   onAdjustTiming,
   onMergeSegments,
   onSplitSegment
 }: EditStepProps) => {
   const [searchText, setSearchText] = useState('');
   const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
 
   const toggleSelection = useCallback((index: number) => {
     setSelectedIndices(prev => 
       prev.includes(index) 
         ? prev.filter(i => i !== index)
         : [...prev, index]
     );
   }, []);
 
   const handleMerge = useCallback(() => {
     if (selectedIndices.length >= 2) {
       onMergeSegments(selectedIndices);
       setSelectedIndices([]);
     }
   }, [selectedIndices, onMergeSegments]);
 
   const handleSplit = useCallback(() => {
     if (selectedIndices.length === 1) {
       onSplitSegment(selectedIndices[0]);
       setSelectedIndices([]);
     }
   }, [selectedIndices, onSplitSegment]);
 
   const wordCount = transcriptions.reduce((total, segment) => 
     total + segment.text.split(/\s+/).filter(w => w).length, 0
   );
 
   const filteredTranscriptions = searchText
     ? transcriptions.filter(t => t.text.toLowerCase().includes(searchText.toLowerCase()))
     : transcriptions;
 
   return (
     <div className="p-6 space-y-6">
       <div className="bg-muted/30 rounded-lg p-6">
         <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
           <Edit className="w-5 h-5" />
           تحرير النص والترجمة
         </h3>
         
         {/* Toolbar */}
         <div className="flex flex-wrap gap-2 mb-4 p-3 bg-background rounded-lg">
           <Button 
             variant="outline" 
             size="sm" 
             onClick={onTranslateAll}
             disabled={processing}
           >
             <Languages className="w-4 h-4 ml-1" />
             ترجمة الكل
           </Button>
           <Button variant="outline" size="sm" onClick={onAdjustTiming}>
             <Clock className="w-4 h-4 ml-1" />
             ضبط التوقيت
           </Button>
           <Button 
             variant="outline" 
             size="sm" 
             onClick={handleMerge}
             disabled={selectedIndices.length < 2}
           >
             <Merge className="w-4 h-4 ml-1" />
             دمج ({selectedIndices.length})
           </Button>
           <Button 
             variant="outline" 
             size="sm" 
             onClick={handleSplit}
             disabled={selectedIndices.length !== 1}
           >
             <Split className="w-4 h-4 ml-1" />
             تقسيم
           </Button>
           
           <div className="flex-1 min-w-[200px] relative">
             <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <Input
               placeholder="بحث في النص..."
               value={searchText}
               onChange={(e) => setSearchText(e.target.value)}
               className="pr-9"
             />
           </div>
         </div>
         
         {/* Editor */}
         <div className="grid md:grid-cols-2 gap-4">
           {/* Original Text */}
           <div className="border rounded-lg p-4">
             <h4 className="font-medium mb-3 flex items-center gap-2">
               <Edit className="w-4 h-4" />
               النص الأصلي
             </h4>
             <div className="space-y-3 max-h-[400px] overflow-y-auto">
               {filteredTranscriptions.map((segment, index) => {
                 const originalIndex = transcriptions.findIndex(t => t.id === segment.id);
                 return (
                   <div 
                     key={segment.id}
                     className={cn(
                       "border rounded-lg p-3 cursor-pointer transition-colors",
                       selectedIndices.includes(originalIndex) && "border-primary bg-primary/10"
                     )}
                     onClick={() => toggleSelection(originalIndex)}
                   >
                     <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                       {segment.startTime} → {segment.endTime}
                     </span>
                     <Textarea
                       value={segment.text}
                       onChange={(e) => {
                         e.stopPropagation();
                         onUpdateTranscription(originalIndex, e.target.value, false);
                       }}
                       onClick={(e) => e.stopPropagation()}
                       className="mt-2 min-h-[60px]"
                       dir="rtl"
                     />
                   </div>
                 );
               })}
             </div>
           </div>
           
           {/* Translation */}
           <div className="border rounded-lg p-4">
             <h4 className="font-medium mb-3 flex items-center gap-2">
               <Languages className="w-4 h-4" />
               الترجمة الإنجليزية
             </h4>
             <div className="space-y-3 max-h-[400px] overflow-y-auto">
               {filteredTranscriptions.map((segment, index) => {
                 const originalIndex = transcriptions.findIndex(t => t.id === segment.id);
                 return (
                   <div key={segment.id} className="border rounded-lg p-3">
                     <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                       {segment.startTime} → {segment.endTime}
                     </span>
                     <Textarea
                       value={segment.translation || ''}
                       onChange={(e) => onUpdateTranscription(originalIndex, e.target.value, true)}
                       placeholder="الترجمة..."
                       className="mt-2 min-h-[60px]"
                       dir="ltr"
                     />
                   </div>
                 );
               })}
             </div>
           </div>
         </div>
         
         {/* Stats */}
         <div className="flex gap-6 mt-4 p-3 bg-background rounded-lg text-sm">
           <span>عدد المقاطع: {transcriptions.length}</span>
           <span>عدد الكلمات: {wordCount}</span>
           <span>المدة الإجمالية: {Math.floor(videoDuration / 60)}:{Math.floor(videoDuration % 60).toString().padStart(2, '0')}</span>
         </div>
       </div>
     </div>
   );
 };
 
 export default EditStep;
 /**
  * SocialContentEditorTab.tsx
  * محرر فيديو تفاعلي مثل سناب شات وتيكتوك
  */
 
 import VideoTextEditor from './VideoTextEditor';
 import { ScrollArea } from '@/components/ui/scroll-area';
 
 export default function SocialContentEditorTab() {
   return (
     <ScrollArea className="h-full">
       <div className="p-4 space-y-4">
         {/* العنوان */}
         <div className="bg-gradient-to-r from-primary to-primary/70 rounded-xl p-4 text-primary-foreground">
           <h2 className="text-xl font-bold">محرر الفيديو التفاعلي</h2>
           <p className="text-primary-foreground/80 text-sm">أضف نصوص وشعارات على الفيديو مثل سناب شات وتيكتوك</p>
         </div>
         
         {/* محرر الفيديو */}
         <VideoTextEditor />
       </div>
     </ScrollArea>
   );
 }
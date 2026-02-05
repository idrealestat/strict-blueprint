 /**
  * SocialContentEditorTab.tsx
  * محرر فيديو تفاعلي مثل سناب شات وتيكتوك
  */
 
 import VideoTextEditor from './VideoTextEditor';
 import { ScrollArea } from '@/components/ui/scroll-area';
import SocialPublishPanel from './SocialPublishPanel';
import { useState } from 'react';
import { SocialPlatform, SOCIAL_PLATFORMS, SocialPlatformId } from './types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Send } from 'lucide-react';
 
interface SocialContentEditorTabProps {
  connectedPlatforms?: SocialPlatform[];
}

export default function SocialContentEditorTab({
  connectedPlatforms = SOCIAL_PLATFORMS
}: SocialContentEditorTabProps) {
  const [activeTab, setActiveTab] = useState('editor');
  const [hasContent, setHasContent] = useState(false);
  
  // تتبع وجود محتوى
  const handleExport = (data: any) => {
    setHasContent(data.textOverlays?.length > 0 || data.logo !== null);
  };
  
  // معالجة النشر
  const handlePublish = async (data: {
    description: string;
    hashtags: string[];
    selectedPlatforms: SocialPlatformId[];
  }) => {
    console.log('Publishing to platforms:', data);
    // سيتم التنفيذ الفعلي هنا
  };
  
   return (
    <div className="h-full flex flex-col" dir="rtl">
      {/* العنوان */}
      <div className="p-4 pb-2">
        <div className="bg-gradient-to-r from-primary to-primary/70 rounded-xl p-4 text-primary-foreground">
          <h2 className="text-xl font-bold">محرر الفيديو التفاعلي</h2>
          <p className="text-primary-foreground/80 text-sm">أضف نصوص وشعارات على الفيديو ثم انشره على منصات التواصل</p>
        </div>
      </div>
      
      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              تحرير الفيديو
            </TabsTrigger>
            <TabsTrigger value="publish" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              النشر
            </TabsTrigger>
          </TabsList>
        </div>
        
         {/* العنوان */}
        <TabsContent value="editor" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <VideoTextEditor onExport={handleExport} />
            </div>
          </ScrollArea>
        </TabsContent>
         
        <TabsContent value="publish" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <SocialPublishPanel
                connectedPlatforms={connectedPlatforms}
                hasContent={hasContent}
                onPublish={handlePublish}
              />
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
   );
 }
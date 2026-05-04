 /**
  * SocialContentEditorTab.tsx
 * محرر فيديو تفاعلي مع أكورديون للتحرير والنشر
  */
 
 import VideoTextEditor from './VideoTextEditor';
import SocialPublishPanel from './SocialPublishPanel';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { SocialPlatform, SOCIAL_PLATFORMS, SocialPlatformId } from './types';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Video, Send, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
 
interface SocialContentEditorTabProps {
  connectedPlatforms?: SocialPlatform[];
}

export default function SocialContentEditorTab({
  connectedPlatforms = SOCIAL_PLATFORMS
}: SocialContentEditorTabProps) {
  const [openSection, setOpenSection] = useState<string>('editor');
  const [hasContent, setHasContent] = useState(false);
  const [prefillDescription, setPrefillDescription] = useState<string>('');
  const [prefillHashtags, setPrefillHashtags] = useState<string[]>([]);
  const [prefillVideoUrl, setPrefillVideoUrl] = useState<string>('');
   
   // تحقق من وجود محتوى محفوظ عند التحميل
   useEffect(() => {
     const saved = localStorage.getItem('video-editor-autosave');
     if (saved) {
       try {
         const data = JSON.parse(saved);
         if (data.textOverlays?.length > 0 || data.logo !== null) {
           setHasContent(true);
         }
       } catch (e) {}
     }
   }, []);

  // قراءة بيانات التعبئة المسبقة من تبويب CRM
  useEffect(() => {
    try {
      const raw = localStorage.getItem('wasata_social_prefill');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data?.description) setPrefillDescription(String(data.description));
      if (Array.isArray(data?.hashtags)) setPrefillHashtags(data.hashtags);
      if (data?.videoUrl) {
        setPrefillVideoUrl(String(data.videoUrl));
        setHasContent(true);
        setOpenSection('publish');
      }
      localStorage.removeItem('wasata_social_prefill');
      toast.success('تم تحميل بيانات العرض من بطاقة العميل');
    } catch (e) {
      console.warn('Failed to load social prefill', e);
    }
  }, []);
  
  // تتبع وجود محتوى
  const handleExport = (data: any) => {
     const contentExists = data.textOverlays?.length > 0 || data.logo !== null || data.videoSrc !== null;
     setHasContent(contentExists);
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
  
  // عدد المنصات المرتبطة
  const connectedCount = connectedPlatforms.filter(p => p.status === 'connected').length;
  
   return (
    <div className="h-full min-h-0 flex flex-col overflow-y-auto" dir="rtl">
      {/* العنوان */}
      <div className="p-4 pb-2">
        <div className="bg-gradient-to-r from-primary to-primary/70 rounded-xl p-4 text-primary-foreground">
          <h2 className="text-xl font-bold">محرر الفيديو التفاعلي</h2>
          <p className="text-primary-foreground/80 text-sm">أضف نصوص وشعارات على الفيديو ثم انشره على منصات التواصل</p>
        </div>
      </div>
      
      {/* ملاحظة الاستخدام */}
      <div className="px-4 pb-2">
        <p className="text-xs text-muted-foreground text-center bg-muted/50 rounded-lg py-2">
          👆 المس على العنوان لفتح/إغلاق القسم
        </p>
      </div>
      
      {/* الأكورديون - قسم واحد مفتوح فقط */}
      <div className="px-4 pb-20">
        <Accordion 
          type="single" 
          collapsible
          value={openSection}
          onValueChange={(value) => setOpenSection(value)}
          className="space-y-3"
        >
          {/* قسم تحرير الفيديو */}
          <AccordionItem 
            value="editor" 
            className="border rounded-xl overflow-hidden bg-card shadow-sm"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3 w-full">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Video className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-right">
                  <h3 className="font-bold text-base">تحرير الفيديو</h3>
                  <p className="text-xs text-muted-foreground">أضف نصوص وشعارات على الفيديو</p>
                </div>
                {hasContent && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    محتوى جاهز
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <VideoTextEditor onExport={handleExport} initialVideoUrl={prefillVideoUrl} />
            </AccordionContent>
          </AccordionItem>
          
          {/* قسم النشر */}
          <AccordionItem 
            value="publish" 
            className="border rounded-xl overflow-hidden bg-card shadow-sm"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3 w-full">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Send className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-right">
                  <h3 className="font-bold text-base">النشر على المنصات</h3>
                  <p className="text-xs text-muted-foreground">
                    {connectedCount > 0 
                      ? `${connectedCount} منصات مرتبطة`
                      : 'اربط منصاتك أولاً'}
                  </p>
                </div>
                {!hasContent && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    بحاجة لمحتوى
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <SocialPublishPanel
                connectedPlatforms={connectedPlatforms}
                hasContent={hasContent}
                onPublish={handlePublish}
                initialDescription={prefillDescription}
                initialHashtags={prefillHashtags}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
   );
 }
 import { useState } from 'react';
 import VideoToTextSystem from '@/components/video-to-text/VideoToTextSystem';
 
 const VideoToTextPage = () => {
   return (
     <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20" dir="rtl">
       <VideoToTextSystem />
     </div>
   );
 };
 
 export default VideoToTextPage;
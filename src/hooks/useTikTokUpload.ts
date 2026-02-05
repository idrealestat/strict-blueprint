/**
 * useTikTokUpload.ts
 * Hook لرفع الفيديو ونشره على TikTok
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTikTokAuth } from './useTikTokAuth';

export interface TikTokUploadOptions {
  title: string;
  description: string;
  hashtags: string[];
  privacyLevel?: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY';
  disableDuet?: boolean;
  disableStitch?: boolean;
  disableComment?: boolean;
  videoCoverTimestampMs?: number;
  brandContentToggle?: boolean;
  brandOrganicToggle?: boolean;
}

export interface UploadProgress {
  status: 'idle' | 'initializing' | 'uploading' | 'processing' | 'publishing' | 'success' | 'failed';
  progress: number;
  message: string;
  publishId?: string;
  errorCode?: string;
}

export function useTikTokUpload() {
  const { accessToken, ensureValidToken, isConnected } = useTikTokAuth();
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  // Upload video to TikTok as draft
  const uploadVideo = useCallback(async (
    videoFile: File,
    options: TikTokUploadOptions
  ) => {
    if (!isConnected || !accessToken) {
      toast.error('يرجى ربط حساب تيك توك أولاً');
      return null;
    }

    try {
      // Ensure valid token
      const isValid = await ensureValidToken();
      if (!isValid) {
        toast.error('انتهت صلاحية التفويض، يرجى إعادة الربط');
        return null;
      }

      setUploadProgress({
        status: 'initializing',
        progress: 5,
        message: 'جاري تهيئة الرفع...',
      });

      // Prepare caption with hashtags
      const caption = [
        options.title,
        options.description,
        options.hashtags.join(' ')
      ].filter(Boolean).join('\n\n');

      // Initialize upload
      const { data: initData, error: initError } = await supabase.functions.invoke('tiktok-upload', {
        body: {
          action: 'init_upload',
          accessToken,
          videoSize: videoFile.size,
          caption,
          privacyLevel: options.privacyLevel || 'SELF_ONLY', // Draft by default
          disableDuet: options.disableDuet || false,
          disableStitch: options.disableStitch || false,
          disableComment: options.disableComment || false,
        }
      });

      if (initError || !initData?.uploadUrl) {
        throw new Error(initError?.message || 'فشل في تهيئة الرفع');
      }

      setUploadProgress({
        status: 'uploading',
        progress: 10,
        message: 'جاري رفع الفيديو...',
        publishId: initData.publishId,
      });

      // Upload video file using chunk upload
      const chunkSize = 10 * 1024 * 1024; // 10MB chunks
      const totalChunks = Math.ceil(videoFile.size / chunkSize);
      
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, videoFile.size);
        const chunk = videoFile.slice(start, end);
        
        // Convert chunk to base64
        const buffer = await chunk.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        const { error: uploadError } = await supabase.functions.invoke('tiktok-upload', {
          body: {
            action: 'upload_chunk',
            uploadUrl: initData.uploadUrl,
            chunkData: base64,
            chunkStart: start,
            chunkEnd: end - 1,
            totalSize: videoFile.size,
          }
        });

        if (uploadError) {
          throw new Error('فشل في رفع جزء من الفيديو');
        }

        const progress = 10 + Math.round(((i + 1) / totalChunks) * 70);
        setUploadProgress({
          status: 'uploading',
          progress,
          message: `جاري رفع الفيديو... ${Math.round(((i + 1) / totalChunks) * 100)}%`,
          publishId: initData.publishId,
        });
      }

      setUploadProgress({
        status: 'processing',
        progress: 85,
        message: 'جاري معالجة الفيديو...',
        publishId: initData.publishId,
      });

      // Check upload status
      let attempts = 0;
      const maxAttempts = 30;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: statusData, error: statusError } = await supabase.functions.invoke('tiktok-upload', {
          body: {
            action: 'check_status',
            accessToken,
            publishId: initData.publishId,
          }
        });

        if (statusError) {
          attempts++;
          continue;
        }

        if (statusData?.status === 'PUBLISH_COMPLETE') {
          setUploadProgress({
            status: 'success',
            progress: 100,
            message: 'تم رفع الفيديو بنجاح!',
            publishId: initData.publishId,
          });
          toast.success('تم رفع الفيديو كمسودة على تيك توك');
          return { success: true, publishId: initData.publishId };
        }

        if (statusData?.status === 'FAILED') {
          throw new Error(statusData?.errorMessage || 'فشل في نشر الفيديو');
        }

        attempts++;
      }

      // Timeout but upload might still be processing
      setUploadProgress({
        status: 'success',
        progress: 100,
        message: 'تم إرسال الفيديو للمعالجة. تحقق من تيك توك.',
        publishId: initData.publishId,
      });
      
      return { success: true, publishId: initData.publishId };

    } catch (error) {
      console.error('TikTok upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل في رفع الفيديو';
      
      setUploadProgress({
        status: 'failed',
        progress: 0,
        message: errorMessage,
      });
      
      toast.error(errorMessage);
      return null;
    }
  }, [accessToken, isConnected, ensureValidToken]);

  // Reset upload state
  const resetUpload = useCallback(() => {
    setUploadProgress({
      status: 'idle',
      progress: 0,
      message: '',
    });
  }, []);

  return {
    uploadVideo,
    uploadProgress,
    resetUpload,
    isUploading: ['initializing', 'uploading', 'processing', 'publishing'].includes(uploadProgress.status),
  };
}

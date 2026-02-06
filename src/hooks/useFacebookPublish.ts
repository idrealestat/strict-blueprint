/**
 * useFacebookPublish Hook
 * Handles publishing content to Facebook Pages and Instagram
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface PublishOptions {
  accessToken: string;
  pageId?: string;
  instagramAccountId?: string;
  message?: string;
  caption?: string;
  mediaUrl?: string;
  mediaType?: 'photo' | 'video' | 'IMAGE' | 'VIDEO' | 'REELS';
  link?: string;
}

interface PublishResult {
  success: boolean;
  postId?: string;
  platform: 'facebook' | 'instagram';
  error?: string;
}

export function useFacebookPublish() {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<Record<string, 'pending' | 'success' | 'error'>>({});

  // Publish to Facebook Page
  const publishToFacebook = useCallback(async (options: PublishOptions): Promise<PublishResult> => {
    const { accessToken, pageId, message, mediaUrl, mediaType, link } = options;

    if (!pageId) {
      return { success: false, platform: 'facebook', error: 'Page ID is required' };
    }

    try {
      setPublishStatus(prev => ({ ...prev, [`fb_${pageId}`]: 'pending' }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-publish`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'publish_to_page',
            accessToken,
            pageId,
            message,
            mediaUrl,
            mediaType,
            link
          })
        }
      );

      const result = await response.json();

      if (result.success) {
        setPublishStatus(prev => ({ ...prev, [`fb_${pageId}`]: 'success' }));
        return { success: true, postId: result.postId, platform: 'facebook' };
      } else {
        setPublishStatus(prev => ({ ...prev, [`fb_${pageId}`]: 'error' }));
        return { success: false, platform: 'facebook', error: result.error };
      }
    } catch (error) {
      setPublishStatus(prev => ({ ...prev, [`fb_${pageId}`]: 'error' }));
      return { 
        success: false, 
        platform: 'facebook', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }, []);

  // Publish to Instagram
  const publishToInstagram = useCallback(async (options: PublishOptions): Promise<PublishResult> => {
    const { accessToken, instagramAccountId, caption, mediaUrl, mediaType } = options;

    if (!instagramAccountId) {
      return { success: false, platform: 'instagram', error: 'Instagram Account ID is required' };
    }

    if (!mediaUrl) {
      return { success: false, platform: 'instagram', error: 'Media URL is required for Instagram' };
    }

    try {
      setPublishStatus(prev => ({ ...prev, [`ig_${instagramAccountId}`]: 'pending' }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-publish`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'publish_to_instagram',
            accessToken,
            instagramAccountId,
            caption,
            mediaUrl,
            mediaType: mediaType === 'video' ? 'REELS' : 'IMAGE'
          })
        }
      );

      const result = await response.json();

      if (result.success) {
        setPublishStatus(prev => ({ ...prev, [`ig_${instagramAccountId}`]: 'success' }));
        return { success: true, postId: result.postId, platform: 'instagram' };
      } else {
        setPublishStatus(prev => ({ ...prev, [`ig_${instagramAccountId}`]: 'error' }));
        return { success: false, platform: 'instagram', error: result.error };
      }
    } catch (error) {
      setPublishStatus(prev => ({ ...prev, [`ig_${instagramAccountId}`]: 'error' }));
      return { 
        success: false, 
        platform: 'instagram', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }, []);

  // Publish to multiple platforms
  const publishToAll = useCallback(async (
    targets: Array<{ type: 'facebook' | 'instagram'; id: string; accessToken: string }>,
    content: { message?: string; mediaUrl?: string; mediaType?: 'photo' | 'video' }
  ): Promise<PublishResult[]> => {
    setIsPublishing(true);
    const results: PublishResult[] = [];

    for (const target of targets) {
      if (target.type === 'facebook') {
        const result = await publishToFacebook({
          accessToken: target.accessToken,
          pageId: target.id,
          message: content.message,
          mediaUrl: content.mediaUrl,
          mediaType: content.mediaType
        });
        results.push(result);
      } else if (target.type === 'instagram') {
        const result = await publishToInstagram({
          accessToken: target.accessToken,
          instagramAccountId: target.id,
          caption: content.message,
          mediaUrl: content.mediaUrl,
          mediaType: content.mediaType
        });
        results.push(result);
      }
    }

    setIsPublishing(false);

    // Show summary toast
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    if (successCount > 0 && failCount === 0) {
      toast.success(`تم النشر بنجاح على ${successCount} منصة`);
    } else if (successCount > 0 && failCount > 0) {
      toast.warning(`نجح النشر على ${successCount} منصة، فشل على ${failCount}`);
    } else {
      toast.error('فشل النشر على جميع المنصات');
    }

    return results;
  }, [publishToFacebook, publishToInstagram]);

  // Get insights
  const getPageInsights = useCallback(async (accessToken: string, pageId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-publish`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'get_page_insights',
            accessToken,
            pageId
          })
        }
      );

      const result = await response.json();
      return result.success ? result.insights : null;
    } catch (error) {
      console.error('Get insights error:', error);
      return null;
    }
  }, []);

  const getInstagramInsights = useCallback(async (accessToken: string, instagramAccountId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-publish`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'get_instagram_insights',
            accessToken,
            instagramAccountId
          })
        }
      );

      const result = await response.json();
      return result.success ? result.insights : null;
    } catch (error) {
      console.error('Get Instagram insights error:', error);
      return null;
    }
  }, []);

  // Reset status
  const resetStatus = useCallback(() => {
    setPublishStatus({});
  }, []);

  return {
    isPublishing,
    publishStatus,
    publishToFacebook,
    publishToInstagram,
    publishToAll,
    getPageInsights,
    getInstagramInsights,
    resetStatus
  };
}

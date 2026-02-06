/**
 * Facebook/Instagram Publishing Edge Function
 * Handles posting content to Facebook Pages and Instagram Business accounts
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, accessToken, pageId, instagramAccountId, ...params } = await req.json();

    // Publish to Facebook Page
    if (action === 'publish_to_page') {
      const { message, link, mediaUrl, mediaType } = params;

      let endpoint = `https://graph.facebook.com/v19.0/${pageId}/feed`;
      let body: any = { access_token: accessToken };

      if (mediaType === 'photo' && mediaUrl) {
        endpoint = `https://graph.facebook.com/v19.0/${pageId}/photos`;
        body.url = mediaUrl;
        if (message) body.caption = message;
      } else if (mediaType === 'video' && mediaUrl) {
        endpoint = `https://graph.facebook.com/v19.0/${pageId}/videos`;
        body.file_url = mediaUrl;
        if (message) body.description = message;
      } else {
        body.message = message;
        if (link) body.link = link;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          postId: data.id || data.post_id,
          platform: 'facebook'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Publish to Instagram
    if (action === 'publish_to_instagram') {
      const { caption, mediaUrl, mediaType } = params;

      if (!instagramAccountId) {
        throw new Error('Instagram Business Account ID is required');
      }

      // Step 1: Create media container
      let containerEndpoint = `https://graph.facebook.com/v19.0/${instagramAccountId}/media`;
      let containerBody: any = { access_token: accessToken };

      if (mediaType === 'VIDEO' || mediaType === 'REELS') {
        containerBody.media_type = mediaType;
        containerBody.video_url = mediaUrl;
        if (caption) containerBody.caption = caption;
      } else {
        containerBody.image_url = mediaUrl;
        if (caption) containerBody.caption = caption;
      }

      const containerResponse = await fetch(containerEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(containerBody)
      });

      const containerData = await containerResponse.json();

      if (containerData.error) {
        throw new Error(containerData.error.message);
      }

      const containerId = containerData.id;

      // For videos, wait for processing
      if (mediaType === 'VIDEO' || mediaType === 'REELS') {
        let status = 'IN_PROGRESS';
        let attempts = 0;
        const maxAttempts = 30;

        while (status === 'IN_PROGRESS' && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          const statusResponse = await fetch(
            `https://graph.facebook.com/v19.0/${containerId}?fields=status_code&access_token=${accessToken}`
          );
          const statusData = await statusResponse.json();
          status = statusData.status_code;
          attempts++;

          if (status === 'ERROR') {
            throw new Error('Video processing failed');
          }
        }

        if (status !== 'FINISHED') {
          throw new Error('Video processing timeout');
        }
      }

      // Step 2: Publish the container
      const publishResponse = await fetch(
        `https://graph.facebook.com/v19.0/${instagramAccountId}/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: containerId,
            access_token: accessToken
          })
        }
      );

      const publishData = await publishResponse.json();

      if (publishData.error) {
        throw new Error(publishData.error.message);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          postId: publishData.id,
          platform: 'instagram'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get page insights
    if (action === 'get_page_insights') {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${pageId}/insights?` +
        `metric=page_impressions,page_engaged_users,page_fans&` +
        `period=day&access_token=${accessToken}`
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      return new Response(
        JSON.stringify({ success: true, insights: data.data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Instagram insights
    if (action === 'get_instagram_insights') {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${instagramAccountId}/insights?` +
        `metric=impressions,reach,profile_views&` +
        `period=day&access_token=${accessToken}`
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      return new Response(
        JSON.stringify({ success: true, insights: data.data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Facebook publish error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

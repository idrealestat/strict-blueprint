import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'init_upload': {
        const { 
          accessToken, 
          videoSize, 
          caption, 
          privacyLevel,
          disableDuet,
          disableStitch,
          disableComment,
        } = body;

        if (!accessToken) {
          throw new Error('Access token is required');
        }

        // Determine chunk size based on video size
        const chunkSize = videoSize > 64 * 1024 * 1024 ? 10 * 1024 * 1024 : videoSize;
        const totalChunks = Math.ceil(videoSize / chunkSize);

        // Initialize video upload
        const initResponse = await fetch(`${TIKTOK_API_BASE}/post/publish/video/init/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
          },
          body: JSON.stringify({
            post_info: {
              title: caption?.substring(0, 150) || '',
              privacy_level: privacyLevel || 'SELF_ONLY',
              disable_duet: disableDuet || false,
              disable_stitch: disableStitch || false,
              disable_comment: disableComment || false,
              video_cover_timestamp_ms: 0,
            },
            source_info: {
              source: 'FILE_UPLOAD',
              video_size: videoSize,
              chunk_size: chunkSize,
              total_chunk_count: totalChunks,
            },
          }),
        });

        const initData = await initResponse.json();

        if (initData.error) {
          console.error('Init upload error:', initData);
          throw new Error(initData.error.message || 'Failed to initialize upload');
        }

        return new Response(JSON.stringify({
          uploadUrl: initData.data?.upload_url,
          publishId: initData.data?.publish_id,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'upload_chunk': {
        const { uploadUrl, chunkData, chunkStart, chunkEnd, totalSize } = body;

        if (!uploadUrl || !chunkData) {
          throw new Error('Upload URL and chunk data are required');
        }

        // Decode base64 chunk
        const binaryData = Uint8Array.from(atob(chunkData), c => c.charCodeAt(0));

        // Upload chunk
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'video/mp4',
            'Content-Range': `bytes ${chunkStart}-${chunkEnd}/${totalSize}`,
            'Content-Length': binaryData.length.toString(),
          },
          body: binaryData,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('Chunk upload error:', errorText);
          throw new Error(`Chunk upload failed: ${uploadResponse.status}`);
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'check_status': {
        const { accessToken, publishId } = body;

        if (!accessToken || !publishId) {
          throw new Error('Access token and publish ID are required');
        }

        // Check publish status
        const statusResponse = await fetch(`${TIKTOK_API_BASE}/post/publish/status/fetch/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
          },
          body: JSON.stringify({
            publish_id: publishId,
          }),
        });

        const statusData = await statusResponse.json();

        if (statusData.error) {
          console.error('Status check error:', statusData);
          throw new Error(statusData.error.message || 'Failed to check status');
        }

        return new Response(JSON.stringify({
          status: statusData.data?.status,
          errorMessage: statusData.data?.fail_reason,
          publiclyAvailablePost: statusData.data?.publicly_available_post_id,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('TikTok upload error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

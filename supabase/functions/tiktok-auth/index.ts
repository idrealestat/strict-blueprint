import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2';
const TIKTOK_AUTH_BASE = 'https://www.tiktok.com/v2/auth/authorize';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TIKTOK_CLIENT_KEY = Deno.env.get('TIKTOK_CLIENT_KEY');
    const TIKTOK_CLIENT_SECRET = Deno.env.get('TIKTOK_CLIENT_SECRET');

    if (!TIKTOK_CLIENT_KEY || !TIKTOK_CLIENT_SECRET) {
      throw new Error('TikTok credentials not configured');
    }

    const { action, code, refreshToken, accessToken } = await req.json();
    const CALLBACK_URL = 'https://icfizajxhgkxuwunhvtp.supabase.co/functions/v1/tiktok-callback';

    switch (action) {
      case 'get_auth_url': {
        // Generate state for CSRF protection
        const state = crypto.randomUUID();
        
        // Build authorization URL
        const scopes = ['user.info.basic', 'video.upload', 'video.publish'];
        const authUrl = new URL(TIKTOK_AUTH_BASE);
        authUrl.searchParams.set('client_key', TIKTOK_CLIENT_KEY);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', scopes.join(','));
        authUrl.searchParams.set('redirect_uri', CALLBACK_URL);
        authUrl.searchParams.set('state', state);

        return new Response(JSON.stringify({
          authUrl: authUrl.toString(),
          state,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'exchange_code': {
        if (!code) {
          throw new Error('Authorization code is required');
        }

        // Exchange code for access token
        const tokenResponse = await fetch(`${TIKTOK_API_BASE}/oauth/token/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_key: TIKTOK_CLIENT_KEY,
            client_secret: TIKTOK_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: CALLBACK_URL,
          }),
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
          console.error('Token exchange error:', tokenData);
          throw new Error(tokenData.error_description || 'Token exchange failed');
        }

        return new Response(JSON.stringify({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
          open_id: tokenData.open_id,
          scope: tokenData.scope,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'refresh_token': {
        if (!refreshToken) {
          throw new Error('Refresh token is required');
        }

        const refreshResponse = await fetch(`${TIKTOK_API_BASE}/oauth/token/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_key: TIKTOK_CLIENT_KEY,
            client_secret: TIKTOK_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          }),
        });

        const refreshData = await refreshResponse.json();

        if (refreshData.error) {
          throw new Error(refreshData.error_description || 'Token refresh failed');
        }

        return new Response(JSON.stringify({
          access_token: refreshData.access_token,
          refresh_token: refreshData.refresh_token,
          expires_in: refreshData.expires_in,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_user_info': {
        if (!accessToken) {
          throw new Error('Access token is required');
        }

        const userResponse = await fetch(`${TIKTOK_API_BASE}/user/info/?fields=open_id,display_name,avatar_url,bio_description,profile_deep_link,is_verified,follower_count,following_count,likes_count`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        const userData = await userResponse.json();

        if (userData.error) {
          throw new Error(userData.error.message || 'Failed to fetch user info');
        }

        return new Response(JSON.stringify({
          user: userData.data?.user || null,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('TikTok auth error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

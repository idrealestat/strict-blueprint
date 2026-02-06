/**
 * Facebook OAuth Authentication Edge Function
 * Handles Facebook/Instagram OAuth flow and token exchange
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID');
const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Facebook OAuth scopes for full access
const SCOPES = [
  'ads_management',
  'ads_read',
  'pages_read_engagement',
  'pages_show_list',
  'pages_manage_ads',
  'instagram_manage_comments',
  'instagram_basic',
  'instagram_manage_insights',
  'business_management',
  'catalog_management',
  'email',
  'public_profile'
].join(',');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Get auth URL for OAuth flow
    if (action === 'get_auth_url') {
      const redirectUri = url.searchParams.get('redirect_uri');
      const state = url.searchParams.get('state') || crypto.randomUUID();
      
      if (!FACEBOOK_APP_ID) {
        throw new Error('FACEBOOK_APP_ID is not configured');
      }

      const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?` +
        `client_id=${FACEBOOK_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri || '')}` +
        `&state=${state}` +
        `&scope=${encodeURIComponent(SCOPES)}` +
        `&response_type=code`;

      return new Response(
        JSON.stringify({ authUrl, state }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Exchange code for access token
    if (action === 'exchange_token') {
      const { code, redirectUri } = await req.json();

      if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
        throw new Error('Facebook credentials not configured');
      }

      // Exchange code for short-lived token
      const tokenResponse = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?` +
        `client_id=${FACEBOOK_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&client_secret=${FACEBOOK_APP_SECRET}` +
        `&code=${code}`
      );

      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        throw new Error(tokenData.error.message);
      }

      // Exchange for long-lived token
      const longLivedResponse = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?` +
        `grant_type=fb_exchange_token` +
        `&client_id=${FACEBOOK_APP_ID}` +
        `&client_secret=${FACEBOOK_APP_SECRET}` +
        `&fb_exchange_token=${tokenData.access_token}`
      );

      const longLivedData = await longLivedResponse.json();

      if (longLivedData.error) {
        throw new Error(longLivedData.error.message);
      }

      // Get user info
      const userResponse = await fetch(
        `https://graph.facebook.com/v19.0/me?fields=id,name,email&access_token=${longLivedData.access_token}`
      );
      const userData = await userResponse.json();

      // Get pages
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?access_token=${longLivedData.access_token}`
      );
      const pagesData = await pagesResponse.json();

      // Get Instagram business accounts for each page
      const pages = [];
      if (pagesData.data) {
        for (const page of pagesData.data) {
          const igResponse = await fetch(
            `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
          );
          const igData = await igResponse.json();
          
          pages.push({
            id: page.id,
            name: page.name,
            accessToken: page.access_token,
            instagramBusinessAccountId: igData.instagram_business_account?.id || null
          });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: userData.id,
            name: userData.name,
            email: userData.email
          },
          accessToken: longLivedData.access_token,
          expiresIn: longLivedData.expires_in,
          pages
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get connected pages and Instagram accounts
    if (action === 'get_accounts') {
      const { accessToken } = await req.json();

      // Get pages
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`
      );
      const pagesData = await pagesResponse.json();

      if (pagesData.error) {
        throw new Error(pagesData.error.message);
      }

      const accounts = [];
      if (pagesData.data) {
        for (const page of pagesData.data) {
          // Get long-lived page token
          const pageLongTokenResponse = await fetch(
            `https://graph.facebook.com/v19.0/${page.id}?fields=access_token&access_token=${accessToken}`
          );
          const pageLongTokenData = await pageLongTokenResponse.json();

          // Get Instagram business account
          const igResponse = await fetch(
            `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account{id,username,profile_picture_url}&access_token=${pageLongTokenData.access_token}`
          );
          const igData = await igResponse.json();

          accounts.push({
            type: 'page',
            id: page.id,
            name: page.name,
            accessToken: pageLongTokenData.access_token,
            instagram: igData.instagram_business_account || null
          });
        }
      }

      return new Response(
        JSON.stringify({ success: true, accounts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Refresh token
    if (action === 'refresh_token') {
      const { accessToken } = await req.json();

      if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
        throw new Error('Facebook credentials not configured');
      }

      const response = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?` +
        `grant_type=fb_exchange_token` +
        `&client_id=${FACEBOOK_APP_ID}` +
        `&client_secret=${FACEBOOK_APP_SECRET}` +
        `&fb_exchange_token=${accessToken}`
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      return new Response(
        JSON.stringify({
          success: true,
          accessToken: data.access_token,
          expiresIn: data.expires_in
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Facebook auth error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

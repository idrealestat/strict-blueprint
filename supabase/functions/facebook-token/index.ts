import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FacebookUserResponse {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;

    // Route handling
    if (req.method === 'POST' && (path === 'store' || path === 'facebook-token')) {
      // Store token endpoint
      return await handleStoreToken(req, supabase, userId);
    } else if (req.method === 'GET' && path === 'me') {
      // Get user info endpoint
      return await handleGetMe(supabase, userId);
    } else if (req.method === 'GET' && path === 'status') {
      // Check connection status
      return await handleGetStatus(supabase, userId);
    } else if (req.method === 'DELETE' && path === 'disconnect') {
      // Disconnect Facebook
      return await handleDisconnect(supabase, userId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Not found', path }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Facebook token error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleStoreToken(req: Request, supabase: any, userId: string) {
  const body = await req.json();
  const { access_token, page_id, page_name, instagram_account_id, instagram_username, scopes } = body;

  if (!access_token) {
    return new Response(
      JSON.stringify({ error: 'access_token is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate token with Facebook
  const fbValidation = await fetch(
    `https://graph.facebook.com/debug_token?input_token=${access_token}&access_token=${access_token}`
  );
  const fbValidationData = await fbValidation.json();

  if (fbValidationData.error || !fbValidationData.data?.is_valid) {
    return new Response(
      JSON.stringify({ error: 'Invalid Facebook token', details: fbValidationData.error }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Calculate expiry
  const expiresAt = fbValidationData.data.expires_at 
    ? new Date(fbValidationData.data.expires_at * 1000).toISOString()
    : null;

  // Upsert token
  const { data, error } = await supabase
    .from('facebook_tokens')
    .upsert({
      user_id: userId,
      access_token,
      token_type: 'user',
      expires_at: expiresAt,
      page_id: page_id || null,
      page_name: page_name || null,
      instagram_account_id: instagram_account_id || null,
      instagram_username: instagram_username || null,
      scopes: scopes || fbValidationData.data.scopes || [],
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('Store token error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to store token' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Return success without exposing the token
  return new Response(
    JSON.stringify({
      success: true,
      message: 'Token stored successfully',
      data: {
        id: data.id,
        expires_at: data.expires_at,
        page_id: data.page_id,
        page_name: data.page_name,
        instagram_username: data.instagram_username,
        scopes: data.scopes
      }
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleGetMe(supabase: any, userId: string) {
  // Get stored token
  const { data: tokenData, error: tokenError } = await supabase
    .from('facebook_tokens')
    .select('access_token, expires_at')
    .eq('user_id', userId)
    .single();

  if (tokenError || !tokenData) {
    return new Response(
      JSON.stringify({ error: 'No Facebook token found. Please connect your account first.' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check if token is expired
  if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
    return new Response(
      JSON.stringify({ error: 'Facebook token has expired. Please reconnect your account.' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Fetch user info from Facebook
  const fbResponse = await fetch(
    `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${tokenData.access_token}`
  );
  const fbData: FacebookUserResponse = await fbResponse.json();

  if ((fbData as any).error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch Facebook user info', details: (fbData as any).error }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Return user info (never expose the token)
  return new Response(
    JSON.stringify({
      id: fbData.id,
      name: fbData.name,
      email: fbData.email || null,
      picture: fbData.picture?.data?.url || null
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleGetStatus(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('facebook_tokens')
    .select('id, expires_at, page_id, page_name, instagram_username, scopes, updated_at')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return new Response(
      JSON.stringify({ connected: false }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const isExpired = data.expires_at && new Date(data.expires_at) < new Date();

  return new Response(
    JSON.stringify({
      connected: !isExpired,
      expired: isExpired,
      page_id: data.page_id,
      page_name: data.page_name,
      instagram_username: data.instagram_username,
      scopes: data.scopes,
      last_updated: data.updated_at
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleDisconnect(supabase: any, userId: string) {
  const { error } = await supabase
    .from('facebook_tokens')
    .delete()
    .eq('user_id', userId);

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to disconnect' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, message: 'Facebook account disconnected' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

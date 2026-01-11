import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;

// Valid voice options for TTS
const VALID_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

// Speed range (OpenAI TTS valid range)
const MIN_SPEED = 0.25;
const MAX_SPEED = 4.0;

// Maximum text length (OpenAI TTS limit)
const MAX_TEXT_LENGTH = 4096;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check (signing keys compatible)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error("Missing/invalid Authorization header");
      return new Response(JSON.stringify({
        error: "غير مصرح - يرجى تسجيل الدخول",
        success: false
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: authError } = await userClient.auth.getClaims(token);

    if (authError || !claimsData?.claims?.sub) {
      console.error("Authentication failed:", authError?.message || 'invalid claim: missing sub');
      return new Response(JSON.stringify({
        error: "جلسة غير صالحة - يرجى إعادة تسجيل الدخول",
        success: false
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    console.log("Authenticated user:", userId);

    let { text, voice = 'alloy', speed = 1.0 } = await req.json();
    
    // Validate text exists and is a string
    if (!text || typeof text !== 'string') {
      console.error("Invalid text: missing or not a string");
      return new Response(JSON.stringify({ 
        error: "لم يتم إرسال نص صالح للتحويل",
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Trim and validate text length
    text = text.trim();
    if (text.length === 0) {
      console.error("Empty text after trimming");
      return new Response(JSON.stringify({ 
        error: "النص فارغ",
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      console.error(`Text too long: ${text.length} chars (max: ${MAX_TEXT_LENGTH})`);
      return new Response(JSON.stringify({ 
        error: `النص طويل جداً. الحد الأقصى ${MAX_TEXT_LENGTH} حرف`,
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate and sanitize voice parameter
    if (!voice || typeof voice !== 'string' || !VALID_VOICES.includes(voice.toLowerCase())) {
      console.log(`Invalid voice "${voice}", defaulting to "alloy"`);
      voice = 'alloy';
    } else {
      voice = voice.toLowerCase();
    }

    // Validate and sanitize speed parameter
    if (typeof speed !== 'number' || isNaN(speed) || speed < MIN_SPEED || speed > MAX_SPEED) {
      console.log(`Invalid speed "${speed}", defaulting to 1.0`);
      speed = 1.0;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Converting text to speech for user:", userId, "text:", text.substring(0, 100));
    console.log("Voice:", voice, "Speed:", speed, "Text length:", text.length);

    // استخدام Lovable AI لتوليد الصوت
    const response = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text,
        voice: voice,
        response_format: "mp3",
        speed: speed,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("TTS API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد للاستمرار" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`فشل في توليد الصوت: ${response.status}`);
    }

    // تحويل الاستجابة إلى base64
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // تحويل إلى base64
    let binaryString = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64Audio = btoa(binaryString);

    console.log("Audio generated successfully, size:", uint8Array.length);

    return new Response(JSON.stringify({ 
      audioContent: base64Audio,
      format: "mp3",
      success: true 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Text-to-speech error:", e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : "خطأ في توليد الصوت",
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

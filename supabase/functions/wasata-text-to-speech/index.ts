import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;

// أصوات ElevenLabs - ذكر وأنثى
const VOICE_IDS = {
  male: 'yXEnnEln9armDCyhkXcA',     // صوت رجل (افتراضي)
  female: 'QRq5hPRAKf5ZhSlTBH6r',   // صوت امرأة
};

// ElevenLabs Voice IDs - Arabic-friendly voices (للتوافق مع الأسماء القديمة)
const VOICE_MAP: Record<string, string> = {
  'alloy': 'yXEnnEln9armDCyhkXcA',    // صوت رجل (افتراضي)
  'echo': 'JBFqnCBsd6RMkjVDRZzb',     // George
  'fable': 'N2lVS1w4EtoT3dr4eOWO',    // Callum
  'onyx': 'onwK4e9ZLuTAKqWW03F9',     // Daniel
  'nova': 'QRq5hPRAKf5ZhSlTBH6r',     // صوت امرأة
  'shimmer': 'pFZP5JQG7iQjIQuC4Bku',  // Lily
  'male': 'yXEnnEln9armDCyhkXcA',     // صوت رجل
  'female': 'QRq5hPRAKf5ZhSlTBH6r',   // صوت امرأة
};

// Valid voice options
const VALID_VOICES = Object.keys(VOICE_MAP);

// Maximum text length
const MAX_TEXT_LENGTH = 4096;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
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

    // Get ElevenLabs voice ID
    const voiceId = VOICE_MAP[voice];

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    console.log("Converting text to speech for user:", userId, "text:", text.substring(0, 100));
    console.log("Voice:", voice, "VoiceId:", voiceId, "Text length:", text.length);

    // Use ElevenLabs TTS API with turbo model for faster response
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5", // أسرع - latency منخفض
          voice_settings: {
            stability: 0.4,
            similarity_boost: 0.7,
            style: 0.2,
            use_speaker_boost: true,
            speed: 1.15, // سرعة أعلى قليلاً
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("TTS API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً",
          success: false 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (response.status === 401) {
        return new Response(JSON.stringify({ 
          error: "خطأ في مفتاح API",
          success: false 
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`فشل في توليد الصوت: ${response.status}`);
    }

    // Convert response to base64
    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = base64Encode(arrayBuffer);

    console.log("Audio generated successfully, size:", arrayBuffer.byteLength);

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

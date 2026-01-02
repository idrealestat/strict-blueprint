import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Valid MIME types for audio
const VALID_MIME_TYPES = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/m4a'];

// Maximum audio data size (10MB binary ≈ 13.3MB base64)
const MAX_AUDIO_SIZE = 13 * 1024 * 1024;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioData, mimeType } = await req.json();
    
    // Validate audioData exists and is a string
    if (!audioData || typeof audioData !== 'string') {
      console.error("Invalid audioData: missing or not a string");
      return new Response(JSON.stringify({ 
        error: "لم يتم إرسال بيانات صوتية صالحة",
        text: "",
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate audio data size
    if (audioData.length > MAX_AUDIO_SIZE) {
      console.error(`Audio data too large: ${audioData.length} bytes (max: ${MAX_AUDIO_SIZE})`);
      return new Response(JSON.stringify({ 
        error: "حجم الملف الصوتي كبير جداً. الحد الأقصى 10 ميجابايت",
        text: "",
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate MIME type if provided
    if (mimeType && typeof mimeType === 'string') {
      const isValidMimeType = VALID_MIME_TYPES.some(validType => 
        mimeType.toLowerCase().includes(validType.split('/')[1])
      );
      
      if (!isValidMimeType) {
        console.error(`Invalid MIME type: ${mimeType}`);
        return new Response(JSON.stringify({ 
          error: "صيغة الصوت غير مدعومة. الصيغ المدعومة: webm, wav, mp3, ogg, m4a",
          text: "",
          success: false 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing audio data, length:", audioData.length);
    console.log("MIME type:", mimeType || "not specified");

    // استخدام Lovable AI لتحويل الصوت إلى نص
    // نرسل الصوت كـ base64 مع طلب للنموذج لفهم المحتوى
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `أنت مساعد متخصص في تحويل الصوت إلى نص. 
            عند استلام بيانات صوتية، قم بتحويلها إلى نص عربي واضح.
            أجب فقط بالنص المُستخرج من الصوت، بدون أي تعليقات إضافية.
            إذا لم تستطع فهم الصوت، اكتب: "لم أستطع فهم الصوت بوضوح"`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "استخرج النص من هذا التسجيل الصوتي:"
              },
              {
                type: "input_audio",
                input_audio: {
                  data: audioData,
                  format: mimeType?.includes('webm') ? 'webm' : 'wav'
                }
              }
            ]
          }
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("STT API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات", text: "" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`فشل في تحويل الصوت: ${response.status}`);
    }

    const result = await response.json();
    const transcribedText = result.choices?.[0]?.message?.content || "";
    
    console.log("Transcribed text:", transcribedText);

    return new Response(JSON.stringify({ 
      text: transcribedText,
      success: true 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Speech-to-text error:", e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : "خطأ في تحويل الصوت",
      text: "",
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

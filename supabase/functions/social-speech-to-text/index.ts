 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const formData = await req.formData();
     const audioFile = formData.get("audio") as File;
     
     if (!audioFile) {
       return new Response(
         JSON.stringify({ error: "لم يتم إرسال ملف صوتي" }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
     if (!ELEVENLABS_API_KEY) {
       return new Response(
         JSON.stringify({ error: "ELEVENLABS_API_KEY غير مُعد" }),
         { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // إعداد FormData للإرسال إلى ElevenLabs
     const apiFormData = new FormData();
     apiFormData.append("file", audioFile);
     apiFormData.append("model_id", "scribe_v2");
     apiFormData.append("tag_audio_events", "false");
     apiFormData.append("diarize", "false");
     // لا نحدد language_code للسماح بالكشف التلقائي (يدعم العربية)
 
     console.log("Sending audio to ElevenLabs STT...");
 
     const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
       method: "POST",
       headers: {
         "xi-api-key": ELEVENLABS_API_KEY,
       },
       body: apiFormData,
     });
 
     if (!response.ok) {
       const errorText = await response.text();
       console.error("ElevenLabs STT error:", response.status, errorText);
       return new Response(
         JSON.stringify({ error: `فشل تحويل الصوت: ${response.status}` }),
         { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const transcription = await response.json();
     console.log("Transcription received:", JSON.stringify(transcription).slice(0, 200));
 
     // تنسيق النتيجة مع التوقيت
     const result = {
       text: transcription.text || "",
       words: transcription.words || [],
       language_code: transcription.language_code || "ar",
     };
 
     return new Response(JSON.stringify(result), {
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   } catch (error) {
     console.error("Speech-to-text error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "خطأ غير معروف" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });
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
     const { description } = await req.json();
     
     if (!description || description.trim().length < 5) {
       return new Response(
         JSON.stringify({ error: "يرجى كتابة وصف أطول لتوليد الهاشتاقات" }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
     if (!LOVABLE_API_KEY) {
       throw new Error("LOVABLE_API_KEY is not configured");
     }
 
     const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
       method: "POST",
       headers: {
         Authorization: `Bearer ${LOVABLE_API_KEY}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         model: "google/gemini-3-flash-preview",
         messages: [
           {
             role: "system",
             content: `أنت خبير في التسويق العقاري والسوشيال ميديا في السعودية.
 مهمتك: توليد 8-12 هاشتاق مناسب للمحتوى العقاري.
 
 القواعد:
 - الهاشتاقات يجب أن تكون مرتبطة بالوصف المعطى
 - اجعل بعضها بالعربية وبعضها بالإنجليزية
 - ركز على: الموقع، نوع العقار، الغرض (بيع/إيجار)، المميزات
 - أضف هاشتاقات شائعة في السوق العقاري السعودي
 - لا تضف رموز أو أرقام عشوائية
 
 أعد الهاشتاقات فقط، كل هاشتاق في سطر جديد، بدون ترقيم أو شرح.`
           },
           {
             role: "user",
             content: `ولّد هاشتاقات مناسبة لهذا المحتوى العقاري:\n\n${description}`
           }
         ],
         temperature: 0.7,
         max_tokens: 300,
       }),
     });
 
     if (!response.ok) {
       if (response.status === 429) {
         return new Response(
           JSON.stringify({ error: "تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً" }),
           { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
       if (response.status === 402) {
         return new Response(
           JSON.stringify({ error: "يرجى إضافة رصيد للاستمرار" }),
           { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
       const errorText = await response.text();
       console.error("AI gateway error:", response.status, errorText);
       throw new Error("فشل في توليد الهاشتاقات");
     }
 
     const data = await response.json();
     const content = data.choices?.[0]?.message?.content || "";
     
     // تحويل النص إلى مصفوفة هاشتاقات
     const hashtags = content
       .split('\n')
       .map((line: string) => line.trim())
       .filter((line: string) => line.length > 0)
       .map((tag: string) => tag.startsWith('#') ? tag : `#${tag}`)
       .filter((tag: string) => tag.length > 1 && tag.length < 50);
 
     return new Response(
       JSON.stringify({ hashtags }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
 
   } catch (error) {
     console.error("generate-hashtags error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "خطأ غير معروف" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });
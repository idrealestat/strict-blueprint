import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? '';
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? '';
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('Processing scheduled messages...');
    
    // Get all pending messages that are due
    const now = new Date().toISOString();
    const { data: pendingMessages, error: fetchError } = await supabase
      .from('scheduled_messages')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_time', now)
      .order('scheduled_time', { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error('Error fetching pending messages:', fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pendingMessages || pendingMessages.length === 0) {
      console.log('No pending messages to process');
      return new Response(JSON.stringify({ 
        success: true, 
        processed: 0,
        message: 'No pending messages' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${pendingMessages.length} messages to process`);

    const results = {
      sent: 0,
      failed: 0,
      whatsappPending: 0,
      errors: [] as string[]
    };

    for (const msg of pendingMessages) {
      try {
        if (msg.message_type === 'sms') {
          // Send SMS via Twilio
          const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
          const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
          const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

          if (!accountSid || !authToken || !twilioPhone) {
            throw new Error('Twilio credentials not configured');
          }

          // Format phone number
          let formattedPhone = msg.phone;
          if (formattedPhone.startsWith('0')) {
            formattedPhone = '+966' + formattedPhone.slice(1);
          } else if (!formattedPhone.startsWith('+')) {
            if (formattedPhone.startsWith('966')) {
              formattedPhone = '+' + formattedPhone;
            } else {
              formattedPhone = '+966' + formattedPhone;
            }
          }

          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
          
          const formData = new URLSearchParams();
          formData.append('To', formattedPhone);
          formData.append('From', twilioPhone);
          formData.append('Body', msg.message);

          const response = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || `Twilio error: ${result.code}`);
          }

          // Update message status to sent
          await supabase
            .from('scheduled_messages')
            .update({ 
              status: 'sent', 
              sent_at: new Date().toISOString() 
            })
            .eq('id', msg.id);

          // Log to sms_logs
          await supabase
            .from('sms_logs')
            .insert({
              recipient_phone: formattedPhone,
              message_content: msg.message,
              message_type: 'scheduled',
              status: 'sent',
              twilio_message_sid: result.sid,
              sent_at: new Date().toISOString()
            });

          results.sent++;
          console.log(`SMS sent successfully to ${formattedPhone}`);

        } else if (msg.message_type === 'whatsapp') {
          // WhatsApp messages need to be opened by the user
          // Mark as pending for user action
          await supabase
            .from('scheduled_messages')
            .update({ 
              status: 'whatsapp_pending',
              error_message: 'WhatsApp requires manual sending via browser'
            })
            .eq('id', msg.id);

          results.whatsappPending++;
          console.log(`WhatsApp message marked as pending for ${msg.phone}`);
        }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error processing message ${msg.id}:`, errorMsg);
        
        // Update message status to failed
        await supabase
          .from('scheduled_messages')
          .update({ 
            status: 'failed', 
            error_message: errorMsg 
          })
          .eq('id', msg.id);

        results.failed++;
        results.errors.push(`${msg.id}: ${errorMsg}`);
      }
    }

    console.log('Processing complete:', results);

    return new Response(JSON.stringify({ 
      success: true,
      processed: pendingMessages.length,
      ...results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error processing scheduled messages:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unexpected error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

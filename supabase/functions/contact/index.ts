import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function buildContactEmail(name: string, email: string, phone: string, service: string, message: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333;">
      <div style="background:#b89c6e;padding:20px 28px;border-radius:8px 8px 0 0;">
        <h2 style="color:#fff;margin:0;font-size:1.2rem;">New Contact Form Submission</h2>
      </div>
      <div style="background:#fff;padding:28px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 8px 8px;">
        <p style="margin:0 0 16px;"><strong>Name:</strong> ${name}</p>
        <p style="margin:0 0 16px;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p style="margin:0 0 16px;"><strong>Phone:</strong> ${phone || "Not provided"}</p>
        <p style="margin:0 0 16px;"><strong>Service:</strong> ${service || "Not specified"}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
        <p style="margin:0 0 8px;"><strong>Message:</strong></p>
        <p style="white-space:pre-wrap;color:#555;line-height:1.6;">${message || "No message provided."}</p>
      </div>
    </div>
  `;
}

function buildIntensiveEmail(name: string, email: string, phone: string, message: string): string {
  // Parse the structured message back into fields
  const lines = message.split('\n');
  const get = (label: string) => {
    const line = lines.find(l => l.startsWith(label + ':'));
    return line ? line.replace(label + ': ', '').trim() : 'Not provided';
  };
  const getBlock = (label: string) => {
    const idx = lines.indexOf(label);
    if (idx === -1) return 'Not provided';
    const next = lines.slice(idx + 1).findIndex(l => l === '' && lines[idx + lines.slice(idx+1).findIndex(l2=>l2==='')+2]?.startsWith('What'));
    const block = lines.slice(idx + 1, idx + 1 + (next === -1 ? 5 : next + 1)).join('\n').trim();
    return block || 'Not provided';
  };

  const location = get('Location');
  const format = get('Format Preference');
  const age = get('Age Range');
  const therapyHistory = get('Therapy History');
  const referral = get('Referral Source');
  const availability = get('Preferred Dates');

  // Extract free-text blocks
  const concernsIdx = lines.indexOf('What they hope to understand or work through:');
  const goalsIdx = lines.indexOf('What a meaningful outcome would look like:');
  const notesIdx = lines.indexOf('Additional notes:');

  const concerns = concernsIdx !== -1 ? lines.slice(concernsIdx + 1, goalsIdx !== -1 ? goalsIdx - 1 : undefined).join('\n').trim() : 'Not provided';
  const goals = goalsIdx !== -1 ? lines.slice(goalsIdx + 1, notesIdx !== -1 ? notesIdx - 1 : undefined).join('\n').trim() : 'Not provided';
  const notes = notesIdx !== -1 ? lines.slice(notesIdx + 1).join('\n').trim() : 'None';

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333;">
      <div style="background:#b89c6e;padding:20px 28px;border-radius:8px 8px 0 0;">
        <h2 style="color:#fff;margin:0;font-size:1.2rem;">✦ New Self-Discovery Intensive Inquiry</h2>
      </div>
      <div style="background:#fff;padding:28px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 8px 8px;">

        <h3 style="margin:0 0 16px;font-size:1rem;color:#b89c6e;text-transform:uppercase;letter-spacing:0.08em;">Contact Info</h3>
        <p style="margin:0 0 10px;"><strong>Name:</strong> ${name}</p>
        <p style="margin:0 0 10px;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p style="margin:0 0 10px;"><strong>Phone:</strong> ${phone || "Not provided"}</p>

        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
        <h3 style="margin:0 0 16px;font-size:1rem;color:#b89c6e;text-transform:uppercase;letter-spacing:0.08em;">Logistics</h3>
        <p style="margin:0 0 10px;"><strong>Location:</strong> ${location}</p>
        <p style="margin:0 0 10px;"><strong>Format Preference:</strong> ${format}</p>
        <p style="margin:0 0 10px;"><strong>Age Range:</strong> ${age}</p>
        <p style="margin:0 0 10px;"><strong>Therapy History:</strong> ${therapyHistory}</p>
        <p style="margin:0 0 10px;"><strong>Preferred Dates:</strong> ${availability}</p>
        <p style="margin:0 0 10px;"><strong>How They Heard About You:</strong> ${referral}</p>

        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
        <h3 style="margin:0 0 16px;font-size:1rem;color:#b89c6e;text-transform:uppercase;letter-spacing:0.08em;">What They're Looking For</h3>
        <p style="margin:0 0 8px;"><strong>What they hope to understand or work through:</strong></p>
        <p style="white-space:pre-wrap;color:#555;line-height:1.6;background:#faf8f4;padding:12px;border-radius:6px;">${concerns}</p>

        <p style="margin:16px 0 8px;"><strong>What a meaningful outcome would look like:</strong></p>
        <p style="white-space:pre-wrap;color:#555;line-height:1.6;background:#faf8f4;padding:12px;border-radius:6px;">${goals}</p>

        ${notes && notes !== 'None' ? `
        <p style="margin:16px 0 8px;"><strong>Additional notes:</strong></p>
        <p style="white-space:pre-wrap;color:#555;line-height:1.6;background:#faf8f4;padding:12px;border-radius:6px;">${notes}</p>
        ` : ''}

        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
        <p style="font-size:0.85rem;color:#999;text-align:center;">Reply to <a href="mailto:${email}">${email}</a> within 48 hours</p>
      </div>
    </div>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name, email, phone, service, message } = await req.json();

    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: "Name and email are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert into Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: dbError } = await supabase
      .from("contact_submissions")
      .insert({ name, email, phone, service, message });

    if (dbError) {
      console.error("DB insert error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to save submission." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email notification via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      const isIntensive = service === "Self-Discovery Intensive";
      const subject = isIntensive
        ? `✦ New Intensive Inquiry from ${name}`
        : `New Contact Form Submission from ${name}`;
      const html = isIntensive
        ? buildIntensiveEmail(name, email, phone, message)
        : buildContactEmail(name, email, phone, service, message);

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: "Alynne Davis Website <noreply@alynnedavis.com>",
          to: "info@alynnedavis.com",
          subject,
          html,
        }),
      });

      if (!emailRes.ok) {
        console.error("Resend error:", await emailRes.text());
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

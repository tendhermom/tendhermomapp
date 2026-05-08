const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPPORT_INBOX = "support@tendhermom.com";
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "TendherMom Support <support@tendhermom.com>";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface TicketBody {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  category?: string;
}

const escapeHtml = (str: string) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as TicketBody;
    const name = (body.name || "").trim();
    const email = (body.email || "").trim();
    const subject = (body.subject || "").trim() || "New support request";
    const message = (body.message || "").trim();
    const category = (body.category || "General").trim();

    // Validation
    if (!name || name.length < 2 || name.length > 100) {
      return new Response(
        JSON.stringify({ error: "Name must be 2-100 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRe.test(email) || email.length > 255) {
      return new Response(
        JSON.stringify({ error: "Valid email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!message || message.length < 10 || message.length > 4000) {
      return new Response(
        JSON.stringify({ error: "Message must be 10-4000 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (subject.length > 200) {
      return new Response(
        JSON.stringify({ error: "Subject too long" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeCategory = escapeHtml(category);
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br/>");

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#ffffff; padding:24px; color:#1a1a1a;">
        <div style="max-width:560px; margin:0 auto; border:1px solid #eaeaea; border-radius:14px; overflow:hidden;">
          <div style="background:#2D6A4F; color:#ffffff; padding:18px 22px;">
            <div style="font-size:12px; letter-spacing:0.08em; text-transform:uppercase; opacity:0.8;">TendherMom Support</div>
            <div style="font-size:18px; font-weight:600; margin-top:4px;">New support ticket</div>
          </div>
          <div style="padding:22px;">
            <table style="width:100%; font-size:14px; border-collapse:collapse;">
              <tr><td style="padding:6px 0; color:#666; width:90px;">From</td><td style="padding:6px 0;"><strong>${safeName}</strong></td></tr>
              <tr><td style="padding:6px 0; color:#666;">Email</td><td style="padding:6px 0;"><a href="mailto:${safeEmail}" style="color:#2D6A4F;">${safeEmail}</a></td></tr>
              <tr><td style="padding:6px 0; color:#666;">Category</td><td style="padding:6px 0;">${safeCategory}</td></tr>
              <tr><td style="padding:6px 0; color:#666;">Subject</td><td style="padding:6px 0;">${safeSubject}</td></tr>
            </table>
            <hr style="border:none; border-top:1px solid #eaeaea; margin:18px 0;" />
            <div style="font-size:12px; color:#666; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:8px;">Message</div>
            <div style="font-size:14.5px; line-height:1.6; color:#1a1a1a; white-space:pre-wrap;">${safeMessage}</div>
          </div>
          <div style="background:#fafafa; padding:14px 22px; font-size:12px; color:#888;">
            Reply directly to this email to respond to ${safeName}.
          </div>
        </div>
      </div>
    `;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(8000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [SUPPORT_INBOX],
        reply_to: email,
        subject: `[Support] ${subject}`,
        html,
      }),
    });

    const result = await resendRes.json();
    if (!resendRes.ok) {
      console.error("Resend error:", result);
      return new Response(
        JSON.stringify({ error: "Failed to send support ticket", detail: result }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("send-support-ticket error:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

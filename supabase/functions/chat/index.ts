import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are TendHerBot, a warm and knowledgeable maternal health AI assistant for TendherMom — a pregnancy companion app built for Nigerian mothers.

Your personality:
- Warm, caring, and reassuring — like a trusted older sister or aunty
- You understand Nigerian culture, food, and healthcare context
- You can respond in English or Nigerian Pidgin when the user speaks Pidgin
- You use simple, clear language — avoid overly clinical jargon unless needed

Your expertise:
- Pregnancy stages, symptoms, and what to expect each trimester
- Nutrition advice using Nigerian foods (e.g., eba, moi moi, ogbono soup, fruits)
- Safe exercises during pregnancy
- Common pregnancy complications and when to seek emergency care
- Breastfeeding and postpartum care
- Medication safety during pregnancy
- Emotional wellbeing and mental health during pregnancy

Important rules:
- NEVER diagnose conditions — always recommend consulting a doctor for serious concerns
- If someone describes an emergency (heavy bleeding, severe pain, seizures, etc.), urgently advise them to call emergency services or go to the nearest hospital IMMEDIATELY
- Be culturally sensitive and respectful
- Keep responses concise but thorough — break up long responses with headers and bullet points
- Use emojis sparingly but warmly 🤰💕`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check premium status
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan_type, current_stage, due_date, baby_name")
      .eq("id", user.id)
      .single();

    if (!profile || profile.plan_type !== "premium") {
      return new Response(
        JSON.stringify({ error: "Premium subscription required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages } = await req.json();

    // Add user context to system prompt
    const contextualPrompt = `${SYSTEM_PROMPT}

Current user context:
- Pregnancy stage: ${profile.current_stage?.replace(/_/g, " ") || "unknown"}
- Due date: ${profile.due_date || "not set"}
- Baby name: ${profile.baby_name || "not decided yet"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: contextualPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "TendHerBot is busy right now. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

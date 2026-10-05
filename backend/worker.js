const ALLOWED_ORIGIN = "https://fmalikuk225.github.io";
const AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

function corsHeaders(origin) {
  const allowed = origin === ALLOWED_ORIGIN;

  return {
    "Access-Control-Allow-Origin": allowed ? origin : ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=UTF-8",
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(origin),
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    // Health check
    if (request.method === "GET") {
      return json(
        {
          service: "AMANAH AI RAG",
          status: "operational",
          ai: "Cloudflare Workers AI",
          model: AI_MODEL,
          purpose: "Evidence-grounded trust-risk explanation",
        },
        200,
        origin
      );
    }

    if (request.method !== "POST") {
      return json(
        {
          error: "Method not allowed.",
        },
        405,
        origin
      );
    }

    // Only allow the AMANAH GitHub Pages frontend in browser requests
    if (origin && origin !== ALLOWED_ORIGIN) {
      return json(
        {
          error: "Origin not allowed.",
        },
        403,
        origin
      );
    }

    try {
      if (!env.AI) {
        console.error("AMANAH_AI_ERROR: AI binding is missing.");

        return json(
          {
            mode: "safe_fallback",
            status: "verification_required",
            explanation:
              "The AI service is temporarily unavailable. Retrieved evidence and local trust-signal checks remain available.",
          },
          503,
          origin
        );
      }

      const body = await request.json();

      const content =
        typeof body.content === "string" ? body.content.trim() : "";

      const evidence = Array.isArray(body.evidence)
        ? body.evidence.slice(0, 4)
        : [];

      const language =
        body.language === "ar" ? "Arabic" : "English";

      if (!content || content.length < 5) {
        return json(
          {
            error: "Content is required.",
          },
          400,
          origin
        );
      }

      if (content.length > 6000) {
        return json(
          {
            error: "Content is too long.",
          },
          400,
          origin
        );
      }

      // Do not generate if retrieval produced no approved evidence
      if (evidence.length === 0) {
        return json(
          {
            mode: "abstention",
            status: "verification_required",
            explanation:
              "No sufficiently relevant approved evidence was retrieved. AMANAH will not generate a religious judgement without grounded evidence.",
          },
          200,
          origin
        );
      }

      const evidenceText = evidence
        .map((item, index) => {
          const title = String(
            item.title || `Evidence ${index + 1}`
          );

          const excerpt = String(
            item.excerpt || item.summary || ""
          );

          const source = String(
            item.source || item.url || ""
          );

          return `[E${index + 1}]
Title: ${title}
Evidence: ${excerpt}
Source: ${source}`;
        })
        .join("\n\n");

      const systemPrompt = `
You are the evidence-grounded analysis component of AMANAH AI,
a digital-resilience learning system for Islamic-content environments.

STRICT SAFETY RULES:

1. Do NOT issue a fatwa.
2. Do NOT decide halal or haram.
3. Do NOT certify a religious claim as definitively true or false.
4. Use ONLY the retrieved evidence supplied to you.
5. Never invent a Quran verse, hadith, scholar, institution,
   citation, source, URL, quotation, or religious ruling.
6. If the evidence is insufficient or does not directly support
   an explanation, explicitly state that verification is required.
7. Distinguish source traceability from religious correctness.
8. Your purpose is to explain trust-risk signals and encourage
   responsible verification, not replace qualified religious guidance.
9. Respond in ${language}.
10. Keep the explanation concise and suitable for a public-facing
    educational application.

Return ONLY valid JSON.

Use exactly this structure:

{
  "status": "verification_required",
  "summary": "short grounded explanation",
  "trust_signals": [
    "signal 1",
    "signal 2"
  ],
  "next_step": "one safe practical next step",
  "boundary": "short safety-boundary statement"
}

The status value MUST be one of:

verification_required
caution
evidence_available

Do not include markdown or text outside the JSON object.
`;

      const userPrompt = `
CONTENT RECEIVED:

${content}

APPROVED RETRIEVED EVIDENCE:

${evidenceText}

TASK:

Analyse only the trust-risk and verification implications of the
received content using the approved retrieved evidence.

Do not make an independent religious ruling.
`;

      console.log(
        "AMANAH_AI_REQUEST",
        JSON.stringify({
          model: AI_MODEL,
          evidenceCount: evidence.length,
          language,
        })
      );

      const aiResponse = await env.AI.run(
        AI_MODEL,
        {
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 500,
        }
      );

      console.log("AMANAH_AI_RESPONSE_RECEIVED");

      let raw =
        aiResponse?.response ??
        aiResponse?.result?.response ??
        aiResponse?.result ??
        "";

      if (typeof raw !== "string") {
        raw = JSON.stringify(raw);
      }

      raw = raw
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      let analysis;

      try {
        analysis = JSON.parse(raw);
      } catch (parseError) {
        console.error(
          "AMANAH_AI_PARSE_ERROR:",
          parseError?.message || String(parseError)
        );

        return json(
          {
            mode: "safe_fallback",
            status: "verification_required",
            explanation:
              "AI output could not be safely structured. Retrieved evidence remains available, but AMANAH will not generate an ungrounded religious judgement.",
          },
          200,
          origin
        );
      }

      const allowedStatuses = [
        "verification_required",
        "caution",
        "evidence_available",
      ];

      if (!allowedStatuses.includes(analysis.status)) {
        analysis.status = "verification_required";
      }

      // Ensure expected public fields have safe types
      analysis.summary =
        typeof analysis.summary === "string"
          ? analysis.summary
          : "Verification is required.";

      analysis.trust_signals =
        Array.isArray(analysis.trust_signals)
          ? analysis.trust_signals
              .map((item) => String(item))
              .slice(0, 4)
          : [];

      analysis.next_step =
        typeof analysis.next_step === "string"
          ? analysis.next_step
          : "Verify the original source before relying on or sharing the content.";

      analysis.boundary =
        typeof analysis.boundary === "string"
          ? analysis.boundary
          : "AMANAH explains trust-risk signals and does not issue religious rulings.";

      return json(
        {
          mode: "live_ai",
          grounded: true,
          provider: "Cloudflare Workers AI",
          model: AI_MODEL,
          analysis,
        },
        200,
        origin
      );
    } catch (error) {
      // Diagnostic information stays in Cloudflare logs.
      console.error(
        "AMANAH_AI_ERROR:",
        error?.message || String(error)
      );

      if (error?.stack) {
        console.error("AMANAH_AI_STACK:", error.stack);
      }

      // Do not expose internal exception details to public users.
      return json(
        {
          mode: "safe_fallback",
          status: "verification_required",
          explanation:
            "The AI service is temporarily unavailable. Continue with retrieved evidence and local trust-signal checks; no religious judgement has been generated.",
        },
        503,
        origin
      );
    }
  },
};

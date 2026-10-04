# AMANAH AI — Competition MVP

AMANAH AI is a bilingual (English/Arabic) digital-resilience MVP for AI-era Islamic content.

## Core experience
- **CHECK (RAG-enabled):** retrieves relevant evidence from a controlled source collection, then uses a live LLM to produce a concise trust-risk explanation grounded only in the retrieved evidence.
- **TRAIN:** five controlled scenarios teach users when to trust, verify, skip, or report content.
- **ADAPT:** later practice prioritises the weakest observed session area.
- **PROFILE:** session-only learning indicators across five resilience dimensions.

## AI and RAG boundary
The live AI layer is deliberately constrained. It does **not** issue fatwas, decide halal/haram, certify a religious claim as true/false, or invent religious evidence. Retrieval happens before generation. The prompt supplies only the retrieved approved evidence and instructs the model to use that evidence rather than model memory as religious evidence.

If no sufficiently relevant approved evidence is retrieved, CHECK abstains from LLM generation. If the external AI service is unavailable, CHECK falls back to deterministic trust-signal analysis and still displays the retrieved evidence. This prevents an outage from turning into an unconstrained religious answer.

## Technical stack
- HTML5
- CSS3
- Vanilla JavaScript
- Puter.js browser AI (`puter.ai.chat`) for the live generation step
- Controlled in-app evidence collection and lightweight lexical retrieval
- No application database
- No developer API key stored in the repository

Puter.js uses a user-pays/browser-auth model, so no developer AI secret is embedded in the frontend. Internet access is required for the live AI generation step.

## Run locally
Open `index.html` in a modern browser with internet access. The non-AI experience works locally; live RAG generation requires the Puter.js service to be reachable and may require the user to authorise AI use in the browser.

## Competition integrity
- Controlled/synthetic training scenarios are labelled.
- No fabricated user-study results or psychometric validation claims.
- No claim of universal deepfake detection.
- No claim that the MVP has received scholar/expert validation.
- No API keys, secrets, or database dumps are included.

See `docs/` for architecture, reliability and evidence details.

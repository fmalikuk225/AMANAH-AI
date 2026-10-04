# AMANAH AI MVP Architecture

Browser UI (HTML5 + CSS3 + Vanilla JavaScript)
→ Controlled bilingual scenario library
→ Decision capture
→ Deterministic scoring engine
→ Weakness detection
→ Adaptive next-scenario selector
→ Evidence/provenance feedback
→ Session resilience dashboard

The core MVP intentionally has no mandatory third-party runtime API. This removes API-key leakage, quota, latency and outage risks from the judge journey. A future server-side LLM/RAG enhancement can generate contextual wording, but curated ground truth must remain authoritative.

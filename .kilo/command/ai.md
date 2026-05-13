---
description: AI/OCR operations — test Gemini, switch models, clear quota cache
agent: ai-ocr
subtask: true
---
Manage AI models for OCR staff data extraction.

Usage: /ai <action> [options]

Actions:
  test          Test Gemini API connectivity and quota
  groq          Force fallback to Groq for next extraction
  gemini        Switch back to Gemini (default)
  status        Show current AI model and quota status
  clear-cache   Clear extraction result cache

Examples:
  /ai test               # verify Gemini key works
  /ai groq               # use Groq for all subsequent extractions
  /ai gemini             # switch back to Gemini
  /ai status             # show which model is active
  /ai clear-cache        # clear localStorage extraction cache

How it works:
- Default model: gemini-flash-latest (Google)
- Fallback triggers automatically on quota errors (429)
- Manual override via localStorage flag: localStorage.setItem('ai_fallback', 'groq'|'gemini')
- Current model stored in memory and persisted per session

Testing extraction:
1. Open OCR tab in dashboard
2. Upload a staff document set (CNIC + CV + Electricity Bill)
3. Extraction runs automatically
4. Check console for model used and duration

Quota monitoring:
- Gemini free tier: 60 requests/minute (check Google AI Studio)
- Groq free tier: 5-10k tokens/minute (more generous)
- If both exhausted, extraction fails with error toast

Troubleshooting:
  "API key should be set" → Check VITE_GEMINI_API_KEY in build env (GitHub Secrets)
  "quota exceeded" → switch to /ai groq or wait for quota reset
  "network error" → check browser console, ensure https://nursingcareinfo.github.io is allowed in API key restrictions
  "invalid JSON" → check schema in geminiService.ts, might need prompt tweak

Related: /gemini-status, /env

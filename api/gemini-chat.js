'use strict';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GROQ_MODEL   = process.env.GROQ_MODEL   || 'llama-3.1-8b-instant';

const SYSTEM_PROMPT = `You are Career Pakistan AI — a warm, friendly, and professional career assistant for Pakistani students and professionals.
You specialize in: scholarships, jobs, internships, government exams (MDCAT, CSS, PPSC, NTS, FPSC), study books, and career guidance in Pakistan.
Rules:
- Answer in clear, polite English
- Keep responses short, relevant, and to the point
- Maintain a helpful and respectful tone
- Use web search results when provided — cite them as [Web]
- Use live site data when provided — cite them as [Site]
- Prefer internal site data for Pakistan-related questions
- Never invent deadlines, dates, or amounts
- If unsure, say so honestly and offer a practical next step
- Avoid vague or irrelevant information`;

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
}

async function tryWebSearch(query) {
  const key = process.env.GOOGLE_SEARCH_API_KEY;
  const cx  = process.env.GOOGLE_SEARCH_CX;
  if (!key || !cx) return null;
  try {
    const params = new URLSearchParams({ key, cx, q: `${query} Pakistan`, num:'5', gl:'pk', hl:'en' });
    const r = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) return null;
    const d = await r.json();
    const items = (d.items||[]).slice(0,5);
    if (!items.length) return null;
    return items.map((i,n) => `[${n+1}] ${i.title}\n${(i.snippet||'').replace(/\s+/g,' ').trim().slice(0,250)}\nSource: ${i.link}`).join('\n\n');
  } catch { return null; }
}

function buildPrompt(userMessage, webContext, cmsContext) {
  const parts = [];
  if (webContext) parts.push(`=== LIVE WEB SEARCH RESULTS ===\n${webContext}\n`);
  if (cmsContext) parts.push(`=== CAREER PAKISTAN LIVE DATA ===\n${cmsContext}\n`);
  parts.push(`=== USER QUESTION ===\n${userMessage}`);
  return parts.join('\n');
}

async function callGemini(userMessage, webContext, cmsContext) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');
  const payload = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: buildPrompt(userMessage, webContext, cmsContext) }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
  };
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload), signal:AbortSignal.timeout(15000) }
  );
  if (!r.ok) { const t=await r.text().catch(()=>''); throw new Error(`Gemini ${r.status}: ${t.slice(0,200)}`); }
  const d = await r.json();
  return d?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callGroq(userMessage, webContext, cmsContext) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization':`Bearer ${apiKey}`, 'Content-Type':'application/json' },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role:'system', content:SYSTEM_PROMPT },
        { role:'user',   content:buildPrompt(userMessage, webContext, cmsContext) }
      ],
      temperature: 0.7, max_tokens: 1024
    }),
    signal: AbortSignal.timeout(15000)
  });
  if (!r.ok) { const t=await r.text().catch(()=>''); throw new Error(`Groq ${r.status}: ${t.slice(0,200)}`); }
  const d = await r.json();
  return d?.choices?.[0]?.message?.content || '';
}

async function handler(req, res) {
  if (req.method === 'OPTIONS') { setCors(res); return res.status(204).end(); }
  setCors(res);
  if (req.method !== 'POST') return res.status(405).json({ error:'Method not allowed' });
  res.setHeader('Cache-Control','no-store');

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch(e) { return res.status(400).json({ error:'Invalid JSON body' }); }

  // Accept simple {message,context} OR legacy Gemini {contents:[...]} format
  let userMessage = '';
  let cmsContext  = '';
  if (body.message) {
    userMessage = String(body.message||'').trim();
    cmsContext  = String(body.context||'').trim();
  } else if (Array.isArray(body.contents)) {
    userMessage = (body.contents.find(c=>c.role==='user')?.parts||[]).map(p=>p.text||'').join('\n');
    cmsContext  = (body.system_instruction?.parts||[]).map(p=>p.text||'').join('\n');
  }

  if (!userMessage) return res.status(400).json({ error:'Missing message' });

  // Step 1: Web search for fresh context
  const webContext = await tryWebSearch(userMessage);

  // Step 2: Try Gemini
  try {
    const reply = await callGemini(userMessage, webContext, cmsContext);
    if (reply) return res.status(200).json({ reply, source:'gemini', hasWebSearch:!!webContext });
  } catch(e) { console.warn('[CareerPK] Gemini failed:', e.message); }

  // Step 3: Groq fallback
  try {
    const reply = await callGroq(userMessage, webContext, cmsContext);
    if (reply) return res.status(200).json({ reply, source:'groq', hasWebSearch:!!webContext });
  } catch(e) { console.error('[CareerPK] Groq failed:', e.message); }

  return res.status(502).json({ error:'AI service temporarily unavailable. Please try again.' });
}

module.exports = handler;

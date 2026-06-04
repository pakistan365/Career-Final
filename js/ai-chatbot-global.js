// Career Pakistan — ai-chatbot-global.js
// Injects AI chatbot FAB + panel on every page that loads this script.
// Designed to work alongside existing app.js functions (escapeHtml, etc.)

(function(){
  'use strict';
  if(window._CP_AI_LOADED) return;
  window._CP_AI_LOADED = true;

  // Inject CSS
  const style = document.createElement('style');
  style.textContent = `
.cp-ai-fab{position:fixed;bottom:80px;right:20px;z-index:9999;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#0f766e 0%,#0284c7 100%);border:none;color:#fff;font-size:1.25rem;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,.28);display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s;}
.cp-ai-fab:hover{transform:scale(1.08);box-shadow:0 8px 32px rgba(0,0,0,.32);}
.cp-ai-dot{position:absolute;top:-1px;right:-1px;width:15px;height:15px;background:#22c55e;border-radius:50%;border:2px solid #fff;animation:cpFabPulse 2s ease-in-out infinite;}
@keyframes cpFabPulse{0%,100%{transform:scale(1);}50%{transform:scale(1.2);}}
.cp-ai-panel{position:fixed;bottom:148px;right:20px;z-index:9998;width:340px;background:var(--bg-card,#fff);border:1px solid var(--border,#e2e8f0);border-radius:18px;box-shadow:0 20px 72px rgba(0,0,0,.16);display:none;flex-direction:column;overflow:hidden;max-height:500px;}
.cp-ai-panel.open{display:flex;}
.cp-ai-head{background:linear-gradient(135deg,#0f766e,#0284c7);color:#fff;padding:.9rem 1rem;display:flex;align-items:center;gap:.7rem;}
.cp-ai-avatar{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;}
.cp-ai-info{flex:1;min-width:0;}
.cp-ai-name{font-size:.88rem;font-weight:700;line-height:1;}
.cp-ai-status{font-size:.7rem;opacity:.82;margin-top:.1rem;display:flex;align-items:center;gap:.3rem;}
.cp-ai-sdot{width:7px;height:7px;border-radius:50%;background:#22c55e;flex-shrink:0;}
.cp-ai-close{background:rgba(255,255,255,.18);border:none;color:#fff;border-radius:50%;width:30px;height:30px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.82rem;flex-shrink:0;transition:background .15s;}
.cp-ai-close:hover{background:rgba(255,255,255,.3);}
.cp-ai-msgs{flex:1;overflow-y:auto;padding:.9rem;display:flex;flex-direction:column;gap:.55rem;}
.cp-ai-msg{max-width:88%;padding:.6rem .85rem;border-radius:12px;font-size:.82rem;line-height:1.55;}
.cp-ai-msg.bot{background:var(--bg-body,#f8fafc);border:1px solid var(--border,#e2e8f0);color:var(--text-main,#1e293b);align-self:flex-start;border-radius:14px 14px 14px 4px;}
.cp-ai-msg.user{background:#0f766e;color:#fff;align-self:flex-end;border-radius:14px 14px 4px 14px;}
.cp-ai-typing{display:flex;gap:4px;align-items:center;}
.cp-ai-typing span{width:7px;height:7px;background:var(--text-muted,#94a3b8);border-radius:50%;animation:cpDot 1.2s ease-in-out infinite;}
.cp-ai-typing span:nth-child(2){animation-delay:.2s;}
.cp-ai-typing span:nth-child(3){animation-delay:.4s;}
@keyframes cpDot{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-6px);}}
.cp-ai-footer{display:flex;gap:.4rem;padding:.65rem;border-top:1px solid var(--border,#e2e8f0);}
.cp-ai-input{flex:1;border:1.5px solid var(--border,#e2e8f0);border-radius:999px;padding:.5rem .95rem;font-size:.82rem;outline:none;background:var(--bg-body,#f8fafc);color:var(--text-main,#1e293b);transition:border .18s;}
.cp-ai-input:focus{border-color:#0f766e;}
.cp-ai-send{background:#0f766e;border:none;color:#fff;border-radius:50%;width:36px;height:36px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.85rem;flex-shrink:0;transition:background .18s;}
.cp-ai-send:hover{background:#0e6b63;}
body.dark .cp-ai-panel{background:#1e293b;border-color:#374151;}
body.dark .cp-ai-msg.bot{background:#0f172a;border-color:#374151;color:#f3f4f6;}
body.dark .cp-ai-input{background:#0f172a;border-color:#374151;color:#f3f4f6;}
@media(max-width:768px){.cp-ai-panel{width:min(92vw,340px);right:10px;bottom:132px;max-height:min(62vh,450px);}.cp-ai-fab{right:10px;bottom:76px;}}
  `;
  document.head.appendChild(style);

  // Inject HTML
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <button class="cp-ai-fab" id="cpAiFab" aria-label="Open AI Career Assistant" title="Ask Career AI">
      <i class="fa fa-robot" id="cpAiIcon"></i>
      <span class="cp-ai-dot"></span>
    </button>
    <div class="cp-ai-panel" id="cpAiPanel" role="dialog" aria-modal="true" aria-label="Career AI Assistant">
      <div class="cp-ai-head">
        <div class="cp-ai-avatar"><i class="fa fa-robot"></i></div>
        <div class="cp-ai-info">
          <div class="cp-ai-name">Career AI Assistant</div>
          <div class="cp-ai-status"><span class="cp-ai-sdot"></span> Online — Ask me anything</div>
        </div>
        <button class="cp-ai-close" id="cpAiClose" aria-label="Close"><i class="fa fa-times"></i></button>
      </div>
      <div class="cp-ai-msgs" id="cpAiMsgs">
        <div class="cp-ai-msg bot">👋 Hi! I'm your <strong>Career Pakistan AI</strong>.<br>Ask me about scholarships, jobs, exams, internships, or books in Pakistan!</div>
      </div>
      <div class="cp-ai-footer">
        <input type="text" class="cp-ai-input" id="cpAiInput" placeholder="Ask something…" aria-label="Your question"/>
        <button class="cp-ai-send" id="cpAiSend" aria-label="Send"><i class="fa fa-paper-plane"></i></button>
      </div>
    </div>`;
  document.body.appendChild(wrap);

  let _open = false;

  function toggleCpAI() {
    _open = !_open;
    const panel = document.getElementById('cpAiPanel');
    const icon  = document.getElementById('cpAiIcon');
    if (panel) panel.classList.toggle('open', _open);
    if (icon)  icon.className = _open ? 'fa fa-times' : 'fa fa-robot';
    if (_open) setTimeout(() => { const i=document.getElementById('cpAiInput');if(i)i.focus(); }, 180);
  }

  function esc(v) { return String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  async function cpSendAI() {
    const inp  = document.getElementById('cpAiInput');
    const msgs = document.getElementById('cpAiMsgs');
    if (!inp || !msgs) return;
    const q = inp.value.trim();
    if (!q) return;
    inp.value = '';
    inp.disabled = true;

    msgs.insertAdjacentHTML('beforeend', `<div class="cp-ai-msg user">${esc(q)}</div>`);
    const tid = 'cpt-'+Date.now();
    msgs.insertAdjacentHTML('beforeend', `<div class="cp-ai-msg bot" id="${tid}"><span class="cp-ai-typing"><span></span><span></span><span></span></span><span style="font-size:.68rem;opacity:.5;margin-left:.35rem">Searching…</span></div>`);
    msgs.scrollTop = msgs.scrollHeight;

    // Local-first search: look inside window.CMS_DATA for matches
    const D = window.CMS_DATA || {};
    const qLower = q.toLowerCase();
    const localMatches = [];
    const gather = (arr, type) => {
      if (!Array.isArray(arr)) return;
      for (let i=0;i<arr.length && localMatches.length<6;i++) {
        const it = arr[i];
        let matched = false;
        if (typeof window.matchesTextSearch === 'function') matched = matchesTextSearch(it, qLower);
        else matched = Object.values(it||{}).some(v => String(v||'').toLowerCase().includes(qLower));
        if (matched) localMatches.push({type, item: it});
      }
    };
    gather(D.Scholarships, 'scholarship');
    gather(D.Jobs, 'job');
    gather(D.Internships, 'internship');
    gather(D.Exams, 'exam');
    gather(D.Books, 'book');

    if (localMatches.length > 0) {
      // Prefer local results: render top 3 inline in chat as cards/list
      const top = localMatches.slice(0,3);
      const rendered = top.map(m => {
        try {
          const renderer = m.type === 'scholarship' ? window.cardScholarship : m.type === 'job' ? window.cardJob : m.type === 'internship' ? window.cardInternship : m.type === 'exam' ? window.cardExam : window.cardBook;
          if (typeof renderer === 'function') return renderer(m.item);
        } catch (e) {}
        return `<div style="padding:.5rem .6rem;border-radius:8px;border:1px solid #eee;margin-bottom:.5rem"><strong>${esc(m.item.title||m.item.name||'Untitled')}</strong><div style="font-size:.86rem;color:#6b7280">${esc(m.item.organization||m.item.company||m.item.institution||'')}</div></div>`;
      }).join('');
      const el = document.getElementById(tid);
      if (el) el.outerHTML = `<div class="cp-ai-msg bot">Here are results from this site:<div style="margin-top:.6rem">${rendered}</div></div>`;
      inp.disabled = false; inp.focus(); msgs.scrollTop = msgs.scrollHeight; return;
    }

    // No local match — fallback to API web search
    const ctx = [
      'Scholarships: '+(D.Scholarships||[]).slice(0,3).map(x=>x.title).filter(Boolean).join(', '),
      'Jobs: '+(D.Jobs||[]).slice(0,3).map(x=>x.title).filter(Boolean).join(', '),
      'Exams: '+(D.Exams||[]).slice(0,3).map(x=>x.title).filter(Boolean).join(', '),
      'Internships: '+(D.Internships||[]).slice(0,2).map(x=>x.title).filter(Boolean).join(', '),
    ].filter(s=>!s.endsWith(': ')).join(' | ');

    try {
      const r    = await fetch('/api/gemini-chat', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({message:q,context:ctx,allowWebFallback:true}) });
      const data = await r.json();
      const reply = data.reply || data.message || 'Sorry, I could not get a response right now.';
      const webBadge = data.hasWebSearch ? ' <span style="font-size:.62rem;opacity:.45">🌐</span>' : '';
      const el = document.getElementById(tid);
      if (el) el.outerHTML = `<div class="cp-ai-msg bot">${esc(reply)}${webBadge}</div>`;
    } catch {
      const el = document.getElementById(tid);
      if (el) el.outerHTML = `<div class="cp-ai-msg bot">⚠️ Connection error. Please try again.</div>`;
    }

    inp.disabled = false;
    inp.focus();
    msgs.scrollTop = msgs.scrollHeight;
  }

  document.getElementById('cpAiFab').addEventListener('click', toggleCpAI);
  document.getElementById('cpAiClose').addEventListener('click', toggleCpAI);
  document.getElementById('cpAiSend').addEventListener('click', cpSendAI);
  document.getElementById('cpAiInput').addEventListener('keydown', e => { if(e.key==='Enter') cpSendAI(); });

  // Expose globally
  window.toggleCpAI = toggleCpAI;
})();

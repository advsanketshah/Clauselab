/* ── AI Review page (BYOK) ── */
(function () {
  'use strict';
  const CL = window.Clauselab;
  if (!CL) return;

  const PROVIDERS = {
    gemini: {
      label: 'Google Gemini (free tier available)',
      keyHelp: 'Get a free key at aistudio.google.com',
      default_model: 'gemini-2.0-flash',
      models: ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro'],
      call: async (apiKey, model, systemPrompt, userPrompt) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const body = {
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { temperature: 0.3, maxOutputTokens: 2500 }
        };
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!r.ok) throw new Error(`Gemini API error ${r.status}: ${await r.text()}`);
        const data = await r.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Empty response from Gemini');
        return text;
      }
    },
    openai: {
      label: 'OpenAI (GPT-4 / GPT-4o)',
      keyHelp: 'Get a key at platform.openai.com',
      default_model: 'gpt-4o-mini',
      models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
      call: async (apiKey, model, systemPrompt, userPrompt) => {
        const r = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 2500
          })
        });
        if (!r.ok) throw new Error(`OpenAI API error ${r.status}: ${await r.text()}`);
        const data = await r.json();
        return data.choices?.[0]?.message?.content || '';
      }
    },
    anthropic: {
      label: 'Anthropic Claude',
      keyHelp: 'Get a key at console.anthropic.com',
      default_model: 'claude-haiku-4-5',
      models: ['claude-haiku-4-5', 'claude-sonnet-4-6', 'claude-opus-4-6'],
      call: async (apiKey, model, systemPrompt, userPrompt) => {
        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({
            model,
            max_tokens: 2500,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }]
          })
        });
        if (!r.ok) throw new Error(`Anthropic API error ${r.status}: ${await r.text()}`);
        const data = await r.json();
        return data.content?.[0]?.text || '';
      }
    }
  };

  const REVIEW_TYPES = {
    issues: {
      label: 'Issues & risks',
      system: `You are a contract review assistant for a senior technology lawyer. Your job is to identify issues, risks, and red flags in the draft provided. You never give definitive legal advice; you surface concerns for the lawyer's review. Use clear, direct language. No filler, no hedging corporate voice, no em dashes. Structure output with short headings and bullet points. Flag by severity: High (blocking), Medium (negotiate), Low (preference).`,
      user: (text) => `Review the following contract text and identify issues. Focus on risk allocation, ambiguity, missing protections, and clauses that favour the counterparty disproportionately.\n\n---\n${text}\n---\n\nFormat: start with a 2-line summary, then list issues grouped by severity. Do not rewrite the contract.`
    },
    redlines: {
      label: 'Redline suggestions',
      system: `You are a contract review assistant for a senior technology lawyer. Produce specific redline suggestions showing exactly what to change. Use clear, direct language without em dashes or filler. Each redline should identify the original text, propose revised text, and explain why briefly. Do not write in corporate voice.`,
      user: (text) => `Provide redline suggestions for the following contract. Identify 5 to 10 highest-impact changes. For each, show the original language, proposed revision, and a one-sentence rationale.\n\n---\n${text}\n---`
    },
    summary: {
      label: 'Plain-English summary',
      system: `You are a contract review assistant for a senior technology lawyer. Summarise contracts in plain English for a business audience. No legalese, no em dashes, no corporate filler. Be direct and punchy.`,
      user: (text) => `Summarise the following contract in plain English. Cover: parties, purpose, key commercial terms, risks, termination, and anything unusual. Keep it under 400 words.\n\n---\n${text}\n---`
    },
    dpdpa: {
      label: 'DPDPA / GDPR compliance check',
      system: `You are a data protection review assistant for a senior privacy lawyer with expertise in the Digital Personal Data Protection Act, 2023 (India) and the GDPR. Identify gaps against these frameworks. Cite specific provisions where relevant (DPDPA sections, GDPR articles). Use clear, direct language. No em dashes, no filler.`,
      user: (text) => `Review the following contract or DPA against the DPDPA 2023 and the GDPR. Identify gaps, missing provisions, and non-compliant language. Reference specific DPDPA sections and GDPR articles. Suggest fixes briefly.\n\n---\n${text}\n---`
    },
    missing: {
      label: 'Missing clauses check',
      system: `You are a contract completeness checker for a senior technology lawyer. Identify clauses that are missing or underdeveloped given the contract's type and purpose. Use direct language. No em dashes, no corporate filler.`,
      user: (text) => `Review the following contract and identify material clauses that appear to be missing or inadequately addressed given its type and purpose. Explain why each is relevant. Do not repeat clauses already present.\n\n---\n${text}\n---`
    }
  };

  function getCfg() { return CL.settings.get(); }

  function renderProviderConfig() {
    const cfg = getCfg();
    const select = document.getElementById('ai-provider');
    select.innerHTML = Object.entries(PROVIDERS).map(([k, p]) =>
      `<option value="${k}"${cfg.provider === k ? ' selected' : ''}>${p.label}</option>`
    ).join('');
    const providerKey = cfg.provider || 'gemini';
    renderModelOptions(providerKey);
    document.getElementById('key-help').textContent = PROVIDERS[providerKey].keyHelp;
    document.getElementById('ai-key').value = cfg[`${providerKey}_key`] || '';
  }

  function renderModelOptions(providerKey) {
    const provider = PROVIDERS[providerKey];
    const cfg = getCfg();
    const modelSel = document.getElementById('ai-model');
    const currentModel = cfg[`${providerKey}_model`] || provider.default_model;
    modelSel.innerHTML = provider.models.map(m =>
      `<option value="${m}"${currentModel === m ? ' selected' : ''}>${m}</option>`
    ).join('');
  }

  function saveProviderConfig() {
    const providerKey = document.getElementById('ai-provider').value;
    const apiKey = document.getElementById('ai-key').value.trim();
    const model = document.getElementById('ai-model').value;
    CL.settings.update({
      provider: providerKey,
      [`${providerKey}_key`]: apiKey,
      [`${providerKey}_model`]: model
    });
  }

  async function runReview() {
    saveProviderConfig();
    const cfg = getCfg();
    const providerKey = cfg.provider || 'gemini';
    const provider = PROVIDERS[providerKey];
    const apiKey = cfg[`${providerKey}_key`];
    const model = cfg[`${providerKey}_model`] || provider.default_model;
    const text = document.getElementById('review-text').value.trim();
    const reviewType = document.getElementById('review-type').value;

    if (!apiKey) { CL.ui.toast('Add your API key in the settings above', 'error'); return; }
    if (!text) { CL.ui.toast('Paste contract text to review', 'error'); return; }
    if (text.length < 50) { CL.ui.toast('Contract text is too short to review meaningfully', 'error'); return; }

    const type = REVIEW_TYPES[reviewType];
    const out = document.getElementById('review-output');
    const btn = document.getElementById('btn-review');
    btn.disabled = true;
    btn.textContent = 'Analysing…';
    out.innerHTML = '<div class="text-muted">Running analysis. This may take 10-30 seconds depending on contract length and model chosen.</div>';

    try {
      const result = await provider.call(apiKey, model, type.system, type.user(text));
      out.innerHTML = formatReviewOutput(result);
    } catch (e) {
      out.innerHTML = `<div class="notice" style="background: var(--danger-light); border-color: #FCA5A5; color: #7F1D1D;">
        <strong>Request failed.</strong> ${CL.util.escapeHtml(e.message)}
        <div class="mt-1 text-xs">Check your API key, network connection, and that your key has access to the selected model. The key never leaves your browser.</div>
      </div>`;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Run review';
    }
  }

  function formatReviewOutput(raw) {
    let html = CL.util.escapeHtml(raw);
    // Basic markdown rendering
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^# (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/^\s*[-*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.+<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
    html = html.replace(/\n\n/g, '</p><p>');
    return `<p>${html}</p>`;
  }

  function copyOutput() {
    const text = document.getElementById('review-output').innerText;
    if (!text) return;
    navigator.clipboard.writeText(text).then(
      () => CL.ui.toast('Copied to clipboard', 'success'),
      () => CL.ui.toast('Copy failed', 'error')
    );
  }

  function downloadOutput() {
    const text = document.getElementById('review-output').innerText;
    if (!text) return;
    const date = new Date().toISOString().slice(0, 10);
    CL.util.download(`clauselab-review-${date}.txt`, text, 'text/plain');
  }

  function attachHandlers() {
    document.getElementById('ai-provider').addEventListener('change', (e) => {
      const pk = e.target.value;
      CL.settings.update({ provider: pk });
      renderModelOptions(pk);
      document.getElementById('key-help').textContent = PROVIDERS[pk].keyHelp;
      document.getElementById('ai-key').value = getCfg()[`${pk}_key`] || '';
    });
    document.getElementById('ai-key').addEventListener('change', saveProviderConfig);
    document.getElementById('ai-model').addEventListener('change', saveProviderConfig);
    document.getElementById('btn-review').addEventListener('click', runReview);
    document.getElementById('btn-copy').addEventListener('click', copyOutput);
    document.getElementById('btn-download-review').addEventListener('click', downloadOutput);
    document.getElementById('btn-clear').addEventListener('click', () => {
      document.getElementById('review-text').value = '';
      document.getElementById('review-output').innerHTML = '<div class="text-muted">Output will appear here. Your contract text and API key never leave your browser.</div>';
    });

    // Pre-fill review type options
    const typeSel = document.getElementById('review-type');
    typeSel.innerHTML = Object.entries(REVIEW_TYPES).map(([k, t]) =>
      `<option value="${k}">${t.label}</option>`
    ).join('');

    // If a clause was sent from the clauses page
    const pre = sessionStorage.getItem('clauselab:review-text');
    if (pre) {
      document.getElementById('review-text').value = pre;
      sessionStorage.removeItem('clauselab:review-text');
    }
    const preTitle = sessionStorage.getItem('clauselab:review-title');
    if (preTitle) sessionStorage.removeItem('clauselab:review-title');
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderProviderConfig();
    attachHandlers();
  });
})();

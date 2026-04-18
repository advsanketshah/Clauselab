/* ── Drafter page ── */
(function () {
  'use strict';
  const CL = window.Clauselab;
  if (!CL) return;

  let templates = [];
  let currentTemplate = null;
  let values = {};

  function renderTemplateList() {
    const container = document.getElementById('template-list');
    container.innerHTML = templates.map(t => `
      <div class="clause-cat${currentTemplate && currentTemplate.id === t.id ? ' active' : ''}" data-tpl="${t.id}">
        <span>${CL.util.escapeHtml(t.title)}</span>
      </div>
    `).join('');
  }

  function renderFields() {
    if (!currentTemplate) {
      document.getElementById('field-form').innerHTML = '<p class="text-muted text-sm">Select a template on the left to begin.</p>';
      document.getElementById('drafter-preview').innerHTML = `<div class="empty">
        <div class="empty-icon">📄</div>
        <div class="empty-title">No template selected</div>
        <div class="empty-desc">Pick a template from the list on the left. Fill in the fields, and a draft will be assembled here in real time. Export as Word or PDF when ready.</div>
      </div>`;
      return;
    }
    const html = `
      <div class="text-sm text-muted mb-2">${CL.util.escapeHtml(currentTemplate.description || '')}</div>
      ${currentTemplate.fields.map(f => renderField(f)).join('')}
    `;
    document.getElementById('field-form').innerHTML = html;
    currentTemplate.fields.forEach(f => {
      const el = document.getElementById(`tpl-${f.id}`);
      if (!el) return;
      el.addEventListener('input', () => { values[f.id] = el.value; renderPreview(); });
      el.addEventListener('change', () => { values[f.id] = el.value; renderPreview(); });
      if (f.default && !values[f.id]) {
        values[f.id] = f.default;
        el.value = f.default;
      }
    });
    renderPreview();
  }

  function renderField(f) {
    const val = CL.util.escapeHtml(values[f.id] || f.default || '');
    const placeholder = CL.util.escapeHtml(f.placeholder || '');
    if (f.type === 'select') {
      return `<div class="field">
        <label>${CL.util.escapeHtml(f.label)}</label>
        <select id="tpl-${f.id}" class="select">
          ${(f.options || []).map(o => `<option value="${CL.util.escapeHtml(o)}"${val === o ? ' selected' : ''}>${CL.util.escapeHtml(o)}</option>`).join('')}
        </select>
      </div>`;
    }
    if (f.type === 'textarea') {
      return `<div class="field">
        <label>${CL.util.escapeHtml(f.label)}</label>
        <textarea id="tpl-${f.id}" class="textarea" placeholder="${placeholder}">${val}</textarea>
      </div>`;
    }
    const type = f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text';
    return `<div class="field">
      <label>${CL.util.escapeHtml(f.label)}</label>
      <input id="tpl-${f.id}" type="${type}" class="input" value="${val}" placeholder="${placeholder}">
    </div>`;
  }

  function substitute(template, vals) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const v = vals[key];
      if (!v) return `[${key}]`;
      if (key.includes('date')) {
        try { return CL.util.fmtDate(v) || v; } catch { return v; }
      }
      return v;
    });
  }

  function markdownToHtml(md) {
    // Simple markdown-to-HTML for preview
    let html = CL.util.escapeHtml(md);
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/^---$/gm, '<hr>');
    // Split into blocks on blank lines
    const blocks = html.split(/\n\n+/);
    return blocks.map(b => {
      if (/^<h[1-3]>/.test(b) || /^<hr>$/.test(b)) return b;
      return `<p>${b.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');
  }

  function renderPreview() {
    if (!currentTemplate) return;
    const filled = substitute(currentTemplate.body, values);
    document.getElementById('drafter-preview').innerHTML = markdownToHtml(filled);
  }

  function selectTemplate(id) {
    currentTemplate = templates.find(t => t.id === id);
    values = {};
    renderTemplateList();
    renderFields();
  }

  function exportMarkdown() {
    if (!currentTemplate) return;
    const filled = substitute(currentTemplate.body, values);
    const name = (currentTemplate.title || 'contract').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    CL.util.download(`${name}.md`, filled, 'text/markdown');
    CL.ui.toast('Markdown exported', 'success');
  }

  function exportText() {
    if (!currentTemplate) return;
    const filled = substitute(currentTemplate.body, values);
    // Strip markdown markers for plain text
    const plain = filled
      .replace(/^#{1,3} /gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/^---$/gm, '────────────────────────────────');
    const name = (currentTemplate.title || 'contract').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    CL.util.download(`${name}.txt`, plain, 'text/plain');
    CL.ui.toast('Text file exported', 'success');
  }

  function exportDocx() {
    if (!currentTemplate) return;
    // Generate a proper .doc (HTML with Word MIME type) — opens cleanly in Word
    const filled = substitute(currentTemplate.body, values);
    const htmlBody = markdownToHtml(filled);
    const docHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset="utf-8"><title>${CL.util.escapeHtml(currentTemplate.title)}</title>
<style>
  body { font-family: 'Calibri', sans-serif; font-size: 11pt; line-height: 1.5; }
  h1 { font-size: 16pt; text-align: center; margin: 24pt 0 18pt; }
  h2 { font-size: 12pt; margin: 18pt 0 6pt; text-transform: uppercase; }
  h3 { font-size: 11pt; font-weight: bold; margin: 12pt 0 6pt; }
  p { margin: 0 0 10pt 0; text-align: justify; }
  hr { border: 0; border-top: 1px solid #000; margin: 18pt 0; }
  strong { font-weight: bold; }
</style>
</head><body>${htmlBody}</body></html>`;
    const name = (currentTemplate.title || 'contract').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    CL.util.download(`${name}.doc`, docHtml, 'application/msword');
    CL.ui.toast('Word doc exported', 'success');
  }

  function printDraft() {
    if (!currentTemplate) return;
    window.print();
  }

  function attachHandlers() {
    document.getElementById('template-list').addEventListener('click', (e) => {
      const id = e.target.closest('.clause-cat')?.dataset.tpl;
      if (id) selectTemplate(id);
    });
    document.getElementById('btn-export-md').addEventListener('click', exportMarkdown);
    document.getElementById('btn-export-txt').addEventListener('click', exportText);
    document.getElementById('btn-export-docx').addEventListener('click', exportDocx);
    document.getElementById('btn-print').addEventListener('click', printDraft);
  }

  document.addEventListener('DOMContentLoaded', async () => {
    templates = await CL.seed.loadTemplateSeed();
    renderTemplateList();
    renderFields();
    attachHandlers();
  });
})();

/* ── Clauses page ── */
(function () {
  'use strict';
  const CL = window.Clauselab;
  if (!CL) return;

  const CATEGORIES = [
    'Confidentiality', 'Indemnification', 'Limitation of Liability',
    'Termination', 'Data Protection', 'Intellectual Property',
    'Dispute Resolution', 'Force Majeure', 'Warranties',
    'Payment Terms', 'Service Levels', 'Assignment',
    'Governing Law', 'Non-Solicitation', 'Notices',
    'Boilerplate', 'Insurance', 'Audit', 'Publicity'
  ];

  let seedClauses = [];
  let userClauses = [];
  let activeCategory = 'All';
  let searchTerm = '';
  let editingId = null;

  function all() {
    return [
      ...seedClauses.map(c => ({ ...c, source: 'seed' })),
      ...userClauses.map(c => ({ ...c, source: 'user' }))
    ];
  }

  function filtered() {
    let list = all();
    if (activeCategory !== 'All') list = list.filter(c => c.category === activeCategory);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(c =>
        (c.title || '').toLowerCase().includes(q) ||
        (c.body || '').toLowerCase().includes(q) ||
        (c.tags || []).some(t => t.toLowerCase().includes(q)) ||
        (c.jurisdiction || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  function renderSidebar() {
    const items = all();
    const counts = { All: items.length };
    CATEGORIES.forEach(cat => { counts[cat] = items.filter(c => c.category === cat).length; });
    const cats = ['All', ...CATEGORIES];
    const html = cats.map(cat => {
      if (cat !== 'All' && counts[cat] === 0) return '';
      return `<div class="clause-cat${activeCategory === cat ? ' active' : ''}" data-cat="${CL.util.escapeHtml(cat)}">
        <span>${CL.util.escapeHtml(cat)}</span>
        <span class="clause-cat-count">${counts[cat] || 0}</span>
      </div>`;
    }).join('');
    document.getElementById('clause-sidebar-list').innerHTML = `<div class="tool-sidebar-title">Library</div>${html}`;
  }

  function renderCards() {
    const list = filtered();
    const container = document.getElementById('clause-cards');
    if (list.length === 0) {
      container.innerHTML = `<div class="empty">
        <div class="empty-title">No clauses found</div>
        <div class="empty-desc">Try a different category or search term. You can also add your own clause.</div>
      </div>`;
      return;
    }
    container.innerHTML = list.map(c => `
      <div class="clause-card">
        <div class="clause-card-head">
          <div>
            <div class="clause-title">${CL.util.escapeHtml(c.title)}</div>
            <div style="margin-top: 0.5rem; display: flex; gap: 0.4rem; flex-wrap: wrap;">
              <span class="badge badge-accent">${CL.util.escapeHtml(c.category)}</span>
              ${c.jurisdiction ? `<span class="chip">${CL.util.escapeHtml(c.jurisdiction)}</span>` : ''}
              ${(c.tags || []).slice(0, 4).map(t => `<span class="chip">${CL.util.escapeHtml(t)}</span>`).join('')}
              ${c.source === 'user' ? '<span class="badge badge-info">Custom</span>' : ''}
            </div>
          </div>
        </div>
        <div class="clause-body">${CL.util.escapeHtml(c.body)}</div>
        <div class="clause-actions">
          <button class="btn btn-secondary btn-sm" data-copy="${c.id}">Copy</button>
          <button class="btn btn-ghost btn-sm" data-review="${c.id}">Review with AI</button>
          ${c.source === 'user' ? `
            <button class="btn btn-ghost btn-sm" data-edit="${c.id}">Edit</button>
            <button class="btn btn-ghost btn-sm" data-del="${c.id}" style="color: var(--danger);">Delete</button>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  function render() { renderSidebar(); renderCards(); }

  function openModal(clause) {
    editingId = clause ? clause.id : null;
    document.getElementById('clause-modal-title').textContent = clause ? 'Edit clause' : 'Add clause';
    const c = clause || {};
    document.getElementById('cf-title').value = c.title || '';
    document.getElementById('cf-category').value = c.category || '';
    document.getElementById('cf-jurisdiction').value = c.jurisdiction || '';
    document.getElementById('cf-tags').value = (c.tags || []).join(', ');
    document.getElementById('cf-body').value = c.body || '';
    document.getElementById('clause-modal').classList.add('open');
  }

  function closeModal() {
    document.getElementById('clause-modal').classList.remove('open');
    editingId = null;
  }

  async function saveClause() {
    const title = document.getElementById('cf-title').value.trim();
    const category = document.getElementById('cf-category').value;
    const body = document.getElementById('cf-body').value.trim();
    if (!title || !category || !body) { CL.ui.toast('Title, category, and body are required', 'error'); return; }
    const clause = {
      id: editingId || CL.util.uid('cla'),
      title, category,
      jurisdiction: document.getElementById('cf-jurisdiction').value.trim(),
      tags: document.getElementById('cf-tags').value.split(',').map(t => t.trim()).filter(Boolean),
      body,
      updatedAt: Date.now()
    };
    await CL.db.put(CL.db.STORE_CLAUSES, clause);
    userClauses = await CL.db.all(CL.db.STORE_CLAUSES);
    closeModal();
    CL.ui.toast(editingId ? 'Clause updated' : 'Clause added', 'success');
    render();
  }

  async function copyClause(id) {
    const c = all().find(x => x.id === id);
    if (!c) return;
    try {
      await navigator.clipboard.writeText(c.body);
      CL.ui.toast('Clause copied to clipboard', 'success');
    } catch {
      CL.ui.toast('Copy failed. Browser may require HTTPS.', 'error');
    }
  }

  function sendToReview(id) {
    const c = all().find(x => x.id === id);
    if (!c) return;
    sessionStorage.setItem('clauselab:review-text', c.body);
    sessionStorage.setItem('clauselab:review-title', c.title);
    location.href = 'review.html';
  }

  async function deleteClause(id) {
    if (!confirm('Delete this custom clause?')) return;
    await CL.db.delete(CL.db.STORE_CLAUSES, id);
    userClauses = await CL.db.all(CL.db.STORE_CLAUSES);
    CL.ui.toast('Clause deleted', 'success');
    render();
  }

  function populateSelects() {
    const catSel = document.getElementById('cf-category');
    if (catSel) {
      catSel.innerHTML = '<option value="">— Select —</option>' + CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
    }
  }

  function attachHandlers() {
    document.getElementById('clause-sidebar-list').addEventListener('click', (e) => {
      const cat = e.target.closest('.clause-cat')?.dataset.cat;
      if (cat) { activeCategory = cat; render(); }
    });
    document.getElementById('clause-search').addEventListener('input', (e) => { searchTerm = e.target.value; renderCards(); });
    document.getElementById('btn-add-clause').addEventListener('click', () => openModal(null));
    document.getElementById('btn-save-clause').addEventListener('click', saveClause);
    document.querySelectorAll('[data-close-clause]').forEach(b => b.addEventListener('click', closeModal));
    document.getElementById('clause-cards').addEventListener('click', (e) => {
      const copyId = e.target.dataset.copy;
      const reviewId = e.target.dataset.review;
      const editId = e.target.dataset.edit;
      const delId = e.target.dataset.del;
      if (copyId) copyClause(copyId);
      else if (reviewId) sendToReview(reviewId);
      else if (editId) { const c = userClauses.find(x => x.id === editId); if (c) openModal(c); }
      else if (delId) deleteClause(delId);
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    populateSelects();
    attachHandlers();
    [seedClauses, userClauses] = await Promise.all([
      CL.seed.loadClauseSeed(),
      CL.db.all(CL.db.STORE_CLAUSES)
    ]);
    render();
  });
})();

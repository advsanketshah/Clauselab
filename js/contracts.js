/* ── Contracts page ── */
(function () {
  'use strict';
  const CL = window.Clauselab;
  if (!CL) return;

  const CONTRACT_TYPES = ['NDA', 'MSA', 'SOW', 'SaaS Subscription', 'DPA', 'Consulting', 'Employment', 'Vendor', 'Licence', 'Purchase Order', 'Lease', 'Settlement', 'Other'];
  const STATUSES = ['Draft', 'Under Review', 'Signed', 'Expired', 'Terminated'];

  let currentFilter = { search: '', status: '', type: '' };
  let editingId = null;

  function statusBadge(status) {
    const map = { 'Signed': 'success', 'Under Review': 'warning', 'Draft': 'neutral', 'Expired': 'danger', 'Terminated': 'danger' };
    return `<span class="badge badge-${map[status] || 'neutral'}">${CL.util.escapeHtml(status)}</span>`;
  }

  function renewalBadge(c) {
    if (!c.expiryDate) return '';
    const days = CL.util.daysBetween(new Date(), c.expiryDate);
    if (days < 0) return '<span class="badge badge-danger" style="margin-left: 0.4rem;">Expired</span>';
    if (days <= 30) return `<span class="badge badge-warning" style="margin-left: 0.4rem;">${days}d left</span>`;
    if (days <= 90) return `<span class="badge badge-info" style="margin-left: 0.4rem;">${days}d left</span>`;
    return '';
  }

  async function render() {
    const all = await CL.db.all(CL.db.STORE_CONTRACTS);
    const tbody = document.getElementById('contracts-tbody');
    if (!tbody) return;

    let filtered = all;
    if (currentFilter.search) {
      const q = currentFilter.search.toLowerCase();
      filtered = filtered.filter(c =>
        (c.title || '').toLowerCase().includes(q) ||
        (c.counterparty || '').toLowerCase().includes(q) ||
        (c.notes || '').toLowerCase().includes(q) ||
        (c.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    if (currentFilter.status) filtered = filtered.filter(c => c.status === currentFilter.status);
    if (currentFilter.type) filtered = filtered.filter(c => c.type === currentFilter.type);
    filtered.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    document.getElementById('contract-count').textContent = filtered.length;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="table-empty">
        ${all.length === 0
          ? 'No contracts yet. Click <strong>Add contract</strong> to create your first record.'
          : 'No contracts match the current filters.'}
      </td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(c => `
      <tr>
        <td>
          <div class="cell-title">${CL.util.escapeHtml(c.title)}</div>
          <div class="cell-meta">${CL.util.escapeHtml(c.counterparty || '—')}</div>
        </td>
        <td>${CL.util.escapeHtml(c.type || '—')}</td>
        <td>${statusBadge(c.status || 'Draft')}</td>
        <td>${c.effectiveDate ? CL.util.fmtDate(c.effectiveDate) : '—'}</td>
        <td>${c.expiryDate ? CL.util.fmtDate(c.expiryDate) : '—'}${renewalBadge(c)}</td>
        <td>${c.value ? CL.util.fmtCurrency(c.value, c.currency) : '—'}</td>
        <td style="white-space: nowrap;">
          <button class="btn btn-ghost btn-sm" data-view="${c.id}">View</button>
          <button class="btn btn-ghost btn-sm" data-edit="${c.id}">Edit</button>
          <button class="btn btn-ghost btn-sm" data-del="${c.id}" style="color: var(--danger);">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  function openModal(contract) {
    editingId = contract ? contract.id : null;
    document.getElementById('contract-modal-title').textContent = contract ? 'Edit contract' : 'Add contract';
    const c = contract || {};
    document.getElementById('f-title').value = c.title || '';
    document.getElementById('f-counterparty').value = c.counterparty || '';
    document.getElementById('f-type').value = c.type || '';
    document.getElementById('f-status').value = c.status || 'Draft';
    document.getElementById('f-effective').value = c.effectiveDate || '';
    document.getElementById('f-expiry').value = c.expiryDate || '';
    document.getElementById('f-renewal').checked = !!c.autoRenewal;
    document.getElementById('f-value').value = c.value || '';
    document.getElementById('f-currency').value = c.currency || 'INR';
    document.getElementById('f-governing').value = c.governingLaw || '';
    document.getElementById('f-owner').value = c.owner || '';
    document.getElementById('f-tags').value = (c.tags || []).join(', ');
    document.getElementById('f-notes').value = c.notes || '';
    document.getElementById('contract-modal').classList.add('open');
  }

  function closeModal() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
    editingId = null;
  }

  async function saveContract() {
    const title = document.getElementById('f-title').value.trim();
    if (!title) { CL.ui.toast('Title is required', 'error'); return; }
    const tags = document.getElementById('f-tags').value.split(',').map(t => t.trim()).filter(Boolean);
    const existing = editingId ? await CL.db.get(CL.db.STORE_CONTRACTS, editingId) : null;
    const contract = {
      id: editingId || CL.util.uid('con'),
      title,
      counterparty: document.getElementById('f-counterparty').value.trim(),
      type: document.getElementById('f-type').value,
      status: document.getElementById('f-status').value,
      effectiveDate: document.getElementById('f-effective').value || null,
      expiryDate: document.getElementById('f-expiry').value || null,
      autoRenewal: document.getElementById('f-renewal').checked,
      value: parseFloat(document.getElementById('f-value').value) || null,
      currency: document.getElementById('f-currency').value,
      governingLaw: document.getElementById('f-governing').value.trim(),
      owner: document.getElementById('f-owner').value.trim(),
      tags,
      notes: document.getElementById('f-notes').value.trim(),
      updatedAt: Date.now(),
      createdAt: existing ? existing.createdAt : Date.now()
    };
    await CL.db.put(CL.db.STORE_CONTRACTS, contract);
    closeModal();
    CL.ui.toast(editingId ? 'Contract updated' : 'Contract added', 'success');
    render();
  }

  async function viewContract(id) {
    const c = await CL.db.get(CL.db.STORE_CONTRACTS, id);
    if (!c) return;
    const body = `
      <div class="form-grid">
        <div><div class="text-xs text-tertiary">Counterparty</div><div>${CL.util.escapeHtml(c.counterparty || '—')}</div></div>
        <div><div class="text-xs text-tertiary">Type</div><div>${CL.util.escapeHtml(c.type || '—')}</div></div>
        <div><div class="text-xs text-tertiary">Status</div><div>${statusBadge(c.status || 'Draft')}</div></div>
        <div><div class="text-xs text-tertiary">Owner</div><div>${CL.util.escapeHtml(c.owner || '—')}</div></div>
        <div><div class="text-xs text-tertiary">Effective</div><div>${c.effectiveDate ? CL.util.fmtDate(c.effectiveDate) : '—'}</div></div>
        <div><div class="text-xs text-tertiary">Expiry</div><div>${c.expiryDate ? CL.util.fmtDate(c.expiryDate) : '—'} ${c.autoRenewal ? '<span class="chip">Auto-renews</span>' : ''}</div></div>
        <div><div class="text-xs text-tertiary">Value</div><div>${c.value ? CL.util.fmtCurrency(c.value, c.currency) : '—'}</div></div>
        <div><div class="text-xs text-tertiary">Governing law</div><div>${CL.util.escapeHtml(c.governingLaw || '—')}</div></div>
      </div>
      ${c.tags && c.tags.length ? `<div class="mt-2"><div class="text-xs text-tertiary mb-1">Tags</div>${c.tags.map(t => `<span class="chip">${CL.util.escapeHtml(t)}</span>`).join(' ')}</div>` : ''}
      ${c.notes ? `<div class="mt-2"><div class="text-xs text-tertiary mb-1">Notes</div><div style="white-space: pre-wrap; color: var(--text-secondary);">${CL.util.escapeHtml(c.notes)}</div></div>` : ''}
    `;
    document.getElementById('view-modal-title').textContent = c.title;
    document.getElementById('view-modal-body').innerHTML = body;
    document.getElementById('view-modal').classList.add('open');
  }

  async function deleteContract(id) {
    if (!confirm('Delete this contract? This cannot be undone.')) return;
    await CL.db.delete(CL.db.STORE_CONTRACTS, id);
    CL.ui.toast('Contract deleted', 'success');
    render();
  }

  async function exportAll() {
    const all = await CL.db.all(CL.db.STORE_CONTRACTS);
    const payload = { version: 1, tool: 'Clauselab', exportedAt: new Date().toISOString(), contracts: all };
    CL.util.download(`clauselab-contracts-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2), 'application/json');
    CL.ui.toast(`Exported ${all.length} contracts`, 'success');
  }

  async function importFile(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const contracts = Array.isArray(data) ? data : data.contracts;
      if (!Array.isArray(contracts)) throw new Error('Invalid file format');
      let count = 0;
      for (const c of contracts) {
        if (!c.id) c.id = CL.util.uid('con');
        c.updatedAt = c.updatedAt || Date.now();
        await CL.db.put(CL.db.STORE_CONTRACTS, c);
        count++;
      }
      CL.ui.toast(`Imported ${count} contracts`, 'success');
      render();
    } catch (e) {
      CL.ui.toast('Import failed: ' + e.message, 'error');
    }
  }

  function populateSelects() {
    document.getElementById('f-type').innerHTML = '<option value="">— Select —</option>' + CONTRACT_TYPES.map(t => `<option value="${t}">${t}</option>`).join('');
    document.getElementById('f-status').innerHTML = STATUSES.map(s => `<option value="${s}">${s}</option>`).join('');
    document.getElementById('filter-type').innerHTML = '<option value="">All types</option>' + CONTRACT_TYPES.map(t => `<option value="${t}">${t}</option>`).join('');
    document.getElementById('filter-status').innerHTML = '<option value="">All statuses</option>' + STATUSES.map(s => `<option value="${s}">${s}</option>`).join('');
  }

  function attachHandlers() {
    document.getElementById('btn-add').addEventListener('click', () => openModal(null));
    document.getElementById('btn-save').addEventListener('click', saveContract);
    document.getElementById('btn-export').addEventListener('click', exportAll);
    document.getElementById('btn-import').addEventListener('click', () => document.getElementById('import-file').click());
    document.getElementById('import-file').addEventListener('change', (e) => {
      if (e.target.files[0]) importFile(e.target.files[0]);
      e.target.value = '';
    });
    document.querySelectorAll('.modal-close, [data-close]').forEach(b => b.addEventListener('click', closeModal));
    document.getElementById('search-input').addEventListener('input', (e) => { currentFilter.search = e.target.value; render(); });
    document.getElementById('filter-status').addEventListener('change', (e) => { currentFilter.status = e.target.value; render(); });
    document.getElementById('filter-type').addEventListener('change', (e) => { currentFilter.type = e.target.value; render(); });
    document.getElementById('contracts-tbody').addEventListener('click', async (e) => {
      const editId = e.target.dataset.edit;
      const delId = e.target.dataset.del;
      const viewId = e.target.dataset.view;
      if (editId) { const c = await CL.db.get(CL.db.STORE_CONTRACTS, editId); openModal(c); }
      else if (delId) deleteContract(delId);
      else if (viewId) viewContract(viewId);
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    populateSelects();
    attachHandlers();
    await render();
  });
})();

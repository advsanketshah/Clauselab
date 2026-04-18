/* ── Dashboard page ── */
(function () {
  'use strict';
  const CL = window.Clauselab;
  if (!CL) return;

  function statusBadge(status) {
    const map = { 'Signed': 'success', 'Under Review': 'warning', 'Draft': 'neutral', 'Expired': 'danger', 'Terminated': 'danger' };
    return `<span class="badge badge-${map[status] || 'neutral'}">${CL.util.escapeHtml(status || 'Draft')}</span>`;
  }

  async function render() {
    const all = await CL.db.all(CL.db.STORE_CONTRACTS);
    const now = new Date();

    const total = all.length;
    const active = all.filter(c => c.status === 'Signed' && (!c.expiryDate || new Date(c.expiryDate) > now)).length;
    const expiring30 = all.filter(c => c.expiryDate && CL.util.daysBetween(now, c.expiryDate) >= 0 && CL.util.daysBetween(now, c.expiryDate) <= 30).length;
    const totalValue = all
      .filter(c => c.value && c.currency === 'INR')
      .reduce((sum, c) => sum + (c.value || 0), 0);

    const w = document.getElementById('widgets');
    if (w) {
      w.innerHTML = `
        <div class="widget">
          <div class="widget-label">Total contracts</div>
          <div class="widget-value">${total}</div>
          <div class="widget-change">${active} active · ${total - active} inactive</div>
        </div>
        <div class="widget">
          <div class="widget-label">Expiring (30 days)</div>
          <div class="widget-value" style="color: ${expiring30 > 0 ? 'var(--warning)' : 'var(--text-primary)'};">${expiring30}</div>
          <div class="widget-change">Needs action soon</div>
        </div>
        <div class="widget">
          <div class="widget-label">Active portfolio value</div>
          <div class="widget-value" style="font-size: 1.5rem;">${totalValue ? CL.util.fmtCurrency(totalValue, 'INR') : '—'}</div>
          <div class="widget-change">INR-denominated only</div>
        </div>
        <div class="widget">
          <div class="widget-label">Storage</div>
          <div class="widget-value" style="font-size: 1.5rem; color: var(--success);">Local</div>
          <div class="widget-change">IndexedDB · zero backend</div>
        </div>
      `;
    }

    const upcoming = all
      .filter(c => c.expiryDate)
      .map(c => ({ ...c, days: CL.util.daysBetween(now, c.expiryDate) }))
      .filter(c => c.days >= 0 && c.days <= 90)
      .sort((a, b) => a.days - b.days)
      .slice(0, 6);

    const upcomingEl = document.getElementById('upcoming');
    if (upcomingEl) {
      if (upcoming.length === 0) {
        upcomingEl.innerHTML = `<div class="empty" style="padding: 2rem 1rem;">
          <div class="empty-desc">No renewals or expirations in the next 90 days.</div>
        </div>`;
      } else {
        upcomingEl.innerHTML = `<div class="table-wrap"><table class="table">
          <thead><tr><th>Contract</th><th>Counterparty</th><th>Expires</th><th>Status</th></tr></thead>
          <tbody>
            ${upcoming.map(c => `
              <tr>
                <td><div class="cell-title">${CL.util.escapeHtml(c.title)}</div><div class="cell-meta">${CL.util.escapeHtml(c.type || '')}</div></td>
                <td>${CL.util.escapeHtml(c.counterparty || '—')}</td>
                <td>
                  ${CL.util.fmtDate(c.expiryDate)}
                  <div class="cell-meta" style="color: ${c.days <= 30 ? 'var(--danger)' : c.days <= 60 ? 'var(--warning)' : 'var(--text-tertiary)'};">in ${c.days} days</div>
                </td>
                <td>${statusBadge(c.status)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table></div>`;
      }
    }

    const recent = all
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, 5);
    const recentEl = document.getElementById('recent');
    if (recentEl) {
      if (recent.length === 0) {
        recentEl.innerHTML = `<div class="empty" style="padding: 2rem 1rem;">
          <div class="empty-desc">No contracts in the repository yet.</div>
          <a href="contracts.html" class="btn btn-primary btn-sm">Add your first contract</a>
        </div>`;
      } else {
        recentEl.innerHTML = `<div class="table-wrap"><table class="table">
          <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Updated</th></tr></thead>
          <tbody>
            ${recent.map(c => `
              <tr>
                <td><div class="cell-title">${CL.util.escapeHtml(c.title)}</div><div class="cell-meta">${CL.util.escapeHtml(c.counterparty || '')}</div></td>
                <td>${CL.util.escapeHtml(c.type || '—')}</td>
                <td>${statusBadge(c.status)}</td>
                <td>${c.updatedAt ? CL.util.fmtDate(new Date(c.updatedAt)) : '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table></div>`;
      }
    }
  }

  document.addEventListener('DOMContentLoaded', render);
})();

/* ── Settings page ── */
(function () {
  'use strict';
  const CL = window.Clauselab;
  if (!CL) return;

  async function renderStats() {
    const contracts = await CL.db.all(CL.db.STORE_CONTRACTS);
    const clauses = await CL.db.all(CL.db.STORE_CLAUSES);
    document.getElementById('stat-contracts').textContent = contracts.length;
    document.getElementById('stat-clauses').textContent = clauses.length;

    // Settings summary
    const cfg = CL.settings.get();
    const providerLabel = {
      gemini: 'Google Gemini',
      openai: 'OpenAI',
      anthropic: 'Anthropic Claude'
    }[cfg.provider || 'gemini'];
    document.getElementById('stat-provider').textContent = providerLabel;

    const hasKey = cfg[`${cfg.provider || 'gemini'}_key`];
    document.getElementById('stat-key').innerHTML = hasKey
      ? '<span class="badge badge-success">Configured</span>'
      : '<span class="badge badge-neutral">Not set</span>';
  }

  async function exportAll() {
    const contracts = await CL.db.all(CL.db.STORE_CONTRACTS);
    const clauses = await CL.db.all(CL.db.STORE_CLAUSES);
    const settings = CL.settings.get();
    // Strip API keys from export — never include them
    const safeSettings = { ...settings };
    Object.keys(safeSettings).forEach(k => { if (k.endsWith('_key')) delete safeSettings[k]; });
    const payload = {
      version: 1,
      tool: 'Clauselab',
      exportedAt: new Date().toISOString(),
      contracts,
      custom_clauses: clauses,
      settings: safeSettings,
      note: 'API keys are not included in exports for security.'
    };
    CL.util.download(`clauselab-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2), 'application/json');
    CL.ui.toast('Backup exported. API keys were excluded for security.', 'success', 4500);
  }

  async function importFile(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      let cCount = 0, clCount = 0;
      if (Array.isArray(data.contracts)) {
        for (const c of data.contracts) {
          if (!c.id) c.id = CL.util.uid('con');
          await CL.db.put(CL.db.STORE_CONTRACTS, c); cCount++;
        }
      }
      if (Array.isArray(data.custom_clauses)) {
        for (const c of data.custom_clauses) {
          if (!c.id) c.id = CL.util.uid('cla');
          await CL.db.put(CL.db.STORE_CLAUSES, c); clCount++;
        }
      }
      if (data.settings && typeof data.settings === 'object') {
        CL.settings.update(data.settings);
      }
      CL.ui.toast(`Imported ${cCount} contracts, ${clCount} clauses`, 'success');
      renderStats();
    } catch (e) {
      CL.ui.toast('Import failed: ' + e.message, 'error');
    }
  }

  async function wipeAll() {
    const confirm1 = confirm('This will PERMANENTLY delete all contracts, custom clauses, and settings (including API keys) stored in this browser. Continue?');
    if (!confirm1) return;
    const confirm2 = prompt('Type WIPE in capitals to confirm:');
    if (confirm2 !== 'WIPE') { CL.ui.toast('Wipe cancelled', 'default'); return; }
    await CL.db.clear(CL.db.STORE_CONTRACTS);
    await CL.db.clear(CL.db.STORE_CLAUSES);
    localStorage.removeItem('clauselab:settings');
    CL.ui.toast('All data wiped', 'success');
    setTimeout(() => location.reload(), 900);
  }

  function clearKeys() {
    if (!confirm('Remove all stored API keys from this browser?')) return;
    const cfg = CL.settings.get();
    Object.keys(cfg).forEach(k => { if (k.endsWith('_key')) delete cfg[k]; });
    CL.settings.set(cfg);
    CL.ui.toast('All API keys removed', 'success');
    renderStats();
  }

  function attachHandlers() {
    document.getElementById('btn-backup').addEventListener('click', exportAll);
    document.getElementById('btn-restore').addEventListener('click', () => document.getElementById('restore-file').click());
    document.getElementById('restore-file').addEventListener('change', (e) => {
      if (e.target.files[0]) importFile(e.target.files[0]);
      e.target.value = '';
    });
    document.getElementById('btn-wipe').addEventListener('click', wipeAll);
    document.getElementById('btn-clear-keys').addEventListener('click', clearKeys);
  }

  document.addEventListener('DOMContentLoaded', () => {
    attachHandlers();
    renderStats();
  });
})();

/* ── Clauselab core — shared nav, footer, storage, utilities ── */
(function () {
  'use strict';

  /* ──────────────────────────────────────────────────────────────
     NAV + FOOTER INJECTION
  ─────────────────────────────────────────────────────────────── */
  const LOGO_SVG = `<svg class="nav-brand-mark" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="2" y="2" width="36" height="36" rx="10" fill="#0F172A"/>
    <path d="M12 11h11a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H12V11Z" stroke="#FFFFFF" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M17 18h8M17 22h6" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
    <circle cx="28" cy="12" r="3" fill="#2563EB" stroke="#0F172A" stroke-width="1.5"/>
  </svg>`;

  const NAV_LINKS = [
    { label: 'Dashboard', href: 'index.html' },
    { label: 'Contracts', href: 'contracts.html' },
    { label: 'Clauses', href: 'clauses.html' },
    { label: 'Drafter', href: 'drafter.html' },
    { label: 'AI Review', href: 'review.html' },
  ];

  const ABOUT_DROPDOWN = [
    { label: 'About Clauselab', href: 'about.html' },
    { label: 'Privacy Policy', href: 'privacy.html' },
    { label: 'Terms of Use', href: 'terms.html' },
    { label: 'Disclaimer', href: 'disclaimer.html' },
  ];

  function currentPage() {
    const path = location.pathname.split('/').pop() || 'index.html';
    return path || 'index.html';
  }

  function injectNav() {
    const cur = currentPage();
    const linkHTML = NAV_LINKS.map(l => {
      const active = l.href === cur ? ' active' : '';
      return `<li><a href="${l.href}" class="${active}">${l.label}</a></li>`;
    }).join('');
    const aboutActive = ABOUT_DROPDOWN.some(l => l.href === cur);
    const aboutDropdown = `
      <li class="has-dropdown">
        <button class="dropdown-toggle${aboutActive ? ' active' : ''}">About
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <div class="dropdown-menu"><div class="dropdown-menu-inner">
          ${ABOUT_DROPDOWN.map(l => `<a href="${l.href}" class="${l.href === cur ? 'active' : ''}">${l.label}</a>`).join('')}
        </div></div>
      </li>`;

    const navHTML = `
      <nav class="topnav">
        <div class="container nav-inner">
          <a href="index.html" class="nav-brand">${LOGO_SVG}<span class="nav-brand-name">Clauselab</span></a>
          <button class="mobile-menu-btn" aria-label="Toggle menu">
            <svg viewBox="0 0 24 24" width="26" height="26" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <ul class="nav-links">
            ${linkHTML}
            ${aboutDropdown}
            <li class="mobile-cta-wrapper"><a href="settings.html" class="nav-cta">Settings</a></li>
          </ul>
          <div class="nav-right">
            <a href="settings.html" class="nav-cta">Settings</a>
          </div>
        </div>
      </nav>`;

    const btabIcons = {
      dashboard: '<path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z"/>',
      contracts: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>',
      clauses: '<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>',
      drafter: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>',
      review: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="11" y1="8" x2="11" y2="14"/>',
      settings: '<circle cx="12" cy="12" r="3"/><path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>',
      about: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    };

    const btabItems = [
      { href: 'index.html', label: 'Home', key: 'dashboard' },
      { href: 'contracts.html', label: 'Contracts', key: 'contracts' },
      { href: 'clauses.html', label: 'Clauses', key: 'clauses' },
      { href: 'drafter.html', label: 'Drafter', key: 'drafter' },
      { href: 'review.html', label: 'Review', key: 'review' },
      { href: 'settings.html', label: 'Settings', key: 'settings' },
      { href: 'about.html', label: 'About', key: 'about' },
    ];

    const btabHTML = `<nav class="btab-bar" aria-label="Mobile navigation">
      ${btabItems.map(b => `
        <a href="${b.href}" class="btab${b.href === cur ? ' active' : ''}">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${btabIcons[b.key]}</svg>
          <span>${b.label}</span>
        </a>`).join('')}
    </nav>`;

    const mountPoint = document.getElementById('nav-mount');
    if (mountPoint) {
      mountPoint.outerHTML = navHTML;
    } else {
      document.body.insertAdjacentHTML('afterbegin', navHTML);
    }
    document.body.insertAdjacentHTML('beforeend', btabHTML);

    const mobileBtn = document.querySelector('.mobile-menu-btn');
    if (mobileBtn) {
      mobileBtn.addEventListener('click', () => {
        const links = document.querySelector('.nav-links');
        if (links) links.classList.toggle('mobile-open');
      });
    }
  }

  function injectFooter() {
    const year = new Date().getFullYear();
    const footerLogo = LOGO_SVG.replace('class="nav-brand-mark"', 'class="footer-brand-mark"');
    const footerHTML = `
      <footer>
        <div class="container">
          <div class="footer-inner">
            <div style="max-width: 360px;">
              <div class="footer-brand">${footerLogo}<span class="footer-brand-name">Clauselab</span></div>
              <p class="footer-about">A client-side contract lifecycle management workspace. Your data stays in your browser. Built by <a href="https://advsanketshah.github.io/" target="_blank" rel="noopener">Adv. Sanket Shah</a>, a technology lawyer based in Indore, India.</p>
            </div>
            <div>
              <h4 class="footer-col-title">Tool</h4>
              <ul class="footer-links">
                <li><a href="index.html">Dashboard</a></li>
                <li><a href="contracts.html">Contracts</a></li>
                <li><a href="clauses.html">Clauses</a></li>
                <li><a href="drafter.html">Drafter</a></li>
                <li><a href="review.html">AI Review</a></li>
              </ul>
            </div>
            <div>
              <h4 class="footer-col-title">Legal</h4>
              <ul class="footer-links">
                <li><a href="privacy.html">Privacy Policy</a></li>
                <li><a href="terms.html">Terms of Use</a></li>
                <li><a href="disclaimer.html">Disclaimer</a></li>
                <li><a href="about.html">About</a></li>
              </ul>
            </div>
            <div>
              <h4 class="footer-col-title">Elsewhere</h4>
              <ul class="footer-links">
                <li><a href="https://advsanketshah.github.io/" target="_blank" rel="noopener">Portfolio</a></li>
                <li><a href="https://advsanketshah.github.io/Privacipher/" target="_blank" rel="noopener">Privacipher</a></li>
                <li><a href="https://www.linkedin.com/in/advsanketshah/" target="_blank" rel="noopener">LinkedIn</a></li>
                <li><a href="https://github.com/advsanketshah/" target="_blank" rel="noopener">GitHub</a></li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <span>© ${year} Clauselab. Built and maintained by Adv. Sanket Shah.</span>
            <span>Not legal advice. Use is subject to the <a href="terms.html">Terms</a> and <a href="disclaimer.html">Disclaimer</a>.</span>
          </div>
        </div>
      </footer>`;
    document.body.insertAdjacentHTML('beforeend', footerHTML);
  }

  /* ──────────────────────────────────────────────────────────────
     STORAGE — IndexedDB
  ─────────────────────────────────────────────────────────────── */
  const DB_NAME = 'clauselab';
  const DB_VERSION = 1;
  const STORE_CONTRACTS = 'contracts';
  const STORE_CLAUSES = 'clauses';

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_CONTRACTS)) {
          const s = db.createObjectStore(STORE_CONTRACTS, { keyPath: 'id' });
          s.createIndex('status', 'status');
          s.createIndex('type', 'type');
          s.createIndex('expiry', 'expiryDate');
        }
        if (!db.objectStoreNames.contains(STORE_CLAUSES)) {
          db.createObjectStore(STORE_CLAUSES, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function dbAll(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }
  async function dbGet(storeName, id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function dbPut(storeName, obj) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const req = tx.objectStore(storeName).put(obj);
      req.onsuccess = () => resolve(obj);
      req.onerror = () => reject(req.error);
    });
  }
  async function dbDelete(storeName, id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const req = tx.objectStore(storeName).delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
  async function dbClear(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const req = tx.objectStore(storeName).clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /* Settings — localStorage */
  const SETTINGS_KEY = 'clauselab:settings';
  function getSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; }
    catch { return {}; }
  }
  function setSettings(obj) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(obj));
  }
  function updateSettings(patch) {
    setSettings({ ...getSettings(), ...patch });
  }

  /* Utilities */
  function uid(prefix) { return `${prefix || 'id'}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }
  function fmtDate(d) {
    if (!d) return '';
    const dt = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(dt.getTime())) return '';
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function fmtCurrency(amount, currency) {
    if (!amount && amount !== 0) return '';
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR', maximumFractionDigits: 0 }).format(amount);
    } catch { return `${currency || ''} ${amount}`; }
  }
  function daysBetween(a, b) {
    const ms = (typeof b === 'string' ? new Date(b) : b) - (typeof a === 'string' ? new Date(a) : a);
    return Math.ceil(ms / 86400000);
  }
  function toast(msg, type, duration) {
    let wrap = document.querySelector('.toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
    const el = document.createElement('div');
    el.className = `toast ${type || ''}`;
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, duration || 3000);
  }
  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function download(filename, content, mime) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
  }

  /* Seed loaders */
  async function loadClauseSeed() {
    try {
      const r = await fetch('data/clauses.json');
      if (!r.ok) throw new Error('Failed to load clauses');
      return await r.json();
    } catch (e) { console.warn(e); return []; }
  }
  async function loadTemplateSeed() {
    try {
      const r = await fetch('data/templates.json');
      if (!r.ok) throw new Error('Failed to load templates');
      return await r.json();
    } catch (e) { console.warn(e); return []; }
  }

  /* Init */
  function init() {
    injectNav();
    injectFooter();
    requestAnimationFrame(() => {
      document.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.Clauselab = {
    db: { all: dbAll, get: dbGet, put: dbPut, delete: dbDelete, clear: dbClear, STORE_CONTRACTS, STORE_CLAUSES },
    settings: { get: getSettings, set: setSettings, update: updateSettings },
    util: { uid, fmtDate, fmtCurrency, daysBetween, escapeHtml, download },
    ui: { toast },
    seed: { loadClauseSeed, loadTemplateSeed }
  };
})();

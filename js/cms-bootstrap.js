// Career Pakistan — cms-bootstrap.js  (v2)
// ============================================================
// CRITICAL: Load this as the VERY FIRST <script> on every page.
// No defer. No async. Synchronous only.
//
// BUG FIX #4 (master prompt):
//   Dark mode is now applied instantly at bootstrap time so it
//   persists on EVERY page without a flash of light mode.
// ============================================================

(function () {
  'use strict';

  if (window._CMS_BOOTSTRAP_DONE) return;
  window._CMS_BOOTSTRAP_DONE = true;

  window.CMS_DATA               = window.CMS_DATA || {};
  window._CMS_READY             = window._CMS_READY || false;
  window._CMS_CALLBACKS         = window._CMS_CALLBACKS || [];
  window._CMS_REFRESH_LISTENERS = window._CMS_REFRESH_LISTENERS || [];
  window._CAREERPK_ADSENSE_INJECTED = window._CAREERPK_ADSENSE_INJECTED || false;

  // ── Public API ─────────────────────────────────────────────
  window.onCMSReady = function (fn) {
    if (typeof fn !== 'function') return;
    if (window._CMS_READY) {
      try { fn(window.CMS_DATA); } catch (e) { console.error('[CMS] onCMSReady callback error:', e); }
      return;
    }
    window._CMS_CALLBACKS.push(fn);
  };

  window.onCMSRefresh = function (fn) {
    if (typeof fn !== 'function') return;
    window._CMS_REFRESH_LISTENERS.push(fn);
  };

  // ── Internal fire functions (called by google-sheet-loader.js) ──
  window._fireCMSReady = function () {
    if (window._CMS_READY) return;
    window._CMS_READY = true;
    var callbacks = (window._CMS_CALLBACKS || []).slice();
    window._CMS_CALLBACKS = [];
    callbacks.forEach(function (fn) {
      try { fn(window.CMS_DATA); } catch (e) { console.error('[CMS] Ready callback error:', e); }
    });
    document.dispatchEvent(new CustomEvent('cmsReady', { detail: window.CMS_DATA }));
  };

  window._fireCMSRefresh = function (changedTabs) {
    (window._CMS_REFRESH_LISTENERS || []).forEach(function (fn) {
      try { fn(window.CMS_DATA, changedTabs || []); } catch (e) { console.error('[CMS] Refresh callback error:', e); }
    });
    document.dispatchEvent(new CustomEvent('cmsRefresh', {
      detail: { data: window.CMS_DATA, changed: changedTabs || [] }
    }));
  };

  window.registerMultiTabRefresh = function (cb) { window.onCMSRefresh(cb); };

  // ── BUG FIX #4: Apply dark mode instantly (no flash) ────────
  // Step 1: add style rule immediately so body starts dark before paint
  if (localStorage.getItem('ch_dark') === 'true') {
    var styleTag = document.createElement('style');
    styleTag.textContent = 'body{background:#0f172a!important;color:#f1f5f9!important}';
    (document.head || document.documentElement).appendChild(styleTag);
  }

  // Step 2: sync body.dark class and icon once DOM exists
  document.addEventListener('DOMContentLoaded', function () {
    if (localStorage.getItem('ch_dark') === 'true') {
      document.body.classList.add('dark');
      var btn = document.getElementById('themeBtn');
      if (btn) btn.innerHTML = '<i class="fa fa-sun"></i>';
    }
  });

})();

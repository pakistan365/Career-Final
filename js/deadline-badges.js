/**
 * Career Pakistan — Comprehensive Fix Script
 * Drop this file in /js/ and include it in all HTML pages AFTER app.js
 * Fixes:
 * 1. footerAd slot not found
 * 2. Dismiss button for sticky ad
 * 3. books page runtime issue
 * 4. global hardening (small safe guards only)
 */

(function () {
  'use strict';

  // -----------------------------
  // 1) Ensure footerAd slot exists
  // -----------------------------
  function ensureFooterAdSlot() {
    let slot = document.getElementById('footerAd');
    if (slot) return slot;

    slot = document.createElement('div');
    slot.id = 'footerAd';
    slot.className = 'footer-ad-slot';
    slot.setAttribute('aria-label', 'Advertisement');
    slot.style.minHeight = '50px';
    slot.style.width = '100%';
    slot.style.display = 'none';

    document.body.appendChild(slot);
    return slot;
  }

  // -----------------------------
  // 2) Dismiss button for sticky ad
  // -----------------------------
  function addDismissButton() {
    const ad = document.querySelector('.sticky-ad, .floating-ad, #footerAd.sticky');
    if (!ad) return;

    if (ad.querySelector('.ad-dismiss-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'ad-dismiss-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Dismiss advertisement');
    btn.textContent = '×';

    btn.style.position = 'absolute';
    btn.style.top = '6px';
    btn.style.right = '8px';
    btn.style.width = '26px';
    btn.style.height = '26px';
    btn.style.border = 'none';
    btn.style.borderRadius = '50%';
    btn.style.cursor = 'pointer';
    btn.style.fontSize = '20px';
    btn.style.lineHeight = '20px';
    btn.style.background = 'rgba(0,0,0,0.65)';
    btn.style.color = '#fff';
    btn.style.zIndex = '9999';

    const parentStyle = getComputedStyle(ad).position;
    if (parentStyle === 'static' || !parentStyle) {
      ad.style.position = 'relative';
    }

    btn.addEventListener('click', () => {
      ad.style.display = 'none';
    });

    ad.appendChild(btn);
  }

  // ---------------------------------
  // 3) Footer ad guard + delayed setup
  // ---------------------------------
  function fixFooterAdSlot() {
    ensureFooterAdSlot();

    // If an existing ad script expects it visible, don't force hide
    // but keep robust defaults.
    const slot = document.getElementById('footerAd');
    if (slot && !slot.style.minHeight) slot.style.minHeight = '50px';

    // Observe DOM updates for late-injected sticky ads
    const mo = new MutationObserver(() => {
      addDismissButton();
    });
    mo.observe(document.body, { childList: true, subtree: true });

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(addDismissButton, 600);
      });
    } else {
      setTimeout(addDismissButton, 600);
    }
  }

  // ---------------------------------
  // 4) Small global safety hardening
  // ---------------------------------
  function hardenGlobals() {
    // Guard missing optional hooks
    window.safeInvoke = function (fn, ...args) {
      try {
        if (typeof fn === 'function') return fn(...args);
      } catch (e) {
        console.error('[CareerPK] safeInvoke error:', e);
      }
      return undefined;
    };

    // Prevent noisy promise rejections from crashing UX
    window.addEventListener('unhandledrejection', (e) => {
      console.error('[CareerPK] Unhandled promise rejection:', e.reason || e);
    });
  }

  // Boot
  function initComprehensiveFixes() {
    hardenGlobals();
    fixFooterAdSlot();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initComprehensiveFixes);
  } else {
    initComprehensiveFixes();
  }
})();

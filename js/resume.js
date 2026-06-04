/**
 * Career Pakistan — premium-upgrades.js
 * Drop this as the LAST script in every HTML page:
 *   <script src="js/premium-upgrades.js" defer></script>
 *
 * Features:
 *  1. ImgBB DNS prefetch injection (speeds up cold image loads)
 *  2. Scroll progress bar
 *  3. Navbar scroll shadow class
 *  4. Intersection Observer scroll-reveal for sections
 *  5. Smooth counter animation for stats
 *  6. Page transition fade
 *  7. Ripple effect on buttons
 */

(function () {
  'use strict';

  /* ── 1. IMGBB DNS/PRECONNECT INJECTION ─────────────────────
     Browser opens a fresh TCP + TLS connection for every new
     hostname. ImgBB uses i.ibb.co as a CDN domain. By
     injecting dns-prefetch + preconnect in JS we warm the
     connection up before any card image needs it.          */
  function injectResourceHints() {
    const hints = [
      { rel: 'dns-prefetch', href: 'https://i.ibb.co' },
      { rel: 'preconnect',   href: 'https://i.ibb.co', crossorigin: true },
      { rel: 'dns-prefetch', href: 'https://ibb.co' },
      { rel: 'dns-prefetch', href: 'https://i.imgur.com' }, // if you ever use imgur
    ];
    const head = document.head;
    hints.forEach(({ rel, href, crossorigin }) => {
      // Avoid duplicates
      if (document.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;
      const link = document.createElement('link');
      link.rel = href;
      link.rel = rel;
      link.href = href;
      if (crossorigin) link.crossOrigin = 'anonymous';
      head.appendChild(link);
    });
  }
  injectResourceHints();

  /* ── 2. SCROLL PROGRESS BAR ─────────────────────────────── */
  function initScrollProgress() {
    const bar = document.createElement('div');
    bar.id = 'scroll-progress';
    document.body.prepend(bar);

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
          const pct = (scrollTop / (scrollHeight - clientHeight)) * 100;
          bar.style.width = Math.min(pct, 100) + '%';
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }
  initScrollProgress();

  /* ── 3. NAVBAR SCROLL SHADOW ──────────────────────────── */
  function initNavbarScroll() {
    const nav = document.getElementById('navbar');
    if (!nav) return;
    const onScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run once on load
  }
  initNavbarScroll();

  /* ── 4. SECTION SCROLL-REVEAL ────────────────────────── */
  function initScrollReveal() {
    if (!('IntersectionObserver' in window)) return;
    const sections = document.querySelectorAll('.section');
    if (!sections.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.06 });

    sections.forEach(sec => io.observe(sec));
  }
  // Run after DOM content and also after CMS data loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollReveal);
  } else {
    initScrollReveal();
  }
  window.addEventListener('cmsDataReady', () => setTimeout(initScrollReveal, 200));

  /* ── 5. ANIMATED COUNTER ─────────────────────────────── */
  function animateCounter(el) {
    const target = parseInt(el.dataset.target || el.textContent, 10);
    if (isNaN(target)) return;
    const duration = 1400;
    const start = performance.now();
    const update = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + '+';
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  function initCounters() {
    if (!('IntersectionObserver' in window)) return;
    const counters = document.querySelectorAll('.stat-num[data-target]');
    if (!counters.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => io.observe(c));
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCounters);
  } else {
    initCounters();
  }

  /* ── 6. PAGE TRANSITION FADE ─────────────────────────── */
  function initPageTransitions() {
    // Inject fade-out style
    const style = document.createElement('style');
    style.textContent = `
      body { animation: pageFadeIn 0.35s ease both; }
      @keyframes pageFadeIn {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      body.page-exit {
        opacity: 0;
        transform: translateY(-4px);
        transition: opacity 0.2s ease, transform 0.2s ease;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);

    // Intercept internal link clicks
    document.addEventListener('click', (e) => {
      const anchor = e.target.closest('a[href]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') ||
          href.startsWith('mailto') || anchor.target === '_blank') return;
      e.preventDefault();
      document.body.classList.add('page-exit');
      setTimeout(() => { window.location.href = href; }, 200);
    });
  }
  initPageTransitions();

  /* ── 7. BUTTON RIPPLE EFFECT ──────────────────────────── */
  function initRipple() {
    const style = document.createElement('style');
    style.textContent = `
      .btn { position: relative; overflow: hidden; }
      .ripple-wave {
        position: absolute;
        border-radius: 50%;
        transform: scale(0);
        animation: rippleAnim 0.55s linear;
        background: rgba(255,255,255,0.28);
        pointer-events: none;
      }
      @keyframes rippleAnim {
        to { transform: scale(4); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn');
      if (!btn) return;
      const circle = document.createElement('span');
      const diameter = Math.max(btn.clientWidth, btn.clientHeight);
      const radius = diameter / 2;
      const rect = btn.getBoundingClientRect();
      circle.classList.add('ripple-wave');
      circle.style.cssText = `
        width: ${diameter}px; height: ${diameter}px;
        left: ${e.clientX - rect.left - radius}px;
        top:  ${e.clientY - rect.top  - radius}px;
      `;
      btn.appendChild(circle);
      circle.addEventListener('animationend', () => circle.remove());
    });
  }
  initRipple();

  /* ── 8. IMGBB IMAGE RETRY ON ERROR ───────────────────── */
  // ImgBB occasionally returns a 429 or slow response.
  // Retry once after 1.5s delay before showing fallback.
  function initImageRetry() {
    const MAX_RETRIES = 1;
    const RETRY_DELAY = 1500;

    document.addEventListener('error', (e) => {
      const img = e.target;
      if (img.tagName !== 'IMG') return;
      if (img.dataset.retries >= MAX_RETRIES) return;
      if (!img.src || img.src.startsWith('data:')) return;

      img.dataset.retries = (parseInt(img.dataset.retries || 0) + 1).toString();
      const originalSrc = img.src;

      setTimeout(() => {
        img.src = '';
        // Bust cache with a small timestamp param to bypass browser cache
        img.src = originalSrc + (originalSrc.includes('?') ? '&' : '?') + '_r=' + Date.now();
      }, RETRY_DELAY);
    }, true); // capture phase so it fires before other handlers
  }
  initImageRetry();

  /* ── 9. CARD IMAGE LOADING QUALITY BOOST ─────────────
     For ImgBB specifically, append /large to get higher-res
     version; also swap /thumb/ URLs to full-size.
     Call this after CMS data renders cards.              */
  function upgradeImgBBUrls() {
    document.querySelectorAll('img[data-src], img[src]').forEach(img => {
      const src = img.dataset.src || img.src;
      if (!src || !src.includes('ibb.co')) return;
      // ImgBB thumb URLs contain /t_ prefix — replace with /i_ for full size
      const upgraded = src.replace('/t_', '/i_');
      if (upgraded !== src) {
        if (img.dataset.src) img.dataset.src = upgraded;
        else img.src = upgraded;
      }
    });
  }
  window.addEventListener('cmsDataReady', () => setTimeout(upgradeImgBBUrls, 100));

})();

/* ============================================================
   Career Pakistan — image-optimizer.js  (v3)
   Lazy-loads every img[data-src] injected via innerHTML.

   EXPORTS (window):
     initLazyImages(container?)  — scan & observe imgs in container
     observeNewCards()           — MutationObserver for new .card nodes
     window.initLazyImages       — called externally by app.js / _renderSection

   FLOW:
     1. Cards are rendered into a grid via innerHTML in app.js.
     2. Each <img> has src="1×1 transparent GIF" + data-src="REAL_URL".
     3. initLazyImages(container) finds all img[data-src] in that container,
        adds 'img-loading' (shimmer), and registers them with the shared
        IntersectionObserver.
     4. When an image enters the viewport the observer copies data-src → src.
     5. On load:  remove img-loading, add img-loaded  (CSS opacity fade-in).
     6. On error: swap to banner.webp fallback, mark img-loaded.
     7. observeNewCards() uses MutationObserver on document.body to catch
        any card injected after the initial page load and auto-calls
        initLazyImages() on each new card's .card-img container.

   CSS REQUIRED (already in main-enhanced.css):
     .img-loading { filter: blur(8px); opacity: 0.7; transform: scale(1.02); }
     .img-loaded  { filter: blur(0);   opacity: 1;   transform: scale(1);
                    transition: filter .4s, opacity .3s, transform .4s; }
   ============================================================ */

(function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────── */
  const FALLBACK_SRC     = 'banner.webp';
  const TRANSPARENT_GIF  = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

  // rootMargin: start loading 600px before the image enters the viewport
  // so cards feel instant on slow connections.
  const IO_OPTIONS = {
    root:       null,
    rootMargin: '600px 0px',
    threshold:  0,
  };

  /* ── Shared IntersectionObserver (one per page) ─────────── */
  let _io = null;

  function _getObserver() {
    if (_io) return _io;
    if (!('IntersectionObserver' in window)) return null;

    _io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        _loadImage(entry.target);
        _io.unobserve(entry.target);
      });
    }, IO_OPTIONS);

    return _io;
  }

  /* ── Core: swap data-src → src for one img element ─────── */
  function _loadImage(img) {
    if (!img || img._lazyLoaded) return;
    img._lazyLoaded = true;

    var realSrc = img.getAttribute('data-src');
    if (!realSrc || realSrc === TRANSPARENT_GIF) {
      // Nothing to load — mark done and hide placeholder shimmer
      img.removeAttribute('data-src');
      img.classList.remove('img-loading');
      img.classList.add('img-loaded');
      return;
    }

    // Remove onerror inline attribute so our listener takes over cleanly
    img.removeAttribute('onerror');

    // Error handler — set fallback then mark done
    img.addEventListener('error', function _onError() {
      img.removeEventListener('error', _onError);
      if (img.src !== window.location.origin + '/' + FALLBACK_SRC &&
          img.src !== FALLBACK_SRC) {
        img.src = FALLBACK_SRC;
      }
      img.classList.remove('img-loading');
      img.classList.add('img-loaded');
      // Hide the fallback placeholder emoji if present
      var placeholder = img.parentElement &&
                        img.parentElement.querySelector('.card-img-placeholder');
      if (placeholder) placeholder.style.display = 'none';
    }, { once: true });

    // Load handler — fade in
    img.addEventListener('load', function _onLoad() {
      img.removeEventListener('load', _onLoad);
      img.removeAttribute('data-src');
      img.classList.remove('img-loading');
      img.classList.add('img-loaded');
      // Hide the fallback placeholder emoji if present
      var placeholder = img.parentElement &&
                        img.parentElement.querySelector('.card-img-placeholder');
      if (placeholder) placeholder.style.display = 'none';
    }, { once: true });

    // Trigger actual load
    img.src = realSrc;
  }

  /* ── initLazyImages(container?) ────────────────────────── */
  /**
   * Find every img[data-src] inside `container` (or document if omitted),
   * apply img-loading shimmer class, and register with the shared IO.
   *
   * Call this after EVERY innerHTML card render:
   *   initLazyImages(gridEl);      // scoped — preferred
   *   initLazyImages();            // full document fallback
   *
   * Safe to call multiple times — already-registered images are skipped
   * via the `_lazyRegistered` flag.
   */
  function initLazyImages(container) {
    var root   = (container && container.nodeType === 1) ? container : document;
    var images = root.querySelectorAll('img[data-src]');
    if (!images.length) return;

    var io = _getObserver();

    images.forEach(function (img) {
      // Skip if already queued or loaded
      if (img._lazyRegistered || img._lazyLoaded) return;
      img._lazyRegistered = true;

      // Apply shimmer while pending
      if (!img.classList.contains('img-loaded')) {
        img.classList.add('img-loading');
      }

      if (io) {
        // Modern path: defer until visible
        io.observe(img);
      } else {
        // Fallback for old browsers: load immediately
        _loadImage(img);
      }
    });
  }

  /* ── observeNewCards() ──────────────────────────────────── */
  /**
   * Attach a MutationObserver to document.body.
   * Whenever new nodes are added, check if any contain img[data-src]
   * (i.e. new cards were injected via innerHTML) and call initLazyImages
   * on the closest .card-img ancestor or the node itself.
   *
   * Called once on DOMContentLoaded.
   */
  function observeNewCards() {
    if (!('MutationObserver' in window)) return;

    var mo = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (!mutation.addedNodes.length) return;

        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return; // elements only

          // If the node itself is a card or contains cards
          if (node.classList && node.classList.contains('card')) {
            initLazyImages(node);
            return;
          }

          // Grids / wrappers that contain multiple cards
          if (node.querySelector) {
            var lazyImgs = node.querySelectorAll('img[data-src]');
            if (lazyImgs.length) {
              initLazyImages(node);
            }
          }
        });
      });
    });

    mo.observe(document.body, {
      childList: true,
      subtree:   true,
    });

    // Expose so app.js can disconnect if needed
    window._imageOptimizerMO = mo;
  }

  /* ── Public API ─────────────────────────────────────────── */
  window.initLazyImages  = initLazyImages;
  window.observeNewCards = observeNewCards;

  /* ── Boot ───────────────────────────────────────────────── */
  // 1. Scan whatever is already in the DOM (static HTML images, hero banners)
  // 2. Start MutationObserver for all future dynamic card renders
  // 3. Re-scan after CMS fires (belt-and-suspenders for race conditions)

  function _boot() {
    initLazyImages();   // initial DOM scan
    observeNewCards();  // watch for innerHTML injections

    // Also hook into CMS events in case cards rendered before _boot ran
    document.addEventListener('cmsReady', function () {
      // Short delay lets app.js finish its innerHTML write
      setTimeout(function () { initLazyImages(); }, 80);
    });
    document.addEventListener('cmsRefresh', function () {
      setTimeout(function () { initLazyImages(); }, 80);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _boot);
  } else {
    // Already interactive / complete (script loaded with defer, async, or late)
    _boot();
  }

  /* ── Priority hint: images near viewport should not wait ── */
  // After the first paint, immediately load any img[data-src] whose bounding
  // rect is already within 1.5× the viewport height (e.g. above-fold sliders).
  if (window.requestIdleCallback) {
    requestIdleCallback(function () { _flushAboveFold(); }, { timeout: 300 });
  } else {
    setTimeout(_flushAboveFold, 150);
  }

  function _flushAboveFold() {
    var vh = window.innerHeight || 800;
    document.querySelectorAll('img[data-src]').forEach(function (img) {
      if (img._lazyLoaded) return;
      var rect = img.getBoundingClientRect();
      if (rect.top < vh * 2) {
        _loadImage(img);
      }
    });
  }

  /* ── Resize / orientation change: re-check above fold ───── */
  // Handles cases where layout reflow after resize brings hidden images
  // into view without triggering the IntersectionObserver again.
  var _resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(_flushAboveFold, 250);
  }, { passive: true });

})();

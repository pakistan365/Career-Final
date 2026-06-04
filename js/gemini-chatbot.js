function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDeadline(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const s = dateStr.trim();
  if (!s) return null;

  // Try native parse first
  const native = new Date(s);
  if (!Number.isNaN(native.getTime())) return native;

  // Support common dd/mm/yyyy or mm/dd/yyyy-ish variants conservatively
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    let a = parseInt(m[1], 10);
    let b = parseInt(m[2], 10);
    let y = parseInt(m[3], 10);
    if (y < 100) y += 2000;

    // Heuristic: if first part > 12, assume dd/mm/yyyy
    let month = a;
    let day = b;
    if (a > 12) {
      day = a;
      month = b;
    }
    const dt = new Date(y, month - 1, day);
    if (!Number.isNaN(dt.getTime())) return dt;
  }

  return null;
}

/**
 * Returns status for a deadline:
 * - "closed"   => deadline in the past
 * - "urgent"   => within 7 days (inclusive)
 * - "soon"     => within 30 days (inclusive)
 * - "open"     => beyond 30 days
 * - "unknown"  => missing/unparseable
 */
function getDeadlineStatus(dateStr) {
  const d = parseDeadline(dateStr);
  if (!d) return { state: 'unknown', daysLeft: null };

  const today = startOfDay(new Date());
  const deadline = startOfDay(d);
  const ms = deadline.getTime() - today.getTime();
  const daysLeft = Math.round(ms / 86400000);

  if (daysLeft < 0) return { state: 'closed', daysLeft };
  if (daysLeft <= 7) return { state: 'urgent', daysLeft };
  if (daysLeft <= 30) return { state: 'soon', daysLeft };
  return { state: 'open', daysLeft };
}

function badgeForStatus(status) {
  switch (status.state) {
    case 'closed':
      return { text: 'Closed', className: 'badge-deadline-closed' };
    case 'urgent':
      return { text: `Closing in ${status.daysLeft} day${status.daysLeft === 1 ? '' : 's'}`, className: 'badge-deadline-urgent' };
    case 'soon':
      return { text: `Closing in ${status.daysLeft} days`, className: 'badge-deadline-soon' };
    case 'open':
      return { text: 'Open', className: 'badge-deadline-open' };
    default:
      return { text: 'Deadline N/A', className: 'badge-deadline-unknown' };
  }
}

function applyDeadlineBadgeToCard(cardEl) {
  if (!cardEl) return;
  if (cardEl.querySelector('.deadline-badge')) return;

  const deadline =
    cardEl.getAttribute('data-deadline') ||
    cardEl.dataset?.deadline ||
    cardEl.querySelector('[data-deadline]')?.getAttribute('data-deadline') ||
    '';

  const status = getDeadlineStatus(deadline);
  const badge = badgeForStatus(status);

  const span = document.createElement('span');
  span.className = `deadline-badge ${badge.className}`;
  span.textContent = badge.text;

  const anchor =
    cardEl.querySelector('.card-header') ||
    cardEl.querySelector('.card-title') ||
    cardEl.firstElementChild ||
    cardEl;

  anchor.appendChild(span);
}

function scanAndApply(root = document) {
  const cards = root.querySelectorAll(
    '.scholarship-card, .job-card, .internship-card, .exam-card, .book-card, .opportunity-card'
  );
  cards.forEach(applyDeadlineBadgeToCard);
}

function initDeadlineBadges() {
  // Initial paint
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => scanAndApply(document), { once: true });
  } else {
    scanAndApply(document);
  }

  // Re-apply after CMS refresh
  document.addEventListener('cmsRefresh', () => {
    // Allow page renderers to repaint first
    setTimeout(() => scanAndApply(document), 0);
  });

  // Re-apply after custom page render events (if any)
  ['dataRendered', 'cardsRendered', 'resultsRendered'].forEach(evt => {
    document.addEventListener(evt, () => setTimeout(() => scanAndApply(document), 0));
  });
}

// Auto-init
initDeadlineBadges();

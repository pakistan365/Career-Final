/* ════════════════════════════════════════════════════════════
   NOTIFICATIONS PAGE LOGIC  (v2 — professional rewrite)
   Handles rendering, filtering, detail modals, and related content
   Supports all link types: URLs, phone numbers, images, PDFs, Drive
   ════════════════════════════════════════════════════════════ */

let allNotifications = [];
let filteredNotifications = [];
let currentFilter = { category: '', priority: '' };

// Listen for CMS data ready
document.addEventListener('cmsReady', initNotifications);

function initNotifications() {
  allNotifications = window.CMS_DATA.Notifications || [];
  renderNotifications();
  updateSidebar();
}

// ════════════════════════════════════════════════════════════
// RENDERING
// ════════════════════════════════════════════════════════════

function renderNotifications() {
  filteredNotifications = filterNotifications();
  const grid = document.getElementById('notificationsGrid');
  const emptyState = document.getElementById('notifEmptyState');
  const counter = document.getElementById('cntNotifications');

  if (!filteredNotifications.length) {
    grid.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    if (counter) counter.textContent = '0 results';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (counter) counter.textContent = filteredNotifications.length + ' result' + (filteredNotifications.length !== 1 ? 's' : '');
  grid.innerHTML = filteredNotifications.map(n => renderNotificationCard(n)).join('');
}

function renderNotificationCard(notif) {
  const image = (notif.imageLinks && notif.imageLinks[0]) ? notif.imageLinks[0] : '';
  const category = notif.category || 'Urgent';
  const priority = notif.priority || 0;

  const date = notif.postedDate ? new Date(notif.postedDate).toLocaleDateString('en-PK', {
    month: 'short', day: 'numeric'
  }) : 'Today';

  const hasImages = notif.imageLinks && notif.imageLinks.length > 0;
  const hasPdfs   = notif.pdfLinks   && notif.pdfLinks.length   > 0;
  const hasLinks  = notif.externalLinks && notif.externalLinks.length > 0;

  return `
    <div class="notif-card" onclick="openNotificationDetail('${escHtml(notif.id)}')" role="button" tabindex="0"
         onkeydown="if(event.key==='Enter')openNotificationDetail('${escHtml(notif.id)}')">
      ${image
        ? `<img src="${escHtml(image)}" alt="${escHtml(notif.title)}" class="notif-card-image" loading="lazy" onerror="this.parentElement.querySelector('.notif-card-placeholder').style.display='flex';this.style.display='none'"/>
           <div class="notif-card-placeholder" style="display:none">${getCategoryEmoji(category)}</div>`
        : `<div class="notif-card-placeholder">${getCategoryEmoji(category)}</div>`}

      <div class="notif-card-content">
        <div class="notif-card-header">
          <h3 class="notif-card-title">${escHtml(notif.title)}</h3>
          <span class="notif-badge notif-badge-${getCategoryClass(category)}">${escHtml(category)}</span>
        </div>

        <div class="notif-card-meta">
          <span><i class="fa fa-calendar fa-xs"></i> ${escHtml(date)}</span>
          <span class="notif-priority-stars">${renderStars(priority)}</span>
        </div>

        ${notif.description ? `<p class="notif-card-description">${escHtml(notif.description).substring(0, 110)}${notif.description.length > 110 ? '…' : ''}</p>` : ''}

        <div class="notif-card-footer">
          ${hasImages ? `<span class="notif-content-badge"><i class="fa fa-image"></i> ${notif.imageLinks.length} Image${notif.imageLinks.length > 1 ? 's' : ''}</span>` : ''}
          ${hasPdfs  ? `<span class="notif-content-badge"><i class="fa fa-file-pdf"></i> ${notif.pdfLinks.length} PDF</span>` : ''}
          ${hasLinks ? `<span class="notif-content-badge"><i class="fa fa-link"></i> ${notif.externalLinks.length} Link${notif.externalLinks.length > 1 ? 's' : ''}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

function getCategoryEmoji(category) {
  const map = {
    'Urgent': '🔴', 'Paper': '📄', 'Book': '📚',
    'Exam': '✏️', 'Scholarship': '🎓', 'Job': '💼',
    'Link': '🔗', 'Resource': '📁'
  };
  return map[category] || '📌';
}

function getCategoryClass(category) {
  return (category || 'urgent').toLowerCase().replace(/\s+/g, '');
}

function renderStars(priority) {
  const p = Math.min(Math.max(priority || 0, 0), 5);
  return '⭐'.repeat(p) + (p < 5 ? '☆'.repeat(5 - p) : '');
}

// ════════════════════════════════════════════════════════════
// LINK TYPE DETECTION
// ════════════════════════════════════════════════════════════

function detectLinkType(link) {
  const s = String(link || '').trim();

  // Phone number: starts with + or digits, possibly with spaces/dashes
  if (/^[\+\d][\d\s\-\(\)]{6,}$/.test(s)) return 'phone';

  // If it's not a URL, treat as text/label
  if (!/^https?:\/\//i.test(s) && !/^www\./i.test(s)) return 'text';

  const lower = s.toLowerCase();

  // Image
  if (/\.(jpe?g|png|gif|webp|svg|bmp)(\?.*)?$/.test(lower)) return 'image';
  if (lower.includes('i.ibb.co') || lower.includes('imgur.com') || lower.includes('imgbb.com')) return 'image';
  if (lower.includes('drive.google.com') && (lower.includes('/file/') || lower.includes('id='))) {
    // Google Drive can be image or doc — check extension or assume doc
    return lower.match(/\.(jpe?g|png|gif|webp)/) ? 'image' : 'gdrive';
  }

  // PDF
  if (lower.includes('.pdf') || lower.includes('pdf')) return 'pdf';

  // Apply / registration forms
  if (/apply|register|form|signup|sign-up|admission/i.test(lower)) return 'apply';

  // WhatsApp
  if (lower.includes('wa.me') || lower.includes('whatsapp')) return 'whatsapp';

  return 'url';
}

function getLinkIcon(type) {
  const icons = {
    phone: 'fa-phone', image: 'fa-image', pdf: 'fa-file-pdf',
    gdrive: 'fa-brands fa-google-drive', apply: 'fa-pen-to-square',
    whatsapp: 'fa-brands fa-whatsapp', url: 'fa-arrow-up-right-from-square', text: 'fa-info-circle'
  };
  return icons[type] || 'fa-link';
}

function getLinkLabel(link, type, index) {
  switch (type) {
    case 'phone':    return 'Call: ' + link;
    case 'image':    return 'Image ' + (index + 1);
    case 'pdf':      return link.split('/').pop().replace(/\?.*/, '') || ('Document ' + (index + 1));
    case 'gdrive':   return 'Open Document ' + (index + 1);
    case 'apply':    return 'Apply / Register';
    case 'whatsapp': return 'Contact on WhatsApp';
    case 'text':     return link;
    default:
      try { return new URL(link).hostname.replace('www.', ''); } catch { return 'Visit Link'; }
  }
}

function getLinkHref(link, type) {
  if (type === 'phone') return 'tel:' + link.replace(/[^\d\+]/g, '');
  if (type === 'text')  return '#';
  // Normalise www links
  if (/^www\./i.test(link)) return 'https://' + link;
  return link;
}

function renderUniversalLink(link, index) {
  const type = detectLinkType(link);
  const href = getLinkHref(link, type);
  const label = getLinkLabel(link, type, index);
  const icon = getLinkIcon(type);
  const isExternal = (type !== 'text' && type !== 'phone');
  const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';

  let subtext = '';
  try {
    if (type === 'url' || type === 'apply') subtext = new URL(link).hostname.replace('www.', '');
    else if (type === 'gdrive') subtext = 'Google Drive';
    else if (type === 'whatsapp') subtext = 'WhatsApp';
    else if (type === 'pdf') subtext = 'PDF Document';
    else if (type === 'image') subtext = 'Image File';
    else if (type === 'phone') subtext = 'Phone Number';
  } catch {}

  return `
    <a href="${escHtml(href)}"${targetAttr} class="notif-link-item notif-link-${escHtml(type)}">
      <i class="fa ${escHtml(icon)}"></i>
      <div class="notif-link-text">
        <span class="notif-link-title">${escHtml(label)}</span>
        ${subtext ? `<span class="notif-link-url">${escHtml(subtext)}</span>` : ''}
      </div>
      ${isExternal ? '<i class="fa fa-arrow-up-right-from-square notif-link-arrow"></i>' : ''}
    </a>
  `;
}

// ════════════════════════════════════════════════════════════
// FILTERING & SIDEBAR
// ════════════════════════════════════════════════════════════

function filterNotifications() {
  return allNotifications.filter(n => {
    if (!n.isActive) return false;
    if (n.startDate && new Date() < new Date(n.startDate)) return false;
    if (n.endDate   && new Date() > new Date(n.endDate))   return false;
    if (currentFilter.category && n.category !== currentFilter.category) return false;
    if (currentFilter.priority && parseInt(n.priority || 0) < parseInt(currentFilter.priority)) return false;
    return true;
  }).sort((a, b) => {
    const pDiff = (b.priority || 0) - (a.priority || 0);
    if (pDiff !== 0) return pDiff;
    return new Date(b.postedDate || 0) - new Date(a.postedDate || 0);
  });
}

function applyFilters() {
  currentFilter.category = document.getElementById('filterCategory').value;
  currentFilter.priority = document.getElementById('filterPriority').value;
  renderNotifications();
  updateSidebar();
}

function clearFilters() {
  document.getElementById('filterCategory').value = '';
  document.getElementById('filterPriority').value = '';
  currentFilter = { category: '', priority: '' };
  renderNotifications();
  updateSidebar();
  updateSidebarActiveLink('');
}

function filterByCategory(category) {
  document.getElementById('filterCategory').value = category;
  currentFilter.category = category;
  currentFilter.priority = '';
  document.getElementById('filterPriority').value = '';
  renderNotifications();
  updateSidebar();
  updateSidebarActiveLink(category);
}

function updateSidebarActiveLink(category) {
  const nav = document.getElementById('sidebarFilterNav');
  if (!nav) return;
  nav.querySelectorAll('.sw-ql').forEach(link => {
    const fn = link.getAttribute('onclick') || '';
    const isAll = category === '' && fn.includes("''");
    const matches = category !== '' && fn.includes("'" + category + "'");
    link.classList.toggle('active', isAll || matches);
  });
}

function updateSidebar() {
  updateRecentList();
  updateStatistics();
}

function updateRecentList() {
  const recentList = document.getElementById('recentNotifList');
  if (!recentList) return;
  const recent = filteredNotifications.slice(0, 5);

  if (!recent.length) {
    recentList.innerHTML = '<p style="color:var(--text-muted);font-size:.85rem;margin:0">No recent updates</p>';
    return;
  }

  recentList.innerHTML = recent.map(n => `
    <div style="padding:.5rem .6rem;background:var(--bg-secondary,#f8fafc);border-radius:6px;border-left:3px solid var(--primary,#0f766e);cursor:pointer;transition:transform .15s"
         onclick="openNotificationDetail('${escHtml(n.id)}')"
         onmouseover="this.style.transform='translateX(2px)'" onmouseout="this.style.transform=''">
      <div style="font-size:.82rem;font-weight:600;color:var(--text-main,#1e293b);margin-bottom:.15rem">${escHtml(n.title.substring(0, 42))}${n.title.length > 42 ? '…' : ''}</div>
      <div style="font-size:.72rem;color:var(--text-muted,#94a3b8)">${new Date(n.postedDate || new Date()).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}</div>
    </div>
  `).join('');
}

function updateStatistics() {
  const total = allNotifications.filter(n => n.isActive).length;
  const urgent = allNotifications.filter(n => n.isActive && n.category === 'Urgent').length;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeek = allNotifications.filter(n =>
    n.isActive && new Date(n.postedDate || new Date()) >= weekAgo
  ).length;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('statTotal', total);
  set('statUrgent', urgent);
  set('statWeek', thisWeek);
}

// ════════════════════════════════════════════════════════════
// DETAIL MODAL
// ════════════════════════════════════════════════════════════

function openNotificationDetail(notifId) {
  const notif = allNotifications.find(n => n.id === notifId);
  if (!notif) return;

  const modal = document.getElementById('notifDetailModal');

  // Header
  document.getElementById('modalTitle').textContent = notif.title || '';
  document.getElementById('modalCategory').textContent = getCategoryEmoji(notif.category) + ' ' + (notif.category || 'Notification');
  document.getElementById('modalPriority').textContent = '🎯 Priority: ' + renderStars(notif.priority);
  document.getElementById('modalDate').textContent = notif.postedDate
    ? new Date(notif.postedDate).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Today';

  // Description
  const descEl = document.getElementById('modalDescription');
  if (notif.description) {
    descEl.innerHTML = escHtml(notif.description).replace(/\n/g, '<br>');
    descEl.style.display = 'block';
  } else {
    descEl.style.display = 'none';
  }

  // Image Gallery
  const gallery = document.getElementById('imageGallery');
  if (notif.imageLinks && notif.imageLinks.length > 0) {
    renderImageGallery(notif.imageLinks);
    gallery.style.display = 'block';
  } else {
    gallery.style.display = 'none';
  }

  // PDF Links
  const pdfSec = document.getElementById('pdfSection');
  if (notif.pdfLinks && notif.pdfLinks.length > 0) {
    document.getElementById('pdfList').innerHTML = notif.pdfLinks.map((pdf, i) => renderUniversalLink(pdf, i)).join('');
    pdfSec.style.display = 'block';
  } else {
    pdfSec.style.display = 'none';
  }

  // External / Universal Links
  const extSec = document.getElementById('externalSection');
  if (notif.externalLinks && notif.externalLinks.length > 0) {
    document.getElementById('externalList').innerHTML = notif.externalLinks.map((l, i) => renderUniversalLink(l, i)).join('');
    extSec.style.display = 'block';
  } else {
    extSec.style.display = 'none';
  }

  // All-links fallback section (if neither pdf nor external populated but there's a legacy link field)
  const allSec = document.getElementById('allLinksSection');
  const legacyLinks = [];
  if (notif.link && !notif.externalLinks?.length && !notif.pdfLinks?.length) legacyLinks.push(notif.link);
  if (legacyLinks.length) {
    document.getElementById('allLinksList').innerHTML = legacyLinks.map((l, i) => renderUniversalLink(l, i)).join('');
    allSec.style.display = 'block';
  } else {
    allSec.style.display = 'none';
  }

  // Related content from another sheet
  if (notif.relatedSheet && notif.relatedId) {
    renderRelatedContent(notif.relatedSheet, notif.relatedId);
    document.getElementById('relatedContent').style.display = 'block';
  } else {
    document.getElementById('relatedContent').style.display = 'none';
  }

  // More from same category
  renderMoreFromCategory(notif.id, notif.category);

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeNotificationDetail() {
  const modal = document.getElementById('notifDetailModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

// ════════════════════════════════════════════════════════════
// IMAGE GALLERY
// ════════════════════════════════════════════════════════════

function renderImageGallery(imageLinks) {
  const mainImg = document.getElementById('mainImage');
  const thumbnails = document.getElementById('imageThumbnails');

  if (imageLinks[0]) {
    mainImg.src = imageLinks[0];
    mainImg.style.display = 'block';
    mainImg.onerror = function() { this.style.display = 'none'; };
  }

  if (imageLinks.length > 1) {
    thumbnails.innerHTML = imageLinks.map((img, idx) => `
      <img src="${escHtml(img)}" alt="Image ${idx + 1}" class="notif-thumbnail ${idx === 0 ? 'active' : ''}"
           onclick="switchMainImage('${escHtml(img)}', this)" loading="lazy"
           onerror="this.style.display='none'"/>
    `).join('');
    thumbnails.style.display = 'flex';
  } else {
    thumbnails.innerHTML = '';
    thumbnails.style.display = 'none';
  }
}

function switchMainImage(src, thumbEl) {
  const mainImg = document.getElementById('mainImage');
  if (mainImg) mainImg.src = src;
  document.querySelectorAll('.notif-thumbnail').forEach(el => el.classList.remove('active'));
  if (thumbEl) thumbEl.classList.add('active');
}

// ════════════════════════════════════════════════════════════
// MODAL SIDEBAR: RELATED & MORE
// ════════════════════════════════════════════════════════════

function renderRelatedContent(sheetName, recordId) {
  const sheetData = window.CMS_DATA[sheetName] || [];
  const related = sheetData.filter(item => item.id === recordId).slice(0, 5);
  const relatedList = document.getElementById('relatedList');
  if (!relatedList) return;

  if (!related.length) {
    document.getElementById('relatedContent').style.display = 'none';
    return;
  }

  relatedList.innerHTML = related.map(item => `
    <div class="related-item" onclick="navigateToRelated('${escHtml(sheetName)}', '${escHtml(item.id)}')">
      <span class="related-item-title">${escHtml((item.title || item.universityName || item.program || 'Item').substring(0, 45))}</span>
      <span class="related-item-meta">${escHtml(sheetName)} · ${new Date(item.postedDate || item.date || new Date()).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}</span>
    </div>
  `).join('');
}

function renderMoreFromCategory(currentId, category) {
  const moreList = document.getElementById('moreCategoryList');
  const moreSection = document.getElementById('moreSameCategory');
  if (!moreList) return;

  const more = filteredNotifications
    .filter(n => n.id !== currentId && (category ? n.category === category : true))
    .slice(0, 4);

  if (!more.length) {
    if (moreSection) moreSection.style.display = 'none';
    return;
  }

  if (moreSection) moreSection.style.display = 'block';
  moreList.innerHTML = more.map(n => `
    <div class="related-item" onclick="openNotificationDetail('${escHtml(n.id)}')">
      <span class="related-item-title">${escHtml((n.title || '').substring(0, 45))}${(n.title || '').length > 45 ? '…' : ''}</span>
      <span class="related-item-meta">${getCategoryEmoji(n.category)} ${escHtml(n.category || '')} · ${n.postedDate ? new Date(n.postedDate).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }) : 'Today'}</span>
    </div>
  `).join('');
}

function navigateToRelated(sheetName, recordId) {
  const pageMap = {
    'Books': 'books.html', 'Jobs': 'jobs.html', 'Scholarships': 'scholarships.html',
    'Exams': 'exams.html', 'Internships': 'internships.html', 'UniversityAdmissions': 'university-admissions.html'
  };
  const page = pageMap[sheetName];
  if (page) window.location.href = page + '?id=' + encodeURIComponent(recordId);
}

// ════════════════════════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════════════════════════

function escHtml(text) {
  if (!text) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Keep backward compatible alias
function escapeHtml(text) { return escHtml(text); }

// Keyboard close
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('notifDetailModal');
    if (modal && modal.style.display !== 'none') closeNotificationDetail();
  }
});

// Init on DOMContentLoaded if cmsReady already fired
if (document.readyState !== 'loading') {
  if (window.CMS_DATA && window.CMS_DATA.Notifications) initNotifications();
} else {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.CMS_DATA && window.CMS_DATA.Notifications) initNotifications();
  });
}

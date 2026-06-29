/* ════════════════════════════════════════════════════════════
   NOTIFICATIONS PAGE LOGIC
   Handles rendering, filtering, detail modals, and related content
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
  
  if (!filteredNotifications.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted)"><i class="fa fa-bell" style="font-size:2rem;display:block;margin-bottom:1rem;opacity:.4"></i>No notifications match your filters — check back soon.</div>';
    return;
  }

  grid.innerHTML = filteredNotifications.map(n => renderNotificationCard(n)).join('');
  document.getElementById('cntNotifications').textContent = filteredNotifications.length;
}

function renderNotificationCard(notif) {
  const image = (notif.imageLinks && notif.imageLinks[0]) ? notif.imageLinks[0] : '';
  const category = notif.category || 'Urgent';
  const priority = notif.priority || 0;
  const hasContent = (notif.imageLinks && notif.imageLinks.length > 0) ||
                     (notif.pdfLinks && notif.pdfLinks.length > 0) ||
                     (notif.externalLinks && notif.externalLinks.length > 0);
  
  const date = notif.postedDate ? new Date(notif.postedDate).toLocaleDateString('en-PK', {
    month: 'short',
    day: 'numeric'
  }) : 'Today';

  return `
    <div class="notif-card" onclick="openNotificationDetail('${escapeHtml(notif.id)}')">
      ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(notif.title)}" class="notif-card-image" loading="lazy"/>` : `<div class="notif-card-image no-image">${getCategoryEmoji(category)}</div>`}
      
      <div class="notif-card-content">
        <div class="notif-card-header">
          <h3 class="notif-card-title">${escapeHtml(notif.title)}</h3>
          <span class="notif-badge notif-badge-${getCategoryClass(category)}">${escapeHtml(category)}</span>
        </div>

        <div class="notif-card-meta">
          <span><i class="fa fa-calendar fa-xs"></i> ${escapeHtml(date)}</span>
          <span class="notif-priority-stars">${renderStars(priority)}</span>
        </div>

        ${notif.description ? `<p class="notif-card-description">${escapeHtml(notif.description).substring(0, 100)}…</p>` : ''}

        <div class="notif-card-footer">
          ${notif.imageLinks && notif.imageLinks.length > 0 ? `<span class="notif-content-badge"><i class="fa fa-image"></i> ${notif.imageLinks.length} Image${notif.imageLinks.length > 1 ? 's' : ''}</span>` : ''}
          ${notif.pdfLinks && notif.pdfLinks.length > 0 ? `<span class="notif-content-badge"><i class="fa fa-file-pdf"></i> ${notif.pdfLinks.length} PDF</span>` : ''}
          ${notif.externalLinks && notif.externalLinks.length > 0 ? `<span class="notif-content-badge"><i class="fa fa-link"></i> ${notif.externalLinks.length} Link${notif.externalLinks.length > 1 ? 's' : ''}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

function getCategoryEmoji(category) {
  const map = {
    'Urgent': '🔴',
    'Paper': '📄',
    'Book': '📚',
    'Exam': '✏️',
    'Scholarship': '🎓',
    'Job': '💼',
    'Link': '🔗',
    'Resource': '📁'
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
// FILTERING & SIDEBAR
// ════════════════════════════════════════════════════════════

function filterNotifications() {
  return allNotifications.filter(n => {
    if (!n.isActive) return false;
    
    // Check dates if they exist
    if (n.startDate && new Date() < new Date(n.startDate)) return false;
    if (n.endDate && new Date() > new Date(n.endDate)) return false;
    
    if (currentFilter.category && n.category !== currentFilter.category) return false;
    if (currentFilter.priority && parseInt(n.priority || 0) < parseInt(currentFilter.priority)) return false;
    
    return true;
  }).sort((a, b) => {
    // Sort by priority desc, then by date desc
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
  // Update sidebar links
  document.querySelectorAll('.sidebar-link').forEach((link, idx) => {
    link.classList.toggle('active', idx === 0);
  });
}

function filterByCategory(category) {
  document.getElementById('filterCategory').value = category;
  currentFilter.category = category;
  currentFilter.priority = '';
  document.getElementById('filterPriority').value = '';
  renderNotifications();
  updateSidebar();
  
  // Update sidebar active state
  document.querySelectorAll('.sidebar-link').forEach((link, idx) => {
    link.classList.toggle('active', idx === 0 && category === '' || idx > 0 && link.textContent.includes(category));
  });
}

function updateSidebar() {
  updateRecentList();
  updateStatistics();
}

function updateRecentList() {
  const recentList = document.getElementById('recentNotifList');
  const recent = filteredNotifications.slice(0, 5);
  
  if (!recent.length) {
    recentList.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;margin:0">No recent updates</p>';
    return;
  }

  recentList.innerHTML = recent.map(n => `
    <div class="sidebar-list-item" onclick="openNotificationDetail('${escapeHtml(n.id)}')">
      <div class="sidebar-list-item-title">${escapeHtml(n.title.substring(0, 40))}${n.title.length > 40 ? '…' : ''}</div>
      <div class="sidebar-list-item-date">${new Date(n.postedDate || new Date()).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}</div>
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

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statUrgent').textContent = urgent;
  document.getElementById('statWeek').textContent = thisWeek;
}

// ════════════════════════════════════════════════════════════
// DETAIL MODAL
// ════════════════════════════════════════════════════════════

function openNotificationDetail(notifId) {
  const notif = allNotifications.find(n => n.id === notifId);
  if (!notif) return;

  const modal = document.getElementById('notifDetailModal');
  
  // Header
  document.getElementById('modalTitle').textContent = escapeHtml(notif.title);
  document.getElementById('modalCategory').textContent = getCategoryEmoji(notif.category) + ' ' + escapeHtml(notif.category || 'Notification');
  document.getElementById('modalPriority').textContent = '🎯 Priority: ' + renderStars(notif.priority);
  document.getElementById('modalDate').textContent = notif.postedDate ? 
    new Date(notif.postedDate).toLocaleDateString('en-PK') : 'Today';

  // Description
  if (notif.description) {
    document.getElementById('modalDescription').innerHTML = escapeHtml(notif.description).replace(/\n/g, '<br>');
    document.getElementById('modalDescription').style.display = 'block';
  } else {
    document.getElementById('modalDescription').style.display = 'none';
  }

  // Image Gallery
  if (notif.imageLinks && notif.imageLinks.length > 0) {
    renderImageGallery(notif.imageLinks);
    document.getElementById('imageGallery').style.display = 'block';
  } else {
    document.getElementById('imageGallery').style.display = 'none';
  }

  // PDF Links
  if (notif.pdfLinks && notif.pdfLinks.length > 0) {
    renderPdfLinks(notif.pdfLinks);
    document.getElementById('pdfSection').style.display = 'block';
  } else {
    document.getElementById('pdfSection').style.display = 'none';
  }

  // External Links
  if (notif.externalLinks && notif.externalLinks.length > 0) {
    renderExternalLinks(notif.externalLinks);
    document.getElementById('externalSection').style.display = 'block';
  } else {
    document.getElementById('externalSection').style.display = 'none';
  }

  // Related Content
  if (notif.relatedSheet && notif.relatedId) {
    renderRelatedContent(notif.relatedSheet, notif.relatedId);
    document.getElementById('relatedContent').style.display = 'block';
  } else {
    document.getElementById('relatedContent').style.display = 'none';
  }

  // Show modal
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeNotificationDetail() {
  const modal = document.getElementById('notifDetailModal');
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

// ════════════════════════════════════════════════════════════
// IMAGE GALLERY
// ════════════════════════════════════════════════════════════

function renderImageGallery(imageLinks) {
  const mainImg = document.getElementById('mainImage');
  const thumbnails = document.getElementById('imageThumbnails');

  // Set main image
  if (imageLinks[0]) {
    mainImg.src = imageLinks[0];
    mainImg.style.display = 'block';
  }

  // Create thumbnails
  thumbnails.innerHTML = imageLinks.map((img, idx) => `
    <img src="${escapeHtml(img)}" alt="Image ${idx + 1}" class="notif-thumbnail ${idx === 0 ? 'active' : ''}" 
         onclick="switchMainImage('${escapeHtml(img)}', this)" loading="lazy"/>
  `).join('');
}

function switchMainImage(src, thumbEl) {
  document.getElementById('mainImage').src = src;
  document.querySelectorAll('.notif-thumbnail').forEach(el => el.classList.remove('active'));
  thumbEl.classList.add('active');
}

// ════════════════════════════════════════════════════════════
// PDF & EXTERNAL LINKS
// ════════════════════════════════════════════════════════════

function renderPdfLinks(pdfLinks) {
  const list = document.getElementById('pdfList');
  list.innerHTML = pdfLinks.map((pdf, idx) => {
    const isGoogleDrive = pdf.includes('drive.google.com');
    const displayName = isGoogleDrive ? 'Document ' + (idx + 1) : pdf.split('/').pop() || 'PDF ' + (idx + 1);
    return `
      <a href="${escapeHtml(pdf)}" target="_blank" rel="noopener noreferrer" class="notif-link-item">
        <i class="fa fa-file-pdf"></i>
        <div class="notif-link-text">
          <span class="notif-link-title">${escapeHtml(displayName)}</span>
          <span class="notif-link-url">${isGoogleDrive ? 'Google Drive' : 'PDF Document'}</span>
        </div>
        <i class="fa fa-arrow-up-right-from-square" style="margin-left:auto;opacity:0.5"></i>
      </a>
    `;
  }).join('');
}

function renderExternalLinks(extLinks) {
  const list = document.getElementById('externalList');
  list.innerHTML = extLinks.map((link, idx) => {
    const isApply = link.toLowerCase().includes('apply') || link.toLowerCase().includes('register');
    const title = isApply ? 'Apply / Register' : 'View Details';
    return `
      <a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" class="notif-link-item">
        <i class="fa ${isApply ? 'fa-pen-fancy' : 'fa-arrow-up-right-from-square'}"></i>
        <div class="notif-link-text">
          <span class="notif-link-title">${escapeHtml(title)}</span>
          <span class="notif-link-url">${sanitizeUrl(link)}</span>
        </div>
        <i class="fa fa-arrow-up-right-from-square" style="margin-left:auto;opacity:0.5"></i>
      </a>
    `;
  }).join('');
}

function sanitizeUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace('www.', '');
  } catch {
    return url.substring(0, 30) + (url.length > 30 ? '…' : '');
  }
}

// ════════════════════════════════════════════════════════════
// RELATED CONTENT
// ════════════════════════════════════════════════════════════

function renderRelatedContent(sheetName, recordId) {
  const sheetData = window.CMS_DATA[sheetName] || [];
  const related = sheetData.filter(item => item.id === recordId).slice(0, 5);
  const relatedList = document.getElementById('relatedList');

  if (!related.length) {
    document.getElementById('relatedContent').style.display = 'none';
    return;
  }

  relatedList.innerHTML = related.map(item => `
    <div class="related-item" onclick="navigateToRelated('${escapeHtml(sheetName)}', '${escapeHtml(item.id)}')">
      <span class="related-item-title">${escapeHtml((item.title || item.universityName || item.program || 'Item').substring(0, 40))}</span>
      <span class="related-item-meta">${escapeHtml(sheetName)} • ${new Date(item.postedDate || item.date || new Date()).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}</span>
    </div>
  `).join('');
}

function navigateToRelated(sheetName, recordId) {
  const pageMap = {
    'Books': 'books.html',
    'Jobs': 'jobs.html',
    'Scholarships': 'scholarships.html',
    'Exams': 'exams.html',
    'Internships': 'internships.html',
    'UniversityAdmissions': 'university-admissions.html'
  };
  const page = pageMap[sheetName];
  if (page) {
    window.location.href = page + '?id=' + encodeURIComponent(recordId);
  }
}

// ════════════════════════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════════════════════════

function escapeHtml(text) {
  if (!text) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Close modal on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.getElementById('notifDetailModal').style.display !== 'none') {
    closeNotificationDetail();
  }
});

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.CMS_DATA && window.CMS_DATA.Notifications) {
      initNotifications();
    }
  });
}

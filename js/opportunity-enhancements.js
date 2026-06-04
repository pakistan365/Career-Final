(function () {
  const typeMap = {
    scholarship: { sheet: 'Scholarships', icon: '🎓', base: 'scholarships.html', label: 'Scholarships' },
    internship: { sheet: 'Internships', icon: '💼', base: 'internships.html', label: 'Internships' },
    job: { sheet: 'Jobs', icon: '💼', base: 'jobs.html', label: 'Jobs' },
    exam: { sheet: 'Exams', icon: '📝', base: 'exams.html', label: 'Exams' },
    book: { sheet: 'Books', icon: '📚', base: 'books.html', label: 'Books' }
  };

  const params = new URLSearchParams(window.location.search);
  const type = (params.get('type') || '').toLowerCase().trim();
  const slug = (params.get('slug') || '').trim();
  const id = (params.get('id') || '').trim();
  const group = (params.get('group') || '').trim();
  const cfg = typeMap[type];

  const els = {
    title: document.getElementById('opportunityTitle'),
    subtitle: document.getElementById('opportunitySubtitle'),
    breadcrumb: document.getElementById('opportunityBreadcrumb'),
    cover: document.getElementById('opportunityCover'),
    meta: document.getElementById('opportunityMeta'),
    overview: document.getElementById('opportunityOverview'),
    body: document.getElementById('opportunityBody'),
    actions: document.getElementById('opportunityActions'),
    related: document.getElementById('relatedSameTypeCards'),
    relatedTitle: document.getElementById('relatedSameTypeTitle')
  };

  function esc(value) { return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#39;'); }
  function norm(value) { return String(value || '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''); }
  function fmtDate(value) { if (!value) return 'N/A'; const d = new Date(value); return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString(); }

  function firstNonEmpty() {
    for (let i = 0; i < arguments.length; i += 1) {
      const v = arguments[i];
      if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
  }

  function setError(message) {
    if (els.title) els.title.textContent = message;
    if (els.subtitle) els.subtitle.textContent = 'Please return to listings and open another opportunity.';
    if (els.breadcrumb) els.breadcrumb.textContent = '';
    if (els.meta) els.meta.innerHTML = '';
    if (els.overview) els.overview.textContent = '';
    if (els.body) els.body.innerHTML = '';
    if (els.actions) els.actions.innerHTML = `<a class="btn btn-secondary" href="${cfg ? cfg.base : 'search.html'}">Back</a>`;
    if (els.related) els.related.innerHTML = '';
  }

  function getItemId(item) { return firstNonEmpty(item.id, item.ID, item._id, item.rowId); }

  function getItemUrl(itemType, item) {
    const itemId = getItemId(item);
    if (itemId) return `opportunity.html?type=${encodeURIComponent(itemType)}&id=${encodeURIComponent(itemId)}`;
    const itemSlug = firstNonEmpty(item.slug, norm(firstNonEmpty(item.title, item.name)));
    return `opportunity.html?type=${encodeURIComponent(itemType)}&slug=${encodeURIComponent(itemSlug)}`;
  }

  function tokenSet(item) {
    const blob = [item.title, item.name, item.organization, item.company, item.provider, item.category, item.location, item.description, item.details, item.tags].filter(Boolean).join(' ').toLowerCase();
    return new Set(blob.split(/[^a-z0-9]+/).filter((t) => t.length > 2));
  }

  function relatedScore(sourceTokens, candidate) {
    const candidateTokens = tokenSet(candidate);
    let score = 0;
    sourceTokens.forEach((t) => { if (candidateTokens.has(t)) score += 1; });
    return score;
  }

  function renderRelatedCard(itemType, item) {
    const title = esc(firstNonEmpty(item.title, item.name, 'Untitled'));
    const org = esc(firstNonEmpty(item.organization, item.company, item.provider));
    const deadline = esc(fmtDate(firstNonEmpty(item.deadline, item.lastDate, item.date)));
    return `<a class="related-card" href="${getItemUrl(itemType, item)}"><div class="related-top"><span class="related-type">${esc(typeMap[itemType]?.icon || '🔗')} ${esc(typeMap[itemType]?.label || itemType)}</span><span class="related-deadline">⏳ ${deadline}</span></div><h4>${title}</h4>${org ? `<p>${org}</p>` : ''}</a>`;
  }

  function matchesGroup(item, targetGroup) {
    const g = targetGroup.toLowerCase();
    const fields = [item.group, item.category, item.exam_type, item.book_group, item.type, item.title, item.details].map((v) => String(v || '').toLowerCase());
    return fields.some((f) => f.includes(g));
  }

  function findItem(list) {
    if (id) {
      const byId = list.find((x) => getItemId(x) === id);
      if (byId) return byId;
    }
    if (slug) {
      const bySlug = list.find((x) => {
        const candidateSlug = firstNonEmpty(x.slug, norm(firstNonEmpty(x.title, x.name)));
        return candidateSlug === slug;
      });
      if (bySlug) return bySlug;
    }
    if (group) {
      const grouped = list.filter((x) => matchesGroup(x, group));
      if (grouped.length) {
        grouped.sort((a, b) => new Date(firstNonEmpty(b.posted_date, b.postedDate, b.date, 0)) - new Date(firstNonEmpty(a.posted_date, a.postedDate, a.date, 0)));
        return grouped[0];
      }
    }
    return null;
  }

  function render(item, allData) {
    const title = firstNonEmpty(item.title, item.name, group ? `${group} Updates` : 'Untitled');
    const org = firstNonEmpty(item.organization, item.company, item.provider, 'N/A');
    const location = firstNonEmpty(item.location, 'Pakistan');
    const deadline = fmtDate(firstNonEmpty(item.deadline, item.lastDate, item.date));
    const rawDesc    = String(item.description || '').trim();
    const rawDetails = String(item.details || '').trim();
    // Show overview only when description exists, is distinct from details, and is short enough to be a true summary
    const hasDistinctDesc = rawDesc && rawDesc !== rawDetails && !rawDetails.includes(rawDesc) && rawDesc.length <= 400;
    const summary = hasDistinctDesc ? rawDesc : '';
    const details = firstNonEmpty(item.details, item.description, 'No details available yet.');
    const applyLink = firstNonEmpty(item.applyLink, item.link, item.url);
    const siteLink = firstNonEmpty(item.website);
    const image = firstNonEmpty(item.image_url, item.image, item.cover, item.banner, 'banner.png');
    
    if (els.title) els.title.textContent = title;
    if (els.subtitle) els.subtitle.textContent = `${cfg.icon} ${cfg.label} · ${org}`;
    if (els.breadcrumb) els.breadcrumb.innerHTML = `<a href="${cfg.base}">${esc(cfg.label)}</a> / <span>${esc(title)}</span>`;
    if (els.cover) {
      els.cover.src = image;
      els.cover.alt = `${title} cover image`;
      els.cover.loading = 'lazy';
      els.cover.onerror = function onCoverError() {
        this.onerror = null;
        this.src = 'banner.png';
      };
    }
    if (els.meta) els.meta.innerHTML = `<span><strong>Organization:</strong> ${esc(org)}</span><span><strong>Location:</strong> ${esc(location)}</span><span><strong>Deadline:</strong> ${esc(deadline)}</span>`;
    // Show overview section only when there is a distinct short description
    const overviewSection = document.getElementById('overviewSection');
    if (overviewSection) overviewSection.style.display = summary ? '' : 'none';
    if (els.overview) els.overview.textContent = summary;
    // Render body with full rich text: images shown inline, PDFs as embedded previews,
    // plain URLs as clickable links — all embedded within the description text flow.
    if (els.body) {
      // Use renderRichTextWithPreviews from app.js (loaded before this script)
      const richHtml = (typeof renderRichTextWithPreviews === 'function')
        ? renderRichTextWithPreviews(details)
        : `<p>${esc(details).replace(/\n/g, '<br>')}</p>`;
      els.body.innerHTML = richHtml;
    }

    if (els.actions) {
      const links = [];
      if (applyLink) links.push(`<a class="btn btn-primary" href="${esc(applyLink)}" target="_blank" rel="noopener noreferrer">Open Official Link</a>`);
      if (siteLink) links.push(`<a class="btn btn-secondary" href="${esc(siteLink)}" target="_blank" rel="noopener noreferrer">Visit Website</a>`);
      links.push(`<a class="btn btn-secondary" href="${cfg.base}">Back to ${esc(cfg.label)}</a>`);
      els.actions.innerHTML = links.join('');
    }

    // Render inline resource previews (PDF/image/cloud links from all link fields)
    // These appear below the action buttons as visual embedded previews
    if (els.actions && typeof renderResourceActions === 'function') {
      const resourceHtml = renderResourceActions(item, title);
      if (resourceHtml) {
        els.actions.innerHTML += resourceHtml;
      }
    }

    if (!els.related) return;
    const sourceTokens = tokenSet(item);
    const sameTypeList = (allData[cfg.sheet] || []).filter((x) => x !== item);
    
    // Sort by date for consistent ordering (latest first)
    const sortedList = sameTypeList.sort((a, b) => 
      new Date(firstNonEmpty(b.posted_date, b.date, 0)) - new Date(firstNonEmpty(a.posted_date, a.date, 0))
    );
    
    const currentIndex = sortedList.findIndex(x => x === item);
    const prevItem = currentIndex > 0 ? sortedList[currentIndex - 1] : null;
    const nextItem = currentIndex < sortedList.length - 1 ? sortedList[currentIndex + 1] : null;
    
    // Add next/previous navigation
    if (els.body && (prevItem || nextItem)) {
      const navHtml = `
        <div class="opportunity-nav">
          ${prevItem ? `
            <a href="${getItemUrl(type, prevItem)}" class="nav-opp-card nav-prev">
              <div class="nav-direction"><i class="fa fa-arrow-left"></i> Previous</div>
              <div class="nav-title">${esc(firstNonEmpty(prevItem.title, prevItem.name, 'Untitled'))}</div>
            </a>
          ` : `<div style="flex: 1;"></div>`}
          ${nextItem ? `
            <a href="${getItemUrl(type, nextItem)}" class="nav-opp-card nav-next">
              <div class="nav-direction">Next <i class="fa fa-arrow-right"></i></div>
              <div class="nav-title">${esc(firstNonEmpty(nextItem.title, nextItem.name, 'Untitled'))}</div>
            </a>
          ` : `<div style="flex: 1;"></div>`}
        </div>
      `;
      els.body.insertAdjacentHTML('afterend', navHtml);
    }
    
    const related = sortedList.map((candidate) => ({ candidate, score: relatedScore(sourceTokens, candidate) })).sort((a, b) => b.score - a.score).slice(0, 4).map(({ candidate }) => candidate);

    if (els.relatedTitle) els.relatedTitle.textContent = `More ${cfg.label}`;
    els.related.innerHTML = related.length ? related.map((candidate) => renderRelatedCard(type, candidate)).join('') : '<p class="muted">No related opportunities found.</p>';
  }

  function init() {
    if (!cfg) return setError('Invalid opportunity type');
    if (!id && !slug && !group) return setError('Invalid opportunity link');
    if (typeof window.onCMSReady !== 'function') return setError('Data loader is unavailable right now');

    window.onCMSReady((data) => {
      const list = (data && data[cfg.sheet]) || [];
      const found = findItem(list);
      if (!found) return setError('Opportunity not found');
      render(found, data || {});
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

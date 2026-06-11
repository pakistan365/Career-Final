(function () {
  'use strict';

  const SITE_NAME = 'Career Pakistan';
  const SITE_URL = 'https://careerpk.online';
  const DEFAULT_IMAGE = `${SITE_URL}/banner.webp`;
  const DEFAULT_LOCALE = 'en_PK';

  const META_BY_PATH = {
    '/': {
      title: 'Career Pakistan — Jobs, Scholarships, Internships, Exams & Books',
      description: 'Discover verified jobs, scholarships, internships, exams, books, and career resources tailored for Pakistani students and professionals.',
      keywords: 'career pakistan, scholarships, jobs, internships, exam updates, study books, career guidance',
      type: 'website'
    },
    '/index.html': {
      title: 'Career Pakistan — Jobs, Scholarships, Internships, Exams & Books',
      description: 'Discover verified jobs, scholarships, internships, exams, books, and career resources tailored for Pakistani students and professionals.',
      keywords: 'career pakistan, scholarships, jobs, internships, exam updates, study books, career guidance',
      type: 'website'
    },

    '/jobs.html': {
      title: 'Latest Jobs in Pakistan 2026 — Government & Private | Career Pakistan',
      description: 'Find latest government and private jobs in Pakistan with deadlines, eligibility criteria, and apply links. Updated daily.',
      keywords: 'latest jobs pakistan, government jobs, private jobs, fpsc, ppsc, job alerts, career opportunities',
      type: 'website'
    },
    '/jobs-government.html': {
      title: 'Government Jobs in Pakistan — FPSC, PPSC & Ministries | 2026',
      description: 'Browse government jobs from FPSC, PPSC, NTS, ministries and public departments. Clear requirements, deadlines and application links.',
      keywords: 'government jobs pakistan, fpsc jobs, ppsc jobs, ministry jobs, public sector careers, nts jobs',
      type: 'website'
    },
    '/jobs-private.html': {
      title: 'Private Sector Jobs Pakistan — IT, Banking, FMCG & More',
      description: 'Explore private jobs across IT, telecom, banking, education, healthcare. Search by field, salary, location. Real-time updates.',
      keywords: 'private jobs pakistan, it jobs, banking jobs, corporate jobs, vacancies, career opportunities pakistan',
      type: 'website'
    },

    '/scholarships.html': {
      title: 'Scholarships for Pakistani Students 2026 — Local & International',
      description: 'Access merit-based, need-based, and fully funded scholarships. Browse by level, field, and country. Expert guidance included.',
      keywords: 'scholarships pakistan, fully funded, merit scholarships, study abroad, higher education funding, scholarship opportunities',
      type: 'website'
    },
    '/scholarships-national.html': {
      title: 'National Scholarships Pakistan 2026 — HEC, PEEF, Provincial',
      description: 'Track HEC, PEEF, BEEF and provincial scholarships. Eligibility criteria, deadlines, application process and requirements.',
      keywords: 'national scholarships, hec scholarships, peef, provincial scholarships, student funding, higher education',
      type: 'website'
    },
    '/scholarships-international.html': {
      title: 'International Scholarships 2026 for Pakistani Students',
      description: 'Find global scholarships for Pakistani students. Undergraduate, masters, PhD programs with funding. Country-specific opportunities.',
      keywords: 'international scholarships, masters abroad, phd scholarships, global education funding, study opportunities',
      type: 'website'
    },

    '/internships.html': {
      title: 'Internship Opportunities in Pakistan 2026 — Remote & On-site',
      description: 'Discover summer, semester and year-round internships. Remote, hybrid and office positions across sectors. Build real-world experience.',
      keywords: 'internships pakistan, summer internship, paid internship, remote internship, career development, work experience',
      type: 'website'
    },

    '/blog.html': {
      title: 'Career Blog Pakistan — Job Tips, Scholarships & Exam Guides',
      description: 'Read expert articles on job search, scholarship strategy, exam success, resume writing and career planning for Pakistani professionals.',
      keywords: 'career blog, job tips, scholarship guides, exam preparation, resume writing, career advice, professional development',
      type: 'website'
    },
    '/blog-post.html': {
      title: 'Career Insights | Career Pakistan Blog',
      description: 'Expert article covering practical strategies for academic and professional growth in Pakistan.',
      keywords: 'career insights, education advice, professional growth, career guidance',
      type: 'article'
    },

    '/books.html': {
      title: 'Study Books & Past Papers Pakistan — Free Downloads',
      description: 'Download free CSS, PPSC, FPSC, MDCAT, NTS study books and past papers. PDF guides updated regularly. Build your knowledge base.',
      keywords: 'study books, past papers, css books, ppsc preparation, fpsc guide, mdcat books, nts preparation, free downloads',
      type: 'website'
    },

    '/exams.html': {
      title: 'Exam Updates Pakistan 2026 — Schedules, Dates & Resources',
      description: 'Get exam dates, roll numbers, syllabus highlights, and preparation resources. Major competitive exams in Pakistan tracked real-time.',
      keywords: 'exam updates, entry tests, merit lists, exam schedules, test dates, admission exams, preparation guides',
      type: 'website'
    },
    '/exams-css.html': {
      title: 'CSS Exam 2026 — Updates, Syllabus, Preparation | Career Pakistan',
      description: 'Stay updated on CSS exam schedule, syllabus, application process and preparation resources. Expert guidance for FPSC CSS.',
      keywords: 'css exam, fpsc css, civil service exam, css preparation, exam date, css syllabus, pakistan exam',
      type: 'website'
    },
    '/exams-mdcat.html': {
      title: 'MDCAT 2026 — Exam Dates, Syllabus & Preparation Guide',
      description: 'Follow MDCAT announcements, syllabus breakdown, test strategy and admission updates. Medical aspirants resource center.',
      keywords: 'mdcat, medical entry test, mdcat syllabus, mdcat preparation, mdcat date, medical school admission',
      type: 'website'
    },
    '/exams-ppsc.html': {
      title: 'PPSC Exam & Test Updates 2026 — Schedule & Preparation',
      description: 'Track PPSC written tests, interview notices and exam updates. Punjab Public Service Commission jobs and exam dates.',
      keywords: 'ppsc exam, ppsc test, ppsc preparation, ppsc jobs, interview notice, punjab exam, competitive test',
      type: 'website'
    },

    '/university-admissions.html': {
      title: 'University Admissions Pakistan 2025 — BS, MBBS, Engineering',
      description: 'Browse open admissions at Pakistani universities. BS, BEng, MBBS, BBA by city, province, entry test and merit requirements.',
      keywords: 'university admissions, higher education, college admissions, merit list, entry test, pakistan universities, admission criteria',
      type: 'website'
    },

    '/about.html': {
      title: 'About Career Pakistan — Mission & Team',
      description: 'Learn about Career Pakistan\'s mission to guide students and professionals. Our vision for Pakistan\'s career growth ecosystem.',
      keywords: 'about career pakistan, mission, vision, team, career guidance platform',
      type: 'website'
    },
    '/contact.html': {
      title: 'Contact Career Pakistan — Get in Touch',
      description: 'Contact Career Pakistan with feedback, inquiries or partnership proposals. We respond to all genuine inquiries.',
      keywords: 'contact, feedback, inquiry, support, partnership, career pakistan contact',
      type: 'website'
    },
    '/privacy.html': {
      title: 'Privacy Policy — Career Pakistan',
      description: 'Career Pakistan privacy policy. How we collect, use and protect your data. Your privacy is our priority.',
      keywords: 'privacy policy, data protection, user privacy, information security',
      type: 'website'
    },
    '/terms.html': {
      title: 'Terms of Service — Career Pakistan',
      description: 'Career Pakistan terms of service. Rights, responsibilities and conditions for using our platform.',
      keywords: 'terms of service, user agreement, conditions, legal',
      type: 'website'
    },
    '/resume-builder.html': {
      title: 'Resume Builder — Create Professional CV Online | Career Pakistan',
      description: 'Build a professional resume online with templates. Download PDF CV. Free resume builder for Pakistani job seekers.',
      keywords: 'resume builder, cv maker, professional resume, online cv, career tools, job application',
      type: 'website'
    },
    '/favorites.html': {
      title: 'Saved Opportunities — Career Pakistan',
      description: 'Your saved jobs, scholarships, internships and opportunities in one place. Manage your career search efficiently.',
      keywords: 'saved opportunities, bookmarks, job bookmarks, career management, saved items',
      type: 'website'
    },
    '/search.html': {
      title: 'Search Results — Career Pakistan',
      description: 'Search results for opportunities, articles and resources on Career Pakistan.',
      keywords: 'search, opportunities, jobs, scholarships, articles',
      type: 'website'
    },
    '/opportunity.html': {
      title: 'Opportunity Details — Career Pakistan',
      description: 'Full details of the opportunity. Application deadlines, requirements, and how to apply.',
      keywords: 'opportunity details, job details, application, requirements, deadline',
      type: 'website'
    }
  };

  function ensureMeta(selector, attr, value) {
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      if (selector.includes('property=')) {
        el.setAttribute('property', selector.match(/property="([^"]+)"/)?.[1] || '');
      } else if (selector.includes('name=')) {
        el.setAttribute('name', selector.match(/name="([^"]+)"/)?.[1] || '');
      }
      document.head.appendChild(el);
    }
    el.setAttribute(attr, value);
  }

  function injectStructuredData(schema) {
    let script = document.querySelector('script[data-seo-schema="true"]');
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-schema', 'true');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);
  }

  function getOrganizationSchema() {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Career Pakistan',
      url: SITE_URL,
      logo: `${SITE_URL}/logo.webp`,
      description: 'Career guidance platform for Pakistani students and professionals.',
      sameAs: [
        'https://www.facebook.com/careerpk',
        'https://www.twitter.com/careerpk',
        'https://www.linkedin.com/company/careerpk'
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
        email: 'info@careerpk.online'
      }
    };
  }

  function getWebSiteSchema() {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/search.html?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    };
  }

  function getBreadcrumbSchema(items) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items
    };
  }

  function applyMeta(config) {
    if (!config) return;
    const canonicalUrl = `${SITE_URL}${window.location.pathname}`;

    document.title = config.title;
    ensureMeta('meta[name="description"]', 'content', config.description);
    ensureMeta('meta[name="keywords"]', 'content', config.keywords);
    ensureMeta('meta[name="robots"]', 'content', 'index, follow, max-image-preview:large, max-snippet:-1');

    ensureMeta('meta[property="og:type"]', 'content', config.type || 'website');
    ensureMeta('meta[property="og:site_name"]', 'content', SITE_NAME);
    ensureMeta('meta[property="og:locale"]', 'content', DEFAULT_LOCALE);
    ensureMeta('meta[property="og:title"]', 'content', config.title);
    ensureMeta('meta[property="og:description"]', 'content', config.description);
    ensureMeta('meta[property="og:url"]', 'content', canonicalUrl);
    ensureMeta('meta[property="og:image"]', 'content', config.image || DEFAULT_IMAGE);

    ensureMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    ensureMeta('meta[name="twitter:title"]', 'content', config.title);
    ensureMeta('meta[name="twitter:description"]', 'content', config.description);
    ensureMeta('meta[name="twitter:image"]', 'content', config.image || DEFAULT_IMAGE);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    // Inject organization schema
    injectStructuredData(getOrganizationSchema());
  }

  const pagePath = window.location.pathname || '/';
  const pageMeta = META_BY_PATH[pagePath];
  if (pageMeta) applyMeta(pageMeta);
})();

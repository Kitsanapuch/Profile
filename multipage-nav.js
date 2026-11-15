/* Shared navigation for the bilingual static routes. */
(() => {
  'use strict';
  const isFile = location.protocol === 'file:';

  // Directory URLs are useful on Vercel; explicit index files work in local previews.
  if (isFile) {
    document.querySelectorAll('a[href]').forEach(link => {
      const value = link.getAttribute('href');
      if (!value || value.startsWith('#') || value.startsWith('mailto:')) return;
      const url = new URL(value, location.href);
      if (url.protocol === 'file:' && url.pathname.endsWith('/')) {
        url.pathname += 'index.html';
        link.href = url.href;
      }
    });
  }

  // Older links to the previous one-page portfolio still reach the right section.
  if (document.body.classList.contains('route-home') && location.hash) {
    const sections = {
      skills: 'skills', certifications: 'certifications',
      experience: 'experience', activities: 'activities',
      projects: 'projects', 'studio-focus': 'projects',
      'physics-plus-project': 'projects', 'scamgraph-project': 'projects',
      'myschool-project': 'projects', papers: 'papers', contact: 'contact'
    };
    let id = '';
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) {}
    const route = sections[id];
    if (route) {
      const target = new URL(route + '/' + (isFile ? 'index.html' : ''), location.href);
      target.hash = id;
      location.replace(target.href);
    }
  }
})();

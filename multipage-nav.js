/* Shared navigation for the bilingual static routes. */
(() => {
  'use strict';
  const isFile = location.protocol === 'file:';

  // Keep a section's hash when switching languages.
  document.querySelectorAll('a[data-language]').forEach((link) => {
    const target = new URL(link.href, location.href);
    if (!isFile) target.pathname = target.pathname.replace(/index\.html$/, '');
    target.hash = location.hash;
    link.href = target.href;
  });

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey ||
        event.altKey || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    try {
      const destination = new URL(link.href, location.href);
      if (destination.origin === location.origin && destination.pathname !== location.pathname) {
        sessionStorage.setItem('kitsanapuch-skip-intro-once', '1');
      }
    } catch (_) {
      // Navigation still works if session storage is disabled.
    }
  });
  const navStrip = document.querySelector('.nav-links');
  const activeTab = navStrip?.querySelector('[aria-current="page"]');
  if (navStrip && activeTab && navStrip.scrollWidth > navStrip.clientWidth) {
    navStrip.scrollLeft = Math.max(0, activeTab.offsetLeft - navStrip.offsetLeft -
      (navStrip.clientWidth - activeTab.clientWidth) / 2);
  }

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

(() => {
  'use strict';

  const root = document.documentElement;
  const navigationType = performance.getEntriesByType('navigation')[0]?.type;
  let internalNavigation = false;

  try {
    internalNavigation = sessionStorage.getItem('kitsanapuch-skip-intro-once') === '1';
    sessionStorage.removeItem('kitsanapuch-skip-intro-once');

    const keepTheme = internalNavigation || navigationType === 'reload' || navigationType === 'back_forward';
    if (keepTheme && sessionStorage.getItem('kc-engineer-session-theme') === 'light') {
      root.dataset.theme = 'light';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#fff3dd');
    }
  } catch (_) {
    // The default theme remains available when session storage is unavailable.
  }

  const skipIntro = (internalNavigation && navigationType !== 'reload') || navigationType === 'back_forward';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (skipIntro || reducedMotion.matches) root.classList.add('intro-skip');

  const routes = ['', 'experience', 'activities', 'projects', 'skills', 'certifications', 'papers', 'contact'];
  function routeIndex(pathname) {
    const path = pathname
      .replace(/\/index\.html$/, '/')
      .replace(/^\/th(?=\/|$)/, '')
      .replace(/^\/|\/$/g, '');
    return routes.indexOf(path);
  }

  function updateDirection(activation) {
    root.style.removeProperty('--section-direction');
    if (!activation?.from || !activation.entry) return;
    const { from, entry } = activation;
    const traversing = activation.navigationType === 'traverse' && from.index >= 0 && entry.index >= 0;
    // A referrer policy can hide the previous entry's URL.
    if (!traversing && !from.url) return;
    const previous = traversing ? from.index : routeIndex(new URL(from.url).pathname);
    const current = traversing ? entry.index : routeIndex(location.pathname);
    if (current >= 0 && previous >= 0 && current < previous) {
      root.style.setProperty('--section-direction', '-1');
    }
  }

  if (skipIntro && !reducedMotion.matches) updateDirection(window.navigation?.activation);
  window.addEventListener('pagereveal', () => {
    if (!root.classList.contains('intro-skip') || reducedMotion.matches) return;
    updateDirection(window.navigation?.activation);
  });
})();

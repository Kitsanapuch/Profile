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
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (skipIntro || reducedMotion) root.classList.add('intro-skip');

  const activation = window.navigation?.activation;
  if (!skipIntro || reducedMotion || !activation?.from || !activation.entry) return;

  const routes = ['', 'experience', 'activities', 'projects', 'skills', 'certifications', 'papers', 'contact'];
  function routeIndex(url) {
    const path = new URL(url).pathname
      .replace(/\/index\.html$/, '/')
      .replace(/^\/th(?=\/|$)/, '')
      .replace(/^\/|\/$/g, '');
    return routes.indexOf(path);
  }

  const { from, entry } = activation;
  const traversing = activation.navigationType === 'traverse' && from.index >= 0 && entry.index >= 0;
  const previous = traversing ? from.index : routeIndex(from.url);
  const current = traversing ? entry.index : routeIndex(entry.url);
  if (current >= 0 && previous >= 0 && current < previous) {
    root.style.setProperty('--section-direction', '-1');
  }
})();

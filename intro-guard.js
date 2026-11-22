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

  let activeCapture;
  let snapshot;
  function clearCapture() {
    root.classList.remove('section-capture', 'section-capture-from', 'section-capture-to');
    snapshot?.classList.remove('section-snapshot');
    snapshot = null;
    activeCapture = null;
  }

  function captureSection(transition, incoming) {
    clearCapture();
    activeCapture = transition;
    root.classList.add('section-capture', incoming ? 'section-capture-to' : 'section-capture-from');
    if (incoming) root.classList.add('section-bridged');

    const heading = document.querySelector('.motion-hero-copy, .route-hero, .contact-copy');
    if (heading) {
      const box = heading.getBoundingClientRect();
      const navBottom = document.querySelector('.nav')?.getBoundingClientRect().bottom ?? 0;
      // Avoid drawing a scrolled-away heading above the live sticky menu.
      if (box.height > 0 && box.top >= navBottom - 1 && box.top < window.innerHeight) {
        snapshot = heading;
        snapshot.classList.add('section-snapshot');
      }
    }

    transition.ready.catch(() => {
      if (incoming && activeCapture === transition) root.classList.remove('section-bridged');
    });
    transition.finished.then(() => {
      if (activeCapture === transition) clearCapture();
    });
  }

  if (skipIntro && !reducedMotion.matches) updateDirection(window.navigation?.activation);

  function openingIsVisible() {
    return !root.classList.contains('intro-skip') && document.querySelector('.intro-loader');
  }

  window.addEventListener('pageswap', ({ viewTransition }) => {
    if (!viewTransition) return;
    if (reducedMotion.matches || root.classList.contains('theme-switching') ||
      openingIsVisible()) {
      viewTransition.skipTransition();
      return;
    }
    captureSection(viewTransition, false);
  });

  window.addEventListener('pagereveal', ({ viewTransition }) => {
    if (!viewTransition || reducedMotion.matches || openingIsVisible()) {
      clearCapture();
      viewTransition?.skipTransition();
      return;
    }
    updateDirection(window.navigation?.activation);
    captureSection(viewTransition, true);
  });
})();

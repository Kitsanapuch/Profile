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
  if (skipIntro || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('intro-skip');
  }
})();

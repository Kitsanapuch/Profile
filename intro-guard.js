(() => {
  'use strict';
  const root = document.documentElement;
  try {
    if (localStorage.getItem('kc-engineer-theme') === 'light') {
      root.dataset.theme = 'light';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#fff3dd');
    }
  } catch (_) {
    // The default theme still works if storage is unavailable.
  }

  let skip = false;
  try {
    skip = sessionStorage.getItem('kitsanapuch-skip-intro-once') === '1';
    sessionStorage.removeItem('kitsanapuch-skip-intro-once');
  } catch (_) {
    // Storage may be unavailable; reloading still works with the CSS sequence.
  }
  const navigation = performance.getEntriesByType('navigation')[0];
  if (skip || navigation?.type === 'back_forward' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('intro-skip');
  }
})();

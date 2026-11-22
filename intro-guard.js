(() => {
  'use strict';
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
    document.documentElement.classList.add('intro-skip');
  }
})();

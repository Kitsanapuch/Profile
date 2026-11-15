(() => {
  'use strict';
  const root = document.documentElement;
  const loader = document.querySelector('.intro-loader');
  if (!loader) return;

  let seen = false;
  try {
    seen = sessionStorage.getItem('kitsanapuch-intro-seen') === '1';
    sessionStorage.setItem('kitsanapuch-intro-seen', '1');
  } catch (_) {
    // Storage can be disabled; the CSS sequence still completes on its own.
  }

  const navigation = performance.getEntriesByType('navigation')[0];
  const skip = seen || Boolean(location.hash) || navigation?.type === 'back_forward' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (skip) {
    root.classList.add('intro-skip');
    loader.remove();
    return;
  }

  window.setTimeout(() => loader.remove(), 2350);
})();

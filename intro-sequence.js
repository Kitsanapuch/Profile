(() => {
  'use strict';
  const loader = document.querySelector('.intro-loader');
  if (!loader) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotion.matches || document.documentElement.classList.contains('intro-skip')) {
    document.documentElement.classList.add('intro-skip');
    loader.remove();
    return;
  }

  const listeners = new AbortController();
  function finish() {
    if (!loader.isConnected) return;
    window.clearTimeout(fallback);
    listeners.abort();
    document.documentElement.classList.add('intro-finished');
    loader.remove();
    document.dispatchEvent(new Event('portfolio:intro-end'));
  }

  // The CSS animation normally finishes the intro. Keep the safety timer in sync with it.
  const duration = window.getComputedStyle(loader).animationDuration;
  const durationMs = Number.parseFloat(duration) * (duration.endsWith('ms') ? 1 : 1000);
  const fallback = window.setTimeout(finish, Number.isFinite(durationMs) ? durationMs + 120 : 2160);
  loader.addEventListener('animationend', (event) => {
    if (event.target === loader && event.animationName === 'intro-cover') finish();
  }, { signal: listeners.signal });
  reduceMotion.addEventListener('change', (event) => {
    if (event.matches) finish();
  }, { signal: listeners.signal });
})();

(() => {
  'use strict';

  const routeOrder = ['', 'experience', 'activities', 'projects', 'skills', 'certifications', 'papers', 'contact'];
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const navigationType = performance.getEntriesByType('navigation')[0]?.type;
  const internalEntry = root.classList.contains('intro-skip') && navigationType !== 'reload';

  function getRouteIndex(url) {
    const path = new URL(url).pathname
      .replace(/\/index\.html$/, '/')
      .replace(/^\/th(?=\/|$)/, '')
      .replace(/^\/|\/$/g, '');
    return routeOrder.indexOf(path);
  }

  function applyDirection() {
    const activation = window.navigation?.activation;
    if (!activation?.from?.url || !activation.entry?.url) return;

    const previous = activation.from;
    const current = activation.entry;
    const isTraversal = activation.navigationType === 'traverse' && previous.index >= 0 && current.index >= 0;
    const isBackward = isTraversal
      ? current.index < previous.index
      : getRouteIndex(current.url) < getRouteIndex(previous.url);

    root.style.setProperty('--section-direction', isBackward ? '-1' : '1');
  }

  function clearDirection() {
    root.style.removeProperty('--section-direction');
  }

  function startEntryMotion() {
    if (!internalEntry || reduceMotion.matches) return;
    applyDirection();
    root.classList.add('section-arriving');
  }

  document.addEventListener('animationend', ({ animationName }) => {
    if (animationName !== 'section-fallback-in') return;
    root.classList.remove('section-arriving');
    clearDirection();
  });

  window.addEventListener('pagereveal', ({ viewTransition }) => {
    if (!viewTransition) return;

    root.classList.remove('section-arriving');
    if (reduceMotion.matches) {
      viewTransition.skipTransition();
      clearDirection();
      return;
    }

    applyDirection();
    viewTransition.ready.catch(startEntryMotion);
    const clearNativeDirection = () => {
      if (!root.classList.contains('section-arriving')) clearDirection();
    };
    viewTransition.finished.then(clearNativeDirection, clearNativeDirection);
  });

  startEntryMotion();
})();

(() => {
  'use strict';

  const routeOrder = ['', 'experience', 'activities', 'projects', 'skills', 'certifications', 'papers', 'contact'];
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function getRouteIndex(url) {
    const path = new URL(url).pathname
      .replace(/\/index\.html$/, '/')
      .replace(/^\/th(?=\/|$)/, '')
      .replace(/^\/|\/$/g, '');
    return routeOrder.indexOf(path);
  }

  window.addEventListener('pagereveal', ({ viewTransition }) => {
    if (!viewTransition) return;
    if (reduceMotion.matches) {
      viewTransition.skipTransition();
      return;
    }

    const activation = window.navigation?.activation;
    if (!activation?.from?.url || !activation.entry?.url) return;
    const previous = activation.from;
    const current = activation.entry;
    const isTraversal = activation.navigationType === 'traverse' && previous.index >= 0 && current.index >= 0;
    const isBackward = isTraversal
      ? current.index < previous.index
      : getRouteIndex(current.url) < getRouteIndex(previous.url);
    root.style.setProperty('--section-direction', isBackward ? '-1' : '1');

    const clearDirection = () => root.style.removeProperty('--section-direction');
    viewTransition.finished.then(clearDirection, clearDirection);
  });
})();

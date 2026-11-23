(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.route-hero, .contact-copy');
  const loader = document.querySelector('.intro-loader');
  const root = document.documentElement;
  let introOpen = Boolean(loader);
  let heroHeight = Math.max(1, hero?.offsetHeight ?? 0);
  let depthFrame = 0;
  let dawnDepth = null;
  let lastPaint = null;
  let routeProgress = '';
  let dawnProgress = '';

  function canAnimate() {
    return !introOpen && !document.hidden && !reduced.matches;
  }

  function showsDawn() {
    return (root.dataset.themeSky ?? root.dataset.theme) === 'light';
  }

  function scheduleDepth() {
    if (!depthFrame && canAnimate() && (hero || showsDawn())) {
      depthFrame = requestAnimationFrame(updateDepth);
    }
  }

  function updateDepth(time) {
    depthFrame = 0;
    if (!canAnimate()) return;

    if (hero) {
      const progress = Math.min(1, Math.max(0, window.scrollY / heroHeight)).toFixed(3);
      if (progress !== routeProgress) {
        routeProgress = progress;
        document.body.style.setProperty('--route-scroll', routeProgress);
      }
    }

    if (!showsDawn()) return;
    const rawDepth = Math.min(1, Math.max(0, window.scrollY / Math.max(1, window.innerHeight)));
    const target = rawDepth * rawDepth * (3 - 2 * rawDepth);
    dawnDepth ??= target;
    const gap = target - dawnDepth;
    // The background settles at the same rate on 60 Hz and 120 Hz displays.
    const elapsed = lastPaint === null ? 16 : Math.min(time - lastPaint, 50);
    dawnDepth = Math.abs(gap) < .002 ? target : dawnDepth + gap * (1 - Math.exp(-elapsed / 96));
    lastPaint = dawnDepth === target ? null : time;
    const progress = dawnDepth.toFixed(4);
    if (progress !== dawnProgress) {
      dawnProgress = progress;
      document.body.style.setProperty('--dawn-depth', dawnProgress);
    }
    if (dawnDepth !== target) scheduleDepth();
  }

  function refreshDepth() {
    dawnDepth = null;
    lastPaint = null;
    cancelAnimationFrame(depthFrame);
    depthFrame = 0;
    scheduleDepth();
  }

  function measureHero() {
    heroHeight = Math.max(1, hero?.offsetHeight ?? 0);
    scheduleDepth();
  }

  window.addEventListener('scroll', scheduleDepth, { passive: true });
  window.addEventListener('resize', measureHero, { passive: true });
  document.addEventListener('visibilitychange', refreshDepth);
  document.addEventListener('portfolio:theme-intent', refreshDepth);
  if (hero && 'ResizeObserver' in window) new ResizeObserver(measureHero).observe(hero);
  reduced.addEventListener('change', () => {
    if (reduced.matches) {
      document.body.style.removeProperty('--dawn-depth');
      document.body.style.removeProperty('--route-scroll');
      dawnProgress = '';
      routeProgress = '';
    }
    refreshDepth();
  });
  if (loader) {
    document.addEventListener('portfolio:intro-end', () => {
      introOpen = false;
      refreshDepth();
    }, { once: true });
  }
  scheduleDepth();

  if (reduced.matches || !('IntersectionObserver' in window)) return;

  const sectionTargets = document.querySelectorAll('[data-scene]');
  const detailTargets = document.querySelectorAll([
    '.certificate-block', '.paper-card', '.project-card',
    '.route-skill-grid > .card', '.contact-form-panel',
  ].join(', '));

  function startScenes() {
    if (reduced.matches) return;
    const sections = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('scene-visible');
        sections.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -22px 0px' });

    sectionTargets.forEach((section) => {
      section.classList.add('scene-target');
      sections.observe(section);
    });

    const details = new IntersectionObserver((entries) => {
      const entering = entries.filter(({ isIntersecting }) => isIntersecting);
      entering.forEach(({ target }, index) => {
        target.style.setProperty('--route-item-delay', `${Math.min(index, 3) * 55}ms`);
        target.classList.add('route-item-in');
        details.unobserve(target);
      });
    }, { rootMargin: '0px 0px -12% 0px' });

    detailTargets.forEach((target) => details.observe(target));
  }

  if (loader) {
    document.addEventListener('portfolio:intro-end', startScenes, { once: true });
  } else {
    startScenes();
  }
})();

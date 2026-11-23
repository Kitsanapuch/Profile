(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.route-hero, .contact-copy');
  const sunrise = document.querySelector('.theme-sunrise');
  const loader = document.querySelector('.intro-loader');
  const root = document.documentElement;
  let introOpen = Boolean(loader);
  let heroHeight = Math.max(1, hero?.offsetHeight ?? 0);
  let viewportHeight = Math.max(1, window.innerHeight);
  let scrollPosition = window.scrollY;
  let depthFrame = 0;
  let dawnDepth = null;
  let lastPaint = null;
  let routeProgress = null;
  let dawnProgress = null;
  const clamp = (value) => Math.min(1, Math.max(0, value));

  function canAnimate() {
    return !introOpen && !document.hidden && !reduced.matches;
  }

  function showsDawn() {
    return sunrise && (root.dataset.themeSky ?? root.dataset.theme) === 'light';
  }

  function heroTarget() {
    return Math.round(clamp(scrollPosition / heroHeight) * 1000) / 1000;
  }

  function dawnTarget() {
    const depth = clamp(scrollPosition / viewportHeight);
    return depth * depth * (3 - 2 * depth);
  }

  function scheduleDepth() {
    if (depthFrame || !canAnimate()) return;
    if ((hero && heroTarget() !== routeProgress) || (showsDawn() && dawnTarget() !== dawnDepth)) {
      depthFrame = requestAnimationFrame(updateDepth);
    }
  }

  function updateDepth(time) {
    depthFrame = 0;
    if (!canAnimate()) return;

    if (hero) {
      const progress = heroTarget();
      if (progress !== routeProgress) {
        routeProgress = progress;
        hero.style.setProperty('--route-scroll', routeProgress);
      }
    }

    if (!showsDawn()) return;
    const target = dawnTarget();
    dawnDepth ??= target;
    const gap = target - dawnDepth;
    // The background settles at the same rate on 60 Hz and 120 Hz displays.
    const elapsed = lastPaint === null ? 16 : Math.min(time - lastPaint, 50);
    dawnDepth = Math.abs(gap) < .003 ? target : dawnDepth + gap * (1 - Math.exp(-elapsed / 54));
    lastPaint = dawnDepth === target ? null : time;
    const progress = Math.round(dawnDepth * 1000) / 1000;
    if (progress !== dawnProgress) {
      dawnProgress = progress;
      sunrise.style.setProperty('--dawn-depth', dawnProgress);
    }
    if (dawnDepth !== target) scheduleDepth();
  }

  function refreshDepth() {
    scrollPosition = window.scrollY;
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

  window.addEventListener('scroll', () => {
    scrollPosition = window.scrollY;
    scheduleDepth();
  }, { passive: true });
  window.addEventListener('resize', () => {
    viewportHeight = Math.max(1, window.innerHeight);
    measureHero();
  }, { passive: true });
  window.addEventListener('pageshow', refreshDepth);
  document.addEventListener('visibilitychange', refreshDepth);
  document.addEventListener('portfolio:theme-intent', refreshDepth);
  if (hero && 'ResizeObserver' in window) new ResizeObserver(measureHero).observe(hero);
  reduced.addEventListener('change', () => {
    if (reduced.matches) {
      sunrise?.style.removeProperty('--dawn-depth');
      hero?.style.removeProperty('--route-scroll');
      dawnProgress = null;
      routeProgress = null;
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

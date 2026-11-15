(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey ||
        event.altKey || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    try {
      const destination = new URL(link.href, location.href);
      if (destination.origin === location.origin && destination.pathname !== location.pathname) {
        sessionStorage.setItem('kitsanapuch-skip-intro-once', '1');
      }
    } catch (_) {
      // Navigation still works if session storage is disabled.
    }
  });
  const navStrip = document.querySelector('.nav-links');
  const activeTab = navStrip?.querySelector('[aria-current="page"]');
  if (navStrip && activeTab && navStrip.scrollWidth > navStrip.clientWidth) {
    navStrip.scrollLeft = Math.max(0, activeTab.offsetLeft - navStrip.offsetLeft -
      (navStrip.clientWidth - activeTab.clientWidth) / 2);
  }

  const hero = document.querySelector('.route-hero');
  if (hero && !reduced.matches) {
    let frame = 0;
    const updateDepth = () => {
      frame = 0;
      hero.style.setProperty('--route-scroll', String(Math.min(1, Math.max(0, window.scrollY / Math.max(1, hero.offsetHeight)))));
    };
    window.addEventListener('scroll', () => {
      if (!frame) frame = requestAnimationFrame(updateDepth);
    }, { passive: true });
    updateDepth();
  }

  const targets = [...document.querySelectorAll('[data-scene]')];
  if (!targets.length) return;
  if (reduced.matches || !('IntersectionObserver' in window)) {
    targets.forEach(node => node.classList.add('scene-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('scene-visible');
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -30px 0px', threshold: .08 });

  targets.forEach((node, index) => {
    node.classList.add('scene-target');
    if (node.classList.contains('route-summary-card')) node.style.setProperty('--scene-delay', `${Math.min(index, 3) * 70}ms`);
    observer.observe(node);
  });
})();

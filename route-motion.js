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

  const hero = document.querySelector('.route-hero, .contact-copy');
  if (hero && !reduced.matches) {
    let frame = 0;
    const updateDepth = () => {
      frame = 0;
      const progress = Math.min(1, Math.max(0, window.scrollY / Math.max(1, hero.offsetHeight)));
      document.body.style.setProperty('--route-scroll', String(progress));
    };
    window.addEventListener('scroll', () => {
      if (!frame) frame = requestAnimationFrame(updateDepth);
    }, { passive: true });
    updateDepth();
  }

  if (reduced.matches || !('IntersectionObserver' in window)) return;

  const sectionTargets = document.querySelectorAll('[data-scene]');
  const detailTargets = document.querySelectorAll([
    '.certificate-block', '.paper-card', '.project-card',
    '.route-skill-grid > .card', '.contact-form-panel',
    '.home-about-stack .mindset-step',
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

  const loader = document.querySelector('.intro-loader');
  const pageHeading = document.querySelector('.route-hero, .contact-copy');
  pageHeading?.classList.toggle('route-heading-delayed', Boolean(loader));
  pageHeading?.classList.add('route-heading-in');
  if (loader) {
    document.addEventListener('portfolio:intro-end', startScenes, { once: true });
  } else {
    startScenes();
  }
})();

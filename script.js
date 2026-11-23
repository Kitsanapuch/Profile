/* Small shared interactions for the portfolio pages. */
(() => {
  'use strict';

  const root = document.documentElement;
  const isThai = root.lang === 'th';

  function initMobileMenu() {
    const toggle = document.getElementById('burger');
    const menu = document.getElementById('mobileMenu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', String(menu.classList.toggle('open')));
    });

    menu.addEventListener('click', (event) => {
      if (!event.target.closest('a')) return;
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  }

  function initReveals() {
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -18px 0px' });

    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
    root.classList.add('motion-ready');
  }

  function initScrollControls() {
    const progress = document.querySelector('.scroll-progress');
    if (!progress) return;

    const backToTop = document.createElement('a');
    backToTop.className = 'back-top';
    backToTop.href = '#top';
    backToTop.textContent = '↑';
    backToTop.setAttribute('aria-label', isThai ? 'กลับด้านบน' : 'Back to top');
    document.body.appendChild(backToTop);

    let frame = 0;
    let scrollRange = 0;
    let lastPosition = -1;
    let topVisible = false;
    function updateScroll() {
      frame = 0;
      const y = window.scrollY;
      const ratio = scrollRange > 0 ? Math.max(0, Math.min(1, y / scrollRange)) : 0;
      const position = Math.round(ratio * 10000) / 10000;
      if (position !== lastPosition) {
        progress.style.transform = `scaleX(${position})`;
        lastPosition = position;
      }
      const showTop = y > 600;
      if (showTop !== topVisible) {
        backToTop.classList.toggle('show', showTop);
        topVisible = showTop;
      }
    }

    function scheduleScrollUpdate() {
      if (!frame) frame = requestAnimationFrame(updateScroll);
    }

    function measureScrollRange() {
      scrollRange = Math.max(0, root.scrollHeight - window.innerHeight);
      scheduleScrollUpdate();
    }

    window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
    window.addEventListener('resize', measureScrollRange, { passive: true });
    window.addEventListener('pageshow', measureScrollRange);
    if ('ResizeObserver' in window) new ResizeObserver(measureScrollRange).observe(document.body);
    else window.addEventListener('load', measureScrollRange, { once: true });
    measureScrollRange();
  }

  function initCardHighlight() {
    const enabled = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const cards = document.querySelectorAll('.sidebar .card, .project-card, .mindset-step, .terminal, .timeline > .tl-item, .contact-card');

    cards.forEach((card) => {
      card.classList.add('fx-card');
      let frame = 0;
      let point;

      function reset() {
        cancelAnimationFrame(frame);
        frame = 0;
        card.classList.remove('pointer-active');
      }

      card.addEventListener('pointermove', (event) => {
        if (!enabled.matches || event.pointerType === 'touch') return;
        point = { x: event.clientX, y: event.clientY };
        if (frame) return;

        frame = requestAnimationFrame(() => {
          frame = 0;
          const bounds = card.getBoundingClientRect();
          card.style.setProperty('--pointer-x', `${point.x - bounds.left}px`);
          card.style.setProperty('--pointer-y', `${point.y - bounds.top}px`);
          card.classList.add('pointer-active');
        });
      }, { passive: true });

      card.addEventListener('pointerleave', reset);
      card.addEventListener('pointercancel', reset);
      enabled.addEventListener('change', reset);
    });
  }

  initMobileMenu();
  initReveals();
  initScrollControls();
  initCardHighlight();
})();

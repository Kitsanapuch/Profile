(() => {
  'use strict';

  const section = document.querySelector('.route-experience #experience, .route-activities #activities');
  const timeline = section?.querySelector('.timeline');
  const items = timeline ? Array.from(timeline.querySelectorAll(':scope > .tl-item')) : [];
  if (!items.length) return;

  const motion = matchMedia('(prefers-reduced-motion: no-preference)');
  const nav = document.querySelector('.nav');
  const dots = items.map(item => item.querySelector('.tl-dot'));
  if (dots.some(dot => !dot)) return;

  let layout;
  let nextArrival = 0;
  let lastProgress = '';
  let activeIndex = -1;
  let frame = 0;
  let introComplete = !document.querySelector('.intro-loader');

  function measure(scrollY) {
    const timelineBox = timeline.getBoundingClientRect();
    const timelineTop = timelineBox.top + scrollY;
    const timelineContentTop = timelineTop + timeline.clientTop;
    const navHeight = nav?.offsetHeight ?? 0;
    const viewportHeight = window.innerHeight;
    let railLeft = 0;
    const entries = items.map((item, index) => {
      const top = timelineContentTop + item.offsetTop;
      const itemBox = item.getBoundingClientRect();
      const dotBox = dots[index].getBoundingClientRect();
      if (index === 0) railLeft = dotBox.left + dotBox.width / 2 - timelineBox.left;
      return {
        top,
        bottom: top + itemBox.height,
        // Keep the rail aligned to the layout even if the card is lifted on hover.
        center: top + (dotBox.top - itemBox.top) + dotBox.height / 2,
      };
    });
    const dotCenters = entries.map(entry => entry.center);
    const first = dotCenters[0];
    const distance = Math.max(1, dotCenters.at(-1) - first);
    layout = {
      entries, dotCenters, first, distance, navHeight,
      cursor: Math.max(navHeight + 30, viewportHeight * .62),
      arrival: viewportHeight * .88,
    };

    const rail = {
      '--experience-rail-top': `${first - timelineTop}px`,
      '--experience-rail-left': `${railLeft}px`,
      '--experience-rail-height': `${distance}px`,
    };
    for (const [property, value] of Object.entries(rail)) {
      if (timeline.style.getPropertyValue(property) !== value) {
        timeline.style.setProperty(property, value);
      }
    }
  }

  function paint() {
    frame = 0;
    if (!motion.matches || document.hidden) return;
    const scrollY = window.scrollY;
    if (!layout) measure(scrollY);

    const cursor = scrollY + layout.cursor;
    const progress = Math.min(1, Math.max(0, (cursor - layout.first) / layout.distance)).toFixed(4);
    if (progress !== lastProgress) {
      timeline.style.setProperty('--experience-progress', progress);
      lastProgress = progress;
    }

    const nextActive = layout.dotCenters.findLastIndex(center => center <= cursor);
    if (nextActive !== activeIndex) {
      items[activeIndex]?.classList.remove('experience-current');
      items[nextActive]?.classList.add('experience-current');
      activeIndex = nextActive;
    }

    const arrivalEdge = scrollY + layout.arrival;
    const navBottom = scrollY + layout.navHeight;
    while (nextArrival < items.length && layout.entries[nextArrival].top < arrivalEdge) {
      const { top, bottom } = layout.entries[nextArrival];
      if (bottom > navBottom && top > navBottom - 44) {
        items[nextArrival].classList.add('experience-arriving');
      }
      nextArrival += 1;
    }
  }

  function schedule() {
    if (introComplete && motion.matches && !document.hidden && !frame) {
      frame = requestAnimationFrame(paint);
    }
  }

  function refreshLayout() {
    layout = null;
    schedule();
  }

  function syncPreference() {
    section.classList.toggle('experience-motion', motion.matches);
    if (!motion.matches) {
      cancelAnimationFrame(frame);
      frame = 0;
      items.forEach(item => item.classList.remove('experience-arriving'));
    }
    refreshLayout();
  }

  timeline.addEventListener('animationend', (event) => {
    if (event.animationName === 'experience-entry' && event.target.classList.contains('tl-content')) {
      event.target.closest('.tl-item').classList.remove('experience-arriving');
    }
  });
  if (!introComplete) {
    document.addEventListener('portfolio:intro-end', () => {
      introComplete = true;
      refreshLayout();
    }, { once: true });
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', refreshLayout, { passive: true });
  window.addEventListener('pageshow', refreshLayout);
  document.addEventListener('visibilitychange', refreshLayout);
  motion.addEventListener('change', syncPreference);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(refreshLayout);
    const heading = document.getElementById('section-view-heading');
    [nav, heading, timeline, ...items].forEach(element => {
      if (element) observer.observe(element);
    });
  } else {
    timeline.addEventListener('load', refreshLayout, true);
  }
  document.fonts?.ready.then(refreshLayout);
  syncPreference();
})();

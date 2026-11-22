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

  const seen = new Set();
  let activeIndex = -1;
  let frame = 0;
  let introComplete = !document.querySelector('.intro-loader');

  function paint() {
    frame = 0;
    if (!motion.matches) return;

    const timelineBox = timeline.getBoundingClientRect();
    const itemBoxes = items.map(item => item.getBoundingClientRect());
    const dotBoxes = dots.map(dot => dot.getBoundingClientRect());
    const navBottom = nav?.getBoundingClientRect().bottom ?? 0;
    const cursor = Math.max(navBottom + 30, innerHeight * .62);
    const dotCenters = dotBoxes.map(dot => dot.top + dot.height / 2);
    const first = dotCenters[0];
    const distance = Math.max(1, dotCenters.at(-1) - first);
    const progress = Math.min(1, Math.max(0, (cursor - first) / distance));
    const nextActive = dotCenters.findLastIndex(center => center <= cursor);
    const arrivalEdge = innerHeight * .88;

    timeline.style.setProperty('--experience-rail-top', `${first - timelineBox.top}px`);
    timeline.style.setProperty('--experience-rail-left', `${dotBoxes[0].left + dotBoxes[0].width / 2 - timelineBox.left}px`);
    timeline.style.setProperty('--experience-rail-height', `${distance}px`);
    timeline.style.setProperty('--experience-progress', progress.toFixed(4));

    if (nextActive !== activeIndex) {
      items[activeIndex]?.classList.remove('experience-current');
      items[nextActive]?.classList.add('experience-current');
      activeIndex = nextActive;
    }

    items.forEach((item, index) => {
      const box = itemBoxes[index];
      if (seen.has(item) || box.top >= arrivalEdge) return;
      seen.add(item);
      if (box.bottom > navBottom && box.top > navBottom - 44) {
        item.classList.add('experience-arriving');
      }
    });
  }

  function schedule() {
    if (introComplete && motion.matches && !frame) frame = requestAnimationFrame(paint);
  }

  function syncPreference() {
    section.classList.toggle('experience-motion', motion.matches);
    schedule();
  }

  timeline.addEventListener('animationend', (event) => {
    if (event.animationName === 'experience-entry' && event.target.classList.contains('tl-content')) {
      event.target.closest('.tl-item').classList.remove('experience-arriving');
    }
  });
  if (!introComplete) {
    document.addEventListener('portfolio:intro-end', () => {
      introComplete = true;
      schedule();
    }, { once: true });
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);
  motion.addEventListener('change', syncPreference);
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(timeline);
  document.fonts?.ready.then(schedule);
  syncPreference();
})();

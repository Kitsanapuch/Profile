(() => {
  'use strict';

  const motion = matchMedia('(prefers-reduced-motion: no-preference)');
  const hero = document.querySelector('.motion-hero');
  const visual = document.querySelector('.studio-focus-visual');
  const viewport = visual?.querySelector('.studio-image-viewport');
  const project = !hero && visual && viewport ? visual.closest('.studio-focus') : null;
  const subject = hero || (project ? visual : null);
  if (!subject) return;

  const scene = hero || project;
  const nav = document.querySelector('.nav');
  let overlay = null;
  let showCallouts = false;
  let introOpen = Boolean(document.querySelector('.intro-loader'));
  let visible = !('IntersectionObserver' in window);
  let needsMeasurement = true;
  let scrollPosition = window.scrollY;
  let start = 0;
  let distance = 1;
  let lastDrawn = null;
  let frame = 0;

  const clamp = (value) => Math.max(0, Math.min(1, value));
  const ease = (value) => value * value * (3 - 2 * value);
  const svg = (tag) => document.createElementNS('http://www.w3.org/2000/svg', tag);

  function buildProjectOverlay() {
    const planes = ['far', 'near'].map((depth) => {
      const plane = document.createElement('span');
      plane.className = `cinema-rear-plane cinema-rear-plane--${depth}`;
      plane.setAttribute('aria-hidden', 'true');
      return plane;
    });
    visual.prepend(...planes);

    const callouts = document.createElement('div');
    callouts.className = 'cinema-callouts';
    callouts.setAttribute('aria-hidden', 'true');
    const diagram = svg('svg');
    diagram.setAttribute('viewBox', '0 0 100 100');
    diagram.setAttribute('preserveAspectRatio', 'none');
    callouts.append(diagram);

    const thai = document.documentElement.lang === 'th';
    const features = [
      { side: 'preview', label: thai ? 'มุมมองแอป' : 'App preview', x: 71, y: 25, endX: 89, endY: 15 },
      { side: 'workspace', label: thai ? 'พื้นที่ทำงาน' : 'Workspace', x: 30, y: 65, endX: 14, endY: 77 },
    ];

    for (const { side, label, x, y, endX, endY } of features) {
      const line = svg('line');
      line.setAttribute('pathLength', '1');
      line.setAttribute('x1', x);
      line.setAttribute('y1', y);
      line.setAttribute('x2', endX);
      line.setAttribute('y2', endY);

      const dot = svg('circle');
      dot.setAttribute('r', '.7');
      dot.setAttribute('cx', x);
      dot.setAttribute('cy', y);
      diagram.append(line, dot);

      const badge = document.createElement('span');
      badge.className = `cinema-callout cinema-callout--${side}`;
      badge.textContent = label;
      callouts.append(badge);
    }

    // Callouts travel with the screenshot, without measuring the transformed frame.
    viewport.append(callouts);
    return callouts;
  }

  function measureScene() {
    const box = subject.getBoundingClientRect();
    const top = box.top + scrollPosition;
    const height = window.innerHeight;
    const navHeight = nav?.offsetHeight ?? 0;

    if (hero) {
      start = top - navHeight;
      distance = Math.max(box.height * .65, 1);
    } else {
      // Start as the screen enters the viewport and arrive before it reaches the nav.
      const readingLine = Math.max(navHeight + 40, height * .36);
      start = Math.max(0, top - height * .91);
      distance = Math.max(220, height * .34, top - readingLine - start);
    }

    needsMeasurement = false;
  }

  function canAnimate() {
    return motion.matches && visible && !introOpen && !document.hidden;
  }

  function suspend() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  function scrollProgress() {
    return Math.round(ease(clamp((scrollPosition - start) / distance)) * 10000) / 10000;
  }

  function paint() {
    frame = 0;
    if (!canAnimate()) return;
    if (needsMeasurement) measureScene();

    const progress = scrollProgress();
    if (progress !== lastDrawn) {
      scene.style.setProperty('--cinema-progress', progress);
      lastDrawn = progress;
    }

    if (overlay) {
      const shouldShow = progress > .23 && progress < .89;
      if (shouldShow !== showCallouts) {
        overlay.classList.toggle('is-visible', shouldShow);
        showCallouts = shouldShow;
      }
    }
  }

  function schedule() {
    if (canAnimate() && !frame) frame = requestAnimationFrame(paint);
  }

  function refreshLayout() {
    scrollPosition = window.scrollY;
    needsMeasurement = true;
    schedule();
  }

  function refreshPreference() {
    const enabled = motion.matches;
    scene.classList.toggle('cinema-ready', enabled);
    if (project) {
      visual.classList.toggle('cinema-ready', enabled);
      if (enabled && !overlay) overlay = buildProjectOverlay();
      if (overlay) {
        overlay.hidden = !enabled;
        if (!enabled) {
          overlay.classList.remove('is-visible');
          showCallouts = false;
        }
      }
    }

    if (enabled) refreshLayout();
    else suspend();
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) refreshLayout();
      else suspend();
    }, { rootMargin: '100px' }).observe(subject);
  }

  if ('ResizeObserver' in window) {
    const sizeObserver = new ResizeObserver(refreshLayout);
    const heading = project && document.getElementById('section-view-heading');
    for (const element of new Set([subject, scene, nav, heading])) {
      if (element) sizeObserver.observe(element);
    }
  }

  if (project && 'MutationObserver' in window) {
    const syncZoom = () => visual.classList.toggle('cinema-inspecting', viewport.classList.contains('is-zoomed'));
    new MutationObserver(syncZoom).observe(viewport, { attributes: true, attributeFilter: ['class'] });
    syncZoom();
  }

  if (introOpen) {
    document.addEventListener('portfolio:intro-end', () => {
      introOpen = false;
      refreshLayout();
    }, { once: true });
  }

  motion.addEventListener('change', refreshPreference);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) suspend();
    else refreshLayout();
  });
  window.addEventListener('scroll', () => {
    scrollPosition = window.scrollY;
    if (needsMeasurement || lastDrawn !== scrollProgress()) schedule();
  }, { passive: true });
  window.addEventListener('resize', refreshLayout, { passive: true });
  window.addEventListener('pageshow', refreshLayout);
  document.fonts?.ready.then(refreshLayout);
  refreshPreference();
})();

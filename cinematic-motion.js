(() => {
  'use strict';

  const motion = matchMedia('(prefers-reduced-motion: no-preference)');
  const hero = document.querySelector('.motion-hero');
  const visual = document.querySelector('.studio-focus-visual');
  const image = document.getElementById('studio-focus-image');
  if (!hero && !visual) return;

  const clamp = (number, low = 0, high = 1) => Math.max(low, Math.min(high, number));
  const ease = (number) => number * number * (3 - 2 * number);
  const svg = (tag) => document.createElementNS('http://www.w3.org/2000/svg', tag);

  function buildProjectOverlay() {
    const viewport = visual.querySelector('.studio-image-viewport');
    const overlay = document.createElement('div');
    const diagram = svg('svg');
    const plane = document.createElement('span');
    const thai = document.documentElement.lang === 'th';
    const texts = thai ? ['มุมมองแอป', 'พื้นที่ทำงาน'] : ['App preview', 'Workspace'];

    viewport.style.position = 'relative';
    plane.className = 'cinema-rear-plane';
    plane.setAttribute('aria-hidden', 'true');
    visual.prepend(plane);
    overlay.className = 'cinema-callouts';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.append(diagram);

    const pins = texts.map((text) => {
      const anchor = document.createElement('i');
      const label = document.createElement('span');
      const line = svg('line');
      const dot = svg('circle');
      anchor.className = 'cinema-anchor';
      anchor.setAttribute('aria-hidden', 'true');
      label.className = 'cinema-callout';
      label.textContent = text;
      dot.setAttribute('r', '3');
      viewport.append(anchor);
      diagram.append(line, dot);
      overlay.append(label);
      return { anchor, label, line, dot };
    });
    visual.append(overlay);
    return { overlay, pins, viewport };
  }

  const project = visual && image ? buildProjectOverlay() : null;
  const heroValues = { current: null };
  const boardValues = { current: null };
  let frame = 0;
  let heroVisible = true;
  let projectVisible = true;

  function interpolate(state, target) {
    const diff = target - (state.current ?? target);
    state.current = Math.abs(diff) < .001 ? target : state.current + diff * .22;
    if (state.current !== target) schedule();
    return state.current;
  }

  function updateHero() {
    const box = hero.getBoundingClientRect();
    const navHeight = document.querySelector('.nav')?.offsetHeight ?? 0;
    const t = ease(interpolate(heroValues, clamp((navHeight - box.top) / Math.max(box.height * .80, 1))));
    const compact = matchMedia('(max-width: 640px)').matches;
    hero.style.setProperty('--cinema-portrait-y', `${t * (compact ? 9 : 34)}px`);
    hero.style.setProperty('--cinema-portrait-angle', `${-t * (compact ? 3 : 9)}deg`);
    hero.style.setProperty('--cinema-portrait-scale', 1 + t * .063);
    hero.style.setProperty('--cinema-terminal-y', `${-t * (compact ? 5 : 17)}px`);
    hero.style.setProperty('--cinema-note-y', `${t * 6}px`);
  }

  function alignProjectCallouts(box) {
    project.pins.forEach(({ anchor, label, line, dot }, index) => {
      const point = anchor.getBoundingClientRect();
      const px = point.left - box.left - visual.clientLeft;
      const py = point.top - box.top - visual.clientTop;
      const width = label.offsetWidth;
      const height = label.offsetHeight;
      const toRight = index === 0;
      const x = clamp(px + (toRight ? 31 : -width - 31), 7, box.width - width - 7);
      const y = clamp(py + (index === 0 ? -21 : 16), 5, box.height - height - 5);

      label.style.transform = `translate(${x}px, ${y}px)`;
      line.setAttribute('x1', px);
      line.setAttribute('y1', py);
      line.setAttribute('x2', toRight ? x : x + width);
      line.setAttribute('y2', y + height / 2);
      dot.setAttribute('cx', px);
      dot.setAttribute('cy', py);
    });
  }

  function updateProject() {
    const box = visual.getBoundingClientRect();
    const span = innerHeight * .74 + box.height;
    const target = clamp((innerHeight * .95 - box.top) / span);
    const progress = interpolate(boardValues, target);
    const separation = Math.sin(Math.PI * progress);
    const swing = 1 - ease(progress) * 2;
    const inspecting = project.viewport.classList.contains('is-zoomed');
    visual.classList.toggle('cinema-inspecting', inspecting);
    visual.style.setProperty('--cinema-depth', separation);
    visual.style.setProperty('--cinema-turn', swing * separation);
    visual.style.setProperty('--cinema-window-scale', .92 + .088 * separation);

    const showLabels = progress > .24 && progress < .76 && !inspecting;
    project.overlay.classList.toggle('is-visible', showLabels);
    if (showLabels) alignProjectCallouts(box);
  }

  function paint() {
    frame = 0;
    if (!motion.matches) return;
    if (hero && heroVisible) updateHero();
    if (project && projectVisible) updateProject();
  }

  function schedule() {
    if (motion.matches && !frame) frame = requestAnimationFrame(paint);
  }

  function refreshPreference() {
    hero?.classList.toggle('cinema-ready', motion.matches);
    if (project) {
      visual.classList.toggle('cinema-ready', motion.matches);
      project.overlay.hidden = !motion.matches;
      if (!motion.matches) project.overlay.classList.remove('is-visible');
    }
    schedule();
  }

  if ('IntersectionObserver' in window) {
    const visible = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === hero) heroVisible = entry.isIntersecting;
        if (entry.target === visual) projectVisible = entry.isIntersecting;
      }
      schedule();
    }, { rootMargin: '100px' });
    if (hero) visible.observe(hero);
    if (project) visible.observe(visual);
  }

  if (project) {
    new MutationObserver(schedule).observe(project.viewport, { attributes: true, attributeFilter: ['class'] });
    image.addEventListener('load', schedule);
    if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(visual);
  }

  motion.addEventListener('change', refreshPreference);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  document.fonts?.ready.then(schedule);
  refreshPreference();
})();

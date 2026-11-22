(() => {
  'use strict';

  const hero = document.querySelector('.atelier-hero');
  const scene = document.querySelector('.atelier-engineering');
  const stage = scene.querySelector('.atelier-stage');
  const modelFrame = scene.querySelector('.atelier-model');
  const canvas = modelFrame.querySelector('canvas');
  const chapters = [...scene.querySelectorAll('[data-chapter]')];
  const labels = [...modelFrame.querySelectorAll('[data-anchor]')];
  const leaders = [...modelFrame.querySelectorAll('.atelier-leaders g')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const model = window.AtelierModel?.create(canvas);

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const ramp = (value, start, end) => {
    const t = clamp((value - start) / (end - start));
    return t * t * (3 - 2 * t);
  };

  let rendered = 0;
  let frame = 0;
  let activeChapter = -1;
  let sceneVisible = !('IntersectionObserver' in window);
  let navHeight = 0;

  function showChapter(index, animated) {
    if (index === activeChapter) return;
    activeChapter = index;
    chapters.forEach((chapter, position) => {
      chapter.classList.toggle('is-active', position === index);
      chapter.inert = animated && position !== index;
    });
  }

  function positionCallouts(points, visible) {
    const width = modelFrame.clientWidth;
    const height = modelFrame.clientHeight;

    labels.forEach((label, index) => {
      const point = points[index];
      const leader = leaders[index];
      const west = width < 570 ? index === 1 : index !== 1;
      const labelWidth = label.offsetWidth;
      const labelHeight = label.offsetHeight;
      const offsetY = [-32, -9, 23][index];

      const x = clamp(point.x + (west ? -labelWidth - 34 : 34), 4, width - labelWidth - 4);
      const y = clamp(point.y + offsetY, 2, height - labelHeight - 2);
      label.style.transform = `translate(${x}px, ${y}px)`;

      const [line, dot] = leader.children;
      for (const [name, value] of Object.entries({
        x1: point.x, y1: point.y, x2: west ? x + labelWidth : x, y2: y + labelHeight / 2,
      })) line.setAttribute(name, value);
      dot.setAttribute('cx', point.x);
      dot.setAttribute('cy', point.y);
      label.classList.toggle('is-active', visible);
      leader.classList.toggle('is-active', visible);
    });
  }

  function draw(time) {
    if (!model) return;
    const opening = ramp(time, .13, .48);
    const closing = ramp(time, .66, .96);
    const inspect = opening * (1 - closing);
    const narrow = modelFrame.clientWidth < 540;
    const points = model.draw({
      assembly: inspect,
      angle: -.68 + time * 1.56,
      pitch: .54 + .12 * inspect + time * .1,
      zoom: (narrow ? .83 : .98) + .17 * inspect - .1 * closing,
    });
    modelFrame.classList.toggle('is-rendered', Boolean(points));
    if (points) positionCallouts(points, time > .32 && time < .70 && !reduce.matches);
  }

  function paint() {
    frame = 0;
    if (reduce.matches || !model) return;

    const heroTop = hero.getBoundingClientRect().top;
    const flight = clamp((navHeight - heroTop) / hero.offsetHeight);
    hero.style.setProperty('--fly-in', flight);
    hero.style.setProperty('--fly-out', ramp(flight, .48, .96));
    if (!sceneVisible) return;

    const remaining = scene.offsetHeight - stage.offsetHeight;
    const target = clamp((navHeight - scene.getBoundingClientRect().top) / Math.max(1, remaining));
    const delta = target - rendered;
    rendered = Math.abs(delta) < .001 ? target : rendered + delta * .18;
    scene.style.setProperty('--chapter-progress', rendered);
    showChapter(rendered < .29 ? 0 : rendered < .74 ? 1 : 2, true);
    draw(rendered);
    if (rendered !== target) schedule();
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(paint);
  }

  function reflow() {
    navHeight = document.querySelector('.nav')?.offsetHeight ?? 0;
    const canMove = Boolean(model && !reduce.matches);
    scene.classList.toggle('has-motion', canMove);
    activeChapter = -1;
    if (canMove) {
      showChapter(0, true);
    } else {
      hero.style.removeProperty('--fly-in');
      hero.style.removeProperty('--fly-out');
      showChapter(-2, false);
    }
    draw(canMove ? rendered : .22);
    schedule();
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      sceneVisible = entry.isIntersecting;
      if (sceneVisible) schedule();
    });
    observer.observe(scene);
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', reflow, { passive: true });
  reduce.addEventListener('change', reflow);
  document.fonts?.ready.then(schedule);
  reflow();
})();

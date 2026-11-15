/* Dependency-free background particles and gradient route for the local preview. */
(() => {
  'use strict';

  function initRibbon() {
    const svg = document.querySelector('svg.motion-ribbon');
    if (!svg) return;
    svg.setAttribute('viewBox', svg.getAttribute('viewBox') || '0 0 1000 720');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const ns = 'http://www.w3.org/2000/svg';
    const pathData = svg.dataset.path || 'M -100 568 C 103 583 143 312 355 371 C 511 414 534 140 715 190 C 841 225 928 146 1080 74';
    let gradient = svg.querySelector('#motion-ribbon-gradient');
    if (!gradient) {
      let defs = svg.querySelector('defs');
      if (!defs) {
        defs = document.createElementNS(ns, 'defs');
        svg.prepend(defs);
      }
      gradient = document.createElementNS(ns, 'linearGradient');
      gradient.setAttribute('id', 'motion-ribbon-gradient');
      defs.appendChild(gradient);
    }
    gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
    gradient.setAttribute('x1', '0');
    gradient.setAttribute('y1', '600');
    gradient.setAttribute('x2', '1000');
    gradient.setAttribute('y2', '90');
    gradient.replaceChildren();
    [
      ['0%', '#48e5f2'],
      ['33%', '#6c9cff'],
      ['65%', '#b77cff'],
      ['100%', '#ff9dbd']
    ].forEach(([offset, color]) => {
      const stop = document.createElementNS(ns, 'stop');
      stop.setAttribute('offset', offset);
      stop.setAttribute('stop-color', color);
      gradient.appendChild(stop);
    });
    [['motion-ribbon-base', pathData], ['motion-ribbon-flow', pathData]].forEach(([className, d]) => {
      if (svg.querySelector(`.${className}`)) return;
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('class', className);
      path.setAttribute('d', d);
      svg.appendChild(path);
    });
    const base = svg.querySelector('.motion-ribbon-base');
    const flow = svg.querySelector('.motion-ribbon-flow');
    if (!svg.querySelector('.motion-ribbon-halo')) {
      const halo = document.createElementNS(ns, 'path');
      halo.setAttribute('class', 'motion-ribbon-halo');
      halo.setAttribute('d', base.getAttribute('d'));
      svg.insertBefore(halo, base);
    }
    const length = base.getTotalLength();
    if (!svg.querySelector('.motion-ribbon-nodes')) {
      const nodes = document.createElementNS(ns, 'g');
      nodes.setAttribute('class', 'motion-ribbon-nodes');
      [.24, .52, .79].forEach((fraction) => {
        const point = base.getPointAtLength(length * fraction);
        const ring = document.createElementNS(ns, 'circle');
        ring.setAttribute('class', 'motion-ribbon-node-ring');
        ring.setAttribute('cx', point.x);
        ring.setAttribute('cy', point.y);
        ring.setAttribute('r', '7');
        const core = document.createElementNS(ns, 'circle');
        core.setAttribute('class', 'motion-ribbon-node-core');
        core.setAttribute('cx', point.x);
        core.setAttribute('cy', point.y);
        core.setAttribute('r', '2.25');
        const ticks = document.createElementNS(ns, 'path');
        ticks.setAttribute('class', 'motion-ribbon-node-tick');
        ticks.setAttribute('d', `M ${point.x - 15} ${point.y} h 5 M ${point.x + 10} ${point.y} h 5 M ${point.x} ${point.y - 15} v 5 M ${point.x} ${point.y + 10} v 5`);
        nodes.append(ticks, ring, core);
      });
      svg.appendChild(nodes);
    }
    let runner = svg.querySelector('.motion-ribbon-pin');
    let runnerGlow = svg.querySelector('.motion-ribbon-runner-glow');
    if (!runnerGlow) {
      runnerGlow = document.createElementNS(ns, 'circle');
      runnerGlow.setAttribute('class', 'motion-ribbon-runner-glow');
      runnerGlow.setAttribute('r', '14');
      svg.appendChild(runnerGlow);
    }
    if (!runner) {
      runner = document.createElementNS(ns, 'circle');
      runner.setAttribute('class', 'motion-ribbon-pin');
      runner.setAttribute('r', '3.5');
      svg.appendChild(runner);
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;
    let lastFrame = 0;
    let visible = true;
    function render(time) {
      const progress = reduced.matches ? .62 : (time % 11000) / 11000;
      const distance = length * progress;
      const point = base.getPointAtLength(distance);
      const trailStart = Math.max(0, distance - Math.min(115, length * .06));
      const trail = Array.from({ length: 9 }, (_, index) => {
        const sample = base.getPointAtLength(trailStart + (distance - trailStart) * index / 8);
        return `${index ? 'L' : 'M'} ${sample.x.toFixed(1)} ${sample.y.toFixed(1)}`;
      });
      flow.setAttribute('d', trail.join(' '));
      runner.setAttribute('cx', point.x);
      runner.setAttribute('cy', point.y);
      runnerGlow.setAttribute('cx', point.x);
      runnerGlow.setAttribute('cy', point.y);
    }
    function frame(time) {
      if (document.hidden || reduced.matches || !visible) return;
      raf = requestAnimationFrame(frame);
      if (time - lastFrame < 30) return;
      lastFrame = time;
      render(time);
    }
    function sync() {
      cancelAnimationFrame(raf);
      render(performance.now());
      if (!document.hidden && !reduced.matches && visible) raf = requestAnimationFrame(frame);
    }
    document.addEventListener('visibilitychange', sync);
    if (reduced.addEventListener) reduced.addEventListener('change', sync);
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        sync();
      }, { rootMargin: '120px' });
      observer.observe(svg.closest('.motion-hero') || svg);
    }
    sync();
  }

  function initParticles() {
    const canvas = document.getElementById('motion-particles');
    if (!canvas || !document.body.classList.contains('motion-preview')) return;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return;
    canvas.setAttribute('aria-hidden', 'true');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const saveData = Boolean(navigator.connection && navigator.connection.saveData);
    const colors = ['#83e9ff', '#9c9cff', '#d8a1ff', '#ffc2bd'];
    const sprites = colors.map((color) => {
      const sprite = document.createElement('canvas');
      sprite.width = sprite.height = 64;
      const ctx = sprite.getContext('2d');
      const glow = ctx.createRadialGradient(32, 32, 0, 32, 32, 31);
      glow.addColorStop(0, '#ffffff');
      glow.addColorStop(.045, color);
      glow.addColorStop(.18, color + '88');
      glow.addColorStop(.55, color + '18');
      glow.addColorStop(1, color + '00');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 64, 64);
      return sprite;
    });

    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles = [];
    let raf = 0;
    let lastFrame = 0;
    let scrollY = window.scrollY || 0;
    const pointer = { x: -1000, y: -1000, active: false };

    function random(seed) {
      const value = Math.sin(seed * 78.233 + 27.861) * 43758.5453;
      return value - Math.floor(value);
    }

    function configure() {
      width = window.innerWidth;
      height = window.innerHeight;
      const pixelCap = Math.max(1, Math.sqrt(4000000 / Math.max(1, width * height)));
      dpr = Math.min(window.devicePixelRatio || 1, 2, pixelCap);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const fullCount = Math.max(24, Math.min(72, Math.round(width * height / 17000)));
      const count = reduceMotion.matches || saveData ? Math.max(12, Math.round(fullCount / 2)) : fullCount;
      particles = Array.from({ length: count }, (_, index) => ({
        x: random(index + 1) * width,
        y: random(index + 87) * height,
        size: .8 + random(index + 151) * 1.65,
        speed: .06 + random(index + 211) * .19,
        wave: random(index + 307) * Math.PI * 2,
        color: Math.floor(random(index + 413) * colors.length),
        alpha: .48 + random(index + 519) * .38,
        depth: .02 + random(index + 629) * .08,
        signal: random(index + 757) > .9
      }));
      if (reduceMotion.matches || saveData) draw(0);
    }

    function draw(time) {
      context.clearRect(0, 0, width, height);
      const seconds = time / 1000;
      const active = !reduceMotion.matches && !saveData;
      const positions = [];
      for (const p of particles) {
        const driftX = active ? Math.sin(seconds * p.speed + p.wave) * (4 + p.size * 2) : 0;
        const driftY = active ? Math.cos(seconds * p.speed * .63 + p.wave) * 7 : 0;
        const parallax = active ? (scrollY * p.depth) % Math.max(height, 1) : 0;
        let x = p.x + driftX;
        let y = (p.y - parallax + driftY + height) % height;
        if (pointer.active && active) {
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 145 && distance > .01) {
            const pressure = (1 - distance / 145) * 12;
            x += dx / distance * pressure;
            y += dy / distance * pressure;
          }
        }
        const twinkle = active ? .76 + Math.sin(seconds * (1.2 + p.speed) + p.wave) * .18 : 1;
        const size = p.size * (width < 700 ? 10 : 13);
        context.globalAlpha = p.alpha * twinkle * .82;
        context.drawImage(sprites[p.color], x - size / 2, y - size / 2, size, size);
        context.globalAlpha = Math.min(1, p.alpha * twinkle + .2);
        context.fillStyle = colors[p.color];
        context.beginPath();
        context.arc(x, y, p.size * .57, 0, Math.PI * 2);
        context.fill();
        if (p.signal) {
          context.globalAlpha = .26 * twinkle;
          context.strokeStyle = colors[p.color];
          context.lineWidth = .75;
          context.beginPath();
          context.arc(x, y, 5.5 + Math.sin(seconds * 1.2 + p.wave) * .8, 0, Math.PI * 2);
          context.stroke();
        }
        if (pointer.active && Math.hypot(x - pointer.x, y - pointer.y) < 175) positions.push({ x, y, color: colors[p.color] });
      }
      if (pointer.active && active) {
        positions.slice(0, 7).forEach((p) => {
          const distance = Math.hypot(p.x - pointer.x, p.y - pointer.y);
          context.beginPath();
          context.moveTo(p.x, p.y);
          context.lineTo(pointer.x, pointer.y);
          context.lineWidth = .65;
          context.strokeStyle = p.color;
          context.globalAlpha = .12 * (1 - distance / 175);
          context.stroke();
        });
      }
      context.globalAlpha = 1;
    }

    function tick(time) {
      if (document.hidden || reduceMotion.matches || saveData) return;
      raf = requestAnimationFrame(tick);
      if (time - lastFrame < 30) return; // Cap at roughly 30 fps.
      lastFrame = time;
      draw(time);
    }

    function syncAnimation() {
      cancelAnimationFrame(raf);
      draw(performance.now());
      if (!document.hidden && !reduceMotion.matches && !saveData) raf = requestAnimationFrame(tick);
    }

    window.addEventListener('resize', () => { configure(); syncAnimation(); }, { passive: true });
    window.addEventListener('scroll', () => { scrollY = window.scrollY || 0; if (reduceMotion.matches || saveData) draw(0); }, { passive: true });
    window.addEventListener('pointermove', (event) => { pointer.x = event.clientX; pointer.y = event.clientY; pointer.active = event.pointerType !== 'touch'; }, { passive: true });
    window.addEventListener('pointerleave', () => { pointer.active = false; }, { passive: true });
    document.addEventListener('visibilitychange', syncAnimation);
    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', () => { configure(); syncAnimation(); });
    configure();
    syncAnimation();
  }

  function start() {
    initRibbon();
    initParticles();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();

/* PROOF / PROCESS: selected work controls. The original script keeps the image lightbox. */
(() => {
  const section = document.getElementById('studio-focus');
  if (!section) return;

  const tabs = Array.from(section.querySelectorAll('.studio-tab[role="tab"]'));
  const panel = document.getElementById('studio-panel');
  const image = document.getElementById('studio-focus-image');
  const viewport = section.querySelector('.studio-image-viewport');
  const count = document.getElementById('studio-focus-count');
  const category = document.getElementById('studio-focus-category');
  const name = document.getElementById('studio-focus-name');
  const description = document.getElementById('studio-focus-description');
  const caseStudy = document.getElementById('studio-focus-link');
  const windowLabel = section.querySelector('.studio-window-bar span:first-child');
  const zoom = document.getElementById('studio-zoom');
  const reset = document.getElementById('studio-reset');
  if (!tabs.length || !panel || !image || !viewport || !zoom || !reset) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isThai = document.documentElement.lang === 'th';
  const assetRoot = new URL(isThai ? '../../' : '../', document.baseURI);
  const allowedTargets = new Set(['#physics-plus-project', '#scamgraph-project', '#myschool-project']);
  function localImage(raw) {
    try {
      const url = new URL(raw, document.baseURI);
      return url.href.startsWith(assetRoot.href) && /\.(?:png|jpe?g|webp)$/i.test(url.pathname) ? url.href : null;
    } catch (_) {
      return null;
    }
  }
  let activeIndex = Math.max(0, tabs.findIndex(tab => tab.getAttribute('aria-selected') === 'true'));
  let exitTimer = 0;
  let arrivalTimer = 0;
  let panFrame = 0;
  let pointerX = 50;
  let pointerY = 50;
  let zoomed = false;

  const preloadedImages = [];
  tabs.forEach(tab => {
    const preload = new Image();
    preload.src = localImage(tab.dataset.src) || localImage(image.getAttribute('src'));
    preloadedImages.push(preload);
  });

  function setZoom(value) {
    zoomed = value;
    viewport.classList.toggle('is-zoomed', zoomed);
    viewport.style.setProperty('--studio-scale', zoomed ? '1.35' : '1');
    zoom.setAttribute('aria-pressed', String(zoomed));
    zoom.setAttribute('aria-label', isThai
      ? (zoomed ? 'ภาพขยายอยู่' : 'ขยายภาพโปรเจกต์')
      : (zoomed ? 'Image zoomed' : 'Zoom project image'));
    reset.disabled = !zoomed;
    if (!zoomed) {
      viewport.style.setProperty('--studio-origin-x', '50%');
      viewport.style.setProperty('--studio-origin-y', '50%');
    }
  }

  function updateContent(index) {
    const tab = tabs[index];
    image.src = preloadedImages[index].src;
    image.alt = tab.dataset.alt || tab.dataset.title;
    name.textContent = tab.dataset.title;
    description.textContent = tab.dataset.desc;
    category.textContent = tab.dataset.meta;
    count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(tabs.length).padStart(2, '0')}`;
    const target = tab.dataset.target;
    caseStudy.href = allowedTargets.has(target) && document.getElementById(target.slice(1)) ? target : '#projects';
    panel.setAttribute('aria-labelledby', tab.id);
    if (windowLabel) windowLabel.textContent = `SELECTED WORK / ${String(index + 1).padStart(2, '0')}`;
  }

  function activate(index, focus = false) {
    if (index < 0 || index >= tabs.length) return;
    if (focus) tabs[index].focus();
    if (index === activeIndex) return;

    activeIndex = index;
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    panel.setAttribute('aria-busy', 'true');
    setZoom(false);
    window.clearTimeout(exitTimer);
    window.clearTimeout(arrivalTimer);
    image.classList.remove('studio-changing', 'studio-arriving');

    if (reducedMotion.matches) {
      updateContent(index);
      panel.removeAttribute('aria-busy');
      return;
    }

    // A short wipe creates a readable scene change without pinning the page.
    image.classList.add('studio-changing');
    exitTimer = window.setTimeout(() => {
      updateContent(index);
      image.classList.remove('studio-changing');
      image.classList.add('studio-arriving');
      panel.removeAttribute('aria-busy');
      arrivalTimer = window.setTimeout(() => image.classList.remove('studio-arriving'), 350);
    }, 170);
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(index));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      activate(next, true);
    });
  });

  zoom.addEventListener('click', () => setZoom(true));
  reset.addEventListener('click', () => setZoom(false));
  viewport.addEventListener('pointermove', event => {
    if (!zoomed || event.pointerType === 'touch') return;
    const bounds = viewport.getBoundingClientRect();
    pointerX = Math.min(90, Math.max(10, ((event.clientX - bounds.left) / bounds.width) * 100));
    pointerY = Math.min(90, Math.max(10, ((event.clientY - bounds.top) / bounds.height) * 100));
    if (panFrame) return;
    panFrame = requestAnimationFrame(() => {
      panFrame = 0;
      viewport.style.setProperty('--studio-origin-x', `${pointerX.toFixed(1)}%`);
      viewport.style.setProperty('--studio-origin-y', `${pointerY.toFixed(1)}%`);
    });
  }, { passive: true });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && zoomed && !document.getElementById('lightbox')?.classList.contains('open')) {
      setZoom(false);
      zoom.focus();
    }
  });
  setZoom(false);

  // The case-study window briefly approaches the viewer, then recedes as the
  // section passes. It never pins the page or changes document flow.
  const scrollMotion = window.matchMedia('(min-width: 961px) and (prefers-reduced-motion: no-preference)');
  let scrollFrame = 0;
  function renderScrollScale() {
    scrollFrame = 0;
    if (!scrollMotion.matches) {
      section.style.setProperty('--studio-focus-scale', '1');
      section.classList.remove('studio-in-focus');
      return;
    }
    const rect = section.getBoundingClientRect();
    const viewCenter = window.innerHeight / 2;
    const sectionCenter = rect.top + rect.height / 2;
    const travel = Math.max(1, (window.innerHeight + rect.height) / 2);
    const proximity = Math.max(0, Math.min(1, 1 - Math.abs(sectionCenter - viewCenter) / travel));
    const eased = proximity * proximity * (3 - 2 * proximity);
    section.style.setProperty('--studio-focus-scale', (0.94 + 0.06 * eased).toFixed(3));
    section.classList.toggle('studio-in-focus', eased > 0.62);
  }
  function queueScrollScale() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(renderScrollScale);
  }
  window.addEventListener('scroll', queueScrollScale, { passive: true });
  window.addEventListener('resize', queueScrollScale);
  scrollMotion.addEventListener('change', queueScrollScale);
  queueScrollScale();
})();

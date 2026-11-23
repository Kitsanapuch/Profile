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
  let displayedIndex = activeIndex;
  let scene = null;
  let panFrame = 0;
  let pointerX = 0;
  let pointerY = 0;
  let zoomed = false;
  let activation = 0;
  const fallbackSource = localImage(image.getAttribute('src'));
  const sources = tabs.map(tab => localImage(tab.dataset.src) || fallbackSource);
  const warmed = new Map();

  // The first screenshot is already in the HTML. Fetch the other screenshots
  // only when a visitor selects or approaches their tabs.
  function readyImage(index) {
    const source = sources[index];
    if (!source) return Promise.resolve(null);
    if (image.src === source && image.complete && image.naturalWidth) return Promise.resolve(source);
    if (warmed.has(source)) return warmed.get(source).ready;

    const preload = new Image();
    const ready = new Promise(resolve => {
      preload.onload = () => {
        if (typeof preload.decode === 'function') {
          preload.decode().catch(() => {}).then(() => resolve(source));
        } else resolve(source);
      };
      preload.onerror = () => {
        warmed.delete(source);
        resolve(null);
      };
    });
    warmed.set(source, { image: preload, ready });
    preload.src = source;
    return ready;
  }

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
      cancelAnimationFrame(panFrame);
      panFrame = 0;
      viewport.style.setProperty('--studio-origin-x', '50%');
      viewport.style.setProperty('--studio-origin-y', '50%');
    }
  }

  function updateContent(index, source) {
    const tab = tabs[index];
    displayedIndex = index;
    image.src = source;
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

  function selectTab(index) {
    activeIndex = index;
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
  }

  function finishScene() {
    if (!scene) return;
    const { layer, fade, push } = scene;
    scene = null;
    layer.remove();
    fade?.cancel();
    push?.cancel();
  }

  function previousPhoto() {
    if (reducedMotion.matches || typeof image.animate !== 'function' || typeof image.decode !== 'function' ||
        !image.complete || !image.naturalWidth) return null;
    const photo = new Image();
    photo.alt = '';
    photo.src = image.currentSrc || image.src;
    return photo.decode().then(() => photo, () => null);
  }

  function showProject(index, source, previous) {
    let next;
    if (previous && !reducedMotion.matches) {
      const layer = document.createElement('div');
      layer.className = 'studio-scene-layer';
      layer.setAttribute('aria-hidden', 'true');
      // Preserve the outgoing screenshot's exact framing, even if zoomed.
      const current = getComputedStyle(image);
      previous.style.transform = current.transform;
      previous.style.transformOrigin = current.transformOrigin;
      layer.append(previous);
      viewport.append(layer);
      next = { layer };
      scene = next;
    }
    setZoom(false);
    updateContent(index, source);
    if (!next) return;

    next.done = image.decode().then(() => {
      if (scene !== next || reducedMotion.matches) return;
      const timing = { duration: 380, easing: 'cubic-bezier(.22,.7,.26,1)' };
      next.fade = next.layer.animate([{ opacity: 1 }, { opacity: 0 }], { ...timing, fill: 'forwards' });
      next.push = image.animate([{ scale: '.962' }, { scale: '1' }], timing);
      next.push.finished.catch(() => {});
      return next.fade.finished;
    }).catch(() => {}).finally(() => {
      if (scene === next) finishScene();
    });
  }

  async function activate(index, focus = false) {
    if (index < 0 || index >= tabs.length) return;
    if (focus) tabs[index].focus();
    if (index === activeIndex) return;

    selectTab(index);
    const currentActivation = ++activation;
    if (index === displayedIndex) {
      panel.removeAttribute('aria-busy');
      return;
    }

    panel.setAttribute('aria-busy', 'true');
    // Keep the current scene readable while its replacement loads. An ongoing
    // dissolve can settle in parallel, after which only the latest request wins.
    const [source] = await Promise.all([readyImage(index), scene?.done]);
    if (currentActivation !== activation) return;
    if (source) {
      const previous = await previousPhoto();
      if (currentActivation !== activation) return;
      showProject(index, source, previous);
    } else {
      selectTab(displayedIndex);
      if (document.activeElement === tabs[index]) tabs[displayedIndex].focus();
    }
    panel.removeAttribute('aria-busy');
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(index));
    if (!navigator.connection?.saveData) {
      tab.addEventListener('pointerenter', event => {
        if (index !== activeIndex && event.pointerType !== 'touch') readyImage(index);
      }, { passive: true });
      tab.addEventListener('focus', () => {
        if (index !== activeIndex) readyImage(index);
      });
    }
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

  zoom.addEventListener('click', () => {
    finishScene();
    setZoom(true);
  });
  reset.addEventListener('click', () => {
    finishScene();
    setZoom(false);
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) finishScene();
  });
  viewport.addEventListener('pointermove', event => {
    if (!zoomed || event.pointerType === 'touch') return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (panFrame) return;
    panFrame = requestAnimationFrame(() => {
      panFrame = 0;
      const bounds = viewport.getBoundingClientRect();
      const x = Math.min(90, Math.max(10, ((pointerX - bounds.left) / bounds.width) * 100));
      const y = Math.min(90, Math.max(10, ((pointerY - bounds.top) / bounds.height) * 100));
      viewport.style.setProperty('--studio-origin-x', `${x.toFixed(1)}%`);
      viewport.style.setProperty('--studio-origin-y', `${y.toFixed(1)}%`);
    });
  }, { passive: true });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && zoomed && !document.getElementById('lightbox')?.classList.contains('open')) {
      setZoom(false);
      zoom.focus();
    }
  }, true);
  setZoom(false);
})();

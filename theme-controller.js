/* Theme selection and visual transitions for both languages. */
(() => {
  'use strict';

  const isThai = document.documentElement.lang === 'th';
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  if (!themeToggle || !themeIcon) return;
  const sunrise = document.querySelector('.theme-sunrise');
  const sunriseUrl = new URL('assets/sunrise-clouds.jpg', document.currentScript.src);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const intentKey = 'kc-engineer-session-theme';
  const paletteHandoffTime = 112;
  const atmosphereDuration = 460;
  let handoffFrame;
  let paletteTimer;
  let atmosphereTimer;
  let sunriseImage;
  const moonPath = '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>';
  const sunPath = '<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>';

  function loadSunrise(priority) {
    if (!sunrise) return;
    if (sunriseImage) {
      if (priority === 'high') sunriseImage.fetchPriority = priority;
      return;
    }

    const image = new Image();
    sunriseImage = image;
    image.alt = '';
    image.fetchPriority = priority;
    image.decoding = 'async';
    image.addEventListener('error', () => {
      sunriseImage = null;
    }, { once: true });
    image.addEventListener('load', async () => {
      // Keep the warm base visible while the photo is still decoding.
      try { await image.decode?.(); } catch (_) {}
      sunrise.prepend(image);
    }, { once: true });
    image.src = sunriseUrl.href;
  }

  function applyPalette(theme) {
    if (root.dataset.theme === theme) return;
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#fff3dd' : '#090e1a');
    document.dispatchEvent(new Event('portfolio:theme-change'));
  }

  function selectTheme(theme, animate = false) {
    window.cancelAnimationFrame(handoffFrame);
    clearTimeout(paletteTimer);
    clearTimeout(atmosphereTimer);
    root.classList.toggle('theme-shifting', animate);

    const isLight = theme === 'light';
    root.dataset.themeSky = theme;
    themeIcon.innerHTML = isLight ? sunPath : moonPath;
    const toggleLabel = isThai
      ? (isLight ? 'เปลี่ยนเป็นโหมดมืด' : 'เปลี่ยนเป็นโหมดสว่าง')
      : (isLight ? 'Switch to dark mode' : 'Switch to light mode');
    themeToggle.setAttribute('aria-label', toggleLabel);
    themeToggle.title = toggleLabel;
    try { sessionStorage.setItem(intentKey, theme); } catch (_) {}
    if (isLight) loadSunrise('high');
    document.dispatchEvent(new Event('portfolio:theme-intent'));

    if (!animate) {
      applyPalette(theme);
      return;
    }

    // Keep the palette handoff relative to the first frame of the visual change.
    handoffFrame = window.requestAnimationFrame(() => {
      paletteTimer = window.setTimeout(() => applyPalette(theme), paletteHandoffTime);
      atmosphereTimer = window.setTimeout(() => root.classList.remove('theme-shifting'), atmosphereDuration);
    });
  }

  function prepareSunrise() {
    if (sunriseImage || navigator.connection?.saveData) return;
    const preload = () => loadSunrise('low');
    if ('requestIdleCallback' in window) window.requestIdleCallback(preload, { timeout: 1500 });
    else window.setTimeout(preload, 180);
  }

  selectTheme(root.dataset.theme === 'light' ? 'light' : 'dark');
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    try {
      const theme = sessionStorage.getItem(intentKey);
      if (theme === 'light' || theme === 'dark') selectTheme(theme);
    } catch (_) {}
  });
  themeToggle.addEventListener('click', () => {
    const theme = root.dataset.themeSky === 'light' ? 'dark' : 'light';
    const animate = !reducedMotion.matches && !document.hidden && !document.querySelector('.intro-loader');
    selectTheme(theme, animate);
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) selectTheme(root.dataset.themeSky);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && root.classList.contains('theme-shifting')) selectTheme(root.dataset.themeSky);
  });
  if (document.querySelector('.intro-loader')) {
    document.addEventListener('portfolio:intro-end', prepareSunrise, { once: true });
  } else {
    prepareSunrise();
  }
})();

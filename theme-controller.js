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

  function applyTheme(theme) {
    const isLight = theme === 'light';
    root.dataset.theme = theme;
    themeIcon.innerHTML = isLight ? sunPath : moonPath;
    const toggleLabel = isThai
      ? (isLight ? 'เปลี่ยนเป็นโหมดมืด' : 'เปลี่ยนเป็นโหมดสว่าง')
      : (isLight ? 'Switch to dark mode' : 'Switch to light mode');
    themeToggle.setAttribute('aria-label', toggleLabel);
    themeToggle.title = toggleLabel;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isLight ? '#fff3dd' : '#090e1a');
    try { sessionStorage.setItem('kc-engineer-session-theme', theme); } catch (_) {}
    document.dispatchEvent(new Event('portfolio:theme-change'));
    if (isLight) loadSunrise('high');
  }

  function prepareSunrise() {
    if (sunriseImage || navigator.connection?.saveData) return;
    const preload = () => loadSunrise('low');
    if ('requestIdleCallback' in window) window.requestIdleCallback(preload, { timeout: 1500 });
    else window.setTimeout(preload, 180);
  }

  applyTheme(root.dataset.theme === 'light' ? 'light' : 'dark');
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    try {
      const theme = sessionStorage.getItem('kc-engineer-session-theme');
      if ((theme === 'light' || theme === 'dark') && root.dataset.theme !== theme) applyTheme(theme);
    } catch (_) {}
  });
  themeToggle.addEventListener('click', () => {
    applyTheme(root.dataset.theme === 'light' ? 'dark' : 'light');
  });
  if (document.querySelector('.intro-loader')) {
    document.addEventListener('portfolio:intro-end', prepareSunrise, { once: true });
  } else {
    prepareSunrise();
  }
})();

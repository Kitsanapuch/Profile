/* Theme selection and visual transitions for both languages. */
(() => {
  'use strict';

  const isThai = document.documentElement.lang === 'th';
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  if (!themeToggle || !themeIcon) return;
  const moonPath = '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>';
  const sunPath = '<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>';
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
  }

  const themeDirectory = new URL('.', document.currentScript.src);
  const themeBackgrounds = {
    light: 'assets/sunrise-clouds.jpg',
    dark: 'assets/cinematic-clouds.jpg',
  };
  const backdropLoads = new Map();
  const reducedThemeMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let switchingTheme = false;

  function otherTheme() {
    return root.dataset.theme === 'dark' ? 'light' : 'dark';
  }

  function warmBackdrop(theme) {
    if (!backdropLoads.has(theme)) {
      const image = new Image();
      image.src = new URL(themeBackgrounds[theme], themeDirectory).href;
      backdropLoads.set(theme, typeof image.decode === 'function' ? image.decode().catch(() => {}) : Promise.resolve());
    }
    return backdropLoads.get(theme);
  }

  async function revealWithGlow(theme) {
    if (typeof themeToggle.animate !== 'function') {
      applyTheme(theme);
      return;
    }

    const glow = document.createElement('span');
    glow.className = `theme-switch-glow theme-switch-glow--${theme}`;
    glow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glow);
    try {
      await glow.animate([{ opacity: 0 }, { opacity: .94 }], {
        duration: 135,
        easing: 'ease-out',
        fill: 'both',
      }).finished;
      applyTheme(theme);
      await glow.animate([{ opacity: .94 }, { opacity: 0 }], {
        duration: 320,
        easing: 'cubic-bezier(.23,.7,.26,1)',
        fill: 'both',
      }).finished;
    } finally {
      glow.remove();
    }
  }

  async function switchTheme() {
    if (switchingTheme) return;
    const theme = otherTheme();
    if (reducedThemeMotion.matches) {
      applyTheme(theme);
      return;
    }

    switchingTheme = true;
    themeToggle.setAttribute('aria-busy', 'true');
    try {
      await Promise.race([
        warmBackdrop(theme),
        new Promise(resolve => window.setTimeout(resolve, 150)),
      ]);
      if (reducedThemeMotion.matches) {
        applyTheme(theme);
        return;
      }

      const width = window.innerWidth;
      const height = window.innerHeight;
      const x = width * (theme === 'light' ? .74 : .25);
      const y = height * (theme === 'light' ? .66 : .28);
      const outer = Math.hypot(Math.max(x, width - x), Math.max(y, height - y)) + 90;
      root.style.setProperty('--theme-center-x', `${x}px`);
      root.style.setProperty('--theme-center-y', `${y}px`);
      root.style.setProperty('--theme-reveal-limit', `${outer}px`);
      root.dataset.themeTarget = theme;

      if (typeof document.startViewTransition === 'function') {
        root.classList.add('theme-switching');
        root.classList.toggle('theme-switch-feathered', typeof window.CSS?.registerProperty === 'function');
        const transition = document.startViewTransition(() => applyTheme(theme));
        // A hidden or resizing page can skip the snapshot animation.
        transition.ready.catch(() => {});
        await transition.finished;
      } else {
        await revealWithGlow(theme);
      }
    } catch (_) {
      if (root.dataset.theme !== theme) applyTheme(theme);
    } finally {
      delete root.dataset.themeTarget;
      root.classList.remove('theme-switching', 'theme-switch-feathered');
      for (const variable of ['--theme-center-x', '--theme-center-y', '--theme-reveal-limit']) {
        root.style.removeProperty(variable);
      }
      themeToggle.removeAttribute('aria-busy');
      switchingTheme = false;
    }
  }

  applyTheme(root.dataset.theme === 'light' ? 'light' : 'dark');
  themeToggle.addEventListener('click', switchTheme);
  for (const eventName of ['pointerenter', 'focus']) {
    themeToggle.addEventListener(eventName, () => {
      if (!reducedThemeMotion.matches && !navigator.connection?.saveData) warmBackdrop(otherTheme());
    });
  }

})();

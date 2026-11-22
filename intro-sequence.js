(() => {
  'use strict';
  const loader = document.querySelector('.intro-loader');
  if (!loader) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotion.matches || document.documentElement.classList.contains('intro-skip')) {
    document.documentElement.classList.add('intro-skip');
    loader.remove();
    return;
  }

  // A fresh navigation or reload always replays the opening. No stored "seen" state.
  const identity = loader.querySelector('.intro-sequence-identity');
  if (identity) identity.textContent = 'KITSANAPUCH / SYSTEM';
  const status = loader.querySelector('.intro-window-foot > span:first-child');
  if (status) status.textContent = 'BUILDING INTERFACE';
  const body = loader.querySelector('.intro-window-body');
  if (body) {
    const line = document.createElement('div');
    line.className = 'intro-typed-line';
    const number = document.createElement('span');
    number.className = 'intro-line-number';
    number.textContent = '01';
    const prompt = document.createElement('span');
    prompt.className = 'intro-command-prompt';
    prompt.textContent = '$';
    const typed = document.createElement('span');
    typed.className = 'intro-command-text';
    typed.textContent = 'render.kitsanapuch()';
    const caret = document.createElement('span');
    caret.className = 'intro-command-caret';
    caret.setAttribute('aria-hidden', 'true');
    line.append(number, prompt, typed, caret);
    body.replaceChildren(line);
  }

  function finish() {
    if (!loader.isConnected) return;
    window.clearTimeout(fallback);
    document.documentElement.classList.add('intro-finished');
    loader.remove();
    document.dispatchEvent(new Event('portfolio:intro-end'));
  }

  // The CSS animation normally finishes the intro. Keep the safety timer in sync with it.
  const duration = window.getComputedStyle(loader).animationDuration;
  const durationMs = Number.parseFloat(duration) * (duration.endsWith('ms') ? 1 : 1000);
  const fallback = window.setTimeout(finish, Number.isFinite(durationMs) ? durationMs + 100 : 1440);
  loader.addEventListener('animationend', (event) => {
    if (event.target === loader && event.animationName === 'intro-cover') finish();
  });
  reduceMotion.addEventListener('change', (event) => {
    if (event.matches) finish();
  }, { once: true });
})();

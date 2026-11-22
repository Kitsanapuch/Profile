/* Grouped photo viewer for the portrait, projects, activities, and certificates. */
(() => {
  'use strict';

  const lightbox = document.getElementById('lightbox');
  const image = document.getElementById('lightboxImg');
  const closeButton = document.getElementById('lightboxClose');
  if (!lightbox || !image || !closeButton) return;

  const isThai = document.documentElement.lang === 'th';
  const previousButton = document.createElement('button');
  const nextButton = document.createElement('button');
  const caption = document.createElement('div');

  previousButton.className = 'gallery-arrow gallery-prev';
  previousButton.type = 'button';
  previousButton.textContent = '‹';
  previousButton.setAttribute('aria-label', isThai ? 'ภาพก่อนหน้า' : 'Previous photo');

  nextButton.className = 'gallery-arrow gallery-next';
  nextButton.type = 'button';
  nextButton.textContent = '›';
  nextButton.setAttribute('aria-label', isThai ? 'ภาพถัดไป' : 'Next photo');

  caption.className = 'gallery-caption';
  caption.id = 'galleryCaption';
  caption.setAttribute('aria-live', 'polite');
  caption.setAttribute('aria-atomic', 'true');
  lightbox.setAttribute('aria-describedby', caption.id);
  lightbox.append(previousButton, nextButton, caption);

  let previousFocus;
  let previousOverflow = '';
  let images = [];
  let currentIndex = 0;
  let touchStart = null;

  function render() {
    const current = images[currentIndex];
    const description = current.alt || (isThai ? 'ภาพ' : 'Photo');
    image.src = current.dataset.fullSrc || current.currentSrc || current.src;
    image.alt = current.alt;
    caption.textContent = `${currentIndex + 1} / ${images.length} — ${description}`;
    previousButton.hidden = nextButton.hidden = images.length < 2;
  }

  function move(step) {
    if (images.length < 2) return;
    currentIndex = (currentIndex + step + images.length) % images.length;
    render();
  }

  function open(source) {
    previousFocus = document.activeElement;
    previousOverflow = document.body.style.overflow;
    const group = source.closest('.project-card, #activities .tl-item');
    images = group ? [...group.querySelectorAll('img.zoomable')] : [source];
    currentIndex = images.indexOf(source);
    render();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    closeButton.focus();
  }

  function close() {
    if (!lightbox.classList.contains('open')) return;
    lightbox.classList.remove('open');
    document.body.style.overflow = previousOverflow;
    touchStart = null;
    previousFocus?.focus();
  }

  function handleKey(event) {
    if (!lightbox.classList.contains('open')) return;

    if (event.key === 'Escape') {
      close();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      move(event.key === 'ArrowRight' ? 1 : -1);
    } else if (event.key === 'Tab') {
      const controls = [closeButton, previousButton, nextButton].filter(button => !button.hidden);
      const current = controls.indexOf(document.activeElement);
      const step = event.shiftKey ? -1 : 1;
      const next = current === -1
        ? (event.shiftKey ? controls.length - 1 : 0)
        : (current + step + controls.length) % controls.length;
      event.preventDefault();
      controls[next].focus();
    }
  }

  document.querySelectorAll('img.zoomable').forEach((source) => {
    source.addEventListener('click', () => open(source));
    source.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open(source);
      }
    });
  });

  previousButton.addEventListener('click', () => move(-1));
  nextButton.addEventListener('click', () => move(1));
  closeButton.addEventListener('click', close);
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) close();
  });
  document.addEventListener('keydown', handleKey);

  image.addEventListener('touchstart', (event) => {
    const touch = event.touches[0];
    touchStart = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null;
  }, { passive: true });

  image.addEventListener('touchmove', (event) => {
    if (event.touches.length !== 1) touchStart = null;
  }, { passive: true });

  image.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });

  image.addEventListener('touchend', (event) => {
    if (!touchStart || !event.changedTouches.length) return;
    const touch = event.changedTouches[0];
    const horizontal = touch.clientX - touchStart.x;
    const vertical = touch.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(horizontal) > 45 && Math.abs(horizontal) > Math.abs(vertical) * 1.3) {
      move(horizontal < 0 ? 1 : -1);
    }
  }, { passive: true });
})();

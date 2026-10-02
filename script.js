
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const moonPath = '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>';
  const sunPath = '<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>';
  function applyTheme(t){
    root.setAttribute('data-theme', t);
    themeIcon.innerHTML = t === 'dark' ? moonPath : sunPath;
    try { localStorage.setItem('kc-engineer-theme', t); } catch (_) {}
  }
  let savedTheme='dark'; try { savedTheme=localStorage.getItem('kc-engineer-theme') || 'dark'; } catch (_) {} applyTheme(savedTheme);
  themeToggle.addEventListener('click', () => {
    applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');
  burger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }));

  const sectionIds = ['home','about','education','experience','activities','projects','skills','contact'];
  const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);
  const navLinks = document.querySelectorAll('.nav-links a');
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id));
      }
    });
  }, {rootMargin: '-40% 0px -50% 0px'});
  sections.forEach(s => navObserver.observe(s));

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('is-visible'); io.unobserve(e.target); } });
  }, {threshold:0.08});
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Each project or activity owns its own gallery.
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  const galleryPrev = document.createElement('button');
  const galleryNext = document.createElement('button');
  const galleryCaption = document.createElement('div');
  galleryPrev.className = 'gallery-arrow gallery-prev';
  galleryNext.className = 'gallery-arrow gallery-next';
  galleryPrev.type = galleryNext.type = 'button';
  galleryPrev.textContent = '‹'; galleryNext.textContent = '›';
  galleryPrev.setAttribute('aria-label', 'Previous photo in this project or activity');
  galleryNext.setAttribute('aria-label', 'Next photo in this project or activity');
  galleryCaption.className = 'gallery-caption';
  galleryCaption.id = 'galleryCaption';
  galleryCaption.setAttribute('aria-live', 'polite');
  galleryCaption.setAttribute('aria-atomic', 'true');
  lightbox.setAttribute('aria-describedby', galleryCaption.id);
  lightbox.append(galleryPrev, galleryNext, galleryCaption);
  let previousFocus, galleryImages = [], galleryIndex = 0, previousOverflow = '', touchStart = null;
  function imagesFor(img){
    const group = img.closest('.project-card, #activities .tl-item');
    return group ? Array.from(group.querySelectorAll('img.zoomable')) : [img];
  }
  function renderGallery(){
    const img = galleryImages[galleryIndex];
    lightboxImg.src = img.currentSrc || img.src;
    lightboxImg.alt = img.alt || '';
    galleryCaption.textContent = `${galleryIndex + 1} / ${galleryImages.length} — ${img.alt || 'Photo'}`;
    galleryPrev.hidden = galleryNext.hidden = galleryImages.length < 2;
  }
  function moveGallery(step){
    if (!lightbox.classList.contains('open') || galleryImages.length < 2) return;
    galleryIndex = (galleryIndex + step + galleryImages.length) % galleryImages.length;
    renderGallery();
  }
  function openLightbox(img){
    previousFocus = document.activeElement;
    previousOverflow = document.body.style.overflow;
    galleryImages = imagesFor(img);
    galleryIndex = galleryImages.indexOf(img);
    renderGallery();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    lightboxClose.focus();
  }
  function closeLightbox(){
    if (!lightbox.classList.contains('open')) return;
    lightbox.classList.remove('open');
    document.body.style.overflow = previousOverflow;
    touchStart = null;
    previousFocus?.focus();
  }
  document.querySelectorAll('img.zoomable').forEach(img => {
    img.addEventListener('click', () => openLightbox(img));
    img.addEventListener('keydown', e => {
      if(e.key === 'Enter' || e.key === ' '){e.preventDefault(); openLightbox(img);}
    });
  });
  galleryPrev.addEventListener('click', () => moveGallery(-1));
  galleryNext.addEventListener('click', () => moveGallery(1));
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => {if(e.target === lightbox) closeLightbox();});
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault(); moveGallery(e.key === 'ArrowRight' ? 1 : -1);
    }
    if (e.key === 'Tab') {
      const controls = [lightboxClose, galleryPrev, galleryNext].filter(el => !el.hidden);
      const index = controls.indexOf(document.activeElement);
      e.preventDefault();
      controls[(index + (e.shiftKey ? -1 : 1) + controls.length) % controls.length].focus();
    }
  });
  lightboxImg.addEventListener('touchstart', e => {
    touchStart = e.touches.length === 1 ? {x:e.touches[0].clientX, y:e.touches[0].clientY} : null;
  }, {passive:true});
  lightboxImg.addEventListener('touchmove', e => {if(e.touches.length !== 1) touchStart = null;}, {passive:true});
  lightboxImg.addEventListener('touchcancel', () => {touchStart = null;}, {passive:true});
  lightboxImg.addEventListener('touchend', e => {
    if (!touchStart || !e.changedTouches.length) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) moveGallery(dx < 0 ? 1 : -1);
  }, {passive:true});

document.documentElement.classList.add('motion-ready');
const progress=document.querySelector('.scroll-progress');
const topLink=document.createElement('a');topLink.className='back-top';topLink.href='#home';topLink.setAttribute('aria-label','Back to top');topLink.textContent='↑';document.body.append(topLink);
let lastY=window.scrollY, queued=false;
function updateScroll(){const y=window.scrollY,total=document.documentElement.scrollHeight-window.innerHeight;progress.style.transform='scaleX('+(total>0?y/total:0)+')';document.querySelector('.nav').classList.toggle('nav-hidden',y>lastY&&y>400&&!mobileMenu.classList.contains('open'));topLink.classList.toggle('show',y>600);lastY=y;queued=false;}
window.addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(updateScroll);}},{passive:true});updateScroll();


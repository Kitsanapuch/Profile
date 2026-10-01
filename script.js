
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

  // lightbox: click any photo to view it full-size
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  let previousFocus;
  function openLightbox(img){
 previousFocus=document.activeElement;
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt || '';
    lightbox.classList.add('open'); lightboxClose.focus();
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox(){
    if(!lightbox.classList.contains('open')) return; lightbox.classList.remove('open'); previousFocus?.focus();
    document.body.style.overflow = '';
  }
  document.querySelectorAll('img.zoomable').forEach(img => {
    img.addEventListener('click', () => openLightbox(img));
    img.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openLightbox(img); }
    });
  });
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if(e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeLightbox(); });

document.documentElement.classList.add('motion-ready');
const progress=document.querySelector('.scroll-progress');
const topLink=document.createElement('a');topLink.className='back-top';topLink.href='#home';topLink.setAttribute('aria-label','Back to top');topLink.textContent='↑';document.body.append(topLink);
let lastY=window.scrollY, queued=false;
function updateScroll(){const y=window.scrollY,total=document.documentElement.scrollHeight-window.innerHeight;progress.style.transform='scaleX('+(total>0?y/total:0)+')';document.querySelector('.nav').classList.toggle('nav-hidden',y>lastY&&y>400&&!mobileMenu.classList.contains('open'));topLink.classList.toggle('show',y>600);lastY=y;queued=false;}
window.addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(updateScroll);}},{passive:true});updateScroll();
lightbox.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();lightboxClose.focus();}});
